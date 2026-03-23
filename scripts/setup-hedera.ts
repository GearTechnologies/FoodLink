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
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";

dotenv.config();

const OPERATOR_ID = process.env["HEDERA_OPERATOR_ACCOUNT_ID"];
const OPERATOR_KEY = process.env["HEDERA_OPERATOR_PRIVATE_KEY"];

if (!OPERATOR_ID || !OPERATOR_KEY) {
  console.error("❌ HEDERA_OPERATOR_ACCOUNT_ID and HEDERA_OPERATOR_PRIVATE_KEY must be set");
  process.exit(1);
}

async function setup() {
  const client = Client.forTestnet();
  const operatorKey = PrivateKey.fromString(OPERATOR_KEY!);
  client.setOperator(AccountId.fromString(OPERATOR_ID!), operatorKey);

  console.log("🌿 FoodLink Hedera Setup");
  console.log("=".repeat(50));
  console.log(`Operator: ${OPERATOR_ID}`);
  console.log("Network: testnet");
  console.log("");

  // ── 1. Create Global Recall Alerts Topic ─────────────────────────────────
  console.log("📡 Creating global recall alerts HCS topic…");
  const recallTopicTx = new TopicCreateTransaction()
    .setTopicMemo("FoodLink Global Recall Alerts")
    .setMaxTransactionFee(new Hbar(2));

  const recallTopicResponse = await recallTopicTx.execute(client);
  const recallTopicReceipt = await recallTopicResponse.getReceipt(client);
  const recallTopicId = recallTopicReceipt.topicId!.toString();
  console.log(`   ✅ Recall topic: ${recallTopicId}`);
  console.log(`   🔗 https://hashscan.io/testnet/topic/${recallTopicId}`);

  // ── 2. Create FoodLink NFT Token Collection ───────────────────────────────
  console.log("\n🏷️  Creating FoodLink batch NFT collection (HTS)…");
  const tokenTx = new TokenCreateTransaction()
    .setTokenName("FoodLink Batch")
    .setTokenSymbol("FLBATCH")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(AccountId.fromString(OPERATOR_ID!))
    .setAdminKey(operatorKey)
    .setSupplyKey(operatorKey)
    .setMaxTransactionFee(new Hbar(30));

  const tokenResponse = await tokenTx.execute(client);
  const tokenReceipt = await tokenResponse.getReceipt(client);
  const tokenId = tokenReceipt.tokenId!.toString();
  console.log(`   ✅ Token collection: ${tokenId}`);
  console.log(`   🔗 https://hashscan.io/testnet/token/${tokenId}`);

  // ── 3. Output env vars ────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(50));
  console.log("✅ Setup complete! Add to your .env file:");
  console.log("=".repeat(50));
  console.log(`HEDERA_TOKEN_ID=${tokenId}`);
  console.log(`HEDERA_RECALL_TOPIC_ID=${recallTopicId}`);
  console.log("");
  console.log("Deploy contracts next: npm run deploy-contracts");

  client.close();
}

setup().catch((err: unknown) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
