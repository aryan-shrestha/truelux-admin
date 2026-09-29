# Products

Status: Implemented

Last updated: 2026-09-29

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
  - Filters for search, brand, category, published, low stock and on sale, all in
    the URL.
  - Row actions: edit, publish/unpublish, delete.
- `/products/new` and `/products/[id]`: `tabs` for **Details**, **Variants** and
  **Images**.
  - Details: name, slug, description (`textarea`), brand (`select`), category
    (`select`), base price, sort order, skin types (a multi-select of `popover` +
    `command` with `checkbox`es, the choice shown as `badge`s), skin feel
    (`input`), key ingredients (`textarea`), and a published `switch`.
  - Variants: an editable `table` of SKU, size (`select`), shade (`select` with
    swatches, or "No shade"), stock (`input` number), price override, and compare-at
    price ([sale-prices.md](sale-prices.md)). Adds and removes rows with a confirm.
  - Images: upload (multiple, ≤ 5 MB, jpeg/png/webp), a grid with alt-text editing,
    set primary, reorder (up/down buttons), and delete.
- Publishing without variants surfaces `422 product_has_no_variants` inline.
- Deleting an ordered product surfaces the 409 and offers "Unpublish instead".

---

## Context

Backend `admin-api.md` § Products and `skin-types.md` § Admin. Uploads go browser → admin server action
(`FormData`) → API multipart. The browser never calls the API directly.

---

## Implemented

- `app/(admin)/products/page.tsx` — prefetches the page of products and the brand and
  category arrays in parallel; `ProductsView` reads them from the cache. The toolbar is `UrlSearch` (`?q=`, name or SKU) and
  five `UrlSelect`s (`?brand=`, `?category=`, `?published=yes|no`, `?stock=low`,
  `?on_sale=true`);
  `TablePagination` pages with `?page=` over `limit`/`offset` (25 a page).
- `components/products/ProductsTable.tsx` — thumbnail (`avatar`), name and slug
  (linked to the editor), brand, category, base price, variant count, total stock
  (`Out` badge at 0), and a Published/Draft `badge` with an "On sale" `badge` beside
  it.
- `components/products/ProductRowActions.tsx` — Edit, Publish/Unpublish, Delete. A
  `409 conflict` on delete closes the dialog and toasts "This product has been
  ordered…" with an **Unpublish instead** action when it is published.
- `app/(admin)/products/new/page.tsx` — the details form alone (`NewProductView`); on
  success the form navigates to `/products/{id}?tab=variants`.
- `app/(admin)/products/[id]/page.tsx` — reads the product and the five taxonomy
  arrays in parallel; `not_found` becomes `notFound()`. `ProductView` renders the
  header (name, brand, badge) and `ProductTabs`, which keeps the tab in `?tab=`.
- `components/products/ProductDetailsForm.tsx` — name, slug, description, brand and
  category `select`s, base price (`Rs` input group, decimal string), sort order,
  skin types, skin feel, key ingredients, published `switch`. A
  `422 product_has_no_variants` is set on the Published field. Skin types are sent as
  `skin_type_ids`, the whole set on every save.
- `components/form/MultiSelectField.tsx` — the skin types control: an outline
  `button` (`role="combobox"`) showing the chosen options as `badge`s, opening a
  `popover` with a searchable `command` list whose items carry a `checkbox`. The
  form value is an array of ids.
