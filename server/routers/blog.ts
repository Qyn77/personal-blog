/*
 * 博客 tRPC 路由
 * 提供从 SQLite 数据库加载博客文章的 API
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const blogRouter = router({
  /**
   * 获取所有文章
   */
  listArticles: publicProcedure.query(async () => {
    try {
      const articles = await db.getAllArticles();
      return {
        success: true,
        articles,
        total: articles.length,
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
   * 按分类获取文章
   */
  getByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      try {
        const allArticles = await db.getAllArticles();
        const articles = allArticles.filter(a => a.category === input.category);
        return {
          success: true,
          articles,
          total: articles.length,
        };
      } catch (error) {
        console.error("[Blog] Error filtering articles:", error);
        return {
          success: false,
          articles: [],
          total: 0,
          error: "Failed to filter articles",
        };
      }
    }),

  /**
   * 按标签获取文章
   */
  getByTag: publicProcedure
    .input(z.object({ tag: z.string() }))
    .query(async ({ input }) => {
      try {
        const allArticles = await db.getAllArticles();
        const articles = allArticles.filter(a => {
          const tags = typeof a.tags === 'string' ? JSON.parse(a.tags) : (a.tags || []);
          return Array.isArray(tags) && tags.includes(input.tag);
        });
        return {
          success: true,
          articles,
          total: articles.length,
        };
      } catch (error) {
        console.error("[Blog] Error filtering articles:", error);
        return {
          success: false,
          articles: [],
          total: 0,
          error: "Failed to filter articles",
        };
      }
    }),

  /**
   * 搜索文章
   */
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      try {
        const query = input.query.toLowerCase();
        const allArticles = await db.getAllArticles();
        const articles = allArticles.filter(
          a => {
            const tags = typeof a.tags === 'string' ? JSON.parse(a.tags) : (a.tags || []);
            return (
              a.title.toLowerCase().includes(query) ||
              a.excerpt.toLowerCase().includes(query) ||
              a.content.toLowerCase().includes(query) ||
              (Array.isArray(tags) && tags.some((tag: string) => tag.toLowerCase().includes(query)))
            );
          }
        );
        return {
          success: true,
          articles,
          total: articles.length,
        };
      } catch (error) {
        console.error("[Blog] Error searching articles:", error);
        return {
          success: false,
          articles: [],
          total: 0,
          error: "Failed to search articles",
        };
      }
    }),
});
