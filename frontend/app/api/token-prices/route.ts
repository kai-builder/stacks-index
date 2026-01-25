import { NextResponse } from 'next/server'
import { TOKENS } from '@/lib/stacks/tokens'

// Cache for token prices (2 minutes = 120000ms)
let priceCache: { data: Record<string, TokenPrice>; timestamp: number } | null = null
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

export interface TokenPrice {
  symbol: string
  name: string
  price_usd: number
  price_change_24h: number
  price_change_7d: number
  liquidity: number
  volume_24h_usd: number
  market_cap_usd: number
}

interface StacksAgentToken {
  contract_id: string
  symbol: string
  name: string
  decimals: number
  price_usd: number
  price_change_1d: number
  price_change_7d: number
  liquidity: number
  volume_24h_usd: number
  market_cap_usd: number
}

interface StacksAgentResponse {
  success: boolean
  data: StacksAgentToken[]
}

// Map our token symbols to search terms for the API
const TOKEN_SEARCH_MAP: Record<string, string> = {
  sBTC: 'sbtc',
  stSTX: 'ststx',
  WELSH: 'welsh',
  LEO: 'leo',
  DOG: 'dog',
  USDh: 'usdh',
  ALEX: 'alex',
  VELAR: 'velar',
  DROID: 'droid',
}

// Fetch native STX price from Hiro Explorer API
async function fetchSTXPrice(): Promise<TokenPrice> {
  try {
    const response = await fetch(
      'https://explorer.hiro.so/stxPrice?blockBurnTime=current',
      { next: { revalidate: 120 } }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.price) {
        return {
          symbol: 'STX',
          name: 'Stacks',
          price_usd: data.price || 0,
          price_change_24h: 0, // Hiro API doesn't provide change data
          price_change_7d: 0,
          liquidity: 0,
          volume_24h_usd: 0,
          market_cap_usd: 0,
        }
      }
    }
  } catch (error) {
    console.error('Error fetching STX price from Hiro:', error)
  }

  // Fallback
  return {
    symbol: 'STX',
    name: 'Stacks',
    price_usd: 0,
    price_change_24h: 0,
    price_change_7d: 0,
    liquidity: 0,
    volume_24h_usd: 0,
    market_cap_usd: 0,
  }
}

// Map our contract addresses to match API results
function getContractId(symbol: string): string {
  const token = TOKENS[symbol]
  if (!token) return ''
  return `${token.contractAddress}.${token.contractName}`
}

async function fetchTokenPrice(searchTerm: string, contractId: string): Promise<StacksAgentToken | null> {
  try {
    const response = await fetch(
      `https://stacksagent.com/api/tokens?page=1&size=20&sort=liquidity&order=desc&search=${searchTerm}`,
      { next: { revalidate: 120 } } // Next.js cache for 2 minutes
    )

    if (!response.ok) {
      console.error(`Failed to fetch price for ${searchTerm}: ${response.status}`)
      return null
    }

    const data: StacksAgentResponse = await response.json()

    if (!data.success || !data.data || data.data.length === 0) {
      return null
    }

    // Find the token that matches our contract ID
    const matchingToken = data.data.find(
      (t) => t.contract_id.toLowerCase() === contractId.toLowerCase()
    )

    // If no exact match, return the first result with highest liquidity
    return matchingToken || data.data[0]
  } catch (error) {
    console.error(`Error fetching price for ${searchTerm}:`, error)
    return null
  }
}

async function fetchAllPrices(): Promise<Record<string, TokenPrice>> {
  const prices: Record<string, TokenPrice> = {}

  // USDCx is always pegged at $1
  prices['USDCx'] = {
    symbol: 'USDCx',
    name: 'USD Coin (Bridged)',
    price_usd: 1,
    price_change_24h: 0,
    price_change_7d: 0,
    liquidity: 0,
    volume_24h_usd: 0,
    market_cap_usd: 0,
  }

  // Fetch native STX price separately
  prices['STX'] = await fetchSTXPrice()

  // Fetch prices for all other tokens in parallel
  const fetchPromises = Object.entries(TOKEN_SEARCH_MAP).map(async ([symbol, searchTerm]) => {
    const contractId = getContractId(symbol)
    const tokenData = await fetchTokenPrice(searchTerm, contractId)

    if (tokenData) {
      prices[symbol] = {
        symbol: tokenData.symbol,
        name: tokenData.name,
        price_usd: tokenData.price_usd || 0,
        price_change_24h: tokenData.price_change_1d || 0,
        price_change_7d: tokenData.price_change_7d || 0,
        liquidity: tokenData.liquidity || 0,
        volume_24h_usd: tokenData.volume_24h_usd || 0,
        market_cap_usd: tokenData.market_cap_usd || 0,
      }
    } else {
      // Fallback to 0 if price not found
      const token = TOKENS[symbol]
      prices[symbol] = {
        symbol,
        name: token?.name || symbol,
        price_usd: 0,
        price_change_24h: 0,
        price_change_7d: 0,
        liquidity: 0,
        volume_24h_usd: 0,
        market_cap_usd: 0,
      }
    }
  })

  await Promise.all(fetchPromises)

  return prices
}

export async function GET() {
  try {
    const now = Date.now()

    // Check cache
    if (priceCache && now - priceCache.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: priceCache.data,
        cached: true,
        cachedAt: new Date(priceCache.timestamp).toISOString(),
      })
    }

    // Fetch fresh prices
    const prices = await fetchAllPrices()

    // Update cache
    priceCache = {
      data: prices,
      timestamp: now,
    }

    return NextResponse.json({
      success: true,
      data: prices,
      cached: false,
      cachedAt: new Date(now).toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch token prices:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prices',
      },
      { status: 500 }
    )
  }
}
