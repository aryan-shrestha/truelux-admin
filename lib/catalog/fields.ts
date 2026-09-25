import { z } from "zod";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export const nameField = z.string().trim().min(1, "Enter a name.").max(200, "Keep it under 200 characters.");

export const slugField = z
  .string()
  .trim()
  .refine((value) => value === "" || SLUG_PATTERN.test(value), {
    message: "Use lowercase letters, numbers and single hyphens, or leave it blank.",
  });

export const sortOrderField = z
  .number({ error: "Enter a whole number." })
  .int("Enter a whole number.")
  .min(0, "Use 0 or more.");

export function withoutBlankSlug<T extends { slug: string }>(
  values: T,
): Omit<T, "slug"> & { slug?: string } {
  const { slug, ...rest } = values;
  return slug === "" ? rest : { ...rest, slug };
}
