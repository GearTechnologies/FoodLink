import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router";
import { createContext } from "./context";
import { RecallAgent } from "@foodlink/agents";

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "FoodLink API",
    network: process.env["HEDERA_NETWORK"] ?? "testnet",
    timestamp: new Date().toISOString(),
  });
});

// ─── tRPC Handler ─────────────────────────────────────────────────────────────

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`tRPC error on ${path ?? "unknown"}:`, error.message);
    },
  })
);

// ─── Demo: Simulate Recall Endpoint ──────────────────────────────────────────

app.post("/api/simulate-recall", async (req, res) => {
  if (process.env["DEMO_MODE"] !== "true") {
    return res.status(403).json({ error: "Demo mode is disabled" });
  }

  const { farmId, cropType, detectionDate } = req.body as {
    farmId?: string;
    cropType?: string;
    detectionDate?: string;
  };

  if (!farmId || !cropType) {
    return res.status(400).json({ error: "farmId and cropType are required" });
  }

  const tokenId = process.env["HEDERA_TOKEN_ID"];
  const contractId = process.env["HEDERA_CONTRACT_ID"];
  const privateKey = process.env["HEDERA_OPERATOR_PRIVATE_KEY"];
  const accountId = process.env["HEDERA_OPERATOR_ACCOUNT_ID"];

  if (!tokenId || !contractId || !privateKey || !accountId) {
    return res.status(500).json({ error: "Hedera configuration incomplete" });
  }

  try {
    const recallAgent = new RecallAgent({
      role: "FARM",
      hederaAccountId: accountId,
      privateKeyStr: privateKey,
      network:
        (process.env["HEDERA_NETWORK"] as "testnet" | "mainnet" | undefined) ?? "testnet",
    });

    const report = await recallAgent.executeRecall({
      farmId,
      cropType,
      detectionDate: detectionDate ?? new Date().toISOString(),
      tokenId,
      contractId,
    });

    return res.json({
      success: true,
      report,
      demoMessage: `FoodLink alerted ${report.alertsSent} retailers in ${report.resolutionTimeMs}ms. Industry average: 604,800,000ms (7 days).`,
    });
  } catch (err) {
    console.error("Recall simulation error:", err);
    return res.status(500).json({ error: "Recall simulation failed", details: String(err) });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env["PORT"] ?? "3001", 10);

app.listen(PORT, () => {
  console.log(`🌱 FoodLink API running on http://localhost:${PORT}`);
  console.log(`   Network: ${process.env["HEDERA_NETWORK"] ?? "testnet"}`);
  console.log(`   Demo mode: ${process.env["DEMO_MODE"] === "true" ? "enabled" : "disabled"}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

export { app };
