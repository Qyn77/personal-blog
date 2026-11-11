import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Database } from "sql.js";
import { z } from "zod";
import { readDatabase, writeDatabase } from "../db";
import {
  articleRow,
  insertArticleRow,
  updateArticleRow,
  prepareArticleContent,
} from "../lib/articleWrites";
import { slugify } from "../lib/markdown";
import { ROOT_DIR } from "../root";
import { authorize, hash, rows, type Token } from "./store";
import type { Article } from "../schema";

import { requestId, revision, audit, mutate } from "./operations";

export const fields = {
  title: z.string().trim().min(1).max(200),
  content: z.string().min(1).max(500000),
  subtitle: z.string().max(200).optional(),
  excerpt: z.string().max(500).optional(),
  date: z.iso.date(),
  tags: z.array(z.string().min(1).max(30)).max(20),
  category: z.string().trim().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fff-]+$/)
    .optional(),
  coverImage: z
    .string()
    .max(2048)
    .refine(
      value => !value || /^\/(?!\/)/.test(value) || /^https?:\/\//.test(value),
      "仅支持站内路径或 HTTP(S) 图片"
    )
    .optional(),
  featured: z.boolean().optional(),
  series: z.string().trim().max(80).optional(),
  seriesOrder: z.number().int().min(0).max(1000000).optional(),
};
export const createInput = z
  .object({ ...fields, tags: fields.tags.default([]), requestId })
  .strict();
export const updateInput = z
  .object({
    ...z.object(fields).partial().shape,
    id: z.string().min(1),
    expectedUpdatedAt: revision,
    requestId,
  })
  .strict();
export const statusInput = z
  .object({
    id: z.string().min(1),
    status: z.enum(["draft", "published"]),
    expectedUpdatedAt: revision,
    requestId,
  })
  .strict();
export const seriesInput = z
  .object({
    name: z
      .string()
      .trim()
      .max(80)
      .describe("同名聚合；空字符串将指定文章移出系列"),
    chapters: z
      .array(
        z
          .object({
            id: z.string().min(1),
            expectedUpdatedAt: revision,
            order: z.number().int().min(0).max(1000000),
          })
          .strict()
      )
      .min(1)
      .max(100),
    requestId,
  })
  .strict();
export const imageInput = z
  .object({
    base64: z
      .string()
      .min(4)
      .max(1400000)
      .describe("实际图片文件的纯 base64，不包含 data: 前缀；最大 1 MiB"),
    requestId,
  })
  .strict();

function summary(article: Article, origin: string) {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    status: article.status,
    series: article.series,
    seriesOrder: article.seriesOrder,
    updatedAt: article.updatedAt,
    url:
      article.status === "published"
        ? `${origin}/article/${encodeURIComponent(article.slug)}`
        : null,
  };
}
function checkArticle(db: Database, token: Token, id: string) {
  const article = articleRow(db, id);
  if (!article) throw new Error("文章不存在");
  if (article.status === "published")
    authorize(db, token.id, ["content:publish"]);
  return article;
}
export const listInput = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(50).default(20),
    search: z.string().max(200).optional(),
    status: z.enum(["draft", "published"]).optional(),
    series: z.string().max(80).optional(),
  })
  .strict();
