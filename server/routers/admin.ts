/**
 * Admin tRPC 路由
 * 提供博客文章和归档的 CRUD 操作
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import fs from "fs/promises";
import path from "path";
import * as db from "../db";
import {
  parseFrontmatter,
  calculateReadTime,
  processMarkdownImages,
  generateExcerpt,
  slugify,
} from "../lib/markdown";
import { sendArticleNotify, sendTestEmail } from "../lib/email";
import { ROOT_DIR } from "../root";

export const adminRouter = router({
  // ========================================================================
  // 文章
  // ========================================================================

  /** 获取所有文章（管理用） */
  listArticles: protectedProcedure.query(async () => {
    try {
      const articles = await db.getAllArticles();
      return { success: true, articles, total: articles.length };
    } catch (error) {
      console.error("[Admin] Error listing articles:", error);
      return {
        success: false,
        articles: [],
        total: 0,
        error: "Failed to load articles",
      };
    }
  }),

  /** 按 ID 获取单篇文章 */
  getArticle: protectedProcedure
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
        return {
          success: false,
          article: null,
          error: "Failed to get article",
        };
      }
    }),

  /** 创建文章 */
  createArticle: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "标题不能为空").max(200),
        subtitle: z.string().max(200).optional(),
        excerpt: z.string().max(500).optional(),
        content: z.string().min(1, "内容不能为空"),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD"),
        tags: z.array(z.string().max(30)).max(20),
        category: z.string().min(1).max(50),
        featured: z.boolean().default(false),
        coverImage: z.string().optional(),
        slug: z.string().max(100).optional(),
        status: z.enum(["draft", "published"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
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

        const status = input.status || "published";
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
          status,
        });

        if (!success) {
          return { success: false, error: "Failed to insert article" };
        }

        // 创建时直接发布，自动推送通知
        if (status === "published") {
          const autoNotify = await db.getSetting("auto_notify");
          if (autoNotify === "true") {
            (async () => {
              try {
                const subs = await db.getConfirmedSubscribers();
                if (subs.length === 0) return;

                const host = ctx.req.get("host") || "localhost:3000";
                const protocol = ctx.req.protocol || "http";
                const baseUrl = `${protocol}://${host}`;

                await sendArticleNotify(
                  subs.map(s => ({
                    email: s.email,
                    unsubscribeToken: s.unsubscribeToken || "",
                  })),
                  { title: input.title, excerpt, slug },
                  baseUrl
                );
                console.log(
                  `[Admin] Auto-notified ${subs.length} subscribers for new article: ${input.title}`
                );
              } catch (err) {
                console.error("[Admin] Auto-notify failed:", err);
              }
            })();
          }
        }

        return { success: true, id, slug };
      } catch (error) {
        console.error("[Admin] Error creating article:", error);
        return { success: false, error: "Failed to create article" };
      }
    }),

  /** 更新文章 */
  updateArticle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        subtitle: z.string().max(200).optional(),
        excerpt: z.string().max(500).optional(),
        content: z.string().min(1).optional(),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        tags: z.array(z.string().max(30)).max(20).optional(),
        category: z.string().min(1).max(50).optional(),
        featured: z.boolean().optional(),
        coverImage: z.string().optional(),
        slug: z.string().max(100).optional(),
        status: z.enum(["draft", "published"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...data } = input;

        // 检查是否从草稿变为发布（用于自动推送）
        let justPublished = false;
        if (data.status === "published") {
          const existing = await db.getArticleById(id);
          if (existing && existing.status === "draft") {
            justPublished = true;
          }
        }

        // 如果更新了内容，重新计算阅读时间和处理图片路径
        if (data.content) {
          data.content = processMarkdownImages(data.content);
          const readTime = calculateReadTime(data.content);
          const excerpt = data.excerpt || generateExcerpt(data.content);

          const success = await db.updateArticle(id, {
            ...data,
            readTime,
            excerpt,
          });
          if (!success)
            return { success: false, error: "Failed to update article" };
        } else {
          const success = await db.updateArticle(id, data);
          if (!success)
            return { success: false, error: "Failed to update article" };
        }

        // 自动推送：文章从草稿变为发布时
        if (justPublished) {
          const autoNotify = await db.getSetting("auto_notify");
          if (autoNotify === "true") {
            // 异步发送，不阻塞响应
            (async () => {
              try {
                const article = await db.getArticleById(id);
                if (!article) return;
                const subs = await db.getConfirmedSubscribers();
                if (subs.length === 0) return;

                const host = ctx.req.get("host") || "localhost:3000";
                const protocol = ctx.req.protocol || "http";
                const baseUrl = `${protocol}://${host}`;

                await sendArticleNotify(
                  subs.map(s => ({
                    email: s.email,
                    unsubscribeToken: s.unsubscribeToken || "",
                  })),
                  {
                    title: article.title,
                    excerpt: article.excerpt,
                    slug: article.slug,
                  },
                  baseUrl
                );
                console.log(
                  `[Admin] Auto-notified ${subs.length} subscribers for article: ${article.title}`
                );
              } catch (err) {
                console.error("[Admin] Auto-notify failed:", err);
              }
            })();
          }
        }

        return { success: true };
      } catch (error) {
        console.error("[Admin] Error updating article:", error);
        return { success: false, error: "Failed to update article" };
      }
    }),

  /** 删除文章 */
  deleteArticle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const success = await db.deleteArticle(input.id);
        if (!success)
          return { success: false, error: "Failed to delete article" };
        return { success: true };
      } catch (error) {
        console.error("[Admin] Error deleting article:", error);
        return { success: false, error: "Failed to delete article" };
      }
    }),

  /** 切换文章草稿/发布状态 */
  toggleArticleStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const article = await db.getArticleById(input.id);
        if (!article) return { success: false, error: "Article not found" };

        const newStatus =
          article.status === "published" ? "draft" : "published";
        const success = await db.updateArticle(input.id, { status: newStatus });
        if (!success)
          return { success: false, error: "Failed to update status" };

        // 切换到发布状态时，自动推送通知
        if (newStatus === "published") {
          const autoNotify = await db.getSetting("auto_notify");
          if (autoNotify === "true") {
            (async () => {
              try {
                const subs = await db.getConfirmedSubscribers();
                if (subs.length === 0) return;

                const host = ctx.req.get("host") || "localhost:3000";
                const protocol = ctx.req.protocol || "http";
                const baseUrl = `${protocol}://${host}`;

                await sendArticleNotify(
                  subs.map(s => ({
                    email: s.email,
                    unsubscribeToken: s.unsubscribeToken || "",
                  })),
                  {
                    title: article.title,
                    excerpt: article.excerpt,
                    slug: article.slug,
                  },
                  baseUrl
                );
                console.log(
                  `[Admin] Auto-notified ${subs.length} subscribers for article: ${article.title}`
                );
              } catch (err) {
                console.error("[Admin] Auto-notify failed:", err);
              }
            })();
          }
        }

        return { success: true, status: newStatus };
      } catch (error) {
        console.error("[Admin] Error toggling article status:", error);
        return { success: false, error: "Failed to toggle status" };
      }
    }),

  /** 解析 Markdown 文件内容，提取 frontmatter 元数据 */
  parseMarkdown: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input }) => {
      const { metadata, body } = parseFrontmatter(input.content);
      const processedBody = processMarkdownImages(body);
      const excerpt = generateExcerpt(
        processedBody,
        metadata.excerpt as string
      );
      const readTime = calculateReadTime(body);

      return {
        title: (metadata.title as string) || "Untitled",
        subtitle: (metadata.subtitle as string) || undefined,
        excerpt,
        content: processedBody,
        date:
          (metadata.date as string) || new Date().toISOString().split("T")[0],
        readTime,
        tags: Array.isArray(metadata.tags) ? (metadata.tags as string[]) : [],
        category: (metadata.category as string) || "uncategorized",
        featured: metadata.featured === true,
        coverImage: (metadata.coverImage as string) || undefined,
        slug:
          (metadata.slug as string) ||
          slugify((metadata.title as string) || "untitled"),
      };
    }),

  // ========================================================================
  // 归档
  // ========================================================================

  /** 获取所有归档（管理用） */
  listArchives: protectedProcedure.query(async () => {
    try {
      const archives = await db.getAllArchives();
      return { success: true, archives, total: archives.length };
    } catch (error) {
      console.error("[Admin] Error listing archives:", error);
      return {
        success: false,
        archives: [],
        total: 0,
        error: "Failed to load archives",
      };
    }
  }),

  /** 按 ID 获取单个归档 */
  getArchive: protectedProcedure
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
        return {
          success: false,
          archive: null,
          error: "Failed to get archive",
        };
      }
    }),

  /** 创建归档 */
  createArchive: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "标题不能为空").max(200),
        subtitle: z.string().max(200).optional(),
        excerpt: z.string().max(500).optional(),
        content: z.string().min(1, "内容不能为空"),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD"),
        tags: z.array(z.string().max(30)).max(20),
        category: z.string().min(1).max(50),
        slug: z.string().max(100).optional(),
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

        if (!success)
          return { success: false, error: "Failed to insert archive" };
        return { success: true, id, slug };
      } catch (error) {
        console.error("[Admin] Error creating archive:", error);
        return { success: false, error: "Failed to create archive" };
      }
    }),

  /** 更新归档 */
  updateArchive: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        subtitle: z.string().max(200).optional(),
        excerpt: z.string().max(500).optional(),
        content: z.string().min(1).optional(),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        tags: z.array(z.string().max(30)).max(20).optional(),
        category: z.string().min(1).max(50).optional(),
        slug: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { id, ...data } = input;

        if (data.content) {
          const readTime = calculateReadTime(data.content);
          const excerpt = data.excerpt || generateExcerpt(data.content);
          const success = await db.updateArchive(id, {
            ...data,
            readTime,
            excerpt,
          });
          if (!success)
            return { success: false, error: "Failed to update archive" };
        } else {
          const success = await db.updateArchive(id, data);
          if (!success)
            return { success: false, error: "Failed to update archive" };
        }

        return { success: true };
      } catch (error) {
        console.error("[Admin] Error updating archive:", error);
        return { success: false, error: "Failed to update archive" };
      }
    }),

  /** 删除归档 */
  deleteArchive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const success = await db.deleteArchive(input.id);
        if (!success)
          return { success: false, error: "Failed to delete archive" };
        return { success: true };
      } catch (error) {
        console.error("[Admin] Error deleting archive:", error);
        return { success: false, error: "Failed to delete archive" };
      }
    }),

  // ========================================================================
  // 订阅管理
  // ========================================================================

  /** 获取所有订阅者 */
  listSubscribers: protectedProcedure.query(async () => {
    try {
      const subscribers = await db.getAllSubscribers();
      return { success: true, subscribers };
    } catch (error) {
      console.error("[Admin] Error listing subscribers:", error);
      return {
        success: false,
        subscribers: [],
        error: "Failed to load subscribers",
      };
    }
  }),

  /** 删除订阅者 */
  deleteSubscriber: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const success = await db.deleteSubscriber(input.id);
        if (!success)
          return { success: false, error: "Failed to delete subscriber" };
        return { success: true };
      } catch (error) {
        console.error("[Admin] Error deleting subscriber:", error);
        return { success: false, error: "Failed to delete subscriber" };
      }
    }),

  // ========================================================================
  // 推送配置
  // ========================================================================

  /** 获取推送配置 */
  getNotifySettings: protectedProcedure.query(async () => {
    try {
      const autoNotify = await db.getSetting("auto_notify");
      return { success: true, autoNotify: autoNotify === "true" };
    } catch (error) {
      console.error("[Admin] Error getting notify settings:", error);
      return { success: true, autoNotify: false };
    }
  }),

  /** 更新推送配置 */
  updateNotifySettings: protectedProcedure
    .input(z.object({ autoNotify: z.boolean() }))
    .mutation(async ({ input }) => {
      try {
        await db.setSetting("auto_notify", String(input.autoNotify));
        return { success: true };
      } catch (error) {
        console.error("[Admin] Error updating notify settings:", error);
        return { success: false, error: "Failed to update settings" };
      }
    }),

  /** 发送测试邮件 */
  sendTestEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      try {
        const sent = await sendTestEmail(input.email);
        if (!sent)
          return { success: false, error: "邮件发送失败，请检查 SMTP 配置" };
        return { success: true };
      } catch (error) {
        console.error("[Admin] Error sending test email:", error);
        return { success: false, error: "邮件发送失败" };
      }
    }),

  /** 手动推送文章给所有已确认订阅者 */
  notifyArticle: protectedProcedure
    .input(z.object({ articleId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const article = await db.getArticleById(input.articleId);
        if (!article) return { success: false, error: "文章不存在" };

        const confirmedSubs = await db.getConfirmedSubscribers();
        if (confirmedSubs.length === 0) {
          return { success: false, error: "没有已确认的订阅者" };
        }

        const host = ctx.req.get("host") || "localhost:3000";
        const protocol = ctx.req.protocol || "http";
        const baseUrl = `${protocol}://${host}`;

        const emails = confirmedSubs.map(s => ({
          email: s.email,
          unsubscribeToken: s.unsubscribeToken || "",
        }));
        await sendArticleNotify(
          emails,
          {
            title: article.title,
            excerpt: article.excerpt,
            slug: article.slug,
          },
          baseUrl
        );

        return { success: true, count: emails.length };
      } catch (error) {
        console.error("[Admin] Error notifying article:", error);
        return { success: false, error: "推送失败" };
      }
    }),

  // ========================================================================
  // About 页面配置
  // ========================================================================

  /** 获取 About 页面配置 */
  getAboutConfig: protectedProcedure.query(async () => {
    try {
      const configDir =
        process.env.NODE_ENV === "development"
          ? path.join(ROOT_DIR, "client/public")
          : path.join(ROOT_DIR, "public");
      const raw = await fs.readFile(
        path.join(configDir, "about-config.json"),
        "utf-8"
      );
      return { success: true, config: JSON.parse(raw) };
    } catch (error) {
      console.error("[Admin] Error reading about config:", error);
      return { success: false, error: "读取配置失败" };
    }
  }),

  /** 更新 About 页面配置 */
  updateAboutConfig: protectedProcedure
    .input(
      z.object({
        hero: z.object({
          image: z.string(),
          title: z.string(),
          paragraphs: z.array(z.string()),
          quote: z.string(),
        }),
        interests: z.array(
          z.object({
            label: z.string(),
            description: z.string(),
          })
        ),
        favorites: z.array(
          z.object({
            category: z.string(),
            items: z.array(z.string()),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const json = JSON.stringify(input, null, 2) + "\n";
        const configDir =
          process.env.NODE_ENV === "development"
            ? path.join(ROOT_DIR, "client/public")
            : path.join(ROOT_DIR, "public");
        await fs.writeFile(
          path.join(configDir, "about-config.json"),
          json,
          "utf-8"
        );
        return { success: true };
      } catch (error) {
        console.error("[Admin] Error updating about config:", error);
        return { success: false, error: "保存配置失败" };
      }
    }),

  // ========================================================================
  // 访客管理
  // ========================================================================

  /** 获取访客统计数据 */
  getVisitorStats: protectedProcedure.query(async () => {
    try {
      const stats = await db.getVisitorStats();
      return { success: true, stats };
    } catch (error) {
      console.error("[Admin] Error getting visitor stats:", error);
      return {
        success: false,
        stats: { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0, total: 0 },
      };
    }
  }),

  /** 分页获取访客列表 */
  listVisitors: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await db.getVisitorsWithPagination({
          page: input.page,
          pageSize: input.pageSize,
          startDate: input.startDate,
          endDate: input.endDate,
        });
        return { success: true, ...result };
      } catch (error) {
        console.error("[Admin] Error listing visitors:", error);
        return {
          success: false,
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
        };
      }
    }),

  /** 清理指定天数之前的访客记录 */
  cleanOldVisitors: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(90) }))
    .mutation(async ({ input }) => {
      try {
        const deleted = await db.deleteOldVisitors(input.days);
        return { success: true, deleted };
      } catch (error) {
        console.error("[Admin] Error cleaning old visitors:", error);
        return { success: false, deleted: 0 };
      }
    }),
});
