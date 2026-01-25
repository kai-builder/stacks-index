'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, Wallet, ExternalLink, Loader2, Check, AlertCircle, RefreshCw, TrendingUp, Shield, Dog, Sparkles, ChevronLeft, Zap, ArrowUpRight, CircleDot, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useWalletStore } from '@/lib/store/wallet'
import { useBalanceStore, forceRefreshBalance } from '@/lib/store/balance'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useInvestment } from '@/lib/hooks/useInvestment'
import { useBatchQuote, usePrices } from '@/lib/hooks/useQuote'
import {
  STRATEGIES,
  STRATEGY_ALLOCATIONS,
  CONTRACT_CONSTANTS,
  fromMicroUnits,
  TOKEN_CONTRACTS,
  STACKS_INDEX_CONTRACT,
} from '@/lib/stacks/contract'
import { getTokenBySymbol, getTokenColor } from '@/lib/stacks/tokens'
import Image from 'next/image'

type InvestStep = 'input' | 'confirm' | 'processing' | 'success' | 'error'

// Token decimals for display formatting
const TOKEN_DISPLAY_DECIMALS: Record<string, number> = {
  sBTC: 8,
  DOG: 8,
  USDH: 8,
  ALEX: 8,
  STX: 6,
  stSTX: 6,
  WELSH: 6,
  LEO: 6,
  DROID: 6,
  VELAR: 6,
}

// Format token amount with appropriate decimals based on token type
function formatTokenAmount(amount: number, tokenSymbol: string): string {
  // Normalize symbol for lookup
  const upperSymbol = tokenSymbol.toUpperCase()
  const symbolMap: Record<string, string> = {
    'SBTC': 'sBTC',
    'STSTX': 'stSTX',
  }
  const normalizedSymbol = symbolMap[upperSymbol] || tokenSymbol

  const decimals = TOKEN_DISPLAY_DECIMALS[normalizedSymbol] || 6

  // For 8-decimal tokens (like sBTC), show full precision
  if (decimals === 8) {
    return amount.toFixed(8)
  }
  // For 6-decimal tokens, show 4-6 decimals based on value
  if (amount < 0.0001) {
    return amount.toFixed(6)
  }
  return amount.toFixed(4)
}

// Get token display info using the tokens.ts metadata
function getTokenDisplayInfo(symbol: string) {
  const token = getTokenBySymbol(symbol)
  if (token) {
    return {
      color: token.color,
      imageUrl: token.imageUrl,
      name: token.name,
    }
  }
  // Fallback
  return {
    color: '#6B7280',
    imageUrl: '',
    name: symbol,
  }
}

// Strategy icons - using brand colors (Trust Blue primary, asset colors)
const STRATEGY_STYLES: Record<string, { icon: React.ReactNode; gradient: string; glow: string; ring: string }> = {
  'Bitcoin Maxi': {
    icon: <Shield className="w-5 h-5" />,
    gradient: 'from-[#F7931A] to-amber-600', // sBTC orange
    glow: 'shadow-[#F7931A]/25',
    ring: 'ring-[#F7931A]/30',
  },
  'Meme Hunter': {
    icon: <Dog className="w-5 h-5" />,
    gradient: 'from-green-500 to-emerald-600',
    glow: 'shadow-green-500/25',
    ring: 'ring-green-500/30',
  },
  'DeFi Yield': {
    icon: <TrendingUp className="w-5 h-5" />,
    gradient: 'from-[#14B8A6] to-teal-600', // Teal accent
    glow: 'shadow-teal-500/25',
    ring: 'ring-teal-500/30',
  },
  'Stacks Believer': {
    icon: <Sparkles className="w-5 h-5" />,
    gradient: 'from-[#5546FF] to-indigo-600', // STX purple
    glow: 'shadow-[#5546FF]/25',
    ring: 'ring-[#5546FF]/30',
  },
}

