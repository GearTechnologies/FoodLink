import {
  RecallReport,
  RECALL_WINDOW_DAYS,
  HASHSCAN_BASE_URL,
} from "@foodlink/shared";
import {
  getBatchesByFarm,
  publishProvenanceEvent,
  burnBatch,
  flagRecall,
} from "@foodlink/hedera";
import { FoodLinkBaseAgent, AgentConfig } from "./base.agent";
import type { ProvenanceEvent } from "@foodlink/shared";

export interface RecallTriggerInput {
  farmId: string;
  cropType: string;
  detectionDate: string;
  reason?: string;
  tokenId: string;
  contractId: string;
}

/**
 * Recall agent — the centerpiece of the FoodLink judge demo.
 *
 * When contamination is detected, this agent autonomously:
 * 1. Queries Mirror Node for all batches from the flagged farm (last 30 days)
 * 2. Publishes CONTAMINATION_ALERT to every affected batch's HCS topic
 * 3. Calls BatchRegistry.flagRecall() on-chain for each batch serial
 * 4. Burns HTS NFTs for all recalled batches
 * 5. Generates a comprehensive recall report
 *
 * Target: complete the entire flow in under 5 seconds for the live demo.
 */
export class RecallAgent extends FoodLinkBaseAgent {
  constructor(config: AgentConfig) {
    super({ ...config, role: "FARM" }); // Recall agent uses RECALL_AGENT_ROLE
  }

  /**
   * Executes an autonomous contamination recall.
   * This is the showstopper demo — from trigger to all retailers alerted.
   *
   * @param input - Recall trigger data (farm, crop type, detection date)
   * @returns Comprehensive recall report with all affected batches and timing
   */
  async executeRecall(input: RecallTriggerInput): Promise<RecallReport> {
    const startTime = Date.now();
    const recallId = `recall-${Date.now()}-${input.farmId.replace(/\./g, "")}`;

    // Step 1: Find all affected batches from this farm
    const affectedNFTs = await getBatchesByFarm(
      input.farmId,
      input.tokenId,
      RECALL_WINDOW_DAYS
    );

    // Filter by crop type if specified
    const matchingNFTs = affectedNFTs.filter(
      (nft) =>
        nft.metadata.properties.cropType.toLowerCase() === input.cropType.toLowerCase()
    );

    if (matchingNFTs.length === 0) {
      return {
        recallId,
        farmId: input.farmId,
        cropType: input.cropType,
        detectionDate: input.detectionDate,
        affectedBatches: [],
        alertsSent: 0,
        resolutionTimeMs: Date.now() - startTime,
        status: "RESOLVED",
        alertTransactionIds: [],
      };
    }

    // Step 2–4: Process all batches in parallel for maximum speed
    const alertTransactionIds: string[] = [];
    const affectedBatchIds: string[] = [];

    await Promise.all(
      matchingNFTs.map(async (nft) => {
        const batchId = nft.serialNumber.toString();
        affectedBatchIds.push(batchId);

        const topicId = nft.metadata.properties.hcsTopicId;

        // Build contamination alert event
        const alertEvent = await this.buildSignedEvent(
          batchId,
          "CONTAMINATION_ALERT",
          { lat: 0, lng: 0, name: "FoodLink Recall System" },
          {
            reason: input.reason ?? "Contamination detected — precautionary recall",
            farmId: input.farmId,
            cropType: input.cropType,
            detectionDate: input.detectionDate,
            recallId,
            affectedBatchCount: matchingNFTs.length,
          }
        );

        // Publish alert to HCS — notifies all downstream actors watching this topic
        const txId = await publishProvenanceEvent(this.client, topicId, alertEvent);
        alertTransactionIds.push(txId);

        // Flag recall on-chain in BatchRegistry
        await flagRecall(this.client, input.contractId, nft.serialNumber, input.reason ?? "Contamination");

        // Burn the NFT to remove from circulation
        await burnBatch(this.client, input.tokenId, nft.serialNumber);

        this.recallInvolvements++;
      })
    );

    const resolutionTimeMs = Date.now() - startTime;

    return {
      recallId,
      farmId: input.farmId,
      cropType: input.cropType,
      detectionDate: input.detectionDate,
      affectedBatches: affectedBatchIds,
      alertsSent: alertTransactionIds.length,
      resolutionTimeMs,
      status: "ACTIVE",
      alertTransactionIds,
    };
  }

  /**
   * Not applicable for the recall agent.
   */
  async processIncomingBatch(_batchId: string, _event: ProvenanceEvent): Promise<void> {
    throw new Error("Recall agent does not receive batch custody");
  }

  /**
   * Not applicable for the recall agent.
   */
  async publishHandoffEvent(_batchId: string, _nextActorId: string): Promise<void> {
    throw new Error("Recall agent does not perform handoffs");
  }
}
