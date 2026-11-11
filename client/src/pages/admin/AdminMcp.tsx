import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const permissions = [
  {
    id: "content:read",
    title: "读取内容",
    description: "查询文章、草稿和系列，生成私有预览",
  },
  {
    id: "content:write",
    title: "编辑草稿",
    description: "新建和修改草稿，编排系列",
  },
  {
    id: "media:write",
    title: "上传图片",
    description: "上传正文配图和封面，图片地址公开",
  },
  {
    id: "content:publish",
    title: "管理发布",
    description: "发布、撤回发布；与编辑权限同时开启可修改已发布文章",
  },
] as const;
type Scope = (typeof permissions)[number]["id"];
const actions: Record<string, string> = {
  create_article: "创建草稿",
  update_article: "修改文章",
  set_article_status: "更改发布状态",
  organize_series: "编排系列",
  upload_image: "上传图片",
  create_preview: "生成预览",
};
const time = (value: number) => new Date(value).toLocaleString("zh-CN");
async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("已复制");
  } catch {
    toast.error("复制失败，请手动选择文本复制");
  }
}
function codexConfig(endpoint: string, secret: string) {
  return `[mcp_servers.personal_blog]\nurl = ${JSON.stringify(endpoint)}\nhttp_headers = { Authorization = ${JSON.stringify(`Bearer ${secret}`)} }\n`;
}
export default function AdminMcp() {
  const utils = trpc.useUtils();
  const info = trpc.mcpAdmin.info.useQuery();
  const [name, setName] = useState("Codex");
  const [days, setDays] = useState(90);
  const [scopes, setScopes] = useState<Scope[]>([
    "content:read",
    "content:write",
    "media:write",
  ]);
  const [issued, setIssued] = useState<{ secret: string; name: string } | null>(
    null
  );
  const create = trpc.mcpAdmin.createToken.useMutation({
    onSuccess: result => {
      setIssued({ secret: result.secret, name: result.token.name });
      create.reset();
      void utils.mcpAdmin.listTokens.invalidate();
      toast.success("令牌已创建，请保存到客户端");
    },
    onError: () => toast.error("创建失败，请重试"),
  });
  const endpoint = info.data?.endpoint;
  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold mb-3">AI 接入</h1>
        <p className="text-muted-foreground leading-relaxed">
          连接 Codex 等 MCP 客户端，在对话里写文章、整理系列并发布到墨迹。
        </p>
      </header>
      <section
        aria-labelledby="mcp-connection"
        className="border-y border-border py-6 space-y-4"
      >
        <h2 id="mcp-connection" className="text-lg font-semibold">
          连接你的网站
        </h2>
        {info.isLoading ? (
          <p role="status">正在读取连接信息…</p>
        ) : info.isError ? (
          <div role="alert">
            连接信息加载失败。
            <Button variant="link" onClick={() => void info.refetch()}>
              重试
            </Button>
          </div>
        ) : endpoint ? (
          <div className="flex flex-wrap items-center gap-3">
            <code className="text-sm break-all flex-1 min-w-0">{endpoint}</code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void copy(endpoint)}
            >
              复制地址
            </Button>
          </div>
        ) : (
          <p role="status" className="text-muted-foreground">
            尚未启用 MCP：请在服务器环境变量中设置 SITE_URL 为网站的 HTTPS
            根地址，然后重启服务。
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          先创建独立令牌，再把配置添加到 Codex 的
          ~/.codex/config.toml。重启客户端后，可说“查询网站最近的文章”。
        </p>
      </section>
      {issued && (
        <section
          aria-label="新令牌"
          className="border border-border bg-muted/40 p-5 space-y-4"
          role="status"
        >
          <h2 className="text-lg font-semibold">{issued.name} · 令牌已就绪</h2>
          <p className="text-sm text-muted-foreground">
            完整令牌只在此处展示一次。关闭后无法再次查看，丢失时请撤销并重新创建。
          </p>
          <Label htmlFor="mcp-secret">访问令牌</Label>
          <Input
            id="mcp-secret"
            readOnly
            value={issued.secret}
            className="font-mono text-sm"
          />
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => void copy(codexConfig(endpoint!, issued.secret))}
            >
              复制 Codex 配置
            </Button>
            <Button variant="outline" onClick={() => void copy(issued.secret)}>
              复制令牌
            </Button>
            <Button variant="ghost" onClick={() => setIssued(null)}>
              已保存，隐藏令牌
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            配置含访问凭证，请保存在本机个人配置中。
          </p>
        </section>
      )}
      <form
        className="space-y-5"
        onSubmit={event => {
          event.preventDefault();
          create.mutate({ name, scopes, expiresInDays: days });
        }}
      >
        <h2 className="text-lg font-semibold">创建访问令牌</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mcp-name">客户端名称</Label>
            <Input
              id="mcp-name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={60}
              placeholder="例如：我的 Codex"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mcp-days">有效期</Label>
            <select
              id="mcp-days"
              className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm"
              value={days}
              onChange={e => setDays(Number(e.target.value))}
            >
              <option value={7}>7 天</option>
              <option value={30}>30 天</option>
              <option value={90}>90 天</option>
              <option value={365}>365 天</option>
            </select>
          </div>
        </div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium mb-3">
            允许这个客户端执行的操作
          </legend>
          {permissions.map(permission => (
            <label
              key={permission.id}
              className="flex gap-3 items-start cursor-pointer"
            >
              <input
                type="checkbox"
                className="mt-1 size-4 accent-foreground shrink-0"
                checked={scopes.includes(permission.id)}
                disabled={permission.id === "content:read"}
                onChange={e =>
                  setScopes(current =>
                    e.target.checked
                      ? [...current, permission.id]
                      : current.filter(scope => scope !== permission.id)
                  )
                }
              />
              <span>
                <span className="text-sm font-medium">{permission.title}</span>
                <span className="block text-sm text-muted-foreground mt-1">
                  {permission.description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="text-sm text-muted-foreground">
          新文章默认存为草稿，发布需单独调用工具。MCP 操作不会发送订阅邮件。
        </p>
        <Button
          type="submit"
          disabled={!endpoint || create.isPending || !!issued || !name.trim()}
        >
          {create.isPending ? "创建中…" : "创建令牌"}
        </Button>
      </form>
      <TokenList />
      <OperationHistory />
    </div>
  );
}

function TokenList() {
  const utils = trpc.useUtils();
  const tokens = trpc.mcpAdmin.listTokens.useQuery();
  const revoke = trpc.mcpAdmin.revokeToken.useMutation({
    onSuccess: () => {
      void utils.mcpAdmin.listTokens.invalidate();
      toast.success("令牌已撤销");
    },
    onError: () => toast.error("撤销失败，请重试"),
  });
  return (
    <section
      aria-labelledby="mcp-tokens"
      className="space-y-4 border-t border-border pt-6"
    >
      <h2 id="mcp-tokens" className="text-lg font-semibold">
        已授权的客户端
      </h2>
      {tokens.isLoading ? (
        <p role="status">正在加载令牌…</p>
      ) : tokens.isError ? (
        <div role="alert">
          令牌加载失败。
          <Button variant="link" onClick={() => void tokens.refetch()}>
            重试
          </Button>
        </div>
      ) : !tokens.data?.length ? (
        <p className="text-sm text-muted-foreground">
          还没有令牌。创建后即可连接你的 AI 客户端。
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {tokens.data.map(token => {
            const state = token.revokedAt
              ? "已撤销"
              : token.expiresAt <= Date.now()
                ? "已过期"
                : "有效";
            return (
              <li
                key={token.id}
                className="py-5 flex flex-wrap justify-between gap-4"
              >
                <div className="min-w-0 space-y-2">
                  <p className="font-medium break-words">
                    {token.name}{" "}
                    <span className="text-xs text-muted-foreground">
                      · {state}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground break-all">
                    {token.prefix}… · 到期 {time(token.expiresAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {permissions
                      .filter(p => token.scopes.includes(p.id))
                      .map(p => p.title)
                      .join(" / ")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!token.revokedAt || revoke.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `撤销「${token.name}」？该客户端和它生成的预览链接将立即失效。`
                      )
                    )
                      revoke.mutate({ id: token.id });
                  }}
                >
                  撤销
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function OperationHistory() {
  const events = trpc.mcpAdmin.events.useQuery();
  return (
    <section
      aria-labelledby="mcp-events"
      className="space-y-4 border-t border-border pt-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="mcp-events" className="text-lg font-semibold">
          最近的成功操作
        </h2>
        <Button variant="ghost" size="sm" onClick={() => void events.refetch()}>
          刷新记录
        </Button>
      </div>
      {events.isLoading ? (
        <p role="status">正在加载记录…</p>
      ) : events.isError ? (
        <p role="alert">记录加载失败，请重试刷新。</p>
      ) : !events.data?.length ? (
        <p className="text-sm text-muted-foreground">
          客户端完成写入或生成预览后，记录会显示在这里。
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {events.data.map(event => (
            <li
              key={event.id}
              className="py-3 text-sm flex flex-wrap justify-between gap-2"
            >
              <span className="break-words">
                {event.tokenName} · {actions[event.action] || event.action}
              </span>
              <time
                className="text-muted-foreground"
                dateTime={new Date(event.createdAt).toISOString()}
              >
                {time(event.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
