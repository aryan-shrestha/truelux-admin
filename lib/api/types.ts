export type Money = string;

export type Page<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type TokenPair = {
  access: string;
  refresh: string;
};

export type StaffUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderListItem = {
  id: string;
  order_number: string;
  status: OrderStatus;
  full_name: string;
  phone: string;
  total: Money;
  item_count: number;
  created_at: string;
};

export type OrderLine = {
  product_name: string;
  sku: string;
  variant_size: string;
  variant_shade: string;
  quantity: number;
  unit_price: Money;
  line_total: Money;
};

export type OrderDetail = OrderListItem & {
  email: string;
  address_line: string;
  city: string;
  district: string;
  note: string;
  subtotal: Money;
  shipping_fee: Money;
  payment_method: string;
  allowed_transitions: OrderStatus[];
  items: OrderLine[];
};

export type OrderQuery = {
  status?: OrderStatus[];
  search?: string;
  created_after?: string;
  created_before?: string;
  limit: number;
  offset: number;
};

export type SalesDay = {
  date: string;
  orders: number;
  revenue: Money;
};

export type LowStockVariant = {
  variant_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  size: string;
  shade: string | null;
  stock_quantity: number;
};

export type Dashboard = {
  orders_by_status: Record<OrderStatus, number>;
  revenue: { today: Money; last_7_days: Money; last_30_days: Money };
  sales_by_day: SalesDay[];
  recent_orders: OrderListItem[];
  low_stock: LowStockVariant[];
};

export type Ref = {
  id: string;
  name: string;
  slug: string;
};

export type Variant = {
  id: string;
  sku: string;
  size: { id: string; name: string };
  shade: { id: string; name: string; hex_code: string } | null;
  stock_quantity: number;
  price_override: Money | null;
  price: Money;
};

export type ProductImage = {
  id: string;
  url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: Ref;
  category: Ref;
  base_price: Money;
  is_published: boolean;
  sort_order: number;
  variants: Variant[];
  images: ProductImage[];
  created_at: string;
  updated_at: string;
};

export type ProductListItem = Omit<Product, "description" | "variants" | "images"> & {
  variant_count: number;
  total_stock: number;
  primary_image_url: string | null;
};

export type ProductOrdering = "name" | "base_price" | "created_at";

export type ProductQuery = {
  search?: string;
  brand?: string;
  category?: string;
  is_published?: boolean;
  low_stock?: boolean;
  ordering?: ProductOrdering | `-${ProductOrdering}`;
  limit: number;
  offset: number;
};

export type ProductWrite = {
  name: string;
  slug?: string;
  description: string;
  brand_id: string;
  category_id: string;
  base_price: Money;
  is_published: boolean;
  sort_order: number;
};

export type VariantWrite = {
  sku: string;
  size_id: string;
  shade_id: string | null;
  stock_quantity: number;
  price_override: Money | null;
};

export type ImageUpdate = Partial<Pick<ProductImage, "alt_text" | "sort_order" | "is_primary">>;

export type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  is_active: boolean;
  sort_order: number;
  product_count: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  product_count: number;
};

export type Shade = {
  id: string;
  name: string;
  slug: string;
  hex_code: string;
  sort_order: number;
  variant_count: number;
};

export type Size = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  variant_count: number;
};

export type Taxonomy = {
  brands: Brand;
  categories: Category;
  shades: Shade;
  sizes: Size;
};

export type TaxonomyKind = keyof Taxonomy;
