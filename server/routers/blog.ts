/*
 * 博客 tRPC 路由
 * 提供从本地 books 文件夹加载博客文章的 API
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { loadAllArticles, getArticleBySlug } from "../lib/blogLoader";

export const blogRouter = router({
  /**
   * 获取所有文章
   */
  listArticles: publicProcedure.query(async () => {
    try {
      const articles = loadAllArticles();
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
        const article = getArticleBySlug(input.slug);
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
        const articles = loadAllArticles().filter(a => a.category === input.category);
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
        const articles = loadAllArticles().filter(a => a.tags.includes(input.tag));
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
        const articles = loadAllArticles().filter(
          a =>
            a.title.toLowerCase().includes(query) ||
            a.excerpt.toLowerCase().includes(query) ||
            a.content.toLowerCase().includes(query) ||
            a.tags.some(tag => tag.toLowerCase().includes(query))
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
