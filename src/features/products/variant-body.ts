import type { VariantFormValues } from "./schemas/variant-form.schema";

// A blank amount is sent as null. Stock is sent only for a new variant: a saved one's
// stock changes through the stock ledger, because an absolute count could overwrite
// a sale made in the meantime.
export function toVariantBody(values: VariantFormValues, isNew: boolean) {
  const body = {
    sku: values.sku,
    size_id: values.size_id,
    shade_id: values.shade_id,
    price_override: values.price_override || null,
    compare_at_price: values.compare_at_price || null,
  };
  return isNew ? { ...body, stock_quantity: values.stock_quantity } : body;
}
