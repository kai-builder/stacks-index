import { NextRequest, NextResponse } from 'next/server'
import { cvToJSON, principalCV, hexToCV, cvToHex } from '@stacks/transactions'
import { STACKS_INDEX_CONTRACT } from '@/lib/stacks/contract'

// Get Hiro API headers with API key
function getHiroHeaders(): HeadersInit {
  const apiKey = process.env.HIRO_API_KEY || '9f741839asdkjaskllkajdlkajs18asndc318'
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-hiro-api-key': apiKey,
  }
}

// Parse Clarity uint from JSON response
function parseUint(value: unknown): number {
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return parseInt((value as { value: string }).value, 10)
  }
  if (typeof value === 'string') {
    return parseInt(value, 10)
  }
  if (typeof value === 'number') {
    return value
  }
  return 0
}

// Parse Clarity bool from JSON response
function parseBool(value: unknown): boolean {
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return (value as { value: boolean }).value === true
  }
  if (typeof value === 'boolean') {
    return value
  }
  return false
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const network = searchParams.get('network') || 'mainnet'

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  try {
    const baseUrl = network === 'mainnet'
      ? 'https://api.mainnet.hiro.so'
      : 'https://api.testnet.hiro.so'

    // Prepare the principal argument as hex-encoded Clarity value
    const principalArg = cvToHex(principalCV(address))

    // Fetch user stats
    const statsResponse = await fetch(
      `${baseUrl}/v2/contracts/call-read/${STACKS_INDEX_CONTRACT.address}/${STACKS_INDEX_CONTRACT.name}/get-user-stats`,
      {
        method: 'POST',
        headers: getHiroHeaders(),
        body: JSON.stringify({
          sender: address,
          arguments: [principalArg],
        }),
      }
    )

    if (!statsResponse.ok) {
      throw new Error(`Failed to fetch user stats: ${statsResponse.status}`)
    }

    const statsData = await statsResponse.json()

    // Fetch user P&L
    const pnlResponse = await fetch(
      `${baseUrl}/v2/contracts/call-read/${STACKS_INDEX_CONTRACT.address}/${STACKS_INDEX_CONTRACT.name}/get-user-pnl`,
      {
        method: 'POST',
        headers: getHiroHeaders(),
        body: JSON.stringify({
          sender: address,
          arguments: [principalArg],
        }),
      }
    )

    if (!pnlResponse.ok) {
      throw new Error(`Failed to fetch user P&L: ${pnlResponse.status}`)
    }

    const pnlData = await pnlResponse.json()

    // Parse stats response
    let stats = null
    let pnl = null

    if (statsData.okay && statsData.result) {
      const statsCV = hexToCV(statsData.result)
      const statsJSON = cvToJSON(statsCV)

      if (statsJSON && typeof statsJSON === 'object' && 'value' in statsJSON) {
        const v = statsJSON.value as Record<string, unknown>
        stats = {
          totalInvested: parseUint(v['total-invested']),
          totalWithdrawn: parseUint(v['total-withdrawn']),
          investCount: parseUint(v['invest-count']),
          sellCount: parseUint(v['sell-count']),
        }
      }
    }

    if (pnlData.okay && pnlData.result) {
      const pnlCV = hexToCV(pnlData.result)
      const pnlJSON = cvToJSON(pnlCV)

      if (pnlJSON && typeof pnlJSON === 'object' && 'value' in pnlJSON) {
        const v = pnlJSON.value as Record<string, unknown>
        pnl = {
          invested: parseUint(v['invested']),
          withdrawn: parseUint(v['withdrawn']),
          profit: parseUint(v['profit']),
          loss: parseUint(v['loss']),
          isProfit: parseBool(v['is-profit']),
        }
      }
    }

    return NextResponse.json({ stats, pnl })
  } catch (error) {
    console.error('Failed to fetch user stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
