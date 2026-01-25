/**
 * useUserStats - Hook for fetching user investment stats from the contract
 *
 * Calls the /api/user-stats endpoint which queries:
 * - get-user-stats: Returns { total-invested, total-withdrawn, invest-count, sell-count }
 * - get-user-pnl: Returns { invested, withdrawn, profit, loss, is-profit }
 */

import { useState, useCallback, useEffect } from 'react'
import { fromMicroUnits } from '@/lib/stacks/contract'

export interface UserStats {
  totalInvested: number      // Total USDCx invested (in micro units)
  totalWithdrawn: number     // Total USDCx withdrawn (in micro units)
  investCount: number        // Number of investments
  sellCount: number          // Number of sells
}

export interface UserPnL {
  invested: number           // Total invested (micro)
  withdrawn: number          // Total withdrawn (micro)
  profit: number             // Profit amount (micro) - only if profitable
  loss: number               // Loss amount (micro) - only if in loss
  isProfit: boolean          // true if withdrawn > invested
}

export interface UserStatsState {
  stats: UserStats | null
  pnl: UserPnL | null
  isLoading: boolean
  error: string | null
}

export function useUserStats(address: string | null, network: 'mainnet' | 'testnet' = 'mainnet') {
  const [state, setState] = useState<UserStatsState>({
    stats: null,
    pnl: null,
    isLoading: true, // Start with loading true until we know if there's an address
    error: null,
  })

  const fetchStats = useCallback(async () => {
    // Don't fetch if no address - just clear loading state
    if (!address) {
      setState({ stats: null, pnl: null, isLoading: false, error: null })
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/user-stats?address=${address}&network=${network}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch: ${response.status}`)
      }

      const data = await response.json()

      setState({
        stats: data.stats,
        pnl: data.pnl,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      }))
    }
  }, [address, network])

  // Auto-fetch when address becomes available
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Computed values in human-readable units (USDCx has 6 decimals)
  const formattedStats = state.stats ? {
    totalInvested: fromMicroUnits(state.stats.totalInvested),
    totalWithdrawn: fromMicroUnits(state.stats.totalWithdrawn),
    investCount: state.stats.investCount,
    sellCount: state.stats.sellCount,
  } : null

  const formattedPnL = state.pnl ? {
    invested: fromMicroUnits(state.pnl.invested),
    withdrawn: fromMicroUnits(state.pnl.withdrawn),
    profit: fromMicroUnits(state.pnl.profit),
    loss: fromMicroUnits(state.pnl.loss),
    isProfit: state.pnl.isProfit,
    profitPercent: state.pnl.invested > 0
      ? ((state.pnl.withdrawn - state.pnl.invested) / state.pnl.invested) * 100
      : 0,
  } : null

  return {
    ...state,
    formattedStats,
    formattedPnL,
    refetch: fetchStats,
  }
}
