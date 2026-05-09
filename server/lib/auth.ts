/**
 * 认证工具模块
 * 提供 JWT 生成、验证和密码校验功能
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

if (!JWT_SECRET) {
  console.error("[Auth] FATAL: JWT_SECRET is not set in environment variables. Please set it in .env");
  process.exit(1);
}
if (!ADMIN_PASSWORD_HASH) {
  console.error("[Auth] FATAL: ADMIN_PASSWORD_HASH is not set in environment variables. Please set it in .env");
  process.exit(1);
}

// TypeScript 类型断言：经过上面的检查后，这些值一定存在
const _JWT_SECRET: string = JWT_SECRET!;
const _ADMIN_PASSWORD_HASH: string = ADMIN_PASSWORD_HASH;

export interface AuthPayload {
  username: string;
  iat: number;
  exp: number;
}

/**
 * 验证用户名和密码
 */
export function verifyCredentials(username: string, password: string): boolean {
  if (username !== ADMIN_USERNAME) return false;
  if (!_ADMIN_PASSWORD_HASH) return false;
  return bcrypt.compareSync(password, _ADMIN_PASSWORD_HASH);
}

/**
 * 生成 JWT token（有效期 7 天）
 */
export function signToken(username: string): string {
  return jwt.sign({ username }, _JWT_SECRET, { expiresIn: "7d" });
}

/**
 * 验证 JWT token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, _JWT_SECRET) as unknown as AuthPayload;
  } catch {
    return null;
  }
}
