'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown, Check, AlertTriangle } from 'lucide-react'
import { useWalletStore } from '@/lib/store/wallet'
import { useSwitchChain, useAccount } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

type NetworkOption = {
  id: 'mainnet' | 'testnet'
  label: string
  stacksLabel: string
  ethLabel: string
  ethChainId: number
  color: string
  bgColor: string
}

const networks: NetworkOption[] = [
  {
    id: 'mainnet',
    label: 'Mainnet',
    stacksLabel: 'Stacks Mainnet',
    ethLabel: 'Ethereum',
    ethChainId: mainnet.id,
    color: 'text-green-400',
    bgColor: 'bg-green-500',
  },
  {
    id: 'testnet',
    label: 'Testnet',
    stacksLabel: 'Stacks Testnet',
    ethLabel: 'Sepolia',
    ethChainId: sepolia.id,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500',
  },
]

export function NetworkSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { network, setNetwork } = useWalletStore()
  const { isConnected: isEthConnected, chainId: currentChainId } = useAccount()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()

  const currentNetwork = networks.find((n) => n.id === network) || networks[0]

  // Check if Ethereum chain matches expected network
  const isChainMismatch =
    isEthConnected &&
    currentChainId &&
    currentChainId !== currentNetwork.ethChainId

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNetworkChange = async (newNetwork: NetworkOption) => {
    if (newNetwork.id === network) {
      setIsOpen(false)
      return
    }

    setIsSwitching(true)

    try {
      // Update Stacks network in store
      setNetwork(newNetwork.id)

      // If Ethereum wallet is connected, switch chain
      if (isEthConnected && switchChain) {
        try {
          await switchChain({ chainId: newNetwork.ethChainId })
        } catch (error) {
          console.error('Failed to switch Ethereum chain:', error)
          // Still keep the Stacks network change even if ETH switch fails
        }
      }
    } finally {
      setIsSwitching(false)
      setIsOpen(false)
    }
  }

  // Handle chain mismatch - switch ETH to match
  const handleFixChainMismatch = async () => {
    if (switchChain && currentNetwork) {
      try {
        await switchChain({ chainId: currentNetwork.ethChainId })
      } catch (error) {
        console.error('Failed to switch chain:', error)
      }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching || isSwitchingChain}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
          isChainMismatch
            ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
            : 'bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
        } disabled:opacity-50`}
      >
        {isChainMismatch ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <>
            <span
              className={`w-2 h-2 rounded-full ${currentNetwork.bgColor}`}
            />
            <Globe className="w-4 h-4" />
          </>
        )}
        <span className="hidden sm:inline">
          {isChainMismatch ? 'Wrong Network' : currentNetwork.label}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-3 border-b border-slate-800">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Select Network
            </p>
          </div>

          <div className="p-2">
            {networks.map((net) => (
              <button
                key={net.id}
                onClick={() => handleNetworkChange(net)}
                disabled={isSwitching || isSwitchingChain}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  net.id === network
                    ? 'bg-slate-800 border border-slate-700'
                    : 'hover:bg-slate-800/50'
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${net.bgColor}`} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{net.label}</p>
                    <p className="text-xs text-slate-500">
                      {net.ethLabel} + {net.stacksLabel}
                    </p>
                  </div>
                </div>
                {net.id === network && (
                  <Check className="w-4 h-4 text-green-400" />
                )}
              </button>
            ))}
          </div>

          {/* Chain mismatch warning */}
          {isChainMismatch && (
            <div className="p-3 border-t border-slate-800 bg-amber-500/10">
              <p className="text-xs text-amber-400 mb-2">
                Your Ethereum wallet is on the wrong network.
              </p>
              <button
                onClick={handleFixChainMismatch}
                disabled={isSwitchingChain}
                className="w-full px-3 py-2 text-xs font-medium text-amber-900 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSwitchingChain
                  ? 'Switching...'
                  : `Switch to ${currentNetwork.ethLabel}`}
              </button>
            </div>
          )}

          {/* Testnet warning */}
          {network === 'testnet' && !isChainMismatch && (
            <div className="p-3 border-t border-slate-800 bg-slate-800/50">
              <p className="text-xs text-slate-400">
                Testnet uses test tokens with no real value. Use Sepolia faucets
                to get test ETH and USDC.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
