import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";
import type { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { articles, InsertArticle, Article } from "../drizzle/sqlite-schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "blog.db");

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlJsDb: SqlJsDatabase | null = null;
let _SQL: any = null;

// 初始化 sql.js
async function initSqlJsInstance() {
  if (!_SQL) {
    _SQL = await initSqlJs();
  }
  return _SQL;
}

// @ts-ignore - sql.js 和 better-sqlite3 的类型不完全兼容，但运行时工作正常
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const SQL = await initSqlJsInstance();
      
      // 尝试从文件加载现有数据库
      let data: Buffer | undefined;
      if (fs.existsSync(DB_PATH)) {
        data = fs.readFileSync(DB_PATH);
      }

      // 创建或加载数据库
      _sqlJsDb = data ? new SQL.Database(data) : new SQL.Database();
      
      // 创建 drizzle 实例
      // @ts-ignore - sql.js 类型与 drizzle 不完全兼容
      _db = drizzle(_sqlJsDb);
      
      console.log("[Database] Connected to SQLite (sql.js):", DB_PATH);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * 保存数据库到文件
 */
export async function saveDb() {
  if (_sqlJsDb) {
    try {
      const data = _sqlJsDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
      console.log("[Database] Database saved to:", DB_PATH);
    } catch (error) {
      console.error("[Database] Failed to save database:", error);
    }
  }
}



// ============================================================================
// 博客文章相关函数
// ============================================================================

/**
 * 获取所有文章
 */
export async function getAllArticles(): Promise<Article[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get articles: database not available");
    return [];
  }

  try {
    // @ts-ignore
    const result = await db.select().from(articles);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get articles:", error);
    return [];
  }
}

/**
 * 根据 slug 获取单篇文章
 */
export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get article: database not available");
    return undefined;
  }

  try {
    // @ts-ignore
    const result = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get article:", error);
    return undefined;
  }
}

/**
 * 创建或更新文章
 */
export async function upsertArticle(article: InsertArticle): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert article: database not available");
    return;
  }

  try {
    const now = Date.now();
    const data: InsertArticle = {
      ...article,
      createdAt: article.createdAt || now,
      updatedAt: now,
    };

    // @ts-ignore
    await db.insert(articles).values(data).onConflictDoUpdate({
      target: articles.slug,
      set: data as any,
    });
    
    await saveDb();
  } catch (error) {
    console.error("[Database] Failed to upsert article:", error);
    throw error;
  }
}

/**
 * 删除文章
 */
export async function deleteArticle(slug: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete article: database not available");
    return;
  }

  try {
    // @ts-ignore
    await db.delete(articles).where(eq(articles.slug, slug));
    await saveDb();
  } catch (error) {
    console.error("[Database] Failed to delete article:", error);
    throw error;
  }
}

// TODO: add feature queries here as your schema grows.
