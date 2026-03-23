// ─── Network Configuration ────────────────────────────────────────────────────

export const HEDERA_NETWORK = (process.env["HEDERA_NETWORK"] ?? "testnet") as
  | "testnet"
  | "mainnet"
  | "previewnet";

export const MIRROR_NODE_BASE_URL =
  HEDERA_NETWORK === "mainnet"
    ? "https://mainnet-public.mirrornode.hedera.com/api/v1"
    : HEDERA_NETWORK === "previewnet"
      ? "https://previewnet.mirrornode.hedera.com/api/v1"
      : "https://testnet.mirrornode.hedera.com/api/v1";

export const HASHSCAN_BASE_URL =
  HEDERA_NETWORK === "mainnet"
    ? "https://hashscan.io/mainnet"
    : HEDERA_NETWORK === "previewnet"
      ? "https://hashscan.io/previewnet"
      : "https://hashscan.io/testnet";

// ─── HCS Limits ───────────────────────────────────────────────────────────────

/** Maximum bytes per HCS message before compression is applied */
export const MAX_HCS_MESSAGE_BYTES = 1024;

// ─── Retry Configuration ─────────────────────────────────────────────────────

export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_BACKOFF_BASE_MS = 1000;

// ─── Supply Chain Business Rules ─────────────────────────────────────────────

/** Maximum temperature (°C) for cold chain compliance */
export const COLD_CHAIN_MAX_TEMP_C = 5;

/** Number of days back to search for affected batches on a recall */
export const RECALL_WINDOW_DAYS = 30;

/** Maximum SLA hours for a supply chain handoff before trust score penalty */
export const HANDOFF_SLA_HOURS = 24;

// ─── Trust Score Weights ─────────────────────────────────────────────────────

/** Trust score starts here for a new agent */
export const TRUST_SCORE_INITIAL = 100;
/** Penalty per cold-chain violation */
export const TRUST_SCORE_COLD_CHAIN_PENALTY = 5;
/** Penalty per recall involvement */
export const TRUST_SCORE_RECALL_PENALTY = 20;
/** Bonus per on-time handoff (up to initial score) */
export const TRUST_SCORE_ONTIME_BONUS = 1;

// ─── Certification Identifiers ────────────────────────────────────────────────

export const CERTIFICATIONS = {
  ORGANIC_USDA: "ORGANIC_USDA",
  FAIR_TRADE: "FAIR_TRADE",
  NON_GMO: "NON_GMO",
  GAP_CERTIFIED: "GAP_CERTIFIED",
  FOOD_SAFETY: "FOOD_SAFETY",
} as const;

export type CertificationId = (typeof CERTIFICATIONS)[keyof typeof CERTIFICATIONS];

// ─── Demo Configuration ───────────────────────────────────────────────────────

export const DEMO_FARM_LOCATION = { lat: 36.6777, lng: -121.6555, name: "Salinas, CA" };
export const DEMO_PROCESSOR_LOCATION = { lat: 37.3861, lng: -122.0839, name: "Mountain View, CA" };
export const DEMO_DISTRIBUTOR_LOCATION = { lat: 41.8781, lng: -87.623, name: "Chicago, IL" };
export const DEMO_RETAILER_LOCATION = { lat: 40.7128, lng: -74.006, name: "New York, NY" };

// ─── Industry Benchmark ───────────────────────────────────────────────────────

/** Industry average recall resolution time (seconds) used in demo comparisons */
export const INDUSTRY_RECALL_DAYS = 7;
export const INDUSTRY_RECALL_SECONDS = INDUSTRY_RECALL_DAYS * 24 * 60 * 60;
