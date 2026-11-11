import { randomBytes } from "node:crypto";
import { z } from "zod";
import { readDatabase } from "../db";
import {
  archiveRow,
  checkArchiveRevision,
  insertArchiveRow,
  updateArchiveRow,
  deleteArchiveRow,
} from "../lib/archiveWrites";
import { generateExcerpt, calculateReadTime, slugify } from "../lib/markdown";
import { authorize, rows, type Token } from "./store";
import { requestId, revision, mutate } from "./operations";
import { fields } from "./content";
import type { Archive } from "../schema";

const archiveFields = z.object(fields).pick({
  title: true,
  content: true,
  subtitle: true,
  excerpt: true,
  date: true,
  tags: true,
  category: true,
  slug: true,
});
export const createArchiveInput = archiveFields
  .extend({ tags: fields.tags.default([]), requestId })
  .strict();
export const updateArchiveInput = archiveFields
  .partial()
  .extend({ id: z.string().min(1), expectedUpdatedAt: revision, requestId })
  .strict();
export const deleteArchiveInput = z
  .object({
    id: z.string().min(1),
    expectedUpdatedAt: revision,
    confirmTitle: z
      .string()
      .min(1)
      .describe("必须与当前归档标题完全一致；仅在用户明确要求删除时调用"),
    requestId,
  })
  .strict();
export const listArchivesInput = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(50).default(20),
    search: z.string().max(200).optional(),
  })
  .strict();

const summary = (a: Archive, origin: string) => ({
  id: a.id,
  slug: a.slug,
  title: a.title,
  updatedAt: a.updatedAt,
  url: `${origin}/archive/${encodeURIComponent(a.slug)}`,
  public: true,
});

export async function listArchives(
  token: Token,
  input: z.input<typeof listArchivesInput>
) {
  const value = listArchivesInput.parse(input);
  return readDatabase(db => {
    authorize(db, token.id, ["archive:read"]);
    const where = value.search ? "WHERE title LIKE ? OR excerpt LIKE ?" : "";
    const params = value.search
      ? [`%${value.search}%`, `%${value.search}%`]
      : [];
    return {
      archives: rows(
        db,
        `SELECT id,slug,title,excerpt,date,category,updatedAt FROM archives ${where} ORDER BY date DESC,id LIMIT ? OFFSET ?`,
        [...params, value.pageSize, (value.page - 1) * value.pageSize]
      ),
      total: rows<{ total: number }>(
        db,
        `SELECT count(*) AS total FROM archives ${where}`,
        params
      )[0].total,
      page: value.page,
      pageSize: value.pageSize,
    };
  });
}

export async function getArchive(token: Token, id: string) {
  return readDatabase(db => {
    authorize(db, token.id, ["archive:read"]);
    const archive = archiveRow(db, id);
    if (!archive) throw new Error("归档不存在");
    return { ...archive, tags: JSON.parse(archive.tags) };
  });
}

export async function createArchive(
  token: Token,
  input: z.input<typeof createArchiveInput>,
  origin: string
) {
  const value = createArchiveInput.parse(input);
  return mutate(token, ["archive:write"], "create_archive", value, db => {
    const id = randomBytes(12).toString("hex");
    const slug = value.slug || `${slugify(value.title)}-${id.slice(0, 6)}`;
    if (rows(db, "SELECT id FROM archives WHERE slug=?", [slug]).length)
      throw new Error("slug 已存在，请选择其他 slug");
    const archive = insertArchiveRow(db, {
      ...value,
      id,
      slug,
      excerpt: value.excerpt || generateExcerpt(value.content),
      readTime: calculateReadTime(value.content),
    });
    return { result: summary(archive, origin), resourceId: id };
  });
}

export async function updateArchive(
  token: Token,
  input: z.input<typeof updateArchiveInput>,
  origin: string
) {
  const value = updateArchiveInput.parse(input);
  return mutate(token, ["archive:write"], "update_archive", value, db => {
    const { id, requestId: _, expectedUpdatedAt, ...changes } = value;
    const prepared =
      changes.content !== undefined
        ? {
            excerpt: changes.excerpt || generateExcerpt(changes.content),
            readTime: calculateReadTime(changes.content),
          }
        : {};
    const archive = updateArchiveRow(
      db,
      id,
      { ...changes, ...prepared },
      expectedUpdatedAt
    );
    return { result: summary(archive, origin), resourceId: id };
  });
}

export async function deleteArchive(
  token: Token,
  input: z.input<typeof deleteArchiveInput>
) {
  const value = deleteArchiveInput.parse(input);
  return mutate(token, ["archive:delete"], "delete_archive", value, db => {
    const archive = checkArchiveRevision(db, value.id, value.expectedUpdatedAt);
    if (archive.title !== value.confirmTitle)
      throw new Error("确认标题与归档不一致，未删除");
    deleteArchiveRow(db, value.id, value.expectedUpdatedAt);
    return { result: { id: value.id, deleted: true }, resourceId: value.id };
  });
}
