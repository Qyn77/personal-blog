import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import {
  articles,
  Article,
  archives,
  Archive,
  subscribers,
  Subscriber,
  settings,
  visitors,
  Visitor,
} from "./schema";
import { ROOT_DIR } from "./root";

const DB_PATH = path.join(ROOT_DIR, "blog.db");

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
      status TEXT NOT NULL DEFAULT 'published',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);
  // 兼容旧数据库：如果 articles 表没有 status 列，自动添加
  try {
    const columns = sqlJsDb.exec("PRAGMA table_info(articles)");
    const colNames = columns[0]?.values.map((row: any[]) => row[1]) || [];
    if (!colNames.includes("status")) {
      sqlJsDb.run(
        "ALTER TABLE articles ADD COLUMN status TEXT NOT NULL DEFAULT 'published'"
      );
      console.log("[Database] Added status column to articles table");
    }
  } catch {
    /* 表可能还不存在，忽略 */
  }

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

  sqlJsDb.run(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      verifyToken TEXT,
      tokenExpiresAt INTEGER,
      unsubscribeToken TEXT,
      createdAt INTEGER NOT NULL,
      confirmedAt INTEGER
    );
  `);
  // 兼容旧数据库：添加 unsubscribeToken 列
  try {
    const columns = sqlJsDb.exec("PRAGMA table_info(subscribers)");
    const colNames = columns[0]?.values.map((row: any[]) => row[1]) || [];
    if (!colNames.includes("unsubscribeToken")) {
      sqlJsDb.run("ALTER TABLE subscribers ADD COLUMN unsubscribeToken TEXT");
      console.log(
        "[Database] Added unsubscribeToken column to subscribers table"
      );
    }
  } catch {
    /* 表可能还不存在，忽略 */
  }

  sqlJsDb.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  sqlJsDb.run(`
    CREATE TABLE IF NOT EXISTS visitors (
      id TEXT PRIMARY KEY,
      ip TEXT NOT NULL,
      city TEXT,
      country TEXT,
      device TEXT,
      browser TEXT,
      os TEXT,
      path TEXT NOT NULL,
      referer TEXT,
      userAgent TEXT,
      createdAt INTEGER NOT NULL
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

/** 将内存中的数据库持久化到磁盘（原子写入，防止写入中断导致数据库损坏） */
function saveDb() {
  if (!_sqlJsDb) return;
  try {
    const data = _sqlJsDb.export();
    const buffer = Buffer.from(data);
    const tmpPath = DB_PATH + ".tmp";
    fs.writeFileSync(tmpPath, buffer);
    try {
      fs.renameSync(tmpPath, DB_PATH);
    } catch {
      // Windows 上 renameSync 可能因文件锁定失败，回退到 copy + delete
      fs.copyFileSync(tmpPath, DB_PATH);
      fs.unlinkSync(tmpPath);
    }
  } catch (error) {
    console.error("[Database] Failed to save database:", error);
  }
}

// ============================================================================
// 博客文章 - 读取
// ============================================================================

export interface ArticleQueryOptions {
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  tag?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getAllArticles(
  options?: ArticleQueryOptions
): Promise<Article[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // 如果没有任何筛选条件，直接使用 drizzle 查询所有文章
    if (!options || Object.keys(options).length === 0) {
      // @ts-ignore
      return await db
        .select()
        .from(articles)
        .orderBy(desc(articles.date), desc(articles.createdAt));
    }

    // 使用原始 SQL 实现灵活的筛选和分页
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.status) {
      conditions.push("status = ?");
      params.push(options.status);
    }
    if (options.search) {
      conditions.push("(title LIKE ? OR excerpt LIKE ?)");
      const q = `%${options.search}%`;
      params.push(q, q);
    }
    if (options.category) {
      conditions.push("category = ?");
      params.push(options.category);
    }
    if (options.tag) {
      conditions.push("tags LIKE ?");
      params.push(`%"${options.tag}"%`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 只有明确指定了分页参数时才应用分页
    if (options.page || options.pageSize) {
      const page = options.page || 1;
      const pageSize = options.pageSize || 10;
      const offset = (page - 1) * pageSize;

      const dataResult = _sqlJsDb.exec(
        `SELECT * FROM articles ${where} ORDER BY date DESC, createdAt DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );

      if (!dataResult[0]) return [];

      const cols = dataResult[0].columns;
      const rows = dataResult[0].values.map((row: any[]) => {
        const obj: any = {};
        cols.forEach((col: string, i: number) => {
          obj[col] = row[i];
        });
        return obj as Article;
      });

      return rows;
    } else {
      // 没有分页参数时返回全部文章
      const dataResult = _sqlJsDb.exec(
        `SELECT * FROM articles ${where} ORDER BY date DESC, createdAt DESC`,
        params
      );

      if (!dataResult[0]) return [];

      const cols = dataResult[0].columns;
      const rows = dataResult[0].values.map((row: any[]) => {
        const obj: any = {};
        cols.forEach((col: string, i: number) => {
          obj[col] = row[i];
        });
        return obj as Article;
      });

      return rows;
    }
  } catch (error) {
    console.error("[Database] Failed to get articles:", error);
    return [];
  }
}

export async function getArticlesWithPagination(
  options: ArticleQueryOptions
): Promise<PaginatedResult<Article>> {
  const db = await getDb();
  if (!db) return { items: [], total: 0, page: 1, pageSize: 10 };

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.status) {
      conditions.push("status = ?");
      params.push(options.status);
    }
    if (options.search) {
      conditions.push("(title LIKE ? OR excerpt LIKE ?)");
      const q = `%${options.search}%`;
      params.push(q, q);
    }
    if (options.category) {
      conditions.push("category = ?");
      params.push(options.category);
    }
    if (options.tag) {
      conditions.push("tags LIKE ?");
      params.push(`%"${options.tag}"%`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = _sqlJsDb.exec(
      `SELECT COUNT(*) FROM articles ${where}`,
      params
    );
    const total = (countResult[0]?.values[0]?.[0] as number) || 0;

    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const offset = (page - 1) * pageSize;

    const dataResult = _sqlJsDb.exec(
      `SELECT * FROM articles ${where} ORDER BY date DESC, createdAt DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    if (!dataResult[0]) return { items: [], total, page, pageSize };

    const cols = dataResult[0].columns;
    const items = dataResult[0].values.map((row: any[]) => {
      const obj: any = {};
      cols.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj as Article;
    });

    return { items, total, page, pageSize };
  } catch (error) {
    console.error("[Database] Failed to get articles with pagination:", error);
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }
}

export async function getArticleBySlug(
  slug: string
): Promise<Article | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // @ts-ignore
    const result = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);
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
    const result = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);
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
  status?: string;
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
      coverImage: article.coverImage || "/books/default/ai.svg",
      status: article.status || "published",
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
    status: string;
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
    if (data.featured !== undefined)
      updateData.featured = data.featured ? 1 : 0;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.status !== undefined) updateData.status = data.status;

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

export async function getArchiveBySlug(
  slug: string
): Promise<Archive | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // @ts-ignore
    const result = await db
      .select()
      .from(archives)
      .where(eq(archives.slug, slug))
      .limit(1);
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
    const result = await db
      .select()
      .from(archives)
      .where(eq(archives.id, id))
      .limit(1);
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

// ============================================================================
// 订阅者
// ============================================================================

export async function insertSubscriber(data: {
  id: string;
  email: string;
  status: string;
  verifyToken: string;
  tokenExpiresAt: number;
  unsubscribeToken: string;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // @ts-ignore
    await db.insert(subscribers).values({
      id: data.id,
      email: data.email,
      status: data.status,
      verifyToken: data.verifyToken,
      tokenExpiresAt: data.tokenExpiresAt,
      unsubscribeToken: data.unsubscribeToken,
      createdAt: Date.now(),
    });
    saveDb();
    return true;
  } catch (error) {
    console.error("[Database] Failed to insert subscriber:", error);
    return false;
  }
}

export async function getSubscriberByEmail(
  email: string
): Promise<Subscriber | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // @ts-ignore
    const result = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get subscriber:", error);
    return undefined;
  }
}

