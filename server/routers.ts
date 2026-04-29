import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { blogRouter } from "./routers/blog";
import { blogImagesRouter } from "./routers/blogImages";
import { archiveRouter } from "./routers/archive";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  blog: blogRouter,
  blogImages: blogImagesRouter,
  archive: archiveRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
