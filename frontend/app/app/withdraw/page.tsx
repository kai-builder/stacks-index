'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowUpFromLine,
  ArrowRight,
  ArrowLeft,
  Wallet,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useWalletStore } from '@/lib/store/wallet'
import {
  useWithdrawStore,
  isWithdrawStepCompleted,
  isWithdrawStepActive,
  getWithdrawStepLabel,
  getWithdrawStepDescription,
  WithdrawStep,
} from '@/lib/store/withdraw'
import {
  getUsdcxBalance,
  fromMicroUsdcx,
  toMicroUsdcx,
  validateWithdrawal,
} from '@/lib/stacks/usdcx'
import {
  executeWithdrawal,
  getEstimatedWithdrawalTime,
  getWithdrawalFee,
  savePendingWithdrawal,
  monitorWithdrawalTx,
} from '@/lib/stacks/withdraw'
import { formatCurrency } from '@/lib/utils/format'

// Ethereum address validation regex
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/

export default function WithdrawPage() {
  const router = useRouter()
  const { isConnected, address: stacksAddress, network } = useWalletStore()
  const isMainnet = network === 'mainnet'
  const {
    amount,
    ethRecipient,
    usdcxBalance,
    currentStep,
    txId,
    error,
    setAmount,
    setEthRecipient,
    setUsdcxBalance,
    setStep,
    setTxId,
    setError,
    reset,
  } = useWithdrawStore()

  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  // Track if initial fetch has been triggered
  const [hasInitialFetch, setHasInitialFetch] = useState(false)

  const numericAmount = parseFloat(amount) || 0
  const numericBalance = parseFloat(usdcxBalance) || 0
  const isValidEthAddress = ETH_ADDRESS_REGEX.test(ethRecipient)

  const loadBalance = useCallback(async () => {
    if (!stacksAddress) return

    setIsLoadingBalance(true)
    try {
      const { formatted } = await getUsdcxBalance(stacksAddress, isMainnet)
      setUsdcxBalance(formatted)
    } catch (err) {
      console.error('Error loading balance:', err)
    } finally {
      setIsLoadingBalance(false)
    }
  }, [stacksAddress, isMainnet, setUsdcxBalance])

  // Load USDCx balance on mount and network change
  useEffect(() => {
    if (stacksAddress) {
      setHasInitialFetch(true)
      loadBalance()
    }
  }, [stacksAddress, loadBalance])

  // Handle percentage buttons
  const handlePercentage = (percent: number) => {
    const value = (numericBalance * percent) / 100
    setAmount(value.toFixed(2))
  }

  // Validate and move to review
  const handleContinue = async () => {
    if (!stacksAddress || numericAmount <= 0 || !isValidEthAddress) return

    setIsValidating(true)
    setValidationError(null)

    try {
      const validation = await validateWithdrawal(
        amount,
        stacksAddress,
        ethRecipient,
        isMainnet
      )

      if (!validation.valid) {
        setValidationError(validation.error || 'Validation failed')
        setIsValidating(false)
        return
      }

      setStep('review')
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setIsValidating(false)
    }
  }

  // Execute withdrawal
  const handleWithdraw = async () => {
    if (!stacksAddress || numericAmount <= 0 || !isValidEthAddress) return

    setStep('signing')

    try {
      const result = await executeWithdrawal({
        amount,
        stacksAddress,
        ethRecipient,
        isMainnet,
        onStatusChange: (status) => {
          if (status === 'awaiting_signature') setStep('signing')
          if (status === 'broadcasting') setStep('broadcasting')
          if (status === 'pending') setStep('pending')
        },
      })

      if (!result.success) {
        setError(result.error || 'Withdrawal failed')
        return
      }

      if (result.txId) {
        setTxId(result.txId)

        // Save pending withdrawal
        savePendingWithdrawal({
          txId: result.txId,
          amount,
          ethRecipient,
          stacksAddress,
          startTime: Date.now(),
          status: 'pending',
        })

        // Monitor transaction
        setStep('confirming')
        const { confirmed, error: monitorError } = await monitorWithdrawalTx(
          result.txId,
          isMainnet,
          (status) => {
            if (status === 'confirmed') {
              setStep('processing')
              // After a delay, show success
              setTimeout(() => setStep('success'), 3000)
            }
            if (status === 'failed') {
              setError(monitorError || 'Transaction failed')
            }
          }
        )

        if (!confirmed && monitorError) {
          setError(monitorError)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed')
    }
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Wallet className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="font-heading text-2xl font-bold text-white mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-slate-400 mb-6 text-center max-w-md">
          Connect your Stacks wallet to withdraw USDCx.
        </p>
      </div>
    )
  }

  // Success state
  if (currentStep === 'success') {
    return (
      <div className="max-w-lg mx-auto text-center py-8">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="font-heading text-3xl font-bold text-white mb-2">
          Withdrawal Initiated
        </h1>
        <p className="text-slate-400 mb-8">
          Your {formatCurrency(numericAmount)} USDCx withdrawal is being processed.
          USDC will arrive on Ethereum in approximately {getEstimatedWithdrawalTime()}.
        </p>

        {txId && (
          <a
            href={`https://explorer.hiro.so/txid/${txId}?chain=${isMainnet ? 'mainnet' : 'testnet'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 mb-8"
          >
            View on Stacks Explorer
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-8">
          <p className="text-sm text-amber-400">
            Your USDC will be sent to: <br />
            <span className="font-mono text-white">{ethRecipient}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => router.push('/app')} size="lg">
            View Portfolio
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              reset()
              loadBalance()
            }}
          >
            Withdraw More
          </Button>
        </div>
      </div>
    )
  }

  // Error state
  if (currentStep === 'error') {
    return (
      <div className="max-w-lg mx-auto text-center py-8">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="font-heading text-3xl font-bold text-white mb-2">
          Withdrawal Failed
        </h1>
        <p className="text-red-400 mb-8">{error}</p>

        <Button
          onClick={() => {
            reset()
            loadBalance()
          }}
          size="lg"
        >
          Try Again
        </Button>
      </div>
    )
  }

  // Processing states (signing, broadcasting, pending, confirming, processing)
  if (['signing', 'broadcasting', 'pending', 'confirming', 'processing'].includes(currentStep)) {
    const steps: WithdrawStep[] = ['signing', 'broadcasting', 'confirming', 'processing']

    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white mb-2">
            Processing Withdrawal
          </h1>
          <p className="text-slate-400">
            Please wait while your withdrawal is being processed.
          </p>
        </div>

        <Card>
          <CardContent className="py-6">
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isCompleted = isWithdrawStepCompleted(currentStep, step)
                const isActive = isWithdrawStepActive(currentStep, step)

                return (
                  <div key={step} className="flex items-start gap-4">
                    <div className="relative z-10">
                      {isCompleted ? (
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      ) : isActive ? (
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-slate-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 pb-4">
                      <h4
                        className={`font-medium ${
                          isCompleted
                            ? 'text-green-400'
                            : isActive
                            ? 'text-white'
                            : 'text-slate-500'
                        }`}
                      >
                        {getWithdrawStepLabel(step)}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {getWithdrawStepDescription(step)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {txId && (
          <a
            href={`https://explorer.hiro.so/txid/${txId}?chain=${isMainnet ? 'mainnet' : 'testnet'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-violet-400 hover:text-violet-300"
          >
            View transaction
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-400">
            Do not close this window. Your withdrawal will continue processing
            even if you navigate away.
          </p>
        </div>
      </div>
    )
  }

  // Review state
  if (currentStep === 'review') {
    const fees = getWithdrawalFee()

    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setStep('input')}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-white">
              Review Withdrawal
            </h1>
            <p className="text-slate-400">Confirm your withdrawal details</p>
          </div>
        </div>

        <Card>
          <CardContent className="py-6 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-800">
              <span className="text-slate-400">Amount</span>
              <span className="text-xl font-bold text-white">
                {formatCurrency(numericAmount)} USDCx
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-800">
              <span className="text-slate-400">You will receive</span>
              <span className="text-xl font-bold text-green-400">
                {formatCurrency(numericAmount)} USDC
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-800">
              <span className="text-slate-400">Ethereum recipient</span>
              <span className="text-sm font-mono text-white">
                {ethRecipient.slice(0, 8)}...{ethRecipient.slice(-6)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-800">
              <span className="text-slate-400">Network fee</span>
              <span className="text-white">{fees.total}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-slate-400">Estimated time</span>
              <span className="text-white">{getEstimatedWithdrawalTime()}</span>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-400">
              <p className="font-medium mb-1">How it works</p>
              <p className="text-blue-400/80">
                Your USDCx will be burned on Stacks, and Circle will send USDC
                to your Ethereum address. This typically takes 15-30 minutes.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleWithdraw} className="w-full" size="lg">
          <ArrowUpFromLine className="w-4 h-4" />
          Confirm Withdrawal
        </Button>
      </div>
    )
  }

  // Default: Input state
  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Testnet banner */}
      {!isMainnet && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <p className="text-sm text-amber-400">
            You are on <span className="font-semibold">Stacks Testnet</span>. Use test tokens only.
          </p>
        </div>
      )}

      <div>
        <h1 className="font-heading text-2xl font-bold text-white mb-2">
          Withdraw to {isMainnet ? 'Ethereum' : 'Sepolia'}
        </h1>
        <p className="text-slate-400">
          Burn USDCx on Stacks to receive USDC on {isMainnet ? 'Ethereum' : 'Sepolia Testnet'}.
        </p>
      </div>

      {/* Balance card */}
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-sm text-slate-400 mb-1">Available USDCx Balance</p>
          {(isLoadingBalance || !hasInitialFetch) ? (
            <Loader2 className="w-6 h-6 text-slate-400 mx-auto animate-spin" />
          ) : (
            <p className="font-heading text-3xl font-bold text-white">
              {formatCurrency(numericBalance)}
            </p>
          )}
        </CardContent>
      </Card>

      {numericBalance === 0 && !isLoadingBalance && hasInitialFetch ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">No portfolio to withdraw from</p>
            <Button onClick={() => router.push('/app/invest')}>
              Invest First
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Amount input */}
          <Card>
            <CardHeader>
              <h2 className="font-heading text-lg font-semibold text-white">
                Amount
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                rightElement={
                  <span className="text-slate-400 font-medium">USDCx</span>
                }
              />

              <div className="flex gap-2">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handlePercentage(pct)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      Math.abs(numericAmount - (numericBalance * pct) / 100) < 0.01
                        ? 'bg-violet-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ethereum address input */}
          <Card>
            <CardHeader>
              <h2 className="font-heading text-lg font-semibold text-white">
                Ethereum Recipient
              </h2>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                placeholder="0x1234...5678"
                value={ethRecipient}
                onChange={(e) => setEthRecipient(e.target.value)}
                className="font-mono"
                error={ethRecipient && !isValidEthAddress ? 'Please enter a valid Ethereum address' : undefined}
              />
            </CardContent>
          </Card>

          {/* Validation error */}
          {validationError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{validationError}</p>
            </div>
          )}

          {/* Summary */}
          {numericAmount > 0 && isValidEthAddress && (
            <Card className="bg-violet-500/5 border-violet-500/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">You will receive</span>
                  <span className="text-lg font-bold text-white">
                    {formatCurrency(numericAmount)} USDC
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">On Ethereum</span>
                  <span className="text-slate-400">
                    ~{getEstimatedWithdrawalTime()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Continue button */}
          <Button
            onClick={handleContinue}
            disabled={
              numericAmount <= 0 ||
              numericAmount > numericBalance ||
              !isValidEthAddress ||
              isValidating
            }
            isLoading={isValidating}
            className="w-full"
            size="lg"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            {isValidating ? 'Validating...' : 'Continue'}
          </Button>
        </>
      )}

      {/* Info card */}
      <Card className="bg-slate-900/30 border-slate-800">
        <CardContent className="py-4">
          <h3 className="font-medium text-slate-300 mb-2">How withdrawal works</h3>
          <ol className="text-sm text-slate-500 space-y-2">
            <li className="flex gap-2">
              <span className="text-violet-500 font-semibold">1.</span>
              Your USDCx is burned on the Stacks blockchain
            </li>
            <li className="flex gap-2">
              <span className="text-violet-500 font-semibold">2.</span>
              Circle processes the withdrawal via xReserve
            </li>
            <li className="flex gap-2">
              <span className="text-violet-500 font-semibold">3.</span>
              USDC is sent to your Ethereum address (~15-30 min)
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
