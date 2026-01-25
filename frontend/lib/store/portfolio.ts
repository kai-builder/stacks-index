import { create } from 'zustand'

export interface Holding {
  symbol: string
  amount: number
  value: number
  allocation: number
}

interface PortfolioState {
  totalValue: number
  totalCost: number
  holdings: Holding[]
  isLoading: boolean
  setPortfolio: (totalValue: number, totalCost: number, holdings: Holding[]) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  totalValue: 0,
  totalCost: 0,
  holdings: [],
  isLoading: false,
  setPortfolio: (totalValue, totalCost, holdings) =>
    set({ totalValue, totalCost, holdings }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ totalValue: 0, totalCost: 0, holdings: [] }),
}))

export function calculatePnL(totalValue: number, totalCost: number): {
  amount: number
  percentage: number
} {
  const amount = totalValue - totalCost
  const percentage = totalCost > 0 ? (amount / totalCost) * 100 : 0
  return { amount, percentage }
}
