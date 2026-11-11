import { afterAll, afterEach, expect, it, vi } from "vitest";
import fs from "node:fs";
vi.mock("../root", async () => {
  const os = await import("node:os");
  const path = await import("node:path");
  return { ROOT_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "ink-mcp-auth-")) };
});
import { ROOT_DIR } from "../root";
import { readDatabase, writeDatabase } from "../db";
import {
  createToken,
  authenticate,
  listTokens,
  revokeToken,
  authorize,
  siteUrl,
} from "./store";
afterAll(() => fs.rmSync(ROOT_DIR, { recursive: true, force: true }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
it("stores only a hash, checks permissions and revokes immediately", async () => {
  const { secret, token } = await createToken({
    name: "Codex",
    scopes: ["content:read"],
  });
  expect(await authenticate(secret)).toMatchObject({ id: token.id });
  expect(await authenticate("invalid")).toBeNull();
  expect(
    fs.readFileSync(`${ROOT_DIR}/blog.db`).includes(Buffer.from(secret))
  ).toBe(false);
  expect(JSON.stringify(await listTokens())).not.toContain(secret);
  await expect(
    readDatabase(db => authorize(db, token.id, ["content:write"]))
  ).rejects.toThrow("权限不足");
  await revokeToken(token.id);
  expect(await authenticate(secret)).toBeNull();
});
it("rejects expired credentials", async () => {
  const { secret } = await createToken({
    name: "expires",
    scopes: ["content:read"],
    expiresInDays: 1,
  });
  vi.spyOn(Date, "now").mockReturnValue(Date.now() + 86400001);
  expect(await authenticate(secret)).toBeNull();
});
it("does not issue credentials when persistence fails", async () => {
  const before = await listTokens();
  vi.spyOn(fs, "writeFileSync").mockImplementationOnce(() => {
    throw new Error("disk full");
  });
  await expect(
    createToken({ name: "failed", scopes: ["content:read"] })
  ).rejects.toThrow("disk full");
  expect(await listTokens()).toEqual(before);
  await expect(
    writeDatabase(db => {
      db.run("DELETE FROM mcp_tokens");
      throw new Error("rollback");
    })
  ).rejects.toThrow("rollback");
  expect(await listTokens()).toEqual(before);
});
it("accepts only canonical HTTPS or local development origins", () => {
  for (const value of [
    "",
    "http://example.com",
    "https://user:pass@example.com",
    "https://example.com/path",
  ]) {
    vi.stubEnv("SITE_URL", value);
    expect(siteUrl()).toBeNull();
  }
  vi.stubEnv("SITE_URL", "https://example.com/");
  expect(siteUrl()).toBe("https://example.com");
  vi.stubEnv("SITE_URL", "http://127.0.0.1:4318");
  expect(siteUrl()).toBe("http://127.0.0.1:4318");
});
