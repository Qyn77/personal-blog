import { router } from "./_core/trpc";
import { blogRouter } from "./routers/blog";
import { archiveRouter } from "./routers/archive";
import { adminRouter } from "./routers/admin";
import { aiRouter } from "./routers/ai";

import { mcpAdminRouter } from "./routers/mcpAdmin";

export const appRouter = router({
  mcpAdmin: mcpAdminRouter,
  blog: blogRouter,
  archive: archiveRouter,
  admin: adminRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
