# <Feature name>

Status: Planned

Last updated: YYYY-MM-DD

---

## Goal

What problem does this feature solve?

Keep this short.

---

## Scope

What is included in this implementation?

- ...
- ...
- ...

What is explicitly outside the scope?

- ...
- ...

---

## Context

What existing code or architecture is relevant?

Mention the important routes, repositories, queries, schemas, back-end endpoints,
or external systems that future implementation work needs to understand.

---

## Planned

The intended implementation:

- ...
- ...
- ...

---

## Implemented

Only record behavior that actually exists in the code.

- `src/routes/_dashboard/<domain>/...` — ...
- `src/features/<domain>/repositories/<domain>.repository.ts` — ...
- `src/features/<domain>/queries/<domain>.queries.ts` — ...
- `src/features/<domain>/schemas/<name>.schema.ts` — ...
- `src/features/<domain>/components/...` — ...

---

## Remaining

Anything incomplete, intentionally deferred, or blocked.

If nothing remains:

```text
None.
```

If blocked, explain why:

```text
- Add X after Y is available because ...
```

Do not hide incomplete work.

---

## Decisions

Record decisions that future implementation work needs to preserve.

### Decision: <short title>

**Decision**

...

**Reason**

...

**Consequence**

...

---

## Gotchas

Record surprising behavior, constraints, or implementation details that are easy
for a future engineer or AI agent to miss.

Examples:

- Authentication is enforced by `<location>`, not individual routes.
- The API returns this field as a decimal string, not a number.
- This list must be invalidated after ... because ...
- The endpoint redirects when the trailing slash is missing.

Only record durable knowledge.

---

## API

Document the API behavior this feature relies on when relevant.

### Endpoint

```text
METHOD /api/...
```

### Request

```json
{}
```

### Response

```json
{}
```

### Errors

```json
{}
```

Do not duplicate the entire API documentation: link the back-end feature document,
which is authoritative, and record only what this feature depends on.

---

## Data changes

Document relevant:

- new or changed Zod schemas
- query keys and what invalidates them
- URL search params
- persisted client state

If there are no data changes:

```text
None.
```

---

## Permissions

Document important authorization rules.

Examples:

- signed-in staff only (enforced by the API)
- which API errors the screen expects (401, 404, 422) and how it shows them

---

## Tests

Record the tests that verify the feature.

- `src/features/<domain>/.../....test.tsx` — "..."
- `e2e/....spec.ts` — "..."

Include important scenarios rather than every test name.

---

## Files

List the important files involved in the feature.

```text
src/features/<domain>/
├── repositories/
├── queries/
├── schemas/
├── components/
└── index.ts
```

---

## Future context

Only record information that will save a future session from rediscovering
something important.

Do not write a chronological implementation diary.
