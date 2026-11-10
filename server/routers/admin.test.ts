import { expect, it, vi } from "vitest";
vi.mock("../lib/auth", () => ({ verifyToken: () => ({ username: "admin" }) }));
vi.mock("../db", () => ({
  getArticleBySlug: vi.fn(),
  insertArticle: vi.fn(async () => true),
  getSetting: vi.fn(),
  setSetting: vi.fn(),
}));
import * as db from "../db";
import { adminRouter } from "./admin";
it("creates an unpublished draft unless publishing is explicitly requested", async () => {
  const caller = adminRouter.createCaller({
    req: { headers: { authorization: "Bearer test" } } as any,
    res: {} as any,
  });
  await caller.createArticle({
    title: "草稿",
    content: "正文",
    date: "2026-11-10",
    tags: [],
    category: "test",
  });
  expect(db.insertArticle).toHaveBeenCalledWith(
    expect.objectContaining({ status: "draft" })
  );
});

it("does not report successful notification settings when persistence fails", async () => {
  const caller = adminRouter.createCaller({
    req: { headers: { authorization: "Bearer test" } } as any,
    res: {} as any,
  });
  vi.mocked(db.setSetting).mockResolvedValueOnce(false);
  expect(await caller.updateNotifySettings({ autoNotify: true })).toMatchObject(
    { success: false }
  );
  vi.mocked(db.setSetting).mockResolvedValueOnce(true);
  expect(await caller.updateNotifySettings({ autoNotify: true })).toEqual({
    success: true,
  });
});
