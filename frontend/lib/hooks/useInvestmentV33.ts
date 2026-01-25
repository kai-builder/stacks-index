/**
 * useInvestmentV33 - Multi-AMM investment hook with 1-click UX
 *
 * V33: Combined contract functions for single-transaction execution
 * - Bitflow: STX (2-hop), sBTC (3-hop), DOG (4-hop), USDH (stableswap)
 * - Bitflow-Velar: WELSH, LEO via router-xyk-velar (STX -> aeUSDC -> meme)
 *
 * All swaps in a strategy execute in ONE transaction.
 */

import { useState, useCallback } from 'react'
import {
  openContractCall,
  ContractCallOptions,
} from '@stacks/connect'
import {
  uintCV,
  contractPrincipalCV,
  boolCV,
  noneCV,
  PostConditionMode,
  ClarityValue,
} from '@stacks/transactions'
import {
  STACKS_INDEX_CONTRACT,
  STRATEGY_ALLOCATIONS,
  CONTRACT_CONSTANTS,
  STRATEGIES,
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
// CONTRACT ADDRESSES
// =====================

// Bitflow tokens
const BITFLOW_TOKENS = {
  USDCX: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
  AEUSDC: 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc',
  TOKEN_STX_V11: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-1',
  TOKEN_STX_V12: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-2',
  SBTC: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
  USDH: 'SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.usdh-token-v1',
  DOG: 'SP14NS8MVBRHXMM96BQY0727AJ59SWPV7RMHC0NCG.pontis-bridge-DOG',
}

// Bitflow pools
const BITFLOW_POOLS = {
  STABLESWAP_USDCX_AEUSDC: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.stableswap-pool-aeusdc-usdcx-v-1-1',
  XYK_STX_AEUSDC_V11: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-stx-aeusdc-v-1-1',
  XYK_STX_AEUSDC_V12: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-stx-aeusdc-v-1-2',
  XYK_SBTC_STX: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-stx-v-1-1',
  XYK_SBTC_DOG: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-dog-v-1-1',
  STABLESWAP_USDH_USDCX: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.stableswap-pool-usdh-usdcx-v-1-1',
}

// Velar tokens (used via router-xyk-velar)
const VELAR_TOKENS = {
  WELSH: 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token',
  LEO: 'SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6.leo-token',
}

// Velar pool IDs via Bitflow router-xyk-velar
const VELAR_POOL_IDS = {
  AEUSDC_WELSH: 10, // aeUSDC-WELSH pool on Velar
  AEUSDC_LEO: 11,   // aeUSDC-LEO pool on Velar (verify this)
}

const VELAR_SHARE_FEE_TO = 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.univ2-share-fee-to'

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

function parseContractPrincipal(principal: string): { address: string; name: string } {
  const [address, name] = principal.split('.')
  if (!address) throw new Error(`Invalid principal: ${principal}`)
  return { address, name: name || '' }
}

function buildContractPrincipalCV(principal: string): ClarityValue {
  const { address, name } = parseContractPrincipal(principal)
  if (!isValidStacksAddress(address)) {
    throw new Error(`Invalid Stacks address: ${principal}`)
  }
  return contractPrincipalCV(address, name)
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
      body: JSON.stringify({ tokenSymbol, amount, slippageTolerance: 0.05 }),
    })
    const data = await response.json()

    if (data.success && data.executionParams) {
      return {
        tokenSymbol,
        amm: data.executionParams.swapType || 'bitflow',
        amountIn: amount,
        estimatedAmountOut: parseInt(data.executionParams.minReceived) || 0,
      }
    }

    // Fallback estimate
    return {
      tokenSymbol,
      amm: 'bitflow',
      amountIn: amount,
      estimatedAmountOut: Math.floor(amount * 0.97),
    }
  } catch (error) {
    console.error(`Failed to get quote for ${tokenSymbol}:`, error)
    return {
      tokenSymbol,
      amm: 'bitflow',
      amountIn: amount,
      estimatedAmountOut: Math.floor(amount * 0.95),
    }
  }
}

