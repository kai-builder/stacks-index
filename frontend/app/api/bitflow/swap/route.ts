import { NextRequest, NextResponse } from 'next/server'
import { BitflowSDK } from '@bitflowlabs/core-sdk'

export const revalidate = 0

// Initialize Bitflow SDK with API keys
const bitflowSDK = new BitflowSDK({
  BITFLOW_API_HOST: 'https://api.bitflowapis.finance/',
  BITFLOW_API_KEY: process.env.BITFLOW_API_KEY || '',
  READONLY_CALL_API_HOST: 'https://node.bitflowapis.finance/',
  READONLY_CALL_API_KEY: process.env.BITFLOW_READONLY_API_KEY || '',
  KEEPER_API_HOST: 'https://keeper.bitflowapis.finance/',
  KEEPER_API_KEY: process.env.BITFLOW_API_KEY || '',
})

// =====================================================================
// HARDCODED FALLBACK ROUTES
// Based on real Bitflow webapp transactions
// =====================================================================

// Known Bitflow contracts from mainnet
const BITFLOW_CONTRACTS = {
  // Stableswap pools
  STABLESWAP_USDCX_AEUSDC: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.stableswap-pool-aeusdc-usdcx-v-1-1',
  STABLESWAP_USDH_USDCX: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.stableswap-pool-usdh-usdcx-v-1-1',
  STABLESWAP_AEUSDC_USDH: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.stableswap-pool-aeusdc-usdh-v-1-2',
  STABLESWAP_STX_STSTX: 'SPQC38PW542EQJ5M11CR25P7BS1CA6QT4TBXGB3M.stableswap-stx-ststx-v-1-2',
  // XYK pools
  XYK_STX_AEUSDC: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-stx-aeusdc-v-1-1',
  XYK_SBTC_STX: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-stx-v-1-1',
  // ALEX pool removed - Bitflow no longer supports it
  XYK_WELSH_STX: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-welsh-stx-v-1-1',  // Note: welsh-stx not stx-welsh
  XYK_SBTC_DROID: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-droid-v-1-1',
  // Tokens
  USDCX: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
  AEUSDC: 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc',
  USDH: 'SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.usdh-token-v1',
  TOKEN_STX: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-1',
  WSTX: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.wstx',
  SBTC: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
  ALEX: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex',
  WELSH: 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token',
  LEO: 'SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6.leo-token',
  VELAR: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.velar-token',
  DROID: 'SP2EEV5QBZA454MSMW9W3WJNRXVJF36VPV17FFKYH.DROID',
  ROO: 'SP2C1WREHGM75C7TGFAEJPFKTFTEGZKF6DFT6E2GE.kangaroo',
  STSTX: 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token',
  // Velar
  VELAR_SHARE_FEE_TO: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.univ2-share-fee-to',
}

// Swap helper types
type SwapType = '2hop' | '3hop' | '4hop' | '5hop' | 'velar' | 'stableswap'

interface FallbackRouteResult {
  success: boolean
  swapType: SwapType
  // Stableswap params for 2hop/3hop routes
  ssTokenA: string
  ssTokenB: string
  ssPool: string
  // XYK params (varies by swap type)
  xykTokenA: string
  xykTokenB: string
  xykTokenC?: string // Only for 3-hop+
  xykTokenD?: string // Only for 3-hop+
  xykTokenE?: string // Only for 5-hop (DROID)
  xykTokenF?: string // Only for 5-hop (DROID)
  xykPoolA: string
  xykPoolB?: string // Only for 3-hop+
  xykPoolC?: string // Only for 5-hop (DROID)
  // Additional stableswap for 4hop (WELSH via v1.5 router)
  ss14TokenA?: string
  ss14TokenB?: string
  ss14Pool?: string
  ss12TokenA?: string
  ss12TokenB?: string
  ss12Pool?: string
  // Velar params (2 tokens = 1 velar hop)
  velarTokenA?: string
  velarTokenB?: string
  velarShareFeeTo?: string
  // Output
  outputToken: string
  estimatedOutput: number
  reversed: boolean
}

