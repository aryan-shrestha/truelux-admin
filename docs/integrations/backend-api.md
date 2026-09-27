# Admin API

Status: Reference

Last updated: 2026-09-27

---

## About this document

This is a transcription of the contract published by the **backend repository**
(`truelux/back-end`), so that admin code is written against a fixed document rather
than a recollection of one.

**The backend repository is authoritative.** If this file and `back-end/docs/`
disagree, the backend is right and this file is stale. Fix it here; do not work
around it in `lib/api`.

This document records **what the API does**. What the admin does about it belongs to
[ADR 0001](../decisions/0001-auth-is-a-backend-for-frontend.md),
[architecture.md](../architecture.md#error-handling) and the feature documents.

Transcribed from:

```text
back-end/docs/features/staff-auth.md         Implemented
back-end/docs/features/admin-api.md          Implemented
back-end/docs/features/skin-types.md         the admin part of it
back-end/docs/architecture.md                error envelope
back-end/docs/features/catalog-browsing.md   pagination envelope
back-end/apps/backoffice/serializers.py      field names the docs leave implicit
back-end/docs/features/checkout-quote-and-shipping.md   shipping settings (Planned there)
```

Checked against the running API on 2026-09-26 (`yarn e2e`, and the responses read
directly).

---

## Base URL and versioning

```text
{API_BASE_URL}/api/v1/...
```

Local development: `http://localhost:8000/api/v1/`. `API_BASE_URL` is the origin
only; `lib/api/client.ts` appends `/api/v1`.

Every route ends in a **trailing slash**. Django redirects one that does not, and the
redirect turns a `POST` into a `GET`. `lib/api/client.ts` refuses a path without one.

`/api/v1/` responses are promised to stay backward compatible; a breaking change
arrives as `/api/v2/`. The Django admin lives at `/django-admin/`, not `/admin/`.

---

## Authentication

SimpleJWT, staff only. The admin calls these **from its server only**, so the API
needs no CORS entry for the admin origin.

| Token   | Lifetime   | Setting                             |
| ------- | ---------- | ----------------------------------- |
| access  | 15 minutes | `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` |
| refresh | 7 days     | `JWT_REFRESH_TOKEN_LIFETIME_DAYS`   |

Refresh tokens **rotate**, and the old one is **blacklisted** at once. Reusing it is
a 401.

### `POST /api/v1/auth/token/`

```json
{ "email": "staff@truelux.com", "password": "..." }
```

`200 { "access": "<jwt>", "refresh": "<jwt>" }`.

`401 authentication_failed` for a wrong password, an unknown email, an inactive user
or a non-staff user — one byte-identical body for all four. Throttled under the
`auth` scope (`DJANGO_THROTTLE_AUTH`, `10/minute` in the blueprint): `429 throttled`.

### `POST /api/v1/auth/token/refresh/`

`{ "refresh": "<jwt>" }` → `200 { "access": "<jwt>", "refresh": "<jwt>" }`.

- Blacklisted, expired or de-staffed refresh token: `401 authentication_failed`.
- Refresh token whose user row was deleted: `404 not_found`.
- Throttled under `auth`: `429 throttled`.

### `POST /api/v1/auth/logout/`

Bearer access token required. `{ "refresh": "<jwt>" }` → `204`; blacklists it.

A malformed, expired, revoked or another user's refresh token:
`422 invalid_refresh_token`.

### `GET /api/v1/auth/me/`

Bearer access token, staff required.

```json
{ "id": "uuid", "email": "staff@truelux.com", "first_name": "Asha", "last_name": "Rai" }
```

### Staff rights and access tokens

`JWTAuthentication` does **not** re-check staff status: a de-staffed user's access
token still authenticates until it expires and then gets `403 permission_denied`
from `IsAdminUser`. Only obtain and refresh consult the staff rule.

---

## Admin routes

All under `/api/v1/admin/`. Every route: JWT only, `IsAuthenticated` +
`IsAdminUser` (anonymous `401`, non-staff `403`), throttle scope `admin`
(`DJANGO_THROTTLE_ADMIN`, `2000/hour`).

IDs are UUIDs. Money is a decimal string. Lists marked _paginated_ use the envelope
below; taxonomy lists are **bare arrays**.

### `GET dashboard/`

```json
{
  "orders_by_status": {
    "pending": 4,
    "confirmed": 2,
    "shipped": 3,
    "delivered": 40,
    "cancelled": 1
  },
  "revenue": { "today": "5400.00", "last_7_days": "48200.00", "last_30_days": "190350.00" },
  "sales_by_day": [{ "date": "2026-09-01", "orders": 3, "revenue": "9600.00" }],
  "recent_orders": [/* 5 × order list item */],
  "low_stock": [
    {
      "variant_id": "uuid",
      "product_id": "uuid",
      "product_name": "Silk Foundation",
      "sku": "LUM-SF-30-WB",
      "size": "30 ml",
      "shade": "Warm Beige",
      "stock_quantity": 2
    }
  ]
}
```

- Revenue sums `total` of orders not `cancelled`, bucketed by `created_at` in
  `Asia/Kathmandu`.
- `sales_by_day`: 30 entries, oldest first, zero-filled.
- `low_stock`: variants with `stock_quantity <= 5`, lowest first, at most 10.

### Products

| Method | Path                      | Notes                                                                                                                                                   |
| ------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `products/`               | paginated. `search` (name, SKU), `brand` (id), `category` (id), `is_published`, `low_stock=true`, `ordering` (`name`, `base_price`, `created_at`, `-…`) |
| POST   | `products/`               | creates; variants and images come after                                                                                                                 |
| GET    | `products/{id}/`          | full representation                                                                                                                                     |
| PATCH  | `products/{id}/`          | any writable field                                                                                                                                      |
| DELETE | `products/{id}/`          | `204`; `409 conflict` if any variant was ordered                                                                                                        |
| POST   | `products/{id}/variants/` | adds a variant                                                                                                                                          |
| PATCH  | `variants/{id}/`          | `sku`, `size_id`, `shade_id`, `price_override`, `stock_quantity`                                                                                        |
| DELETE | `variants/{id}/`          | `409` if ordered                                                                                                                                        |
| POST   | `products/{id}/images/`   | `multipart/form-data`: `image` (≤ 5 MB, jpeg/png/webp), `alt_text`, `is_primary`                                                                        |
| PATCH  | `images/{id}/`            | `alt_text`, `sort_order`, `is_primary` (promoting clears the old primary)                                                                               |
| DELETE | `images/{id}/`            | `204`                                                                                                                                                   |

Product:

```json
{
  "id": "uuid",
  "name": "Silk Foundation",
  "slug": "silk-foundation",
  "description": "…",
  "brand": { "id": "uuid", "name": "Lumière", "slug": "lumiere" },
  "category": { "id": "uuid", "name": "Face", "slug": "face" },
  "base_price": "3200.00",
  "is_published": true,
  "sort_order": 0,
  "skin_types": [{ "id": "uuid", "name": "Combination", "slug": "combination" }],
  "skin_feel": "Soothed, balanced, refreshed",
  "key_ingredients": "Water (Aqua), Niacinamide",
  "variants": [
    {
      "id": "uuid",
      "sku": "LUM-SF-30-WB",
      "size": { "id": "uuid", "name": "30 ml" },
      "shade": { "id": "uuid", "name": "Warm Beige", "hex_code": "#D8A47F" },
      "stock_quantity": 12,
      "price_override": null,
      "price": "3200.00"
    }
  ],
  "images": [
    {
      "id": "uuid",
      "url": "https://res.cloudinary.com/…",
      "alt_text": "…",
      "sort_order": 0,
      "is_primary": true
    }
  ],
  "created_at": "2026-09-25T10:00:00Z",
  "updated_at": "2026-09-25T10:00:00Z"
}
```

List items omit `description`, `skin_types`, `skin_feel`, `key_ingredients`,
`variants` and `images` and add `variant_count`, `total_stock` and
`primary_image_url`. `shade` is `null` for a shadeless variant; `price` is the
resolved price. `skin_types` is `[]` and the two strings `""` when unset.

Write bodies:

```text
product  name, slug (optional; derived and made unique), description, brand_id,
         category_id, base_price, is_published, sort_order, skin_type_ids (uuid[];
         replaces the whole set, [] clears it), skin_feel (<= 200), key_ingredients
variant  sku, size_id, shade_id (nullable), stock_quantity (>= 0),
         price_override (nullable, > 0)
```

Publishing a product with no variants: `422 product_has_no_variants`. Creating one
with `is_published: false` is accepted.

### Media URLs

Image `url`, `primary_image_url` and brand `logo_url` are **relative** (`/media/…`)
when the API stores files locally, and **absolute** (`https://res.cloudinary.com/…`)
on Cloudinary. `lib/api/media.ts#mediaUrl` resolves both against `API_BASE_URL`; the
product and taxonomy readers apply it, so nothing outside `lib/api` sees a relative
URL.

### Taxonomy: brands, categories, shades, sizes, skin types

| Method        | Path                                                                                  |
| ------------- | ------------------------------------------------------------------------------------- |
| GET, POST     | `brands/`, `categories/`, `shades/`, `sizes/`, `skin-types/`                          |
| PATCH, DELETE | `brands/{id}/`, `categories/{id}/`, `shades/{id}/`, `sizes/{id}/`, `skin-types/{id}/` |

GETs return bare arrays and include inactive brands. Each item has `id`, its model
fields, and `product_count` (brands, categories, skin types) or `variant_count`
(shades, sizes). `slug` is optional on write. Deleting a referenced brand,
category, shade or size: `409 conflict`. Deleting a skin type **detaches it from
its products** and is always `204`.

| Kind      | Read fields                                                                      |
| --------- | -------------------------------------------------------------------------------- |
| brand     | `name`, `slug`, `description`, `logo_url` (or `null`), `is_active`, `sort_order` |
| category  | `name`, `slug`, `parent_id` (uuid or `null`; one level), `sort_order`            |
| shade     | `name`, `slug`, `hex_code` (`^#[0-9A-Fa-f]{6}$`), `sort_order`                   |
| size      | `name`, `slug`, `sort_order`                                                     |
| skin type | `name` (≤ 50, unique), `slug`, `sort_order`                                      |

A brand `logo` is uploaded as `multipart/form-data` on POST or PATCH. Category
writes take `parent_id`; a cycle is `400 validation_error` with
`details.parent_id`.

### Orders

| Method | Path                      | Notes                                                                                                                        |
| ------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| GET    | `orders/`                 | paginated. `status` (repeatable), `search` (order number, name, email, phone), `created_after`, `created_before` (ISO dates) |
| GET    | `orders/{id}/`            | detail                                                                                                                       |
| POST   | `orders/{id}/transition/` | `{ "to": "confirmed" \| "shipped" \| "delivered" \| "cancelled" }`                                                           |

List item:

```json
{
  "id": "uuid",
  "order_number": "TL-2026-000123",
  "status": "pending",
  "full_name": "Sita Sharma",
  "phone": "98XXXXXXXX",
  "total": "5400.00",
  "item_count": 2,
  "created_at": "…"
}
```

Detail adds `email`, `address_line`, `city`, `district`, `note`, `subtotal`,
`shipping_fee`, `payment_method`, `allowed_transitions` (statuses), and `items`
(`product_name`, `sku`, `variant_size`, `variant_shade`, `quantity`, `unit_price`,
`line_total`). `variant_shade` is `""` for a shadeless line.

- `order_number` is `TL-<year>-<6 digits>`; the sequence has gaps.
- `item_count` is the number of **units** (the sum of line quantities), not lines.
- `created_after` and `created_before` are inclusive and compare the **UTC date**
  of `created_at` (`created_at__date`, `TIME_ZONE = "UTC"`).
- `payment_method` is only ever `"cod"` (`PaymentMethod.COD`).

Flow (cash on delivery): `pending → confirmed → shipped → delivered`, `cancelled`
from `pending` or `confirmed`. Cancelling restores stock.

Transition errors: `422 invalid_status_transition`, `order_already_shipped`,
`order_not_cancellable`.

### Shipping settings

| Method     | Path                 |
| ---------- | -------------------- |
| GET, PATCH | `settings/shipping/` |

A singleton; there is no id and no create or delete.

```json
{
  "inside_valley_fee": "150.00",
  "outside_valley_fee": "250.00",
  "free_shipping_threshold": "8000.00",
  "updated_at": "…"
}
```

- `free_shipping_threshold` is `null` when there is no free shipping. PATCH takes the
  three amounts (not `updated_at`) and returns the whole object.
- Both fees must be ≥ 0 and the threshold > 0 or `null`, otherwise
  `400 validation_error` with `details` keyed by field. No domain code.
- The inside-valley fee applies to the districts Kathmandu, Lalitpur and Bhaktapur
  (`KATHMANDU_VALLEY_DISTRICTS`, fixed in the backend's code).
- A change applies to the next order; placed orders keep their stored
  `shipping_fee`. The storefront reads the public `GET /api/v1/shipping/`
  (cacheable), so its copy can lag a save.

---

## Pagination

`LimitOffsetPagination`: `default_limit = 25`, `max_limit = 100`.

```json
{ "count": 42, "next": "http://…?limit=25&offset=25", "previous": null, "results": [] }
```

`next` and `previous` carry the host the API saw; the admin recomputes
`limit`/`offset` instead of following them.

---

## Error envelope

Every failure, including a 500:

```json
{ "error": { "code": "validation_error", "message": "…", "details": { "email": ["…"] } } }
```

**`code` is the contract**; `message` may be reworded at any time. Every response
carries `X-Request-ID`.

A `409 conflict` always has `details: {}`: it is any database integrity error,
both a protected delete (a referenced brand, category, shade, size, or an ordered
product or variant) and a unique violation on a create or update (a taken name,
slug or SKU, or a second variant with the same size and shade).

| Condition                             | Status    | `code`                   |
| ------------------------------------- | --------- | ------------------------ |
| Body was not valid JSON               | 400       | `parse_error`            |
| Field or serializer validation failed | 400       | `validation_error`       |
| Missing or invalid credentials        | 401       | `authentication_failed`  |
| Authenticated but not permitted       | 403       | `permission_denied`      |
| Absent, or not visible to the caller  | 404       | `not_found`              |
| Method not allowed                    | 405       | `method_not_allowed`     |
| No representation for `Accept`        | 406       | `not_acceptable`         |
| Write conflicted with a constraint    | 409       | `conflict`               |
| `Content-Type` not supported          | 415       | `unsupported_media_type` |
| A business rule rejected the request  | 422       | the domain code, below   |
| Rate limited                          | 429       | `throttled`              |
| Anything unhandled                    | 500       | `server_error`           |
| Any other DRF exception               | as raised | `error`                  |

### Domain codes (422) the admin can receive

| Code                        | Raised by                      |
| --------------------------- | ------------------------------ |
| `invalid_refresh_token`     | `POST auth/logout/`            |
| `product_has_no_variants`   | publishing a product           |
| `invalid_status_transition` | `POST orders/{id}/transition/` |
| `order_already_shipped`     | `POST orders/{id}/transition/` |
| `order_not_cancellable`     | `POST orders/{id}/transition/` |

---

## Money

Every amount is a decimal string with two places (`"4500.00"`); the currency is NPR
and implicit. See [ADR 0003](../decisions/0003-money-is-a-decimal-string-end-to-end.md).

---

## Open questions

Everything the admin assumed while `admin-api.md` was a plan has been confirmed
against the implemented backend. Two behaviours are worth raising with it:

| Question                                                                                                                                                                            | Current behaviour                                                                            | Where it matters                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Should `created_after`/`created_before` compare the `Asia/Kathmandu` date, as the dashboard's revenue buckets already do?                                                           | UTC date, so a date-filtered list misses orders placed 00:00–05:45 in Nepal on its first day | dashboard KPI links, orders date filter                                 |
| Could a just-rotated refresh token be accepted again for a few seconds (a reuse grace period)?                                                                                      | Reuse is a 401 at once, so two tabs refreshing together sign one out                         | two tabs, or a page and a hover prefetch, refreshing at the same moment |
| The shipping settings contract is written from the backend's plan, built in parallel. Confirm the field names and error codes once `checkout-quote-and-shipping.md` is Implemented. | See [Shipping settings](#shipping-settings)                                                  | `/settings/shipping`                                                    |
