import { create } from 'zustand'
import { getAccountBalances } from '@/lib/api/hiro'
import { fromMicroUnits, TOKEN_CONTRACTS } from '@/lib/stacks/contract'

interface BalanceState {
  usdcxBalance: number
  lastUpdated: number | null
  isLoading: boolean
  error: string | null
  // Actions
  setBalance: (balance: number) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  fetchBalance: (address: string, isMainnet: boolean) => Promise<void>
}

export const useBalanceStore = create<BalanceState>((set, get) => ({
  usdcxBalance: 0,
  lastUpdated: null,
  isLoading: false,
  error: null,

  setBalance: (balance) =>
    set({ usdcxBalance: balance, lastUpdated: Date.now(), error: null }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  fetchBalance: async (address: string, isMainnet: boolean) => {
    if (!address) return

    // Don't refetch if we have recent data (within 10 seconds)
    const { lastUpdated, isLoading } = get()
    const now = Date.now()
    if (isLoading) return
    if (lastUpdated && now - lastUpdated < 10000) return

    set({ isLoading: true, error: null })

    try {
      const data = await getAccountBalances(address, {
        network: isMainnet ? 'mainnet' : 'testnet',
      })

      const usdcxContract = `${TOKEN_CONTRACTS.USDCx.address}.${TOKEN_CONTRACTS.USDCx.name}`
      const fungibleTokens = data.fungible_tokens || {}

      let balance = '0'
      for (const [key, value] of Object.entries(fungibleTokens)) {
        if (key.startsWith(usdcxContract)) {
          balance = (value as { balance: string }).balance || '0'
          break
        }
      }

      set({
        usdcxBalance: fromMicroUnits(parseInt(balance)),
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      })
    } catch (err) {
      console.error('Failed to fetch balance:', err)
      set({ isLoading: false, error: 'Failed to fetch balance' })
    }
  },
}))

// Force refresh balance (bypass cache)
export async function forceRefreshBalance(address: string, isMainnet: boolean): Promise<number> {
  const store = useBalanceStore.getState()
  store.setLoading(true)

  try {
    const data = await getAccountBalances(address, {
      network: isMainnet ? 'mainnet' : 'testnet',
    })

    const usdcxContract = `${TOKEN_CONTRACTS.USDCx.address}.${TOKEN_CONTRACTS.USDCx.name}`
    const fungibleTokens = data.fungible_tokens || {}

    let balance = '0'
    for (const [key, value] of Object.entries(fungibleTokens)) {
      if (key.startsWith(usdcxContract)) {
        balance = (value as { balance: string }).balance || '0'
        break
      }
    }

    const balanceNum = fromMicroUnits(parseInt(balance))
    store.setBalance(balanceNum)
    store.setLoading(false)
    return balanceNum
  } catch (err) {
    console.error('Failed to fetch balance:', err)
    store.setLoading(false)
    store.setError('Failed to fetch balance')
    return 0
  }
}
