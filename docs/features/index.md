# Features

Current feature inventory.

The TrueLux admin is the merchant's back-office for the cosmetics store, served at
`admin.truelux.com`. It owns no data. It is a server-rendered Next.js app that calls
the Django API's `/api/v1/admin/` and `/api/v1/auth/` routes **from its server only**
([ADR 0001](../decisions/0001-auth-is-a-backend-for-frontend.md)); the browser's
TanStack Query cache refetches through the admin's own `/api/*` handlers
([ADR 0005](../decisions/0005-client-data-uses-tanstack-query.md)), and it renders
every UI element with shadcn/ui ([ADR 0002](../decisions/0002-shadcn-ui-is-the-component-library.md)).

| #   | Feature           | Status      | Documentation                   | Depends on | Last updated |
| --- | ----------------- | ----------- | ------------------------------- | ---------- | ------------ |
| 1   | app-shell         | Implemented | `features/app-shell.md`         | —          | 2026-09-26   |
| 2   | auth              | Implemented | `features/auth.md`              | 1          | 2026-09-25   |
| 3   | dashboard         | Implemented | `features/dashboard.md`         | 2          | 2026-09-26   |
| 4   | taxonomy          | Implemented | `features/taxonomy.md`          | 2          | 2026-09-26   |
| 5   | products          | Implemented | `features/products.md`          | 4          | 2026-09-26   |
| 6   | orders            | Implemented | `features/orders.md`            | 2          | 2026-09-26   |
| 7   | deployment        | Implemented | `features/deployment.md`        | all        | 2026-09-26   |
| 8   | tanstack-query    | Implemented | `features/tanstack-query.md`    | 1–6        | 2026-09-27   |
| 9   | shipping-settings | Implemented | `features/shipping-settings.md` | 8          | 2026-09-27   |
| 10  | sale-prices       | Implemented | `features/sale-prices.md`       | 5, 8       | 2026-09-29   |

`Depends on` refers to the `#` column of this table.

Every feature is verified with unit and component tests against stubbed `fetch` and
Next mocks. The Playwright specs in `tests/e2e/` ran green against the live, seeded
API on 2026-09-26 (sign in and out, the order queue, creating and publishing a
product with skin types, and skin type CRUD), and with the shipping settings spec on
2026-09-27, and with the sale prices spec on 2026-09-29; they skip until `E2E_API` is set and
delete what they create in `test.afterAll`, even when a spec fails midway. Every earlier contract assumption has been checked against
the implemented backend; what is still open is in
[backend-api.md](../integrations/backend-api.md#open-questions).

## Implementation order

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10.
