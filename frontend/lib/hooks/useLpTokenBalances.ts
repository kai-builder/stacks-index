/**
 * useLpTokenBalances - Hook to detect LP pool tokens from wallet balances
 *
 * Detects LP tokens for:
 * - STX/sBTC (XYK pool)
 * - STX/stSTX (Stableswap pool)
 */

import { useState, useCallback } from 'react'
import { getAccountBalances } from '@/lib/api/hiro'
import { LP_POOLS, PoolId } from './useAddLiquidity'

// LP Pool token contracts
const LP_TOKEN_CONTRACTS: Record<PoolId, {
  contract: string
  poolName: string
  xTokenSymbol: string
  yTokenSymbol: string
  poolType: 'xyk' | 'stableswap'
  decimals: number
}> = {
  'STX-sBTC': {
    contract: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-stx-v-1-1',
    poolName: 'sBTC/STX',
    xTokenSymbol: 'sBTC',
    yTokenSymbol: 'STX',
    poolType: 'xyk',
    decimals: 6,
  },
  'STX-stSTX': {
    contract: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.stableswap-pool-stx-ststx-v-1-4',
    poolName: 'STX/stSTX',
    xTokenSymbol: 'STX',
    yTokenSymbol: 'stSTX',
    poolType: 'stableswap',
    decimals: 6,
  },
}

export interface LpTokenBalance {
  poolId: PoolId
  poolContract: string
  poolName: string
  xTokenSymbol: string
  yTokenSymbol: string
  poolType: 'xyk' | 'stableswap'
  lpTokenBalance: number // Human readable
  lpTokenBalanceMicro: string
}

export interface LpTokenBalancesState {
  isLoading: boolean
  lpTokens: LpTokenBalance[]
  error: string | null
}

function fromMicroUnits(amount: number | string, decimals: number = 6): number {
  const value = typeof amount === 'string' ? parseInt(amount) : amount
  return value / Math.pow(10, decimals)
}

export function useLpTokenBalances() {
  const [state, setState] = useState<LpTokenBalancesState>({
    isLoading: false,
    lpTokens: [],
    error: null,
  })

  const fetchLpTokenBalances = useCallback(async (address: string) => {
    if (!address) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const data = await getAccountBalances(address, { network: 'mainnet' })
      const fungibleTokens = data.fungible_tokens || {}

      const lpTokens: LpTokenBalance[] = []

      // Check each LP pool token
      for (const [poolId, poolInfo] of Object.entries(LP_TOKEN_CONTRACTS)) {
        for (const [tokenKey, tokenValue] of Object.entries(fungibleTokens)) {
          // Match by contract address (the key includes ::token-name suffix)
          if (tokenKey.startsWith(poolInfo.contract)) {
            const balance = (tokenValue as { balance: string }).balance || '0'
            const balanceNum = fromMicroUnits(balance, poolInfo.decimals)

            if (balanceNum > 0) {
              lpTokens.push({
                poolId: poolId as PoolId,
                poolContract: poolInfo.contract,
                poolName: poolInfo.poolName,
                xTokenSymbol: poolInfo.xTokenSymbol,
                yTokenSymbol: poolInfo.yTokenSymbol,
                poolType: poolInfo.poolType,
                lpTokenBalance: balanceNum,
                lpTokenBalanceMicro: balance,
              })
            }
            break
          }
        }
      }

      setState({
        isLoading: false,
        lpTokens,
        error: null,
      })
    } catch (error) {
      console.error('Failed to fetch LP token balances:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch LP token balances',
      }))
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      lpTokens: [],
      error: null,
    })
  }, [])

  return {
    ...state,
    fetchLpTokenBalances,
    reset,
  }
}
