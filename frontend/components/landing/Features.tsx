'use client'

import { useEffect, useRef, useState } from 'react'
import { Bitcoin, Layers, Zap, Eye, Lock, Repeat, Sparkles } from 'lucide-react'

const FEATURES = [
  {
    icon: Bitcoin,
    title: 'Bitcoin Exposure',
    description: 'Get direct exposure to sBTC, the leading Bitcoin-backed asset on Stacks blockchain.',
    gradient: 'from-orange-500 to-amber-500',
    bgGradient: 'from-orange-500/20 to-amber-500/5',
    iconColor: 'text-orange-400',
    borderColor: 'border-orange-500/20',
    hoverBorder: 'group-hover:border-orange-500/40',
    glowColor: 'group-hover:shadow-orange-500/20',
    accentColor: '#f97316',
  },
  {
    icon: Layers,
    title: 'Yield-Bearing stSTX',
    description: 'Earn stacking rewards automatically through liquid staked STX tokens.',
    gradient: 'from-violet-500 to-purple-500',
    bgGradient: 'from-violet-500/20 to-purple-500/5',
    iconColor: 'text-violet-400',
    borderColor: 'border-violet-500/20',
    hoverBorder: 'group-hover:border-violet-500/40',
    glowColor: 'group-hover:shadow-violet-500/20',
    accentColor: '#8b5cf6',
  },
  {
    icon: Zap,
    title: 'One-Click Simple',
    description: 'No manual swaps or complex strategies. Deposit once and let the index work for you.',
    gradient: 'from-amber-400 to-yellow-500',
    bgGradient: 'from-amber-500/20 to-yellow-500/5',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    hoverBorder: 'group-hover:border-amber-500/40',
    glowColor: 'group-hover:shadow-amber-500/20',
    accentColor: '#fbbf24',
  },
  {
    icon: Eye,
    title: 'Transparent',
    description: 'Always know exactly what you own. Clear 40/30/30 allocation across assets.',
    gradient: 'from-emerald-400 to-green-500',
    bgGradient: 'from-emerald-500/20 to-green-500/5',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    hoverBorder: 'group-hover:border-emerald-500/40',
    glowColor: 'group-hover:shadow-emerald-500/20',
    accentColor: '#34d399',
  },
  {
    icon: Lock,
    title: 'Non-Custodial',
    description: 'Your keys, your crypto. Assets are held in your own Stacks wallet at all times.',
    gradient: 'from-blue-400 to-cyan-500',
    bgGradient: 'from-blue-500/20 to-cyan-500/5',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
    hoverBorder: 'group-hover:border-blue-500/40',
    glowColor: 'group-hover:shadow-blue-500/20',
    accentColor: '#60a5fa',
  },
  {
    icon: Repeat,
    title: 'Flexible Withdrawals',
    description: 'Exit anytime. Withdraw your entire position or just a portion back to USDCx.',
    gradient: 'from-pink-400 to-rose-500',
    bgGradient: 'from-pink-500/20 to-rose-500/5',
    iconColor: 'text-pink-400',
    borderColor: 'border-pink-500/20',
    hoverBorder: 'group-hover:border-pink-500/40',
    glowColor: 'group-hover:shadow-pink-500/20',
    accentColor: '#f472b6',
  },
]

