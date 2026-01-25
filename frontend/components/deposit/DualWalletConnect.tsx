'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { Wallet, Loader2, X, ChevronRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useWalletStore, truncateAddress } from '@/lib/store/wallet'
import { connectWallet, disconnectWallet } from '@/lib/stacks/wallet'
import { useDepositStore } from '@/lib/store/deposit'
import { getEthContracts } from '@/lib/ethereum/config'
import { fetchUsdcxBalanceFromApi } from '@/lib/stacks/usdcx'

export function DualWalletConnect() {
  const {
    setEthWallet,
    setStacksWallet,
  } = useDepositStore()

  const [showWalletSelector, setShowWalletSelector] = useState(false)
  const [usdcxBalance, setUsdcxBalance] = useState('0')
  const [isLoadingUsdcxBalance, setIsLoadingUsdcxBalance] = useState(false)

  // Network state
  const {
    network,
    isConnected: isStacksConnected,
    address: stacksWalletAddress,
    setConnected: setStacksConnected,
    setDisconnected: setStacksDisconnected,
  } = useWalletStore()

  const isMainnet = network === 'mainnet'
  const ethContracts = getEthContracts(isMainnet)

  // Ethereum wallet state (wagmi)
  const { address: wagmiAddress, isConnected: isEthConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect()
  const { disconnect: disconnectEth } = useDisconnect()
  const { data: usdcBalance } = useBalance({
    address: wagmiAddress,
    token: ethContracts.USDC,
  })

  // Sync Ethereum wallet state
  useEffect(() => {
    if (wagmiAddress && usdcBalance) {
      setEthWallet(wagmiAddress, usdcBalance.formatted)
    } else if (wagmiAddress) {
      setEthWallet(wagmiAddress, '0')
    } else {
      setEthWallet(null, '0')
    }
  }, [wagmiAddress, usdcBalance, setEthWallet])

  // Fetch USDCx balance from Stacks chain
  const fetchUsdcxBalance = useCallback(async () => {
    if (!stacksWalletAddress) {
      setUsdcxBalance('0')
      return
    }

    setIsLoadingUsdcxBalance(true)
    try {
      // Fetch USDCx balance using Hiro API
      // Mainnet: SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx::usdcx-token
      // Testnet: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx::usdcx-token
      const { formatted } = await fetchUsdcxBalanceFromApi(stacksWalletAddress, isMainnet)
      setUsdcxBalance(formatted)
    } catch (error) {
      console.error('Error fetching USDCx balance:', error)
      setUsdcxBalance('0')
    } finally {
      setIsLoadingUsdcxBalance(false)
    }
  }, [stacksWalletAddress, isMainnet])

  // Sync Stacks wallet state and fetch USDCx balance
  useEffect(() => {
    setStacksWallet(stacksWalletAddress, usdcxBalance)
    if (stacksWalletAddress) {
      fetchUsdcxBalance()
    }
  }, [stacksWalletAddress, setStacksWallet, usdcxBalance, fetchUsdcxBalance])

  // Close modal when connected
  useEffect(() => {
    if (isEthConnected) {
      setShowWalletSelector(false)
    }
  }, [isEthConnected])

  const handleConnectEth = (connectorId?: string) => {
    if (connectorId) {
      const connector = connectors.find(c => c.id === connectorId)
      if (connector) {
        connect({ connector })
      }
    } else {
      // Show wallet selector modal
      setShowWalletSelector(true)
    }
  }

  const handleConnectStacks = async () => {
    try {
      const result = await connectWallet()
      setStacksConnected(result.address)
    } catch (error) {
      console.error('Failed to connect Stacks wallet:', error)
    }
  }

  const handleDisconnectStacks = () => {
    disconnectWallet()
    setStacksDisconnected()
  }

  // Get available connectors with metadata
  const availableConnectors = connectors.map(connector => ({
    id: connector.id,
    name: getConnectorName(connector.id, connector.name),
    icon: getConnectorIcon(connector.id),
    ready: true,
  }))

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Ethereum Wallet */}
        <WalletCard
          network={isMainnet ? 'Ethereum' : 'Sepolia'}
          networkColor="#627EEA"
          icon={<EthereumIcon />}
          isConnected={isEthConnected}
          isConnecting={isConnecting}
          address={wagmiAddress}
          balance={usdcBalance?.formatted || '0'}
          balanceSymbol="USDC"
          isTestnet={!isMainnet}
          onConnect={() => handleConnectEth()}
          onDisconnect={() => disconnectEth()}
        />

        {/* Stacks Wallet */}
        <WalletCard
          network={isMainnet ? 'Stacks' : 'Stacks Testnet'}
          networkColor="#5546FF"
          icon={<StacksIcon />}
          isConnected={isStacksConnected}
          isConnecting={false}
          address={stacksWalletAddress}
          balance={usdcxBalance}
          balanceSymbol="USDCx"
          isLoadingBalance={isLoadingUsdcxBalance}
          onRefreshBalance={fetchUsdcxBalance}
          isTestnet={!isMainnet}
          onConnect={handleConnectStacks}
          onDisconnect={handleDisconnectStacks}
        />
      </div>

      {/* Wallet Selector Modal */}
      {showWalletSelector && (
        <WalletSelectorModal
          connectors={availableConnectors}
          isConnecting={isConnecting}
          error={connectError?.message}
          onSelect={(connectorId) => {
            const connector = connectors.find(c => c.id === connectorId)
            if (connector) {
              connect({ connector })
            }
          }}
          onClose={() => setShowWalletSelector(false)}
        />
      )}
    </>
  )
}

