# Shipping settings

Status: Planned

Last updated: 2026-09-27

---

## Goal

Let the merchant change the shipping fees and turn a free-shipping threshold on or off
without a deploy.

---

## Scope

What is included in this implementation?

- A **Settings** group in the sidebar, with a **Shipping** page at `/settings/shipping`.
- A shadcn `form` (react-hook-form + zod), with fields:
  - Inside Kathmandu valley fee (NPR)
  - Outside valley fee (NPR)
  - A "Free shipping" `switch`, and when it is on, a threshold amount (NPR)
- Amounts are decimal strings, validated like other prices (ADR 0003). Turning the
  switch off sends `free_shipping_threshold: null`.
- Short help text explains that changes apply to new orders immediately, and that the
  storefront banner updates within its refresh window.
- Following ADR 0005:
  - the read goes through a Route Handler plus `queryOptions`, prefetched and
    hydrated on the server;
  - the save is a server action wrapped in `useMutation`, invalidating the query and
    showing a `sonner` toast;
  - errors branch on the API's `code`.

What is explicitly outside the scope?

- Per-district fees
- Settings history or audit

---

## Context

API: `GET, PATCH /api/v1/admin/settings/shipping/` in
`../back-end/docs/features/checkout-quote-and-shipping.md`.

---

## Tests

To be written:

- The zod schema: negative fees are rejected, and with the switch on the threshold is
  required and must be > 0.
- The form sends `null` when the switch is off.
- An e2e test against the live API: change the threshold, reload, see it persist, then
  restore the original value in `afterAll`.
