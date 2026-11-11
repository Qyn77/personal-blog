import { afterAll, afterEach, expect, it, vi } from "vitest";
import fs from "node:fs";
vi.mock("../root", async () => ({
  ROOT_DIR: fs.mkdtempSync((await import("node:os")).tmpdir() + "/ink-ai-"),
}));
import { ROOT_DIR } from "../root";
import { createToken, rows } from "./store";
import { getAI, updateAI, testAI } from "./ai";
import { getSafeAIConfig, saveSafeAIConfig } from "../lib/aiConfig";
import { getAIConfig, isAIEnabled } from "../lib/ai";
import { readDatabase } from "../db";
const token = (
  await createToken({
    name: "AI",
    scopes: ["content:read", "ai:read", "ai:write"],
  })
).token;
const secret = "test-ai-key-never-return";
afterAll(() => fs.rmSync(ROOT_DIR, { recursive: true, force: true }));
afterEach(() => vi.unstubAllGlobals());
it("persists write-only secrets, enables AI, and keeps receipts free of plaintext keys", async () => {
  const before = await getAI(token);
  const input = {
    apiKey: secret,
    enabled: true,
    expectedRevision: before.revision,
    requestId: "ai-configure",
  };
  const result = await updateAI(token, input);
  expect(await updateAI(token, input)).toEqual(result);
  expect(result.config.hasApiKey).toBe(true);
  expect(JSON.stringify(await getAI(token))).not.toContain(secret);
  expect(await getSafeAIConfig()).toEqual(result);
  expect((await getAIConfig())?.apiKey).toBe(secret);
  expect(await isAIEnabled()).toBe(true);
  const receipts = await readDatabase(db =>
    rows(db, "SELECT * FROM mcp_requests")
  );
  expect(JSON.stringify(receipts)).not.toContain(secret);
  await saveSafeAIConfig({ enabled: false, expectedRevision: result.revision });
  expect(await isAIEnabled()).toBe(false);
  expect((await getAIConfig())?.apiKey).toBe(secret);
  await expect(
    updateAI(token, { ...input, requestId: "ai-stale-save" })
  ).rejects.toThrow("版本冲突");
});
it("prevents secret reuse at new destinations, supports explicit clearing and forbids keyless enable", async () => {
  const current = await getAI(token);
  await expect(
    updateAI(token, {
      apiBaseUrl: "https://different.example",
      expectedRevision: current.revision,
      requestId: "ai-destination",
    })
  ).rejects.toThrow("重新提供密钥");
  const cleared = await updateAI(token, {
    clearApiKey: true,
    enabled: false,
    expectedRevision: current.revision,
    requestId: "ai-clear-key",
  });
  expect(cleared.config.hasApiKey).toBe(false);
  await expect(
    updateAI(token, {
      enabled: true,
      expectedRevision: cleared.revision,
      requestId: "ai-no-key-enable",
    })
  ).rejects.toThrow("密钥和模型");
});
it("tests a saved endpoint with timeout, no redirects and no secret/error echo", async () => {
  const before = await getAI(token);
  await updateAI(token, {
    provider: "openai",
    apiBaseUrl: "https://example.com/v1/",
    apiKey: secret,
    model: "test",
    enabled: true,
    expectedRevision: before.revision,
    requestId: "ai-test-setup",
  });
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "OK" } }] }),
        { status: 200 }
      )
    );
  vi.stubGlobal("fetch", fetchMock);
  expect((await testAI(token)).success).toBe(true);
  expect(fetchMock).toHaveBeenCalledWith(
    "https://example.com/v1/chat/completions",
    expect.objectContaining({
      redirect: "error",
      signal: expect.any(AbortSignal),
    })
  );
  fetchMock.mockResolvedValueOnce(new Response(secret, { status: 401 }));
  await expect(testAI(token)).rejects.toThrow("AI 连接测试失败");
  const legacy = (
    await createToken({
      name: "legacy",
      scopes: ["content:read", "content:write"],
    })
  ).token;
  await expect(getAI(legacy)).rejects.toThrow("权限不足");
  await expect(testAI(legacy)).rejects.toThrow("权限不足");
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
