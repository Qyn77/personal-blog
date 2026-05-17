/**
 * 同步 books 和 archives 目录中的 Markdown 文件到数据库
 * 支持增量导入：只导入新条目，跳过已存在的 slug
 *
 * 用法：
 *   pnpm sync:dist          # 同步 dist/ 下的 books 和 archives -> dist/blog.db
 *   pnpm sync               # 同步源码目录的 books 和 archives -> blog.db
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import initSqlJs from "sql.js";
import {
  parseFrontmatter,
  calculateReadTime,
  resolveBooksAsset,
  processMarkdownImages,
  generateExcerpt,
} from "../lib/markdown";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 检测运行环境：__dirname/../ 有 package.json → dist 模式，否则 → 源码模式
const isDistMode = fs.existsSync(path.join(__dirname, "..", "package.json"));

const targetDist =
  process.argv.includes("--dist") || process.env.SYNC_TARGET === "dist";

// 源码模式下 __dirname/../.. 是项目根目录；dist 模式下 __dirname/.. 是 dist 根目录
const PROJECT_ROOT = isDistMode
  ? path.join(__dirname, "..")
  : path.join(__dirname, "..", "..");

// dist 模式下 PROJECT_ROOT 就是 dist/，直接读取
// 源码模式 + --dist 需要拼接 dist/ 子目录
const BOOKS_DIR =
  !isDistMode && targetDist
    ? path.join(PROJECT_ROOT, "dist", "books")
    : path.join(PROJECT_ROOT, "books");
const ARCHIVES_DIR =
  !isDistMode && targetDist
    ? path.join(PROJECT_ROOT, "dist", "archives")
    : path.join(PROJECT_ROOT, "archives");
const DB_PATH =
  !isDistMode && targetDist
    ? path.join(PROJECT_ROOT, "dist", "blog.db")
    : path.join(PROJECT_ROOT, "blog.db");

// ─── 文章（articles）─────────────────────────────────────────

function loadArticle(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { metadata, body } = parseFrontmatter(content);
    const processedBody = processMarkdownImages(body);
    const excerpt = generateExcerpt(processedBody, metadata.excerpt as string);

    return {
      id: (metadata.id as string) || path.basename(filePath, ".md"),
      slug: (metadata.slug as string) || path.basename(filePath, ".md"),
      title: (metadata.title as string) || "Untitled",
      subtitle: metadata.subtitle as string,
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
          : "/books/default/ai.svg",
    };
  } catch (error) {
    console.error(`  ✗ 读取失败: ${filePath}`, error);
    return null;
  }
}

// ─── 归档（archives）─────────────────────────────────────────

function loadArchive(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { metadata, body } = parseFrontmatter(content);
    const excerpt = generateExcerpt(body, metadata.excerpt as string);

    return {
      id: (metadata.id as string) || path.basename(filePath, ".md"),
      slug: (metadata.slug as string) || path.basename(filePath, ".md"),
      title: (metadata.title as string) || "Untitled",
      subtitle: metadata.subtitle as string,
      excerpt,
      content: body,
      date: (metadata.date as string) || new Date().toISOString().split("T")[0],
      readTime: calculateReadTime(body),
      tags: (metadata.tags as string[]) || [],
      category: (metadata.category as string) || "uncategorized",
    };
  } catch (error) {
    console.error(`  ✗ 读取失败: ${filePath}`, error);
    return null;
  }
}

// ─── 主流程 ──────────────────────────────────────────────────

async function syncContent() {
  console.log("📚 同步内容到数据库...\n");
  console.log(`  文章目录:  ${BOOKS_DIR}`);
  console.log(`  归档目录:  ${ARCHIVES_DIR}`);
  console.log(`  数据库:    ${DB_PATH}\n`);

  if (!fs.existsSync(DB_PATH)) {
    console.error(`✗ 数据库文件不存在: ${DB_PATH}`);
    console.error(`  请先执行 pnpm build 打包项目。`);
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const sqlJsDb = new SQL.Database(fs.readFileSync(DB_PATH));

  // 确保表存在
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

  const now = Date.now();
  let totalImported = 0;
  let totalSkipped = 0;

  // ─── 同步文章 ──────────────────────────────────────

  if (fs.existsSync(BOOKS_DIR)) {
    console.log("── 文章（articles）──");

    const existingResult = sqlJsDb.exec("SELECT slug FROM articles");
    const existingSlugs = new Set<string>(
      existingResult[0]?.values.map((row: any[]) => row[0] as string) || []
    );
    console.log(`  数据库已有 ${existingSlugs.size} 篇文章`);

    const files = fs.readdirSync(BOOKS_DIR).filter(f => f.endsWith(".md"));
    let imported = 0;
    let skipped = 0;

    for (const file of files) {
      const article = loadArticle(path.join(BOOKS_DIR, file));
      if (!article) continue;

      if (existingSlugs.has(article.slug)) {
        console.log(`  ⊘ 跳过: ${article.title}`);
        skipped++;
        continue;
      }

      try {
        sqlJsDb.run(
          `INSERT INTO articles (id, slug, title, subtitle, excerpt, content, date, readTime, tags, category, featured, coverImage, status, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`,
          [
            article.id,
            article.slug,
            article.title,
            article.subtitle || null,
            article.excerpt,
            article.content,
            article.date,
            article.readTime,
            JSON.stringify(article.tags),
            article.category,
            article.featured ? 1 : 0,
            article.coverImage,
            now,
            now,
          ]
        );
        console.log(`  ✓ 导入: ${article.title}`);
        imported++;
      } catch (error) {
        console.error(`  ✗ 失败: ${article.title}`, error);
      }
    }

    console.log(
      `  → 新增 ${imported}，跳过 ${skipped}，共 ${files.length} 个文件\n`
    );
    totalImported += imported;
    totalSkipped += skipped;
  } else {
    console.log("── 文章目录不存在，跳过 ──\n");
  }

  // ─── 同步归档 ──────────────────────────────────────

  if (fs.existsSync(ARCHIVES_DIR)) {
    console.log("── 归档（archives）──");

    const existingResult = sqlJsDb.exec("SELECT slug FROM archives");
    const existingSlugs = new Set<string>(
      existingResult[0]?.values.map((row: any[]) => row[0] as string) || []
    );
    console.log(`  数据库已有 ${existingSlugs.size} 条归档`);

    const files = fs.readdirSync(ARCHIVES_DIR).filter(f => f.endsWith(".md"));
    let imported = 0;
    let skipped = 0;

    for (const file of files) {
      const archive = loadArchive(path.join(ARCHIVES_DIR, file));
      if (!archive) continue;

      if (existingSlugs.has(archive.slug)) {
        console.log(`  ⊘ 跳过: ${archive.title}`);
        skipped++;
        continue;
      }

      try {
        sqlJsDb.run(
          `INSERT INTO archives (id, slug, title, subtitle, excerpt, content, date, readTime, tags, category, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            archive.id,
            archive.slug,
            archive.title,
            archive.subtitle || null,
            archive.excerpt,
            archive.content,
            archive.date,
            archive.readTime,
            JSON.stringify(archive.tags),
            archive.category,
            now,
            now,
          ]
        );
        console.log(`  ✓ 导入: ${archive.title}`);
        imported++;
      } catch (error) {
        console.error(`  ✗ 失败: ${archive.title}`, error);
      }
    }

    console.log(
      `  → 新增 ${imported}，跳过 ${skipped}，共 ${files.length} 个文件\n`
    );
    totalImported += imported;
    totalSkipped += skipped;
  } else {
    console.log("── 归档目录不存在，跳过 ──\n");
  }

  // ─── 保存数据库（原子写入）────────────────────────

  const data = sqlJsDb.export();
  const tmpPath = DB_PATH + ".tmp";
  fs.writeFileSync(tmpPath, Buffer.from(data));
  try {
    fs.renameSync(tmpPath, DB_PATH);
  } catch {
    fs.copyFileSync(tmpPath, DB_PATH);
    fs.unlinkSync(tmpPath);
  }

  sqlJsDb.close();

  console.log("─────────────────────────");
  console.log(`  新增: ${totalImported}`);
  console.log(`  跳过: ${totalSkipped}`);
  console.log("─────────────────────────\n");
}

syncContent().catch(error => {
  console.error("同步失败:", error);
  process.exit(1);
});
