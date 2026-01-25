import { create } from 'zustand'
import { WithdrawalStatus, PendingWithdrawal } from '@/lib/stacks/withdraw'

export type WithdrawStep =
  | 'input' // Enter amount and ETH address
  | 'review' // Review withdrawal details
  | 'signing' // Awaiting wallet signature
  | 'broadcasting' // Broadcasting to network
  | 'pending' // Transaction submitted, waiting for confirmation
  | 'confirming' // Transaction being confirmed on Stacks
  | 'processing' // Circle processing withdrawal to Ethereum
  | 'success' // Withdrawal complete
  | 'error' // Error occurred

export interface WithdrawState {
  // Input state
  amount: string
  ethRecipient: string
  usdcxBalance: string

  // Transaction state
  currentStep: WithdrawStep
  txId: string | null
  withdrawalId: string | null

  // Timing
  startTime: number | null

  // Error state
  error: string | null

  // Actions
  setAmount: (amount: string) => void
  setEthRecipient: (address: string) => void
  setUsdcxBalance: (balance: string) => void
  setStep: (step: WithdrawStep) => void
  setTxId: (txId: string | null) => void
  setWithdrawalId: (id: string | null) => void
  setStartTime: (time: number | null) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  amount: '',
  ethRecipient: '',
  usdcxBalance: '0',
  currentStep: 'input' as WithdrawStep,
  txId: null,
  withdrawalId: null,
  startTime: null,
  error: null,
}

export const useWithdrawStore = create<WithdrawState>((set) => ({
  ...initialState,

  setAmount: (amount) => set({ amount }),
  setEthRecipient: (address) => set({ ethRecipient: address }),
  setUsdcxBalance: (balance) => set({ usdcxBalance: balance }),
  setStep: (step) => set({ currentStep: step }),
  setTxId: (txId) => set({ txId }),
  setWithdrawalId: (id) => set({ withdrawalId: id }),
  setStartTime: (time) => set({ startTime: time }),
  setError: (error) => set({ error, currentStep: error ? 'error' : 'input' }),
  reset: () => set(initialState),
}))

// Helper to check if step is completed
export function isWithdrawStepCompleted(
  currentStep: WithdrawStep,
  checkStep: WithdrawStep
): boolean {
  const steps: WithdrawStep[] = [
    'input',
    'review',
    'signing',
    'broadcasting',
    'pending',
    'confirming',
    'processing',
    'success',
  ]
  return steps.indexOf(currentStep) > steps.indexOf(checkStep)
}

// Helper to check if step is active
export function isWithdrawStepActive(
  currentStep: WithdrawStep,
  checkStep: WithdrawStep
): boolean {
  return currentStep === checkStep
}

// Get step label for UI
export function getWithdrawStepLabel(step: WithdrawStep): string {
  const labels: Record<WithdrawStep, string> = {
    input: 'Enter Details',
    review: 'Review',
    signing: 'Sign Transaction',
    broadcasting: 'Broadcasting',
    pending: 'Submitted',
    confirming: 'Confirming',
    processing: 'Processing',
    success: 'Complete',
    error: 'Error',
  }
  return labels[step]
}

// Get step description for UI
export function getWithdrawStepDescription(step: WithdrawStep): string {
  const descriptions: Record<WithdrawStep, string> = {
    input: 'Enter the amount and Ethereum address',
    review: 'Confirm your withdrawal details',
    signing: 'Sign the transaction in your wallet',
    broadcasting: 'Sending transaction to the network',
    pending: 'Waiting for transaction to be mined',
    confirming: 'Transaction being confirmed on Stacks',
    processing: 'Circle is processing your withdrawal',
    success: 'USDC sent to your Ethereum wallet',
    error: 'An error occurred',
  }
  return descriptions[step]
}
