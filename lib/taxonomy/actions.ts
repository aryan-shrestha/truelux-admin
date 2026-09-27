"use server";

import { type ActionResult, attempt, invalidInput } from "@/lib/actions/attempt";
import { createTaxonomy, deleteTaxonomy, updateTaxonomy } from "@/lib/api/taxonomy";
import { TAXONOMY_KINDS, type Taxonomy, type TaxonomyKind } from "@/lib/api/types";
import { withoutBlankSlug } from "@/lib/catalog/fields";
import {
  type BrandValues,
  type CategoryValues,
  type ShadeValues,
  type SizeValues,
  type SkinTypeValues,
  brandSchema,
  categorySchema,
  shadeSchema,
  sizeSchema,
  skinTypeSchema,
} from "@/lib/taxonomy/schemas";

type Saved<K extends TaxonomyKind> = Promise<ActionResult<Taxonomy[K]>>;

async function save<K extends TaxonomyKind>(
  kind: K,
  id: string | null,
  body: FormData | object,
): Saved<K> {
  return attempt(() => (id === null ? createTaxonomy(kind, body) : updateTaxonomy(kind, id, body)));
}

function toMultipart(values: Record<string, string | number | boolean | undefined>, file: File) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) form.set(key, String(value));
  }
  form.set("logo", file);
  return form;
}

export async function saveBrand(id: string | null, input: BrandValues): Saved<"brands"> {
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const { logo, ...fields } = withoutBlankSlug(parsed.data);
  return save("brands", id, logo ? toMultipart(fields, logo) : fields);
}

export async function saveCategory(id: string | null, input: CategoryValues): Saved<"categories"> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  return save("categories", id, withoutBlankSlug(parsed.data));
}

export async function saveShade(id: string | null, input: ShadeValues): Saved<"shades"> {
  const parsed = shadeSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  return save("shades", id, {
    ...withoutBlankSlug(parsed.data),
    hex_code: parsed.data.hex_code.toUpperCase(),
  });
}

export async function saveSize(id: string | null, input: SizeValues): Saved<"sizes"> {
  const parsed = sizeSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  return save("sizes", id, withoutBlankSlug(parsed.data));
}

export async function saveSkinType(id: string | null, input: SkinTypeValues): Saved<"skin-types"> {
  const parsed = skinTypeSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  return save("skin-types", id, withoutBlankSlug(parsed.data));
}

export async function removeTaxonomy(kind: TaxonomyKind, id: string): Promise<ActionResult<null>> {
  if (!TAXONOMY_KINDS.includes(kind)) return invalidInput();
  const result = await attempt(() => deleteTaxonomy(kind, id));
  return result.ok ? { ok: true, data: null } : result;
}
