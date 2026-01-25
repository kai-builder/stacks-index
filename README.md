# StacksIndex - The First Index Fund for Stacks DeFi

StacksIndex is a production-ready, one-click investment platform that simplifies diversified exposure to the Stacks Bitcoin L2 ecosystem.

Users deposit USDCx and instantly receive a diversified basket of Stacks tokens - without navigating multiple DEXs, researching tokens, or managing complex positions.

**StacksIndex is the first native index fund built specifically for the Stacks ecosystem.**

- **Video Intro**: https://www.youtube.com/watch?v=73y94jyzecU
- **Live Mainnet**: https://stacksindex.com/
- **Smart Contracts**: https://github.com/kai-builder/stacks-index/blob/main/contract/stacks-index-oneclick.clar
- **Contract Explorer**: https://explorer.hiro.so/txid/SP2QGQ3R0RH96SEGEV6YBK8QDPF7CQ0ATC2E7FH67.stacks-index-oneclick-beta?chain=mainnet

---

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database
- Stacks wallet (Leather or Xverse) for testing

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kai-builder/stacks-index.git
   cd stacks-index/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in your credentials (see [Environment Variables](#environment-variables) below).

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Bitflow DEX API Keys
# Get your API keys from https://bitflow.finance
BITFLOW_API_KEY=your_bitflow_api_key_here
BITFLOW_READONLY_API_KEY=your_bitflow_readonly_api_key_here

# Hiro API Key
# Get your API key from https://platform.hiro.so
HIRO_API_KEY=your_hiro_api_key_here

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/stacksindex

# Cron Secret (for scheduled jobs)
CRON_SECRET=your_cron_secret_here

# Optional: Next.js public URL (for production)
# NEXT_PUBLIC_API_URL=https://your-domain.com
```

#### Getting API Keys

| Service | URL | Purpose |
|---------|-----|---------|
| Bitflow | https://bitflow.finance | DEX routing & swaps |
| Hiro | https://platform.hiro.so | Stacks blockchain API |

---

## The Problem

Users bridging USDCx to Stacks face a fragmented, overwhelming DeFi landscape:

- **Research Overhead**: Must research which tokens to buy (sBTC? STX? stSTX? Memecoins?)
- **DEX Navigation**: Need to navigate 3+ different DEXs (Velar, Alex, Bitflow) with different interfaces
- **Multiple Transactions**: Execute 4-6 separate swaps, paying gas each time
- **Position Management**: Track multiple positions across different wallets and dashboards
- **Exit Complexity**: Selling requires reversing all swaps manually

The result? Most new users either stick with USDCx (missing upside) or buy just one token (missing diversification).

---

## The Solution: 4 Revolutionary Innovations

### 1. One-Click Diversified Investment

**Traditional Flow (5-10 minutes):**
```
USDCx → Research tokens → Find best DEX → Swap to sBTC → Find another DEX
→ Swap to STX → Find third DEX → Swap to stSTX → Track 3 positions
```

**StacksIndex Flow (30 seconds):**
```
USDCx → Choose Strategy → Sign 1 Transaction → Portfolio Created ✓
```

One transaction. One signature. Instant diversification.

### 2. Four Investment Strategies

| Strategy | Allocation | Target |
|----------|------------|--------|
| **Bitcoin Maxi** | 60% sBTC, 40% STX | BTC believers |
| **DeFi Yield** | 30% USDh, 25% sBTC, 25% STX, 20% stSTX | Yield seekers |
| **Stacks Believer** | 35% ALEX, 35% VELAR, 30% STX | Ecosystem bulls |
| **Meme Hunter** | 30% WELSH, 30% LEO, 25% DOG, 15% DROID | Degens |

### 3. On-Chain P&L Tracking

Every investment and withdrawal is recorded on-chain:

```clarity
(map user-stats principal
  {
    total-invested: uint,
    total-withdrawn: uint,
    invest-count: uint,
    sell-count: uint
  })
```

- **Transparent**: Query your P&L anytime via `get-user-pnl`
- **Permanent**: No centralized database - your records live on Bitcoin
- **Trustless**: Calculate profit = total-withdrawn - total-invested

### 4. One-Click Withdrawal

Exit your entire position with a single transaction:
- Proportionally sells all basket assets
- Converts back to USDCx
- Atomic execution (all-or-nothing)
- Supports partial exits (20%, 50%, 100%)

---

## Technical Architecture

### Smart Contract Layer (Clarity)

**Contract**: `SP2QGQ3R0RH96SEGEV6YBK8QDPF7CQ0ATC2E7FH67.stacks-index-oneclick-beta`

**Core Functions:**
```clarity
;; Investment functions (one per strategy)
(define-public (invest-bitcoin-maxi (amount-in uint) (min-sbtc uint) (min-stx uint)))
(define-public (invest-defi-yield (amount-in uint) (...)))
(define-public (invest-meme-hunter (amount-in uint) (...)))
(define-public (invest-stacks-believer (amount-in uint) (...)))

;; Withdrawal
(define-public (sell-holdings (percentage uint)))

;; Read functions
(define-read-only (get-user-stats (user principal)))
(define-read-only (get-user-pnl (user principal)))
```

**Key Design Decisions:**
- **No Vault Architecture**: Contract orchestrates swaps but never holds user funds
- **Atomic Execution**: All swaps succeed or all revert - no partial fills
- **Direct AMM Calls**: Bypasses router overhead for better execution
- **On-Chain Stats**: Permanent record of all investments and withdrawals

### AMM Integration (Multi-DEX Routing)

StacksIndex integrates with all major Stacks DEXs: **Bitflow, Velar, Alex**

Quote Engine: Frontend fetches live quotes from Velar/Alex SDKs (no API keys required), ensuring users always get the best available price.

### Frontend Application (Next.js 14)

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 + React 18 + TypeScript |
| Styling | Tailwind CSS + Glassmorphism design |
| State | Zustand |
| Wallet | @stacks/connect (Leather, Xverse) |
| Charts | Recharts |
| Data | TanStack React Query |
| Blockchain | @stacks/transactions |
| AMM SDKs | @velarprotocol/velar-sdk, alex-sdk, @bitflowlabs/core-sdk |

---

## Token Support

| Token | Description | Contract |
|-------|-------------|----------|
| USDCx | USD Coin (Bridged) | `SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-susdc` |
| sBTC | Bitcoin on Stacks | `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token` |
| STX | Stacks native token | Native |
| stSTX | Liquid staked STX | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token` |
| USDh | Hermetica stablecoin | `SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.usdh-token-v1` |
| WELSH | Welshcorgicoin | `SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token` |
| LEO | Leopold's cat | `SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6.leo-token` |
| DOG | DOGGOTOTHEMOON | `SP14NS8MVBRHXMM96BQY0727AJ59SWPV7RMHC0NCG.pontis-bridge-DOG` |
| ALEX | Alex governance | `SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex` |
| VELAR | Velar DEX token | `SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.velar-token` |

---

## Try It Now

1. Visit https://stacksindex.com/
2. Connect your Stacks wallet (Leather or Xverse)
3. Ensure you have USDCx balance
4. Choose a strategy (Bitcoin Maxi, DeFi Yield, Stacks Believer, or Meme Hunter)
5. Enter amount and review allocation preview
6. Sign the transaction
7. View your portfolio dashboard with real-time values
8. Withdraw anytime with one click

---

## Roadmap

### MVP (Current - v50)
- [x] 4 investment strategies
- [x] One-click invest/withdraw
- [x] On-chain P&L tracking
- [x] Real-time portfolio dashboard
- [x] Multi-DEX integration

### V2 (Next)
- [ ] Custom allocation ratios
- [ ] Transaction history UI
- [ ] Position import (bring existing tokens)
- [ ] Backend persistence (PostgreSQL)

### V3 (Future)
- [ ] Auto-rebalancing
- [ ] Zest protocol integration (sBTC yield)
- [ ] LP position support
- [ ] Deploy DeFi like stacking, liquid stacking with user's portfolio

---

## Open Source

- Full codebase available on GitHub
- MIT License - fork, modify, contribute
- Community contributions welcome

---

## Links

- **Live Mainnet**: https://stacksindex.com/
- **Video Demo**: https://youtu.be/-5VQ_USqQnY
- **Contract Explorer**: [View on Hiro Explorer](https://explorer.hiro.so/txid/SP2QGQ3R0RH96SEGEV6YBK8QDPF7CQ0ATC2E7FH67.stacks-index-oneclick-beta?chain=mainnet)

---

*"The index fund for Stacks DeFi. Diversified exposure. One click."*

Built with love on Stacks
