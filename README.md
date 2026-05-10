# 墨迹

以**日式极简主义**（Ma 間）为设计理念的个人博客系统。React + Express + SQLite 全栈架构，零外部依赖（无 MySQL、无 Nginx 配置），开箱即用。

## 功能特性

- 极简设计，专注内容阅读体验，光暗主题切换
- 管理后台：文章/归档 CRUD、封面图片上传、剪贴板粘贴图片、About 页面配置
- Markdown 渲染：代码高亮、数学公式（KaTeX）、GFM 表格/任务列表
- 邮件订阅：验证邮箱 → 新文章自动通知 → 一键退订
- SEO 优化：动态 meta/OG/Twitter 标签、canonical URL、Sitemap、RSS Feed
- 响应式设计：移动端适配、阅读进度条、视差封面图
- 安全防护：JWT 认证、登录限流、订阅限流、路径遍历防护、Zod 输入校验
- 一键构建，dist/ 目录自包含，可独立部署到任意服务器

## 技术栈

| 层级   | 技术                                                     |
| ------ | -------------------------------------------------------- |
| 前端   | React 19 + TypeScript + Tailwind CSS 4 + wouter + Vite 7 |
| 后端   | Express 4 + tRPC 11 + Node.js + esbuild                  |
| 数据库 | SQLite (sql.js WASM) + Drizzle ORM                       |
| UI     | shadcn/ui (40+ 组件) + Radix UI + Framer Motion          |
| 工具   | Zod 校验 + nanoid + bcryptjs + jsonwebtoken + nodemailer |

## 快速开始

```bash
# 环境要求：Node.js >= 20.11.0 / pnpm 10+
pnpm install
cp .env.example .env       # 编辑配置（见下方环境变量说明）
pnpm db:init               # 从 books/ 和 archives/ 导入 Markdown 到数据库
pnpm dev                   # 启动开发服务器（Linux/macOS）
# pnpm dev:win             # Windows 用户用这个
```

访问 `http://localhost:3000`，管理后台 `http://localhost:3000/admin`。

## 构建与部署

### 构建脚本

项目提供 4 种构建脚本，任选其一：

| 脚本            | 适用平台           | 说明                                           |
| --------------- | ------------------ | ---------------------------------------------- |
| `node build.js` | **跨平台（推荐）** | Node.js 脚本，自动检测系统选择正确的二进制路径 |
| `build.sh`      | Linux / macOS      | Bash 脚本                                      |
| `build.bat`     | Windows CMD        | 批处理脚本                                     |
| `build.ps1`     | Windows PowerShell | PowerShell 脚本                                |

或直接使用 npm script：

```bash
pnpm build    # 等同于 node build.js
```

所有脚本执行相同的 4 步流程：

1. `vite build` — 构建前端到 `dist/public/`
2. `esbuild` — 打包服务端到 `dist/index.js`（ESM 格式，外部依赖不打包）
3. 拷贝 `books/`、`archives/`、`about-config.json` 到 `dist/`
4. 拷贝 `package.json`、`.env.example` 到 `dist/`

构建完成后 `dist/` 目录完全自包含，可直接部署。

### 部署到服务器

```bash
# 1. 将 dist/ 目录拷贝到服务器
scp -r dist/ user@server:/path/to/blog/

# 2. 在服务器上
cd /path/to/blog/dist
pnpm install --prod        # 安装生产依赖（或 npm install --omit=dev）
cp .env.example .env       # 编辑填入真实配置
node index.js              # 启动服务
```

服务会自动检测运行环境（通过检查 `public/index.html` 是否存在），无需手动设置 `NODE_ENV`。

端口被占用时会自动扫描 3000-3019 范围内的可用端口。

### 使用 PM2 守护进程

```bash
cd /path/to/blog/dist
pm2 start index.js --name personal-blog
pm2 startup && pm2 save    # 开机自启
pm2 logs personal-blog     # 查看日志
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 上传文件大小限制（与服务端一致）
    client_max_body_size 10m;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker 部署（自行编写 Dockerfile）

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY dist/ .
RUN npm install --omit=dev
EXPOSE 3000
CMD ["node", "index.js"]
```

