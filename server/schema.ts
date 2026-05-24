import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * SQLite 博客文章表
 * 用于存储博客文章的元数据和内容
 */
export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  date: text("date").notNull(),
  readTime: integer("readTime").notNull(),
  tags: text("tags").notNull(), // JSON 字符串
  category: text("category").notNull(),
  featured: integer("featured").notNull().default(0), // SQLite 没有 boolean，用 0/1
  coverImage: text("coverImage"),
  status: text("status").notNull().default("published"), // "draft" | "published"
  createdAt: integer("createdAt").notNull(), // Unix timestamp
  updatedAt: integer("updatedAt").notNull(), // Unix timestamp
});

export type Article = typeof articles.$inferSelect;

/**
 * SQLite 归档表
 * 用于存储归档内容的元数据和内容
 */
export const archives = sqliteTable("archives", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  date: text("date").notNull(),
  readTime: integer("readTime").notNull(),
  tags: text("tags").notNull(), // JSON 字符串
  category: text("category").notNull(),
  createdAt: integer("createdAt").notNull(), // Unix timestamp
  updatedAt: integer("updatedAt").notNull(), // Unix timestamp
});

export type Archive = typeof archives.$inferSelect;

/**
 * SQLite 订阅者表
 * 用于存储邮件订阅者信息
 */
export const subscribers = sqliteTable("subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("pending"), // "pending" | "confirmed" | "unsubscribed"
  verifyToken: text("verifyToken"),
  tokenExpiresAt: integer("tokenExpiresAt"), // Unix timestamp
  unsubscribeToken: text("unsubscribeToken"),
  createdAt: integer("createdAt").notNull(),
  confirmedAt: integer("confirmedAt"),
});

export type Subscriber = typeof subscribers.$inferSelect;

/**
 * SQLite 设置表
 * 用于存储系统配置项（key-value）
 */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/**
 * SQLite 访客记录表
 * 用于记录网站访客信息
 */
export const visitors = sqliteTable("visitors", {
  id: text("id").primaryKey(),
  ip: text("ip").notNull(),
  city: text("city"), // IP 归属城市
  country: text("country"), // IP 归属国家
  device: text("device"), // 设备类型
  browser: text("browser"), // 浏览器
  os: text("os"), // 操作系统
  path: text("path").notNull(), // 访问路径
  referer: text("referer"), // 来源页面
  userAgent: text("userAgent"), // 原始 User-Agent
  createdAt: integer("createdAt").notNull(), // Unix timestamp
});

export type Visitor = typeof visitors.$inferSelect;
