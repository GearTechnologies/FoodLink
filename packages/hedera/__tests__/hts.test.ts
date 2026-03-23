import { describe, it, expect, vi } from "vitest";

// ─── Mock Hedera SDK ───────────────────────────────────────────────────────────

vi.mock("@hashgraph/sdk", () => {
  const mockReceipt = {
    serials: [{ toNumber: () => 42 }],
  };
  const mockResponse = {
    transactionId: { toString: () => "0.0.12345@1711200000.123456789" },
    getReceipt: vi.fn().mockResolvedValue(mockReceipt),
  };
  const mockMintTx = {
    setTokenId: vi.fn().mockReturnThis(),
    addMetadata: vi.fn().mockReturnThis(),
    setMaxTransactionFee: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(mockResponse),
  };
  const mockTransferTx = {
    addNftTransfer: vi.fn().mockReturnThis(),
    setMaxTransactionFee: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(mockResponse),
  };
  const mockBurnTx = {
    setTokenId: vi.fn().mockReturnThis(),
    addSerial: vi.fn().mockReturnThis(),
    setMaxTransactionFee: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(mockResponse),
  };

  return {
    Client: vi.fn(),
    TokenMintTransaction: vi.fn(() => mockMintTx),
    TransferTransaction: vi.fn(() => mockTransferTx),
    TokenBurnTransaction: vi.fn(() => mockBurnTx),
    AccountId: { fromString: vi.fn((id: string) => id) },
    TokenId: { fromString: vi.fn((id: string) => id) },
    NftId: vi.fn((tokenId: string, serial: number) => ({ tokenId, serial })),
    Hbar: vi.fn((amount: number) => ({ amount })),
    StatusError: class StatusError extends Error {},
  };
});

vi.mock("@foodlink/shared", () => ({
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_BACKOFF_BASE_MS: 10,
}));

import { mintBatchNFT, transferBatch, burnBatch } from "../src/hts";
import type { BatchMetadata } from "@foodlink/shared";

const mockClient = {} as Parameters<typeof mintBatchNFT>[0];

const sampleMetadata: BatchMetadata = {
  name: "Organic Romaine Lettuce - Batch #42",
  description: "Fresh organic romaine lettuce from Salinas Valley",
  image: "ipfs://QmXXX",
  type: "CROP_BATCH",
  properties: {
    farmId: "0.0.11111",
    farmName: "Green Valley Farm",
    cropType: "Romaine Lettuce",
    harvestDate: "2024-01-15T08:00:00.000Z",
    weightKg: 450,
    hcsTopicId: "0.0.99999",
    certifications: ["ORGANIC_USDA"],
  },
};

describe("HTS — mintBatchNFT", () => {
  it("returns the serial number on success", async () => {
    const serial = await mintBatchNFT(mockClient, "0.0.12345", sampleMetadata);
    expect(serial).toBe(42);
  });
});

describe("HTS — transferBatch", () => {
  it("resolves without error on success", async () => {
    await expect(
      transferBatch(mockClient, "0.0.12345", 42, "0.0.11111", "0.0.22222")
    ).resolves.toBeUndefined();
  });
});

describe("HTS — burnBatch", () => {
  it("resolves without error on success", async () => {
    await expect(burnBatch(mockClient, "0.0.12345", 42)).resolves.toBeUndefined();
  });
});
