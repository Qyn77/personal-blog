import { afterAll, afterEach, expect, it, vi } from "vitest";
import fs from "node:fs";
vi.mock("../root", async () => {
  const os = await import("node:os");
  const path = await import("node:path");
  return {
    ROOT_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "ink-mcp-content-")),
  };
});
import { ROOT_DIR } from "../root";
import { createToken, revokeToken, scopes, recentEvents } from "./store";
import * as content from "./content";
import { updateArticle as adminUpdate, readDatabase } from "../db";
import { createResponseCache } from "../lib/responseCache";
const origin = "https://blog.example.com";
const input = {
  requestId: "create-one",
  title: "MCP 测试",
  content: "## 正文\n这里是草稿。",
  date: "2026-11-11",
  category: "开发",
  tags: ["MCP"],
};
const full = (await createToken({ name: "owner", scopes: [...scopes] })).token;
afterAll(() => fs.rmSync(ROOT_DIR, { recursive: true, force: true }));
afterEach(() => vi.restoreAllMocks());
it("creates drafts idempotently and detects request ID misuse", async () => {
  const first = await content.createArticle(full, input, origin);
  expect(first.status).toBe("draft");
  expect(first.url).toBeNull();
  expect(await content.createArticle(full, input, origin)).toEqual(first);
  expect((await content.listArticles(full, {})).total).toBe(1);
  await expect(
    content.createArticle(full, { ...input, title: "different" }, origin)
  ).rejects.toThrow("requestId");
  expect(
    (await recentEvents()).filter(e => e.action === "create_article")
  ).toHaveLength(1);
});
it("preserves omitted fields and detects concurrent admin edits", async () => {
  const article = await content.createArticle(
    full,
    { ...input, requestId: "version-one" },
    origin
  );
  const updated = await content.updateArticle(
    full,
    {
      id: article.id,
      expectedUpdatedAt: article.updatedAt,
      requestId: "update-one",
      title: "新标题",
    },
    origin
  );
  expect((await content.getArticle(full, article.id)).tags).toEqual(["MCP"]);
  expect(updated.updatedAt).toBeGreaterThan(article.updatedAt);
  await adminUpdate(article.id, { title: "后台刚刚修改" });
  await expect(
    content.updateArticle(
      full,
      {
        id: article.id,
        expectedUpdatedAt: updated.updatedAt,
        requestId: "stale-one",
        title: "覆盖",
      },
      origin
    )
  ).rejects.toThrow("版本冲突");
  expect((await content.getArticle(full, article.id)).title).toBe(
    "后台刚刚修改"
  );
});
it("enforces draft-only credentials even for updates to published articles", async () => {
  const writer = (
    await createToken({
      name: "writer",
      scopes: ["content:read", "content:write"],
    })
  ).token;
  const article = await content.createArticle(
    writer,
    { ...input, requestId: "permission-one" },
    origin
  );
  await expect(
    content.setArticleStatus(
      writer,
      {
        id: article.id,
        expectedUpdatedAt: article.updatedAt,
        status: "published",
        requestId: "denied-publish",
      },
      origin
    )
  ).rejects.toThrow("权限不足");
  await expect(
    content.createArticle(
      writer,
      { ...input, status: "published" } as any,
      origin
    )
  ).rejects.toThrow();
  const published = await content.setArticleStatus(
    full,
    {
      id: article.id,
      expectedUpdatedAt: article.updatedAt,
      status: "published",
      requestId: "publish-one",
    },
    origin
  );
  expect(published.subscriberNotificationSent).toBe(false);
  await expect(
    content.updateArticle(
      writer,
      {
        id: article.id,
        expectedUpdatedAt: published.updatedAt,
        requestId: "denied-update",
        title: "修改公开文章",
      },
      origin
    )
  ).rejects.toThrow("权限不足");
  await expect(
    content.organizeSeries(
      writer,
      {
        name: "X",
        chapters: [
          { id: article.id, expectedUpdatedAt: published.updatedAt, order: 1 },
        ],
        requestId: "denied-series",
      },
      origin
    )
  ).rejects.toThrow("权限不足");
});
it("rolls back every chapter when one series revision conflicts", async () => {
  const a = await content.createArticle(
    full,
    { ...input, requestId: "series-first" },
    origin
  );
  const b = await content.createArticle(
    full,
    { ...input, requestId: "series-second" },
    origin
  );
  await expect(
    content.organizeSeries(
      full,
      {
        name: "专题",
        chapters: [
          { id: a.id, expectedUpdatedAt: a.updatedAt, order: 1 },
          { id: b.id, expectedUpdatedAt: 0, order: 2 },
        ],
        requestId: "series-conflict",
      },
      origin
    )
  ).rejects.toThrow("版本冲突");
  expect((await content.getArticle(full, a.id)).series).toBeNull();
  await content.organizeSeries(
    full,
    {
      name: "专题",
      chapters: [
        { id: a.id, expectedUpdatedAt: a.updatedAt, order: 1 },
        { id: b.id, expectedUpdatedAt: b.updatedAt, order: 2 },
      ],
      requestId: "series-success",
    },
    origin
  );
  expect((await content.listArticles(full, { series: "专题" })).total).toBe(2);
});
it("stores preview secrets only as hashes, expires them and ties them to credentials", async () => {
  const token = (await createToken({ name: "preview", scopes: [...scopes] }))
    .token;
  const a = await content.createArticle(
    token,
    { ...input, requestId: "preview-first" },
    origin
  );
  const preview = await content.createPreview(token, a.id, origin);
  const secret = new URL(preview.url).hash.slice(1);
  expect(await content.readPreview(secret)).toMatchObject({
    title: input.title,
  });
  expect(
    fs.readFileSync(`${ROOT_DIR}/blog.db`).includes(Buffer.from(secret))
  ).toBe(false);
  const second = await content.createPreview(token, a.id, origin);
  expect(await content.readPreview(secret)).toBeNull();
  const nextSecret = new URL(second.url).hash.slice(1);
  const now = Date.now();
  vi.spyOn(Date, "now").mockReturnValue(now + 3600001);
  expect(await content.readPreview(nextSecret)).toBeNull();
  vi.restoreAllMocks();
  await revokeToken(token.id);
  expect(await content.readPreview(nextSecret)).toBeNull();
  await expect(
    content.createArticle(
      token,
      { ...input, requestId: "revoked-first" },
      origin
    )
  ).rejects.toThrow("撤销");
});
it("rejects non-images and uploads the same image only once", async () => {
  await expect(
    content.uploadImage(
      full,
      {
        requestId: "image-invalid",
        base64: Buffer.from("<svg/>").toString("base64"),
      },
      origin
    )
  ).rejects.toThrow("仅接受");
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jNfsAAAAASUVORK5CYII=";
  const image = await content.uploadImage(
    full,
    { requestId: "image-valid", base64 },
    origin
  );
  expect(
    await content.uploadImage(
      full,
      { requestId: "image-valid", base64 },
      origin
    )
  ).toEqual(image);
  expect(fs.readdirSync(`${ROOT_DIR}/books/images`)).toHaveLength(1);
});
it("rolls article and receipt back together when disk is full", async () => {
  const before = (await content.listArticles(full, {})).total;
  vi.spyOn(fs, "writeFileSync").mockImplementationOnce(() => {
    throw new Error("disk full");
  });
  await expect(
    content.createArticle(full, { ...input, requestId: "disk-failure" }, origin)
  ).rejects.toThrow("disk full");
  expect((await content.listArticles(full, {})).total).toBe(before);
  await content.createArticle(
    full,
    { ...input, requestId: "disk-failure" },
    origin
  );
  expect((await content.listArticles(full, {})).total).toBe(before + 1);
});
it("clears previously cached public lists after article writes", async () => {
  const cache = createResponseCache(30000);
  cache.set("articles", "old");
  await content.createArticle(
    full,
    { ...input, requestId: "cache-invalidate" },
    origin
  );
  expect(cache.get("articles")).toBeNull();
});
it("retains no credentials or article bodies in operation events", async () => {
  const events = await recentEvents();
  expect(events.length).toBeGreaterThan(0);
  expect(JSON.stringify(events)).not.toContain(input.content);
  expect(
    await readDatabase(
      db => db.exec("SELECT count(*) FROM mcp_requests")[0].values[0][0]
    )
  ).toBeGreaterThan(0);
});
