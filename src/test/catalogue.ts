import { http, HttpResponse } from "msw";

export const BRAND = {
  id: "0c000000-0000-4000-8000-000000000001",
  name: "Lumière",
  slug: "lumiere",
  description: "",
  logo_url: null,
  is_active: true,
  sort_order: 0,
  product_count: 1,
};

export const CATEGORY = {
  id: "0c000000-0000-4000-8000-000000000002",
  name: "Foundation",
  slug: "foundation",
  parent_id: null,
  sort_order: 0,
  product_count: 1,
};

export const SKIN_TYPES = [
  {
    id: "0c000000-0000-4000-8000-000000000003",
    name: "Oily",
    slug: "oily",
    sort_order: 0,
    product_count: 0,
  },
  {
    id: "0c000000-0000-4000-8000-000000000004",
    name: "Dry",
    slug: "dry",
    sort_order: 1,
    product_count: 0,
  },
];

// The taxonomy lists a product screen reads for its pickers and filters.
export const catalogueHandlers = [
  http.get("*/api/v1/admin/brands/", () => HttpResponse.json([BRAND])),
  http.get("*/api/v1/admin/categories/", () => HttpResponse.json([CATEGORY])),
  http.get("*/api/v1/admin/skin-types/", () => HttpResponse.json(SKIN_TYPES)),
];
