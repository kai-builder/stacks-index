'use client'

interface SlippageSelectorProps {
  value: number
  onChange: (value: number) => void
  options?: number[]
}

const defaultOptions = [0.5, 1, 3]

export function SlippageSelector({
  value,
  onChange,
  options = defaultOptions,
}: SlippageSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-400">
        Slippage Tolerance
      </label>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`
              px-4 py-2 rounded-lg transition-colors cursor-pointer
              ${value === option
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
              }
            `}
          >
            {option}%
          </button>
        ))}
      </div>
    </div>
  )
}
