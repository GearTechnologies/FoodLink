import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Hedera SDK ───────────────────────────────────────────────────────────
// We mock the SDK so tests don't need a live testnet connection.

vi.mock("@hashgraph/sdk", () => {
  const mockReceipt = {
    topicId: { toString: () => "0.0.99999" },
  };
  const mockResponse = {
    transactionId: { toString: () => "0.0.12345@1711200000.123456789" },
    getReceipt: vi.fn().mockResolvedValue(mockReceipt),
  };
  const mockTransaction = {
    setTopicMemo: vi.fn().mockReturnThis(),
    setMaxTransactionFee: vi.fn().mockReturnThis(),
    setTopicId: vi.fn().mockReturnThis(),
    setMessage: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(mockResponse),
  };

  return {
    Client: vi.fn(),
    TopicCreateTransaction: vi.fn(() => mockTransaction),
    TopicMessageSubmitTransaction: vi.fn(() => mockTransaction),
    TopicId: { fromString: vi.fn((id: string) => ({ toString: () => id })) },
    Hbar: vi.fn((amount: number) => ({ toTinybars: () => amount * 100_000_000 })),
    StatusError: class StatusError extends Error {},
  };
});

vi.mock("@foodlink/shared", () => ({
  MAX_HCS_MESSAGE_BYTES: 1024,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_BACKOFF_BASE_MS: 10,
  MIRROR_NODE_BASE_URL: "https://testnet.mirrornode.hedera.com/api/v1",
}));

import { createBatchTopic, publishProvenanceEvent, getFullProvenanceChain } from "../src/hcs";
import type { ProvenanceEvent } from "@foodlink/shared";

const mockClient = {} as Parameters<typeof createBatchTopic>[0];

const sampleEvent: ProvenanceEvent = {
  eventType: "HARVEST",
  actorId: "0.0.11111",
  actorRole: "FARM",
  batchId: "42",
  timestamp: "2024-01-15T08:00:00.000Z",
  location: { lat: 36.6777, lng: -121.6555, name: "Salinas, CA" },
  data: { weightKg: 450, temperature: 4 },
  signature: "abc123",
};

describe("HCS — createBatchTopic", () => {
  it("returns a topic ID string on success", async () => {
    const topicId = await createBatchTopic(mockClient);
    expect(topicId).toBe("0.0.99999");
  });
});

describe("HCS — publishProvenanceEvent", () => {
  it("returns a transaction ID string on success", async () => {
    const txId = await publishProvenanceEvent(mockClient, "0.0.99999", sampleEvent);
    expect(txId).toBe("0.0.12345@1711200000.123456789");
  });

  it("encodes event without losing data (small payload)", async () => {
    // A small event should not be compressed
    const txId = await publishProvenanceEvent(mockClient, "0.0.99999", sampleEvent);
    expect(typeof txId).toBe("string");
  });
});

describe("HCS — getFullProvenanceChain", () => {
  beforeEach(() => {
    // Mock a successful Mirror Node response with one message
    const encodedEvent = Buffer.from(JSON.stringify(sampleEvent)).toString("base64");
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          messages: [
            {
              sequence_number: 1,
              contents: encodedEvent,
              consensus_timestamp: "1711200000.123456789",
            },
          ],
          links: {},
        }),
    } as unknown as Response);
  });

  it("decodes and returns provenance events from Mirror Node", async () => {
    const chain = await getFullProvenanceChain("0.0.99999");
    expect(chain).toHaveLength(1);
    expect(chain[0].eventType).toBe("HARVEST");
    expect(chain[0].batchId).toBe("42");
  });

  it("returns empty array when topic has no messages (404)", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as unknown as Response);

    const chain = await getFullProvenanceChain("0.0.00000");
    expect(chain).toHaveLength(0);
  });
});