async function getStrategyQuotes(usdcxAmount: number, strategyId: number): Promise<QuoteResult[]> {
  const strategy = STRATEGY_ALLOCATIONS[strategyId]
  if (!strategy) throw new Error('Invalid strategy')

  const { allocations } = strategy
  const quotes: QuoteResult[] = []

  const allocationMap: Record<string, string> = {
    stx: 'STX',
    sbtc: 'sBTC',
    dog: 'DOG',
    usdh: 'USDH',
    welsh: 'WELSH',
    leo: 'LEO',
  }

  const quotePromises: Promise<QuoteResult | null>[] = []

  for (const [key, value] of Object.entries(allocations)) {
    const percent = value as number | undefined
    if (percent && percent > 0) {
      const tokenSymbol = allocationMap[key]
      if (tokenSymbol) {
        const tokenAmount = (usdcxAmount * percent) / 100
        quotePromises.push(getQuote(tokenSymbol, tokenAmount))
      }
    }
  }

  const results = await Promise.all(quotePromises)
  for (const result of results) {
    if (result) quotes.push(result)
  }

  return quotes
}

// =====================
// ARG BUILDERS
// =====================

/**
 * Build base STX swap args (2-hop: USDCx -> aeUSDC -> STX)
 */
function buildStxSwapArgs(amount: number): ClarityValue[] {
  return [
    uintCV(toMicroUnits(amount)),
    uintCV(0), // min-out
    buildContractPrincipalCV(BITFLOW_TOKENS.USDCX),
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),
    buildContractPrincipalCV(BITFLOW_POOLS.STABLESWAP_USDCX_AEUSDC),
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),
    buildContractPrincipalCV(BITFLOW_TOKENS.TOKEN_STX_V12),
    buildContractPrincipalCV(BITFLOW_POOLS.XYK_STX_AEUSDC_V12),
  ]
}

/**
 * Build sBTC swap args (3-hop: USDCx -> aeUSDC -> STX -> sBTC)
 */
function buildSbtcSwapArgs(amount: number): ClarityValue[] {
  return [
    uintCV(toMicroUnits(amount)),
    uintCV(0), // min-out
    buildContractPrincipalCV(BITFLOW_TOKENS.USDCX),
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),
    buildContractPrincipalCV(BITFLOW_POOLS.STABLESWAP_USDCX_AEUSDC),
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),
    buildContractPrincipalCV(BITFLOW_TOKENS.TOKEN_STX_V12),
    buildContractPrincipalCV(BITFLOW_TOKENS.TOKEN_STX_V12),
    buildContractPrincipalCV(BITFLOW_TOKENS.SBTC),
    buildContractPrincipalCV(BITFLOW_POOLS.XYK_STX_AEUSDC_V12),
    buildContractPrincipalCV(BITFLOW_POOLS.XYK_SBTC_STX),
  ]
}

/**
 * Build DOG swap args (4-hop: USDCx -> aeUSDC -> STX -> sBTC -> DOG)
 */
function buildDogSwapArgs(amount: number): ClarityValue[] {
  return [
    uintCV(toMicroUnits(amount)),
    uintCV(0), // min-out
    buildContractPrincipalCV(BITFLOW_TOKENS.USDCX),
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),
    buildContractPrincipalCV(BITFLOW_POOLS.STABLESWAP_USDCX_AEUSDC),
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),
    buildContractPrincipalCV(BITFLOW_TOKENS.TOKEN_STX_V12),
    buildContractPrincipalCV(BITFLOW_TOKENS.TOKEN_STX_V12),
    buildContractPrincipalCV(BITFLOW_TOKENS.SBTC),
    buildContractPrincipalCV(BITFLOW_TOKENS.SBTC),
    buildContractPrincipalCV(BITFLOW_TOKENS.DOG),
    buildContractPrincipalCV(BITFLOW_POOLS.XYK_STX_AEUSDC_V12),
    buildContractPrincipalCV(BITFLOW_POOLS.XYK_SBTC_STX),
    buildContractPrincipalCV(BITFLOW_POOLS.XYK_SBTC_DOG),
  ]
}

/**
 * Build WELSH intermediate STX swap args + Velar args
 * Route: USDCx -> STX (2-hop) then STX -> WELSH (router-xyk-velar)
 */
