# Taxonomy

Status: Implemented

Last updated: 2026-09-25

---

## Goal

Let the merchant manage brands, categories, shades and sizes.

---

## Scope

What is included in this implementation?

- `/brands`, `/categories`, `/shades`, `/sizes`: each is a `data-table` (TanStack)
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
- Mutations are server actions that `revalidatePath` and toast the result

---

## Context

Backend `admin-api.md` § Taxonomy.

---

## Implemented

- `app/(admin)/{brands,categories,shades,sizes}/page.tsx` — each reads its bare array
  once, filters it by `?q=` (name or slug, case-insensitive) on the server, and renders
  the header's **New …** dialog, a `UrlSearch` and the table.
- `components/data-table/DataTable.tsx` — the shadcn `data-table` pattern over
  TanStack Table v8, with manual filtering, sorting and paging: the server hands it
  the rows to show. `ColumnMeta.className` aligns and sizes cells.
- `components/data-table/UrlSearch.tsx`, `use-url-params.ts` — a debounced search
  `input-group` that writes `?q=` with `router.replace` and drops `page`.
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
- `components/taxonomy/*Table.tsx` — columns per kind; brands show logo and
  Active/Inactive; categories show the hierarchy (children indented under their
  parent, with a Parent column); shades show a swatch `badge`.
- `components/taxonomy/RowActions.tsx` — `dropdown-menu` with Edit (opens the same
  dialog) and Delete (`alert-dialog` via `ConfirmAction`). A `409 conflict` toasts
  "In use by N products. Deactivate or reassign first." for brands, "…Reassign them
  first." for categories, and "In use by N variants…" for shades and sizes, with N
  from the row's count.
- `lib/taxonomy/actions.ts` — `saveBrand`, `saveCategory`, `saveShade`, `saveSize`,
  `removeTaxonomy`: re-validate with the same zod schema, omit a blank slug, call the
  API, `revalidatePath` the list and return an `ActionResult`.
- `lib/taxonomy/schemas.ts`, `lib/catalog/fields.ts` — the schemas and the shared
  name, slug, sort-order and hex rules.
- `lib/taxonomy/category-tree.ts` — orders categories as parent, then its children.

---

## Remaining

- Not yet exercised against the live API; verified with stubs only.
- The field names of the admin taxonomy items are assumed (see
  [backend-api.md](../integrations/backend-api.md#open-questions)): `logo_url` on
  brands and `parent_id` on categories.

---

## Decisions

### Decision: search is filtered on the server, not by TanStack

**Decision**

The taxonomy lists are bare arrays, so the page filters them by `?q=` before
rendering. TanStack runs with `manualFiltering`.

**Reason**

Table state lives in the URL (ADR 0001), and one mechanism serves the paginated
lists too.

**Consequence**

Each keystroke (debounced 300 ms) re-renders the page on the server and refetches
the array.

### Decision: the 409 message names the count the table already shows

**Decision**

The in-use message takes N from the row's `product_count` or `variant_count`.

**Reason**

The contract gives the 409 no documented `details`.

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

---

## Routes

```text
/brands  /categories  /shades  /sizes    dynamic; ?q= filters
```

---

## API

### Calls

```text
GET    /api/v1/admin/{kind}/          server, no-store
POST   /api/v1/admin/{kind}/          server action
PATCH  /api/v1/admin/{kind}/{id}/     server action
DELETE /api/v1/admin/{kind}/{id}/     server action
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| `validation_error` | Field messages from `details` on the matching field, the rest as a form alert |
| `conflict` (delete) | The in-use message above |

---

## State and data

- URL: `?q=`.
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
```

