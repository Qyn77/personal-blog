# 用 MCP 让 AI 管理博客

墨迹内置远程 MCP 服务。部署网站后，在后台创建访问令牌，就能让 Codex 等客户端直接查询文章、写 Markdown 草稿、上传图片、整理系列、预览和发布文章。无需另开 MCP 进程，也无需编写客户端：Codex 本身就是 MCP 客户端。

连接方式是 **Streamable HTTP + Bearer 令牌**，地址为 `https://你的域名/mcp`。当前不提供 OAuth 登录，客户端必须支持远程 MCP 和自定义 Authorization 请求头。

## 1. 部署和启用

沿用 [README 的构建部署步骤](../README.md#构建与部署)，安装本次构建产物中的生产依赖，并在服务器实际使用的 `.env` 中增加：

```dotenv
SITE_URL=https://blog.example.com
```

将示例域名替换为网站的正式访问域名。这里是网站根地址，不是 CDN 地址，也不包含 `/mcp`、查询参数或其他路径。生产环境要求 HTTPS；本机调试可以用 `http://localhost:3000` 或 `http://127.0.0.1:3000`，端口须与实际监听端口一致。

重启网站进程即可。按 README 创建的 PM2 进程使用：

```bash
pm2 restart personal-blog --update-env
```

本仓库现有 CD 工作流管理的进程名为 `person2.0`，对应命令是 `pm2 restart person2.0 --update-env`。该流程会保留服务器 `.env`，所以需要手动补上 `SITE_URL`；生产依赖变化会触发重新安装。

MCP 与管理后台共用同一进程、同一个 `blog.db`。首次访问数据库时会自动补齐 MCP 表，**升级无需执行 `pnpm db:init`**，该命令会全量重建数据库。备份并保留运行目录中的 `blog.db`、`books/` 和 `archives/`；通过 MCP 上传的图片位于 `books/images/`。目前数据库由 sql.js 在进程内持有，应使用单实例 fork 模式，不能用 PM2 cluster 或多个进程同时写同一个文件。

已有反向代理将所有路径转发给 Node 服务时，一般无需增加配置。若按路径放行，需将 `/mcp`、`/api/mcp-preview` 和 `/preview` 转发到网站服务。MCP 路径示例（放在已有 HTTPS server 内）：

```nginx
location = /mcp {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache off;
    client_max_body_size 2m;
}
```

代理必须保留 Authorization 请求头，不能把 `/mcp` 重写成首页或拦到登录页面。不要把 Authorization 或请求正文加入代理日志。本实现使用无状态 JSON 响应，不需要额外的 SSE 地址或会话存储。每分钟每个直连来源地址最多 120 个请求；放在反向代理后，同一代理下的客户端共享此额度。

未配置有效 `SITE_URL` 时，网站其他功能可照常使用，MCP 返回 503，后台会提示尚未启用。

## 2. 在后台创建访问令牌

1. 登录管理后台，打开 **AI 接入**（`/admin/mcp`）。
2. 填写客户端名称，例如“我的 Codex”，选择有效期和权限。
3. 点击“创建令牌”，再点击“复制 Codex 配置”。
4. 保存配置后点击“已保存，隐藏令牌”。完整令牌只展示一次，刷新或离开后无法找回。

| 权限                          | 作用                                                 |
| ----------------------------- | ---------------------------------------------------- |
| `content:read`（读取内容）    | 查询所有文章（包括草稿）、系列和私有预览，必选       |
| `content:write`（编辑草稿）   | 创建、修改草稿，编排系列                             |
| `media:write`（上传图片）     | 上传正文图片或封面                                   |
| `content:publish`（管理发布） | 发布和撤回发布；与编辑权限同时拥有时可修改已发布文章 |

默认开启读取、编辑草稿和上传图片，**发布权限默认关闭**。若希望 AI 完成发布，在创建令牌时勾选“管理发布”。已有令牌不支持直接修改权限，可撤销后重新创建。

令牌是网站生成的独立访问凭证，与管理员登录 JWT、AI 模型 API Key 无关。服务端只存 SHA-256 哈希，每次请求都会验证有效期、撤销状态和权限。后台可撤销任意令牌，并查看最近 50 条成功写入或生成预览的操作；这不是完整的访问审计，读取和失败请求不在该列表中。记录不包含文章正文或完整令牌。

## 3. 配置 Codex

将后台复制的内容合并到本机的 `~/.codex/config.toml`，保留已有配置；同名 `[mcp_servers.personal_blog]` 只保留一份：

```toml
[mcp_servers.personal_blog]
url = "https://blog.example.com/mcp"
http_headers = { Authorization = "Bearer ink_mcp_替换为后台生成的完整令牌" }
```

配置文件含访问凭证，应保存在本机个人配置中，不要提交到项目仓库。保存后重启 Codex，再开启对话。无需安装或启动额外 Node MCP 客户端，也无需运行 `codex mcp login`。

也可以使用环境变量保存令牌，二选一即可：

```toml
[mcp_servers.personal_blog]
url = "https://blog.example.com/mcp"
bearer_token_env_var = "PERSONAL_BLOG_MCP_TOKEN"
```

```bash
# 当前终端示例；不要把真实令牌写进共享脚本
export PERSONAL_BLOG_MCP_TOKEN='ink_mcp_替换为完整令牌'
codex
```

环境变量中只放令牌本身，不带 `Bearer `。从系统图标启动的 Codex 桌面应用不一定继承终端环境变量；桌面使用可直接复制后台生成的 `http_headers` 配置。

CLI 也支持添加环境变量方式的连接：

```bash
codex mcp add personal_blog --url https://blog.example.com/mcp --bearer-token-env-var PERSONAL_BLOG_MCP_TOKEN
codex mcp list
```

`mcp list` 只证明配置已登记，实际连接还要通过调用工具验证。客户端配置字段参见 [Codex 官方 MCP 文档](https://developers.openai.com/codex/mcp/)。其他支持 Streamable HTTP 的客户端，填写相同 URL 和 `Authorization: Bearer 完整令牌` 即可。

## 4. 在对话中使用

可以依次对 Codex 说：

> 查询网站最近 5 篇文章，以及已有系列。

> 写一篇《Rust 入门》的 Markdown 文章，分类为开发，标签为 Rust。先保存成草稿，放入“Rust 学习”系列第 1 篇，并给我一个预览链接。

> 修改刚才的草稿，补充一个所有权示例，保留其他字段，再生成预览。

> 我已检查这篇草稿，请发布并返回公开链接。

> 将这篇文章撤回草稿。

创建文章永远先保存为草稿；发布是单独操作，需要发布权限。文章直接写入网站数据库，立即出现在后台文章列表，不会生成 Git 提交或自动写回 `books/*.md`，也不需要重新部署。公开页面会在下一次请求时读取更新后的内容；已经打开的页面可刷新查看。

**MCP 发布、更新和撤回不会发送订阅邮件**，即使后台打开了自动通知开关。第一版不提供删除文章、操作归档、邮件订阅者、管理员账号或系统配置的工具。

AI 模型由你使用的客户端提供；MCP 只负责把内容读写到网站，不要求配置网站后台的“AI 配置”。

## 5. 工具和写入规则

客户端能看到的工具会按令牌权限过滤：

| 工具                 | 用途                                            | 必需权限                     |
| -------------------- | ----------------------------------------------- | ---------------------------- |
| `list_articles`      | 分页查询摘要，支持标题/摘要搜索、状态和系列筛选 | 读取                         |
| `get_article`        | 按 ID 获取完整正文、字段和 `updatedAt`          | 读取                         |
| `create_article`     | 创建 Markdown 草稿                              | 编辑                         |
| `update_article`     | 修改指定字段，保留未传入的字段                  | 编辑；已发布文章还需发布     |
| `set_article_status` | 设置 `published` 或 `draft`                     | 发布                         |
| `list_series`        | 查看系列名称、文章总数和已发布数量              | 读取                         |
| `organize_series`    | 批量设置系列和章节顺序                          | 编辑；涉及已发布文章还需发布 |
| `upload_image`       | 上传图片，返回站内路径和完整 URL                | 上传图片                     |
| `create_preview`     | 生成一小时有效的私有预览链接                    | 读取                         |

客户端会自动读取工具参数说明。自写客户端时注意：

- `create_article` 必填 `title`、`content`、`date`（`YYYY-MM-DD`）、`category` 和 `requestId`；可传 `tags`、`subtitle`、`excerpt`、`slug`、`coverImage`、`featured`、`series`、`seriesOrder`。不传 slug 时自动生成，传入时必须唯一。
- 修改、发布、撤回和系列编排必须携带最新 `expectedUpdatedAt`，取自读取或上次写入结果。与后台或其他客户端同时修改时会拒绝旧版本，重新读取并核对后再提交。
- 内容写入、状态变更、系列编排和图片上传都需要 `requestId`（8–100 位字母、数字、下划线或连字符）。同一令牌下同一个操作原样重试应复用 ID，服务端返回第一次结果，不重复写入；参数变化必须换新 ID。预览生成不使用 requestId。
- `organize_series` 接受 `name` 和 `chapters: [{id, expectedUpdatedAt, order}]`，一次最多 100 篇；任何一篇冲突则整批取消，未指定的文章不变。`name` 为空字符串时将指定文章移出系列。系列沿用文章上的同名字段聚合，并非独立目录表；重命名整个系列需要包含该系列所有文章。
- `upload_image` 接受文件实际字节的纯 base64，不带 `data:` 前缀，不接受本机文件路径。每张最大 1 MiB，支持 PNG、JPEG、GIF、WebP，不支持 SVG。将返回的 `imagePath` 填入 Markdown 或 `coverImage`。图片 URL 是公开资源，即使所属文章仍是草稿，也不要上传敏感图片。

## 6. 私有预览

`create_preview` 返回形如 `https://blog.example.com/preview#随机凭证` 的链接。持有链接的人可在一小时内查看文章的最新正文，无需登录后台。预览不是内容快照，也不会把草稿发布到公共列表。

预览凭证放在 URL 片段中，由页面通过 POST 交给服务器，不出现在普通 HTTP 请求 URL 中。预览响应禁用缓存和索引，页面不调用站内访客追踪；直接打开预览页也不会加载配置的 Umami 脚本。

同一令牌为同一篇文章重新生成预览后，旧链接失效；令牌到期或被撤销也会拒绝后续预览请求。已打开的页面每分钟重新校验，已经显示或被保存的内容无法收回。请只把链接发给需要审阅的人。

## 7. 验证与排错

部署后先不携带凭证检查路由：

```bash
curl -i -X POST https://blog.example.com/mcp \
  -H 'Content-Type: application/json' \
  --data '{}'
```

正确启用但未提供令牌时应得到 **401**。随后在 Codex 中调用 `list_articles`，再创建一篇测试草稿、打开预览，最后撤销测试令牌，确认后续调用无法使用。

| 现象                     | 检查方法                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| 503 / 后台显示尚未启用   | 检查运行进程的 `SITE_URL` 是否是 HTTPS 根地址、是否已重启；有效配置下持续 503 时检查数据库和服务日志 |
| 401                      | 确认 Authorization 为 `Bearer 完整令牌`，没有使用管理员 JWT；检查令牌是否到期或撤销                  |
| 403                      | 请求的 Origin 必须与 SITE_URL 一致；普通本地 MCP 客户端通常不发送 Origin                             |
| 已鉴权 GET 返回 405      | 正常，协议请求走 POST；不要用浏览器直接打开 `/mcp` 判断连接是否成功                                  |
| 返回网页、重定向或 404   | 检查反向代理是否把 `/mcp` 转发给 Node 服务，而不是静态站点或登录页面                                 |
| 看不到发布工具           | 令牌未勾选“管理发布”；重新创建有对应权限的令牌并更新客户端配置                                       |
| 版本冲突                 | 重新读取文章，核对其他人的修改，再使用最新 updatedAt 和新的 requestId 提交                           |
| requestId 已用于其他内容 | 不要把一次操作的 ID 用于其他参数；新操作生成新 ID                                                    |
| 413 / 图片过大           | 检查代理和请求体上限；压缩图片到 1 MiB 内，传纯 base64                                               |
| 429                      | 达到每分钟请求限额，稍后重试；同一代理后的客户端可能共享额度                                         |
| 预览失效                 | 重新生成；检查令牌有效期和是否撤销，以及链接中的 `#` 后半段是否完整                                  |

实现包含令牌/权限、幂等重试、并发修改冲突、系列批量回滚、磁盘写入失败、预览失效和官方 MCP SDK 客户端协议测试。开发时执行 `pnpm check`、`pnpm test`、`pnpm build` 和 `pnpm perf:bundle`；部署环境仍应按上述流程验证实际域名和反向代理。
