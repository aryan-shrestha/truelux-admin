# Products

Status: Implemented

Last updated: 2026-09-25

---

## Goal

Let the merchant create, edit, stock and publish products, including variants and
images.

---

## Scope

What is included in this implementation?

- `/products`: a server-paginated `data-table`.
  - Columns: image thumbnail, name, brand, category, price, variants, total stock, and
    a published `badge`.
  - Filters for search, brand, category, published and low stock, all in the URL.
  - Row actions: edit, publish/unpublish, delete.
- `/products/new` and `/products/[id]`: `tabs` for **Details**, **Variants** and
  **Images**.
  - Details: name, slug, description (`textarea`), brand (`select`), category
    (`select`), base price, sort order, and a published `switch`.
  - Variants: an editable `table` of SKU, size (`select`), shade (`select` with
    swatches, or "No shade"), stock (`input` number), and price override. Adds and
    removes rows with a confirm.
  - Images: upload (multiple, ≤ 5 MB, jpeg/png/webp), a grid with alt-text editing,
    set primary, reorder (up/down buttons), and delete.
- Publishing without variants surfaces `422 product_has_no_variants` inline.
- Deleting an ordered product surfaces the 409 and offers "Unpublish instead".

---

## Context

Backend `admin-api.md` § Products. Uploads go browser → admin server action
(`FormData`) → API multipart. The browser never calls the API directly.

---

## Implemented

- `app/(admin)/products/page.tsx` — reads the page of products and the brand and
  category arrays in parallel. The toolbar is `UrlSearch` (`?q=`, name or SKU) and
  four `UrlSelect`s (`?brand=`, `?category=`, `?published=yes|no`, `?stock=low`);
  `TablePagination` pages with `?page=` over `limit`/`offset` (25 a page).
- `components/products/ProductsTable.tsx` — thumbnail (`avatar`), name and slug
  (linked to the editor), brand, category, base price, variant count, total stock
  (`Out` badge at 0), and a Published/Draft `badge`.
- `components/products/ProductRowActions.tsx` — Edit, Publish/Unpublish, Delete. A
  `409 conflict` on delete closes the dialog and toasts "This product has been
  ordered…" with an **Unpublish instead** action when it is published.
- `app/(admin)/products/new/page.tsx` — the details form alone; on success the action
  redirects to `/products/{id}?tab=variants`.
- `app/(admin)/products/[id]/page.tsx` — reads the product and the four taxonomy
  arrays in parallel; `not_found` becomes `notFound()`. `ProductTabs` keeps the tab in
  `?tab=`.
- `components/products/ProductDetailsForm.tsx` — name, slug, description, brand and
  category `select`s, base price (`Rs` input group, decimal string), sort order,
  published `switch`. A `422 product_has_no_variants` is set on the Published field.