export async function listArticles(
  token: Token,
  input: z.input<typeof listInput>
) {
  const value = listInput.parse(input);
  return readDatabase(db => {
    authorize(db, token.id, ["content:read"]);
    const conditions = ["1=1"];
    const params: string[] = [];
    if (value.search) {
      conditions.push("(title LIKE ? OR excerpt LIKE ?)");
      params.push(`%${value.search}%`, `%${value.search}%`);
    }
    if (value.status) {
      conditions.push("status=?");
      params.push(value.status);
    }
    if (value.series !== undefined) {
      conditions.push("COALESCE(series,'')=?");
      params.push(value.series);
    }
    const where = conditions.join(" AND ");
    return {
      articles: rows(
        db,
        `SELECT id,slug,title,excerpt,date,status,series,seriesOrder,updatedAt FROM articles WHERE ${where} ORDER BY date DESC,id LIMIT ? OFFSET ?`,
        [...params, value.pageSize, (value.page - 1) * value.pageSize]
      ),
      total: rows<{ total: number }>(
        db,
        `SELECT count(*) AS total FROM articles WHERE ${where}`,
        params
      )[0].total,
      page: value.page,
      pageSize: value.pageSize,
    };
  });
}
export async function getArticle(token: Token, id: string) {
  return readDatabase(db => {
    authorize(db, token.id, ["content:read"]);
    const article = articleRow(db, id);
    if (!article) throw new Error("文章不存在");
    return {
      ...article,
      tags: JSON.parse(article.tags),
      featured: !!article.featured,
    };
  });
}
export async function createArticle(
  token: Token,
  input: z.input<typeof createInput>,
  origin: string
) {
  const value = createInput.parse(input);
  return mutate(token, ["content:write"], "create_article", value, db => {
    const id = randomBytes(12).toString("hex");
    const slug = value.slug || `${slugify(value.title)}-${id.slice(0, 6)}`;
    if (rows(db, "SELECT id FROM articles WHERE slug=?", [slug]).length)
      throw new Error("slug 已存在，请选择其他 slug");
    const article = insertArticleRow(db, {
      ...value,
      ...prepareArticleContent(value.content, value.excerpt),
      id,
      slug,
      status: "draft",
    });
    return { result: summary(article, origin), resourceId: id };
  });
}
export async function updateArticle(
  token: Token,
  input: z.input<typeof updateInput>,
  origin: string
) {
  const value = updateInput.parse(input);
  return mutate(token, ["content:write"], "update_article", value, db => {
    const { id, expectedUpdatedAt, requestId: _, ...changes } = value;
    checkArticle(db, token, id);
    const prepared =
      changes.content !== undefined
        ? prepareArticleContent(changes.content, changes.excerpt)
        : {};
    const article = updateArticleRow(
      db,
      id,
      { ...changes, ...prepared },
      expectedUpdatedAt
    );
    return { result: summary(article, origin), resourceId: id };
  });
}
export async function setArticleStatus(
  token: Token,
  input: z.input<typeof statusInput>,
  origin: string
) {
  const value = statusInput.parse(input);
  return mutate(token, ["content:publish"], "set_article_status", value, db => {
    const article = updateArticleRow(
      db,
      value.id,
      { status: value.status },
      value.expectedUpdatedAt
    );
    return {
      result: {
        ...summary(article, origin),
        subscriberNotificationSent: false,
      },
      resourceId: article.id,
    };
  });
}
export async function listSeries(token: Token) {
  return readDatabase(db => {
    authorize(db, token.id, ["content:read"]);
    return {
      series: rows(
        db,
        "SELECT series AS name,count(*) AS articles,sum(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published FROM articles WHERE series IS NOT NULL AND series<>'' GROUP BY series ORDER BY series"
      ),
    };
  });
}
export async function organizeSeries(
  token: Token,
  input: z.input<typeof seriesInput>,
  origin: string
) {
  const value = seriesInput.parse(input);
  if (
    new Set(value.chapters.map(chapter => chapter.id)).size !==
    value.chapters.length
  )
    throw new Error("章节不能重复");
  return mutate(token, ["content:write"], "organize_series", value, db => {
    const articles = value.chapters.map(chapter => {
      checkArticle(db, token, chapter.id);
      return summary(
        updateArticleRow(
          db,
          chapter.id,
          { series: value.name, seriesOrder: chapter.order },
          chapter.expectedUpdatedAt
        ),
        origin
      );
    });
    return { result: { articles }, resourceId: null };
  });
}
function imageExtension(buffer: Buffer) {
  if (
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "png";
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return "jpg";
  if (["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString()))
    return "gif";
  if (
    buffer.subarray(0, 4).toString() === "RIFF" &&
    buffer.subarray(8, 12).toString() === "WEBP"
  )
    return "webp";
  throw new Error("仅接受 PNG、JPEG、GIF、WebP 图片文件");
}
export async function uploadImage(
  token: Token,
  input: z.input<typeof imageInput>,
  origin: string
) {
  const value = imageInput.parse(input);
  if (
    !/^[A-Za-z0-9+/]*={0,2}$/.test(value.base64) ||
    value.base64.length % 4 !== 0
  )
    throw new Error("base64 格式无效");
  const buffer = Buffer.from(value.base64, "base64");
  if (!buffer.length || buffer.length > 1024 * 1024)
    throw new Error("图片最大为 1 MiB");
  const extension = imageExtension(buffer);
  let createdPath: string | undefined;
  try {
    return await mutate(token, ["media:write"], "upload_image", value, db => {
      const filename = `mcp-${randomBytes(16).toString("hex")}.${extension}`;
      const directory = path.join(ROOT_DIR, "books", "images");
      fs.mkdirSync(directory, { recursive: true });
      createdPath = path.join(directory, filename);
      fs.writeFileSync(createdPath, buffer, { flag: "wx" });
      const imagePath = `/books/images/${filename}`;
      return {
        result: {
          imagePath,
          url: `${origin}${imagePath}`,
          bytes: buffer.length,
        },
        resourceId: imagePath,
      };
    });
  } catch (error) {
    if (createdPath) {
      try {
        fs.unlinkSync(createdPath);
      } catch {
        /* best effort cleanup */
      }
    }
    throw error;
  }
}
export async function createPreview(token: Token, id: string, origin: string) {
  const secret = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + 3600000;
  await writeDatabase(db => {
    authorize(db, token.id, ["content:read"]);
    if (!articleRow(db, id)) throw new Error("文章不存在");
    db.run(
      "DELETE FROM mcp_previews WHERE expiresAt<=? OR (tokenId=? AND articleId=?)",
      [Date.now(), token.id, id]
    );
    db.run("INSERT INTO mcp_previews VALUES (?,?,?,?)", [
      hash(secret),
      token.id,
      id,
      expiresAt,
    ]);
    audit(db, token, "create_preview", id);
  });
  return {
    url: `${origin}/preview#${secret}`,
    expiresAt,
    note: "私有链接一小时有效；重新生成或撤销令牌后旧链接失效。",
  };
}
export async function readPreview(secret: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(secret)) return null;
  return readDatabase(db => {
    const row = rows<{ articleId: string }>(
      db,
      `SELECT p.articleId FROM mcp_previews p JOIN mcp_tokens t ON t.id=p.tokenId WHERE p.tokenHash=? AND p.expiresAt>? AND t.expiresAt>? AND t.revokedAt IS NULL`,
      [hash(secret), Date.now(), Date.now()]
    )[0];
    if (!row) return null;
    const article = articleRow(db, row.articleId);
    return article
      ? {
          title: article.title,
          content: article.content,
          subtitle: article.subtitle,
          date: article.date,
          status: article.status,
        }
      : null;
  });
}
