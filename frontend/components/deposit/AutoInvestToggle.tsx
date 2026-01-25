'use client'

import { useDepositStore } from '@/lib/store/deposit'
import { SlippageSelector } from '@/components/ui/SlippageSelector'
import { INDEX_ALLOCATION, TOKENS } from '@/lib/stacks/tokens'

const ALLOCATION_DISPLAY = [
  { symbol: 'sBTC', percentage: 40, color: '#F7931A' },
  { symbol: 'stSTX', percentage: 40, color: '#5546FF' },
  { symbol: 'STX', percentage: 20, color: '#9B59B6' },
]

export function AutoInvestToggle() {
  const { amount, autoInvest, setAutoInvest, slippage, setSlippage } = useDepositStore()
  const numericAmount = parseFloat(amount) || 0

  return (
    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
      {/* Toggle header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-white">Auto-invest into Index</h3>
          <p className="text-sm text-slate-500">
            Automatically swap USDCx into diversified tokens
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={autoInvest}
            onChange={(e) => setAutoInvest(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500" />
        </label>
      </div>

      {autoInvest && (
        <div className="space-y-4">
          {/* Allocation bar */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Allocation</p>
            <div className="h-3 rounded-full overflow-hidden flex">
              {ALLOCATION_DISPLAY.map((item, index) => (
                <div
                  key={item.symbol}
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                    marginLeft: index > 0 ? '2px' : 0,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Allocation breakdown */}
          <div className="grid grid-cols-3 gap-3">
            {ALLOCATION_DISPLAY.map((item) => {
              const tokenAmount = (numericAmount * item.percentage) / 100
              return (
                <div
                  key={item.symbol}
                  className="p-3 rounded-xl bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-white">
                      {item.symbol}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {item.percentage}%
                  </p>
                  {numericAmount > 0 && (
                    <p className="text-xs text-slate-500">
                      ~${tokenAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Slippage selector */}
          <div className="pt-2">
            <SlippageSelector value={slippage} onChange={setSlippage} />
          </div>
        </div>
      )}

      {!autoInvest && (
        <p className="text-sm text-slate-400">
          USDCx will be deposited directly to your Stacks wallet.
        </p>
      )}
    </div>
  )
}
