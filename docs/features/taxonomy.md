# Taxonomy

Status: Implemented

Last updated: 2026-09-27

---

## Goal

Let the merchant manage brands, categories, shades, sizes and skin types.

---

## Scope

What is included in this implementation?

- `/brands`, `/categories`, `/shades`, `/sizes`, `/skin-types`: each is a `data-table` (TanStack)
  with search, and create/edit in a `dialog` or `sheet` form (react-hook-form + zod).
  Delete sits behind an `alert-dialog`; a `409 conflict` shows "In use by N
  products. Deactivate or reassign first."
- Brand: name, slug (optional), description, logo upload with a preview, active
  `switch`, sort order
- Category: name, slug, parent (`select` of root categories), sort order. The table
  shows the hierarchy.
- Shade: name, slug, hex (a native colour input paired with a hex text `input`,
  validated `#RRGGBB`), sort order, and a swatch preview in the table
- Size: name, slug, sort order
- Skin type: name, slug, sort order. Deleting one detaches it from its products,
  and the confirmation says how many.
- Mutations are server actions run in `useMutation`; they invalidate the list (and
  products, which show taxonomy names) and toast the result

---

## Context

Backend `admin-api.md` § Taxonomy and `skin-types.md` § Admin.

---

## Implemented

- `app/(admin)/{brands,categories,shades,sizes,skin-types}/page.tsx` — each prefetches its bare
  array into `["taxonomy",kind]` and renders the header's **New …** dialog, a
  `UrlSearch` and the table inside one `HydrationBoundary`. Each table reads its rows
  through `useTaxonomySearch(kind)`, which filters the cached array by `?q=` (name or
  slug, case-insensitive) with `select`, so a search makes no request.
- `components/data-table/DataTable.tsx` — the shadcn `data-table` pattern over
  TanStack Table v8, with manual filtering, sorting and paging: the server hands it
  the rows to show. `ColumnMeta.className` aligns and sizes cells.
- `components/data-table/UrlSearch.tsx`, `use-url-params.ts` — a debounced search
  `input-group` that writes `?q=` with `history.replaceState` and drops `page`.
- `components/taxonomy/*Dialog.tsx` — one `dialog` form per kind on `RecordDialog`
  (react-hook-form + zod, `FormProvider`, field components in `components/form/`).
  - Brand: name, slug, description, logo file with an `avatar` preview, active
    `switch`, sort order. A new logo is sent as multipart; without one the body is
    JSON.
  - Category: name, slug, parent (`select` of top-level categories, excluding itself,
    or "None"), sort order.
  - Shade: name, slug, a colour input and a hex text input bound to the same field,
    validated `#RRGGBB` and sent uppercase, sort order.
  - Size: name, slug, sort order.
  - Skin type: name, slug, sort order.
- `components/taxonomy/*Table.tsx` — columns per kind; brands show logo and
  Active/Inactive; categories show the hierarchy (children indented under their
  parent, with a Parent column); shades show a swatch `badge`; skin types show their
  product count.
- `components/taxonomy/RowActions.tsx` — `dropdown-menu` with Edit (opens the same
  dialog) and Delete (`alert-dialog` via `ConfirmAction`). A `409 conflict` toasts
  "In use by N products. Deactivate or reassign first." for brands, "…Reassign them
  first." for categories, and "In use by N variants…" for shades and sizes, with N
  from the row's count. A skin type's confirmation says instead that it "will be
  removed from the N products that list it" (just "This cannot be undone." at 0),
  since the API detaches rather than refuses.
- `lib/taxonomy/actions.ts` — `saveBrand`, `saveCategory`, `saveShade`, `saveSize`,
  `saveSkinType`,
  `removeTaxonomy`: re-validate with the same zod schema, omit a blank slug, call the
  API and return an `ActionResult`. Dialogs and `RowActions` pass
  `taxonomyInvalidates(kind)` (the list and `["products"]`).
- `components/taxonomy/CategoryDialog.tsx` derives its parent options from the cached
  categories, so a new top-level category is offered at once.
- `lib/taxonomy/schemas.ts`, `lib/catalog/fields.ts` — the schemas and the shared
  name, slug, sort-order and hex rules.
