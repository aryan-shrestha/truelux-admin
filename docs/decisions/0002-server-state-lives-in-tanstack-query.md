# ADR 0002: Server state lives in TanStack Query; Zustand holds UI state only

Status: Accepted

Date: 2026-10-11

Supersedes: None

---

## Context

The admin uses both TanStack Query and Zustand. Without a rule, the same data ends up
in both, for example a product list fetched with Query and then copied into a store
"for convenience". Two copies drift: one is invalidated after a write and the other
is not, and the screen shows stale stock or a stale order status.

---

## Decision

Each kind of state has exactly one owner:

| State                             | Owner                                 |
| --------------------------------- | ------------------------------------- |
| Anything the API returns          | TanStack Query                        |
| Page, sort, filters, selected tab | URL search params, validated with Zod |
| Form drafts                       | React Hook Form                       |
| UI preferences (sidebar, theme)   | Zustand, persisted                    |

Zustand never holds data that came from the API.

---

## Reason

TanStack Query already provides caching, deduplication, background refresh and
invalidation keyed by request. Keeping server data only there means one write
invalidates one place. URL state makes lists bookmarkable and makes the back button
work. Zustand is the right tool for the little that is left: client-only
preferences shared by distant components.

---

## Alternatives considered

### No global store at all

Why it was not chosen: the sidebar's open state and the theme preference must
persist and are read in several unrelated places. Zustand with `persist` is smaller
than the context and storage code it replaces.

### Zustand as the data layer

Why it was not chosen: it would reimplement caching, deduplication and invalidation
that Query already provides, and every write would need hand-written cache updates.

---

## Consequences

### Positive

- One invalidation after a mutation refreshes every screen showing that data.
- Lists survive reloads and can be shared as links.

### Negative

- Components that need list state read it from the router, which is more verbose
  than a store selector.

### Constraints introduced

- No store stores API data, IDs of "the current" server object, or derived server
  values.
- Persisted stores hold nothing sensitive: they live in `localStorage`.

---

## Implementation

```text
src/app/query-client.ts
src/stores/ui.store.ts
src/lib/theme.ts
```

---

## Future reconsideration

No known reconsideration criteria.
