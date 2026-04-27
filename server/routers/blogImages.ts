/*
 * 博客图片管理路由
 * 提供图片上传和获取功能
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { storagePut } from "../storage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKS_IMAGES_DIR = path.join(__dirname, "..", "..", "books", "images");

export const blogImagesRouter = router({
  /**
   * 上传博客图片（需要认证）
   */
  upload: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        data: z.string(), // base64 编码的图片数据
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 确保目录存在
        if (!fs.existsSync(BOOKS_IMAGES_DIR)) {
          fs.mkdirSync(BOOKS_IMAGES_DIR, { recursive: true });
        }

        // 验证文件名
        const sanitizedFilename = path.basename(input.filename);
        if (!sanitizedFilename) {
          return {
            success: false,
            error: "Invalid filename",
          };
        }

        // 将 base64 转换为 Buffer
        const buffer = Buffer.from(input.data, "base64");

        // 保存到本地 books/images 文件夹
        const localPath = path.join(BOOKS_IMAGES_DIR, sanitizedFilename);
        fs.writeFileSync(localPath, buffer);

        // 上传到存储服务
        const storageKey = `blog-images/${sanitizedFilename}`;
        const { url } = await storagePut(storageKey, buffer, input.mimeType);

        return {
          success: true,
          filename: sanitizedFilename,
          url,
          storageKey,
          localPath,
        };
      } catch (error) {
        console.error("[BlogImages] Upload error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Upload failed",
        };
      }
    }),

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

  /**
   * 删除博客图片（需要认证）
   */
  delete: protectedProcedure
    .input(z.object({ filename: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const sanitizedFilename = path.basename(input.filename);
        const localPath = path.join(BOOKS_IMAGES_DIR, sanitizedFilename);

        // 检查文件是否存在
        if (!fs.existsSync(localPath)) {
          return {
            success: false,
            error: "File not found",
          };
        }

        // 删除本地文件
        fs.unlinkSync(localPath);

        return {
          success: true,
          message: "Image deleted successfully",
        };
      } catch (error) {
        console.error("[BlogImages] Delete error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Delete failed",
        };
      }
    }),
});
