import type { BrandFormValues, ShadeFormValues } from "./schemas/taxonomy-form.schema";

type FormValues = { slug: string } & Record<string, unknown>;

// A blank slug is left out, so the API derives it from the name.
export function toTaxonomyBody<T extends FormValues>(values: T): Omit<T, "slug"> | T {
  if (values.slug !== "") return values;
  const { slug: _slug, ...rest } = values;
  return rest;
}

export function toShadeBody(values: ShadeFormValues) {
  return toTaxonomyBody({ ...values, hex_code: values.hex_code.toUpperCase() });
}

// A new logo has to travel as multipart; without one the brand is plain JSON. The
// browser sets the multipart boundary, so no Content-Type is given here.
export function toBrandBody(values: BrandFormValues): FormData | object {
  const { logo, ...fields } = toTaxonomyBody(values);
  if (logo === null) return fields;
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, String(value));
  form.set("logo", logo);
  return form;
}
