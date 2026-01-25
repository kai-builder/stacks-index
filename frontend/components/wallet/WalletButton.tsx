'use client'

import { useState } from 'react'
import { Wallet, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useWalletStore, truncateAddress } from '@/lib/store/wallet'
import { connectWallet, disconnectWallet } from '@/lib/stacks/wallet'

export function WalletButton() {
  const { isConnected, address, setConnected, setDisconnected } = useWalletStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const result = await connectWallet()
      setConnected(result.address)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
    setDisconnected()
    setIsDropdownOpen(false)
  }

  if (!isConnected) {
    return (
      <Button onClick={handleConnect} isLoading={isLoading} className="px-3 py-2 sm:px-6 sm:py-3">
        <Wallet className="w-4 h-4" />
        <span className="hidden sm:inline">Connect Wallet</span>
        <span className="sm:hidden">Connect</span>
      </Button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
      >
        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
        <span className="text-slate-200 font-medium text-sm sm:text-base">
          {truncateAddress(address || '')}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20">
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-2 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  )
}
