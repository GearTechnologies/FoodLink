import { Location, COLD_CHAIN_MAX_TEMP_C } from "@foodlink/shared";
import { transferBatch } from "@foodlink/hedera";
import { FoodLinkBaseAgent, AgentConfig } from "./base.agent";
import type { ProvenanceEvent } from "@foodlink/shared";

export interface ProcessingData {
  topicId: string;
  tokenId: string;
  operations: string[];
  outputWeightKg: number;
  temperatureC: number;
  location: Location;
}

/**
 * Processor agent — handles washing, cutting, packaging and QA steps.
 * Validates the incoming farm handoff and publishes a PROCESS event.
 */
export class ProcessorAgent extends FoodLinkBaseAgent {
  private readonly processorName: string;

  constructor(config: AgentConfig & { processorName: string }) {
    super({ ...config, role: "PROCESSOR" });
    this.processorName = config.processorName;
  }

  /**
   * Accepts an incoming batch from the farm.
   * Validates chain integrity before accepting custody.
   */
  async processIncomingBatch(batchId: string, event: ProvenanceEvent): Promise<void> {
    const isValid = await this.validateChainIntegrity(
      event.data["topicId"] as string,
      "FARM"
    );
    if (!isValid) {
      throw new Error(`Chain integrity validation failed for batch ${batchId}`);
    }
  }

  /**
   * Records the processing step (washing, cutting, packaging) on HCS.
   * Publishes a PROCESS event with QA data and temperature readings.
   *
   * @param batchId - HTS NFT serial number
   * @param data - Processing details including operations performed and cold chain data
   */
  async recordProcessing(batchId: string, data: ProcessingData): Promise<string> {
    // Check cold chain compliance
    if (data.temperatureC > COLD_CHAIN_MAX_TEMP_C) {
      this.coldChainViolations++;
    }

    const event = await this.buildSignedEvent(batchId, "PROCESS", data.location, {
      processorName: this.processorName,
      operations: data.operations,
      outputWeightKg: data.outputWeightKg,
      temperatureC: data.temperatureC,
      coldChainCompliant: data.temperatureC <= COLD_CHAIN_MAX_TEMP_C,
    });

    const txId = await this.submitEvent(data.topicId, event);
    this.completedHandoffs++;
    return txId;
  }

  /**
   * Transfers custody of a processed batch to the distributor.
   */
  async publishHandoffEvent(batchId: string, nextActorId: string): Promise<void> {
    await transferBatch(
      this.client,
      batchId,
      parseInt(batchId),
      this.hederaAccountId,
      nextActorId
    );
    this.completedHandoffs++;
  }
}
