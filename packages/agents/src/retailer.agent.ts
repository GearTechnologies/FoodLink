import { Location } from "@foodlink/shared";
import { FoodLinkBaseAgent, AgentConfig } from "./base.agent";
import type { ProvenanceEvent } from "@foodlink/shared";

export interface RetailReceiptData {
  topicId: string;
  arrivalTemperatureC: number;
  shelfLocation: string;
  location: Location;
}

/**
 * Retailer agent — the final step in the supply chain before consumer purchase.
 * Records the RECEIVE event confirming arrival and shelf placement.
 */
export class RetailerAgent extends FoodLinkBaseAgent {
  private readonly storeName: string;

  constructor(config: AgentConfig & { storeName: string }) {
    super({ ...config, role: "RETAILER" });
    this.storeName = config.storeName;
  }

  /**
   * Accepts incoming batch from the distributor.
   */
  async processIncomingBatch(batchId: string, event: ProvenanceEvent): Promise<void> {
    const isValid = await this.validateChainIntegrity(
      event.data["topicId"] as string,
      "DISTRIBUTOR"
    );
    if (!isValid) {
      throw new Error(`Chain integrity validation failed for batch ${batchId}`);
    }
  }

  /**
   * Records the retail receiving event — batch has arrived at the store.
   * Publishes a RECEIVE event with arrival conditions.
   */
  async recordArrival(batchId: string, data: RetailReceiptData): Promise<string> {
    const event = await this.buildSignedEvent(batchId, "RECEIVE", data.location, {
      storeName: this.storeName,
      arrivalTemperatureC: data.arrivalTemperatureC,
      shelfLocation: data.shelfLocation,
      receivedAt: new Date().toISOString(),
    });

    const txId = await this.submitEvent(data.topicId, event);
    this.completedHandoffs++;
    return txId;
  }

  /**
   * Records the retail shelf placement — batch is available to consumers.
   * Publishes a RETAIL event signaling the batch is on-shelf.
   */
  async recordRetailPlacement(
    batchId: string,
    topicId: string,
    location: Location,
    price: number
  ): Promise<string> {
    const event = await this.buildSignedEvent(batchId, "RETAIL", location, {
      storeName: this.storeName,
      price,
      placedAt: new Date().toISOString(),
    });

    return this.submitEvent(topicId, event);
  }

  /**
   * Not applicable for retailers — they are the last custody holder.
   */
  async publishHandoffEvent(_batchId: string, _nextActorId: string): Promise<void> {
    throw new Error("Retailer is the final custody holder — no downstream handoff");
  }
}
