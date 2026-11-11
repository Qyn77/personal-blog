import { createHash, randomBytes } from "node:crypto";
import type { Database, BindParams } from "sql.js";
import { z } from "zod";
import { readDatabase, writeDatabase } from "../db";

export const scopes = [
  "content:read",
  "content:write",
  "content:publish",
  "media:write",
  "archive:read",
  "archive:write",
  "archive:delete",
  "site:read",
  "site:write",
] as const;
export type McpScope = (typeof scopes)[number];
export const tokenInput = z.object({
  name: z.string().trim().min(1).max(60),
  scopes: z
    .array(z.enum(scopes))
    .min(1)
    .refine(s => s.includes("content:read"), "必须包含读取权限"),
  expiresInDays: z.number().int().min(1).max(365).default(90),
});
export type Token = {
  id: string;
  name: string;
  prefix: string;
  scopes: McpScope[];
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
};
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export function rows<T>(
  db: Database,
  sql: string,
  params: BindParams = []
): T[] {
  const result = db.exec(sql, params)[0];
  return result
    ? result.values.map(
        row =>
          Object.fromEntries(result.columns.map((key, i) => [key, row[i]])) as T
      )
    : [];
}
const tokenColumns =
  "id, name, prefix, scopes, createdAt, expiresAt, revokedAt";
function parseToken(row: Omit<Token, "scopes"> & { scopes: string }): Token {
  return { ...row, scopes: JSON.parse(row.scopes) };
}
export async function createToken(input: z.input<typeof tokenInput>) {
  const value = tokenInput.parse(input);
  const secret = `ink_mcp_${randomBytes(32).toString("base64url")}`;
  const token: Token = {
    id: randomBytes(12).toString("hex"),
    name: value.name,
    prefix: secret.slice(0, 16),
    scopes: Array.from(new Set(value.scopes)),
    createdAt: Date.now(),
    expiresAt: Date.now() + value.expiresInDays * 86400000,
    revokedAt: null,
  };
  await writeDatabase(db => {
    db.run(
      "INSERT INTO mcp_tokens (id,name,tokenHash,prefix,scopes,createdAt,expiresAt) VALUES (?,?,?,?,?,?,?)",
      [
        token.id,
        token.name,
        hash(secret),
        token.prefix,
        JSON.stringify(token.scopes),
        token.createdAt,
        token.expiresAt,
      ]
    );
  });
  return { token, secret };
}
export async function listTokens() {
  return readDatabase(db =>
    rows<Omit<Token, "scopes"> & { scopes: string }>(
      db,
      `SELECT ${tokenColumns} FROM mcp_tokens ORDER BY createdAt DESC`
    ).map(parseToken)
  );
}
export async function revokeToken(id: string) {
  await writeDatabase(db => {
    db.run(
      "UPDATE mcp_tokens SET revokedAt = COALESCE(revokedAt, ?) WHERE id = ?",
      [Date.now(), id]
    );
    db.run("DELETE FROM mcp_previews WHERE tokenId = ?", [id]);
  });
}
export async function authenticate(secret: string): Promise<Token | null> {
  if (!/^ink_mcp_[A-Za-z0-9_-]{43}$/.test(secret)) return null;
  return readDatabase(db => {
    const row = rows<Omit<Token, "scopes"> & { scopes: string }>(
      db,
      `SELECT ${tokenColumns} FROM mcp_tokens WHERE tokenHash = ? AND revokedAt IS NULL AND expiresAt > ?`,
      [hash(secret), Date.now()]
    )[0];
    return row ? parseToken(row) : null;
  });
}
/** Recheck revocation/expiry inside each write transaction. */
export function authorize(db: Database, id: string, required: McpScope[]) {
  const row = rows<Omit<Token, "scopes"> & { scopes: string }>(
    db,
    `SELECT ${tokenColumns} FROM mcp_tokens WHERE id = ? AND revokedAt IS NULL AND expiresAt > ?`,
    [id, Date.now()]
  )[0];
  if (!row) throw new Error("凭证已过期或被撤销");
  const token = parseToken(row);
  if (required.some(scope => !token.scopes.includes(scope)))
    throw new Error("权限不足");
  return token;
}
export function siteUrl(): string | null {
  try {
    const url = new URL(process.env.SITE_URL || "");
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    if (
      url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      )
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
export async function recentEvents() {
  return readDatabase(db =>
    rows<{
      id: string;
      tokenName: string;
      action: string;
      resourceId: string | null;
      createdAt: number;
    }>(
      db,
      `SELECT e.id,t.name AS tokenName,e.action,e.resourceId,e.createdAt FROM mcp_events e JOIN mcp_tokens t ON e.tokenId=t.id ORDER BY e.createdAt DESC LIMIT 50`
    )
  );
}
