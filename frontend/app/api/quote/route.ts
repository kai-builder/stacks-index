import { NextRequest, NextResponse } from 'next/server'
import { BitflowSDK } from '@bitflowlabs/core-sdk'
import { AlexSDK, Currency, TokenInfo } from 'alex-sdk'

export const revalidate = 0

// Initialize Bitflow SDK
const bitflowSDK = new BitflowSDK({
  BITFLOW_API_HOST: 'https://api.bitflowapis.finance/',
  BITFLOW_API_KEY: process.env.BITFLOW_API_KEY || '',
  READONLY_CALL_API_HOST: 'https://node.bitflowapis.finance/',
  READONLY_CALL_API_KEY: process.env.BITFLOW_READONLY_API_KEY || '',
  KEEPER_API_HOST: 'https://keeper.bitflowapis.finance/',
  KEEPER_API_KEY: process.env.BITFLOW_API_KEY || '',
})

// Initialize Alex SDK
const alexSDK = new AlexSDK()

// Token decimals - keys must match normalized token symbols
const TOKEN_DECIMALS: Record<string, number> = {
  STX: 6,
  sBTC: 8,
  USDH: 8,
  stSTX: 6,
  WELSH: 6,
  LEO: 6,
  DOG: 8,
  DROID: 6,
  ALEX: 8,
  VELAR: 6,
  USDCx: 6,
}

// Normalize token symbol to match our standard format
// Strategy uses lowercase (sbtc), but lookups use mixed case (sBTC)
function normalizeTokenSymbol(symbol: string): string {
  const upperSymbol = symbol.toUpperCase()
  const symbolMap: Record<string, string> = {
    'SBTC': 'sBTC',
    'STSTX': 'stSTX',
    'USDCX': 'USDCx',
    'USDH': 'USDH',
    'STX': 'STX',
    'WELSH': 'WELSH',
    'LEO': 'LEO',
    'DOG': 'DOG',
    'ALEX': 'ALEX',
    'VELAR': 'VELAR',
    'DROID': 'DROID',
  }
  return symbolMap[upperSymbol] || symbol
}

// Bitflow token IDs for getQuoteForRoute
// Note: Use `token-aeusdc` because Bitflow doesn't support USDCx in their contract yet
const BITFLOW_TOKEN_IDS: Record<string, string> = {
  STX: 'token-stx-auto',
  sBTC: 'token-sbtc-auto',
  USDH: 'token-usdh-auto',
  stSTX: 'token-ststx-auto',
  WELSH: 'token-welsh-auto',
  LEO: 'token-leo-auto',
  DOG: 'token-dog-auto',
  DROID: 'token-DROID-auto',
  VELAR: 'token-velar',
}

// Fallback rates (tokens per $1 USD in human-readable format) - used when SDK fails
const FALLBACK_RATES: Record<string, number> = {
  STX: 0.465,        // ~$2.15 per STX -> 0.465 STX per $1
  sBTC: 0.00001,     // ~$100k per BTC -> 0.00001 BTC per $1
  USDH: 0.98,        // ~$1.02 per USDH -> 0.98 USDH per $1
  stSTX: 0.44,       // ~$2.28 per stSTX -> 0.44 stSTX per $1
  WELSH: 408163,     // ~$0.00000245 per WELSH -> 408163 WELSH per $1
  LEO: 11236,        // ~$0.000089 per LEO -> 11236 LEO per $1
  DOG: 312500,       // ~$0.0000032 per DOG -> 312500 DOG per $1
  DROID: 6667,       // ~$0.00015 per DROID -> 6667 DROID per $1
  ALEX: 22.22,       // ~$0.045 per ALEX -> 22.22 ALEX per $1
  VELAR: 3500,       // ~$0.000285 per VELAR -> 3500 VELAR per $1
}

// Fallback prices - used only when real prices API fails
const FALLBACK_PRICES: Record<string, number> = {
  STX: 2.15,
  sBTC: 98500,
  stSTX: 2.28,
  USDCx: 1.0,
  WELSH: 0.00000245,
  LEO: 0.000089,
  DOG: 0.0000032,
  DROID: 0.00015,
  ALEX: 0.001,  // Very low fallback - real price from API should be used
  VELAR: 0.012,
  USDH: 1.0,
}

