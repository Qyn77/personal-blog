# 墨迹

以**日式极简主义**（Ma 間）为设计理念的个人博客系统，采用 React + Express + SQLite 全栈架构，支持在线管理博客内容、邮件订阅、归档管理等功能。

## 技术栈

| 层级   | 技术                                            |
| ------ | ----------------------------------------------- |
| 前端   | React 19 + TypeScript + Tailwind CSS 4 + wouter |
| 后端   | Express 4 + tRPC 11 + Node.js                   |
| 数据库 | Drizzle ORM + SQLite (sql.js)                   |
| 构建   | Vite 7 + esbuild                                |
| UI     | shadcn/ui + Radix UI                            |

## 功能特性

- 极简设计，专注内容阅读体验
- 管理后台：文章/归档的 CRUD、封面图片上传、About 页面配置
- Markdown 渲染，支持代码高亮、数学公式（KaTeX）
- 邮件订阅与新文章通知
- 光暗主题切换
- RSS Feed / Sitemap 自动生成
- 响应式设计，移动端适配
- 一键构建，dist/ 目录可独立部署

## 快速开始

```bash
# 环境要求：Node.js >= 20.11.0 / pnpm 10+
pnpm install
cp .env.example .env    # 编辑配置（管理员密码、邮箱服务等）
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
│       ├── lib/               # 工具（trpc, auth, seo）
│       └── contexts/          # ThemeContext（光暗模式）
├── server/                    # 后端
│   ├── routers/               # tRPC 路由（blog, archive, admin）
│   ├── routes/                # REST 路由（auth, upload, subscribe, rss, sitemap）
│   ├── lib/                   # 工具（markdown 解析, auth, email）
│   ├── _core/                 # 服务器核心（Express, tRPC, Vite）
│   ├── db.ts                  # 数据库 CRUD
│   └── schema.ts              # Drizzle 表结构
├── books/                     # 博客 Markdown 文件
├── archives/                  # 归档 Markdown 文件
└── build.js                   # 一键打包脚本
```

## 构建与部署

### 构建

```bash
node build.js            # 或 pnpm build
```

构建完成后 `dist/` 目录可独立部署，包含前后端代码和内容资源。

### 部署到服务器

```bash
# 将 dist/ 拷贝到服务器
cd dist
pnpm install --prod     # 安装生产依赖
cp .env.example .env    # 编辑填入真实配置
node index.js           # 启动服务
```

服务会自动检测生产环境，无需手动设置 `NODE_ENV`。

### 使用 PM2 守护进程

```bash
pm2 start dist/index.js --name personal-blog
pm2 startup && pm2 save
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 环境变量

复制 `.env.example` 为 `.env`，按需修改：

| 变量                     | 说明                     | 必填 |
| ------------------------ | ------------------------ | ---- |
| `PORT`                   | 服务端口，默认 3000      | 否   |
| `ADMIN_USERNAME`         | 管理员用户名，默认 admin | 否   |
| `ADMIN_PASSWORD_HASH`    | 管理员密码哈希           | 是   |
| `JWT_SECRET`             | JWT 签名密钥             | 是   |
| `EMAIL_SERVICE_HOST`     | SMTP 服务器地址          | 否   |
| `EMAIL_SERVICE_PORT`     | SMTP 端口                | 否   |
| `EMAIL_SERVICE_USER`     | SMTP 用户名              | 否   |
| `EMAIL_SERVICE_PASSWORD` | SMTP 密码                | 否   |

生成密码哈希和 JWT 密钥：

```bash
pnpm hash-password 你的密码
pnpm gen-secret
```

## 管理后台

访问 `/admin` 进入管理后台（需登录）。

- 文章管理：上传 `.md` 文件自动解析 frontmatter，在线编辑元数据和正文
- 归档管理：按年度归档文章，支持时间线展示
- 关于页面：配置个人信息、兴趣、推荐内容
- 图片上传：支持封面图片和文章内图片
- 订阅管理：查看订阅者，发送测试邮件
- 操作后即时生效，无需重启服务

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

## 跨平台支持

项目支持 Windows、Linux、macOS：

- `pnpm dev` — 开发模式（Linux/macOS）
- `pnpm dev:win` — 开发模式（Windows）
- `pnpm build` — 一键打包（跨平台）
- `node index.js` — 启动生产服务（跨平台，自动检测环境）

## 注意事项

- `.env` 包含敏感信息，已加入 `.gitignore`，请勿提交
- 管理后台默认账号 `admin`，默认密码 `admin123`，**部署前务必修改**
- `books/` 和 `archives/` 中的图片使用相对路径（如 `./images/xxx.png`）
- 构建时会自动将内容资源复制到 `dist/`，生产环境上传的文件也会保存到 `dist/` 对应目录

## 许可证

MIT License
