/*
 * 博客图片管理路由
 * 提供图片获取功能
 */

import { publicProcedure, router } from "../_core/trpc";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKS_IMAGES_DIR = path.join(__dirname, "..", "..", "books", "images");

export const blogImagesRouter = router({
  /**
   * 列出所有博客图片
   */
  list: publicProcedure.query(async () => {
    try {
      if (!fs.existsSync(BOOKS_IMAGES_DIR)) {
        return {
          success: true,
          images: [],
        };
      }

      const files = fs.readdirSync(BOOKS_IMAGES_DIR);
      const images = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
        .map(file => ({
          filename: file,
          url: `/manus-storage/blog-images/${file}`,
          path: `./images/${file}`,
        }));

      return {
        success: true,
        images,
      };
    } catch (error) {
      console.error("[BlogImages] List error:", error);
      return {
        success: false,
        images: [],
        error: error instanceof Error ? error.message : "Failed to list images",
      };
    }
  }),
});
