import { afterAll, expect, it, vi } from "vitest";
import fs from "node:fs";
vi.mock("../root", async () => {
  const os = await import("node:os");
  const path = await import("node:path");
  return {
    ROOT_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "ink-mcp-archive-")),
  };
});
import { ROOT_DIR } from "../root";
import { createToken } from "./store";
import * as archives from "./archives";
import { updateArchive as adminUpdate, getAllArchives } from "../db";
import { createResponseCache } from "../lib/responseCache";

afterAll(() => fs.rmSync(ROOT_DIR, { recursive: true, force: true }));
const writer = (
  await createToken({
    name: "archives",
    scopes: ["content:read", "archive:read", "archive:write", "archive:delete"],
  })
).token;
const input = {
  title: "项目记录",
  content: "## 学习\n公开的个人学习记录。",
  date: "2026-11-11",
  tags: ["学习"],
  category: "记录",
  requestId: "archive-create",
};
const origin = "https://example.com";

it("creates public archives once and preserves omitted update fields", async () => {
  const cache = createResponseCache(30000);
  cache.set("archives", "old");
  const result = await archives.createArchive(writer, input, origin);
  expect(result.public).toBe(true);
  expect(await archives.createArchive(writer, input, origin)).toEqual(result);
  expect((await getAllArchives()).length).toBe(1);
  expect(cache.get("archives")).toBeNull();
  await archives.updateArchive(
    writer,
    {
      id: result.id,
      expectedUpdatedAt: result.updatedAt,
      requestId: "archive-update",
      title: "新标题",
    },
    origin
  );
  const updated = await archives.getArchive(writer, result.id);
  expect(updated.tags).toEqual(input.tags);
  expect(updated.content).toBe(input.content);
  expect(
    (await archives.listArchives(writer, { search: "新标题" })).total
  ).toBe(1);
});

it("keeps legacy article tokens out of archive management", async () => {
  const old = (
    await createToken({
      name: "legacy",
      scopes: ["content:read", "content:write", "content:publish"],
    })
  ).token;
  await expect(archives.listArchives(old, {})).rejects.toThrow("权限不足");
  await expect(
    archives.createArchive(
      old,
      { ...input, requestId: "archive-denied" },
      origin
    )
  ).rejects.toThrow("权限不足");
});

it("rejects stale admin revisions and requires title confirmation plus separate delete permission", async () => {
  const item = await archives.createArchive(
    writer,
    { ...input, requestId: "archive-delete-create" },
    origin
  );
  await adminUpdate(item.id, { title: "后台修改" });
  await expect(
    archives.updateArchive(
      writer,
      {
        id: item.id,
        expectedUpdatedAt: item.updatedAt,
        title: "旧版本",
        requestId: "archive-conflict",
      },
      origin
    )
  ).rejects.toThrow("版本冲突");
  const latest = await archives.getArchive(writer, item.id);
  const args = {
    id: item.id,
    expectedUpdatedAt: latest.updatedAt,
    confirmTitle: latest.title,
    requestId: "archive-delete",
  };
  await expect(
    archives.deleteArchive(writer, { ...args, confirmTitle: "不匹配" })
  ).rejects.toThrow("确认标题");
  const editor = (
    await createToken({
      name: "editor",
      scopes: ["content:read", "archive:read", "archive:write"],
    })
  ).token;
  await expect(archives.deleteArchive(editor, args)).rejects.toThrow(
    "权限不足"
  );
  const deleted = await archives.deleteArchive(writer, args);
  expect(await archives.deleteArchive(writer, args)).toEqual(deleted);
  await expect(archives.getArchive(writer, item.id)).rejects.toThrow("不存在");
});
