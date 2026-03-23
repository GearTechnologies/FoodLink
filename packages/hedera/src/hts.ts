import {
  Client,
  TokenMintTransaction,
  TransferTransaction,
  TokenBurnTransaction,
  AccountId,
  TokenId,
  NftId,
  Hbar,
  StatusError,
} from "@hashgraph/sdk";
import {
  BatchMetadata,
  MAX_RETRY_ATTEMPTS,
  RETRY_BACKOFF_BASE_MS,
} from "@foodlink/shared";

// ─── Retry Helper ─────────────────────────────────────────────────────────────

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

// ─── NFT Minting ──────────────────────────────────────────────────────────────

/**
 * Mints a new crop batch NFT on the shared FoodLink HTS token collection.
 * The serial number is used as the batchId throughout the entire system.
 *
 * @param client - Initialized Hedera client with operator credentials (treasury)
 * @param tokenId - The FoodLink HTS NFT collection token ID (e.g., "0.0.12345")
 * @param metadata - Complete batch metadata including farm details and HCS topic link
 * @returns The serial number of the newly minted NFT
 * @throws StatusError on Hedera-level errors
 * @throws Error if minting fails after MAX_RETRY_ATTEMPTS
 */
export async function mintBatchNFT(
  client: Client,
  tokenId: string,
  metadata: BatchMetadata
): Promise<number> {
  const metadataBytes = Buffer.from(JSON.stringify(metadata));

  return withRetry(async () => {
    const transaction = new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .addMetadata(metadataBytes)
      .setMaxTransactionFee(new Hbar(2));

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    const serials = receipt.serials;
    if (!serials || serials.length === 0) {
      throw new Error("Mint succeeded but no serial numbers returned in receipt");
    }

    return serials[0].toNumber();
  });
}

// ─── NFT Transfer ─────────────────────────────────────────────────────────────

/**
 * Transfers a batch NFT from one supply chain actor to the next.
 * Called at every custody handoff: farm→processor→distributor→retailer.
 *
 * @param client - Hedera client for the current NFT owner (must sign)
 * @param tokenId - The FoodLink HTS collection token ID
 * @param serialNumber - Serial number of the batch NFT to transfer
 * @param fromAccountId - Hedera account ID of the current owner
 * @param toAccountId - Hedera account ID of the next custody holder
 * @throws StatusError if the transfer is rejected by Hedera
 * @throws Error if transfer fails after MAX_RETRY_ATTEMPTS
 */
export async function transferBatch(
  client: Client,
  tokenId: string,
  serialNumber: number,
  fromAccountId: string,
  toAccountId: string
): Promise<void> {
  await withRetry(async () => {
    const nftId = new NftId(TokenId.fromString(tokenId), serialNumber);

    const transaction = new TransferTransaction()
      .addNftTransfer(nftId, AccountId.fromString(fromAccountId), AccountId.fromString(toAccountId))
      .setMaxTransactionFee(new Hbar(2));

    const response = await transaction.execute(client);
    await response.getReceipt(client);
  });
}

// ─── NFT Burn ─────────────────────────────────────────────────────────────────

/**
 * Burns a recalled batch NFT, permanently removing it from circulation.
 * Called by the recall agent when contamination is confirmed.
 *
 * @param client - Hedera client for the token treasury
 * @param tokenId - The FoodLink HTS collection token ID
 * @param serialNumber - Serial number of the batch NFT to burn
 * @throws StatusError if the burn is rejected by Hedera
 * @throws Error if burn fails after MAX_RETRY_ATTEMPTS
 */
export async function burnBatch(
  client: Client,
  tokenId: string,
  serialNumber: number
): Promise<void> {
  await withRetry(async () => {
    const transaction = new TokenBurnTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .addSerial(serialNumber)
      .setMaxTransactionFee(new Hbar(2));

    const response = await transaction.execute(client);
    await response.getReceipt(client);
  });
}
