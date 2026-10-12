# Products

Status: Implemented

Last updated: 2026-10-12

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
  - sortable **Product** (name) and **Price** headers, one at a time, toggling
    ascending and descending, in `?sort=`; name A to Z by default. The other columns
    have no sort because the API cannot order by them. Long names wrap (the column is
    at most 20rem) so the table fits the page
  - row actions: Edit, Publish/Unpublish, Delete, by right-clicking the row (there
    is no ⋯ button)
- `/products/new` and `/products/$productId`: `tabs` for **Details**, **Variants
  (n)** (the variant count) and **Images**, with the tab in `?tab=`. The edit page's
  header has **Publish** (a draft) or **Unpublish** left of **Refresh data**; there is
  no status line under the title
  - Details: name, slug, description, brand, category, base price, sort order, skin
    types (a multi-select of `popover` + `command` with `checkbox`es, the choice shown
    as `badge`s), skin feel, key ingredients. Publishing is not a form field: a new
    product is a draft (the API's default)
  - Variants: a read-only `table` of SKU, size, shade (with swatch, or "No shade"),
    stock, the API's price and compare-at price ([sale-prices.md](sale-prices.md)).
    **Add variant** and each row's **Edit** open the variant form in a `sheet` from
    the right. Each row's actions (Edit, Change stock, Stock history, Delete) are in a
    `dropdown-menu`. Stock is an input only when adding; a saved variant changes
    stock through [stock-ledger.md](stock-ledger.md). Delete asks for a confirm.
  - Images: upload (several, ≤ 5 MB each, JPEG/PNG/WebP), a grid with alt-text
    editing, make primary, move earlier/later, delete after a confirm
- Publishing without variants toasts `422 product_has_no_variants` ("Add at least
  one variant before publishing.")
- Deleting an ordered product shows the 409 with **Unpublish instead**

What is explicitly outside the scope?

- Bulk edit, import or export
- Sorting by created date (the API allows `created_at`, but the table has no such
  column), and multi-column sorting

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
  `sort` (`PRODUCT_SORT_SCHEMA`: `name`, `-name`, `base_price`, `-base_price`, the
  API's `ordering` values), `page`; each field falls back on its own.
- `product-sort.ts` — `toSorting` (the URL's `sort` as TanStack Table state, none
  meaning name A to Z) and `toProductSort` (back again; the default and any column
  the API cannot order give no `sort`). A sort change goes through the filters'
  `navigate`, so it drops `page`; it does not count as a filter for the empty state.
- `repositories/products.repository.ts` — `listProducts` maps them to `search`,
  `brand`, `category`, `is_published`, `low_stock=true`, `on_sale=true`,
  `ordering` from `sort` (`name` by default), `limit` 25, `offset`; `getProduct`, `createProduct`,
  `updateProduct`, `deleteProduct`, each parsed with Zod (`product.schema.ts`, which
  already describes variants and images).
- `queries/products.queries.ts` — `productKeys`; `productQueries.list` (`volatile`,
  `keepPreviousData`) and `.detail` (`volatile`).
- `queries/products.mutations.ts` — `useSaveProduct` (writes the returned product
  into its detail key), `useSetPublished` (optimistic in every cached list, rolled
  back and refetched on failure), `useDeleteProduct`; both save and delete
  invalidate product lists and every taxonomy list (their counts).
- `components/products-list.tsx`, `product-filters.tsx` (search and five filter comboboxes, each led by "All …"/"Any …"),
  `products-table.tsx` (thumbnail, name and slug linked, brand, category, price,
  variants, stock with `Out` at 0, Published/Draft, an `info` On sale badge),
  `product-row-actions.tsx` (Edit, Publish/Unpublish, Delete as a `RowMenu`, passed
  to `DataTable` as `rowActions`, so a right-click on the row opens them; Edit
  navigates on select; a delete `409` toasts
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
- `components/product-form.tsx` — create and edit: name, slug, brand and category
  as searchable comboboxes (`ComboboxField` from `src/components/form/`; categories'
  children as "Parent › Child"), base price in an `Rs` group, sort order,
  description, skin types (`multi-select-field.tsx`: `popover` + `command` +
  `checkbox`, the choice as badges), skin feel, key ingredients. It sends no
  `is_published`, so **Save product** never changes it. Field errors go under their
  fields (`showApiError`); a save `409` is a form alert.
- `components/product-detail.tsx` — the edit page: header with `PublishButton`
  (`publish-button.tsx`, through `PageHeader`'s `leadingActions`), and the tabs.
- `components/publish-button.tsx` — **Publish** (primary) for a draft, **Unpublish**
  (outline) for a published product, through `useSetPublished`: a spinner while
  pending, the new state once the API answers (it writes the detail cache), a toast
  either way.
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
- `components/variants-editor.tsx`, `variant-row.tsx` — a read-only table: SKU,
  size, shade (swatch or "No shade"), stock, the API's `price`, compare-at ("—" when
  none, and the API's discount badge; [sale-prices.md](sale-prices.md)). Each row's
  actions ("Actions for {SKU}": Edit, Change stock, Stock history, Delete) are a
  `RowMenu` around the row, opened by right-clicking it; each opens the matching sheet
  or dialog, rendered beside the row; one row has at most one
  open. A saved variant is deleted after a confirm; a delete `409` toasts that the
  variant has been ordered.
- `components/variant-sheet.tsx` — **Add variant** ("New variant") and **Edit**
  ("Edit {SKU}") open the variant form in a `sheet` on the right, mounted only while
  open so an edit always starts from the saved variant and closing discards it:
  SKU, size, shade (comboboxes; shades with swatches, or "No shade"), opening stock (only when adding), price
  override (the base price as placeholder) and compare-at, the amounts in an `Rs`
  group. The sheet reads the size and shade lists itself (cached). It closes on a
  successful save. A save `409` reads "Another variant already has this SKU, or this
  size and shade." as an alert in the sheet.
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
  refetched, because files sent before it are kept. While the upload runs, the grid
  shows a skeleton card per file (`ImageCardSkeleton`, a `status` labelled
  "Uploading <file name>") after the existing images, in place of the empty state;
  the new images replace them together once the last file is sent.
- The grid fills its width with cards of at least 15rem
  (`repeat(auto-fill, minmax(15rem, 1fr))`), so wider screens show more, smaller
  previews. Image cards are `size="sm"` (16px padding); 15rem is the narrowest a
  non-primary card's footer (move, Primary, delete) fits in.
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

### Decision: variants are edited in a sheet, not in the table

**Decision**

The variants table is read-only. Adding or editing a variant opens one form in a
right-hand `sheet`; the row's other actions sit in a `dropdown-menu`.

**Reason**

The owner asked for it (2026-10-12): a table of inputs with four icon buttons per
row was crowded, and drafts mixed into saved rows.

**Consequence**

One variant is edited at a time. **Save variant** is always enabled, as in the
taxonomy dialogs; the earlier "only when changed" rule of the inline rows is gone.

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
- The skin-types combobox's `checkbox` is `tabIndex={-1}` with no pointer events; the
  `command` item is what the keyboard and mouse toggle.
- shadcn's `Card` drops its bottom padding when it contains a footer
  (`has-data-[slot=card-footer]:pb-0`), and `:has` matches any descendant. The
  Images card holds image cards with footers, so it restores
  `has-data-[slot=card-footer]:pb-(--card-spacing)`; any card that nests footered
  cards needs the same.

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

- `schemas/product-filters.schema.test.ts` — known values kept (a table sort
  included), the rest dropped (`-created_at` too).
- `product-sort.test.ts` — the default, a leading minus, writing back without the
  default, an unorderable column falling back.
- `components/products-list.test.tsx` — right-clicking a row offers Edit, Unpublish
  and Delete, and Delete goes through the same confirm; **Price** sorts ascending then descending
  (`ordering`, `?sort=`, `aria-sort`, back to page 1); only Product and Price offer a
  sort; price, stock (`Out`), Draft and On sale;
  the URL's filters reach the API in its terms (`is_published`, `low_stock`,
  `on_sale`, `ordering=name`, `limit`, `offset`); choosing a brand in its filter
  combobox puts it in the URL and the request, and **All brands** clears it; the
  empty states; a publish shows
  at once and is put back on `product_has_no_variants`; a delete `409` offers
  **Unpublish instead**, which sends `{ is_published: false }`.
- `components/product-form.test.tsx` — brand, category and price are required before
  anything is sent; create sends the documented body without a blank slug and opens
  the product; brands are searched as staff type, with "No brand matches." when none
  does, and the chosen name shows in the field; edit starts from the saved product and
  sends the whole skin-type set;
  **Publish** in the header sends only `{ is_published: true }` and then offers
  **Unpublish**; `product_has_no_variants` is toasted; the Variants tab counts the
  variants; an API field error lands on its
  field; an unknown id shows not-found.
- `variant-body.test.ts` — blank prices are `null`; stock only for a new variant;
  price and stock rules.
- `components/variants-editor.test.tsx` — right-clicking a row opens its actions
  (Change stock opens the stock dialog); the tab comes from and goes back to the
  URL; the table shows the API's values with no inputs; **Edit** opens the sheet
  without a stock field and sends no stock and a cleared price as `null`; **Add
  variant** sends the opening stock and the shade chosen in the sheet's combobox,
  shows the new row and closes the sheet; SKU and
  size are required before anything is sent; closing the sheet sends nothing; a save
  `409` is explained in the sheet; a delete from the menu needs the confirmation and a
  `409` keeps the row; the API's compare-at error lands on the sheet's field.
- `image-order.test.ts` — a move renumbers from the new position and reports only
  the changed images, including colliding stored numbers.
- `components/images-manager.test.tsx` — uploads go one at a time, the first primary
  when there is none; each file shows a skeleton until the upload ends; a GIF is refused without a request; new alt text shows at once
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

`../admin/components/products/` and `lib/products/` are the reference for the image
manager.
