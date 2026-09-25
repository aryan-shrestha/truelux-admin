# Products

Status: Planned

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

## Tests

To be written:

- The form's zod schema (price as a decimal string, non-negative stock, hex on shades).
- The variants editor adds and removes rows.
- The table filters are written to the URL.
- Playwright: create a product, add a variant, upload an image, publish it, and see
  it in the list.
