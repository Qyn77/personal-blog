/**
 * 访客追踪 API
 * POST /api/visitor/track — 记录一次页面访问
 */

import { Router } from "express";
import { nanoid } from "nanoid";
import * as db from "../db";

export const visitorRouter = Router();

// ============================================================================
// IP 地理位置查询（带内存缓存）
// ============================================================================

interface GeoInfo {
  city?: string;
  country?: string;
}

const geoCache = new Map<string, GeoInfo>();
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小时
const geoCacheTimestamps = new Map<string, number>();

async function lookupGeo(ip: string): Promise<GeoInfo> {
  // 本地地址不查询
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.")
  ) {
    return { city: "本地", country: "本地" };
  }

  // 检查缓存
  const cached = geoCache.get(ip);
  const cachedAt = geoCacheTimestamps.get(ip);
  if (cached && cachedAt && Date.now() - cachedAt < GEO_CACHE_TTL) {
    return cached;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,city&lang=zh-CN`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) return {};

    const data = await res.json();
    if (data.status === "success") {
      const info: GeoInfo = {
        city: data.city || undefined,
        country: data.country || undefined,
      };
      geoCache.set(ip, info);
      geoCacheTimestamps.set(ip, Date.now());
      return info;
    }
    return {};
  } catch {
    return {};
  }
}

// ============================================================================
// User-Agent 解析
// ============================================================================

function parseUserAgent(ua: string): {
  device: string;
  browser: string;
  os: string;
} {
  if (!ua) return { device: "未知", browser: "未知", os: "未知" };

  // 设备类型
  let device = "Desktop";
  if (/Mobile|Android.*Mobile|iPhone|iPod|Windows Phone/i.test(ua)) {
    device = "Mobile";
  } else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
    device = "Tablet";
  }

  // 浏览器
  let browser = "Unknown";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/MSIE|Trident/i.test(ua)) browser = "IE";

  // 操作系统
  let os = "Unknown";
  if (/Windows NT 10/i.test(ua)) os = "Windows 10";
  else if (/Windows NT 11/i.test(ua)) os = "Windows 11";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    os = match ? `macOS ${match[1].replace("_", ".")}` : "macOS";
  } else if (/Android/i.test(ua)) {
    const match = ua.match(/Android (\d+[\.\d]*)/);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    const match = ua.match(/OS (\d+[_\d]*)/);
    os = match ? `iOS ${match[1].replace("_", ".")}` : "iOS";
  } else if (/Linux/i.test(ua)) os = "Linux";

  return { device, browser, os };
}

// ============================================================================
// 获取真实 IP
// ============================================================================

function getRealIp(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(",")[0].trim();
    return ip;
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

// ============================================================================
// 路由
// ============================================================================

/** POST /api/visitor/track — 记录页面访问 */
visitorRouter.post("/visitor/track", async (req, res) => {
  try {
    const { path: pagePath, referer } = req.body;
    if (!pagePath || typeof pagePath !== "string") {
      res.status(400).json({ error: "path is required" });
      return;
    }

    const ip = getRealIp(req);
    const userAgent = req.headers["user-agent"] || "";
    const { device, browser, os } = parseUserAgent(userAgent);

    // 异步查询地理位置，不阻塞响应
    const trackId = nanoid();
    const record = {
      id: trackId,
      ip,
      device,
      browser,
      os,
      path: pagePath.slice(0, 500), // 限制长度
      referer: referer?.slice(0, 500) || undefined,
      userAgent: userAgent.slice(0, 1000),
    };

    // 先响应请求
    res.json({ success: true });

    // 异步查地理位置并写入数据库
    lookupGeo(ip).then(geo => {
      db.insertVisitor({
        ...record,
        city: geo.city,
        country: geo.country,
      });
    });
  } catch (error) {
    console.error("[Visitor] Track error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
