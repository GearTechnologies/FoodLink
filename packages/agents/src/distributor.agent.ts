import { Location, COLD_CHAIN_MAX_TEMP_C } from "@foodlink/shared";
import { transferBatch } from "@foodlink/hedera";
import { FoodLinkBaseAgent, AgentConfig } from "./base.agent";
import type { ProvenanceEvent } from "@foodlink/shared";

export interface ShipmentData {
  topicId: string;
  tokenId: string;
  transitHours: number;
  avgTemperatureC: number;
  origin: Location;
  destination: Location;
  carrierName: string;
}

/**
 * Distributor agent — handles logistics and transit between processor and retailer.
 * Records SHIP and RECEIVE events with full cold chain telemetry.
 */
export class DistributorAgent extends FoodLinkBaseAgent {
  private readonly distributorName: string;

  constructor(config: AgentConfig & { distributorName: string }) {
    super({ ...config, role: "DISTRIBUTOR" });
    this.distributorName = config.distributorName;
  }

  /**
   * Accepts an incoming batch from the processor.
   */
  async processIncomingBatch(batchId: string, event: ProvenanceEvent): Promise<void> {
    const isValid = await this.validateChainIntegrity(
      event.data["topicId"] as string,
      "PROCESSOR"
    );
    if (!isValid) {
      throw new Error(`Chain integrity validation failed for batch ${batchId}`);
    }
  }

  /**
   * Records the outbound shipment of a batch to a retailer.
   * Publishes a SHIP event with transit details and cold chain data.
   */
  async recordShipment(batchId: string, data: ShipmentData): Promise<string> {
    if (data.avgTemperatureC > COLD_CHAIN_MAX_TEMP_C) {
      this.coldChainViolations++;
    }

    const event = await this.buildSignedEvent(batchId, "SHIP", data.origin, {
      distributorName: this.distributorName,
      carrierName: data.carrierName,
      transitHours: data.transitHours,
      avgTemperatureC: data.avgTemperatureC,
      coldChainCompliant: data.avgTemperatureC <= COLD_CHAIN_MAX_TEMP_C,
      destination: data.destination,
    });

    const txId = await this.submitEvent(data.topicId, event);
    this.completedHandoffs++;
    return txId;
  }

  /**
   * Transfers custody to the retailer after delivery.
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
