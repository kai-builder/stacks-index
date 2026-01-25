'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Droplets, ExternalLink, Loader2, AlertTriangle } from 'lucide-react'
import { getTokenBySymbol, TOKENS } from '@/lib/stacks/tokens'
import { formatNumber } from '@/lib/utils/format'

interface RemoveLiquidityModalProps {
  isOpen: boolean
  onClose: () => void
  poolName: string
  poolType: 'xyk' | 'stableswap'
  lpBalance: number // LP token balance
  xTokenSymbol: string
  yTokenSymbol: string
  onRemoveLiquidity: (lpAmount: number) => Promise<void>
  isLoading: boolean
  error: string | null
  txId: string | null
}

export function RemoveLiquidityModal({
  isOpen,
  onClose,
  poolName,
  poolType,
  lpBalance,
  xTokenSymbol,
  yTokenSymbol,
  onRemoveLiquidity,
  isLoading,
  error,
  txId,
}: RemoveLiquidityModalProps) {
  const [amount, setAmount] = useState('')
  const [percentage, setPercentage] = useState(0)

  const tokenXInfo = getTokenBySymbol(xTokenSymbol) || TOKENS[xTokenSymbol]
  const tokenYInfo = getTokenBySymbol(yTokenSymbol) || TOKENS[yTokenSymbol]

  const isStableswap = poolType === 'stableswap'

  // Reset amount when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('')
      setPercentage(0)
    }
  }, [isOpen])

  // Sync percentage with amount
  useEffect(() => {
    if (amount && lpBalance > 0) {
      const pct = (parseFloat(amount) / lpBalance) * 100
      setPercentage(Math.min(100, Math.max(0, pct)))
    } else {
      setPercentage(0)
    }
  }, [amount, lpBalance])

  if (!isOpen) return null

  const handlePercentageClick = (pct: number) => {
    const lpAmount = (lpBalance * pct) / 100
    setAmount(lpAmount.toFixed(6))
    setPercentage(pct)
  }

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (numAmount > 0 && numAmount <= lpBalance) {
      await onRemoveLiquidity(numAmount)
    }
  }

  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= lpBalance

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Remove Liquidity</h3>
              <p className="text-sm text-slate-400">{poolName} Pool</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Pool Tokens Display */}
          <div className="flex items-center justify-center gap-2 py-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03]">
              {tokenXInfo?.imageUrl && (
                <Image src={tokenXInfo.imageUrl} alt={xTokenSymbol} width={24} height={24} className="rounded-full" />
              )}
              <span className="text-white font-medium">{xTokenSymbol}</span>
            </div>
            <span className="text-slate-500">+</span>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03]">
              {tokenYInfo?.imageUrl && (
                <Image src={tokenYInfo.imageUrl} alt={yTokenSymbol} width={24} height={24} className="rounded-full" />
              )}
              <span className="text-white font-medium">{yTokenSymbol}</span>
            </div>
          </div>

          {/* LP Balance */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Your LP Tokens</p>
              <p className="text-white font-medium">
                {formatNumber(lpBalance, 6)} LP
              </p>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 text-right">
              {percentage.toFixed(1)}% selected
            </p>
          </div>

          {/* Percentage Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => handlePercentageClick(pct)}
                disabled={isLoading}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                  percentage === pct
                    ? 'bg-red-500/30 text-red-400 border border-red-500/50'
                    : 'bg-white/[0.03] text-slate-400 border border-white/[0.05] hover:bg-white/[0.08]'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">LP Amount to Remove</label>
            <div className="relative">
              <input
                type="number"
                step="0.000001"
                min="0"
                max={lpBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.000000"
                disabled={isLoading}
                className="w-full px-4 py-3 pr-16 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 disabled:opacity-50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-slate-400 text-sm">LP</span>
              </div>
            </div>
          </div>

          {/* Warning Box */}
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-orange-300 text-xs">
                Removing liquidity will burn your LP tokens and return the underlying tokens proportionally.
                {isStableswap
                  ? ' You will receive both STX and stSTX.'
                  : ' You will receive both tokens based on current pool ratios.'}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {txId && (
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-green-400 text-sm flex items-center gap-2">
                Liquidity removed successfully!
                <a
                  href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 underline"
                >
                  View tx <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08]">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !isValidAmount}
            className="w-full px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Removing Liquidity...
              </>
            ) : (
              <>
                <Droplets className="w-4 h-4" />
                Remove Liquidity
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Bitflow {poolName} • {isStableswap ? 'stableswap-core-v-1-4' : 'xyk-core-v-1-2'}
          </p>
        </div>
      </div>
    </div>
  )
}
