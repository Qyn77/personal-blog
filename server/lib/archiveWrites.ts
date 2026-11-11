import type { Database } from "sql.js";
import type { Archive } from "../schema";
import { invalidateContentCache } from "./responseCache";

export type ArchiveFields = Pick<
  Archive,
  "slug" | "title" | "excerpt" | "content" | "date" | "readTime" | "category"
> & { subtitle?: string; tags: string[] };

export function archiveRow(db: Database, id: string): Archive | undefined {
  const result = db.exec("SELECT * FROM archives WHERE id = ?", [id])[0];
  return result
    ? (Object.fromEntries(
        result.columns.map((col, i) => [col, result.values[0][i]])
      ) as Archive)
    : undefined;
}

export function insertArchiveRow(
  db: Database,
  value: ArchiveFields & { id: string }
): Archive {
  const now = Date.now();
  db.run(
    "INSERT INTO archives (id,slug,title,subtitle,excerpt,content,date,readTime,tags,category,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      value.id,
      value.slug,
      value.title,
      value.subtitle ?? null,
      value.excerpt,
      value.content,
      value.date,
      value.readTime,
      JSON.stringify(value.tags),
      value.category,
      now,
      now,
    ]
  );
  invalidateContentCache();
  return archiveRow(db, value.id)!;
}

export function checkArchiveRevision(
  db: Database,
  id: string,
  expectedUpdatedAt?: number
) {
  const previous = archiveRow(db, id);
  if (!previous) throw new Error("归档不存在");
  if (
    expectedUpdatedAt !== undefined &&
    previous.updatedAt !== expectedUpdatedAt
  )
    throw new Error("归档已被修改，请重新读取后提交（版本冲突）");
  return previous;
}

export function updateArchiveRow(
  db: Database,
  id: string,
  value: Partial<ArchiveFields>,
  expectedUpdatedAt?: number
) {
  const previous = checkArchiveRevision(db, id, expectedUpdatedAt);
  const changes: Record<string, string | number> = {
    updatedAt: Math.max(Date.now(), previous.updatedAt + 1),
  };
  for (const key of [
    "slug",
    "title",
    "subtitle",
    "excerpt",
    "content",
    "date",
    "readTime",
    "category",
  ] as const) {
    if (value[key] !== undefined) changes[key] = value[key]!;
  }
  if (value.tags !== undefined) changes.tags = JSON.stringify(value.tags);
  db.run(
    `UPDATE archives SET ${Object.keys(changes)
      .map(k => `${k}=?`)
      .join(",")} WHERE id=?`,
    [...Object.values(changes), id]
  );
  invalidateContentCache();
  return archiveRow(db, id)!;
}

export function deleteArchiveRow(
  db: Database,
  id: string,
  expectedUpdatedAt?: number
) {
  checkArchiveRevision(db, id, expectedUpdatedAt);
  db.run("DELETE FROM archives WHERE id=?", [id]);
  invalidateContentCache();
}
