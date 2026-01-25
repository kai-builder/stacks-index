'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { TOKENS, getTokenBySymbol } from '@/lib/stacks/tokens'

interface AllocationData {
  symbol: string
  value: number
  percentage: number
}

interface AllocationChartProps {
  allocations: AllocationData[]
  isLoading?: boolean
}

export function AllocationChart({ allocations, isLoading }: AllocationChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-heading text-lg font-semibold text-white">Allocation</h3>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="flex justify-center mb-6">
              <div className="w-40 h-40 rounded-full bg-slate-700/50" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-700/50" />
                    <div className="h-4 w-16 bg-slate-700/50 rounded" />
                  </div>
                  <div className="h-4 w-12 bg-slate-700/50 rounded" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const total = allocations.reduce((sum, a) => sum + a.value, 0)

  return (
    <Card>
      <CardHeader>
        <h3 className="font-heading text-lg font-semibold text-white">Allocation</h3>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-6">
          <div className="relative w-40 h-40">
            <PieChart allocations={allocations} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {allocations.length}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {allocations.map((item) => {
            const token = getTokenBySymbol(item.symbol) || TOKENS[item.symbol]
            return (
              <div key={item.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {token?.imageUrl ? (
                    <Image
                      src={token.imageUrl}
                      alt={item.symbol}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: token?.color || '#64748B' }}
                    />
                  )}
                  <span className="text-slate-300 font-medium">{item.symbol}</span>
                </div>
                <span className="text-white font-semibold">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function PieChart({ allocations }: { allocations: AllocationData[] }) {
  let cumulativePercentage = 0

  if (allocations.length === 0 || allocations.every(a => a.percentage === 0)) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="40" fill="#1E293B" />
        <circle cx="50" cy="50" r="20" fill="#0D0D0D" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
      {allocations.map((item) => {
        const token = getTokenBySymbol(item.symbol) || TOKENS[item.symbol]
        const startAngle = cumulativePercentage * 3.6
        cumulativePercentage += item.percentage
        const endAngle = cumulativePercentage * 3.6

        const x1 = 50 + 40 * Math.cos((Math.PI * startAngle) / 180)
        const y1 = 50 + 40 * Math.sin((Math.PI * startAngle) / 180)
        const x2 = 50 + 40 * Math.cos((Math.PI * endAngle) / 180)
        const y2 = 50 + 40 * Math.sin((Math.PI * endAngle) / 180)

        const largeArc = item.percentage > 50 ? 1 : 0

        return (
          <path
            key={item.symbol}
            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={token?.color || '#64748B'}
          />
        )
      })}
      <circle cx="50" cy="50" r="20" fill="#0D0D0D" />
    </svg>
  )
}
