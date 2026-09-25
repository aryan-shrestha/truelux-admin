# Features

Current feature inventory.

The TrueLux admin is the merchant's back-office for the cosmetics store, served at
`admin.truelux.com`. It owns no data. It is a server-rendered Next.js app that calls
the Django API's `/api/v1/admin/` and `/api/v1/auth/` routes **from its server only**
([ADR 0001](../decisions/0001-auth-is-a-backend-for-frontend.md)), and it renders
every UI element with shadcn/ui ([ADR 0002](../decisions/0002-shadcn-ui-is-the-component-library.md)).

| #   | Feature    | Status      | Documentation            | Depends on | Last updated |
| --- | ---------- | ----------- | ------------------------ | ---------- | ------------ |
| 1   | app-shell  | Implemented | `features/app-shell.md`  | —          | 2026-09-25   |
| 2   | auth       | Implemented | `features/auth.md`       | 1          | 2026-09-25   |
| 3   | dashboard  | Implemented | `features/dashboard.md`  | 2          | 2026-09-25   |
| 4   | taxonomy   | Implemented | `features/taxonomy.md`   | 2          | 2026-09-25   |
| 5   | products   | Implemented | `features/products.md`   | 4          | 2026-09-25   |
| 6   | orders     | Implemented | `features/orders.md`     | 2          | 2026-09-25   |
| 7   | deployment | Implemented | `features/deployment.md` | all        | 2026-09-25   |

`Depends on` refers to the `#` column of this table.

Every feature is verified with unit and component tests against stubbed `fetch` and
Next mocks. None has yet run against the live API; the Playwright specs in
`tests/e2e/` are written for that and skip until `E2E_API` is set. Contract
assumptions are listed in
[backend-api.md](../integrations/backend-api.md#open-questions).

## Implementation order

1 → 2 → 3 → 4 → 5 → 6 → 7.
