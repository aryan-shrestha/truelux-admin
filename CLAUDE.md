# CLAUDE.md

Repository instructions for Claude. Read this before the first edit of a session.

Keep this file short. It contains rules that apply to almost every change. Durable
architecture knowledge, feature state, and decisions belong in `docs/`.

---

## Project

The TrueLux admin: the merchant back office for a cosmetics store, served at
`admin.truelux.com`. It consumes the Django REST API in `../back-end` and owns no
data of its own.

- Next.js 16, App Router
- React 19
- TypeScript, `strict`, `noUncheckedIndexedAccess`
- Tailwind CSS v4, configured in CSS
- shadcn/ui (Radix base, Nova style) — the only component library
- react-hook-form + zod for forms, TanStack Table v8 for tables, Recharts via
  shadcn `chart`
- Yarn 4, `nodeLinker: node-modules`

`yarn` is the package manager. shadcn components are added with
`npx shadcn@latest add <name>`, which is the one exception.

**Do not switch the linker to Plug'n'Play.** Turbopack and Vitest both fail under it.

There is **no client data-fetching library** and **no global state store**.

---

## Commands

```bash
yarn install
yarn dev          # http://localhost:3001; the storefront uses 3000
yarn build
yarn lint
yarn typecheck    # next typegen && tsc --noEmit
yarn test         # Vitest
yarn e2e          # Playwright; skipped unless E2E_API, E2E_EMAIL, E2E_PASSWORD
yarn format
```

Before reporting work as complete, run:

```bash
yarn lint
yarn typecheck
yarn test
yarn build
```

Read the actual output. Never claim a check passed without running it.

---

## Source of truth

When information conflicts, use this order:

1. Explicit requirements in the current task
2. Existing source code and tests
3. Repository architecture/convention documentation
4. Established patterns elsewhere in the repository
5. Next.js/React/TypeScript conventions
6. General best practices

**The backend API is authoritative** for anything it owns: prices, stock, totals,
order state, allowed transitions and error codes. The admin displays what the API
returned and never computes a substitute.

If documentation contradicts source code, treat the documentation as authoritative,
correct the code where appropriate, and mention the discrepancy in the final report.

---

## Codebase context

```text
docs/
├── architecture.md
├── convention.md
├── handover.md
├── decisions/
├── features/
└── integrations/
    └── backend-api.md
```

Before a non-trivial change:

1. Read `docs/architecture.md` when the change touches auth, the proxy, or more than
   one route.
2. Read `docs/convention.md` when changing shared conventions.
3. Read `docs/decisions/` when introducing or changing an architectural pattern.
4. Read `docs/features/index.md` and the relevant feature document.
5. **Read `docs/integrations/backend-api.md` before writing anything that calls the
   API.** Do not guess a field name or a response shape.
6. **Read the relevant guide in `node_modules/next/dist/docs/`** before writing
   routing, proxy, cookies, server actions or caching code. Next 16 differs from
   older versions: `proxy.ts` replaces `middleware.ts`, `error.tsx` receives
   `retry`, and cookies cannot be written while a Server Component renders.

---

## Architecture

```text
app/
    layout.tsx | error.tsx | not-found.tsx | robots.ts
    login/
    (admin)/          the signed-in frame: layout, loading, error
        page.tsx      dashboard
        orders/  products/  brands/  categories/  shades/  sizes/
proxy.ts              auth guard and token refresh before every render

components/
    ui/               shadcn components, themed here and nowhere else
    shell/  auth/  data-table/  form/
    dashboard/  orders/  products/  taxonomy/

lib/
    api/              server-only: the only module that calls the backend
    auth/             cookies, session, sign-in and sign-out actions, next-path guard
    <domain>/         schemas, URL query mapping and server actions per area
    format/           money and dates
    env.ts            every environment variable
```

### Layer boundaries

**Routes** (`app/**`) — read `params` and `searchParams`, call `lib/api`, compose
components. No `fetch`, no formatting, no business rules.

**Server Components** — the default. Turn data into markup.

**Client Components** (`"use client"`) — interaction only: forms, dialogs, tables
with row actions, URL-driven filters. **Never import `lib/api`.** A client component
calls a server action from `lib/<domain>/actions.ts`.

**Server actions** (`lib/<domain>/actions.ts`, `"use server"`) — every mutation.
Re-validate input with the same zod schema, call `lib/api` inside `attempt()`,
`revalidatePath`, return an `ActionResult`.

**`lib/api`** — imports `server-only`. `apiRead` for Server Components, `apiWrite`
for server actions. Returns typed data or throws `ApiError`.

**`components/ui`** — shadcn only. Brand the look here and in `app/globals.css`, not
with class strings at call sites.

Do not create additional layers unless the existing architecture requires them.

---

## Auth (ADR 0001)

- The browser never calls the API. Tokens live in httpOnly cookies on the admin's
  origin.
