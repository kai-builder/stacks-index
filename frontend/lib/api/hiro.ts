/**
 * Hiro API Client
 *
 * This client routes all Hiro API calls through our proxy endpoint
 * to prevent rate limiting and hide API keys from the frontend.
 */

export interface HiroApiOptions {
  network?: 'mainnet' | 'testnet'
}

/**
 * Make a GET request to the Hiro API through our proxy
 */
export async function hiroGet<T>(
  path: string,
  options: HiroApiOptions = {}
): Promise<T> {
  const { network = 'mainnet' } = options
  const url = `/api/hiro?path=${encodeURIComponent(path)}&network=${network}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Hiro API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Make a POST request to the Hiro API through our proxy
 */
export async function hiroPost<T>(
  path: string,
  body: unknown,
  options: HiroApiOptions = {}
): Promise<T> {
  const { network = 'mainnet' } = options
  const url = `/api/hiro?path=${encodeURIComponent(path)}&network=${network}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Hiro API error: ${response.status}`)
  }

  return response.json()
}

// Common Hiro API response types
export interface BalancesResponse {
  stx: {
    balance: string
    total_sent: string
    total_received: string
    locked: string
  }
  fungible_tokens: Record<string, { balance: string }>
  non_fungible_tokens: Record<string, { count: number }>
}

export interface TransactionResponse {
  tx_id: string
  tx_status: 'pending' | 'success' | 'abort_by_response' | 'abort_by_post_condition'
  tx_type: string
  // ... other fields
}

export interface MempoolResponse {
  total: number
  results: TransactionResponse[]
}

/**
 * Get account balances from Hiro API
 */
export async function getAccountBalances(
  address: string,
  options: HiroApiOptions = {}
): Promise<BalancesResponse> {
  return hiroGet<BalancesResponse>(
    `/extended/v1/address/${address}/balances`,
    options
  )
}

/**
 * Get transaction status from Hiro API
 */
export async function getTransaction(
  txId: string,
  options: HiroApiOptions = {}
): Promise<TransactionResponse> {
  return hiroGet<TransactionResponse>(`/extended/v1/tx/${txId}`, options)
}

/**
 * Get mempool transactions for an address
 */
export async function getMempoolTransactions(
  address: string,
  options: HiroApiOptions = {}
): Promise<MempoolResponse> {
  return hiroGet<MempoolResponse>(
    `/extended/v1/address/${address}/mempool`,
    options
  )
}
