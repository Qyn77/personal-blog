import { router } from "./_core/trpc";
import { blogRouter } from "./routers/blog";
import { archiveRouter } from "./routers/archive";

export const appRouter = router({
  blog: blogRouter,
  archive: archiveRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
