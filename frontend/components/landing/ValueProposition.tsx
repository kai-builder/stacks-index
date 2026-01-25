'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, DollarSign, TrendingUp, CircleDollarSign, HelpCircle, Check } from 'lucide-react'
import { FlowBadgeLarge } from './FlowBadge'

export function ValueProposition() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [animationPhase, setAnimationPhase] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)

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

  // Continuous flow animation
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setAnimationPhase((prev) => (prev + 1) % 100)
      }, 50)
      return () => clearInterval(interval)
    }
  }, [isVisible])

  const steps = [
    {
      icon: DollarSign,
      title: 'You Have USDCx',
      subtitle: 'On Stacks',
      description: 'Start with USDCx on Stacks. Need some? Bridge from Ethereum via bridge.stacks.co.',
      color: '#3b82f6',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: TrendingUp,
      title: '1-Click Diversify',
      subtitle: 'Powered by Bitflow',
      description: 'Auto-split into 40% sBTC, 30% stSTX, 30% STX. Like an index fund for Stacks ecosystem.',
      color: '#6366f1',
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      icon: CircleDollarSign,
      title: 'Withdraw Anytime',
      subtitle: 'As Tokens or USDCx',
      description: 'Exit as individual tokens or convert back to USDCx. Full control, no lock-ups.',
      color: '#10b981',
      gradient: 'from-emerald-500 to-green-500',
    },
  ]

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute inset-0 dot-pattern opacity-10" />

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 border border-blue-500/20 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-blue-400 text-sm font-medium">Simple as Traditional Investing</span>
          </div>

          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Invest in{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Stacks Eco
            </span>
            <br />
            <span className="text-3xl sm:text-4xl lg:text-5xl text-slate-400">
              Without the Complexity
            </span>
          </h2>

          <p className="text-slate-400 max-w-3xl mx-auto text-lg lg:text-xl leading-relaxed">
            Think of StacksIndex like an <span className="text-white font-medium">index fund for Stacks</span>.
            No need to research tokens, execute multiple swaps, or manage rebalancing.
            Just invest your USDCx and get instant exposure to sBTC, stSTX, and STX.
          </p>
        </div>

        {/* Main Flow Visualization */}
        <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          {/* Desktop Flow Line */}
          <svg className="hidden lg:block absolute top-1/2 left-0 right-0 -translate-y-1/2 h-32 pointer-events-none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="flowLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="flowPulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset={`${animationPhase - 15}%`} stopColor="transparent" />
                <stop offset={`${animationPhase - 5}%`} stopColor="white" stopOpacity="0.6" />
                <stop offset={`${animationPhase}%`} stopColor="white" stopOpacity="1" />
                <stop offset={`${animationPhase + 5}%`} stopColor="white" stopOpacity="0.6" />
                <stop offset={`${animationPhase + 15}%`} stopColor="transparent" />
              </linearGradient>
            </defs>

            {/* Base line */}
            <path
              d="M 120 64 L 400 64 M 450 64 L 730 64 M 780 64 L 1050 64"
              fill="none"
              stroke="url(#flowLineGradient)"
              strokeWidth="3"
              strokeDasharray="8,8"
              strokeLinecap="round"
              opacity="0.3"
            />

            {/* Animated pulse */}
            <path
              d="M 120 64 L 400 64 M 450 64 L 730 64 M 780 64 L 1050 64"
              fill="none"
              stroke="url(#flowPulseGradient)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Arrow heads */}
            <polygon points="395,58 410,64 395,70" fill="#6366f1" opacity="0.8" />
            <polygon points="775,58 790,64 775,70" fill="#10b981" opacity="0.8" />
          </svg>

          {/* Steps Grid */}
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`relative transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${400 + index * 200}ms` }}
                onMouseEnter={() => setActiveStep(index)}
                onMouseLeave={() => setActiveStep(null)}
              >
                {/* Card */}
                <div className={`group relative h-full rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-8 transition-all duration-500 hover:border-opacity-50 hover:shadow-2xl overflow-hidden`}
                  style={{ borderColor: activeStep === index ? `${step.color}40` : undefined }}
                >
                  {/* Gradient background on hover */}
                  <div
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                    style={{ backgroundImage: `linear-gradient(to bottom right, ${step.color}, transparent)` }}
                  />

                  {/* Step number */}
                  <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                    <span className="text-slate-500 font-heading font-bold">{index + 1}</span>
                  </div>

                  {/* Illustration */}
                  <div className="mb-6">
                    <StepIllustration
                      index={index}
                      isActive={activeStep === index}
                      color={step.color}
                      animationPhase={animationPhase}
                    />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} p-[1px] mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                        <step.icon className="w-6 h-6" style={{ color: step.color }} />
                      </div>
                    </div>

                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: step.color }}>
                      {step.subtitle}
                    </p>

                    <h3 className="font-heading text-2xl font-bold text-white mb-3">
                      {step.title}
                    </h3>

                    <p className="text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Bottom accent */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
                    style={{ background: `linear-gradient(to right, ${step.color}, transparent)` }}
                  />
                </div>

                {/* Mobile arrow connector */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-6">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center animate-bounce"
                      style={{ background: `linear-gradient(to bottom right, ${step.color}30, ${steps[index + 1].color}30)` }}
                    >
                      <ArrowRight className="w-5 h-5 text-white rotate-90" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Box */}
        <div className={`mt-20 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-800 bg-gradient-to-r from-blue-500/5 to-transparent">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-400" />
                  <h3 className="font-heading text-lg font-semibold text-white">
                    Why is this different?
                  </h3>
                </div>
              </div>

              {/* Comparison Grid */}
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                {/* Traditional Way */}
                <div className="p-8">
                  <p className="text-sm text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Without StacksIndex
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Learn how Stacks blockchain works',
                      'Research individual tokens',
                      'Create a Stacks wallet',
                      'Bridge assets manually',
                      'Execute multiple swaps',
                      'Monitor and rebalance',
                      'Figure out how to exit',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-500 text-sm">
                        <span className="mt-1 w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* StacksIndex Way */}
                <div className="p-8 bg-gradient-to-br from-emerald-500/5 to-transparent">
                  <p className="text-sm text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    With StacksIndex
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Connect your Stacks wallet',
                      'Enter USDCx amount to invest',
                      'Click "Invest" — done!',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-300 text-sm">
                        <Check className="mt-0.5 w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <p className="text-slate-400 text-sm">
                      Powered by Bitflow AMM. We handle the swaps, you get the portfolio.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Flow Badge */}
        <div className={`mt-16 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <FlowBadgeLarge />
        </div>
      </div>
    </section>
  )
}

