# ADR 0003: Features are vertical slices; repositories are the only HTTP layer

Status: Accepted

Date: 2026-10-11

Supersedes: None

---

## Context

The admin will grow a screen set per back-end resource: products, brands, taxonomy,
orders, inventory, shipping settings and the dashboard. Organising by technical kind
(`components/`, `hooks/`, `api/` at the top level) scatters each domain across the
tree and lets any file call the API from anywhere, which is how unparsed responses
and duplicated request code appear.

---

## Decision

- Code is grouped by domain under `src/features/<domain>/`, each with
  `repositories/`, `queries/`, `schemas/`, `components/` and `hooks/` as needed, and a
  public `index.ts`.
- **Repositories are the only code that performs HTTP.** A repository function sends
  one request through `httpClient` and returns the response parsed by a Zod schema.
- Features import one another only through `index.ts`.
- Shared code (`src/components`, `src/lib`, `src/stores`, `src/hooks`,
  `src/config`) never imports a feature or a route.

`eslint.config.js` enforces the last three rules with `no-restricted-imports`:
`axios` only in `src/lib/repositories/`, `@/lib/repositories/client` only in a
feature's `repositories/`, no `@/features/<name>/<path>` deep imports, and no feature
or route imports from shared code.

---

## Reason

A slice keeps everything a change to one screen touches in one folder. Making
repositories the single HTTP layer gives one place where every response is parsed,
so a back-end contract change fails at a known point with a Zod error rather than as
`undefined` in a component.

The folder is named `repositories/`, not `api/`, because it describes the role (the
data source for a feature) rather than the transport.

---

## Alternatives considered

### Folders by technical kind

Why it was not chosen: a feature change touches five distant folders, and nothing
stops a component from calling the HTTP client.

### One global API module

Why it was not chosen: it grows into a file that every feature depends on and nobody
owns, and it couples unrelated domains.

---

## Consequences

### Positive

- Deleting a feature is deleting a folder.
- The contract with the API is visible per feature, in its schemas and repositories.

### Negative

- Small features still need the folder structure.
- Code genuinely shared by two features must move to shared code, without business
  meaning, or be exposed through one feature's `index.ts`.

### Constraints introduced

- Never call `httpClient` outside `src/features/*/repositories/`.
- Never return an unparsed response from a repository.

---

## Implementation

```text
eslint.config.js
src/lib/repositories/client.ts
src/features/
docs/convention.md
```

---

## Future reconsideration

No known reconsideration criteria.
