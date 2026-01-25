'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { formatCurrency, formatPercent } from '@/lib/utils/format'

interface PortfolioCardProps {
  totalValue: number
  totalCost: number
  isLoading?: boolean
}

export function PortfolioCard({ totalValue, totalCost, isLoading }: PortfolioCardProps) {
  const pnl = totalValue - totalCost
  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0
  const isPositive = pnl >= 0

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700/50 rounded w-32 mb-2" />
            <div className="h-10 bg-slate-700/50 rounded w-48 mb-4" />
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-700/50 rounded" />
              <div className="h-4 bg-slate-700/50 rounded w-40" />
              <div className="h-3 bg-slate-700/50 rounded w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <p className="text-sm text-slate-400 mb-1">Total Portfolio Value</p>
        <p className="font-heading text-4xl font-bold text-white mb-2">
          {formatCurrency(totalValue)}
        </p>
        <div className={`flex items-center gap-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="font-medium">
            {isPositive ? '+' : ''}{formatCurrency(pnl)} ({isPositive ? '+' : ''}{formatPercent(pnlPercent, 2)})
          </span>
          <span className="text-slate-500 text-sm">all time</span>
        </div>
      </CardContent>
    </Card>
  )
}
