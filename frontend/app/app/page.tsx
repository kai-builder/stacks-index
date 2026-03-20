'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowDownToLine, ArrowUpFromLine, Wallet, TrendingUp, TrendingDown, Activity, RefreshCw, DollarSign, BarChart3, Droplets, Minus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { PriceStatus } from '@/components/ui/PriceStatus'
import { PortfolioCard, AllocationChart, AssetRow, AddLiquidityModal, RemoveLiquidityModal } from '@/components/portfolio'
import { useWalletStore } from '@/lib/store/wallet'
import { usePriceStore, fetchPrices } from '@/lib/store/prices'
import { useBalanceStore } from '@/lib/store/balance'
import { TOKENS, getTokenBySymbol } from '@/lib/stacks/tokens'
import { useUserStats } from '@/lib/hooks/useUserStats'
import { useSell } from '@/lib/hooks/useSell'
import { useAddLiquidity, LP_POOLS, PoolId } from '@/lib/hooks/useAddLiquidity'
import { useRemoveLiquidity } from '@/lib/hooks/useRemoveLiquidity'
import { useLpTokenBalances, LpTokenBalance } from '@/lib/hooks/useLpTokenBalances'
import { formatCurrency, formatNumber } from '@/lib/utils/format'

// LP Pool configuration for UI - defines which token pairs can form LP
type LpPairConfig = {
  poolId: 'STX-sBTC' | 'STX-stSTX'
  name: string
  tokens: [string, string]
  description: string
  type: 'xyk' | 'stableswap'
}

const LP_PAIRS: LpPairConfig[] = [
  {
    poolId: 'STX-sBTC',
    name: 'STX/sBTC',
    tokens: ['sBTC', 'STX'], // x-token, y-token
    description: 'Earn fees on Bitflow',
    type: 'xyk',
  },
  {
    poolId: 'STX-stSTX',
    name: 'STX/stSTX',
    tokens: ['STX', 'stSTX'], // x-token, y-token
    description: 'Earn fees on Bitflow',
    type: 'stableswap',
  },
]

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