## 环境变量

复制 `.env.example` 为 `.env`，按需配置：

### 必填项

| 变量                  | 说明                              | 获取方式                      |
| --------------------- | --------------------------------- | ----------------------------- |
| `ADMIN_PASSWORD_HASH` | 管理员密码的 bcrypt 哈希          | `pnpm hash-password 你的密码` |
| `JWT_SECRET`          | JWT 签名密钥（32 字节随机字符串） | `pnpm gen-secret`             |

### 可选项

| 变量                        | 说明                    | 默认值           |
| --------------------------- | ----------------------- | ---------------- |
| `PORT`                      | 服务端口                | `3000`           |
| `ADMIN_USERNAME`            | 管理员用户名            | `admin`          |
| `DATABASE_URL`              | SQLite 数据库文件路径   | `file:./blog.db` |
| `EMAIL_SERVICE_HOST`        | SMTP 服务器地址         | `smtp.qq.com`    |
| `EMAIL_SERVICE_PORT`        | SMTP 端口               | `465`            |
| `EMAIL_SERVICE_USER`        | SMTP 用户名（发件邮箱） | —                |
| `EMAIL_SERVICE_PASSWORD`    | SMTP 密码/授权码        | —                |
| `VITE_ANALYTICS_ENDPOINT`   | Umami 统计服务端点      | —                |
| `VITE_ANALYTICS_WEBSITE_ID` | Umami 网站 ID           | —                |

> 邮箱配置仅用于订阅功能，不配置不影响其他功能。

## 项目结构

