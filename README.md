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
- ✅ **本地 Markdown 文件加载** — 从 `books` 文件夹动态加载博客文章
- ✅ **图片路径自动转换** — Markdown 中的图片自动上传到存储并转换为 URL
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

## 🚀 快速开始

### 环境要求

- Node.js 22.13.0+
- pnpm 10.4.1+
- MySQL 或 TiDB 数据库

### 安装依赖

```bash
cd personal-blog
pnpm install
```

### 配置环境变量

创建 `.env.local` 文件（或通过 Manus 管理界面配置）：

```env
DATABASE_URL=mysql://user:password@localhost:3306/personal_blog
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```

### 初始化数据库

```bash
pnpm db:push
```

### 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:3000` 查看网站。

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 📝 如何添加博客文章

### 1. 创建 Markdown 文件

在项目根目录的 `books` 文件夹中创建 `.md` 文件：

```
personal-blog/
├── books/
│   ├── my-first-article.md
│   ├── another-post.md
│   └── images/
│       ├── image1.png
│       └── image2.jpg
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
---

# 文章正文

这里开始写你的 Markdown 内容...

## 小标题

支持所有标准 Markdown 语法。

### 插入图片

![图片描述](./images/my-image.png)
```

### 3. 系统自动加载

无需手动配置，系统会自动从 `books` 文件夹读取所有 `.md` 文件并在网站上展示。

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 19 + TypeScript + Tailwind CSS 4 |
| **后端** | Express 4 + tRPC 11 + Node.js |
| **数据库** | Drizzle ORM + MySQL 8 |
| **认证** | Manus OAuth |
| **Markdown** | react-markdown + remark-gfm + rehype-highlight |
| **UI 组件** | shadcn/ui + Radix UI |

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
│   │   │   └── About.tsx
│   │   ├── components/             # 可复用组件
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── ArticleCard.tsx
│   │   │   └── MarkdownRenderer.tsx
│   │   ├── contexts/               # React Context
│   │   │   └── ThemeContext.tsx
│   │   ├── lib/                    # 工具函数
│   │   │   ├── trpc.ts
│   │   │   └── blogData.ts
│   │   ├── App.tsx                 # 路由配置
│   │   ├── main.tsx                # 入口文件
│   │   └── index.css               # 全局样式
│   └── index.html
├── server/                          # 后端代码
│   ├── routers/                    # tRPC 路由
│   │   ├── blog.ts                 # 博客 API
│   │   └── blogImages.ts           # 图片管理 API
│   ├── lib/                        # 工具模块
│   │   ├── blogLoader.ts           # Markdown 文件加载
│   │   └── blogLoader.test.ts      # 单元测试
│   ├── db.ts                       # 数据库查询
│   ├── routers.ts                  # 路由配置
│   └── _core/                      # 框架核心
├── books/                           # 博客文章存储
│   ├── example-article.md
│   └── images/
├── drizzle/                         # 数据库迁移
│   ├── schema.ts
│   └── migrations/
├── shared/                          # 共享代码
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

## 🧪 测试

运行单元测试：

```bash
pnpm test
```

测试覆盖：

- ✅ Markdown 文件加载（7 个测试）
- ✅ YAML frontmatter 解析
- ✅ 图片路径转换
- ✅ 阅读时间计算

## 🎯 后续改进方向

### 短期计划

1. **评论系统** — 集成 Disqus 或自建评论功能
2. **搜索优化** — 全文搜索 + 中文分词
3. **社交分享** — 微博、微信、Twitter 分享按钮

### 中期计划

1. **后台编辑界面** — 在网页中直接创建/编辑文章
2. **图片管理面板** — 上传、删除、管理图片
3. **文章目录生成** — 自动生成目录（TOC）

### 长期计划

1. **自定义配色方案** — 用户可选择不同配色主题
2. **阅读进度保存** — 记录用户阅读位置
3. **订阅功能** — RSS 订阅、邮件通知

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

- 博客：[墨迹](https://personal-blog.manus.space)
- GitHub：[personal-blog](https://github.com/Qyn77/personal-blog)

---

**最后更新**：2024-04-27  
**版本**：1.0.0
