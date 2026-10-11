# Features

Current feature inventory.

TrueLux admin v2 is the staff back office for a multi-brand cosmetics store: a
static React SPA that calls the TrueLux API in `../back-end` from the browser and
keeps the staff JWT in `localStorage` (ADR 0005). It replaces the Next.js admin in
`../admin`.

| #   | Feature            | Status      | Documentation                    | Depends on  | Last updated |
| --- | ------------------ | ----------- | -------------------------------- | ----------- | ------------ |
| 1   | scaffold           | Implemented | `features/scaffold.md`           | —           | 2026-10-11   |
| 2   | bff                | Removed     | — (ADR 0005)                     | 1           | 2026-10-11   |
| 3   | api-error-contract | Implemented | `features/api-error-contract.md` | 1           | 2026-10-11   |
| 4   | app-shell          | Implemented | `features/app-shell.md`          | 1, 3        | 2026-10-11   |
| 5   | tanstack-query     | Implemented | `features/tanstack-query.md`     | 1, 3        | 2026-10-11   |
| 6   | staff-auth         | Implemented | `features/staff-auth.md`         | 3, 4        | 2026-10-11   |
| 7   | dashboard          | Implemented | `features/dashboard.md`          | 4, 5, 6, 10 | 2026-10-11   |
| 8   | taxonomy           | Implemented | `features/taxonomy.md`           | 5, 6        | 2026-10-11   |
| 9   | products           | In progress | `features/products.md`           | 5, 6, 8     | 2026-10-11   |
| 10  | orders             | Implemented | `features/orders.md`             | 4, 5, 6     | 2026-10-11   |
| 11  | shipping-settings  | Planned     | `features/shipping-settings.md`  | 4, 5, 6     | 2026-10-11   |
| 12  | sale-prices        | Planned     | `features/sale-prices.md`        | 9           | 2026-10-11   |
| 13  | stock-ledger       | Planned     | `features/stock-ledger.md`       | 9           | 2026-10-11   |
| 14  | deployment         | Blocked     | `features/deployment.md`         | 6           | 2026-10-11   |

`Depends on` refers to the `#` column of this table. Row 2 stays so the numbering
does not shift: the BFF was removed when ADR 0005 made the admin a static SPA.

Features 4–14 carry the requirements of the Next.js admin's feature documents
(`../admin/docs/features/`, all Implemented there), adapted to this app's
architecture. Their status here reflects this repository only: what the scaffold
already provides is under each document's **Implemented**, everything else under
**Planned**. `../admin`'s `auth` is `staff-auth` here, and its `inventory` work is
`stock-ledger`, as there.

## Implementation order

Done: 6, 3, 4, 5, 10, 7, 8; 9 in progress (list and Details done, Variants and
Images next). Then 12 → 13 → 11, with 14 once its host is chosen. The shell's navigation entries, `ConfirmDialog`, `EmptyState`, list state and
optimistic updates are built by the features that first need them; each feature
document lists its share.

Orders before the dashboard, because the dashboard links into them and shows their
status badge. Orders is the reference slice for lists in
[../convention.md](../convention.md#tables-and-lists).

## Contracts with the back-end

- Back-end ADR 0020 (superseding ADR 0012): the SPA calls `/api/v1/auth/*` and
  `/api/v1/admin/*` directly, keeps the access and refresh tokens in `localStorage`
  and sends `Authorization: Bearer`.
- Every environment's admin origin must be listed in the API's
  `DJANGO_CORS_ALLOWED_ORIGINS`; the API exposes `X-Request-ID` to it.
- The back-end's documents still describe "the Next.js admin app" in places. They
  are not wrong about the contract, but should be updated when v2 replaces v1.

## Not done

- **Nothing is deployed.**
- **Deployment is blocked on a decision**: which static host serves the SPA
  ([deployment.md](deployment.md)).
- **Relative image URLs in development**: the API returns `/media/…` for locally
  stored files, which the admin cannot load. Decided: the back-end will return
  absolute URLs; until it does, brand logos (and product images) do not show in
  development ([taxonomy.md](taxonomy.md#remaining)).
- **Sign-in has not been checked against the live API**: `e2e/auth.spec.ts` needs
  the API running with this origin in `DJANGO_CORS_ALLOWED_ORIGINS`
  ([staff-auth.md](staff-auth.md#remaining)).

## Differences from `../admin`

- The browser calls the API directly with a bearer token from `localStorage`,
  instead of through Next Route Handlers and server actions holding httpOnly cookies.
- Session refresh keeps `../admin`'s rule (one refresh per tab, never two with the
  same token), moved into the Axios response interceptor; tabs share the stored pair,
  which removes most of `../admin`'s cross-tab race.
- The order date filters need no workaround: the back-end now compares
  `Asia/Kathmandu` days, which `../admin` had raised as an open question.

## Architectural decisions

| ADR  | Decision                                                           | Governs                           |
| ---- | ------------------------------------------------------------------ | --------------------------------- |
| 0001 | Superseded by 0005: the admin is an SPA behind a BFF               | —                                 |
| 0002 | Server state lives in TanStack Query; Zustand holds UI state only  | every feature                     |
| 0003 | Features are vertical slices; repositories are the only HTTP layer | every feature; `eslint.config.js` |
| 0004 | Every environment variable is required                             | `src/lib/env.ts`, deployment      |
| 0005 | The admin is a static SPA that keeps the JWT in localStorage       | staff-auth, deployment            |

## Deferred

Staff roles (the API has none), bulk import/export (the owner's workbook import runs
on the back-end), and anything the API does not offer.

## Status definitions

- **Planned** — documented but implementation has not started.
- **In progress** — implementation has started but is incomplete.
- **Implemented** — documented scope is implemented and verified.
- **Blocked** — implementation cannot continue because of a documented blocker.
- **Deprecated** — feature exists but should not receive new development.
- **Removed** — the feature was taken out; the linked decision explains why.
