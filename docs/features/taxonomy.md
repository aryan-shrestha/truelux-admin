# Taxonomy

Status: Planned

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
