/**
 * 初始化数据库脚本
 * 从 books 和 archives 文件夹加载 Markdown 文章到 SQLite 数据库
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import initSqlJs from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import { articles, archives } from "../schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..");
const BOOKS_DIR = path.join(PROJECT_ROOT, "books");
const ARCHIVES_DIR = path.join(PROJECT_ROOT, "archives");
const DB_PATH = path.join(PROJECT_ROOT, "blog.db");


interface BlogArticle {
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
}

interface ArchiveItem {
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
}

/**
 * 从 Markdown 文件的 frontmatter 中提取元数据
 */
function parseFrontmatter(content: string): { metadata: Record<string, unknown>; body: string } {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, body: content };
  }

  const [, frontmatterStr, body] = match;
  const metadata: Record<string, unknown> = {};

  frontmatterStr.split("\n").forEach(line => {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let valueStr = line.substring(colonIndex + 1).trim();
      let value: unknown = valueStr;

      if (valueStr === "true") value = true;
      else if (valueStr === "false") value = false;
      else if (!isNaN(Number(valueStr))) value = Number(valueStr);
      else if (valueStr.startsWith("[") && valueStr.endsWith("]")) {
        value = valueStr
          .slice(1, -1)
          .split(",")
          .map((v: string) => v.trim().replace(/^["']|["']$/g, ""));
      }

      metadata[key] = value;
    }
  });

  return { metadata, body };
}

/**
 * 计算阅读时间
 */
function calculateReadTime(content: string): number {
  const chineseCharCount = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWordCount = (content.match(/\b\w+\b/g) || []).length;
  const totalWords = chineseCharCount + Math.ceil(englishWordCount / 1.5);
  return Math.max(1, Math.ceil(totalWords / 200));
}

function resolveBooksAsset(src: string): string {
  const trimmed = src.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  const normalized = trimmed
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");

  return `/books/${normalized}`;
}

function processMarkdownImages(content: string): string {
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    return `![${alt}](${resolveBooksAsset(src)})`;
  });
}


/**
 * 从单个 Markdown 文件加载文章
 */
function loadArticleFromFile(filePath: string): BlogArticle | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { metadata, body } = parseFrontmatter(content);

    const processedBody = processMarkdownImages(body);
    const excerpt =
      (typeof metadata.excerpt === "string" ? metadata.excerpt : undefined) ||
      processedBody
        .replace(/^#+\s+.+\n/gm, "")
        .replace(/\[.+?\]\(.+?\)/g, "")
        .substring(0, 150)
        .trim() + "...";

    const article: BlogArticle = {
      id: (metadata.id as string) || path.basename(filePath, ".md"),
      slug: (metadata.slug as string) || path.basename(filePath, ".md"),
      title: (metadata.title as string) || "Untitled",
      subtitle: (metadata.subtitle as string),
      excerpt,
      content: processedBody,
      date: (metadata.date as string) || new Date().toISOString().split("T")[0],
      readTime: calculateReadTime(body),
      tags: (metadata.tags as string[]) || [],
      category: (metadata.category as string) || "uncategorized",
      featured: (metadata.featured as boolean) || false,
      coverImage:
        typeof metadata.coverImage === "string"
          ? resolveBooksAsset(metadata.coverImage)
          : undefined,
    };

    return article;
  } catch (error) {
    console.error(`Error loading file ${filePath}:`, error);
    return null;
  }
}

/**
 * 从单个 Markdown 文件加载归档
 */
function loadArchiveFromFile(filePath: string): ArchiveItem | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { metadata, body } = parseFrontmatter(content);

    const excerpt =
      (typeof metadata.excerpt === "string" ? metadata.excerpt : undefined) ||
      body
        .replace(/^#+\s+.+\n/gm, "")
        .replace(/\[.+?\]\(.+?\)/g, "")
        .substring(0, 150)
        .trim() + "...";

    const item: ArchiveItem = {
      id: (metadata.id as string) || path.basename(filePath, ".md"),
      slug: (metadata.slug as string) || path.basename(filePath, ".md"),
      title: (metadata.title as string) || "Untitled",
      subtitle: (metadata.subtitle as string),
      excerpt,
      content: body,
      date: (metadata.date as string) || new Date().toISOString().split("T")[0],
      readTime: calculateReadTime(body),
      tags: (metadata.tags as string[]) || [],
      category: (metadata.category as string) || "uncategorized",
    };

    return item;
  } catch (error) {
    console.error(`Error loading file ${filePath}:`, error);
    return null;
  }
}

/**
 * 从 books 文件夹加载所有文章
 */
function loadAllArticles(): BlogArticle[] {
  const articleList: BlogArticle[] = [];

  try {
    if (!fs.existsSync(BOOKS_DIR)) {
      console.warn(`Books directory not found: ${BOOKS_DIR}`);
      return articleList;
    }

    const files = fs.readdirSync(BOOKS_DIR);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = path.join(BOOKS_DIR, file);
      const article = loadArticleFromFile(filePath);

      if (article) {
        articleList.push(article);
      }
    }

    articleList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`Loaded ${articleList.length} articles from ${BOOKS_DIR}`);
  } catch (error) {
    console.error("Error loading articles:", error);
  }

  return articleList;
}

/**
 * 从 archives 文件夹加载所有归档
 */
function loadAllArchives(): ArchiveItem[] {
  const archiveList: ArchiveItem[] = [];

  try {
    if (!fs.existsSync(ARCHIVES_DIR)) {
      console.warn(`Archives directory not found: ${ARCHIVES_DIR}`);
      return archiveList;
    }

    const files = fs.readdirSync(ARCHIVES_DIR);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = path.join(ARCHIVES_DIR, file);
      const item = loadArchiveFromFile(filePath);

      if (item) {
        archiveList.push(item);
      }
    }

    archiveList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`Loaded ${archiveList.length} archives from ${ARCHIVES_DIR}`);
  } catch (error) {
    console.error("Error loading archives:", error);
  }

  return archiveList;
}

/**
 * 初始化数据库
 */
async function initDatabase() {
  try {
    console.log("Initializing database...");

    // 初始化 sql.js
    const SQL = await initSqlJs();

    // 创建新数据库
    const sqlJsDb = new SQL.Database();
    const db = drizzle(sqlJsDb);

    // 创建表
    console.log("Creating tables...");
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

    // 加载文章
    console.log("Loading articles from books folder...");
    const loadedArticles = loadAllArticles();

    // 加载归档
    console.log("Loading archives from archives folder...");
    const loadedArchives = loadAllArchives();

    const now = Date.now();

    // 插入文章到数据库
    if (loadedArticles.length > 0) {
      console.log(`Inserting ${loadedArticles.length} articles into database...`);
      for (const article of loadedArticles) {
        await db.insert(articles as any).values({
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
      }
    }

    // 插入归档到数据库
    if (loadedArchives.length > 0) {
      console.log(`Inserting ${loadedArchives.length} archives into database...`);
      for (const archive of loadedArchives) {
        await db.insert(archives as any).values({
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
      }
    }

    // 保存数据库到文件
    const data = sqlJsDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);

    console.log("✓ Database initialized successfully!");
    console.log(`✓ ${loadedArticles.length} articles imported`);
    console.log(`✓ ${loadedArchives.length} archives imported`);
    console.log(`✓ Database file: ${DB_PATH}`);
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}

// 运行初始化
initDatabase();
