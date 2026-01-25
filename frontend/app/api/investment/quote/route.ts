/**
 * Investment Quote API - Get quotes from Velar and Alex SDKs
 *
 * This route fetches swap quotes directly from AMM SDKs without requiring API keys.
 */

import { NextRequest, NextResponse } from 'next/server'
import { AlexSDK, Currency, TokenInfo } from 'alex-sdk'
import { VelarSDK } from '@velarprotocol/velar-sdk'

export const revalidate = 0

// Velar uses wSTX contract for STX
const VELAR_WSTX_CONTRACT = 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.wstx'

interface QuoteRequest {
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
  amount: number
  amm: 'velar' | 'alex'
}

interface QuoteResponse {
  success: boolean
  quote?: {
    amm: string
    amountIn: number
    rawAmount: number | string
    amountOutAfterDecimals: number
    route: any
    swapOptions?: any
  }
  error?: string
}

// Helper to convert amount to BigInt with decimals
function amountToBigInt(amount: number, decimals: number): bigint {
  const fixed = amount.toFixed(decimals)
  const normalized = fixed.replace('.', '').replace(/^0+(?=\d)/, '')
  return normalized.length === 0 ? BigInt(0) : BigInt(normalized)
}

// Helper to convert BigInt to human-readable amount
function bigIntToAmount(value: bigint, decimals: number): number {
  return Number(value) / Math.pow(10, decimals)
}

/**
 * Get quote from Velar SDK
 */
async function getVelarQuote(
  fromToken: QuoteRequest['fromToken'],
  toToken: QuoteRequest['toToken'],
  amount: number
): Promise<QuoteResponse['quote'] | null> {
  try {
    const velarSDK = new VelarSDK()

    // Normalize token IDs for Velar
    let inTokenId = fromToken.contract_id
    let outTokenId = toToken.contract_id

    // Velar uses wSTX contract for STX swaps
    if (inTokenId.toLowerCase() === 'stx') {
      inTokenId = VELAR_WSTX_CONTRACT
    }
    if (outTokenId.toLowerCase() === 'stx') {
      outTokenId = VELAR_WSTX_CONTRACT
    }

    console.log(`[Velar] Getting quote: ${inTokenId} -> ${outTokenId}, amount: ${amount}`)

    // Create swap instance with placeholder account for quotes
    const placeholderAccount = 'SPJ7N2FGH300NS65SHDBMWR42RAZGK3NN127DJVS'

    const swapInstance = await velarSDK.getSwapInstance({
      account: placeholderAccount,
      inToken: inTokenId,
      outToken: outTokenId,
    })

    // Get computed amount
    const result = await swapInstance.getComputedAmount({
      amount: amount,
      slippage: 1.0, // 1% slippage
    })

    console.log(`[Velar] Quote result:`, result)

    // Extract output amount from result
    const outputAmount = (result as any)?.amountOut || (result as any)?.amount || result
    const outputDecimals = (result as any)?.amountOutDecimal || 6

    if (outputAmount && Number(outputAmount) > 0) {
      return {
        amm: 'velar',
        amountIn: amount,
        rawAmount: Number(outputAmount),
        amountOutAfterDecimals: Number(outputDecimals),
        route: {
          from: inTokenId,
          to: outTokenId,
          slippage: 1.0,
          priceImpact: (result as any)?.priceImpact || 0,
        },
        swapOptions: {
          inToken: inTokenId,
          outToken: outTokenId,
        },
      }
    }

    return null
  } catch (error) {
    console.error('[Velar] Quote error:', error)
    return null
  }
}

/**
 * Get quote from Alex SDK
 */
