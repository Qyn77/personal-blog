import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { articles, Article, archives, Archive } from "./schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "blog.db");

let _db: ReturnType<typeof drizzle> | null = null;
let _SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;
let _sqlJsDb: any = null;

async function initSqlJsInstance() {
  if (!_SQL) {
    _SQL = await initSqlJs();
  }
  return _SQL;
}

/** 确保数据库表存在 */
function ensureTables(sqlJsDb: any) {
  sqlJsDb.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subtitle TEXT,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      date TEXT NOT NULL,
      readTime INTEGER NOT NULL,
      tags TEXT NOT NULL,
      category TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      coverImage TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);
  sqlJsDb.run(`
    CREATE TABLE IF NOT EXISTS archives (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subtitle TEXT,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      date TEXT NOT NULL,
      readTime INTEGER NOT NULL,
      tags TEXT NOT NULL,
      category TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);
}

// @ts-ignore - sql.js 类型与 drizzle 不完全兼容，但运行时工作正常
async function getDb() {
  if (!_db) {
    try {
      const SQL = await initSqlJsInstance();

      let data: Buffer | undefined;
      if (fs.existsSync(DB_PATH)) {
        data = fs.readFileSync(DB_PATH);
      }

      _sqlJsDb = data ? new SQL.Database(data) : new SQL.Database();
      ensureTables(_sqlJsDb);

      // @ts-ignore
      _db = drizzle(_sqlJsDb);

      console.log("[Database] Connected to SQLite (sql.js):", DB_PATH);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/** 将内存中的数据库持久化到磁盘 */
function saveDb() {
  if (!_sqlJsDb) return;
  const data = _sqlJsDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// ============================================================================
// 博客文章 - 读取
// ============================================================================

export async function getAllArticles(): Promise<Article[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // @ts-ignore
    return await db.select().from(articles);
  } catch (error) {
    console.error("[Database] Failed to get articles:", error);
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // @ts-ignore
    const result = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get article:", error);
    return undefined;
  }
}

export async function getArticleById(id: string): Promise<Article | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // @ts-ignore
    const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get article:", error);
    return undefined;
  }
}

// ============================================================================
// 博客文章 - 写入
// ============================================================================

export async function insertArticle(article: {
  id: string;
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
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const now = Date.now();
    // @ts-ignore
    await db.insert(articles).values({
      id: article.id,
      slug: article.slug,
      title: article.title,
      subtitle: article.subtitle,
      excerpt: article.excerpt,
      content: article.content,
      date: article.date,
      readTime: article.readTime,
      tags: JSON.stringify(article.tags),
      category: article.category,
      featured: article.featured ? 1 : 0,
      coverImage: article.coverImage,
      createdAt: now,
      updatedAt: now,
    });
    saveDb();
    return true;
  } catch (error) {
    console.error("[Database] Failed to insert article:", error);
    return false;
  }
}

export async function updateArticle(
  id: string,
  data: Partial<{
    slug: string;
    title: string;
    subtitle: string;
    excerpt: string;
    content: string;
    date: string;
    readTime: number;
    tags: string[];
    category: string;
    featured: boolean;
    coverImage: string;
  }>
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const updateData: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.readTime !== undefined) updateData.readTime = data.readTime;
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
    if (data.category !== undefined) updateData.category = data.category;
    if (data.featured !== undefined) updateData.featured = data.featured ? 1 : 0;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;

    // @ts-ignore
    await db.update(articles).set(updateData).where(eq(articles.id, id));
    saveDb();
    return true;
  } catch (error) {
    console.error("[Database] Failed to update article:", error);
    return false;
  }
}

export async function deleteArticle(id: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // @ts-ignore
    await db.delete(articles).where(eq(articles.id, id));
    saveDb();
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete article:", error);
    return false;
  }
}

// ============================================================================
// 归档 - 读取
// ============================================================================

export async function getAllArchives(): Promise<Archive[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // @ts-ignore
    return await db.select().from(archives);
  } catch (error) {
    console.error("[Database] Failed to get archives:", error);
    return [];
  }
}

export async function getArchiveBySlug(slug: string): Promise<Archive | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // @ts-ignore
    const result = await db.select().from(archives).where(eq(archives.slug, slug)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get archive:", error);
    return undefined;
  }
}

export async function getArchiveById(id: string): Promise<Archive | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // @ts-ignore
    const result = await db.select().from(archives).where(eq(archives.id, id)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get archive:", error);
    return undefined;
  }
}

// ============================================================================
// 归档 - 写入
// ============================================================================

export async function insertArchive(archive: {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: number;
  tags: string[];
  category: string;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const now = Date.now();
    // @ts-ignore
    await db.insert(archives).values({
      id: archive.id,
      slug: archive.slug,
      title: archive.title,
      subtitle: archive.subtitle,
      excerpt: archive.excerpt,
      content: archive.content,
      date: archive.date,
      readTime: archive.readTime,
      tags: JSON.stringify(archive.tags),
      category: archive.category,
      createdAt: now,
      updatedAt: now,
    });
    saveDb();
    return true;
  } catch (error) {
    console.error("[Database] Failed to insert archive:", error);
    return false;
  }
}

export async function updateArchive(
  id: string,
  data: Partial<{
    slug: string;
    title: string;
    subtitle: string;
    excerpt: string;
    content: string;
    date: string;
    readTime: number;
    tags: string[];
    category: string;
  }>
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const updateData: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.readTime !== undefined) updateData.readTime = data.readTime;
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
    if (data.category !== undefined) updateData.category = data.category;

    // @ts-ignore
    await db.update(archives).set(updateData).where(eq(archives.id, id));
    saveDb();
    return true;
  } catch (error) {
    console.error("[Database] Failed to update archive:", error);
    return false;
  }
}

export async function deleteArchive(id: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // @ts-ignore
    await db.delete(archives).where(eq(archives.id, id));
    saveDb();
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete archive:", error);
    return false;
  }
}
