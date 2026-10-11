# Products

Status: In progress

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

Built in four slices. Slices 1 (list) and 2 (Details) are implemented; these remain:

**Slice 3: Variants**

- `tabs` on `/products/$productId` for **Details**, **Variants** and **Images**, the
  tab in `?tab=` (validated); `/products/new` then opens the new product on
  `?tab=variants`.
- Link the dashboard's low-stock product name to `/products/$productId?tab=variants`
  in `src/features/dashboard/components/low-stock-table.tsx` (plain text until then;
  [dashboard.md](dashboard.md)).
- An editable `table`, each row its own form: SKU, size, shade (swatches, or "No
  shade"), stock, price override and compare-at price
  ([sale-prices.md](sale-prices.md)). **Save** is enabled only when the row changed
  and never sends `stock_quantity` for a saved variant (stock changes through
  [stock-ledger.md](stock-ledger.md)); a blank price override or compare-at is sent
  as `null`. Every cell input has an `aria-label` naming the variant ("Stock of
  LUM-SF-30-WB"). Rows are added as drafts and removed after a confirm.
- `POST products/{id}/variants/`, `PATCH`/`DELETE variants/{id}/`; each invalidates
  the product, product lists, the taxonomy lists and the dashboard (low stock).

**Slice 4: Images**

- Upload several (JPEG/PNG/WebP, ≤ 5 MB each), validated in the browser and by the
  API; one request per file, in sequence; the first image becomes primary when none
  is.
- A grid with alt text (optimistic, rolled back on failure), make primary (not
  optimistic: the API clears the old primary), move earlier/later (renumbers
  `sort_order` from the displayed order and PATCHes only the images that changed;
  optimistic), delete after a confirm. Reorder buttons are labelled with the
  position; images carry the API's `alt_text` (`alt=""` when empty).

Error treatment still to build:

| `code`                      | Treatment                                                       |
| --------------------------- | --------------------------------------------------------------- |
| `conflict` (variant delete) | "…has been ordered… Set its stock to 0 instead."                |
| `conflict` (variant save)   | A taken SKU, or a second variant with the same size and shade   |
| `unsupported_media_type`    | Form alert on the upload (a non-multipart body reached the API) |

Planned tests: a blank override is `null`; stock a non-negative integer; adding and
discarding a draft variant; a saved variant is deleted only after the confirm and its
stock is read-only; an upload leaves as `multipart/form-data; boundary=…`; reorder
renumbers colliding orders; Playwright: create, add a variant, upload an image,
choose skin types, publish, find it in the list, delete it.

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

---

## Remaining

- Slices 3 (Variants) and 4 (Images) in Planned, with the `?tab=` tabs and the
  dashboard's low-stock link.
- The stock history keys join `useTransitionOrder`'s and the variant mutations'
  `meta.invalidates` with [stock-ledger.md](stock-ledger.md).
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
