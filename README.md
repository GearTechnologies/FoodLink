# 🌿 FoodLink

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Hedera](https://img.shields.io/badge/Hedera-Testnet%20%7C%20Mainnet-purple.svg)](https://hedera.com/)
[![Built with Turbo](https://img.shields.io/badge/Built%20with-Turborepo-EF4444.svg)](https://turbo.build/)

**Decentralized farm-to-fork food traceability on Hedera.**

> "Walmart took 7 days to trace an E.coli outbreak. FoodLink does it in **2 seconds**."

Built for the **Hedera Hello Future Apex Hackathon 2026** — Sustainability Track + OpenClaw Bounty.

---

## Table of Contents

- [What is FoodLink?](#what-is-foodlink)
- [The Problem](#the-problem)
- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Development Guide](#development-guide)
- [Frontend Pages](#frontend-pages)
- [API Reference](#api-reference)
- [Supply Chain Flow](#supply-chain-flow)
- [Recall Demo](#recall-demo)
- [Smart Contracts](#smart-contracts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## What is FoodLink?

FoodLink is a **decentralized food traceability platform** where autonomous **OpenClaw agents** operate each stage of the supply chain — farm, processor, distributor, and retailer. Every batch handoff is recorded as an immutable message on **Hedera Consensus Service (HCS)**. Every crop batch is tokenized as an **HTS NFT**. When contamination is detected, a recall agent autonomously identifies and alerts all affected retailers in under 5 seconds.

The result: end-to-end provenance verification that consumers can trust, and lightning-fast contamination recall that protects lives.

---

## The Problem

Food safety incidents cost the global economy over **$110 billion annually**. The root cause isn't the contamination itself — it's the time it takes to trace and recall affected products through opaque, paper-based supply chains.

| Metric | Industry Average | FoodLink |
|--------|-----------------|----------|
| Trace a contaminated batch | **7 days** | **< 2 seconds** |
| Notify all affected retailers | **3–5 days** | **< 5 seconds** |
| Provenance verification | Manual / Audits | Real-time / Public |
| Data integrity | Mutable (Paper/ERP) | Immutable (Blockchain) |

---

## Key Features

### 🌾 Batch Registration & NFT Minting
Farm agents register crop batches, automatically minting an **HTS NFT** as a tamper-proof digital twin. A dedicated **HCS topic** is created per batch to record every downstream provenance event.

### 🔗 Immutable Supply Chain Handoffs
Custody transfers — Farm → Processor → Distributor → Retailer — are published as signed, immutable **HCS messages** including actor identity, location, timestamps, and role-specific data (cold chain readings, lab results, transit telemetry).

### 🔍 Consumer QR Verification
Consumers scan a QR code on physical packaging and instantly view the complete provenance timeline at `/verify/{batchId}` — farm origin, certifications, cold chain compliance, and live recall status — resolved in approximately **1.8–2 seconds** from the Hedera Mirror Node.

### 🚨 Autonomous Contamination Recall
The centerpiece feature: a **Recall Agent** that, upon detecting contamination, autonomously:
1. Queries the Mirror Node for all batches from the flagged farm (past 30 days)
2. Publishes a `CONTAMINATION_ALERT` to every affected batch's HCS topic
3. Calls `BatchRegistry.flagRecall()` on-chain for each serial
4. Burns the HTS NFTs for recalled batches
5. Generates a comprehensive `RecallReport` with full audit trail

**Target: entire flow completes in < 5 seconds.**

### 🤖 Agent Registry & Trust Scores
All supply chain participants are registered as autonomous agents with tracked metrics: active batches, total handoffs, cold chain violations, and recall involvement — surfaced in the `/agents` dashboard.

### 🔐 Wallet-Based Authentication
Hedera account-based auth using a nonce challenge-response flow. Supports **HashPack** wallet integration. Issues 24-hour JWT session tokens.

### 🌍 Sustainability Credentials
Integration with **Hedera Guardian** to verify and display on-chain sustainability certifications (organic, fair-trade, etc.) on each batch's provenance page.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Consumer / Retailer                       │
│               QR Scan → /verify/{batchId}                       │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTP / tRPC
┌────────────────────────────▼────────────────────────────────────┐
│                     Next.js 14 Frontend                          │
│    pages: /, /scan, /verify, /dashboard, /recall, /agents        │
└────────────────────────────┬────────────────────────────────────┘
                             │  tRPC (type-safe RPC)
┌────────────────────────────▼────────────────────────────────────┐
│               Express + tRPC API  (port 3001)                    │
│   routers: batch • agent • auth                                  │
│   middleware: JWT authentication                                  │
└────┬───────────────────┬───────────────────────┬────────────────┘
     │ OpenClaw agents   │ @foodlink/hedera pkg   │ PostgreSQL
┌────▼──────┐   ┌────────▼────────────────────┐  │ (Supabase)
│  Agents   │   │    Hedera Network            │  │
│  Farm     │   │  ┌──────────────────────┐   │  │
│  Processor│   │  │ HCS  (Provenance)    │   │  │
│Distributor│   │  │ HTS  (NFTs)          │   │  │
│  Retailer │   │  │ Mirror Node (Queries) │   │  │
│  Recall   │   │  │ Guardian (Creds)      │   │  │
└───────────┘   │  │ Smart Contracts       │   │  │
                │  └──────────────────────┘   │  │
                └─────────────────────────────┘  │
                                                  └─► State
```

**Data flow for a batch handoff:**
1. Actor agent signs a `ProvenanceEvent` (ECDSA signature)
2. Event is published to the batch's dedicated HCS topic (immutable, ordered, timestamped)
3. HTS NFT is transferred to the next actor's Hedera account
4. Mirror Node indexes the event — available for public query within ~3 seconds

---

## Tech Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| **Blockchain** | Hedera HCS | Immutable provenance event stream |
| | Hedera HTS | NFT collection per batch |
| | Hedera Smart Contracts | BatchRegistry, RecallManager (Solidity) |
| | Hedera Guardian | Sustainability credential verification |
| | Hedera Mirror Node | Public batch & event queries |
| **Agents** | OpenClaw SDK | Autonomous agent framework |
| | Hedera Agent Kit | Agent-to-Hedera integration |
| **Backend** | Node.js | 20+ |
| | Express.js | 4.19+ |
| | tRPC | 10.45+ — end-to-end type safety |
| | JSON Web Token | 24-hour session tokens |
| | Zod | 3.22+ — runtime schema validation |
| **Frontend** | Next.js | 14 — App Router, SSR |
| | React | 18 |
| | TypeScript | 5.4+ |
| | Tailwind CSS | 3.4+ |
| | React Query | 5.28+ — server state management |
| | jsQR / qrcode | QR scanning & generation |
| **Database** | PostgreSQL | via Supabase (optional for hackathon) |
| **Testing** | Vitest | 1.4+ |
| **Monorepo** | Turborepo | 1.13+ — parallel task orchestration |
| **Code Quality** | ESLint | 8.57+ with TypeScript rules |
| | Prettier | 3.2+ |
| **CI/CD** | GitHub Actions | Automated lint, test, build |

---

## Repository Structure

```
FoodLink/
├── apps/
│   ├── web/                          # Next.js 14 frontend
│   │   ├── src/app/
│   │   │   ├── page.tsx              # Hero landing page
│   │   │   ├── dashboard/            # Actor dashboard
│   │   │   ├── scan/                 # QR code scanner
│   │   │   ├── verify/[batchId]/     # Batch provenance timeline
│   │   │   ├── farm/register/        # Batch registration form
│   │   │   ├── recall/dashboard/     # Recall alerts & metrics
│   │   │   └── agents/               # Agent registry
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── api/                          # Express + tRPC backend
│       ├── src/
│       │   ├── index.ts              # Express server entry point
│       │   ├── router.ts             # tRPC root router
│       │   ├── context.ts            # tRPC context + auth
│       │   └── routers/
│       │       ├── batch.router.ts   # Batch CRUD + recall
│       │       ├── agent.router.ts   # Agent registry
│       │       └── auth.router.ts    # JWT + nonce auth
│       └── package.json
│
├── packages/
│   ├── shared/                       # Shared types, schemas, constants
│   │   └── src/
│   │       ├── types.ts              # ProvenanceEvent, BatchMetadata, RecallReport
│   │       ├── schemas.ts            # Zod validation schemas
│   │       └── constants.ts          # Network URLs, config values
│   │
│   ├── hedera/                       # Hedera blockchain integration
│   │   ├── src/
│   │   │   ├── hcs.ts                # Publish & read HCS provenance events
│   │   │   ├── hts.ts                # Mint, transfer, burn HTS NFTs
│   │   │   ├── mirror.ts             # Mirror Node batch ownership queries
│   │   │   ├── guardian.ts           # Sustainability credential verification
│   │   │   └── contracts.ts          # Smart contract interactions
│   │   └── __tests__/
│   │       ├── hcs.test.ts
│   │       └── hts.test.ts
│   │
│   ├── agents/                       # Autonomous supply chain agents
│   │   └── src/
│   │       ├── base.agent.ts         # Abstract base class (~196 LOC)
│   │       ├── farm.agent.ts         # Mints NFT, publishes HARVEST
│   │       ├── processor.agent.ts    # Records PROCESS events
│   │       ├── distributor.agent.ts  # Records SHIP events
│   │       ├── retailer.agent.ts     # Records RECEIVE/RETAIL events
│   │       └── recall.agent.ts       # Autonomous recall orchestration (~147 LOC)
│   │
│   └── contracts/                    # Solidity smart contracts (Hardhat)
│       └── contracts/
│           ├── BatchRegistry.sol     # Provenance registry, role-based access
│           └── RecallManager.sol     # Recall event lifecycle
│
├── scripts/
│   ├── setup-hedera.ts               # One-time: create HCS topic + HTS token
│   └── seed-demo.ts                  # Create demo accounts + run workflow
│
├── docs/                             # Architecture, business model, GTM
├── tsconfig.base.json                # Shared TypeScript compiler config
├── turbo.json                        # Turborepo build pipeline config
├── package.json                      # Monorepo root (npm workspaces)
├── .env.example                      # Environment variables template
├── .eslintrc.js                      # ESLint rules
└── .prettierrc                       # Prettier formatting config
```

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** v20.0.0 or higher — [Download](https://nodejs.org/)
- **npm** v9+ (bundled with Node.js) or **yarn**
- **Hedera Testnet account** with HBAR — [Create one free at portal.hedera.com](https://portal.hedera.com/)
- **Git**

Optional:
- **HashPack wallet** — for wallet-based authentication UI
- **Supabase account** — for persistent PostgreSQL state
- **Pinata account** — for IPFS batch image/metadata storage

---

## Quick Start

```bash
# 1. Clone and install dependencies
git clone https://github.com/GearTechnologies/FoodLink
cd FoodLink
npm install

# 2. Configure environment variables
cp .env.example .env
# Open .env and fill in your Hedera testnet credentials:
#   HEDERA_OPERATOR_ACCOUNT_ID=0.0.XXXXXX
#   HEDERA_OPERATOR_PRIVATE_KEY=302e...

# 3. (One-time) Set up Hedera resources
# Creates the global HCS recall topic and HTS NFT collection
npx ts-node scripts/setup-hedera.ts
# Copy the printed HEDERA_TOKEN_ID and HEDERA_RECALL_TOPIC_ID into .env

# 4. (Optional) Seed demo data
# Creates 4 test Hedera accounts (Farm, Processor, Distributor, Retailer)
# and runs through the full supply chain workflow
npx ts-node scripts/seed-demo.ts

# 5. Start all development servers
npm run dev
# ▶ Web (Next.js):  http://localhost:3000
# ▶ API (Express):  http://localhost:3001
```

### Verify the setup

```bash
# Health check
curl http://localhost:3001/health
# → {"status":"ok","service":"FoodLink API","network":"testnet","timestamp":"..."}

# Run tests
npm run test

# Type check
npm run typecheck
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `HEDERA_NETWORK` | Hedera network to connect to | `testnet` |
| `HEDERA_OPERATOR_ACCOUNT_ID` | Your Hedera account ID | `0.0.12345` |
| `HEDERA_OPERATOR_PRIVATE_KEY` | Your ED25519 private key | `302e...` |

### After Running `setup-hedera.ts`

| Variable | Description | Example |
|----------|-------------|---------|
| `HEDERA_TOKEN_ID` | HTS NFT collection ID | `0.0.8353900` |
| `HEDERA_RECALL_TOPIC_ID` | Global HCS recall alert topic | `0.0.8353899` |

### After Deploying Smart Contracts

| Variable | Description |
|----------|-------------|
| `HEDERA_CONTRACT_ID` | BatchRegistry contract ID | `0.0.8354208` |
| `HEDERA_RECALL_MANAGER_CONTRACT_ID` | RecallManager contract ID | `0.0.8354212` |

### Application Config

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | *(must set)* | Secret for JWT signing — min 32 characters |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public URL of the frontend |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Public URL of the API |
| `PORT` | `3001` | API server port |
| `NODE_ENV` | `development` | `development` or `production` |
| `DEMO_MODE` | `true` | Enables the `/api/simulate-recall` demo endpoint |

### Optional Integrations

| Variable | Description |
|----------|-------------|
| `GUARDIAN_API_URL` | Hedera Guardian endpoint for sustainability creds |
| `GUARDIAN_API_KEY` | Hedera Guardian API key |
| `OPENCLAW_API_KEY` | OpenClaw SDK API key for autonomous agents |
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `PINATA_API_KEY` | Pinata IPFS key for batch image storage |
| `PINATA_SECRET` | Pinata IPFS secret |

---

## Development Guide

### Scripts

All scripts run from the monorepo root and are orchestrated by **Turborepo**:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in watch/dev mode |
| `npm run build` | Build all packages and apps |
| `npm run test` | Run all unit/integration tests (Vitest) |
| `npm run lint` | Lint all packages with ESLint |
| `npm run typecheck` | TypeScript type-check all packages |
| `npm run format` | Format all files with Prettier |

### Working with Specific Packages

```bash
# Run dev for a single app
cd apps/web && npm run dev        # Next.js frontend only
cd apps/api && npm run dev        # Express API only

# Test a specific package
cd packages/hedera && npm run test
cd packages/hedera && npm run test -- --watch  # watch mode
cd packages/hedera && npm run test -- --coverage
```

### Code Style

- **TypeScript strict mode** — no implicit `any`
- **ESLint** — run `npm run lint` before committing
- **Prettier** — run `npm run format` to auto-format
- **Conventional Commits** recommended for commit messages

### Monorepo Notes

- Changes to `packages/` are consumed by both `apps/web` and `apps/api` — rebuild after changes
- Turborepo caches build outputs; run `npm run build -- --force` to bypass cache
- Each package has its own `package.json`, `tsconfig.json`, and can be tested independently

---

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Hero landing page — project overview, stats, "How It Works" |
| `/scan` | QR code scanner with camera access + manual batch ID fallback |
| `/verify/[batchId]` | **Public** — full provenance timeline, recall status, certifications |
| `/dashboard` | Actor dashboard — active batches table, handoff controls, stats |
| `/farm/register` | Register a new crop batch (authenticated farm actors) |
| `/recall/dashboard` | Live recall alerts, resolution metrics, affected batch list |
| `/agents` | Agent registry — trust scores, handoff counts, compliance history |

---

## API Reference

The API uses **tRPC** for type-safe RPC over HTTP. All endpoints are under `http://localhost:3001/trpc/`.

### Batch Router (`batch.*`)

#### `batch.register` — POST, 🔒 Auth required
Register a new crop batch. Creates HCS topic, mints HTS NFT, publishes HARVEST event.

```json
// Input
{
  "farmId": "0.0.12345",
  "farmName": "Organic Farm CA",
  "cropType": "Romaine Lettuce",
  "weightKg": 450,
  "harvestDate": "2024-03-23T10:00:00Z",
  "location": { "lat": 36.5, "lng": -120.0, "name": "Salinas, CA" },
  "certifications": ["ORGANIC_USDA"]
}

// Response
{
  "batchId": "42",
  "topicId": "0.0.99999",
  "tokenSerial": 42,
  "qrData": "https://foodlink.app/verify/42"
}
```

#### `batch.recordHandoff` — POST, 🔒 Auth required
Record a custody transfer. Publishes HCS event and transfers NFT to next actor.

```json
// Input
{
  "batchId": "42",
  "toActorId": "0.0.22222",
  "eventType": "SHIP",
  "location": { "lat": 37.7, "lng": -122.4, "name": "San Francisco, CA" },
  "data": { "temperature": 4.2, "humidity": 85, "truckId": "TRUCK-007" }
}
```

#### `batch.verify` — GET, 🌐 Public
Retrieve the full provenance chain for a batch. Used by the consumer QR scan flow.

```bash
curl "http://localhost:3001/trpc/batch.verify?input=%7B%22batchId%22%3A%2242%22%7D"
```

```json
// Response
{
  "batchId": "42",
  "status": "OK",
  "events": [
    { "eventType": "HARVEST", "actorRole": "FARM", "timestamp": "...", "location": {...} },
    { "eventType": "PROCESS", "actorRole": "PROCESSOR", "timestamp": "...", "data": {...} },
    { "eventType": "SHIP",    "actorRole": "DISTRIBUTOR", "timestamp": "...", "data": {...} },
    { "eventType": "RECEIVE", "actorRole": "RETAILER",    "timestamp": "...", "data": {...} }
  ],
  "metadata": { "farmName": "Organic Farm CA", "cropType": "Romaine Lettuce", ... },
  "recall": null
}
```

#### `batch.triggerRecall` — POST, 🔒 Auth required
Initiate an autonomous contamination recall.

```json
// Input
{ "farmId": "0.0.11111", "cropType": "Romaine Lettuce", "reason": "E.coli O157:H7 detected" }

// Response — RecallReport
{
  "recallId": "recall-1711234567-001111111",
  "farmId": "0.0.11111",
  "cropType": "Romaine Lettuce",
  "affectedBatches": ["42", "43", "44"],
  "alertsSent": 3,
  "resolutionTimeMs": 3200,
  "timestamp": "2024-03-23T12:00:00Z"
}
```

### Agent Router (`agent.*`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `agent.list` | GET | Public | List all registered agents with trust scores |
| `agent.getStatus` | GET | Public | Get status of a specific agent |
| `agent.register` | POST | Public | Register a new supply chain agent |

### Auth Router (`auth.*`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `auth.challenge` | POST | Public | Get nonce for Hedera wallet signature |
| `auth.verify` | POST | Public | Verify signature and receive JWT token |
| `auth.me` | GET | 🔒 Required | Get current authenticated user profile |

### Direct HTTP Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | API health check |
| `/api/simulate-recall` | POST | Demo recall trigger (requires `DEMO_MODE=true`) |

---

## Supply Chain Flow

The complete lifecycle of a crop batch through FoodLink:

```
 FARM                PROCESSOR           DISTRIBUTOR          RETAILER
   │                     │                    │                   │
   │  1. mintNFT()       │                    │                   │
   │  2. createTopic()   │                    │                   │
   │  3. publish(HARVEST)│                    │                   │
   │─────── NFT transfer ──────────────────►  │                   │
   │                     │ 4. publish(PROCESS)│                   │
   │                     │    (cold chain data│                   │
   │                     │    lab results)    │                   │
   │                     │──── NFT transfer ──────────────────►  │
   │                     │                    │5. publish(SHIP)   │
   │                     │                    │   (transit data   │
   │                     │                    │    GPS, temp)     │
   │                     │                    │── NFT transfer ──►│
   │                     │                    │                   │6. publish(RECEIVE)
   │                     │                    │                   │   publish(RETAIL)
   │                                                              │
   │                      ◄─── Consumer QR scan → /verify ───────┤
   │                           Full chain resolved in ~2 seconds  │
```

**Event Types in HCS:**

| Event | Actor | Data Recorded |
|-------|-------|---------------|
| `HARVEST` | Farm | Crop type, weight, certifications, GPS |
| `PROCESS` | Processor | Temperature, lab results, processing details |
| `SHIP` | Distributor | Transit telemetry, truck ID, route |
| `RECEIVE` | Retailer | Receiving timestamp, cold chain confirmation |
| `RETAIL` | Retailer | Display location, expiry date |
| `CONTAMINATION_ALERT` | Recall Agent | Recall ID, reason, affected serial numbers |

---

## Recall Demo

The standout feature of FoodLink — **end-to-end contamination recall in under 5 seconds**.

### Running the Demo

**Option A: cURL (quickest)**
```bash
# Requires DEMO_MODE=true in .env
curl -X POST http://localhost:3001/api/simulate-recall \
  -H "Content-Type: application/json" \
  -d '{"farmId":"0.0.11111","cropType":"Romaine Lettuce"}'
```

**Option B: tRPC (authenticated)**
```bash
# First authenticate to get JWT
TOKEN=$(curl -s -X POST http://localhost:3001/trpc/auth.challenge \
  -d '{"input":{"accountId":"0.0.11111"}}' | jq -r '.result.data.token')

# Trigger recall
curl -X POST http://localhost:3001/trpc/batch.triggerRecall \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input":{"farmId":"0.0.11111","cropType":"Romaine Lettuce","reason":"E.coli detected"}}'
```

### What Happens Under the Hood

```
Trigger received
      │
      ▼
RecallAgent.executeRecall()
      │
      ├─► Query Mirror Node: all batches from farm in last 30 days
      │        → ["42", "43", "44"]
      │
      ├─► For each batch (parallel):
      │        ├─► Publish CONTAMINATION_ALERT to batch's HCS topic
      │        ├─► Call BatchRegistry.flagRecall() on-chain
      │        └─► Burn HTS NFT (batch is recalled)
      │
      └─► Return RecallReport
               {
                 recallId: "recall-...",
                 affectedBatches: ["42","43","44"],
                 alertsSent: 3,
                 resolutionTimeMs: 3200   ← < 5 seconds
               }
```

**Result:** `"FoodLink alerted 3 retailers in 3,200ms. Industry average: 604,800,000ms (7 days)."`

---

## Smart Contracts

FoodLink deploys two Solidity contracts to Hedera's EVM-compatible network:

### `BatchRegistry.sol`
- Stores on-chain provenance records for each batch serial number
- Role-based access control (FARM_ROLE, PROCESSOR_ROLE, etc.)
- Key functions: `registerBatch()`, `recordHandoff()`, `flagRecall()`

### `RecallManager.sol`
- Manages the lifecycle of recall events (ACTIVE → RESOLVED)
- Emits events for indexers and alerts
- Key functions: `initiateRecall()`, `resolveRecall()`, `getRecallStatus()`

### Deploying Contracts

```bash
# Deploy to Hedera testnet EVM
cd packages/contracts
npx hardhat run scripts/deploy.js --network hedera_testnet

# Copy the printed contract addresses into .env:
# HEDERA_CONTRACT_ID=0.0.8354208
# HEDERA_RECALL_MANAGER_CONTRACT_ID=0.0.8354212
```

---

## Testing

FoodLink uses **Vitest** for unit and integration testing.

```bash
# Run all tests
npm run test

# Test a specific package
cd packages/hedera && npm run test

# Watch mode (re-runs on file changes)
npm run test -- --watch

# Coverage report
npm run test -- --coverage
```

### Test Files

| File | Coverage |
|------|----------|
| `packages/hedera/__tests__/hcs.test.ts` | HCS provenance event publishing & reading |
| `packages/hedera/__tests__/hts.test.ts` | HTS NFT minting, transfer, and burn |

### Type Checking

```bash
# Full TypeScript type check across all packages
npm run typecheck
```

---

## Deployment

### Frontend (`apps/web`) — Vercel / Netlify

```bash
# Build production bundle
npm run build

# The Next.js app is in apps/web/.next/
# Deploy to Vercel:
cd apps/web
npx vercel --prod
```

### API (`apps/api`) — Any Node.js Host

```bash
npm run build
# Built server is in apps/api/dist/index.js
node apps/api/dist/index.js
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
ENV NODE_ENV=production
EXPOSE 3000 3001
CMD ["sh", "-c", "node apps/api/dist/index.js & cd apps/web && npm start"]
```

### Production Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `HEDERA_NETWORK=mainnet` (or `testnet` for staging)
- [ ] Set a strong `JWT_SECRET` (minimum 32 random characters)
- [ ] Set `DEMO_MODE=false` to disable demo endpoints
- [ ] Set `DATABASE_URL` for production PostgreSQL
- [ ] Set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_URL` to public domains
- [ ] Deploy smart contracts and update `HEDERA_CONTRACT_ID` variables

---

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository and create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Install dependencies** and ensure tests pass
   ```bash
   npm install && npm run test
   ```

3. **Make your changes**, following the code standards:
   - TypeScript strict mode — no implicit `any`
   - Run `npm run lint` and fix all warnings
   - Run `npm run format` to apply Prettier formatting
   - Run `npm run typecheck` to verify types

4. **Write or update tests** for your changes

5. **Commit** with a descriptive message (Conventional Commits preferred):
   ```
   feat(agents): add cold chain violation detection
   fix(recall): handle batches with no associated retailers
   ```

6. **Open a Pull Request** — describe what you changed and why

### Project Structure Conventions

- All shared types live in `packages/shared/src/types.ts`
- Zod schemas for validation live in `packages/shared/src/schemas.ts`
- Hedera integration is isolated in `packages/hedera/`
- Agent business logic lives in `packages/agents/`
- API routes are defined as tRPC procedures in `apps/api/src/routers/`

---

## License

[MIT](LICENSE) © GearTechnologies

---

<p align="center">
  Built with ❤️ for the <strong>Hedera Hello Future Apex Hackathon 2026</strong><br>
  Sustainability Track · OpenClaw Bounty
</p>
