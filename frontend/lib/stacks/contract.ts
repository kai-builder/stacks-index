// StacksIndex Investment Constants
// V2: SDK-based approach - uses Velar and Alex SDKs directly
// - wSTX: via Velar SDK (USDCx -> wSTX)
// - sBTC: via Alex SDK (USDCx -> sBTC)
//
// This approach is more reliable than custom Bitflow router contracts:
// - No API keys required for Alex/Velar
// - SDKs handle routing automatically
// - More tokens can be added as SDK support expands
//
// Note: Swaps are executed as separate transactions (not atomic)


export const STACKS_INDEX_CONTRACT = {
  address: 'SP2QGQ3R0RH96SEGEV6YBK8QDPF7CQ0ATC2E7FH67',
  name: 'stacks-index-oneclick-beta',
  fullName: 'SP2QGQ3R0RH96SEGEV6YBK8QDPF7CQ0ATC2E7FH67.stacks-index-oneclick-beta',
}

// Bitflow Multihop Router (v1.2 - for wSTX, sBTC, ALEX)
export const BITFLOW_ROUTER = {
  address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
  name: 'router-stableswap-xyk-multihop-v-1-2',
  fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.router-stableswap-xyk-multihop-v-1-2',
}

// Bitflow Multihop Router (v1.5 - for WELSH, dual stableswap)
export const BITFLOW_ROUTER_V15 = {
  address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
  name: 'router-stableswap-xyk-multihop-v-1-5',
  fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.router-stableswap-xyk-multihop-v-1-5',
}

// Bitflow Velar Router (for LEO)
export const BITFLOW_ROUTER_VELAR = {
  address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
  name: 'router-stableswap-velar-v-1-5',
  fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.router-stableswap-velar-v-1-5',
}

// Token Contracts (Mainnet)
export const TOKEN_CONTRACTS = {
  USDCx: {
    address: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE',
    name: 'usdcx',
    fullName: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
    decimals: 6,
    bitflowTokenId: 'token-usdcx',
  },
  sBTC: {
    address: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4',
    name: 'sbtc-token',
    fullName: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
    decimals: 8,
    bitflowTokenId: 'token-sbtc',
  },
  wSTX: {
    address: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1',
    name: 'wstx',
    fullName: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.wstx',
    decimals: 6,
    bitflowTokenId: 'token-wstx',
  },
  ALEX: {
    address: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM',
    name: 'token-alex',
    fullName: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex',
    decimals: 8,
    bitflowTokenId: 'token-alex',
  },
  WELSH: {
    address: 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G',
    name: 'welshcorgicoin-token',
    fullName: 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token',
    decimals: 6,
    bitflowTokenId: 'token-welsh',
  },
  LEO: {
    address: 'SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6',
    name: 'leo-token',
    fullName: 'SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6.leo-token',
    decimals: 6,
    bitflowTokenId: 'token-leo',
  },
  DROID: {
    address: 'SP2EEV5QBZA454MSMW9W3WJNRXVJF36VPV17FFKYH',
    name: 'DROID',
    fullName: 'SP2EEV5QBZA454MSMW9W3WJNRXVJF36VPV17FFKYH.DROID',
    decimals: 6,
    bitflowTokenId: 'token-droid',
  },
  ROO: {
    address: 'SP2C1WREHGM75C7TGFAEJPFKTFTEGZKF6DFT6E2GE',
    name: 'kangaroo',
    fullName: 'SP2C1WREHGM75C7TGFAEJPFKTFTEGZKF6DFT6E2GE.kangaroo',
    decimals: 6,
    bitflowTokenId: 'token-roo',
  },
  VELAR: {
    address: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1',
    name: 'velar-token',
    fullName: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.velar-token',
    decimals: 6,
    bitflowTokenId: 'token-velar',
  },
  stSTX: {
    address: 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG',
    name: 'ststx-token',
    fullName: 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token',
    decimals: 6,
    bitflowTokenId: 'token-ststx',
  },
  USDH: {
    address: 'SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG',
    name: 'usdh-token-v1',
    fullName: 'SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.usdh-token-v1',
    decimals: 8,
    bitflowTokenId: 'token-usdh',
  },
  DOG: {
    address: 'SP14NS8MVBRHXMM96BQY0727AJ59SWPV7RMHC0NCG',
    name: 'pontis-bridge-DOG',
    fullName: 'SP14NS8MVBRHXMM96BQY0727AJ59SWPV7RMHC0NCG.pontis-bridge-DOG',
    decimals: 8,
    bitflowTokenId: 'token-dog',
  },
}

// Strategy IDs - V36: Simplified strategies with custom allocations
export const STRATEGIES = {
  BITCOIN_MAXI: 1,      // sBTC + STX
  MEME_HUNTER: 2,       // WELSH, LEO, DOG, DROID
  DEFI_YIELD: 3,        // USDH, sBTC, STX, stSTX
  STACKS_BELIEVER: 4,   // ALEX, VELAR, STX
}

