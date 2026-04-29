# 数据库迁移总结

## 变更概述

你的博客项目已从纯文件系统迁移到 **SQLite 数据库**。

### 之前的架构
- 所有文章存储在 `books/` 文件夹中的 Markdown 文件
- 每次请求时从文件系统读取和解析文件
- 没有数据库

### 现在的架构
- 文章元数据和内容存储在 SQLite 数据库 (`blog.db`)
- 快速的数据库查询
- 支持更复杂的查询和过滤
- 为未来的功能扩展做准备

## 安装的新依赖

```json
{
  "better-sqlite3": "^12.9.0"
}
```

## 修改的文件

### 1. `drizzle/schema.ts`
- 添加了 `articles` 表定义
- 支持存储文章的所有元数据

### 2. `server/db.ts`
- 修改为使用 SQLite（之前是 MySQL）
- 添加了博客文章相关的数据库函数：
  - `getAllArticles()` - 获取所有文章
  - `getArticleBySlug()` - 根据 slug 获取文章
  - `upsertArticle()` - 创建或更新文章
  - `deleteArticle()` - 删除文章

### 3. `server/routers/blog.ts`
- 修改为从数据库查询文章（之前从文件系统读取）
- 所有 API 端点现在都使用数据库

### 4. `.env`
- 更新 `DATABASE_URL` 为 SQLite 格式：`file:./blog.db`

### 5. `package.json`
- 添加了 `db:init` 脚本用于初始化数据库

## 新增文件

### 1. `server/scripts/initDb.ts`
- 初始化脚本，从 `books/` 文件夹导入文章到数据库
- 解析 Markdown frontmatter
- 计算阅读时间

### 2. `DATABASE_SETUP.md`
- 详细的数据库设置和使用指南

## 快速开始

### 第一次运行

```bash
# 1. 初始化数据库（从 books/ 导入文章）
pnpm db:init

# 2. 启动开发服务器
pnpm dev
```

### 后续运行

```bash
# 直接启动开发服务器
pnpm dev
```

## 数据库文件

- **位置**: `./blog.db`
- **类型**: SQLite 3
- **大小**: 取决于文章数量（通常很小）
- **备份**: 建议定期备份此文件

## 向后兼容性

- 前端代码无需修改
- API 接口保持不变
- 所有现有的 tRPC 调用继续工作

## 迁移检查清单

- [x] 安装 `better-sqlite3` 依赖
- [x] 更新 schema 添加 articles 表
- [x] 修改 db.ts 使用 SQLite
- [x] 更新博客路由使用数据库
- [x] 创建初始化脚本
- [x] 更新 .env 配置
- [x] 添加 db:init 脚本到 package.json

## 下一步

1. 运行 `pnpm db:init` 初始化数据库
2. 运行 `pnpm dev` 启动开发服务器
3. 测试博客功能是否正常工作

## 常见问题

**Q: 我的旧文章会丢失吗？**
A: 不会。`pnpm db:init` 会自动从 `books/` 文件夹导入所有文章。

**Q: 我可以继续编辑 `books/` 中的 Markdown 文件吗？**
A: 可以，但需要重新运行 `pnpm db:init` 来同步数据库。

**Q: 数据库文件应该提交到 Git 吗？**
A: 不应该。`blog.db` 已添加到 `.gitignore`。

**Q: 如何备份数据库？**
A: 直接复制 `blog.db` 文件即可。
