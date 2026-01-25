import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
  getAccount,
} from '@wagmi/core'
import { parseUnits, formatUnits } from 'viem'
import { wagmiConfig, CONTRACTS, USDC_DECIMALS } from './config'

// USDC ABI (minimal)
const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const

// xReserve ABI (minimal - deposit function)
const XRESERVE_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationChain', type: 'uint32' },
      { name: 'destinationAddress', type: 'bytes32' },
    ],
    outputs: [],
  },
] as const

// Stacks chain ID for xReserve (this is a placeholder - check actual value)
const STACKS_CHAIN_ID = 1 // Replace with actual Stacks chain identifier

export async function getUSDCBalance(address: `0x${string}`): Promise<string> {
  try {
    const balance = await readContract(wagmiConfig, {
      address: CONTRACTS.mainnet.USDC,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address],
    })
    return formatUnits(balance, USDC_DECIMALS)
  } catch (error) {
    console.error('Error fetching USDC balance:', error)
    return '0'
  }
}

export async function getUSDCAllowance(
  owner: `0x${string}`,
  spender: `0x${string}`
): Promise<string> {
  try {
    const allowance = await readContract(wagmiConfig, {
      address: CONTRACTS.mainnet.USDC,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [owner, spender],
    })
    return formatUnits(allowance, USDC_DECIMALS)
  } catch (error) {
    console.error('Error fetching USDC allowance:', error)
    return '0'
  }
}

export async function approveUSDC(amount: string): Promise<`0x${string}`> {
  const amountInUnits = parseUnits(amount, USDC_DECIMALS)

  const hash = await writeContract(wagmiConfig, {
    address: CONTRACTS.mainnet.USDC,
    abi: USDC_ABI,
    functionName: 'approve',
    args: [CONTRACTS.mainnet.xReserve, amountInUnits],
  })

  // Wait for transaction confirmation
  await waitForTransactionReceipt(wagmiConfig, { hash })

  return hash
}

export async function depositToXReserve(
  amount: string,
  stacksAddress: string
): Promise<`0x${string}`> {
  const amountInUnits = parseUnits(amount, USDC_DECIMALS)

  // Convert Stacks address to bytes32 format
  // This is a simplified conversion - actual implementation may differ
  const destinationBytes = stacksAddressToBytes32(stacksAddress)

  const hash = await writeContract(wagmiConfig, {
    address: CONTRACTS.mainnet.xReserve,
    abi: XRESERVE_ABI,
    functionName: 'deposit',
    args: [amountInUnits, STACKS_CHAIN_ID, destinationBytes],
  })

  await waitForTransactionReceipt(wagmiConfig, { hash })

  return hash
}

// Convert Stacks address to bytes32 for xReserve
function stacksAddressToBytes32(address: string): `0x${string}` {
  // Pad the address to 32 bytes
  // This is a simplified implementation
  const hex = Buffer.from(address).toString('hex').padStart(64, '0')
  return `0x${hex}` as `0x${string}`
}

export function parseUSDCAmount(amount: string): bigint {
  return parseUnits(amount, USDC_DECIMALS)
}

export function formatUSDCAmount(amount: bigint): string {
  return formatUnits(amount, USDC_DECIMALS)
}
