import {
  BatchMetadata,
  Location,
  DEMO_FARM_LOCATION,
} from "@foodlink/shared";
import { createBatchTopic, mintBatchNFT, transferBatch } from "@foodlink/hedera";
import { FoodLinkBaseAgent, AgentConfig } from "./base.agent";
import type { ProvenanceEvent } from "@foodlink/shared";

export interface HarvestInput {
  cropType: string;
  weightKg: number;
  location: Location;
  certifications: string[];
  imageIpfsCid?: string;
  tokenId: string;
}

export interface RegisteredBatch {
  batchId: string;
  topicId: string;
  serialNumber: number;
  transactionId: string;
}

/**
 * Farm agent — the origin of every supply chain journey.
 * Responsible for creating HCS topics, minting batch NFTs, and publishing HARVEST events.
 */
export class FarmAgent extends FoodLinkBaseAgent {
  private readonly farmName: string;

  constructor(config: AgentConfig & { farmName: string }) {
    super({ ...config, role: "FARM" });
    this.farmName = config.farmName;
  }

  /**
   * Registers a new crop harvest on Hedera:
   * 1. Creates a dedicated HCS topic for this batch
   * 2. Mints an HTS NFT with full batch metadata
   * 3. Publishes the initial HARVEST provenance event
   *
   * @param input - Harvest details including crop type, weight, and location
   * @returns Registered batch identifiers (batchId, topicId, serial, txId)
   */
  async registerHarvest(input: HarvestInput): Promise<RegisteredBatch> {
    // Step 1: Create dedicated HCS topic
    const topicId = await createBatchTopic(this.client);

    // Step 2: Build NFT metadata
    const harvestDate = new Date().toISOString();
    const metadata: BatchMetadata = {
      name: `${input.certifications.includes("ORGANIC_USDA") ? "Organic " : ""}${input.cropType} - Batch #${Date.now()}`,
      description: `Fresh ${input.cropType} harvested at ${input.location.name}`,
      image: input.imageIpfsCid ? `ipfs://${input.imageIpfsCid}` : "ipfs://QmDefaultBatchImage",
      type: "CROP_BATCH",
      properties: {
        farmId: this.hederaAccountId,
        farmName: this.farmName,
        cropType: input.cropType,
        harvestDate,
        weightKg: input.weightKg,
        hcsTopicId: topicId,
        certifications: input.certifications,
      },
    };

    // Step 3: Mint HTS NFT
    const serialNumber = await mintBatchNFT(this.client, input.tokenId, metadata);
    const batchId = serialNumber.toString();

    // Step 4: Publish HARVEST event to HCS
    const event = await this.buildSignedEvent(
      batchId,
      "HARVEST",
      input.location,
      {
        cropType: input.cropType,
        weightKg: input.weightKg,
        farmName: this.farmName,
        certifications: input.certifications,
        harvestDate,
      }
    );

    const transactionId = await this.submitEvent(topicId, event);
    this.completedHandoffs++;

    return { batchId, topicId, serialNumber, transactionId };
  }

  /**
   * Transfers custody of a batch to the next supply chain actor (processor).
   * Publishes the handoff event and transfers the NFT.
   */
  async publishHandoffEvent(batchId: string, nextActorId: string): Promise<void> {
    // Farm hands off to processor — no further HCS event needed beyond HARVEST
    // NFT transfer is handled by the API layer
    await transferBatch(this.client, batchId, parseInt(batchId), this.hederaAccountId, nextActorId);
    this.completedHandoffs++;
  }

  /**
   * Not applicable for the farm — farms originate batches, not receive them.
   */
  async processIncomingBatch(_batchId: string, _event: ProvenanceEvent): Promise<void> {
    throw new Error("Farm agent does not receive incoming batches");
  }
}
