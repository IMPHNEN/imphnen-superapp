# IMPHNEN Superapp

<p align="center">
  <img src="docs/logo.svg" alt="IMPHNEN">
</p>

Monorepo for [IMPHNEN](https://imphnen.dev) (Ingin Menjadi Programmer Handal Namun Enggan Ngoding), Indonesia's largest programmer community.

## Apps

Each app deploys to its own Cloudflare Pages project, `imphnen-<app>`.

| App | Framework | URL |
|-----|-----------|-----|
| **landing** | Astro (static) | [imphnen.dev](https://imphnen.dev) |
| **backoffice** | Vite + React | [backoffice.imphnen.dev](https://backoffice.imphnen.dev) |
| **hackathon** | Vite + React | [hackathon.imphnen.dev](https://hackathon.imphnen.dev) |
| **dimentorin** | Vite + React | [dimentorin.imphnen.dev](https://dimentorin.imphnen.dev) |
| **gacha** | Vite + React | [gacha.imphnen.dev](https://gacha.imphnen.dev) |
| **qrcampaign** | Vite + React | [qr.imphnen.dev](https://qr.imphnen.dev) |
| **imphnenos** | Vite + React | |
| **infra** | Vite + React | [infra.imphnen.dev](https://infra.imphnen.dev) |

## Shared Packages

| Package | Purpose | Depends on |
|---------|---------|------------|
| `packages/utils` | Pure utilities: `cn()`, `For`, `Show`, `useQueryState`, `useModalLogin` | nothing |
| `packages/service` | API clients, auth hooks, storage, constants | `utils` |
| `packages/ui` | Atoms, molecules, organisms (atomic design) | `utils`, `service` |

moon enforces the direction `ui -> service -> utils` through project tags (`.moon/workspace.yml`), so a reverse import fails the first `moon run`.

## Getting Started

Requires [moon](https://moonrepo.dev/docs/install) and [proto](https://moonrepo.dev/proto), or Node 24 and pnpm 11 directly. Versions are pinned in `.prototools`.

```sh
pnpm install
cp apps/<app>/.env.example apps/<app>/.env   # optional, defaults work for local dev
make <app>                                   # e.g. make backoffice, make landing
```

In dev, every Vite app proxies `/v1` to `https://api.imphnen.dev`, so no API URL is needed.

Dependency versions shared by more than one package live once in the `catalog` of `pnpm-workspace.yaml`; a manifest refers to them as `catalog:`.

## Commands

Everything goes through `make` or `moon`; `make help` lists every target.

```sh
make <app>          # dev server for one app
make build          # build every app into apps/<app>/dist
make check          # biome (format + lint)
make typecheck      # tsc / astro check
make test           # vitest (ui, dimentorin)
make ci             # what CI runs, on affected projects
moon run <app>:build
moon run dimentorin:e2e   # playwright, local only
```

## CI/CD

- **`.github/workflows/ci.yml`**: `moon ci` on every PR and on `develop` (biome, typecheck, build for affected projects)
- **`.github/workflows/deploy.yml`**: on push to `develop`, `.github/scripts/affected-apps.sh` picks the apps a push can change, and each one is built and deployed with `wrangler pages deploy`. It can also be run by hand from the Actions tab with a list of apps

The SPAs call a same-origin `/v1`. On Pages, `deploy/pages/functions/v1/[[path]].ts` forwards those requests to the API (set `API_ORIGIN` on a Pages project to point it elsewhere). `deploy/pages/_headers` marks hashed assets immutable, and Pages serves `index.html` for unknown paths, which covers SPA routing.

One-off setup:

1. Create the Pages projects: `pnpm exec wrangler login && make pages-create`
2. Add repository secrets `CLOUDFLARE_API_TOKEN` (Pages: Edit) and `CLOUDFLARE_ACCOUNT_ID`
3. Attach each custom domain to its `imphnen-<app>` project in the Cloudflare dashboard

## Known debt

The Nx setup never ran `tsc` or unit tests in CI, so these gates start partly off:

- `typecheck` is off in CI for backoffice, dimentorin, gacha, hackathon, imphnenos and qrcampaign (about 180 existing type errors). Run `moon run <app>:typecheck` to see them, then set `runInCI: true` in the app's `moon.yml` once it is clean
- `test` is off in CI for `ui` (16 stale specs) and `dimentorin` (one spec imports a route that no longer exists)
- Biome rules the existing code breaks are warnings in `biome.json`; promote them back to errors as they are cleaned up
- Storybook was not installed; `*.stories.tsx` files are kept but excluded from typecheck

## Contributing

1. Branch off `develop`: `git checkout -b feat/feature-name`
2. Make changes; lefthook runs biome, typecheck and tests before push
3. Open a pull request to `develop`
