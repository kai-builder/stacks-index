'use client'

import { useState, useCallback } from 'react'
import {
  ArrowUpFromLine,
  Wallet,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { useWalletStore } from '@/lib/store/wallet'
import { withdraw, getUserPosition, getExplorerUrl } from '@/lib/stacks/vault'

interface VaultWithdrawProps {
  onSuccess?: () => void
}

type WithdrawMode = 'as_tokens' | 'as_usdcx'
type WithdrawStep = 'input' | 'confirm' | 'processing' | 'success' | 'error'

export function VaultWithdraw({ onSuccess }: VaultWithdrawProps) {
  const { isConnected, address: stacksAddress, network } = useWalletStore()
  const isMainnet = network === 'mainnet'

  // State
  const [step, setStep] = useState<WithdrawStep>('input')
  const [percentage, setPercentage] = useState(100)
  const [mode, setMode] = useState<WithdrawMode>('as_tokens')
  const [isLoading, setIsLoading] = useState(false)
  const [txId, setTxId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Position state (would be fetched from contract)
  const [position, setPosition] = useState({
    sbtcBalance: 0,
    ststxBalance: 0,
    stxBalance: 0,
    totalValue: 0, // in USD
  })

  // Calculate withdrawal amounts
  const withdrawAmounts = {
    sbtc: Math.floor((position.sbtcBalance * percentage) / 100),
    ststx: Math.floor((position.ststxBalance * percentage) / 100),
    stx: Math.floor((position.stxBalance * percentage) / 100),
    estimatedValue: (position.totalValue * percentage) / 100,
  }

  // Load position from contract
  const loadPosition = useCallback(async () => {
    if (!stacksAddress) return

    try {
      const pos = await getUserPosition(stacksAddress, isMainnet)
      setPosition({
        sbtcBalance: pos.sbtcBalance,
        ststxBalance: pos.ststxBalance,
        stxBalance: pos.stxBalance,
        totalValue: 0, // Would calculate from prices
      })
    } catch (err) {
      console.error('Failed to load position:', err)
    }
  }, [stacksAddress, isMainnet])

  // Execute withdrawal
  const handleWithdraw = async () => {
    if (!stacksAddress) return

    setIsLoading(true)
    setError(null)
    setStep('processing')

    try {
      const result = await withdraw(percentage, mode === 'as_usdcx', isMainnet)
      setTxId(result.txId)
      setStep('success')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed')
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset state
  const handleReset = () => {
    setStep('input')
    setPercentage(100)
    setError(null)
    setTxId(null)
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Connect wallet to withdraw</p>
        </CardContent>
      </Card>
    )
  }

  // Success state
  if (step === 'success') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Withdrawal Successful
          </h3>
          <p className="text-slate-400 mb-4">
            {mode === 'as_usdcx'
              ? 'Your position has been converted to USDCx'
              : 'Your tokens have been withdrawn'}
          </p>
          {txId && (
            <a
              href={getExplorerUrl(txId, isMainnet)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-4"
            >
              View transaction
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <Button onClick={handleReset} variant="secondary">
            Done
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (step === 'error') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Withdrawal Failed
          </h3>
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={handleReset}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  // Processing state
  if (step === 'processing') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-bold text-white mb-2">
            Processing Withdrawal
          </h3>
          <p className="text-slate-400">
            Please confirm the transaction in your wallet...
          </p>
        </CardContent>
      </Card>
    )
  }

  // Confirm state
  if (step === 'confirm') {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-heading text-lg font-semibold text-white">
            Confirm Withdrawal
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-800/50 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Percentage</span>
              <span className="text-white font-medium">{percentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mode</span>
              <span className="text-white font-medium">
                {mode === 'as_usdcx' ? 'Convert to USDCx' : 'As tokens'}
              </span>
            </div>
            <div className="border-t border-slate-700 pt-3 space-y-2">
              <h4 className="text-sm text-slate-400">You will receive:</h4>
              {mode === 'as_tokens' ? (
                <>
                  {withdrawAmounts.sbtc > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">sBTC</span>
                      <span className="text-white font-mono">
                        {(withdrawAmounts.sbtc / 1e8).toFixed(8)}
                      </span>
                    </div>
                  )}
                  {withdrawAmounts.ststx > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">stSTX</span>
                      <span className="text-white font-mono">
                        {(withdrawAmounts.ststx / 1e6).toFixed(6)}
                      </span>
                    </div>
                  )}
                  {withdrawAmounts.stx > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">STX</span>
                      <span className="text-white font-mono">
                        {(withdrawAmounts.stx / 1e6).toFixed(6)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">USDCx (estimated)</span>
                  <span className="text-white font-mono">
                    ${withdrawAmounts.estimatedValue.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {mode === 'as_usdcx' && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-400">
                Converting to USDCx involves DEX swaps and may result in slippage.
                Actual amount received may vary.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setStep('input')}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ArrowUpFromLine className="w-4 h-4" />
                  Confirm
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Input state (default)
  return (
    <Card>
      <CardHeader>
        <h3 className="font-heading text-lg font-semibold text-white">
          Withdraw from Vault
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Percentage selector */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Withdraw percentage
          </label>
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setPercentage(pct)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  percentage === pct
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Mode selector */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Withdraw as
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('as_tokens')}
              className={`p-3 rounded-xl border transition-colors text-left ${
                mode === 'as_tokens'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    mode === 'as_tokens'
                      ? 'border-blue-500'
                      : 'border-slate-600'
                  }`}
                >
                  {mode === 'as_tokens' && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    mode === 'as_tokens' ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  Raw Tokens
                </span>
              </div>
              <p className="text-xs text-slate-500 ml-6">
                Receive sBTC, stSTX, STX
              </p>
            </button>

            <button
              onClick={() => setMode('as_usdcx')}
              className={`p-3 rounded-xl border transition-colors text-left ${
                mode === 'as_usdcx'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    mode === 'as_usdcx'
                      ? 'border-blue-500'
                      : 'border-slate-600'
                  }`}
                >
                  {mode === 'as_usdcx' && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    mode === 'as_usdcx' ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  As USDCx
                </span>
              </div>
              <p className="text-xs text-slate-500 ml-6">
                Convert to stablecoin
              </p>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
          <p className="text-xs text-slate-400 mb-2">
            Estimated withdrawal ({percentage}% of position):
          </p>
          {mode === 'as_tokens' ? (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  sBTC
                </span>
                <span className="text-white font-mono">
                  {(withdrawAmounts.sbtc / 1e8).toFixed(8)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  stSTX
                </span>
                <span className="text-white font-mono">
                  {(withdrawAmounts.ststx / 1e6).toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  STX
                </span>
                <span className="text-white font-mono">
                  {(withdrawAmounts.stx / 1e6).toFixed(6)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">USDCx</span>
              <span className="text-white font-mono">
                ~${withdrawAmounts.estimatedValue.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <Button
          onClick={() => setStep('confirm')}
          className="w-full"
          disabled={position.totalValue === 0}
        >
          <ArrowUpFromLine className="w-4 h-4" />
          Continue
        </Button>
      </CardContent>
    </Card>
  )
}

export default VaultWithdraw
