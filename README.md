# IMPHNEN Superapp

<p align="center">
  <img src="docs/logo.svg" alt="IMPHNEN">
</p>

Monorepo for [IMPHNEN](https://imphnen.dev) (Ingin Menjadi Programmer Handal Namun Enggan Ngoding), Indonesia's largest programmer community: every frontend and the API, deployed on Cloudflare Workers.

## Apps

Each app is its own Cloudflare Worker (`imphnen-<app>`, static assets) on its own domain. The API is the `imphnen-api` Worker.

| App | Framework | URL |
|-----|-----------|-----|
| **api** | Hono + oRPC + Effect, D1, R2, better-auth | [api.imphnen.dev](https://api.imphnen.dev) |
| **landing** | Astro (static) | [imphnen.dev](https://imphnen.dev) |
| **backoffice** | Vite + React | [backoffice.imphnen.dev](https://backoffice.imphnen.dev) |
| **hackathon** | Vite + React | [hackathon.imphnen.dev](https://hackathon.imphnen.dev) |
| **dimentorin** | Vite + React | [dimentorin.imphnen.dev](https://dimentorin.imphnen.dev) |
| **gacha** | Vite + React | [gacha.imphnen.dev](https://gacha.imphnen.dev) |
| **qrcampaign** | Vite + React | [qr.imphnen.dev](https://qr.imphnen.dev) |
| **imphnenos** | Vite + React | [os.imphnen.dev](https://os.imphnen.dev) |
| **infra** | Vite + React | [infra.imphnen.dev](https://infra.imphnen.dev) |

Uploaded files are served from the R2 bucket `imphnen-storage` at [cdn.imphnen.dev](https://cdn.imphnen.dev).

## Shared Packages

| Package | Purpose |
|---------|---------|
| `packages/contract` | The oRPC contract: every procedure's method, path, input and output. The API implements it; the apps are typed by it |
| `packages/schemas` | Zod schemas shared by the contract, the API and the apps |
| `packages/permissions` | Permission keys (`resource:action`) and the fixed roles |
| `packages/messages` | User-facing copy and labels |
| `packages/activity` | Activity log vocabulary |
| `packages/version`, `packages/format` | App version, formatters |
| `packages/service` | For the apps: the typed oRPC client (`/rpc`) and better-auth session hooks (`/session`) |
| `packages/ui` | Atoms, molecules, organisms (atomic design) |
| `packages/utils` | Pure utilities: `cn()`, `For`, `Show`, `useQueryState`, `useModalLogin` |

moon project tags (`.moon/workspace.yml`) enforce the direction between layers, so an import the wrong way fails the first `moon run`.

## Getting Started

Requires [moon](https://moonrepo.dev/docs/install) and [proto](https://moonrepo.dev/proto), or Node 24 and pnpm 11 directly. Versions are pinned in `.prototools`.

```sh
pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars   # local API secrets
moon run api:db-migrate-local                      # create the local D1 schema
moon run api:db-seed-local                         # seed users (admin@imphnen.dev / password123)
make api                                           # API Worker on :8787
make <app>                                         # e.g. make backoffice, make landing
```

Uploaded public files are served in dev by the API at `/files/<key>` (development only; production serves them from the CDN). In dev every app proxies `/rpc` and `/api/auth` to the local API on `:8787` (override with `VITE_DEV_API_URL`), so the session cookie stays same-origin. In production the apps call `https://api.imphnen.dev` and share the session cookie across `*.imphnen.dev`.

Dependency versions shared by more than one package live once in the `catalog` of `pnpm-workspace.yaml`; a manifest refers to them as `catalog:`.

## Commands

Everything goes through `make` or `moon`; `make help` lists every target.

```sh
make <app>          # dev server for one app (make api for the API)
make build          # build every app
make check          # biome (format + lint)
make typecheck      # tsc / astro check
make test           # vitest
make ci             # what CI runs, on affected projects
moon run <app>:deploy          # build and deploy one app Worker (your wrangler login)
moon run api:deploy            # typecheck, test and deploy the API Worker
moon run api:db-generate       # generate a D1 migration from the Drizzle schema
moon run api:db-migrate-remote # apply pending D1 migrations to production
moon run dimentorin:e2e        # playwright, local only
```

## CI/CD

- **`.github/workflows/ci.yml`**: `moon ci` on every PR and on `develop` (biome, typecheck, tests, build for affected projects). The pre-push hook runs the same thing on the commits being pushed
- **`.github/workflows/deploy.yml`**: on push to `develop`, `.github/scripts/affected-apps.sh` picks the apps a push can change and runs `moon run <app>:deploy` for each. It can also be run by hand from the Actions tab with a list of apps
- **`.github/workflows/deploy-api.yml`**: on push to `develop` touching the API or its shared packages: typecheck and test, apply pending D1 migrations, deploy the API Worker

Both deploy workflows stay off until the repository variable `CLOUDFLARE_WORKERS_ENABLED` is `true` and the secrets `CLOUDFLARE_API_TOKEN` (Workers Scripts, Workers Routes, D1 and R2 edit) and `CLOUDFLARE_ACCOUNT_ID` exist. Until then, deploy from a machine with `moon run <app>:deploy`.

Each app's `wrangler.jsonc` sets its custom domain and serves `dist/` as static assets: SPAs fall back to `index.html`, the landing serves its `404.html`, and `public/_headers` marks hashed assets immutable.

### API resources (already created)

| Resource | Name |
|---|---|
| D1 database | `imphnen` (id in `apps/api/wrangler.jsonc`) |
| R2 bucket | `imphnen-storage`, public at `cdn.imphnen.dev` |
| R2 bucket (private) | `imphnen-private`, no public domain: mentor CVs and identity documents (`mentor/` keys), downloaded only through guarded API procedures |
| Email sending | enabled for `imphnen.dev`, sender `MAIL_FROM` |
| Secrets | `BETTER_AUTH_SECRET` (set); `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` optional, for Google sign-in |

Production started clean: nothing was migrated from the old Rust backend (Postgres, MinIO). Accounts are created by signing up, and the first admin is promoted by hand (see below).

### First admin

Sign up on any app with your own email and verify it with the emailed code, then give that account a role with your wrangler login:

```sh
make promote EMAIL=you@example.com ROLE=superadmin
```

`ROLE` is `superadmin`, `admin`, `mentor` or `user` (default `admin`). After that, roles are managed in the backoffice.

## Known debt

The Nx setup never ran `tsc` or unit tests in CI, so these gates start partly off:

- `typecheck` is off in CI for imphnenos (existing type errors). Run `moon run imphnenos:typecheck` to see them, then set `runInCI: true` in its `moon.yml` once it is clean
- `test` is off in CI for `ui` (16 stale specs)
- Biome rules the existing code breaks are warnings in `biome.json`; promote them back to errors as they are cleaned up
- Storybook was not installed; `*.stories.tsx` files are kept but excluded from typecheck

## Contributing

1. Branch off `develop`: `git checkout -b feat/feature-name`
2. Commit with Conventional Commits; the pre-push hook runs `moon ci` on what you push
3. Open a pull request to `develop`
