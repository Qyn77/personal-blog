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

async function initSqlJsInstance() {
  if (!_SQL) {
    _SQL = await initSqlJs();
  }
  return _SQL;
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

      const sqlJsDb = data ? new SQL.Database(data) : new SQL.Database();

      // @ts-ignore
      _db = drizzle(sqlJsDb);

      console.log("[Database] Connected to SQLite (sql.js):", DB_PATH);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// 博客文章
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

// ============================================================================
// 归档
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
