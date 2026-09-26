# Deployment

Status: Implemented

Last updated: 2026-09-25

---

## Goal

Deploy the admin on Vercel at `admin.truelux.com` with the least configuration
possible.

---

## Scope

What is included in this implementation?

- `.env.example`: `API_BASE_URL` (server-only, the API's https origin) and
  `NEXT_PUBLIC_BRAND_NAME`. `lib/env.ts` validates both at startup and fails the
  build if either is missing.
- `vercel.json` only if something is needed beyond the defaults
- `robots` disallows everything, and `noindex` metadata
- Security headers in `next.config.ts`: `X-Frame-Options: DENY`,
  `Referrer-Policy`, `X-Content-Type-Options`, and a basic CSP
- README section: import the repo in Vercel, set the env vars, add the domain,
  create the DNS CNAME

---

## Implemented

- `.env.example` — `API_BASE_URL=http://localhost:8000`, `NEXT_PUBLIC_BRAND_NAME=TrueLux`,
  and the commented Playwright-only `E2E_*` variables. `.gitignore` ignores `.env*`
  except `.env.example`.
- `lib/env.ts` — zod validates both variables (the API origin must be an http(s) URL)
  and throws a message saying where to set them. `next.config.ts` imports it, so
  `next build` and `next dev` fail when either is missing.
- `next.config.ts` — headers on every path: `Content-Security-Policy`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: same-origin`, `X-Robots-Tag: noindex, nofollow` and a
  `Permissions-Policy`; `poweredByHeader: false`;
  `serverActions.bodySizeLimit: "6mb"` for image uploads; `images.remotePatterns`
  for Cloudinary and the API origin's `/media/**`, with `dangerouslyAllowLocalIP`
  only when `API_BASE_URL` is localhost.
- `app/robots.ts` — disallows everything; `app/layout.tsx` sets
  `robots: { index: false, follow: false }`.
- `README.md` — local setup, the checks, and the Vercel steps: import, env vars,
  domain, `CNAME admin → cname.vercel-dns.com.`
- `package.json` — `yarn dev`/`yarn start` on port 3001; `engines.node` `22.x`.
- No `vercel.json`: nothing needs more than the defaults.

---

## Remaining

- Not yet deployed.

---

## Decisions

### Decision: a CSP without nonces

**Decision**

`script-src 'self' 'unsafe-inline'` (plus `'unsafe-eval'` in development only).

**Reason**

Next inlines its bootstrap scripts; nonces would need the proxy to mint one per
request and every page to be dynamic, which they are, but it adds moving parts the
brief did not ask for. `frame-ancestors`, `object-src`, `base-uri` and `form-action`
are locked down.

**Consequence**

The CSP limits where images and connections go more than it stops injected inline
script. Moving to nonces is a proxy change plus `script-src 'nonce-…'`.

---

## Gotchas

- `img-src` lists `https://res.cloudinary.com` and the `API_BASE_URL` origin (the
  backend's local storage in development) and `blob:` for upload previews. A new image
  host needs adding here.
- Vercel caps a function request body at 4.5 MB, below the API's 5 MB image limit.
- `lib/env.ts` is evaluated by `next.config.ts` in plain Node, so it must not import
  `server-only`.

---

## Routes

```text
/robots.txt    static; Disallow: /
```

---

## API

None.

---

## State and data

None.

---

## Accessibility

None.

---

## Tests

- `lib/env.test.ts` — a trailing slash is stripped; a missing variable and a
  non-http(s) origin fail.

---

## Files

```text
.env.example
lib/env.ts
next.config.ts
app/robots.ts
README.md
```
