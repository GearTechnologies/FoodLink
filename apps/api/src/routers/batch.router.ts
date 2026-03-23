import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  publicProcedure,
  protectedProcedure,
} from "../context";
import {
  BatchRegistrationSchema,
  HandoffEventSchema,
  RecallTriggerSchema,
  VerifyBatchSchema,
  HASHSCAN_BASE_URL,
  HEDERA_NETWORK,
} from "@foodlink/shared";
import {
  createBatchTopic,
  mintBatchNFT,
  publishProvenanceEvent,
  transferBatch,
  getFullProvenanceChain,
  getBatchesByFarm,
  getNFTMetadata,
  getNFTOwner,
  getBatchStatus,
  flagRecall,
  burnBatch,
} from "@foodlink/hedera";
import { RecallAgent } from "@foodlink/agents";
import { Client, PrivateKey, AccountId } from "@hashgraph/sdk";
import type { BatchMetadata } from "@foodlink/shared";

// ─── Hedera Operator Client ───────────────────────────────────────────────────

function getOperatorClient(): Client {
  const accountId = process.env["HEDERA_OPERATOR_ACCOUNT_ID"];
  const privateKey = process.env["HEDERA_OPERATOR_PRIVATE_KEY"];

  if (!accountId || !privateKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Hedera operator credentials not configured",
    });
  }

  const network = process.env["HEDERA_NETWORK"] ?? "testnet";
  const client =
    network === "mainnet"
      ? Client.forMainnet()
      : network === "previewnet"
        ? Client.forPreviewnet()
        : Client.forTestnet();

  client.setOperator(AccountId.fromString(accountId), PrivateKey.fromString(privateKey));
  return client;
}

function hashscanUrl(type: "transaction" | "topic" | "token", id: string): string {
  return `${HASHSCAN_BASE_URL}/${type}/${id}`;
}

// ─── Batch Router ──────────────────────────────────────────────────────────────

