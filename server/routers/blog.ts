/*
 * 博客 tRPC 路由
 * 提供从 SQLite 数据库加载博客文章的 API
 */

import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "../db";
import { sendVerifyEmail } from "../lib/email";

// 简单的 IP 级速率限制（每 IP 每 10 分钟最多 3 次订阅请求）
const subscribeRateMap = new Map<string, { count: number; resetAt: number }>();

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const CACHE_TTL_MS = 30 * 1000;
const responseCache = new Map<string, CacheEntry<unknown>>();

function readCache<T>(key: string): T | null {
  const cached = responseCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return cached.value as T;
}

function writeCache<T>(key: string, value: T) {
  responseCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function checkSubscribeRate(ip: string): boolean {
  const now = Date.now();
  const record = subscribeRateMap.get(ip);
  if (!record || now > record.resetAt) {
    subscribeRateMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (record.count >= 3) return false;
  record.count++;
  return true;
}

export const blogRouter = router({
  listArticleSummaries: publicProcedure
    .input(
      z
        .object({
          pageSize: z.number().min(1).max(50).default(20),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        ctx.res.setHeader(
          "Cache-Control",
          "public, max-age=30, stale-while-revalidate=120"
        );
        const pageSize = input?.pageSize ?? 20;
        const cacheKey = `listArticleSummaries:${pageSize}`;
        const cached = readCache<{
          success: true;
          articles: unknown[];
          total: number;
        }>(cacheKey);
        if (cached) return cached;

        const result = await db.getArticlesWithPagination({
          status: "published",
          page: 1,
          pageSize,
        });

        const payload = {
          success: true as const,
          articles: result.items.map(article => ({
            id: article.id,
            slug: article.slug,
            title: article.title,
            subtitle: article.subtitle,
            excerpt: article.excerpt,
            date: article.date,
            readTime: article.readTime,
            tags: article.tags,
            category: article.category,
            featured: article.featured,
            coverImage: article.coverImage,
            status: article.status,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
          })),
          total: result.total,
        };

        writeCache(cacheKey, payload);
        return payload;
      } catch (error) {
        console.error("[Blog] Error loading article summaries:", error);
        return {
          success: false,
          articles: [],
          total: 0,
          error: "Failed to load article summaries",
        };
      }
    }),

  /**
   * 获取已发布文章（支持分页、搜索、筛选）
   */
  listArticles: publicProcedure
    .input(
      z
        .object({
          page: z.number().min(1).optional(),
          pageSize: z.number().min(1).max(50).optional(),
          search: z.string().optional(),
          category: z.string().optional(),
          tag: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        ctx.res.setHeader(
          "Cache-Control",
          "public, max-age=30, stale-while-revalidate=120"
        );
        const options = input || {};
        // public 列表接口短缓存，减轻高频读压力
        const cacheKey = `listArticles:${JSON.stringify(options)}`;
        const cached = readCache<{
          success: true;
          articles: unknown[];
          total: number;
          page?: number;
          pageSize?: number;
        }>(cacheKey);
        if (cached) return cached;

        // 如果没有分页参数，返回全部已发布文章（兼容旧调用）
        if (
          !options.page &&
          !options.pageSize &&
          !options.search &&
          !options.category &&
          !options.tag
        ) {
          const articles = await db.getAllArticles({ status: "published" });
          const payload = {
            success: true,
            articles,
            total: articles.length,
          };
          writeCache(cacheKey, payload);
          return payload;
        }

        // 分页模式
        const result = await db.getArticlesWithPagination({
          status: "published",
          page: options.page || 1,
          pageSize: options.pageSize || 10,
          search: options.search,
          category: options.category,
          tag: options.tag,
        });

        const payload = {
          success: true,
          articles: result.items,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
        };
        writeCache(cacheKey, payload);
        return payload;
      } catch (error) {
        console.error("[Blog] Error loading articles:", error);
        return {
          success: false,
          articles: [],
          total: 0,
          error: "Failed to load articles",
        };
      }
    }),

  /**
   * 获取所有分类和标签（用于筛选 UI）
   */
  getFilterOptions: publicProcedure.query(async ({ ctx }) => {
    try {
      ctx.res.setHeader(
        "Cache-Control",
        "public, max-age=30, stale-while-revalidate=120"
      );
      const cacheKey = "getFilterOptions";
      const cached = readCache<{
        success: true;
        categories: string[];
        tags: string[];
      }>(cacheKey);
      if (cached) return cached;

      const articles = await db.getAllArticles({ status: "published" });
      const categories = Array.from(
        new Set(articles.map(a => a.category))
      ).sort();
      const allTags = articles.flatMap(a => {
        try {
          return typeof a.tags === "string" ? JSON.parse(a.tags) : a.tags;
        } catch {
          return [];
        }
      });
      const tags = Array.from(new Set(allTags)).sort() as string[];
      const payload = { success: true as const, categories, tags };
      writeCache(cacheKey, payload);
      return payload;
    } catch (error) {
      console.error("[Blog] Error loading filter options:", error);
      return { success: true, categories: [], tags: [] };
    }
  }),

  /**
   * 获取单个文章
   */
  getArticle: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      try {
        const article = await db.getArticleBySlug(input.slug);
        if (!article) {
          return {
            success: false,
            article: null,
            error: "Article not found",
          };
        }
        return {
          success: true,
          article,
        };
      } catch (error) {
        console.error("[Blog] Error loading article:", error);
        return {
          success: false,
          article: null,
          error: "Failed to load article",
        };
      }
    }),

  /**
   * 订阅博客（发送验证邮件）
   */
  subscribe: publicProcedure
    .input(z.object({ email: z.string().email("请输入有效的邮箱地址") }))
    .mutation(async ({ input, ctx }) => {
      try {
        // 速率限制：每 IP 每 10 分钟最多 3 次
        const ip = ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";
        if (!checkSubscribeRate(ip)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "请求过于频繁，请稍后再试",
          });
        }

        const email = input.email.toLowerCase().trim();

        // 检查是否已订阅
        const existing = await db.getSubscriberByEmail(email);
        if (existing) {
          if (existing.status === "confirmed") {
            return { success: false, error: "该邮箱已订阅" };
          }
          if (existing.status === "unsubscribed") {
            // 重新订阅：生成新 token
            const token = nanoid(32);
            const unsubToken = nanoid(32);
            const expiresAt = Date.now() + 60 * 60 * 1000; // 1 小时
            await db.updateSubscriber(existing.id, {
              status: "pending",
              verifyToken: token,
              tokenExpiresAt: expiresAt,
              unsubscribeToken: unsubToken,
            });

            const host = ctx.req.get("host") || "localhost:3000";
            const protocol = ctx.req.protocol || "http";
            const baseUrl = `${protocol}://${host}`;

            const sent = await sendVerifyEmail(email, token, baseUrl);
            if (!sent)
              return { success: false, error: "邮件发送失败，请稍后重试" };

            return { success: true, message: "验证邮件已发送，请查收" };
          }
          // pending 状态：检查 token 是否还在有效期内
          if (existing.tokenExpiresAt && existing.tokenExpiresAt > Date.now()) {
            return {
              success: true,
              message: "验证邮件已发送，请查收（如未收到请稍后再试）",
            };
          }
        }

        // 新订阅
        const id = nanoid();
        const token = nanoid(32);
        const unsubToken = nanoid(32);
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 小时

        if (existing) {
          // 更新已有的 pending 记录
          await db.updateSubscriber(existing.id, {
            verifyToken: token,
            tokenExpiresAt: expiresAt,
            unsubscribeToken: unsubToken,
          });
        } else {
          await db.insertSubscriber({
            id,
            email,
            status: "pending",
            verifyToken: token,
            tokenExpiresAt: expiresAt,
            unsubscribeToken: unsubToken,
          });
        }

        const host = ctx.req.get("host") || "localhost:3000";
        const protocol = ctx.req.protocol || "http";
        const baseUrl = `${protocol}://${host}`;

        const sent = await sendVerifyEmail(email, token, baseUrl);
        if (!sent) return { success: false, error: "邮件发送失败，请稍后重试" };

        return { success: true, message: "验证邮件已发送，请查收" };
      } catch (error) {
        console.error("[Blog] Subscribe error:", error);
        return { success: false, error: "订阅失败，请稍后重试" };
      }
    }),
});
