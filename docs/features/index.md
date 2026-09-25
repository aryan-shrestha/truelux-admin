# Features

Current feature inventory.

The TrueLux admin is the merchant's back-office for the cosmetics store, served at
`admin.truelux.com`. It owns no data. It is a server-rendered Next.js app that calls
the Django API's `/api/v1/admin/` and `/api/v1/auth/` routes **from its server only**
([ADR 0001](../decisions/0001-auth-is-a-backend-for-frontend.md)), and it renders
every UI element with shadcn/ui ([ADR 0002](../decisions/0002-shadcn-ui-is-the-component-library.md)).

| #   | Feature    | Status  | Documentation            | Depends on | Last updated |
| --- | ---------- | ------- | ------------------------ | ---------- | ------------ |
| 1   | app-shell  | Planned | `features/app-shell.md`  | —          | 2026-09-25   |
| 2   | auth       | Planned | `features/auth.md`       | 1          | 2026-09-25   |
| 3   | dashboard  | Planned | `features/dashboard.md`  | 2          | 2026-09-25   |
| 4   | taxonomy   | Planned | `features/taxonomy.md`   | 2          | 2026-09-25   |
| 5   | products   | Planned | `features/products.md`   | 4          | 2026-09-25   |
| 6   | orders     | Planned | `features/orders.md`     | 2          | 2026-09-25   |
| 7   | deployment | Planned | `features/deployment.md` | all        | 2026-09-25   |

`Depends on` refers to the `#` column of this table.

## Implementation order

1 → 2 → 3 → 4 → 5 → 6 → 7.
