/**
 * useSell - Hook for selling portfolio tokens back to USDCx
 *
 * V44: Uses stacks-index-oneclick-v44 contract sell-portfolio function
 * - Single transaction to sell all tokens at once
 * - Supports: STX, sBTC, stSTX, WELSH, LEO, DOG, DROID, USDH
 * - Contract uses hardcoded routes from Bitflow AMM
 */

import { useState, useCallback } from 'react'
import type { ContractCallOptions } from '@stacks/connect'
import type { ClarityValue } from '@stacks/transactions'
import {
  STACKS_INDEX_CONTRACT,
  toMicroUnits,
  fromMicroUnits,
} from '@/lib/stacks/contract'
import { getAccountBalances } from '@/lib/api/hiro'

export interface TokenBalance {
  symbol: string
  contract: string
  balance: number
  balanceMicro: string
  decimals: number
  usdValue?: number
}

export interface SellParams {
  percentage: number // 20, 50, or 100
  tokens: TokenBalance[]
  senderAddress: string
  onSuccess?: (txId: string) => void
  onError?: (error: Error) => void
  onCancel?: () => void
}

export interface SellState {
  isLoading: boolean
  isFetchingBalances: boolean
  balances: TokenBalance[]
  totalValue: number
  error: string | null
  txId: string | null
}

