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

const PROJECT_ROOT = process.cwd();

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
  
  // 提供 books / archives 文件夹静态文件（始终从项目根目录读取，与上传路径一致）
  app.use("/books", express.static(path.join(PROJECT_ROOT, "books")));
  app.use("/archives", express.static(path.join(PROJECT_ROOT, "archives")));

  // 认证 API
  app.use("/api/auth", authRouter);

  // 文件上传 API（需要认证）
  app.use("/api/upload", uploadRouter);

  // RSS + Sitemap + 订阅验证
  app.use(rssRouter);
  app.use(sitemapRouter);
  app.use("/api", subscribeRouter);

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
    await setupVite(app, server, PROJECT_ROOT);
  } else {
    serveStatic(app, PROJECT_ROOT);
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
