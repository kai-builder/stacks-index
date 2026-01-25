const STORAGE_PREFIX = 'stacks-index:'

export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue

  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_PREFIX + key)
  } catch (error) {
    console.error('Failed to remove from localStorage:', error)
  }
}

export interface StoredPosition {
  address: string
  deposits: {
    timestamp: number
    usdcxAmount: number
    txId: string
  }[]
  holdings: {
    sBTC: number
    stSTX: number
    STX: number
  }
}

export function getStoredPositions(): StoredPosition[] {
  return getStorageItem<StoredPosition[]>('positions', [])
}

export function savePosition(position: StoredPosition): void {
  const positions = getStoredPositions()
  const existingIndex = positions.findIndex(p => p.address === position.address)

  if (existingIndex >= 0) {
    positions[existingIndex] = position
  } else {
    positions.push(position)
  }

  setStorageItem('positions', positions)
}

export function getPositionByAddress(address: string): StoredPosition | null {
  const positions = getStoredPositions()
  return positions.find(p => p.address === address) || null
}
