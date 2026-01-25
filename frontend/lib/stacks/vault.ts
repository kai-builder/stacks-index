import {
  uintCV,
  boolCV,
  principalCV,
  PostConditionMode,
  AnchorMode,
  cvToJSON,
  ClarityValue,
  Pc,
  cvToHex,
  hexToCV,
} from '@stacks/transactions'
import { openContractCall } from '@stacks/connect'
import { toBasisPoints, Allocation } from '@/lib/store/allocation'
import { getTransaction } from '@/lib/api/hiro'

// ============================================
// Contract Configuration
// ============================================

export const VAULT_CONTRACTS = {
  mainnet: {
    address: 'SP...', // TODO: Update after deployment
    name: 'stacks-index-vault',
  },
  testnet: {
    address: 'ST...', // TODO: Update after deployment
    name: 'stacks-index-vault',
  },
}

export const USDCX_CONTRACTS = {
  mainnet: {
    address: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE',
    name: 'usdcx',
  },
  testnet: {
    address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    name: 'usdcx',
  },
}

// ============================================
// Types
// ============================================

export interface UserPosition {
  totalDepositedUsdcx: number
  pendingUsdcx: number
  sbtcBalance: number
  ststxBalance: number
  stxBalance: number
  depositCount: number
  lastDepositBlock: number
}

export interface UserAllocation {
  sbtcPct: number
  ststxPct: number
  stxPct: number
}

export interface PendingDeposit {
  usdcxAmount: number
  createdAt: number
  invested: boolean
}

export interface ProtocolStats {
  totalDeposits: number
  totalUsers: number
  paused: boolean
}

export interface VaultTxResult {
  txId: string
  status: 'pending' | 'success' | 'failed'
}

export interface DepositResult extends VaultTxResult {
  depositId: number
  amount: number
}

export interface InvestResult extends VaultTxResult {
  sbtcReceived: number
  ststxReceived: number
  stxReceived: number
}

// ============================================
// Helper Functions
// ============================================

function getNetwork(isMainnet: boolean = true) {
  return isMainnet ? 'mainnet' : 'testnet'
}

