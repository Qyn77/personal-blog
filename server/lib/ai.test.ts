import { expect, it, vi } from "vitest";
const storage = vi.hoisted(() => new Map<string, string>());
vi.mock("../db", () => ({
  getSetting: vi.fn(async (key: string) => storage.get(key)),
  setSetting: vi.fn(async (key: string, value: string) => {
    storage.set(key, value);
    return true;
  }),
}));
import * as db from "../db";
const config = {
  provider: "custom" as const,
  apiKey: "test-key",
  apiBaseUrl: "https://example.com",
  model: "test",
  enabled: true,
};
it("reloads saved AI configuration after module restart", async () => {
  const ai = await import("./ai");
  await ai.setAIConfig(config);
  vi.resetModules();
  const restarted = await import("./ai");
  expect(await restarted.getAIConfig()).toEqual(config);
  expect(await restarted.isAIEnabled()).toBe(true);
});
it("rejects configuration saves when storage fails", async () => {
  vi.mocked(db.setSetting).mockResolvedValueOnce(false);
  const ai = await import("./ai");
  await expect(
    ai.setAIConfig({ ...config, model: "unsaved" })
  ).rejects.toThrow();
});
