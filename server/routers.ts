import { router } from "./_core/trpc";
import { blogRouter } from "./routers/blog";
import { archiveRouter } from "./routers/archive";

export const appRouter = router({
  blog: blogRouter,
  archive: archiveRouter,
});

export type AppRouter = typeof appRouter;
