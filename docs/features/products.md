# Products

Status: Implemented

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

None.

---

## Implemented

**Slice 1: list and row actions**

- `src/features/products/schemas/product-filters.schema.ts` — `?q`, `brand`,
  `category` (UUIDs), `published` (`yes`/`no`), `stock` (`low`), `on_sale` (`true`),
  `page`; each field falls back on its own.
- `repositories/products.repository.ts` — `listProducts` maps them to `search`,
  `brand`, `category`, `is_published`, `low_stock=true`, `on_sale=true`,
  `ordering=name`, `limit` 25, `offset`; `getProduct`, `createProduct`,
  `updateProduct`, `deleteProduct`, each parsed with Zod (`product.schema.ts`, which
  already describes variants and images).
- `queries/products.queries.ts` — `productKeys`; `productQueries.list` (`volatile`,
  `keepPreviousData`) and `.detail` (`volatile`).
- `queries/products.mutations.ts` — `useSaveProduct` (writes the returned product
  into its detail key), `useSetPublished` (optimistic in every cached list, rolled
  back and refetched on failure), `useDeleteProduct`; both save and delete
  invalidate product lists and every taxonomy list (their counts).
- `components/products-list.tsx`, `product-filters.tsx` (search and five selects),
  `products-table.tsx` (thumbnail, name and slug linked, brand, category, price,
  variants, stock with `Out` at 0, Published/Draft, an `info` On sale badge),
  `product-row-actions.tsx` (Edit, Publish/Unpublish, Delete; a delete `409` toasts
  with **Unpublish instead** for a published product).
- `src/routes/_dashboard/products/index.tsx` — awaits the brand and category lists
  (filter options), starts the product list without awaiting.
- `src/config/navigation.ts` — **Catalogue → Products**.
- Taxonomy saves and deletes, and order moves, now invalidate `productKeys.all`.

**Slice 2: Details**

- `schemas/product-form.schema.ts`, `product-body.ts` — base price as a decimal
  string (`MONEY_PATTERN` in `src/lib/money.ts`), brand and category required, skin
  feel ≤ 200; a blank slug is left out; `skin_type_ids` is always sent (PATCH
  replaces the set).
- `components/product-form.tsx` — create and edit: name, slug, brand, category
  (children as "Parent › Child"), base price in an `Rs` group, sort order,
  description, skin types (`multi-select-field.tsx`: `popover` + `command` +
  `checkbox`, the choice as badges), skin feel, key ingredients, Published.
  `product_has_no_variants` lands on the Published switch; field errors go under
  their fields (`showApiError`); a save `409` is a form alert.
- `components/product-detail.tsx` — the edit page.
- `src/routes/_dashboard/products/new.tsx` (opens the product once created) and
  `$productId.tsx` (awaits the product and the brand, category and skin-type lists;
  `not_found` renders the not-found page).
- Shared, built here: `src/components/form/` (`TextField` with an optional prefix,
  `TextareaField`, `SwitchField`, `showApiError`), now also used by taxonomy; shadcn
  `command` and `checkbox`.

**Slice 3: Variants**

- `schemas/product-tab.schema.ts` — `?tab=details|variants` on
  `/products/$productId`; `product-detail.tsx` renders the tabs and the route writes
  the tab with `replace`. `/products/new` opens the new product on `?tab=variants`.
- `schemas/variant-form.schema.ts`, `variant-body.ts` — SKU (≤ 64), size required,
  shade or none, opening stock a whole number ≥ 0, price override and compare-at
  empty or a decimal string. A blank amount is sent as `null`; `stock_quantity` is
  sent only for a new variant (an absolute count on a saved one could overwrite a
  sale made meanwhile).
- `repositories/products.repository.ts` — `createVariant`, `updateVariant`,
  `deleteVariant`; `queries/products.mutations.ts` — `useSaveVariant`,
  `useDeleteVariant`, invalidating the product, product lists, every taxonomy list
  (size and shade counts) and the dashboard (low stock).