// Fallback routes based on Bitflow webapp transactions
function getFallbackRoute(tokenSymbol: string, amount: number): FallbackRouteResult | null {
  // Common stableswap params for all routes: USDCx -> aeUSDC
  const ssParams = {
    ssTokenA: BITFLOW_CONTRACTS.USDCX,
    ssTokenB: BITFLOW_CONTRACTS.AEUSDC,
    ssPool: BITFLOW_CONTRACTS.STABLESWAP_USDCX_AEUSDC,
    reversed: false,
  }

  switch (tokenSymbol) {
    case 'STX':
    case 'wSTX':
      // 2-hop route via Bitflow: USDCx -> aeUSDC (stableswap) -> token-stx (XYK)
      // Using Bitflow XYK for highest liquidity
      return {
        success: true,
        swapType: '2hop',
        // Stableswap: USDCx -> aeUSDC
        ssTokenA: BITFLOW_CONTRACTS.USDCX,
        ssTokenB: BITFLOW_CONTRACTS.AEUSDC,
        ssPool: BITFLOW_CONTRACTS.STABLESWAP_USDCX_AEUSDC,
        // XYK: aeUSDC -> token-stx
        xykTokenA: BITFLOW_CONTRACTS.AEUSDC,
        xykTokenB: BITFLOW_CONTRACTS.TOKEN_STX,
        xykPoolA: BITFLOW_CONTRACTS.XYK_STX_AEUSDC,
        outputToken: BITFLOW_CONTRACTS.TOKEN_STX,
        // Rough estimate: ~2.88 STX per USDC (token-stx has 6 decimals)
        estimatedOutput: Math.floor(amount * 2.88 * 1_000_000),
        reversed: false,
      }

    case 'sBTC':
      // 3-hop route (swap-helper-b): USDCx -> aeUSDC -> STX -> sBTC
      // From Bitflow: xyk-tokens (a: aeUSDC, b: token-stx, c: token-stx, d: sbtc-token)
      return {
        success: true,
        swapType: '3hop',
        ...ssParams,
        xykTokenA: BITFLOW_CONTRACTS.AEUSDC,
        xykTokenB: BITFLOW_CONTRACTS.TOKEN_STX,
        xykTokenC: BITFLOW_CONTRACTS.TOKEN_STX,
        xykTokenD: BITFLOW_CONTRACTS.SBTC,
        xykPoolA: BITFLOW_CONTRACTS.XYK_STX_AEUSDC,
        xykPoolB: BITFLOW_CONTRACTS.XYK_SBTC_STX,
        outputToken: BITFLOW_CONTRACTS.SBTC,
        // Rough estimate: $100 USDC = ~0.001 BTC = 100000 sats
        estimatedOutput: Math.floor(amount * 1000), // sats (8 decimals)
      }

    case 'ALEX':
      // ALEX pool no longer supported on Bitflow (NoSuchContract error)
      // Return null - ALEX allocations should be 0 in all strategies
      return null

    case 'WELSH':
      // 3-hop route via router v1.2 (swap-helper-b): USDCx -> aeUSDC -> STX -> WELSH
      // xyk-tokens: (a: aeUSDC, b: token-stx, c: token-stx, d: welsh)
      // Note: pool is welsh-stx not stx-welsh
      return {
        success: true,
        swapType: '3hop',
        ...ssParams,
        xykTokenA: BITFLOW_CONTRACTS.AEUSDC,
        xykTokenB: BITFLOW_CONTRACTS.TOKEN_STX,
        xykTokenC: BITFLOW_CONTRACTS.TOKEN_STX,
        xykTokenD: BITFLOW_CONTRACTS.WELSH,
        xykPoolA: BITFLOW_CONTRACTS.XYK_STX_AEUSDC,
        xykPoolB: BITFLOW_CONTRACTS.XYK_WELSH_STX,
        outputToken: BITFLOW_CONTRACTS.WELSH,
        // From spec: $1 -> ~2.88 WELSH (6 decimals)
        estimatedOutput: Math.floor(amount * 2.88 * 1_000_000),
      }

    case 'LEO':
      // Velar router route (swap-helper-a): USDCx -> aeUSDC (stableswap) -> LEO (1 velar hop, 2 tokens)
      return {
        success: true,
        swapType: 'velar',
        // Stableswap: USDCx -> aeUSDC
        ssTokenA: BITFLOW_CONTRACTS.USDCX,
        ssTokenB: BITFLOW_CONTRACTS.AEUSDC,
        ssPool: BITFLOW_CONTRACTS.STABLESWAP_USDCX_AEUSDC,
        // Velar swap params (2 tokens = 1 velar hop)
        velarTokenA: BITFLOW_CONTRACTS.AEUSDC,
        velarTokenB: BITFLOW_CONTRACTS.LEO,
        velarShareFeeTo: BITFLOW_CONTRACTS.VELAR_SHARE_FEE_TO,
        // Placeholders for xyk compatibility
        xykTokenA: BITFLOW_CONTRACTS.AEUSDC,
        xykTokenB: BITFLOW_CONTRACTS.LEO,
        xykPoolA: '', // Not used for velar
        outputToken: BITFLOW_CONTRACTS.LEO,
        // From spec: $1 -> ~2.87 LEO (6 decimals)
        estimatedOutput: Math.floor(amount * 2.87 * 1_000_000),
        reversed: false,
      }

    case 'USDH':
      // Stableswap only route (swap-helper-a on stableswap-swap-helper-v-1-5): USDCx -> USDH
      // Direct stableswap, no XYK hop needed
      return {
        success: true,
        swapType: 'stableswap',
        ssTokenA: BITFLOW_CONTRACTS.USDCX,
        ssTokenB: BITFLOW_CONTRACTS.USDH,
        ssPool: BITFLOW_CONTRACTS.STABLESWAP_USDH_USDCX,
        // Placeholders for xyk compatibility (not used for stableswap-only)
        xykTokenA: BITFLOW_CONTRACTS.USDCX,
        xykTokenB: BITFLOW_CONTRACTS.USDH,
        xykPoolA: '',
        outputToken: BITFLOW_CONTRACTS.USDH,
        // From spec: $1 -> ~0.92 USDH (8 decimals) due to routing slippage
        estimatedOutput: Math.floor(amount * 0.92 * 100_000_000),
        reversed: false,
      }

    case 'stSTX':
      // 3-hop route: USDCx -> aeUSDC (stableswap) -> STX (XYK) -> stSTX (stableswap)
      // Uses stableswap-stx-ststx-v-1-2 for the final swap
      return {
        success: true,
        swapType: '3hop',
        ...ssParams,
        xykTokenA: BITFLOW_CONTRACTS.AEUSDC,
        xykTokenB: BITFLOW_CONTRACTS.TOKEN_STX,
        xykTokenC: BITFLOW_CONTRACTS.TOKEN_STX,
        xykTokenD: BITFLOW_CONTRACTS.STSTX,
        xykPoolA: BITFLOW_CONTRACTS.XYK_STX_AEUSDC,
        xykPoolB: BITFLOW_CONTRACTS.STABLESWAP_STX_STSTX, // Uses stableswap for STX->stSTX
        outputToken: BITFLOW_CONTRACTS.STSTX,
        // Estimate: ~2.5 stSTX per $1 USDC (6 decimals) - similar to STX rate
        estimatedOutput: Math.floor(amount * 2.5 * 1_000_000),
        reversed: false,
      }

    case 'DOG':
      // 4-hop route via router v1.2 (swap-helper-c): USDCx -> aeUSDC -> STX -> sBTC -> DOG
      // xyk-tokens: (a: aeUSDC, b: token-stx, c: token-stx, d: sbtc, e: sbtc, f: DOG)
      // xyk-pools: (a: xyk-pool-stx-aeusdc, b: xyk-pool-sbtc-stx, c: xyk-pool-sbtc-dog)
      return {
        success: true,
        swapType: '4hop',
        ...ssParams,
        xykTokenA: BITFLOW_CONTRACTS.AEUSDC,
        xykTokenB: BITFLOW_CONTRACTS.TOKEN_STX,
        xykTokenC: BITFLOW_CONTRACTS.TOKEN_STX,
        xykTokenD: BITFLOW_CONTRACTS.SBTC,
        xykTokenE: BITFLOW_CONTRACTS.SBTC,
        xykTokenF: 'SP14NS8MVBRHXMM96BQY0727AJ59SWPV7RMHC0NCG.pontis-bridge-DOG',
        xykPoolA: BITFLOW_CONTRACTS.XYK_STX_AEUSDC,
        xykPoolB: BITFLOW_CONTRACTS.XYK_SBTC_STX,
        xykPoolC: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-dog-v-1-1',
        outputToken: 'SP14NS8MVBRHXMM96BQY0727AJ59SWPV7RMHC0NCG.pontis-bridge-DOG',
        // From spec: $1 -> ~70.55 DOG (8 decimals)
        estimatedOutput: Math.floor(amount * 70.55 * 100_000_000),
        reversed: false,
      }

    case 'DROID':
      // 5-hop route via router v1.2 (swap-helper-c): USDCx -> aeUSDC -> STX -> sBTC -> DROID
      // xyk-tokens: (a: aeUSDC, b: token-stx, c: token-stx, d: sbtc, e: sbtc, f: DROID)
      // xyk-pools: (a: xyk-pool-stx-aeusdc, b: xyk-pool-sbtc-stx, c: xyk-pool-sbtc-droid)
      return {
        success: true,
        swapType: '5hop',
        ...ssParams,
        xykTokenA: BITFLOW_CONTRACTS.AEUSDC,
        xykTokenB: BITFLOW_CONTRACTS.TOKEN_STX,
        xykTokenC: BITFLOW_CONTRACTS.TOKEN_STX,
        xykTokenD: BITFLOW_CONTRACTS.SBTC,
        xykTokenE: BITFLOW_CONTRACTS.SBTC,
        xykTokenF: BITFLOW_CONTRACTS.DROID,
        xykPoolA: BITFLOW_CONTRACTS.XYK_STX_AEUSDC,
        xykPoolB: BITFLOW_CONTRACTS.XYK_SBTC_STX,
        xykPoolC: BITFLOW_CONTRACTS.XYK_SBTC_DROID,
        outputToken: BITFLOW_CONTRACTS.DROID,
        // Estimate: ~100 DROID per $1 USDC (6 decimals) - needs verification
        estimatedOutput: Math.floor(amount * 100 * 1_000_000),
      }

    case 'ROO':
      // Velar router route (swap-helper-a): USDCx -> aeUSDC (stableswap) -> ROO (1 velar hop, 2 tokens)
      return {
        success: true,
        swapType: 'velar',
        // Stableswap: USDCx -> aeUSDC
        ssTokenA: BITFLOW_CONTRACTS.USDCX,
        ssTokenB: BITFLOW_CONTRACTS.AEUSDC,
        ssPool: BITFLOW_CONTRACTS.STABLESWAP_USDCX_AEUSDC,
        // Velar swap params (2 tokens = 1 velar hop)
        velarTokenA: BITFLOW_CONTRACTS.AEUSDC,
        velarTokenB: BITFLOW_CONTRACTS.ROO,
        velarShareFeeTo: BITFLOW_CONTRACTS.VELAR_SHARE_FEE_TO,
        // Placeholders for xyk compatibility
        xykTokenA: BITFLOW_CONTRACTS.AEUSDC,
        xykTokenB: BITFLOW_CONTRACTS.ROO,
        xykPoolA: '', // Not used for velar
        outputToken: BITFLOW_CONTRACTS.ROO,
        // Rough estimate: ~700 ROO per $1 USDC
        estimatedOutput: Math.floor(amount * 700 * 1_000_000), // 6 decimals
        reversed: false,
      }

    default:
      return null
  }
}

