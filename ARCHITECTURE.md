# 项目架构说明

本文档详细说明了「墨迹」个人博客网站的技术架构、核心模块设计和数据流。

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     浏览器 (React 19)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Home Page    │  │ Blog Page    │  │ Article Page │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Archive Page │  │ About Page   │  │ ThemeContext │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                    tRPC Client (HTTP)                        │
├─────────────────────────────────────────────────────────────┤
│                  Express Server (Node.js)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Blog Router  │  │ Blog Images  │  │ Auth Router  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Blog Loader (blogLoader.ts)                  │   │
│  │  - 读取 books/ 文件夹中的 .md 文件                   │   │
│  │  - 解析 YAML frontmatter                             │   │
│  │  - 转换图片路径                                      │   │
│  │  - 计算阅读时间                                      │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │              文件系统 & 存储                          │   │
│  │  - books/ (Markdown 文章)                            │   │
│  │  - books/images/ (图片资源)                          │   │
│  │  - S3 存储 (上传的图片)                              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│              MySQL 数据库 (Drizzle ORM)                      │
└─────────────────────────────────────────────────────────────┘
```

## 核心模块

### 1. 前端架构

#### 页面组件 (client/src/pages/)

| 组件 | 职责 | 关键功能 |
|------|------|---------|
| **Home.tsx** | 首页 | 英雄区、精选文章、最新文章列表 |
| **Blog.tsx** | 文章列表 | 分类/标签筛选、搜索、动态加载 |
| **Article.tsx** | 文章详情 | Markdown 渲染、进度条、相关推荐 |
| **Archive.tsx** | 归档 | 按年份时间线展示 |
| **About.tsx** | 关于 | 个人介绍、兴趣爱好 |

#### 可复用组件 (client/src/components/)

| 组件 | 职责 |
|------|------|
| **Navbar.tsx** | 导航栏，包含主题切换按钮 |
| **Footer.tsx** | 页脚 |
| **ArticleCard.tsx** | 文章卡片（3 种变体：default/featured/compact） |
| **MarkdownRenderer.tsx** | Markdown 渲染器 |

#### 主题系统 (client/src/contexts/ThemeContext.tsx)

```typescript
// 功能特性
- 支持 light/dark 两种主题
- 系统主题检测 (prefers-color-scheme)
- 主题偏好持久化 (localStorage)
- 主题切换过渡动画 (300ms)
- 监听系统主题变化
```

**主题切换流程**：

```
用户点击切换按钮
    ↓
toggleTheme() 添加 theme-transition 类
    ↓
setTheme() 更新主题状态
    ↓
useEffect 应用 CSS 变量变化
    ↓
CSS 过渡动画 (300ms)
    ↓
移除 theme-transition 类
```

### 2. 后端架构

#### tRPC 路由 (server/routers/)

**blog.ts** - 博客 API 路由

```typescript
export const blogRouter = router({
  // 获取所有文章（带分类、标签、总数）
  listArticles: publicProcedure.query(async () => {
    return {
      success: boolean;
      articles: Article[];
      total: number;
      error?: string;
    };
  }),

  // 获取单篇文章
  getArticle: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return {
        success: boolean;
        article?: Article;
        error?: string;
      };
    }),

  // 搜索文章
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return {
        success: boolean;
        articles: Article[];
      };
    }),
});
```

**blogImages.ts** - 图片管理 API

```typescript
export const blogImagesRouter = router({
  // 上传图片到 S3
  upload: protectedProcedure
    .input(z.object({ 
      filename: z.string(),
      data: z.instanceof(Buffer)
    }))
    .mutation(async ({ input }) => {
      return {
        success: boolean;
        url?: string;
        key?: string;
      };
    }),
});
```

#### Markdown 加载模块 (server/lib/blogLoader.ts)

**核心功能**：

```typescript
// 1. 加载所有文章
export function loadAllArticles(): Article[] {
  // 读取 books/ 文件夹中的所有 .md 文件
  // 解析 YAML frontmatter
  // 返回 Article[] 数组
}

// 2. 加载单篇文章
export function loadArticleBySlug(slug: string): Article | null {
  // 根据 slug 查找对应的 .md 文件
  // 解析并返回完整的 Article 对象
}

// 3. 处理图片路径
function convertImagePaths(content: string): string {
  // 将 ![alt](./images/name.png) 转换为
  // ![alt](/manus-storage/uploaded-key)
}

// 4. 计算阅读时间
function calculateReadTime(content: string): number {
  // 根据字数计算阅读时间（分钟）
}
```

**YAML Frontmatter 格式**：

```yaml
---
id: unique-id
slug: url-friendly-slug
title: 文章标题
subtitle: 副标题（可选）
excerpt: 文章摘要
date: 2024-04-27
category: technology
tags: [标签1, 标签2]
featured: false
---
```

### 3. 数据流

#### 文章列表加载流程

```
用户访问 /blog
    ↓
Blog.tsx 组件挂载
    ↓
调用 trpc.blog.listArticles.useQuery()
    ↓
Express 服务器接收请求
    ↓
blogLoader.loadAllArticles()
    ↓
