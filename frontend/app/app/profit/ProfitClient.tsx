'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, Wallet, ExternalLink, Loader2, Check, AlertCircle, RefreshCw, DollarSign, TrendingDown, Sparkles, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { useWalletStore } from '@/lib/store/wallet'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useSell, TokenBalance } from '@/lib/hooks/useSell'
import { useBatchQuote, usePrices } from '@/lib/hooks/useQuote'
import { STACKS_INDEX_CONTRACT } from '@/lib/stacks/contract'
import { getTokenBySymbol } from '@/lib/stacks/tokens'

type SellStep = 'select' | 'confirm' | 'processing' | 'success' | 'error'

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
  const decimals = TOKEN_DISPLAY_DECIMALS[tokenSymbol] || 6

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

// Token colors for display
const TOKEN_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  sBTC: { bg: 'bg-orange-500/20', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  STX: { bg: 'bg-blue-500/20', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  USDH: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  WELSH: { bg: 'bg-green-500/20', text: 'text-green-400', glow: 'shadow-green-500/20' },
  LEO: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
  DOG: { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  DROID: { bg: 'bg-pink-500/20', text: 'text-pink-400', glow: 'shadow-pink-500/20' },
  ALEX: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
  VELAR: { bg: 'bg-purple-500/20', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
  stSTX: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
}

// Percentage options
const PERCENTAGE_OPTIONS = [
  { value: 20, label: '20%', description: 'Take some profits' },
  { value: 50, label: '50%', description: 'Sell half' },
  { value: 100, label: '100%', description: 'Exit position' },
]

// Glassmorphism card component
function GlassCard({
  children,
  className = '',
  hover = false,
  selected = false,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  hover?: boolean
  selected?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl border backdrop-blur-xl
        bg-white/[0.03] border-white/[0.08]
        ${hover ? 'cursor-pointer transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-xl hover:shadow-black/20' : ''}
        ${selected ? 'bg-white/[0.08] border-blue-500/50 shadow-lg shadow-blue-500/10' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export default function ProfitPage() {
  const { isConnected, address, network } = useWalletStore()
  const isMainnet = network === 'mainnet'

  const {
    isLoading,
    isFetchingBalances,
    balances,
    error: sellError,
    txId,
    fetchBalances,
    sell,
    clearError,
    reset,
  } = useSell()

  // Quote hooks for sell preview
  const {
    isLoading: isQuoteLoading,
    quotes: sellQuotes,
    totalUsdValue: estimatedUsdcxReceived,
    getBatchReverseQuotes,
  } = useBatchQuote()

  // Prices for USD conversion
  const { prices, getUsdValue } = usePrices()

  // Track if initial fetch has been triggered
  const [hasInitialFetch, setHasInitialFetch] = useState(false)

  // Local state
  const [step, setStep] = useState<SellStep>('select')
  const [percentage, setPercentage] = useState<number>(20)
  const [customPercentage, setCustomPercentage] = useState<string>('')
  const [percentageError, setPercentageError] = useState<string | null>(null)
  const [selectedTokens, setSelectedTokens] = useState<TokenBalance[]>([])
  const [localError, setLocalError] = useState<string | null>(null)

  // Fetch balances on connect
  useEffect(() => {
    if (isConnected && address) {
      setHasInitialFetch(true)
      fetchBalances(address)
    }
  }, [isConnected, address, fetchBalances])

  // Initialize selected tokens when balances load
  useEffect(() => {
    if (balances.length > 0 && selectedTokens.length === 0) {
      setSelectedTokens(balances)
    }
  }, [balances, selectedTokens.length])

  // Fetch sell quotes when tokens or percentage changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (selectedTokens.length > 0 && percentage > 0) {
        const tokensToQuote = selectedTokens.map(token => ({
          symbol: token.symbol,
          amount: (token.balance * percentage) / 100,
        }))
        getBatchReverseQuotes(tokensToQuote)
      }
    }, 300)

    return () => clearTimeout(debounce)
  }, [selectedTokens, percentage, getBatchReverseQuotes])

  // Toggle token selection
  const toggleToken = useCallback((token: TokenBalance) => {
    setSelectedTokens(prev => {
      const exists = prev.find(t => t.symbol === token.symbol)
      if (exists) {
        return prev.filter(t => t.symbol !== token.symbol)
      } else {
        return [...prev, token]
      }
    })
  }, [])

  // Select all tokens
  const selectAllTokens = useCallback(() => {
    setSelectedTokens(balances)
  }, [balances])

  // Handle custom percentage input
  const handleCustomPercentageChange = (value: string) => {
    setCustomPercentage(value)
    setPercentageError(null)

    if (value === '') {
      return
    }

    const numValue = parseInt(value, 10)
    if (isNaN(numValue)) {
      setPercentageError('Please enter a valid number')
      return
    }

    if (numValue < 1) {
      setPercentageError('Minimum is 1%')
      return
    }

    if (numValue > 100) {
      setPercentageError('Maximum is 100%')
      return
    }

    setPercentage(numValue)
  }

  // Handle preset percentage selection
  const handlePresetPercentage = (value: number) => {
    setPercentage(value)
    setCustomPercentage('')
    setPercentageError(null)
  }

  // Check if custom percentage is active
  const isCustomActive = customPercentage !== '' && !percentageError && !PERCENTAGE_OPTIONS.some(opt => opt.value === percentage)

  // Minimum USD value threshold to prevent dust transactions
  const MIN_USD_VALUE = 0.001

  // Calculate total sell value with USD values
  const getSellPreview = useCallback(() => {
    return selectedTokens.map(token => {
      const sellAmount = (token.balance * percentage) / 100
      const quote = sellQuotes.find(q => q.fromToken === token.symbol)
      const usdValue = quote?.usdValue || getUsdValue(token.symbol, sellAmount)
      return {
        ...token,
        sellAmount,
        usdValue,
      }
    })
  }, [selectedTokens, percentage, sellQuotes, getUsdValue])

  // Filter out dust amounts (below MIN_USD_VALUE)
  const getValidSellPreview = useCallback(() => {
    return getSellPreview().filter(item => item.usdValue >= MIN_USD_VALUE)
  }, [getSellPreview])

  // Get dust tokens that will be skipped
  const getDustTokens = useCallback(() => {
    return getSellPreview().filter(item => item.usdValue > 0 && item.usdValue < MIN_USD_VALUE)
  }, [getSellPreview])

  // Calculate total USD value being sold
  const getTotalSellValue = useCallback(() => {
    return getValidSellPreview().reduce((sum, item) => sum + item.usdValue, 0)
  }, [getValidSellPreview])

  // Handle sell
  const handleSell = async () => {
    const validTokens = getValidSellPreview()
    if (!address || validTokens.length === 0) return

    setStep('processing')
    setLocalError(null)

    // Only sell tokens with USD value >= MIN_USD_VALUE
    // Map to TokenBalance type (without the extra usdValue property)
    const tokensToSell: TokenBalance[] = validTokens.map(t => ({
      symbol: t.symbol,
      balance: t.balance,
      contract: t.contract,
      balanceMicro: t.balanceMicro,
      decimals: t.decimals,
    }))

    sell({
      percentage,
      tokens: tokensToSell,
      senderAddress: address,
      onSuccess: (txId) => {
        console.log(`Sell completed: ${txId}`)
        setStep('success')
      },
      onError: (error) => {
        console.error(`Sell failed: ${error.message}`)
        setLocalError(error.message)
        setStep('error')
      },
      onCancel: () => {
        setStep('select')
      },
    })
  }

  // Reset state
  const handleReset = () => {
    setStep('select')
    setPercentage(20)
    setSelectedTokens([])
    setLocalError(null)
    clearError()
    reset()
    if (address) {
      fetchBalances(address)
    }
  }

  // Success screen
  if (step === 'success') {
    const preview = getValidSellPreview()
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <GlassCard className="p-8">
            <div className="text-center">
              <div className="relative inline-flex mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Sale Complete</h2>
              <p className="text-slate-400 mb-8">
                {percentage}% of your portfolio sold to USDCx
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {preview.map((item) => {
                  const colors = TOKEN_COLORS[item.symbol] || { bg: 'bg-gray-500/20', text: 'text-gray-400' }
                  const tokenInfo = getTokenBySymbol(item.symbol)
                  return (
                    <div key={item.symbol} className={`p-3 rounded-xl ${colors.bg} flex items-center gap-3`}>
                      {tokenInfo?.imageUrl ? (
                        <Image src={tokenInfo.imageUrl} alt={item.symbol} width={32} height={32} className="rounded-full" />
                      ) : (
                        <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center`}>
                          <span className={`text-xs font-bold ${colors.text}`}>{item.symbol.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <p className={`text-lg font-semibold ${colors.text}`}>~{formatTokenAmount(item.sellAmount, item.symbol)}</p>
                        <p className="text-xs text-slate-500">{item.symbol}</p>
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
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors mb-8"
                >
                  View on Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <div className="flex gap-3">
                <Button className="w-full flex-1" asChild>
                  <Link href="/app">View Portfolio</Link>
                </Button>
                <Button variant="secondary" onClick={handleReset} className="flex-1">
                  Sell More
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
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <GlassCard className="p-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Sale Failed</h2>
              <p className="text-red-400/80 mb-8">{localError || sellError}</p>
              <Button onClick={handleReset} className="w-full">Try Again</Button>
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  // Processing screen
  if (step === 'processing') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <GlassCard className="p-8">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-8" />
              <h2 className="text-2xl font-bold text-white mb-2">Confirm in Wallet</h2>
              <p className="text-slate-400 mb-2">Please approve the transaction in your wallet.</p>
              <p className="text-slate-500 text-sm">Selling {percentage}% of your portfolio in one transaction.</p>
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  // Confirm screen
  if (step === 'confirm') {
    const preview = getValidSellPreview()
    const dustTokens = getDustTokens()
    const totalValue = getTotalSellValue()
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => setStep('select')}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">Confirm Sale</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Summary */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">You&apos;re selling</p>
                <p className="text-3xl font-bold text-white">{percentage}%</p>
                <p className="text-sm text-slate-500">of selected tokens</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>

            {/* Total Value Being Sold */}
            <div className="mb-4 p-4 rounded-xl bg-slate-500/10 border border-slate-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Total value</p>
                  <p className="text-sm font-medium text-white">{preview.length} tokens</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">
                    ${totalValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Estimated USDCx */}
            <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Estimated receive</p>
                  <p className="text-sm font-medium text-white">USDCx</p>
                </div>
                <div className="text-right">
                  {isQuoteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  ) : (
                    <p className="text-xl font-bold text-emerald-400">
                      ~${estimatedUsdcxReceived.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">One-Click Atomic Swap</p>
                <p className="text-xs text-slate-500">All tokens sold in a single transaction via AMMs.</p>
              </div>
            </div>
          </GlassCard>

          {/* Right: Token breakdown */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-400">Tokens to sell</p>
              <p className="text-sm text-emerald-400">→ USDCx</p>
            </div>

            <div className="space-y-3">
              {preview.map((item) => {
                const colors = TOKEN_COLORS[item.symbol] || { bg: 'bg-gray-500/20', text: 'text-gray-400' }
                const tokenInfo = getTokenBySymbol(item.symbol)
                return (
                  <div key={item.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {tokenInfo?.imageUrl ? (
                        <Image src={tokenInfo.imageUrl} alt={item.symbol} width={32} height={32} className="rounded-full" />
                      ) : (
                        <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                          <span className={`text-xs font-bold ${colors.text}`}>{item.symbol.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium text-sm">{item.symbol}</p>
                        <p className="text-xs text-slate-500">{formatTokenAmount(item.balance, item.symbol)} total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-mono text-sm">
                        -{formatTokenAmount(item.sellAmount, item.symbol)}
                      </p>
                      <p className="text-xs text-slate-400">${item.usdValue.toFixed(2)}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Dust warning */}
            {dustTokens.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400">
                  {dustTokens.length} token{dustTokens.length > 1 ? 's' : ''} skipped (value &lt; $0.001): {dustTokens.map(t => t.symbol).join(', ')}
                </p>
              </div>
            )}
          </GlassCard>
        </div>

        <Button
          onClick={handleSell}
          disabled={isLoading || preview.length === 0}
          className="w-full h-14 text-lg mt-4"
          size="lg"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Confirm Sale
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    )
  }

  // Default: 3-column select screen
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-3">
          <TrendingDown className="w-4 h-4" />
          Take Profits
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Sell Portfolio</h1>
        <p className="text-slate-400">Convert your tokens back to USDCx in a single transaction</p>
      </div>

      {!isConnected ? (
        <div className="max-w-md mx-auto">
          <GlassCard className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Connect Wallet</h3>
              <p className="text-slate-400 text-sm mb-6">Connect your Stacks wallet to view your portfolio</p>
              <WalletButton />
            </div>
          </GlassCard>
        </div>
      ) : balances.length === 0 && !isFetchingBalances && hasInitialFetch ? (
        <div className="max-w-md mx-auto">
          <GlassCard className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Tokens Found</h3>
              <p className="text-slate-400 text-sm mb-6">You don&apos;t have any portfolio tokens to sell</p>
              <Button asChild>
                <Link href="/app/invest">Start Investing</Link>
              </Button>
            </div>
          </GlassCard>
        </div>
      ) : (
        <>
          {/* 3 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Select Tokens */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/25">
                  1
                </div>
                <h2 className="text-lg font-semibold text-white">Select Tokens</h2>
              </div>

              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Your Portfolio</p>
                  <button
                    onClick={() => address && fetchBalances(address)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                    disabled={isFetchingBalances}
                  >
                    <RefreshCw className={`w-4 h-4 text-slate-400 ${isFetchingBalances ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {(isFetchingBalances || !hasInitialFetch) ? (
                  <div className="space-y-2 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-full p-3 rounded-xl border border-white/[0.08] bg-white/[0.02]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700/50" />
                            <div>
                              <div className="h-4 w-14 bg-slate-700/50 rounded mb-1" />
                              <div className="h-3 w-20 bg-slate-700/50 rounded" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {balances.map((token) => {
                      const isSelected = selectedTokens.some(t => t.symbol === token.symbol)
                      const colors = TOKEN_COLORS[token.symbol] || { bg: 'bg-gray-500/20', text: 'text-gray-400' }
                      const tokenInfo = getTokenBySymbol(token.symbol)
                      return (
                        <button
                          key={token.symbol}
                          onClick={() => toggleToken(token)}
                          className={`w-full p-3 rounded-xl border transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'border-blue-500/50 bg-blue-500/10'
                              : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {tokenInfo?.imageUrl ? (
                                <Image src={tokenInfo.imageUrl} alt={token.symbol} width={32} height={32} className="rounded-full" />
                              ) : (
                                <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                                  <span className={`text-xs font-bold ${colors.text}`}>{token.symbol.charAt(0)}</span>
                                </div>
                              )}
                              <div>
                                <p className="text-white font-medium text-sm">{token.symbol}</p>
                                <p className="text-slate-500 text-xs">{formatTokenAmount(token.balance, token.symbol)}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {balances.length > 1 && (
                  <button
                    onClick={selectAllTokens}
                    className="w-full text-center text-sm text-blue-400 hover:text-blue-300 mt-3 py-2 cursor-pointer"
                  >
                    Select All
                  </button>
                )}
              </GlassCard>
            </div>

            {/* Column 2: Sell Percentage */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-500/25">
                  2
                </div>
                <h2 className="text-lg font-semibold text-white">Choose Amount</h2>
              </div>

              <div className="space-y-2">
                {PERCENTAGE_OPTIONS.map((option) => {
                  const isSelected = percentage === option.value && customPercentage === ''
                  return (
                    <GlassCard
                      key={option.value}
                      hover
                      selected={isSelected}
                      onClick={() => handlePresetPercentage(option.value)}
                      className="p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-white">{option.label}</p>
                          <p className="text-slate-400 text-sm">{option.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  )
                })}

                {/* Custom percentage input */}
                <GlassCard
                  className={`p-4 ${isCustomActive ? 'border-blue-500/50 bg-blue-500/10' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-slate-400 mb-2">Custom amount</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={customPercentage}
                          onChange={(e) => handleCustomPercentageChange(e.target.value)}
                          placeholder="Enter 1-100"
                          className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-white text-lg font-bold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                            percentageError ? 'border-red-500/50' : 'border-white/10'
                          }`}
                        />
                        <span className="text-xl font-bold text-white">%</span>
                      </div>
                      {percentageError && (
                        <p className="text-red-400 text-xs mt-1">{percentageError}</p>
                      )}
                    </div>
                    {isCustomActive && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center ml-3">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>

              {/* Output Info */}
              <GlassCard className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Receive USDCx</p>
                    <p className="text-xs text-slate-500">All tokens convert to USDCx stablecoin</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Column 3: Preview & Sell */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-green-500/25">
                  3
                </div>
                <h2 className="text-lg font-semibold text-white">Review & Sell</h2>
              </div>

              <GlassCard className="p-5">
                {(isFetchingBalances || !hasInitialFetch) ? (
                  /* Loading skeleton */
                  <div className="animate-pulse">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                      <div>
                        <div className="h-3 w-12 bg-slate-700/50 rounded mb-2" />
                        <div className="h-6 w-16 bg-slate-700/50 rounded" />
                      </div>
                      <div className="text-right">
                        <div className="h-3 w-12 bg-slate-700/50 rounded mb-2" />
                        <div className="h-5 w-8 bg-slate-700/50 rounded" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-700/50" />
                            <div className="h-4 w-14 bg-slate-700/50 rounded" />
                          </div>
                          <div className="h-4 w-20 bg-slate-700/50 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedTokens.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Selling</p>
                        <p className="text-2xl font-bold text-white">{percentage}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Total Value</p>
                        {isQuoteLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white ml-auto" />
                        ) : (
                          <p className="text-lg font-semibold text-white">${getTotalSellValue().toFixed(2)}</p>
                        )}
                      </div>
                    </div>

                    {/* Estimated USDCx Received */}
                    <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">You&apos;ll receive</p>
                            <p className="text-sm font-medium text-white">USDCx</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {isQuoteLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                          ) : (
                            <>
                              <p className="text-lg font-bold text-emerald-400">
                                ~${estimatedUsdcxReceived.toFixed(2)}
                              </p>
                              <p className="text-[10px] text-slate-500">estimated</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {getValidSellPreview().map((item) => {
                        const colors = TOKEN_COLORS[item.symbol] || { bg: 'bg-gray-500/20', text: 'text-gray-400' }
                        const tokenInfo = getTokenBySymbol(item.symbol)
                        return (
                          <div key={item.symbol} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {tokenInfo?.imageUrl ? (
                                <Image src={tokenInfo.imageUrl} alt={item.symbol} width={24} height={24} className="rounded-full" />
                              ) : (
                                <div className={`w-6 h-6 rounded ${colors.bg} flex items-center justify-center`}>
                                  <span className={`text-[10px] font-bold ${colors.text}`}>{item.symbol.charAt(0)}</span>
                                </div>
                              )}
                              <span className="text-white text-sm">{item.symbol}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-white font-mono text-sm">
                                -{formatTokenAmount(item.sellAmount, item.symbol)}
                              </span>
                              <p className="text-xs text-slate-400">${item.usdValue.toFixed(2)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Dust warning */}
                    {getDustTokens().length > 0 && (
                      <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-[10px] text-amber-400">
                          {getDustTokens().length} token{getDustTokens().length > 1 ? 's' : ''} skipped (value &lt; $0.001): {getDustTokens().map(t => t.symbol).join(', ')}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
                      <TrendingDown className="w-6 h-6 text-slate-600" />
                    </div>
                    <p className="text-slate-500 text-sm">
                      Select tokens to see preview
                    </p>
                  </div>
                )}
              </GlassCard>

              {/* Atomic Execution Info */}
              <GlassCard className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Atomic Execution</p>
                    <p className="text-xs text-slate-500">All swaps in one transaction. 1% max slippage.</p>
                  </div>
                </div>
              </GlassCard>

              {/* CTA */}
              <Button
                onClick={() => setStep('confirm')}
                disabled={getValidSellPreview().length === 0 || !!percentageError || percentage < 1 || percentage > 100}
                className="w-full h-14 text-lg"
                size="lg"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 space-y-1">
            <p className="text-xs text-slate-600">
              Powered by{' '}
              <a href="https://bitflow.finance" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-400 transition-colors">
                Bitflow
              </a>
              {' • '}
              <a href="https://velar.co" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-400 transition-colors">
                Velar
              </a>
              {' • '}
              <a href="https://alexlab.co" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-400 transition-colors">
                Alex
              </a>
              {' • '}
              <a
                href={`https://explorer.hiro.so/txid/${STACKS_INDEX_CONTRACT.fullName}?chain=${isMainnet ? 'mainnet' : 'testnet'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-slate-400 transition-colors"
              >
                {STACKS_INDEX_CONTRACT.name}
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  )
}
