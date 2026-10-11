# Shipping settings

Status: Implemented

Last updated: 2026-10-11

---

## Goal

Let the merchant change the shipping fees and turn a free-shipping threshold on or
off without a deploy.

---

## Scope

What is included in this implementation?

- A **Settings** group in the sidebar with **Shipping**, at `/settings/shipping`
- A form with the inside-valley fee, the outside-valley fee, a **Free shipping**
  `switch` and, while it is on, a threshold amount. Amounts are decimal strings.
  Turning the switch off sends `free_shipping_threshold: null`.
- Help text: changes apply to new orders immediately, placed orders keep their fee,
  and the storefront's banner catches up on its next refresh
- "Last updated" from the API's `updated_at`, and a "Shipping settings saved" toast

What is explicitly outside the scope?

- Per-district fees
- Settings history or audit

---

## Context

- Requirements ported from `../admin/docs/features/shipping-settings.md`
  (Implemented there).
- API: `GET, PATCH /api/v1/admin/settings/shipping/`,
  `back-end/docs/features/admin-api.md` § Shipping settings and
  `checkout-quote-and-shipping.md`. Fees ≥ 0; the threshold > 0 or `null`.
- Freshness `reference` ([tanstack-query.md](tanstack-query.md)).

---

## Planned

None.

---

## Implemented

- `src/features/settings/`:
  - `schemas/shipping-settings.schema.ts` — the API's shape, amounts as strings
  - `schemas/shipping-form.schema.ts` — both fees `MONEY_PATTERN` (so ≥ 0);
    `has_free_shipping`; while it is on, the threshold matches the pattern and has a
    non-zero digit (above 0, judged on the digits, never as a float); while it is off,
    the threshold is not checked
  - `shipping-body.ts` — `free_shipping_threshold: null` when off, whatever the field
    holds; the trimmed amount when on
  - `repositories/shipping-settings.repository.ts` — `getShippingSettings`,
    `updateShippingSettings`
  - `queries/settings.queries.ts` — `settingsKeys` (`["settings", "shipping"]`),
    `settingsQueries.shipping()` (`reference`)
  - `queries/settings.mutations.ts` — `useUpdateShippingSettings` writes the PATCH's
    answer into the cache (nothing else in the admin shows the fees, so nothing is
    invalidated)
  - `components/shipping-settings-form.tsx` — the fees and the threshold in `Rs`
    input groups, the **Free shipping** switch (the threshold field is removed while
    off and keeps its value for turning it back on), the help text, "Last updated" from
    `updated_at`; on success a "Shipping settings saved" toast and a reset to the saved
    values; the API's field errors under their fields (`showApiError`)
- `src/routes/_dashboard/settings/shipping.tsx` — awaits the settings in the loader.
- `src/config/navigation.ts` — the **Settings** group with **Shipping**.

---

## Remaining

- `e2e/shipping-settings.spec.ts` has not been run against the live API (see
  [staff-auth.md](staff-auth.md#remaining)).

---

## Decisions

### Decision: the form has a `has_free_shipping` field the API does not

**Decision**

The form holds the switch as `has_free_shipping` and keeps the threshold's text while
the switch is off; the mutation turns the pair into
`free_shipping_threshold: string | null`.

**Reason**

Carried over from `../admin`: switching free shipping off and on again should not
lose what was typed.

**Consequence**

The request body is built in the mutation, not the form, and its test asserts the
`null`.

---

## Gotchas

- The API's `validation_error` details use the API's field names, which match the
  form's except `has_free_shipping`, which never arrives.
- `updated_at` is shown but never sent.

---

## API

```text
GET   /api/v1/admin/settings/shipping/
PATCH /api/v1/admin/settings/shipping/
```

---

## Data changes

- Query key `["settings", "shipping"]`.

---

## Permissions

Signed-in staff (the API).

---

## Tests

- `shipping-body.test.ts` — fees accept `0` and reject `-1`, `1,500` and `150.505`;
  with the switch on, the threshold rejects empty, `0`, `0.00` and `-5`; with it off
  the threshold is ignored; the body carries `null` when off and the trimmed string
  when on.
- `components/shipping-settings-form.test.tsx` — starts from the API's settings and
  shows "Last updated"; switching off removes the threshold field and sends `null`;
  off and on again keeps the typed threshold; a threshold of 0 is refused without a
  request; the API's field error lands on its field.
- `e2e/shipping-settings.spec.ts` — change the threshold, reload, see it kept, then
  restore the original values (live API; skipped without staff credentials).

---

## Files

```text
src/features/settings/
src/routes/_dashboard/settings/shipping.tsx
e2e/shipping-settings.spec.ts
```

---

## Future context

None.