读取 books/ 文件夹
    ↓
解析所有 .md 文件的 frontmatter
    ↓
返回 { success: true, articles: [...], total: N }
    ↓
前端接收数据
    ↓
提取分类和标签
    ↓
渲染文章列表
```

#### 文章详情加载流程

```
用户点击文章卡片
    ↓
导航到 /article/{slug}
    ↓
Article.tsx 组件挂载
    ↓
调用 trpc.blog.getArticle.useQuery({ slug })
    ↓
Express 服务器接收请求
    ↓
blogLoader.loadArticleBySlug(slug)
    ↓
查找对应的 .md 文件
    ↓
解析 frontmatter 和内容
    ↓
转换图片路径
    ↓
返回完整 Article 对象
    ↓
前端接收数据
    ↓
MarkdownRenderer 渲染内容
    ↓
计算相关文章
```

#### 主题切换流程

```
用户点击导航栏主题按钮
    ↓
Navbar.tsx 调用 toggleTheme()
    ↓
ThemeContext.toggleTheme()
    ↓
添加 theme-transition 类到 <html>
    ↓
setTheme(prev => prev === 'light' ? 'dark' : 'light')
    ↓
useEffect 监听主题变化
    ↓
应用 CSS 变量（background, foreground 等）
    ↓
CSS 过渡动画 (300ms)
    ↓
保存到 localStorage
    ↓
移除 theme-transition 类
```

## 样式系统

### CSS 变量设计

**浅色模式** (:root)

```css
--background: oklch(0.985 0.003 80);  /* 暖白 #FAFAF8 */
--foreground: oklch(0.15 0.005 60);   /* 深墨 #1A1A1A */
--card: oklch(0.985 0.003 80);
--muted-foreground: oklch(0.52 0.008 60);
--border: oklch(0.88 0.004 80);
```

**深色模式** (.dark)

```css
--background: oklch(0.12 0.004 60);   /* 深灰 */
--foreground: oklch(0.92 0.003 80);   /* 浅白 */
--card: oklch(0.18 0.005 60);
--muted-foreground: oklch(0.65 0.008 80);
--border: oklch(0.92 0.003 80 / 15%);
```

### 过渡动画

```css
html.theme-transition,
html.theme-transition * {
  transition: 
    background-color 300ms ease,
    color 300ms ease,
    border-color 300ms ease !important;
}
```

## 数据库设计

### users 表

```typescript
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});
```

**注**：文章数据存储在本地文件系统 (books/) 中，而非数据库。

## 性能优化

### 前端优化

1. **代码分割** — 每个页面独立加载
2. **图片优化** — 使用 S3 存储和 CDN
3. **缓存策略** — tRPC 自动缓存查询结果
4. **主题切换** — 使用 CSS 变量，避免重排

### 后端优化

1. **文件缓存** — 首次加载后缓存 Markdown 文件
2. **增量加载** — 只加载需要的文章
3. **图片处理** — 异步上传到 S3

## 测试覆盖

### 单元测试 (server/lib/blogLoader.test.ts)

```typescript
✅ loadAllArticles() - 加载所有文章
✅ loadArticleBySlug() - 加载单篇文章
✅ parseYamlFrontmatter() - 解析 YAML
✅ convertImagePaths() - 转换图片路径
✅ calculateReadTime() - 计算阅读时间
✅ 处理缺失的 frontmatter
✅ 处理无效的日期格式
```

运行测试：

```bash
pnpm test
```

## 部署架构

```
GitHub Repository
    ↓
Manus Platform
    ↓
┌─────────────────────────────┐
│   Cloud Run (Express)       │
│   - 后端 API                │
│   - Markdown 加载           │
│   - OAuth 认证              │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│   CDN (S3 + CloudFront)     │
│   - 静态资源                │
│   - 上传的图片              │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│   MySQL Database            │
│   - 用户数据                │
│   - 会话信息                │
└─────────────────────────────┘
```

## 扩展点

### 添加新页面

1. 在 `client/src/pages/` 中创建新页面组件
2. 在 `client/src/App.tsx` 中注册路由
3. 在 `client/src/components/Navbar.tsx` 中添加导航链接

### 添加新 API

1. 在 `server/routers/` 中创建新路由文件
2. 在 `server/routers.ts` 中注册路由
3. 在前端使用 `trpc.newRouter.method.useQuery/useMutation()`

### 自定义样式

1. 在 `client/src/index.css` 中修改 CSS 变量
2. 所有组件会自动应用新样式
3. 支持浅色和深色模式

## 常见问题

### Q: 如何修改博客文章？

A: 编辑 `books/` 文件夹中的 `.md` 文件，系统会自动重新加载。

### Q: 如何添加新分类？

A: 在 Markdown frontmatter 中指定新的 `category` 值，系统会自动识别。

### Q: 如何修改主题颜色？

A: 编辑 `client/src/index.css` 中的 CSS 变量（:root 和 .dark）。

### Q: 图片如何存储？

A: 本地 Markdown 中的图片放在 `books/images/`，系统会自动上传到 S3 并转换 URL。

---

**最后更新**：2024-04-27  
**版本**：1.0.0