```
personal-blog/
├── client/                        # 前端源码
│   ├── src/
│   │   ├── pages/                 # 页面组件
│   │   │   ├── Home.tsx           # 首页（Hero + 精选文章 + 最新文章 + 侧边栏）
│   │   │   ├── Blog.tsx           # 博客列表（分页、分类筛选、标签筛选、搜索）
│   │   │   ├── Article.tsx        # 文章详情（阅读进度条、视差封面、相关文章）
│   │   │   ├── Archive.tsx        # 归档时间线（按年分组）
│   │   │   ├── ArchiveDetail.tsx  # 归档详情
│   │   │   ├── About.tsx          # 关于页面（从 about-config.json 加载）
│   │   │   ├── NotFound.tsx       # 404 页面
│   │   │   └── admin/             # 管理后台（8 个页面，懒加载）
│   │   │       ├── AdminDashboard.tsx    # 仪表盘（文章/归档统计）
│   │   │       ├── AdminArticles.tsx     # 文章管理列表
│   │   │       ├── AdminArticleEdit.tsx  # 文章编辑器（支持粘贴图片上传）
│   │   │       ├── AdminArchives.tsx     # 归档管理列表
│   │   │       ├── AdminArchiveEdit.tsx  # 归档编辑器
│   │   │       ├── AdminSubscribers.tsx  # 订阅者管理
│   │   │       ├── AdminSettings.tsx     # 系统设置（自动通知开关、SMTP 测试）
│   │   │       └── AdminAbout.tsx        # About 页面配置编辑
│   │   ├── components/            # 通用组件
│   │   │   ├── Navbar.tsx         # 导航栏（响应式、主题切换）
│   │   │   ├── Footer.tsx         # 页脚（订阅表单）
│   │   │   ├── ArticleCard.tsx    # 文章卡片（3 种变体）
│   │   │   ├── MarkdownRenderer.tsx # Markdown 渲染（GFM + KaTeX + 代码高亮）
│   │   │   ├── SubscribeForm.tsx  # 邮箱订阅表单
│   │   │   └── ui/                # shadcn/ui 组件库（40+ 组件）
│   │   ├── lib/                   # 工具函数
│   │   │   ├── trpc.ts            # tRPC 客户端配置
│   │   │   ├── auth.ts            # Token 管理
│   │   │   └── seo.ts             # SEO meta 标签管理
│   │   └── contexts/
│   │       └── ThemeContext.tsx    # 光暗主题上下文
│   └── public/
│       ├── fonts/                 # 自托管字体（Playfair Display, Noto Serif SC 等）
│       ├── images/                # 静态图片资源
│       ├── about-config.json      # About 页面配置（可通过管理后台编辑）
│       ├── favicon.svg            # 网站图标
│       ├── robots.txt             # 爬虫规则
│       └── fonts.css              # 字体样式表
├── server/                        # 后端源码
│   ├── _core/
│   │   ├── index.ts               # Express 服务器入口（静态路由、中间件）
│   │   ├── trpc.ts                # tRPC 中间件（认证校验）
│   │   ├── context.ts             # tRPC 上下文
│   │   └── vite.ts                # Vite 开发模式 / 静态文件服务
│   ├── routers/
│   │   ├── blog.ts                # 博客公开 API（列表、详情、分类、搜索、订阅）
│   │   ├── archive.ts             # 归档公开 API
│   │   └── admin.ts               # 管理后台 API（CRUD、邮件通知、配置管理）
│   ├── routes/
│   │   ├── auth.ts                # 认证路由（登录、验证 Token）
│   │   ├── upload.ts              # 文件上传路由（Markdown、图片、删除）
│   │   ├── subscribe.ts           # 订阅验证/退订路由
│   │   ├── rss.ts                 # RSS Feed 生成
│   │   └── sitemap.ts             # Sitemap 生成
│   ├── lib/
│   │   ├── markdown.ts            # Markdown 解析（frontmatter、阅读时间、摘要）
│   │   ├── auth.ts                # JWT 签发/验证、密码哈希
│   │   └── email.ts               # SMTP 邮件发送（验证、通知、测试）
│   ├── scripts/
│   │   ├── initDb.ts              # 数据库初始化（从 Markdown 导入）
│   │   └── copyContent.ts         # 内容资源拷贝工具
│   ├── db.ts                      # 数据库 CRUD（SQLite 内存 + 磁盘持久化）
│   ├── schema.ts                  # Drizzle 表结构定义
│   └── root.ts                    # 根目录解析（自动检测开发/生产环境）
├── books/                         # 博客文章 Markdown 文件
│   ├── images/                    # 文章引用的图片
│   └── *.md                       # Markdown 文件（含 YAML frontmatter）
├── archives/                      # 归档 Markdown 文件
│   ├── images/                    # 归档引用的图片
│   └── *.md
├── build.js                       # 跨平台构建脚本（推荐）
├── build.sh                       # Linux/macOS 构建脚本
├── build.bat                      # Windows CMD 构建脚本
├── build.ps1                      # Windows PowerShell 构建脚本
├── .husky/pre-commit              # Git pre-commit hook（自动格式化）
├── .env.example                   # 环境变量模板
└── package.json
```

## npm scripts 一览

| 命令                 | 说明                                  |
| -------------------- | ------------------------------------- |
| `pnpm dev`           | 启动开发服务器（Linux/macOS，热更新） |
| `pnpm dev:win`       | 启动开发服务器（Windows）             |
| `pnpm build`         | 一键构建（调用 build.js）             |
| `pnpm start`         | 启动生产服务（从 dist/）              |
| `pnpm check`         | TypeScript 类型检查                   |
| `pnpm format`        | Prettier 格式化所有文件               |
| `pnpm format:check`  | 检查格式是否一致                      |
| `pnpm test`          | 运行测试（Vitest）                    |
| `pnpm db:init`       | 从 Markdown 文件初始化数据库          |
| `pnpm hash-password` | 生成密码哈希（写入 .env 用）          |
| `pnpm gen-secret`    | 生成 JWT 密钥（写入 .env 用）         |

## 管理后台

访问 `/admin`，使用配置的管理员账号登录。

### 功能模块

