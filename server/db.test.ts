import { afterAll, afterEach, expect, it, vi } from "vitest";
import fs from "node:fs";
vi.mock("./root", async () => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  return { ROOT_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "blog-qa-db-")) };
});
import { ROOT_DIR } from "./root";
import * as db from "./db";

afterEach(() => vi.restoreAllMocks());
afterAll(() => fs.rmSync(ROOT_DIR, { recursive: true, force: true }));

it("reports disk failure, rolls back memory, and permits a safe retry", async () => {
  await db.insertArticle({
    id: "a",
    slug: "a",
    title: "original",
    excerpt: "x",
    content: "body",
    date: "2026-11-10",
    readTime: 1,
    tags: [],
    category: "test",
  });
  const before = fs.readFileSync(`${ROOT_DIR}/blog.db`);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(fs, "writeFileSync").mockImplementationOnce(() => {
    throw new Error("disk full");
  });
  expect(await db.updateArticle("a", { title: "unsaved" })).toBe(false);
  expect((await db.getArticleBySlug("a"))?.title).toBe("original");
  expect(fs.readFileSync(`${ROOT_DIR}/blog.db`)).toEqual(before);
  expect(await db.updateArticle("a", { title: "retry" })).toBe(true);
  expect((await db.getArticleBySlug("a"))?.title).toBe("retry");
});

it("selects older featured articles before applying the page limit", async () => {
  const base = {
    excerpt: "x",
    content: "body",
    readTime: 1,
    tags: [],
    category: "test",
  };
  for (let i = 0; i < 22; i++)
    await db.insertArticle({
      ...base,
      id: `recent-${i}`,
      slug: `recent-${i}`,
      title: "recent",
      date: "2026-11-10",
    });
  await db.insertArticle({
    ...base,
    id: "old-featured",
    slug: "old-featured",
    title: "old",
    date: "2020-01-01",
    featured: true,
  });
  await db.insertArticle({
    ...base,
    id: "draft-featured",
    slug: "draft-featured",
    title: "private",
    date: "2026-11-10",
    featured: true,
    status: "draft",
  });
  const result = await db.getArticlesWithPagination({
    status: "published",
    featured: true,
    pageSize: 2,
  });
  expect(result.items.map(a => a.id)).toEqual(["old-featured"]);
  expect(result.total).toBe(1);
});

it("returns at most three related published summaries without article bodies", async () => {
  const rows = await db.getRelatedArticleSummaries("a");
  expect(rows).toHaveLength(3);
  expect(
    rows.every(
      a => a.id !== "a" && a.status === "published" && !("content" in a)
    )
  ).toBe(true);
  expect(await db.getRelatedArticleSummaries("draft-featured")).toEqual([]);
});

it("orders a series and excludes drafts from its directory and counts", async () => {
  await db.updateArticle("a", { series: "Rust 入门", seriesOrder: 2 });
  await db.updateArticle("old-featured", {
    series: "Rust 入门",
    seriesOrder: 1,
  });
  await db.updateArticle("draft-featured", {
    series: "Rust 入门",
    seriesOrder: 0,
  });
  const chapters = await db.getSeriesArticles("Rust 入门");
  expect(chapters.map(a => a.id)).toEqual(["old-featured", "a"]);
  expect(chapters.every(a => !("content" in a))).toBe(true);
  expect(await db.getSeriesList()).toEqual([
    expect.objectContaining({ name: "Rust 入门", count: 2 }),
  ]);
  await db.updateArticle("a", { series: "" });
  expect(await db.getSeriesArticles("Rust 入门")).toHaveLength(1);
});
