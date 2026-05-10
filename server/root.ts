/**
 * 统一根目录解析
 * 生产模式（dist/index.js）：ROOT_DIR = dist/ 目录
 * 开发模式：ROOT_DIR = 项目根目录
 */
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 如果当前目录下存在 public/index.html，说明是在 dist/ 中运行（生产模式）
const isProduction = fs.existsSync(path.join(__dirname, "public", "index.html"));

// 自动设置 NODE_ENV（未显式设置时）
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = isProduction ? "production" : "development";
}

export const ROOT_DIR = isProduction
  ? __dirname
  : path.resolve(__dirname, "..");
