# IAM & Platform — Porting Spec (Rust → TypeScript)

Source of truth: `/Users/ms/Development/imphnen-backend-service` (Cargo workspace, version `0.3.0`, axum 0.8, SeaORM 1.1.19, sea-query 0.32.7, jsonwebtoken 9, argon2 0.5, lettre 0.11, paginator-axum 0.2.2, zod-rs 0.4.0).

Scope: crates `imphnen-iam`, `imphnen-middleware`, `imphnen-libs`, `imphnen-email`, `imphnen-storage`, `imphnen-macros`, `imphnen-utils`, `imphnen-entities` (auth + common tables, permission catalog, user DTOs, envelopes), `imphnen-gateway/src/lib.rs`, and `imphnen-backend/src/bin/*`.

All paths below are relative to the backend repo root unless they start with `apps/` or `packages/` (those are in `/Users/ms/Development/imphnen-standard`).

Conventions in this document:
- **"As-is"** means the current Rust behaviour, including bugs. Section 8 lists which of those behaviours are probably unintended; the port should decide per item whether to keep them.
- `VERSION` means the literal string `"0.3.0"` (the `CARGO_PKG_VERSION` baked into every response envelope).

---

## 0. Gateway layout (how everything is mounted)

`imphnen-gateway/src/lib.rs` → `gateway_service()` builds one axum `Router`:

| Prefix | Router | Auth layer on the router |
|---|---|---|
| `GET /` | redirect (303) to `/docs` | none |
| `/docs`, `/openapi.json` | Swagger UI + OpenAPI JSON (utoipa) | none |
| `/v1/iam` | `auth_public_routes` **+** `users_protected_routes` + `roles_protected_routes` + `permissions_protected_routes` | auth routes: `rate_limiting_middleware` (effectively a no-op, see §2.8). users/roles/permissions: `auth_middleware` |
| `/v1/landing/cms` | CMS (other spec) | public + `auth_middleware` on protected |
| `/v1/dimentorin` | mentors / sessions (other spec) | public + `auth_middleware` on protected |
| `/v1/gacha` | gacha (other spec) | `auth_middleware` on all |
| `/v1/hackathon` | hackathon (other spec) | own `hackathon_auth_middleware` (decodes the same IAM access token) |
| `/v1/qr` | QR campaign (other spec) | own `qr_auth_middleware` (decodes the same IAM access token) |

Global layers, applied to every route (outermost first): `Extension(AppState)` → `security_headers_middleware` → `cors_middleware()`.

Notes:
- **There is no `/v1/users/admin` route.** The string `/v1/users/admin/` exists only in the prefix list of `audit_logging_middleware` (`imphnen-middleware/src/audit_logging_middleware/mod.rs:63-70`), and that middleware is never mounted. The same list also has `/v1/admin/`, `/v1/permissions/`, `/v1/roles/`, `/v1/gacha/admin/` and `/v1/cms/admin/`, which are stale pre-`/iam` paths.
- Unmatched paths return axum's default `404` with an empty body. A wrong method returns `405` with an empty body.
- The hackathon router needs MinIO config at boot (`MinioConfig::from_env().expect(...)`). Because every MinIO env var has a default, this never actually panics.
- Server: binds `0.0.0.0:${PORT}` (default 3000). Graceful shutdown on Ctrl-C. `ServerConfig.max_request_size` (10 MB) is **never applied**, so axum's default body limit of **2 MB** applies to every JSON/Multipart extractor.
- Hackathon and QR middlewares return **plain-text** 401 bodies (`"Missing Authorization header"`, `"Invalid Authorization header format"`, `"Invalid or expired token"`, `"Invalid user ID in token"`), not the JSON envelope. Their token contract is the one in §2.1: they read `claims.user_id`. The QR middleware also upserts `qr_users(id, email=sub, name=sub, role='user', provider='external')`.

---

## 1. Tables

### 1.0 How the schema is created

There are no SQL migrations. The only DDL path is the binary `create_schema` (`imphnen-backend/src/bin/create_schema.rs`). It runs `DROP TABLE IF EXISTS ... CASCADE` and then `Schema::create_table_from_entity` for each SeaORM entity, in this order: `app_roles`, `app_permissions`, `app_users`, `app_roles_permissions`, `app_mentors`, `sessions`, `events`, `testimonials`, `app_audit_log`, `app_rate_limit`, gacha tables.

**The DDL is not what the entity attributes suggest.** The entities use `#[sea_orm(default = "...", not_null, type = "jsonb")]`. SeaORM 1.1.19 **silently ignores** the unknown keys `default`, `not_null` and `type` (`sea-orm-macros-1.1.19/src/derives/entity_model.rs:198-203` swallows unknown idents). Only `primary_key`, `nullable`, `unique`, `column_type`, `default_value` and `default_expr` are honoured. So the real DDL has:
- **no DB-level defaults** at all (no `gen_random_uuid()`, no `now()`, no `false`),
- nullability derived purely from the Rust type: `Option<T>` → NULL, otherwise NOT NULL,
- types from the Rust type: `Uuid`→`uuid`, `String`→`varchar`, `bool`→`bool`, `i32`→`integer`, `u32`→`integer`, `i64`→`bigint`, `f64`→`double precision`, `DateTime<Utc>`/`DateTimeWithTimeZone`→`timestamp with time zone`, `serde_json::Value`→**`json`** (not jsonb). Only an explicit `column_type = "JsonBinary"` gives `jsonb`.
- FKs generated from every `belongs_to` relation (unnamed, so Postgres auto-names them; no ON DELETE/UPDATE action, i.e. NO ACTION),
- PK constraint named `pk-<table>`,
- no secondary indexes.

The application code always sets every column explicitly on insert, so the missing defaults don't matter at runtime. The TS port **should** add sensible defaults, listed as "Recommended default" below.

No Postgres ENUM types exist. "Enums" are free-text `varchar` columns with conventional values.

### 1.1 `app_users` (`imphnen-entities/src/seaorm/auth/users.rs`)

| Column | PG type | Null | Constraint | Recommended default | Notes |
|---|---|---|---|---|---|
| id | uuid | NOT NULL | PK | gen_random_uuid() | app always sets `uuid v4` |
| email | varchar | NOT NULL | **UNIQUE** | | exact-match lookups (case-sensitive); no normalisation anywhere |
| password_hash | varchar | NOT NULL | | | Argon2id PHC string (§2.2) |
| username | varchar | NOT NULL | (not unique) | | always set = email by IAM code and seeders |
| role_id | uuid | NULL | FK → app_roles(id) | | |
| first_name | varchar | NULL | | | from `fullname.split_once(' ')` → part before the first space |
| last_name | varchar | NULL | | | rest after the first space, or `""` (empty string, not NULL) when there's no space |
| avatar_url | varchar | NULL | | | |
| is_verified | bool | NOT NULL | | false | set `true` only by seeders; IAM flows never set it to true (§8) |
| is_active | bool | NOT NULL | | false | the login gate; flipped to true by verify-email |
| metadata | json | NULL | | | serialized `UserProfileExtensionDto` (§1.1.1) |
| created_at | timestamptz | NOT NULL | | now() | |
| updated_at | timestamptz | NOT NULL | | now() | |
| deleted_at | timestamptz | NULL | | | soft delete |

`fullname` (API) = `trim(coalesce(first_name,'') + ' ' + coalesce(last_name,''))`.

#### 1.1.1 `metadata` JSON shape (`UserProfileExtensionDto`, `imphnen-entities/src/users.rs:21-42`)

Serialized with serde. `phone_number` and `phone_for_verification` are **omitted when null**. All other keys are always written, with `null` when unset:

```json
{
  "phone_number": "string?",            // omitted if null
  "phone_for_verification": "string?",  // omitted if null
  "gender": null, "birthdate": null, "domicile": null, "bio": null,
  "last_education": null, "linkedin_url": null, "github_url": null,
  "cv_url": null, "portfolio_url": null, "website_url": null,
  "twitter_url": null, "location": null,
  "skills": ["string"] | null,
  "experience": [{"id":"","company":"","position":"","duration":"","period":""}] | null,
  "education":  [{"id":"","institution":"","degree":"","field":"","period":""}] | null,
  "career_status": null
}
```

Reading back: if `metadata` fails to deserialize into this shape (e.g. `experience` items missing a required string field), `profile_extension` is silently treated as absent.

### 1.2 `app_roles` (`imphnen-entities/src/seaorm/auth/roles.rs`)

| Column | PG type | Null | Constraint | Rec. default | Notes |
|---|---|---|---|---|---|
| id | uuid | NOT NULL | PK | gen_random_uuid() | |
| name | varchar | NOT NULL | **UNIQUE** (includes soft-deleted rows) | | `"Mentor"` and `"User"` are looked up **by name** in code |
| description | varchar | NOT NULL | | `''` | API-created roles get `""` |
| is_system_role | bool | NOT NULL | | false | seeders set true; API sets false |
| is_default | bool | NOT NULL | | false | unused by logic |
| permissions | json | NULL | | `'[]'` | **JSON array of strings.** Seeded roles store permission **UUID strings**; API-created roles store whatever the client sent (names or ids). This column is the **only** source of role→permission mapping at runtime. |
| created_at | timestamptz | NOT NULL | | now() | |
| updated_at | timestamptz | NOT NULL | | now() | |
| deleted_at | timestamptz | NULL | | | soft delete |

### 1.3 `app_permissions` (`imphnen-entities/src/seaorm/auth/permissions.rs`)

| Column | PG type | Null | Constraint | Rec. default | Notes |
|---|---|---|---|---|---|
| id | uuid | NOT NULL | PK | gen_random_uuid() | seeded rows use the fixed UUIDs in §1.9 |
| name | varchar | NOT NULL | (not unique in DB; the app checks uniqueness among non-deleted rows) | | display name, e.g. `"Read List Users"` |
| is_deleted | bool | NOT NULL | | false | soft-delete flag (used for filtering) |
| created_at | timestamptz | NOT NULL | | now() | |
| updated_at | timestamptz | NOT NULL | | now() | |
| deleted_at | timestamptz | NULL | | | also set on delete |

This table is a **catalog only**. Nothing joins it to roles; permission checks never read it.

### 1.4 `app_roles_permissions` (`imphnen-entities/src/seaorm/auth/roles_permissions.rs`) — **unused at runtime**

| Column | PG type | Null | Constraint |
|---|---|---|---|
| id | uuid | NOT NULL | PK |
| user_id | uuid | NOT NULL | FK → app_users(id) |
| role_id | uuid | NOT NULL | FK → app_roles(id) |
| permission_id | uuid | NOT NULL | FK → app_permissions(id) |
| assigned_at | timestamptz | NOT NULL | |
| is_active | bool | NOT NULL | |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |
| deleted_at | timestamptz | NULL | |

No code reads or writes this table (only the entity, `create_schema` and `clear_db` mention it). It can be dropped in the port unless the port wants a normalized join table (see §8).

### 1.5 `app_mentors` (`imphnen-entities/src/seaorm/auth/mentors.rs`) — owned logically by Dimentorin; listed here because the entity lives in the auth module and `/users/me` reads it

| Column | PG type | Null | Constraint | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | PK | |
| user_id | uuid | NOT NULL | **UNIQUE**, FK → app_users(id) | one mentor profile per user |
| industries | json | NULL | | JSON array of strings |
| expertise | json | NULL | | JSON array of strings |
| languages | json | NULL | | JSON array of strings |
| current_company | varchar | NULL | | |
| current_role | varchar | NULL | | reserved word in PG; must be quoted (`"current_role"`) in raw SQL |
| years_of_experience | integer | NULL | | |
| topics_of_interest | json | NULL | | JSON array of strings |
| preferred_mentee_level | varchar | NULL | | e.g. `beginner` |
| preferred_mentoring_formats | json | NULL | | JSON array of strings |
| availability_commitment | varchar | NULL | | |
| mentoring_rate | double precision | NULL | | |
| status | varchar | NULL | | seen values: `verified`, `active`; the full set is in the Dimentorin spec |
| is_deleted | bool | NOT NULL | | |
| created_at | timestamptz | NOT NULL | | |
| updated_at | timestamptz | NOT NULL | | |

