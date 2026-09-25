# Deployment

Status: Planned

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
