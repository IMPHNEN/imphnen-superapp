# Legacy migration (Rust Postgres + MinIO to D1 + R2)

One-off tool that moves IMPHNEN production data from the old Rust backend (Postgres, MinIO) into the TypeScript API (Cloudflare D1, R2). It never writes to Postgres or MinIO: the Rust API and its database stay exactly as they were, which is what makes rollback a DNS change.

The mapping rules are the `## Migration mapping (TS port)` and `## TS port decisions` sections of `docs/port/{iam,dimentorin,gacha,cms,hackathon}.md`. The target schema is `apps/api/drizzle/*.sql`.

## How it works

| Stage | Command | What it does |
|---|---|---|
| Extract | `generate` | One `SELECT` per legacy table inside a `REPEATABLE READ READ ONLY` transaction on a read-only session. Timestamps become epoch milliseconds in SQL (`floor(extract(epoch ...) * 1000)`), JSON and `text[]` columns come back as text, `qr_code_data` as base64. Tables that do not exist are treated as empty and listed in the report. |
| Transform | `generate` | Pure steps, run in this order: `iam`, `dimentorin`, `gacha`, `cms`, `hackathon`. Each step returns target rows, patches to rows of earlier steps (role changes, hackathon avatars), rejects, adjustments and planned file copies. |
| Load | `generate`, `apply` | Multi-row `INSERT` files (at most 50 rows and 90 KB per statement, 400 statements or 2 MB per file), in dependency order, each starting with `PRAGMA defer_foreign_keys = true;`. `apply` runs them with `wrangler d1 execute DB --file`. |
| Verify | `verify` | Counts every target table in one query and runs `PRAGMA foreign_key_check` through `wrangler d1 execute --json`. |
| Files | `copy-files` | Copies every object the transforms reference from MinIO (or the inline QR PNG bytes, or an external image URL) to R2 under the new keys. Skips objects that already exist. |

Output directory (default `tools/legacy-migration/out/`, gitignored):

| File | Content |
|---|---|
| `sql/NNNN-<table>-<part>.sql` | The data, applied in name order |
| `reset.sql` | `DELETE FROM` every migrated table, reverse order (used by `apply --reset`) |
| `report.json` | Source counts per legacy table, target counts per table, rejects (by reason, each with table, id, reason, detail), adjustments (by rule), planned files, SQL file list, `blocked` |
| `files.json` | Planned copies with source, target key, content type and the rows that reference them |
| `files-result.json`, `files-fixup.sql` | Written by `copy-files`: result per object, and SQL that restores the fallback value of every column whose object failed to copy |
| `snapshot.json` | Only with `--snapshot-out`: the extracted dataset, for reruns without Postgres |

`out/` and snapshots hold password hashes and personal data. Keep them on the operator machine and delete them after the cutover.

## Prerequisites

- Node 24 and `pnpm install` at the repository root.
- `pnpm exec wrangler login` with an account that can edit the `imphnen` D1 database and the `imphnen-storage` R2 bucket.
- The real D1 `database_id` in `apps/api/wrangler.jsonc` (the committed value is a zero placeholder). `wrangler d1 list` shows it.
- An R2 API token with object read and write on `imphnen-storage` (S3 credentials).
- Network access to the production Postgres and MinIO from the operator machine.

Environment variables:

| Variable | Used by | Meaning |
|---|---|---|
| `LEGACY_DATABASE_URL` | generate | Postgres connection string. A read-only role is recommended; the tool also opens a read-only session. |
| `LEGACY_FILE_URL_PREFIXES` | generate | Comma-separated URL prefixes that point at the MinIO bucket, for example `https://cdn.imphnen.dev/imphnen-uploads/,https://minio.imphnen.dev/imphnen-uploads/`. A URL with one of these prefixes is treated as a MinIO key and copied. Without it, IAM avatars and mentor CVs keep their legacy URL (spec default) and only bare hackathon keys and QR PNGs are copied. |
| `STORAGE_PUBLIC_URL` | generate | Public R2 base URL stored in `user.image` and submission URLs. Defaults to `https://cdn.imphnen.dev`, the value in `wrangler.jsonc`. |
| `LEGACY_S3_ENDPOINT`, `LEGACY_S3_REGION`, `LEGACY_S3_BUCKET`, `LEGACY_S3_ACCESS_KEY_ID`, `LEGACY_S3_SECRET_ACCESS_KEY` | copy-files | MinIO, path-style (`https://host`, bucket `imphnen-uploads` by default in Rust, region `us-east-1` if unset). |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | copy-files | `https://<account id>.r2.cloudflarestorage.com`, bucket `imphnen-storage`. |

