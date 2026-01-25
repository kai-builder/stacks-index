'use client'

import { useState, useEffect, useCallback } from 'react'
import { History, ExternalLink, Wallet, Loader2, RefreshCw, TrendingUp, TrendingDown, AlertCircle, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useWalletStore } from '@/lib/store/wallet'
import { WalletButton } from '@/components/wallet/WalletButton'
import type { HistoryTransaction } from '@/app/api/history/route'
import { STACKS_INDEX_CONTRACT } from '@/lib/stacks/contract'

// Strategy colors
const STRATEGY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Bitcoin Maxi': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  'Meme Hunter': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  'DeFi Yield': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  'Stacks Believer': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  'Sell Portfolio': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
}

// Error messages
const ERROR_MESSAGES: Record<number, string> = {
  1001: 'Swap failed',
  1002: 'STX swap failed',
  1003: 'sBTC swap failed',
  1004: 'WELSH swap failed',
  1005: 'LEO swap failed',
  1006: 'DOG swap failed',
  1007: 'DROID swap failed',
  1008: 'USDH swap failed',
  1009: 'stSTX swap failed',
  1010: 'ALEX swap failed',
  1011: 'VELAR swap failed',
}

// Glassmorphism card component
function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`
        relative rounded-2xl border backdrop-blur-xl
        bg-white/[0.03] border-white/[0.08]
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Format date
function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format relative time
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(timestamp)
}

// Transaction row component
function TransactionRow({ tx, isMainnet }: { tx: HistoryTransaction; isMainnet: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const colors = STRATEGY_COLORS[tx.strategyName] || { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
  const explorerUrl = `https://explorer.hiro.so/txid/${tx.txId}?chain=${isMainnet ? 'mainnet' : 'testnet'}`

  const hasSoldTokens = tx.soldTokens && Object.keys(tx.soldTokens).length > 0

  return (
    <div className={`border-b border-white/[0.05] last:border-b-0 ${tx.status === 'failed' ? 'opacity-60' : ''}`}>
      <div
        className="p-4 flex items-center gap-4 hover:bg-white/[0.02] cursor-pointer transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          {tx.type === 'invest' ? (
            <TrendingUp className={`w-5 h-5 ${colors.text}`} />
          ) : tx.type === 'sell' ? (
            <TrendingDown className={`w-5 h-5 ${colors.text}`} />
          ) : (
            <History className={`w-5 h-5 ${colors.text}`} />
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-medium text-sm">{tx.strategyName}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
              {tx.type === 'invest' ? 'Invest' : tx.type === 'sell' ? 'Sell' : 'Other'}
            </span>
            {tx.status === 'success' ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <X className="w-3.5 h-3.5 text-red-500" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{formatRelativeTime(tx.timestamp)}</span>
            <span>Block #{tx.blockHeight.toLocaleString()}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          {tx.type === 'invest' && tx.investedAmount !== undefined && (
            <p className="text-white font-medium">
              -${tx.investedAmount.toFixed(2)}
              <span className="text-slate-500 text-xs ml-1">USDCx</span>
            </p>
          )}
          {tx.type === 'sell' && tx.receivedAmount !== undefined && (
            <p className="text-emerald-400 font-medium">
              +${tx.receivedAmount.toFixed(2)}
              <span className="text-slate-500 text-xs ml-1">USDCx</span>
            </p>
          )}
          {tx.status === 'failed' && tx.errorCode && (
            <p className="text-red-400 text-xs">
              Error: {ERROR_MESSAGES[tx.errorCode] || `#${tx.errorCode}`}
            </p>
          )}
        </div>

        {/* Expand button */}
        <div className="flex-shrink-0">
          {hasSoldTokens ? (
            isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )
          ) : (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-500 hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && hasSoldTokens && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-14 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-xs text-slate-500 mb-2">Tokens Sold:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(tx.soldTokens || {}).map(([token, amount]) => (
                <div key={token} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                  <span className="text-xs text-slate-400">{token}</span>
                  <span className="text-xs text-white font-mono">{amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between items-center">
              <span className="text-xs text-slate-500">{formatDate(tx.timestamp)}</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                View on Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HistoryClient() {
  const { isConnected, address, network } = useWalletStore()
  const isMainnet = network === 'mainnet'

  const [isLoading, setIsLoading] = useState(false)
  const [transactions, setTransactions] = useState<HistoryTransaction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20

  // Fetch transaction history
  const fetchHistory = useCallback(async (reset = false) => {
    if (!address) return

    setIsLoading(true)
    setError(null)

    try {
      const currentOffset = reset ? 0 : offset
      const response = await fetch(
        `/api/history?address=${address}&network=${network}&limit=${limit}&offset=${currentOffset}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }

      const data = await response.json()

      if (reset) {
        setTransactions(data.transactions)
        setOffset(limit)
      } else {
        setTransactions(prev => [...prev, ...data.transactions])
        setOffset(prev => prev + limit)
      }

      setHasMore(data.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history')
    } finally {
      setIsLoading(false)
    }
  }, [address, network, offset])

  // Fetch on mount and when address changes
  useEffect(() => {
    if (isConnected && address) {
      fetchHistory(true)
    }
  }, [isConnected, address]) // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate summary stats
  const summary = transactions.reduce(
    (acc, tx) => {
      if (tx.status === 'success') {
        if (tx.type === 'invest' && tx.investedAmount) {
          acc.totalInvested += tx.investedAmount
          acc.investCount++
        } else if (tx.type === 'sell' && tx.receivedAmount) {
          acc.totalReceived += tx.receivedAmount
          acc.sellCount++
        }
      } else {
        acc.failedCount++
      }
      return acc
    },
    { totalInvested: 0, totalReceived: 0, investCount: 0, sellCount: 0, failedCount: 0 }
  )

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-3">
            <History className="w-4 h-4" />
            Transaction History
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Your History</h1>
          <p className="text-slate-400">View all your StacksIndex transactions</p>
        </div>

        <GlassCard className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Connect Wallet</h3>
            <p className="text-slate-400 text-sm mb-6">Connect your Stacks wallet to view your transaction history</p>
            <WalletButton />
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-3">
          <History className="w-4 h-4" />
          Transaction History
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Your History</h1>
        <p className="text-slate-400">View all your StacksIndex transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <GlassCard className="p-4">
          <p className="text-xs text-slate-500 mb-1">Total Invested</p>
          <p className="text-lg font-bold text-white">${summary.totalInvested.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500">{summary.investCount} transactions</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-slate-500 mb-1">Total Received</p>
          <p className="text-lg font-bold text-emerald-400">${summary.totalReceived.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500">{summary.sellCount} transactions</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-slate-500 mb-1">Net P&L</p>
          <p className={`text-lg font-bold ${summary.totalReceived - summary.totalInvested >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {summary.totalReceived - summary.totalInvested >= 0 ? '+' : ''}${(summary.totalReceived - summary.totalInvested).toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-500">
            {summary.totalInvested > 0
              ? `${(((summary.totalReceived - summary.totalInvested) / summary.totalInvested) * 100).toFixed(1)}%`
              : '0%'}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-slate-500 mb-1">Failed</p>
          <p className="text-lg font-bold text-red-400">{summary.failedCount}</p>
          <p className="text-[10px] text-slate-500">transactions</p>
        </GlassCard>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => fetchHistory(true)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <GlassCard className="p-4 mb-4 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </GlassCard>
      )}

      {/* Transaction list */}
      <GlassCard className="overflow-hidden">
        {isLoading && transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Transactions</h3>
            <p className="text-slate-400 text-sm mb-6">You haven&apos;t made any transactions yet</p>
            <Button asChild>
              <Link href="/app/invest">Start Investing</Link>
            </Button>
          </div>
        ) : (
          <>
            {transactions.map((tx) => (
              <TransactionRow key={tx.txId} tx={tx} isMainnet={isMainnet} />
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="p-4 text-center border-t border-white/[0.05]">
                <button
                  onClick={() => fetchHistory(false)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </GlassCard>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-600 mt-6">
        Showing transactions for contract{' '}
        <a
          href={`https://explorer.hiro.so/txid/${STACKS_INDEX_CONTRACT.fullName}?chain=${isMainnet ? 'mainnet' : 'testnet'}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-slate-400 transition-colors"
        >
          v50
        </a>
      </p>
    </div>
  )
}
