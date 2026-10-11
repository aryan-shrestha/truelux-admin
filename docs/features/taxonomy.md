# Taxonomy

Status: Planned

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

- `src/features/taxonomy/` — one repository per kind (`brands.repository.ts`, …) or
  one parameterised by kind, schemas per kind, `taxonomy.queries.ts`
  (`["taxonomy", kind]`), mutations per kind, and components: a table and a dialog per
  kind, `row-actions.tsx` (`dropdown-menu` labelled "Actions for <name>": Edit,
  Delete), `category-tree.ts` (parent, then its children, both by sort order; an
  orphan shows as top level).
- Routes `src/routes/_dashboard/{brands,categories,shades,sizes,skin-types}.tsx` with
  `validateSearch` for `q`.
- Search filters the cached array with the query's `select` (name or slug,
  case-insensitive), debounced 300 ms and written to `?q=`, so a keystroke makes no
  request.
- The dialog form mounts only while open, so an edit starts from the row's current
  values. The category parent options come from the cached categories, so a new
  top-level category is offered at once.
- A brand save with a new logo sends `FormData`; without one, JSON. The logo preview
  uses an object URL, revoked on close.
- Shared field rules (name, slug, sort order as a non-negative integer, hex) in one
  schema module; a blank slug is dropped from the body.
- `select` cannot hold an empty value: "None" maps to a sentinel and the form stores
  `null`.
- The shade swatch is decorative (`aria-hidden`); the colour picker has its own label
  and the hex input carries the field label.
- `src/config/navigation.ts` — a **Catalogue** group with Brands, Categories, Shades,
  Sizes and Skin types (Products joins it with [products.md](products.md)); from
  [app-shell.md](app-shell.md).
- Deletes confirm with the shared `ConfirmDialog`, and an empty list shows the shared
  `EmptyState`, both built with [orders.md](orders.md).
- Mutations name their stale keys in `meta.invalidates`: that kind's list and all
  products ([tanstack-query.md](tanstack-query.md#rules-for-features)).
- Add shadcn `select`, `switch`, `textarea` when building.

Error treatment:

| `code`              | Treatment                                                                     |
| ------------------- | ----------------------------------------------------------------------------- |
| `validation_error`  | Field messages from `details` on the matching field, the rest as a form alert |
| `conflict` (delete) | The in-use message; never raised for a skin type                              |
| `conflict` (save)   | "This duplicates an existing record…" as a form alert                         |

Planned tests: hex accepts `#D8A47F` and lowercase and rejects `red`, `#FFF`,
`#GGGGGG`; slug and sort-order rules; a blank slug is dropped; the category tree
order; a 409 on delete shows the in-use message and keeps the dialog open; the skin
type confirmation names the product count, and says only "This cannot be undone." at
0; search filters without a request; a delete refetches the list; a logo upload is
sent as multipart; Playwright: create, rename, delete a skin type.

---

## Implemented

None.

---

## Remaining

- Everything in Planned.
- Decide how a relative logo URL is shown (see Gotchas).

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
  does in development, and absolute on Cloudinary. `/media/` on the admin origin is
  not the API. Since ADR 0005 the SPA knows the API's origin (`VITE_API_URL`), so it
  can resolve a relative URL against it; the alternative is for the API to return
  absolute URLs. Decide before the first image is shown.

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

None yet; see Planned.

---

## Files

```text
src/features/taxonomy/                                         planned
src/routes/_dashboard/{brands,categories,shades,sizes,skin-types}.tsx   planned
```

---

## Future context

None.
