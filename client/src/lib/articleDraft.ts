import * as z from "zod/mini";

const draftSchema = z.object({
  series: z._default(z.string(), ""),
  seriesOrder: z._default(z.int().check(z.minimum(0)), 0),
  title: z.string(),
  subtitle: z.string(),
  slug: z.string(),
  date: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  featured: z.boolean(),
  status: z.enum(["draft", "published"]),
  excerpt: z.string(),
  content: z.string(),
  coverImage: z.string(),
});
export function validateDraft(value: unknown) {
  const result = draftSchema.safeParse(value);
  return result.success ? result.data : null;
}
