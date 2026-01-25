import { NextRequest, NextResponse } from "next/server"
import { eq, sql, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { contractTransactions, userLpPositions, indexerState } from "@/lib/db/schema"
import { STACKS_INDEX_CONTRACT } from "@/lib/stacks/contract"

export const revalidate = 0
export const maxDuration = 60

// Contracts to index
const CONTRACTS_TO_INDEX = [
  STACKS_INDEX_CONTRACT.fullName, // stacks-index-oneclick contract
]

const LIMIT = 50
const HIRO_API_BASE = "https://api.mainnet.hiro.so"

// Strategy name mapping
const STRATEGY_NAMES: Record<string, string> = {
  "invest-bitcoin-maxi": "Bitcoin Maxi",
  "invest-meme-hunter": "Meme Hunter",
  "invest-defi-yield": "DeFi Yield",
  "invest-stacks-believer": "Stacks Believer",
  "sell-portfolio": "Sell Portfolio",
}

// Get Hiro API headers
function getHiroHeaders(): HeadersInit {
  const apiKey = process.env.HIRO_API_KEY || ""
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(apiKey && { "x-hiro-api-key": apiKey }),
  }
}

// Parse uint from Clarity repr
function parseUintRepr(value?: string | null): bigint | null {
  if (!value) return null
  const match = value.match(/u(\d+)/i)
  if (!match) return null
  try {
    return BigInt(match[1])
  } catch {
    return null
  }
}

// Parse tx_result.repr to extract invest amount
function parseInvestResult(repr: string): bigint | null {
  const match = repr.match(/\(invested u(\d+)\)/)
  if (match) {
    return BigInt(match[1])
  }
  return null
}

// Parse tx_result.repr to extract sell info
function parseSellResult(repr: string): { amount: bigint | null; tokens: Record<string, string> } {
  const result: { amount: bigint | null; tokens: Record<string, string> } = {
    amount: null,
    tokens: {},
  }

  const totalMatch = repr.match(/total-usdcx-received u(\d+)/)
  if (totalMatch) {
    result.amount = BigInt(totalMatch[1])
  }

  const tokenMatches = Array.from(repr.matchAll(/sold-(\w+) u(\d+)/g))
  for (const match of tokenMatches) {
    const tokenName = match[1].toUpperCase()
    const amount = match[2]
    if (BigInt(amount) > 0) {
      result.tokens[tokenName] = amount
    }
  }

  return result
}

