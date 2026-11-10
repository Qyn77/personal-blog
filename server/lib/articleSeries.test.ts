import { expect, it } from "vitest";
import initSqlJs from "sql.js";
import {
  ensureArticleSeriesColumns,
  parseSeriesMetadata,
} from "./articleSeries";
it("migrates an old article table repeatedly without deleting existing rows", async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE articles (id TEXT PRIMARY KEY); INSERT INTO articles VALUES ('existing')"
  );
  ensureArticleSeriesColumns(db);
  ensureArticleSeriesColumns(db);
  expect(
    db.exec("SELECT id,series,seriesOrder FROM articles")[0].values
  ).toEqual([["existing", null, 0]]);
  db.close();
});
it("normalizes frontmatter series metadata", () => {
  expect(
    parseSeriesMetadata({ series: " Rust 入门 ", seriesOrder: "2" })
  ).toEqual({ series: "Rust 入门", seriesOrder: 2 });
  expect(parseSeriesMetadata({ seriesOrder: -1 })).toEqual({
    series: "",
    seriesOrder: 0,
  });
});
