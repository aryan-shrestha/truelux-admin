# TrueLux API

Status: Reference

Last updated: 2026-10-11

---

## About this document

An index of the contract published by the **back-end repository** (`../back-end`),
so admin code is written against a document rather than a recollection.

**The back-end repository is authoritative.** This file names the endpoints and the
rules every feature depends on, and points at the back-end document that defines
each one. It does not copy request and response bodies: read them in the back-end
document when building the feature, and record what the feature relies on in its
own feature document. If this file and `../back-end/docs/` disagree, the back-end is
right and this file is stale.

Indexed from:

```text
back-end/README.md                      endpoint list
back-end/docs/architecture.md           error envelope, authentication
back-end/docs/features/staff-auth.md    token endpoints
back-end/docs/features/admin-api.md     every /api/v1/admin/ route
back-end/docs/features/inventory.md     stock adjustments and the ledger
back-end/apps/core/pagination.py        pagination
```

Checked against the running API on 2026-10-11: an anonymous `/admin/dashboard/`
and `/auth/me/` return `401 authentication_failed` with an `X-Request-ID`. Back-end
ADR 0020 (2026-10-11) is the contract for how the admin authenticates.

---

## Base URL and versioning

```text
API:        {VITE_API_URL}/api/v1/...
Admin SPA:  httpClient paths are relative to it: "admin/orders/"
```

Local development: `VITE_API_URL=http://localhost:8000`, with
`http://localhost:5173` in the API's `DJANGO_CORS_ALLOWED_ORIGINS`.

Every route ends in a **trailing slash**. Django redirects one that does not, and
the redirect turns a `POST` into a `GET`.

`/api/v1/` responses are promised to stay backward compatible; a breaking change
arrives as `/api/v2/`.

---

## Authentication

SimpleJWT, **staff only** (`staff-auth.md`). Called from the browser; the tokens are
kept in `localStorage` (back-end ADR 0020, admin ADR 0005).

| Method | Path                          | Purpose                                     |
| ------ | ----------------------------- | ------------------------------------------- |
| POST   | `/api/v1/auth/token/`         | email + password → `access`, `refresh`      |
| POST   | `/api/v1/auth/token/refresh/` | rotates: returns a new pair, blacklists old |
| POST   | `/api/v1/auth/logout/`        | blacklists the refresh token                |
| GET    | `/api/v1/auth/me/`            | the signed-in staff user                    |

- Wrong password, unknown email, inactive and non-staff all return the same
  `401 authentication_failed`.
- The token endpoints are throttled (`auth` scope); admin routes use the `admin`
  scope. Throttling is `429 throttled`.
- Every staff user can do everything; there are no roles.

---

## Admin endpoints

All under `/api/v1/admin/`, JWT only, active staff only. Defined in
`back-end/docs/features/admin-api.md#api`.

| Area              | Paths                                                                             |
| ----------------- | --------------------------------------------------------------------------------- |
| Dashboard         | `dashboard/`                                                                      |
| Products          | `products/`, `products/{id}/`, `products/{id}/variants/`, `products/{id}/images/` |
| Variants, images  | `variants/{id}/`, `images/{id}/`                                                  |
| Stock             | `variants/{id}/stock-adjustments/`, `stock-movements/`                            |
| Taxonomy          | `brands/`, `categories/`, `shades/`, `sizes/`, `skin-types/` and their `{id}/`    |
| Orders            | `orders/`, `orders/{id}/`, `orders/{id}/transition/`                              |
| Shipping settings | `settings/shipping/`                                                              |

Rules that apply across them:

- IDs are UUIDs.
- **Money is a decimal string** (`"3200.00"`) everywhere.
- Timestamps are UTC ISO-8601. Order date filters (`created_after`,
  `created_before`) are `Asia/Kathmandu` days.
- Writes are JSON, except product image uploads and brand logos, which must be
  `multipart/form-data`. Send a `FormData` and let the browser set the
  `Content-Type` with its boundary.
- Writes reference related rows by id (`brand_id`, `size_id`, …); reads nest them.
- Deleting a referenced row is `409 conflict`, except a skin type (detached, `204`).
- Order transitions are allowed only to the statuses in the order's
  `allowed_transitions`; anything else is a `422`.

---

## Pagination

Paginated lists use DRF's limit/offset envelope
(`apps.core.pagination.DefaultLimitOffsetPagination`):

```json
{ "count": 123, "next": "…?limit=25&offset=25", "previous": null, "results": [] }
```

- `limit` defaults to 25 and is capped at 100.
- `ordering` takes field names, `-` for descending, comma-separated.
- **Taxonomy lists are not paginated**: they return bare arrays.

`src/lib/repositories/pagination.ts` mirrors this (`paginatedSchema`,
`toListParams`).

---

## Errors

```json
{ "error": { "code": "validation_error", "message": "…", "details": { "field": ["…"] } } }
```

Codes and statuses: `back-end/docs/architecture.md#error-handling`. What the admin
does with them: [../architecture.md](../architecture.md#error-handling).

Every response carries `X-Request-ID`, exposed to the admin's origin through CORS
(`CORS_EXPOSE_HEADERS`).

---

## Open questions

Raised by `../admin` (its `docs/integrations/backend-api.md`) and still relevant here,
checked against `../back-end` on 2026-10-11:

| Question                                                                                       | Current behaviour                                                                                                                                | Where it matters                                                         |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Could a just-rotated refresh token be accepted again for a few seconds (a reuse grace period)? | Reuse is a 401 at once; mitigated here, because tabs share the stored pair and a tab that loses the race picks up the winner's                   | [staff-auth](../features/staff-auth.md)                                  |
| Could the API expose a change feed (`GET admin/changes/?since=<cursor>`)?                      | None; the admin refetches by freshness class                                                                                                     | [tanstack-query](../features/tanstack-query.md)                          |
| Could image and logo URLs be absolute in every environment?                                    | Decided 2026-10-11: yes, the back-end is to return absolute URLs. Until it does, development's relative `/media/…` URLs do not load in the admin | [products](../features/products.md), [taxonomy](../features/taxonomy.md) |

Resolved: `created_after`/`created_before` now compare `Asia/Kathmandu` days
(`back-end/docs/features/admin-api.md` § Gotchas), so dashboard links and order date
filters agree with the revenue figures.