// Supported tokens for selling (V44)
const SUPPORTED_TOKENS = [
  { symbol: 'STX', contract: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-2', decimals: 6 },
  { symbol: 'sBTC', contract: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token', decimals: 8 },
  { symbol: 'stSTX', contract: 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token', decimals: 6 },
  { symbol: 'WELSH', contract: 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token', decimals: 6 },
  { symbol: 'LEO', contract: 'SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6.leo-token', decimals: 6 },
  { symbol: 'DOG', contract: 'SP14NS8MVBRHXMM96BQY0727AJ59SWPV7RMHC0NCG.pontis-bridge-DOG', decimals: 8 },
  { symbol: 'DROID', contract: 'SP2EEV5QBZA454MSMW9W3WJNRXVJF36VPV17FFKYH.DROID', decimals: 6 },
  { symbol: 'USDH', contract: 'SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.usdh-token-v1', decimals: 8 },
  { symbol: 'ALEX', contract: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex', decimals: 8 },
  { symbol: 'VELAR', contract: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.velar-token', decimals: 8 },
]

// =====================
// SELL ARG BUILDER (V44)
// Contract uses hardcoded routes, so we only pass amounts and min-out values
// All min-out values are hardcoded to 1 for testing
// =====================

interface SellAmounts {
  stx: number
  sbtc: number
  ststx: number
  welsh: number
  leo: number
  dog: number
  droid: number
  usdh: number
  alex: number
  velar: number
}

type UIntCV = typeof import('@stacks/transactions').uintCV

function buildSellPortfolioArgs(amounts: SellAmounts, uintCV: UIntCV): ClarityValue[] {
  return [
    // STX params
    uintCV(toMicroUnits(amounts.stx)),     // stx-amount
    uintCV(1),                              // stx-min-out
    // sBTC params
    uintCV(toMicroUnits(amounts.sbtc, 8)), // sbtc-amount
    uintCV(1),                              // sbtc-min-out
    // stSTX params (two-step)
    uintCV(toMicroUnits(amounts.ststx)),   // ststx-amount
    uintCV(1),                              // ststx-stx-min-out
    uintCV(1),                              // ststx-usdcx-min-out
    // WELSH params
    uintCV(toMicroUnits(amounts.welsh)),   // welsh-amount
    uintCV(1),                              // welsh-min-out
    // LEO params
    uintCV(toMicroUnits(amounts.leo)),     // leo-amount
    uintCV(1),                              // leo-min-out
    // DOG params
    uintCV(toMicroUnits(amounts.dog, 8)),  // dog-amount
    uintCV(1),                              // dog-min-out
    // DROID params
    uintCV(toMicroUnits(amounts.droid)),   // droid-amount
    uintCV(1),                              // droid-min-out
    // USDH params
    uintCV(toMicroUnits(amounts.usdh, 8)), // usdh-amount
    uintCV(1),                              // usdh-min-out
    // ALEX params (two-step)
    uintCV(toMicroUnits(amounts.alex, 8)), // alex-amount
    uintCV(1),                              // alex-stx-min-out
    uintCV(1),                              // alex-usdcx-min-out
    // VELAR params (two-step)
    uintCV(toMicroUnits(amounts.velar, 8)), // velar-amount
    uintCV(1),                               // velar-stx-min-out
    uintCV(1),                               // velar-usdcx-min-out
  ]
}

// =====================
// MAIN HOOK
// =====================

export function useSell() {
  const [state, setState] = useState<SellState>({
    isLoading: false,
    isFetchingBalances: false,
    balances: [],
    totalValue: 0,
    error: null,
    txId: null,
  })

  const fetchBalances = useCallback(async (address: string) => {
    if (!address) return

    setState(prev => ({ ...prev, isFetchingBalances: true, error: null }))

    try {
      const data = await getAccountBalances(address, { network: 'mainnet' })

      const fungibleTokens = data.fungible_tokens || {}
      const balances: TokenBalance[] = []

      for (const token of SUPPORTED_TOKENS) {
        let balance = '0'
        for (const [key, value] of Object.entries(fungibleTokens)) {
          if (key.startsWith(token.contract)) {
            balance = (value as { balance: string }).balance || '0'
            break
          }
        }

        const balanceNum = fromMicroUnits(parseInt(balance), token.decimals)
        if (balanceNum > 0) {
          balances.push({
            symbol: token.symbol,
            contract: token.contract,
            balance: balanceNum,
            balanceMicro: balance,
            decimals: token.decimals,
          })
        }
      }

      // Also check native STX
      const stxBalance = data.stx?.balance || '0'
      const stxNum = fromMicroUnits(parseInt(stxBalance), 6)
      if (stxNum > 0) {
        const existingStx = balances.find(b => b.symbol === 'STX')
        if (!existingStx) {
          balances.unshift({
            symbol: 'STX',
            contract: 'native',
            balance: stxNum,
            balanceMicro: stxBalance,
            decimals: 6,
          })
        }
      }

      setState(prev => ({
        ...prev,
        balances,
        isFetchingBalances: false,
      }))
    } catch (error) {
      console.error('Failed to fetch balances:', error)
      setState(prev => ({
        ...prev,
        isFetchingBalances: false,
        error: 'Failed to fetch balances',
      }))
    }
  }, [])

  const sell = useCallback(async ({
    percentage,
    tokens,
    senderAddress,
    onSuccess,
    onError,
    onCancel,
  }: SellParams) => {
    if (!senderAddress) {
      const error = new Error('Wallet not connected')
      setState(prev => ({ ...prev, error: error.message }))
      onError?.(error)
      return
    }

    if (tokens.length === 0) {
      const error = new Error('No tokens to sell')
      setState(prev => ({ ...prev, error: error.message }))
      onError?.(error)
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, txId: null }))

    try {
      const [{ openContractCall }, { uintCV, PostConditionMode }] = await Promise.all([
        import('@stacks/connect'),
        import('@stacks/transactions'),
      ])

      // Calculate sell amounts for each token
      const amounts: SellAmounts = {
        stx: 0,
        sbtc: 0,
        ststx: 0,
        welsh: 0,
        leo: 0,
        dog: 0,
        droid: 0,
        usdh: 0,
        alex: 0,
        velar: 0,
      }

      for (const token of tokens) {
        const sellAmount = (token.balance * percentage) / 100
        if (sellAmount <= 0) continue

        switch (token.symbol) {
          case 'STX':
            amounts.stx = sellAmount
            break
          case 'sBTC':
            amounts.sbtc = sellAmount
            break
          case 'stSTX':
            amounts.ststx = sellAmount
            break
          case 'WELSH':
            amounts.welsh = sellAmount
            break
          case 'LEO':
            amounts.leo = sellAmount
            break
          case 'DOG':
            amounts.dog = sellAmount
            break
          case 'DROID':
            amounts.droid = sellAmount
            break
          case 'USDH':
            amounts.usdh = sellAmount
            break
          case 'ALEX':
            amounts.alex = sellAmount
            break
          case 'VELAR':
            amounts.velar = sellAmount
            break
          default:
            console.log(`Sell not supported for ${token.symbol} in V44`)
        }
      }

      // Check if there's anything to sell
      const hasTokensToSell = Object.values(amounts).some(a => a > 0)
      if (!hasTokensToSell) {
        throw new Error('No supported tokens to sell')
      }

      console.log('Selling portfolio:', amounts)

      // Build args for sell-portfolio function
      const functionArgs = buildSellPortfolioArgs(amounts, uintCV)

      // Execute single transaction
      const txOptions = {
        contractAddress: STACKS_INDEX_CONTRACT.address,
        contractName: STACKS_INDEX_CONTRACT.name,
        functionName: 'sell-portfolio',
        functionArgs,
        network: 'mainnet',
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data: { txId: string }) => {
          console.log(`Sell portfolio completed: ${data.txId}`)
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
      const errorMessage = error instanceof Error ? error.message : 'Sell failed'
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
      isFetchingBalances: false,
      balances: [],
      totalValue: 0,
      error: null,
      txId: null,
    })
  }, [])

  return {
    ...state,
    fetchBalances,
    sell,
    clearError,
    reset,
  }
}
