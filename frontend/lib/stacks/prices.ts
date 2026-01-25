import { TOKENS } from './tokens'

export interface PriceData {
  symbol: string
  price: number
  change24h: number
}

// Mock prices for development - in production, use real API
const MOCK_PRICES: Record<string, PriceData> = {
  STX: { symbol: 'STX', price: 2.15, change24h: 3.2 },
  sBTC: { symbol: 'sBTC', price: 98500, change24h: 1.8 },
  stSTX: { symbol: 'stSTX', price: 2.28, change24h: 2.5 },
  USDCx: { symbol: 'USDCx', price: 1.0, change24h: 0 },
}

export async function fetchTokenPrices(): Promise<Record<string, PriceData>> {
  // In production, fetch from Velar API or CoinGecko
  // For now, return mock data with slight randomization
  const prices: Record<string, PriceData> = {}

  for (const symbol of Object.keys(TOKENS)) {
    const mockPrice = MOCK_PRICES[symbol]
    if (mockPrice) {
      // Add slight price variation for realism
      const variation = 1 + (Math.random() - 0.5) * 0.01
      prices[symbol] = {
        ...mockPrice,
        price: mockPrice.price * variation,
      }
    }
  }

  return prices
}

export function calculatePortfolioValue(
  holdings: Record<string, number>,
  prices: Record<string, PriceData>
): number {
  let total = 0
  for (const [symbol, amount] of Object.entries(holdings)) {
    const token = TOKENS[symbol]
    const price = prices[symbol]
    if (token && price) {
      const normalizedAmount = amount / Math.pow(10, token.decimals)
      total += normalizedAmount * price.price
    }
  }
  return total
}
