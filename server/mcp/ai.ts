import { z } from "zod";
import { readDatabase, writeDatabase } from "../db";
import { AI_PROVIDERS, testAIConnection } from "../lib/ai";
import {
  adminAIInput,
  readAIState,
  publicAIState,
  updateAIState,
} from "../lib/aiConfig";
import { authorize, type Token } from "./store";
import { requestId, mutate, audit } from "./operations";
export const updateAIInput = adminAIInput.extend({ requestId }).strict();
export const getAI = (token: Token) =>
  readDatabase(db => {
    authorize(db, token.id, ["ai:read"]);
    return { ...publicAIState(readAIState(db)), providers: AI_PROVIDERS };
  });
export const updateAI = (
  token: Token,
  input: z.input<typeof updateAIInput>
) => {
  const value = updateAIInput.parse(input);
  return mutate(token, ["ai:write"], "update_ai_config", value, db => {
    const { expectedRevision, requestId: _, ...patch } = value;
    return {
      result: updateAIState(db, patch, expectedRevision),
      resourceId: "ai",
    };
  });
};
export async function testAI(token: Token) {
  const state = await readDatabase(db => {
    authorize(db, token.id, ["ai:write"]);
    return readAIState(db);
  });
  const result = await testAIConnection(state.config);
  await writeDatabase(db => {
    authorize(db, token.id, ["ai:write"]);
    audit(db, token, "test_ai_connection", "ai");
  });
  return { ...result, revision: state.revision };
}