- `components/products/VariantsEditor.tsx`, `VariantRow.tsx` — a `table` in which each
  row is its own react-hook-form form: SKU, size, shade (swatch options or "No
  shade"), stock, price override (blank = base price, sent as `null`), compare-at
  price (blank = not on sale, sent as `null`). **Add variant**
  appends a draft row; a draft is discarded with ✕, a saved variant is deleted after
  an `alert-dialog`. Save is enabled only when the row changed.
- `components/products/ImagesManager.tsx`, `ImageCard.tsx` — multiple upload
  (validated client- and server-side: JPEG/PNG/WebP, ≤ 5 MB), one server action per
  file in sequence, the first image primary when none is; a grid with alt-text
  editing, **Make primary**, move earlier/later, and delete behind a confirm. Moving
  and alt text are optimistic (`use-image-mutation.ts`) and roll back on failure.
- `components/products/ProductRowActions.tsx` — Publish/Unpublish flips the row at
  once and back if the API refuses; delete removes the detail from the cache.
- `lib/products/actions.ts` — every product, variant and image mutation, each
  re-validating with zod. Callers run them in `useMutation` with
  keys from `lib/query/invalidation.ts` (`afterProductChange`, `afterVariantChange`,
  `afterImageChange`); product and variant changes also reach the taxonomy counts,
  variant changes the dashboard. Products are `volatile`: stock moves with storefront
  orders, so they refetch when shown again or refocused after 30 s.
- `lib/products/queries.ts` — `productKeys`, `productQueries`;
  `app/api/products/route.ts` and `app/api/products/[id]/route.ts` serve the
  browser.
- `lib/products/schemas.ts`, `lib/products/query.ts` — the schemas and the URL ↔ API
  query mapping.
- `lib/api/media.ts` — `mediaUrl` resolves a relative `/media/…` URL against
  `API_BASE_URL`; `lib/api/products.ts` applies it to `images[].url` and
  `primary_image_url` on every read and write response.
- `next.config.ts` — `images.remotePatterns` for `https://res.cloudinary.com/**` and
  the API origin's `/media/**`, so `next/image` optimises product images.

---

## Remaining

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
- Image URLs are relative (`/media/…`) when the API stores files locally and
  absolute on Cloudinary. Only `lib/api` resolves them; components always get an
  absolute URL.
- Next 16 refuses to optimise an image from a private address, so
  `images.dangerouslyAllowLocalIP` is on only when `API_BASE_URL` is localhost.
- The list endpoint carries no `skin_types`, `skin_feel` or `key_ingredients`; only
  the detail does. `skin_type_ids: []` clears the set.
- The combobox's `checkbox` is `tabIndex={-1}` with no pointer events: the
  `command` item is what the keyboard and the mouse toggle.
- A `409 conflict` on save means a taken slug, SKU, or a second variant with the
  same size and shade; it shows as "This duplicates an existing record…".
- On the server axios treats Node's `FormData` as unknown and keeps its
  `application/x-www-form-urlencoded` default, so an upload reached the API as a
  multipart body under a url-encoded header (`TooManyFieldsSent`, later
  `415 unsupported_media_type`). `send()` sets a boundary-less `multipart/form-data`,
  which the fetch adapter drops so `fetch` writes its own. This covers brand logos too.
  `lib/api/client.test.ts` runs in the node environment because jsdom hides the bug.

---

## Routes

```text
/products          dynamic; ?q ?brand ?category ?published ?stock ?on_sale ?page
/products/new      dynamic
/products/[id]     dynamic; ?tab=details|variants|images
```

---

## API

### Calls

```text
GET    /api/v1/admin/products/                   server render; browser via /api/products
GET    /api/v1/admin/products/{id}/              server render; browser via /api/products/[id]
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
| `conflict` (save)           | "This duplicates an existing record…" as a form alert   |
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

- `lib/products/schemas.test.ts` — skin type ids kept and care details trimmed, skin
  feel capped at 200; prices as decimal strings; bad prices rejected;
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
- `components/products/ProductDetailsForm.test.tsx` — the product's skin types show
  as badges; toggling options in the list changes them; search filters the list; the
  saved values reach the action.
- `lib/api/client.test.ts` — in the node environment, a `FormData` upload leaves as
  `multipart/form-data; boundary=…`, not url-encoded.
- `lib/api/media.test.ts` — relative image and thumbnail URLs are resolved against
  the API origin; Cloudinary URLs and `null` pass through.
- `components/products/orderAfterMove.test.ts` — swaps and patches only changed
  images, renumbers colliding orders.
- `tests/e2e/create-product.spec.ts` — Playwright: create, add a variant, upload an
  image (and check it loads through `next/image`), choose skin types and care
  details, publish, reload, find it in the list, then delete it (needs `E2E_API`).

---

## Files

```text
app/(admin)/products/
components/products/
lib/products/
lib/api/products.ts
lib/api/media.ts
components/form/MultiSelectField.tsx
```
