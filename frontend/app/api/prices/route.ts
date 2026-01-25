import { NextResponse } from "next/server";
import { TOKENS } from "@/lib/stacks/tokens";

// Cache for prices (30 seconds)
let priceCache: { data: Record<string, TokenPrice>; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds

interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
}

interface StacksAgentToken {
  contract_id: string;
  symbol: string;
  price_usd: number;
  price_change_1d: number;
}

interface StacksAgentResponse {
  success: boolean;
  data: StacksAgentToken[];
}

// Map our token symbols to search terms for the API
const TOKEN_SEARCH_MAP: Record<string, string> = {
  sBTC: "sbtc",
  stSTX: "ststx",
  WELSH: "welsh",
  LEO: "leo",
  DOG: "dog",
  USDh: "usdh",
  ALEX: "alex",
  VELAR: "velar",
  DROID: "droid",
};

// Fetch STX price from Hiro Explorer API
async function fetchSTXPrice(): Promise<TokenPrice> {
  try {
    const response = await fetch(
      "https://explorer.hiro.so/stxPrice?blockBurnTime=current",
      { next: { revalidate: 30 } }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.price) {
        return {
          symbol: "STX",
          price: data.price,
          change24h: 0, // Hiro API doesn't provide change data
        };
      }
    }
  } catch (error) {
    console.error("Error fetching STX price from Hiro:", error);
  }

  return { symbol: "STX", price: 0, change24h: 0 };
}

function getContractId(symbol: string): string {
  const token = TOKENS[symbol];
  if (!token) return "";
  return `${token.contractAddress}.${token.contractName}`;
}

async function fetchTokenPrice(
  searchTerm: string,
  contractId: string
): Promise<StacksAgentToken | null> {
  try {
    const response = await fetch(
      `https://stacksagent.com/api/tokens?page=1&size=20&sort=liquidity&order=desc&search=${searchTerm}`,
      { next: { revalidate: 30 } }
    );

    if (!response.ok) return null;

    const data: StacksAgentResponse = await response.json();
    if (!data.success || !data.data || data.data.length === 0) return null;

    const matchingToken = data.data.find(
      (t) => t.contract_id.toLowerCase() === contractId.toLowerCase()
    );

    return matchingToken || data.data[0];
  } catch (error) {
    console.error(`Error fetching price for ${searchTerm}:`, error);
    return null;
  }
}

async function fetchAllPrices(): Promise<Record<string, TokenPrice>> {
  const prices: Record<string, TokenPrice> = {};

  // USDCx is always pegged at $1
  prices["USDCx"] = { symbol: "USDCx", price: 1, change24h: 0 };

  // Fetch STX price from Hiro
  prices["STX"] = await fetchSTXPrice();

  // Fetch other token prices in parallel
  const fetchPromises = Object.entries(TOKEN_SEARCH_MAP).map(
    async ([symbol, searchTerm]) => {
      const contractId = getContractId(symbol);
      const tokenData = await fetchTokenPrice(searchTerm, contractId);

      if (tokenData) {
        prices[symbol] = {
          symbol: tokenData.symbol,
          price: tokenData.price_usd || 0,
          change24h: tokenData.price_change_1d || 0,
        };
      } else {
        prices[symbol] = { symbol, price: 0, change24h: 0 };
      }
    }
  );

  await Promise.all(fetchPromises);

  return prices;
}

export async function GET() {
  try {
    const now = Date.now();

    // Check cache
    if (priceCache && now - priceCache.timestamp < CACHE_DURATION) {
      return NextResponse.json(priceCache.data, {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      });
    }

    // Fetch fresh prices
    const prices = await fetchAllPrices();

    // Update cache
    priceCache = { data: prices, timestamp: now };

    return NextResponse.json(prices, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Failed to fetch prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
