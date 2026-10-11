# CLAUDE.md

Repository instructions for Claude. Read this before the first edit of a session.

Keep this file short. It contains rules that apply to almost every change. Durable
architecture knowledge, feature state, and decisions belong in `docs/`.

---

## Project

TrueLux admin v2: the staff back office for a multi-brand cosmetics store. A React
single-page app served with a small backend-for-frontend (BFF) on the same origin. It
consumes the Django REST API in `../back-end` (`/api/v1/admin/`, JWT) and owns no
data of its own. It replaces the Next.js app in `../admin`.

- React 19, Vite 8, TypeScript 6 (`strict`, `noUncheckedIndexedAccess`)
- Tailwind CSS v4, configured in CSS (`src/styles/globals.css`)
- shadcn/ui (Radix base, Nova style): the only component library; Lucide icons
- TanStack Router (file-based routes), TanStack Query v5, TanStack Table v8
- Zod 4 for every boundary; React Hook Form with `@hookform/resolvers/zod` for forms
- Axios for HTTP, one instance: `src/lib/repositories/client.ts`
- Zustand for UI state only (ADR 0002)
- Hono for the BFF in `server/` (ADR 0001)
- Yarn 4, `nodeLinker: node-modules`

`yarn` is the package manager. shadcn components are added with
`yarn dlx shadcn@latest add <name>`, which is the one exception.

**Do not switch the linker to Plug'n'Play.** Vite and Vitest do not support it.

---

## Commands

