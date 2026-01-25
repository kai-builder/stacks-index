'use client'

import { useDepositStore } from '@/lib/store/deposit'
import { Input } from '@/components/ui/Input'

export function AmountInput() {
  const { amount, setAmount, ethBalance } = useDepositStore()

  const numericBalance = parseFloat(ethBalance) || 0
  const numericAmount = parseFloat(amount) || 0
  const hasInsufficientBalance = numericAmount > numericBalance
  const isValidAmount = numericAmount > 0 && !hasInsufficientBalance

  const handleMax = () => {
    setAmount(ethBalance)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow valid numeric input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-400">Amount</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={handleChange}
          className={`
            w-full bg-slate-800/50 border text-white text-2xl font-semibold
            placeholder-slate-600 px-4 py-4 pr-24 rounded-xl outline-none transition-colors
            ${hasInsufficientBalance
              ? 'border-red-500 focus:border-red-500'
              : 'border-slate-700 focus:border-blue-500'
            }
          `}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            onClick={handleMax}
            className="px-2 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition-colors cursor-pointer"
          >
            MAX
          </button>
          <span className="text-slate-400 font-medium">USDC</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">
          Available: {numericBalance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} USDC
        </span>
        {hasInsufficientBalance && (
          <span className="text-red-400">Insufficient balance</span>
        )}
      </div>

      {numericAmount > 0 && (
        <div className="text-sm text-slate-400">
          ≈ ${numericAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} USD
        </div>
      )}
    </div>
  )
}
