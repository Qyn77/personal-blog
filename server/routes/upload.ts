/**
 * 文件上传路由
 * 使用 multer 处理 multipart/form-data 上传
 */

import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

const PROJECT_ROOT = process.cwd();

const ALLOWED_TYPES = ["books", "archives"] as const;

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const type = req.params.type;
    if (!ALLOWED_TYPES.includes(type as any)) {
      cb(new Error("Invalid upload type"), "");
      return;
    }
    const dir = path.join(PROJECT_ROOT, type);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    if (file.fieldname === "markdown") {
      cb(null, file.originalname);
    } else {
      const ext = path.extname(file.originalname);
      cb(null, `${nanoid()}${ext}`);
    }
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "markdown") {
      const isMd =
        file.mimetype === "text/markdown" ||
        file.mimetype === "text/plain" ||
        file.originalname.endsWith(".md");
      cb(null, isMd);
    } else if (file.fieldname === "coverImage") {
      cb(null, file.mimetype.startsWith("image/"));
    } else {
      cb(null, false);
    }
  },
});

export const uploadRouter = Router();

/**
 * POST /api/upload/:type
 * type = "books" | "archives"
 * 接受字段: markdown (文件), coverImage (文件)
 */
uploadRouter.post(
  "/:type",
  upload.fields([
    { name: "markdown", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const type = req.params.type;
      if (!ALLOWED_TYPES.includes(type as any)) {
        res.status(400).json({ success: false, error: "Invalid upload type" });
        return;
      }

      const files = req.files as Record<string, Express.Multer.File[]>;
      const result: { success: boolean; markdownPath?: string; coverImagePath?: string } = {
        success: true,
      };

      if (files.markdown?.[0]) {
        result.markdownPath = files.markdown[0].filename;
      }

      if (files.coverImage?.[0]) {
        // 封面图片保存到 images 子目录
        const imageFile = files.coverImage[0];
        const imagesDir = path.join(PROJECT_ROOT, type, "images");
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

        const ext = path.extname(imageFile.originalname);
        const newName = `${nanoid()}${ext}`;
        const finalPath = path.join(imagesDir, newName);
        fs.renameSync(imageFile.path, finalPath);

        result.coverImagePath = `/${type}/images/${newName}`;
      }

      res.json(result);
    } catch (error) {
      console.error("[Upload] Error:", error);
      res.status(500).json({ success: false, error: "Upload failed" });
    }
  }
);

/**
 * DELETE /api/upload/:type/:filename
 * 删除已上传的文件
 */
uploadRouter.delete("/:type/:filename", (req, res) => {
  try {
    const { type, filename } = req.params;
    if (!ALLOWED_TYPES.includes(type as any)) {
      res.status(400).json({ success: false, error: "Invalid type" });
      return;
    }

    const filePath = path.join(PROJECT_ROOT, type, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[Upload] Delete error:", error);
    res.status(500).json({ success: false, error: "Delete failed" });
  }
});
