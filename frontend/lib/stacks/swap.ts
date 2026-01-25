import {
  makeContractCall,
  uintCV,
  listCV,
  contractPrincipalCV,
  PostConditionMode,
  AnchorMode,
} from '@stacks/transactions'
import { openContractCall } from '@stacks/connect'
import { TOKENS, BITFLOW_ROUTER, INDEX_ALLOCATION } from './tokens'

export interface SwapParams {
  tokenIn: string
  tokenOut: string
  amountIn: number
  minAmountOut: number
  sender: string
}

export interface SwapResult {
  txId: string
  status: 'pending' | 'success' | 'failed'
}

const network = 'mainnet' as const

export function calculateMinAmountOut(
  amountIn: number,
  price: number,
  slippage: number
): number {
  const expectedOut = amountIn * price
  return Math.floor(expectedOut * (1 - slippage / 100))
}

export function calculateAllocationAmounts(
  totalUsdcx: number
): Record<string, number> {
  return {
    sBTC: Math.floor(totalUsdcx * INDEX_ALLOCATION.sBTC),
    stSTX: Math.floor(totalUsdcx * INDEX_ALLOCATION.stSTX),
    STX: Math.floor(totalUsdcx * INDEX_ALLOCATION.STX),
  }
}

export async function executeSwap(params: SwapParams): Promise<SwapResult> {
  const tokenIn = TOKENS[params.tokenIn]
  const tokenOut = TOKENS[params.tokenOut]

  if (!tokenIn || !tokenOut) {
    throw new Error('Invalid token')
  }

  const path = listCV([
    contractPrincipalCV(tokenIn.contractAddress, tokenIn.contractName),
    contractPrincipalCV(tokenOut.contractAddress, tokenOut.contractName),
  ])

  // Use Bitflow AMM for swaps
  const txOptions = {
    contractAddress: BITFLOW_ROUTER.contractAddress,
    contractName: BITFLOW_ROUTER.contractName,
    functionName: 'swap-x-for-y',  // Bitflow swap function
    functionArgs: [
      uintCV(params.amountIn),
      uintCV(params.minAmountOut),
      path,
    ],
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data: { txId: string }) => {
      return { txId: data.txId, status: 'pending' as const }
    },
    onCancel: () => {
      throw new Error('Transaction cancelled by user')
    },
  }

  return new Promise((resolve, reject) => {
    openContractCall({
      ...txOptions,
      onFinish: (data) => {
        resolve({ txId: data.txId, status: 'pending' })
      },
      onCancel: () => {
        reject(new Error('Transaction cancelled by user'))
      },
    })
  })
}

export async function executeIndexDeposit(
  usdcxAmount: number,
  slippage: number,
  prices: Record<string, number>
): Promise<SwapResult[]> {
  const allocations = calculateAllocationAmounts(usdcxAmount)
  const results: SwapResult[] = []

  for (const [symbol, amount] of Object.entries(allocations)) {
    if (amount <= 0) continue

    const price = prices[symbol] || 1
    const minOut = calculateMinAmountOut(amount, 1 / price, slippage)

    const result = await executeSwap({
      tokenIn: 'USDCx',
      tokenOut: symbol,
      amountIn: amount,
      minAmountOut: minOut,
      sender: '',
    })

    results.push(result)
  }

  return results
}

export async function executeIndexWithdraw(
  holdings: Record<string, number>,
  percentage: number,
  slippage: number,
  prices: Record<string, number>
): Promise<SwapResult[]> {
  const results: SwapResult[] = []

  for (const [symbol, amount] of Object.entries(holdings)) {
    const withdrawAmount = Math.floor(amount * (percentage / 100))
    if (withdrawAmount <= 0) continue

    const price = prices[symbol] || 1
    const minOut = calculateMinAmountOut(withdrawAmount, price, slippage)

    const result = await executeSwap({
      tokenIn: symbol,
      tokenOut: 'USDCx',
      amountIn: withdrawAmount,
      minAmountOut: minOut,
      sender: '',
    })

    results.push(result)
  }

  return results
}
