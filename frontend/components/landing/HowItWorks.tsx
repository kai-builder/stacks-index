'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, RefreshCw, LineChart, ArrowRight, Zap } from 'lucide-react'

const STEPS = [
  {
    icon: ArrowDownToLine,
    number: '01',
    title: 'Get USDCx',
    subtitle: 'On Stacks',
    description: 'Bridge USDC to Stacks via bridge.stacks.co to get USDCx. Or use any USDCx you already have.',
    color: 'from-blue-500 to-cyan-500',
    accentColor: '#3b82f6',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-blue-500/20',
  },
  {
    icon: RefreshCw,
    number: '02',
    title: '1-Click Invest',
    subtitle: 'Powered by Bitflow',
    description: 'Enter your USDCx amount and click invest. We auto-split into 40% sBTC, 30% stSTX, and 30% STX.',
    color: 'from-blue-500 to-indigo-500',
    accentColor: '#3b82f6',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-blue-500/20',
  },
  {
    icon: LineChart,
    number: '03',
    title: 'Track & Withdraw',
    subtitle: 'Full Control',
    description: 'Monitor your diversified portfolio. Withdraw anytime as tokens or convert back to USDCx.',
    color: 'from-amber-500 to-orange-500',
    accentColor: '#f59e0b',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    glowColor: 'shadow-amber-500/20',
  },
]

