import { z } from "zod";
import { router, publicProcedure } from "../context";
import type { AgentState } from "@foodlink/shared";

// ─── In-memory agent registry (replace with DB in production) ─────────────────

const agentRegistry = new Map<string, AgentState>();

// Seed demo agents
const demoAgents: AgentState[] = [
  {
    agentId: "agent-farm-0.0.11111",
    role: "FARM",
    hederaAccountId: "0.0.11111",
    trustScore: 98,
    activeBatches: ["42", "43", "44"],
    status: "ACTIVE",
    lastActivity: new Date().toISOString(),
    totalHandoffs: 147,
    coldChainViolations: 0,
    recallInvolvements: 0,
  },
  {
    agentId: "agent-processor-0.0.22222",
    role: "PROCESSOR",
    hederaAccountId: "0.0.22222",
    trustScore: 95,
    activeBatches: ["42"],
    status: "ACTIVE",
    lastActivity: new Date().toISOString(),
    totalHandoffs: 89,
    coldChainViolations: 1,
    recallInvolvements: 0,
  },
  {
    agentId: "agent-distributor-0.0.33333",
    role: "DISTRIBUTOR",
    hederaAccountId: "0.0.33333",
    trustScore: 92,
    activeBatches: ["42"],
    status: "ACTIVE",
    lastActivity: new Date().toISOString(),
    totalHandoffs: 213,
    coldChainViolations: 2,
    recallInvolvements: 0,
  },
  {
    agentId: "agent-retailer-0.0.44444",
    role: "RETAILER",
    hederaAccountId: "0.0.44444",
    trustScore: 100,
    activeBatches: ["42"],
    status: "IDLE",
    lastActivity: new Date().toISOString(),
    totalHandoffs: 67,
    coldChainViolations: 0,
    recallInvolvements: 0,
  },
];

demoAgents.forEach((agent) => agentRegistry.set(agent.agentId, agent));

// ─── Agent Router ──────────────────────────────────────────────────────────────

export const agentRouter = router({
  /**
   * Lists all registered supply chain agents with their trust scores.
   */
  list: publicProcedure.query(() => {
    return Array.from(agentRegistry.values()).sort((a, b) => b.trustScore - a.trustScore);
  }),

  /**
   * Returns the current state of a specific agent.
   */
  getStatus: publicProcedure
    .input(z.object({ agentId: z.string() }))
    .query(({ input }) => {
      const agent = agentRegistry.get(input.agentId);
      if (!agent) {
        return null;
      }
      return agent;
    }),

  /**
   * Registers a new agent in the registry.
   */
  register: publicProcedure
    .input(
      z.object({
        hederaAccountId: z.string(),
        role: z.enum(["FARM", "PROCESSOR", "DISTRIBUTOR", "RETAILER"]),
        name: z.string(),
      })
    )
    .mutation(({ input }) => {
      const agentId = `agent-${input.role.toLowerCase()}-${input.hederaAccountId}`;
      const newAgent: AgentState = {
        agentId,
        role: input.role,
        hederaAccountId: input.hederaAccountId,
        trustScore: 100,
        activeBatches: [],
        status: "ACTIVE",
        lastActivity: new Date().toISOString(),
        totalHandoffs: 0,
        coldChainViolations: 0,
        recallInvolvements: 0,
      };
      agentRegistry.set(agentId, newAgent);
      return newAgent;
    }),
});
