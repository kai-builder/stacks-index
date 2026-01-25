/**
 * USDCx Withdrawal Flow
 *
 * Handles burning USDCx on Stacks to receive USDC on Ethereum.
 * Uses @stacks/connect for wallet signing via Leather/Xverse.
 *
 * Flow:
 * 1. User enters amount and Ethereum recipient address
 * 2. Validate withdrawal parameters (balance, min amount, protocol status)
 * 3. Sign burn transaction via wallet popup
 * 4. Broadcast transaction to Stacks network
 * 5. Monitor for transaction confirmation
 * 6. Circle processes withdrawal (15-30 min typical)
 * 7. USDC arrives on Ethereum
 */

import { openContractCall, type FinishedTxData } from '@stacks/connect'
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  Pc,
  type ClarityValue,
} from '@stacks/transactions'
import {
  buildBurnTxArgs,
  validateWithdrawal,
  getUsdcxBalance,
  toMicroUsdcx,
  getContracts,
  USDCX_CONTRACTS,
} from './usdcx'
import { getTransaction } from '@/lib/api/hiro'

export interface WithdrawalParams {
  amount: string // Human-readable amount (e.g., "100.50")
  stacksAddress: string // User's Stacks address (sender)
  ethRecipient: string // Ethereum address to receive USDC
  isMainnet?: boolean
  onStatusChange?: (status: WithdrawalStatus) => void
}

export type WithdrawalStatus =
  | 'validating'
  | 'awaiting_signature'
  | 'broadcasting'
  | 'pending'
  | 'confirmed'
  | 'failed'

export interface WithdrawalResult {
  success: boolean
  txId?: string
  error?: string
  status: WithdrawalStatus
}

/**
 * Execute USDCx withdrawal (burn) via wallet popup
 *
 * This opens the Leather/Xverse wallet popup for the user to sign the transaction.
 */
export async function executeWithdrawal(
  params: WithdrawalParams
): Promise<WithdrawalResult> {
  const {
    amount,
    stacksAddress,
    ethRecipient,
    isMainnet = true,
    onStatusChange,
  } = params

  // Step 1: Validate parameters
  onStatusChange?.('validating')

  const validation = await validateWithdrawal(
    amount,
    stacksAddress,
    ethRecipient,
    isMainnet
  )

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      status: 'failed',
    }
  }

  // Step 2: Build transaction arguments
  const txArgs = buildBurnTxArgs(amount, ethRecipient, isMainnet)

  // Step 3: Build post-conditions for safety
  const contracts = getContracts(isMainnet)
  const microAmount = toMicroUsdcx(amount)

  // Post-condition: User will send exactly the burn amount of USDCx
  const postConditions = [
    Pc.principal(stacksAddress)
      .willSendEq(microAmount)
      .ft(
        `${contracts.token.address}.${contracts.token.name}` as `${string}.${string}`,
        'usdcx-token'
      ),
  ]

  // Step 4: Request signature via wallet popup
  onStatusChange?.('awaiting_signature')

  return new Promise((resolve) => {
    openContractCall({
      contractAddress: txArgs.contractAddress,
      contractName: txArgs.contractName,
      functionName: txArgs.functionName,
      functionArgs: txArgs.functionArgs,
      postConditions,
      postConditionMode: PostConditionMode.Deny, // Strict: only allow expected transfers
      network: isMainnet ? 'mainnet' : 'testnet',
      anchorMode: AnchorMode.Any,
      onFinish: (data: FinishedTxData) => {
        onStatusChange?.('pending')
        resolve({
          success: true,
          txId: data.txId,
          status: 'pending',
        })
      },
      onCancel: () => {
        resolve({
          success: false,
          error: 'Transaction cancelled by user',
          status: 'failed',
        })
      },
    })
  })
}

/**
 * Get estimated withdrawal time
 */
export function getEstimatedWithdrawalTime(): string {
  return '15-30 minutes'
}

/**
 * Get withdrawal fee (Circle charges no fee, only network gas)
 */
export function getWithdrawalFee(): {
  stacksFee: string
  ethereumFee: string
  total: string
} {
  return {
    stacksFee: '~0.01 STX', // Typical Stacks transaction fee
    ethereumFee: 'None (paid by Circle)', // Circle covers Ethereum gas
    total: '~0.01 STX',
  }
}

