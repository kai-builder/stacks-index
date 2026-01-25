'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowDownToLine, Wallet, ArrowLeft, Zap, Clock, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { useWalletStore } from '@/lib/store/wallet'
import { useDepositStore } from '@/lib/store/deposit'
import { useAllocationStore, DEFAULT_ALLOCATION, isValidAllocation } from '@/lib/store/allocation'
import { AllocationSliders } from './AllocationSliders'
import { AmountInput } from './AmountInput'
import { DualWalletConnect } from './DualWalletConnect'
import { BridgePreview } from './BridgePreview'
import { TransactionSteps } from './TransactionSteps'
import { DepositSuccess } from './DepositSuccess'
import {
  setUserAllocation as setContractAllocation,
  depositUsdcx,
} from '@/lib/stacks/vault'

// Ethereum wallet hooks
import { useAccount } from 'wagmi'

export type OneClickStep =
  | 'connect'
  | 'configure'
  | 'review'
  | 'set_allocation'
  | 'approve'
  | 'deposit'
  | 'register_relayer'
  | 'waiting_bridge'
  | 'auto_invest'
  | 'success'
  | 'error'

interface OneClickDepositProps {
  onComplete?: () => void
}

export function OneClickDeposit({ onComplete }: OneClickDepositProps) {
  const { isConnected: isStacksConnected, address: stacksAddress } = useWalletStore()
  const {
    amount,
    autoInvest,
    setStep: setDepositStep,
    setError,
    error,
  } = useDepositStore()
  const {
    allocation,
    isCustom: hasCustomAllocation,
    commitPendingAllocation,
  } = useAllocationStore()

  // Ethereum wallet state
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()

  // Local state
  const [currentStep, setCurrentStep] = useState<OneClickStep>('connect')
  const [isProcessing, setIsProcessing] = useState(false)
  const [allocationTxId, setAllocationTxId] = useState<string | null>(null)
  const [depositTxId, setDepositTxId] = useState<string | null>(null)
  const [showAllocationSliders, setShowAllocationSliders] = useState(false)

  const numericAmount = parseFloat(amount) || 0
  const bothWalletsConnected = isEthConnected && isStacksConnected

  // Update step based on wallet connection
  useEffect(() => {
    if (!bothWalletsConnected && currentStep !== 'connect') {
      setCurrentStep('connect')
    } else if (bothWalletsConnected && currentStep === 'connect') {
      setCurrentStep('configure')
    }
  }, [bothWalletsConnected, currentStep])

  // Handle allocation change
  const handleAllocationChange = useCallback((newAllocation: { sbtc: number; ststx: number; stx: number }) => {
    // Allocation will be committed to store when sliders are released
  }, [])

  // Start the 1-click flow
  const handleStartDeposit = async () => {
    if (!bothWalletsConnected || numericAmount <= 0) return
    setCurrentStep('review')
  }

  // Execute the 1-click deposit flow
  const handleConfirmDeposit = async () => {
    if (!ethAddress || !stacksAddress || numericAmount <= 0) return

    setIsProcessing(true)
    setError(null)

    try {
      // Step 1: Set allocation on contract if custom
      if (hasCustomAllocation && isValidAllocation(allocation)) {
        setCurrentStep('set_allocation')
        const result = await setContractAllocation(allocation, true)
        setAllocationTxId(result.txId)
        commitPendingAllocation()
        // Wait a bit for tx to be accepted
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Step 2: Approve USDC (simulated for now)
      setCurrentStep('approve')
      setDepositStep('approve')
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Step 3: Deposit to xReserve bridge
      setCurrentStep('deposit')
      setDepositStep('deposit')
      // In production: Call actual bridge deposit
      await new Promise(resolve => setTimeout(resolve, 2000))
      setDepositTxId(`0x${Math.random().toString(16).slice(2, 18)}`)

      // Step 4: Register with relayer API
      setCurrentStep('register_relayer')
      await registerWithRelayer({
        ethAddress,
        stacksAddress,
        amount: numericAmount,
        allocation,
      })

      // Step 5: Move to waiting state
      setCurrentStep('waiting_bridge')
      setDepositStep('attesting')

      // Show success - relayer will handle the rest
      await new Promise(resolve => setTimeout(resolve, 1500))
      setCurrentStep('success')
      setDepositStep('success')
      onComplete?.()

    } catch (err) {
      console.error('Deposit error:', err)
      setError(err instanceof Error ? err.message : 'Transaction failed')
      setCurrentStep('error')
      setDepositStep('error')
    } finally {
      setIsProcessing(false)
    }
  }

  // Register with relayer API
  const registerWithRelayer = async (data: {
    ethAddress: string
    stacksAddress: string
    amount: number
    allocation: { sbtc: number; ststx: number; stx: number }
  }) => {
    // In production, this calls the actual relayer API
    // For now, simulate the registration
    const response = await fetch('/api/relayer/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ethAddress: data.ethAddress,
        stacksAddress: data.stacksAddress,
        amount: data.amount,
        allocation: data.allocation,
        depositTxHash: depositTxId,
      }),
    }).catch(() => {
      // Silently fail in development - API may not exist yet
      console.log('Relayer registration skipped (API not available)')
      return { ok: true }
    })

    return response
  }

  const handleBack = () => {
    if (currentStep === 'review') {
      setCurrentStep('configure')
    } else if (currentStep === 'configure') {
      // Stay on configure
    }
  }

  // Render success screen
  if (currentStep === 'success') {
    return (
      <div className="py-8">
        <DepositSuccess />
        <div className="mt-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <h3 className="font-medium text-blue-400">Auto-Invest Enabled</h3>
          </div>
          <p className="text-sm text-slate-400">
            Your deposit is being bridged. Once complete, your funds will be automatically
            invested according to your allocation. You can close this window - we&apos;ll handle the rest!
          </p>
        </div>
      </div>
    )
  }

  // Render processing/progress screen
  if (['set_allocation', 'approve', 'deposit', 'register_relayer', 'waiting_bridge', 'auto_invest', 'error'].includes(currentStep)) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white mb-2">
            Processing Deposit
          </h1>
          <p className="text-slate-400">
            Your USDC is being bridged and will be auto-invested.
          </p>
        </div>

        {/* Custom progress steps for 1-click flow */}
        <div className="space-y-3">
          <ProgressStep
            label="Set Allocation"
            status={getStepStatus('set_allocation', currentStep)}
            txId={allocationTxId}
            show={hasCustomAllocation}
          />
          <ProgressStep
            label="Approve USDC"
            status={getStepStatus('approve', currentStep)}
          />
          <ProgressStep
            label="Deposit to Bridge"
            status={getStepStatus('deposit', currentStep)}
            txId={depositTxId}
          />
          <ProgressStep
            label="Register Auto-Invest"
            status={getStepStatus('register_relayer', currentStep)}
          />
          <ProgressStep
            label="Bridge Transfer"
            status={getStepStatus('waiting_bridge', currentStep)}
            subtitle="~15 minutes"
          />
          <ProgressStep
            label="Auto-Invest"
            status={getStepStatus('auto_invest', currentStep)}
            subtitle="Handled by relayer"
          />
        </div>

        {currentStep === 'waiting_bridge' && (
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h3 className="font-medium text-blue-400">Waiting for Bridge</h3>
            </div>
            <p className="text-sm text-slate-400">
              You can safely close this page. Your funds will be automatically
              invested when the bridge completes. Check back later to see your portfolio!
            </p>
          </div>
        )}

        {currentStep === 'error' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="font-medium text-red-400">Transaction Failed</h3>
              </div>
              <p className="text-sm text-slate-400">
                {error || 'Something went wrong. Please try again.'}
              </p>
            </div>
            <Button
              onClick={() => setCurrentStep('configure')}
              variant="secondary"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Render review screen
  if (currentStep === 'review') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-white">
              Review 1-Click Deposit
            </h1>
            <p className="text-slate-400">
              Confirm your deposit and allocation
            </p>
          </div>
        </div>

        {/* Amount summary */}
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400">Deposit Amount</span>
            <span className="text-2xl font-bold text-white">
              ${numericAmount.toFixed(2)} USDC
            </span>
          </div>
          <BridgePreview />
        </div>

        {/* Allocation summary */}
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Investment Allocation</h3>
          <div className="space-y-2">
            <AllocationRow token="sBTC" percentage={allocation.sbtc} amount={numericAmount * allocation.sbtc / 100} color="bg-orange-500" />
            <AllocationRow token="stSTX" percentage={allocation.ststx} amount={numericAmount * allocation.ststx / 100} color="bg-violet-500" />
            <AllocationRow token="STX" percentage={allocation.stx} amount={numericAmount * allocation.stx / 100} color="bg-blue-500" />
          </div>
          {hasCustomAllocation && (
            <p className="text-xs text-blue-400 mt-2">Custom allocation</p>
          )}
        </div>

        {/* Connected wallets */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Connected Wallets</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ethereum</span>
              <span className="text-white font-mono text-sm">
                {ethAddress?.slice(0, 6)}...{ethAddress?.slice(-4)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Stacks</span>
              <span className="text-white font-mono text-sm">
                {stacksAddress?.slice(0, 6)}...{stacksAddress?.slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* Auto-invest info */}
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <h3 className="font-medium text-blue-400">1-Click Auto-Invest</h3>
          </div>
          <p className="text-sm text-slate-400">
            After confirming, your USDC will be bridged and automatically invested
            into your chosen allocation. No further action required!
          </p>
        </div>

        <Button
          onClick={handleConfirmDeposit}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Confirm 1-Click Deposit
            </>
          )}
        </Button>
      </div>
    )
  }

  // Default: Configure screen (connect + amount + allocation)
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white mb-2">
          1-Click Deposit & Invest
        </h1>
        <p className="text-slate-400">
          Deposit USDC from Ethereum and auto-invest in the Stacks ecosystem.
        </p>
      </div>

      {/* Wallet connection */}
      <DualWalletConnect />

      {/* Amount and allocation inputs */}
      {bothWalletsConnected && (
        <>
          <Card>
            <CardHeader>
              <h2 className="font-heading text-lg font-semibold text-white">
                Amount
              </h2>
            </CardHeader>
            <CardContent>
              <AmountInput />
            </CardContent>
          </Card>

          {/* Allocation customization toggle */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold text-white">
                  Investment Allocation
                </h2>
                <button
                  onClick={() => setShowAllocationSliders(!showAllocationSliders)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showAllocationSliders ? 'Hide' : 'Customize'}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {showAllocationSliders ? (
                <AllocationSliders
                  onChange={handleAllocationChange}
                  showPreview={true}
                  totalAmount={numericAmount}
                />
              ) : (
                <div className="space-y-2">
                  <AllocationRow token="sBTC" percentage={allocation.sbtc} amount={numericAmount * allocation.sbtc / 100} color="bg-orange-500" />
                  <AllocationRow token="stSTX" percentage={allocation.ststx} amount={numericAmount * allocation.ststx / 100} color="bg-violet-500" />
                  <AllocationRow token="STX" percentage={allocation.stx} amount={numericAmount * allocation.stx / 100} color="bg-blue-500" />
                  {!hasCustomAllocation && (
                    <p className="text-xs text-slate-500 mt-2">Default allocation (40/30/30)</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <BridgePreview />

          <Button
            onClick={handleStartDeposit}
            disabled={numericAmount <= 0}
            className="w-full"
            size="lg"
          >
            <Zap className="w-4 h-4" />
            Continue to Review
          </Button>
        </>
      )}

      {!bothWalletsConnected && (
        <div className="text-center py-8">
          <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            Connect both wallets to start your 1-click deposit
          </p>
        </div>
      )}

      {/* Info card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="py-4">
          <h3 className="font-medium text-blue-400 mb-2">How 1-Click Works</h3>
          <ol className="text-sm text-slate-400 space-y-2">
            <li className="flex gap-2">
              <span className="text-blue-500 font-semibold">1.</span>
              Connect wallets and choose your allocation
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-semibold">2.</span>
              Confirm deposit - we handle the rest
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-semibold">3.</span>
              Bridge completes (~15 min) - auto-invested
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-semibold">4.</span>
              Check back to see your diversified portfolio
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper component for allocation row
function AllocationRow({
  token,
  percentage,
  amount,
  color,
}: {
  token: string
  percentage: number
  amount: number
  color: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-white">{token}</span>
        <span className="text-slate-500">({percentage}%)</span>
      </div>
      <span className="text-white font-mono">${amount.toFixed(2)}</span>
    </div>
  )
}

// Helper component for progress step
function ProgressStep({
  label,
  status,
  txId,
  subtitle,
  show = true,
}: {
  label: string
  status: 'pending' | 'active' | 'completed' | 'error'
  txId?: string | null
  subtitle?: string
  show?: boolean
}) {
  if (!show) return null

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
      status === 'active' ? 'bg-blue-500/10 border border-blue-500/30' :
      status === 'completed' ? 'bg-green-500/10 border border-green-500/30' :
      status === 'error' ? 'bg-red-500/10 border border-red-500/30' :
      'bg-slate-800/50 border border-slate-700'
    }`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        status === 'active' ? 'bg-blue-500 animate-pulse' :
        status === 'completed' ? 'bg-green-500' :
        status === 'error' ? 'bg-red-500' :
        'bg-slate-700'
      }`}>
        {status === 'completed' && <Check className="w-4 h-4 text-white" />}
        {status === 'error' && <AlertCircle className="w-4 h-4 text-white" />}
        {status === 'active' && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
      <div className="flex-1">
        <span className={`text-sm ${
          status === 'active' ? 'text-blue-400' :
          status === 'completed' ? 'text-green-400' :
          status === 'error' ? 'text-red-400' :
          'text-slate-500'
        }`}>
          {label}
        </span>
        {subtitle && (
          <span className="text-xs text-slate-600 ml-2">{subtitle}</span>
        )}
      </div>
      {txId && (
        <a
          href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          View tx
        </a>
      )}
    </div>
  )
}

// Helper to determine step status
function getStepStatus(
  stepName: OneClickStep,
  currentStep: OneClickStep
): 'pending' | 'active' | 'completed' | 'error' {
  const steps: OneClickStep[] = [
    'set_allocation',
    'approve',
    'deposit',
    'register_relayer',
    'waiting_bridge',
    'auto_invest',
  ]

  if (currentStep === 'error') {
    const errorIndex = steps.indexOf(currentStep)
    const stepIndex = steps.indexOf(stepName)
    if (stepIndex < errorIndex) return 'completed'
    if (stepIndex === errorIndex) return 'error'
    return 'pending'
  }

  const currentIndex = steps.indexOf(currentStep)
  const stepIndex = steps.indexOf(stepName)

  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'active'
  return 'pending'
}

export default OneClickDeposit
