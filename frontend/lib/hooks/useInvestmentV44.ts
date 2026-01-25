/**
 * useInvestmentV44 - Multi-strategy investment hook
 *
 * V44: Full strategy support via dedicated contract functions
 * - BITCOIN_MAXI: sBTC (60%) + STX (40%) via invest-bitcoin-maxi
 * - MEME_HUNTER: WELSH (30%) + LEO (30%) + DOG (25%) + DROID (15%) via invest-meme-hunter
 * - DEFI_YIELD: USDH (30%) + sBTC (25%) + STX (25%) + stSTX (20%) via invest-defi-yield
 * - STACKS_BELIEVER: ALEX (35%) + VELAR (35%) + STX (30%) via invest-stacks-believer
 */

import { useState, useCallback } from 'react'
import type { ContractCallOptions } from '@stacks/connect'
import type { ClarityValue } from '@stacks/transactions'
import {
  STACKS_INDEX_CONTRACT,
  STRATEGIES,
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
// BITFLOW CONTRACTS
// =====================

const BITFLOW = {
  // Stableswap pools
  SS_USDCX_AEUSDC: ['SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'stableswap-pool-aeusdc-usdcx-v-1-1'] as [string, string],
  SS_USDH_USDCX: ['SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'stableswap-pool-usdh-usdcx-v-1-1'] as [string, string],
  SS_AEUSDC_USDH: ['SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'stableswap-pool-aeusdc-usdh-v-1-2'] as [string, string],

  // XYK pools
  XYK_STX_AEUSDC: ['SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'xyk-pool-stx-aeusdc-v-1-2'] as [string, string],
  XYK_SBTC_STX: ['SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'xyk-pool-sbtc-stx-v-1-1'] as [string, string],
  XYK_SBTC_DOG: ['SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'xyk-pool-sbtc-dog-v-1-1'] as [string, string],
  XYK_WELSH_STX: ['SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'xyk-pool-welsh-stx-v-1-1'] as [string, string],

  // Tokens
  USDCX: ['SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE', 'usdcx'] as [string, string],
  AEUSDC: ['SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K', 'token-aeusdc'] as [string, string],
  TOKEN_STX: ['SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'token-stx-v-1-2'] as [string, string],
  SBTC: ['SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4', 'sbtc-token'] as [string, string],
  USDH: ['SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG', 'usdh-token-v1'] as [string, string],
  DOG: ['SP14NS8MVBRHXMM96BQY0727AJ59SWPV7RMHC0NCG', 'pontis-bridge-DOG'] as [string, string],
  WELSH: ['SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G', 'welshcorgicoin-token'] as [string, string],
  LEO: ['SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6', 'leo-token'] as [string, string],
  DROID: ['SP2EEV5QBZA454MSMW9W3WJNRXVJF36VPV17FFKYH', 'DROID'] as [string, string],
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

type UIntCV = typeof import('@stacks/transactions').uintCV
type ContractPrincipalCV = typeof import('@stacks/transactions').contractPrincipalCV
type CvBuilder = (contract: [string, string]) => ClarityValue

function makeCv(contractPrincipalCV: ContractPrincipalCV): CvBuilder {
  return (contract: [string, string]) => contractPrincipalCV(contract[0], contract[1])
}

// =====================
// QUOTE FUNCTIONS
// =====================

interface SwapQuote {
  tokenSymbol: string
  amountIn: number
  estimatedOutput: number
  minReceived: number
}

async function getQuoteForToken(tokenSymbol: string, amount: number): Promise<SwapQuote | null> {
  if (amount <= 0) return null

  try {
    const response = await fetch('/api/bitflow/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenSymbol, amount, slippageTolerance: 0.01 }),
    })
    const data = await response.json()

    if (data.success && data.executionParams) {
      return {
        tokenSymbol,
        amountIn: amount,
        estimatedOutput: data.estimatedOutput || parseInt(data.executionParams.minReceived) || 0,
        minReceived: parseInt(data.executionParams.minReceived) || 0,
      }
    }

    // Fallback estimates based on spec values
    // Token rates are tokens per $1 USD, output is in native token units
    const TOKEN_DECIMALS: Record<string, number> = {
      STX: 6,
      sBTC: 8,
      USDH: 8,
      stSTX: 6,
      WELSH: 6,
      LEO: 6,
      DOG: 8,
      DROID: 6,
      ALEX: 8,
      VELAR: 6,
    }
    // Rates: tokens received per $1 USD (human readable)
    const fallbackRates: Record<string, number> = {
      STX: 2.88,       // From spec: $1 -> ~2.88 STX
      sBTC: 0.00001,   // ~$100k per BTC -> 0.00001 BTC per $1
      USDH: 0.92,      // From spec: $1 -> ~0.92 USDH (stableswap slippage)
      stSTX: 2.5,      // STX rate * stSTX ratio (~0.87)
      WELSH: 2.88,     // From spec: $1 -> ~2.88 WELSH
      LEO: 2.87,       // From spec: $1 -> ~2.87 LEO
      DOG: 70.55,      // From spec: $1 -> ~70.55 DOG
      DROID: 100,      // Estimate: ~100 DROID per $1
      ALEX: 20,        // Estimate: ~20 ALEX per $1 (~$0.05 per ALEX)
      VELAR: 50,       // Estimate: ~50 VELAR per $1 (~$0.02 per VELAR)
    }
    const rate = fallbackRates[tokenSymbol] || 1
    const decimals = TOKEN_DECIMALS[tokenSymbol] || 6
    const estimated = Math.floor(amount * rate * Math.pow(10, decimals) * 0.97)

    return {
      tokenSymbol,
      amountIn: amount,
      estimatedOutput: estimated,
      minReceived: Math.floor(estimated * 0.99),
    }
  } catch (error) {
    console.error(`Failed to get quote for ${tokenSymbol}:`, error)
    return null
  }
}

// Token decimals for display conversion
const TOKEN_DECIMALS_MAP: Record<string, number> = {
  STX: 6,
  sBTC: 8,
  USDH: 8,
  stSTX: 6,
  WELSH: 6,
  LEO: 6,
  DOG: 8,
  DROID: 6,
  ALEX: 8,
  VELAR: 6,
}

// Normalize token symbol to match our standard format
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

async function getStrategyQuotes(amount: number, strategyId: number): Promise<QuoteResult[]> {
  const strategy = STRATEGY_ALLOCATIONS[strategyId]
  if (!strategy) return []

  const quotes: QuoteResult[] = []

  for (const [token, percentage] of Object.entries(strategy.allocations)) {
    if (!percentage || percentage <= 0) continue

    const tokenAmount = (amount * percentage) / 100
    const tokenSymbol = normalizeTokenSymbol(token)

    const quote = await getQuoteForToken(tokenSymbol, tokenAmount)
    if (quote) {
      const decimals = TOKEN_DECIMALS_MAP[tokenSymbol] || 6
      quotes.push({
        tokenSymbol,
        amm: 'bitflow',
        amountIn: tokenAmount,
        estimatedAmountOut: quote.estimatedOutput / Math.pow(10, decimals),
      })
    }
  }

  return quotes
}

// =====================
// TRANSACTION BUILDERS
// =====================

function buildBitcoinMaxiArgs(
  totalAmount: number,
  quotes: Map<string, SwapQuote>,
  uintCV: UIntCV,
  cv: CvBuilder
) {
  const stxQuote = quotes.get('STX')
  const sbtcQuote = quotes.get('sBTC')

  const stxAmount = stxQuote?.amountIn ? toMicroUnits(stxQuote.amountIn) : 0
  // TODO: Use actual min-received from quotes after testing
  const stxMinOut = 1 // Hardcoded for testing

  const sbtcAmount = sbtcQuote?.amountIn ? toMicroUnits(sbtcQuote.amountIn) : 0
  // TODO: Use actual min-received from quotes after testing
  const sbtcMinOut = 1 // Hardcoded for testing

  return [
    uintCV(toMicroUnits(totalAmount)),    // total-usdcx
    // STX params
    uintCV(stxAmount),                    // stx-amount
    uintCV(stxMinOut),                    // stx-min-out
    cv(BITFLOW.USDCX),                    // stx-ss-token-a
    cv(BITFLOW.AEUSDC),                   // stx-ss-token-b
    cv(BITFLOW.SS_USDCX_AEUSDC),         // stx-ss-pool
    cv(BITFLOW.AEUSDC),                   // stx-xyk-token-a
    cv(BITFLOW.TOKEN_STX),                // stx-xyk-token-b
    cv(BITFLOW.XYK_STX_AEUSDC),          // stx-xyk-pool
    // sBTC params
    uintCV(sbtcAmount),                   // sbtc-amount
    uintCV(sbtcMinOut),                   // sbtc-min-out
    cv(BITFLOW.USDCX),                    // sbtc-ss-token-a
    cv(BITFLOW.AEUSDC),                   // sbtc-ss-token-b
    cv(BITFLOW.SS_USDCX_AEUSDC),         // sbtc-ss-pool
    cv(BITFLOW.AEUSDC),                   // sbtc-xyk-token-a
    cv(BITFLOW.TOKEN_STX),                // sbtc-xyk-token-b
    cv(BITFLOW.TOKEN_STX),                // sbtc-xyk-token-c
    cv(BITFLOW.SBTC),                     // sbtc-xyk-token-d
    cv(BITFLOW.XYK_STX_AEUSDC),          // sbtc-xyk-pool-a
    cv(BITFLOW.XYK_SBTC_STX),            // sbtc-xyk-pool-b
  ]
}

function buildMemeHunterArgs(
  totalAmount: number,
  quotes: Map<string, SwapQuote>,
  uintCV: UIntCV,
  cv: CvBuilder
) {
  const welshQuote = quotes.get('WELSH')
  const leoQuote = quotes.get('LEO')
  const dogQuote = quotes.get('DOG')
  const droidQuote = quotes.get('DROID')

  const welshAmount = welshQuote?.amountIn ? toMicroUnits(welshQuote.amountIn) : 0
  // TODO: Use actual min-received from quotes after testing
  const welshMinOut = 1 // Hardcoded for testing

  const leoAmount = leoQuote?.amountIn ? toMicroUnits(leoQuote.amountIn) : 0
  // TODO: Use actual min-received from quotes after testing
  const leoMinOut = 1 // Hardcoded for testing

  const dogAmount = dogQuote?.amountIn ? toMicroUnits(dogQuote.amountIn) : 0
  // TODO: Use actual min-received from quotes after testing
  const dogMinOut = 1 // Hardcoded for testing

  const droidAmount = droidQuote?.amountIn ? toMicroUnits(droidQuote.amountIn) : 0
  // TODO: Use actual min-received from quotes after testing
  const droidMinOut = 1 // Hardcoded for testing

  return [
    uintCV(toMicroUnits(totalAmount)),    // total-usdcx
    // WELSH params (v-1-5 swap-helper-a)
    uintCV(welshAmount),
    uintCV(welshMinOut),
    cv(BITFLOW.USDCX),                    // welsh-ss14-token-a
    cv(BITFLOW.USDH),                     // welsh-ss14-token-b
    cv(BITFLOW.SS_USDH_USDCX),           // welsh-ss14-pool
    cv(BITFLOW.USDH),                     // welsh-ss12-token-a
    cv(BITFLOW.AEUSDC),                   // welsh-ss12-token-b
    cv(BITFLOW.SS_AEUSDC_USDH),          // welsh-ss12-pool
    cv(BITFLOW.AEUSDC),                   // welsh-xyk-token-a
    cv(BITFLOW.TOKEN_STX),                // welsh-xyk-token-b
    cv(BITFLOW.XYK_STX_AEUSDC),          // welsh-xyk-pool
    // LEO params (v-1-5 swap-helper-a)
    uintCV(leoAmount),
    uintCV(leoMinOut),
    cv(BITFLOW.USDCX),
    cv(BITFLOW.USDH),
    cv(BITFLOW.SS_USDH_USDCX),
    cv(BITFLOW.USDH),
    cv(BITFLOW.AEUSDC),
    cv(BITFLOW.SS_AEUSDC_USDH),
    cv(BITFLOW.AEUSDC),
    cv(BITFLOW.TOKEN_STX),
    cv(BITFLOW.XYK_STX_AEUSDC),
    // DOG params (v-1-2 swap-helper-c)
    uintCV(dogAmount),
    uintCV(dogMinOut),
    cv(BITFLOW.USDCX),
    cv(BITFLOW.AEUSDC),
    cv(BITFLOW.SS_USDCX_AEUSDC),
    cv(BITFLOW.AEUSDC),
    cv(BITFLOW.TOKEN_STX),
    cv(BITFLOW.TOKEN_STX),
    cv(BITFLOW.SBTC),
    cv(BITFLOW.SBTC),
    cv(BITFLOW.DOG),
    cv(BITFLOW.XYK_STX_AEUSDC),
    cv(BITFLOW.XYK_SBTC_STX),
    cv(BITFLOW.XYK_SBTC_DOG),
    // DROID params (v-1-2 swap-helper-c)
    uintCV(droidAmount),
    uintCV(droidMinOut),
    cv(BITFLOW.USDCX),
    cv(BITFLOW.AEUSDC),
    cv(BITFLOW.SS_USDCX_AEUSDC),
    cv(BITFLOW.AEUSDC),
    cv(BITFLOW.TOKEN_STX),
    cv(BITFLOW.TOKEN_STX),
    cv(BITFLOW.SBTC),
    cv(BITFLOW.SBTC),
    cv(BITFLOW.DROID),
    cv(BITFLOW.XYK_STX_AEUSDC),
    cv(BITFLOW.XYK_SBTC_STX),
    // DROID pool - using SBTC-STX as placeholder (need actual SBTC-DROID pool)
    cv(['SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'xyk-pool-sbtc-droid-v-1-1']),
  ]
}

function buildDefiYieldArgs(
  totalAmount: number,
  quotes: Map<string, SwapQuote>,
  uintCV: UIntCV,
  cv: CvBuilder
) {
  const usdhQuote = quotes.get('USDH')
  const sbtcQuote = quotes.get('sBTC')
  const stxQuote = quotes.get('STX')
  const ststxQuote = quotes.get('stSTX')

  const usdhAmount = usdhQuote?.amountIn ? toMicroUnits(usdhQuote.amountIn) : 0
  // TODO: Use actual min-received from quotes after testing
  const usdhMinOut = 1 // Hardcoded for testing

  const sbtcAmount = sbtcQuote?.amountIn ? toMicroUnits(sbtcQuote.amountIn) : 0
  // TODO: Use actual min-received from quotes after testing
  const sbtcMinOut = 1 // Hardcoded for testing

  const stxAmount = stxQuote?.amountIn ? toMicroUnits(stxQuote.amountIn) : 0
  // TODO: Use actual min-received from quotes after testing
  const stxMinOut = 1 // Hardcoded for testing

  // stSTX: Two-step swap, need STX min then stSTX min
  const ststxUsdcxAmount = ststxQuote?.amountIn ? toMicroUnits(ststxQuote.amountIn) : 0
  // TODO: Use actual min-received from quotes after testing
  const ststxStxMinOut = 1 // Hardcoded for testing
  const ststxFinalMinOut = 1 // Hardcoded for testing

  return [
    uintCV(toMicroUnits(totalAmount)),    // total-usdcx
    // USDH params (v-1-5 swap-helper-c - stableswap only)
    uintCV(usdhAmount),
    uintCV(usdhMinOut),
    cv(BITFLOW.USDCX),                    // usdh-ss14-token-a
    cv(BITFLOW.AEUSDC),                   // usdh-ss14-token-b
    cv(BITFLOW.SS_USDCX_AEUSDC),         // usdh-ss14-pool
    cv(BITFLOW.AEUSDC),                   // usdh-ss12-token-a
    cv(BITFLOW.USDH),                     // usdh-ss12-token-b
    cv(BITFLOW.SS_AEUSDC_USDH),          // usdh-ss12-pool
    // sBTC params (v-1-2 swap-helper-b)
    uintCV(sbtcAmount),
    uintCV(sbtcMinOut),
    cv(BITFLOW.USDCX),
    cv(BITFLOW.AEUSDC),
    cv(BITFLOW.SS_USDCX_AEUSDC),
    cv(BITFLOW.AEUSDC),
    cv(BITFLOW.TOKEN_STX),
    cv(BITFLOW.TOKEN_STX),
    cv(BITFLOW.SBTC),
    cv(BITFLOW.XYK_STX_AEUSDC),
    cv(BITFLOW.XYK_SBTC_STX),
    // STX params (v-1-2 swap-helper-a)
    uintCV(stxAmount),
    uintCV(stxMinOut),
    cv(BITFLOW.USDCX),
    cv(BITFLOW.AEUSDC),
    cv(BITFLOW.SS_USDCX_AEUSDC),
    cv(BITFLOW.AEUSDC),
    cv(BITFLOW.TOKEN_STX),
    cv(BITFLOW.XYK_STX_AEUSDC),
    // stSTX params (two-step: USDCx -> STX -> stSTX)
    uintCV(ststxUsdcxAmount),             // ststx-usdcx-amount
    uintCV(ststxStxMinOut),               // ststx-stx-min-out
    uintCV(ststxFinalMinOut),             // ststx-final-min-out
    cv(BITFLOW.USDCX),
    cv(BITFLOW.AEUSDC),
    cv(BITFLOW.SS_USDCX_AEUSDC),
    cv(BITFLOW.AEUSDC),
    cv(BITFLOW.TOKEN_STX),
    cv(BITFLOW.XYK_STX_AEUSDC),
  ]
}

function buildStacksBelieverArgs(
  totalAmount: number,
  quotes: Map<string, SwapQuote>,
  uintCV: UIntCV
) {
  const stxQuote = quotes.get('STX')
  const alexQuote = quotes.get('ALEX')
  const velarQuote = quotes.get('VELAR')

  // STX (30%) - direct swap
  const stxUsdcxAmount = stxQuote?.amountIn ? toMicroUnits(stxQuote.amountIn) : 0
  const stxMinOut = 1 // Hardcoded for testing

  // ALEX (35%) - two-step: USDCx -> STX -> ALEX
  const alexUsdcxAmount = alexQuote?.amountIn ? toMicroUnits(alexQuote.amountIn) : 0
  const alexStxMinOut = 1 // Hardcoded for testing
  const alexMinOut = 1 // Hardcoded for testing

  // VELAR (35%) - two-step: USDCx -> STX -> VELAR
  const velarUsdcxAmount = velarQuote?.amountIn ? toMicroUnits(velarQuote.amountIn) : 0
  const velarStxMinOut = 1 // Hardcoded for testing
  const velarMinOut = 1 // Hardcoded for testing

  return [
    uintCV(toMicroUnits(totalAmount)),    // total-usdcx
    // STX params (30%)
    uintCV(stxUsdcxAmount),               // stx-usdcx-amount
    uintCV(stxMinOut),                    // stx-min-out
    // ALEX params (35%) - two-step
    uintCV(alexUsdcxAmount),              // alex-usdcx-amount
    uintCV(alexStxMinOut),                // alex-stx-min-out
    uintCV(alexMinOut),                   // alex-min-out
    // VELAR params (35%) - two-step
    uintCV(velarUsdcxAmount),             // velar-usdcx-amount
    uintCV(velarStxMinOut),               // velar-stx-min-out
    uintCV(velarMinOut),                  // velar-min-out
  ]
}

// =====================
// MAIN HOOK
// =====================

export function useInvestmentV44() {
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
      const [{ openContractCall }, { uintCV, contractPrincipalCV, PostConditionMode }] = await Promise.all([
        import('@stacks/connect'),
        import('@stacks/transactions'),
      ])

      const cv = makeCv(contractPrincipalCV)

      const strategy = STRATEGY_ALLOCATIONS[strategyId]
      if (!strategy) throw new Error('Invalid strategy')

      // Get quotes for all tokens in the strategy
      const quoteMap = new Map<string, SwapQuote>()
      for (const [token, percentage] of Object.entries(strategy.allocations)) {
        if (!percentage || percentage <= 0) continue
        const tokenSymbol = normalizeTokenSymbol(token)
        const tokenAmount = (amount * percentage) / 100
        const quote = await getQuoteForToken(tokenSymbol, tokenAmount)
        if (quote) quoteMap.set(tokenSymbol, quote)
      }

      // Determine function name and args based on strategy
      let functionName: string
      let functionArgs: ClarityValue[]

      switch (strategyId) {
        case STRATEGIES.BITCOIN_MAXI:
          functionName = 'invest-bitcoin-maxi'
          functionArgs = buildBitcoinMaxiArgs(amount, quoteMap, uintCV, cv)
          break
        case STRATEGIES.MEME_HUNTER:
          functionName = 'invest-meme-hunter'
          functionArgs = buildMemeHunterArgs(amount, quoteMap, uintCV, cv)
          break
        case STRATEGIES.DEFI_YIELD:
          functionName = 'invest-defi-yield'
          functionArgs = buildDefiYieldArgs(amount, quoteMap, uintCV, cv)
          break
        case STRATEGIES.STACKS_BELIEVER:
          functionName = 'invest-stacks-believer'
          functionArgs = buildStacksBelieverArgs(amount, quoteMap, uintCV)
          break
        default:
          throw new Error('Unknown strategy')
      }

      console.log('V44 Investment:', {
        total: amount,
        microAmount,
        strategy: strategy.name,
        functionName,
        numArgs: functionArgs.length,
      })

      const txOptions: ContractCallOptions = {
        contractAddress: STACKS_INDEX_CONTRACT.address,
        contractName: STACKS_INDEX_CONTRACT.name,
        functionName,
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

      console.log('V44 Contract call:', {
        contract: `${STACKS_INDEX_CONTRACT.address}.${STACKS_INDEX_CONTRACT.name}`,
        function: functionName,
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
