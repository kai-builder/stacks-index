import { NextRequest, NextResponse } from "next/server"
import { eq, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import { userLpPositions } from "@/lib/db/schema"

export interface LpPosition {
  poolContract: string
  poolName: string
  lpTokenBalance: number
  xTokenSymbol: string
  yTokenSymbol: string
  lastXAmount: number
  lastYAmount: number
  lastTxId: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  try {
    // Fetch LP positions from database where balance > 0
    const positions = await db
      .select()
      .from(userLpPositions)
      .where(eq(userLpPositions.userAddress, address))

    // Filter positions with balance > 0 and transform
    const lpPositions: LpPosition[] = positions
      .filter((p) => p.lpTokenBalance && p.lpTokenBalance > BigInt(0))
      .map((p) => ({
        poolContract: p.poolContract,
        poolName: p.poolName || "Unknown Pool",
        lpTokenBalance: Number(p.lpTokenBalance),
        xTokenSymbol: p.xTokenSymbol || "?",
        yTokenSymbol: p.yTokenSymbol || "?",
        lastXAmount: p.lastXAmount ? Number(p.lastXAmount) : 0,
        lastYAmount: p.lastYAmount ? Number(p.lastYAmount) : 0,
        lastTxId: p.lastTxId || "",
      }))

    return NextResponse.json({
      positions: lpPositions,
      total: lpPositions.length,
    })
  } catch (error) {
    console.error("Failed to fetch LP positions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch LP positions" },
      { status: 500 }
    )
  }
}
