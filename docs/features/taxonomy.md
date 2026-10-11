# Taxonomy

Status: Implemented

Last updated: 2026-10-11

---

## Goal

Let the merchant manage brands, categories, shades, sizes and skin types.

---

## Scope

What is included in this implementation?

- `/brands`, `/categories`, `/shades`, `/sizes`, `/skin-types`: each a `DataTable`
  with search, and create/edit in a `dialog` form (react-hook-form + Zod). Delete
  sits behind an `alert-dialog`.
- Brand: name, slug (optional), description, logo upload with a preview, active
  `switch`, sort order. The table shows the logo and Active/Inactive.
- Category: name, slug, parent (`select` of top-level categories, excluding itself, or
  "None"), sort order. The table shows the hierarchy: children indented under their
  parent, with a Parent column.
- Shade: name, slug, hex (a native colour input paired with a hex text input,
  validated `#RRGGBB`, sent uppercase), sort order, and a swatch in the table.
- Size: name, slug, sort order.
- Skin type: name, slug, sort order, and its product count. Deleting one detaches it
  from its products, and the confirmation says how many.
- A `409 conflict` on delete shows "In use by N products. Deactivate or reassign
  first." (brands), "…Reassign them first." (categories) or "In use by N variants…"
  (shades, sizes), with N from the row's count.
- Each mutation invalidates its list and all products, and toasts the result.

What is explicitly outside the scope?