### 1.6 `sessions` (`imphnen-entities/src/seaorm/auth/sessions.rs`) — **mentoring sessions, not auth sessions.** The table name is `sessions`; `clear_db.rs` wrongly calls it `app_sessions`.

| Column | PG type | Null | Constraint | Values |
|---|---|---|---|---|
| id | uuid | NOT NULL | PK | |
| mentor_id | uuid | NOT NULL | FK → app_users(id) | this is a **user id**, not an `app_mentors.id` |
| mentee_id | uuid | NOT NULL | FK → app_users(id) | |
| topic | varchar | NOT NULL | | |
| description | varchar | NULL | | |
| scheduled_at | timestamptz | NOT NULL | | |
| duration_minutes | integer | NOT NULL | | |
| meeting_link | varchar | NULL | | |
| session_type | varchar | NOT NULL | | `video_call` \| `phone_call` \| `chat` |
| status | varchar | NOT NULL | | `pending` \| `confirmed` \| `completed` \| `cancelled` \| `no_show` |
| feedback | varchar | NULL | | |
| rating | integer | NULL | | 1–5 |
| feedback_submitted_at | timestamptz | NULL | | |
| created_at | timestamptz | NOT NULL | | |
| updated_at | timestamptz | NOT NULL | | |

There is **no auth-session table**. Auth is stateless JWT (§2).

### 1.7 `app_audit_log` (`imphnen-entities/src/seaorm/common/audit_log.rs`) — the table exists, but nothing writes to it (the middleware is not mounted)

| Column | PG type | Null |
|---|---|---|
| id | uuid | NOT NULL (PK) |
| user_id | uuid | NOT NULL (nil UUID when unknown) |
| user_email | varchar | NOT NULL (`"unknown"` when unknown) |
| action | varchar | NOT NULL — `CREATE` (POST) \| `UPDATE` (PUT/PATCH) \| `DELETE` \| `VIEW` (GET and path contains `/admin/`) \| `ACCESS` (other GET) \| `UNKNOWN` |
| resource | varchar | NOT NULL — first path segment after `/v1/` |
| resource_id | varchar | NULL — last path segment that is 36 chars containing `-`, or all digits |
| old_data | **jsonb** | NULL (always null) |
| new_data | **jsonb** | NULL (always null) |
| ip_address | varchar | NOT NULL (§2.9 IP extraction, `"unknown"` fallback) |
| user_agent | varchar | NULL |
| timestamp | timestamptz | NOT NULL |

### 1.8 `app_rate_limit` (`imphnen-entities/src/seaorm/common/rate_limit.rs`)

| Column | PG type | Null | Notes |
|---|---|---|---|
| id | varchar | NOT NULL (PK) | a UUID string stored as varchar |
| ip_address | varchar | NOT NULL | **not unique, not indexed**; lookups use `find().filter(ip).one()` |
| request_count | integer | NOT NULL | Rust `u32` |
| first_request_time | timestamptz | NOT NULL | |
| last_request_time | timestamptz | NOT NULL | |
| window_duration_secs | bigint | NOT NULL | |

`app_migration_status` (`imphnen-entities/src/seaorm/migration_status.rs`) is defined but never created or used. Ignore it.

### 1.9 Permission catalog (`imphnen-entities/src/permissions/definitions.rs`, `mappings.rs`)

A permission has a **display name** (`Display` impl, the string the frontend compares against) and a **fixed id** (`PermissionsEnum::id()`). The guard accepts either form (§2.7). 42 permissions in total:

| # | Enum | Name (exact string) | Fixed id | Seeded into `app_permissions` |
|---|---|---|---|---|
| 1 | ReadListUsers | Read List Users | 7c15e31d-36e2-49f9-97db-138c03fb0cf6 | yes |
| 2 | ReadDetailUsers | Read Detail Users | 319ee593-ff0a-4f29-bbaf-9feb3174a3a6 | yes |
| 3 | CreateUsers | Create Users | 023e2dfe-93c3-4008-94a8-b5dff403f73b | yes |
| 4 | DeleteUsers | Delete Users | 96df0689-2ae9-4894-bf00-837c19415e5c | yes |
| 5 | UpdateUsers | Update Users | 98b3dc4c-0124-461f-afcd-166637c5e6e8 | yes |
| 6 | ActivateUsers | Activate Users | 4da8b434-89f9-4d91-85ae-eebd63cdbeda | yes |
| 7 | ReadListRoles | Read List Roles | 9164ca6e-c7e3-4238-a15f-f36ab9577e7e | yes |
| 8 | ReadDetailRoles | Read Detail Roles | 73888d18-b3e9-4f62-95a5-ba2c0d69fccb | yes |
| 9 | CreateRoles | Create Roles | 319ee593-ff0a-4f29-bbaf-9feb3174a3a2 | yes |
| 10 | DeleteRoles | Delete Roles | 35b0d992-65c8-4b62-b030-e6e0320e4048 | yes |
| 11 | UpdateRoles | Update Roles | a00d5608-4c48-4542-845c-dfe004687022 | yes |
| 12 | ReadListPermissions | Read List Permissions | 8195eeb8-e64f-4172-aa57-596492c84a72 | yes |
| 13 | ReadDetailPermissions | Read Detail Permissions | dad435cf-042c-41bd-a946-cea61ed2ffbc | yes |
| 14 | CreatePermissions | Create Permissions | 0269ed71-0ae0-4c43-ad29-e3d861d8f9a0 | yes |
| 15 | DeletePermissions | Delete Permissions | b2dc3928-86ba-4c59-a03d-0b57d5183ebc | yes |
| 16 | UpdatePermissions | Update Permissions | 299cb4d5-6556-4cc9-b6c1-32e6d31e0f9b | yes |
| 17 | ManageAllUsers | Manage All Users | d0e1f2a3-4567-8901-2345-0123456789ab | **no** |
| 18 | ManageAllRoles | Manage All Roles | e1f2a3b4-5678-9012-3456-1234567890ab | **no** |
| 19 | ManageAllPermissions | Manage All Permissions | f2a3b4c5-6789-0123-4567-2345678901ab | **no** |
| 20 | ViewAllSensitiveData | View All Sensitive Data | b4c5d6e7-8901-2345-6789-4567890123ab | **no** |
| 21 | AccessAdminDashboard | Access Admin Dashboard | c5d6e7f8-9012-3456-7890-5678901234ab | **no** |
| 22 | Administrator | Administrator | d6e7f8a9-0123-4567-8901-6789012345ab | yes (**superuser**, bypasses every check) |
| 23 | CreateGachaClaims | Create Gacha Claims | f41d53ce-4f88-4bb6-b9b4-5e3a8c38d962 | yes |
| 24 | ReadDetailGachaClaims | Read Detail Gacha Claims | c1c3d6c2-19fb-4b70-b58c-c19f2e8cfc79 | yes |
| 25 | ReadListGachaItems | Read List Gacha Items | fa6eb842-0a61-40c2-9c24-b226ad975037 | yes |
| 26 | ReadDetailGachaItems | Read Detail Gacha Items | 9c7857d7-b5ae-4688-923d-ef5572e9bc8b | yes |
| 27 | CreateGachaItems | Create Gacha Items | cf063be1-4d71-489e-b9fb-1c08c65f396c | yes |
| 28 | DeleteGachaItems | Delete Gacha Items | 46f8c6cf-ea0c-4c90-860c-69e2e65f7eb1 | yes |
| 29 | UpdateGachaItems | Update Gacha Items | 2d0cf4ae-56ae-4714-a12e-655cfc3d9eb2 | yes |
| 30 | ReadDetailGachaRolls | Read Detail Gacha Rolls | 53d6483a-04cd-4667-8792-2d0cc8e2d343 | yes |
| 31 | CreateGachaRolls | Create Gacha Rolls | 18e36c63-fcb7-4877-b911-c5aa611e878f | yes |
| 32 | ExecuteGachaRolls | Execute Gacha Rolls | 14c6a1cd-5c63-4643-89b5-b1a5f9920cc0 | yes |
| 33 | DeleteGachaRolls | Delete Gacha Rolls | `12345678-ABCD-EFAB-CDEF-0123456789AB` (uppercase; see §8) | **no** |
| 34 | ReadListMentors | Read List Mentors | a1b2c3d4-5e6f-7890-abcd-ef1234567890 | yes |
| 35 | ReadDetailMentors | Read Detail Mentors | b2c3d4e5-6f78-9012-bcde-f23456789012 | yes |
| 36 | RegisterMentors | Register Mentors | c3d4e5f6-7890-1234-cdef-345678901234 | yes |
| 37 | ReadOwnMentorProfile | Read Own Mentor Profile | d4e5f6a7-8901-2345-def0-456789012345 | yes |
| 38 | UpdateOwnMentorProfile | Update Own Mentor Profile | e5f6a7b8-9012-3456-ef01-567890123456 | yes |
| 39 | ReadOwnMentorStatus | Read Own Mentor Status | f6a7b8c9-0123-4567-f012-678901234567 | yes |
| 40 | UpdateMentors | Update Mentors | a7b8c9d0-1234-5678-0123-789012345678 | yes |
| 41 | VerifyMentors | Verify Mentors | b8c9d0e1-2345-6789-1234-890123456789 | yes |
| 42 | DeleteMentors | Delete Mentors | c9d0e1f2-3456-7890-2345-901234567890 | yes |

