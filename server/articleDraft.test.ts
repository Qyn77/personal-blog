import { expect, it } from "vitest";
import { validateDraft } from "../client/src/lib/articleDraft";

const legacyDraft = {
  title: "未发布的文章",
  subtitle: "",
  slug: "draft",
  date: "2026-11-10",
  category: "技术",
  tags: ["Rust"],
  featured: false,
  status: "draft",
  excerpt: "摘要",
  content: "尚未提交的正文",
  coverImage: "",
};
it("recovers existing backups while defaulting newly added series fields", () => {
  expect(validateDraft(legacyDraft)).toEqual({
    ...legacyDraft,
    series: "",
    seriesOrder: 0,
  });
});
it("rejects malformed backups rather than populating unsafe form state", () => {
  for (const value of [
    null,
    {},
    { ...legacyDraft, tags: "Rust" },
    { ...legacyDraft, status: "unexpected" },
    { ...legacyDraft, seriesOrder: -1 },
    { ...legacyDraft, seriesOrder: 1.5 },
  ]) {
    expect(validateDraft(value)).toBeNull();
  }
});
it("keeps explicit series ordering and complete unsaved content", () => {
  const draft = { ...legacyDraft, series: "Rust 入门", seriesOrder: 2 };
  expect(validateDraft(draft)).toEqual(draft);
});