## Commands

Run from the repository root (or `node src/bin/<name>.ts` inside this package):

```bash
pnpm --filter @app/legacy-migration run generate --snapshot-out out/snapshot.json
pnpm --filter @app/legacy-migration run generate --snapshot out/snapshot.json --now 2026-10-01T00:00:00Z
pnpm --filter @app/legacy-migration run apply --mode local
pnpm --filter @app/legacy-migration run apply --mode remote --from 0042-gacha_claim-1.sql
pnpm --filter @app/legacy-migration run verify --mode remote
pnpm --filter @app/legacy-migration run copy-files --dry-run
```

`generate` flags: `--out <dir>`, `--snapshot <file>` (skip Postgres), `--snapshot-out <file>`, `--now <ms or ISO>` (the migration time used for defaults, fixed for reproducible output), `--gacha-retire-test-item` (soft-delete the seeder item `ITEM_TEST_1`), `--gacha-zero-stock-unpooled` (items that were never in the Rust pool get stock 0 so they stay unwinnable). It exits 1 and writes no SQL while the report has blocking rejects.

`apply` and `verify` flags: `--mode local|remote` (required), `--out`, `--database` (binding, default `DB`), `--api-dir` (default `apps/api`, where `wrangler.jsonc` lives). `apply --reset` runs `reset.sql` first; `apply --from <file>` resumes after a failed file.

`copy-files` flags: `--out`, `--dry-run`, `--concurrency <n>` (default 8). It exits 1 when any object failed.

## Reading the report

`blocked: true` means at least one reject has `blocking: true`. Today that is only `duplicate-email`: two `app_users` rows whose emails are equal after `lower(trim())`. The IAM spec says these are merged by hand, so fix them at the source (with the Rust admin tools, before the freeze) and regenerate.

Reject reasons (rows that are not migrated, each listed with table and id):

| Reason | Meaning |
|---|---|
| `duplicate-email` | Blocking, see above |
| `invalid-email` | Email empty after trimming |
| `user-missing` | The row's user (mentor owner, mentee, credit, claim, testimonial author, hackathon leader, inviter, requester, message author) was not migrated or cannot be resolved |
| `item-missing` | Gacha claim whose item does not exist |
| `team-missing` | Hackathon row whose team does not exist or was rejected |
| `mentor-id-unresolved` | Session `mentor_id` is neither a user id nor an `app_mentors.id` |
| `soft-deleted` | Gacha claims with `deleted_at` and deleted credit rows (the spec drops them) |
| `role-deleted` | Soft-deleted role, its users get `user` |
| `pool-entry-inactive` | Deleted or zero-quantity `gacha_rolls` row, ignored by the fold |
| `member-inactive`, `member-duplicate` | Hackathon membership not `active`, or a second team of one user |
| `submission-duplicate` | A team's less advanced submission |

Adjustments are rows that were migrated with a change worth reviewing: role mapping (`role-fixed`, `role-custom`, `user-role-changed`, `role-grant-manual`), `permission-unmapped`, `profile-metadata-invalid`, `account-skipped`, `user-disabled` (the Q1 list), clamps and folds in gacha, event price rounding, QR active demotion, session repairs, hackathon remaps (`hackathon-user-created` lists login-less users), and `file-copy-planned` / `file-unsupported`.

Tables dropped by design, per the specs: `app_permissions` (the catalogue is code), `app_roles_permissions`, `app_audit_log`, `app_rate_limit`, `gacha_rolls` (folded into items), `qr_users` (only admins matter, as a role). `session`, `verification`, `rate_limit`, `roadmap_vote` and `activity_log` start empty: every user signs in again.

## Cutover runbook

Before the day: run steps 3 and 4 against a fresh snapshot until the report is clean and the smoke checks pass locally.