function getApiBaseUrl(isMainnet: boolean = true): string {
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

function getVaultContract(isMainnet: boolean = true) {
  return isMainnet ? VAULT_CONTRACTS.mainnet : VAULT_CONTRACTS.testnet
}

function getUsdcxContract(isMainnet: boolean = true) {
  return isMainnet ? USDCX_CONTRACTS.mainnet : USDCX_CONTRACTS.testnet
}

// Convert micro units to display (6 decimals for USDCx)
export function fromMicroUnits(amount: number, decimals: number = 6): number {
  return amount / Math.pow(10, decimals)
}

// Convert display to micro units
export function toMicroUnits(amount: number, decimals: number = 6): number {
  return Math.floor(amount * Math.pow(10, decimals))
}

// ============================================
// Read-Only Functions
// ============================================

/**
 * Get user's current position in the vault
 */
export async function getUserPosition(
  stacksAddress: string,
  isMainnet: boolean = true
): Promise<UserPosition> {
  const vault = getVaultContract(isMainnet)
  const network = getNetwork(isMainnet)

  try {
    const result = await callReadOnlyFunction({
      contractAddress: vault.address,
      contractName: vault.name,
      functionName: 'get-user-position',
      functionArgs: [principalCV(stacksAddress)],
      senderAddress: stacksAddress,
      isMainnet,
    })

    const json = cvToJSON(result)
    const value = json.value

    return {
      totalDepositedUsdcx: parseInt(value['total-deposited-usdcx'].value),
      pendingUsdcx: parseInt(value['pending-usdcx'].value),
      sbtcBalance: parseInt(value['sbtc-balance'].value),
      ststxBalance: parseInt(value['ststx-balance'].value),
      stxBalance: parseInt(value['stx-balance'].value),
      depositCount: parseInt(value['deposit-count'].value),
      lastDepositBlock: parseInt(value['last-deposit-block'].value),
    }
  } catch (error) {
    console.error('Error fetching user position:', error)
    return {
      totalDepositedUsdcx: 0,
      pendingUsdcx: 0,
      sbtcBalance: 0,
      ststxBalance: 0,
      stxBalance: 0,
      depositCount: 0,
      lastDepositBlock: 0,
    }
  }
}

/**
 * Get user's allocation settings
 */
export async function getUserAllocation(
  stacksAddress: string,
  isMainnet: boolean = true
): Promise<UserAllocation> {
  const vault = getVaultContract(isMainnet)
  const network = getNetwork(isMainnet)

  try {
    const result = await callReadOnlyFunction({
      contractAddress: vault.address,
      contractName: vault.name,
      functionName: 'get-user-allocation',
      functionArgs: [principalCV(stacksAddress)],
      senderAddress: stacksAddress,
      isMainnet,
    })

    const json = cvToJSON(result)
    const value = json.value

    return {
      sbtcPct: parseInt(value['sbtc-pct'].value),
      ststxPct: parseInt(value['ststx-pct'].value),
      stxPct: parseInt(value['stx-pct'].value),
    }
  } catch (error) {
    console.error('Error fetching user allocation:', error)
    // Return default allocation
    return {
      sbtcPct: 4000,
      ststxPct: 4000,
      stxPct: 2000,
    }
  }
}

/**
 * Get pending deposit details
 */
export async function getPendingDeposit(
  stacksAddress: string,
  depositId: number,
  isMainnet: boolean = true
): Promise<PendingDeposit | null> {
  const vault = getVaultContract(isMainnet)
  const network = getNetwork(isMainnet)

  try {
    const result = await callReadOnlyFunction({
      contractAddress: vault.address,
      contractName: vault.name,
      functionName: 'get-pending-deposit',
      functionArgs: [principalCV(stacksAddress), uintCV(depositId)],
      senderAddress: stacksAddress,
      isMainnet,
    })

    const json = cvToJSON(result)
    if (json.value === null) return null

    const value = json.value
    return {
      usdcxAmount: parseInt(value['usdcx-amount'].value),
      createdAt: parseInt(value['created-at'].value),
      invested: value['invested'].value,
    }
  } catch (error) {
    console.error('Error fetching pending deposit:', error)
    return null
  }
}

/**
 * Get protocol stats
 */
export async function getProtocolStats(
  isMainnet: boolean = true
): Promise<ProtocolStats> {
  const vault = getVaultContract(isMainnet)
  const network = getNetwork(isMainnet)

  try {
    const result = await callReadOnlyFunction({
      contractAddress: vault.address,
      contractName: vault.name,
      functionName: 'get-protocol-stats',
      functionArgs: [],
      senderAddress: vault.address,
      isMainnet,
    })

    const json = cvToJSON(result)
    const value = json.value

    return {
      totalDeposits: parseInt(value['total-deposits'].value),
      totalUsers: parseInt(value['total-users'].value),
      paused: value['paused'].value,
    }
  } catch (error) {
    console.error('Error fetching protocol stats:', error)
    return {
      totalDeposits: 0,
      totalUsers: 0,
      paused: false,
    }
  }
}

/**
 * Check if relayer is authorized
 */
export async function isRelayerAuthorized(
  relayerAddress: string,
  isMainnet: boolean = true
): Promise<boolean> {
  const vault = getVaultContract(isMainnet)

  try {
    const result = await callReadOnlyFunction({
      contractAddress: vault.address,
      contractName: vault.name,
      functionName: 'is-relayer-authorized',
      functionArgs: [principalCV(relayerAddress)],
      senderAddress: relayerAddress,
      isMainnet,
    })

    const json = cvToJSON(result)
    return json.value === true
  } catch (error) {
    console.error('Error checking relayer authorization:', error)
    return false
  }
}

// ============================================
// Write Functions (User Operations)
// ============================================

/**
 * Set user's custom allocation
 */
export async function setUserAllocation(
  allocation: Allocation,
  isMainnet: boolean = true
): Promise<VaultTxResult> {
  const vault = getVaultContract(isMainnet)
  const network = getNetwork(isMainnet)

  const sbtcBps = toBasisPoints(allocation.sbtc)
  const ststxBps = toBasisPoints(allocation.ststx)
  const stxBps = toBasisPoints(allocation.stx)

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress: vault.address,
      contractName: vault.name,
      functionName: 'set-user-allocation',
      functionArgs: [uintCV(sbtcBps), uintCV(ststxBps), uintCV(stxBps)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data) => {
        resolve({ txId: data.txId, status: 'pending' })
      },
      onCancel: () => {
        reject(new Error('Transaction cancelled by user'))
      },
    })
  })
}

/**
 * Deposit USDCx into vault
 */
export async function depositUsdcx(
  amount: number,
  stacksAddress: string,
  isMainnet: boolean = true
): Promise<VaultTxResult> {
  const vault = getVaultContract(isMainnet)
  const usdcx = getUsdcxContract(isMainnet)
  const network = getNetwork(isMainnet)
  const microAmount = toMicroUnits(amount)

  // Post-conditions: user sends exact USDCx amount
  const postConditions = [
    Pc.principal(stacksAddress)
      .willSendEq(microAmount)
      .ft(`${usdcx.address}.${usdcx.name}`, 'usdcx-token'),
  ]

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress: vault.address,
      contractName: vault.name,
      functionName: 'deposit-usdcx',
      functionArgs: [uintCV(microAmount)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Deny,
      postConditions,
      onFinish: (data) => {
        resolve({ txId: data.txId, status: 'pending' })
      },
      onCancel: () => {
        reject(new Error('Transaction cancelled by user'))
      },
    })
  })
}

