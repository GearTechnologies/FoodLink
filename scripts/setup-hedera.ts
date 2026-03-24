#!/usr/bin/env ts-node
/**
 * setup-hedera.ts
 *
 * One-time setup script: creates all Hedera testnet resources needed by FoodLink.
 * Run once before deployment: `npm run setup-hedera`
 *
 * Creates:
 *   - Global recall alerts HCS topic
 *   - FoodLink NFT token collection (HTS)
 *   - Outputs resource IDs to update .env with
 */

import {
  Client,
  PrivateKey,
  AccountId,
  TopicCreateTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  Hbar,
  AccountBalanceQuery,
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";
import * as fs from "fs";

const logFile = "/tmp/setup-hedera.log";
fs.writeFileSync(logFile, "Starting setup...\n");

function log(msg: string) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + "\n");
}

dotenv.config();

const OPERATOR_ID = process.env["HEDERA_OPERATOR_ACCOUNT_ID"];
const OPERATOR_KEY = process.env["HEDERA_OPERATOR_PRIVATE_KEY"];

if (!OPERATOR_ID || !OPERATOR_KEY) {
  console.error("❌ HEDERA_OPERATOR_ACCOUNT_ID and HEDERA_OPERATOR_PRIVATE_KEY must be set");
  process.exit(1);
}

async function setup() {
  const client = Client.forTestnet();
  const operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY!);
  client.setOperator(AccountId.fromString(OPERATOR_ID!), operatorKey);

  log("🌿 FoodLink Hedera Setup");
  log("=".repeat(50));
  log(`Operator: ${OPERATOR_ID}`);
  log("Network: testnet");
  log("");

  // ── 0. Check Balance ──────────────────────────────────────────────────────
  try {
    const balance = await new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(OPERATOR_ID!))
      .execute(client);
    log(`Payer balance: ${balance.hbars.toString()}`);
  } catch (err) {
    console.error("Failed to get operator balance", err);
  }

  // ── 1. Create Global Recall Alerts Topic ─────────────────────────────────
  log("📡 Creating global recall alerts HCS topic…");
  const recallTopicTx = new TopicCreateTransaction()
    .setTopicMemo("FoodLink Global Recall Alerts");

  log("Executing topic create...");
  const recallTopicResponse = await recallTopicTx.execute(client);
  log("Waiting for topic receipt...");
  const recallTopicReceipt = await recallTopicResponse.getReceipt(client);
  const recallTopicId = recallTopicReceipt.topicId!.toString();
  log(`   ✅ Recall topic: ${recallTopicId}`);
  log(`   🔗 https://hashscan.io/testnet/topic/${recallTopicId}`);

  // ── 2. Create FoodLink NFT Token Collection ───────────────────────────────
  log("\n🏷️  Creating FoodLink batch NFT collection (HTS)…");
  const tokenTx = new TokenCreateTransaction()
    .setTokenName("FoodLink Batch")
    .setTokenSymbol("FLBATCH")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(AccountId.fromString(OPERATOR_ID!))
    .setAdminKey(operatorKey)
    .setSupplyKey(operatorKey);

  log("Executing token create...");
  const tokenResponse = await tokenTx.execute(client);
  log("Waiting for token receipt...");
  const tokenReceipt = await tokenResponse.getReceipt(client);
  const tokenId = tokenReceipt.tokenId!.toString();
  log(`   ✅ Token collection: ${tokenId}`);
  log(`   🔗 https://hashscan.io/testnet/token/${tokenId}`);

  // ── 3. Output env vars ────────────────────────────────────────────────────
  log("\n" + "=".repeat(50));
  log("✅ Setup complete! Add to your .env file:");
  log("=".repeat(50));
  log(`HEDERA_TOKEN_ID=${tokenId}`);
  log(`HEDERA_RECALL_TOPIC_ID=${recallTopicId}`);
  log("");
  log("Deploy contracts next: npm run deploy-contracts");

  client.close();
}

setup().catch((err: unknown) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
