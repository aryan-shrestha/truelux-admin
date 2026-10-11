# API error contract

Status: Implemented

Last updated: 2026-10-11

---

## Goal

Turn every failed request — an API error, a BFF error, an unexpected body, or no
response at all — into one typed `ApiError`, so screens branch on one shape.

---

## Scope

What is included in this implementation?

- `ApiError` with `status`, `code`, `message`, `details` and `requestId`
- Parsing the API's envelope `{"error": {"code", "message", "details"}}` with Zod
- The Axios response interceptor that converts every failure
- `ApiError` as TanStack Query's default error type, and the retry rule built on it
- The route error page showing the message and request id

What is explicitly outside the scope?

- Mapping `validation_error` details onto form fields: each form does it (see
  [../convention.md](../convention.md#forms))
- Redirecting to sign-in on 401: staff-auth

---

## Context

The API's envelope and its codes are defined in
`back-end/docs/architecture.md#error-handling` and
`back-end/docs/features/api-error-contract.md`. The API sets `X-Request-ID` on every
response and logs with it. The BFF returns the same envelope for its own 404 and
502 ([bff.md](bff.md)).

---

## Planned

- Everything in Scope.

---

## Implemented

- `src/lib/repositories/errors.ts` — `ApiError`; `toApiError(error)`:
  - an `ApiError` is returned unchanged
  - an Axios error with a response whose body parses as the envelope becomes
    `ApiError` with the API's `code`, `message` and `details`
  - a response with any other body becomes `unexpected_response` with the HTTP
    status
  - anything without a response becomes `network_error` with status 0
  - `requestId` is the response's `X-Request-ID`
- `src/lib/repositories/client.ts` — the response interceptor rejects with
  `toApiError(error)`.
- `src/app/query-client.ts` — `Register.defaultError = ApiError`; queries retry at
  most twice and never on a 4xx.
- `src/components/feedback/route-error.tsx` — the root `errorComponent`: message,
  request id when there is one, and a retry button.

---

## Remaining

None.

---

## Decisions

### Decision: unknown bodies become `unexpected_response`, not a guessed code

**Decision**

A response that is not the envelope (an HTML error page from a proxy, an empty 502)
keeps its status and gets the code `unexpected_response`.

**Reason**

Inventing `server_error` for it would claim the API said something it did not.

**Consequence**

Screens treat `unexpected_response` like any other unexpected failure: show the
message and the request id if present.

---

## Gotchas

- `details` is `{}` for most errors, a field → messages map for
  `validation_error`, and domain-specific context for 422 domain errors. Read it per
  `code`.
- `status` 0 means no response; check `code === "network_error"` rather than the
  status.

---

## API

### Errors

```json
{
  "error": {
    "code": "validation_error",
    "message": "Enter a valid email address.",
    "details": { "email": ["Enter a valid email address."] }
  }
}
```

The full code table is in `back-end/docs/architecture.md#error-handling`.

---

## Data changes

None.

---

## Permissions

None.

---

## Tests

- `src/lib/repositories/errors.test.ts` — the envelope, an unexpected body, and no
  response.
- `src/lib/repositories/client.test.ts` — a real request through `httpClient` to
  `/bff/api/...` rejects with `ApiError` carrying the API's status and code (MSW).

---

## Files

```text
src/lib/repositories/
├── errors.ts
├── client.ts
├── errors.test.ts
└── client.test.ts
src/app/query-client.ts
src/components/feedback/route-error.tsx
```

---

## Future context

None.
