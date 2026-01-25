'use client'

import { useEffect, useState } from 'react'
import { Clock, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  getPendingBridges,
  BridgeTransaction,
  removeBridgeTransaction,
} from '@/lib/ethereum/bridge'

export function PendingBridges() {
  const [bridges, setBridges] = useState<BridgeTransaction[]>([])

  useEffect(() => {
    setBridges(getPendingBridges().filter(b => b.status !== 'completed'))
  }, [])

  if (bridges.length === 0) {
    return null
  }

  const handleDismiss = (id: string) => {
    removeBridgeTransaction(id)
    setBridges(bridges.filter(b => b.id !== id))
  }

  const formatTime = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes === 1) return '1 minute ago'
    return `${minutes} minutes ago`
  }

  return (
    <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-medium text-amber-400">
          Pending Bridge Transactions
        </h3>
      </div>

      <div className="space-y-3">
        {bridges.map((bridge) => (
          <div
            key={bridge.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50"
          >
            <div>
              <p className="text-sm font-medium text-white">
                {bridge.amount} USDC → USDCx
              </p>
              <p className="text-xs text-slate-500">
                Started {formatTime(bridge.startTime)} • Status: {bridge.status}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {bridge.ethTxHash && (
                <a
                  href={`https://etherscan.io/tx/${bridge.ethTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {bridge.status === 'failed' && (
                <button
                  onClick={() => handleDismiss(bridge.id)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
