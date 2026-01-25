import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  unique,
  index,
  boolean,
  bigint,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

/**
 * Contract transactions table
 * Stores all transactions related to stacks-index contract
 */
export const contractTransactions = pgTable(
  "contract_transactions",
  {
    id: serial("id").primaryKey(),
    txId: text("tx_id").notNull().unique(),
    functionName: text("function_name").notNull(),
    senderAddress: text("sender_address").notNull(),
    txStatus: text("tx_status").notNull(), // 'success' | 'failed' | 'pending'
    blockHeight: integer("block_height"),
    blockTime: timestamp("block_time", { withTimezone: true }),
    feeRate: text("fee_rate"),
    txResult: text("tx_result"),

    // Transaction type categorization
    txType: text("tx_type").notNull(), // 'invest' | 'sell' | 'add-liquidity' | 'remove-liquidity' | 'other'

    // For invest transactions
    strategyName: text("strategy_name"),
    investedAmount: bigint("invested_amount", { mode: "bigint" }), // in micro units

    // For sell transactions
    receivedAmount: bigint("received_amount", { mode: "bigint" }), // in micro units
    soldTokens: jsonb("sold_tokens").$type<Record<string, string>>(), // token -> amount mapping

    // For add-liquidity transactions
    poolId: text("pool_id"),
    poolName: text("pool_name"),
    xTokenSymbol: text("x_token_symbol"),
    yTokenSymbol: text("y_token_symbol"),
    xAmount: bigint("x_amount", { mode: "bigint" }),
    yAmount: bigint("y_amount", { mode: "bigint" }),
    lpTokensReceived: bigint("lp_tokens_received", { mode: "bigint" }),

    // For remove-liquidity transactions
    lpTokensBurned: bigint("lp_tokens_burned", { mode: "bigint" }),
    xAmountReceived: bigint("x_amount_received", { mode: "bigint" }),
    yAmountReceived: bigint("y_amount_received", { mode: "bigint" }),

    // Error tracking
    errorCode: integer("error_code"),

    // Raw transaction data for reference
    rawTx: jsonb("raw_tx").$type<unknown>(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    senderAddressIdx: index("contract_transactions_sender_address_idx").on(table.senderAddress),
    blockTimeIdx: index("contract_transactions_block_time_idx").on(table.blockTime),
    txTypeIdx: index("contract_transactions_tx_type_idx").on(table.txType),
    functionNameIdx: index("contract_transactions_function_name_idx").on(table.functionName),
  })
)

/**
 * User LP positions table
 * Tracks user LP token balances across pools
 */
export const userLpPositions = pgTable(
  "user_lp_positions",
  {
    id: serial("id").primaryKey(),
    userAddress: text("user_address").notNull(),
    poolContract: text("pool_contract").notNull(), // e.g., SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-stx-v-1-1
    poolName: text("pool_name"), // e.g., sBTC-STX-LP
    lpTokenBalance: bigint("lp_token_balance", { mode: "bigint" }).notNull().default(sql`0`),

    // Track amounts for display
    lastXAmount: bigint("last_x_amount", { mode: "bigint" }),
    lastYAmount: bigint("last_y_amount", { mode: "bigint" }),
    xTokenSymbol: text("x_token_symbol"),
    yTokenSymbol: text("y_token_symbol"),

    // Last transaction info
    lastTxId: text("last_tx_id"),
    lastUpdatedBlock: integer("last_updated_block"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserPool: unique("user_lp_positions_user_pool_unique").on(
      table.userAddress,
      table.poolContract
    ),
    userAddressIdx: index("user_lp_positions_user_address_idx").on(table.userAddress),
    poolContractIdx: index("user_lp_positions_pool_contract_idx").on(table.poolContract),
  })
)

/**
 * Indexer state table
 * Tracks the last indexed position for incremental syncing
 */
export const indexerState = pgTable("indexer_state", {
  id: text("id").primaryKey().default("stacks-index"),
  lastSyncedBlockHeight: integer("last_synced_block_height"),
  lastSyncedBlockTime: timestamp("last_synced_block_time", { withTimezone: true }),
  lastSyncedTxId: text("last_synced_tx_id"),
  totalTransactionsIndexed: integer("total_transactions_indexed").default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// Type exports
export type ContractTransaction = typeof contractTransactions.$inferSelect
export type NewContractTransaction = typeof contractTransactions.$inferInsert
export type UserLpPosition = typeof userLpPositions.$inferSelect
export type IndexerState = typeof indexerState.$inferSelect
