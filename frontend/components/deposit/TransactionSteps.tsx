'use client'

import { CheckCircle, Circle, Loader2, XCircle, ExternalLink, Zap, Clock } from 'lucide-react'
import { useDepositStore, DepositStep, isStepCompleted, isStepActive } from '@/lib/store/deposit'

interface Step {
  id: DepositStep
  label: string
  description: string
  estimatedTime?: string
}

const STEPS: Step[] = [
  {
    id: 'approve',
    label: 'Approve USDC',
    description: 'Allow xReserve to access your USDC',
    estimatedTime: '~10 seconds',
  },
  {
    id: 'deposit',
    label: 'Deposit',
    description: 'Send USDC to xReserve contract',
    estimatedTime: '~30 seconds',
  },
  {
    id: 'attesting',
    label: 'Bridge Processing',
    description: 'Circle verifying deposit...',
    estimatedTime: '~15 minutes',
  },
  {
    id: 'minting',
    label: 'Mint USDCx',
    description: 'Receiving USDCx on Stacks',
    estimatedTime: '~2 minutes',
  },
  {
    id: 'investing',
    label: 'Auto-invest',
    description: 'Swapping into index tokens',
    estimatedTime: '~1 minute',
  },
]

// 1-Click flow steps (when using relayer)
const ONE_CLICK_STEPS: Step[] = [
  {
    id: 'approve',
    label: 'Approve USDC',
    description: 'Allow xReserve to access your USDC',
    estimatedTime: '~10 seconds',
  },
  {
    id: 'deposit',
    label: 'Deposit to Bridge',
    description: 'Send USDC to xReserve contract',
    estimatedTime: '~30 seconds',
  },
  {
    id: 'attesting',
    label: 'Bridge & Auto-Invest',
    description: 'Relayer will handle investment when bridge completes',
    estimatedTime: '~15-20 minutes',
  },
]

interface TransactionStepsProps {
  oneClickMode?: boolean
}

export function TransactionSteps({ oneClickMode = false }: TransactionStepsProps) {
  const {
    currentStep,
    approveTxHash,
    depositTxHash,
    bridgeTransaction,
    investTxHashes,
    autoInvest,
    error,
  } = useDepositStore()

  // Use different steps for 1-click mode
  const baseSteps = oneClickMode ? ONE_CLICK_STEPS : STEPS

  // Filter out investing step if auto-invest is disabled (only in standard mode)
  const visibleSteps = oneClickMode
    ? baseSteps
    : autoInvest
    ? baseSteps
    : baseSteps.filter((s) => s.id !== 'investing')

  const getTxHash = (stepId: DepositStep): string | null => {
    switch (stepId) {
      case 'approve':
        return approveTxHash
      case 'deposit':
        return depositTxHash
      case 'minting':
        return bridgeTransaction?.stacksTxHash || null
      case 'investing':
        return investTxHashes[0] || null
      default:
        return null
    }
  }

  const getExplorerUrl = (stepId: DepositStep, hash: string): string => {
    if (stepId === 'minting' || stepId === 'investing') {
      return `https://explorer.stacks.co/txid/${hash}`
    }
    return `https://etherscan.io/tx/${hash}`
  }

  return (
    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
      <h3 className="text-lg font-semibold text-white mb-6">Transaction Progress</h3>

      <div className="space-y-4">
        {visibleSteps.map((step, index) => {
          const isCompleted = isStepCompleted(currentStep, step.id)
          const isActive = isStepActive(currentStep, step.id)
          const isFailed = currentStep === 'error' && isActive
          const txHash = getTxHash(step.id)

          return (
            <div key={step.id} className="relative">
              {/* Connector line */}
              {index < visibleSteps.length - 1 && (
                <div
                  className={`absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-8px)] ${
                    isCompleted ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                />
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="relative z-10">
                  {isCompleted ? (
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ) : isActive && !isFailed ? (
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    </div>
                  ) : isFailed ? (
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                      <Circle className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`font-medium ${
                        isCompleted
                          ? 'text-green-400'
                          : isActive
                          ? 'text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </h4>
                    {isActive && !isFailed && (
                      <span className="text-xs text-blue-400 animate-pulse">
                        Processing...
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>

                  {/* Transaction hash link */}
                  {txHash && (
                    <a
                      href={getExplorerUrl(step.id, txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      View transaction
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {/* Error message */}
                  {isFailed && error && (
                    <p className="text-sm text-red-400 mt-2">{error}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info message */}
      {oneClickMode ? (
        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">1-Click Auto-Invest Active</span>
          </div>
          <p className="text-xs text-slate-400">
            You can safely close this window. Our relayer will automatically invest your funds
            when the bridge completes (~15 minutes). Check your portfolio later to see your holdings.
          </p>
        </div>
      ) : (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-400">
            Do not close this window. Your transaction will continue processing even if you navigate away.
          </p>
        </div>
      )}

      {/* Estimated time */}
      {currentStep !== 'success' && currentStep !== 'error' && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>
            Total estimated time: {oneClickMode ? '~15-20 minutes (auto)' : '~20 minutes'}
          </span>
        </div>
      )}
    </div>
  )
}
