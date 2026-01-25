'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, Check, Loader2, AlertCircle, RefreshCw, ExternalLink, Zap } from 'lucide-react'
import { useWalletStore } from '@/lib/store/wallet'
import { Button } from '@/components/ui/Button'

interface PendingBridge {
  id: string
  amount: number
  allocation: {
    sbtc: number
    ststx: number
    stx: number
  }
  bridgeStatus: 'pending' | 'attesting' | 'minting' | 'completed' | 'failed'
  investStatus: 'waiting' | 'ready' | 'processing' | 'completed' | 'failed'
  createdAt: string
  ethTxHash?: string
  investTxHash?: string
  error?: string
}

interface BridgeMonitorProps {
  pollInterval?: number // milliseconds
  showCompleted?: boolean
}

export function BridgeMonitor({
  pollInterval = 30000,
  showCompleted = false,
}: BridgeMonitorProps) {
  const { address: stacksAddress } = useWalletStore()
  const [bridges, setBridges] = useState<PendingBridge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch pending bridges from API
  const fetchBridges = useCallback(async () => {
    if (!stacksAddress) return

    try {
      const response = await fetch(
        `/api/relayer/status?stacksAddress=${stacksAddress}`
      )
      const data = await response.json()

      if (data.pendingInvests) {
        let filteredBridges = data.pendingInvests

        // Filter out completed if not showing them
        if (!showCompleted) {
          filteredBridges = filteredBridges.filter(
            (b: PendingBridge) =>
              b.bridgeStatus !== 'completed' || b.investStatus !== 'completed'
          )
        }

        setBridges(filteredBridges)
      }

      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      console.error('Failed to fetch bridges:', err)
      setError('Failed to fetch bridge status')
    } finally {
      setIsLoading(false)
    }
  }, [stacksAddress, showCompleted])

  // Initial fetch and polling
  useEffect(() => {
    fetchBridges()

    const interval = setInterval(fetchBridges, pollInterval)
    return () => clearInterval(interval)
  }, [fetchBridges, pollInterval])

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Show notification when bridge completes
  useEffect(() => {
    const completedBridge = bridges.find(
      (b) => b.bridgeStatus === 'completed' && b.investStatus === 'waiting'
    )

    if (completedBridge && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Bridge Complete!', {
        body: `Your ${completedBridge.amount} USDCx is ready. Auto-invest will execute shortly.`,
        icon: '/logo.svg',
        tag: completedBridge.id,
      })
    }
  }, [bridges])

  if (!stacksAddress) {
    return null
  }

  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading bridge status...</span>
        </div>
      </div>
    )
  }

  if (bridges.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">
          Pending Bridges ({bridges.length})
        </h3>
        <button
          onClick={fetchBridges}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Bridge cards */}
      <div className="space-y-3">
        {bridges.map((bridge) => (
          <BridgeCard key={bridge.id} bridge={bridge} />
        ))}
      </div>

      {/* Last update time */}
      {lastUpdate && (
        <p className="text-xs text-slate-600 text-center">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}

// Individual bridge card component
function BridgeCard({ bridge }: { bridge: PendingBridge }) {
  const getStatusColor = () => {
    if (bridge.investStatus === 'completed') return 'border-green-500/30 bg-green-500/5'
    if (bridge.bridgeStatus === 'failed' || bridge.investStatus === 'failed')
      return 'border-red-500/30 bg-red-500/5'
    if (bridge.bridgeStatus === 'completed') return 'border-blue-500/30 bg-blue-500/5'
    return 'border-slate-700 bg-slate-800/50'
  }

  const getStatusIcon = () => {
    if (bridge.investStatus === 'completed') {
      return <Check className="w-5 h-5 text-green-500" />
    }
    if (bridge.bridgeStatus === 'failed' || bridge.investStatus === 'failed') {
      return <AlertCircle className="w-5 h-5 text-red-500" />
    }
    if (bridge.investStatus === 'processing') {
      return <Zap className="w-5 h-5 text-blue-500 animate-pulse" />
    }
    if (bridge.bridgeStatus === 'completed') {
      return <Zap className="w-5 h-5 text-blue-500" />
    }
    return <Clock className="w-5 h-5 text-slate-500" />
  }

  const getStatusText = () => {
    if (bridge.investStatus === 'completed') return 'Invested'
    if (bridge.investStatus === 'processing') return 'Auto-investing...'
    if (bridge.investStatus === 'failed') return 'Investment failed'
    if (bridge.bridgeStatus === 'completed') return 'Ready to invest'
    if (bridge.bridgeStatus === 'failed') return 'Bridge failed'
    if (bridge.bridgeStatus === 'minting') return 'Minting USDCx...'
    if (bridge.bridgeStatus === 'attesting') return 'Processing bridge...'
    return 'Pending'
  }

  const getProgressPercentage = () => {
    const stages = ['pending', 'attesting', 'minting', 'completed']
    const investStages = ['waiting', 'ready', 'processing', 'completed']

    const bridgeProgress = (stages.indexOf(bridge.bridgeStatus) / (stages.length - 1)) * 70
    const investProgress =
      bridge.bridgeStatus === 'completed'
        ? (investStages.indexOf(bridge.investStatus) / (investStages.length - 1)) * 30
        : 0

    return Math.min(100, bridgeProgress + investProgress)
  }

  const createdTime = new Date(bridge.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`p-4 rounded-xl border ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <p className="text-sm font-medium text-white">
              ${bridge.amount.toFixed(2)} USDCx
            </p>
            <p className="text-xs text-slate-500">Started at {createdTime}</p>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            bridge.investStatus === 'completed'
              ? 'bg-green-500/20 text-green-400'
              : bridge.bridgeStatus === 'failed' || bridge.investStatus === 'failed'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-slate-700/50 text-slate-400'
          }`}
        >
          {getStatusText()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              bridge.investStatus === 'completed'
                ? 'bg-green-500'
                : bridge.bridgeStatus === 'failed' || bridge.investStatus === 'failed'
                ? 'bg-red-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Allocation preview */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          {bridge.allocation.sbtc}% sBTC
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          {bridge.allocation.ststx}% stSTX
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          {bridge.allocation.stx}% STX
        </span>
      </div>

      {/* Transaction links */}
      <div className="flex items-center gap-3">
        {bridge.ethTxHash && (
          <a
            href={`https://etherscan.io/tx/${bridge.ethTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            ETH tx
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {bridge.investTxHash && (
          <a
            href={`https://explorer.hiro.so/txid/${bridge.investTxHash}?chain=mainnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Invest tx
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Error message */}
      {bridge.error && (
        <div className="mt-3 p-2 rounded-lg bg-red-500/10">
          <p className="text-xs text-red-400">{bridge.error}</p>
        </div>
      )}
    </div>
  )
}

export default BridgeMonitor
