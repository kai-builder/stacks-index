import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 0

// Bitflow public API endpoint
const BITFLOW_API_BASE = 'https://app.bitflow.finance/api/sdk'

// Token ID mapping for Bitflow
const BITFLOW_TOKEN_IDS: Record<string, string> = {
  'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx': 'token-usdcx',
  'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token': 'token-sbtc',
  'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.wstx': 'token-wstx',
  'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex': 'token-alex',
  'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token': 'token-welsh',
  'SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6.leo-token': 'token-leo',
}

async function getQuoteFromBitflowAPI(
  tokenXId: string,
  tokenYId: string,
  amount: number
): Promise<{
  bestRoute?: {
    quote: number
    tokenYDecimals?: number
    route: Array<{
      tokenX: string
      tokenY: string
      pool: string
      poolType: string
      isReversed: boolean
    }>
  }
  allRoutes?: Array<{
    quote: number
    tokenYDecimals?: number
    route: Array<{
      tokenX: string
      tokenY: string
      pool: string
      poolType: string
      isReversed: boolean
    }>
  }>
  priceImpact?: number
  fee?: number
} | null> {
  try {
    const timestamp = Date.now()
    const url = `${BITFLOW_API_BASE}/quote-for-route?tokenXId=${tokenXId}&tokenYId=${tokenYId}&amount=${amount}&timestamp=${timestamp}`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'StacksIndex/1.0',
      },
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      console.error(`[Bitflow API] HTTP error: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[Bitflow API] Error:', error)
    return null
  }
}

interface QuoteRequest {
  fromToken: string // Contract address
  toToken: string   // Contract address
  amount: number    // Human-readable amount
}

interface QuoteResponse {
  success: boolean
  quote?: {
    amountIn: number
    amountOut: number
    route: unknown
    swapExecutionData: unknown
    priceImpact?: number
    fee?: number
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<QuoteResponse>> {
  try {
    const body = await request.json() as QuoteRequest
    const { fromToken, toToken, amount } = body

    if (!fromToken || !toToken || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: fromToken, toToken, amount',
      }, { status: 400 })
    }

    const fromTokenId = BITFLOW_TOKEN_IDS[fromToken]
    const toTokenId = BITFLOW_TOKEN_IDS[toToken]

    if (!fromTokenId) {
      return NextResponse.json({
        success: false,
        error: `Unknown from token: ${fromToken}`,
      }, { status: 400 })
    }

    if (!toTokenId) {
      return NextResponse.json({
        success: false,
        error: `Unknown to token: ${toToken}`,
      }, { status: 400 })
    }

    // Convert human-readable amount to micro units (assuming 6 decimals for USDCx)
    const amountMicroUnits = Math.floor(amount * 1_000_000)
    const quote = await getQuoteFromBitflowAPI(fromTokenId, toTokenId, amountMicroUnits)

    if (!quote) {
      return NextResponse.json({
        success: false,
        error: 'No route found for this swap',
      })
    }

    const bestRoute = quote.bestRoute
    const allRoutes = quote.allRoutes

    const amountOut = bestRoute?.quote || allRoutes?.[0]?.quote || 0
    const tokenYDecimals = bestRoute?.tokenYDecimals || allRoutes?.[0]?.tokenYDecimals || 6
    const route = bestRoute?.route || allRoutes?.[0]?.route

    return NextResponse.json({
      success: true,
      quote: {
        amountIn: amount,
        amountOut,
        route,
        swapExecutionData: {
          route,
          amount,
          tokenXDecimals: 6, // USDCx decimals
          tokenYDecimals,
        },
        priceImpact: quote.priceImpact,
        fee: quote.fee,
      },
    })

  } catch (error) {
    console.error('Bitflow quote error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quote',
    }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    message: 'Bitflow Quote API',
    endpoints: {
      'POST /api/bitflow/quote': 'Get quote for a swap',
    },
    exampleQuoteRequest: {
      fromToken: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
      toToken: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
      amount: 100, // $100 USDCx
    },
  })
}
