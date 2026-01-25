/**
 * useRemoveLiquidity - Hook for removing liquidity from Bitflow pools
 *
 * Supports:
 * - STX/sBTC pool (XYK)
 * - STX/stSTX pool (Stableswap)
 *
 * XYK: remove-liquidity on xyk-core-v-1-2
 * Stableswap: withdraw-proportional-liquidity on stableswap-core-v-1-4
 */

import { useState, useCallback } from 'react'
import type { ContractCallOptions } from '@stacks/connect'
import { BITFLOW_CONTRACTS, LP_POOLS, PoolId } from './useAddLiquidity'

export interface RemoveLiquidityParams {
  poolId: PoolId
  lpAmount: number // Amount of LP tokens to burn (human readable based on LP decimals)
  senderAddress: string
  onSuccess?: (txId: string) => void
  onError?: (error: Error) => void
  onCancel?: () => void
}

export interface RemoveLiquidityState {
  isLoading: boolean
  error: string | null
  txId: string | null
}

// LP tokens typically have 6 decimals
const LP_DECIMALS = 6

function toMicroUnits(amount: number, decimals: number = 6): number {
  return Math.floor(amount * Math.pow(10, decimals))
}

export function useRemoveLiquidity() {
  const [state, setState] = useState<RemoveLiquidityState>({
    isLoading: false,
    error: null,
    txId: null,
  })

  const removeLiquidity = useCallback(async ({
    poolId,
    lpAmount,
    senderAddress,
    onSuccess,
    onError,
    onCancel,
  }: RemoveLiquidityParams) => {
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

    if (lpAmount <= 0) {
      const error = new Error('LP amount must be greater than 0')
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

      // Convert LP amount to micro units
      const lpAmountMicro = toMicroUnits(lpAmount, LP_DECIMALS)
      // Use raw micro units for min amounts (u1 for testing/max slippage tolerance)
      const minXAmountMicro = 1
      const minYAmountMicro = 1

      console.log('Removing liquidity:', {
        pool: poolId,
        poolType: pool.type,
        lpAmount: lpAmountMicro,
        minXAmount: minXAmountMicro,
        minYAmount: minYAmountMicro,
      })

      // Build function arguments based on pool type
      let functionName: string
      let functionArgs

      if (pool.type === 'stableswap') {
        // stableswap: withdraw-proportional-liquidity(pool-trait, x-token-trait, y-token-trait, amount, min-x-amount, min-y-amount)
        functionName = 'withdraw-proportional-liquidity'
        functionArgs = [
          contractPrincipalCV(poolAddress, poolName),
          contractPrincipalCV(xTokenAddress, xTokenName),
          contractPrincipalCV(yTokenAddress, yTokenName),
          uintCV(lpAmountMicro),
          uintCV(minXAmountMicro),
          uintCV(minYAmountMicro),
        ]
      } else {
        // xyk: remove-liquidity(pool-trait, x-token-trait, y-token-trait, amount, min-x-amount, min-y-amount)
        functionName = 'remove-liquidity'
        functionArgs = [
          contractPrincipalCV(poolAddress, poolName),
          contractPrincipalCV(xTokenAddress, xTokenName),
          contractPrincipalCV(yTokenAddress, yTokenName),
          uintCV(lpAmountMicro),
          uintCV(minXAmountMicro),
          uintCV(minYAmountMicro),
        ]
      }

      const txOptions = {
        contractAddress: pool.contract.address,
        contractName: pool.contract.name,
        functionName,
        functionArgs,
        network: 'mainnet',
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data: { txId: string }) => {
          console.log(`Remove liquidity completed: ${data.txId}`)
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
      const errorMessage = error instanceof Error ? error.message : 'Remove liquidity failed'
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
    removeLiquidity,
    clearError,
    reset,
  }
}