/**
 * Monitor withdrawal transaction status
 */
export async function monitorWithdrawalTx(
  txId: string,
  isMainnet: boolean = true,
  onStatusChange?: (status: 'pending' | 'confirmed' | 'failed') => void
): Promise<{ confirmed: boolean; error?: string }> {
  const maxAttempts = 60 // 5 minutes with 5 second intervals
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const data = await getTransaction(txId, {
        network: isMainnet ? 'mainnet' : 'testnet',
      })

      if (data.tx_status === 'success') {
        onStatusChange?.('confirmed')
        return { confirmed: true }
      }

      if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        onStatusChange?.('failed')
        return {
          confirmed: false,
          error: `Transaction failed: ${data.tx_status}`,
        }
      }

      // Still pending, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 5000))
      attempts++
    } catch (error) {
      // Network error, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 5000))
      attempts++
    }
  }

  return { confirmed: false, error: 'Transaction monitoring timed out' }
}

/**
 * Build withdrawal preview data for UI
 */
export async function buildWithdrawalPreview(
  amount: string,
  stacksAddress: string,
  ethRecipient: string,
  isMainnet: boolean = true
): Promise<{
  valid: boolean
  error?: string
  preview?: {
    amount: string
    amountMicro: string
    recipient: string
    recipientFormatted: string
    stacksFee: string
    estimatedTime: string
    currentBalance: string
    remainingBalance: string
  }
}> {
  // Validate
  const validation = await validateWithdrawal(
    amount,
    stacksAddress,
    ethRecipient,
    isMainnet
  )

  if (!validation.valid) {
    return { valid: false, error: validation.error }
  }

  // Get current balance
  const { balance, formatted: currentBalance } = await getUsdcxBalance(
    stacksAddress,
    isMainnet
  )

  const microAmount = toMicroUsdcx(amount)
  const remainingMicro = balance - microAmount
  const remainingBalance = (Number(remainingMicro) / 1e6).toFixed(2)

  return {
    valid: true,
    preview: {
      amount,
      amountMicro: microAmount.toString(),
      recipient: ethRecipient,
      recipientFormatted: `${ethRecipient.slice(0, 6)}...${ethRecipient.slice(-4)}`,
      stacksFee: '~0.01 STX',
      estimatedTime: getEstimatedWithdrawalTime(),
      currentBalance,
      remainingBalance,
    },
  }
}

/**
 * Storage key for pending withdrawals
 */
const PENDING_WITHDRAWALS_KEY = 'stacks-index:pending-withdrawals'

export interface PendingWithdrawal {
  id: string
  txId: string
  amount: string
  ethRecipient: string
  stacksAddress: string
  startTime: number
  status: 'pending' | 'confirmed' | 'failed'
}

/**
 * Save pending withdrawal to localStorage
 */
export function savePendingWithdrawal(withdrawal: Omit<PendingWithdrawal, 'id'>): string {
  const id = `withdrawal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  if (typeof window === 'undefined') return id

  try {
    const existing = getPendingWithdrawals()
    existing.push({ ...withdrawal, id })
    localStorage.setItem(PENDING_WITHDRAWALS_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Error saving pending withdrawal:', error)
  }

  return id
}

/**
 * Get all pending withdrawals
 */
export function getPendingWithdrawals(): PendingWithdrawal[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(PENDING_WITHDRAWALS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Update withdrawal status
 */
export function updateWithdrawalStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'failed'
): void {
  if (typeof window === 'undefined') return

  try {
    const withdrawals = getPendingWithdrawals()
    const index = withdrawals.findIndex((w) => w.id === id)
    if (index >= 0) {
      withdrawals[index].status = status
      localStorage.setItem(PENDING_WITHDRAWALS_KEY, JSON.stringify(withdrawals))
    }
  } catch (error) {
    console.error('Error updating withdrawal status:', error)
  }
}

/**
 * Remove completed withdrawal from storage
 */
export function removeWithdrawal(id: string): void {
  if (typeof window === 'undefined') return

  try {
    const withdrawals = getPendingWithdrawals().filter((w) => w.id !== id)
    localStorage.setItem(PENDING_WITHDRAWALS_KEY, JSON.stringify(withdrawals))
  } catch (error) {
    console.error('Error removing withdrawal:', error)
  }
}
