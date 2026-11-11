import { readDatabase } from "../db";
import {
  aboutPatchSchema,
  configRevision,
  readAboutState,
  updateAboutState,
} from "../lib/aboutConfig";
import { authorize, type Token } from "./store";
import { requestId, mutate } from "./operations";
import { z } from "zod";

export const updateAboutInput = aboutPatchSchema
  .extend({ expectedRevision: configRevision, requestId })
  .strict();
export const getAbout = (token: Token) =>
  readDatabase(db => {
    authorize(db, token.id, ["site:read"]);
    return readAboutState(db);
  });
export async function updateAbout(
  token: Token,
  input: z.input<typeof updateAboutInput>
) {
  const value = updateAboutInput.parse(input);
  return mutate(token, ["site:write"], "update_about", value, db => {
    const { expectedRevision, requestId: _, ...patch } = value;
    return {
      result: updateAboutState(db, patch, expectedRevision),
      resourceId: "about",
    };
  });
}
