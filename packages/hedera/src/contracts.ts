import {
  Client,
  ContractExecuteTransaction,
  ContractCallQuery,
  ContractId,
  Hbar,
  ContractFunctionParameters,
  StatusError,
} from "@hashgraph/sdk";
import { MAX_RETRY_ATTEMPTS, RETRY_BACKOFF_BASE_MS } from "@foodlink/shared";

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
      if (err instanceof StatusError) throw err;
      if (i < attempts - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_BACKOFF_BASE_MS * Math.pow(2, i))
        );
      }
    }
  }
  throw lastError;
}

// ─── Contract: registerBatch ──────────────────────────────────────────────────

/**
 * Registers a newly minted batch in the BatchRegistry smart contract.
 * Called immediately after minting the HTS NFT.
 *
 * @param client - Hedera client (must have FARM_ROLE)
 * @param contractId - BatchRegistry contract ID on Hedera EVM
 * @param serialNumber - HTS NFT serial number of the batch
 * @param farmAccountId - Solidity-compatible address of the farm account
 * @param hcsTopicId - HCS topic ID for this batch's provenance chain
 * @param cropType - Type of crop (e.g., "Romaine Lettuce")
 * @returns Transaction ID for HashScan verification
 */
export async function registerBatch(
  client: Client,
  contractId: string,
  serialNumber: number,
  farmAccountId: string,
  hcsTopicId: string,
  cropType: string
): Promise<string> {
  return withRetry(async () => {
    const params = new ContractFunctionParameters()
      .addUint256(serialNumber)
      .addAddress(farmAccountId.replace("0.0.", "0x000000000000000000000000000000000000"))
      .addString(hcsTopicId)
      .addString(cropType);

    const tx = new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(contractId))
      .setGas(200_000)
      .setFunction("registerBatch", params)
      .setMaxTransactionFee(new Hbar(2));

    const response = await tx.execute(client);
    await response.getReceipt(client);
    return response.transactionId.toString();
  });
}

// ─── Contract: transferCustody ────────────────────────────────────────────────

/**
 * Records a custody transfer in the BatchRegistry smart contract.
 * Called at every supply chain handoff after the NFT transfer.
 *
 * @param client - Hedera client (current owner)
 * @param contractId - BatchRegistry contract ID
 * @param serialNumber - Batch serial number
 * @param newOwnerAccountId - Hedera account ID of the new owner
 * @returns Transaction ID
 */
export async function transferCustody(
  client: Client,
  contractId: string,
  serialNumber: number,
  newOwnerAccountId: string
): Promise<string> {
  return withRetry(async () => {
    const params = new ContractFunctionParameters()
      .addUint256(serialNumber)
      .addAddress(newOwnerAccountId.replace("0.0.", "0x000000000000000000000000000000000000"));

    const tx = new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(contractId))
      .setGas(150_000)
      .setFunction("transferCustody", params)
      .setMaxTransactionFee(new Hbar(2));

    const response = await tx.execute(client);
    await response.getReceipt(client);
    return response.transactionId.toString();
  });
}

// ─── Contract: flagRecall ─────────────────────────────────────────────────────

/**
 * Flags a batch as recalled in the BatchRegistry smart contract.
 * Only callable by accounts with RECALL_AGENT_ROLE.
 *
 * @param client - Hedera client (must have RECALL_AGENT_ROLE)
 * @param contractId - BatchRegistry contract ID
 * @param serialNumber - Batch serial number to recall
 * @param reason - Human-readable recall reason
 * @returns Transaction ID
 */
export async function flagRecall(
  client: Client,
  contractId: string,
  serialNumber: number,
  reason: string
): Promise<string> {
  return withRetry(async () => {
    const params = new ContractFunctionParameters()
      .addUint256(serialNumber)
      .addString(reason);

    const tx = new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(contractId))
      .setGas(150_000)
      .setFunction("flagRecall", params)
      .setMaxTransactionFee(new Hbar(2));

    const response = await tx.execute(client);
    await response.getReceipt(client);
    return response.transactionId.toString();
  });
}

// ─── Contract: getBatchStatus ─────────────────────────────────────────────────

/**
 * Reads the current status of a batch from the BatchRegistry contract.
 * Public view — no gas cost, no transaction needed.
 *
 * @param client - Any Hedera client (read-only)
 * @param contractId - BatchRegistry contract ID
 * @param serialNumber - Batch serial number
 * @returns Current owner address, recall flag, and HCS topic ID
 */
export async function getBatchStatus(
  client: Client,
  contractId: string,
  serialNumber: number
): Promise<{ owner: string; recalled: boolean; hcsTopicId: string }> {
  const params = new ContractFunctionParameters().addUint256(serialNumber);

  const result = await new ContractCallQuery()
    .setContractId(ContractId.fromString(contractId))
    .setGas(50_000)
    .setFunction("getBatchStatus", params)
    .execute(client);

  return {
    owner: result.getAddress(0),
    recalled: result.getBool(1),
    hcsTopicId: result.getString(2),
  };
}