- `components/variants-editor.tsx`, `variant-row.tsx` — a table where each row is
  its own form (`values` keeps a saved row in step after the refetch): SKU, size,
  shade (swatches or "No shade"), stock (an input only on a draft), price (the base
  price as placeholder), compare-at ([sale-prices.md](sale-prices.md): placeholder,
  discount badge, prices above 0). **Save** is enabled only when a saved row
  changed. Drafts are added and discarded locally; a saved variant is deleted after
  a confirm. Every cell is labelled with the variant ("Price override of
  LUM-SF-30-WB").
  A save `409` reads "Another variant already has this SKU, or this size and shade."
  under the row; a delete `409` toasts that the variant has been ordered.
- `src/features/dashboard/components/low-stock-table.tsx` — the product name links
  to `/products/$productId?tab=variants`.

**Slice 4: Images**

- `?tab=images` (`PRODUCT_TAB_SCHEMA`); `components/images-manager.tsx` and
  `image-card.tsx`.
- Upload: several files at once, each checked first against `IMAGE_FILE_SCHEMA`
  (`src/lib/image-upload.ts`, shared with brand logos: JPEG/PNG/WebP, ≤ 5 MB; a
  rejected file is toasted by name and never sent). `useUploadImages` sends one
  multipart request per file, in sequence; the first becomes primary when the
  product has none. A failure shows as an alert above the grid, and the product is
  refetched, because files sent before it are kept.
- Each card: the image with the API's `alt_text` (`alt=""` when empty), a Primary
  badge, alt text with **Save** (optimistic, rolled back and refetched on failure),
  move earlier/later (optimistic; `image-order.ts` renumbers from the displayed order
  and PATCHes only the images whose `sort_order` changed, in sequence), **Primary**
  (not optimistic: the API demotes the old primary in the same step) and delete after
  a confirm. Buttons are labelled with the position ("Move image 2 earlier").
- Image changes invalidate the product and the product lists (thumbnails).
- `e2e/products.spec.ts` — create, add a variant, upload an image, publish, find it in
  the list, delete it (against the live API, skipped without staff credentials).

---

## Remaining

- `e2e/products.spec.ts` has not been run against the live API (see
  [staff-auth.md](staff-auth.md#remaining)).
- Product images in development: as for logos, the back-end is to return absolute
  URLs ([taxonomy.md](taxonomy.md#remaining)).

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

- `schemas/product-filters.schema.test.ts` — known values kept, the rest dropped.
- `components/products-list.test.tsx` — price, stock (`Out`), Draft and On sale;
  the URL's filters reach the API in its terms (`is_published`, `low_stock`,
  `on_sale`, `ordering=name`, `limit`, `offset`); the empty states; a publish shows
  at once and is put back on `product_has_no_variants`; a delete `409` offers
  **Unpublish instead**, which sends `{ is_published: false }`.
- `components/product-form.test.tsx` — brand, category and price are required before
  anything is sent; create sends the documented body without a blank slug and opens
  the product; edit starts from the saved product and sends the whole skin-type set;
  `product_has_no_variants` lands on Published; an API field error lands on its
  field; an unknown id shows not-found.
- `variant-body.test.ts` — blank prices are `null`; stock only for a new variant;
  price and stock rules.
- `components/variants-editor.test.tsx` — the tab comes from and goes back to the
  URL; a saved variant's stock is read-only and **Save** waits for a change, then
  sends no stock and a cleared price as `null`; a draft is added with its opening
  stock and replaced by the saved row; a draft is discarded without a request; a
  save `409` is explained on the row; a delete needs the confirmation and a `409`
  keeps the row.
- `image-order.test.ts` — a move renumbers from the new position and reports only
  the changed images, including colliding stored numbers.
- `components/images-manager.test.tsx` — uploads go one at a time, the first primary
  when there is none; a GIF is refused without a request; new alt text shows at once
  and is put back on failure; a move shows at once and sends only the changed
  numbers, in order; **Primary** sends `is_primary` and shows the API's answer; a
  delete needs the confirmation.

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
