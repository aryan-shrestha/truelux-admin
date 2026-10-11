# API error contract

Status: Implemented

Last updated: 2026-10-11

---

## Goal

Turn every failed request — an API error, an unexpected body, or no response at
all — into one typed `ApiError`, so screens branch on one shape.

---

## Scope

What is included in this implementation?

- `ApiError` with `status`, `code`, `message`, `details` and `requestId`
- Parsing the API's envelope `{"error": {"code", "message", "details"}}` with Zod
- The Axios response interceptor that converts every failure
- `ApiError` as TanStack Query's default error type, and the retry rule built on it
- The route error page showing the message and request id
- `describeError`: one map from `code` to the sentence staff see, used by toasts and
  form alerts
- `fieldErrors`: a `validation_error`'s `details` as one message per field, for forms
  to apply with `setError`

What is explicitly outside the scope?

- Which form field a given API field maps to: each form decides (see
  [../convention.md](../convention.md#forms))
- Redirecting to sign-in on 401: staff-auth

---

## Context

The API's envelope and its codes are defined in
`back-end/docs/architecture.md#error-handling` and
`back-end/docs/features/api-error-contract.md`. The API sets `X-Request-ID` on every
response, logs with it, and exposes the header to the admin's origin through CORS
(`CORS_EXPOSE_HEADERS`).

---

## Planned

None.

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
- `describeError(error)` in `errors.ts`, ported from `../admin/lib/api/errors.ts`:
  - `validation_error` → the API's own `message`
  - a known code → its sentence, from one `MESSAGES` map
  - anything else → "Something went wrong (ref <requestId>)." or, without a request
    id, "Something went wrong."

  | `code`                      | Sentence                                                                                          |
  | --------------------------- | ------------------------------------------------------------------------------------------------- |
  | `network_error`             | The server could not be reached. Check your connection and try again.                             |
  | `authentication_failed`     | Your session has ended. Sign in again.                                                            |
  | `permission_denied`         | Your account does not have access to this.                                                        |
  | `not_found`                 | That record no longer exists.                                                                     |
  | `conflict`                  | This duplicates an existing record. Check the name, slug or SKU, or the variant's size and shade. |
  | `throttled`                 | Too many requests. Wait a moment and try again.                                                   |
  | `invalid_refresh_token`     | Your session had already ended.                                                                   |
  | `product_has_no_variants`   | Add at least one variant before publishing.                                                       |
  | `invalid_status_transition` | The order cannot move to that status from where it is now.                                        |
  | `order_already_shipped`     | The order has already shipped, so it can no longer be changed that way.                           |
  | `order_not_cancellable`     | Only pending or confirmed orders can be cancelled.                                                |

  A feature may override a sentence where the context says more (staff-auth's
  sign-in message; taxonomy's in-use message for a delete `conflict`). Used by the
  query cache's refetch toast ([tanstack-query.md](tanstack-query.md)) and the login
  form.

- `fieldErrors(error)` in `errors.ts`: for each `details` entry, the first string of
  an array or the string itself; anything else is skipped. No caller yet: the first
  form that maps a `validation_error` onto fields (taxonomy or products) uses it.

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
- A refused CORS preflight (the admin's origin missing from the API's
  `DJANGO_CORS_ALLOWED_ORIGINS`) also arrives without a response, so it is a
  `network_error` too, and never reaches the API's logs.

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
  response; each code maps to its sentence; `validation_error` keeps the API's
  message; an unknown code carries the request id; `fieldErrors` takes the first
  message and skips values that are not messages.
- `src/lib/repositories/client.test.ts` — a real request through `httpClient` to
  `/api/v1/...` rejects with `ApiError` carrying the API's status and code (MSW).

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
