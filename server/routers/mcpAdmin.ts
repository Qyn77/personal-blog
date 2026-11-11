import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createToken,
  listTokens,
  revokeToken,
  tokenInput,
  siteUrl,
  recentEvents,
} from "../mcp/store";

export const mcpAdminRouter = router({
  info: protectedProcedure.query(() => ({
    endpoint: siteUrl() ? `${siteUrl()}/mcp` : null,
  })),
  listTokens: protectedProcedure.query(listTokens),
  createToken: protectedProcedure
    .input(tokenInput)
    .mutation(({ input, ctx }) => {
      ctx.res.setHeader("Cache-Control", "no-store");
      return createToken(input);
    }),
  revokeToken: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await revokeToken(input.id);
      return { success: true };
    }),
  events: protectedProcedure.query(recentEvents),
});
