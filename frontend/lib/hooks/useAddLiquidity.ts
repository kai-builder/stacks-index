/**
 * useAddLiquidity - Hook for adding liquidity to Bitflow pools
 *
 * Supports:
 * - STX/sBTC pool on Bitflow
 *
 * Contract: SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-core-v-1-2
 * Function: add-liquidity
 */

import { useState, useCallback } from 'react'
import type { ContractCallOptions } from '@stacks/connect'

// Bitflow contracts
export const BITFLOW_CONTRACTS = {
  xykCore: {
    address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
    name: 'xyk-core-v-1-2',
  },
  stableswapCore: {
    address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
    name: 'stableswap-core-v-1-4',
  },
}

// Supported LP pools
export const LP_POOLS = {
  'STX-sBTC': {
    id: 'stx-sbtc',
    name: 'STX/sBTC',
    contract: BITFLOW_CONTRACTS.xykCore,
    poolTrait: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-stx-v-1-1',
    type: 'xyk', // xyk pool - only needs x-amount
    xToken: {
      symbol: 'sBTC',
      trait: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
      decimals: 8,
    },
    yToken: {
      symbol: 'STX',
      trait: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-2',
      decimals: 6,
    },
  },
  'STX-stSTX': {
    id: 'stx-ststx',
    name: 'STX/stSTX',
    contract: BITFLOW_CONTRACTS.stableswapCore,
    poolTrait: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.stableswap-pool-stx-ststx-v-1-4',
    type: 'stableswap', // stableswap pool - needs both x-amount and y-amount
    xToken: {
      symbol: 'STX',
      trait: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-2',
      decimals: 6,
    },
    yToken: {
      symbol: 'stSTX',
      trait: 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token',
      decimals: 6,
    },
  },
}

export type PoolId = keyof typeof LP_POOLS

export interface AddLiquidityParams {
  poolId: PoolId
  xAmount: number // Amount of x token (human readable)
  yAmount?: number // Amount of y token (human readable) - required for stableswap pools
  minDlp?: number // Minimum LP tokens to receive (defaults to 1)
  senderAddress: string
  onSuccess?: (txId: string) => void
  onError?: (error: Error) => void
  onCancel?: () => void
}

export interface AddLiquidityState {
  isLoading: boolean
  error: string | null
  txId: string | null
}

function toMicroUnits(amount: number, decimals: number = 6): number {
  return Math.floor(amount * Math.pow(10, decimals))
}

export function useAddLiquidity() {
  const [state, setState] = useState<AddLiquidityState>({
    isLoading: false,
    error: null,
    txId: null,
  })

  const addLiquidity = useCallback(async ({
    poolId,
    xAmount,
    yAmount,
    minDlp = 1,
    senderAddress,
    onSuccess,
    onError,
    onCancel,
  }: AddLiquidityParams) => {
    if (!senderAddress) {
      const error = new Error('Wallet not connected')
      setState(prev => ({ ...prev, error: error.message }))
      onError?.(error)
      return
    }

    const pool = LP_POOLS[poolId]
    if (!pool) {
      const error = new Error(`Unknown pool: ${poolId}`)
      setState(prev => ({ ...prev, error: error.message }))
      onError?.(error)
      return
    }

    if (xAmount <= 0) {
      const error = new Error('Amount must be greater than 0')
      setState(prev => ({ ...prev, error: error.message }))
      onError?.(error)
      return
    }

    // Stableswap pools require y-amount
    if (pool.type === 'stableswap' && (!yAmount || yAmount <= 0)) {
      const error = new Error('Both token amounts are required for stableswap pools')
      setState(prev => ({ ...prev, error: error.message }))
      onError?.(error)
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, txId: null }))

    try {
      const [{ openContractCall }, { uintCV, contractPrincipalCV, PostConditionMode }] = await Promise.all([
        import('@stacks/connect'),
        import('@stacks/transactions'),
      ])

      // Parse contract principals
      const [poolAddress, poolName] = pool.poolTrait.split('.')
      const [xTokenAddress, xTokenName] = pool.xToken.trait.split('.')
      const [yTokenAddress, yTokenName] = pool.yToken.trait.split('.')

      // Convert to micro units
      const xAmountMicro = toMicroUnits(xAmount, pool.xToken.decimals)
      const yAmountMicro = yAmount ? toMicroUnits(yAmount, pool.yToken.decimals) : 0

      console.log('Adding liquidity:', {
        pool: poolId,
        poolType: pool.type,
        xAmount: xAmountMicro,
        yAmount: yAmountMicro,
        minDlp,
      })

      // Build function arguments based on pool type
      let functionArgs
      if (pool.type === 'stableswap') {
        // stableswap: add-liquidity(pool-trait, x-token-trait, y-token-trait, x-amount, y-amount, min-dlp)
        functionArgs = [
          contractPrincipalCV(poolAddress, poolName),
          contractPrincipalCV(xTokenAddress, xTokenName),
          contractPrincipalCV(yTokenAddress, yTokenName),
          uintCV(xAmountMicro),
          uintCV(yAmountMicro),
          uintCV(minDlp),
        ]
      } else {
        // xyk: add-liquidity(pool-trait, x-token-trait, y-token-trait, x-amount, min-dlp)
        functionArgs = [
          contractPrincipalCV(poolAddress, poolName),
          contractPrincipalCV(xTokenAddress, xTokenName),
          contractPrincipalCV(yTokenAddress, yTokenName),
          uintCV(xAmountMicro),
          uintCV(minDlp),
        ]
      }

      const txOptions = {
        contractAddress: pool.contract.address,
        contractName: pool.contract.name,
        functionName: 'add-liquidity',
        functionArgs,
        network: 'mainnet',
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data: { txId: string }) => {
          console.log(`Add liquidity completed: ${data.txId}`)
          setState(prev => ({ ...prev, isLoading: false, txId: data.txId }))
          onSuccess?.(data.txId)
        },
        onCancel: () => {
          setState(prev => ({ ...prev, isLoading: false }))
          onCancel?.()
        },
      } as ContractCallOptions

      await openContractCall(txOptions)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Add liquidity failed'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      txId: null,
    })
  }, [])

  return {
    ...state,
    addLiquidity,
    clearError,
    reset,
  }
}
