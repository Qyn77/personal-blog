# 数据库设置指南

你的博客项目现在使用 SQLite 来存储博客文章。

## 快速开始

### 1. 初始化数据库

首次运行时，需要从 `books/` 文件夹中的 Markdown 文件初始化数据库：

```bash
pnpm db:init
```

这个命令会：
- 创建 `blog.db` SQLite 数据库文件
- 读取 `books/` 文件夹中的所有 `.md` 文件
- 解析 YAML frontmatter 和内容
- 将所有文章导入到数据库

### 2. 启动开发服务器

```bash
pnpm dev
```

服务器会自动连接到 SQLite 数据库并提供 API。

## 数据库架构

### articles 表

存储博客文章的所有信息：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 文章唯一标识符（主键） |
| slug | TEXT | URL 友好的文章标识符（唯一） |
| title | TEXT | 文章标题 |
| subtitle | TEXT | 文章副标题（可选） |
| excerpt | TEXT | 文章摘要 |
| content | TEXT | 文章完整内容（Markdown） |
| date | TEXT | 发布日期（YYYY-MM-DD） |
| readTime | INTEGER | 阅读时间（分钟） |
| tags | TEXT | 标签（JSON 字符串数组） |
| category | TEXT | 分类 |
| featured | INTEGER | 是否精选（0 或 1） |
| coverImage | TEXT | 封面图片 URL（可选） |
| createdAt | INTEGER | 创建时间（Unix 时间戳） |
| updatedAt | INTEGER | 更新时间（Unix 时间戳） |

## Markdown 文件格式

在 `books/` 文件夹中创建 `.md` 文件，使用以下格式：

```markdown
---
id: unique-id
slug: article-url-slug
title: 文章标题
subtitle: 副标题（可选）
excerpt: 文章摘要
date: 2024-04-27
category: technology
tags: [标签1, 标签2]
featured: false
coverImage: https://example.com/image.jpg
---

# 文章内容

这里开始写 Markdown 内容...
```

## 常见操作

### 添加新文章

1. 在 `books/` 文件夹中创建新的 `.md` 文件
2. 添加 YAML frontmatter 和内容
3. 运行 `pnpm db:init` 重新初始化数据库

### 更新现有文章

1. 编辑 `books/` 中的 `.md` 文件
2. 运行 `pnpm db:init` 重新初始化数据库

### 删除文章

1. 从 `books/` 文件夹中删除对应的 `.md` 文件
2. 运行 `pnpm db:init` 重新初始化数据库

## 环境变量

在 `.env` 文件中配置数据库：

```env
DATABASE_URL=file:./blog.db
```

## 数据库文件位置

SQLite 数据库文件默认位置：`./blog.db`

这个文件应该被添加到 `.gitignore` 中（已默认添加）。

## 故障排除

### 数据库连接失败

确保 `DATABASE_URL` 环境变量正确设置：
```bash
DATABASE_URL=file:./blog.db
```

### 文章未导入

检查 `books/` 文件夹中的 Markdown 文件是否有正确的 frontmatter 格式。

### 重新初始化数据库

如果需要清空并重新初始化数据库：

```bash
rm blog.db
pnpm db:init
```

## API 端点

所有博客 API 都通过 tRPC 提供：

- `blog.listArticles` - 获取所有文章
- `blog.getArticle` - 获取单篇文章
- `blog.getByCategory` - 按分类获取文章
- `blog.getByTag` - 按标签获取文章
- `blog.search` - 搜索文章