export default function DashboardPage() {
  const { isConnected, address, network } = useWalletStore()
  const { prices, lastUpdated, isLoading: pricesLoading, setPrices, setLoading } = usePriceStore()
  const { fetchBalance: fetchUsdcxBalance } = useBalanceStore()

  // Use the same balance fetching as profit page
  const { balances, isFetchingBalances, fetchBalances } = useSell()

  // LP feature - Add liquidity
  const { addLiquidity, isLoading: isAddingLp, error: lpError, txId: lpTxId, reset: resetLp } = useAddLiquidity()
  const { lpTokens, isLoading: lpTokensLoading, fetchLpTokenBalances } = useLpTokenBalances()
  const [showLpModal, setShowLpModal] = useState(false)
  const [selectedLpPair, setSelectedLpPair] = useState<LpPairConfig | null>(null)

  // LP feature - Remove liquidity
  const { removeLiquidity, isLoading: isRemovingLp, error: removeLpError, txId: removeLpTxId, reset: resetRemoveLp } = useRemoveLiquidity()
  const [showRemoveLpModal, setShowRemoveLpModal] = useState(false)
  const [selectedLpPosition, setSelectedLpPosition] = useState<{
    poolContract: string
    poolName: string
    lpTokenBalance: number
    xTokenSymbol: string
    yTokenSymbol: string
    poolId: PoolId
    poolType: 'xyk' | 'stableswap'
  } | null>(null)

  // Track if initial fetch has been triggered
  const [hasInitialFetch, setHasInitialFetch] = useState(false)

  // Fetch on-chain user stats
  const {
    formattedStats,
    formattedPnL,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useUserStats(address || "", network === 'mainnet' ? 'mainnet' : 'testnet')

  // Fetch real on-chain balances + pre-populate USDCx balance for invest page
  useEffect(() => {
    if (address) {
      setHasInitialFetch(true)
      fetchBalances(address)
      // Pre-populate USDCx balance store so invest page loads instantly
      fetchUsdcxBalance(address, network === 'mainnet')
      // Fetch LP token balances from wallet
      fetchLpTokenBalances(address)
    }
  }, [address, fetchBalances, fetchUsdcxBalance, fetchLpTokenBalances, network])

  useEffect(() => {
    const loadPrices = async () => {
      setLoading(true)
      try {
        const data = await fetchPrices()
        setPrices(data)
      } catch (error) {
        console.error('Failed to fetch prices:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPrices()
    const interval = setInterval(loadPrices, 30000)
    return () => clearInterval(interval)
  }, [setPrices, setLoading])

  const totalInvested = formattedStats?.totalInvested

  // Portfolio is derived from balances/prices; memoize it instead of syncing derived state.
  const portfolio = useMemo(() => {
    if (balances.length > 0 && Object.keys(prices).length > 0) {
      const holdings = balances
        .map((token) => {
          const price = prices[token.symbol]?.price || 0
          return {
            symbol: token.symbol,
            amount: token.balance,
            value: token.balance * price,
          }
        })
        .filter((holding) => holding.value > 0)

      const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0)

      return {
        totalValue,
        totalCost: totalInvested || totalValue,
        holdings,
      }
    }

    if (balances.length === 0 && !isFetchingBalances && hasInitialFetch) {
      return null
    }

    return null
  }, [balances, prices, totalInvested, isFetchingBalances, hasInitialFetch])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Wallet className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="font-heading text-2xl font-bold text-white mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-slate-400 mb-6 text-center max-w-md">
          Connect your wallet to view your portfolio and start investing in the Stacks index.
        </p>
      </div>
    )
  }

  const hasPosition = portfolio && portfolio.holdings.length > 0
  const hasOnChainData = formattedStats && formattedStats.investCount > 0

  // Get token balances
  const stxBalance = balances.find(b => b.symbol === 'STX')
  const sbtcBalance = balances.find(b => b.symbol === 'sBTC')
  const ststxBalance = balances.find(b => b.symbol === 'stSTX')

  // Check which LP pairs user is eligible for
  const eligibleLpPairs = LP_PAIRS.filter(pair => {
    const [tokenA, tokenB] = pair.tokens
    const balanceA = balances.find(b => b.symbol === tokenA)
    const balanceB = balances.find(b => b.symbol === tokenB)
    return balanceA && balanceB && balanceA.balance > 0 && balanceB.balance > 0
  })

  // Get all LP-eligible symbols for grouping
  const lpEligibleSymbols = Array.from(new Set(eligibleLpPairs.flatMap(p => p.tokens)))
  const lpHoldings = portfolio?.holdings.filter(h => lpEligibleSymbols.includes(h.symbol)) || []
  const otherHoldings = portfolio?.holdings.filter(h => !lpEligibleSymbols.includes(h.symbol)) || []

  // Handle LP submission
  const handleAddLp = async (xAmount: number, yAmount?: number) => {
    if (!address || !selectedLpPair) return

    await addLiquidity({
      poolId: selectedLpPair.poolId,
      xAmount,
      yAmount: selectedLpPair.type === 'stableswap' ? yAmount : undefined,
      minDlp: 1,
      senderAddress: address,
      onSuccess: (txId) => {
        console.log('LP added:', txId)
      },
    })
  }

  // Open LP modal for a specific pair
  const openLpModal = (pair: LpPairConfig) => {
    setSelectedLpPair(pair)
    setShowLpModal(true)
  }

  // Close modal and reset state
  const handleCloseModal = () => {
    setShowLpModal(false)
    setSelectedLpPair(null)
    if (lpTxId) {
      resetLp()
    }
  }

  // Handle Remove LP submission
  const handleRemoveLp = async (lpAmount: number) => {
    if (!address || !selectedLpPosition) return

    await removeLiquidity({
      poolId: selectedLpPosition.poolId,
      lpAmount,
      senderAddress: address,
      onSuccess: (txId) => {
        console.log('LP removed:', txId)
        // Refresh LP token balances after successful removal
        fetchLpTokenBalances(address)
      },
    })
  }

  // Open Remove LP modal for a specific LP token
  const openRemoveLpModal = (lpToken: LpTokenBalance) => {
    setSelectedLpPosition({
      poolContract: lpToken.poolContract,
      poolName: lpToken.poolName,
      lpTokenBalance: lpToken.lpTokenBalance,
      xTokenSymbol: lpToken.xTokenSymbol,
      yTokenSymbol: lpToken.yTokenSymbol,
      poolId: lpToken.poolId,
      poolType: lpToken.poolType,
    })
    setShowRemoveLpModal(true)
  }

  // Close Remove LP modal
  const handleCloseRemoveModal = () => {
    setShowRemoveLpModal(false)
    setSelectedLpPosition(null)
    if (removeLpTxId) {
      resetRemoveLp()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-white">Portfolio</h1>
        <PriceStatus
          lastUpdated={lastUpdated}
          isRefreshing={pricesLoading || isFetchingBalances}
          onRefresh={async () => {
            setLoading(true)
            const data = await fetchPrices()
            setPrices(data)
            setLoading(false)
            if (address) {
              fetchBalances(address)
            }
          }}
        />
      </div>

      {/* On-Chain P&L Stats */}
      {hasOnChainData && formattedPnL && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                formattedPnL.isProfit ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {formattedPnL.isProfit ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">On-Chain P&L</p>
                <p className={`text-2xl font-bold ${
                  formattedPnL.isProfit ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formattedPnL.isProfit ? '+' : '-'}${(formattedPnL.isProfit ? formattedPnL.profit : formattedPnL.loss).toFixed(2)}
                  <span className="text-sm ml-2">
                    ({formattedPnL.profitPercent >= 0 ? '+' : ''}{formattedPnL.profitPercent.toFixed(2)}%)
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={refetchStats}
              disabled={statsLoading}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${statsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-white/[0.03]">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownToLine className="w-4 h-4 text-blue-400" />
                <p className="text-xs text-slate-500">Total Invested</p>
              </div>
              <p className="text-lg font-semibold text-white">${formattedStats.totalInvested.toFixed(2)}</p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03]">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpFromLine className="w-4 h-4 text-emerald-400" />
                <p className="text-xs text-slate-500">Total Withdrawn</p>
              </div>
              <p className="text-lg font-semibold text-white">${formattedStats.totalWithdrawn.toFixed(2)}</p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03]">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-purple-400" />
                <p className="text-xs text-slate-500">Investments</p>
              </div>
              <p className="text-lg font-semibold text-white">{formattedStats.investCount}</p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03]">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-orange-400" />
                <p className="text-xs text-slate-500">Sells</p>
              </div>
              <p className="text-lg font-semibold text-white">{formattedStats.sellCount}</p>
            </div>
          </div>

          {statsError && (
            <p className="text-red-400 text-sm mt-3">{statsError}</p>
          )}
        </GlassCard>
      )}

      {/* No On-Chain Data Yet */}
      {!hasOnChainData && !statsLoading && isConnected && (
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="text-white font-medium">No On-Chain Investment History</p>
              <p className="text-slate-500 text-sm">Your investment and P&L data will appear here after your first transaction.</p>
            </div>
          </div>
        </GlassCard>
      )}

      {(isFetchingBalances || !hasInitialFetch) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading portfolio...</p>
          </CardContent>
        </Card>
      ) : !hasPosition ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="font-heading text-xl font-bold text-white mb-2">
              No Position Yet
            </h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Invest your USDCx to get started with diversified Stacks exposure.
            </p>
            <Button asChild>
              <Link href="/app/invest">
                <ArrowDownToLine className="w-4 h-4" />
                Start Investing
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <PortfolioCard
            totalValue={portfolio.totalValue}
            totalCost={portfolio.totalCost}
            isLoading={pricesLoading}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <AllocationChart
              allocations={portfolio.holdings.map((h) => ({
                symbol: h.symbol,
                value: h.value,
                percentage: (h.value / portfolio.totalValue) * 100,
              }))}
              isLoading={pricesLoading}
            />

            <Card>
              <CardHeader>
                <h3 className="font-heading text-lg font-semibold text-white">Holdings</h3>
              </CardHeader>
              <CardContent className="pt-0">
                {/* LP-Eligible Pairs */}
                {eligibleLpPairs.length > 0 && (
                  <div className="mb-4 space-y-4">
                    {eligibleLpPairs.map((pair) => {
                      const pairHoldings = portfolio?.holdings.filter(h => pair.tokens.includes(h.symbol)) || []
                      return (
                        <div key={pair.poolId}>
                          {/* Group Header with Earn Button */}
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-purple-500/20">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {pair.tokens.map((symbol) => {
                                  const token = getTokenBySymbol(symbol) || TOKENS[symbol]
                                  return token?.imageUrl ? (
                                    <Image
                                      key={symbol}
                                      src={token.imageUrl}
                                      alt={symbol}
                                      width={24}
                                      height={24}
                                      className="rounded-full border-2 border-[#0D0D0D]"
                                    />
                                  ) : null
                                })}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm text-purple-400 font-medium">{pair.name}</span>
                                <span className="text-xs text-slate-500">{pair.description}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => openLpModal(pair)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm font-medium transition-colors cursor-pointer"
                            >
                              <Droplets className="w-3.5 h-3.5" />
                              Earn
                            </button>
                          </div>

                          {/* Pair Holdings */}
                          {pairHoldings.map((holding) => (
                            <AssetRow
                              key={`${pair.poolId}-${holding.symbol}`}
                              symbol={holding.symbol}
                              amount={holding.amount}
                              value={holding.value}
                              price={prices[holding.symbol]?.price || 0}
                              change24h={prices[holding.symbol]?.change24h || 0}
                            />
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Other Holdings */}
                {otherHoldings.map((holding) => (
                  <AssetRow
                    key={holding.symbol}
                    symbol={holding.symbol}
                    amount={holding.amount}
                    value={holding.value}
                    price={prices[holding.symbol]?.price || 0}
                    change24h={prices[holding.symbol]?.change24h || 0}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* LP Positions - Detected from wallet token balances */}
          {lpTokens.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-purple-400" />
                    <h3 className="font-heading text-lg font-semibold text-white">LP Positions</h3>
                  </div>
                  <button
                    onClick={() => address && fetchLpTokenBalances(address)}
                    disabled={lpTokensLoading}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 text-slate-400 ${lpTokensLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {lpTokens.map((lpToken) => (
                  <div
                    key={lpToken.poolContract}
                    className="flex items-center justify-between py-4 border-b border-slate-800 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[lpToken.xTokenSymbol, lpToken.yTokenSymbol].map((symbol) => {
                          const token = getTokenBySymbol(symbol) || TOKENS[symbol]
                          return token?.imageUrl ? (
                            <Image
                              key={symbol}
                              src={token.imageUrl}
                              alt={symbol}
                              width={32}
                              height={32}
                              className="rounded-full border-2 border-[#0D0D0D]"
                            />
                          ) : (
                            <div
                              key={symbol}
                              className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border-2 border-[#0D0D0D]"
                            >
                              <span className="text-xs text-purple-400 font-bold">
                                {symbol.charAt(0)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <div>
                        <p className="font-medium text-white">{lpToken.poolName}</p>
                        <p className="text-sm text-slate-400">
                          {lpToken.poolType === 'stableswap' ? 'Stableswap' : 'XYK'} Pool
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-white">
                          {formatNumber(lpToken.lpTokenBalance, 6)} LP
                        </p>
                        <p className="text-sm text-purple-400">Earning fees</p>
                      </div>
                      <button
                        onClick={() => openRemoveLpModal(lpToken)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="w-full flex-1" size="lg" asChild>
              <Link href="/app/invest">
                <ArrowDownToLine className="w-4 h-4" />
                Invest More
              </Link>
            </Button>
            <Button variant="secondary" className="w-full flex-1" size="lg" asChild>
              <Link href="/app/profit">
                <ArrowUpFromLine className="w-4 h-4" />
                Take Profit
              </Link>
            </Button>
          </div>
        </>
      )}

      {/* Add Liquidity Modal */}
      {selectedLpPair && (() => {
        const pool = LP_POOLS[selectedLpPair.poolId]
        const tokenXBalance = balances.find(b => b.symbol === pool.xToken.symbol)
        const tokenYBalance = balances.find(b => b.symbol === pool.yToken.symbol)
        const tokenXPrice = prices[pool.xToken.symbol]?.price || 0
        const tokenYPrice = prices[pool.yToken.symbol]?.price || 0

        if (!tokenXBalance || !tokenYBalance) return null

        return (
          <AddLiquidityModal
            isOpen={showLpModal}
            onClose={handleCloseModal}
            poolName={selectedLpPair.name}
            poolType={selectedLpPair.type}
            tokenX={{ symbol: pool.xToken.symbol, balance: tokenXBalance.balance, decimals: pool.xToken.decimals, price: tokenXPrice }}
            tokenY={{ symbol: pool.yToken.symbol, balance: tokenYBalance.balance, decimals: pool.yToken.decimals, price: tokenYPrice }}
            onAddLiquidity={handleAddLp}
            isLoading={isAddingLp}
            error={lpError}
            txId={lpTxId}
          />
        )
      })()}

      {/* Remove Liquidity Modal */}
      {selectedLpPosition && (
        <RemoveLiquidityModal
          isOpen={showRemoveLpModal}
          onClose={handleCloseRemoveModal}
          poolName={selectedLpPosition.poolName}
          poolType={selectedLpPosition.poolType}
          lpBalance={selectedLpPosition.lpTokenBalance}
          xTokenSymbol={selectedLpPosition.xTokenSymbol}
          yTokenSymbol={selectedLpPosition.yTokenSymbol}
          onRemoveLiquidity={handleRemoveLp}
          isLoading={isRemovingLp}
          error={removeLpError}
          txId={removeLpTxId}
        />
      )}
    </div>
  )
}
