'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAllocationStore, DEFAULT_ALLOCATION, isValidAllocation, formatAllocation } from '@/lib/store/allocation'

interface TokenSlider {
  id: 'sbtc' | 'ststx' | 'stx'
  label: string
  symbol: string
  color: string
  description: string
}

const TOKENS: TokenSlider[] = [
  {
    id: 'sbtc',
    label: 'sBTC',
    symbol: 'sBTC',
    color: 'bg-orange-500',
    description: 'Bitcoin on Stacks',
  },
  {
    id: 'ststx',
    label: 'stSTX',
    symbol: 'stSTX',
    color: 'bg-violet-500',
    description: 'Staked STX (yield-bearing)',
  },
  {
    id: 'stx',
    label: 'STX',
    symbol: 'STX',
    color: 'bg-blue-500',
    description: 'Native Stacks token',
  },
]

interface AllocationSlidersProps {
  onChange?: (allocation: { sbtc: number; ststx: number; stx: number }) => void
  disabled?: boolean
  showPreview?: boolean
  totalAmount?: number // USDCx amount for preview
}

export function AllocationSliders({
  onChange,
  disabled = false,
  showPreview = true,
  totalAmount = 0,
}: AllocationSlidersProps) {
  const {
    allocation,
    isCustom,
    pendingAllocation,
    setPendingAllocation,
    commitPendingAllocation,
    resetToDefault,
    error,
  } = useAllocationStore()

  // Local state for slider interaction
  const [localAllocation, setLocalAllocation] = useState(allocation)
  const [isDragging, setIsDragging] = useState(false)

  // Sync with store on mount and when allocation changes
  useEffect(() => {
    if (!isDragging) {
      setLocalAllocation(pendingAllocation || allocation)
    }
  }, [allocation, pendingAllocation, isDragging])

  // Handle slider change with auto-balancing
  const handleSliderChange = useCallback(
    (tokenId: 'sbtc' | 'ststx' | 'stx', newValue: number) => {
      if (disabled) return

      setLocalAllocation((prev) => {
        const oldValue = prev[tokenId]
        const diff = newValue - oldValue

        // Get other tokens to balance
        const otherTokens = TOKENS.filter((t) => t.id !== tokenId).map((t) => t.id)

        // Distribute the difference proportionally among other tokens
        const otherTotal = otherTokens.reduce((sum, id) => sum + prev[id], 0)

        let newAllocation = { ...prev, [tokenId]: newValue }

        if (otherTotal > 0) {
          // Distribute proportionally
          let remaining = -diff
          otherTokens.forEach((id, index) => {
            if (index === otherTokens.length - 1) {
              // Last token gets the remainder to ensure exact 100%
              newAllocation[id] = Math.max(0, Math.min(100, 100 - newValue - otherTokens.slice(0, -1).reduce((sum, tid) => sum + newAllocation[tid], 0)))
            } else {
              const proportion = prev[id] / otherTotal
              const adjustment = Math.round(remaining * proportion)
              newAllocation[id] = Math.max(0, Math.min(100, prev[id] + adjustment))
            }
          })
        } else {
          // If other tokens are 0, split equally
          const split = Math.floor((100 - newValue) / 2)
          newAllocation[otherTokens[0]] = split
          newAllocation[otherTokens[1]] = 100 - newValue - split
        }

        // Validate
        const total = newAllocation.sbtc + newAllocation.ststx + newAllocation.stx
        if (total !== 100) {
          // Adjust the largest non-changed token
          const adjustToken = otherTokens.reduce((a, b) =>
            newAllocation[a] > newAllocation[b] ? a : b
          )
          newAllocation[adjustToken] += 100 - total
        }

        return newAllocation
      })
    },
    [disabled]
  )

  // Commit changes when dragging ends
  const handleSliderCommit = useCallback(() => {
    setIsDragging(false)
    if (isValidAllocation(localAllocation)) {
      setPendingAllocation(localAllocation.sbtc, localAllocation.ststx, localAllocation.stx)
      onChange?.(localAllocation)
    }
  }, [localAllocation, setPendingAllocation, onChange])

  // Reset to default
  const handleReset = useCallback(() => {
    setLocalAllocation(DEFAULT_ALLOCATION)
    resetToDefault()
    onChange?.(DEFAULT_ALLOCATION)
  }, [resetToDefault, onChange])

  // Check if current allocation differs from default
  const hasChanges =
    localAllocation.sbtc !== DEFAULT_ALLOCATION.sbtc ||
    localAllocation.ststx !== DEFAULT_ALLOCATION.ststx ||
    localAllocation.stx !== DEFAULT_ALLOCATION.stx

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">
          Index Allocation
        </h3>
        {hasChanges && (
          <button
            onClick={handleReset}
            disabled={disabled}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
          >
            Reset to default
          </button>
        )}
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {TOKENS.map((token) => (
          <div key={token.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${token.color}`} />
                <span className="text-sm font-medium text-white">
                  {token.label}
                </span>
                <span className="text-xs text-slate-500">
                  {token.description}
                </span>
              </div>
              <span className="text-sm font-mono text-white">
                {localAllocation[token.id]}%
              </span>
            </div>

            {/* Slider */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={localAllocation[token.id]}
                onChange={(e) => handleSliderChange(token.id, parseInt(e.target.value))}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={handleSliderCommit}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={handleSliderCommit}
                disabled={disabled}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                         disabled:cursor-not-allowed disabled:opacity-50
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-white
                         [&::-webkit-slider-thumb]:shadow-lg
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:transition-transform
                         [&::-webkit-slider-thumb]:hover:scale-110
                         [&::-moz-range-thumb]:w-4
                         [&::-moz-range-thumb]:h-4
                         [&::-moz-range-thumb]:rounded-full
                         [&::-moz-range-thumb]:bg-white
                         [&::-moz-range-thumb]:border-0
                         [&::-moz-range-thumb]:shadow-lg
                         [&::-moz-range-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${token.color.replace('bg-', 'rgb(var(--')} 0%, ${token.color.replace('bg-', 'rgb(var(--')} ${localAllocation[token.id]}%, rgb(51, 65, 85) ${localAllocation[token.id]}%)`,
                }}
              />
              {/* Track fill */}
              <div
                className={`absolute top-0 left-0 h-2 rounded-lg ${token.color} pointer-events-none`}
                style={{ width: `${localAllocation[token.id]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Visual allocation bar */}
      <div className="mt-4">
        <div className="h-3 rounded-full overflow-hidden flex">
          <div
            className="bg-orange-500 transition-all duration-200"
            style={{ width: `${localAllocation.sbtc}%` }}
          />
          <div
            className="bg-violet-500 transition-all duration-200"
            style={{ width: `${localAllocation.ststx}%` }}
          />
          <div
            className="bg-blue-500 transition-all duration-200"
            style={{ width: `${localAllocation.stx}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-slate-500">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Preview amounts */}
      {showPreview && totalAmount > 0 && (
        <div className="mt-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-400 mb-2">
            Estimated allocation for ${totalAmount.toFixed(2)} USDCx:
          </p>
          <div className="space-y-1">
            {TOKENS.map((token) => {
              const amount = (totalAmount * localAllocation[token.id]) / 100
              return (
                <div key={token.id} className="flex justify-between text-sm">
                  <span className="text-slate-300">{token.symbol}</span>
                  <span className="text-white font-mono">
                    ${amount.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}

      {/* Custom indicator */}
      {hasChanges && (
        <p className="text-xs text-blue-400 mt-2">
          Custom allocation • {formatAllocation(localAllocation)}
        </p>
      )}
    </div>
  )
}

export default AllocationSliders