// Parse add-liquidity event from contract_log
function parseAddLiquidityEvent(events: any[]): {
  poolName: string | null
  poolContract: string | null
  xToken: string | null
  yToken: string | null
  xAmount: bigint | null
  yAmount: bigint | null
  lpTokens: bigint | null
} | null {
  for (const event of events) {
    if (event.event_type === "smart_contract_log" && event.contract_log) {
      const repr = event.contract_log.value?.repr || ""
      if (repr.includes('"add-liquidity"')) {
        // Parse the tuple
        const poolNameMatch = repr.match(/\(pool-name "([^"]+)"\)/)
        const poolContractMatch = repr.match(/\(pool-contract '([^)]+)\)/)
        const xTokenMatch = repr.match(/\(x-token '([^)]+)\)/)
        const yTokenMatch = repr.match(/\(y-token '([^)]+)\)/)
        const xAmountMatch = repr.match(/\(x-amount u(\d+)\)/)
        const yAmountMatch = repr.match(/\(y-amount u(\d+)\)/)
        const dlpMatch = repr.match(/\(dlp u(\d+)\)/)

        return {
          poolName: poolNameMatch ? poolNameMatch[1] : null,
          poolContract: poolContractMatch ? poolContractMatch[1] : null,
          xToken: xTokenMatch ? xTokenMatch[1] : null,
          yToken: yTokenMatch ? yTokenMatch[1] : null,
          xAmount: xAmountMatch ? BigInt(xAmountMatch[1]) : null,
          yAmount: yAmountMatch ? BigInt(yAmountMatch[1]) : null,
          lpTokens: dlpMatch ? BigInt(dlpMatch[1]) : null,
        }
      }
    }
  }
  return null
}

// Parse LP token mint event
function parseLpTokenMint(events: any[], userAddress: string): {
  poolContract: string
  amount: bigint
} | null {
  for (const event of events) {
    if (
      event.event_type === "fungible_token_asset" &&
      event.asset?.asset_event_type === "mint" &&
      event.asset?.recipient === userAddress
    ) {
      const assetId = event.asset.asset_id || ""
      // Format: SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-stx-v-1-1::pool-token
      const [poolContract] = assetId.split("::")
      if (poolContract && event.asset.amount) {
        return {
          poolContract,
          amount: BigInt(event.asset.amount),
        }
      }
    }
  }
  return null
}

// Parse LP token burn event
function parseLpTokenBurn(events: any[], userAddress: string): {
  poolContract: string
  amount: bigint
} | null {
  for (const event of events) {
    if (
      event.event_type === "fungible_token_asset" &&
      event.asset?.asset_event_type === "burn" &&
      event.asset?.sender === userAddress
    ) {
      const assetId = event.asset.asset_id || ""
      const [poolContract] = assetId.split("::")
      if (poolContract && event.asset.amount) {
        return {
          poolContract,
          amount: BigInt(event.asset.amount),
        }
      }
    }
  }
  return null
}

// Get token symbol from contract
function getTokenSymbol(contractId: string): string {
  if (contractId.includes("sbtc-token")) return "sBTC"
  if (contractId.includes("token-stx")) return "STX"
  if (contractId.includes("ststx-token")) return "stSTX"
  if (contractId.includes("welshcorgicoin")) return "WELSH"
  if (contractId.includes("leo-token")) return "LEO"
  if (contractId.includes("pontis-bridge-DOG")) return "DOG"
  if (contractId.includes("token-susdc")) return "USDCx"
  return contractId.split(".").pop() || "UNKNOWN"
}

export async function GET(req: NextRequest) {
  // Verify cron secret in production
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
  }

  const stats = {
    transactionsIndexed: 0,
    lpPositionsUpdated: 0,
    pagesFetched: 0,
    errors: [] as string[],
  }

  try {
    for (const contractPrincipal of CONTRACTS_TO_INDEX) {
      let offset = 0
      let hasMore = true

      while (hasMore) {
        const url = `${HIRO_API_BASE}/extended/v2/addresses/${contractPrincipal}/transactions?limit=${LIMIT}&offset=${offset}`

        const res = await fetch(url, {
          headers: getHiroHeaders(),
          next: { revalidate: 0 },
        })

        if (!res.ok) {
          stats.errors.push(`Failed to fetch from ${contractPrincipal}: ${res.status}`)
          break
        }

        const data = await res.json()
        const results = data.results || []
        stats.pagesFetched += 1

        if (results.length === 0) {
          hasMore = false
          break
        }

        for (const item of results) {
          const tx = item.tx
          if (!tx) continue

          // Only process contract_call transactions
          if (tx.tx_type !== "contract_call") continue

          // Check if already indexed
          const existingTx = await db
            .select({ txId: contractTransactions.txId })
            .from(contractTransactions)
            .where(eq(contractTransactions.txId, tx.tx_id))
            .limit(1)

          if (existingTx.length > 0) {
            // Already indexed, skip
            continue
          }

          const functionName = tx.contract_call?.function_name || ""
          const senderAddress = tx.sender_address || ""
          const txStatus = tx.tx_status || "pending"
          const blockTime = tx.block_time_iso ? new Date(tx.block_time_iso) : null

          // Determine transaction type
          let txType = "other"
          if (functionName.startsWith("invest-")) txType = "invest"
          else if (functionName === "sell-portfolio") txType = "sell"
          else if (functionName === "add-liquidity") txType = "add-liquidity"
          else if (functionName === "remove-liquidity") txType = "remove-liquidity"

          // Parse transaction-specific data
          let investedAmount: bigint | null = null
          let receivedAmount: bigint | null = null
          let soldTokens: Record<string, string> | null = null
          let strategyName: string | null = null
          let poolId: string | null = null
          let poolName: string | null = null
          let xTokenSymbol: string | null = null
          let yTokenSymbol: string | null = null
          let xAmount: bigint | null = null
          let yAmount: bigint | null = null
          let lpTokensReceived: bigint | null = null
          let errorCode: number | null = null

          const txResultRepr = tx.tx_result?.repr || ""

          if (txStatus === "success") {
            if (txType === "invest") {
              investedAmount = parseInvestResult(txResultRepr)
              strategyName = STRATEGY_NAMES[functionName] || functionName
            } else if (txType === "sell") {
              const sellResult = parseSellResult(txResultRepr)
              receivedAmount = sellResult.amount
              soldTokens = Object.keys(sellResult.tokens).length > 0 ? sellResult.tokens : null
              strategyName = "Sell Portfolio"
            } else if (txType === "add-liquidity" && tx.events) {
              const lpEvent = parseAddLiquidityEvent(tx.events)
              if (lpEvent) {
                poolName = lpEvent.poolName
                poolId = lpEvent.poolContract
                xTokenSymbol = lpEvent.xToken ? getTokenSymbol(lpEvent.xToken) : null
                yTokenSymbol = lpEvent.yToken ? getTokenSymbol(lpEvent.yToken) : null
                xAmount = lpEvent.xAmount
                yAmount = lpEvent.yAmount
                lpTokensReceived = lpEvent.lpTokens
              }

              // Also parse the mint event for LP tokens
              const mintEvent = parseLpTokenMint(tx.events, senderAddress)
              if (mintEvent && !lpTokensReceived) {
                lpTokensReceived = mintEvent.amount
                poolId = poolId || mintEvent.poolContract
              }

              // Update user LP position
              if (mintEvent && lpTokensReceived) {
                await db
                  .insert(userLpPositions)
                  .values({
                    userAddress: senderAddress,
                    poolContract: mintEvent.poolContract,
                    poolName: poolName,
                    lpTokenBalance: lpTokensReceived,
                    lastXAmount: xAmount,
                    lastYAmount: yAmount,
                    xTokenSymbol: xTokenSymbol,
                    yTokenSymbol: yTokenSymbol,
                    lastTxId: tx.tx_id,
                    lastUpdatedBlock: tx.block_height,
                  })
                  .onConflictDoUpdate({
                    target: [userLpPositions.userAddress, userLpPositions.poolContract],
                    set: {
                      lpTokenBalance: sql`${userLpPositions.lpTokenBalance} + ${lpTokensReceived}`,
                      poolName: poolName,
                      lastXAmount: xAmount,
                      lastYAmount: yAmount,
                      xTokenSymbol: xTokenSymbol,
                      yTokenSymbol: yTokenSymbol,
                      lastTxId: tx.tx_id,
                      lastUpdatedBlock: tx.block_height,
                      updatedAt: sql`CURRENT_TIMESTAMP`,
                    },
                  })

                stats.lpPositionsUpdated += 1
              }
            } else if (txType === "remove-liquidity" && tx.events) {
              // Handle remove-liquidity
              const burnEvent = parseLpTokenBurn(tx.events, senderAddress)
              if (burnEvent) {
                // Update user LP position (subtract burned tokens)
                await db
                  .update(userLpPositions)
                  .set({
                    lpTokenBalance: sql`GREATEST(${userLpPositions.lpTokenBalance} - ${burnEvent.amount}, 0)`,
                    lastTxId: tx.tx_id,
                    lastUpdatedBlock: tx.block_height,
                    updatedAt: sql`CURRENT_TIMESTAMP`,
                  })
                  .where(
                    sql`${userLpPositions.userAddress} = ${senderAddress} AND ${userLpPositions.poolContract} = ${burnEvent.poolContract}`
                  )

                stats.lpPositionsUpdated += 1
              }
            }
          } else {
            // Parse error code for failed transactions
            const errorMatch = txResultRepr.match(/\(err u(\d+)\)/)
            if (errorMatch) {
              errorCode = parseInt(errorMatch[1], 10)
            }
          }

          // Insert transaction record
          await db.insert(contractTransactions).values({
            txId: tx.tx_id,
            functionName,
            senderAddress,
            txStatus,
            blockHeight: tx.block_height,
            blockTime,
            feeRate: tx.fee_rate,
            txResult: txResultRepr,
            txType,
            strategyName,
            investedAmount,
            receivedAmount,
            soldTokens,
            poolId,
            poolName,
            xTokenSymbol,
            yTokenSymbol,
            xAmount,
            yAmount,
            lpTokensReceived,
            errorCode,
            rawTx: tx,
          })

          stats.transactionsIndexed += 1
        }

        offset += results.length
        if (results.length < LIMIT) {
          hasMore = false
        }
      }
    }

    // Update indexer state
    await db
      .insert(indexerState)
      .values({
        id: "stacks-index",
        totalTransactionsIndexed: stats.transactionsIndexed,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: indexerState.id,
        set: {
          totalTransactionsIndexed: sql`${indexerState.totalTransactionsIndexed} + ${stats.transactionsIndexed}`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      })

    return NextResponse.json({
      success: true,
      contracts: CONTRACTS_TO_INDEX,
      stats,
    })
  } catch (error) {
    console.error("Indexer error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stats,
      },
      { status: 500 }
    )
  }
}
