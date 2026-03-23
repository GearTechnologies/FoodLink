// ─── Actor and Event Types ────────────────────────────────────────────────────

/** Roles of supply chain participants */
export type ActorRole = "FARM" | "PROCESSOR" | "DISTRIBUTOR" | "RETAILER";

/** Types of provenance events recorded on HCS */
export type EventType =
  | "HARVEST"
  | "PROCESS"
  | "SHIP"
  | "RECEIVE"
  | "RETAIL"
  | "CONTAMINATION_ALERT";

/** Geographic location with human-readable name */
export interface Location {
  lat: number;
  lng: number;
  name: string;
}

/**
 * A single provenance event published to an HCS topic.
 * Each event represents one step in the supply chain journey.
 */
export interface ProvenanceEvent {
  /** Type of event in the supply chain */
  eventType: EventType;
  /** Hedera account ID of the actor publishing this event */
  actorId: string;
  /** Role of the actor in the supply chain */
  actorRole: ActorRole;
  /** HTS NFT serial number identifying the batch */
  batchId: string;
  /** ISO 8601 timestamp of when this event occurred */
  timestamp: string;
  /** Physical location where this event occurred */
  location: Location;
  /** Role-specific data (temperature, certifications, lab results, etc.) */
  data: Record<string, unknown>;
  /** ECDSA signature of the event hash by the actor's private key */
  signature: string;
}

// ─── NFT / Batch Types ────────────────────────────────────────────────────────

/**
 * Metadata stored on the HTS NFT for each crop batch.
 * Links the NFT to its HCS provenance chain.
 */
export interface BatchMetadata {
  /** Human-readable batch name, e.g. "Organic Romaine Lettuce - Batch #4821" */
  name: string;
  description: string;
  /** IPFS CID of batch photo */
  image: string;
  type: "CROP_BATCH";
  properties: {
    /** Hedera account ID of the originating farm */
    farmId: string;
    farmName: string;
    cropType: string;
    /** ISO 8601 harvest date */
    harvestDate: string;
    weightKg: number;
    /** HCS topic ID that stores this batch's provenance chain */
    hcsTopicId: string;
    /** Array of certification identifiers, e.g. ["ORGANIC_USDA", "FAIR_TRADE"] */
    certifications: string[];
    /** Optional Guardian credential ID for sustainability verification */
    guardianCredentialId?: string;
  };
}

// ─── Agent Types ──────────────────────────────────────────────────────────────

/** Runtime state of an OpenClaw supply chain agent */
export interface AgentState {
  agentId: string;
  role: ActorRole;
  hederaAccountId: string;
  /** Trust score 0–100. Higher = more reliable supply chain actor */
  trustScore: number;
  activeBatches: string[];
  status: "ACTIVE" | "IDLE" | "ERROR";
  /** ISO 8601 timestamp of last on-chain action */
  lastActivity: string;
  /** Total completed handoffs — contributes to trust score */
  totalHandoffs: number;
  /** Number of cold chain violations */
  coldChainViolations: number;
  /** Number of batches involved in recalls */
  recallInvolvements: number;
}

// ─── Recall Types ─────────────────────────────────────────────────────────────

/** A contamination recall event with full impact report */
export interface RecallReport {
  recallId: string;
  farmId: string;
  cropType: string;
  detectionDate: string;
  affectedBatches: string[];
  alertsSent: number;
  /** Wall-clock milliseconds from trigger to last retailer alerted */
  resolutionTimeMs: number;
  status: "ACTIVE" | "RESOLVED";
  /** List of transaction IDs for all CONTAMINATION_ALERT HCS messages */
  alertTransactionIds: string[];
}

// ─── API Response Types ───────────────────────────────────────────────────────

/** Standard Hedera transaction response with explorer link */
export interface HederaTxResponse {
  transactionId: string;
  hederaExplorerUrl: string;
}

/** Full batch verification result returned to consumers */
export interface BatchVerificationResult {
  batchId: string;
  topicId: string;
  isRecalled: boolean;
  chain: ProvenanceEvent[];
  certifications: string[];
  farmDetails: {
    farmId: string;
    farmName: string;
    cropType: string;
    harvestDate: string;
    weightKg: number;
  };
  currentOwner: string;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

/** JWT payload for authenticated sessions */
export interface AuthPayload {
  hederaAccountId: string;
  role: ActorRole;
  agentId: string;
  iat?: number;
  exp?: number;
}
