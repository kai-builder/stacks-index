'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Droplets, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { getTokenBySymbol, TOKENS } from '@/lib/stacks/tokens'
import { formatNumber } from '@/lib/utils/format'

interface TokenBalance {
  symbol: string
  balance: number
  decimals: number
  price: number // USD price
}

interface AddLiquidityModalProps {
  isOpen: boolean
  onClose: () => void
  poolName: string
  poolType: 'xyk' | 'stableswap'
  tokenX: TokenBalance
  tokenY: TokenBalance
  onAddLiquidity: (xAmount: number, yAmount?: number) => Promise<void>
  isLoading: boolean
  error: string | null
  txId: string | null
}

export function AddLiquidityModal({
  isOpen,
  onClose,
  poolName,
  poolType,
  tokenX,
  tokenY,
  onAddLiquidity,
  isLoading,
  error,
  txId,
}: AddLiquidityModalProps) {
  const [xAmount, setXAmount] = useState('')
  const [yAmount, setYAmount] = useState('')

  const tokenXInfo = getTokenBySymbol(tokenX.symbol) || TOKENS[tokenX.symbol]
  const tokenYInfo = getTokenBySymbol(tokenY.symbol) || TOKENS[tokenY.symbol]

  const isStableswap = poolType === 'stableswap'

  // Reset amounts when modal closes
  useEffect(() => {
    if (!isOpen) {
      setXAmount('')
      setYAmount('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    const numXAmount = parseFloat(xAmount)
    const numYAmount = parseFloat(yAmount)

    if (isStableswap) {
      // Stableswap requires both amounts
      if (numXAmount > 0 && numXAmount <= tokenX.balance && numYAmount > 0 && numYAmount <= tokenY.balance) {
        await onAddLiquidity(numXAmount, numYAmount)
      }
    } else {
      // XYK only needs x amount
      if (numXAmount > 0 && numXAmount <= tokenX.balance) {
        await onAddLiquidity(numXAmount)
      }
    }
  }

  // Calculate USD values
  const xUsdValue = tokenX.balance * tokenX.price
  const yUsdValue = tokenY.balance * tokenY.price

  // Calculate balanced max amounts based on whichever token has less USD value
  const calculateBalancedAmounts = () => {
    const minUsdValue = Math.min(xUsdValue, yUsdValue)

    // Calculate token amounts for the balanced USD value
    const balancedXAmount = minUsdValue / tokenX.price
    const balancedYAmount = minUsdValue / tokenY.price

    return {
      xAmount: balancedXAmount,
      yAmount: balancedYAmount,
      usdValue: minUsdValue,
    }
  }

  const handleUseMaxBalanced = () => {
    const balanced = calculateBalancedAmounts()
    setXAmount(balanced.xAmount.toFixed(tokenX.decimals))
    if (isStableswap) {
      setYAmount(balanced.yAmount.toFixed(tokenY.decimals))
    }
  }

  // Current input USD values
  const currentXUsd = xAmount ? parseFloat(xAmount) * tokenX.price : 0
  const currentYUsd = yAmount ? parseFloat(yAmount) * tokenY.price : 0

  const isValidXAmount = xAmount && parseFloat(xAmount) > 0 && parseFloat(xAmount) <= tokenX.balance
  const isValidYAmount = yAmount && parseFloat(yAmount) > 0 && parseFloat(yAmount) <= tokenY.balance
  const isValidAmount = isStableswap ? (isValidXAmount && isValidYAmount) : isValidXAmount

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
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Add Liquidity</h3>
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
                <Image src={tokenXInfo.imageUrl} alt={tokenX.symbol} width={24} height={24} className="rounded-full" />
              )}
              <span className="text-white font-medium">{tokenX.symbol}</span>
            </div>
            <span className="text-slate-500">+</span>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03]">
              {tokenYInfo?.imageUrl && (
                <Image src={tokenYInfo.imageUrl} alt={tokenY.symbol} width={24} height={24} className="rounded-full" />
              )}
              <span className="text-white font-medium">{tokenY.symbol}</span>
            </div>
          </div>

          {/* Balance Info with USD values */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl border ${xUsdValue <= yUsdValue ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/[0.03] border-white/[0.05]'}`}>
              <p className="text-xs text-slate-500 mb-1">Your {tokenX.symbol}</p>
              <p className="text-white font-medium text-sm">
                {formatNumber(tokenX.balance, 8)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                ${formatNumber(xUsdValue, 2)}
                {xUsdValue <= yUsdValue && <span className="text-purple-400 ml-1">(limiting)</span>}
              </p>
            </div>
            <div className={`p-3 rounded-xl border ${yUsdValue < xUsdValue ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/[0.03] border-white/[0.05]'}`}>
              <p className="text-xs text-slate-500 mb-1">Your {tokenY.symbol}</p>
              <p className="text-white font-medium text-sm">
                {formatNumber(tokenY.balance, 2)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                ${formatNumber(yUsdValue, 2)}
                {yUsdValue < xUsdValue && <span className="text-purple-400 ml-1">(limiting)</span>}
              </p>
            </div>
          </div>

          {/* Use Max Balanced Button */}
          <button
            onClick={handleUseMaxBalanced}
            disabled={isLoading}
            className="w-full px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use Max Balanced (${formatNumber(Math.min(xUsdValue, yUsdValue), 2)} each)
          </button>

          {/* Amount Inputs */}
          <div className="space-y-4">
            {/* X Token Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-400">{tokenX.symbol} Amount</label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.00000001"
                  min="0"
                  max={tokenX.balance}
                  value={xAmount}
                  onChange={(e) => setXAmount(e.target.value)}
                  placeholder="0.00000000"
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-20 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {tokenXInfo?.imageUrl && (
                    <Image src={tokenXInfo.imageUrl} alt={tokenX.symbol} width={20} height={20} className="rounded-full" />
                  )}
                  <span className="text-slate-400 text-sm">{tokenX.symbol}</span>
                </div>
              </div>
              {currentXUsd > 0 && (
                <p className="text-xs text-slate-500 text-right">${formatNumber(currentXUsd, 2)}</p>
              )}
            </div>

            {/* Y Token Amount - Only for stableswap pools */}
            {isStableswap && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-400">{tokenY.symbol} Amount</label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    max={tokenY.balance}
                    value={yAmount}
                    onChange={(e) => setYAmount(e.target.value)}
                    placeholder="0.000000"
                    disabled={isLoading}
                    className="w-full px-4 py-3 pr-20 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {tokenYInfo?.imageUrl && (
                      <Image src={tokenYInfo.imageUrl} alt={tokenY.symbol} width={20} height={20} className="rounded-full" />
                    )}
                    <span className="text-slate-400 text-sm">{tokenY.symbol}</span>
                  </div>
                </div>
                {currentYUsd > 0 && (
                  <p className="text-xs text-slate-500 text-right">${formatNumber(currentYUsd, 2)}</p>
                )}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-300 text-xs">
                {isStableswap
                  ? 'This stableswap pool requires both token amounts. You will receive LP tokens representing your share and earn trading fees.'
                  : 'Adding liquidity will provide your tokens to the pool. The pool will automatically balance based on current ratios.'}
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
                Liquidity added successfully!
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
            className="w-full px-4 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding Liquidity...
              </>
            ) : (
              <>
                <Droplets className="w-4 h-4" />
                Add Liquidity
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
