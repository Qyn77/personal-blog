# 墨迹 - 个人博客网站

一个以**日式极简主义**（Ma 間 哲学）为设计理念的个人博客网站，采用黑白为主题的简洁风格，支持本地 Markdown 文件加载、全局光暗模式切换、系统主题检测等功能。

## 🎨 设计理念

**日式极简主义（Japanese Minimalism / Ma 間）**

- **間（Ma）** — 留白即内容，空间本身就是设计语言
- **暖白底色** — #FAFAF8（浅色）/ #1A1A1A（深色）
- **衬线字体** — Playfair Display + Noto Serif SC，赋予文章文学质感
- **不对称布局** — 左对齐，大量留白，打破居中惯例
- **细节设计** — 细竖线、无边框卡片、水墨画素材

## ✨ 核心功能

### 已实现功能

- ✅ **全局光暗模式切换** — 导航栏月亮/太阳图标，支持所有页面和组件的主题变化
- ✅ **系统主题检测** — 根据操作系统深色模式偏好自动设置初始主题
- ✅ **主题偏好持久化** — 用户主题选择保存到 localStorage，下次访问自动应用
- ✅ **主题切换过渡动画** — 平滑的 300ms 淡入淡出效果
- ✅ **Markdown 渲染** — 支持 GFM、数学公式、代码高亮、表格等
- ✅ **本地 Markdown 文件加载** — 从 `books` 和 `archives` 文件夹动态加载内容
- ✅ **图片路径自动转换** — Markdown 中的图片自动转换为正确的 URL
- ✅ **文章元数据解析** — YAML frontmatter 支持（标题、日期、分类、标签等）
- ✅ **阅读时间计算** — 自动计算文章阅读时间
- ✅ **文章搜索和筛选** — 按分类、标签、关键词搜索
- ✅ **相关文章推荐** — 基于分类和标签的智能推荐

### 页面结构

| 页面 | 功能描述 |
|------|---------|
| **首页** | 英雄区（水墨背景）+ 精选文章 + 最新文章列表 |
| **文章列表** | 左侧分类/标签筛选，右侧文章列表，支持搜索 |
| **文章详情** | Markdown 渲染，阅读进度条，相关文章推荐 |
| **归档** | 按年份时间线展示所有文章 |
| **关于** | 个人介绍、兴趣爱好、水墨插图 |
| **404** | 优雅的错误页面 |

## 📁 项目结构

```
personal-blog/
├── client/                          # 前端代码
│   ├── src/
│   │   ├── pages/                  # 页面组件
│   │   │   ├── Home.tsx
│   │   │   ├── Blog.tsx
│   │   │   ├── Article.tsx
│   │   │   ├── Archive.tsx
│   │   │   ├── ArchiveDetail.tsx
│   │   │   └── About.tsx
│   │   ├── components/             # 可复用组件
│   │   │   ├── ui/                 # shadcn/ui 组件
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── ArticleCard.tsx
│   │   │   └── MarkdownRenderer.tsx
│   │   ├── contexts/               # React Context
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/                  # 自定义 Hooks
│   │   ├── lib/                    # 工具函数
│   │   │   ├── trpc.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx                 # 路由配置
│   │   ├── main.tsx                # 入口文件
│   │   └── index.css               # 全局样式
│   ├── public/                     # 静态资源
│   └── index.html
├── server/                         # 后端代码
│   ├── routers/                    # tRPC 路由
│   │   ├── blog.ts                 # 博客 API
│   │   └── archive.ts              # 归档 API
│   ├── lib/                        # 工具模块
│   │   ├── archiveLoader.ts        # 归档文件加载
│   │   └── blogLoader.test.ts      # 单元测试
│   ├── scripts/                    # 脚本工具
│   │   ├── copyContent.ts          # 复制内容到 dist
│   │   └── initDb.ts               # 初始化数据库
│   ├── _core/                      # 框架核心
│   │   ├── index.ts                # 服务器入口
│   │   ├── vite.ts                 # Vite/静态服务配置
│   │   ├── context.ts              # tRPC 上下文
│   │   └── trpc.ts                 # tRPC 初始化
│   ├── db.ts                       # 数据库配置
│   ├── storage.ts                  # 存储配置
│   └── routers.ts                  # 路由汇总
├── books/                          # 博客文章存储
│   ├── example-article.md
│   └── images/                     # 文章图片
├── archives/                       # 归档文章存储
│   ├── 2022-learning-path.md
│   ├── 2023-tech-stack.md
│   └── ...
├── drizzle/                        # 数据库迁移
│   ├── schema.ts
│   ├── sqlite-schema.ts
│   └── migrations/
├── dist/                           # 构建输出目录（自动生成）
│   ├── public/                     # 前端静态资源
│   ├── books/                      # 博客文章副本
│   ├── archives/                   # 归档文章副本
│   └── index.js                    # 服务器入口
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js 22.13.0+
- pnpm 10.4.1+

### 安装依赖

```bash
cd personal-blog
pnpm install
```

### 配置环境变量

创建 `.env` 文件：

```env
PORT=3000
NODE_ENV=development
```

### 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:3000` 查看网站。