```bash
yarn install
yarn dev            # Vite on http://localhost:5173 + the BFF on :8787
yarn build
yarn lint
yarn typecheck
yarn test           # Vitest: the "web" (jsdom) and "bff" (node) projects
yarn e2e            # Playwright; starts yarn dev unless it is already running
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
5. React/TanStack/TypeScript conventions
6. General best practices

**The backend API is authoritative** for anything it owns: prices, stock, totals,
order state, allowed transitions and error codes. The admin displays what the API
returned and never computes a substitute.

Do not replace an established repository pattern simply because another approach
is newer, more fashionable, or more idiomatic elsewhere.

If documentation contradicts source code:

1. Treat the documentation as authoritative.
2. Correct the stale code when appropriate.
3. Mention the discrepancy in the final report.

Never invent project conventions when the repository already contains an example
that answers the question.

---

## Codebase context

Durable repository knowledge lives here:

```text
docs/
├── architecture.md
├── convention.md
├── handover.md
├── decisions/
├── features/
└── integrations/
```

Before a non-trivial change:

1. Read `docs/architecture.md` when the change touches architecture or several
   features.
2. Read `docs/convention.md` when changing shared conventions.
3. Read `docs/decisions/` when introducing or changing an architectural pattern.
4. Read `docs/features/index.md`.
5. Read the feature document(s) relevant to the change.
6. Read `docs/integrations/truelux-api.md`, then the back-end feature document it
   points to, when the change calls an API endpoint.
7. Search the repository for an existing implementation of the same pattern.

Do not rediscover or redesign something that the repository already documents or
implements.

---

## Architecture

```text
server/                 the BFF: holds the staff JWT, proxies /bff/api/* to the API
src/
    app/                providers, router, query client: wiring only
    routes/             TanStack Router file routes: thin
    features/<domain>/
        repositories/   the only HTTP calls
        queries/        queryOptions, key factories, mutations
        schemas/        Zod schemas; types come from z.infer
        components/
        hooks/
        index.ts        the feature's public surface
    components/         ui/ (shadcn, generated), layout/, data-table/, feedback/
    lib/                repositories/ (HTTP client, errors, pagination), theme, cn
    stores/             Zustand, UI state only
    config/             navigation
```

### Layer boundaries

**Routes**

- Declare the path, search-param schema, loader and page component.
- Prefetch with `queryClient.ensureQueryData(<feature>Queries.x())` in the loader.
- Compose feature components. No HTTP, no business rules.

**Components**

- Render data and collect input.
- Read server data through a feature's query hooks; never call a repository.

**Queries**

- Own query keys, `queryOptions`, mutations and cache invalidation.
- Call repositories. Never call the HTTP client directly.

**Repositories**

- Own the request: path, method, parameters, and the Zod parse of the response.
- Return parsed data or throw `ApiError`. No React, no caching, no UI.

**Schemas**

- Describe the API's shapes and form input with Zod. Types are `z.infer`, never
  hand-written duplicates.

**Stores**

- Hold UI state that is not on the server and not in the URL. Never a copy of server
  data (ADR 0002).

`eslint.config.js` enforces the import rules (ADR 0003): only `src/lib/repositories/`
imports axios, only a feature's `repositories/` imports the HTTP client, features
import each other through `index.ts`, and shared code never imports a feature or a
route.

Do not create additional layers such as services, adapters, or a global API facade
unless the existing architecture requires them.

---

## Scope discipline

Implement the smallest change that completely satisfies the requirement.

Do not:

- refactor unrelated code
- reformat unrelated files
- rename unrelated variables
- reorganize modules opportunistically
- upgrade dependencies unless required
- "clean up" nearby code without a task-related reason
- rewrite a working subsystem
- add configuration for hypothetical future requirements

If an adjacent problem is discovered, mention it rather than fixing it unless
the fix is necessary for correctness.

---

## Anti-AI-slop rules

Write code as if another experienced engineer will maintain it for years.

Optimize for clarity and correctness, not for the amount of code produced.

Never add code merely to appear comprehensive.

Do not introduce:

- abstractions with one real use
- generic components or hooks without a second caller
- wrapper functions that only rename another function
- speculative props, variants or extension points
- `useEffect` to derive state that can be computed during render
- `useMemo`/`useCallback` without a measured reason
- defensive checks for impossible states
- redundant validation
- duplicate transformation layers
- broad `try`/`catch`
- global state for data that belongs to TanStack Query or the URL
- compatibility code for browsers or versions the project does not support

Prefer:

- existing repository patterns
- direct code over indirection
- explicit props and dependencies
- small components with clear responsibilities
- library conventions
- simple implementations

Do not optimize for hypothetical future requirements.

---

## Requirements discipline

Implement the requirements that exist, not requirements that might exist later.

Do not invent:

- API fields or endpoints
- business rules
- permissions or roles
- client-side calculations of server values
- caching rules
- retries
- abstractions
- configuration
- notification systems

If unspecified behavior materially affects correctness, API behavior, security,
or architecture, ask before implementing it.

If the ambiguity is local and the repository already has an obvious convention,
follow that convention and state the assumption.

---

## Existing changes

Before editing:

```bash
git status
git diff
```

Treat existing uncommitted changes as intentional.

Never:

- reset user changes
- revert user changes
- overwrite unrelated edits
- run destructive git commands
- discard changes because they appear unfinished

If a file already contains user changes, preserve them and modify only what the
current task requires.

---

## Comments and docstrings

Default to **no comment**.

Code should be made clear through naming, structure, and decomposition.

Never write comments that merely narrate code:

```tsx
// Fetch the products
const products = useQuery(productQueries.list(params));

// Render the table
return <DataTable ... />;
```

Never add:

- commented-out code
- banner comments
- numbered walkthrough comments
- TODO/FIXME comments for work that should be tracked elsewhere
- JSDoc that merely repeats a function name or its types

Comments are appropriate when they explain information the code cannot express,
especially:

- non-obvious constraints
- external system behavior
- security reasons
- surprising framework or browser behavior

Comments explain **why**, not **what**.

If a comment is required because a block is difficult to understand, first ask
whether the code can be simplified instead.

---

## Feature documentation

Non-trivial features and cross-cutting changes require a document at:

```text
docs/features/<slug>.md
```

Do not create feature documentation for:

- formatting-only changes
- typo fixes
- trivial mechanical changes
- dependency lockfile changes with no behavioral impact

When in doubt, create the document.

Every feature document must accurately represent the current implementation. Upon
every implementation the respective feature documentation must be updated.

### Workflow

1. Read `docs/features/index.md`.
2. Read relevant existing feature documents.
3. Study `docs/features/<slug>.md` before implementation.
4. Fill in the planned scope.
5. Implement the feature.
6. Move completed items from `Remaining` to `Implemented`.
7. Record important architectural decisions.
8. Record surprising behavior or future-agent gotchas.
9. Record relevant tests.
10. Update `docs/features/index.md`.
11. Commit documentation changes with the implementation.

Never claim something is implemented when it is not.

If work is blocked or intentionally incomplete, record it under `Remaining` with
the reason.

---

## Architectural decisions

Architectural decisions belong in:

```text
docs/decisions/
```

Before introducing a new architectural pattern, check existing decisions, including
the back-end's in `../back-end/docs/decisions/` when the API is involved.

If the repository already has an established decision for the problem, follow it
unless the current task explicitly changes that decision.

If a feature intentionally reverses an existing decision:

1. Document the new decision.
2. Explain why the previous decision no longer applies.
3. Mark the previous decision as superseded when appropriate.

Do not create an ADR for trivial implementation choices.

---

## Tests

Tests are part of the implementation, not a follow-up.

Tests must reflect the behavior being changed.

For screens and components, normally test:

- what the user sees for the successful response
- the empty and error states
- validation messages and what is submitted

For repositories and the BFF, test:

- the request that is sent
- the parse of a real response shape
- the error envelope and the failure paths

Mock the network with MSW (`src/test/msw-server.ts`), never by mocking a repository
or `httpClient`. Use the response shapes in `docs/integrations/truelux-api.md`.

Do not add meaningless tests merely to satisfy a checklist.

Before writing a test, inspect nearby tests and follow the repository's established
query style (`getByRole` first), setup, and assertion style.

---

## Security

- The browser never sees a JWT. Tokens live in `__Host-` httpOnly cookies set by the
  BFF, and the proxy refuses every token endpoint (ADR 0001).
- No secret is ever a `VITE_*` variable: everything with that prefix ships to the
  browser.
- Never render API or user-supplied HTML with `dangerouslySetInnerHTML`.
- Never put tokens, passwords or customer personal data in URLs, query keys that are
  logged, `localStorage`, or console output.
- Validate every external input with Zod: API responses, form input, URL search
  params, environment.
- Hiding a control is not authorization. The API decides; the admin reflects its 401,
  403 and 404.
- Destructive actions ask for confirmation.

---

## Implementation workflow

For a non-trivial change:

1. Inspect `git status` and existing diffs.
2. Read relevant architecture, convention, decision, and feature documentation.
3. Read the back-end contract for every endpoint involved.
4. Inspect existing implementations of the same or similar behavior.
5. Identify the smallest design that fits the existing architecture.
6. Create/update the feature document.
7. Implement the change.
8. Add or update tests.
9. Run format/lint/typecheck/tests/build.
10. Review the complete diff.
11. Fix valid findings.
12. Re-run affected checks.
13. Update feature/context documentation.
14. Report the final state.

Do not report completion before the implementation and documentation agree.

---

## Review

Before reporting completion, review the diff as if reviewing another engineer's PR.

Check:

- Does the implementation satisfy the actual requirement?
- Did it introduce unnecessary abstractions?
- Did it modify unrelated code?
- Does it follow existing repository patterns?
- Are route / component / query / repository boundaries correct?
- Is every API response parsed with Zod?
- Are query keys from the feature's key factory, and is the right cache invalidated?
- Is server data kept out of Zustand?
- Is list state (page, sort, filters) in the URL?
- Are loading, empty and error states handled?
- Are API contracts used exactly as the back-end documents them?
- Is anything security-sensitive exposed to the browser?
- Are tests meaningful?
- Are comments necessary?
- Is there dead code?
- Are there TODO/FIXME comments?
- Is the feature documentation accurate?

Fix every valid finding.

If a finding is intentionally not fixed, record the reason in the final report
rather than silently ignoring it.

---

## Session handoff

At the end of non-trivial work, report only durable information:

### Changed

What behavior/files changed.

### Verified

Commands actually run and their pass/fail results.

### Context learned

Only durable facts that future work should know.

### Remaining

Incomplete work, blockers, or explicitly deferred work.

### Documentation

Which feature, architecture, convention, or decision documents were updated.

Do not provide a transcript of the implementation process.

Do not claim a command passed unless it was actually run.

---

## Definition of done

A non-trivial change is complete only when applicable items are satisfied:

- [ ] Requirement implemented
- [ ] Existing repository patterns followed
- [ ] No unrelated changes
- [ ] Tests added/updated appropriately
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Tests pass
- [ ] Build passes
- [ ] Valid review findings fixed
- [ ] Feature documentation accurate
- [ ] `docs/features/index.md` updated
- [ ] Architectural decisions documented if applicable
- [ ] No commented-out code
- [ ] No unnecessary comments
- [ ] No TODO/FIXME left for the completed work
- [ ] Final report accurately states verified and remaining work
