'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Shield, TrendingUp, Zap, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useWalletStore } from '@/lib/store/wallet'
import { FlowBadge } from './FlowBadge'
import { TOKENS } from '@/lib/stacks/tokens'

// Top tokens on Stacks ecosystem
const TOP_TOKENS = [
  TOKENS.sBTC,
  TOKENS.stSTX,
  TOKENS.LEO,
  TOKENS.WELSH,
  TOKENS.DOG,
  TOKENS.ALEX,
].filter(Boolean)

function useCountUp(end: number, duration: number = 2000, decimals: number = 0) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(easeOut * end)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [hasStarted, end, duration])

  return { count: count.toFixed(decimals), ref }
}

export function Hero() {
  const { isConnected } = useWalletStore()
  const tvl = useCountUp(12.5, 2000, 1)
  const users = useCountUp(2847, 2000, 0)
  const apy = useCountUp(8.2, 2000, 1)

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Animated background */}
      <div className="gradient-bg" />
      <div className="absolute inset-0 grid-pattern" />

      {/* Floating orbs */}
      <div className="absolute top-20 left-[10%] w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] float" />
      <div className="absolute bottom-20 right-[10%] w-80 h-80 bg-sbtc/20 rounded-full blur-[120px] float" style={{ animationDelay: '-3s' }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-slate-300">Live on Stacks Mainnet</span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.15]" style={{ animationDelay: '0.1s' }}>
              <span className="whitespace-nowrap">Invest <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Stacks Eco</span></span>
              <br />
              <span className="whitespace-nowrap">Like an <span className="text-gradient">Index Fund</span></span>
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-in-up text-lg sm:text-xl text-slate-400 max-w-lg leading-relaxed" style={{ animationDelay: '0.2s' }}>
              Turn your USDCx into a diversified Stacks portfolio with one click.
              Auto-split across predefiend strategies for optimal returns.
            </p>

            {/* Flow Badge - Key Value Prop */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
              <FlowBadge />
            </div>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up flex flex-col sm:flex-row gap-4" style={{ animationDelay: '0.3s' }}>
              {isConnected ? (
                <Button size="lg" className="btn-shine w-full sm:w-auto" asChild>
                  <Link href="/app/invest">
                    Start Investing
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              ) : (
                <WalletButton />
              )}
              <Button variant="secondary" size="lg" className="w-full sm:w-auto" asChild>
                <Link href="#how-it-works">
                  How It Works
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="animate-fade-in-up flex flex-wrap items-center gap-6 pt-4" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Non-custodial</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Instant swaps</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span>Auto-diversify</span>
              </div>
            </div>
          </div>

          {/* Right content - Bridge Animation */}
          <div className="animate-fade-in-up flex justify-center lg:justify-end" style={{ animationDelay: '0.2s' }}>
            <BridgeAnimation stats={{ tvl, users, apy }} />
          </div>
        </div>
      </div>
    </section>
  )
}