- `proxy.ts` redirects anonymous requests to `/login?next=…` and refreshes the
  access token before any render. Server Components cannot set cookies.
- `apiRead` never refreshes; a 401/403 sends the user to `/login?expired=1`.
  `apiWrite` refreshes once on a 401 and retries.
- `next` passes through `safeNextPath` and nothing else.
- Every server action is a public endpoint. Validate its arguments; the API enforces
  staff permissions.

---

## State

| Tier | Holds |
| --- | --- |
| URL search params | Filters, search, page, tab |
| Cookies | The token pair (httpOnly), the sidebar state |
| React state | Dialogs, form values, pending transitions |

No global store, no client cache, no `useEffect` to fetch.

---

## Money (ADR 0003)

- **An amount is a `string`, from the API to the pixel.**
- `lib/format/money.ts` is the only module that parses one: `formatMoney` for
  display, `toChartNumber` for chart geometry, `MONEY_PATTERN` for form validation.
- No `Number()`, `parseFloat` or arithmetic on an amount anywhere else. The admin
  shows the API's subtotal, shipping and total; it never sums them.

---

## The backend contract is fixed

- Read `docs/integrations/backend-api.md` before writing a call.
- **Branch on the error `code`**, never on `message` and never on status alone.
- A field the admin wants and the API does not have is a conversation with the
  backend, not a workaround here. Record open questions in `backend-api.md`.

---

## shadcn/ui (ADR 0002)

- Every UI element is a component from `components/ui/`. No hand-rolled primitive
  where a shadcn one exists, and no other UI kit.
- Forms: `Field` + `Controller` over react-hook-form with `zodResolver`; the field
  components in `components/form/` bind them.
- Tables: `components/data-table/DataTable.tsx` (TanStack) with state in the URL.
- Status colours come from badge variants (`success`, `warning`, `info`), mapped in
  `lib/orders/status.ts`. No hex values in feature components.
- Load the `shadcn` skill before adding or customising a component.

---

## Scope discipline

Implement the smallest change that completely satisfies the requirement. Do not
refactor unrelated code, reformat unrelated files, upgrade dependencies without
need, or add configuration for hypothetical requirements. Mention adjacent problems
rather than fixing them.

---

## Anti-AI-slop rules

Do not introduce:

- abstractions with one real use
- a component that only renders another component
- `utils.ts`, `helpers.ts` or `common.ts` (shadcn's `lib/utils.ts#cn` is the only one)
- speculative extension points, props nobody passes, configuration nobody requested
- defensive checks for impossible states
- a `useEffect` that could be a derived value or an event handler
- a client component that could have been a server component
- broad `try`/`catch` — `attempt()` is the one place API failures become results

---

## Comments and docstrings

Default to **no comment**. Never write comments that narrate code, banner comments,
commented-out code, TODO/FIXME, or JSDoc that repeats a name.

A comment is allowed only for a non-obvious **why**: a security reason, external API
behaviour, a Next.js boundary quirk, or an accessibility decision a reader would
otherwise simplify away.

---

## Feature documentation

Every feature has `docs/features/<slug>.md` from `_TEMPLATE.md`. When a feature
changes, update its Implemented / Remaining / Decisions / Gotchas / Tests / Files
with facts only, and keep `docs/features/index.md` current. Never claim something is
implemented when it is not.

Architectural decisions go in `docs/decisions/`. Do not create an ADR for a trivial
choice.

---

## Tests

- **`lib/` logic always**: schemas, money, dates, URL query mapping, the API client's
  refresh and retry, the `next` guard.
- **Components with behaviour**: forms, editors, confirm flows, URL controls.
- **No test reaches the network.** Stub `fetch`; mock `next/headers` and
  `next/navigation` with `tests/fixtures/`.
- Assert the error `code`, never the message from the API.
- Playwright specs run against a live, seeded API only, because the admin's API
  calls happen on the server where `page.route` cannot see them.

---

## Security

- `API_BASE_URL` is server-only. Never prefix it `NEXT_PUBLIC_`.
- Never log a token, a password, a customer's email, phone or address.
- `next` never leaves the origin.
- No `dangerouslySetInnerHTML`.
- The admin is `noindex` everywhere (metadata, `robots.ts`, `X-Robots-Tag`).

---

## Skills

| Situation | Skill |
| --- | --- |
| Adding or theming a component | `shadcn` |
| App Router, server actions, proxy, caching | `nextjs-developer`, `vercel-react-best-practices` |
| Component APIs | `vercel-composition-patterns` |
| Types at the API boundary | `typescript-best-practices` |
| Visual direction | `frontend-design` |
| Reviewing a UI | `web-design-guidelines` |
| Final review | `code-reviewer`, `simplify` |

---

## Session handoff

At the end of non-trivial work, report: what changed, the commands run and their
results, durable context learned, what remains, and which documents were updated.
Update `docs/handover.md` when the state of the project changes.

@AGENTS.md
