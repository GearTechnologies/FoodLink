import { initTRPC, TRPCError } from "@trpc/server";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthPayload } from "@foodlink/shared";

// ─── Context ─────────────────────────────────────────────────────────────────

export interface Context {
  req: Request;
  res: Response;
  user: AuthPayload | null;
}

const JWT_SECRET = process.env["JWT_SECRET"] ?? "fallback-secret-change-in-prod";

/**
 * Creates the tRPC context from the incoming Express request.
 * Parses and verifies the JWT from the Authorization header if present.
 */
export function createContext({ req, res }: { req: Request; res: Response }): Context {
  let user: AuthPayload | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      user = jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
      // Invalid or expired token — treat as unauthenticated
    }
  }

  return { req, res, user };
}

// ─── tRPC Initialization ──────────────────────────────────────────────────────

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure — requires a valid JWT.
 * Throws UNAUTHORIZED if no user in context.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