// Cache for real prices from token-prices API
let pricesCache: { data: Record<string, number>; timestamp: number } | null = null
const PRICES_CACHE_DURATION = 60 * 1000 // 1 minute

// Fetch real prices from token-prices API
async function fetchRealPrices(): Promise<Record<string, number>> {
  const now = Date.now()

  // Return cached prices if still valid
  if (pricesCache && now - pricesCache.timestamp < PRICES_CACHE_DURATION) {
    return pricesCache.data
  }

  try {
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/token-prices`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[Quote] Failed to fetch prices:', response.status)
      return FALLBACK_PRICES
    }

    const data = await response.json()

    if (!data.success || !data.data) {
      console.error('[Quote] Invalid prices response:', data)
      return FALLBACK_PRICES
    }

    // Convert to simple price map
    const prices: Record<string, number> = {}
    for (const [symbol, tokenData] of Object.entries(data.data)) {
      const priceData = tokenData as { price_usd?: number }
      prices[symbol] = priceData.price_usd || FALLBACK_PRICES[symbol] || 0
    }

    // Update cache
    pricesCache = {
      data: prices,
      timestamp: now,
    }

    console.log('[Quote] Fetched real prices:', prices)
    return prices
  } catch (error) {
    console.error('[Quote] Error fetching prices:', error)
    return FALLBACK_PRICES
  }
}

// Get price for a token (fetches real prices if needed)
async function getTokenPrice(symbol: string): Promise<number> {
  const prices = await fetchRealPrices()
  return prices[symbol] || FALLBACK_PRICES[symbol] || 0
}

interface QuoteRequest {
  fromToken: string // 'USDCx' or token symbol
  toToken: string // Token symbol
  amount: number // Amount in human-readable format
}

interface QuoteResult {
  fromToken: string
  toToken: string
  amountIn: number
  amountOut: number
  amountOutFormatted: string
  usdValue: number
  price: number
  source: 'bitflow' | 'alex' | 'fallback'
  priceImpact?: number
}

interface BatchQuoteRequest {
  quotes: QuoteRequest[]
}

interface BatchQuoteResult {
  success: boolean
  results: (QuoteResult | { error: string; fromToken: string; toToken: string })[]
  totalUsdValue: number
}

// Get quote from Bitflow SDK
async function getBitflowQuote(toToken: string, amount: number): Promise<QuoteResult | null> {
  try {
    // Normalize token symbol for lookups
    const normalizedToken = normalizeTokenSymbol(toToken)
    const bitflowTokenId = BITFLOW_TOKEN_IDS[normalizedToken]
    if (!bitflowTokenId) {
      console.log(`[Quote] No Bitflow token ID for ${normalizedToken} (original: ${toToken})`)
      return null
    }

    // Use token-aeusdc as source (Bitflow doesn't support USDCx directly)
    // SDK expects human-readable amount (e.g., 0.15 for $0.15)
    console.log(`[Quote] Getting Bitflow quote: aeUSDC -> ${normalizedToken}, amount: ${amount}`)

    const quote = await bitflowSDK.getQuoteForRoute('token-aeusdc', bitflowTokenId, amount)

    console.log(`[Quote] Bitflow response for ${toToken}:`, JSON.stringify(quote, null, 2))

    if (!quote) {
      return null
    }

    // Extract quote amount - SDK returns amount in output token's native units (micro)
    let amountOutMicro: number
    if (typeof quote === 'object' && 'quote' in quote) {
      amountOutMicro = Number((quote as { quote: bigint }).quote)
    } else if (typeof quote === 'bigint') {
      amountOutMicro = Number(quote)
    } else if (typeof quote === 'number') {
      amountOutMicro = quote
    } else {
      return null
    }

    // Convert output from micro units to human-readable
    const outputDecimals = TOKEN_DECIMALS[normalizedToken] || 6
    const amountOutHuman = amountOutMicro / Math.pow(10, outputDecimals)
    const price = await getTokenPrice(normalizedToken)
    const usdValue = amountOutHuman * price

    return {
      fromToken: 'USDCx',
      toToken: normalizedToken,
      amountIn: amount,
      amountOut: amountOutMicro,
      amountOutFormatted: amountOutHuman.toFixed(outputDecimals > 6 ? 8 : 6),
      usdValue,
      price,
      source: 'bitflow',
    }
  } catch (error) {
    console.error(`[Quote] Bitflow error for ${toToken}:`, error)
    return null
  }
}

// Get quote from Alex SDK
async function getAlexQuote(toToken: string, amount: number): Promise<QuoteResult | null> {
  try {
    const normalizedToken = normalizeTokenSymbol(toToken)
    if (normalizedToken !== 'ALEX') {
      return null
    }

    // Alex SDK uses aUSD as hardcoded USDC value
    // All Alex tokens have 8 decimals
    // BigInt(100000000) = $1
    const amountInMicro = BigInt(Math.floor(amount * 100_000_000))

    console.log(`[Quote] Getting Alex quote: aUSD -> ALEX, amount: ${amount} (${amountInMicro})`)

    // Get aUSD token info
    const aUSD = await alexSDK.fetchTokenInfo('SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-susdt::aUSD') as TokenInfo
    const aUSDCurrency = aUSD.id

    // Get amount out in ALEX
    const amountOut = await alexSDK.getAmountTo(aUSDCurrency, amountInMicro, Currency.ALEX)

    console.log(`[Quote] Alex response for ALEX:`, amountOut.toString())

    // amountOut is in 8 decimals (e.g., 72355278160n => 723.55 ALEX)
    const amountOutHuman = Number(amountOut) / 100_000_000
    const price = await getTokenPrice('ALEX')
    const usdValue = amountOutHuman * price

    return {
      fromToken: 'USDCx',
      toToken: 'ALEX',
      amountIn: amount,
      amountOut: Number(amountOut),
      amountOutFormatted: amountOutHuman.toFixed(8),
      usdValue,
      price,
      source: 'alex',
    }
  } catch (error) {
    console.error(`[Quote] Alex error for ${toToken}:`, error)
    return null
  }
}

// Get fallback quote using real prices (calculates rate dynamically from token price)
async function getFallbackQuote(toToken: string, amount: number): Promise<QuoteResult> {
  const normalizedToken = normalizeTokenSymbol(toToken)
  const decimals = TOKEN_DECIMALS[normalizedToken] || 6
  const price = await getTokenPrice(normalizedToken)

  // Calculate rate from real price: tokens per $1 = 1 / price
  // Use hardcoded fallback only if price is 0 or unavailable
  const rate = price > 0 ? (1 / price) : (FALLBACK_RATES[normalizedToken] || 1)

  const amountOut = Math.floor(amount * rate * Math.pow(10, decimals) * 0.97) // 3% slippage buffer
  const amountOutHuman = amountOut / Math.pow(10, decimals)
  const usdValue = amountOutHuman * price

  return {
    fromToken: 'USDCx',
    toToken: normalizedToken,
    amountIn: amount,
    amountOut,
    amountOutFormatted: amountOutHuman.toFixed(decimals > 6 ? 8 : 6),
    usdValue,
    price,
    source: 'fallback',
  }
}

// Main quote function
async function getQuote(fromToken: string, toToken: string, amount: number): Promise<QuoteResult> {
  const normalizedToken = normalizeTokenSymbol(toToken)

  // For ALEX, use Alex SDK
  if (normalizedToken === 'ALEX') {
    const alexQuote = await getAlexQuote(toToken, amount)
    if (alexQuote) return alexQuote
    return getFallbackQuote(toToken, amount)
  }

  // For other tokens, try Bitflow SDK first
  const bitflowQuote = await getBitflowQuote(toToken, amount)
  if (bitflowQuote) return bitflowQuote

  // Fall back to estimated rates
  return getFallbackQuote(toToken, amount)
}

// Single quote endpoint
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as QuoteRequest
    const { fromToken = 'USDCx', toToken, amount } = body

    if (!toToken || !amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: toToken, amount',
      }, { status: 400 })
    }

    const quote = await getQuote(fromToken, toToken, amount)

    return NextResponse.json({
      success: true,
      quote,
    })
  } catch (error) {
    console.error('[Quote] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quote',
    }, { status: 500 })
  }
}

// Batch quote endpoint
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as BatchQuoteRequest
    const { quotes } = body

    if (!quotes || !Array.isArray(quotes)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: quotes (array)',
      }, { status: 400 })
    }

    const results: (QuoteResult | { error: string; fromToken: string; toToken: string })[] = []
    let totalUsdValue = 0

    // Process quotes sequentially to avoid rate limiting
    for (const quoteRequest of quotes) {
      const { fromToken = 'USDCx', toToken, amount } = quoteRequest

      if (!toToken || !amount || amount <= 0) {
        results.push({
          error: 'Invalid quote parameters',
          fromToken,
          toToken,
        })
        continue
      }

      try {
        const quote = await getQuote(fromToken, toToken, amount)
        results.push(quote)
        totalUsdValue += quote.usdValue
      } catch (error) {
        results.push({
          error: error instanceof Error ? error.message : 'Quote failed',
          fromToken,
          toToken,
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalUsdValue,
    } as BatchQuoteResult)
  } catch (error) {
    console.error('[Quote] Batch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quotes',
    }, { status: 500 })
  }
}

// GET endpoint for reverse quotes (token -> USDCx for selling)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const fromTokenRaw = searchParams.get('fromToken')
    const amount = parseFloat(searchParams.get('amount') || '0')

    if (!fromTokenRaw || !amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: fromToken, amount',
      }, { status: 400 })
    }

    // Normalize token symbol
    const fromToken = normalizeTokenSymbol(fromTokenRaw)

    // For selling, we need reverse quotes (token -> USDCx)
    // Use the token price to estimate USD value
    const price = await getTokenPrice(fromToken)
    const usdValue = amount * price

    // For ALEX, use Alex SDK for reverse quote
    if (fromToken === 'ALEX') {
      try {
        // ALEX has 8 decimals, convert human-readable to micro units
        const amountInMicro = BigInt(Math.floor(amount * 100_000_000))
        console.log(`[Quote] Reverse Alex: ALEX -> aUSD, amount: ${amount} (${amountInMicro} micro)`)

        const aUSD = await alexSDK.fetchTokenInfo('SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-susdt::aUSD') as TokenInfo
        const aUSDCurrency = aUSD.id
        const amountOut = await alexSDK.getAmountTo(Currency.ALEX, amountInMicro, aUSDCurrency)

        // aUSD has 8 decimals
        const amountOutHuman = Number(amountOut) / 100_000_000

        return NextResponse.json({
          success: true,
          quote: {
            fromToken,
            toToken: 'USDCx',
            amountIn: amount,
            amountOut: Number(amountOut),
            amountOutFormatted: amountOutHuman.toFixed(6),
            usdValue: amountOutHuman, // aUSD ≈ $1
            price,
            source: 'alex',
          },
        })
      } catch (error) {
        console.error('[Quote] Alex reverse error:', error)
      }
    }

    // For other tokens, try Bitflow reverse quote
    try {
      const bitflowTokenId = BITFLOW_TOKEN_IDS[fromToken]
      if (bitflowTokenId) {
        // SDK expects human-readable amount
        console.log(`[Quote] Reverse Bitflow: ${fromToken} -> aeUSDC, amount: ${amount}`)

        const quote = await bitflowSDK.getQuoteForRoute(bitflowTokenId, 'token-aeusdc', amount)

        if (quote) {
          let amountOutMicro: number
          if (typeof quote === 'object' && 'quote' in quote) {
            amountOutMicro = Number((quote as { quote: bigint }).quote)
          } else if (typeof quote === 'bigint') {
            amountOutMicro = Number(quote)
          } else if (typeof quote === 'number') {
            amountOutMicro = quote
          } else {
            throw new Error('Invalid quote format')
          }

          // aeUSDC has 6 decimals
          const amountOutHuman = amountOutMicro / 1_000_000

          return NextResponse.json({
            success: true,
            quote: {
              fromToken,
              toToken: 'USDCx',
              amountIn: amount,
              amountOut: amountOutMicro,
              amountOutFormatted: amountOutHuman.toFixed(6),
              usdValue: amountOutHuman, // aeUSDC ≈ $1
              price,
              source: 'bitflow',
            },
          })
        }
      }
    } catch (error) {
      console.error('[Quote] Bitflow reverse error:', error)
    }

    // Fallback: use price-based estimate
    return NextResponse.json({
      success: true,
      quote: {
        fromToken,
        toToken: 'USDCx',
        amountIn: amount,
        amountOut: Math.floor(usdValue * 1_000_000 * 0.97), // 3% slippage
        amountOutFormatted: (usdValue * 0.97).toFixed(6),
        usdValue: usdValue * 0.97,
        price,
        source: 'fallback',
      },
    })
  } catch (error) {
    console.error('[Quote] GET error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quote',
    }, { status: 500 })
  }
}
