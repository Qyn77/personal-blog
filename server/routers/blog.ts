/*
 * 博客 tRPC 路由
 * 提供从 SQLite 数据库加载博客文章的 API
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const blogRouter = router({
  /**
   * 获取已发布文章（支持分页、搜索、筛选）
   */
  listArticles: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).optional(),
        pageSize: z.number().min(1).max(50).optional(),
        search: z.string().optional(),
        category: z.string().optional(),
        tag: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      try {
        const options = input || {};
        // 如果没有分页参数，返回全部已发布文章（兼容旧调用）
        if (!options.page && !options.pageSize && !options.search && !options.category && !options.tag) {
          const articles = await db.getAllArticles({ status: "published" });
          return {
            success: true,
            articles,
            total: articles.length,
          };
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

        return {
          success: true,
          articles: result.items,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
        };
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
  getFilterOptions: publicProcedure.query(async () => {
    try {
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
      return { success: true, categories, tags };
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

});
