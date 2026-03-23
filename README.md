# FoodLink 🌿

**Decentralized farm-to-fork food traceability on Hedera.**

> "Walmart took 7 days to trace an E.coli outbreak. FoodLink does it in **2 seconds**."

Built for the **Hedera Hello Future Apex Hackathon 2026** — Sustainability Track + OpenClaw Bounty.

---

## What is FoodLink?

FoodLink is a platform where autonomous **OpenClaw agents** operate each supply chain stage — farm, processor, distributor, and retailer. Every batch handoff is an immutable **HCS message**. Every crop batch is an **HTS NFT**. When contamination is detected, a recall agent identifies and alerts all affected retailers in under 5 seconds.

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/GearTechnologies/FoodLink
cd FoodLink
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Hedera testnet credentials

# 3. Set up Hedera resources (one-time)
npx ts-node scripts/setup-hedera.ts

# 4. Start development servers
npm run dev
# Web: http://localhost:3000
# API: http://localhost:3001
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Hedera HCS, HTS, Smart Contracts, Guardian, Mirror Node |
| Agents | OpenClaw SDK, Hedera Agent Kit |
| Backend | Node.js 20, Express, tRPC |
| Frontend | Next.js 14 App Router, Tailwind CSS |
| Database | PostgreSQL (Supabase) |
| Testing | Vitest |
| CI/CD | GitHub Actions |

---

## Repository Structure

```
foodlink/
├── apps/
│   ├── web/          # Next.js consumer + dashboard frontend
│   └── api/          # Express + tRPC backend
├── packages/
│   ├── hedera/       # HCS, HTS, Mirror Node, Guardian, Contracts
│   ├── agents/       # OpenClaw agents (farm, processor, distributor, retailer, recall)
│   ├── shared/       # Shared types, schemas, constants
│   └── contracts/    # Solidity: BatchRegistry.sol, RecallManager.sol
├── scripts/          # Hedera setup, demo seed, contract deploy
└── docs/             # Architecture, business model, GTM
```

---

## Demo Walkthrough

**Phase 1 — Supply Chain (2 min)**
1. Farm agent mints NFT → HCS topic created → HARVEST event published
2. Farm → Processor handoff → PROCESS event (cold chain data)
3. Processor → Distributor → SHIP event (transit telemetry)
4. Distributor → Retailer → RECEIVE event
5. Consumer scans QR → `/verify/[batchId]` shows full chain in ~2s

**Phase 2 — Recall Demo (the showstopper)**
```bash
curl -X POST http://localhost:3001/api/simulate-recall \
  -H "Content-Type: application/json" \
  -d '{"farmId":"0.0.11111","cropType":"Romaine Lettuce"}'
```
→ Recall agent alerts all retailers in **< 5 seconds** vs industry average of **7 days**

---

## Environment Variables

See `.env.example` for all required variables.

Key variables:
- `HEDERA_OPERATOR_ACCOUNT_ID` — Your Hedera testnet account
- `HEDERA_OPERATOR_PRIVATE_KEY` — Your Hedera private key
- `HEDERA_TOKEN_ID` — FoodLink NFT collection (from setup script)
- `DEMO_MODE=true` — Enables the simulate-recall endpoint

---

## License

MIT
