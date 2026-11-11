import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Database } from "sql.js";
import { ROOT_DIR } from "../root";
import { readDatabase, writeDatabase } from "../db";
import {
  settingValue,
  settingRevision,
  checkSettingRevision,
  writeSettingValue,
} from "./settingState";

export const aboutSchema = z
  .object({
    hero: z
      .object({
        image: z
          .string()
          .max(2048)
          .refine(
            v => !v || /^\/(?!\/)/.test(v) || /^https?:\/\//.test(v),
            "图片需使用站内路径或 HTTP(S) 地址"
          ),
        title: z.string().max(200),
        paragraphs: z.array(z.string().max(5000)).max(30),
        quote: z.string().max(1000),
      })
      .strict(),
    interests: z
      .array(
        z
          .object({
            label: z.string().max(100),
            description: z.string().max(2000),
          })
          .strict()
      )
      .max(50),
    favorites: z
      .array(
        z
          .object({
            category: z.string().max(100),
            items: z.array(z.string().max(1000)).max(50),
          })
          .strict()
      )
      .max(30),
  })
  .strict();
export const aboutPatchSchema = aboutSchema
  .partial()
  .extend({ hero: aboutSchema.shape.hero.partial().optional() })
  .strict();
export const configRevision = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .describe("从对应配置读取工具获取的 revision；发生冲突时先重新读取");

export function readAboutState(db: Database) {
  let raw = settingValue(db, "about_config");
  if (raw === null) {
    const directory =
      process.env.NODE_ENV === "development" ? "client/public" : "public";
    raw = fs.readFileSync(
      path.join(ROOT_DIR, directory, "about-config.json"),
      "utf8"
    );
  }
  const config = aboutSchema.parse(JSON.parse(raw));
  return { config, revision: settingRevision(config) };
}
export function updateAboutState(
  db: Database,
  patch: z.input<typeof aboutPatchSchema>,
  expectedRevision?: string
) {
  const value = aboutPatchSchema.parse(patch);
  const current = readAboutState(db);
  checkSettingRevision(current.revision, expectedRevision);
  const config = aboutSchema.parse({
    ...current.config,
    ...value,
    hero: { ...current.config.hero, ...value.hero },
  });
  writeSettingValue(db, "about_config", config);
  return { config, revision: settingRevision(config) };
}
export const getAboutConfig = () => readDatabase(readAboutState);
export const saveAboutConfig = (
  config: z.input<typeof aboutSchema>,
  revision?: string
) => writeDatabase(db => updateAboutState(db, config, revision));
