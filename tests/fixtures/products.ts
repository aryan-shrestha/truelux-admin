import type { ProductImage, Variant } from "@/lib/api/types";

export const variant: Variant = {
  id: "v1",
  sku: "LUM-SF-30-WB",
  size: { id: "s30", name: "30 ml" },
  shade: { id: "sh1", name: "Warm Beige", hex_code: "#D8A47F" },
  stock_quantity: 12,
  price_override: null,
  price: "3200.00",
};

export function image(id: string, sort_order: number, is_primary = false): ProductImage {
  return {
    id,
    url: `https://res.cloudinary.com/demo/${id}.jpg`,
    alt_text: "",
    sort_order,
    is_primary,
  };
}
