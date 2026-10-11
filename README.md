# TrueLux — Admin v2

The staff back office for TrueLux, a multi-brand cosmetics store: a static React
single-page app that signs staff in and calls the Django API in
[`../back-end`](../back-end) from the browser.

Read [`CLAUDE.md`](CLAUDE.md) before your first change, then
[`docs/architecture.md`](docs/architecture.md),
[`docs/convention.md`](docs/convention.md) and
[`docs/features/index.md`](docs/features/index.md).
[`docs/handover.md`](docs/handover.md) is the operator's runbook.

## Requirements

- Node.js 22+ (developed on 25)
- Yarn 4 (`corepack enable`); the linker is `node-modules`, not Plug'n'Play
- The TrueLux API running locally, with `http://localhost:5173` in its
  `DJANGO_CORS_ALLOWED_ORIGINS`: see [`../back-end/README.md`](../back-end/README.md)

## From clone to a running app

```bash
cp .env.example .env        # VITE_API_URL=http://localhost:8000
yarn install
yarn dev                    # http://localhost:5173
```

Every variable in `.env.example` is required (ADR 0004); a missing or malformed one
stops the app with one error naming all of them. No variable may be a secret:
`VITE_*` values are built into the bundle.

## Commands

| Command                             | Does                                          |
| ----------------------------------- | --------------------------------------------- |
| `yarn dev`                          | Vite on 5173                                  |
| `yarn build`                        | Typecheck, then build the SPA into `dist/`    |
| `yarn preview`                      | Serve `dist/`                                 |
| `yarn test` / `yarn test:watch`     | Vitest (jsdom)                                |
| `yarn e2e`                          | Playwright, against `yarn dev`                |
| `yarn lint`                         | ESLint, including the import-boundary rules   |
| `yarn typecheck`                    | `tsc -b` over the app and the tooling configs |
| `yarn format` / `yarn format:check` | Prettier                                      |

## Routes

| Path     | Page                                              |
| -------- | ------------------------------------------------- |
| `/`      | Dashboard (placeholder), inside the sidebar shell |
| `/login` | Staff sign-in                                     |

## Architecture

```text
src/app/           providers, router, query client
src/routes/        file-based routes (TanStack Router)
src/features/      one vertical slice per domain: repositories, queries, schemas, components
src/components/    shadcn ui/, layout/, data-table/, feedback/
src/lib/           repositories/ (HTTP client, session, ApiError, pagination), env, theme, cn
src/stores/        Zustand UI state
```

A screen reads **route → query → repository → API**. The HTTP client sends the
staff's access token and refreshes it on a 401 (ADR 0005). Every failure reaches the
UI as an `ApiError` carrying the API's `{"error": {"code", "message", "details"}}`.

## Deployment

Not deployed yet. The app builds to static files; the host is still to be chosen.
See [`docs/features/deployment.md`](docs/features/deployment.md).