1. **Freeze writes.** Put the Rust API in maintenance mode (stop the service or make nginx answer 503 for the API host) so nothing changes after the snapshot. Announce the window.
2. **Back up.** `pg_dump --format=custom --no-owner --file imphnen-legacy-$(date +%F).dump "$LEGACY_DATABASE_URL"`, and optionally `mc mirror` the MinIO bucket. Store both off the server.
3. **Dry run and review.** `generate --snapshot-out out/snapshot.json --now <freeze time>`. Read `report.json`: `blocked` must be false, check the reject and adjustment counts against expectations, and compare `sourceCounts` with `SELECT count(*)` in Postgres. Every later step reads `out/`, so nothing touches Postgres again.
4. **Rehearse on local D1.** `rm -rf apps/api/.wrangler/state`, `moon run api:db-migrate-local`, `apply --mode local`, `verify --mode local`, then `moon run api:dev` and run the smoke checks below against it.
5. **Remote schema.** `moon run api:db-migrate-remote`. The remote database must hold no data yet (`verify` expects exact counts).
6. **Apply data.** `apply --mode remote`. If a file fails, fix the cause and resume with `--from <that file>`, or start over with `--reset`.
7. **Copy files.** `copy-files --dry-run`, then `copy-files`. If `files-fixup.sql` is not empty, apply it with `pnpm exec wrangler d1 execute DB --remote --file ../../tools/legacy-migration/out/files-fixup.sql` from `apps/api`. Rerunning `copy-files` is safe.
8. **Verify.** `verify --mode remote` must print `verification passed`.
9. **Smoke checks** against the Worker (its `workers.dev` URL or a preview route): sign in with a migrated account (legacy Argon2id password, upgraded to scrypt on success), `me.get` returns the right role, a `staf` user can list users, `mentor.list` shows active mentors, `gacha.credit.mine` shows the merged balance, `event.list`, `roadmap.list`, `testimonial.list`, `hackathon.team.browse`, `qr.activeCampaign` returns the copied image URL, one migrated avatar loads from R2.
10. **Switch traffic.** Deploy the Worker (`moon run api:deploy`) with the `api.imphnen.dev` custom domain route from `wrangler.jsonc`, remove the DNS record that pointed at the Rust server, and point the frontends at the new API. Keep the Rust API in maintenance mode.

## Rollback

The Rust API, Postgres and MinIO are never written by this tool, so rollback is: restore the DNS record for `api.imphnen.dev` to the Rust server (remove the Worker custom domain), lift the maintenance mode, and point the frontends back. Anything written to D1 after the switch is not copied back. D1 can be emptied with `apply --reset` before a second attempt.

## Adding or changing a step

A step is one file exporting a `TStep` (`{ name, run }`), for example `src/transform/hackathon/hackathon-step.ts`. `run` receives the legacy dataset, the state produced by earlier steps and the options, and returns `inserts`, `patches`, `rejects`, `adjustments` and `files`. Register it in `src/pipeline/pipeline-steps.ts`; its legacy tables go in `src/legacy/legacy-table.ts`, the row types in `src/legacy/`, and one query per table in `src/extract/`. The rehearsal test (`src/rehearsal.test.ts`) applies the generated SQL for the whole fixture dataset to a SQLite database built from `apps/api/drizzle/*.sql`, so a new target table is checked against the real schema as soon as the fixture covers it.

## Open questions

- IAM Q1: which `is_active = false` users were disabled on purpose? They are listed as `user-disabled`; everyone else becomes active and unverified.
- IAM Q2 / dimentorin: copying avatars and CVs depends on `LEGACY_FILE_URL_PREFIXES`. If the old CDN host is the same as `STORAGE_PUBLIC_URL`, legacy URLs break after the switch unless they are copied.
- Dimentorin role follow-up: the spec gives an active mentor the `mentor` role unless they are admin or superadmin, which replaces a custom role such as `staf`. Each change is listed as `user-role-changed`.
- QR and hackathon admins: `user` holders get `qr_admin` / `hackathon_admin`, `mentor` holders get `qr_admin_mentor` / `hackathon_admin_mentor` (member or mentor permissions plus the admin ones), admins are unchanged, and anyone holding another custom role is listed as `role-grant-manual`. Confirm the role labels, and whether a user who is both a QR and a hackathon admin needs a combined role.
- Gacha: retire `ITEM_TEST_1` and zero never-pooled stock (both flags default off), and whether old `claimed` prizes should be `fulfilled` instead of `pending`.
