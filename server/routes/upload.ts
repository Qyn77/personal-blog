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
import { ROOT_DIR } from "../root";

const ALLOWED_TYPES = ["books", "archives", "images"] as const;

// images 上传目录：开发模式在 client/public/images，生产模式在 public/images
const IMAGES_DIR = process.env.NODE_ENV === "development"
  ? path.join(ROOT_DIR, "client/public/images")
  : path.join(ROOT_DIR, "public/images");

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const type = req.params.type;
    if (!ALLOWED_TYPES.includes(type as any)) {
      cb(new Error("Invalid upload type"), "");
      return;
    }
    const dir = type === "images"
      ? IMAGES_DIR
      : path.join(ROOT_DIR, type);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    if (file.fieldname === "markdown") {
      // 清理文件名，防止路径遍历
      const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._\u4e00-\u9fff-]/g, "_");
      cb(null, safeName);
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
        const imagesDir = path.join(ROOT_DIR, type, "images");
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

    // images 类型：multer 已保存到 client/public/images/，直接返回路径
    if (type === "images") {
      res.json({ success: true, imagePath: `/images/${file.filename}` });
      return;
    }

    const imagesDir = path.join(ROOT_DIR, type, "images");
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

    // 防止路径遍历：文件名不能包含 / \ 或 ..
    if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
      res.status(400).json({ success: false, error: "Invalid filename" });
      return;
    }

    const filePath = path.join(ROOT_DIR, type, filename);
    // 二次校验：解析后的路径必须在预期目录内
    const expectedDir = path.join(ROOT_DIR, type);
    if (!filePath.startsWith(expectedDir + path.sep) && filePath !== expectedDir) {
      res.status(400).json({ success: false, error: "Invalid filename" });
      return;
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[Upload] Delete error:", error);
    res.status(500).json({ success: false, error: "Delete failed" });
  }
});
