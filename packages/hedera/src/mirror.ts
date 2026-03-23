import { BatchMetadata, MIRROR_NODE_BASE_URL, RECALL_WINDOW_DAYS } from "@foodlink/shared";

// ─── Mirror Node Response Types ───────────────────────────────────────────────

interface MirrorNFTResponse {
  token_id: string;
  serial_number: number;
  metadata: string; // base64 encoded
  account_id: string;
}

interface MirrorNFTListResponse {
  nfts: MirrorNFTResponse[];
  links?: { next?: string };
}

interface MirrorTopicMessage {
  sequence_number: number;
  contents: string; // base64 encoded
  consensus_timestamp: string;
}

interface MirrorTopicMessagesResponse {
  messages: MirrorTopicMessage[];
  links?: { next?: string };
}

// ─── HTTP Helper ─────────────────────────────────────────────────────────────

async function mirrorGet<T>(path: string): Promise<T> {
  const url = `${MIRROR_NODE_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Mirror Node ${path} failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

// ─── NFT Metadata Query ───────────────────────────────────────────────────────

/**
 * Retrieves the BatchMetadata stored in an NFT's on-chain metadata field.
 *
 * @param tokenId - The FoodLink HTS collection token ID (e.g., "0.0.12345")
 * @param serialNumber - The NFT serial number (= batchId)
 * @returns Parsed BatchMetadata object
 * @throws Error if the NFT does not exist or metadata is malformed
 */
export async function getNFTMetadata(
  tokenId: string,
  serialNumber: number
): Promise<BatchMetadata> {
  const data = await mirrorGet<MirrorNFTResponse>(
    `/tokens/${tokenId}/nfts/${serialNumber}`
  );
  const json = Buffer.from(data.metadata, "base64").toString("utf8");
  return JSON.parse(json) as BatchMetadata;
}

/**
 * Retrieves the current owner Hedera account ID of an NFT.
 *
 * @param tokenId - The FoodLink HTS collection token ID
 * @param serialNumber - The NFT serial number
 * @returns Hedera account ID of the current NFT holder
 */
export async function getNFTOwner(tokenId: string, serialNumber: number): Promise<string> {
  const data = await mirrorGet<MirrorNFTResponse>(
    `/tokens/${tokenId}/nfts/${serialNumber}`
  );
  return data.account_id;
}

// ─── Farm Batch Query ─────────────────────────────────────────────────────────

/**
 * Returns all active batches from a specific farm account within the recall window.
 * Used by the recall agent to identify all potentially affected batches.
 *
 * @param farmAccountId - Hedera account ID of the farm (e.g., "0.0.12345")
 * @param tokenId - The FoodLink HTS collection token ID
 * @param daysBack - How many days back to search (default: RECALL_WINDOW_DAYS)
 * @returns Array of NFTs with their serial numbers and parsed metadata
 */
export async function getBatchesByFarm(
  farmAccountId: string,
  tokenId: string,
  daysBack: number = RECALL_WINDOW_DAYS
): Promise<Array<{ tokenId: string; serialNumber: number; metadata: BatchMetadata }>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const results: Array<{ tokenId: string; serialNumber: number; metadata: BatchMetadata }> = [];
  let nextPath: string | undefined =
    `/tokens/${tokenId}/nfts?account.id=${farmAccountId}&limit=100&order=desc`;

  while (nextPath) {
    const data = await mirrorGet<MirrorNFTListResponse>(nextPath);

    for (const nft of data.nfts) {
      try {
        const metadata = JSON.parse(
          Buffer.from(nft.metadata, "base64").toString("utf8")
        ) as BatchMetadata;

        // Filter by harvest date within recall window
        const harvestDate = new Date(metadata.properties.harvestDate);
        if (harvestDate >= cutoffDate) {
          results.push({
            tokenId: nft.token_id,
            serialNumber: nft.serial_number,
            metadata,
          });
        }
      } catch {
        // Skip NFTs with malformed metadata
      }
    }

    nextPath = data.links?.next ?? undefined;
  }

  return results;
}

// ─── Topic Messages Query ─────────────────────────────────────────────────────

/**
 * Fetches all raw messages from an HCS topic, sorted by sequence number.
 *
 * @param topicId - The HCS topic ID to query (e.g., "0.0.12345")
 * @returns Array of raw topic messages with sequence numbers and timestamps
 */
export async function getTopicMessages(
  topicId: string
): Promise<Array<{ sequenceNumber: number; contents: string; consensusTimestamp: string }>> {
  const messages: Array<{
    sequenceNumber: number;
    contents: string;
    consensusTimestamp: string;
  }> = [];

  let nextPath: string | undefined =
    `/topics/${topicId}/messages?limit=100&order=asc`;

  while (nextPath) {
    const data = await mirrorGet<MirrorTopicMessagesResponse>(nextPath);

    for (const msg of data.messages) {
      messages.push({
        sequenceNumber: msg.sequence_number,
        contents: msg.contents,
        consensusTimestamp: msg.consensus_timestamp,
      });
    }

    nextPath = data.links?.next ?? undefined;
  }

  return messages;
}
