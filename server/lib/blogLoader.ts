/*
 * 博客文件加载器
 * 从 books 文件夹读取 Markdown 文件并解析为文章数据
 * 支持图片路径自动转换为存储 URL
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKS_DIR = path.join(__dirname, "..", "..", "books");

export interface BlogArticle {
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

/**
 * 从 Markdown 文件的 frontmatter 中提取元数据
 * 支持 YAML 格式的 frontmatter
 */
function parseFrontmatter(content: string): { metadata: Record<string, unknown>; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, body: content };
  }

  const [, frontmatterStr, body] = match;
  const metadata: Record<string, unknown> = {};

  // 简单的 YAML 解析
  frontmatterStr.split("\n").forEach(line => {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let valueStr = line.substring(colonIndex + 1).trim();
      let value: unknown = valueStr;

      // 处理不同的数据类型
      if (valueStr === "true") value = true;
      else if (valueStr === "false") value = false;
      else if (!isNaN(Number(valueStr))) value = Number(valueStr);
      else if (valueStr.startsWith("[") && valueStr.endsWith("]")) {
        // 简单的数组解析
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
 * 计算阅读时间（分钟）
 * 假设平均阅读速度为 200 字/分钟
 */
function calculateReadTime(content: string): number {
  const chineseCharCount = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWordCount = (content.match(/\b\w+\b/g) || []).length;
  // 中文按字数计算，英文按单词计算
  const totalWords = chineseCharCount + Math.ceil(englishWordCount / 1.5);
  return Math.max(1, Math.ceil(totalWords / 200));
}

/**
 * 处理 Markdown 中的图片路径
 * 将相对路径转换为存储 URL
 * 支持的格式：![alt](./images/file.png) 或 ![alt](images/file.png)
 */
function processImagePaths(content: string, baseImageUrl: string): string {
  // 匹配 Markdown 图片语法
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

  return content.replace(imageRegex, (match, alt, src) => {
    // 如果已经是完整 URL，保持不变
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
      return match;
    }

    // 移除 ./ 前缀和 images/ 前缀，只保留文件名
    let filename = src.replace(/^\.\//,  "").replace(/^images\//,  "");

    // 构建存储 URL
    const imageUrl = `${baseImageUrl}/${filename}`;

    return `![${alt}](${imageUrl})`;
  });
}

/**
 * 从单个 Markdown 文件加载文章
 */
function loadArticleFromFile(filePath: string, baseImageUrl: string): BlogArticle | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { metadata, body } = parseFrontmatter(content);

    // 处理图片路径
    const processedContent = processImagePaths(body, baseImageUrl);

    // 提取摘要（前 150 个字符或第一段）
      const excerpt =
      (typeof metadata.excerpt === "string" ? metadata.excerpt : undefined) ||
      body
        .replace(/^#+\s+.+\n/gm, "") // 移除标题
        .replace(/\[.+?\]\(.+?\)/g, "") // 移除链接
        .substring(0, 150)
        .trim() + "...";

    const article: BlogArticle = {
      id: (metadata.id as string) || path.basename(filePath, ".md"),
      slug: (metadata.slug as string) || path.basename(filePath, ".md"),
      title: (metadata.title as string) || "Untitled",
      subtitle: (metadata.subtitle as string),
      excerpt,
      content: processedContent,
      date: (metadata.date as string) || new Date().toISOString().split("T")[0],
      readTime: calculateReadTime(body),
      tags: (metadata.tags as string[]) || [],
      category: (metadata.category as string) || "uncategorized",
      featured: (metadata.featured as boolean) || false,
      coverImage: (metadata.coverImage as string),
    };

    return article;
  } catch (error) {
    console.error(`[BlogLoader] Error loading file ${filePath}:`, error);
    return null;
  }
}

/**
 * 从 books 文件夹加载所有 Markdown 文章
 */
export function loadAllArticles(baseImageUrl: string = "/manus-storage/blog-images"): BlogArticle[] {
  const articles: BlogArticle[] = [];

  try {
    if (!fs.existsSync(BOOKS_DIR)) {
      console.warn(`[BlogLoader] Books directory not found: ${BOOKS_DIR}`);
      return articles;
    }

    const files = fs.readdirSync(BOOKS_DIR);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = path.join(BOOKS_DIR, file);
      const article = loadArticleFromFile(filePath, baseImageUrl);

      if (article) {
        articles.push(article);
      }
    }

    // 按日期排序（最新的在前）
    articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`[BlogLoader] Loaded ${articles.length} articles from ${BOOKS_DIR}`);
  } catch (error) {
    console.error("[BlogLoader] Error loading articles:", error);
  }

  return articles;
}

/**
 * 获取单个文章
 */
export function getArticleBySlug(slug: string, baseImageUrl: string = "/manus-storage/blog-images"): BlogArticle | null {
  const filePath = path.join(BOOKS_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return loadArticleFromFile(filePath, baseImageUrl);
}

/**
 * 获取 books 目录路径
 */
export function getBooksDir(): string {
  return BOOKS_DIR;
}
