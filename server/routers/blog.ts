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

});
