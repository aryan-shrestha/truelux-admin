# TrueLux — Admin v2

The staff back office for TrueLux, a multi-brand cosmetics store: a React
single-page app with a small backend-for-frontend (BFF) that signs staff in and
forwards their calls to the Django API in [`../back-end`](../back-end).

Read [`CLAUDE.md`](CLAUDE.md) before your first change, then
[`docs/architecture.md`](docs/architecture.md),
[`docs/convention.md`](docs/convention.md) and
[`docs/features/index.md`](docs/features/index.md).
[`docs/handover.md`](docs/handover.md) is the operator's runbook.

## Requirements

- Node.js 22+ (developed on 25)
- Yarn 4 (`corepack enable`); the linker is `node-modules`, not Plug'n'Play
- The TrueLux API running locally: see [`../back-end/README.md`](../back-end/README.md)

## From clone to a running app

```bash
cp .env.example .env        # API_URL=http://localhost:8000
yarn install
yarn dev                    # http://localhost:5173 (BFF on :8787)
```

`yarn dev` starts Vite and the BFF together. Vite proxies `/bff/*` to the BFF, which
forwards `/bff/api/*` to `API_URL/api/v1/*`. Every variable in `.env.example` is
required (ADR 0004); a missing or malformed one stops the BFF with one error naming
all of them.

## Commands

| Command                             | Does                                                   |
| ----------------------------------- | ------------------------------------------------------ |
| `yarn dev`                          | Vite (5173) and the BFF (8787), restarted on change    |
| `yarn build`                        | Typecheck, then build the SPA into `dist/`             |
| `yarn preview`                      | Serve `dist/` (without the BFF)                        |
| `yarn test` / `yarn test:watch`     | Vitest: the `web` (jsdom) and `bff` (node) projects    |
| `yarn e2e`                          | Playwright, against `yarn dev`                         |
| `yarn lint`                         | ESLint, including the import-boundary rules            |
| `yarn typecheck`                    | `tsc -b` over the app, the BFF and the tooling configs |
| `yarn format` / `yarn format:check` | Prettier                                               |

## Routes

| Path     | Page                                              |
| -------- | ------------------------------------------------- |
| `/`      | Dashboard (placeholder), inside the sidebar shell |
| `/login` | Sign-in (placeholder until staff-auth)            |

BFF:

| Path          | Purpose                                                                |
| ------------- | ---------------------------------------------------------------------- |
| `/bff/health` | Liveness of the BFF                                                    |
| `/bff/api/*`  | Proxy to `API_URL/api/v1/*`, `admin/` and `auth/me/` only, with bearer |

## Architecture

```text
server/            the BFF (Hono): cookie session, allow-listed proxy to the API
src/app/           providers, router, query client
src/routes/        file-based routes (TanStack Router)
src/features/      one vertical slice per domain: repositories, queries, schemas, components
src/components/    shadcn ui/, layout/, data-table/, feedback/
src/lib/           repositories/ (HTTP client, ApiError, pagination), theme, cn
src/stores/        Zustand UI state
```

A screen reads **route → query → repository → BFF → API**. Every failure reaches the
UI as an `ApiError` carrying the API's `{"error": {"code", "message", "details"}}`.

## Deployment

Not deployed yet. The SPA builds to static files; the BFF is a Hono app
(`server/app.ts`) that needs a Node or edge host on the same origin. See
[`docs/features/scaffold.md`](docs/features/scaffold.md#remaining).
