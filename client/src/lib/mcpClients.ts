export const mcpClients = [
  {
    id: "codex",
    name: "Codex",
    location: "~/.codex/config.toml",
    hint: "将 TOML 片段合并到个人配置，保留已有内容，然后重启 Codex。",
  },
  {
    id: "claude",
    name: "Claude Code",
    location: "~/.claude.json",
    hint: "将 JSON 的 mcpServers 条目合并到用户配置，保留已有内容；重启后通过 /mcp 检查连接。",
  },
  {
    id: "opencode",
    name: "OpenCode 2.x",
    location: "~/.config/opencode/opencode.json",
    hint: "将 JSON 合并到个人配置的 mcp.servers；重启后用 opencode mcp list 检查。",
  },
  {
    id: "opencode-v1",
    name: "OpenCode 1.x",
    location: "~/.config/opencode/opencode.json",
    hint: "1.x 的服务名直接放在 mcp 下。先运行 opencode --version 确认版本，再合并配置并重启。",
  },
] as const;
export type McpClient = (typeof mcpClients)[number]["id"];
export function mcpClientConfig(
  client: McpClient,
  endpoint: string,
  secret: string
) {
  const headers = { Authorization: `Bearer ${secret}` };
  if (client === "codex")
    return `[mcp_servers.personal_blog]\nurl = ${JSON.stringify(endpoint)}\nhttp_headers = { Authorization = ${JSON.stringify(headers.Authorization)} }\n`;
  const remote = { type: "remote", url: endpoint, oauth: false, headers };
  const value =
    client === "claude"
      ? {
          mcpServers: {
            personal_blog: { type: "http", url: endpoint, headers },
          },
        }
      : {
          $schema: "https://opencode.ai/config.json",
          mcp:
            client === "opencode"
              ? { servers: { personal_blog: remote } }
              : { personal_blog: { ...remote, enabled: true } },
        };
  return JSON.stringify(value, null, 2) + "\n";
}
