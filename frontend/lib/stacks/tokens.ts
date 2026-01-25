export interface Token {
  symbol: string
  name: string
  contractAddress: string
  contractName: string
  decimals: number
  color: string
  imageUrl: string
  description?: string
}

export const TOKENS: Record<string, Token> = {
  USDCx: {
    symbol: 'USDCx',
    name: 'USD Coin (Bridged)',
    contractAddress: 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K',
    contractName: 'token-susdc',
    decimals: 6,
    color: '#2775CA',
    imageUrl: '/tokens/usdc.png',
    description: 'USD Coin bridged to Stacks.',
  },
  sBTC: {
    symbol: 'sBTC',
    name: 'sBTC',
    contractAddress: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4',
    contractName: 'sbtc-token',
    decimals: 8,
    color: '#F7931A',
    imageUrl: '/tokens/sbtc.jpg',
    description: 'BTC is a Bitcoin-backed asset on the Stacks Bitcoin L2.',
  },
  stSTX: {
    symbol: 'stSTX',
    name: 'Stacked STX Token',
    contractAddress: 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG',
    contractName: 'ststx-token',
    decimals: 6,
    color: '#5546FF',
    imageUrl: '/tokens/ststx.svg',
    description: 'Liquid STX Token on the Stacks blockchain.',
  },
  STX: {
    symbol: 'STX',
    name: 'Stacks',
    contractAddress: '',
    contractName: '',
    decimals: 6,
    color: '#5546FF',
    imageUrl: '/tokens/stx.png',
    description: 'Native token of the Stacks blockchain.',
  },
  WELSH: {
    symbol: 'WELSH',
    name: 'Welshcorgicoin',
    contractAddress: 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G',
    contractName: 'welshcorgicoin-token',
    decimals: 6,
    color: '#22C55E',
    imageUrl: '/tokens/welsh.jpg',
    description: 'WELSH is the first memecoin built on Stacks blockchain.',
  },
  LEO: {
    symbol: 'LEO',
    name: 'Leo',
    contractAddress: 'SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6',
    contractName: 'leo-token',
    decimals: 6,
    color: '#F59E0B',
    imageUrl: '/tokens/leo.png',
    description: 'Leopold Muneebs Cat.',
  },
  DOG: {
    symbol: 'DOG',
    name: 'DOGGOTOTHEMOON',
    contractAddress: 'SP14NS8MVBRHXMM96BQY0727AJ59SWPV7RMHC0NCG',
    contractName: 'pontis-bridge-DOG',
    decimals: 5,
    color: '#F59E0B',
    imageUrl: '/tokens/dog.png',
    description: 'DOG is an open-source, decentralized digital asset powered by the Bitcoin blockchain.',
  },
  USDh: {
    symbol: 'USDh',
    name: 'Hermetica USDh',
    contractAddress: 'SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG',
    contractName: 'usdh-token-v1',
    decimals: 8,
    color: '#14B8A6',
    imageUrl: '/tokens/usdh.jpg',
    description: 'Hermetica USDh.',
  },
  ALEX: {
    symbol: 'ALEX',
    name: 'ALEX Governance Token',
    contractAddress: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM',
    contractName: 'token-alex',
    decimals: 8,
    color: '#06B6D4',
    imageUrl: '/tokens/alex.jpeg',
    description: 'Bring your Bitcoin to Life.',
  },
  VELAR: {
    symbol: 'VELAR',
    name: 'Velar',
    contractAddress: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1',
    contractName: 'velar-token',
    decimals: 6,
    color: '#A855F7',
    imageUrl: '/tokens/velar.svg',
    description: 'DeFi Liquidity Protocol on Bitcoin.',
  },
  DROID: {
    symbol: 'DROID',
    name: 'Droid',
    contractAddress: 'SP2EEV5QBZA454MSMW9W3WJNRXVJF36VPV17FFKYH.DROID',
    contractName: 'DROID',
    decimals: 6,
    color: '#F59E0B',
    imageUrl: '/tokens/droid.jpg',
    description: 'Interplanetary Treasure Hunt for 2 Bitcoi',
  },
}

// Bitflow AMM Router
export const BITFLOW_ROUTER = {
  contractAddress: 'SPQC38PW542EQJ5M11CR25P7BS1CA6QT4TBXGB3M',
  contractName: 'stableswap-stx-ststx-v-1-2',
}

// Legacy Velar router (deprecated, kept for reference)
export const VELAR_ROUTER = {
  contractAddress: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1',
  contractName: 'univ2-router',
}

export const INDEX_ALLOCATION = {
  sBTC: 0.4,
  stSTX: 0.3,
  STX: 0.3,
}

export function getTokenBySymbol(symbol: string): Token | undefined {
  // Handle case-insensitive and common variations
  const upperSymbol = symbol.toUpperCase()

  // Map uppercase symbols to correct TOKENS keys
  const symbolMap: Record<string, string> = {
    'SBTC': 'sBTC',
    'STSTX': 'stSTX',
    'USDH': 'USDh',
    'USDCX': 'USDCx',
    'STX': 'STX',
    'WELSH': 'WELSH',
    'LEO': 'LEO',
    'DOG': 'DOG',
    'ALEX': 'ALEX',
    'VELAR': 'VELAR',
    'DROID': 'DROID',
  }

  const mappedKey = symbolMap[upperSymbol]
  if (mappedKey) return TOKENS[mappedKey]

  return TOKENS[symbol] || TOKENS[upperSymbol]
}

export function getTokenLogo(symbol: string): string {
  const token = getTokenBySymbol(symbol)
  return token?.imageUrl || ''
}

export function getTokenColor(symbol: string): string {
  const token = getTokenBySymbol(symbol)
  return token?.color || '#6B7280'
}

export function formatTokenAmount(amount: number, decimals: number): string {
  return (amount / Math.pow(10, decimals)).toFixed(decimals > 6 ? 8 : 6)
}

export function parseTokenAmount(amount: string, decimals: number): number {
  return Math.floor(parseFloat(amount) * Math.pow(10, decimals))
}
