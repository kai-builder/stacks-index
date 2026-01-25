'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useWalletStore } from '@/lib/store/wallet'
import { userSession, getWalletAddress } from '@/lib/stacks/wallet'

interface WalletContextType {
  isConnected: boolean
  address: string | null
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  address: null,
})

export function useWallet() {
  return useContext(WalletContext)
}

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { isConnected, address } = useWalletStore()

  useEffect(() => {
    // Sync wallet state from userSession on mount
    // userSession is the source of truth for Stacks wallet connection
    const storeState = useWalletStore.getState()

    if (userSession.isUserSignedIn()) {
      const sessionAddress = getWalletAddress()
      if (sessionAddress) {
        storeState.setConnected(sessionAddress)
      }
    }
  }, [])

  return (
    <WalletContext.Provider value={{ isConnected, address }}>
      {children}
    </WalletContext.Provider>
  )
}
