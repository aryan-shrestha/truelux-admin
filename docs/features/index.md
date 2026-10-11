# Features

Current feature inventory.

TrueLux admin v2 is the staff back office for a multi-brand cosmetics store: a React
SPA with a backend-for-frontend (BFF) on the same origin that holds the staff JWT
and forwards calls to the TrueLux API in `../back-end` (ADR 0001). It replaces the
Next.js admin in `../admin`.

| #   | Feature            | Status      | Documentation                    | Depends on | Last updated |
| --- | ------------------ | ----------- | -------------------------------- | ---------- | ------------ |
| 1   | scaffold           | Implemented | `features/scaffold.md`           | —          | 2026-10-11   |
| 2   | bff                | In progress | `features/bff.md`                | 1          | 2026-10-11   |
| 3   | api-error-contract | Implemented | `features/api-error-contract.md` | 1, 2       | 2026-10-11   |
| 4   | staff-auth         | Planned     | —                                | 2, 3       | —            |
| 5   | dashboard          | Planned     | —                                | 4          | —            |
| 6   | taxonomy           | Planned     | —                                | 4          | —            |
| 7   | products           | Planned     | —                                | 4, 6       | —            |
| 8   | orders             | Planned     | —                                | 4          | —            |
| 9   | inventory          | Planned     | —                                | 7          | —            |
| 10  | shipping-settings  | Planned     | —                                | 4          | —            |
| 11  | deployment         | Planned     | —                                | 2          | —            |

`Depends on` refers to the `#` column of this table.

Planned features have no document yet. Each gets one, from
[`_TEMPLATE.md`](_TEMPLATE.md), when its work starts. Their scope follows the API
areas in [../integrations/truelux-api.md](../integrations/truelux-api.md); what
`../admin` already built for each (its `docs/features/`) is the starting point to
port, not a contract.

## Contracts with the back-end

- The BFF is "the admin app's server" of back-end ADR 0012: it obtains tokens from
  `/api/v1/auth/token/`, keeps them in httpOnly cookies, and sends
  `Authorization: Bearer`. The API needs no CORS entry for the admin.
- The BFF forwards only `/api/v1/admin/*` and `/api/v1/auth/me/`.
- The back-end's documents still describe "the Next.js admin app". They are not
  wrong about the contract, but should be updated when v2 replaces v1.

## Not done

- **Nothing is deployed**, and nothing works past the shell until staff-auth lands:
  every API call returns 401.

## Architectural decisions

| ADR  | Decision                                                           | Governs                           |
| ---- | ------------------------------------------------------------------ | --------------------------------- |
| 0001 | The admin is an SPA behind a BFF that holds the JWT                | bff, staff-auth, deployment       |
| 0002 | Server state lives in TanStack Query; Zustand holds UI state only  | every feature                     |
| 0003 | Features are vertical slices; repositories are the only HTTP layer | every feature; `eslint.config.js` |
| 0004 | Every environment variable is required                             | bff, deployment                   |

## Deferred

Staff roles (the API has none), bulk import/export (the owner's workbook import runs
on the back-end), and anything the API does not offer.

## Status definitions

- **Planned** — documented but implementation has not started.
- **In progress** — implementation has started but is incomplete.
- **Implemented** — documented scope is implemented and verified.
- **Blocked** — implementation cannot continue because of a documented blocker.
- **Deprecated** — feature exists but should not receive new development.
