import { randomBytes } from "node:crypto";
import type { Database } from "sql.js";
import { z } from "zod";
import { writeDatabase } from "../db";
import { authorize, hash, rows, type Token, type McpScope } from "./store";

export const requestId = z
  .string()
  .min(8)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/)
  .describe(
    "客户端生成的唯一操作 ID；同一次操作重试必须复用，内容变化时使用新的 ID"
  );
export const revision = z
  .number()
  .int()
  .nonnegative()
  .describe(
    "从 get_article 或上次写入结果读取的 updatedAt；冲突时重新读取，不要盲目覆盖"
  );

export function audit(
  db: Database,
  token: Token,
  action: string,
  resourceId: string | null
) {
  db.run("INSERT INTO mcp_events VALUES (?,?,?,?,?)", [
    randomBytes(12).toString("hex"),
    token.id,
    action,
    resourceId,
    Date.now(),
  ]);
  db.run(
    "DELETE FROM mcp_events WHERE id IN (SELECT id FROM mcp_events ORDER BY createdAt DESC LIMIT -1 OFFSET 500)"
  );
}
export async function mutate<T>(
  token: Token,
  required: McpScope[],
  action: string,
  input: { requestId: string },
  write: (db: Database) => { result: T; resourceId: string | null }
) {
  const inputHash = hash(JSON.stringify({ action, input }));
  return writeDatabase(db => {
    authorize(db, token.id, required);
    const previous = rows<{ inputHash: string; result: string }>(
      db,
      "SELECT inputHash,result FROM mcp_requests WHERE tokenId=? AND requestId=?",
      [token.id, input.requestId]
    )[0];
    if (previous) {
      if (previous.inputHash !== inputHash)
        throw new Error("requestId 已用于其他内容，请为新操作生成新的 ID");
      return JSON.parse(previous.result) as T;
    }
    const { result, resourceId } = write(db);
    db.run("INSERT INTO mcp_requests VALUES (?,?,?,?,?)", [
      token.id,
      input.requestId,
      inputHash,
      JSON.stringify(result),
      Date.now(),
    ]);
    db.run(
      "DELETE FROM mcp_requests WHERE tokenId IN (SELECT id FROM mcp_tokens WHERE revokedAt IS NOT NULL OR expiresAt <= ?)",
      [Date.now()]
    );
    audit(db, token, action, resourceId);
    return result;
  });
}