/**
 * User manually invests their pending deposit
 */
export async function investMyDeposit(
  depositId: number,
  minSbtcOut: number,
  minStstxOut: number,
  minStxOut: number,
  isMainnet: boolean = true
): Promise<VaultTxResult> {
  const vault = getVaultContract(isMainnet)
  const network = getNetwork(isMainnet)

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress: vault.address,
      contractName: vault.name,
      functionName: 'invest-my-deposit',
      functionArgs: [
        uintCV(depositId),
        uintCV(minSbtcOut),
        uintCV(minStstxOut),
        uintCV(minStxOut),
      ],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow, // Allow for DEX swaps
      onFinish: (data) => {
        resolve({ txId: data.txId, status: 'pending' })
      },
      onCancel: () => {
        reject(new Error('Transaction cancelled by user'))
      },
    })
  })
}

/**
 * Withdraw position
 */
export async function withdraw(
  percentage: number, // 0-100
  convertToUsdcx: boolean,
  isMainnet: boolean = true
): Promise<VaultTxResult> {
  const vault = getVaultContract(isMainnet)
  const network = getNetwork(isMainnet)
  const basisPoints = toBasisPoints(percentage)

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress: vault.address,
      contractName: vault.name,
      functionName: 'withdraw',
      functionArgs: [uintCV(basisPoints), boolCV(convertToUsdcx)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow, // Allow for variable amounts
      onFinish: (data) => {
        resolve({ txId: data.txId, status: 'pending' })
      },
      onCancel: () => {
        reject(new Error('Transaction cancelled by user'))
      },
    })
  })
}

/**
 * Withdraw pending USDCx (not yet invested)
 */
export async function withdrawPending(
  depositId: number,
  isMainnet: boolean = true
): Promise<VaultTxResult> {
  const vault = getVaultContract(isMainnet)
  const network = getNetwork(isMainnet)

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress: vault.address,
      contractName: vault.name,
      functionName: 'withdraw-pending',
      functionArgs: [uintCV(depositId)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        resolve({ txId: data.txId, status: 'pending' })
      },
      onCancel: () => {
        reject(new Error('Transaction cancelled by user'))
      },
    })
  })
}

// ============================================
// Combined Operations
// ============================================

/**
 * Set allocation and deposit in sequence
 * Used when user has custom allocation that needs to be saved first
 */
export async function setAllocationAndDeposit(
  allocation: Allocation,
  amount: number,
  stacksAddress: string,
  isMainnet: boolean = true
): Promise<{ allocationTxId: string; depositTxId: string }> {
  // First, set the allocation
  const allocationResult = await setUserAllocation(allocation, isMainnet)

  // Then deposit
  const depositResult = await depositUsdcx(amount, stacksAddress, isMainnet)

  return {
    allocationTxId: allocationResult.txId,
    depositTxId: depositResult.txId,
  }
}

// ============================================
// Transaction Status Helpers
// ============================================

/**
 * Build Hiro Explorer URL for a transaction
 */
export function getExplorerUrl(txId: string, isMainnet: boolean = true): string {
  const baseUrl = isMainnet
    ? 'https://explorer.hiro.so/txid'
    : 'https://explorer.hiro.so/txid'
  const network = isMainnet ? 'mainnet' : 'testnet'
  return `${baseUrl}/${txId}?chain=${network}`
}

/**
 * Build API URL for checking transaction status
 */
export function getTransactionApiUrl(
  txId: string,
  isMainnet: boolean = true
): string {
  const baseUrl = isMainnet
    ? 'https://api.hiro.so'
    : 'https://api.testnet.hiro.so'
  return `${baseUrl}/extended/v1/tx/${txId}`
}

/**
 * Check transaction status
 */
export async function checkTransactionStatus(
  txId: string,
  isMainnet: boolean = true
): Promise<'pending' | 'success' | 'failed'> {
  try {
    const data = await getTransaction(txId, {
      network: isMainnet ? 'mainnet' : 'testnet',
    })

    if (data.tx_status === 'success') return 'success'
    if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
      return 'failed'
    }
    return 'pending'
  } catch (error) {
    console.error('Error checking transaction status:', error)
    return 'pending'
  }
}