// SDK-based quote function
interface BitflowQuoteResult {
  bestRoute?: {
    quote: number
    route: Array<{
      tokenX: string
      tokenY: string
      pool: string
      poolType: string
      isReversed: boolean
    }>
  }
  allRoutes?: Array<{
    quote: number
    route: Array<{
      tokenX: string
      tokenY: string
      pool: string
      poolType: string
      isReversed: boolean
    }>
  }>
}

async function getQuoteFromBitflowSDK(
  tokenXId: string,
  tokenYId: string,
  amount: number
): Promise<BitflowQuoteResult | null> {
  try {
    console.log(`[Bitflow SDK] Getting quote: ${tokenXId} -> ${tokenYId}, amount: ${amount}`)

    // Use SDK's getQuoteForRoute method
    // Note: SDK expects token IDs in format 'token-xxx-auto' for auto-routing
    // Note: Use `token-aeusdc` coz Bitflow doesn't support USDCx in their contract yet, use previous aeUSDC with the proximately price
    
    const quote = await bitflowSDK.getQuoteForRoute('token-aeusdc', tokenYId, amount)

    console.log(`[Bitflow SDK] Quote response:`, JSON.stringify(quote, null, 2))

    if (!quote) {
      return null
    }

    // Transform SDK response to our expected format
    // The SDK returns the quote amount directly and route information
    return {
      bestRoute: {
        quote: typeof quote === 'object' && 'quote' in quote
          ? Number((quote as { quote: bigint }).quote)
          : typeof quote === 'bigint'
            ? Number(quote)
            : 0,
        route: typeof quote === 'object' && 'route' in quote
          ? (quote as { route: Array<{ tokenX: string; tokenY: string; pool: string; poolType: string; isReversed: boolean }> }).route
          : [],
      },
    }
  } catch (error) {
    console.error('[Bitflow SDK] Error:', error)
    return null
  }
}