export async function getSubscriberByUnsubscribeToken(
  token: string
): Promise<Subscriber | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // @ts-ignore
    const result = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.unsubscribeToken, token))
      .limit(1);
    return result[0];
  } catch (error) {
    console.error(
      "[Database] Failed to get subscriber by unsubscribe token:",
      error
    );
    return undefined;
  }
}

export async function getSubscriberByToken(
  token: string
): Promise<Subscriber | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // @ts-ignore
    const result = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.verifyToken, token))
      .limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get subscriber by token:", error);
    return undefined;
  }
}

export async function updateSubscriber(
  id: string,
  data: Partial<{
    status: string;
    verifyToken: string | null;
    tokenExpiresAt: number | null;
    confirmedAt: number;
    unsubscribeToken: string | null;
  }>
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const updateData: Record<string, any> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.verifyToken !== undefined)
      updateData.verifyToken = data.verifyToken;
    if (data.tokenExpiresAt !== undefined)
      updateData.tokenExpiresAt = data.tokenExpiresAt;
    if (data.confirmedAt !== undefined)
      updateData.confirmedAt = data.confirmedAt;
    if (data.unsubscribeToken !== undefined)
      updateData.unsubscribeToken = data.unsubscribeToken;

    // @ts-ignore
    await db.update(subscribers).set(updateData).where(eq(subscribers.id, id));
    saveDb();
    return true;
  } catch (error) {
    console.error("[Database] Failed to update subscriber:", error);
    return false;
  }
}