interface WalletCardProps {
  network: string
  networkColor: string
  icon: React.ReactNode
  isConnected: boolean
  isConnecting: boolean
  address: string | null | undefined
  balance: string
  balanceSymbol: string
  isLoadingBalance?: boolean
  onRefreshBalance?: () => void
  isTestnet?: boolean
  onConnect: () => void
  onDisconnect: () => void
}

function WalletCard({
  network,
  networkColor,
  icon,
  isConnected,
  isConnecting,
  address,
  balance,
  balanceSymbol,
  isLoadingBalance,
  onRefreshBalance,
  isTestnet,
  onConnect,
  onDisconnect,
}: WalletCardProps) {
  return (
    <div className={`relative p-4 rounded-2xl bg-slate-900/50 border transition-all hover:border-slate-700 ${isTestnet ? 'border-amber-500/30' : 'border-slate-800'}`}>
      {/* Testnet badge */}
      {isTestnet && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500 text-amber-950 rounded-full">
          Testnet
        </div>
      )}
      {/* Network indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${networkColor}20` }}
          >
            {icon}
          </div>
          <span className="font-medium text-white">{network}</span>
        </div>
        {isConnected && (
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isTestnet ? 'bg-amber-500' : 'bg-green-500'}`} />
            <span className={`text-xs ${isTestnet ? 'text-amber-400' : 'text-green-400'}`}>Connected</span>
          </div>
        )}
      </div>

      {isConnected && address ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Address</span>
            <span className="text-sm font-mono text-white">
              {truncateAddress(address)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Balance</span>
            <div className="flex items-center gap-2">
              {isLoadingBalance ? (
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              ) : (
                <span className="text-sm font-medium text-white">
                  {parseFloat(balance).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {balanceSymbol}
                </span>
              )}
              {onRefreshBalance && (
                <button
                  onClick={onRefreshBalance}
                  disabled={isLoadingBalance}
                  className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-50 cursor-pointer"
                  title="Refresh balance"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onDisconnect}
            className="w-full mt-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <Button
          onClick={onConnect}
          variant="secondary"
          className="w-full"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4" />
          )}
          {isConnecting ? 'Connecting...' : `Connect ${network}`}
        </Button>
      )}
    </div>
  )
}

interface WalletSelectorModalProps {
  connectors: Array<{
    id: string
    name: string
    icon: React.ReactNode
    ready: boolean
  }>
  isConnecting: boolean
  error?: string
  onSelect: (connectorId: string) => void
  onClose: () => void
}

function WalletSelectorModal({
  connectors,
  isConnecting,
  error,
  onSelect,
  onClose,
}: WalletSelectorModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-heading text-lg font-semibold text-white">
            Connect Ethereum Wallet
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {error && (
            <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => onSelect(connector.id)}
              disabled={isConnecting || !connector.ready}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                  {connector.icon}
                </div>
                <span className="font-medium text-white">{connector.name}</span>
              </div>
              {isConnecting ? (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-500" />
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">
            By connecting, you agree to the Terms of Service
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getConnectorName(id: string, fallbackName: string): string {
  const names: Record<string, string> = {
    'injected': 'Browser Wallet',
    'metaMask': 'MetaMask',
    'metamask': 'MetaMask',
    'walletConnect': 'WalletConnect',
    'coinbaseWallet': 'Coinbase Wallet',
    'coinbaseWalletSDK': 'Coinbase Wallet',
  }
  return names[id] || fallbackName
}

function getConnectorIcon(id: string): React.ReactNode {
  switch (id) {
    case 'metaMask':
    case 'metamask':
      return <MetaMaskIcon />
    case 'walletConnect':
      return <WalletConnectIcon />
    case 'coinbaseWallet':
    case 'coinbaseWalletSDK':
      return <CoinbaseIcon />
    case 'injected':
    default:
      return <Wallet className="w-5 h-5 text-slate-300" />
  }
}

function EthereumIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M12 1.5L5.5 12.25L12 16L18.5 12.25L12 1.5Z" fill="#627EEA" />
      <path d="M12 16L5.5 12.25L12 22.5L18.5 12.25L12 16Z" fill="#627EEA" opacity="0.6" />
    </svg>
  )
}

function StacksIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M6 8H18L21 12L18 16H6L3 12L6 8Z" fill="#5546FF" />
      <path d="M8 10H16L18 12L16 14H8L6 12L8 10Z" fill="#7C6CFF" />
    </svg>
  )
}

function MetaMaskIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M21.5 3L13.5 9L15 5.5L21.5 3Z" fill="#E17726" />
      <path d="M2.5 3L10.4 9.1L9 5.5L2.5 3Z" fill="#E27625" />
      <path d="M18.5 17L16.5 20L21 21.5L22 17.1L18.5 17Z" fill="#E27625" />
      <path d="M2 17.1L3 21.5L7.5 20L5.5 17L2 17.1Z" fill="#E27625" />
      <path d="M7.3 11L6 13L10.5 13.2L10.3 8.5L7.3 11Z" fill="#E27625" />
      <path d="M16.7 11L13.6 8.4L13.5 13.2L18 13L16.7 11Z" fill="#E27625" />
      <path d="M7.5 20L10.2 18.5L7.8 17.1L7.5 20Z" fill="#E27625" />
      <path d="M13.8 18.5L16.5 20L16.2 17.1L13.8 18.5Z" fill="#E27625" />
      <path d="M16.5 20L13.8 18.5L14 20.4V21.4L16.5 20Z" fill="#D5BFB2" />
      <path d="M7.5 20L10 21.4V20.4L10.2 18.5L7.5 20Z" fill="#D5BFB2" />
      <path d="M10.1 15.5L7.7 14.8L9.4 14L10.1 15.5Z" fill="#233447" />
      <path d="M13.9 15.5L14.6 14L16.3 14.8L13.9 15.5Z" fill="#233447" />
      <path d="M7.5 20L7.8 17L5.5 17.1L7.5 20Z" fill="#CC6228" />
      <path d="M16.2 17L16.5 20L18.5 17.1L16.2 17Z" fill="#CC6228" />
      <path d="M18 13L13.5 13.2L13.9 15.5L14.6 14L16.3 14.8L18 13Z" fill="#CC6228" />
      <path d="M7.7 14.8L9.4 14L10.1 15.5L10.5 13.2L6 13L7.7 14.8Z" fill="#CC6228" />
      <path d="M6 13L7.8 17.1L7.7 14.8L6 13Z" fill="#E27525" />
      <path d="M16.3 14.8L16.2 17.1L18 13L16.3 14.8Z" fill="#E27525" />
      <path d="M10.5 13.2L10.1 15.5L10.6 18L10.7 14.5L10.5 13.2Z" fill="#E27525" />
      <path d="M13.5 13.2L13.3 14.5L13.4 18L13.9 15.5L13.5 13.2Z" fill="#E27525" />
      <path d="M13.9 15.5L13.4 18L13.8 18.5L16.2 17.1L16.3 14.8L13.9 15.5Z" fill="#F5841F" />
      <path d="M7.7 14.8L7.8 17.1L10.2 18.5L10.6 18L10.1 15.5L7.7 14.8Z" fill="#F5841F" />
      <path d="M14 21.4V20.4L13.8 20.2H10.2L10 20.4V21.4L7.5 20L8.4 20.7L10.2 22H13.9L15.7 20.7L16.5 20L14 21.4Z" fill="#C0AC9D" />
      <path d="M13.8 18.5L13.4 18H10.6L10.2 18.5L10 20.4L10.2 20.2H13.8L14 20.4L13.8 18.5Z" fill="#161616" />
      <path d="M21.8 9.5L22.5 6L21.5 3L13.8 8.7L16.7 11L20.5 12L21.8 10.5L21.3 10.1L22.1 9.4L21.5 9L22.3 8.3L21.8 9.5Z" fill="#763E1A" />
      <path d="M1.5 6L2.2 9.5L1.6 8.3L2.5 9L1.9 9.4L2.7 10.1L2.2 10.5L3.5 12L7.3 11L10.2 8.7L2.5 3L1.5 6Z" fill="#763E1A" />
      <path d="M20.5 12L16.7 11L18 13L16.2 17.1L18.5 17H22L20.5 12Z" fill="#F5841F" />
      <path d="M7.3 11L3.5 12L2 17H5.5L7.8 17.1L6 13L7.3 11Z" fill="#F5841F" />
      <path d="M13.5 13.2L13.8 8.7L15 5.5H9L10.2 8.7L10.5 13.2L10.6 14.5V18H13.4L13.5 14.5L13.5 13.2Z" fill="#F5841F" />
    </svg>
  )
}

function WalletConnectIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.5 8.5C10.5-0.5 17.5 6.5 17.5 8.5"
        stroke="#3B99FC"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 12C4 12 8 6 12 6C16 6 20 12 20 12"
        stroke="#3B99FC"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 15.5L12 21L17.5 15.5"
        stroke="#3B99FC"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CoinbaseIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#0052FF" />
      <rect x="8" y="8" width="8" height="8" rx="2" fill="white" />
    </svg>
  )
}
