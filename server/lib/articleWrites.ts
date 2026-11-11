import { invalidateContentCache } from "./responseCache";
import type { Database } from "sql.js";
import type { Article } from "../schema";
import {
  processMarkdownImages,
  generateExcerpt,
  calculateReadTime,
} from "./markdown";

export type ArticleFields = {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: number;
  tags: string[];
  category: string;
  featured?: boolean;
  coverImage?: string;
  status?: string;
  series?: string;
  seriesOrder?: number;
};
export function prepareArticleContent(content: string, excerpt?: string) {
  const processed = processMarkdownImages(content);
  return {
    content: processed,
    excerpt: excerpt || generateExcerpt(processed),
    readTime: calculateReadTime(processed),
  };
}
export function articleRow(db: Database, id: string): Article | undefined {
  const result = db.exec("SELECT * FROM articles WHERE id = ?", [id])[0];
  if (!result) return undefined;
  return Object.fromEntries(
    result.columns.map((col, i) => [col, result.values[0][i]])
  ) as Article;
}
export function insertArticleRow(
  db: Database,
  article: ArticleFields & { id: string }
): Article {
  const now = Date.now();
  db.run(
    `INSERT INTO articles (id,slug,title,subtitle,excerpt,content,date,readTime,tags,category,featured,coverImage,status,series,seriesOrder,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      article.id,
      article.slug,
      article.title,
      article.subtitle ?? null,
      article.excerpt,
      article.content,
      article.date,
      article.readTime,
      JSON.stringify(article.tags),
      article.category,
      article.featured ? 1 : 0,
      article.coverImage || "/books/default/ai.svg",
      article.status || "published",
      article.series?.trim() || null,
      article.seriesOrder ?? 0,
      now,
      now,
    ]
  );
  invalidateContentCache();
  return articleRow(db, article.id)!;
}
export function updateArticleRow(
  db: Database,
  id: string,
  data: Partial<ArticleFields>,
  expectedUpdatedAt?: number
): Article {
  const previous = articleRow(db, id);
  if (!previous) throw new Error("文章不存在");
  if (
    expectedUpdatedAt !== undefined &&
    previous.updatedAt !== expectedUpdatedAt
  )
    throw new Error("文章已被修改，请重新读取后再提交（版本冲突）");
  const fields: Record<string, string | number | null> = {
    updatedAt: Math.max(Date.now(), previous.updatedAt + 1),
  };
  for (const key of [
    "slug",
    "title",
    "subtitle",
    "excerpt",
    "content",
    "date",
    "readTime",
    "category",
    "coverImage",
    "status",
    "seriesOrder",
  ] as const) {
    if (data[key] !== undefined) fields[key] = data[key]!;
  }
  if (data.tags !== undefined) fields.tags = JSON.stringify(data.tags);
  if (data.featured !== undefined) fields.featured = data.featured ? 1 : 0;
  if (data.series !== undefined) fields.series = data.series.trim() || null;
  db.run(
    `UPDATE articles SET ${Object.keys(fields)
      .map(key => `${key} = ?`)
      .join(",")} WHERE id = ?`,
    [...Object.values(fields), id]
  );
  invalidateContentCache();
  return articleRow(db, id)!;
}
