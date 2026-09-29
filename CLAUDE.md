# IMPHNEN Superapp

moon + pnpm monorepo for IMPHNEN (Ingin Menjadi Programmer Handal Namun Enggan Ngoding), Indonesia's largest programmer community: the API and every frontend, all on Cloudflare Workers. `README.md` has the full picture; `docs/port/*.md` records how each domain was ported from the old Rust backend and why.

## Tech Stack

- **Monorepo**: moon 2 + pnpm 11 workspaces, versions pinned in `.prototools`, shared deps in the `catalog` of `pnpm-workspace.yaml`
- **API** (`apps/api`): Hono + oRPC + Effect v4 on a Worker, Drizzle on D1, R2 for files, Cloudflare Email, better-auth (session cookies on `*.imphnen.dev`)
- **Apps**: Astro (landing, static), Vite + React 19 with TanStack Router (all others), each deployed as a static-assets Worker on its own domain
- **Data in apps**: typed oRPC client + TanStack Query from `@imphnen-frontend-service/service/rpc`, sessions from `@imphnen-frontend-service/service/session`
- **Styling**: Tailwind CSS v4, class-variance-authority (CVA)
- **Forms**: react-hook-form + zod
- **Quality**: Biome, tsc / astro check, Vitest, Playwright (dimentorin e2e)
- **Node**: v24

## Before writing code

| Before | Read |
|---|---|
| Any `.ts`/`.tsx` in `apps/api` or `packages/{schemas,contract,permissions,messages,activity}` | `.claude/skills/ts-conventions/SKILL.md` (arrow functions, explicit return types, T/E prefixes, no plain strings, ts-pattern, ts-belt, 200-line files, no comments) |
| Effect code in `apps/api` | `node_modules/effect/AGENTS.md`, then `docs/effect-services.md` |
| A new API module, procedure, table or permission | `docs/adding-a-module.md` (every touchpoint, including the ones no directory listing reveals) |

Formatting is Biome with 2 spaces and single quotes (`biome.json`).

## API rules that are easy to get wrong

- D1 is SQLite with no interactive transactions: a write that must be atomic is one `db.batch([...])` or one conditional `UPDATE ... WHERE ... RETURNING`, never read-then-write across awaits
- Every procedure is guarded: `permissionGuarded(PERMISSION.X)`, `sessionGuarded` for any signed-in user, or `implementer` for a deliberately public one (listed in `bootstrap/router.test.ts`)
- Schema changes go through `moon run api:db-generate`; never hand-write migration SQL. Apply with `api:db-migrate-local` / `api:db-migrate-remote`
- `moon run api:arch` enforces module and layer boundaries (use-case tests use fake layers, not infrastructure)
- Bindings and vars come from `cloudflare:workers`; after changing `wrangler.jsonc` run `moon run api:types`

## Apps rules

- Data access lives in hooks over `orpc.<module>.<procedure>.queryOptions/mutationOptions`; components render only
- Auth: `useCurrentUser()` (`me`, `status`, `can(PERMISSION.X)`) and the session mutations; there are no tokens to store
- `packages/ui` must not use router-typed `Link`/`navigate` to app-specific paths, because it is shared by apps with different route trees
- Components have their own folder with `component.tsx`, `index.ts`, `spec.tsx`, `stories.tsx`; use `cn()` for className merging; `'use client'` on components using hooks
- Landing uses the `container` class; Tailwind v4 needs the explicit `margin-inline: auto` in globals.css

## Commands

Everything goes through `make` or `moon`; do not `cd` into a package to run scripts.

```bash
make <app>                 # dev server (make api for the API on :8787)
moon run <app>:build       # build one app
moon run :typecheck        # tsc / astro check
moon run :test             # vitest
moon run :check            # biome
moon ci                    # what CI runs (affected only)
moon run <app>:deploy      # deploy one Worker with the local wrangler login
```

## Releases

Conventional Commits. Each finished, green increment gets a `chore(release): x.y.z` commit bumping the root `package.json` version (minor for features, patch for fixes) and an annotated `vX.Y.Z` tag, pushed to `develop` right away. The pre-push hook runs `moon ci --base origin/develop`.
