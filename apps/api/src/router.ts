import { router } from "./context";
import { batchRouter } from "./routers/batch.router";
import { authRouter } from "./routers/auth.router";
import { agentRouter } from "./routers/agent.router";

export const appRouter = router({
  batch: batchRouter,
  auth: authRouter,
  agent: agentRouter,
});

export type AppRouter = typeof appRouter;
