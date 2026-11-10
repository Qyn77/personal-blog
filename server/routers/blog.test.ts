import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({ getArticleBySlug: vi.fn() }));
vi.mock("../lib/auth", () => ({ verifyToken: vi.fn() }));
import * as db from "../db";
import { blogRouter } from "./blog";

const caller = blogRouter.createCaller({ req: {} as any, res: {} as any });

describe("public article visibility", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not disclose a draft even when its slug is known", async () => {
    vi.mocked(db.getArticleBySlug).mockResolvedValue({
      slug: "private-draft",
      status: "draft",
      content: "private text",
    } as any);
    expect(await caller.getArticle({ slug: "private-draft" })).toMatchObject({
      success: false,
      article: null,
    });
  });

  it("returns published articles", async () => {
    vi.mocked(db.getArticleBySlug).mockResolvedValue({
      slug: "public",
      status: "published",
      content: "public text",
    } as any);
    expect(await caller.getArticle({ slug: "public" })).toMatchObject({
      success: true,
      article: { content: "public text" },
    });
  });
});