36 are seeded (all except #17–21 and #33). Iteration order for name↔id resolution is the enum declaration order (`strum::EnumIter`); it only matters if two entries collide, and none do.

### 1.10 Seeded roles and the default role → permission mapping

`seed_roles.rs` inserts these rows if the id is absent: `description = "System generated role"`, `is_system_role = true`, `is_default = false`, `permissions = []`, `created_at = updated_at = now()` (the hard-coded timestamps in the file are ignored).

`seed_roles_permissions.rs` then **overwrites** `permissions` with a JSON array of the permissions' **id strings** (lowercase UUIDs from the table above):

| Role id | Name | Permissions (by name, in stored order) |
|---|---|---|
| f6b03f25-e416-4893-ac88-caaa690afb07 | Admin | Administrator |
| 3b9f8c4e-6a2d-4f8a-9a12-2d6f8b3c4e5a | Mentor | Read List Users, Read Own Mentor Profile, Update Own Mentor Profile, Read Own Mentor Status, Read List Mentors, Read Detail Mentors, Read List Gacha Items, Read Detail Gacha Items, Read Detail Gacha Rolls, Create Gacha Rolls, Execute Gacha Rolls |
| 5713cb37-dc02-4e87-8048-d7a41d352059 | User | Read List Gacha Items, Read Detail Gacha Items, Read List Users, Read Detail Users, Create Gacha Claims, Read Detail Gacha Claims, Read Detail Gacha Rolls, Create Gacha Rolls, Execute Gacha Rolls, Register Mentors, Read List Mentors, Read Detail Mentors, Read Own Mentor Profile, Read Own Mentor Status |
| 50133429-f4b1-4249-9f97-7b86e6ee9d86 | Staf | Read List Roles, Read List Permissions, Read List Users, Read List Mentors, Read Detail Users, Activate Users, Read Detail Roles, Read Detail Permissions, Read List Gacha Items, Read Detail Gacha Items, Read List Mentors (**duplicate**), Read Detail Mentors, Read Detail Gacha Rolls, Create Gacha Rolls, Execute Gacha Rolls |
| 60f1aeb7-dad2-4e06-bcb5-be1ba510c906 | Staff Aktivasi User | Activate Users |
| 6d4fea5d-4a08-4b8a-9782-f2ab2183dcf0 | Admin Pembayaran | (empty) |

Role names with code dependencies: `"User"` (assigned on register; register fails with 404 if it is missing), `"Mentor"` (required by `/auth/login-mentor` and by Dimentorin mentor registration, `imphnen-dimentorin/src/mentors/application/mentor_registration_service.rs:48,91`).

### 1.11 What the seeders insert (`imphnen-backend/src/bin/`)

`seeder.rs` runs these **release** binaries in order: `./target/release/seed_permissions`, `seed_roles`, `seed_roles_permissions`, `seed_users`, `seed_events`, `seed_gacha_rolls`, `seed_mentor_user`, `seed_test_data`.

- **seed_permissions**: the 36 permission rows, `id = fixed id`, `name = display name`, `is_deleted=false`. Skips existing ids.
- **seed_roles** / **seed_roles_permissions**: as in §1.10.
- **seed_users**: upserts by id. Password for all: `"password"`. Username = email. `avatar_url = "https://example.com/avatar.jpg"`, `is_verified = true`, `is_active = true`. first/last name from splitting fullname on whitespace (first word / rest, or NULL if single word).

  | id | email | fullname | role |
  |---|---|---|---|
  | c3b1d6a8-8d4f-4b36-b789-2e532ec7a7b2 | admin@example.com | Admin | Admin |
  | a4d23fb5-9e31-423c-9842-fbd6e75a5298 | staff@example.com | Staff | Staf |
  | d5e89c12-72af-4b1a-abc3-ff1234567890 | user@example.com | User | User |
  | 665a3cfc-ea5f-4bcd-8769-4a6d8d1451d4 | testuser1@example.com | Test User 1 | User |
  | 3972c139-a450-416c-93b0-c42539dc780f | testuser2@example.com | Test User 2 | User |
  | b426c0a9-0efb-4e26-b078-4f18767255f3 | testuser3@example.com | Test User 3 | User |
  | 11111111-1111-1111-1111-111111111111 | user4@example.com | User Four | User |
  | 22222222-2222-2222-2222-222222222222 | user5@example.com | User Five | User |
  | 33333333-3333-3333-3333-333333333333 | mentor2@example.com | Mentor Two | Mentor |
  | 44444444-4444-4444-4444-444444444444 | staff2@example.com | Staff Two | Staf |
  | 55555555-…-555555555555 | user6@example.com | User Six | User |
  | 66666666-…-666666666666 | user7@example.com | User Seven | User |
  | 77777777-…-777777777777 | user8@example.com | User Eight | User |
  | 88888888-…-888888888888 | user9@example.com | User Nine | User |
  | 99999999-…-999999999999 | user10@example.com | User Ten | User |

- **seed_mentor_user**: deletes `app_mentors` row `e6f78d23-83bf-5c2b-bcd4-001345678901` and the user `mentor@example.com`. It then inserts user `mentor@example.com` (random uuid, password `"password"`, name Mentor User, Mentor role, active and verified) plus an `app_mentors` row: industries `["Software","Education"]`, expertise `["Rust","Microservices"]`, languages `["Indonesian","English"]`, company `PT Contoh`, role `Senior Backend Engineer`, 5 yrs, topics `["Rust Programming","Backend Development"]`, mentee level `beginner`, formats `["online","offline"]`, availability `"2 jam per minggu untuk mentoring online dan offline"`, rate `100000.0`, status `verified`. The first DELETE uses a hard-coded mentor id, so on re-run the old mentor row is not removed. The user DELETE then hits the FK (the error is ignored), and the insert fails on the duplicate email.
- **seed_test_data**: one event, one testimonial (id `00000000-0000-0000-0000-000000000001`, user = admin), and an `app_mentors` row for the **admin user** (status `active`). The mentor insert is not error-tolerant, so a second run fails on `app_mentors.user_id` UNIQUE.
- `seed_events`, `seed_gacha_rolls`: other domains.
- **mk_token** `<sub>`: prints an access token with `sub = user_id = <arg>`. This is a dev helper; the resulting token only passes the guard's UUID fallback if `<arg>` is a UUID, and fails `auth_middleware` unless it is a user UUID.
- **clear_db** `[--dry-run] [--force]`: `TRUNCATE ... RESTART IDENTITY CASCADE` over existing tables among `gacha_claims, gacha_rolls, gacha_items, gacha_credits, audit_logs, rate_limits, testimonials, events, app_mentors, app_sessions, app_roles_permissions, app_permissions, app_roles, app_users`. The names `audit_logs`, `rate_limits` and `app_sessions` don't exist, so those three are skipped. Refuses in `RUST_ENV=production` without `--force`.
- **create_schema**: §1.0. **test_postgres**: connectivity test tool.

---

## 2. Auth mechanics

### 2.1 Tokens (`imphnen-libs/src/jsonwebtoken/mod.rs`)

- Format: JWT, header `{"typ":"JWT","alg":"HS256"}` (jsonwebtoken `Header::default()`).
- Claims (serialized in this order):
  ```json
  { "exp": <unix seconds>, "iat": <unix seconds>, "sub": "<email>", "user_id": "<user uuid>" }
  ```
  No `iss`, `aud`, `nbf` or `jti`. `sub` is the **email as it was at login time**.
- Lifetimes and secrets:

  | Token | Lifetime | Secret |
  |---|---|---|
  | access | 15 minutes | `ACCESS_TOKEN_SECRET` |
  | refresh | **1 day** | `REFRESH_TOKEN_SECRET` |
  | reset-password | 5 minutes | **`ACCESS_TOKEN_SECRET`** (same key as access tokens; the two are indistinguishable) |

- Verification: `Validation::default()`, which means algorithm HS256 only, `exp` required and validated with **60 s leeway**, and nbf/iss/aud not checked. Any decode error is reported as "invalid".
- Transport: tokens are returned **only in JSON response bodies**. The backend sets no cookies and never reads them. Requests authenticate with `Authorization: Bearer <access_token>`. Frontend storage is a client concern: `packages/service/src/api/index.ts` keeps a cookie `token=<urlencoded JSON {"token":{"access_token","refresh_token"}}>` (7 days, `secure; samesite=strict`), and the landing app also writes `localStorage.access_token`.
- **No revocation / no logout / no session table.** Refresh issues a brand-new refresh token each time (rotation with no invalidation of the old one).

### 2.2 Password hashing (`imphnen-libs/src/argon/mod.rs`)

- `argon2` crate 0.5 `Argon2::default()` = **Argon2id, version 0x13 (19), m = 19456 KiB, t = 2, p = 1, output 32 bytes**, random 16-byte salt (`SaltString::generate(OsRng)`).
- Stored as a PHC string:
  `$argon2id$v=19$m=19456,t=2,p=1$<22-char B64 salt, no padding>$<43-char B64 hash, no padding>`
- Verify: parse the PHC string, then verify using the params **embedded in the hash**. A malformed hash makes the handler return 500 (`"Password verification failed"`).
- TS: `@node-rs/argon2` (`hash(pw, {algorithm: Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32})`) or `argon2` npm produce and verify compatible strings. Existing hashes must keep verifying.
- No password rules on the hashing side. Rules exist only in request validation (§3), and only where `ValidatedJson` is used.

### 2.3 Login (`POST /v1/iam/auth/login`, `imphnen-iam/src/auth/application/mod.rs:58-98`)

1. Validate the body (zod: `email` must match `^[^\s@]+@[^\s@]+\.[^\s@]+$` and be at least 1 char; `password` at least 1 char). On failure → 400.
2. Find the user by **exact** email with `deleted_at IS NULL` (joined with the role). If not found → 401 `"Authentication failed: Email or password not correct"`.
3. If `!is_active` → 401 `"Authentication failed: Account not active, please verify your email"`. This is checked **before** the password (account enumeration).
4. Argon2 verify. A hash parse error gives 500 `"Internal server error: Password verification failed"`. A mismatch gives 401 `"Authentication failed: Email or password not correct"`.
5. Issue access and refresh tokens with `sub = request email` and `user_id = user.id`.
6. Respond 200 with `{data:{token:{access_token,refresh_token}, user: UserDetail}, version}` (§3.5 shape). `is_verified` is **not** checked. `updated_at` is not touched. No last-login tracking.

### 2.4 Mentor login (`POST /v1/iam/auth/login-mentor`)

Same as login. After the password check: if `user.role.name != "Mentor"` (exact, case-sensitive) → **403** `"Forbidden: User does not have mentor privileges"`.

### 2.5 Register + email "verification" (OTP)

`POST /auth/register` (`application/mod.rs:140-185`):
1. Zod validation: `email` (regex above), `password` (at least 8 chars **and** matching `^[A-Za-z\d@$!%*?&]{8,}$`, so only letters, digits and `@$!%*?&` are allowed; spaces, `#`, `-`, `_`, `.` and so on are rejected), `fullname` (at least 2 chars), `phone_number` (optional string). Unknown keys are ignored (the frontend sends `confirm_password`).
2. Look up role **by name `"User"`** (non-deleted). If missing → 404 `"Resource not found: Role not found"`.
3. If a non-deleted user with this email exists → 400 `"Bad request: User already exists"`.
4. Hash the password.
5. Generate an OTP: random integer in [100000, 999999], SHA-256 hashed, `expires_at = now + 5 min` (`imphnen-utils/src/generate_otp.rs`). **The OTP is never persisted.**
6. **Send the email synchronously before inserting the user**: subject `OTP Verification`, plain-text body `your otp code is {code}` (lowercase "your"). On SMTP failure → 500 `"Internal server error: <lettre error>"` and the user is **not** created.
7. Insert the user: `id = uuid v4`, `username = email`, first/last from fullname, `is_active=false`, `is_verified=false`, `role_id = User role`, `metadata = {"phone_number": <given or omitted>, ...all other profile keys null}`. If the email belongs to a soft-deleted row → 409 `"Conflict error: User with this email already exists"`, because the repo check ignores `deleted_at`.
8. Respond 201 `{"message":"Registration successful","version":"0.3.0"}`.

`POST /auth/send-otp`: validate `email`. If the user is not found (non-deleted) → 404 `"Resource not found: User not found"`. Generate a new OTP (not stored) and send subject `OTP Verification`, body `Your OTP code is {code}`. On SMTP failure → **400** `"Bad request: <error>"`. Respond 200 `{"message":"OTP sent"}`.

`POST /auth/verify-email` (`application/mod.rs:247-265`):
1. Validate `email` and `otp` (JSON **number**, u32. A string or negative number gives 400).
2. Find the user (non-deleted). If not found → 404 `"Resource not found: User not found"`.
3. If already `is_active` → 400 `"Bad request: User already active"`.
4. **The OTP value is not checked at all.** Any u32 is accepted. Set `is_active = true` (full row rewrite via repo update, §4.4). `is_verified` stays false.
5. Respond 200 `{"message":"Email verified successfully"}`.

The port must implement real OTP storage and verification (§8). Suggested: store `sha256(code)` plus `expires_at` (5 min) per email; enforce single use and an attempts limit.

### 2.6 Refresh / forgot / reset / logout / OAuth

`POST /auth/refresh`: validate `refresh_token` (at least 1 char). Decode with `REFRESH_TOKEN_SECRET`; on failure → 401 `"Authentication failed: Invalid refresh token"`. Find the user by `sub` (email, non-deleted); if not found → 401 `"Authentication failed: User not found"`. **No is_active check.** Issue a new access + refresh pair (`sub = current DB email`). Respond 200 `{data:{access_token, refresh_token}, version}`.

`POST /auth/forgot`: validate `email`. **Always** responds 200 `{"message":"If your email is registered, you will receive a password reset link."}` right away. A background task (`tokio::spawn`) then looks up the user (non-deleted); if found, it creates a reset token (5 min, access secret, `sub = email`, `user_id`) and sends subject `Reset Password Request`, body
`You have requested a password reset. Please click the link below: {FE_URL}/auth/reset-password?token={token}`.
Errors are only logged.

`POST /auth/new-password`: validate `token` (at least 1 char) and `password` (same rule as register). Decode `token` with **`ACCESS_TOKEN_SECRET`**; on failure → 400 `"Bad request: Invalid or missing token"`. Find the user by `sub`; if not found → 400 `"Bad request: Resource not found: User not found"` (nested prefix, as-is). Hash and save the password. Respond 200 `{"message":"Password updated successfully"}`. Consequences: the reset token is reusable until it expires, and **any valid access token** also works as a reset token (no old password needed).

**Logout: no endpoint.** The frontend calls `POST /v1/iam/auth/logout` and ignores errors (§7).

**Google / GitHub OAuth: not implemented in the backend.** `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URL` are loaded but unused. The only related code is in `imphnen-utils`: `generate_oauth_csrf_token` / `validate_oauth_csrf_token` (state = `base64url(JSON{timestamp,random,pkce_verifier}) + "." + base64url(sha256(payload_b64 + secret))`, max age checked, future skew limited to 60 s), and `extract_email_async`, which falls back to `GET https://oauth2.googleapis.com/tokeninfo?access_token=<token>` to read `email`. Both are used only by the unmounted permissions/audit middlewares. The frontend expects `GET /v1/auth/google/login?redirect_uri=…` and `GET /v1/auth/google/callback?code&state&redirect_uri` (Dimentorin popup) and a GitHub code exchange (hackathon/qrcampaign). None of these exist (§7).

### 2.7 Authorization: `auth_middleware` + `permissions_guard`

Every `/v1/iam/users|roles|permissions/*` request passes **two** checks.

**A. `auth_middleware`** (`imphnen-middleware/src/auth_middleware/mod.rs`), router layer:
1. Read `Authorization: Bearer <t>` (typed header; scheme matched case-insensitively). If missing or malformed → 401 `{"message":"Invalid or missing authorization token","version"}`.
2. Decode the access token. On failure → 401 `"Invalid or expired token"`.
3. Parse `claims.user_id` as a UUID. On failure → 401 `"Invalid user identifier format"`.
4. `user_lookup_service.get_user_by_id` (joins the role; **no `deleted_at` or `is_active` filter**). If not found → 401 `"User not found or inactive"`.
5. Put `UsersDetailQueryDto` into request extensions (IAM handlers don't use it; other domains might).

These 401 messages are **not prefixed**, since they come from `ApiMessage`.

**B. `permissions_guard`** (`imphnen-iam/src/permissions_guard.rs`), called inside each handler (via the `require_permissions!` macro, or directly with `[]` for "any authenticated user"):
1. Bearer and decode again. On failure → 401 `"Authentication failed: Invalid or missing authorization token"` / `"Authentication failed: Invalid or expired token"`.
2. Look up the user **by email = `claims.sub`** (`libs/services/user_lookup.rs`; no deleted or active filter). If not found, parse `claims.sub` as a UUID and look up by id. If the parse fails → 401 `"Authentication failed: Invalid user ID format"`. If not found → 401 `"Authentication failed: User not found"`.
3. Build the user's permission set: for each string `p` in `role.permissions` JSON, add `p`. (In this code path `PermissionsQueryDto{id:p, name:p}`, so the set is just the raw stored strings. `libs/services/dto.rs:67-80`.) The role row is joined **without a `deleted_at` filter**, so soft-deleted roles still grant permissions.
4. If the set contains `"Administrator"` or `"d6e7f8a9-0123-4567-8901-6789012345ab"` → allow.
5. Otherwise, for **every** required permission: the set must contain its display name **or** its id (exact, case-sensitive string compare). Else → 403 `"Forbidden: You don't have the required permissions"`.
6. Returns `claims`; handlers use `claims.user_id` for "me" operations.

Porting guidance: collapse A and B into one middleware that loads the user once (by `user_id`), rejects deleted or inactive users (decision in §8), resolves the role's permission strings into both names and ids, and exposes `requirePermissions(...)`. Keep **name-or-id** matching and the **Administrator bypass**. Existing role rows store ids; API-created ones may store names.

Other permission helpers exist but are dead code: `PermissionsMiddlewareLayer` / `check_permissions` in `imphnen-middleware/src/permissions_middleware` (email-based, with a Google tokeninfo fallback), and `AuthRepositoryTrait::get_user_permissions` / `has_permission` in `imphnen-libs/src/services/auth_repository.rs`, which has fallback wildcard permissions (`admin.*`, `user.*`, `content.*`, `user.read`, `user.update`, `content.read`) and a `.*` wildcard that matches anything. None of these are wired in. **Do not port the wildcard logic.**

### 2.8 Rate limiting (`imphnen-middleware/src/rate_limiting_middleware/mod.rs`)

As mounted (only on the `/v1/iam/auth/*` router), it is **a no-op**. It only acts when `req.uri().path()` starts with one of `/v1/auth/login`, `/v1/auth/register`, `/v1/auth/refresh`, `/v1/auth/logout`, `/v1/gacha/roll`, `/v1/gacha/credits` or `/v1/cms/landing`. Inside a router nested at `/v1/iam`, axum strips the prefix, so the path seen is `/auth/login`. Even with the full path, `/v1/iam/auth/login` doesn't match. **Result: no rate limiting in production.**

Intended algorithm (for reference, if the port wants it; recommended: implement properly, e.g. in-memory or Redis):
- Key: client IP (§2.9), fallback `"unknown"`.
- Limit 100 requests per 60 s window (`auth_rate_limiting_middleware`, also unused: 10 per 60 s for `/v1/auth/login` and `/v1/auth/register`).
- Storage: `app_rate_limit`. First request inserts `count=1`. Later requests: if `last_request_time <= now-60s`, reset `count=0` and `last_request_time=now`; otherwise `count+=1`. `last_request_time` is only updated on reset, so this is effectively a fixed window from the last reset, and the reset request itself doesn't count. Limited when `count > max`.
- Limited response: **429**, header `Retry-After: 60`, **plain-text** body `Too Many Requests: Rate limit exceeded` (auth variant: `Too Many Requests: Rate limit exceeded for authentication endpoint`). DB errors are logged and the request is allowed.

### 2.9 Client IP extraction (`imphnen-utils/src/extract_ip.rs`)

Priority order: first entry of `X-Forwarded-For`, then `X-Real-IP`, then `CF-Connecting-IP`, then `True-Client-IP`, then `X-Cluster-Client-IP`, then `Forwarded: for=`. A value counts as valid if it is non-empty, not `unknown`/`undefined`, and is either 4 dot-separated all-digit parts or contains `:`. The socket address is never used.

### 2.10 Audit logging

**Not active.** `audit_logging_middleware` is exported but never mounted, so `app_audit_log` stays empty. Intended behaviour for reference: for request paths starting with `/v1/admin/`, `/v1/users/admin/`, `/v1/permissions/`, `/v1/roles/`, `/v1/gacha/admin/` or `/v1/cms/admin/`, insert a row **before** calling the handler, whatever the outcome. Columns as in §1.7. The user comes from the bearer email (internal JWT `sub`, or Google tokeninfo). Insert failures are only logged. If the port wants auditing, attach it to `/v1/iam/{users,roles,permissions}` mutations and record the outcome after the handler runs.

### 2.11 Security headers & CORS (all responses)

`security_headers_middleware` (`imphnen-middleware/src/security_headers_middleware/mod.rs`) sets:
- `Strict-Transport-Security`: prod `max-age=31536000; includeSubDomains; preload`, otherwise `max-age=0`.
- `Content-Security-Policy`: prod `default-src 'self'; script-src 'self' https://trusted-cdn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.example.com; connect-src 'self' https://api.example.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; report-uri /csp-violation-report-endpoint`. Non-prod: a localhost:3000 policy with a random per-request nonce (`'nonce-<b64 16 bytes>'` on script-src and style-src) plus header `X-CSP-Nonce: <nonce>`.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-XSS-Protection: 1; mode=block`.
- "prod" means `RUST_ENV == "production"`.

CORS (`tower-http` `CorsLayer`): allowed origins = exact list from `CORS_ALLOWED_ORIGINS`; methods `GET, POST, PUT, DELETE, OPTIONS` (**no PATCH**); allowed request headers `Authorization, Content-Type`; `Access-Control-Allow-Credentials: true`.

---

## 3. Endpoints

Base URL is the API origin (frontend default `https://api.imphnen.dev`). All IAM paths are prefixed with `/v1/iam`.

Legend: **Auth** — `none` / `bearer` (auth_middleware + guard). **Perm** — required permission display name (Administrator always passes). **Body validation**: `zod` means `ValidatedJson` (§5.3; any Content-Type accepted; errors → 400 JSON). `serde` means axum `Json` (requires `Content-Type: application/json`; no length/format rules; errors are plain text, §5.3).

### 3.1 Summary table

| # | Method | Path | Auth | Perm | Success |
|---|---|---|---|---|---|
| 1 | POST | /v1/iam/auth/login | none | – | 200 data |
| 2 | POST | /v1/iam/auth/login-mentor | none | – (role name `Mentor`) | 200 data |
| 3 | POST | /v1/iam/auth/register | none | – | 201 message |
| 4 | POST | /v1/iam/auth/verify-email | none | – | 200 message |
| 5 | POST | /v1/iam/auth/send-otp | none | – | 200 message |
| 6 | POST | /v1/iam/auth/forgot | none | – | 200 message |
| 7 | POST | /v1/iam/auth/new-password | none | – | 200 message |
| 8 | POST | /v1/iam/auth/refresh | none | – | 200 data |
| 9 | GET | /v1/iam/users | bearer | Read List Users | 200 paginated |
| 10 | GET | /v1/iam/users/detail/{id} | bearer | Read Detail Users | 200 data |
| 11 | GET | /v1/iam/users/me | bearer | (any authenticated) | 200 data |
| 12 | POST | /v1/iam/users/create | bearer | Create Users | 201 data |
| 13 | PUT | /v1/iam/users/update/{id} | bearer | Update Users | 200 message |
| 14 | PUT | /v1/iam/users/update/me | bearer | (any authenticated) | 200 message |
| 15 | PUT | /v1/iam/users/activate/{id} | bearer | Activate Users | 200 message |
| 16 | DELETE | /v1/iam/users/delete/{id} | bearer | Delete Users | 200 message |
| 17 | POST | /v1/iam/users/upload | bearer | (any authenticated) | 200 data |
| 18 | GET | /v1/iam/roles | bearer | Read List Roles | 200 paginated |
| 19 | GET | /v1/iam/roles/detail/{id} | bearer | Read Detail Roles | 200 data |
| 20 | POST | /v1/iam/roles/create | bearer | Create Roles | 201 data |
| 21 | PUT | /v1/iam/roles/update/{id} | bearer | Update Roles | 200 message |
| 22 | DELETE | /v1/iam/roles/delete/{id} | bearer | Delete Roles | 200 message |
| 23 | GET | /v1/iam/permissions | bearer | Read List Permissions | 200 paginated |
| 24 | GET | /v1/iam/permissions/detail/{id} | bearer | Read Detail Permissions | 200 data |
| 25 | POST | /v1/iam/permissions/create | bearer | Create Permissions | 201 message |
| 26 | PUT | /v1/iam/permissions/update/{id} | bearer | Update Permissions | 200 message |
| 27 | DELETE | /v1/iam/permissions/delete/{id} | bearer | Delete Permissions | 200 message |
| P1 | GET | / | none | – | 303 → /docs |
| P2 | GET | /docs (+ assets) | none | – | Swagger UI |
| P3 | GET | /openapi.json | none | – | OpenAPI 3 JSON |

Common errors for **every bearer route** (in this order):
401 `{"message":"Invalid or missing authorization token"}` | 401 `"Invalid or expired token"` | 401 `"Invalid user identifier format"` | 401 `"User not found or inactive"` (auth_middleware), then 401 `"Authentication failed: …"` (guard, §2.7), then 403 `"Forbidden: You don't have the required permissions"`, then 500 `"Internal server error: <db error>"`.

### 3.2 Auth endpoints (all `zod` bodies; no auth; rate limiter mounted but inert)

| # | Request body | 200/201 response | Errors |
|---|---|---|---|
| 1 login | `{ email: string (email regex, min 1), password: string (min 1) }` | `{ "data": { "token": {"access_token": string, "refresh_token": string}, "user": UserDetail }, "version": "0.3.0" }` | 400 validation · 401 `Authentication failed: Email or password not correct` · 401 `Authentication failed: Account not active, please verify your email` · 500 `Internal server error: Password verification failed` / `Failed to generate access token` / `Failed to generate refresh token` |
| 2 login-mentor | same as login | same as login | as login + 403 `Forbidden: User does not have mentor privileges` |
| 3 register | `{ email: string (email), password: string (min 8, /^[A-Za-z\d@$!%*?&]{8,}$/), fullname: string (min 2), phone_number?: string }` | 201 `{ "message": "Registration successful", "version": "0.3.0" }` | 400 validation · 404 `Resource not found: Role not found` · 400 `Bad request: User already exists` · 409 `Conflict error: User with this email already exists` (soft-deleted email) · 500 `Internal server error: Failed to hash password` · 500 `Internal server error: <smtp/address error>` |
| 4 verify-email | `{ email: string (email), otp: number (u32, integer 0…4294967295) }` | `{ "message": "Email verified successfully" }` | 400 validation · 404 `Resource not found: User not found` · 400 `Bad request: User already active` · 500 db |
| 5 send-otp | `{ email: string (email) }` | `{ "message": "OTP sent" }` | 400 validation · 404 `Resource not found: User not found` · 400 `Bad request: <smtp error>` |
| 6 forgot | `{ email: string (email) }` | `{ "message": "If your email is registered, you will receive a password reset link." }` | 400 validation only |
| 7 new-password | `{ token: string (min 1), password: string (min 8, same regex) }` | `{ "message": "Password updated successfully" }` | 400 validation · 400 `Bad request: Invalid or missing token` · 400 `Bad request: Resource not found: User not found` · 500 `Internal server error: Failed to hash password` |
| 8 refresh | `{ refresh_token: string (min 1) }` | `{ "data": { "access_token": string, "refresh_token": string }, "version": "0.3.0" }` | 400 validation · 401 `Authentication failed: Invalid refresh token` · 401 `Authentication failed: User not found` |

### 3.3 Users endpoints

**#9 `GET /v1/iam/users`**. Query: §5.4 pagination. Behaviour (`imphnen-iam/src/users/infrastructure/persistence/postgres_user_queries.rs:67-146`):
- Filters `deleted_at IS NULL` **AND `is_active = true`** (inactive users are never listed).
- Search is applied only if `search` **and a non-empty `search_fields`** are both present. Then `email LIKE %q% OR first_name LIKE %q% OR last_name LIKE %q%` (case-sensitive `LIKE`; the value of `search_fields` is otherwise ignored).
- Sort: `sort_by=email` → email, anything else → created_at. Direction from `sort_direction` (`asc`/`desc`, case-insensitive), default ASC.
- `filter` params are parsed but ignored.
- Response:
  ```json
  { "data": [ { "id": "uuid", "role": "<role name or \"\">", "fullname": "string", "email": "string",
                "avatar": "string|null", "is_active": true,
                "created_at": "RFC3339", "updated_at": "RFC3339" } ],
    "meta": { "page": 1, "per_page": 20, "total": 0, "total_pages": 0, "has_next": false, "has_prev": false },
    "version": "0.3.0" }
  ```

**#10 `GET /v1/iam/users/detail/{id}`**. `id` must parse as a UUID, else 400 `Bad request: Invalid User ID format`. Non-deleted only, else 404 `Resource not found: User not found in database`. Response `{data: UserDetail, version}`.

**#11 `GET /v1/iam/users/me`**. Query `include?: string`, comma-separated, trimmed, lowercased; allowed tokens `hackathon`, `qr`, `mentor`, `sessions`; omitted → all four; unknown tokens are ignored (`include=` → none). User = `claims.user_id` (non-deleted, else 404 `Resource not found: User not found in database`). Response: `data` = **flattened** UserDetail plus optional keys (each key is **omitted** when absent):
```json
{ "data": {
    ...UserDetail,
    "hackathon": { "is_admin": bool, "phone_number"?: string, "location"?: string, "bio"?: string, "skills"?: any-json },
    "qr": { "role": string, "provider": string },
    "mentor": { "mentor_id": "uuid", "status"?: string, "current_company"?: string, "current_role"?: string, "years_of_experience"?: int },
    "sessions": [ { "id": "uuid", "topic": string, "description"?: string, "scheduled_at": "RFC3339",
                    "duration_minutes": int, "session_type": string, "status": string, "role": "mentor"|"mentee" } ]
  }, "version": "0.3.0" }
```
Sources (raw SQL; **any SQL error is swallowed and the key omitted**):
- hackathon: `SELECT COALESCE(is_admin,false) is_admin, phone_number, location, bio, skills FROM hackathon_users WHERE id=$1`
- qr: `SELECT role, provider FROM qr_users WHERE id=$1`
- mentor: `SELECT id, status, current_company, "current_role", years_of_experience FROM app_mentors WHERE user_id=$1 AND is_deleted=false`
- sessions: `SELECT … , CASE WHEN mentor_id=$1 THEN 'mentor' ELSE 'mentee' END role FROM sessions WHERE mentor_id=$1 OR mentee_id=$1 ORDER BY scheduled_at DESC LIMIT 20`. **Omitted when empty.**

**#12 `POST /v1/iam/users/create`** (`serde` body, so **no** zod rules even though the DTO declares them):
`{ email: string, password: string, fullname: string, is_active: boolean, role_id: string, avatar?: string|null }`. All fields except avatar are required.
- 409 `Conflict error: User already exists` (non-deleted email) · 409 `Conflict error: User with this email already exists` (soft-deleted email) · 500 `Internal server error: Failed to hash password`.
- `role_id`: an invalid or empty string silently becomes NULL. A valid UUID of a non-existent role → FK violation → 500.
- Insert: `username=email`, `is_verified=false`, `metadata=NULL`.
- 201 `{data: UserDetail, version}` (re-read by email).

**#13 `PUT /v1/iam/users/update/{id}`** (`serde` body; every field optional):
`{ email?, password?, fullname?, legal_name?, is_active?, avatar?, role_id?, profile_extension?: ProfileExtension }`.
- Invalid UUID → 400 `Bad request: Invalid User ID format`; any lookup failure → 404 `Resource not found: User not found`.
- Merge: take the payload value, else the current value (`avatar`/`legal_name` use `payload.or(current)`, so JSON `null` keeps the current value and a user **cannot clear** avatar).
- `password` is re-hashed with no rules (`""` is allowed).
- `legal_name` is accepted but **never persisted**.
- `profile_extension` **replaces** the whole `metadata` object (no merge).
- `role_id`: applied only if it parses as a UUID, otherwise ignored silently.
- `email`: no uniqueness pre-check (duplicate → 500 unique violation). Changing the email breaks the user's existing tokens (§8).
- Writes first/last from fullname and `updated_at = now`.
- 200 `{"message":"Success update user","version":"0.3.0"}`.

**#14 `PUT /v1/iam/users/update/me`**: same body and merge rules as #13, applied to `claims.user_id`. **Allows changing `role_id` and `is_active` on yourself (privilege escalation, §8).** 404 `Resource not found: User not found` if missing. 200 `{"message":"Success update user"}`.

**#15 `PUT /v1/iam/users/activate/{id}`** (`serde`): `{ is_active: boolean }` (required). 400 invalid UUID · 404 `Resource not found: User not found in database`. Sets `is_active` (full-row rewrite). 200 `{"message":"Success update user"}`.

**#16 `DELETE /v1/iam/users/delete/{id}`**: 400 invalid UUID · 404 `Resource not found: User not found in database` (missing or already deleted). Soft delete: `deleted_at = updated_at = now`. 200 `{"message":"Success delete user"}`.

**#17 `POST /v1/iam/users/upload`**: `multipart/form-data`. Details in §4.2. 200:
```json
{ "data": { "filename": "string", "uploaded_path": "profiles/<uid>/<hash16>-<uuid>.<ext>",
            "url": "<CDN_URL>/<bucket>/<uploaded_path>", "size": 12345,
            "content_type": "image/png", "file_type": "png", "user_id": "uuid" }, "version": "0.3.0" }
```
Errors: 400 `Bad request: Failed to read file data` · 400 `Bad request: Invalid base64 data` · 400 `Bad request: file data is required` · 400 `Bad request: Unsupported file type` · 400 `Bad request: File type does not match content type '<ct>'` · 400 `Bad request: File too large. Maximum size for <Jpeg|Png|Webp|Gif|Pdf|Doc|Docx> is <bytes> bytes` · 500 `Internal server error: Upload failed: <reason>` (magic-byte check failure, GIF, MinIO error).

### 3.4 Roles & permissions endpoints (`serde` bodies)

**#18 `GET /v1/iam/roles`**: pagination §5.4. `deleted_at IS NULL`. Search on `name LIKE %q%` (same `search_fields` caveat). Sort `name` or created_at, direction default ASC. Items: `{ id, name, permissions_count: number (length of JSON array, duplicates counted), created_at: RFC3339, updated_at: RFC3339 }`.

**#19 `GET /v1/iam/roles/detail/{id}`**: invalid UUID → 400 `Bad request: Invalid role ID` · 404 `Resource not found: Role not found`. Response `data`:
```json
{ "id": "uuid", "name": "string", "description": "string", "is_system_role": bool, "is_default": bool,
  "permissions": [ { "id": "string", "name": "string", "created_at": null, "updated_at": null } ],
  "created_at": "RFC3339", "updated_at": "RFC3339" }
```
Permission mapping here (`roles/infrastructure/http/dto.rs:78-99`): for each stored string `p`, if `p` equals a catalog **display name** → `{id: <fixed id>, name: p}`, else `{id: "", name: p}`. **Seeded roles store ids, so they come back as `{id:"", name:"<uuid>"}` (bug, §8).** The port should resolve both directions (id→name and name→id).

**#20 `POST /v1/iam/roles/create`**: `{ name: string, permissions: string[] }`, **both required** (a missing `permissions` gives a 422 plain-text serde error). 409 `Conflict error: Role name already exists` (among non-deleted). Reusing a soft-deleted role's name → 500 (unique constraint). Insert: `description=""`, `is_system_role=false`, `is_default=false`, `permissions=<array as given, no validation>`. 201 `{data: RoleDetail (as #19)}`.

**#21 `PUT /v1/iam/roles/update/{id}`**: `{ name?: string, permissions?: string[] }`. 400 invalid UUID · 404 not found · 409 `Conflict error: Role name already exists` (another non-deleted role has it). Sets the provided fields and `updated_at`. `permissions` **replaces** the array. 200 `{"message":"Success update role"}`.

**#22 `DELETE /v1/iam/roles/delete/{id}`**: 400/404 as above. Sets `deleted_at=now` (`updated_at` is **not** changed). Users keep `role_id`, and the guard keeps honouring the deleted role's permissions (§8). System roles can be deleted. 200 `{"message":"Success delete role"}`.

**#23 `GET /v1/iam/permissions`**: pagination. `is_deleted=false`. Search `name LIKE`. Sort `name`/created_at. Items `{ id, name, created_at, updated_at }` (RFC3339 strings).

**#24 `GET /v1/iam/permissions/detail/{id}`**: 400 `Bad request: Invalid permission ID` · 404 `Resource not found: Permission not found`. `data` = `{ id, name, created_at, updated_at }`.

**#25 `POST /v1/iam/permissions/create`**: `{ name: string }`. 409 `Conflict error: Permission name already exists` (non-deleted). **201 `{"message":"Success create permission with id: <uuid>","version":"0.3.0"}`**, a message, not data.

**#26 `PUT /v1/iam/permissions/update/{id}`**: `{ name?: string }`. Any lookup failure, including an invalid UUID → 404 `Resource not found: Permission not found`. No name-uniqueness check. 200 `{"message":"Success update permission with id: <uuid>"}`. Renaming a catalog permission breaks name-based matching for roles that stored names.

**#27 `DELETE /v1/iam/permissions/delete/{id}`**: 400 invalid UUID · 404. Sets `is_deleted=true`, `deleted_at=now`. Roles referencing it are unaffected. 200 `{"message":"Success delete permission with id: <uuid>"}`.

### 3.5 `UserDetail` shape (login `user`, users/detail, users/create, users/me base)

`UsersDetailItemDto` (`imphnen-iam/src/users/infrastructure/http/dto.rs:78-92`):
```json
{
  "id": "uuid",
  "role": {
    "id": "uuid | \"\"",
    "name": "string | \"\"",
    "is_deleted": false,
    "permissions": [ { "id": "<stored string>", "name": "<display name if id matches catalog, else stored string>",
                       "created_at": null, "updated_at": null } ],
    "created_at": "RFC3339 | null",
    "updated_at": "RFC3339 | null"
  },
  "fullname": "string",
  "legal_name": null,
  "email": "string",
  "avatar": "string | null",
  "is_active": true,
  "profile_extension": { ...§1.1.1 },     // key OMITTED when metadata is null/unparseable
  "created_at": "RFC3339",
  "updated_at": "RFC3339"
}
```
- Role permissions in this shape go through `resolve_permission_name` (`postgres_user_queries.rs:16-23`): stored id → display name; unknown strings → the string itself. **The frontend checks permissions by `name`** (`packages/service/src/constants/permissions.ts`), so names must resolve.
- A user with no role gets `role = {"id":"","name":"","is_deleted":false,"permissions":[],"created_at":null,"updated_at":null}`.
- `role.is_deleted` = role `deleted_at IS NOT NULL`.
- RFC3339 timestamps come from chrono `to_rfc3339()`, e.g. `2025-02-24T16:52:27.630453+00:00` (microseconds, `+00:00` offset). JS `toISOString()` gives `Z` and milliseconds; both parse fine.

---

## 4. Business rules and side effects

### 4.1 Emails (`imphnen-email/src/service.rs`)

- Transport: lettre `SmtpTransport::relay(SMTP_HOST)`, i.e. **implicit TLS on port 465**, credentials `(SMTP_EMAIL, SMTP_PASSWORD with every '-' replaced by ' ')`. The send is **synchronous/blocking** inside the async handler (except forgot, which runs in a spawned task).
- From: `"<SMTP_NAME with '-' → ' '>" <SMTP_EMAIL>`. To: the request email (a parse failure → error). Body is **plain text**, no HTML.

| Trigger | Subject | Body (exact) | Failure behaviour |
|---|---|---|---|
| POST /auth/register | `OTP Verification` | `your otp code is {6-digit code}` | 500, user not created |
| POST /auth/send-otp | `OTP Verification` | `Your OTP code is {6-digit code}` | 400 |
| POST /auth/forgot (user exists) | `Reset Password Request` | `You have requested a password reset. Please click the link below: {FE_URL}/auth/reset-password?token={jwt}` | logged only |

### 4.2 Storage uploads (`POST /v1/iam/users/upload`; `imphnen-iam/src/users/infrastructure/http/handlers/profile_handlers.rs:73-216`, `imphnen-storage/src/*`)

Multipart fields, read in order (a later field overwrites an earlier one):
- `file`: binary; sets `filename` (part filename) and `content_type` (part Content-Type).
- `base64_data`: text; either `data:<ct>;base64,<b64>` (sets content_type from the prefix) or raw standard base64. Decode failure → 400 `Invalid base64 data`.
- `filename`: text override. `content_type`: text override.
- Other fields are ignored. Multipart parse errors are swallowed (the loop stops).

Defaults: filename `unnamed_file`, content_type `application/octet-stream`.

File type resolution: `FileType::from_content_type(ct)`, falling back to `from_filename(filename)` (by extension). Then:

| FileType | Accepted content types | Max size | Folder |
|---|---|---|---|
| Jpeg | image/jpeg, image/jpg (ext .jpg/.jpeg) | 5 MiB (5242880) | `profiles` |
| Png | image/png | 5 MiB | `profiles` |
| Webp | image/webp | 5 MiB | `profiles` |
| Gif | image/gif | 5 MiB | `profiles`, but **always fails** at the storage magic check (500) |
| Pdf | application/pdf | 10 MiB (10485760) | `documents` |
| Doc | application/msword | 10 MiB | `documents` |
| Docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document | 10 MiB | `documents` |

- `Unknown` → 400 `Unsupported file type`. `content_type` must be in the accepted list for the resolved type (e.g. `.png` sent as `application/octet-stream` → 400 `File type does not match content type 'application/octet-stream'`).
- **Effective limit is ~2 MB** for the whole request because of axum's default body limit. Bigger files fail as 400 `Failed to read file data` or `file data is required`. The port should decide whether to honour the documented 5/10 MiB (§8).
- Magic-byte validation in storage (`imphnen-storage/src/types.rs:130-167`; failure → 500): JPEG starts `FF D8 FF`; PNG starts `89 50 4E 47 0D 0A 1A 0A`; PDF starts `%PDF`; WEBP starts `RIFF` with bytes 8..12 = `WEBP`; DOC/DOCX must be at least 512 bytes; anything else → error. Also an overall limit of 10 MiB.
- Object key: `{folder}/{sanitizedUserId}/{sha256(file)[0..16] hex}-{uuidv4}.{ext}`. `sanitizedUserId` = user_id with `%` removed, `:`→`_`, `@`→`_at_`, `.`→`_` (no effect on a UUID). `ext` = lowercased filename extension, or `bin` if none.
- **Deduplication**: before uploading, S3 ListObjectsV2 `GET https://{endpoint-host}/{bucket}?list-type=2&prefix={folder}/{uid}`. If any `<Key>` line contains the 16-hex hash, that existing key is returned and nothing is uploaded. Only the first page (1000 keys) is checked. Crude XML line scan.
- Upload: `PUT https://{endpoint-host}/{bucket}/{key}` with AWS SigV4 header auth (service `s3`, region `MINIO_REGION`, `x-amz-content-sha256: UNSIGNED-PAYLOAD`, signed headers `host;x-amz-content-sha256;x-amz-date`), plus `Content-Type`, `X-Forwarded-Proto: https`, `X-Forwarded-Host`. **Always `https://`**, regardless of `MINIO_SECURE` or the scheme in `MINIO_ENDPOINT` (the scheme is stripped). Path-style addressing.
- Public URL: `{CDN_URL}/{MINIO_BUCKET_NAME}/{key}`. No presigned URL is returned.
- The upload **does not update the user row**. The client must then call `PUT /users/update/me` with `avatar` or `profile_extension.cv_url`.
- In the TS port, use `@aws-sdk/client-s3` with `forcePathStyle: true`, endpoint `https://${host}`, region `MINIO_REGION`.

### 4.3 Audit entries

None are written (§2.10).

### 4.4 Repository write semantics worth preserving

- `UserRepository.update` (`postgres_user_repository.rs:128-168`) always rewrites `email`, `first_name`, `last_name`, `avatar_url`, `is_active`, `updated_at`. It writes `password_hash` if non-empty (always, in practice). It writes `role_id` only if the string parses as a UUID, and `metadata` only if `profile_extension` is Some. It never writes `is_verified`, `username` or `deleted_at`. Verify-email, activate and new-password all go through this, so they also "normalize" first/last name from the fullname (e.g. `"A B C"` becomes `first="A"`, `last="B C"`, which it already was).
- Role/permission deletes are soft. Users are never hard-deleted.
- Dimentorin mentor registration reuses the IAM user repository: it sets the role to `Mentor`, `is_active=false`, re-hashes the password and merges `profile_extension`. See the Dimentorin spec, but keep the IAM repository contract the same.

---

## 5. Shared response / error envelope and pagination (whole API)

Every domain (cms, dimentorin, gacha, hackathon, iam) uses the same helpers from `imphnen-utils/src/response_format.rs` and `imphnen-utils/src/errors.rs`. `version` is always `"0.3.0"`.

### 5.1 Success envelopes

| Helper | Status | Body |
|---|---|---|
| `ApiSuccess(T)` | 200 | `{"data": T, "version": "0.3.0"}` |
| `ApiCreated(T)` | 201 | `{"data": T, "version": "0.3.0"}` |
| `ApiPaginated(PaginatorResponse<T>)` | 200 | `{"data": T[], "meta": Meta, "version": "0.3.0"}` |
| `ApiMessage::ok(msg)` / `::created(msg)` / `::new(status,msg)` | 200 / 201 / any | `{"message": msg, "version": "0.3.0"}` |

Key order: serde_json `json!` (no `preserve_order`) emits keys alphabetically, i.e. `data, meta, version` and `message, version`. Clients should not rely on order.

### 5.2 Error envelope (`AppError`)

All handler errors: `{"message": "<Prefix>: <detail>", "version": "0.3.0"}` with this status/prefix map:

| Variant | Status | Prefix |
|---|---|---|
| ValidationError | 400 | `Validation error: ` |
| BadRequestError | 400 | `Bad request: ` |
| AuthenticationError | 401 | `Authentication failed: ` |
| PaymentRequiredError | 402 | `Payment required: ` |
| AuthorizationError | 403 | `Authorization failed: ` |
| ForbiddenError | 403 | `Forbidden: ` |
| NotFoundError | 404 | `Resource not found: ` |
| MethodNotAllowedError | 405 | `Method not allowed: ` |
| NotAcceptableError | 406 | `Not acceptable: ` |
| RequestTimeoutError | 408 | `Request timeout: ` |
| ConflictError | 409 | `Conflict error: ` |
| TooManyRequestsError | 429 | `Too many requests: ` |
| InternalServerError | 500 | `Internal server error: ` |
| ServiceUnavailableError | 503 | `Service unavailable: ` |
| GatewayTimeoutError | 504 | `Gateway timeout: ` |

Automatic conversions: DB error → 500 `Internal server error: Database error: <e>` · `uuid::Error` → 400 `Bad request: UUID parsing error: <e>` · chrono parse → 400 `Bad request: Date parsing error: <e>` · anyhow → 500 `Internal server error: Error: <e>`.

The frontend (`packages/service/src/api/index.ts`) surfaces `error.response.data.message` verbatim, so **keep `message` as a string field** on every error. Exact wording is shown to users in places, so keep the prefixes unless the frontend is updated in step.

Non-envelope error bodies that exist today (the port may normalise these into the JSON envelope; the frontend falls back to `error.message` when `data.message` is missing):
- `auth_middleware` 401s: JSON `{"message": "...", "version"}` **without** a prefix (§2.7).
- axum `Json<T>` extractor rejections (users/create, users/update*, users/activate, roles/*, permissions/*): **plain text**. 415 `Expected request with \`Content-Type: application/json\``; 400 `Failed to parse the request body as JSON: …`; 422 `Failed to deserialize the JSON body into the target type: <field error>`; 413 on body > 2 MB.
- `PaginationQuery` rejection: **plain text** 400 `Invalid query params: <serde error>` (e.g. `page=abc`, or any `filter=` value, see §5.4).
- Rate limiter 429 and hackathon/qr middleware 401s: plain text.
- Unmatched route 404 / 405: empty body.

### 5.3 Request-body validation (`ValidatedJson`, `imphnen-libs/src/axum/validated_json.rs`)

1. Read the body. On error → 400 `{"message":"Failed to read body: <e>","version"}`.
2. Parse JSON (Content-Type **not** checked). On error → 400 `{"message":"Invalid JSON: <serde error>","version"}`.
3. zod-rs schema validation (non-strict: unknown keys allowed), then serde deserialize. On error → 400 `{"message":"Validation error: <issues>","version"}` where `<issues>` is one `"\n  - <path>: <msg>"` per issue (zod-rs English locale, e.g. `"\n  - email: Invalid email address"`, `"\n  - password: Too small: expected string to have >=8 characters"`). A post-schema serde failure gives `Deserialization failed: <e>`.

Clients only rely on status 400 plus a `message` string. The TS port can use zod with a formatter that produces the same `Validation error: …` prefix.

### 5.4 Pagination query and meta (`paginator-axum 0.2.2` `PaginationQuery`, `paginator-utils 0.2.2`)

Query parameters actually honoured:

| Param | Type | Default | Rule |
|---|---|---|---|
| page | u32 | 1 | `max(1)` |
| per_page | u32 | 20 | clamp to [1, 100] |
| sort_by | string | – | repository-specific whitelist (IAM: `email` for users, `name` for roles/permissions; else `created_at`) |
| sort_direction | `asc`\|`desc` (case-insensitive) | ASC | other values → default |
| search | string | – | **ignored unless `search_fields` is also non-empty** |
| search_fields | comma list | – | only its presence matters in IAM |
| filter | (declared `Vec<String>`) | – | `field:op:value` syntax; **any `filter` value makes serde_urlencoded fail → 400 plain text**. Ignored by IAM repos anyway |

The frontend `TPaginationParams` sends `page`, `per_page`, `search`, `sort_by`, `order`, `filter`, `filter_by`. `order` and `filter_by` are silently ignored, and `search` has no effect (no `search_fields`). **Recommended for the port:** accept `search` alone (search the default fields), accept `order` as an alias of `sort_direction`, and ignore unknown params. That is a behaviour change, but it matches frontend intent.

Meta object (always from `PaginatorResponseMeta::new(page, per_page, total)`):
```json
{ "page": 1, "per_page": 20, "total": 42, "total_pages": 3, "has_next": true, "has_prev": false }
```
- `total_pages = ceil(total / per_page)`, `has_next = page < total_pages`, `has_prev = page > 1`.
- `next_cursor` / `prev_cursor` keys are omitted (null → skipped). `total` and `total_pages` are always present in IAM.
- `page` echoes the requested (clamped) page even when beyond the last page (then `data` is `[]`).

### 5.5 Identifiers, time and misc

- IDs are UUID strings (lowercase v4). Path-id validation messages differ per route (see §3).
- Timestamps in responses are RFC3339 strings produced by chrono (`+00:00` offset, microsecond precision).
- JSON `null` vs missing: fields marked `skip_serializing_if` are **omitted** (e.g. `profile_extension`, the `/me` module keys, `phone_number` inside metadata). Everything else is serialized as `null`.

---

## 6. Environment variables

Loaded once from `.env` (dotenvy) and then the process env (`imphnen-libs/src/environment/mod.rs`). Missing values log a warning and use the default. `DATABASE_URL` is additionally **required** by `PostgresConfig::from_env()`: without it, server start fails.

| Var | Default | Used by | Notes |
|---|---|---|---|
| PORT | 3000 | server bind | `.env.example` uses 4099 |
| DATABASE_URL | (required) `postgres://postgres:postgres@localhost:5432/imphnen` in ENV struct | pool | |
| POOL_SIZE | 10 | max pool connections | min connections hard-coded 5 |
| CONNECT_TIMEOUT | 30 (s) | pool connect timeout | |
| IDLE_TIMEOUT | 60 (s) | pool | |
| MAX_LIFETIME | 1800 (s) | pool | |
| RETRY_ATTEMPTS | 3 | initial DB connect retries | |
| RETRY_DELAY | 1 (s) | between retries | |
| STATEMENT_TIMEOUT | 30000 | **unused** | |
| IDLE_IN_TRANSACTION_SESSION_TIMEOUT | 60000 | **unused** | |
| SSLMODE | require | **unused** (put sslmode in DATABASE_URL) | |
| ACCESS_TOKEN_SECRET | `default_access_secret` | access + reset JWT HMAC | **must be set in prod**; the TS port must reuse the same value to keep issued tokens valid |
| REFRESH_TOKEN_SECRET | `default_refresh_secret` | refresh JWT HMAC | same |
| SMTP_EMAIL | no-reply@example.com | From address + SMTP username | |
| SMTP_PASSWORD | default_smtp_password | SMTP password (`-`→space) | |
| SMTP_NAME | `MyApp SMTP` | From display name (`-`→space) | |
| SMTP_HOST | smtp.gmail.com | SMTPS relay host (port 465 implicit TLS) | |
| FE_URL | http://localhost | reset-password link base | a single URL even though several frontends exist |
| RUST_ENV | development | `production` switches HSTS/CSP; guards `clear_db` | |
| RUST_LOG | – | log filter (`tracing_subscriber::fmt::init`) | |
| CORS_ALLOWED_ORIGINS | `https://gacha.imphnen.dev,https://imphnen.dev,https://dimentorin.imphnen.dev,https://backoffice.imphnen.dev,https://hackathon.imphnen.dev,https://qr.imphnen.dev,https://infra.imphnen.dev` | CORS | comma-separated, trimmed |
| MINIO_ENDPOINT | http://localhost:9000 | S3 host (scheme stripped, always https) | |
| MINIO_BUCKET_NAME | imphnen-uploads | bucket + public URL | |
| MINIO_ACCESS_KEY | minio_access | SigV4 | |
| MINIO_SECRET_KEY | minio_secret | SigV4 | |
| MINIO_REGION | us-east-1 | SigV4 scope | |
| MINIO_SECURE | false | parsed, **ignored** by the uploader | |
| CDN_URL | https://cdn.asepharyana.tech | public file URL prefix | |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URL | placeholders; redirect `http://localhost:8000/api/v1/auth/google/callback` | **unused** by any mounted code | |
| REDISDB_URL | localhost | **unused** | |

Frontend-side (for reference): `VITE_API_URL`, `NEXT_PUBLIC_API_URL`, `PUBLIC_API_URL`, `VITE_GITHUB_CLIENT_ID`, `NEXT_PUBLIC_GITHUB_CLIENT_ID`.

---

## 7. Frontend callers (`/Users/ms/Development/imphnen-standard`)

The HTTP client is `packages/service/src/api/index.ts`: axios `api`, baseURL from `getBaseURL()`, `Authorization: Bearer` taken from the `token` cookie. On any 401 it tries a refresh once (`refreshAccessToken` → `POST /v1/iam/auth/refresh`), then redirects to `/auth/login`. `apps/api` (the new TS backend, better-auth based) is excluded from this list.

| # | Endpoint | API function (packages/service/src/api/…) | Hooks (packages/service/src/hooks/…) | App call sites |
|---|---|---|---|---|
| 1 | POST /auth/login | `auth/index.ts` `postLogin` | `auth/index.ts` `useLogin`, `useBackofficeLogin`, `usePostLogin`, `useEmailAuth` | `apps/backoffice/src/routes/_public/auth/login.tsx`, `apps/backoffice/src/routes/_public/auth/_hooks/use-login.ts`, `apps/hackathon/src/routes/_public/auth/login.tsx`, `apps/gacha/src/routes/_components/form/modal-form-login.tsx`, `apps/gacha/src/routes/_hooks/use-login.ts`, `apps/dimentorin/src/routes/_public/auth/login.tsx`, `apps/dimentorin/src/routes/_hooks/use-login.ts`; **direct fetch** `apps/landing/src/components/LoginForm.tsx:118` (reads `data.data.token`, writes the `token` cookie and `localStorage.access_token`) |
| 2 | POST /auth/login-mentor | `postLoginMentor` | – | **no caller** (Dimentorin uses plain login) |
| 3 | POST /auth/register | `postRegister` | `useSignup`, `usePostRegister`, `useEmailAuth.signUpWithEmail` (sends extra `confirm_password`) | `apps/hackathon/src/routes/_public/auth/signup.tsx`, `apps/gacha/src/routes/_hooks/use-register.ts` (also imports `postRegister` directly), `apps/dimentorin/src/routes/_hooks/use-register.ts` |
| 4 | POST /auth/verify-email | `postVerifyEmail` (sends `otp: parseInt(otp)`) | `usePostVerifyEmail` | `apps/gacha/src/routes/_hooks/use-verify-email.ts`, `apps/dimentorin/src/routes/_hooks/use-otp.ts` |
| 5 | POST /auth/send-otp | `postSendOtp` | `usePostSendOtp` | `apps/dimentorin/src/routes/_hooks/use-resend-otp.ts` |
| 6 | POST /auth/forgot | `postForgotPassword` | `useForgotPassword` | `apps/hackathon/src/routes/_public/auth/forgot-password.tsx`, `apps/qrcampaign/src/routes/_public/auth/forgot-password.tsx` |
| 7 | POST /auth/new-password | `postNewPassword` | `useResetPassword` | `apps/hackathon/src/routes/_public/auth/reset-password.tsx`, `apps/qrcampaign/src/routes/_public/auth/reset-password.tsx` |
| 8 | POST /auth/refresh | `api/index.ts` `refreshAccessToken` (interceptor); `auth/index.ts` `postRefreshToken` (unused) | – | every app, implicitly on 401 |
| 9 | GET /users | `users/index.ts` `getUserList` | `users/index.ts` `useUserList` | `apps/backoffice/src/routes/_authenticated/dashboard.tsx`, `dashboard-dimentorin.tsx`, `users-dimentorin.tsx`, `accounts.tsx`, `accounts_/$id.tsx` |
| 10 | GET /users/detail/{id} | `getUserById`, `userService.getUserById` | `useUserById`, `useUserDetailsById` | `apps/backoffice/src/routes/_authenticated/users-dimentorin_/$id.tsx`, `apps/dimentorin/src/routes/_site/profile_/_components/contexts/profile-context.tsx`, `apps/hackathon/src/routes/_authenticated/users/$userId.tsx` |
| 11 | GET /users/me | `getUserMe(include?)` | `useUserMe`, `auth/index.ts` `useSessionQuery` | `apps/hackathon/src/components/navigation.tsx`, `apps/hackathon/src/hooks/use-team-guards.ts`, `apps/hackathon/src/routes/_authenticated/onboarding/user.tsx`, `apps/dimentorin/src/routes/_site/profile_/_components/contexts/profile-context.tsx`, `apps/dimentorin/src/routes/_authenticated/dashboard/user/_components/settings-content.tsx`, `apps/dimentorin/src/routes/_authenticated/dashboard/mentor/_components/settings-content.tsx` |
| 12 | POST /users/create | `createUser` | – | **no caller** |
| 13 | PUT /users/update/{id} | `updateUserById` (expects `data`, gets `message`) | `useUpdateUserById` | `apps/backoffice/src/routes/_authenticated/accounts_/$id.tsx`, `apps/dimentorin/src/routes/_site/profile_/_components/contexts/profile-context.tsx` |
| 14 | PUT /users/update/me | `updateUserMe` (expects `data`) | `useUpdateUserMe` | `apps/hackathon/src/routes/_authenticated/_components/profile-modal.tsx`, `apps/hackathon/src/routes/_authenticated/onboarding/user.tsx`, `apps/dimentorin/src/routes/_site/profile_/_components/contexts/profile-context.tsx` |
| 15 | PUT /users/activate/{id} | `activateUser` | – | **no caller** |
| 16 | DELETE /users/delete/{id} | `deleteUser` | – | **no caller** (see qrcampaign note below) |
| 17 | POST /users/upload | `users/index.ts` `uploadUserFile`; `upload/index.ts` `uploadService.uploadFile/uploadAvatar/uploadCV` (unused) | `upload/index.ts` `useUploadCV` | `apps/dimentorin/src/routes/_site/profile_/_components/modals/cv-modal.tsx` |
| 18 | GET /roles | `roles/index.ts` `getRoleList` | `roles/index.ts` `useRoleList` | `apps/backoffice/src/routes/_authenticated/roles.tsx`, `roles_/$id.tsx` (uses the list to find one role), `_components/settings-dimentorin/user-roles-permission.tsx` |
| 19 | GET /roles/detail/{id} | `getRoleById` | `useRoleById` | **no caller** |
| 20 | POST /roles/create | `createRole` | `useCreateRole` | `apps/backoffice/src/routes/_authenticated/roles_/create.tsx` (**sends only `{name}`**, so today it gets 422) |
| 21 | PUT /roles/update/{id} | `updateRole` (expects `data`) | `useUpdateRole` | `apps/backoffice/src/routes/_authenticated/roles_/$id.tsx` |
| 22 | DELETE /roles/delete/{id} | `deleteRole` | `useDeleteRole` | `apps/backoffice/src/routes/_authenticated/roles.tsx`, `_components/settings-dimentorin/user-roles-permission.tsx` |
| 23 | GET /permissions | `permissions/index.ts` `getPermissionList` | `permissions/index.ts` `usePermissionList` | `apps/backoffice/src/routes/_authenticated/permissions.tsx`, `permissions_/$id.tsx` |
| 24 | GET /permissions/detail/{id} | `getPermissionById` | `usePermissionById` | **no caller** |
| 25 | POST /permissions/create | `createPermission` (expects `data`, gets `message`) | `useCreatePermission` | `apps/backoffice/src/routes/_authenticated/permissions_/create.tsx` |
| 26 | PUT /permissions/update/{id} | `updatePermission` (expects `data`) | `useUpdatePermission` | `apps/backoffice/src/routes/_authenticated/permissions_/$id.tsx` |
| 27 | DELETE /permissions/delete/{id} | `deletePermission` | `useDeletePermission` | `apps/backoffice/src/routes/_authenticated/permissions.tsx` |

Frontend permission gating uses **names** from `packages/service/src/constants/permissions.ts` (a subset of §1.9: users, roles, permissions, gacha claims/items/rolls).

**Frontend calls in this domain with no backend route:**
1. `POST /v1/iam/auth/logout`: `apps/landing/src/components/NavbarAuthControls.tsx:40`, `apps/landing/src/components/MobileMenu.tsx:63` (errors are ignored). Recommended: implement as 200 `{"message":"Logged out"}` (and revoke the refresh token if the port adds a token store).
2. `GET /v1/auth/google/login?redirect_uri=…` (popup): `apps/dimentorin/src/routes/_hooks/use-google-login.ts:47-53`. Note there is **no `/iam`** in the path.
3. `GET /v1/auth/google/callback?code&state&redirect_uri`, which expects the login JSON (`{token,user}` or the envelope): `apps/dimentorin/src/routes/_public/auth/google-oauth-popup.tsx:23-41`. `useGoogleCallback` (`packages/service/src/hooks/auth/index.ts`) just throws "Google OAuth not supported" and is used by `apps/dimentorin/src/routes/_public/auth/google-callback.tsx`.
4. GitHub OAuth: `useGitHubAuth` builds `https://github.com/login/oauth/authorize?client_id=…&redirect_uri={origin}/auth/callback&scope=read:user user:email` (`apps/hackathon/src/routes/_public/auth/login.tsx`, `signup.tsx`, `apps/qrcampaign/src/routes/_public/auth/signup.tsx`, `apps/dimentorin/src/routes/_public/auth/login.tsx`). The callback pages (`apps/hackathon/src/routes/_public/auth/callback.tsx`, `apps/qrcampaign/src/routes/auth/callback.tsx`) call `useGitHubCallback`, which **throws**. No backend code-exchange endpoint exists, so the port must define one (e.g. `POST /v1/iam/auth/github/callback {code}` → login response).
5. `apps/qrcampaign/src/routes/_authenticated/admin/users.tsx` calls `userService.getUsers()`, `userService.updateUserRole()` and `userService.deleteUser()`. **These functions don't exist** on the IAM `userService` object (runtime TypeError). The intended backend is the QR domain (`/v1/qr/users…`), so it is out of IAM scope, but flag it.
6. `apps/landing/src/openapi-types.ts`: stale generated types with pre-`/iam` paths (`/v1/auth/*`, `/v1/permissions`, `/v1/mentors`, `/v1/cms/landing/*`). Types only, no runtime calls.

**Frontend/backend shape mismatches (today):**
- Refresh: the interceptor reads `response.data.access_token`, but the backend returns `{data:{access_token,refresh_token},version}`. **Refresh never succeeds**, so users are logged out 15 min after login. Fix either side (recommendation: keep the envelope and fix the FE, or have the port return both).
- `updateUserMe`, `updateUserById`, `updateRole`, `createPermission` and `updatePermission` return `response.data.data`, which is undefined because the backend sends `{message}`. Recommended: the port returns `{data: <updated entity>, message?, version}` for these (additive, FE-compatible).
- `createRole` omits `permissions` (422 today). Recommended: default `permissions` to `[]`.
- The users list hides inactive users, so the backoffice cannot find users to reactivate.

---

## 8. Open questions, oddities, bugs

Security (decide before porting; recommended default in parentheses):
1. **Email OTP is never verified.** `verify-email` activates any account with any number (`imphnen-iam/src/auth/application/mod.rs:247-265`); the OTP isn't stored. (Implement stored, hashed, 5-min, single-use OTP with an attempt limit.)
2. **Reset token = access token.** Both are signed with `ACCESS_TOKEN_SECRET` and have the same claims (`imphnen-libs/src/jsonwebtoken/mod.rs:84-95`). Any access token can call `/auth/new-password` (no old password needed), and a reset token can call every bearer API for 5 minutes. (Separate secret or a `typ` claim; single-use reset.)
3. **Self privilege escalation:** `PUT /users/update/me` accepts `role_id` and `is_active` (`profile_handlers.rs:44-56`). (Strip `role_id`, `is_active` and `email`, or require a re-verify.)
4. The default **"User" role has `Read List Users` + `Read Detail Users`**, so every registered user can list and read every user's PII.
5. Deleted or deactivated users keep working with their existing tokens: neither `auth_middleware` nor the guard checks `deleted_at`/`is_active` (`libs/services/user_lookup.rs`), and refresh doesn't check `is_active`. Refresh tokens rotate without revocation, so a session lives forever. (Reject deleted/inactive users in auth and refresh.)
6. Soft-deleted roles still grant permissions (the role join has no `deleted_at` filter).
7. The guard looks users up by **email in `sub`**. After an email change, the old tokens fail on guarded routes (401 `Authentication failed: Invalid user ID format`) and refresh fails. (Use `user_id`.)
8. No rate limiting (prefix mismatch, §2.8) and no audit logging (not mounted). Login and register are brute-forceable. Login reveals whether an unverified account exists.
9. Password policy only on register/new-password (via zod); admin create/update and update/me accept any password including `""`. The regex also **forbids** common symbols (`#`, `-`, `_`, `.`, space).
10. `send_email` blocks the async runtime. Register sends the email before inserting the user, so an SMTP outage blocks sign-up.

Data / behaviour oddities:
11. The schema's intended defaults and `jsonb` types are silently dropped (§1.0). The live DB may differ if it was created some other way. **Confirm against production (`\d app_users` etc.) before writing TS migrations.**
12. `roles.permissions` mixes UUID strings (seeded) and whatever clients send (names). `GET /roles/detail/{id}` only maps names→ids, so seeded roles show `{id:"", name:"<uuid>"}`. Meanwhile user/login responses map ids→names. (Normalise storage to ids; always return `{id, name}`; validate against the catalog.)
13. `app_roles_permissions` is unused and `app_permissions` is not referenced by roles. Is the port expected to normalise into a join table? (Open question.)
14. `DeleteGachaRolls` has an uppercase fake UUID `12345678-ABCD-EFAB-CDEF-0123456789AB` and is not seeded. Five other enum entries (`Manage All *`, `View All Sensitive Data`, `Access Admin Dashboard`) are also never seeded. Several ids (`a1b2c3d4-…`, `12345678-…`) are hand-made and not real v4 UUIDs; keep them verbatim for compatibility.
15. `is_verified` is never set by app flows. `is_active` doubles as "email verified" **and** "admin enabled". (Open question: split the two semantics?)
16. `users/update*` drops `legal_name`; `avatar: null` can't clear; `profile_extension` replaces the whole metadata object; the email-uniqueness violation surfaces as 500.
17. `app_roles.name` and `app_users.email` are UNIQUE across soft-deleted rows, but the app's pre-checks ignore deleted rows, which gives 500 (role) or 409 with different wording (user).
18. `GET /users` excludes inactive users, `search` only works with `search_fields`, and `filter` makes the request 400 (§5.4).
19. Uploads: effective 2 MB limit (axum default) vs the documented 5/10 MiB; GIF is accepted by type but always fails with 500; MinIO is always addressed over `https`; dedup relies on a line-based XML scan of the first 1000 keys.
20. `seed_test_data` and `seed_mentor_user` aren't idempotent; `clear_db` references non-existent tables (`audit_logs`, `rate_limits`, `app_sessions`).
21. Dead code that should **not** be ported as-is: `PaymentLayer` (402 if `X-Payment-Token` is shorter than 16 chars or path contains `/premium/`, `/paid/` or `/subscription/`), `PermissionsMiddlewareLayer` / `check_permissions` (Google tokeninfo fallback), the `AuthRepositoryTrait` wildcard permissions (`admin.*` matches everything), `UserLookupService.search_users` / `count_users`, `csrf_token` helpers, the `sanitization` helpers (never called on input), `imphnen-macros::Builder` (compile-time builder only).
22. The production CSP references placeholder hosts (`trusted-cdn.com`, `images.example.com`, `api.example.com`) and a non-existent `report-uri`. It is harmless for a JSON API, but don't copy it blindly.
23. The Google OAuth env default redirect is `http://localhost:8000/api/v1/auth/google/callback` (an `/api` prefix no route uses). The frontend expects `/v1/auth/google/{login,callback}` (no `/iam`). The final OAuth URL layout is an open question for the port, and so are GitHub vs Google and which apps use which.
24. `FE_URL` is a single value but reset links are needed by several apps (hackathon, qrcampaign). (Open question: take a `redirect_url`/app hint in `/auth/forgot`, validated against the CORS allow-list?)
