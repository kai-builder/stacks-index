'use client'

import { useEffect } from 'react'
import { ArrowDownToLine, Wallet, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { useWalletStore } from '@/lib/store/wallet'
import { useDepositStore } from '@/lib/store/deposit'
import {
  DualWalletConnect,
  AmountInput,
  BridgePreview,
  TransactionSteps,
  AutoInvestToggle,
  DepositSuccess,
  PendingBridges,
} from '@/components/deposit'

// Ethereum wallet hooks
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export default function DepositPage() {
  const { isConnected: isStacksConnected, address: stacksAddress } = useWalletStore()
  const {
    currentStep,
    amount,
    autoInvest,
    setStep,
    setApproveTxHash,
    setDepositTxHash,
    setBridgeTransaction,
    setError,
  } = useDepositStore()

  // Ethereum wallet state
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  const { connect: connectEth } = useConnect()
  const { disconnect: disconnectEth } = useDisconnect()

  const numericAmount = parseFloat(amount) || 0
  const bothWalletsConnected = isEthConnected && isStacksConnected

  // Handle the deposit flow
  const handleStartDeposit = async () => {
    if (!bothWalletsConnected || numericAmount <= 0) return

    try {
      // Move to review step
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
    }
  }

  const handleConfirmDeposit = async () => {
    if (!ethAddress || !stacksAddress || numericAmount <= 0) return

    try {
      // Step 1: Approve USDC
      setStep('approve')

      // In production, this would call the actual approve function
      // For now, simulate the approval
      await new Promise(resolve => setTimeout(resolve, 2000))
      setApproveTxHash(`0x${Math.random().toString(16).slice(2, 18)}`)

      // Step 2: Deposit to xReserve
      setStep('deposit')
      await new Promise(resolve => setTimeout(resolve, 2000))
      const depositTxHash = `0x${Math.random().toString(16).slice(2, 18)}`
      setDepositTxHash(depositTxHash)

      // Step 3: Wait for attestation
      setStep('attesting')
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Step 4: Minting USDCx on Stacks
      setStep('minting')
      const stacksTxHash = `0x${Math.random().toString(16).slice(2, 18)}`
      setBridgeTransaction({
        id: `bridge-${Date.now()}`,
        ethTxHash: `0x${depositTxHash.slice(2)}` as `0x${string}`,
        stacksTxHash,
        amount: numericAmount.toString(),
        startTime: Date.now(),
        lastUpdate: Date.now(),
        status: 'completed',
        stacksAddress: stacksAddress || '',
      })
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Step 5: Auto-invest if enabled
      if (autoInvest) {
        setStep('investing')
        await new Promise(resolve => setTimeout(resolve, 2500))
      }

      // Complete!
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
      setStep('error')
    }
  }

  const handleBack = () => {
    if (currentStep === 'review') {
      setStep('input')
    }
  }

  // Show success screen
  if (currentStep === 'success') {
    return (
      <div className="py-8">
        <DepositSuccess />
      </div>
    )
  }

  // Show transaction progress
  if (['approve', 'deposit', 'attesting', 'minting', 'investing', 'error'].includes(currentStep)) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white mb-2">
            Processing Deposit
          </h1>
          <p className="text-slate-400">
            Your USDC is being bridged to USDCx on Stacks.
          </p>
        </div>

        <TransactionSteps />

        {currentStep === 'error' && (
          <Button
            onClick={() => setStep('input')}
            variant="secondary"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  // Show review screen
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
              Review Deposit
            </h1>
            <p className="text-slate-400">
              Confirm your deposit details
            </p>
          </div>
        </div>

        <BridgePreview />

        <AutoInvestToggle />

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

        <Button
          onClick={handleConfirmDeposit}
          className="w-full"
          size="lg"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Confirm Deposit
        </Button>
      </div>
    )
  }

  // Default: Input screen
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white mb-2">
          Deposit USDC
        </h1>
        <p className="text-slate-400">
          Bridge USDC from Ethereum to invest in the Stacks ecosystem.
        </p>
      </div>

      {/* Show pending bridges if any */}
      <PendingBridges />

      {/* Wallet connection */}
      <DualWalletConnect />

      {/* Amount input */}
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

          <BridgePreview />

          <Button
            onClick={handleStartDeposit}
            disabled={numericAmount <= 0}
            className="w-full"
            size="lg"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Continue to Review
          </Button>
        </>
      )}

      {!bothWalletsConnected && (
        <div className="text-center py-8">
          <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            Connect both wallets to start your deposit
          </p>
        </div>
      )}

      {/* Info card */}
      <Card className="bg-violet-500/5 border-violet-500/20">
        <CardContent className="py-4">
          <h3 className="font-medium text-violet-400 mb-2">How it works</h3>
          <ol className="text-sm text-slate-400 space-y-2">
            <li className="flex gap-2">
              <span className="text-violet-500 font-semibold">1.</span>
              Connect your Ethereum and Stacks wallets
            </li>
            <li className="flex gap-2">
              <span className="text-violet-500 font-semibold">2.</span>
              Approve and deposit USDC to the xReserve bridge
            </li>
            <li className="flex gap-2">
              <span className="text-violet-500 font-semibold">3.</span>
              Receive USDCx on Stacks (3-5 minutes)
            </li>
            <li className="flex gap-2">
              <span className="text-violet-500 font-semibold">4.</span>
              Optionally auto-invest into diversified index
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
