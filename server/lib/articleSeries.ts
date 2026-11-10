import type { Database } from "sql.js";

export function ensureArticleSeriesColumns(db: Pick<Database, "exec" | "run">) {
  const columns =
    db.exec("PRAGMA table_info(articles)")[0]?.values.map(row => row[1]) ?? [];
  if (!columns.includes("series"))
    db.run("ALTER TABLE articles ADD COLUMN series TEXT");
  if (!columns.includes("seriesOrder"))
    db.run(
      "ALTER TABLE articles ADD COLUMN seriesOrder INTEGER NOT NULL DEFAULT 0"
    );
}

export function parseSeriesMetadata(metadata: Record<string, unknown>) {
  const series =
    typeof metadata.series === "string"
      ? metadata.series.trim().slice(0, 80)
      : "";
  const order = Number(metadata.seriesOrder ?? 0);
  return {
    series,
    seriesOrder:
      Number.isInteger(order) && order >= 0 && order <= 1000000 ? order : 0,
  };
}