- `lib/taxonomy/category-tree.ts` — orders categories as parent, then its children.

---

## Remaining

- Brands, categories, shades and sizes have no Playwright spec; they are verified
  with stubs, and their field names (`logo_url`, `parent_id`) against the backend's
  serializers.

---

## Decisions

### Decision: search filters the cached array

**Decision**

The taxonomy lists are bare arrays. The query holds the whole array and `select`
filters it by `?q=`; TanStack Table still runs with `manualFiltering`.

**Reason**

The query stays in the URL, and the array is already in the browser.

**Consequence**

A keystroke (debounced 300 ms) makes no request
([ADR 0005](../decisions/0005-client-data-uses-tanstack-query.md)).

### Decision: the 409 message names the count the table already shows

**Decision**

The in-use message takes N from the row's `product_count` or `variant_count`.

**Reason**

The API's 409 always has `details: {}`.

**Consequence**

N can be stale by the time of the click; the API remains the authority.

---

## Gotchas

- Radix `Select` cannot hold an empty value. `SelectField` maps "None" to a sentinel
  and stores `null` in the form.
- A logo `File` travels to the server action as an argument (React serialises
  `Blob`s). The server action rebuilds the multipart body.
- Server actions accept 6 MB bodies (`next.config.ts`), but Vercel caps a function
  request at 4.5 MB.
- The dialog form mounts only while the dialog is open, so an edit always starts
  from the row's current values.
- A `409 conflict` also answers a create or edit whose name or slug is taken. The
  dialog shows the generic "duplicates an existing record" message as a form alert.
- Brand `logo_url` is relative (`/media/…`) when the API stores files locally;
  `lib/api/taxonomy.ts` resolves it with `mediaUrl` before a component sees it.

---

## Routes

```text
/brands  /categories  /shades  /sizes  /skin-types    dynamic; ?q= filters
```

---

## API

### Calls

```text
GET    /api/v1/admin/{kind}/          server render; browser via /api/taxonomy/[kind]
POST   /api/v1/admin/{kind}/          server action
PATCH  /api/v1/admin/{kind}/{id}/     server action
DELETE /api/v1/admin/{kind}/{id}/     server action
```

### Errors handled

| `code`              | Treatment                                                                     |
| ------------------- | ----------------------------------------------------------------------------- |
| `validation_error`  | Field messages from `details` on the matching field, the rest as a form alert |
| `conflict` (delete) | The in-use message above; never raised for a skin type                        |
| `conflict` (save)   | "This duplicates an existing record…" as a form alert                         |

---

## State and data

- URL: `?q=`.
- Query cache: `["taxonomy",kind]`, stale after 5 minutes.
- React state: dialog open, form values, logo preview object URL.

---

## Accessibility

- Row menus are labelled "Actions for <name>".
- The colour picker has its own label; the hex text input carries the field label.
- The shade swatch is decorative (`aria-hidden`); the shade name is the text.

---

## Tests

- `lib/taxonomy/schemas.test.ts` — hex accepts `#D8A47F`/lowercase and rejects
  `red`, `#FFF`, `#GGGGGG`; slug rules; sort order must be a non-negative integer;
  a blank slug is dropped from the body.
- `lib/taxonomy/category-tree.test.ts` — children follow their parent, both levels in
  sort order; an orphan shows as top level.
- `components/taxonomy/RowActions.test.tsx` — a 409 on delete shows the in-use
  message and keeps the dialog open.
- `components/taxonomy/SkinTypesTable.test.tsx` — the delete confirmation names the
  products the skin type is removed from, and says only "cannot be undone" at 0;
  search filters the cache without a request; a delete refetches the list.
- `lib/api/media.test.ts` — a relative brand logo is resolved against the API origin.
- `tests/e2e/skin-types.spec.ts` — Playwright: create, rename, delete a skin type
  (needs `E2E_API`).

---

## Files

```text
app/(admin)/brands/  categories/  shades/  sizes/
components/taxonomy/
components/data-table/
components/form/
lib/taxonomy/
lib/catalog/fields.ts
lib/api/taxonomy.ts
lib/api/media.ts
```
