# Deployment

Status: Blocked

Last updated: 2026-10-11

---

## Goal

Deploy the admin at `admin.truelux.com` with the least configuration possible.

---

## Scope

What is included in this implementation?

- A static host that serves the built SPA (`dist/`) (ADR 0005)
- `VITE_API_URL` set at build time on the host; the app refuses to start without it
  (ADR 0004)
- The admin's origin added to the API's `DJANGO_CORS_ALLOWED_ORIGINS` on Render
- Search engines kept out: `robots.txt` disallowing everything and an
  `X-Robots-Tag: noindex, nofollow` header
- Security headers on every response: `Content-Security-Policy`,
  `X-Frame-Options: DENY` / `frame-ancestors 'none'`, `X-Content-Type-Options:
nosniff`, `Referrer-Policy: same-origin`, `Permissions-Policy`
- SPA fallback: unknown paths serve `index.html`
- README steps: create the service, set the variables, add the domain, the DNS record
- CI running lint, typecheck, tests and build

What is explicitly outside the scope?

- Preview environments per branch

---

## Context

- Requirements ported from `../admin/docs/features/deployment.md` (Implemented there,
  for Next.js on Vercel; never deployed).
- [ADR 0005](../decisions/0005-the-admin-is-a-static-spa-that-keeps-jwt-in-local-storage.md):
  the admin is static files calling the API from the browser; it superseded the BFF
  that needed a server on the admin's origin.
- The API runs on Render (`back-end/docs/features/deployment.md`).

---

## Planned

- Choose the static host (open decision: for example Vercel, Cloudflare Pages,
  Netlify or a Render static site) and record it in the README.
- Headers set in the host's config on every response. Without inline scripts, the
  CSP can be strict: `default-src 'self'`; `script-src 'self'`;
  `style-src 'self' 'unsafe-inline'` (Radix positions popovers with inline styles);
  `img-src 'self' https://res.cloudinary.com blob:`; `connect-src 'self'
<the API origin>`; `font-src 'self'`; `frame-ancestors 'none'`;
  `base-uri 'none'`; `form-action 'self'`; `object-src 'none'`. The strict
  `script-src` matters more since the tokens live in `localStorage` (ADR 0005).
- The SPA fallback in the host's config.
- `public/robots.txt` with `Disallow: /`.
- `engines.node` in `package.json`.
- A GitHub Actions workflow: `yarn install --immutable`, lint, typecheck, test, build.

Planned tests: a deployed unknown path serves `index.html`; every response carries
the headers (checked against the deployed site).

---

## Implemented

None.

---

## Remaining

- Everything in Planned. Blocked: which static host is the owner's decision, and
  every other item depends on it.

---

## Decisions

No decisions yet. `../admin` chose a CSP with `'unsafe-inline'` scripts because Next
inlines its bootstrap; this app has no inline script (the theme is applied from the
bundle, see [../architecture.md](../architecture.md#known-architectural-limitations)),
so that compromise is not needed.

---

## Gotchas

- A new image host must be added to `img-src`, and the API's origin must be in
  `connect-src`.
- The admin's origin must be in the API's `DJANGO_CORS_ALLOWED_ORIGINS`; without it
  every call fails as `network_error` and nothing reaches the API's logs.
- `VITE_API_URL` is baked into the bundle at build time: changing it needs a rebuild.

---

## API

None.

---

## Data changes

None.

---

## Permissions

None.

---

## Tests

None yet; see Planned.

---

## Files

```text
public/robots.txt         planned
.github/workflows/        planned
README.md
```

---

## Future context

None.
