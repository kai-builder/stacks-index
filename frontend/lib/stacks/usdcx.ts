/**
 * USDCx Token Contract Interactions
 *
 * USDCx is Circle's bridged USDC token on Stacks blockchain.
 * This module provides functions to interact with the USDCx token and xReserve protocol.
 *
 * Contracts:
 * - Token: SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx
 * - Protocol: SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx-v1
 */

import {
  cvToJSON,
  uintCV,
  bufferCV,
  principalCV,
  ClarityValue,
  cvToHex,
  hexToCV,
} from '@stacks/transactions'
import { getAccountBalances } from '@/lib/api/hiro'

// Contract addresses
export const USDCX_CONTRACTS = {
  mainnet: {
    token: {
      address: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE',
      name: 'usdcx',
    },
    protocol: {
      address: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE',
      name: 'usdcx-v1',
    },
  },
  testnet: {
    token: {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      name: 'usdcx',
    },
    protocol: {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      name: 'usdcx-v1',
    },
  },
}

// Native domains for burn (withdrawal)
export const NATIVE_DOMAINS = {
  ETHEREUM: 0,
} as const

// Token decimals (same as USDC)
export const USDCX_DECIMALS = 6

/**
 * Get network instance based on environment
 */
export function getNetwork(isMainnet: boolean = true) {
  return isMainnet ? 'mainnet' : 'testnet'
}

/**
 * Get API base URL for network
 */
export function getApiBaseUrl(isMainnet: boolean = true): string {
  return isMainnet ? 'https://api.mainnet.hiro.so' : 'https://api.testnet.hiro.so'
}

/**
 * Call read-only function via Hiro API (v7 compatible)
 */
async function callReadOnlyFunction(params: {
  contractAddress: string
  contractName: string
  functionName: string
  functionArgs: ClarityValue[]
  senderAddress: string
  isMainnet: boolean
}): Promise<ClarityValue> {
  const { contractAddress, contractName, functionName, functionArgs, senderAddress, isMainnet } = params
  const baseUrl = getApiBaseUrl(isMainnet)

  const response = await fetch(
    `${baseUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: senderAddress,
        arguments: functionArgs.map(arg => cvToHex(arg)),
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to call read-only function: ${response.status}`)
  }

  const data = await response.json()

  if (!data.okay || !data.result) {
    throw new Error(data.cause || 'Read-only function call failed')
  }

  return hexToCV(data.result)
}

/**
 * Get contracts based on network
 */
export function getContracts(isMainnet: boolean = true) {
  return isMainnet ? USDCX_CONTRACTS.mainnet : USDCX_CONTRACTS.testnet
}

/**
 * Convert amount to micro-units (6 decimals)
 * Uses string manipulation to avoid floating point precision issues
 */
export function toMicroUsdcx(amount: number | string): bigint {
  const str = typeof amount === 'number' ? amount.toString() : amount

  // Handle empty or invalid input
  if (!str || str === '') return BigInt(0)

  // Split on decimal point
  const [wholePart, decimalPart = ''] = str.split('.')

  // Pad or truncate decimal part to 6 digits
  const paddedDecimal = decimalPart.padEnd(USDCX_DECIMALS, '0').slice(0, USDCX_DECIMALS)

  // Combine and convert to BigInt
  const microAmount = BigInt(wholePart + paddedDecimal)

  return microAmount
}

/**
 * Convert micro-units to human-readable amount
 */
export function fromMicroUsdcx(microAmount: bigint | number | string): number {
  const num = typeof microAmount === 'bigint' ? microAmount : BigInt(microAmount)
  return Number(num) / Math.pow(10, USDCX_DECIMALS)
}

/**
 * Format Ethereum address as 20-byte buffer for Clarity burn function
 *
 * The native-recipient parameter expects the raw 20-byte Ethereum address.
 * Clarity's bufferCV will handle it as (buff 32) with implicit zero padding.
 *
 * Example: 0xa1404d9E7646b0112C49aE0296D6347C956D0867
 */
export function formatEthAddressAsBuffer(ethAddress: string): Uint8Array {
  // Remove 0x prefix if present and convert to lowercase
  const cleanAddress = ethAddress.toLowerCase().replace(/^0x/, '')

  // Validate Ethereum address format
  if (cleanAddress.length !== 40) {
    throw new Error(
      `Invalid Ethereum address: expected 40 hex characters, got ${cleanAddress.length}`
    )
  }

  // Validate hex characters only
  if (!/^[0-9a-f]+$/.test(cleanAddress)) {
    throw new Error('Invalid Ethereum address: must contain only hex characters')
  }

  // Create 20-byte buffer for raw ETH address
  const buffer = new Uint8Array(20)

  // Convert hex string to bytes
  for (let i = 0; i < 20; i++) {
    const byteHex = cleanAddress.slice(i * 2, i * 2 + 2)
    buffer[i] = parseInt(byteHex, 16)
  }

  return buffer
}

