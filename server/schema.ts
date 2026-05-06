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

