import { z } from "zod";

// ─── Location Schema ──────────────────────────────────────────────────────────

export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  name: z.string().min(1).max(200),
});

// ─── Batch Schemas ────────────────────────────────────────────────────────────

export const BatchRegistrationSchema = z.object({
  farmId: z.string().regex(/^0\.0\.\d+$/, "Must be a valid Hedera account ID"),
  farmName: z.string().min(2).max(100),
  cropType: z.string().min(2).max(100),
  weightKg: z.number().positive().max(100000),
  harvestDate: z.string().datetime({ offset: true }),
  location: LocationSchema,
  certifications: z.array(z.string()).default([]),
  imageIpfsCid: z.string().optional(),
  description: z.string().max(500).optional(),
});

export const HandoffEventSchema = z.object({
  batchId: z.string().min(1),
  topicId: z.string().regex(/^0\.0\.\d+$/, "Must be a valid Hedera topic ID"),
  fromActorId: z.string().regex(/^0\.0\.\d+$/, "Must be a valid Hedera account ID"),
  toActorId: z.string().regex(/^0\.0\.\d+$/, "Must be a valid Hedera account ID"),
  eventType: z.enum(["HARVEST", "PROCESS", "SHIP", "RECEIVE", "RETAIL", "CONTAMINATION_ALERT"]),
  location: LocationSchema,
  data: z.record(z.unknown()),
});

export const RecallTriggerSchema = z.object({
  farmId: z.string().regex(/^0\.0\.\d+$/, "Must be a valid Hedera account ID"),
  cropType: z.string().min(1).max(100),
  detectionDate: z.string().datetime({ offset: true }),
  reason: z.string().max(500).optional(),
});

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const AuthChallengeSchema = z.object({
  hederaAccountId: z.string().regex(/^0\.0\.\d+$/, "Must be a valid Hedera account ID"),
});

export const AuthVerifySchema = z.object({
  hederaAccountId: z.string().regex(/^0\.0\.\d+$/, "Must be a valid Hedera account ID"),
  signature: z.string().min(1),
  nonce: z.string().min(1),
});

// ─── Agent Registration Schema ────────────────────────────────────────────────

export const AgentRegistrationSchema = z.object({
  hederaAccountId: z.string().regex(/^0\.0\.\d+$/, "Must be a valid Hedera account ID"),
  role: z.enum(["FARM", "PROCESSOR", "DISTRIBUTOR", "RETAILER"]),
  name: z.string().min(2).max(100),
  location: LocationSchema,
});

// ─── Verify Schema ────────────────────────────────────────────────────────────

export const VerifyBatchSchema = z.object({
  batchId: z.string().min(1),
});

// ─── Exported Types ───────────────────────────────────────────────────────────

export type BatchRegistrationInput = z.infer<typeof BatchRegistrationSchema>;
export type HandoffEventInput = z.infer<typeof HandoffEventSchema>;
export type RecallTriggerInput = z.infer<typeof RecallTriggerSchema>;
export type AuthChallengeInput = z.infer<typeof AuthChallengeSchema>;
export type AuthVerifyInput = z.infer<typeof AuthVerifySchema>;
export type AgentRegistrationInput = z.infer<typeof AgentRegistrationSchema>;
export type VerifyBatchInput = z.infer<typeof VerifyBatchSchema>;
