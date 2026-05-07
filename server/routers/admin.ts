/**
 * Admin tRPC 路由
 * 提供博客文章和归档的 CRUD 操作
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "../db";
import {
  parseFrontmatter,
  calculateReadTime,
  processMarkdownImages,
  generateExcerpt,
  slugify,
} from "../lib/markdown";

export const adminRouter = router({
  // ========================================================================
  // 文章
  // ========================================================================

  /** 获取所有文章（管理用） */
  listArticles: publicProcedure.query(async () => {
    try {
      const articles = await db.getAllArticles();
      return { success: true, articles, total: articles.length };
    } catch (error) {
      console.error("[Admin] Error listing articles:", error);
      return { success: false, articles: [], total: 0, error: "Failed to load articles" };
    }
  }),

  /** 按 ID 获取单篇文章 */
  getArticle: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const article = await db.getArticleById(input.id);
        if (!article) {
          return { success: false, article: null, error: "Article not found" };
        }
        return { success: true, article };
      } catch (error) {
        console.error("[Admin] Error getting article:", error);
        return { success: false, article: null, error: "Failed to get article" };
      }
    }),

  /** 创建文章 */
  createArticle: publicProcedure
    .input(
      z.object({
        title: z.string(),
        subtitle: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string(),
        date: z.string(),
        tags: z.array(z.string()),
        category: z.string(),
        featured: z.boolean().default(false),
        coverImage: z.string().optional(),
        slug: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const id = nanoid();
        let slug = input.slug || slugify(input.title);

        // 检查 slug 唯一性
        const existing = await db.getArticleBySlug(slug);
        if (existing) {
          slug = `${slug}-${nanoid(6)}`;
        }

        const processedContent = processMarkdownImages(input.content);
        const excerpt = input.excerpt || generateExcerpt(processedContent);
        const readTime = calculateReadTime(processedContent);

        const success = await db.insertArticle({
          id,
          slug,
          title: input.title,
          subtitle: input.subtitle,
          excerpt,
          content: processedContent,
          date: input.date,
          readTime,
          tags: input.tags,
          category: input.category,
          featured: input.featured,
          coverImage: input.coverImage,
        });

        if (!success) {
          return { success: false, error: "Failed to insert article" };
        }
        return { success: true, id, slug };
      } catch (error) {
        console.error("[Admin] Error creating article:", error);
        return { success: false, error: "Failed to create article" };
      }
    }),

  /** 更新文章 */
  updateArticle: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        date: z.string().optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        featured: z.boolean().optional(),
        coverImage: z.string().optional(),
        slug: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { id, ...data } = input;

        // 如果更新了内容，重新计算阅读时间和处理图片路径
        if (data.content) {
          data.content = processMarkdownImages(data.content);
          const readTime = calculateReadTime(data.content);
          const excerpt = data.excerpt || generateExcerpt(data.content);

          const success = await db.updateArticle(id, { ...data, readTime, excerpt });
          if (!success) return { success: false, error: "Failed to update article" };
        } else {
          const success = await db.updateArticle(id, data);
          if (!success) return { success: false, error: "Failed to update article" };
        }

        return { success: true };
      } catch (error) {
        console.error("[Admin] Error updating article:", error);
        return { success: false, error: "Failed to update article" };
      }
    }),

  /** 删除文章 */
  deleteArticle: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const success = await db.deleteArticle(input.id);
        if (!success) return { success: false, error: "Failed to delete article" };
        return { success: true };
      } catch (error) {
        console.error("[Admin] Error deleting article:", error);
        return { success: false, error: "Failed to delete article" };
      }
    }),

  /** 解析 Markdown 文件内容，提取 frontmatter 元数据 */
  parseMarkdown: publicProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input }) => {
      const { metadata, body } = parseFrontmatter(input.content);
      const processedBody = processMarkdownImages(body);
      const excerpt = generateExcerpt(processedBody, metadata.excerpt as string);
      const readTime = calculateReadTime(body);

      return {
        title: (metadata.title as string) || "Untitled",
        subtitle: (metadata.subtitle as string) || undefined,
        excerpt,
        content: processedBody,
        date: (metadata.date as string) || new Date().toISOString().split("T")[0],
        readTime,
        tags: Array.isArray(metadata.tags) ? (metadata.tags as string[]) : [],
        category: (metadata.category as string) || "uncategorized",
        featured: metadata.featured === true,
        coverImage: (metadata.coverImage as string) || undefined,
        slug: (metadata.slug as string) || slugify((metadata.title as string) || "untitled"),
      };
    }),

  // ========================================================================
  // 归档
  // ========================================================================

  /** 获取所有归档（管理用） */
  listArchives: publicProcedure.query(async () => {
    try {
      const archives = await db.getAllArchives();
      return { success: true, archives, total: archives.length };
    } catch (error) {
      console.error("[Admin] Error listing archives:", error);
      return { success: false, archives: [], total: 0, error: "Failed to load archives" };
    }
  }),

  /** 按 ID 获取单个归档 */
  getArchive: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const archive = await db.getArchiveById(input.id);
        if (!archive) {
          return { success: false, archive: null, error: "Archive not found" };
        }
        return { success: true, archive };
      } catch (error) {
        console.error("[Admin] Error getting archive:", error);
        return { success: false, archive: null, error: "Failed to get archive" };
      }
    }),

  /** 创建归档 */
  createArchive: publicProcedure
    .input(
      z.object({
        title: z.string(),
        subtitle: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string(),
        date: z.string(),
        tags: z.array(z.string()),
        category: z.string(),
        slug: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const id = nanoid();
        let slug = input.slug || slugify(input.title);

        const existing = await db.getArchiveBySlug(slug);
        if (existing) {
          slug = `${slug}-${nanoid(6)}`;
        }

        const excerpt = input.excerpt || generateExcerpt(input.content);
        const readTime = calculateReadTime(input.content);

        const success = await db.insertArchive({
          id,
          slug,
          title: input.title,
          subtitle: input.subtitle,
          excerpt,
          content: input.content,
          date: input.date,
          readTime,
          tags: input.tags,
          category: input.category,
        });

        if (!success) return { success: false, error: "Failed to insert archive" };
        return { success: true, id, slug };
      } catch (error) {
        console.error("[Admin] Error creating archive:", error);
        return { success: false, error: "Failed to create archive" };
      }
    }),

  /** 更新归档 */
  updateArchive: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        date: z.string().optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        slug: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { id, ...data } = input;

        if (data.content) {
          const readTime = calculateReadTime(data.content);
          const excerpt = data.excerpt || generateExcerpt(data.content);
          const success = await db.updateArchive(id, { ...data, readTime, excerpt });
          if (!success) return { success: false, error: "Failed to update archive" };
        } else {
          const success = await db.updateArchive(id, data);
          if (!success) return { success: false, error: "Failed to update archive" };
        }

        return { success: true };
      } catch (error) {
        console.error("[Admin] Error updating archive:", error);
        return { success: false, error: "Failed to update archive" };
      }
    }),

  /** 删除归档 */
  deleteArchive: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const success = await db.deleteArchive(input.id);
        if (!success) return { success: false, error: "Failed to delete archive" };
        return { success: true };
      } catch (error) {
        console.error("[Admin] Error deleting archive:", error);
        return { success: false, error: "Failed to delete archive" };
      }
    }),
});