function BridgeAnimation({ stats }: { stats: { tvl: { count: string; ref: React.RefObject<HTMLDivElement> }; users: { count: string; ref: React.RefObject<HTMLDivElement> }; apy: { count: string; ref: React.RefObject<HTMLDivElement> } } }) {
  const [activeToken, setActiveToken] = useState(0)
  const [bridgePhase, setBridgePhase] = useState<'idle' | 'bridging' | 'distributing'>('idle')

  // Cycle through tokens
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveToken((prev) => (prev + 1) % TOP_TOKENS.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Bridge animation cycle
  useEffect(() => {
    const cycle = () => {
      setBridgePhase('bridging')
      setTimeout(() => setBridgePhase('distributing'), 1500)
      setTimeout(() => setBridgePhase('idle'), 3000)
    }

    cycle()
    const interval = setInterval(cycle, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full max-w-md">
      {/* Glow effect behind card */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-sbtc/20 rounded-3xl blur-2xl" />

      {/* Main card */}
      <div className="relative glass-card p-6 card-glow overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-slate-400">Bridge & Invest</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400">Live</span>
          </div>
        </div>

        {/* Bridge Visualization */}
        <div className="relative mb-6">
          {/* Source: Ethereum/Circle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#627EEA]/20 flex items-center justify-center">
                <EthereumIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500">From Ethereum</p>
                <p className="text-sm font-semibold text-white">USDCx</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Circle Bridge</p>
              <p className="text-sm font-semibold text-usdcx">$1,000</p>
            </div>
          </div>

          {/* Bridge Arrow Animation */}
          <div className="relative h-16 flex items-center justify-center">
            <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <div className={`relative z-10 transition-all duration-500 ${
              bridgePhase === 'bridging' ? 'scale-125' : 'scale-100'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                bridgePhase === 'bridging'
                  ? 'bg-blue-500 shadow-lg shadow-blue-500/50'
                  : 'bg-slate-800'
              }`}>
                <ArrowDown className={`w-5 h-5 text-white transition-transform duration-300 ${
                  bridgePhase === 'bridging' ? 'animate-bounce' : ''
                }`} />
              </div>
            </div>

            {/* Animated particles */}
            {bridgePhase === 'bridging' && (
              <>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-usdcx animate-ping" />
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" style={{ animationDelay: '0.2s' }} />
              </>
            )}
          </div>

          {/* Destination: Stacks Ecosystem */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#5546FF]/20 flex items-center justify-center">
                <StacksIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500">To Stacks</p>
                <p className="text-sm font-semibold text-white">Ecosystem</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Diversified</p>
              <p className="text-sm font-semibold text-green-400">One Click</p>
            </div>
          </div>
        </div>

        {/* Token Distribution Animation */}
        <div className="mb-6">
          <p className="text-xs text-slate-500 mb-3">Auto-invest into top Stacks tokens:</p>
          <div className="grid grid-cols-3 gap-2">
            {TOP_TOKENS.slice(0, 6).map((token, index) => (
              <div
                key={token.symbol}
                className={`relative p-2 rounded-lg border transition-all duration-500 cursor-pointer ${
                  bridgePhase === 'distributing' && index <= activeToken
                    ? 'bg-slate-800/80 border-slate-600 scale-105'
                    : 'bg-slate-900/50 border-slate-800'
                } ${activeToken === index ? 'ring-1 ring-blue-500/50' : ''}`}
              >
                <div className="flex items-center gap-1.5">
                  {token.imageUrl ? (
                    <Image
                      src={token.imageUrl}
                      alt={token.symbol}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ backgroundColor: token.color }}
                    >
                      {token.symbol.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-medium text-white truncate">{token.symbol}</span>
                </div>
                {bridgePhase === 'distributing' && index <= activeToken && (
                  <div
                    className="absolute inset-0 rounded-lg opacity-20"
                    style={{ backgroundColor: token.color }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div ref={stats.tvl.ref} className="text-center">
            <p className="font-heading text-lg font-bold text-white number-display">
              ${stats.tvl.count}M
            </p>
            <p className="text-[10px] text-slate-500">TVL</p>
          </div>
          <div ref={stats.users.ref} className="text-center border-x border-slate-800">
            <p className="font-heading text-lg font-bold text-white number-display">
              {parseInt(stats.users.count).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500">Users</p>
          </div>
          <div ref={stats.apy.ref} className="text-center">
            <p className="font-heading text-lg font-bold text-green-400 number-display">
              {stats.apy.count}%
            </p>
            <p className="text-[10px] text-slate-500">APY</p>
          </div>
        </div>

        {/* Shimmer effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </div>
  )
}

function EthereumIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 1.5L5.5 12.25L12 16L18.5 12.25L12 1.5Z" fill="#627EEA" />
      <path d="M12 16L5.5 12.25L12 22.5L18.5 12.25L12 16Z" fill="#627EEA" opacity="0.6" />
      <path d="M12 1.5V9.5L18.5 12.25L12 1.5Z" fill="#C0CBF6" />
      <path d="M12 16V22.5L18.5 12.25L12 16Z" fill="#C0CBF6" opacity="0.6" />
    </svg>
  )
}

function StacksIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M6 8H18L21 12L18 16H6L3 12L6 8Z" fill="#5546FF" />
      <path d="M8 10H16L18 12L16 14H8L6 12L8 10Z" fill="#7C6CFF" />
    </svg>
  )
}
