/*
 * 归档 tRPC 路由
 * 提供从 SQLite 数据库加载归档内容的 API
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const archiveRouter = router({
  /**
   * 获取所有归档
   */
  listArchives: publicProcedure.query(async () => {
    try {
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
