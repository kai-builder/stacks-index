import { NextRequest, NextResponse } from 'next/server'

/**
 * Hiro API Proxy Route
 *
 * This route proxies all requests to the Hiro API with the API key
 * to prevent rate limiting and hide the API key from the frontend.
 *
 * Usage:
 * - GET: /api/hiro?path=/extended/v1/address/{address}/balances&network=mainnet
 * - POST: /api/hiro?path=/v2/contracts/call-read/...&network=mainnet (with body)
 */

// API keys - in production, use environment variables
const API_KEYS = [
  process.env.HIRO_API_KEY || 'your_hiro_api_key_here',
]

function getRandomApiKey(): string {
  return API_KEYS[Math.floor(Math.random() * API_KEYS.length)]
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-hiro-api-key': getRandomApiKey(),
  }
}

function getBaseUrl(network: string): string {
  if (network === 'testnet') {
    return 'https://api.testnet.hiro.so'
  }
  return 'https://api.hiro.so'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  const network = searchParams.get('network') || 'mainnet'

  if (!path) {
    return NextResponse.json({ error: 'path is required' }, { status: 400 })
  }

  const baseUrl = getBaseUrl(network)
  const url = `${baseUrl}${path}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Hiro API proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Hiro API' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  const network = searchParams.get('network') || 'mainnet'

  if (!path) {
    return NextResponse.json({ error: 'path is required' }, { status: 400 })
  }

  const baseUrl = getBaseUrl(network)
  const url = `${baseUrl}${path}`

  try {
    const body = await request.json()

    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Hiro API proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Hiro API' },
      { status: 500 }
    )
  }
}
