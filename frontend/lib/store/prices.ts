import { create } from 'zustand'

export interface TokenPrice {
  symbol: string
  price: number
  change24h: number
}

interface PriceState {
  prices: Record<string, TokenPrice>
  lastUpdated: number | null
  isLoading: boolean
  error: string | null
  setPrices: (prices: Record<string, TokenPrice>) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export const usePriceStore = create<PriceState>((set) => ({
  prices: {},
  lastUpdated: null,
  isLoading: false,
  error: null,
  setPrices: (prices) =>
    set({ prices, lastUpdated: Date.now(), error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))

export async function fetchPrices(): Promise<Record<string, TokenPrice>> {
  const response = await fetch('/api/prices')
  if (!response.ok) {
    throw new Error('Failed to fetch prices')
  }
  return response.json()
}
