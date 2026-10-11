# ADR 0004: Every environment variable is required

Status: Accepted

Date: 2026-10-11

Supersedes: None

---

## Context

The SPA needs to know where the API is. A default such as `http://localhost:8000`
makes a misconfigured deployment build and then fail on every request, far from the
cause. The back-end made the same choice for the same reason
([back-end ADR 0008](../../../back-end/docs/decisions/0008-every-environment-variable-is-required.md)).

This decision first governed the BFF's environment. Since ADR 0005 removed the BFF,
it governs the SPA's `VITE_*` variables.

---

## Decision

Every environment variable is required and has no default. The SPA reads them once,
through `src/lib/env.ts`, which validates `import.meta.env` with Zod and throws one
error naming every missing or invalid variable. Nothing else reads
`import.meta.env.VITE_*`.

`.env.example` lists every variable. Vite loads `.env` in development and at build
time; tests set their own values in `vitest.config.ts`.

No variable is a secret: every `VITE_*` variable is embedded in the bundle.

---

## Reason

A configuration mistake stops the app with a message that names it, instead of
surfacing as a failed request against the wrong host.

---

## Alternatives considered

### Defaults for local development

Why it was not chosen: a development default silently becomes the production value
when a deployment forgets the variable.

---

## Consequences

### Positive

- A deployment is either fully configured or fails at once, naming the variable.

### Negative

- A fresh clone must copy `.env.example` to `.env` before `yarn dev`.

### Constraints introduced

- Never read `import.meta.env.VITE_*` outside `src/lib/env.ts`.
- A new variable goes into the schema, `.env.example`, `vitest.config.ts` and the
  README together.
- Never put a secret in a `VITE_*` variable.

---

## Implementation

```text
src/lib/env.ts
.env.example
vitest.config.ts    test.env
```

---

## Future reconsideration

No known reconsideration criteria.
