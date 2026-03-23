import { Client, PrivateKey, AccountId } from "@hashgraph/sdk";
import crypto from "crypto";
import {
  ProvenanceEvent,
  ActorRole,
  EventType,
  Location,
  TRUST_SCORE_INITIAL,
  TRUST_SCORE_COLD_CHAIN_PENALTY,
  TRUST_SCORE_RECALL_PENALTY,
  TRUST_SCORE_ONTIME_BONUS,
} from "@foodlink/shared";
import { publishProvenanceEvent, getFullProvenanceChain } from "@foodlink/hedera";

// ─── Agent Configuration ──────────────────────────────────────────────────────

export interface AgentConfig {
  role: ActorRole;
  hederaAccountId: string;
  privateKeyStr: string;
  network?: "testnet" | "mainnet" | "previewnet";
}

// ─── Base Agent Class ─────────────────────────────────────────────────────────

/**
 * Abstract base class for all FoodLink supply chain agents.
 * Provides shared Hedera client, signing, and chain validation logic.
 * Each supply chain stage (farm, processor, distributor, retailer) extends this.
 */
export abstract class FoodLinkBaseAgent {
  protected readonly role: ActorRole;
  protected readonly hederaAccountId: string;
  protected readonly privateKey: PrivateKey;
  protected readonly client: Client;
  readonly agentId: string;

  /** Running tally of completed on-time handoffs */
  protected completedHandoffs = 0;
  /** Running tally of cold chain violations detected */
  protected coldChainViolations = 0;
  /** Running tally of batches involved in recalls */
  protected recallInvolvements = 0;

  constructor(config: AgentConfig) {
    this.role = config.role;
    this.hederaAccountId = config.hederaAccountId;
    this.privateKey = PrivateKey.fromString(config.privateKeyStr);
    this.agentId = `agent-${config.role.toLowerCase()}-${config.hederaAccountId}`;

    // Build Hedera client
    const network = config.network ?? "testnet";
    if (network === "mainnet") {
      this.client = Client.forMainnet();
    } else if (network === "previewnet") {
      this.client = Client.forPreviewnet();
    } else {
      this.client = Client.forTestnet();
    }
    this.client.setOperator(
      AccountId.fromString(config.hederaAccountId),
      this.privateKey
    );
  }

  // ─── Abstract Methods (must implement in subclass) ──────────────────────────

  /**
   * Handles an incoming batch transfer to this agent.
   * Called when the previous supply chain actor initiates a handoff.
   *
   * @param batchId - HTS NFT serial number of the incoming batch
   * @param event - The handoff provenance event from the previous actor
   */
  abstract processIncomingBatch(batchId: string, event: ProvenanceEvent): Promise<void>;

  /**
   * Publishes the handoff event to HCS and initiates NFT transfer to the next actor.
   *
   * @param batchId - HTS NFT serial number
   * @param nextActorId - Hedera account ID of the next supply chain actor
   */
  abstract publishHandoffEvent(batchId: string, nextActorId: string): Promise<void>;

  // ─── Chain Integrity Validation ──────────────────────────────────────────────

  /**
   * Validates that an HCS provenance chain is unbroken and that the last
   * event was published by the expected previous role.
   *
   * @param topicId - HCS topic ID of the batch
   * @param expectedPreviousRole - Role that should have published the last event
   * @returns true if chain is valid and the previous actor role matches
   */
  async validateChainIntegrity(
    topicId: string,
    expectedPreviousRole: ActorRole
  ): Promise<boolean> {
    try {
      const chain = await getFullProvenanceChain(topicId);
      if (chain.length === 0) return false;

      const lastEvent = chain[chain.length - 1];
      if (lastEvent.actorRole !== expectedPreviousRole) return false;

      // Verify sequence: each event must reference the correct batchId
      const batchId = chain[0].batchId;
      for (const event of chain) {
        if (event.batchId !== batchId) return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  // ─── Event Signing ─────────────────────────────────────────────────────────

  /**
   * Builds a provenance event and signs it with this agent's ECDSA private key.
   * The signature covers a SHA-256 hash of the canonical event fields.
   *
   * @param batchId - HTS NFT serial number (as string)
   * @param eventType - Type of event being recorded
   * @param location - Physical location of this event
   * @param data - Role-specific payload (temperature, certifications, etc.)
   * @returns Signed ProvenanceEvent ready for HCS submission
   */
  async buildSignedEvent(
    batchId: string,
    eventType: EventType,
    location: Location,
    data: Record<string, unknown>
  ): Promise<ProvenanceEvent> {
    const timestamp = new Date().toISOString();

    // Create deterministic hash of the event fields (excluding signature)
    const payload = JSON.stringify({
      eventType,
      actorId: this.hederaAccountId,
      actorRole: this.role,
      batchId,
      timestamp,
      location,
      data,
    });

    const hash = crypto.createHash("sha256").update(payload).digest();
    const signature = Buffer.from(this.privateKey.sign(hash)).toString("hex");

    return {
      eventType,
      actorId: this.hederaAccountId,
      actorRole: this.role,
      batchId,
      timestamp,
      location,
      data,
      signature,
    };
  }

  // ─── Trust Score ──────────────────────────────────────────────────────────

  /**
   * Computes a deterministic trust score (0–100) for this agent based on
   * historical performance metrics tracked during the agent's lifetime.
   *
   * Scoring factors:
   * - Starts at TRUST_SCORE_INITIAL
   * - +TRUST_SCORE_ONTIME_BONUS per completed on-time handoff (capped at initial)
   * - -TRUST_SCORE_COLD_CHAIN_PENALTY per cold chain violation
   * - -TRUST_SCORE_RECALL_PENALTY per recall involvement
   *
   * @returns Trust score in [0, 100]
   */
  computeTrustScore(): number {
    const base = TRUST_SCORE_INITIAL;
    const violations = this.coldChainViolations * TRUST_SCORE_COLD_CHAIN_PENALTY;
    const recalls = this.recallInvolvements * TRUST_SCORE_RECALL_PENALTY;
    return Math.max(0, Math.min(100, base - violations - recalls));
  }

  /**
   * Publishes a provenance event to HCS, returning the transaction ID.
   */
  protected async submitEvent(topicId: string, event: ProvenanceEvent): Promise<string> {
    return publishProvenanceEvent(this.client, topicId, event);
  }

  /** Returns the Hedera account ID string */
  getAccountId(): string {
    return this.hederaAccountId;
  }
}
