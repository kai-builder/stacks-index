-- StacksIndex Relayer Database Schema
-- Used to track pending bridge deposits and auto-investments

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PENDING INVESTMENTS TABLE
-- ============================================
-- Tracks deposits waiting for bridge completion and auto-invest

CREATE TABLE pending_invests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User identification
  user_stacks_address TEXT NOT NULL,
  user_eth_address TEXT NOT NULL,

  -- Deposit details
  usdcx_amount BIGINT NOT NULL,           -- Amount in micro-units (6 decimals)
  eth_tx_hash TEXT NOT NULL UNIQUE,       -- Ethereum deposit transaction hash

  -- Allocation (basis points)
  sbtc_pct INTEGER NOT NULL DEFAULT 4000,  -- 40%
  ststx_pct INTEGER NOT NULL DEFAULT 4000, -- 40%
  stx_pct INTEGER NOT NULL DEFAULT 2000,   -- 20%

  -- Status tracking
  bridge_status TEXT NOT NULL DEFAULT 'pending',
  -- Values: 'pending', 'confirming', 'attesting', 'minting', 'completed', 'failed'

  invest_status TEXT NOT NULL DEFAULT 'waiting',
  -- Values: 'waiting', 'ready', 'processing', 'completed', 'failed', 'manual'

  -- Transaction hashes
  stacks_mint_tx_hash TEXT,               -- USDCx mint transaction on Stacks
  invest_tx_hash TEXT,                     -- Investment transaction on Stacks

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bridge_completed_at TIMESTAMP WITH TIME ZONE,
  invested_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Constraints
  CONSTRAINT valid_allocation CHECK (sbtc_pct + ststx_pct + stx_pct = 10000),
  CONSTRAINT valid_bridge_status CHECK (bridge_status IN ('pending', 'confirming', 'attesting', 'minting', 'completed', 'failed')),
  CONSTRAINT valid_invest_status CHECK (invest_status IN ('waiting', 'ready', 'processing', 'completed', 'failed', 'manual'))
);

-- Indexes for efficient queries
CREATE INDEX idx_pending_invests_stacks_address ON pending_invests(user_stacks_address);
CREATE INDEX idx_pending_invests_eth_address ON pending_invests(user_eth_address);
CREATE INDEX idx_pending_invests_bridge_status ON pending_invests(bridge_status);
CREATE INDEX idx_pending_invests_invest_status ON pending_invests(invest_status);
CREATE INDEX idx_pending_invests_created_at ON pending_invests(created_at);

-- ============================================
-- USER ALLOCATIONS TABLE (CACHE)
-- ============================================
-- Caches user allocations from contract for faster access

CREATE TABLE user_allocations (
  stacks_address TEXT PRIMARY KEY,
  sbtc_pct INTEGER NOT NULL DEFAULT 4000,
  ststx_pct INTEGER NOT NULL DEFAULT 4000,
  stx_pct INTEGER NOT NULL DEFAULT 2000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_allocation CHECK (sbtc_pct + ststx_pct + stx_pct = 10000)
);

-- ============================================
-- RELAYER TRANSACTIONS TABLE
-- ============================================
-- Audit log of all relayer-executed transactions

CREATE TABLE relayer_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pending_invest_id UUID REFERENCES pending_invests(id),

  -- Transaction details
  tx_type TEXT NOT NULL, -- 'invest', 'retry', 'manual_trigger'
  tx_hash TEXT NOT NULL,

  -- Gas tracking
  gas_used BIGINT,
  gas_price BIGINT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- Values: 'pending', 'confirmed', 'failed'

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,

  -- Error tracking
  error_message TEXT
);

CREATE INDEX idx_relayer_transactions_pending_invest ON relayer_transactions(pending_invest_id);
CREATE INDEX idx_relayer_transactions_status ON relayer_transactions(status);

-- ============================================
-- BRIDGE MONITORING TABLE
-- ============================================
-- Tracks Circle attestation service polling

CREATE TABLE bridge_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eth_tx_hash TEXT NOT NULL,

  -- Monitoring status
  last_check_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_count INTEGER DEFAULT 0,

  -- Circle attestation details
  attestation_status TEXT,
  attestation_hash TEXT,

  -- Result
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_bridge_monitoring_eth_tx ON bridge_monitoring(eth_tx_hash);
CREATE INDEX idx_bridge_monitoring_completed ON bridge_monitoring(completed);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to pending_invests
CREATE TRIGGER update_pending_invests_updated_at
    BEFORE UPDATE ON pending_invests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE QUERIES
-- ============================================

-- Get all pending investments ready for auto-invest
-- SELECT * FROM pending_invests
-- WHERE bridge_status = 'completed' AND invest_status = 'waiting';

-- Get user's pending investments
-- SELECT * FROM pending_invests
-- WHERE user_stacks_address = 'SP...'
-- ORDER BY created_at DESC;

-- Get failed investments for retry
-- SELECT * FROM pending_invests
-- WHERE invest_status = 'failed' AND retry_count < 3;