export interface StrategyAllocation {
  name: string
  description: string
  risk: 'low' | 'medium' | 'high' | 'degen'
  allocations: {
    stx?: number
    wstx?: number  // Legacy alias for stx
    sbtc?: number
    ststx?: number
    usdh?: number
    dog?: number
    welsh?: number
    leo?: number
    alex?: number
    roo?: number
    droid?: number
    velar?: number
  }
  color: string
  icon: string
}

// V36 Strategies - Simplified with custom allocations
// Each strategy has default allocations but users can customize
export const STRATEGY_ALLOCATIONS: Record<number, StrategyAllocation> = {
  [STRATEGIES.BITCOIN_MAXI]: {
    name: 'Bitcoin Maxi',
    description: 'Heavy Bitcoin exposure via sBTC + STX',
    risk: 'medium',
    allocations: { sbtc: 60, stx: 40 },
    color: 'orange',
    icon: '₿',
  },
  [STRATEGIES.MEME_HUNTER]: {
    name: 'Meme Hunter',
    description: 'Chase gains with WELSH, LEO, DOG, DROID',
    risk: 'high',
    allocations: { welsh: 30, leo: 30, dog: 25, droid: 15 },
    color: 'green',
    icon: '🐕',
  },
  [STRATEGIES.DEFI_YIELD]: {
    name: 'DeFi Yield',
    description: 'Stable yield with USDH, sBTC, STX, stSTX',
    risk: 'low',
    allocations: { usdh: 30, sbtc: 25, stx: 25, ststx: 20 },
    color: 'blue',
    icon: '🏦',
  },
  [STRATEGIES.STACKS_BELIEVER]: {
    name: 'Stacks Believer',
    description: 'Full Stacks ecosystem with ALEX, VELAR, STX',
    risk: 'medium',
    allocations: { alex: 35, velar: 35, stx: 30 },
    color: 'indigo',
    icon: '🏛️',
  },
}

// AMM Contracts (V13: Bitflow only - highest liquidity)
export const AMM_CONTRACTS = {
  // Bitflow Stableswap Core (swap function lives here, not on pool trait)
  STABLESWAP_CORE: {
    address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
    name: 'stableswap-core-v-1-2',
    fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.stableswap-core-v-1-2',
  },
  // Bitflow XYK Core (swap function lives here, not on pool trait)
  XYK_CORE: {
    address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
    name: 'xyk-core-v-1-2',
    fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-core-v-1-2',
  },
}

// Bitflow Router v1.5 (for STX: 2-hop stableswap + 1 XYK)
export const BITFLOW_ROUTER_2HOP = {
  address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
  name: 'router-stableswap-xyk-v-1-5',
  fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.router-stableswap-xyk-v-1-5',
}

// Bitflow Router Multihop v1.2 (for sBTC: 3-hop stableswap + 2 XYK)
export const BITFLOW_ROUTER_MULTIHOP_V12 = {
  address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
  name: 'router-stableswap-xyk-multihop-v-1-2',
  fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.router-stableswap-xyk-multihop-v-1-2',
}

// Bitflow Pool Contracts (versions from webapp)
export const BITFLOW_POOLS = {
  // Stableswap: USDCx <-> aeUSDC
  STABLESWAP_USDCX_AEUSDC: {
    address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
    name: 'stableswap-pool-aeusdc-usdcx-v-1-1',
    fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.stableswap-pool-aeusdc-usdcx-v-1-1',
  },
  // XYK: aeUSDC <-> token-stx (v-1-1 for STX leg via router v1.5)
  XYK_STX_AEUSDC_V11: {
    address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
    name: 'xyk-pool-stx-aeusdc-v-1-1',
    fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-stx-aeusdc-v-1-1',
  },
  // XYK: aeUSDC <-> token-stx (v-1-2 for sBTC leg pool-a via router multihop v1.2)
  XYK_STX_AEUSDC_V12: {
    address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
    name: 'xyk-pool-stx-aeusdc-v-1-2',
    fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-stx-aeusdc-v-1-2',
  },
  // XYK: token-stx <-> sBTC (v-1-1 for sBTC leg pool-b)
  XYK_SBTC_STX: {
    address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
    name: 'xyk-pool-sbtc-stx-v-1-1',
    fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-stx-v-1-1',
  },
}