| 模块           | 路由                  | 功能                                                                  |
| -------------- | --------------------- | --------------------------------------------------------------------- |
| 仪表盘         | `/admin`              | 文章/归档数量统计，快捷上传入口                                       |
| 文章管理       | `/admin/articles`     | 列表查看、状态切换（发布/草稿）、编辑、删除                           |
| 文章编辑器     | `/admin/articles/:id` | 上传 .md 自动解析、在线编辑全部字段、封面图片上传、**剪贴板粘贴图片** |
| 归档管理       | `/admin/archives`     | 同文章管理                                                            |
| 归档编辑器     | `/admin/archives/:id` | 同文章编辑器（无 featured 和 status 字段）                            |
| 订阅者管理     | `/admin/subscribers`  | 查看订阅者列表（状态、日期）、删除订阅者                              |
| 系统设置       | `/admin/settings`     | 自动通知开关、SMTP 测试邮件                                           |
| About 页面配置 | `/admin/about`        | 编辑 Hero 区域、兴趣列表、推荐内容，支持上传头像图片                  |

### 文章编辑器亮点

- **双模式输入**：上传 `.md` 文件自动解析 frontmatter，或手动填写表单
- **剪贴板粘贴图片**：在 Markdown 正文区域直接 Ctrl+V 粘贴图片，自动上传并插入 Markdown 图片语法
- **封面图片**：点击上传，实时预览
- **标签管理**：输入后按 Enter 添加，点击 × 删除
- **即时生效**：保存后立即更新，无需重启服务

## 文章格式

在 `books/` 或 `archives/` 下创建 `.md` 文件，使用 YAML frontmatter 声明元数据：

```yaml
---
title: 文章标题
subtitle: 副标题（可选）
slug: custom-slug # 可选，不填则自动生成
date: 2024-04-27 # YYYY-MM-DD 格式
category: technology # 分类名
tags: [标签1, 标签2] # 标签数组
featured: true # 是否精选（仅 books 有效）
coverImage: ./images/cover.png # 封面图片（相对路径）
excerpt: 自定义摘要 # 可选，不填则自动截取
---
正文内容，支持完整的 Markdown 语法...

- 代码高亮
- 数学公式 $E = mc^2$
- 表格、任务列表、删除线
- 图片、链接、引用
```

### 图片引用

文章中的图片放在同级 `images/` 目录下，使用相对路径引用：

```markdown
![图片描述](./images/screenshot.png)
```

系统会自动将相对路径转换为 `/books/images/screenshot.png` 或 `/archives/images/screenshot.png`。

## 数据库

### 技术方案

使用 `sql.js`（SQLite 的 WebAssembly 版本），数据在内存中操作，定时原子写入磁盘：

- 写入流程：写入临时文件 → 重命名覆盖原文件（原子操作）
- Windows 兼容：重命名失败时自动回退到 `copyFileSync + unlinkSync`
- 数据库文件：`blog.db`（开发环境在项目根目录，生产环境在 `dist/`）

### 数据表

| 表名          | 说明                                   |
| ------------- | -------------------------------------- |
| `articles`    | 文章（标题、内容、分类、标签、状态等） |
| `archives`    | 归档（同文章，无 featured 和 status）  |
| `subscribers` | 订阅者（邮箱、状态、验证 token）       |
| `settings`    | 系统设置（key-value 存储）             |

### 数据库初始化

```bash
pnpm db:init    # 从 books/ 和 archives/ 中的 .md 文件导入数据库
```

初始化脚本会：

- 解析每个 `.md` 文件的 YAML frontmatter
- 自动计算阅读时间（中文按字数，英文按词数，约 200 字/分钟）
- 自动生成文章摘要（如未手动指定）
- 处理图片路径（相对路径 → 绝对 URL 路径）

数据库支持运行时自动迁移（新增字段会自动补全）。

## 邮件订阅

### 订阅流程

1. 用户在页脚输入邮箱 → 发送验证邮件
2. 用户点击验证链接 → 状态变为 `confirmed`
3. 管理员发布新文章时 → 自动通知所有已确认的订阅者
4. 每封通知邮件包含个性化退订链接（基于 `nanoid` 随机 token，不可猜测）

### 配置 SMTP

在 `.env` 中配置邮箱服务：

