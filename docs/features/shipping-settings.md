# Shipping settings

Status: Implemented

Last updated: 2026-09-27

---

## Goal

Let the merchant change the shipping fees and turn a free-shipping threshold on or off
without a deploy.

---

## Scope

What is included in this implementation?

- A **Settings** group in the sidebar, with a **Shipping** page at `/settings/shipping`.
- A shadcn form (react-hook-form + zod) with the inside-valley fee, the
  outside-valley fee, a **Free shipping** `switch` and, while it is on, a threshold
  amount. Amounts are decimal strings (ADR 0003). Turning the switch off sends
  `free_shipping_threshold: null`.
- Help text: changes apply to new orders immediately, placed orders keep their fee,
  and the storefront's banner catches up on its next refresh.
- ADR 0005 end to end: a Route Handler plus `queryOptions`, prefetched and hydrated;
  the save is a server action in `useMutation` that invalidates the query and toasts.

What is explicitly outside the scope?

- Per-district fees
- Settings history or audit

---

## Context

API: `GET, PATCH /api/v1/admin/settings/shipping/`, transcribed in
[backend-api.md](../integrations/backend-api.md#shipping-settings) from
`../back-end/docs/features/checkout-quote-and-shipping.md`.

---

## Implemented

- `app/(admin)/settings/shipping/page.tsx` — fetches the settings into
  `["settings","shipping"]` with `getShippingSettings()` and renders the form inside
  `HydrationBoundary`.
- `app/api/settings/shipping/route.ts` — `GET`, `respond(() => getShippingSettings(apiGet))`.
- `lib/api/settings.ts` — `getShippingSettings(read)`, `updateShippingSettings(body)`
  (PATCH). `ShippingSettings` and `ShippingSettingsUpdate` in `lib/api/types.ts`.
- `lib/settings/queries.ts` — `settingsKeys` and `shippingSettingsQuery`.
- `lib/settings/schemas.ts` — `shippingSettingsSchema`: both fees match
  `MONEY_PATTERN` (so ≥ 0); `has_free_shipping` boolean; while it is on the threshold
  is required, matches `MONEY_PATTERN` and has a non-zero digit (> 0, without parsing
  the amount).
- `lib/settings/actions.ts` — `saveShippingSettings` re-validates, maps
  `has_free_shipping: false` to `free_shipping_threshold: null`, and PATCHes.
- `components/settings/ShippingSettingsForm.tsx` — `useSuspenseQuery` +
  `useActionForm` (invalidates `settingsKeys.shipping()`), `TextField` with an `Rs`
  prefix per amount, `SwitchField`, a threshold field shown while the switch is on,
  "Last updated" from `updated_at`, and a "Shipping settings saved" toast. On success
  the form resets to the saved values.
- `components/shell/AppSidebar.tsx` — a **Settings** group with **Shipping**.

---

## Remaining

- The backend endpoint was being built in parallel; see the e2e note under Tests.

---

## Decisions

### Decision: the form has a `has_free_shipping` field the API does not

**Decision**

The form holds the switch as `has_free_shipping` and the threshold as a string that
keeps its text while the switch is off. The server action turns the pair into
`free_shipping_threshold: string | null`.

**Reason**

Switching free shipping off and on again should not lose what was typed, and the
schema has no transform, so the server action can re-parse exactly what the client
sent (convention.md, Forms).

**Consequence**

The request body is built in `saveShippingSettings`, not in the form; its test
asserts the `null`.

---

## Gotchas

- The API's `validation_error` details use the same field names as the form, so
  `useActionForm` puts them on the matching field. A `details.has_free_shipping` can
  never arrive.
- `updated_at` is shown but never sent.

---

## Routes

```text
/settings/shipping    dynamic, noindex like every admin page
```

---

## API

### Calls

```text
GET   /api/v1/admin/settings/shipping/    server render; browser via /api/settings/shipping
PATCH /api/v1/admin/settings/shipping/    server action
```

### Errors handled

| `code`             | Treatment                                                         |
| ------------------ | ----------------------------------------------------------------- |
| `validation_error` | `details` on the matching field; anything else as a form alert    |
| anything else      | `describeError` as a form alert (`throttled`, unknown with a ref) |

---

## State and data

- Query cache: `["settings","shipping"]`, stale after the default 30 s.
- React state: form values.

---

## Accessibility

- Each amount's label names the zone; the `Rs` prefix is an `InputGroupAddon`, so
  the currency is visible and not part of the value.
- The threshold field is removed, not disabled, while the switch is off, so it is
  never announced as an invalid, unusable field.

---

## Tests

- `lib/settings/schemas.test.ts` — fees accept `0` and reject negatives, commas and
  three decimals; with the switch on, the threshold rejects empty, `0`, `0.00`,
  negatives; with it off, the threshold is ignored; a bad fee and a missing threshold
  are reported together.
- `lib/settings/actions.test.ts` — the PATCH body carries `null` when the switch is
  off (whatever the field holds) and the trimmed string when on; invalid input never
  reaches the API; `validation_error` details come back per field.
- `components/settings/ShippingSettingsForm.test.tsx` — turning the switch off hides
  the threshold, saves, toasts and invalidates the key; turning it on requires a
  threshold; API field errors land on the field; `throttled` shows as a form alert.
- `tests/e2e/shipping-settings.spec.ts` — against the live API: change the
  threshold, reload, see it kept; turn free shipping off and see it kept; a negative
  fee is refused. `afterAll` restores the original fees and threshold.

---

## Files

```text
app/(admin)/settings/shipping/page.tsx
app/api/settings/shipping/route.ts
components/settings/
lib/settings/
lib/api/settings.ts
tests/e2e/shipping-settings.spec.ts
```
