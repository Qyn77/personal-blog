import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { authenticate, siteUrl, type Token } from "./store";
import { createMcpServer } from "./server";
import { readPreview } from "./content";

export const mcpRouter = Router();
mcpRouter.use((_req, res, next) => {
  res.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  next();
});
mcpRouter.use(
  rateLimit({
    windowMs: 60000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    // This personal site uses a single reverse proxy; socket address avoids trusting spoofed forwarded IPs.
    keyGenerator: req => req.socket.remoteAddress || "unknown",
  })
);
mcpRouter.use(async (req, res, next) => {
  const origin = siteUrl();
  if (!origin) {
    res.status(503).json({ error: "MCP 尚未配置 SITE_URL" });
    return;
  }
  if (req.headers.origin && req.headers.origin !== origin) {
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }
  const header = req.headers.authorization;
  try {
    const token = header?.startsWith("Bearer ")
      ? await authenticate(header.slice(7))
      : null;
    if (!token) {
      res.setHeader(
        "WWW-Authenticate",
        'Bearer realm="ink-blog", error="invalid_token"'
      );
      res.status(401).json({ error: "MCP 令牌无效、过期或已撤销" });
      return;
    }
    res.locals.mcpToken = token;
    res.locals.mcpOrigin = origin;
    next();
  } catch {
    res.status(503).json({ error: "MCP 暂不可用" });
  }
});
mcpRouter.post("/", express.json({ limit: "2mb" }), async (req, res) => {
  const server = createMcpServer(
    res.locals.mcpToken as Token,
    res.locals.mcpOrigin as string
  );
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.once("close", () => {
    void server.close().catch(() => {});
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch {
    if (!res.headersSent)
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    await server.close().catch(() => {});
  }
});
mcpRouter.all("/", (_req, res) => {
  res.setHeader("Allow", "POST");
  res.status(405).end();
});

export const previewRouter = Router();
previewRouter.use((_req, res, next) => {
  res.set({
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "Referrer-Policy": "no-referrer",
  });
  next();
});
previewRouter.post("/", express.json({ limit: "1kb" }), async (req, res) => {
  try {
    const article =
      typeof req.body?.token === "string"
        ? await readPreview(req.body.token)
        : null;
    if (!article) {
      res.status(404).json({ error: "预览链接已失效" });
      return;
    }
    res.json({ article });
  } catch {
    res.status(503).json({ error: "预览暂不可用" });
  }
});