```env
EMAIL_SERVICE_HOST=smtp.qq.com
EMAIL_SERVICE_PORT=465
EMAIL_SERVICE_USER=your-email@qq.com
EMAIL_SERVICE_PASSWORD=your-smtp-authorization-code
```

配置完成后可在管理后台 → 系统设置 → 发送测试邮件验证配置是否正确。

### 自动通知

在管理后台 → 系统设置中开启「发布时自动通知」，之后每次将文章状态改为「已发布」时，系统会异步发送邮件通知，不阻塞 API 响应。

## SEO

### 自动生成

- **Sitemap**：`/sitemap.xml` — 包含所有静态页面和已发布文章
- **RSS Feed**：`/rss.xml` — 最新 20 篇已发布文章
- **robots.txt**：允许爬虫访问 `/`，禁止 `/admin` 和 `/api/`
- **Meta 标签**：每页动态生成 `title`、`description`、`og:*`、`twitter:*`、`canonical`

### 部署后修改

将 `client/public/robots.txt` 中的 `your-domain.com` 改为你的实际域名：

```
Sitemap: https://your-blog.com/sitemap.xml
```

## 安全特性

| 措施         | 说明                                                    |
| ------------ | ------------------------------------------------------- |
| JWT 认证     | 管理后台所有操作需 Bearer Token，7 天有效期             |
| 密码哈希     | bcrypt（salt rounds: 10），密码不以明文存储             |
| 登录限流     | 每 IP 每 15 分钟最多 10 次尝试                          |
| 订阅限流     | 每 IP 每 10 分钟最多 3 次订阅请求                       |
| 路径遍历防护 | 文件上传/删除时校验路径，拒绝 `..`、`/`、`\` 等危险字符 |
| Zod 输入校验 | 所有 tRPC 接口参数类型校验                              |
| 文件类型过滤 | Markdown 上传仅接受 `.md`/`.txt`，图片仅接受 `image/*`  |
| 文件大小限制 | 上传限制 10MB，JSON body 限制 2MB                       |
| Token 存储   | 前端使用 `localStorage`，非 Cookie，无 CSRF 风险        |

## 跨平台支持

| 平台    | 开发命令       | 构建命令                                 | 生产启动        |
| ------- | -------------- | ---------------------------------------- | --------------- |
| Linux   | `pnpm dev`     | `pnpm build` / `./build.sh`              | `node index.js` |
| macOS   | `pnpm dev`     | `pnpm build` / `./build.sh`              | `node index.js` |
| Windows | `pnpm dev:win` | `pnpm build` / `build.bat` / `build.ps1` | `node index.js` |

- `node build.js` 是推荐的跨平台构建方式，自动适配系统
- `node index.js` 启动时自动检测环境，无需手动设置 `NODE_ENV`
- 文件操作（数据库写入、文件上传）兼容 Windows 文件锁定问题

## 代码规范

项目配置了完整的代码规范工具链：

- **Prettier**：统一代码格式（分号、双引号、2 空格缩进、80 字符宽）
- **EditorConfig**：编辑器统一配置（UTF-8、LF 换行、尾部换行）
- **Git Attributes**：强制 LF 换行（`.bat`/`.cmd` 除外）
- **Husky + lint-staged**：每次 `git commit` 自动格式化暂存文件

```bash
pnpm format        # 手动格式化所有文件
pnpm format:check  # 检查格式是否一致
pnpm check         # TypeScript 类型检查
```

## 注意事项

- `.env` 包含敏感信息（密码哈希、JWT 密钥），已加入 `.gitignore`，**请勿提交到 git**
- 管理后台默认账号 `admin`，默认密码 `admin123`，**部署前务必修改**
- `books/` 和 `archives/` 中的图片使用相对路径（如 `./images/xxx.png`），系统自动转换
- 构建时自动将内容资源复制到 `dist/`，生产环境上传的文件也会保存到 `dist/` 对应目录
- 首次部署需运行 `pnpm db:init` 初始化数据库，后续文章通过管理后台管理
- `robots.txt` 中的域名需要手动替换为实际域名

## 许可证

MIT License
