# 墨迹 - 个人博客网站

以**日式极简主义**（Ma 間）为设计理念的个人博客，采用 React + Express + SQLite 全栈架构，支持在线管理博客内容。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Tailwind CSS 4 + wouter |
| 后端 | Express 4 + tRPC 11 + Node.js |
| 数据库 | Drizzle ORM + SQLite (sql.js) |
| 构建 | Vite 7 + esbuild |
| UI | shadcn/ui + Radix UI |

## 快速开始

```bash
# 环境要求：Node.js 22+ / pnpm 10+
pnpm install
cp .env.example .env    # 配置环境变量
pnpm db:init            # 初始化数据库
pnpm dev                # 启动开发服务器
```

访问 `http://localhost:3000`。

## 项目结构

```
personal-blog/
├── client/                    # 前端
│   └── src/
│       ├── pages/             # 页面（Home, Blog, Article, Archive, About）
│       ├── pages/admin/       # 管理后台（Dashboard, 文章/归档 CRUD）
│       ├── components/        # 组件（Navbar, Footer, ArticleCard, MarkdownRenderer）
│       ├── components/ui/     # shadcn/ui 组件库
│       ├── lib/               # 工具（trpc, auth, utils）
│       └── contexts/          # ThemeContext（光暗模式）
├── server/                    # 后端
│   ├── routers/               # tRPC 路由（blog, archive, admin）
│   ├── routes/                # REST 路由（auth, upload）
│   ├── lib/                   # 工具（markdown 解析, auth）
│   ├── _core/                 # 服务器核心（Express, tRPC, Vite）
│   ├── scripts/               # 脚本（initDb, copyContent）
│   ├── db.ts                  # 数据库 CRUD
│   └── schema.ts              # Drizzle 表结构
├── books/                     # 博客 Markdown 文件
├── archives/                  # 归档 Markdown 文件
└── dist/                      # 构建输出
```

## 部署

```bash
pnpm build                   # 构建生产版本
NODE_ENV=production node dist/index.js   # 启动
```

使用 PM2：

```bash
pm2 start dist/index.js --name personal-blog
pm2 startup && pm2 save
```

Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 管理后台

访问 `/admin` 进入管理后台（需登录）。

- 支持上传 `.md` 文件自动解析 frontmatter
- 支持在线编辑文章/归档的元数据和正文
- 支持上传封面图片
- 操作后即时生效，无需重启服务

修改管理员密码：

```bash
pnpm hash-password 你的新密码
# 将输出的哈希值替换 .env 中的 ADMIN_PASSWORD_HASH
```

## 文章格式

在 `books/` 或 `archives/` 下创建 `.md` 文件：

```yaml
---
title: 文章标题
subtitle: 副标题（可选）
date: 2024-04-27
category: technology
tags: [标签1, 标签2]
featured: true
coverImage: ./images/cover.png
---

正文内容...
```

## 注意事项

- `.env` 文件包含敏感信息（密码哈希、JWT 密钥），已加入 `.gitignore`，不要提交到 git
- 管理后台默认账号 `admin`，默认密码 `admin123`，部署前务必修改
- 修改 `.env` 后需要重启服务才能生效
- `books/` 和 `archives/` 中的图片路径使用相对路径（如 `./images/xxx.png`），系统会自动转换
- 构建时会自动将 `books/` 和 `archives/` 复制到 `dist/`，生产环境的上传文件也会保存到 `dist/` 对应目录

## 许可证

MIT License
