import { z } from "zod";

export const TAXONOMY_SEARCH_SCHEMA = z.object({
  q: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional()
    .catch(undefined),
});
