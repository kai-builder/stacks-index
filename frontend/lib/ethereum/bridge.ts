import { getTransaction, getTransactionReceipt } from '@wagmi/core'
import { wagmiConfig } from './config'

export type BridgeStatus =
  | 'pending'
  | 'eth_confirming'
  | 'eth_confirmed'
  | 'attesting'
  | 'minting'
  | 'completed'
  | 'failed'

export interface BridgeTransaction {
  id: string
  status: BridgeStatus
  amount: string
  ethTxHash: `0x${string}` | null
  stacksTxHash: string | null
  stacksAddress: string
  startTime: number
  lastUpdate: number
  error?: string
}

const STORAGE_KEY = 'stacks-index:bridge-transactions'

// Get all pending bridge transactions
export function getPendingBridges(): BridgeTransaction[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save bridge transaction
export function saveBridgeTransaction(tx: BridgeTransaction): void {
  if (typeof window === 'undefined') return
  const transactions = getPendingBridges()
  const existingIndex = transactions.findIndex(t => t.id === tx.id)

  if (existingIndex >= 0) {
    transactions[existingIndex] = tx
  } else {
    transactions.push(tx)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
}

// Update bridge transaction status
export function updateBridgeStatus(
  id: string,
  status: BridgeStatus,
  updates?: Partial<BridgeTransaction>
): void {
  const transactions = getPendingBridges()
  const tx = transactions.find(t => t.id === id)

  if (tx) {
    tx.status = status
    tx.lastUpdate = Date.now()
    if (updates) {
      Object.assign(tx, updates)
    }
    saveBridgeTransaction(tx)
  }
}

// Remove completed bridge transaction
export function removeBridgeTransaction(id: string): void {
  if (typeof window === 'undefined') return
  const transactions = getPendingBridges().filter(t => t.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
}

// Create new bridge transaction
export function createBridgeTransaction(
  amount: string,
  stacksAddress: string
): BridgeTransaction {
  const tx: BridgeTransaction = {
    id: `bridge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    amount,
    ethTxHash: null,
    stacksTxHash: null,
    stacksAddress,
    startTime: Date.now(),
    lastUpdate: Date.now(),
  }

  saveBridgeTransaction(tx)
  return tx
}

// Check Ethereum transaction status
export async function checkEthTransactionStatus(
  hash: `0x${string}`
): Promise<'pending' | 'confirmed' | 'failed'> {
  try {
    const receipt = await getTransactionReceipt(wagmiConfig, { hash })

    if (receipt) {
      return receipt.status === 'success' ? 'confirmed' : 'failed'
    }
    return 'pending'
  } catch {
    return 'pending'
  }
}

// Simulated attestation check (in production, poll Circle's API)
export async function checkAttestationStatus(
  ethTxHash: string
): Promise<'pending' | 'attested' | 'failed'> {
  // In production, this would poll Circle's attestation service
  // For now, simulate with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate 80% success rate after some time
      resolve(Math.random() > 0.2 ? 'attested' : 'pending')
    }, 2000)
  })
}

// Simulated Stacks mint check (in production, check Stacks blockchain)
export async function checkStacksMintStatus(
  stacksAddress: string,
  expectedAmount: string
): Promise<{ status: 'pending' | 'minted' | 'failed'; txHash?: string }> {
  // In production, this would check the Stacks blockchain for mint events
  // For now, simulate
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 'minted',
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
      })
    }, 2000)
  })
}

// Monitor bridge transaction progress
export async function monitorBridgeTransaction(
  id: string,
  onStatusChange: (status: BridgeStatus) => void
): Promise<void> {
  const transactions = getPendingBridges()
  const tx = transactions.find(t => t.id === id)

  if (!tx) {
    throw new Error('Bridge transaction not found')
  }

  // Step 1: Check ETH transaction confirmation
  if (tx.ethTxHash && tx.status === 'eth_confirming') {
    const ethStatus = await checkEthTransactionStatus(tx.ethTxHash)

    if (ethStatus === 'confirmed') {
      updateBridgeStatus(id, 'attesting')
      onStatusChange('attesting')
    } else if (ethStatus === 'failed') {
      updateBridgeStatus(id, 'failed', { error: 'Ethereum transaction failed' })
      onStatusChange('failed')
      return
    }
  }

  // Step 2: Check attestation status
  if (tx.status === 'attesting' && tx.ethTxHash) {
    const attestStatus = await checkAttestationStatus(tx.ethTxHash)

    if (attestStatus === 'attested') {
      updateBridgeStatus(id, 'minting')
      onStatusChange('minting')
    } else if (attestStatus === 'failed') {
      updateBridgeStatus(id, 'failed', { error: 'Attestation failed' })
      onStatusChange('failed')
      return
    }
  }

  // Step 3: Check Stacks mint status
  if (tx.status === 'minting') {
    const mintResult = await checkStacksMintStatus(tx.stacksAddress, tx.amount)

    if (mintResult.status === 'minted') {
      updateBridgeStatus(id, 'completed', { stacksTxHash: mintResult.txHash })
      onStatusChange('completed')
    } else if (mintResult.status === 'failed') {
      updateBridgeStatus(id, 'failed', { error: 'Minting failed on Stacks' })
      onStatusChange('failed')
    }
  }
}

// Get estimated bridge time
export function getEstimatedBridgeTime(): string {
  return '~15 minutes'
}

// Get bridge fee (this would come from the contract in production)
export function getBridgeFee(): string {
  return '0.50' // $0.50 estimated fee
}
