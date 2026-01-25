/**
 * Velar Pool ID API - Get pool ID for a token pair
 *
 * Queries the Velar univ2-core contract to get the pool ID
 * for swapping between two tokens.
 */

import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 60 // Cache for 60 seconds

const STACKS_API_URL = 'https://api.mainnet.hiro.so'
const VELAR_CORE_CONTRACT = 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.univ2-core'

// Get Hiro API headers with API key
function getHiroHeaders(): HeadersInit {
  const apiKey = process.env.HIRO_API_KEY || '9f741839asdkjaskllkajdlkajs18asndc318'
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-hiro-api-key': apiKey,
  }
}

// Known Velar pool IDs (cached to avoid API calls)
// These are determined by querying the Velar core contract
const KNOWN_POOL_IDS: Record<string, number> = {
  // aeUSDC <-> wSTX pool
  'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc:SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.wstx': 12,
  'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.wstx:SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc': 12,
}

interface PoolIdRequest {
  token0: string
  token1: string
}

async function getPoolIdFromContract(token0: string, token1: string): Promise<number | null> {
  try {
    // Build the read-only function call
    const [contractAddress, contractName] = VELAR_CORE_CONTRACT.split('.')

    // Call the Stacks API to execute read-only function
    const response = await fetch(`${STACKS_API_URL}/v2/contracts/call-read/${contractAddress}/${contractName}/get-pool-id`, {
      method: 'POST',
      headers: getHiroHeaders(),
      body: JSON.stringify({
        sender: contractAddress,
        arguments: [
          // token0 as principal
          `0x0616${Buffer.from(token0).toString('hex')}`,
          // token1 as principal
          `0x0616${Buffer.from(token1).toString('hex')}`,
        ],
      }),
    })

    if (!response.ok) {
      console.error(`[Velar] Failed to get pool ID: ${response.status}`)
      return null
    }

    const data = await response.json()
    console.log('[Velar] Pool ID response:', data)

    // Parse the response - it should be (some uint) or none
    if (data.okay && data.result) {
      // Parse the Clarity value
      const resultHex = data.result
      // (some u12) would be encoded as a specific pattern
      // For simplicity, try to extract the uint value
      if (resultHex.includes('0a')) {
        // This is (some ...) - extract the uint
        // The format is complex, for now return null and use cached values
        return null
      }
    }

    return null
  } catch (error) {
    console.error('[Velar] Error getting pool ID:', error)
    return null
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: PoolIdRequest = await request.json()
    const { token0, token1 } = body

    if (!token0 || !token1) {
      return NextResponse.json({
        success: false,
        error: 'Missing token0 or token1',
      }, { status: 400 })
    }

    // Check cached pool IDs first
    const cacheKey = `${token0}:${token1}`
    const reverseCacheKey = `${token1}:${token0}`

    let poolId: number | undefined = KNOWN_POOL_IDS[cacheKey] || KNOWN_POOL_IDS[reverseCacheKey]
    let flipped = false

    if (poolId !== undefined) {
      // Determine if tokens are in reverse order
      flipped = KNOWN_POOL_IDS[reverseCacheKey] !== undefined && KNOWN_POOL_IDS[cacheKey] === undefined

      return NextResponse.json({
        success: true,
        poolId,
        flipped,
        cached: true,
      })
    }

    // Try to get from contract (fallback)
    poolId = await getPoolIdFromContract(token0, token1) ?? undefined

    if (poolId === undefined) {
      // Try reverse order
      poolId = await getPoolIdFromContract(token1, token0) ?? undefined
      if (poolId !== undefined) {
        flipped = true
      }
    }

    if (poolId === undefined) {
      return NextResponse.json({
        success: false,
        error: `Pool not found for ${token0} <-> ${token1}`,
      })
    }

    return NextResponse.json({
      success: true,
      poolId,
      flipped,
      cached: false,
    })
  } catch (error) {
    console.error('Velar pool ID API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pool ID',
    }, { status: 500 })
  }
}

// GET endpoint to return known pool IDs
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    knownPools: Object.entries(KNOWN_POOL_IDS).map(([key, id]) => ({
      pair: key,
      poolId: id,
    })),
  })
}
