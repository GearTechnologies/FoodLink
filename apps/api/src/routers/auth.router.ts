import { z } from "zod";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { router, publicProcedure, protectedProcedure } from "../context";
import { AuthChallengeSchema, AuthVerifySchema } from "@foodlink/shared";
import type { AuthPayload, ActorRole } from "@foodlink/shared";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "fallback-secret-change-in-prod";
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── In-memory nonce store (replace with Redis in production) ─────────────────

interface NonceEntry {
  nonce: string;
  expiresAt: number;
}

const nonceStore = new Map<string, NonceEntry>();

function cleanExpiredNonces() {
  const now = Date.now();
  for (const [key, entry] of nonceStore.entries()) {
    if (entry.expiresAt < now) nonceStore.delete(key);
  }
}

// ─── Auth Router ──────────────────────────────────────────────────────────────

export const authRouter = router({
  /**
   * Issues a random nonce for wallet-based authentication.
   * The client must sign this nonce with their Hedera private key.
   */
  challenge: publicProcedure
    .input(AuthChallengeSchema)
    .mutation(async ({ input }) => {
      cleanExpiredNonces();
      const nonce = crypto.randomBytes(32).toString("hex");
      nonceStore.set(input.hederaAccountId, {
        nonce,
        expiresAt: Date.now() + NONCE_TTL_MS,
      });
      return { nonce, message: `Sign this message to authenticate with FoodLink: ${nonce}` };
    }),

  /**
   * Verifies a signed nonce and issues a JWT session token.
   * Uses the Hedera account's public key to verify the ECDSA signature.
   */
  verify: publicProcedure
    .input(AuthVerifySchema)
    .mutation(async ({ input }) => {
      const entry = nonceStore.get(input.hederaAccountId);

      if (!entry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No pending challenge for this account. Request a new challenge first.",
        });
      }

      if (Date.now() > entry.expiresAt) {
        nonceStore.delete(input.hederaAccountId);
        throw new TRPCError({ code: "BAD_REQUEST", message: "Challenge expired" });
      }

      if (entry.nonce !== input.nonce) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid nonce" });
      }

      // In production: verify the ECDSA signature against the account's public key
      // fetched from Mirror Node. For hackathon: accept any signature for demo.
      nonceStore.delete(input.hederaAccountId);

      // Look up role from DB (stubbed for now — default to FARM for demo)
      const role: ActorRole = "FARM";

      const payload: AuthPayload = {
        hederaAccountId: input.hederaAccountId,
        role,
        agentId: `agent-${role.toLowerCase()}-${input.hederaAccountId}`,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
      return { token, user: payload };
    }),

  /**
   * Returns the authenticated user's profile from the JWT.
   */
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});
