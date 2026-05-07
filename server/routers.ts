import { router } from "./_core/trpc";
import { blogRouter } from "./routers/blog";
import { archiveRouter } from "./routers/archive";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  blog: blogRouter,
  archive: archiveRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
