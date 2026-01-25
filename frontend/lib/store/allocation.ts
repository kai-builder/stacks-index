import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Allocation {
  sbtc: number   // Percentage 0-100
  ststx: number
  stx: number
}

export interface AllocationState {
  // Current allocation
  allocation: Allocation
  isCustom: boolean

  // Pending changes (before saving to contract)
  pendingAllocation: Allocation | null

  // Loading state
  isLoading: boolean
  isSaving: boolean

  // Error state
  error: string | null

  // Actions
  setAllocation: (sbtc: number, ststx: number, stx: number) => void
  setPendingAllocation: (sbtc: number, ststx: number, stx: number) => void
  clearPendingAllocation: () => void
  commitPendingAllocation: () => void
  resetToDefault: () => void
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setError: (error: string | null) => void
}

// Default allocation percentages
export const DEFAULT_ALLOCATION: Allocation = {
  sbtc: 40,
  ststx: 30,
  stx: 30,
}

// Validate allocation sums to 100
export function isValidAllocation(allocation: Allocation): boolean {
  const total = allocation.sbtc + allocation.ststx + allocation.stx
  return (
    total === 100 &&
    allocation.sbtc >= 0 &&
    allocation.sbtc <= 100 &&
    allocation.ststx >= 0 &&
    allocation.ststx <= 100 &&
    allocation.stx >= 0 &&
    allocation.stx <= 100
  )
}

// Convert percentage to basis points
export function toBasisPoints(percentage: number): number {
  return Math.round(percentage * 100)
}

// Convert basis points to percentage
export function fromBasisPoints(basisPoints: number): number {
  return basisPoints / 100
}

const initialState = {
  allocation: DEFAULT_ALLOCATION,
  isCustom: false,
  pendingAllocation: null,
  isLoading: false,
  isSaving: false,
  error: null,
}

export const useAllocationStore = create<AllocationState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAllocation: (sbtc, ststx, stx) => {
        const newAllocation = { sbtc, ststx, stx }
        if (!isValidAllocation(newAllocation)) {
          set({ error: 'Allocation must sum to 100%' })
          return
        }

        const isDefault =
          sbtc === DEFAULT_ALLOCATION.sbtc &&
          ststx === DEFAULT_ALLOCATION.ststx &&
          stx === DEFAULT_ALLOCATION.stx

        set({
          allocation: newAllocation,
          isCustom: !isDefault,
          error: null,
        })
      },

      setPendingAllocation: (sbtc, ststx, stx) => {
        const newAllocation = { sbtc, ststx, stx }
        if (!isValidAllocation(newAllocation)) {
          set({ error: 'Allocation must sum to 100%' })
          return
        }
        set({ pendingAllocation: newAllocation, error: null })
      },

      clearPendingAllocation: () => set({ pendingAllocation: null }),

      commitPendingAllocation: () => {
        const { pendingAllocation } = get()
        if (pendingAllocation && isValidAllocation(pendingAllocation)) {
          const isDefault =
            pendingAllocation.sbtc === DEFAULT_ALLOCATION.sbtc &&
            pendingAllocation.ststx === DEFAULT_ALLOCATION.ststx &&
            pendingAllocation.stx === DEFAULT_ALLOCATION.stx

          set({
            allocation: pendingAllocation,
            isCustom: !isDefault,
            pendingAllocation: null,
            error: null,
          })
        }
      },

      resetToDefault: () =>
        set({
          allocation: DEFAULT_ALLOCATION,
          isCustom: false,
          pendingAllocation: null,
          error: null,
        }),

      setLoading: (loading) => set({ isLoading: loading }),
      setSaving: (saving) => set({ isSaving: saving }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'stacks-index-allocation',
      partialize: (state) => ({
        allocation: state.allocation,
        isCustom: state.isCustom,
      }),
    }
  )
)

// Helper to calculate allocation amounts from total USDCx
export function calculateAllocationAmounts(
  totalUsdcx: number,
  allocation: Allocation
): { sbtc: number; ststx: number; stx: number } {
  return {
    sbtc: Math.floor((totalUsdcx * allocation.sbtc) / 100),
    ststx: Math.floor((totalUsdcx * allocation.ststx) / 100),
    stx: Math.floor((totalUsdcx * allocation.stx) / 100),
  }
}

// Format allocation for display
export function formatAllocation(allocation: Allocation): string {
  return `${allocation.sbtc}% sBTC / ${allocation.ststx}% stSTX / ${allocation.stx}% STX`
}
