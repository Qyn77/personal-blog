import { afterAll, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
vi.mock("../root", async () => ({
  ROOT_DIR: fs.mkdtempSync(
    path.join((await import("node:os")).tmpdir(), "ink-about-")
  ),
}));
import { ROOT_DIR } from "../root";
import { createToken } from "./store";
import { getAbout, updateAbout } from "./about";
import { getAboutConfig, saveAboutConfig } from "../lib/aboutConfig";
const initial = {
  hero: {
    image: "/test.png",
    title: "Qyn",
    paragraphs: ["个人学习"],
    quote: "记录",
  },
  interests: [{ label: "Rust", description: "学习" }],
  favorites: [],
};
fs.mkdirSync(path.join(ROOT_DIR, "public"));
const file = path.join(ROOT_DIR, "public/about-config.json");
fs.writeFileSync(file, JSON.stringify(initial));
afterAll(() => fs.rmSync(ROOT_DIR, { recursive: true, force: true }));
it("shares persisted About state with admin/public readers, merges partial hero and rejects stale revisions", async () => {
  const token = (
    await createToken({
      name: "site",
      scopes: ["content:read", "site:read", "site:write"],
    })
  ).token;
  const before = await getAbout(token);
  expect(before.config).toEqual(initial);
  const args = {
    hero: { title: "新的介绍" },
    expectedRevision: before.revision,
    requestId: "about-update",
  };
  const result = await updateAbout(token, args);
  expect(await updateAbout(token, args)).toEqual(result);
  expect(result.config.hero.paragraphs).toEqual(initial.hero.paragraphs);
  expect(result.config.interests).toEqual(initial.interests);
  expect(await getAboutConfig()).toEqual(result);
  expect(JSON.parse(fs.readFileSync(file, "utf8"))).toEqual(initial);
  await saveAboutConfig(
    {
      ...result.config,
      favorites: [{ category: "书籍", items: ["学习笔记"] }],
    },
    result.revision
  );
  await expect(
    updateAbout(token, { ...args, requestId: "about-stale" })
  ).rejects.toThrow("版本冲突");
  fs.unlinkSync(file);
  expect((await getAboutConfig()).config.hero.title).toBe("新的介绍");
});
it("does not grant site rights to existing content tokens", async () => {
  const token = (
    await createToken({
      name: "legacy",
      scopes: ["content:read", "content:write"],
    })
  ).token;
  await expect(getAbout(token)).rejects.toThrow("权限不足");
  const current = await getAboutConfig();
  await expect(
    updateAbout(token, {
      hero: { title: "拒绝" },
      expectedRevision: current.revision,
      requestId: "about-denied",
    })
  ).rejects.toThrow("权限不足");
});
