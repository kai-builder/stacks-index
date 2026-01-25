/**
 * Build Swap Transaction API - Generate transaction options from Velar/Alex SDKs
 *
 * This route uses the SDK to generate the actual transaction options
 * that can be signed and broadcast by the user's wallet.
 */

import { NextRequest, NextResponse } from 'next/server'
import { AlexSDK, Currency, TokenInfo } from 'alex-sdk'
import { VelarSDK } from '@velarprotocol/velar-sdk'

export const revalidate = 0

// Velar uses wSTX contract for STX
const VELAR_WSTX_CONTRACT = 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.wstx'

interface BuildSwapRequest {
  quote: {
    tokenSymbol: string
    amm: 'velar' | 'alex'
    amountIn: number
    amountOut: number
    rawAmountOut: string
    route: any
    swapOptions?: any
  }
  senderAddress: string
  fromToken: {
    contract_id: string
    symbol: string
    decimals?: number
  }
  toToken: {
    contract_id: string
    symbol: string
    decimals?: number
  }
}

// Helper to convert amount to BigInt with decimals
function amountToBigInt(amount: number, decimals: number): bigint {
  const fixed = amount.toFixed(decimals)
  const normalized = fixed.replace('.', '').replace(/^0+(?=\d)/, '')
  return normalized.length === 0 ? BigInt(0) : BigInt(normalized)
}

/**
 * Build Velar swap transaction
 */
async function buildVelarSwap(
  quote: BuildSwapRequest['quote'],
  senderAddress: string,
  fromToken: BuildSwapRequest['fromToken'],
  toToken: BuildSwapRequest['toToken']
): Promise<any> {
  const velarSDK = new VelarSDK()

  // Normalize token IDs
  let inTokenId = fromToken.contract_id
  let outTokenId = toToken.contract_id

  if (inTokenId.toLowerCase() === 'stx') {
    inTokenId = VELAR_WSTX_CONTRACT
  }
  if (outTokenId.toLowerCase() === 'stx') {
    outTokenId = VELAR_WSTX_CONTRACT
  }

  console.log(`[Velar] Building swap: ${inTokenId} -> ${outTokenId}, amount: ${quote.amountIn}, sender: ${senderAddress}`)

  // Create swap instance with actual sender
  const swapInstance = await velarSDK.getSwapInstance({
    account: senderAddress,
    inToken: inTokenId,
    outToken: outTokenId,
  })

  // Get swap transaction options
  const swapOptions = await swapInstance.swap({
    amount: quote.amountIn,
    slippage: 1.0, // 1% slippage
  })

  console.log(`[Velar] Swap options:`, JSON.stringify(swapOptions, null, 2))

  return swapOptions
}

/**
 * Build Alex swap transaction
 */
async function buildAlexSwap(
  quote: BuildSwapRequest['quote'],
  senderAddress: string,
  fromToken: BuildSwapRequest['fromToken'],
  toToken: BuildSwapRequest['toToken']
): Promise<any> {
  const alexSDK = new AlexSDK()

  const fromTokenId = fromToken.contract_id
  const toTokenId = toToken.contract_id

  console.log(`[Alex] Building swap: ${fromTokenId} -> ${toTokenId}, amount: ${quote.amountIn}, sender: ${senderAddress}`)

  // Get currencies from swapOptions or determine them
  let inputCurrency: Currency | undefined = quote.swapOptions?.inputCurrency
  let outputCurrency: Currency | undefined = quote.swapOptions?.outputCurrency
  let inputDecimals = quote.swapOptions?.inputDecimals || 8

  // If not in swapOptions, determine currencies
  if (!inputCurrency) {
    if (fromTokenId.toLowerCase() === 'stx') {
      inputCurrency = Currency.STX
      inputDecimals = 8
    } else if (fromTokenId.includes('token-alex')) {
      inputCurrency = Currency.ALEX
      inputDecimals = 8
    } else {
      const tokenInfo = await alexSDK.fetchTokenInfo(fromTokenId) as TokenInfo | null
      if (!tokenInfo) {
        throw new Error(`Unable to fetch Alex token info for ${fromTokenId}`)
      }
      inputCurrency = tokenInfo.id
      inputDecimals = tokenInfo.wrapTokenDecimals ?? tokenInfo.underlyingTokenDecimals ?? 8
    }
  }

  if (!outputCurrency) {
    if (toTokenId.toLowerCase() === 'stx') {
      outputCurrency = Currency.STX
    } else if (toTokenId.includes('token-alex')) {
      outputCurrency = Currency.ALEX
    } else {
      const tokenInfo = await alexSDK.fetchTokenInfo(toTokenId) as TokenInfo | null
      if (!tokenInfo) {
        throw new Error(`Unable to fetch Alex token info for ${toTokenId}`)
      }
      outputCurrency = tokenInfo.id
    }
  }

  if (!inputCurrency || !outputCurrency) {
    throw new Error('Missing Alex currency metadata')
  }

  // Convert amount to BigInt
  const fromAmountBigInt = amountToBigInt(quote.amountIn, inputDecimals)

  console.log(`[Alex] Running swap with:`, {
    sender: senderAddress,
    inputCurrency: inputCurrency.toString(),
    outputCurrency: outputCurrency.toString(),
    amount: fromAmountBigInt.toString(),
  })

  // Get transaction options from Alex SDK
  // runSwap returns the transaction options needed for the swap
  const txOptions = await alexSDK.runSwap(
    senderAddress,
    inputCurrency,
    outputCurrency,
    fromAmountBigInt,
    BigInt(0) // minOut - 0 means no minimum (slippage handled elsewhere)
  )

  console.log(`[Alex] Swap options:`, txOptions ? 'received' : 'null')

  return txOptions
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: BuildSwapRequest = await request.json()
    const { quote, senderAddress, fromToken, toToken } = body

    if (!quote || !senderAddress || !fromToken || !toToken) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters',
      }, { status: 400 })
    }

    let txOptions: any = null

    if (quote.amm === 'velar') {
      txOptions = await buildVelarSwap(quote, senderAddress, fromToken, toToken)
    } else if (quote.amm === 'alex') {
      txOptions = await buildAlexSwap(quote, senderAddress, fromToken, toToken)
    } else {
      return NextResponse.json({
        success: false,
        error: `Unsupported AMM: ${quote.amm}`,
      }, { status: 400 })
    }

    if (!txOptions) {
      return NextResponse.json({
        success: false,
        error: `Failed to build swap transaction for ${quote.amm}`,
      })
    }

    // Return the transaction options
    // The frontend will use these with openContractCall
    return NextResponse.json({
      success: true,
      txOptions: {
        contractAddress: txOptions.contractAddress,
        contractName: txOptions.contractName,
        functionName: txOptions.functionName,
        functionArgs: txOptions.functionArgs,
        postConditions: txOptions.postConditions,
      },
    })
  } catch (error) {
    console.error('Build swap API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build swap',
    }, { status: 500 })
  }
}
