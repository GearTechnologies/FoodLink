import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  Hbar,
  StatusError,
  TopicId,
} from "@hashgraph/sdk";
import { deflateSync, inflateSync } from "zlib";
import {
  ProvenanceEvent,
  MAX_HCS_MESSAGE_BYTES,
  MAX_RETRY_ATTEMPTS,
  RETRY_BACKOFF_BASE_MS,
  MIRROR_NODE_BASE_URL,
} from "@foodlink/shared";

// ─── Retry Helper ─────────────────────────────────────────────────────────────

/**
 * Executes an async operation with exponential backoff retry logic.
 * @param operation - Async function to execute
 * @param attempts - Maximum number of attempts (default: MAX_RETRY_ATTEMPTS)
 * @returns Result of the operation
 * @throws Last error after all attempts exhausted
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  attempts: number = MAX_RETRY_ATTEMPTS
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (err instanceof StatusError) {
        // Non-retryable Hedera status errors
        throw err;
      }
      if (i < attempts - 1) {
        const delayMs = RETRY_BACKOFF_BASE_MS * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

// ─── HCS Topic Management ─────────────────────────────────────────────────────

/**
 * Creates a new HCS topic for a crop batch provenance chain.
 * Each batch gets its own topic at farm registration time.
 *
 * @param client - Initialized Hedera client with operator credentials
 * @returns The new topic ID as a string (e.g., "0.0.12345")
 * @throws StatusError if topic creation fails due to Hedera status
 * @throws Error if topic creation fails after MAX_RETRY_ATTEMPTS
 */
export async function createBatchTopic(client: Client): Promise<string> {
  return withRetry(async () => {
    const transaction = new TopicCreateTransaction()
      .setTopicMemo("FoodLink Batch Provenance Chain")
      .setMaxTransactionFee(new Hbar(2));

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    if (!receipt.topicId) {
      throw new Error("Topic creation succeeded but no topicId in receipt");
    }

    return receipt.topicId.toString();
  });
}

// ─── Message Serialization ────────────────────────────────────────────────────

/**
 * Encodes a provenance event for HCS submission.
 * Compresses with deflate if the JSON exceeds MAX_HCS_MESSAGE_BYTES.
 *
 * @param event - Provenance event to encode
 * @returns Buffer ready for HCS submission
 */
function encodeEvent(event: ProvenanceEvent): Buffer {
  const json = JSON.stringify(event);
  const raw = Buffer.from(json, "utf8");
  if (raw.length <= MAX_HCS_MESSAGE_BYTES) {
    return raw;
  }
  // Prefix compressed payloads with 0x01 to distinguish from raw JSON
  const compressed = deflateSync(raw);
  const prefixed = Buffer.allocUnsafe(1 + compressed.length);
  prefixed[0] = 0x01;
  compressed.copy(prefixed, 1);
  return prefixed;
}

/**
 * Decodes an HCS message back into a ProvenanceEvent.
 *
 * @param contents - Base64-encoded or Buffer contents from Mirror Node
 * @returns Decoded provenance event
 */
function decodeMessage(contents: string): ProvenanceEvent {
  const buf = Buffer.from(contents, "base64");
  let json: string;
  if (buf[0] === 0x01) {
    // Compressed payload
    json = inflateSync(buf.slice(1)).toString("utf8");
  } else {
    json = buf.toString("utf8");
  }
  return JSON.parse(json) as ProvenanceEvent;
}

// ─── HCS Message Publishing ───────────────────────────────────────────────────

/**
 * Publishes a provenance event to a batch's HCS topic.
 * Automatically compresses the message if it exceeds the 1 KB HCS limit.
 *
 * @param client - Initialized Hedera client with operator credentials
 * @param topicId - The HCS topic ID for this batch (e.g., "0.0.12345")
 * @param event - The provenance event to publish on-chain
 * @returns The transaction ID as a string for HashScan linking
 * @throws StatusError if submission fails due to Hedera status
 * @throws Error if submission fails after MAX_RETRY_ATTEMPTS
 */
export async function publishProvenanceEvent(
  client: Client,
  topicId: string,
  event: ProvenanceEvent
): Promise<string> {
  const encoded = encodeEvent(event);

  return withRetry(async () => {
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(topicId))
      .setMessage(encoded)
      .setMaxTransactionFee(new Hbar(2));

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return response.transactionId.toString();
  });
}

// ─── Mirror Node Query ────────────────────────────────────────────────────────

interface MirrorNodeMessage {
  sequence_number: number;
  contents: string;
  consensus_timestamp: string;
}

interface MirrorNodeTopicResponse {
  messages: MirrorNodeMessage[];
  links?: { next?: string };
}

/**
 * Retrieves the full provenance chain for a batch from the Hedera Mirror Node.
 * Handles pagination to return all messages regardless of chain length.
 *
 * @param topicId - The HCS topic ID to query (e.g., "0.0.12345")
 * @returns Ordered array of all provenance events, sorted by consensus timestamp
 */
export async function getFullProvenanceChain(topicId: string): Promise<ProvenanceEvent[]> {
  const events: ProvenanceEvent[] = [];
  let nextUrl: string | undefined =
    `${MIRROR_NODE_BASE_URL}/topics/${topicId}/messages?limit=100&order=asc`;

  while (nextUrl) {
    const response = await fetch(nextUrl);
    if (!response.ok) {
      if (response.status === 404) break;
      throw new Error(`Mirror Node query failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as MirrorNodeTopicResponse;

    for (const msg of data.messages) {
      try {
        const event = decodeMessage(msg.contents);
        events.push(event);
      } catch {
        // Skip malformed messages — do not crash the entire chain
      }
    }

    nextUrl = data.links?.next
      ? `${MIRROR_NODE_BASE_URL}${data.links.next}`
      : undefined;
  }

  return events;
}