// Token contracts mapping
const TOKEN_CONTRACTS: Record<string, string> = {
  'token-usdcx': 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
  'token-stx': 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-1',
  'token-sbtc': 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
  'token-wstx': 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.wstx',
  'token-alex': 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex',
  'token-welsh': 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token',
  'token-leo': 'SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6.leo-token',
  'token-droid': 'SP2EEV5QBZA454MSMW9W3WJNRXVJF36VPV17FFKYH.DROID',
  'token-roo': 'SP2C1WREHGM75C7TGFAEJPFKTFTEGZKF6DFT6E2GE.kangaroo',
  'token-usdh': 'SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.usdh-token-v1',
  'token-dog': 'SP14NS8MVBRHXMM96BQY0727AJ59SWPV7RMHC0NCG.pontis-bridge-DOG',
  'token-ststx': 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token',
}

// Token symbol to Bitflow ID mapping (using auto-routing format)
const TOKEN_SYMBOL_TO_ID: Record<string, string> = {
  'STX': 'token-stx',
  'sBTC': 'token-sbtc',
  'wSTX': 'token-wstx',
  'ALEX': 'token-alex',
  'WELSH': 'token-welsh',
  'LEO': 'token-leo',
  'DROID': 'token-droid',
  'ROO': 'token-roo',
  'USDH': 'token-usdh',
  'DOG': 'token-dog',
  'stSTX': 'token-ststx',
}

