import { expect, it } from "vitest";
import { mcpClientConfig } from "../../client/src/lib/mcpClients";
const url = "https://example.com/mcp";
const secret = 'test-"-\\-token';
it("generates escaped configurations for Claude Code and both OpenCode formats", () => {
  const claude = JSON.parse(mcpClientConfig("claude", url, secret)).mcpServers
    .personal_blog;
  expect(claude).toEqual({
    type: "http",
    url,
    headers: { Authorization: `Bearer ${secret}` },
  });
  const v2 = JSON.parse(mcpClientConfig("opencode", url, secret)).mcp.servers
    .personal_blog;
  const v1 = JSON.parse(mcpClientConfig("opencode-v1", url, secret)).mcp
    .personal_blog;
  expect(v2).toEqual({
    type: "remote",
    url,
    oauth: false,
    headers: claude.headers,
  });
  expect(v1).toEqual({ ...v2, enabled: true });
  expect(mcpClientConfig("codex", url, secret)).toContain(
    JSON.stringify(`Bearer ${secret}`)
  );
});
