'use client'

import { ArrowDown, Clock, DollarSign, Percent } from 'lucide-react'
import { useDepositStore } from '@/lib/store/deposit'
import { getEstimatedBridgeTime, getBridgeFee } from '@/lib/ethereum/bridge'

export function BridgePreview() {
  const { amount } = useDepositStore()
  const numericAmount = parseFloat(amount) || 0
  const bridgeFee = parseFloat(getBridgeFee())
  const receiveAmount = Math.max(0, numericAmount - bridgeFee)

  if (numericAmount <= 0) {
    return null
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
      <h3 className="text-sm font-medium text-slate-400 mb-4">Bridge Summary</h3>

      {/* From / To */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#627EEA]/20 flex items-center justify-center">
              <EthereumIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">You send</p>
              <p className="font-semibold text-white">
                {numericAmount.toLocaleString()} USDC
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 px-2 py-1 bg-slate-700/50 rounded">
            Ethereum
          </span>
        </div>

        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <ArrowDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5546FF]/20 flex items-center justify-center">
              <StacksIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">You receive</p>
              <p className="font-semibold text-white">
                {receiveAmount.toLocaleString()} USDCx
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 px-2 py-1 bg-slate-700/50 rounded">
            Stacks
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-400">
            <Percent className="w-4 h-4" />
            Exchange rate
          </span>
          <span className="text-white">1 USDC = 1 USDCx</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-400">
            <DollarSign className="w-4 h-4" />
            Bridge fee
          </span>
          <span className="text-white">~${bridgeFee.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            Estimated time
          </span>
          <span className="text-white">{getEstimatedBridgeTime()}</span>
        </div>
      </div>
    </div>
  )
}

function EthereumIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 1.5L5.5 12.25L12 16L18.5 12.25L12 1.5Z" fill="#627EEA" />
      <path d="M12 16L5.5 12.25L12 22.5L18.5 12.25L12 16Z" fill="#627EEA" opacity="0.6" />
    </svg>
  )
}

function StacksIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M6 8H18L21 12L18 16H6L3 12L6 8Z" fill="#5546FF" />
      <path d="M8 10H16L18 12L16 14H8L6 12L8 10Z" fill="#7C6CFF" />
    </svg>
  )
}