// Source token ID for USDCx with auto-routing
const USDCX_TOKEN_ID = 'token-usdcx-auto'

interface SwapRequest {
  tokenSymbol: string // 'sBTC', 'wSTX', 'ALEX', 'WELSH', 'LEO'
  amount: number // USDCx amount in human-readable format
  senderAddress?: string // Optional - not used with public API
  slippageTolerance?: number // Default 0.01 (1%)
}

interface SwapExecutionParams {
  tokenSymbol: string
  tokenContract: string
  amount: number
  minReceived: string
  swapsReversed: boolean
  swapType: '2hop' | '3hop' | '4hop' | '5hop' | 'velar' | 'stableswap'
  // Stableswap params (for 2hop/3hop via v1.2 router)
  stableswapTokenA: string
  stableswapTokenB: string
  stableswapPoolA: string
  // XYK params (for 2-hop: a,b + poolA; for 3-hop+: a,b,c,d + poolA,poolB; for 5-hop: a-f + poolA,B,C)
  xykTokenA: string
  xykTokenB: string
  xykTokenC?: string // Only for 3-hop+
  xykTokenD?: string // Only for 3-hop+
  xykTokenE?: string // Only for 5-hop (DROID)
  xykTokenF?: string // Only for 5-hop (DROID)
  xykPoolA: string
  xykPoolB?: string // Only for 3-hop+
  xykPoolC?: string // Only for 5-hop (DROID)
  // Additional stableswap for 4hop (WELSH via v1.5 router)
  ss14TokenA?: string
  ss14TokenB?: string
  ss14PoolA?: string
  ss12TokenA?: string
  ss12TokenB?: string
  ss12PoolA?: string
  // Velar params (2 tokens = 1 velar hop)
  velarTokenA?: string
  velarTokenB?: string
  velarShareFeeTo?: string
  // Output token (what the swap actually produces)
  outputToken: string
  // Full route info
  route: unknown
}

// Route step from Bitflow SDK
interface RouteStep {
  tokenX?: string
  tokenY?: string
  pool?: string
  poolType?: string
  isReversed?: boolean
  // Alternative field names Bitflow might use
  tokenXContract?: string
  tokenYContract?: string
  poolContract?: string
  type?: string
  reversed?: boolean
}

// Extract pool info from route step
function extractStepInfo(step: RouteStep) {
  return {
    tokenX: step.tokenX || step.tokenXContract || '',
    tokenY: step.tokenY || step.tokenYContract || '',
    pool: step.pool || step.poolContract || '',
    poolType: step.poolType || step.type || '',
    isReversed: step.isReversed ?? step.reversed ?? false,
  }
}

