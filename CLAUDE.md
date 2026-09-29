# IMPHNEN Superapp

moon + pnpm monorepo for IMPHNEN (Ingin Menjadi Programmer Handal Namun Enggan Ngoding), Indonesia's largest programmer community. See `README.md` for the full picture.

## Tech Stack

- **Monorepo**: moon 2 + pnpm 11 workspaces, versions pinned in `.prototools`, shared deps in the `catalog` of `pnpm-workspace.yaml`
- **Framework**: Astro (landing, static), Vite + React 19 (all other apps)
- **Routing**: TanStack Router with file-based routes (`src/routes`, `routeTree.gen.ts` is generated)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`, class-variance-authority (CVA)
- **State**: Zustand, TanStack React Query
- **Forms**: react-hook-form + zod
- **Quality**: Biome (format + lint), tsc, Vitest, Playwright (dimentorin e2e)
- **Deploy**: Cloudflare Pages, one project per app (`imphnen-<app>`)
- **Node**: v24

## Layout

- `apps/<app>`: landing, backoffice, hackathon, dimentorin, gacha, qrcampaign, imphnenos, infra. Each has `package.json`, `moon.yml`, and builds into its own `dist/`
- `packages/utils`, `packages/service`, `packages/ui`: shared source packages, consumed as `@imphnen-frontend-service/<name>` (`ui` exports `/atoms`, `/molecules`, `/organisms`)
- `deploy/pages`: the `/v1` proxy Pages Function and `_headers` shared by every app

**Dependency rule**: `ui` -> `service` -> `utils`, never the reverse. moon tags enforce it. Inside `packages/ui`, import sibling layers relatively (`../../atoms`), not by package name.

A new third-party import must be added to that project's own `package.json` (use `catalog:` if the version is in the catalog), because pnpm does not hoist.

## Commands

Everything goes through `make` or `moon`; do not `cd` into a package to run scripts.

```bash
make <app>                 # dev server
moon run <app>:build       # build one app
moon run :build            # build everything
moon run :typecheck        # tsc / astro check
moon run :test             # vitest
moon run :check            # biome
moon ci                    # what CI runs (affected only)
```

## Environment Variables

- Vite apps: `VITE_API_URL` (leave empty in production; the Pages Function proxies `/v1`), `VITE_GITHUB_CLIENT_ID`
- Landing (Astro): `PUBLIC_API_URL`, defaults to `https://api.imphnen.dev`
- `getBaseURL()` in `packages/service/src/api/index.ts` handles both

## Key Conventions

- Atomic design: atoms -> molecules -> organisms
- Components have their own folder with `component.tsx`, `index.ts`, `spec.tsx`, `stories.tsx`
- Use `cn()` from `@imphnen-frontend-service/utils` for className merging
- Button variants via CVA: `primary`, `secondary`, `text`, `bordered`, `success`, `danger`
- Some CI gates start off for existing debt (see "Known debt" in `README.md`); do not add new type errors or lint warnings
