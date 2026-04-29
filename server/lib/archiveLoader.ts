/*
 * 归档文件加载器
 * 从 archives 文件夹读取 Markdown 文件并解析为归档数据
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARCHIVES_DIR = path.join(__dirname, "..", "..", "archives");

export interface ArchiveItem {
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
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
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
 * 计算阅读时间（分钟）
 */
function calculateReadTime(content: string): number {
  const chineseCharCount = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWordCount = (content.match(/\b\w+\b/g) || []).length;
  const totalWords = chineseCharCount + Math.ceil(englishWordCount / 1.5);
  return Math.max(1, Math.ceil(totalWords / 200));
}

/**
 * 处理图片路径
 */
function processImagePaths(content: string): string {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

  return content.replace(imageRegex, (match, alt, src) => {
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
      return match;
    }

    let filename = src.replace(/^\.\//,  "").replace(/^images\//,  "");
    const imageUrl = `/archives/${filename}`;

    return `![${alt}](${imageUrl})`;
  });
}

/**
 * 从单个 Markdown 文件加载归档项
 */
function loadArchiveFromFile(filePath: string): ArchiveItem | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { metadata, body } = parseFrontmatter(content);

    const processedContent = processImagePaths(body);

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
      content: processedContent,
      date: (metadata.date as string) || new Date().toISOString().split("T")[0],
      readTime: calculateReadTime(body),
      tags: (metadata.tags as string[]) || [],
      category: (metadata.category as string) || "uncategorized",
    };

    return item;
  } catch (error) {
    console.error(`[ArchiveLoader] Error loading file ${filePath}:`, error);
    return null;
  }
}

/**
 * 从 archives 文件夹加载所有归档项
 */
export function loadAllArchives(): ArchiveItem[] {
  const items: ArchiveItem[] = [];

  try {
    if (!fs.existsSync(ARCHIVES_DIR)) {
      console.warn(`[ArchiveLoader] Archives directory not found: ${ARCHIVES_DIR}`);
      return items;
    }

    const files = fs.readdirSync(ARCHIVES_DIR);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = path.join(ARCHIVES_DIR, file);
      const item = loadArchiveFromFile(filePath);

      if (item) {
        items.push(item);
      }
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`[ArchiveLoader] Loaded ${items.length} archives from ${ARCHIVES_DIR}`);
  } catch (error) {
    console.error("[ArchiveLoader] Error loading archives:", error);
  }

  return items;
}

/**
 * 获取单个归档项
 */
export function getArchiveBySlug(slug: string): ArchiveItem | null {
  const filePath = path.join(ARCHIVES_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return loadArchiveFromFile(filePath);
}

/**
 * 获取 archives 目录路径
 */
export function getArchivesDir(): string {
  return ARCHIVES_DIR;
}
