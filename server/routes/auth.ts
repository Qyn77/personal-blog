/**
 * 认证路由
 * POST /api/auth/login - 登录获取 JWT
 * GET  /api/auth/verify - 验证 token 有效性
 */

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { verifyCredentials, signToken, verifyToken } from "../lib/auth";

export const authRouter = Router();

// 登录接口限流：每 IP 每 15 分钟最多 10 次尝试
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: "登录尝试过多，请 15 分钟后再试" },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/login
 * Body: { username: string, password: string }
 * Returns: { success, token, error }
 */
authRouter.post("/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ success: false, error: "请输入用户名和密码" });
    return;
  }

  if (!verifyCredentials(username, password)) {
    res.status(401).json({ success: false, error: "用户名或密码错误" });
    return;
  }

  const token = signToken(username);
  res.json({ success: true, token });
});

/**
 * GET /api/auth/verify
 * Header: Authorization: Bearer <token>
 * Returns: { valid, username }
 */
authRouter.get("/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.json({ valid: false });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.json({ valid: false });
    return;
  }

  res.json({ valid: true, username: payload.username });
});
