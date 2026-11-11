import { createHash } from "node:crypto";
import type { Database } from "sql.js";

export function settingValue(db: Database, key: string): string | null {
  const value = db.exec("SELECT value FROM settings WHERE key=?", [key])[0]
    ?.values[0]?.[0];
  return typeof value === "string" ? value : null;
}
export function settingRevision(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
export function checkSettingRevision(actual: string, expected?: string) {
  if (expected !== undefined && actual !== expected)
    throw new Error("配置已被修改，请重新读取后提交（版本冲突）");
}
export function writeSettingValue(db: Database, key: string, value: unknown) {
  db.run(
    "INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [key, JSON.stringify(value)]
  );
}
