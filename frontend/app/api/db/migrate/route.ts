import { NextRequest, NextResponse } from "next/server"
import postgres from "postgres"

export const revalidate = 0

const migrationSql = `
-- Create contract_transactions table
CREATE TABLE IF NOT EXISTS contract_transactions (
  id SERIAL PRIMARY KEY,
  tx_id TEXT NOT NULL UNIQUE,
  function_name TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  tx_status TEXT NOT NULL,
  block_height INTEGER,
  block_time TIMESTAMPTZ,
  fee_rate TEXT,
  tx_result TEXT,
  tx_type TEXT NOT NULL,
  strategy_name TEXT,
  invested_amount BIGINT,
  received_amount BIGINT,
  sold_tokens JSONB,
  pool_id TEXT,
  pool_name TEXT,
  x_token_symbol TEXT,
  y_token_symbol TEXT,
  x_amount BIGINT,
  y_amount BIGINT,
  lp_tokens_received BIGINT,
  lp_tokens_burned BIGINT,
  x_amount_received BIGINT,
  y_amount_received BIGINT,
  error_code INTEGER,
  raw_tx JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for contract_transactions
CREATE INDEX IF NOT EXISTS contract_transactions_sender_address_idx ON contract_transactions(sender_address);
CREATE INDEX IF NOT EXISTS contract_transactions_block_time_idx ON contract_transactions(block_time);
CREATE INDEX IF NOT EXISTS contract_transactions_tx_type_idx ON contract_transactions(tx_type);
CREATE INDEX IF NOT EXISTS contract_transactions_function_name_idx ON contract_transactions(function_name);

-- Create user_lp_positions table
CREATE TABLE IF NOT EXISTS user_lp_positions (
  id SERIAL PRIMARY KEY,
  user_address TEXT NOT NULL,
  pool_contract TEXT NOT NULL,
  pool_name TEXT,
  lp_token_balance BIGINT NOT NULL DEFAULT 0,
  last_x_amount BIGINT,
  last_y_amount BIGINT,
  x_token_symbol TEXT,
  y_token_symbol TEXT,
  last_tx_id TEXT,
  last_updated_block INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_address, pool_contract)
);

-- Create indexes for user_lp_positions
CREATE INDEX IF NOT EXISTS user_lp_positions_user_address_idx ON user_lp_positions(user_address);
CREATE INDEX IF NOT EXISTS user_lp_positions_pool_contract_idx ON user_lp_positions(pool_contract);

-- Create indexer_state table
CREATE TABLE IF NOT EXISTS indexer_state (
  id TEXT PRIMARY KEY DEFAULT 'stacks-index',
  last_synced_block_height INTEGER,
  last_synced_block_time TIMESTAMPTZ,
  last_synced_tx_id TEXT,
  total_transactions_indexed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`

export async function GET(req: NextRequest) {
  // Only allow in development or with secret
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 })
  }

  const connectionString = databaseUrl.includes("sslmode=")
    ? databaseUrl
    : `${databaseUrl}${databaseUrl.includes("?") ? "&" : "?"}sslmode=disable`

  const sql = postgres(connectionString, {
    max: 1,
    ssl: false,
  })

  try {
    await sql.unsafe(migrationSql)
    await sql.end()

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully",
      tables: ["contract_transactions", "user_lp_positions", "indexer_state"],
    })
  } catch (error) {
    await sql.end()
    console.error("Migration failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Migration failed",
      },
      { status: 500 }
    )
  }
}
