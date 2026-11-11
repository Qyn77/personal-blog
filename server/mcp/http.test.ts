import { afterAll, beforeAll, expect, it, vi } from "vitest";
import fs from "node:fs";
import express from "express";
import { createServer, type Server } from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
vi.mock("../root", async () => {
  const os = await import("node:os");
  const path = await import("node:path");
  return { ROOT_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "ink-mcp-http-")) };
});
import { ROOT_DIR } from "../root";
import { mcpRouter, previewRouter } from "./http";
import { createToken, revokeToken } from "./store";
let server: Server;
let origin: string;
beforeAll(async () => {
  const app = express();
  app.use("/mcp", mcpRouter);
  app.use("/api/mcp-preview", previewRouter);
  server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  vi.stubEnv("SITE_URL", origin);
});
afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
  fs.rmSync(ROOT_DIR, { recursive: true, force: true });
  vi.unstubAllEnvs();
});
it("requires authentication for every HTTP request and rejects untrusted origins", async () => {
  expect(
    (
      await fetch(`${origin}/mcp`, {
        method: "POST",
        body: "{}",
        headers: { "Content-Type": "application/json" },
      })
    ).status
  ).toBe(401);
  const { secret } = await createToken({
    name: "http",
    scopes: ["content:read"],
  });
  expect(
    (
      await fetch(`${origin}/mcp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          Origin: "https://evil.example",
        },
      })
    ).status
  ).toBe(403);
  expect(
    (
      await fetch(`${origin}/mcp`, {
        headers: { Authorization: `Bearer ${secret}` },
      })
    ).status
  ).toBe(405);
});
it("supports the official client, filters tools and rejects revoked access", async () => {
  const { secret, token } = await createToken({
    name: "reader",
    scopes: ["content:read"],
  });
  const client = new Client({ name: "test-client", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${secret}` } },
      })
    );
    const { tools } = await client.listTools();
    expect(tools.map(t => t.name)).toContain("list_articles");
    expect(tools.map(t => t.name)).not.toContain("create_article");
    const result = await client.callTool({
      name: "list_articles",
      arguments: {},
    });
    expect(result.isError).not.toBe(true);
    await revokeToken(token.id);
    await expect(
      client.callTool({ name: "list_articles", arguments: {} })
    ).rejects.toThrow();
  } finally {
    await client.close();
  }
});
it("creates, previews and publishes through MCP protocol", async () => {
  const { secret } = await createToken({
    name: "publisher",
    scopes: ["content:read", "content:write", "content:publish"],
  });
  const client = new Client({ name: "write-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${secret}` } },
      })
    );
    const created = await client.callTool({
      name: "create_article",
      arguments: {
        requestId: "integration-one",
        title: "协议测试",
        content: "# 正文",
        date: "2026-11-11",
        category: "测试",
      },
    });
    expect(created.isError).not.toBe(true);
    const article = created.structuredContent as {
      id: string;
      updatedAt: number;
      status: string;
    };
    expect(article.status).toBe("draft");
    const preview = await client.callTool({
      name: "create_preview",
      arguments: { id: article.id },
    });
    const url = (preview.structuredContent as { url: string }).url;
    const response = await fetch(`${origin}/api/mcp-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: new URL(url).hash.slice(1) }),
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    expect((await response.json()).article.title).toBe("协议测试");
    const published = await client.callTool({
      name: "set_article_status",
      arguments: {
        id: article.id,
        expectedUpdatedAt: article.updatedAt,
        status: "published",
        requestId: "integration-publish",
      },
    });
    expect(published.structuredContent).toMatchObject({
      status: "published",
      subscriberNotificationSent: false,
    });
  } finally {
    await client.close();
  }
});
it("exposes all management tools and performs archive, About and AI writes over HTTP", async () => {
  fs.mkdirSync(`${ROOT_DIR}/public`, { recursive: true });
  fs.writeFileSync(
    `${ROOT_DIR}/public/about-config.json`,
    JSON.stringify({
      hero: { image: "", title: "Qyn", paragraphs: [], quote: "" },
      interests: [],
      favorites: [],
    })
  );
  const { scopes } = await import("./store");
  const { secret } = await createToken({
    name: "management",
    scopes: [...scopes],
  });
  const client = new Client({ name: "management-test", version: "1" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${secret}` } },
      })
    );
    expect((await client.listTools()).tools).toHaveLength(19);
    const call = async (name: string, args: Record<string, unknown> = {}) => {
      const result = await client.callTool({ name, arguments: args });
      expect(result.isError, JSON.stringify(result.content)).not.toBe(true);
      return result.structuredContent as Record<string, any>;
    };
    const archive = await call("create_archive", {
      title: "公开记录",
      content: "学习心得",
      category: "学习",
      date: "2026-11-11",
      requestId: "http-archive-create",
    });
    const changed = await call("update_archive", {
      id: archive.id,
      expectedUpdatedAt: archive.updatedAt,
      title: "更新记录",
      requestId: "http-archive-update",
    });
    expect((await call("get_archive", { id: archive.id })).title).toBe(
      "更新记录"
    );
    await call("delete_archive", {
      id: archive.id,
      expectedUpdatedAt: changed.updatedAt,
      confirmTitle: "更新记录",
      requestId: "http-archive-delete",
    });
    const about = await call("get_about");
    const updated = await call("update_about", {
      hero: { quote: "继续学习" },
      expectedRevision: about.revision,
      requestId: "http-about-update",
    });
    expect(updated.config.hero.title).toBe("Qyn");
    const ai = await call("get_ai_config");
    const saved = await call("update_ai_config", {
      apiKey: "fixture-secret",
      enabled: true,
      expectedRevision: ai.revision,
      requestId: "http-ai-update",
    });
    expect(saved.config.hasApiKey).toBe(true);
    expect(JSON.stringify(await call("get_ai_config"))).not.toContain(
      "fixture-secret"
    );
  } finally {
    await client.close();
  }
});