/**
 * Convert buffer to hex string for debugging
 */
export function bufferToHex(buffer: Uint8Array): string {
  return '0x' + Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Get USDCx balance for an address
 */
export async function getUsdcxBalance(
  stacksAddress: string,
  isMainnet: boolean = true
): Promise<{ balance: bigint; formatted: string }> {
  const contracts = getContracts(isMainnet)

  try {
    const result = await callReadOnlyFunction({
      contractAddress: contracts.token.address,
      contractName: contracts.token.name,
      functionName: 'get-balance',
      functionArgs: [principalCV(stacksAddress)],
      senderAddress: stacksAddress,
      isMainnet,
    })

    const json = cvToJSON(result)

    // Handle ok response: { type: 'ok', value: { type: 'uint', value: '...' } }
    if (json.success && json.value) {
      const balance = BigInt(json.value.value || '0')
      return {
        balance,
        formatted: fromMicroUsdcx(balance).toFixed(2),
      }
    }

    return { balance: BigInt(0), formatted: '0.00' }
  } catch (error) {
    console.error('Error fetching USDCx balance:', error)
    return { balance: BigInt(0), formatted: '0.00' }
  }
}

/**
 * Get USDCx total supply
 */
export async function getUsdcxTotalSupply(
  isMainnet: boolean = true
): Promise<{ supply: bigint; formatted: string }> {
  const contracts = getContracts(isMainnet)

  try {
    const result = await callReadOnlyFunction({
      contractAddress: contracts.token.address,
      contractName: contracts.token.name,
      functionName: 'get-total-supply',
      functionArgs: [],
      senderAddress: contracts.token.address, // Any address works for read-only
      isMainnet,
    })

    const json = cvToJSON(result)

    if (json.success && json.value) {
      const supply = BigInt(json.value.value || '0')
      return {
        supply,
        formatted: fromMicroUsdcx(supply).toLocaleString(),
      }
    }

    return { supply: BigInt(0), formatted: '0' }
  } catch (error) {
    console.error('Error fetching USDCx total supply:', error)
    return { supply: BigInt(0), formatted: '0' }
  }
}

/**
 * Check if protocol is paused
 */
export async function isProtocolPaused(isMainnet: boolean = true): Promise<boolean> {
  const contracts = getContracts(isMainnet)

  try {
    const result = await callReadOnlyFunction({
      contractAddress: contracts.token.address,
      contractName: contracts.token.name,
      functionName: 'is-protocol-paused',
      functionArgs: [],
      senderAddress: contracts.token.address,
      isMainnet,
    })

    const json = cvToJSON(result)
    return json.value === true
  } catch (error) {
    console.error('Error checking protocol pause status:', error)
    return false
  }
}

/**
 * Get minimum withdrawal amount
 */
export async function getMinWithdrawalAmount(
  isMainnet: boolean = true
): Promise<{ amount: bigint; formatted: string }> {
  const contracts = getContracts(isMainnet)

  try {
    const result = await callReadOnlyFunction({
      contractAddress: contracts.protocol.address,
      contractName: contracts.protocol.name,
      functionName: 'get-min-withdrawal-amount',
      functionArgs: [],
      senderAddress: contracts.protocol.address,
      isMainnet,
    })

    const json = cvToJSON(result)
    const amount = BigInt(json.value || '0')

    return {
      amount,
      formatted: fromMicroUsdcx(amount).toFixed(2),
    }
  } catch (error) {
    console.error('Error fetching min withdrawal amount:', error)
    return { amount: BigInt(0), formatted: '0.00' }
  }
}

/**
 * Build burn (withdrawal) transaction options
 *
 * Calls the burn function on usdcx-v1 contract:
 * ```clarity
 * (define-public (burn
 *     (amount uint)
 *     (native-domain uint)
 *     (native-recipient (buff 32))
 *   )
 * ```
 *
 * @param amount - Amount of USDCx to burn (human-readable, e.g., "100.50")
 * @param ethRecipient - Ethereum address to receive USDC (0x prefixed)
 * @param isMainnet - Whether to use mainnet contracts
 * @returns Transaction arguments for openContractCall
 */
export function buildBurnTxArgs(
  amount: string | number,
  ethRecipient: string,
  isMainnet: boolean = true
): {
  contractAddress: string
  contractName: string
  functionName: string
  functionArgs: ClarityValue[]
} {
  const contracts = getContracts(isMainnet)

  // Convert amount to micro-units (6 decimals)
  const microAmount = toMicroUsdcx(amount)

  // Format Ethereum address as 32-byte buffer (12 bytes padding + 20 bytes address)
  const ethAddressBuffer = formatEthAddressAsBuffer(ethRecipient)

  // Debug logging (can be removed in production)
  if (typeof window !== 'undefined') {
    console.log('[USDCx Burn] Amount:', amount, '-> micro:', microAmount.toString())
    console.log('[USDCx Burn] ETH Recipient:', ethRecipient)
    console.log('[USDCx Burn] Buffer (hex):', bufferToHex(ethAddressBuffer))
    console.log('[USDCx Burn] Contract:', `${contracts.protocol.address}.${contracts.protocol.name}`)
  }

  return {
    contractAddress: contracts.protocol.address,
    contractName: contracts.protocol.name,
    functionName: 'burn',
    functionArgs: [
      uintCV(microAmount),           // amount: uint
      uintCV(NATIVE_DOMAINS.ETHEREUM), // native-domain: uint (0 for Ethereum)
      bufferCV(ethAddressBuffer),    // native-recipient: (buff 32)
    ],
  }
}

/**
 * Build transfer transaction options
 *
 * @param amount - Amount of USDCx to transfer (human-readable)
 * @param sender - Sender's Stacks address
 * @param recipient - Recipient's Stacks address
 * @param memo - Optional memo (max 34 bytes)
 * @param isMainnet - Whether to use mainnet contracts
 */
export function buildTransferTxArgs(
  amount: string | number,
  sender: string,
  recipient: string,
  memo?: string,
  isMainnet: boolean = true
): {
  contractAddress: string
  contractName: string
  functionName: string
  functionArgs: ClarityValue[]
} {
  const contracts = getContracts(isMainnet)
  const microAmount = toMicroUsdcx(amount)

  // Build function args
  const functionArgs: ClarityValue[] = [
    uintCV(microAmount), // amount
    principalCV(sender), // sender
    principalCV(recipient), // recipient
  ]

  // Add optional memo
  if (memo) {
    const memoBytes = new TextEncoder().encode(memo.slice(0, 34))
    functionArgs.push(bufferCV(memoBytes))
  }

  return {
    contractAddress: contracts.token.address,
    contractName: contracts.token.name,
    functionName: 'transfer',
    functionArgs,
  }
}

/**
 * Validate withdrawal parameters
 */
export async function validateWithdrawal(
  amount: string | number,
  stacksAddress: string,
  ethRecipient: string,
  isMainnet: boolean = true
): Promise<{ valid: boolean; error?: string }> {
  // Check Ethereum address format
  const cleanEthAddress = ethRecipient.toLowerCase().replace(/^0x/, '')
  if (cleanEthAddress.length !== 40 || !/^[0-9a-f]+$/.test(cleanEthAddress)) {
    return { valid: false, error: 'Invalid Ethereum address format' }
  }

  // Check protocol pause status
  const paused = await isProtocolPaused(isMainnet)
  if (paused) {
    return { valid: false, error: 'USDCx protocol is currently paused' }
  }

  // Check minimum withdrawal amount
  const { amount: minAmount } = await getMinWithdrawalAmount(isMainnet)
  const withdrawAmount = toMicroUsdcx(amount)
  if (withdrawAmount < minAmount) {
    return {
      valid: false,
      error: `Minimum withdrawal amount is ${fromMicroUsdcx(minAmount)} USDCx`,
    }
  }

  // Check balance
  const { balance } = await getUsdcxBalance(stacksAddress, isMainnet)
  if (withdrawAmount > balance) {
    return {
      valid: false,
      error: `Insufficient balance. You have ${fromMicroUsdcx(balance)} USDCx`,
    }
  }

  return { valid: true }
}

/**
 * Fetch USDCx balance using Hiro API (alternative method)
 */
export async function fetchUsdcxBalanceFromApi(
  stacksAddress: string,
  isMainnet: boolean = true
): Promise<{ balance: bigint; formatted: string }> {
  try {
    const data = await getAccountBalances(stacksAddress, {
      network: isMainnet ? 'mainnet' : 'testnet',
    })

    // Find USDCx in fungible tokens
    const contracts = getContracts(isMainnet)
    const tokenId = `${contracts.token.address}.${contracts.token.name}::usdcx-token`

    const tokenBalance = data.fungible_tokens?.[tokenId]?.balance || '0'
    const balance = BigInt(tokenBalance)

    return {
      balance,
      formatted: fromMicroUsdcx(balance).toFixed(2),
    }
  } catch (error) {
    console.error('Error fetching USDCx balance from API:', error)
    return { balance: BigInt(0), formatted: '0.00' }
  }
}
