import type { ProductFormValues } from "./schemas/product-form.schema";

// A blank slug is left out, so the API derives it from the name. `skin_type_ids` is
// always sent: on PATCH it replaces the whole set.
export function toProductBody(values: ProductFormValues) {
  if (values.slug !== "") return values;
  const { slug: _slug, ...rest } = values;
  return rest;
}
