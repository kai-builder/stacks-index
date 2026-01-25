import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletState {
  isConnected: boolean
  address: string | null
  network: 'mainnet' | 'testnet'
  setConnected: (address: string) => void
  setDisconnected: () => void
  setNetwork: (network: 'mainnet' | 'testnet') => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      isConnected: false,
      address: null,
      network: 'mainnet',
      setConnected: (address: string) =>
        set({ isConnected: true, address }),
      setDisconnected: () =>
        set({ isConnected: false, address: null }),
      setNetwork: (network: 'mainnet' | 'testnet') =>
        set({ network }),
    }),
    {
      name: 'stacks-index-wallet',
      // Only persist network preference - wallet state is synced from userSession
      partialize: (state) => ({
        network: state.network,
      }),
    }
  )
)

export function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
