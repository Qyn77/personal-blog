import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { verifyToken } from "../lib/auth";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/** 需要认证的 procedure — 从 Authorization header 中验证 JWT */
const authMiddleware = t.middleware(({ ctx, next }) => {
  const authHeader = ctx.req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "未登录" });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "登录已过期，请重新登录",
    });
  }

  return next();
});

export const protectedProcedure = t.procedure.use(authMiddleware);