function buildWelshSwapArgs(amount: number): ClarityValue[] {
  // First: USDCx -> STX params (2-hop)
  const stxArgs = [
    uintCV(toMicroUnits(amount)),  // welsh-stx-amount
    uintCV(0),                      // welsh-stx-min-out (will be actual STX amount)
    buildContractPrincipalCV(BITFLOW_TOKENS.USDCX),
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),
    buildContractPrincipalCV(BITFLOW_POOLS.STABLESWAP_USDCX_AEUSDC),
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),
    buildContractPrincipalCV(BITFLOW_TOKENS.TOKEN_STX_V12),
    buildContractPrincipalCV(BITFLOW_POOLS.XYK_STX_AEUSDC_V12),
  ]

  // Then: STX -> WELSH via router-xyk-velar params
  const velarArgs = [
    uintCV(0),                      // welsh-min-out
    buildContractPrincipalCV(BITFLOW_POOLS.XYK_STX_AEUSDC_V11), // xyk-pool (v1.1 for router-xyk-velar)
    buildContractPrincipalCV(BITFLOW_TOKENS.TOKEN_STX_V11),     // x-token
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),            // y-token
    uintCV(VELAR_POOL_IDS.AEUSDC_WELSH),                        // velar-pool-id
    buildContractPrincipalCV(VELAR_TOKENS.WELSH),               // velar-token0
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),            // velar-token1
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),            // velar-token-in
    buildContractPrincipalCV(VELAR_TOKENS.WELSH),               // velar-token-out
    buildContractPrincipalCV(VELAR_SHARE_FEE_TO),               // velar-share-fee-to
  ]

  return [...stxArgs, ...velarArgs]
}

/**
 * Build LEO intermediate STX swap args + Velar args
 */
function buildLeoSwapArgs(amount: number): ClarityValue[] {
  // First: USDCx -> STX params (2-hop)
  const stxArgs = [
    uintCV(toMicroUnits(amount)),
    uintCV(0),
    buildContractPrincipalCV(BITFLOW_TOKENS.USDCX),
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),
    buildContractPrincipalCV(BITFLOW_POOLS.STABLESWAP_USDCX_AEUSDC),
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),
    buildContractPrincipalCV(BITFLOW_TOKENS.TOKEN_STX_V12),
    buildContractPrincipalCV(BITFLOW_POOLS.XYK_STX_AEUSDC_V12),
  ]

  // Then: STX -> LEO via router-xyk-velar params
  const velarArgs = [
    uintCV(0),
    buildContractPrincipalCV(BITFLOW_POOLS.XYK_STX_AEUSDC_V11),
    buildContractPrincipalCV(BITFLOW_TOKENS.TOKEN_STX_V11),
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),
    uintCV(VELAR_POOL_IDS.AEUSDC_LEO),
    buildContractPrincipalCV(VELAR_TOKENS.LEO),
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),
    buildContractPrincipalCV(BITFLOW_TOKENS.AEUSDC),
    buildContractPrincipalCV(VELAR_TOKENS.LEO),
    buildContractPrincipalCV(VELAR_SHARE_FEE_TO),
  ]

  return [...stxArgs, ...velarArgs]
}

/**
 * Build invest-stx-sbtc args
 */
function buildInvestStxSbtcArgs(total: number, stxAmount: number, sbtcAmount: number): ClarityValue[] {
  return [
    uintCV(toMicroUnits(total)),
    ...buildStxSwapArgs(stxAmount),
    ...buildSbtcSwapArgs(sbtcAmount),
  ]
}

/**
 * Build invest-btc-maxi args
 */
function buildInvestBtcMaxiArgs(total: number, stxAmount: number, sbtcAmount: number, dogAmount: number): ClarityValue[] {
  return [
    uintCV(toMicroUnits(total)),
    ...buildStxSwapArgs(stxAmount),
    ...buildSbtcSwapArgs(sbtcAmount),
    ...buildDogSwapArgs(dogAmount),
  ]
}

/**
 * Build invest-balanced args (STX + sBTC + WELSH + LEO)
 */
