# ADR 0004: Every environment variable is required

Status: Accepted

Date: 2026-10-11

Supersedes: None

---

## Context

The BFF needs to know where the API is. A default such as
`http://localhost:8000` makes a misconfigured deployment start and then fail on every
request, far from the cause. The back-end made the same choice for the same reason
([back-end ADR 0008](../../../back-end/docs/decisions/0008-every-environment-variable-is-required.md)).

---

## Decision

Every environment variable is required and has no default. The BFF reads them once,
through `readServerEnv` in `server/env.ts`, which validates them with Zod and throws
one error naming every missing or invalid variable. Nothing else reads
`process.env`.

`.env.example` lists every variable. Locally, `yarn dev` loads `.env` with
`tsx --env-file`.

The SPA has no environment variables. If one is ever needed it is read through a Zod
schema in `src/lib/env.ts`, and it must not be a secret, because every `VITE_*`
variable is embedded in the bundle.

---

## Reason

A configuration mistake stops startup with a message that names it, instead of
surfacing as a 502 on the first request.

---

## Alternatives considered

### Defaults for local development

Why it was not chosen: a development default silently becomes the production value
when a deployment forgets the variable.

---

## Consequences

### Positive

- A deployment is either fully configured or does not start.

### Negative

- A fresh clone must copy `.env.example` to `.env` before `yarn dev`.

### Constraints introduced

- Never call `process.env` outside `server/env.ts`.
- A new variable goes into the schema, `.env.example` and the README together.

---

## Implementation

```text
server/env.ts
.env.example
package.json        dev script: tsx --env-file=.env
```

---

## Future reconsideration

No known reconsideration criteria.