async function getAlexQuote(
  fromToken: QuoteRequest['fromToken'],
  toToken: QuoteRequest['toToken'],
  amount: number
): Promise<QuoteResponse['quote'] | null> {
  try {
    const alexSDK = new AlexSDK()

    const fromTokenId = fromToken.contract_id
    const toTokenId = toToken.contract_id

    console.log(`[Alex] Getting quote: ${fromTokenId} -> ${toTokenId}, amount: ${amount}`)

    // Determine currencies
    let inputCurrency: Currency | undefined
    let outputCurrency: Currency | undefined
    let inputDecimals = 8
    let outputDecimals = 8

    // Check for STX
    if (fromTokenId.toLowerCase() === 'stx') {
      inputCurrency = Currency.STX
      inputDecimals = 8
    } else if (fromTokenId.includes('token-alex')) {
      inputCurrency = Currency.ALEX
      inputDecimals = 8
    } else {
      // Fetch token info for other tokens
      const tokenInfo = await alexSDK.fetchTokenInfo(fromTokenId) as TokenInfo | null
      if (!tokenInfo) {
        console.warn(`[Alex] Token info not found for ${fromTokenId}`)
        return null
      }
      inputCurrency = tokenInfo.id
      inputDecimals = tokenInfo.wrapTokenDecimals ?? tokenInfo.underlyingTokenDecimals ?? 8
    }

    // Check output token
    if (toTokenId.toLowerCase() === 'stx') {
      outputCurrency = Currency.STX
      outputDecimals = 8
    } else if (toTokenId.includes('token-alex')) {
      outputCurrency = Currency.ALEX
      outputDecimals = 8
    } else if (toTokenId.includes('sbtc')) {
      // sBTC specific handling
      const tokenInfo = await alexSDK.fetchTokenInfo(toTokenId) as TokenInfo | null
      if (!tokenInfo) {
        console.warn(`[Alex] Token info not found for ${toTokenId}`)
        return null
      }
      outputCurrency = tokenInfo.id
      outputDecimals = tokenInfo.wrapTokenDecimals ?? tokenInfo.underlyingTokenDecimals ?? 8
    } else {
      const tokenInfo = await alexSDK.fetchTokenInfo(toTokenId) as TokenInfo | null
      if (!tokenInfo) {
        console.warn(`[Alex] Token info not found for ${toTokenId}`)
        return null
      }
      outputCurrency = tokenInfo.id
      outputDecimals = tokenInfo.wrapTokenDecimals ?? tokenInfo.underlyingTokenDecimals ?? 8
    }

    if (!inputCurrency || !outputCurrency) {
      console.warn('[Alex] Missing currency information')
      return null
    }

    // Convert amount to BigInt
    const amountBigInt = amountToBigInt(amount, inputDecimals)

    // Get amount out
    const amountTo = await alexSDK.getAmountTo(inputCurrency, amountBigInt, outputCurrency)

    console.log(`[Alex] Quote result: ${amountTo}`)

    if (amountTo) {
      const amountOutAfterDecimals = bigIntToAmount(amountTo, outputDecimals)

      return {
        amm: 'alex',
        amountIn: amount,
        rawAmount: amountTo.toString(),
        amountOutAfterDecimals,
        route: {
          from: fromTokenId,
          to: toTokenId,
          inputCurrency: inputCurrency.toString(),
          outputCurrency: outputCurrency.toString(),
          inputDecimals,
          outputDecimals,
        },
        swapOptions: {
          inputCurrency,
          outputCurrency,
          inputDecimals,
          outputDecimals,
        },
      }
    }

    return null
  } catch (error) {
    console.error('[Alex] Quote error:', error)
    return null
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: QuoteRequest = await request.json()
    const { fromToken, toToken, amount, amm } = body

    if (!fromToken?.contract_id || !toToken?.contract_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing token information',
      }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid amount',
      }, { status: 400 })
    }

    if (!amm || !['velar', 'alex'].includes(amm)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid AMM. Supported: velar, alex',
      }, { status: 400 })
    }

    let quote: QuoteResponse['quote'] | null = null

    if (amm === 'velar') {
      quote = await getVelarQuote(fromToken, toToken, amount)
    } else if (amm === 'alex') {
      quote = await getAlexQuote(fromToken, toToken, amount)
    }

    if (!quote) {
      return NextResponse.json({
        success: false,
        error: `No quote available from ${amm}`,
      })
    }

    return NextResponse.json({
      success: true,
      quote,
    })
  } catch (error) {
    console.error('Quote API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quote',
    }, { status: 500 })
  }
}