export function HowItWorks() {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([])
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [flowProgress, setFlowProgress] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0')
            setVisibleSteps((prev) => prev.includes(index) ? prev : [...prev, index])
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    )

    const cards = sectionRef.current?.querySelectorAll('[data-index]')
    cards?.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  // Animate flow line when section is visible
  useEffect(() => {
    if (visibleSteps.length === 3) {
      const interval = setInterval(() => {
        setFlowProgress((prev) => (prev >= 100 ? 0 : prev + 0.5))
      }, 20)
      return () => clearInterval(interval)
    }
  }, [visibleSteps])

  return (
    <section id="how-it-works" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-radial from-blue-500/5 via-transparent to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 mb-6">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">1-Click Simplicity</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            How It{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg lg:text-xl">
            Three simple steps to diversified Bitcoin and Stacks exposure
          </p>
        </div>

        {/* Main illustration container */}
        <div className="relative">
          {/* Animated flow line (desktop) */}
          <svg className="hidden lg:block absolute top-1/2 left-0 right-0 -translate-y-1/2 h-40 pointer-events-none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="flowPulse" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset={`${flowProgress - 10}%`} stopColor="transparent" />
                <stop offset={`${flowProgress}%`} stopColor="white" stopOpacity="0.8" />
                <stop offset={`${flowProgress + 10}%`} stopColor="transparent" />
              </linearGradient>
            </defs>
            {/* Base path */}
            <path
              d="M 100 80 C 200 80, 250 40, 400 40 S 550 120, 700 120 S 850 60, 950 60"
              fill="none"
              stroke="url(#flowGradient)"
              strokeWidth="2"
              strokeDasharray="8,8"
              className="opacity-30"
            />
            {/* Animated pulse */}
            <path
              d="M 100 80 C 200 80, 250 40, 400 40 S 550 120, 700 120 S 850 60, 950 60"
              fill="none"
              stroke="url(#flowPulse)"
              strokeWidth="3"
            />
          </svg>

          {/* Steps grid */}
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                data-index={index}
                className={`relative transition-all duration-700 ${
                  visibleSteps.includes(index)
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
                onMouseEnter={() => setActiveStep(index)}
                onMouseLeave={() => setActiveStep(null)}
              >
                {/* Card */}
                <div className={`relative h-full rounded-3xl border ${step.borderColor} bg-slate-900/50 backdrop-blur-xl p-8 transition-all duration-500 hover:shadow-2xl ${step.glowColor} group overflow-hidden`}>
                  {/* Animated background gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                  {/* Floating particles animation */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className={`absolute w-1 h-1 rounded-full bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-60`}
                        style={{
                          left: `${20 + i * 15}%`,
                          top: `${30 + (i % 3) * 20}%`,
                          animation: activeStep === index ? `float ${2 + i * 0.5}s ease-in-out infinite` : 'none',
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Illustration */}
                  <div className="relative mb-8">
                    <StepIllustration step={index} isActive={activeStep === index} color={step.accentColor} />
                  </div>

                  {/* Step number badge */}
                  <div className={`absolute top-6 right-6 w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity`}>
                    <span className="text-white font-heading font-bold text-lg">{step.number}</span>
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl ${step.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <step.icon className={`w-5 h-5 ${step.iconColor}`} />
                      </div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                        Step {index + 1}
                      </span>
                    </div>

                    <h3 className="font-heading text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all duration-300" style={{ backgroundImage: activeStep === index ? `linear-gradient(to right, white, ${step.accentColor})` : undefined }}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-3">{step.subtitle}</p>
                    <p className="text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                </div>

                {/* Connector arrow (mobile) */}
                {index < STEPS.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center animate-bounce`}>
                      <ArrowRight className="w-5 h-5 text-white rotate-90" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA hint */}
        <div className="mt-16 text-center space-y-3">
          <p className="text-slate-500 text-sm">
            Ready to start?{' '}
            <a href="/app/invest" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Invest your USDCx →
            </a>
          </p>
          <p className="text-slate-600 text-xs">
            Need USDCx?{' '}
            <a href="https://bridge.stacks.co/usdc/eth/stx" target="_blank" rel="noopener noreferrer" className="text-blue-400/70 hover:text-blue-300 transition-colors">
              Bridge from Ethereum at bridge.stacks.co
            </a>
          </p>
        </div>
      </div>

      {/* CSS for float animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.5);
            opacity: 0.3;
          }
        }
      `}</style>
    </section>
  )
}

// Animated illustrations for each step
function StepIllustration({ step, isActive, color }: { step: number; isActive: boolean; color: string }) {
  const baseTransition = 'transition-all duration-500'

  if (step === 0) {
    // Deposit illustration - Ethereum to Stacks bridge
    return (
      <div className="relative h-32 flex items-center justify-center">
        {/* Ethereum logo */}
        <div className={`absolute left-4 ${baseTransition} ${isActive ? 'scale-110' : 'scale-100'}`}>
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-8 h-8">
              <path d="M20 4L8 20l12 7 12-7L20 4z" fill="#627EEA" className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-70'}`} />
              <path d="M20 29l-12-7 12 14 12-14-12 7z" fill="#627EEA" className={`${baseTransition} ${isActive ? 'opacity-80' : 'opacity-50'}`} />
            </svg>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">USDC</div>
        </div>

        {/* Animated bridge */}
        <div className="absolute inset-x-20 top-1/2 -translate-y-1/2">
          <svg viewBox="0 0 100 20" className="w-full h-8">
            <path
              d="M0 10 Q25 0 50 10 T100 10"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeDasharray="4,4"
              className={`${baseTransition} ${isActive ? 'opacity-80' : 'opacity-30'}`}
            />
            {/* Animated dot */}
            <circle r="4" fill={color} className={isActive ? 'animate-bridge-flow' : ''}>
              <animateMotion dur="2s" repeatCount="indefinite" path="M0 10 Q25 0 50 10 T100 10" />
            </circle>
          </svg>
        </div>

        {/* Stacks logo */}
        <div className={`absolute right-4 ${baseTransition} ${isActive ? 'scale-110' : 'scale-100'}`}>
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-8 h-8">
              <rect x="8" y="8" width="24" height="24" rx="4" fill="none" stroke={color} strokeWidth="2" className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-70'}`} />
              <rect x="14" y="14" width="12" height="12" rx="2" fill={color} className={`${baseTransition} ${isActive ? 'opacity-80' : 'opacity-50'}`} />
            </svg>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">USDCx</div>
        </div>
      </div>
    )
  }

  if (step === 1) {
    // Auto-invest illustration - splitting into multiple tokens
    return (
      <div className="relative h-32 flex items-center justify-center">
        {/* Center USDCx */}
        <div className={`absolute left-8 ${baseTransition} ${isActive ? 'scale-110' : 'scale-100'}`}>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
            <span className="text-violet-400 font-bold text-xs">USDCx</span>
          </div>
        </div>

        {/* Animated split lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
          <defs>
            <linearGradient id="splitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {/* Lines to each token */}
          {[
            { path: 'M60 50 Q100 30 140 25', delay: '0s' },
            { path: 'M60 50 Q100 50 140 50', delay: '0.2s' },
            { path: 'M60 50 Q100 70 140 75', delay: '0.4s' },
          ].map((line, i) => (
            <g key={i}>
              <path d={line.path} fill="none" stroke="url(#splitGrad)" strokeWidth="2" strokeDasharray="4,4" className={`${baseTransition} ${isActive ? 'opacity-80' : 'opacity-30'}`} />
              {isActive && (
                <circle r="3" fill={color}>
                  <animateMotion dur="1.5s" repeatCount="indefinite" path={line.path} begin={line.delay} />
                </circle>
              )}
            </g>
          ))}
        </svg>

        {/* Token outputs */}
        <div className="absolute right-4 flex flex-col gap-2">
          {[
            { label: 'sBTC', color: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/30', text: 'text-orange-400' },
            { label: 'stSTX', color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30', text: 'text-violet-400' },
            { label: 'STX', color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
          ].map((token, i) => (
            <div
              key={token.label}
              className={`w-12 h-8 rounded-lg bg-gradient-to-br ${token.color} border ${token.border} flex items-center justify-center ${baseTransition} ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-50'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <span className={`${token.text} font-bold text-[10px]`}>{token.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Step 3 - Portfolio growth illustration
  return (
    <div className="relative h-32 flex items-center justify-center">
      {/* Chart illustration */}
      <svg viewBox="0 0 200 80" className="w-full h-full">
        <defs>
          <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[20, 40, 60].map((y) => (
          <line key={y} x1="20" y1={y} x2="180" y2={y} stroke="#334155" strokeWidth="0.5" strokeDasharray="4,4" />
        ))}

        {/* Chart area */}
        <path
          d="M20 70 L40 55 L60 60 L80 45 L100 50 L120 35 L140 40 L160 25 L180 20 L180 70 Z"
          fill="url(#chartGrad)"
          className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-50'}`}
        />

        {/* Chart line */}
        <path
          d="M20 70 L40 55 L60 60 L80 45 L100 50 L120 35 L140 40 L160 25 L180 20"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-70'}`}
          style={{
            strokeDasharray: isActive ? 'none' : '300',
            strokeDashoffset: isActive ? '0' : '300',
          }}
        />

        {/* Data points */}
        {[
          { x: 40, y: 55 },
          { x: 80, y: 45 },
          { x: 120, y: 35 },
          { x: 180, y: 20 },
        ].map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={isActive ? 4 : 3}
            fill={color}
            className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-50'}`}
            style={{ transitionDelay: `${i * 100}ms` }}
          />
        ))}

        {/* Animated pulse on last point */}
        {isActive && (
          <circle cx="180" cy="20" r="4" fill={color}>
            <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>

      {/* Growth indicator */}
      <div className={`absolute top-2 right-4 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30 ${baseTransition} ${isActive ? 'scale-110' : 'scale-100'}`}>
        <span className="text-green-400 text-xs font-medium">+12.5%</span>
      </div>
    </div>
  )
}
