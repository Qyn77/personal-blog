import { z } from "zod";
import type { Database } from "sql.js";
import { readDatabase, writeDatabase } from "../db";
import { configRevision } from "./aboutConfig";
import {
  settingValue,
  settingRevision,
  checkSettingRevision,
  writeSettingValue,
} from "./settingState";

const apiUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine(value => {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
    );
  }, "API 地址必须使用 HTTPS（本机服务可用 HTTP），且不能含凭证、查询参数或片段")
  .transform(value => value.replace(/\/+$/, ""));
export const aiConfigSchema = z
  .object({
    provider: z.enum(["deepseek", "openai", "claude", "custom"]),
    apiKey: z.string().trim().max(4096),
    apiBaseUrl: apiUrl,
    model: z.string().trim().max(200),
    enabled: z.boolean(),
  })
  .strict();
export const aiPatchSchema = aiConfigSchema
  .partial()
  .extend({
    clearApiKey: z
      .boolean()
      .optional()
      .describe("明确删除保存的密钥，需同时禁用 AI"),
  })
  .strict();
export const adminAIInput = aiPatchSchema.extend({
  expectedRevision: configRevision,
});
export const defaultAIConfig = {
  provider: "deepseek" as const,
  apiKey: "",
  apiBaseUrl: "https://api.deepseek.com",
  model: "deepseek-chat",
  enabled: false,
};
export function readAIState(db: Database) {
  const raw = settingValue(db, "ai_config");
  const config =
    raw === null ? defaultAIConfig : aiConfigSchema.parse(JSON.parse(raw));
  return { config, revision: settingRevision(config) };
}
export function publicAIState(state: ReturnType<typeof readAIState>) {
  const { apiKey, ...config } = state.config;
  return {
    config: { ...config, hasApiKey: !!apiKey },
    revision: state.revision,
  };
}
export function updateAIState(
  db: Database,
  input: z.input<typeof aiPatchSchema>,
  revision: string
) {
  const patch = aiPatchSchema.parse(input);
  const current = readAIState(db);
  checkSettingRevision(current.revision, revision);
  const { clearApiKey, ...fields } = patch;
  if (clearApiKey && fields.apiKey) throw new Error("不能同时设置和删除密钥");
  const config = aiConfigSchema.parse({
    ...current.config,
    ...fields,
    apiKey: clearApiKey ? "" : fields.apiKey || current.config.apiKey,
  });
  const destinationChanged =
    config.provider !== current.config.provider ||
    config.apiBaseUrl !== current.config.apiBaseUrl;
  if (
    destinationChanged &&
    current.config.apiKey &&
    !fields.apiKey &&
    !clearApiKey
  )
    throw new Error(
      "切换服务商或 API 地址时，请重新提供密钥，或清除密钥并禁用 AI"
    );
  if (config.enabled && (!config.apiKey || !config.model))
    throw new Error("启用 AI 前请配置密钥和模型");
  writeSettingValue(db, "ai_config", config);
  return publicAIState({ config, revision: settingRevision(config) });
}
export const getSafeAIConfig = () =>
  readDatabase(db => publicAIState(readAIState(db)));
export const saveSafeAIConfig = (input: z.input<typeof adminAIInput>) => {
  const { expectedRevision, ...patch } = adminAIInput.parse(input);
  return writeDatabase(db => updateAIState(db, patch, expectedRevision));
};