function buildInvestBalancedArgs(
  total: number,
  stxAmount: number,
  sbtcAmount: number,
  welshAmount: number,
  leoAmount: number
): ClarityValue[] {
  return [
    uintCV(toMicroUnits(total)),
    ...buildStxSwapArgs(stxAmount),
    ...buildSbtcSwapArgs(sbtcAmount),
    ...buildWelshSwapArgs(welshAmount),
    ...buildLeoSwapArgs(leoAmount),
  ]
}

/**
 * Build invest-meme-hunter args (WELSH + LEO + DOG)
 */
function buildInvestMemeHunterArgs(
  total: number,
  welshAmount: number,
  leoAmount: number,
  dogAmount: number
): ClarityValue[] {
  return [
    uintCV(toMicroUnits(total)),
    ...buildWelshSwapArgs(welshAmount),
    ...buildLeoSwapArgs(leoAmount),
    ...buildDogSwapArgs(dogAmount),
  ]
}

// =====================
// STRATEGY CONFIG
// =====================

interface StrategyConfig {
  functionName: string
  buildArgs: (total: number, allocations: Record<string, number>) => ClarityValue[]
}

function getStrategyConfig(strategyId: number, allocations: Record<string, number | undefined>): StrategyConfig {
  const hasWelsh = (allocations.welsh || 0) > 0
  const hasLeo = (allocations.leo || 0) > 0
  const hasDog = (allocations.dog || 0) > 0
  const hasStx = (allocations.stx || 0) > 0
  const hasSbtc = (allocations.sbtc || 0) > 0

  // Calculate amounts helper
  const calcAmount = (total: number, allocs: Record<string, number>) => ({
    stx: ((allocs.stx || 0) * total) / 100,
    sbtc: ((allocs.sbtc || 0) * total) / 100,
    welsh: ((allocs.welsh || 0) * total) / 100,
    leo: ((allocs.leo || 0) * total) / 100,
    dog: ((allocs.dog || 0) * total) / 100,
  })

  // Meme Hunter: WELSH + LEO + DOG
  if (strategyId === STRATEGIES.MEME_HUNTER) {
    return {
      functionName: 'invest-meme-hunter',
      buildArgs: (total, allocs) => {
        const amounts = calcAmount(total, allocs)
        return buildInvestMemeHunterArgs(total, amounts.welsh, amounts.leo, amounts.dog)
      },
    }
  }

  // Balanced/DeFi Believer: STX + sBTC + WELSH + LEO
  if (hasWelsh || hasLeo) {
    return {
      functionName: 'invest-balanced',
      buildArgs: (total, allocs) => {
        const amounts = calcAmount(total, allocs)
        return buildInvestBalancedArgs(total, amounts.stx, amounts.sbtc, amounts.welsh, amounts.leo)
      },
    }
  }

  // BTC Maxi: STX + sBTC + DOG
  if (hasDog) {
    return {
      functionName: 'invest-btc-maxi',
      buildArgs: (total, allocs) => {
        const amounts = calcAmount(total, allocs)
        return buildInvestBtcMaxiArgs(total, amounts.stx, amounts.sbtc, amounts.dog)
      },
    }
  }

  // Default: STX + sBTC
  return {
    functionName: 'invest-stx-sbtc',
    buildArgs: (total, allocs) => {
      const amounts = calcAmount(total, allocs)
      return buildInvestStxSbtcArgs(total, amounts.stx, amounts.sbtc)
    },
  }
}

// =====================
// MAIN HOOK
// =====================

export function useInvestmentV33() {
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
      const quotes = await getStrategyQuotes(amount, strategyId)
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

      const { allocations } = strategy

      // Get the appropriate function and args based on strategy
      const config = getStrategyConfig(strategyId, allocations)
      const functionArgs = config.buildArgs(amount, allocations as Record<string, number>)

      console.log('V33 Investment:', {
        total: amount,
        strategy: strategy.name,
        functionName: config.functionName,
        allocations,
        argsCount: functionArgs.length,
      })

      const txOptions: ContractCallOptions = {
        contractAddress: STACKS_INDEX_CONTRACT.address,
        contractName: STACKS_INDEX_CONTRACT.name,
        functionName: config.functionName,
        functionArgs,
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

      console.log('V33 Contract call:', {
        contract: `${STACKS_INDEX_CONTRACT.address}.${STACKS_INDEX_CONTRACT.name}`,
        function: config.functionName,
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
