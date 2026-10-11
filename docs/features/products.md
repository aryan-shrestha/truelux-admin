# Products

Status: Planned

Last updated: 2026-10-11

---

## Goal

Let the merchant create, edit, stock and publish products, including variants and
images.

---

## Scope

What is included in this implementation?

- `/products`: a server-paginated `DataTable`
  - columns: image thumbnail, name and slug (linked), brand, category, base price,
    variant count, total stock (`Out` at 0), and a Published/Draft `badge`
  - filters for search (name or SKU), brand, category, published, low stock and on
    sale, all in the URL
  - row actions: Edit, Publish/Unpublish, Delete
- `/products/new` and `/products/$productId`: `tabs` for **Details**, **Variants** and
  **Images**, with the tab in `?tab=`
  - Details: name, slug, description, brand, category, base price, sort order, skin
    types (a multi-select of `popover` + `command` with `checkbox`es, the choice shown
    as `badge`s), skin feel, key ingredients, published `switch`
  - Variants: an editable `table` of SKU, size, shade (with swatches, or "No shade"),
    stock, price override and compare-at price ([sale-prices.md](sale-prices.md)).
    Stock is an input only on a new row; a saved variant changes stock through
    [stock-ledger.md](stock-ledger.md). Rows are added, and removed after a confirm.
  - Images: upload (several, ≤ 5 MB each, JPEG/PNG/WebP), a grid with alt-text
    editing, make primary, move earlier/later, delete after a confirm
- Publishing without variants shows `422 product_has_no_variants` on the Published
  field
- Deleting an ordered product shows the 409 with **Unpublish instead**

What is explicitly outside the scope?

- Bulk edit, import or export
- Sortable column headers (ordering stays `name`; the API allows more)

---

## Context

- Requirements ported from `../admin/docs/features/products.md` (Implemented there).
- API: `back-end/docs/features/admin-api.md` § Products and `skin-types.md` § Admin.
  The list item omits description, skin types, care details, variants and images,
  and adds `variant_count`, `total_stock`, `on_sale` and `primary_image_url`.
  `skin_type_ids` on PATCH replaces the whole set.
- Uploads go from the browser to the API as `multipart/form-data`.
- Freshness `volatile` ([tanstack-query.md](tanstack-query.md)): stock moves with
  storefront orders.
- Depends on [taxonomy.md](taxonomy.md) for the brand, category, size, shade and skin
  type options.

---

## Planned

- Link the dashboard's low-stock product name to `/products/$productId?tab=variants`
  in `src/features/dashboard/components/low-stock-table.tsx`; it is plain text until
  this route exists ([dashboard.md](dashboard.md)).
- Add `productKeys.all` to `useSaveTaxonomy` and `useDeleteTaxonomy`'s
  `meta.invalidates` (`src/features/taxonomy/queries/taxonomy.mutations.ts`):
  products show taxonomy names. Read the pickers' options from `taxonomyQueries.list`.
- Add `productKeys.all` to `useTransitionOrder`'s `meta.invalidates`
  (`src/features/orders/queries/orders.mutations.ts`): a cancel puts stock back.
- `src/features/products/` — `products.repository.ts` (products, variants, images),
  `product.schema.ts`, `variant.schema.ts`, `image.schema.ts`, `products.queries.ts`
  (`productKeys`, `productQueries.list(filters)`, `.detail(id)`),
  `products.mutations.ts`, and components: `products-table`, `product-row-actions`,
  `product-details-form`, `variants-editor`, `variant-row`, `images-manager`,
  `image-card`, `multi-select-field`.
- `src/routes/_dashboard/products/index.tsx` — `validateSearch`: `q`, `brand`,
  `category`, `published` (`yes`/`no`), `stock` (`low`), `on_sale` (`true`), `page`;
  unknown values dropped. Maps to `search`, `brand`, `category`, `is_published`,
  `low_stock=true`, `on_sale=true`, `limit` 25, `offset`, `ordering=name`.
- `new.tsx` — the Details form alone; on success navigate to
  `/products/{id}?tab=variants`.
- `$productId.tsx` — loader ensures the product and the five taxonomy lists in
  parallel; `not_found` renders the not-found page.
- Details form: base price in an `Rs` input group as a decimal string; skin types sent
  as `skin_type_ids`, the whole set every save; `skin_feel` ≤ 200 characters.
- Variants: each row is its own form; **Save** is enabled only when the row changed
  and never sends `stock_quantity` for a saved variant; a blank price override or
  compare-at is sent as `null`. Every cell input has an `aria-label` naming the
  variant ("Stock of LUM-SF-30-WB").
