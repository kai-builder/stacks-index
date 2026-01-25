'use client'

import { useEffect, useState, useRef } from 'react'

const STATS = [
  { value: 0.01, suffix: 'M', prefix: '$', label: 'Total Value Locked', decimals: 1 },
  { value: 5, suffix: '+', prefix: '', label: 'Active Users', decimals: 0 },
  { value: 8.2, suffix: '%', prefix: '', label: 'Average APY', decimals: 1 },
  { value: 20, suffix: '+', prefix: '', label: 'Transactions', decimals: 0 },
]

function StatItem({ value, suffix, prefix, label, decimals, delay }: {
  value: number
  suffix: string
  prefix: string
  label: string
  decimals: number
  delay: number
}) {
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
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    const timeout = setTimeout(() => {
      let startTime: number
      let animationFrame: number

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / 2500, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3)
        setCount(easeOut * value)

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate)
        }
      }

      animationFrame = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animationFrame)
    }, delay)

    return () => clearTimeout(timeout)
  }, [hasStarted, value, delay])

  const formattedCount = decimals > 0
    ? count.toFixed(decimals)
    : Math.round(count).toLocaleString()

  return (
    <div ref={ref} className="text-center">
      <p className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white number-display mb-2">
        {prefix}{formattedCount}{suffix}
      </p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  )
}

export function Stats() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-sbtc/5" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 md:p-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {STATS.map((stat, index) => (
              <StatItem
                key={stat.label}
                {...stat}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
