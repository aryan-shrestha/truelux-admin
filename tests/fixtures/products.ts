import type { Product, ProductImage, Variant } from "@/lib/api/types";

export const variant: Variant = {
  id: "v1",
  sku: "LUM-SF-30-WB",
  size: { id: "s30", name: "30 ml" },
  shade: { id: "sh1", name: "Warm Beige", hex_code: "#D8A47F" },
  stock_quantity: 12,
  price_override: null,
  price: "3200.00",
  compare_at_price: null,
  on_sale: false,
  discount_percent: null,
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

export const product: Product = {
  id: "p1",
  name: "Silk Foundation",
  slug: "silk-foundation",
  description: "",
  brand: { id: "b1", name: "Lumière", slug: "lumiere" },
  category: { id: "c1", name: "Face", slug: "face" },
  base_price: "3200.00",
  is_published: false,
  sort_order: 0,
  skin_types: [{ id: "st-dry", name: "Dry", slug: "dry" }],
  skin_feel: "",
  key_ingredients: "",
  variants: [variant],
  images: [image("i1", 0, true)],
  created_at: "2026-09-25T10:00:00Z",
  updated_at: "2026-09-25T10:00:00Z",
};
