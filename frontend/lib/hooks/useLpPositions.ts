import { useState, useCallback } from "react"

export interface LpPosition {
  poolContract: string
  poolName: string
  lpTokenBalance: number
  xTokenSymbol: string
  yTokenSymbol: string
  lastXAmount: number
  lastYAmount: number
  lastTxId: string
}

export interface LpPositionsState {
  positions: LpPosition[]
  isLoading: boolean
  error: string | null
}

export function useLpPositions() {
  const [state, setState] = useState<LpPositionsState>({
    positions: [],
    isLoading: false,
    error: null,
  })

  const fetchPositions = useCallback(async (address: string) => {
    if (!address) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/lp-positions?address=${address}`)

      if (!response.ok) {
        throw new Error("Failed to fetch LP positions")
      }

      const data = await response.json()

      setState({
        positions: data.positions || [],
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error("Failed to fetch LP positions:", error)
      setState({
        positions: [],
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch LP positions",
      })
    }
  }, [])

  return {
    ...state,
    fetchPositions,
  }
}
