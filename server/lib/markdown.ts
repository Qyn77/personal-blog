/**
 * Markdown 解析工具模块
 * 从 initDb.ts 提取的共享函数，供初始化脚本和 Admin API 共用
 */

/**
 * 从 Markdown 文件的 frontmatter 中提取元数据
 */
export function parseFrontmatter(content: string): {
  metadata: Record<string, unknown>;
  body: string;
} {
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
 * 计算阅读时间（分钟）
 */
export function calculateReadTime(content: string): number {
  const chineseCharCount = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWordCount = (content.match(/\b\w+\b/g) || []).length;
  const totalWords = chineseCharCount + Math.ceil(englishWordCount / 1.5);
  return Math.max(1, Math.ceil(totalWords / 200));
}

/**
 * 解析图片路径，将相对路径转为 /books/ 下的绝对路径
 */
export function resolveBooksAsset(src: string): string {
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

/**
 * 处理 Markdown 内容中的图片路径
 */
export function processMarkdownImages(content: string): string {
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
    return `![${alt}](${resolveBooksAsset(src)})`;
  });
}

/**
 * 从正文生成摘要
 */
export function generateExcerpt(body: string, metadataExcerpt?: string): string {
  if (typeof metadataExcerpt === "string" && metadataExcerpt) {
    return metadataExcerpt;
  }
  return (
    body
      .replace(/^#+\s+.+\n/gm, "")
      .replace(/\[.+?\]\(.+?\)/g, "")
      .substring(0, 150)
      .trim() + "..."
  );
}

/**
 * 将标题转为 URL 安全的 slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u4e00-\u9fff]+/g, match => match) // 保留中文
    .replace(/[^\w\u4e00-\u9fff-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80) || "untitled";
}