// Build route info object for different swap types
function buildRouteInfo(fallback: FallbackRouteResult) {
  switch (fallback.swapType) {
    case '2hop':
      return {
        swapType: '2hop',
        router: 'v1.2',
        stableswap: { tokenA: fallback.ssTokenA, tokenB: fallback.ssTokenB, pool: fallback.ssPool },
        xyk: { tokenA: fallback.xykTokenA, tokenB: fallback.xykTokenB, poolA: fallback.xykPoolA },
      }
    case '3hop':
      return {
        swapType: '3hop',
        router: 'v1.2',
        stableswap: { tokenA: fallback.ssTokenA, tokenB: fallback.ssTokenB, pool: fallback.ssPool },
        xyk: {
          tokenA: fallback.xykTokenA,
          tokenB: fallback.xykTokenB,
          tokenC: fallback.xykTokenC,
          tokenD: fallback.xykTokenD,
          poolA: fallback.xykPoolA,
          poolB: fallback.xykPoolB,
        },
      }
    case '4hop':
      return {
        swapType: '4hop',
        router: 'v1.5',
        stableswapV14: { tokenA: fallback.ss14TokenA, tokenB: fallback.ss14TokenB, pool: fallback.ss14Pool },
        stableswapV12: { tokenA: fallback.ss12TokenA, tokenB: fallback.ss12TokenB, pool: fallback.ss12Pool },
        xyk: {
          tokenA: fallback.xykTokenA,
          tokenB: fallback.xykTokenB,
          poolA: fallback.xykPoolA,
        },
      }
    case '4hop':
      return {
        swapType: '4hop',
        router: 'v1.2',
        stableswap: { tokenA: fallback.ssTokenA, tokenB: fallback.ssTokenB, pool: fallback.ssPool },
        xyk: {
          tokenA: fallback.xykTokenA,
          tokenB: fallback.xykTokenB,
          tokenC: fallback.xykTokenC,
          tokenD: fallback.xykTokenD,
          tokenE: fallback.xykTokenE,
          tokenF: fallback.xykTokenF,
          poolA: fallback.xykPoolA,
          poolB: fallback.xykPoolB,
          poolC: fallback.xykPoolC,
        },
      }
    case '5hop':
      return {
        swapType: '5hop',
        router: 'v1.2',
        stableswap: { tokenA: fallback.ssTokenA, tokenB: fallback.ssTokenB, pool: fallback.ssPool },
        xyk: {
          tokenA: fallback.xykTokenA,
          tokenB: fallback.xykTokenB,
          tokenC: fallback.xykTokenC,
          tokenD: fallback.xykTokenD,
          tokenE: fallback.xykTokenE,
          tokenF: fallback.xykTokenF,
          poolA: fallback.xykPoolA,
          poolB: fallback.xykPoolB,
          poolC: fallback.xykPoolC,
        },
      }
    case 'velar':
      return {
        swapType: 'velar',
        router: 'velar',
        stableswap: { tokenA: fallback.ssTokenA, tokenB: fallback.ssTokenB, pool: fallback.ssPool },
        velar: {
          tokenA: fallback.velarTokenA,
          tokenB: fallback.velarTokenB,
          shareFeeTo: fallback.velarShareFeeTo,
        },
      }
    case 'stableswap':
      return {
        swapType: 'stableswap',
        router: 'stableswap-v-1-5',
        stableswap: { tokenA: fallback.ssTokenA, tokenB: fallback.ssTokenB, pool: fallback.ssPool },
      }
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as SwapRequest
    const { tokenSymbol, amount, slippageTolerance = 0.01 } = body

    if (!tokenSymbol || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: tokenSymbol, amount',
      }, { status: 400 })
    }

    const toTokenId = TOKEN_SYMBOL_TO_ID[tokenSymbol]
    if (!toTokenId) {
      return NextResponse.json({
        success: false,
        error: `Unknown token symbol: ${tokenSymbol}`,
      }, { status: 400 })
    }

    // Get quote from USDCx to target token using Bitflow SDK
    // Convert human-readable amount to micro units (USDCx has 6 decimals)
    const amountMicroUnits = Math.floor(amount * 1_000_000)
    console.log(`[Bitflow] Getting quote: USDCx -> ${tokenSymbol}, amount: ${amount} (${amountMicroUnits} micro)`)
    const quoteData = await getQuoteFromBitflowSDK(USDCX_TOKEN_ID, toTokenId, amountMicroUnits)

    if (!quoteData) {
      console.log(`[Bitflow] No quote returned for ${tokenSymbol}`)
      return NextResponse.json({
        success: false,
        error: `No route found for USDCx -> ${tokenSymbol}`,
      })
    }

    // Log the raw response for debugging
    console.log(`[Bitflow] Raw quote response for ${tokenSymbol}:`, JSON.stringify(quoteData, null, 2))

    // Extract best route
    let bestRoute = quoteData.bestRoute || quoteData.allRoutes?.[0]

    // If SDK returns empty routes, try fallback
    if (!bestRoute || !bestRoute.route || bestRoute.route.length === 0) {
      console.log(`[Bitflow] No route from SDK for ${tokenSymbol}, trying fallback...`)

      const fallback = getFallbackRoute(tokenSymbol, amount)
      if (fallback && fallback.success) {
        console.log(`[Bitflow] Using fallback ${fallback.swapType} route for ${tokenSymbol}`)

        // Calculate min received with slippage
        const minReceived = Math.floor(fallback.estimatedOutput * (1 - slippageTolerance))

        // Build execution params from fallback
        const executionParams: SwapExecutionParams = {
          tokenSymbol,
          tokenContract: fallback.outputToken,
          amount,
          minReceived: minReceived.toString(),
          swapsReversed: fallback.reversed,
          swapType: fallback.swapType,
          // Stableswap params (for 2hop/3hop)
          stableswapTokenA: fallback.ssTokenA,
          stableswapTokenB: fallback.ssTokenB,
          stableswapPoolA: fallback.ssPool,
          // XYK params
          xykTokenA: fallback.xykTokenA,
          xykTokenB: fallback.xykTokenB,
          xykTokenC: fallback.xykTokenC,
          xykTokenD: fallback.xykTokenD,
          xykTokenE: fallback.xykTokenE,
          xykTokenF: fallback.xykTokenF,
          xykPoolA: fallback.xykPoolA,
          xykPoolB: fallback.xykPoolB,
          xykPoolC: fallback.xykPoolC,
          // 4hop params (WELSH via v1.5 router)
          ss14TokenA: fallback.ss14TokenA,
          ss14TokenB: fallback.ss14TokenB,
          ss14PoolA: fallback.ss14Pool,
          ss12TokenA: fallback.ss12TokenA,
          ss12TokenB: fallback.ss12TokenB,
          ss12PoolA: fallback.ss12Pool,
          // Velar params (2 tokens = 1 velar hop)
          velarTokenA: fallback.velarTokenA,
          velarTokenB: fallback.velarTokenB,
          velarShareFeeTo: fallback.velarShareFeeTo,
          outputToken: fallback.outputToken,
          route: buildRouteInfo(fallback),
        }

        console.log(`[Bitflow] Fallback execution params for ${tokenSymbol}:`, JSON.stringify(executionParams, null, 2))

        return NextResponse.json({
          success: true,
          executionParams,
          estimatedOutput: fallback.estimatedOutput,
          minReceived,
          priceImpact: 0,
        })
      } else {
        console.log(`[Bitflow] No fallback route available for ${tokenSymbol}`)
        return NextResponse.json({
          success: false,
          error: `No route found for USDCx -> ${tokenSymbol}. This token may require a route not yet supported.`,
          rawQuote: quoteData,
        })
      }
    }

    // Parse route from API (if we ever get valid routes from Bitflow API)
    const routeSteps = bestRoute.route.map(extractStepInfo)
    const estimatedOutput = bestRoute.quote || 0

    console.log(`[Bitflow] Parsed route steps for ${tokenSymbol}:`, JSON.stringify(routeSteps, null, 2))

    // Calculate min received with slippage
    const minReceived = Math.floor(estimatedOutput * (1 - slippageTolerance))

    // Find stableswap and xyk steps
    let stableswapStep = routeSteps.find(step =>
      step.poolType === 'stableswap' ||
      step.pool.includes('stableswap')
    )
    const xykSteps = routeSteps.filter(step =>
      step.poolType === 'xyk' ||
      (step.pool.includes('xyk') && !step.pool.includes('stableswap'))
    )

    // If we couldn't identify by type, use position
    if (!stableswapStep && routeSteps.length >= 1) {
      stableswapStep = routeSteps[0]
    }

    // Determine swap type based on number of XYK hops
    const swapType: '2hop' | '3hop' = xykSteps.length >= 2 ? '3hop' : '2hop'
    const swapsReversed = routeSteps.some(step => step.isReversed === true)

    // Build execution params from API response
    const executionParams: SwapExecutionParams = {
      tokenSymbol,
      tokenContract: TOKEN_CONTRACTS[toTokenId],
      amount,
      minReceived: minReceived.toString(),
      swapsReversed,
      swapType,
      // Stableswap params
      stableswapTokenA: stableswapStep?.tokenX || BITFLOW_CONTRACTS.USDCX,
      stableswapTokenB: stableswapStep?.tokenY || BITFLOW_CONTRACTS.AEUSDC,
      stableswapPoolA: stableswapStep?.pool || BITFLOW_CONTRACTS.STABLESWAP_USDCX_AEUSDC,
      // XYK params
      xykTokenA: xykSteps[0]?.tokenX || BITFLOW_CONTRACTS.AEUSDC,
      xykTokenB: xykSteps[0]?.tokenY || BITFLOW_CONTRACTS.TOKEN_STX,
      xykTokenC: xykSteps[1]?.tokenX,
      xykTokenD: xykSteps[1]?.tokenY,
      xykPoolA: xykSteps[0]?.pool || '',
      xykPoolB: xykSteps[1]?.pool,
      outputToken: xykSteps[xykSteps.length - 1]?.tokenY || TOKEN_CONTRACTS[toTokenId],
      route: routeSteps,
    }

    console.log(`[Bitflow] Execution params for ${tokenSymbol}:`, JSON.stringify(executionParams, null, 2))

    return NextResponse.json({
      success: true,
      executionParams,
      estimatedOutput,
      minReceived,
      priceImpact: ((quoteData as Record<string, unknown>).priceImpact as number) || 0,
    })

  } catch (error) {
    console.error('Bitflow swap error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get swap params',
    }, { status: 500 })
  }
}

