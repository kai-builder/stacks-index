'use client'

import { useState, useEffect, useCallback } from 'react'

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

interface TokenPricesResponse {
  success: boolean
  data: Record<string, TokenPrice>
  cached: boolean
  cachedAt: string
  error?: string
}

export function useTokenPrices() {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/token-prices')
      const data: TokenPricesResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch prices')
      }

      setPrices(data.data)
    } catch (err) {
      console.error('Failed to fetch token prices:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch prices')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrices()

    // Refresh prices every 2 minutes
    const interval = setInterval(fetchPrices, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchPrices])

  const getPrice = useCallback(
    (symbol: string): number => {
      // Normalize symbol
      const normalizedSymbol = symbol.toUpperCase()

      // USDC/USDCx always $1
      if (normalizedSymbol === 'USDC' || normalizedSymbol === 'USDCX') {
        return 1
      }

      // Map common variations
      const symbolMap: Record<string, string> = {
        'SBTC': 'sBTC',
        'STSTX': 'stSTX',
        'USDH': 'USDh',
        'USDCX': 'USDCx',
      }

      const mappedSymbol = symbolMap[normalizedSymbol] || symbol
      return prices[mappedSymbol]?.price_usd || 0
    },
    [prices]
  )

  const getPriceChange24h = useCallback(
    (symbol: string): number => {
      const normalizedSymbol = symbol.toUpperCase()

      if (normalizedSymbol === 'USDC' || normalizedSymbol === 'USDCX') {
        return 0
      }

      const symbolMap: Record<string, string> = {
        'SBTC': 'sBTC',
        'STSTX': 'stSTX',
        'USDH': 'USDh',
        'USDCX': 'USDCx',
      }

      const mappedSymbol = symbolMap[normalizedSymbol] || symbol
      return prices[mappedSymbol]?.price_change_24h || 0
    },
    [prices]
  )

  const calculatePortfolioValue = useCallback(
    (holdings: { symbol: string; amount: number }[]): number => {
      return holdings.reduce((total, holding) => {
        const price = getPrice(holding.symbol)
        return total + holding.amount * price
      }, 0)
    },
    [getPrice]
  )

  return {
    prices,
    isLoading,
    error,
    fetchPrices,
    getPrice,
    getPriceChange24h,
    calculatePortfolioValue,
  }
}