- Bulk import or export (the owner's workbook import runs on the back-end)

---

## Context

- Requirements ported from `../admin/docs/features/taxonomy.md` (Implemented there).
- API: `back-end/docs/features/admin-api.md` § Taxonomy and `skin-types.md` § Admin.
  The lists are **bare arrays**, not paginated, and include inactive brands. Each
  item carries `product_count` (brands, categories, skin types) or `variant_count`
  (shades, sizes). `slug` is optional on write. Category writes take `parent_id`.
- Brand logos are `multipart/form-data` on POST or PATCH; every other write is JSON.
- Freshness `reference` ([tanstack-query.md](tanstack-query.md)).

---

## Planned

None.

---

## Implemented

- `src/features/taxonomy/`:
  - `schemas/taxonomy.schema.ts` — the five read schemas, `TAXONOMY_SCHEMAS` (kind →
    schema, the kind being the API path segment) and `TaxonomyEntry<K>`
  - `schemas/taxonomy-form.schema.ts` — form schemas sharing field rules: name
    (required, ≤ 150 for brands and categories, ≤ 50 otherwise), slug (empty or
    `a-z0-9-`), sort order (whole number ≥ 0), hex (`#RRGGBB`), logo
    (`IMAGE_FILE_SCHEMA` from `src/lib/image-upload.ts`: JPEG/PNG/WebP, ≤ 5 MB),
    `parent_id`
  - `schemas/taxonomy-search.schema.ts` — `?q=` for the five routes
  - `taxonomy-body.ts` — form values → request: a blank slug is left out, the hex
    is uppercased, and a brand with a new logo becomes `FormData` (JSON otherwise)
  - `category-tree.ts` — `toCategoryRows`: top-level categories in sort order, each
    followed by its children; an orphan of a search shows as top level
  - `repositories/taxonomy.repository.ts` — `listTaxonomy`, `saveTaxonomy` (POST
    or PATCH), `deleteTaxonomy`, each parsed with its kind's schema
  - `queries/taxonomy.queries.ts` — `taxonomyKeys` (`["taxonomy", kind]`),
    `taxonomyQueries.list(kind)` (`reference`)
  - `queries/taxonomy.mutations.ts` — `useSaveTaxonomy`, `useDeleteTaxonomy`;
    `meta.invalidates` is the kind's list
  - `use-taxonomy-search.ts` — filters the cached list by name or slug through the
    query's `select`
  - `components/taxonomy-form-dialog.tsx` — the shared dialog: RHF + Zod, the form
    mounted only while open, `validation_error` details on matching fields
    (`fieldErrors` → `setError`) and the rest as one alert, a save `409` as "This
    duplicates an existing record. Check the name and the slug."; opened by its own
    trigger (New …) or by a row (Edit)
  - `components/{brand,category,shade,size,skin-type}-dialog.tsx` — brand:
    description, logo with an object-URL preview, Active switch; category: parent
    `select` of other top-level categories or None; shade: colour picker and hex
    text on one value
  - `components/{brands,categories,shades,sizes,skin-types}-table.tsx` with
    `columns.tsx`, `row-actions.tsx` (Edit, Delete behind `ConfirmDialog`; a delete
    `409` toasts the kind's in-use sentence with the row's count) and
    `taxonomy-empty.tsx`
- `src/routes/_dashboard/{brands,categories,shades,sizes,skin-types}.tsx` — await
  the list in the loader; **New …** in the header; search writes `?q=` with
  `replace`.
- `src/config/navigation.ts` — the **Catalogue** group.
- Shared, built here: `DataTable` without a pager for whole-array lists,
  `SearchInput` (moved from orders), `ConfirmDialog` without a trigger, shadcn
  `select` and `switch`, and jsdom stubs for Radix in `src/test/setup.ts`.

---

## Remaining

- **Back-end: absolute `logo_url` in every environment** (your decision). In
  development the API returns a relative `/media/…` path, which the admin, on
  another origin, cannot load: logos show their initial until `../back-end` changes.
  Production (Cloudinary) is absolute already.

---

## Decisions

### Decision: search filters the cached array

**Decision**

The query holds the whole bare array; `select` filters it by `?q=`.

**Reason**

The API does not paginate taxonomy, so the array is already in the browser, and the
search stays in the URL.

**Consequence**

A keystroke makes no request.

### Decision: the 409 message names the count the table already shows

**Decision**

The in-use message takes N from the row's `product_count` or `variant_count`.

**Reason**

The API's 409 always has `details: {}`.

**Consequence**

N can be stale by the time of the click; the API remains the authority.

---

## Gotchas

- `409 conflict` also answers a create or edit whose name or slug is taken.
- Brand `logo_url` is relative (`/media/…`) when the API stores files locally, as it
  does in development, and absolute on Cloudinary. Decided: the back-end will return
  absolute URLs; the admin renders the value as given, and its schema keeps it a
  plain string so a relative one never fails the parse.
- The dialog's form mounts only while open, so Edit always starts from the row's
  current values, and a cancelled edit leaves nothing behind.
- A skin type never answers a delete with `409`; the API detaches it from its
  products (204). The confirmation says how many products lose it.
- Radix Dialog and Select need `ResizeObserver`, pointer capture and
  `scrollIntoView`, which jsdom lacks; `src/test/setup.ts` stubs them.
- In tests, Node's `request.formData()` rejects the multipart body jsdom builds;
  assert on `request.text()` instead.

---

## API

```text
GET    /api/v1/admin/{kind}/
POST   /api/v1/admin/{kind}/
PATCH  /api/v1/admin/{kind}/{id}/
DELETE /api/v1/admin/{kind}/{id}/
       kind: brands | categories | shades | sizes | skin-types
```

---

## Data changes

- Query keys `["taxonomy", kind]`, invalidated by taxonomy and product changes (they
  carry counts).
- URL: `q`.

---

## Permissions

Signed-in staff (the API).

---

## Tests

- `schemas/taxonomy-form.schema.test.ts` — hex accepts `#D8A47F` and lowercase,
  rejects `red`, `#FFF`, `#GGGGGG`; slug and sort-order rules; logo type and size.
- `taxonomy-body.test.ts` — a blank slug is left out; hex in capitals; a logo makes
  multipart, JSON otherwise.
- `category-tree.test.ts` — children under their parent in sort order; an orphan is
  top level.
- `components/brands-table.test.tsx` — status badges; search without a request;
  create sends JSON without a blank slug and shows the new row; a logo upload is
  `multipart/form-data` with the file; an API field error lands on Name; a save
  `409` shows the duplicate alert; a delete `409` toasts the in-use sentence and
  keeps the row.
- `components/categories-table.test.tsx` — tree order with the Parent column; the
  parent select offers only other top-level categories; a cycle error lands on
  Parent.
- `components/shades-table.test.tsx` — picker and hex text stay in step; the hex is
  sent in capitals.
- `components/skin-types-table.test.tsx` — the confirmation names the product count,
  or says only "This cannot be undone." at 0; a delete shows the refetched list.

---

## Files

```text
src/features/taxonomy/
src/routes/_dashboard/{brands,categories,shades,sizes,skin-types}.tsx
src/components/data-table/search-input.tsx
```

---

## Future context

None.