// Get swap params for multiple tokens at once (batch request)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { swaps, slippageTolerance = 0.01 } = body as {
      swaps: Array<{ tokenSymbol: string; amount: number }>
      senderAddress?: string
      slippageTolerance?: number
    }

    if (!swaps) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: swaps',
      }, { status: 400 })
    }

    const results: Array<{
      tokenSymbol: string
      success: boolean
      executionParams?: SwapExecutionParams
      estimatedOutput?: number
      error?: string
    }> = []

    for (const swap of swaps) {
      if (swap.amount <= 0) {
        results.push({
          tokenSymbol: swap.tokenSymbol,
          success: true,
          executionParams: undefined,
          estimatedOutput: 0,
        })
        continue
      }

      const toTokenId = TOKEN_SYMBOL_TO_ID[swap.tokenSymbol]
      if (!toTokenId) {
        results.push({
          tokenSymbol: swap.tokenSymbol,
          success: false,
          error: `Unknown token: ${swap.tokenSymbol}`,
        })
        continue
      }

      try {
        // Convert human-readable amount to micro units (USDCx has 6 decimals)
        const amountMicroUnits = Math.floor(swap.amount * 1_000_000)
        const quoteData = await getQuoteFromBitflowSDK(USDCX_TOKEN_ID, toTokenId, amountMicroUnits)

        if (!quoteData) {
          results.push({
            tokenSymbol: swap.tokenSymbol,
            success: false,
            error: 'No route found',
          })
          continue
        }

        const bestRoute = quoteData.bestRoute || quoteData.allRoutes?.[0]

        if (!bestRoute || !bestRoute.route || bestRoute.route.length === 0) {
          results.push({
            tokenSymbol: swap.tokenSymbol,
            success: false,
            error: 'No valid route in response',
          })
          continue
        }

        const routeSteps = bestRoute.route.map(extractStepInfo)
        const estimatedOutput = bestRoute.quote || 0
        const minReceived = Math.floor(estimatedOutput * (1 - slippageTolerance))

        let stableswapStep = routeSteps.find(step =>
          step.poolType === 'stableswap' || step.pool.includes('stableswap')
        )
        let xykStep = routeSteps.find(step =>
          step.poolType === 'xyk' || (step.pool.includes('xyk') && !step.pool.includes('stableswap'))
        )

        if (!stableswapStep && !xykStep && routeSteps.length >= 2) {
          stableswapStep = routeSteps[0]
          xykStep = routeSteps[1]
        } else if (!stableswapStep && !xykStep && routeSteps.length === 1) {
          const singleStep = routeSteps[0]
          if (singleStep.pool.includes('stableswap')) {
            stableswapStep = singleStep
          } else {
            xykStep = singleStep
          }
        }

        const hasValidPool = (stableswapStep?.pool || xykStep?.pool)
        if (!hasValidPool) {
          results.push({
            tokenSymbol: swap.tokenSymbol,
            success: false,
            error: 'Could not extract pool addresses',
          })
          continue
        }

        const swapsReversed = routeSteps.some(step => step.isReversed === true)

        const xykSteps = routeSteps.filter(step =>
          step.poolType === 'xyk' || (step.pool.includes('xyk') && !step.pool.includes('stableswap'))
        )
        const swapType: '2hop' | '3hop' = xykSteps.length >= 2 ? '3hop' : '2hop'

        results.push({
          tokenSymbol: swap.tokenSymbol,
          success: true,
          estimatedOutput,
          executionParams: {
            tokenSymbol: swap.tokenSymbol,
            tokenContract: TOKEN_CONTRACTS[toTokenId],
            amount: swap.amount,
            minReceived: minReceived.toString(),
            swapsReversed,
            swapType,
            stableswapTokenA: stableswapStep?.tokenX || BITFLOW_CONTRACTS.USDCX,
            stableswapTokenB: stableswapStep?.tokenY || BITFLOW_CONTRACTS.AEUSDC,
            stableswapPoolA: stableswapStep?.pool || BITFLOW_CONTRACTS.STABLESWAP_USDCX_AEUSDC,
            xykTokenA: xykSteps[0]?.tokenX || BITFLOW_CONTRACTS.AEUSDC,
            xykTokenB: xykSteps[0]?.tokenY || BITFLOW_CONTRACTS.TOKEN_STX,
            xykTokenC: xykSteps[1]?.tokenX,
            xykTokenD: xykSteps[1]?.tokenY,
            xykPoolA: xykSteps[0]?.pool || '',
            xykPoolB: xykSteps[1]?.pool,
            outputToken: xykSteps[xykSteps.length - 1]?.tokenY || TOKEN_CONTRACTS[toTokenId],
            route: routeSteps,
          },
        })
      } catch (error) {
        results.push({
          tokenSymbol: swap.tokenSymbol,
          success: false,
          error: error instanceof Error ? error.message : 'Quote failed',
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })

  } catch (error) {
    console.error('Bitflow batch swap error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get swap params',
    }, { status: 500 })
  }
}