export const batchRouter = router({
  /**
   * Register a new crop batch on Hedera.
   * Creates HCS topic + mints HTS NFT + publishes HARVEST event.
   * Returns all Hedera IDs plus QR code data for physical label printing.
   */
  register: protectedProcedure
    .input(BatchRegistrationSchema)
    .mutation(async ({ input, ctx }) => {
      const client = getOperatorClient();
      const tokenId = process.env["HEDERA_TOKEN_ID"];
      const contractId = process.env["HEDERA_CONTRACT_ID"];

      if (!tokenId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "HEDERA_TOKEN_ID not configured",
        });
      }

      // Step 1: Create HCS topic for this batch's provenance chain
      const topicId = await createBatchTopic(client);

      // Step 2: Build batch NFT metadata
      const harvestDate = input.harvestDate;
      const metadata: BatchMetadata = {
        name: `${input.certifications.includes("ORGANIC_USDA") ? "Organic " : ""}${input.cropType} - Batch #${Date.now()}`,
        description: input.description ?? `Fresh ${input.cropType} from ${input.farmName}`,
        image: input.imageIpfsCid ? `ipfs://${input.imageIpfsCid}` : "ipfs://QmDefaultBatchImage",
        type: "CROP_BATCH",
        properties: {
          farmId: input.farmId,
          farmName: input.farmName,
          cropType: input.cropType,
          harvestDate,
          weightKg: input.weightKg,
          hcsTopicId: topicId,
          certifications: input.certifications,
        },
      };

      // Step 3: Mint HTS NFT
      const serialNumber = await mintBatchNFT(client, tokenId, metadata);
      const batchId = serialNumber.toString();

      // Step 4: Publish initial HARVEST provenance event
      const harvestEvent = {
        eventType: "HARVEST" as const,
        actorId: input.farmId,
        actorRole: "FARM" as const,
        batchId,
        timestamp: new Date().toISOString(),
        location: input.location,
        data: {
          farmName: input.farmName,
          cropType: input.cropType,
          weightKg: input.weightKg,
          certifications: input.certifications,
          harvestDate,
        },
        signature: "api-signed",
      };

      const txId = await publishProvenanceEvent(client, topicId, harvestEvent);

      // QR code data encodes the verification URL for label printing
      const qrCodeData = `${process.env["NEXT_PUBLIC_APP_URL"] ?? "https://foodlink.app"}/verify/${batchId}`;

      return {
        batchId,
        topicId,
        serialNumber,
        transactionId: txId,
        hederaExplorerUrl: hashscanUrl("transaction", txId),
        topicExplorerUrl: hashscanUrl("topic", topicId),
        qrCodeData,
      };
    }),

  /**
   * Record a supply chain handoff between two actors.
   * Validates custody, publishes HCS event, transfers NFT.
   */
  recordHandoff: protectedProcedure
    .input(HandoffEventSchema)
    .mutation(async ({ input, ctx }) => {
      const client = getOperatorClient();
      const tokenId = process.env["HEDERA_TOKEN_ID"];
      const contractId = process.env["HEDERA_CONTRACT_ID"];

      if (!tokenId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "HEDERA_TOKEN_ID not configured",
        });
      }

      // Validate the actor has custody of this batch
      const currentOwner = await getNFTOwner(tokenId, parseInt(input.batchId));
      if (currentOwner !== input.fromActorId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Account ${input.fromActorId} does not hold custody of batch ${input.batchId}`,
        });
      }

      // Publish provenance event to HCS
      const event = {
        eventType: input.eventType,
        actorId: input.fromActorId,
        actorRole: ctx.user.role,
        batchId: input.batchId,
        timestamp: new Date().toISOString(),
        location: input.location,
        data: input.data,
        signature: "api-signed",
      };

      const txId = await publishProvenanceEvent(client, input.topicId, event);

      // Transfer NFT custody
      await transferBatch(
        client,
        tokenId,
        parseInt(input.batchId),
        input.fromActorId,
        input.toActorId
      );

      return {
        transactionId: txId,
        hederaExplorerUrl: hashscanUrl("transaction", txId),
      };
    }),

  /**
   * Public batch verification — no authentication required.
   * Returns the full provenance chain for consumer QR scanning.
   */
  verify: publicProcedure
    .input(VerifyBatchSchema)
    .query(async ({ input }) => {
      const tokenId = process.env["HEDERA_TOKEN_ID"];
      const contractId = process.env["HEDERA_CONTRACT_ID"];

      if (!tokenId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "HEDERA_TOKEN_ID not configured",
        });
      }

      // Fetch NFT metadata from Mirror Node
      const metadata = await getNFTMetadata(tokenId, parseInt(input.batchId));
      const topicId = metadata.properties.hcsTopicId;

      // Get the full provenance chain from HCS
      const chain = await getFullProvenanceChain(topicId);

      // Check recall status from smart contract
      let isRecalled = false;
      let currentOwner = "";
      if (contractId) {
        try {
          const client = getOperatorClient();
          const status = await getBatchStatus(client, contractId, parseInt(input.batchId));
          isRecalled = status.recalled;
          currentOwner = status.owner;
        } catch {
          // Contract query failure is non-fatal — continue with chain data
        }
      }

      return {
        batchId: input.batchId,
        topicId,
        isRecalled,
        chain,
        certifications: metadata.properties.certifications,
        farmDetails: {
          farmId: metadata.properties.farmId,
          farmName: metadata.properties.farmName,
          cropType: metadata.properties.cropType,
          harvestDate: metadata.properties.harvestDate,
          weightKg: metadata.properties.weightKg,
        },
        currentOwner,
        topicExplorerUrl: hashscanUrl("topic", topicId),
      };
    }),

  /**
   * Trigger a contamination recall. Runs the recall agent autonomously.
   * The recall agent identifies all affected batches and alerts retailers in <5s.
   */
  triggerRecall: protectedProcedure
    .input(RecallTriggerSchema)
    .mutation(async ({ input, ctx }) => {
      const tokenId = process.env["HEDERA_TOKEN_ID"];
      const contractId = process.env["HEDERA_CONTRACT_ID"];
      const privateKey = process.env["HEDERA_OPERATOR_PRIVATE_KEY"];
      const accountId = process.env["HEDERA_OPERATOR_ACCOUNT_ID"];

      if (!tokenId || !contractId || !privateKey || !accountId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Hedera configuration incomplete for recall",
        });
      }

      const recallAgent = new RecallAgent({
        role: "FARM", // Uses RECALL_AGENT_ROLE on contracts
        hederaAccountId: accountId,
        privateKeyStr: privateKey,
        network: (process.env["HEDERA_NETWORK"] as "testnet" | "mainnet" | undefined) ?? "testnet",
      });

      const report = await recallAgent.executeRecall({
        farmId: input.farmId,
        cropType: input.cropType,
        detectionDate: input.detectionDate,
        reason: input.reason,
        tokenId,
        contractId,
      });

      return {
        ...report,
        alertExplorerUrls: report.alertTransactionIds.map((txId) =>
          hashscanUrl("transaction", txId)
        ),
      };
    }),
});
