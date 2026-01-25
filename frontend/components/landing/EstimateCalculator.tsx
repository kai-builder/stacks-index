'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Calculator, TrendingUp, Info, Sparkles, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

// Growth scenarios
const GROWTH_SCENARIOS = [
  { label: 'Conservative', multiplier: 1.15, color: '#3b82f6', description: '+15% ecosystem growth' },
  { label: 'Moderate', multiplier: 1.5, color: '#6366f1', description: '+50% ecosystem growth' },
  { label: 'Bullish', multiplier: 2.5, color: '#f59e0b', description: '+150% ecosystem growth' },
  { label: 'Moon', multiplier: 5, color: '#10b981', description: '+400% ecosystem growth' },
]

// Time periods
const TIME_PERIODS = [
  { label: '6 months', months: 6 },
  { label: '1 year', months: 12 },
  { label: '2 years', months: 24 },
  { label: '5 years', months: 60 },
]

// Base APY for staking rewards
const BASE_STAKING_APY = 0.08 // 8% from stSTX staking

export function EstimateCalculator() {
  const [investAmount, setInvestAmount] = useState(1000)
  const [selectedScenario, setSelectedScenario] = useState(1) // Moderate by default
  const [selectedPeriod, setSelectedPeriod] = useState(1) // 1 year by default
  const [isVisible, setIsVisible] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const sliderRef = useRef<HTMLInputElement>(null)

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Calculate returns
  const calculateReturns = useCallback(() => {
    const scenario = GROWTH_SCENARIOS[selectedScenario]
    const period = TIME_PERIODS[selectedPeriod]
    const years = period.months / 12

    // Allocation: 40% sBTC, 30% stSTX, 30% STX
    const sbtcAllocation = investAmount * 0.4
    const ststxAllocation = investAmount * 0.3
    const stxAllocation = investAmount * 0.3

    // sBTC: Pure price appreciation
    const sbtcReturn = sbtcAllocation * Math.pow(scenario.multiplier, years)

    // stSTX: Price appreciation + staking APY compounded
    const ststxPriceGrowth = ststxAllocation * Math.pow(scenario.multiplier, years)
    const ststxStakingReward = ststxAllocation * Math.pow(1 + BASE_STAKING_APY, years) - ststxAllocation
    const ststxReturn = ststxPriceGrowth + ststxStakingReward

    // STX: Price appreciation
    const stxReturn = stxAllocation * Math.pow(scenario.multiplier, years)

    const totalReturn = sbtcReturn + ststxReturn + stxReturn
    const profit = totalReturn - investAmount
    const percentageGain = ((totalReturn - investAmount) / investAmount) * 100

    return {
      totalReturn,
      profit,
      percentageGain,
      breakdown: {
        sbtc: { invested: sbtcAllocation, returns: sbtcReturn },
        ststx: { invested: ststxAllocation, returns: ststxReturn, stakingReward: ststxStakingReward },
        stx: { invested: stxAllocation, returns: stxReturn },
      },
    }
  }, [investAmount, selectedScenario, selectedPeriod])

  const results = calculateReturns()

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(2)}`
  }

  // Update slider background
  useEffect(() => {
    if (sliderRef.current) {
      const percentage = ((investAmount - 100) / (100000 - 100)) * 100
      sliderRef.current.style.background = `linear-gradient(to right, #3b82f6 ${percentage}%, #334155 ${percentage}%)`
    }
  }, [investAmount])

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 dot-pattern opacity-10" />

        {/* Animated orbs */}
        <div className="absolute top-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 mb-6">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Earnings Estimator</span>
          </div>

          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            What Could Your{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Investment
            </span>
            {' '}Become?
          </h2>

          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            See how your USDC could grow with Stacks ecosystem expansion.
            Adjust the slider and explore different scenarios.
          </p>
        </div>

        {/* Calculator Card */}
        <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="relative max-w-4xl mx-auto">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-amber-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />

            {/* Main card */}
            <div className="relative rounded-3xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-xl overflow-hidden">
              {/* Top section - Input */}
              <div className="p-8 border-b border-slate-800">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Amount Input */}
                  <div className="flex-1">
                    <label className="block text-sm text-slate-400 mb-3">Investment Amount</label>
                    <div className="relative">
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl lg:text-5xl font-heading font-bold text-white">
                          ${investAmount.toLocaleString()}
                        </span>
                        <span className="text-slate-500 text-lg">USDC</span>
                      </div>

                      {/* Slider */}
                      <input
                        ref={sliderRef}
                        type="range"
                        min="100"
                        max="100000"
                        step="100"
                        value={investAmount}
                        onChange={(e) => setInvestAmount(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer slider-thumb"
                      />

                      {/* Slider labels */}
                      <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>$100</span>
                        <span>$25K</span>
                        <span>$50K</span>
                        <span>$75K</span>
                        <span>$100K</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick amount buttons */}
                  <div className="flex flex-wrap gap-2 lg:flex-col">
                    {[500, 1000, 5000, 10000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setInvestAmount(amount)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                          investAmount === amount
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        ${amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle section - Scenarios & Time */}
              <div className="p-8 border-b border-slate-800 grid md:grid-cols-2 gap-8">
                {/* Growth Scenario */}
                <div>
                  <label className="block text-sm text-slate-400 mb-3">Growth Scenario</label>
                  <div className="grid grid-cols-2 gap-2">
                    {GROWTH_SCENARIOS.map((scenario, index) => (
                      <button
                        key={scenario.label}
                        onClick={() => setSelectedScenario(index)}
                        className={`relative p-3 rounded-xl border transition-all duration-300 text-left cursor-pointer ${
                          selectedScenario === index
                            ? 'border-opacity-50 bg-opacity-10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                        style={{
                          borderColor: selectedScenario === index ? scenario.color : undefined,
                          backgroundColor: selectedScenario === index ? `${scenario.color}10` : undefined,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: scenario.color }}
                          />
                          <span className={`text-sm font-medium ${selectedScenario === index ? 'text-white' : 'text-slate-300'}`}>
                            {scenario.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{scenario.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Period */}
                <div>
                  <label className="block text-sm text-slate-400 mb-3">Time Period</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_PERIODS.map((period, index) => (
                      <button
                        key={period.label}
                        onClick={() => setSelectedPeriod(index)}
                        className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                          selectedPeriod === index
                            ? 'border-blue-500/50 bg-blue-500/10 text-white'
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        <span className="text-sm font-medium">{period.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom section - Results */}
              <div className="p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  {/* Initial Investment */}
                  <div className="text-center p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">You Invest</p>
                    <p className="text-2xl font-heading font-bold text-white">
                      ${investAmount.toLocaleString()}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-px bg-gradient-to-r from-slate-700 to-blue-500" />
                      <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                      <div className="w-16 h-px bg-gradient-to-r from-blue-500 to-emerald-500" />
                    </div>
                  </div>

                  {/* Potential Return */}
                  <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/30">
                    <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">
                      Potential Return
                    </p>
                    <p className="text-3xl lg:text-4xl font-heading font-bold text-emerald-400">
                      {formatCurrency(results.totalReturn)}
                    </p>
                    <p className="text-sm text-emerald-400/70 mt-1">
                      +{results.percentageGain.toFixed(0)}% gain
                    </p>
                  </div>
                </div>

                {/* Profit highlight */}
                <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/20 mb-6">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <p className="text-lg">
                    <span className="text-slate-400">Estimated profit: </span>
                    <span className="text-amber-400 font-bold font-heading">
                      +{formatCurrency(results.profit)}
                    </span>
                  </p>
                </div>

                {/* Breakdown toggle */}
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <span>View allocation breakdown</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showBreakdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Breakdown details */}
                {showBreakdown && (
                  <div className="mt-4 grid grid-cols-3 gap-4 animate-fade-in">
                    {/* sBTC */}
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-orange-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-sm font-medium text-white">sBTC (40%)</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">Invested: ${results.breakdown.sbtc.invested.toLocaleString()}</p>
                      <p className="text-sm text-orange-400 font-medium">
                        → {formatCurrency(results.breakdown.sbtc.returns)}
                      </p>
                    </div>

                    {/* stSTX */}
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-violet-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-violet-500" />
                        <span className="text-sm font-medium text-white">stSTX (40%)</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">Invested: ${results.breakdown.ststx.invested.toLocaleString()}</p>
                      <p className="text-sm text-violet-400 font-medium">
                        → {formatCurrency(results.breakdown.ststx.returns)}
                      </p>
                      <p className="text-xs text-violet-400/70 mt-1">
                        incl. +{formatCurrency(results.breakdown.ststx.stakingReward)} staking
                      </p>
                    </div>

                    {/* STX */}
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium text-white">STX (20%)</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">Invested: ${results.breakdown.stx.invested.toLocaleString()}</p>
                      <p className="text-sm text-blue-400 font-medium">
                        → {formatCurrency(results.breakdown.stx.returns)}
                      </p>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" className="w-full sm:w-auto" asChild>
                    <Link href="/app/invest">
                      Start Investing Now
                      <TrendingUp className="w-5 h-5" />
                    </Link>
                  </Button>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Estimates are hypothetical and not guaranteed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className={`mt-12 flex flex-wrap items-center justify-center gap-8 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          {[
            { label: 'Based on historical Stacks performance', icon: '📊' },
            { label: 'Includes 8% stSTX staking APY', icon: '💰' },
            { label: 'Compound growth calculated', icon: '📈' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-slate-500">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom slider styles */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          cursor: pointer;
          border: 3px solid #1e3a5f;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          transition: all 0.2s ease;
        }

        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.7);
        }

        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          cursor: pointer;
          border: 3px solid #1e3a5f;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </section>
  )
}

export default EstimateCalculator
