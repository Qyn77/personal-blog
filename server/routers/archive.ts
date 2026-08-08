/*
 * 归档 tRPC 路由
 * 提供从 SQLite 数据库加载归档内容的 API
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { createResponseCache } from "../lib/responseCache";

const CACHE_TTL_MS = 30 * 1000;
const responseCache = createResponseCache(CACHE_TTL_MS);

export const archiveRouter = router({
  listArchiveSummaries: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(12),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        ctx.res.setHeader(
          "Cache-Control",
          "public, max-age=30, stale-while-revalidate=120"
        );
        const limit = input?.limit ?? 12;
        const cacheKey = `listArchiveSummaries:${limit}`;
        const cached = responseCache.get<{
          success: true;
          archives: unknown[];
          total: number;
        }>(cacheKey);
        if (cached) return cached;

        const allArchives = await db.getAllArchives();
        const sorted = [...allArchives].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const payload = {
          success: true as const,
          archives: sorted.slice(0, limit).map(archive => ({
            id: archive.id,
            slug: archive.slug,
            title: archive.title,
            subtitle: archive.subtitle,
            excerpt: archive.excerpt,
            date: archive.date,
            readTime: archive.readTime,
            tags: archive.tags,
            category: archive.category,
            createdAt: archive.createdAt,
            updatedAt: archive.updatedAt,
          })),
          total: allArchives.length,
        };
        responseCache.set(cacheKey, payload);
        return payload;
      } catch (error) {
        console.error("[Archive] Error loading archive summaries:", error);
        return {
          success: false,
          archives: [],
          total: 0,
          error: "Failed to load archive summaries",
        };
      }
    }),

  /**
   * 获取所有归档
   */
  listArchives: publicProcedure.query(async ({ ctx }) => {
    try {
      ctx.res.setHeader(
        "Cache-Control",
        "public, max-age=30, stale-while-revalidate=120"
      );
      const archives = await db.getAllArchives();
      return {
        success: true,
        archives,
        total: archives.length,
      };
    } catch (error) {
      console.error("[Archive] Error loading archives:", error);
      return {
        success: false,
        archives: [],
        total: 0,
        error: "Failed to load archives",
      };
    }
  }),

  /**
   * 获取单个归档
   */
  getArchive: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      try {
        const archive = await db.getArchiveBySlug(input.slug);
        if (!archive) {
          return {
            success: false,
            archive: null,
            error: "Archive not found",
          };
        }
        return {
          success: true,
          archive,
        };
      } catch (error) {
        console.error("[Archive] Error loading archive:", error);
        return {
          success: false,
          archive: null,
          error: "Failed to load archive",
        };
      }
    }),

  /**
   * 按年份分组获取归档
   */
  getByYear: publicProcedure.query(async () => {
    try {
      const allArchives = await db.getAllArchives();

      // 按年份分组
      const byYear: Record<string, any[]> = {};
      allArchives.forEach(archive => {
        const year = archive.date.split("-")[0];
        if (!byYear[year]) {
          byYear[year] = [];
        }
        byYear[year].push(archive);
      });

      // 按年份降序排序
      const sorted: Record<string, any[]> = {};
      Object.keys(byYear)
        .sort((a, b) => parseInt(b) - parseInt(a))
        .forEach(year => {
          sorted[year] = byYear[year].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });

      return {
        success: true,
        archive: sorted,
      };
    } catch (error) {
      console.error("[Archive] Error grouping archives:", error);
      return {
        success: false,
        archive: {},
        error: "Failed to group archives",
      };
    }
  }),
});