## 🏗️ 打包项目

### 构建生产版本

```bash
pnpm build
```

构建过程包括：
1. `vite build` — 构建前端代码到 `dist/public`
2. `esbuild` — 构建后端代码到 `dist/index.js`
3. `copyContent.ts` — 复制 `books` 和 `archives` 到 `dist`

### 构建产物结构

```
dist/
├── public/
│   ├── index.html
│   └── assets/
│       ├── index-xxx.css
│       └── index-xxx.js
├── books/
│   ├── *.md
│   └── images/
├── archives/
│   └── *.md
└── index.js
```

## 📝 运行生产版本

### 启动生产服务器

```bash
pnpm start
```

或直接运行：

```bash
NODE_ENV=production node dist/index.js
```

服务器会：
- 服务前端静态资源（`dist/public`）
- 提供 `/books` 和 `/archives` 静态文件服务
- 提供 tRPC API（`/api/trpc`）

## 🚢 部署指南

### 1. 准备部署环境

确保目标服务器安装了：
- Node.js 22.13.0+
- pnpm 10.4.1+

### 2. 上传构建产物

```bash
# 在本地构建
pnpm build

# 上传 dist 目录到服务器
scp -r dist user@server:/path/to/deploy/
```

### 3. 配置进程管理（推荐）

使用 PM2 管理进程：

```bash
# 安装 PM2
pnpm install pm2 -g

# 启动应用
pm2 start dist/index.js --name personal-blog

# 设置开机自启
pm2 startup
pm2 save
```

### 4. 配置反向代理（Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /books {
        proxy_pass http://localhost:3000;
    }

    location /archives {
        proxy_pass http://localhost:3000;
    }

    location /api/trpc {
        proxy_pass http://localhost:3000;
    }
}
```

## 🔄 更新博客内容

### 方法一：重新构建部署（推荐）

1. **更新本地文件**：
   - 在 `books/` 目录添加/修改 Markdown 文件
   - 在 `books/images/` 添加新图片
   - 在 `archives/` 目录添加/修改归档文件

2. **重新构建**：
   ```bash
   pnpm build
   ```

3. **部署更新**：
   ```bash
   # 使用 PM2 重新加载
   pm2 reload personal-blog
   ```

### 方法二：直接替换文件（无需重启）

如果只是更新文章内容，可以直接替换 `dist/books` 或 `dist/archives` 中的文件：

```bash
# 复制新文章到服务器
scp books/new-article.md user@server:/path/to/deploy/dist/books/
scp books/images/new-image.png user@server:/path/to/deploy/dist/books/images/
```

> **注意**：此方法适用于纯内容更新，无需重启服务器。

### 方法三：使用数据库（可选）

运行数据库初始化脚本将文章导入 SQLite：

```bash
pnpm db:init
```

此脚本会：
- 读取 `books/` 和 `archives/` 目录的 Markdown 文件
- 解析 frontmatter 元数据
- 将文章内容存入 SQLite 数据库
- 复制图片到 `dist` 目录

## 📝 如何添加博客文章

### 1. 创建 Markdown 文件

在 `books` 或 `archives` 文件夹中创建 `.md` 文件：

```
books/
├── my-first-article.md
└── images/
    └── my-image.png
```

### 2. 编写文章内容

在 Markdown 文件开头添加 YAML frontmatter（元数据）：

```yaml
---
id: my-article-1
slug: my-first-article
title: 我的第一篇文章
subtitle: 副标题（可选）
excerpt: 文章摘要，显示在列表中
date: 2024-04-27
category: technology
tags: [标签1, 标签2, 标签3]
featured: false
coverImage: ./images/cover.png
---

# 文章正文

这里开始写你的 Markdown 内容...

## 小标题

支持所有标准 Markdown 语法。

### 插入图片

![图片描述](./images/my-image.png)
```

### 3. 系统自动加载

无需手动配置，系统会自动从文件夹读取所有 `.md` 文件并展示。

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 19 + TypeScript + Tailwind CSS 4 |
| **后端** | Express 4 + tRPC 11 + Node.js |
| **数据库** | Drizzle ORM + SQLite |
| **构建工具** | Vite 7 + esbuild |
| **Markdown** | react-markdown + remark-gfm + rehype-highlight |
| **UI 组件** | shadcn/ui + Radix UI |

## 🧪 测试

运行单元测试：

```bash
pnpm test
```

测试覆盖：
- ✅ Markdown 文件加载
- ✅ YAML frontmatter 解析
- ✅ 图片路径转换
- ✅ 阅读时间计算


## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**最后更新**：2026-04-30  
**版本**：1.0.0