- `components/products/VariantsEditor.tsx`, `VariantRow.tsx` — a `table` in which each
  row is its own react-hook-form form: SKU, size, shade (swatch options or "No
  shade"), stock, price override (blank = base price, sent as `null`). **Add variant**
  appends a draft row; a draft is discarded with ✕, a saved variant is deleted after
  an `alert-dialog`. Save is enabled only when the row changed.
- `components/products/ImagesManager.tsx`, `ImageCard.tsx` — multiple upload
  (validated client- and server-side: JPEG/PNG/WebP, ≤ 5 MB), one server action per
  file in sequence, the first image primary when none is; a grid with alt-text
  editing, **Make primary**, move earlier/later, and delete behind a confirm.
- `lib/products/actions.ts` — every product, variant and image mutation, each
  re-validating with zod and revalidating `/products` and the product page.
- `lib/products/schemas.ts`, `lib/products/query.ts` — the schemas and the URL ↔ API
  query mapping.

---

## Remaining

- Not yet exercised against the live API; verified with stubs only.
- `ordering` is fixed to `name`; the table has no sortable headers.
- Vercel limits a function request body to 4.5 MB, below the API's 5 MB image limit,
  so an image between 4.5 and 5 MB fails on Vercel with a platform error.

---

## Decisions

### Decision: uploads pass through a server action as a `File`

**Decision**

The browser passes each `File` to `uploadImage`; the server action builds the
multipart body for `POST products/{id}/images/`.

**Reason**

ADR 0001: the browser never calls the API. React serialises `Blob` arguments.

**Consequence**

`serverActions.bodySizeLimit` is 6 MB. Files go one per request so a batch never
hits the limit.

### Decision: reordering renumbers from the displayed order

**Decision**

Moving an image computes the new order and PATCHes `sort_order` = position for each
image whose value changed.

**Reason**

Stored orders can collide (several `0`s), so swapping two values would do nothing.

**Consequence**

A move is one to N PATCH calls, run in sequence.

---

## Gotchas

- `price_override` is `string | null` in and out of the schema, so the server action
  can parse the client's output again.
- The stock `input` stores `valueAsNumber`; an empty box is `NaN`, which the schema
  rejects with "Enter a whole number."
- Thumbnails and the grid use the API's URLs as given (`next/image` with
  `unoptimized`, `avatar`), so no `remotePatterns` are configured.

---

## Routes

```text
/products          dynamic; ?q ?brand ?category ?published ?stock ?page
/products/new      dynamic
/products/[id]     dynamic; ?tab=details|variants|images
```

---

## API

### Calls

```text
GET    /api/v1/admin/products/                   server, no-store
GET    /api/v1/admin/products/{id}/              server, no-store
POST   /api/v1/admin/products/                   server action
PATCH  /api/v1/admin/products/{id}/              server action
DELETE /api/v1/admin/products/{id}/              server action
POST   /api/v1/admin/products/{id}/variants/     server action
PATCH  /api/v1/admin/variants/{id}/              server action
DELETE /api/v1/admin/variants/{id}/              server action
POST   /api/v1/admin/products/{id}/images/       server action, multipart
PATCH  /api/v1/admin/images/{id}/                server action
DELETE /api/v1/admin/images/{id}/                server action
```

### Errors handled

| `code`                      | Treatment                                               |
| --------------------------- | ------------------------------------------------------- |
| `product_has_no_variants`   | Inline on the Published switch                          |
| `conflict` (product delete) | Toast with **Unpublish instead**                        |
| `conflict` (variant delete) | "…has been ordered… Set its stock to 0 instead."        |
| `validation_error`          | Field messages from `details`, the rest as a form alert |
| `not_found` (read)          | `notFound()`                                            |

---

## State and data

- URL: list filters and page; the editor's `?tab=`.
- React state: draft variant rows, alt-text inputs, pending transitions.

---

## Accessibility

- Every cell input in the variants table has an `aria-label` naming the variant
  ("Stock of LUM-SF-30-WB").
- Image reorder buttons are labelled with the image's position.
- Images carry the API's `alt_text`, `alt=""` when it is empty.

---

## Tests

- `lib/products/schemas.test.ts` — prices as decimal strings; bad prices rejected;
  brand and category required; a blank override becomes `null`; zero and negative
  overrides rejected; stock must be a non-negative integer; the schema re-parses its
  own output; image type and 5 MB limits.
- `lib/products/query.test.ts` — URL to API query, unknown values dropped, the
  filters written back to a link.
- `components/data-table/url-controls.test.tsx` — search and filter selects write the
  URL, keep other filters and drop `page`.
- `components/products/VariantsEditor.test.tsx` — adds and discards a draft row; a
  draft is validated before the server is called; a saved variant is deleted only
  after the confirm.
- `components/products/orderAfterMove.test.ts` — swaps and patches only changed
  images, renumbers colliding orders.
- `tests/e2e/create-product.spec.ts` — Playwright: create, add a variant, upload an
  image, publish, find it in the list (needs `E2E_API`).

---

## Files

```text
app/(admin)/products/
components/products/
lib/products/
lib/api/products.ts
```
