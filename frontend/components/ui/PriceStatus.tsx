'use client'

import { RefreshCw } from 'lucide-react'

interface PriceStatusProps {
  lastUpdated: number | null
  isRefreshing?: boolean
  onRefresh?: () => void
}

export function PriceStatus({ lastUpdated, isRefreshing, onRefresh }: PriceStatusProps) {
  const getStatus = () => {
    if (!lastUpdated) return { state: 'stale', text: 'No price data' }

    const secondsAgo = Math.floor((Date.now() - lastUpdated) / 1000)

    if (secondsAgo < 30) {
      return { state: 'fresh', text: `Updated ${secondsAgo}s ago` }
    } else if (secondsAgo < 60) {
      return { state: 'aging', text: 'Refreshing...' }
    } else {
      return { state: 'stale', text: 'Prices stale' }
    }
  }

  const { state, text } = getStatus()

  const dotColors = {
    fresh: 'bg-green-500',
    aging: 'bg-amber-500 animate-pulse',
    stale: 'bg-red-500',
  }

  const textColors = {
    fresh: 'text-slate-400',
    aging: 'text-amber-400',
    stale: 'text-red-400',
  }

  return (
    <span className={`flex items-center gap-2 text-sm ${textColors[state as keyof typeof textColors]}`}>
      <span className={`w-2 h-2 rounded-full ${dotColors[state as keyof typeof dotColors]}`} />
      {text}
      {state === 'stale' && onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="text-blue-400 hover:text-blue-300 cursor-pointer disabled:opacity-50"
          aria-label="Refresh prices"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </span>
  )
}
