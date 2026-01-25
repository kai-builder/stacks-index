'use client'

import { useEffect, useState } from 'react'

export function FlowBadge({ size = 'default' }: { size?: 'default' | 'large' }) {
  const [animationPhase, setAnimationPhase] = useState(0)

  // Continuous flow animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4)
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  const isLarge = size === 'large'

  return (
    <div className={`relative inline-flex items-center gap-2 ${isLarge ? 'p-2' : 'p-1.5'} rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 overflow-hidden`}>
      {/* USDCx Input */}
      <div className={`flex items-center gap-2 ${isLarge ? 'px-4 py-2' : 'px-3 py-1.5'} rounded-xl bg-blue-500/10 border border-blue-500/30 transition-all duration-300 ${animationPhase === 0 ? 'scale-105 border-blue-400/50' : ''}`}>
        <div className={`${isLarge ? 'w-6 h-6' : 'w-5 h-5'} rounded-full bg-blue-500 flex items-center justify-center`}>
          <span className="text-white font-bold text-xs">$</span>
        </div>
        <span className={`${isLarge ? 'text-sm' : 'text-xs'} font-semibold text-blue-400`}>USDCx</span>
      </div>

      {/* Arrow */}
      <div className="flex items-center">
        <svg viewBox="0 0 24 12" className="w-6 h-3">
          <path
            d="M0 6 L18 6 M14 2 L20 6 L14 10"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-opacity duration-300 ${animationPhase === 1 ? 'opacity-100' : 'opacity-40'}`}
          />
        </svg>
      </div>

      {/* 1-Click Magic */}
      <div className={`flex items-center gap-2 ${isLarge ? 'px-4 py-2' : 'px-3 py-1.5'} rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 transition-all duration-300 ${animationPhase === 1 ? 'scale-105 border-amber-400/50' : ''}`}>
        <span className={`${isLarge ? 'text-sm' : 'text-xs'} font-semibold text-amber-400`}>1-Click</span>
      </div>

      {/* Arrow */}
      <div className="flex items-center">
        <svg viewBox="0 0 24 12" className="w-6 h-3">
          <path
            d="M0 6 L18 6 M14 2 L20 6 L14 10"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-opacity duration-300 ${animationPhase === 2 ? 'opacity-100' : 'opacity-40'}`}
          />
        </svg>
      </div>

      {/* Output Tokens */}
      <div className={`flex items-center gap-1 ${isLarge ? 'px-3 py-2' : 'px-2 py-1.5'} rounded-xl bg-slate-800/50 border border-slate-600/30 transition-all duration-300 ${animationPhase >= 2 ? 'scale-105 border-slate-500/50' : ''}`}>
        {/* sBTC */}
        <div className={`${isLarge ? 'w-5 h-5' : 'w-4 h-4'} rounded-full bg-orange-500 flex items-center justify-center transition-all duration-300 ${animationPhase === 2 ? 'scale-110' : ''}`}>
          <span className="text-white font-bold text-[8px]">₿</span>
        </div>
        {/* stSTX */}
        <div className={`${isLarge ? 'w-5 h-5' : 'w-4 h-4'} rounded-full bg-violet-500 flex items-center justify-center transition-all duration-300 ${animationPhase === 3 ? 'scale-110' : ''}`}>
          <span className="text-white font-bold text-[8px]">st</span>
        </div>
        {/* STX */}
        <div className={`${isLarge ? 'w-5 h-5' : 'w-4 h-4'} rounded-full bg-indigo-500 flex items-center justify-center transition-all duration-300 ${animationPhase === 3 ? 'scale-110' : ''}`}>
          <span className="text-white font-bold text-[8px]">S</span>
        </div>
      </div>
    </div>
  )
}

// Large version for Value Proposition section
export function FlowBadgeLarge() {
  const [animationPhase, setAnimationPhase] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-amber-500/10 to-green-500/10 blur-2xl rounded-full" />

      {/* Main flow */}
      <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50">
        {/* Step 1: USDCx */}
        <div className="flex flex-col items-center gap-2">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-300 ${animationPhase === 0 ? 'scale-110' : ''}`}>
            <span className="text-white font-bold text-2xl">$</span>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">USDCx</p>
            <p className="text-xs text-slate-500">Your stablecoin</p>
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden sm:block">
          <svg viewBox="0 0 48 24" className="w-12 h-6">
            <defs>
              <linearGradient id="lgArrow1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <path
              d="M0 12 L38 12 M32 6 L44 12 L32 18"
              fill="none"
              stroke="url(#lgArrow1)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-opacity duration-500 ${animationPhase >= 1 ? 'opacity-100' : 'opacity-30'}`}
            />
          </svg>
        </div>
        <div className="sm:hidden w-px h-6 bg-gradient-to-b from-blue-500 to-amber-500" />

        {/* Step 2: 1-Click */}
        <div className="flex flex-col items-center gap-2">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 transition-all duration-300 ${animationPhase === 1 ? 'scale-110' : ''}`}>
            <span className="text-white font-bold text-lg">1-Click</span>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Auto-Invest</p>
            <p className="text-xs text-slate-500">Powered by Bitflow</p>
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden sm:block">
          <svg viewBox="0 0 48 24" className="w-12 h-6">
            <defs>
              <linearGradient id="lgArrow2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <path
              d="M0 12 L38 12 M32 6 L44 12 L32 18"
              fill="none"
              stroke="url(#lgArrow2)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-opacity duration-500 ${animationPhase >= 2 ? 'opacity-100' : 'opacity-30'}`}
            />
          </svg>
        </div>
        <div className="sm:hidden w-px h-6 bg-gradient-to-b from-amber-500 to-green-500" />

        {/* Step 3: Portfolio */}
        <div className="flex flex-col items-center gap-2">
          <div className={`flex gap-2 p-3 rounded-2xl bg-slate-800/80 border border-slate-600/50 transition-all duration-300 ${animationPhase >= 2 ? 'scale-105' : ''}`}>
            <div className={`w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center transition-all duration-300 ${animationPhase === 2 ? 'scale-110' : ''}`}>
              <span className="text-white font-bold text-xs">₿</span>
            </div>
            <div className={`w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center transition-all duration-300 ${animationPhase === 3 ? 'scale-110' : ''}`}>
              <span className="text-white font-bold text-xs">st</span>
            </div>
            <div className={`w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center transition-all duration-300 ${animationPhase === 3 ? 'scale-110' : ''}`}>
              <span className="text-white font-bold text-xs">S</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Your Portfolio</p>
            <p className="text-xs text-slate-500">40% sBTC • 30% stSTX • 30% STX</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlowBadge
