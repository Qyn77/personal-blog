/**
 * 文件上传路由
 * 使用 multer 处理 multipart/form-data 上传
 */

import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { verifyToken } from "../lib/auth";

const PROJECT_ROOT = process.cwd();

// 根据环境变量决定上传路径根目录
// 开发模式：上传到项目根目录下的 books/archives
// 生产模式：上传到 dist 目录下的 books/archives
const isDev = process.env.NODE_ENV === "development";
const CONTENT_ROOT = isDev ? PROJECT_ROOT : path.join(PROJECT_ROOT, "dist");

const ALLOWED_TYPES = ["books", "archives"] as const;

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const type = req.params.type;
    if (!ALLOWED_TYPES.includes(type as any)) {
      cb(new Error("Invalid upload type"), "");
      return;
    }
    const dir = path.join(CONTENT_ROOT, type);
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
    } else if (file.fieldname === "coverImage" || file.fieldname === "image") {
      cb(null, file.mimetype.startsWith("image/"));
    } else {
      cb(null, false);
    }
  },
});

export const uploadRouter = Router();

// 认证中间件
uploadRouter.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "未登录" });
    return;
  }
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) {
    res.status(401).json({ success: false, error: "登录已过期" });
    return;
  }
  next();
});

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
        const imagesDir = path.join(CONTENT_ROOT, type, "images");
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
 * POST /api/upload/:type/image
 * 粘贴上传单张图片，返回图片路径
 */
uploadRouter.post("/:type/image", upload.single("image"), (req, res) => {
  try {
    const type = req.params.type;
    if (!ALLOWED_TYPES.includes(type as any)) {
      res.status(400).json({ success: false, error: "Invalid upload type" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: "No image provided" });
      return;
    }

    const imagesDir = path.join(CONTENT_ROOT, type, "images");
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

    const ext = path.extname(file.originalname) || ".png";
    const newName = `${nanoid()}${ext}`;
    const finalPath = path.join(imagesDir, newName);
    fs.renameSync(file.path, finalPath);

    res.json({ success: true, imagePath: `/${type}/images/${newName}` });
  } catch (error) {
    console.error("[Upload] Image error:", error);
    res.status(500).json({ success: false, error: "Upload failed" });
  }
});

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

    const filePath = path.join(CONTENT_ROOT, type, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[Upload] Delete error:", error);
    res.status(500).json({ success: false, error: "Delete failed" });
  }
});
