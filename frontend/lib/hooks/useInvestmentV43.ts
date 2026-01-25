/**
 * useInvestmentV43 - Simple STX-only investment hook
 *
 * V43: Uses swap-helper-a with principal tuples (confirmed working)
 * - All strategies convert to 100% STX for now
 * - Simple 2-hop swap: USDCx -> aeUSDC -> STX
 */

import { useState, useCallback } from 'react'
import {
  openContractCall,
  ContractCallOptions,
} from '@stacks/connect'
import {
  uintCV,
  PostConditionMode,
} from '@stacks/transactions'
import {
  STACKS_INDEX_CONTRACT,
  STRATEGY_ALLOCATIONS,
  CONTRACT_CONSTANTS,
  toMicroUnits,
  fromMicroUnits,
} from '@/lib/stacks/contract'

export interface InvestmentParams {
  amount: number
  strategyId: number
  senderAddress: string
  onSuccess?: (txId: string) => void
  onError?: (error: Error) => void
  onCancel?: () => void
}

export interface QuoteResult {
  tokenSymbol: string
  amm: string
  amountIn: number
  estimatedAmountOut: number
  priceImpact?: number
}

export interface InvestmentState {
  isLoading: boolean
  isGettingQuotes: boolean
  quotes: QuoteResult[]
  error: string | null
  txId: string | null
}

// =====================
// HELPER FUNCTIONS
// =====================

const C32_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

function isValidStacksAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false
  if (!address.startsWith('SP') && !address.startsWith('SM') && !address.startsWith('ST')) return false
  if (address.length < 39 || address.length > 42) return false
  for (let i = 2; i < address.length; i++) {
    if (!C32_CHARS.includes(address[i])) return false
  }
  return true
}

// =====================
// QUOTE FUNCTIONS
// =====================

async function getQuote(tokenSymbol: string, amount: number): Promise<QuoteResult | null> {
  if (amount <= 0) return null

  try {
    const response = await fetch('/api/bitflow/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenSymbol: 'STX', amount, slippageTolerance: 0.05 }),
    })
    const data = await response.json()

    if (data.success && data.executionParams) {
      return {
        tokenSymbol: 'STX',
        amm: 'bitflow',
        amountIn: amount,
        estimatedAmountOut: parseInt(data.executionParams.minReceived) || 0,
      }
    }

    // Fallback estimate (roughly 3 STX per 1 USDC)
    return {
      tokenSymbol: 'STX',
      amm: 'bitflow',
      amountIn: amount,
      estimatedAmountOut: Math.floor(amount * 3 * 0.97),
    }
  } catch (error) {
    console.error(`Failed to get quote:`, error)
    return {
      tokenSymbol: 'STX',
      amm: 'bitflow',
      amountIn: amount,
      estimatedAmountOut: Math.floor(amount * 3 * 0.95),
    }
  }
}

// =====================
// MAIN HOOK
// =====================

export function useInvestmentV43() {
  const [state, setState] = useState<InvestmentState>({
    isLoading: false,
    isGettingQuotes: false,
    quotes: [],
    error: null,
    txId: null,
  })

  const getQuotes = useCallback(async (amount: number, strategyId: number) => {
    if (amount <= 0) {
      setState(prev => ({ ...prev, quotes: [], error: null }))
      return
    }

    setState(prev => ({ ...prev, isGettingQuotes: true, error: null }))

    try {
      // V43: All strategies convert to STX for now
      const quote = await getQuote('STX', amount)
      const quotes = quote ? [quote] : []
      setState(prev => ({ ...prev, quotes, isGettingQuotes: false }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGettingQuotes: false,
        error: error instanceof Error ? error.message : 'Failed to get quotes',
      }))
    }
  }, [])

  const invest = useCallback(async ({
    amount,
    strategyId,
    senderAddress,
    onSuccess,
    onError,
    onCancel,
  }: InvestmentParams) => {
    const microAmount = toMicroUnits(amount)

    if (microAmount < CONTRACT_CONSTANTS.MIN_INVESTMENT) {
      const error = new Error(`Minimum investment is ${fromMicroUnits(CONTRACT_CONSTANTS.MIN_INVESTMENT)} USDCx`)
      setState(prev => ({ ...prev, error: error.message }))
      onError?.(error)
      return
    }

    if (!senderAddress || !isValidStacksAddress(senderAddress)) {
      const error = new Error(`Invalid sender address: ${senderAddress}`)
      setState(prev => ({ ...prev, error: error.message }))
      onError?.(error)
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, txId: null }))

    try {
      const strategy = STRATEGY_ALLOCATIONS[strategyId]
      if (!strategy) throw new Error('Invalid strategy')

      // V43: All strategies use invest-stx (100% STX)
      // Calculate min output (3% slippage)
      const minStxOut = Math.floor(microAmount * 3 * 0.97) // Rough estimate: 3 STX per 1 USDC

      console.log('V43 Investment:', {
        total: amount,
        microAmount,
        strategy: strategy.name,
        functionName: 'invest-stx',
        minStxOut,
      })

      const txOptions: ContractCallOptions = {
        contractAddress: STACKS_INDEX_CONTRACT.address,
        contractName: STACKS_INDEX_CONTRACT.name,
        functionName: 'invest-stx',
        functionArgs: [
          uintCV(microAmount),      // usdcx-amount
          uintCV(minStxOut),        // min-stx-out
        ],
        network: 'mainnet',
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          const txId = 'txId' in data ? data.txId : ''
          setState(prev => ({ ...prev, isLoading: false, txId }))
          onSuccess?.(txId)
        },
        onCancel: () => {
          setState(prev => ({ ...prev, isLoading: false }))
          onCancel?.()
        },
      } as ContractCallOptions

      console.log('V43 Contract call:', {
        contract: `${STACKS_INDEX_CONTRACT.address}.${STACKS_INDEX_CONTRACT.name}`,
        function: 'invest-stx',
        args: ['usdcx-amount', 'min-stx-out'],
      })

      await openContractCall(txOptions)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Investment failed'
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
      isGettingQuotes: false,
      quotes: [],
      error: null,
      txId: null,
    })
  }, [])

  return {
    ...state,
    getQuotes,
    invest,
    clearError,
    reset,
  }
}

export function useContractStats() {
  const [stats, setStats] = useState<{
    totalInvestments: number
    totalVolume: number
    isPaused: boolean
    platformFeeBp: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    try {
      setStats({
        totalInvestments: 0,
        totalVolume: 0,
        isPaused: false,
        platformFeeBp: 0,
      })
    } catch (error) {
      console.error('Failed to fetch contract stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { stats, isLoading, fetchStats }
}
