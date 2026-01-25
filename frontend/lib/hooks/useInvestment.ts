/**
 * useInvestment - Main investment hook
 *
 * V44: Multi-strategy support with dedicated contract functions
 * - BITCOIN_MAXI: sBTC (60%) + STX (40%)
 * - MEME_HUNTER: WELSH (30%) + LEO (30%) + DOG (25%) + DROID (15%)
 * - DEFI_YIELD: USDH (30%) + sBTC (25%) + STX (25%) + stSTX (20%)
 *
 * This is the main hook used by the invest page.
 */

export {
  useInvestmentV44 as useInvestment,
  useContractStats,
  type InvestmentParams,
  type QuoteResult,
  type InvestmentState,
} from './useInvestmentV44'