// Bitflow Token Contracts (versions from webapp)
export const BITFLOW_TOKENS = {
  USDCX: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
  AEUSDC: 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc',
  // token-stx v-1-1 for STX leg (router v1.5)
  TOKEN_STX_V11: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-1',
  // token-stx v-1-2 for sBTC leg (router multihop v1.2)
  TOKEN_STX_V12: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-2',
  SBTC: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
  // DeFi tokens
  STSTX: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.ststx-token',
  USDH: 'SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.usdh-token-v1',
  // Rune tokens
  DOG: 'SP14NS8MVBRHXMM96BQY0727AJ59SWPV7RMHC0NCG.pontis-bridge-DOG',
  // Meme tokens
  WELSH: 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token',
  LEO: 'SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6.leo-token',
  ROO: 'SP2C1WREHGM75C7TGFAEJPFKTFTEGZKF6DFT6E2GE.kangaroo',
  DROID: 'SP2EEV5QBZA454MSMW9W3WJNRXVJF36VPV17FFKYH.DROID',
}

// Bitflow Pools - additional pools for USDH, DOG, WELSH
export const BITFLOW_POOLS_EXTENDED = {
  // USDH stableswap pool
  STABLESWAP_USDH_USDCX: {
    address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
    name: 'stableswap-pool-usdh-usdcx-v-1-1',
    fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.stableswap-pool-usdh-usdcx-v-1-1',
  },
  // DOG XYK pool (sBTC-DOG)
  XYK_SBTC_DOG: {
    address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
    name: 'xyk-pool-sbtc-dog-v-1-1',
    fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-dog-v-1-1',
  },
  // WELSH XYK pool (WELSH-STX)
  XYK_WELSH_STX: {
    address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
    name: 'xyk-pool-welsh-stx-v-1-1',
    fullName: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-welsh-stx-v-1-1',
  },
}

// Bitflow Trait Contracts
// NOTE: xyk-pool-trait must be v-1-2 for router-stableswap-xyk-multihop-v-1-2
export const BITFLOW_TRAITS = {
  FT_TRAIT: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.sip-010-trait-ft-standard-v-1-1',
  STABLESWAP_POOL_TRAIT: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.stableswap-pool-trait-v-1-4',
  XYK_POOL_TRAIT: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-trait-v-1-2',
}

// Velar Router and Tokens
export const VELAR_ROUTER = {
  address: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1',
  name: 'univ2-router',
  fullName: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.univ2-router',
}

export const VELAR_TOKENS = {
  WSTX: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.wstx',
  USDCX: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
  WELSH: 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token',
  LEO: 'SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6.leo-token',
  ROO: 'SP2C1WREHGM75C7TGFAEJPFKTFTEGZKF6DFT6E2GE.kangaroo',
  DROID: 'SP2EEV5QBZA454MSMW9W3WJNRXVJF36VPV17FFKYH.DROID',
}

export const VELAR_SHARE_FEE_TO = 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.univ2-share-fee-to'

// Alex AMM Router and Tokens
export const ALEX_ROUTER = {
  address: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9',
  name: 'amm-swap-pool-v1-1',
  fullName: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.amm-swap-pool-v1-1',
}

export const ALEX_TOKENS = {
  ALEX: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex',
  WSTX: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-wstx',
}

// Contract Constants
export const CONTRACT_CONSTANTS = {
  MIN_INVESTMENT: 200_000, // 0.2 USDCx (6 decimals)
  MAX_SLIPPAGE: 500, // 5% in basis points
  DEFAULT_SLIPPAGE: 50, // 0.5% in basis points
  MAX_FEE: 100, // 1% in basis points
  BP_DENOMINATOR: 10_000,
}

// Error codes
export const ERROR_CODES: Record<number, string> = {
  1001: 'Not authorized',
  1002: 'Invalid amount',
  1003: 'Invalid allocation',
  1004: 'Swap failed',
  1005: 'Transfer failed',
  1006: 'Slippage exceeded',
  1007: 'Contract is paused',
  1008: 'Invalid strategy',
  1009: 'Insufficient balance',
  1010: 'Minimum investment not met',
  1011: 'Investment not found',
  1012: 'Already processed',
}

// Helper functions
export function getErrorMessage(errorCode: number): string {
  return ERROR_CODES[errorCode] || `Unknown error: ${errorCode}`
}

export function calculateAllocationBreakdown(
  usdcxAmount: number,
  strategyId: number
): Record<string, number> {
  const strategy = STRATEGY_ALLOCATIONS[strategyId]
  if (!strategy) {
    throw new Error('Invalid strategy ID')
  }

  const { allocations } = strategy
  const result: Record<string, number> = {}

  for (const [token, percentage] of Object.entries(allocations)) {
    if (percentage && percentage > 0) {
      result[token] = Math.floor((usdcxAmount * percentage) / 100)
    }
  }

  return result
}

export function toMicroUnits(amount: number, decimals: number = 6): number {
  return Math.floor(amount * Math.pow(10, decimals))
}

export function fromMicroUnits(amount: number, decimals: number = 6): number {
  return amount / Math.pow(10, decimals)
}