// Step-specific illustrations
function StepIllustration({ index, isActive, color, animationPhase }: { index: number; isActive: boolean; color: string; animationPhase: number }) {
  const baseTransition = 'transition-all duration-500'

  // Step 1: USDC on Ethereum
  if (index === 0) {
    return (
      <div className="relative h-28 flex items-center justify-center">
        <svg viewBox="0 0 120 100" className="w-full h-full">
          {/* Ethereum logo */}
          <g transform="translate(60, 50)">
            {/* Outer glow */}
            {isActive && (
              <circle r="35" fill={`${color}10`}>
                <animate attributeName="r" values="30;40;30" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
            )}

            {/* ETH diamond */}
            <g className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              <path d="M0 -30 L20 0 L0 10 L-20 0 Z" fill="#627EEA" />
              <path d="M0 10 L20 0 L0 30 L-20 0 Z" fill="#627EEA" opacity="0.6" />
            </g>

            {/* USDC coins floating */}
            {[
              { x: -35, y: -15, delay: 0 },
              { x: 35, y: -10, delay: 0.3 },
              { x: -30, y: 20, delay: 0.6 },
              { x: 32, y: 18, delay: 0.9 },
            ].map((coin, i) => (
              <g key={i} transform={`translate(${coin.x}, ${coin.y})`}>
                <circle
                  r="10"
                  fill={`${color}30`}
                  stroke={color}
                  strokeWidth="1"
                  className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-40'}`}
                />
                <text
                  y="4"
                  textAnchor="middle"
                  fill={color}
                  fontSize="8"
                  fontWeight="bold"
                >
                  $
                </text>
                {isActive && (
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`${coin.x} ${coin.y}; ${coin.x} ${coin.y - 5}; ${coin.x} ${coin.y}`}
                    dur="2s"
                    begin={`${coin.delay}s`}
                    repeatCount="indefinite"
                  />
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>
    )
  }

  // Step 2: Index Fund visualization
  if (index === 1) {
    return (
      <div className="relative h-28 flex items-center justify-center">
        <svg viewBox="0 0 120 100" className="w-full h-full">
          <g transform="translate(60, 50)">
            {/* Index chart bars */}
            {[
              { x: -30, height: 25, color: '#f97316', label: 'sBTC' },
              { x: -10, height: 35, color: '#8b5cf6', label: 'stSTX' },
              { x: 10, height: 30, color: '#3b82f6', label: 'STX' },
              { x: 30, height: 40, color: '#10b981', label: 'Total' },
            ].map((bar, i) => (
              <g key={i}>
                <rect
                  x={bar.x - 8}
                  y={isActive ? 20 - bar.height : 20 - bar.height * 0.6}
                  width="16"
                  height={isActive ? bar.height : bar.height * 0.6}
                  rx="3"
                  fill={bar.color}
                  className={baseTransition}
                  opacity={isActive ? 0.9 : 0.5}
                />
                {isActive && (
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0 0; 0 -2; 0 0"
                    dur="1.5s"
                    begin={`${i * 0.2}s`}
                    repeatCount="indefinite"
                  />
                )}
              </g>
            ))}

            {/* Growth arrow */}
            <path
              d="M-35 15 Q-20 -20 0 -25 T35 -35"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeDasharray={isActive ? '0' : '4,4'}
              className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-40'}`}
            />

            {/* Arrow head */}
            <polygon
              points="35,-40 30,-30 40,-32"
              fill={color}
              className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-40'}`}
            />

            {/* Pie chart mini */}
            <g transform="translate(0, -25)">
              <circle r="12" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
              {isActive && (
                <circle r="12" fill="none" stroke={color} strokeWidth="2" strokeDasharray="20,55" strokeDashoffset="0">
                  <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          </g>
        </svg>
      </div>
    )
  }

  // Step 3: Withdraw to USDC
  return (
    <div className="relative h-28 flex items-center justify-center">
      <svg viewBox="0 0 120 100" className="w-full h-full">
        <g transform="translate(60, 50)">
          {/* Stacks to USDC flow */}

          {/* Stacks logo (left) */}
          <g transform="translate(-35, 0)">
            <rect x="-12" y="-12" width="24" height="24" rx="4" fill={color} opacity={isActive ? 0.8 : 0.4} />
            <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#0f172a" />
          </g>

          {/* Flow arrow */}
          <g>
            <path
              d="M-15 0 L15 0"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeDasharray={isActive ? '0' : '4,4'}
              className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-40'}`}
            />
            <polygon
              points="18,-4 25,0 18,4"
              fill={color}
              className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-40'}`}
            />

            {/* Animated coins flowing */}
            {isActive && (
              <>
                <circle r="4" fill={color}>
                  <animateMotion dur="1.5s" repeatCount="indefinite" path="M-15 0 L20 0" />
                  <animate attributeName="opacity" values="0;1;1;0" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle r="3" fill={color} opacity="0.6">
                  <animateMotion dur="1.5s" repeatCount="indefinite" path="M-15 0 L20 0" begin="0.5s" />
                  <animate attributeName="opacity" values="0;1;1;0" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
                </circle>
              </>
            )}
          </g>

          {/* USDC (right) */}
          <g transform="translate(35, 0)">
            <circle r="18" fill={`${color}20`} stroke={color} strokeWidth="2" className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-50'}`} />
            <text y="5" textAnchor="middle" fill={color} fontSize="14" fontWeight="bold">$</text>
            {isActive && (
              <circle r="18" fill="none" stroke={color} strokeWidth="2" opacity="0.5">
                <animate attributeName="r" values="18;25;18" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
          </g>

          {/* ETH network indicator */}
          <g transform="translate(35, 28)">
            <text textAnchor="middle" fill="#627EEA" fontSize="8" fontWeight="medium">on ETH</text>
          </g>
        </g>
      </svg>
    </div>
  )
}

export default ValueProposition
