/**
 * useQuote - Hook for fetching swap quotes with USD values
 *
 * Supports:
 * - Single quotes (USDCx -> token or token -> USDCx)
 * - Batch quotes for strategy previews
 * - Real-time price data from /api/prices
 */

import { useState, useCallback, useEffect, useRef } from 'react'

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

export interface QuoteResult {
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

export interface TokenPrice {
  symbol: string
  price: number
  change24h: number
}

interface UseQuoteState {
  isLoading: boolean
  quote: QuoteResult | null
  error: string | null
}

interface UseBatchQuoteState {
  isLoading: boolean
  quotes: QuoteResult[]
  totalUsdValue: number
  error: string | null
}

interface UsePricesState {
  isLoading: boolean
  prices: Record<string, TokenPrice>
  error: string | null
}

// Single quote hook
export function useQuote() {
  const [state, setState] = useState<UseQuoteState>({
    isLoading: false,
    quote: null,
    error: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  const getQuote = useCallback(async (
    toToken: string,
    amount: number,
    fromToken: string = 'USDCx'
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromToken, toToken, amount }),
        signal: abortControllerRef.current.signal,
      })

      const data = await response.json()

      if (data.success && data.quote) {
        setState({ isLoading: false, quote: data.quote, error: null })
        return data.quote as QuoteResult
      } else {
        setState({ isLoading: false, quote: null, error: data.error || 'Failed to get quote' })
        return null
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quote'
      setState({ isLoading: false, quote: null, error: errorMessage })
      return null
    }
  }, [])

  // Reverse quote (token -> USDCx) for selling
  const getReverseQuote = useCallback(async (
    fromToken: string,
    amount: number
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/quote?fromToken=${fromToken}&amount=${amount}`)
      const data = await response.json()

      if (data.success && data.quote) {
        setState({ isLoading: false, quote: data.quote, error: null })
        return data.quote as QuoteResult
      } else {
        setState({ isLoading: false, quote: null, error: data.error || 'Failed to get quote' })
        return null
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quote'
      setState({ isLoading: false, quote: null, error: errorMessage })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setState({ isLoading: false, quote: null, error: null })
  }, [])

  return {
    ...state,
    getQuote,
    getReverseQuote,
    reset,
  }
}

// Batch quotes hook for strategy previews
export function useBatchQuote() {
  const [state, setState] = useState<UseBatchQuoteState>({
    isLoading: false,
    quotes: [],
    totalUsdValue: 0,
    error: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  const getBatchQuotes = useCallback(async (
    quotes: Array<{ toToken: string; amount: number; fromToken?: string }>
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/quote', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotes: quotes.map(q => ({
            fromToken: q.fromToken || 'USDCx',
            toToken: q.toToken,
            amount: q.amount,
          })),
        }),
        signal: abortControllerRef.current.signal,
      })

      const data = await response.json()

      if (data.success && data.results) {
        const validQuotes = data.results.filter((r: QuoteResult | { error: string }) => !('error' in r)) as QuoteResult[]
        setState({
          isLoading: false,
          quotes: validQuotes,
          totalUsdValue: data.totalUsdValue || 0,
          error: null,
        })
        return validQuotes
      } else {
        setState({
          isLoading: false,
          quotes: [],
          totalUsdValue: 0,
          error: data.error || 'Failed to get quotes',
        })
        return []
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return []
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quotes'
      setState({
        isLoading: false,
        quotes: [],
        totalUsdValue: 0,
        error: errorMessage,
      })
      return []
    }
  }, [])

  // Get quotes for a strategy allocation
  const getStrategyQuotes = useCallback(async (
    amount: number,
    allocations: Record<string, number>
  ) => {
    const quotes = Object.entries(allocations)
      .filter(([, percentage]) => percentage && percentage > 0)
      .map(([token, percentage]) => {
        // Normalize token symbol (sbtc -> sBTC, ststx -> stSTX, etc.)
        const tokenSymbol = normalizeTokenSymbol(token)
        return {
          toToken: tokenSymbol,
          amount: (amount * percentage) / 100,
        }
      })

    return getBatchQuotes(quotes)
  }, [getBatchQuotes])

  // Get reverse quotes for selling (token -> USDCx)
  const getBatchReverseQuotes = useCallback(async (
    tokens: Array<{ symbol: string; amount: number }>
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const promises = tokens.map(async ({ symbol, amount }) => {
        const response = await fetch(`/api/quote?fromToken=${symbol}&amount=${amount}`)
        const data = await response.json()
        return data.success ? data.quote : null
      })

      const results = await Promise.all(promises)
      const validQuotes = results.filter((q): q is QuoteResult => q !== null)
      const totalUsdValue = validQuotes.reduce((sum, q) => sum + q.usdValue, 0)

      setState({
        isLoading: false,
        quotes: validQuotes,
        totalUsdValue,
        error: null,
      })

      return validQuotes
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quotes'
      setState({
        isLoading: false,
        quotes: [],
        totalUsdValue: 0,
        error: errorMessage,
      })
      return []
    }
  }, [])

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setState({ isLoading: false, quotes: [], totalUsdValue: 0, error: null })
  }, [])

  return {
    ...state,
    getBatchQuotes,
    getStrategyQuotes,
    getBatchReverseQuotes,
    reset,
  }
}

// Prices hook - uses global store for caching
export function usePrices() {
  const [state, setState] = useState<UsePricesState>({
    isLoading: false,
    prices: {},
    error: null,
  })

  const fetchPrices = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/prices')
      const data = await response.json()

      if (data && typeof data === 'object' && !data.error) {
        setState({ isLoading: false, prices: data, error: null })
        return data
      } else {
        setState({ isLoading: false, prices: {}, error: data.error || 'Failed to fetch prices' })
        return {}
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch prices'
      setState({ isLoading: false, prices: {}, error: errorMessage })
      return {}
    }
  }, [])

  // Fetch prices on mount in background (non-blocking)
  useEffect(() => {
    // Use requestIdleCallback or setTimeout to defer the fetch
    const timeoutId = setTimeout(() => {
      fetchPrices()
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [fetchPrices])

  // Get USD value for a token amount
  const getUsdValue = useCallback((symbol: string, amount: number): number => {
    const price = state.prices[symbol]?.price || 0
    return amount * price
  }, [state.prices])

  return {
    ...state,
    fetchPrices,
    getUsdValue,
  }
}