- Images: validated in the browser and by the API; one request per file in sequence;
  the first image becomes primary when none is. Reordering renumbers `sort_order`
  from the displayed order and PATCHes only the images that changed. Reorder and alt
  text are optimistic and roll back on failure. Reorder buttons are labelled with the
  position; images carry the API's `alt_text` (`alt=""` when empty).
- Publish/Unpublish in the list is optimistic and rolls back if the API refuses.
- List state follows the list-state rules in [tanstack-query.md](tanstack-query.md#rules-for-features)
  (URL filters with `replace`, `Link` pagination, `keepPreviousData`).
- Optimistic updates are limited to what those rules allow: image order, alt text and
  the list's publish toggle.
- Mutations name their stale keys in `meta.invalidates` from the rules' table
  (product, variant and image rows).
- `src/config/navigation.ts` — **Catalogue → Products**, first in the group; from
  [app-shell.md](app-shell.md).
- Deletes confirm with the shared `ConfirmDialog`; an empty list shows the shared
  `EmptyState` (both built with [orders.md](orders.md)).
- Add shadcn `tabs`, `select`, `switch`, `textarea`, `popover`, `command`,
  `checkbox`, `input-group` when building.

Error treatment:

| `code`                      | Treatment                                                       |
| --------------------------- | --------------------------------------------------------------- |
| `product_has_no_variants`   | Inline on the Published switch                                  |
| `conflict` (product delete) | Toast with **Unpublish instead** when it is published           |
| `conflict` (variant delete) | "…has been ordered… Set its stock to 0 instead."                |
| `conflict` (save)           | "This duplicates an existing record…" as a form alert           |
| `validation_error`          | Field messages from `details`, the rest as a form alert         |
| `unsupported_media_type`    | Form alert on the upload (a non-multipart body reached the API) |
| `not_found` (read)          | The not-found page                                              |

Planned tests: schemas (prices as decimal strings, bad prices rejected, brand and
category required, a blank override is `null`, stock a non-negative integer, skin
feel capped at 200, image type and size limits); URL ↔ API query mapping; filters
write the URL, keep other filters and drop `page`; adding and discarding a draft
variant; a saved variant is deleted only after the confirm and its stock is
read-only; skin type badges and toggling; an upload leaves as
`multipart/form-data; boundary=…`; reorder renumbers colliding orders; optimistic
publish rolls back on `product_has_no_variants`; Playwright: create, add a variant,
upload an image, choose skin types, publish, find it in the list, delete it.

---

## Implemented

None.

---

## Remaining

- Everything in Planned.
- Decide how relative image URLs are shown in development (see Gotchas).

---

## Decisions

### Decision: reordering renumbers from the displayed order

**Decision**

Moving an image computes the new order and PATCHes `sort_order` = position for each
image whose value changed.

**Reason**

Carried over from `../admin`: stored orders can collide (several `0`s), so swapping
two values would do nothing.

**Consequence**

A move is one to N PATCH calls, in sequence.

---

## Gotchas

- Image and thumbnail URLs are relative (`/media/…`) when the API stores files
  locally (development) and absolute on Cloudinary; see
  [taxonomy.md](taxonomy.md#gotchas).
- In the browser, Axios sets the multipart `Content-Type` with its boundary for a
  `FormData` body. Do not set it by hand.
- `price_override` and `compare_at_price` are `string | null` both ways.
- A `409 conflict` on save means a taken slug or SKU, or a second variant with the
  same size and shade.
- The combobox's `checkbox` is `tabIndex={-1}` with no pointer events; the `command`
  item is what the keyboard and mouse toggle.

---

## API

```text
GET    /api/v1/admin/products/                 paginated
POST   /api/v1/admin/products/
GET    /api/v1/admin/products/{id}/
PATCH  /api/v1/admin/products/{id}/
DELETE /api/v1/admin/products/{id}/
POST   /api/v1/admin/products/{id}/variants/
PATCH  /api/v1/admin/variants/{id}/
DELETE /api/v1/admin/variants/{id}/
POST   /api/v1/admin/products/{id}/images/     multipart
PATCH  /api/v1/admin/images/{id}/
DELETE /api/v1/admin/images/{id}/
```

Shapes: `back-end/docs/features/admin-api.md` § Products.

---

## Data changes

- Query keys `["products", "list", filters]`, `["products", "detail", id]`.
- URL: list filters and `page`; the editor's `tab`.

---

## Permissions

Signed-in staff (the API).

---

## Tests

None yet; see Planned.

---

## Files

```text
src/features/products/              planned
src/routes/_dashboard/products/     planned
```

---

## Future context

`../admin/components/products/` and `lib/products/` are the reference for the variant
row forms and the image manager.
