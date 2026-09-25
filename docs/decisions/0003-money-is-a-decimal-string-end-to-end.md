# ADR 0003: Money is a decimal string end to end

Status: Accepted

Date: 2026-09-25

Supersedes: None

---

## Context

The API returns every amount as a decimal string. Floating-point arithmetic on money
silently corrupts totals.

---

## Decision

Amounts are `string` from the API to the pixel. `lib/format/money.ts` is the only
module that parses or formats one, including the chart conversion. Form inputs
validate prices as decimal strings (`^\d+(\.\d{1,2})?$`) and send strings.

---

## Consequences

### Constraints introduced

- No `Number()`, `parseFloat` or arithmetic on amounts outside `money.ts`.

---

## Implementation

```text
lib/format/money.ts
```
