'use client'

import Image from 'next/image'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { TOKENS, getTokenBySymbol } from '@/lib/stacks/tokens'
import { formatCurrency, formatNumber } from '@/lib/utils/format'

interface AssetRowProps {
  symbol: string
  amount: number
  value: number
  price: number
  change24h: number
}

export function AssetRow({ symbol, amount, value, price, change24h }: AssetRowProps) {
  const token = getTokenBySymbol(symbol) || TOKENS[symbol]
  const isPositive = change24h >= 0

  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-800 last:border-0">
      <div className="flex items-center gap-3">
        {token?.imageUrl ? (
          <Image
            src={token.imageUrl}
            alt={symbol}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${token?.color}20` }}
          >
            <span className="text-sm font-bold" style={{ color: token?.color }}>
              {symbol.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <p className="font-medium text-white">{symbol}</p>
          <p className="text-sm text-slate-400">
            {formatNumber(amount, token?.decimals === 8 ? 8 : 4)} @ {price < 0.01 ? `$${price.toFixed(8)}` : formatCurrency(price, symbol === 'sBTC' ? 0 : 2)}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-medium text-white">{formatCurrency(value)}</p>
        <div className={`flex items-center justify-end gap-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{isPositive ? '+' : ''}{change24h.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  )
}
