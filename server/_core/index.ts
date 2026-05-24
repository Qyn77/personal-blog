import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { uploadRouter } from "../routes/upload";
import { authRouter } from "../routes/auth";
import { rssRouter } from "../routes/rss";
import { sitemapRouter } from "../routes/sitemap";
import { subscribeRouter } from "../routes/subscribe";
import { visitorRouter } from "../routes/visitor";
import { ROOT_DIR } from "../root";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Body parser — 2MB 足够博客文章内容（文件上传由 multer 单独处理）
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  // 忽略 Chrome DevTools 等 .well-known 探测请求
  app.use("/.well-known", ((_req: unknown, res: unknown) => {
    (res as any).status(204).end();
  }) as any);

  // 静态资源：books / archives / images
  const imagesDir =
    process.env.NODE_ENV === "development"
      ? path.join(ROOT_DIR, "client/public/images")
      : path.join(ROOT_DIR, "public/images");
  app.use("/books", express.static(path.join(ROOT_DIR, "books")));
  app.use("/archives", express.static(path.join(ROOT_DIR, "archives")));
  app.use("/images", express.static(imagesDir));

  // 认证 API
  app.use("/api/auth", authRouter);

  // 文件上传 API（需要认证）
  app.use("/api/upload", uploadRouter);

  // RSS + Sitemap + 订阅验证
  app.use(rssRouter);
  app.use(sitemapRouter);
  app.use("/api", subscribeRouter);

  // 访客追踪
  app.use("/api", visitorRouter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server, ROOT_DIR);
  } else {
    serveStatic(app, ROOT_DIR);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