export async function deleteSubscriber(id: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // @ts-ignore
    await db.delete(subscribers).where(eq(subscribers.id, id));
    saveDb();
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete subscriber:", error);
    return false;
  }
}

export async function getAllSubscribers(): Promise<Subscriber[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // @ts-ignore
    return await db.select().from(subscribers);
  } catch (error) {
    console.error("[Database] Failed to get subscribers:", error);
    return [];
  }
}

export async function getConfirmedSubscribers(): Promise<Subscriber[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // @ts-ignore
    return await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.status, "confirmed"));
  } catch (error) {
    console.error("[Database] Failed to get confirmed subscribers:", error);
    return [];
  }
}

// ============================================================================
// 访客记录
// ============================================================================

export async function insertVisitor(data: {
  id: string;
  ip: string;
  city?: string;
  country?: string;
  device?: string;
  browser?: string;
  os?: string;
  path: string;
  referer?: string;
  userAgent?: string;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // @ts-ignore
    await db.insert(visitors).values({
      id: data.id,
      ip: data.ip,
      city: data.city || null,
      country: data.country || null,
      device: data.device || null,
      browser: data.browser || null,
      os: data.os || null,
      path: data.path,
      referer: data.referer || null,
      userAgent: data.userAgent || null,
      createdAt: Date.now(),
    });
    saveDb();
    return true;
  } catch (error) {
    console.error("[Database] Failed to insert visitor:", error);
    return false;
  }
}

export interface VisitorQueryOptions {
  page?: number;
  pageSize?: number;
  startDate?: number;
  endDate?: number;
}

export async function getVisitorsWithPagination(
  options: VisitorQueryOptions
): Promise<PaginatedResult<Visitor>> {
  const db = await getDb();
  if (!db) return { items: [], total: 0, page: 1, pageSize: 20 };

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.startDate) {
      conditions.push("createdAt >= ?");
      params.push(options.startDate);
    }
    if (options.endDate) {
      conditions.push("createdAt <= ?");
      params.push(options.endDate);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = _sqlJsDb.exec(
      `SELECT COUNT(*) FROM visitors ${where}`,
      params
    );
    const total = (countResult[0]?.values[0]?.[0] as number) || 0;

    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const dataResult = _sqlJsDb.exec(
      `SELECT * FROM visitors ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    if (!dataResult[0]) return { items: [], total, page, pageSize };

    const cols = dataResult[0].columns;
    const items = dataResult[0].values.map((row: any[]) => {
      const obj: any = {};
      cols.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj as Visitor;
    });

    return { items, total, page, pageSize };
  } catch (error) {
    console.error("[Database] Failed to get visitors:", error);
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}

export async function getVisitorStats(): Promise<{
  today: number;
  yesterday: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}> {
  const db = await getDb();
  if (!db)
    return { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0, total: 0 };

  try {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart =
      todayStart - (now.getDay() === 0 ? 6 : now.getDay() - 1) * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const countWhere = (where: string) => {
      const result = _sqlJsDb.exec(`SELECT COUNT(*) FROM visitors ${where}`);
      return (result[0]?.values[0]?.[0] as number) || 0;
    };

    return {
      today: countWhere(`WHERE createdAt >= ${todayStart}`),
      yesterday: countWhere(
        `WHERE createdAt >= ${yesterdayStart} AND createdAt < ${todayStart}`
      ),
      thisWeek: countWhere(`WHERE createdAt >= ${weekStart}`),
      thisMonth: countWhere(`WHERE createdAt >= ${monthStart}`),
      total: countWhere(""),
    };
  } catch (error) {
    console.error("[Database] Failed to get visitor stats:", error);
    return { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0, total: 0 };
  }
}

export async function deleteOldVisitors(daysOld: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const cutoff = Date.now() - daysOld * 86400000;
    const countResult = _sqlJsDb.exec(
      `SELECT COUNT(*) FROM visitors WHERE createdAt < ?`,
      [cutoff]
    );
    const count = (countResult[0]?.values[0]?.[0] as number) || 0;

    if (count > 0) {
      _sqlJsDb.run(`DELETE FROM visitors WHERE createdAt < ?`, [cutoff]);
      saveDb();
    }
    return count;
  } catch (error) {
    console.error("[Database] Failed to delete old visitors:", error);
    return 0;
  }
}

// ============================================================================
// 系统设置
// ============================================================================

export async function getSetting(key: string): Promise<string | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // @ts-ignore
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    return result[0]?.value;
  } catch (error) {
    console.error("[Database] Failed to get setting:", error);
    return undefined;
  }
}

export async function setSetting(key: string, value: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const existing = await getSetting(key);
    if (existing !== undefined) {
      // @ts-ignore
      await db.update(settings).set({ value }).where(eq(settings.key, key));
    } else {
      // @ts-ignore
      await db.insert(settings).values({ key, value });
    }
    saveDb();
    return true;
  } catch (error) {
    console.error("[Database] Failed to set setting:", error);
    return false;
  }
}
