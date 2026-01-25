'use client'

import Link from 'next/link'
import { CheckCircle, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useDepositStore } from '@/lib/store/deposit'
import { TOKENS } from '@/lib/stacks/tokens'

const ALLOCATION_DISPLAY = [
  { symbol: 'sBTC', percentage: 40, color: '#F7931A' },
  { symbol: 'stSTX', percentage: 40, color: '#5546FF' },
  { symbol: 'STX', percentage: 20, color: '#9B59B6' },
]

export function DepositSuccess() {
  const { amount, autoInvest, bridgeTransaction, reset } = useDepositStore()
  const numericAmount = parseFloat(amount) || 0

  const handleNewDeposit = () => {
    reset()
  }

  return (
    <div className="max-w-lg mx-auto text-center">
      {/* Success icon */}
      <div className="mb-6">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
      </div>

      {/* Title */}
      <h1 className="font-heading text-3xl font-bold text-white mb-2">
        Deposit Complete!
      </h1>
      <p className="text-slate-400 mb-8">
        {autoInvest
          ? `$${numericAmount.toLocaleString()} has been invested into your Stacks portfolio`
          : `${numericAmount.toLocaleString()} USDCx has been added to your wallet`}
      </p>

      {/* Holdings breakdown (if auto-invested) */}
      {autoInvest && (
        <div className="mb-8 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
          <h3 className="text-sm text-slate-400 mb-4">Your new holdings</h3>
          <div className="space-y-3">
            {ALLOCATION_DISPLAY.map((item) => {
              const tokenAmount = (numericAmount * item.percentage) / 100
              return (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <span
                        className="text-xs font-bold"
                        style={{ color: item.color }}
                      >
                        {item.symbol.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-white">{item.symbol}</span>
                  </div>
                  <span className="text-white font-semibold">
                    ${tokenAmount.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between">
            <span className="text-slate-400">Total</span>
            <span className="text-xl font-bold text-white">
              ${numericAmount.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Transaction links */}
      {bridgeTransaction?.stacksTxHash && (
        <div className="mb-8">
          <a
            href={`https://explorer.stacks.co/txid/${bridgeTransaction.stacksTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View on Stacks Explorer
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" className="w-full sm:w-auto" asChild>
          <Link href="/app">
            View Portfolio
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={handleNewDeposit}
          className="w-full sm:w-auto"
        >
          Deposit More
        </Button>
      </div>
    </div>
  )
}