export function Features() {
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([])
  const [activeFeature, setActiveFeature] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0')
            setVisibleFeatures((prev) => prev.includes(index) ? prev : [...prev, index])
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const cards = sectionRef.current?.querySelectorAll('[data-index]')
    cards?.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  // Track mouse for spotlight effect
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 dot-pattern opacity-20" />

        {/* Animated orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Mouse spotlight */}
        <div
          className="absolute w-96 h-96 rounded-full pointer-events-none transition-opacity duration-300"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
            opacity: activeFeature !== null ? 1 : 0,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Key Benefits</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Why{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                StacksIndex
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path
                  d="M2 6C50 2 150 2 198 6"
                  stroke="url(#underlineGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="underlineGrad" x1="0" y1="0" x2="200" y2="0">
                    <stop stopColor="#34d399" />
                    <stop offset="0.5" stopColor="#4ade80" />
                    <stop offset="1" stopColor="#2dd4bf" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            ?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg lg:text-xl">
            The simplest way to get diversified exposure to the Stacks ecosystem
          </p>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              data-index={index}
              className={`transition-all duration-700 ${
                visibleFeatures.includes(index)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onMouseEnter={() => setActiveFeature(index)}
              onMouseLeave={() => setActiveFeature(null)}
            >
              <div className={`group relative h-full p-6 lg:p-8 rounded-3xl bg-slate-900/60 backdrop-blur-xl border ${feature.borderColor} ${feature.hoverBorder} transition-all duration-500 cursor-pointer hover:bg-slate-900/80 hover:shadow-2xl ${feature.glowColor} overflow-hidden`}>
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Corner accent */}
                <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${feature.gradient} rounded-full opacity-0 group-hover:opacity-20 transition-all duration-500 blur-2xl group-hover:scale-150`} />

                {/* Animated particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-60`}
                      style={{
                        left: `${20 + i * 20}%`,
                        top: `${30 + (i % 2) * 30}%`,
                        background: feature.accentColor,
                        animation: activeFeature === index ? `floatParticle ${2 + i * 0.3}s ease-in-out infinite` : 'none',
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="relative">
                  {/* Illustration */}
                  <div className="mb-6">
                    <FeatureIllustration
                      index={index}
                      isActive={activeFeature === index}
                      color={feature.accentColor}
                      gradient={feature.gradient}
                    />
                  </div>

                  {/* Icon badge */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} p-[1px] mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                      <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                  </div>

                  <h3 className="font-heading text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all duration-300" style={{ backgroundImage: activeFeature === index ? `linear-gradient(to right, white, ${feature.accentColor})` : undefined }}>
                    {feature.title}
                  </h3>

                  <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          {[
            { value: '40%', label: 'sBTC', color: 'from-orange-400 to-amber-400' },
            { value: '30%', label: 'stSTX', color: 'from-violet-400 to-purple-400' },
            { value: '30%', label: 'STX', color: 'from-blue-400 to-cyan-400' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center transition-all duration-700 ${
                visibleFeatures.length >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${600 + i * 100}ms` }}
            >
              <div className={`text-3xl lg:text-4xl font-heading font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                {stat.value}
              </div>
              <div className="text-slate-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes floatParticle {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-15px) scale(1.5);
            opacity: 0.3;
          }
        }
      `}</style>
    </section>
  )
}

// Feature-specific illustrations
function FeatureIllustration({ index, isActive, color, gradient }: { index: number; isActive: boolean; color: string; gradient: string }) {
  const baseTransition = 'transition-all duration-500'

  // Bitcoin Exposure - BTC symbol with orbiting particles
  if (index === 0) {
    return (
      <div className="relative h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-24 h-24">
          {/* Outer ring */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeDasharray="4,4"
            className={`${baseTransition} ${isActive ? 'opacity-60' : 'opacity-20'}`}
          />

          {/* Bitcoin symbol */}
          <g className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-70'}`}>
            <circle cx="50" cy="50" r="25" fill={`${color}20`} />
            <text
              x="50"
              y="58"
              textAnchor="middle"
              fill={color}
              fontSize="28"
              fontWeight="bold"
              fontFamily="system-ui"
            >
              ₿
            </text>
          </g>

          {/* Orbiting particles */}
          {isActive && (
            <>
              <circle r="3" fill={color}>
                <animateMotion dur="3s" repeatCount="indefinite" path="M50 10 A40 40 0 1 1 49.99 10" />
              </circle>
              <circle r="2" fill={color} opacity="0.6">
                <animateMotion dur="4s" repeatCount="indefinite" path="M50 10 A40 40 0 1 1 49.99 10" begin="1s" />
              </circle>
            </>
          )}
        </svg>
      </div>
    )
  }

  // Yield-Bearing stSTX - Stacking layers with growing effect
  if (index === 1) {
    return (
      <div className="relative h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 80" className="w-28 h-24">
          {/* Stacked layers */}
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <ellipse
                cx="50"
                cy={55 - i * 12}
                rx={30 - i * 2}
                ry="8"
                fill={`${color}${isActive ? (40 - i * 8).toString(16) : '15'}`}
                stroke={color}
                strokeWidth="1"
                className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-50'}`}
                style={{
                  transform: isActive ? `translateY(${-i * 2}px)` : 'translateY(0)',
                  transition: `all 0.5s ease ${i * 0.1}s`,
                }}
              />
            </g>
          ))}

          {/* Yield sparkles */}
          {isActive && (
            <>
              {[
                { cx: 25, cy: 25, delay: '0s' },
                { cx: 75, cy: 30, delay: '0.3s' },
                { cx: 50, cy: 15, delay: '0.6s' },
              ].map((spark, i) => (
                <g key={i}>
                  <circle cx={spark.cx} cy={spark.cy} r="2" fill={color}>
                    <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin={spark.delay} />
                    <animate attributeName="r" values="1;3;1" dur="1.5s" repeatCount="indefinite" begin={spark.delay} />
                  </circle>
                </g>
              ))}
            </>
          )}
        </svg>
      </div>
    )
  }

  // One-Click Simple - Lightning bolt with pulse
  if (index === 2) {
    return (
      <div className="relative h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-24 h-24">
          {/* Pulse rings */}
          {isActive && (
            <>
              <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="1">
                <animate attributeName="r" values="25;45;25" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="1">
                <animate attributeName="r" values="25;45;25" dur="2s" repeatCount="indefinite" begin="0.5s" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" begin="0.5s" />
              </circle>
            </>
          )}

          {/* Center circle */}
          <circle
            cx="50"
            cy="50"
            r="25"
            fill={`${color}20`}
            className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-50'}`}
          />

          {/* Lightning bolt */}
          <path
            d="M55 25 L42 48 L52 48 L45 75 L58 45 L48 45 Z"
            fill={color}
            className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-70'}`}
          />
        </svg>
      </div>
    )
  }

  // Transparent - Eye with allocation pie
  if (index === 3) {
    return (
      <div className="relative h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 80" className="w-28 h-24">
          {/* Pie chart */}
          <g transform="translate(50, 40)">
            {/* 40% segment - sBTC */}
            <path
              d="M0 0 L0 -25 A25 25 0 0 1 23.8 -7.7 Z"
              fill="#f97316"
              className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-60'}`}
            />
            {/* 40% segment - stSTX */}
            <path
              d="M0 0 L23.8 -7.7 A25 25 0 0 1 0 25 Z"
              fill="#8b5cf6"
              className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-60'}`}
            />
            {/* 20% segment - STX */}
            <path
              d="M0 0 L0 25 A25 25 0 0 1 0 -25 Z"
              fill="#60a5fa"
              className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-60'}`}
            />

            {/* Center circle */}
            <circle r="12" fill="#0f172a" />

            {/* Eye icon in center */}
            <ellipse cx="0" cy="0" rx="6" ry="4" fill="none" stroke={color} strokeWidth="1.5" />
            <circle cx="0" cy="0" r="2" fill={color}>
              {isActive && (
                <animate attributeName="r" values="2;3;2" dur="1s" repeatCount="indefinite" />
              )}
            </circle>
          </g>

          {/* Scan lines */}
          {isActive && (
            <line x1="10" y1="40" x2="90" y2="40" stroke={color} strokeWidth="0.5" strokeDasharray="2,4">
              <animate attributeName="y1" values="20;60;20" dur="2s" repeatCount="indefinite" />
              <animate attributeName="y2" values="20;60;20" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
            </line>
          )}
        </svg>
      </div>
    )
  }

  // Non-Custodial - Shield with key
  if (index === 4) {
    return (
      <div className="relative h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-24 h-24">
          {/* Shield outline */}
          <path
            d="M50 10 L80 25 L80 50 Q80 80 50 90 Q20 80 20 50 L20 25 Z"
            fill={`${color}15`}
            stroke={color}
            strokeWidth="1.5"
            className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-50'}`}
          />

          {/* Inner shield */}
          <path
            d="M50 20 L70 32 L70 50 Q70 72 50 80 Q30 72 30 50 L30 32 Z"
            fill={`${color}30`}
            className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-30'}`}
          />

          {/* Key icon */}
          <g transform="translate(50, 50)">
            <circle cx="0" cy="-8" r="8" fill="none" stroke={color} strokeWidth="2" className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-70'}`} />
            <line x1="0" y1="0" x2="0" y2="18" stroke={color} strokeWidth="2" className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-70'}`} />
            <line x1="0" y1="12" x2="6" y2="12" stroke={color} strokeWidth="2" className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-70'}`} />
            <line x1="0" y1="18" x2="6" y2="18" stroke={color} strokeWidth="2" className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-70'}`} />
          </g>

          {/* Security pulse */}
          {isActive && (
            <path
              d="M50 10 L80 25 L80 50 Q80 80 50 90 Q20 80 20 50 L20 25 Z"
              fill="none"
              stroke={color}
              strokeWidth="2"
            >
              <animate attributeName="stroke-opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="stroke-width" values="1;4;1" dur="2s" repeatCount="indefinite" />
            </path>
          )}
        </svg>
      </div>
    )
  }

  // Flexible Withdrawals - Circular arrows with coins
  return (
    <div className="relative h-24 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        {/* Circular arrow path */}
        <path
          d="M50 15 A35 35 0 1 1 15 50"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={isActive ? 'none' : '8,8'}
          className={`${baseTransition} ${isActive ? 'opacity-80' : 'opacity-40'}`}
        />
        <path
          d="M50 85 A35 35 0 1 1 85 50"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={isActive ? 'none' : '8,8'}
          className={`${baseTransition} ${isActive ? 'opacity-80' : 'opacity-40'}`}
        />

        {/* Arrow heads */}
        <polygon points="50,10 45,20 55,20" fill={color} className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-60'}`} />
        <polygon points="50,90 45,80 55,80" fill={color} className={`${baseTransition} ${isActive ? 'opacity-100' : 'opacity-60'}`} />

        {/* Center coin stack */}
        <g transform="translate(50, 50)">
          {[0, 1, 2].map((i) => (
            <ellipse
              key={i}
              cx="0"
              cy={4 - i * 6}
              rx="12"
              ry="4"
              fill={i === 2 ? color : `${color}60`}
              stroke={color}
              strokeWidth="1"
              className={`${baseTransition}`}
              style={{
                transform: isActive ? `translateY(${-i}px)` : 'translateY(0)',
                transition: `all 0.3s ease ${i * 0.1}s`,
              }}
            />
          ))}
        </g>

        {/* Animated flow */}
        {isActive && (
          <>
            <circle r="3" fill={color}>
              <animateMotion dur="2s" repeatCount="indefinite" path="M50 15 A35 35 0 1 1 15 50" />
            </circle>
            <circle r="3" fill={color}>
              <animateMotion dur="2s" repeatCount="indefinite" path="M50 85 A35 35 0 1 1 85 50" />
            </circle>
          </>
        )}
      </svg>
    </div>
  )
}
