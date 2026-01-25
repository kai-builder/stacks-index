import { NextRequest, NextResponse } from "next/server"
import { eq, desc, and, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { contractTransactions } from "@/lib/db/schema"

// Token decimals for formatting
const TOKEN_DECIMALS: Record<string, number> = {
  ALEX: 8,
  DOG: 8,
  DROID: 6,
  LEO: 6,
  SBTC: 8,
  STSTX: 6,
  STX: 6,
  USDH: 8,
  VELAR: 6,
  WELSH: 6,
}

// Format token amount from micro units
function formatTokenAmount(amount: string, token: string): number {
  const decimals = TOKEN_DECIMALS[token.toUpperCase()] || 6
  return Number(amount) / Math.pow(10, decimals)
}

export interface HistoryTransaction {
  txId: string
  functionName: string
  strategyName: string
  status: "success" | "failed" | "pending"
  timestamp: string
  blockHeight: number
  senderAddress: string
  feeRate: string
  type: "invest" | "sell" | "add-liquidity" | "remove-liquidity" | "other"
  // For invest transactions
  investedAmount?: number // in USDCx (human readable)
  // For sell transactions
  receivedAmount?: number // in USDCx (human readable)
  soldTokens?: Record<string, number> // human readable amounts
  // For LP transactions
  poolName?: string
  xTokenSymbol?: string
  yTokenSymbol?: string
  xAmount?: number
  yAmount?: number
  lpTokens?: number
  // Error info
  errorCode?: number
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")
  const limit = parseInt(searchParams.get("limit") || "50", 10)
  const offset = parseInt(searchParams.get("offset") || "0", 10)

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  try {
    // Fetch transactions from database
    const transactions = await db
      .select()
      .from(contractTransactions)
      .where(eq(contractTransactions.senderAddress, address))
      .orderBy(desc(contractTransactions.blockTime))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contractTransactions)
      .where(eq(contractTransactions.senderAddress, address))

    const total = Number(countResult[0]?.count || 0)

    // Transform to API response format
    const historyTransactions: HistoryTransaction[] = transactions.map((tx) => {
      const transaction: HistoryTransaction = {
        txId: tx.txId,
        functionName: tx.functionName,
        strategyName: tx.strategyName || tx.functionName,
        status: tx.txStatus as "success" | "failed" | "pending",
        timestamp: tx.blockTime?.toISOString() || "",
        blockHeight: tx.blockHeight || 0,
        senderAddress: tx.senderAddress,
        feeRate: tx.feeRate || "0",
        type: tx.txType as HistoryTransaction["type"],
        errorCode: tx.errorCode || undefined,
      }

      // Add invest-specific fields
      if (tx.txType === "invest" && tx.investedAmount) {
        transaction.investedAmount = Number(tx.investedAmount) / 1_000_000 // USDCx has 6 decimals
      }

      // Add sell-specific fields
      if (tx.txType === "sell") {
        if (tx.receivedAmount) {
          transaction.receivedAmount = Number(tx.receivedAmount) / 1_000_000
        }
        if (tx.soldTokens) {
          transaction.soldTokens = {}
          for (const [token, amount] of Object.entries(tx.soldTokens)) {
            transaction.soldTokens[token] = formatTokenAmount(amount, token)
          }
        }
      }

      // Add LP-specific fields
      if (tx.txType === "add-liquidity" || tx.txType === "remove-liquidity") {
        transaction.poolName = tx.poolName || undefined
        transaction.xTokenSymbol = tx.xTokenSymbol || undefined
        transaction.yTokenSymbol = tx.yTokenSymbol || undefined

        if (tx.xAmount) {
          const xDecimals = TOKEN_DECIMALS[tx.xTokenSymbol?.toUpperCase() || ""] || 6
          transaction.xAmount = Number(tx.xAmount) / Math.pow(10, xDecimals)
        }
        if (tx.yAmount) {
          const yDecimals = TOKEN_DECIMALS[tx.yTokenSymbol?.toUpperCase() || ""] || 6
          transaction.yAmount = Number(tx.yAmount) / Math.pow(10, yDecimals)
        }
        if (tx.lpTokensReceived) {
          transaction.lpTokens = Number(tx.lpTokensReceived)
        }
      }

      return transaction
    })

    return NextResponse.json({
      transactions: historyTransactions,
      total,
      limit,
      offset,
      hasMore: offset + transactions.length < total,
    })
  } catch (error) {
    console.error("Failed to fetch transaction history:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch history" },
      { status: 500 }
    )
  }
}