// Glass card component - using brandkit colors
function GlassCard({
  children,
  className = '',
  hover = false,
  selected = false,
  glow = '',
  ring = '',
  gradient = false,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  hover?: boolean
  selected?: boolean
  glow?: string
  ring?: string
  gradient?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-300
        ${gradient ? 'bg-gray-900/80' : 'bg-gray-900/60'}
        ${selected
          ? `border-gray-600 ${ring ? `ring-2 ${ring}` : 'ring-1 ring-gray-600'} shadow-lg ${glow}`
          : 'border-gray-700/50'
        }
        ${hover ? 'cursor-pointer hover:bg-gray-800/80 hover:border-gray-600 hover:shadow-md' : ''}
        ${className}
      `}
    >
      <div className="relative">{children}</div>
    </div>
  )
}

// Horizontal Step Indicator (centered at top) - Trust Blue active state
function HorizontalSteps({ currentStep, amountValid, strategySelected }: {
  currentStep: number
  amountValid: boolean
  strategySelected: boolean
}) {
  const steps = [
    { number: 1, label: 'Amount', completed: amountValid },
    { number: 2, label: 'Strategy', completed: amountValid && strategySelected },
    { number: 3, label: 'Invest', completed: false },
  ]

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const isActive = step.number === currentStep
        const isCompleted = step.completed

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex items-center gap-2">
              {/* Step circle */}
              <div className={`
                w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                transition-all duration-300
                ${isCompleted
                  ? 'bg-[#22C55E] text-white' // Success green
                  : isActive
                    ? 'bg-[#2563EB] text-white' // Trust Blue
                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                }
              `}>
                {isCompleted ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : step.number}
              </div>
              <span className={`text-xs font-medium ${
                isActive ? 'text-[#2563EB]' : isCompleted ? 'text-[#22C55E]' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div className={`w-8 h-px mx-3 ${step.completed ? 'bg-[#22C55E]' : 'bg-gray-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function InvestPage() {
  const { isConnected, address, network } = useWalletStore()
  const isMainnet = network === 'mainnet'

  // Use global balance store for instant navigation
  const {
    usdcxBalance,
    isLoading: isLoadingBalance,
    fetchBalance: fetchBalanceFromStore,
  } = useBalanceStore()

  const {
    isLoading,
    isGettingQuotes: isGettingInvestQuotes,
    quotes: investQuotes,
    txId,
    error: investError,
    getQuotes: getInvestQuotes,
    invest,
    clearError,
    reset,
  } = useInvestment()

  // New quote hook with USD values
  const {
    isLoading: isQuoteLoading,
    quotes: quoteResults,
    totalUsdValue,
    getStrategyQuotes,
  } = useBatchQuote()

  // Prices for USD conversion
  const { prices, getUsdValue } = usePrices()

  // Track if initial fetch has been triggered
  const [hasInitialFetch, setHasInitialFetch] = useState(false)

  // Combined loading state
  const isGettingQuotes = isGettingInvestQuotes || isQuoteLoading

  // Normalize token symbol for matching (sbtc -> sBTC, etc.)
  const normalizeSymbol = (symbol: string): string => {
    const upperSymbol = symbol.toUpperCase()
    const symbolMap: Record<string, string> = {
      'SBTC': 'sBTC',
      'STSTX': 'stSTX',
      'USDCX': 'USDCx',
    }
    return symbolMap[upperSymbol] || symbol
  }

  // Combine quote results with investment quotes for display
  // Prefer token amounts from new quote API (more accurate from Bitflow/Alex SDKs)
  const quotes = investQuotes.map(q => {
    // Match using normalized symbols (handles case differences)
    const normalizedSymbol = normalizeSymbol(q.tokenSymbol)
    const quoteResult = quoteResults.find(qr =>
      normalizeSymbol(qr.toToken) === normalizedSymbol
    )
    // Use the new quote API's amountOutFormatted if available (more accurate)
    const estimatedAmountOut = quoteResult
      ? parseFloat(quoteResult.amountOutFormatted)
      : q.estimatedAmountOut
    return {
      ...q,
      estimatedAmountOut,
      usdValue: quoteResult?.usdValue || getUsdValue(q.tokenSymbol, estimatedAmountOut),
      source: quoteResult?.source || 'fallback',
    }
  })

  // Local state
  const [step, setStep] = useState<InvestStep>('input')
  const [amount, setAmount] = useState('1')
  const [strategyId, setStrategyId] = useState(STRATEGIES.BITCOIN_MAXI)
  const [localError, setLocalError] = useState<string | null>(null)

  const numericAmount = parseFloat(amount) || 0
  const minInvestment = fromMicroUnits(CONTRACT_CONSTANTS.MIN_INVESTMENT)
  const maxInvestment = 50 // Beta limit: $50 USDCx
  const isWithinLimits = numericAmount >= minInvestment && numericAmount <= maxInvestment
  const hasEnoughBalance = numericAmount <= usdcxBalance
  const isValidAmount = isWithinLimits && hasEnoughBalance
  const selectedStrategy = STRATEGY_ALLOCATIONS[strategyId]

  // Determine current step for sidebar
  const getCurrentStep = () => {
    if (!isValidAmount) return 1
    if (!strategyId) return 2
    return 3
  }

  // Force refresh balance (bypasses cache)
  const fetchBalance = useCallback(async () => {
    if (!address) return
    await forceRefreshBalance(address, isMainnet)
  }, [address, isMainnet])

  // Fetch balance from cache or API on mount
  useEffect(() => {
    if (isConnected && address) {
      setHasInitialFetch(true)
      // This uses cached data if available (within 10s), otherwise fetches
      fetchBalanceFromStore(address, isMainnet)
    }
  }, [isConnected, address, isMainnet, fetchBalanceFromStore])

  // Fetch quotes when amount or strategy changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (numericAmount >= minInvestment) {
        // Fetch quotes for investment execution
        getInvestQuotes(numericAmount, strategyId)
        // Fetch quotes with USD values for preview
        const strategy = STRATEGY_ALLOCATIONS[strategyId]
        if (strategy) {
          getStrategyQuotes(numericAmount, strategy.allocations)
        }
      }
    }, 300) // Reduced debounce for snappier feel

    return () => clearTimeout(debounce)
  }, [numericAmount, strategyId, getInvestQuotes, getStrategyQuotes, minInvestment])

  // Handle investment
  const handleInvest = async () => {
    if (!address || !isValidAmount) return

    setStep('processing')
    setLocalError(null)

    invest({
      amount: numericAmount,
      strategyId,
      senderAddress: address,
      onSuccess: (txId) => {
        console.log(`Investment completed: ${txId}`)
        setStep('success')
      },
      onError: (error) => {
        console.error(`Investment failed: ${error.message}`)
        setLocalError(error.message)
        setStep('error')
      },
      onCancel: () => {
        setStep('input')
      },
    })
  }

  // Reset state
  const handleReset = () => {
    setStep('input')
    setAmount('')
    setLocalError(null)
    clearError()
    reset()
    fetchBalance()
  }

  // Set max amount (respects beta limit)
  const handleSetMax = () => {
    const maxAllowed = Math.min(usdcxBalance, maxInvestment)
    setAmount(maxAllowed.toString())
  }

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <GlassCard className="p-10" gradient>
            <div className="text-center">
              <div className="relative inline-flex mb-10">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                  <Check className="w-12 h-12 text-white" strokeWidth={3} />
                </div>
                <div className="absolute -inset-2 rounded-3xl bg-emerald-500/30 animate-ping" />
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-2xl" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">Investment Complete</h2>
              <p className="text-gray-400 mb-10 text-lg">
                <span className="text-white font-semibold">${numericAmount.toFixed(2)}</span> USDCx diversified via{' '}
                <span className="text-[#2563EB]">{selectedStrategy.name}</span>
              </p>

              <div className="grid grid-cols-2 gap-3 mb-10">
                {quotes.filter(q => q.amountIn > 0).map((quote) => {
                  const tokenInfo = getTokenDisplayInfo(quote.tokenSymbol)
                  return (
                    <div
                      key={quote.tokenSymbol}
                      className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 backdrop-blur-xl flex items-center gap-3"
                    >
                      {tokenInfo.imageUrl && (
                        <Image
                          src={tokenInfo.imageUrl}
                          alt={quote.tokenSymbol}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      )}
                      <div>
                        <p className="text-xl font-bold text-white">~{formatTokenAmount(quote.estimatedAmountOut, quote.tokenSymbol)}</p>
                        <p className="text-sm text-gray-500">{quote.tokenSymbol}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {txId && (
                <a
                  href={`https://explorer.hiro.so/txid/${txId}?chain=${isMainnet ? 'mainnet' : 'testnet'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#2563EB] hover:text-[#1D4ED8] transition-colors mb-10 font-medium"
                >
                  View on Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <div className="flex gap-4">
                <Button className="w-full h-14 text-base font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] border-0 shadow-lg shadow-blue-500/25 flex-1" asChild>
                  <Link href="/app">
                    View Portfolio
                  </Link>
                </Button>
                <Button variant="secondary" onClick={handleReset} className="flex-1 h-14 text-base font-semibold">
                  Invest More
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  // Error screen
  if (step === 'error') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <GlassCard className="p-10" gradient>
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-red-400" />
                </div>
                <div className="absolute -inset-4 rounded-3xl bg-red-500/10 blur-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Investment Failed</h2>
              <p className="text-red-400/90 mb-10 text-sm leading-relaxed max-w-xs mx-auto">{localError || investError}</p>
              <Button
                onClick={handleReset}
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border-0"
              >
                Try Again
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  // Processing screen
  if (step === 'processing') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <GlassCard className="p-10" gradient>
            <div className="text-center">
              <div className="relative inline-block mb-10">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-white/10 flex items-center justify-center shadow-2xl">
                  <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
                </div>
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 blur-2xl animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Confirm in Wallet</h2>
              <p className="text-slate-400 mb-2 text-base">Please approve the transaction in your wallet.</p>
              <p className="text-slate-500 text-sm">All swaps execute atomically in one transaction.</p>
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  // Confirm screen
  if (step === 'confirm') {
    const strategyStyle = STRATEGY_STYLES[selectedStrategy.name]
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => setStep('input')}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 cursor-pointer group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to edit
          </button>
          <h1 className="text-3xl font-semibold text-white">Review Investment</h1>
          <p className="text-slate-400 mt-2">Confirm your diversification strategy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Summary */}
          <GlassCard className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Investment Amount</p>
                <p className="text-4xl font-semibold text-white">${numericAmount.toFixed(2)}</p>
                <p className="text-sm text-slate-500 mt-1">USDCx</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${strategyStyle?.gradient || 'from-blue-500 to-cyan-500'} flex items-center justify-center text-white shadow-lg ${strategyStyle?.glow || ''}`}>
                {strategyStyle?.icon || <TrendingUp className="w-6 h-6" />}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Atomic Execution</p>
                  <p className="text-xs text-slate-500 mt-0.5">All tokens swapped in a single transaction</p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Right: Token breakdown */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-medium text-gray-400">You&apos;ll receive</p>
                {totalUsdValue > 0 && (
                  <p className="text-xs text-emerald-400 mt-1">~${totalUsdValue.toFixed(2)} total value</p>
                )}
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                {selectedStrategy.name}
              </span>
            </div>

            <div className="space-y-3">
              {quotes.filter(q => q.amountIn > 0).map((quote) => {
                const tokenInfo = getTokenDisplayInfo(quote.tokenSymbol)
                return (
                  <div key={quote.tokenSymbol} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      {tokenInfo.imageUrl ? (
                        <Image
                          src={tokenInfo.imageUrl}
                          alt={quote.tokenSymbol}
                          width={36}
                          height={36}
                          className="rounded-full"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: tokenInfo.color + '30' }}
                        >
                          {quote.tokenSymbol.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium text-sm">{quote.tokenSymbol}</p>
                        <p className="text-xs text-gray-500">${quote.amountIn.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-mono text-sm">
                        {isGettingQuotes ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : `~${formatTokenAmount(quote.estimatedAmountOut, quote.tokenSymbol)}`}
                      </p>
                      {quote.usdValue > 0 && !isGettingQuotes && (
                        <p className="text-xs text-gray-500">${quote.usdValue.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </div>

        <Button
          onClick={handleInvest}
          disabled={isLoading || isGettingQuotes}
          className="w-full h-14 text-lg mt-6 bg-[#2563EB] hover:bg-[#1D4ED8]"
          size="lg"
        >
          {isLoading || isGettingQuotes ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Confirm Investment
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    )
  }

  // Main input screen - Full width single column with sidebar steps
  return (
    <div className="max-w-5xl mx-auto">
      {/* Compact Header - Trust Blue accent */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-xs font-medium mb-3 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
          <span className="text-[#60A5FA] font-semibold">
            One-Click Diversification
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
          Invest in Stacks Ecosystem
        </h1>
        <p className="text-gray-400 text-sm">
          Diversify your USDCx into ecosystem tokens with a single atomic transaction
        </p>
      </div>

      {!isConnected ? (
        <div className="max-w-md mx-auto">
          <GlassCard className="p-12" gradient>
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-slate-600/50 flex items-center justify-center shadow-2xl">
                  <Wallet className="w-11 h-11 text-slate-400" />
                </div>
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 blur-xl opacity-50" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Connect Wallet</h3>
              <p className="text-slate-400 text-base mb-8 max-w-xs mx-auto">
                Connect your Stacks wallet to start investing in the ecosystem
              </p>
              <WalletButton />
            </div>
          </GlassCard>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Step Indicator - Centered */}
          <div className="flex justify-center">
            <GlassCard className="px-6 py-3 inline-flex" gradient>
              <HorizontalSteps
                currentStep={getCurrentStep()}
                amountValid={isValidAmount}
                strategySelected={strategyId !== null}
              />
            </GlassCard>
          </div>

          {/* Two Column Layout: Left (Inputs) | Right (Preview) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* LEFT COLUMN: Amount + Strategy */}
            <div className="lg:col-span-3 space-y-4">
              {/* Balance Row */}
              <div className="flex items-center gap-3">
                <GlassCard className="flex-1 p-3" gradient>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image
                        src="/tokens/usdc.png"
                        alt="USDCx"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Balance</p>
                        <div className="flex items-baseline gap-1">
                          {(isLoadingBalance || !hasInitialFetch) ? (
                            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          ) : (
                            <span className="text-xl font-bold text-white">${usdcxBalance.toFixed(2)}</span>
                          )}
                          <span className="text-[10px] text-slate-500">USDCx</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={fetchBalance}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
                      disabled={isLoadingBalance || !hasInitialFetch}
                    >
                      <RefreshCw className={`w-3 h-3 text-slate-400 ${(isLoadingBalance || !hasInitialFetch) ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </GlassCard>

                <GlassCard className="p-3" hover gradient>
                  <a
                    href="https://bridge.stacks.co/usdc/eth/stx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Image
                      src="/tokens/usdc.png"
                      alt="USDCx"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div>
                      <p className="text-xs font-medium text-white">Bridge</p>
                      <p className="text-[10px] text-gray-500">Get USDCx</p>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-gray-500" />
                  </a>
                </GlassCard>
              </div>

              {/* Amount Input */}
              <GlassCard
                className={`p-4 transition-all duration-300 ${
                  isValidAmount ? 'ring-1 ring-[#22C55E]/30 border-[#22C55E]/30' : ''
                }`}
                gradient
              >
                <div className="flex items-center gap-3">
                  <Image
                    src="/tokens/usdc.png"
                    alt="USDCx"
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min={minInvestment}
                    max={maxInvestment}
                    className="flex-1 text-3xl font-bold bg-transparent text-white placeholder:text-gray-700 focus:outline-none"
                  />
                  <button
                    onClick={handleSetMax}
                    className="px-3 py-1.5 text-xs font-bold text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/25 rounded-lg hover:bg-[#2563EB]/20 transition-all cursor-pointer"
                  >
                    MAX
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50">
                  <span className="text-gray-500 text-[10px]">USDCx</span>
                  <span className="text-gray-500 text-[10px]">
                    ${minInvestment}-${maxInvestment} <span className="text-[#F59E0B]/70">(Beta)</span>
                  </span>
                </div>

                {numericAmount > 0 && numericAmount < minInvestment && (
                  <div className="flex items-center gap-1.5 mt-2 text-[#F59E0B] text-[10px]">
                    <AlertCircle className="w-3 h-3" />
                    Min: ${minInvestment.toFixed(2)}
                  </div>
                )}
                {numericAmount > maxInvestment && (
                  <div className="flex items-center gap-1.5 mt-2 text-[#F59E0B] text-[10px]">
                    <AlertCircle className="w-3 h-3" />
                    Max: ${maxInvestment} (Beta)
                  </div>
                )}
                {numericAmount > 0 && numericAmount <= maxInvestment && numericAmount > usdcxBalance && (
                  <div className="flex items-center gap-1.5 mt-2 text-[#EF4444] text-[10px]">
                    <AlertCircle className="w-3 h-3" />
                    Insufficient balance
                  </div>
                )}
              </GlassCard>

              {/* Strategy Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Custom display order: Bitcoin Maxi, DeFi Yield, Stacks Believer, Meme Hunter */}
                {[STRATEGIES.BITCOIN_MAXI, STRATEGIES.DEFI_YIELD, STRATEGIES.STACKS_BELIEVER, STRATEGIES.MEME_HUNTER].map((id) => {
                  const strategy = STRATEGY_ALLOCATIONS[id]
                  const isSelected = strategyId === id
                  const styles = STRATEGY_STYLES[strategy.name]
                  return (
                    <GlassCard
                      key={id}
                      hover
                      selected={isSelected}
                      glow={styles?.glow}
                      ring={styles?.ring}
                      onClick={() => setStrategyId(id)}
                      className="p-4"
                      gradient
                    >
                      <div className="relative">
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#22C55E] flex items-center justify-center z-10">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                        )}

                        {/* Header row */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`
                            w-10 h-10 rounded-xl bg-gradient-to-br ${styles?.gradient || 'from-gray-500 to-gray-600'}
                            flex items-center justify-center text-white flex-shrink-0 shadow-md
                            ${isSelected ? 'scale-105' : 'opacity-75'}
                          `}>
                            {styles?.icon || <TrendingUp className="w-5 h-5" />}
                          </div>
                          <h3 className="font-semibold text-white text-sm">{strategy.name}</h3>
                        </div>

                        {/* Token allocations with logos - 2 column grid */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {Object.entries(strategy.allocations)
                            .filter(([, value]) => value > 0)
                            .map(([token, value]) => {
                              const tokenInfo = getTokenDisplayInfo(token)
                              return (
                                <div
                                  key={token}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700/50"
                                >
                                  {tokenInfo.imageUrl ? (
                                    <Image
                                      src={tokenInfo.imageUrl}
                                      alt={token}
                                      width={20}
                                      height={20}
                                      className="rounded-full"
                                    />
                                  ) : (
                                    <div
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                                      style={{ backgroundColor: tokenInfo.color + '40', color: tokenInfo.color }}
                                    >
                                      {token.charAt(0)}
                                    </div>
                                  )}
                                  <span className="text-[11px] text-gray-200 font-medium uppercase flex-1">{token}</span>
                                  <span className="text-[9px] font-bold" style={{ color: tokenInfo.color }}>
                                    {value}%
                                  </span>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Preview */}
            <div className="lg:col-span-2 space-y-4">
              <GlassCard
                className={`p-4 h-full transition-all duration-300 ${
                  isValidAmount && quotes.length > 0 ? 'ring-1 ring-white/15' : ''
                }`}
                gradient
              >
                {numericAmount >= minInvestment && numericAmount <= maxInvestment && isGettingQuotes && quotes.length === 0 ? (
                  /* Loading skeleton */
                  <div className="h-full flex flex-col animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="h-2 w-16 bg-gray-700/50 rounded mb-2" />
                        <div className="h-6 w-24 bg-gray-700/50 rounded mb-1" />
                        <div className="h-2 w-20 bg-gray-700/50 rounded" />
                      </div>
                      <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-20 bg-gray-700/50 rounded mb-2" />
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-700/50" />
                            <div>
                              <div className="h-3 w-12 bg-gray-700/50 rounded mb-1" />
                              <div className="h-2 w-8 bg-gray-700/50 rounded" />
                            </div>
                          </div>
                          <div className="h-3 w-16 bg-gray-700/50 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 rounded-lg bg-gray-800/30 border border-gray-700/30">
                      <div className="h-3 w-32 bg-gray-700/50 rounded" />
                    </div>
                    <div className="w-full h-12 bg-gray-700/50 rounded-lg mt-4" />
                  </div>
                ) : numericAmount >= minInvestment && numericAmount <= maxInvestment && quotes.length > 0 ? (
                  <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Investing</p>
                        <span className="text-2xl font-bold text-white">${numericAmount.toFixed(2)}</span>
                        <p className="text-[10px] text-gray-500">via {selectedStrategy.name}</p>
                      </div>
                      {isGettingQuotes && <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />}
                    </div>

                    {/* Token breakdown */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">You&apos;ll Receive</p>
                        {totalUsdValue > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                            <DollarSign className="w-3 h-3" />
                            <span>~${totalUsdValue.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      {quotes.filter(q => q.amountIn > 0).map((quote) => {
                        const tokenInfo = getTokenDisplayInfo(quote.tokenSymbol)
                        const allocation = selectedStrategy.allocations[quote.tokenSymbol.toLowerCase() as keyof typeof selectedStrategy.allocations] ||
                                          selectedStrategy.allocations[quote.tokenSymbol as keyof typeof selectedStrategy.allocations]
                        return (
                          <div key={quote.tokenSymbol} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
                            <div className="flex items-center gap-2">
                              {tokenInfo.imageUrl ? (
                                <Image
                                  src={tokenInfo.imageUrl}
                                  alt={quote.tokenSymbol}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              ) : (
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                  style={{ backgroundColor: tokenInfo.color + '30' }}
                                >
                                  {quote.tokenSymbol.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="text-white font-medium text-xs">{quote.tokenSymbol}</p>
                                <p className="text-[9px] text-gray-500">{allocation}%</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-mono text-xs">
                                {isGettingQuotes ? '...' : `~${formatTokenAmount(quote.estimatedAmountOut, quote.tokenSymbol)}`}
                              </p>
                              {quote.usdValue > 0 && !isGettingQuotes && (
                                <p className="text-[9px] text-gray-500">${quote.usdValue.toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Atomic badge */}
                    <div className="mt-3 p-2 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center gap-2">
                      <Zap className="w-3 h-3 text-[#22C55E]" />
                      <span className="text-[10px] text-white font-medium">Atomic · 1 TX · 1% slippage</span>
                    </div>

                    {/* CTA */}
                    <Button
                      onClick={() => setStep('confirm')}
                      disabled={!isValidAmount}
                      className="w-full h-12 text-sm font-semibold mt-4 bg-[#2563EB] hover:bg-[#1D4ED8] border-0 shadow-lg shadow-blue-500/25"
                      size="lg"
                    >
                      Invest Now
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-8">
                    <div className="w-14 h-14 rounded-xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-center mb-4">
                      <TrendingUp className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-gray-400 text-sm text-center mb-2">
                      {numericAmount > 0 && numericAmount < minInvestment
                        ? `Enter at least $${minInvestment.toFixed(2)}`
                        : numericAmount > maxInvestment
                          ? `Maximum $${maxInvestment} during beta`
                          : 'Enter an amount to preview'}
                    </p>
                    <p className="text-gray-600 text-xs">Select amount & strategy</p>
                  </div>
                )}
              </GlassCard>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
