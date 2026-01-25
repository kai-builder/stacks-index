import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// WalletConnect project ID - replace with your own in production
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo'

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

// Contract addresses from USDCx documentation
export const CONTRACTS = {
  mainnet: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const,
    xReserve: '0x8888888199b2Df864bf678259607d6D5EBb4e3Ce' as const,
    chainId: mainnet.id,
  },
  testnet: {
    // Sepolia testnet
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as const,
    xReserve: '0x008888878f94C0d87defdf0B07f46B93C1934442' as const,
    chainId: sepolia.id,
  },
}

// Helper to get contracts for current network
export function getEthContracts(isMainnet: boolean) {
  return isMainnet ? CONTRACTS.mainnet : CONTRACTS.testnet
}

// Helper to get chain for current network
export function getEthChain(isMainnet: boolean) {
  return isMainnet ? mainnet : sepolia
}

// USDC has 6 decimals
export const USDC_DECIMALS = 6

// USDCx contract on Stacks
export const USDCX_CONTRACT = {
  mainnet: {
    address: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE',
    tokenName: 'usdcx',
    reserveName: 'usdcx-v1',
  },
  testnet: {
    address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    tokenName: 'usdcx',
    reserveName: 'usdcx-v1',
  },
}
