import { create } from 'zustand'
import { BridgeTransaction, BridgeStatus } from '@/lib/ethereum/bridge'

export type DepositStep =
  | 'input'
  | 'review'
  | 'approve'
  | 'deposit'
  | 'attesting'
  | 'minting'
  | 'investing'
  | 'success'
  | 'error'

export interface DepositState {
  // Input state
  amount: string
  slippage: number
  autoInvest: boolean

  // Wallet state
  ethAddress: string | null
  ethBalance: string
  stacksAddress: string | null
  usdcxBalance: string

  // Transaction state
  currentStep: DepositStep
  bridgeTransaction: BridgeTransaction | null
  approveTxHash: string | null
  depositTxHash: string | null
  investTxHashes: string[]

  // Error state
  error: string | null

  // Actions
  setAmount: (amount: string) => void
  setSlippage: (slippage: number) => void
  setAutoInvest: (autoInvest: boolean) => void
  setEthWallet: (address: string | null, balance: string) => void
  setStacksWallet: (address: string | null, balance: string) => void
  setStep: (step: DepositStep) => void
  setBridgeTransaction: (tx: BridgeTransaction | null) => void
  setApproveTxHash: (hash: string | null) => void
  setDepositTxHash: (hash: string | null) => void
  addInvestTxHash: (hash: string) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  amount: '',
  slippage: 1,
  autoInvest: true,
  ethAddress: null,
  ethBalance: '0',
  stacksAddress: null,
  usdcxBalance: '0',
  currentStep: 'input' as DepositStep,
  bridgeTransaction: null,
  approveTxHash: null,
  depositTxHash: null,
  investTxHashes: [],
  error: null,
}

export const useDepositStore = create<DepositState>((set) => ({
  ...initialState,

  setAmount: (amount) => set({ amount }),
  setSlippage: (slippage) => set({ slippage }),
  setAutoInvest: (autoInvest) => set({ autoInvest }),

  setEthWallet: (address, balance) =>
    set({ ethAddress: address, ethBalance: balance }),

  setStacksWallet: (address, balance) =>
    set({ stacksAddress: address, usdcxBalance: balance }),

  setStep: (step) => set({ currentStep: step }),

  setBridgeTransaction: (tx) => set({ bridgeTransaction: tx }),

  setApproveTxHash: (hash) => set({ approveTxHash: hash }),
  setDepositTxHash: (hash) => set({ depositTxHash: hash }),

  addInvestTxHash: (hash) =>
    set((state) => ({ investTxHashes: [...state.investTxHashes, hash] })),

  setError: (error) => set({ error, currentStep: error ? 'error' : 'input' }),

  reset: () => set(initialState),
}))

// Helper to get step progress
export function getStepProgress(step: DepositStep): number {
  const steps: DepositStep[] = [
    'input',
    'review',
    'approve',
    'deposit',
    'attesting',
    'minting',
    'investing',
    'success',
  ]
  const index = steps.indexOf(step)
  return index >= 0 ? (index / (steps.length - 1)) * 100 : 0
}

// Helper to check if step is completed
export function isStepCompleted(
  currentStep: DepositStep,
  checkStep: DepositStep
): boolean {
  const steps: DepositStep[] = [
    'input',
    'review',
    'approve',
    'deposit',
    'attesting',
    'minting',
    'investing',
    'success',
  ]
  return steps.indexOf(currentStep) > steps.indexOf(checkStep)
}

// Helper to check if step is active
export function isStepActive(
  currentStep: DepositStep,
  checkStep: DepositStep
): boolean {
  return currentStep === checkStep
}
