# Shipping settings

Status: Planned

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

- `src/features/settings/` — `shipping-settings.repository.ts`
  (`getShippingSettings`, `updateShippingSettings`), `shipping-settings.schema.ts`
  (response, and the form schema), `settings.queries.ts`
  (`["settings", "shipping"]`), `settings.mutations.ts`, `components/shipping-settings-form.tsx`.
- `src/routes/_dashboard/settings/shipping.tsx` — loader ensures the query.
- Form schema: both fees match `^\d+(\.\d{1,2})?$` (so ≥ 0); `has_free_shipping`
  boolean; while it is on, the threshold is required, matches the pattern and has a
  non-zero digit (> 0 without parsing the amount).
- The PATCH body maps `has_free_shipping: false` to `free_shipping_threshold: null`,
  whatever the threshold field holds.
- Each amount has an `Rs` `InputGroupAddon`, so the currency is visible and not part
  of the value. The threshold field is removed, not disabled, while the switch is off.
- On success the form resets to the saved values.
- `src/config/navigation.ts` — a **Settings** group with Shipping; from
  [app-shell.md](app-shell.md).
- The save mutation's `meta.invalidates` is the shipping settings key
  ([tanstack-query.md](tanstack-query.md#rules-for-features)).
- Add shadcn `switch` and `input-group` when building.

Error treatment: `validation_error` details land on the matching field; anything
else (such as `throttled`) is a form alert.

Planned tests: fees accept `0` and reject negatives, commas and three decimals; with
the switch on the threshold rejects empty, `0`, `0.00` and negatives; with it off the
threshold is ignored; the PATCH carries `null` when off and the trimmed string when
on; API field errors land on the field; Playwright: change the threshold, reload, see
it kept, then restore the original values.

---

## Implemented

None.

---

## Remaining

- Everything in Planned.

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

None yet; see Planned.

---

## Files

```text
src/features/settings/                         planned
src/routes/_dashboard/settings/shipping.tsx    planned
```

---

## Future context

None.
