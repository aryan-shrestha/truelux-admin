# TrueLux admin

The merchant back office for the TrueLux cosmetics store, served at
`admin.truelux.com`. It owns no data: its Next.js server calls the Django API's
`/api/v1/auth/` and `/api/v1/admin/` routes and holds the staff tokens in httpOnly
cookies. The browser never talks to the API.

Start with [CLAUDE.md](CLAUDE.md) and [docs/architecture.md](docs/architecture.md).

## Local development

```bash
yarn install
cp .env.example .env.local   # API_BASE_URL, NEXT_PUBLIC_BRAND_NAME
yarn dev                     # http://localhost:3001 (the storefront uses 3000)
```

The API must be running at `API_BASE_URL` (`http://localhost:8000` by default). A
demo staff user comes from the backend's `make seed-staff`.

```bash
yarn lint
yarn typecheck
yarn test
yarn e2e          # skipped unless E2E_API, E2E_EMAIL and E2E_PASSWORD are set
yarn build
```

## Deploy on Vercel

1. **Import the repository** at vercel.com/new. The framework preset is Next.js; no
   build or output settings change, and no `vercel.json` is needed.
2. **Set the environment variables** for Production (and Preview if used):
   - `API_BASE_URL` — the API's https origin, for example `https://api.truelux.com`.
     Server-only; never prefix it with `NEXT_PUBLIC_`.
   - `NEXT_PUBLIC_BRAND_NAME` — `TrueLux`.

   The build fails if either is missing or malformed (`lib/env.ts`).

3. **Deploy**, then open the `*.vercel.app` URL and sign in with a staff account.
4. **Add the domain**: Project → Settings → Domains → `admin.truelux.com`.
5. **Create the DNS record** at the domain's DNS host:

   ```text
   Type   Name    Value
   CNAME  admin   cname.vercel-dns.com.
   ```

   Vercel issues the TLS certificate once the record resolves.

The API needs no CORS entry for this origin: only the admin's server calls it.

### Limits to know

- Vercel caps a function request body at 4.5 MB. Product images and brand logos go
  through a server action, so an image between 4.5 MB and the API's 5 MB limit fails
  on Vercel.
- Every page is rendered per request (it reads the session cookie); nothing is
  statically cached.
