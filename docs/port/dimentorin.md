# Porting spec: Dimentorin (mentors and sessions)

Source of truth: the Rust crate `imphnen-dimentorin` in `/Users/ms/Development/imphnen-backend-service` (axum 0.8, SeaORM 1.1.19, Postgres), crate version `0.3.0`.

Path conventions used below:
- `R:` = `/Users/ms/Development/imphnen-backend-service/`
- `F:` = `/Users/ms/Development/imphnen-standard/`

Scope: everything mounted under `/v1/dimentorin/*`, the tables `app_mentors` and `sessions`, the parts of `app_users` / `app_roles` this domain reads or writes, and the seeders that touch mentors or sessions.

---

## 0. Cross-cutting behaviour (applies to every endpoint)

### 0.1 Mounting
`R:imphnen-gateway/src/lib.rs` lines 74-91:

```
/v1/dimentorin
  ├─ mentors_public_routes    (no auth middleware)
  ├─ sessions_public_routes   (no auth middleware)
  └─ [mentors_protected_routes + sessions_protected_routes] .layer(auth_middleware)
```
Global layers on the whole app: CORS, security headers, `Extension(AppState)`. No rate limiting on dimentorin, unlike `/v1/iam` auth.

### 0.2 Response envelopes (`R:imphnen-utils/src/response_format.rs`, `R:imphnen-utils/src/errors.rs`)
Every JSON body carries `"version": "0.3.0"`. This is the `CARGO_PKG_VERSION` of `imphnen-utils` or `imphnen-libs`, and both are 0.3.0.

| Kind | HTTP | Body |
|---|---|---|
| `ApiSuccess<T>` | 200 | `{"data": T, "version": "0.3.0"}` |
| `ApiPaginated<T>` | 200 | `{"data": T[], "meta": Meta, "version": "0.3.0"}` |
| `ApiMessage` | given | `{"message": string, "version": "0.3.0"}` |
| `AppError` | per variant | `{"message": "<Prefix>: <detail>", "version": "0.3.0"}` |

`Meta` (paginator-utils 0.2.2, `PaginatorResponseMeta::new`). `next_cursor` and `prev_cursor` are always omitted because they are skipped when `None`:
```json
{"page": 1, "per_page": 20, "total": 3, "total_pages": 1, "has_next": false, "has_prev": false}
```
`total_pages = ceil(total / per_page)` (0 when total = 0), `has_next = page < total_pages`, `has_prev = page > 1`.

AppError variants, HTTP status, and message prefix. The message is exactly `format!("{prefix}: {detail}")`.

| Variant | Status | Prefix |
|---|---|---|
| ValidationError | 400 | `Validation error` |
| BadRequestError | 400 | `Bad request` |
| AuthenticationError | 401 | `Authentication failed` |
| AuthorizationError | 403 | `Authorization failed` |
| ForbiddenError | 403 | `Forbidden` |
| NotFoundError | 404 | `Resource not found` |
| ConflictError | 409 | `Conflict error` |
| InternalServerError | 500 | `Internal server error` |

Note that `ApiMessage` responses, from the auth middleware and a few handlers, have no prefix.

### 0.3 JSON body validation (`ValidatedJson`, `R:imphnen-libs/src/axum/validated_json.rs`)
- The Content-Type is not checked. The raw body is parsed as JSON.
- Body read failure returns 400 `{"message":"Failed to read body: <e>"}`.
- Invalid JSON returns 400 `{"message":"Invalid JSON: <serde_json error>"}`. An empty body gives `Invalid JSON: EOF while parsing a value at line 1 column 0`.
- Schema failure returns 400 `{"message":"Validation error: <zod-rs issue text>"}`. Don't depend on the exact text. Clients only show `message`.

zod-rs 0.4 semantics, which must be reproduced (`~/.cargo/registry/.../zod-rs-0.4.0/src/schema/object.rs`, `string.rs`):
- `Option<T>` fields are optional. Missing and `null` are both accepted, and in both cases no rule runs.
- Unknown keys are ignored because objects are non-strict.
- `url` means the string starts with `http://` or `https://`. Nothing else is checked.
- Integer Rust types (`i32`, `u64`) require an integer JSON number. `u64` also rejects negatives when deserialising.
- `min_length` / `max_length` apply to strings. On `Vec`, no length rules are declared anywhere in this domain, so empty arrays are allowed.
- Nested objects are validated recursively.

### 0.4 Pagination query (`PaginationQuery`, paginator-axum 0.2.2 `src/query.rs`)
Query params: `page` (u32, default 1, min 1), `per_page` (u32, default 20, clamped 1..100), `sort_by` (string), `sort_direction` (`asc`/`desc`, case-insensitive, anything else means none), `filter` (ignored by this domain), `search` and `search_fields` (ignored by this domain).
- A malformed value, such as `page=abc`, returns **400 with a plain-text body** `Invalid query params: <e>`. This is not JSON.
- The frontend sends `order=desc`. That param does not exist and is ignored. The backend key is `sort_direction`.

### 0.5 Authentication
JWT (`R:imphnen-libs/src/jsonwebtoken/mod.rs`): HS256 (`Header::default()`), secret `ACCESS_TOKEN_SECRET` (`ENV.access_token_secret`), default validation (`exp` required, 60 s leeway). The access token lives 15 minutes.

Claims:
```json
{"exp": 0, "iat": 0, "sub": "<email>", "user_id": "<app_users.id uuid>"}
```
Normal and mentor login put the email in `sub` (`R:imphnen-iam/src/auth/application/mod.rs:124`). `generate_jwt(user_id)` puts the user id in both `sub` and `user_id`. Handlers that treat `sub` as an email then fail for those tokens (see section 5).

**auth_middleware** (`R:imphnen-middleware/src/auth_middleware/mod.rs`) runs on every *protected* route before the handler. Its responses are `ApiMessage`, with no prefix:

| Condition | Status | message |
|---|---|---|
| No `Authorization: Bearer` header | 401 | `Invalid or missing authorization token` |
| Token fails decode or has expired | 401 | `Invalid or expired token` |
| `claims.user_id` is not a UUID | 401 | `Invalid user identifier format` |
| No `app_users` row with that id | 401 | `User not found or inactive` |

The middleware does not check `is_active` or `deleted_at`, despite the message (`R:imphnen-libs/src/services/user_lookup.rs:88-102`).

**Permission guard** (`require_permissions!` → `R:imphnen-iam/src/permissions_guard.rs`), used only by mentor routes. It returns AppError, so messages are prefixed:
1. Bearer missing → 401 `Authentication failed: Invalid or missing authorization token`.
2. Decode fails → 401 `Authentication failed: Invalid or expired token`.
3. User lookup: by email = `claims.sub`. If that fails, parse `sub` as a UUID and look up by id. Failures return 401 `Authentication failed: Invalid user ID format` or `Authentication failed: User not found`.
4. The user's permission strings are the raw strings stored in `app_roles.permissions` (a JSON array). Each string is matched as either a name or an id, because `model_to_dto` sets both `id` and `name` to the raw string (`R:imphnen-libs/src/services/dto.rs:68-83`).
5. If the list contains `Administrator` or `d6e7f8a9-0123-4567-8901-6789012345ab`, the check passes.
6. Otherwise every required permission must be present by display name or by id. If not, the response is 403 `Forbidden: You don't have the required permissions`.

Permission strings for this domain (`R:imphnen-entities/src/permissions/definitions.rs`, `mappings.rs`):

| Enum | Display name (exact) | Fixed id |
|---|---|---|
| ReadListMentors | `Read List Mentors` | `a1b2c3d4-5e6f-7890-abcd-ef1234567890` |
| ReadDetailMentors | `Read Detail Mentors` | `b2c3d4e5-6f78-9012-bcde-f23456789012` |
| RegisterMentors | `Register Mentors` | `c3d4e5f6-7890-1234-cdef-345678901234` (defined, never checked) |
| ReadOwnMentorProfile | `Read Own Mentor Profile` | `d4e5f6a7-8901-2345-def0-456789012345` |
| UpdateOwnMentorProfile | `Update Own Mentor Profile` | `e5f6a7b8-9012-3456-ef01-567890123456` |
| ReadOwnMentorStatus | `Read Own Mentor Status` | `f6a7b8c9-0123-4567-f012-678901234567` |
| UpdateMentors | `Update Mentors` | `a7b8c9d0-1234-5678-0123-789012345678` |
| VerifyMentors | `Verify Mentors` | `b8c9d0e1-2345-6789-1234-890123456789` |
| DeleteMentors | `Delete Mentors` | `c9d0e1f2-3456-7890-2345-901234567890` |
| Administrator | `Administrator` | `d6e7f8a9-0123-4567-8901-6789012345ab` |

Session routes do **no** permission check. They only require the auth middleware.

**Extractor order matters.** axum runs extractors in argument order: headers, Extension, Path, Query/Pagination, then body. The permission check runs inside the handler body. So for mentor routes, body validation errors (400) and pagination errors (400) take precedence over 403. On `detail/{id}`, `update/{id}`, `delete/{id}` and `verify/{id}`, the UUID-format check (400) also runs *before* the permission check.

### 0.6 Timestamp format
All timestamps are serialised with chrono `to_rfc3339()`: `YYYY-MM-DDTHH:MM:SS[.fraction]+00:00`. The offset is `+00:00`, not `Z`. The fraction has 0, 3, 6 or 9 digits depending on the value. Values read from Postgres carry at most 6 digits. For byte-compat, emit `+00:00`. JS `toISOString()` output (`.000Z`) differs. Frontends parse with `new Date()`, so either form works functionally.

`mentoring_rate` is an f64 and serialises as e.g. `100000.0`. In JS it becomes `100000`, which is harmless.

---

## 1. Tables

### 1.1 How the schema is actually created
There are no SQL migrations. `R:imphnen-backend/src/bin/create_schema.rs` drops and recreates each table from the SeaORM entity with `Schema::create_table_from_entity` (drop `IF EXISTS ... CASCADE`, then `CREATE TABLE IF NOT EXISTS`). SeaORM 1.1.19's `DeriveEntityModel` **silently ignores** these attributes on the entity (`sea-orm-macros-1.1.19/src/derives/entity_model.rs:136-215`, where the unknown-key branch discards the value):
- `default = "..."`
- `type = "jsonb"`
- `not_null`

Consequently the DDL generated by `create_schema` has:
- **No column defaults at all.** No `gen_random_uuid()`, no `now()`, no `false`.
- `serde_json::Value` columns typed **`json`**, not `jsonb`.
- `String` columns typed `varchar` with no length.
- `DateTime<Utc>` columns typed `timestamp with time zone`.
- Nullability derived only from `Option<T>`.
- A UNIQUE constraint only where `unique` is set.
- A FOREIGN KEY for every `belongs_to` relation (`sea-orm-1.1.19/src/schema/entity.rs:179-185`), named `fk-<table>-<col>`, with no ON DELETE/UPDATE action.

The production DDL may differ if the database was created some other way. See section 5, Q1. The TS port should not assume defaults exist: always supply `id`, `created_at`, `updated_at` and `is_deleted` explicitly.

The `create_schema.rs` and `clear_db.rs` labels say `"app_sessions"`. The **real table name is `sessions`** (`R:imphnen-entities/src/seaorm/auth/sessions.rs:6`). `clear_db` checks for a table literally named `app_sessions`, so it never truncates `sessions`.

### 1.2 `app_mentors` (`R:imphnen-entities/src/seaorm/auth/mentors.rs`)

| Column | PG type | Null | Default (per create_schema) | Constraints | Notes |
|---|---|---|---|---|---|
| id | uuid | NOT NULL | none (entity says `gen_random_uuid()` but ignored) | PRIMARY KEY | See section 5, B3: `repo.create` never sets it. |
| user_id | uuid | NOT NULL | none | UNIQUE; FK `fk-app_mentors-user_id` → `app_users(id)` | One mentor row per user, **including soft-deleted rows**. |
| industries | json | NULL | none | | JSON array of strings |
| expertise | json | NULL | none | | JSON array of strings |
| languages | json | NULL | none | | JSON array of strings |
| current_company | varchar | NULL | none | | |
| current_role | varchar | NULL | none | | **`current_role` is a reserved SQL keyword.** It must be quoted in raw SQL. IAM already does this: `R:imphnen-iam/src/users/infrastructure/http/handlers/get_handlers.rs:217`. |
| years_of_experience | integer | NULL | none | | |
| topics_of_interest | json | NULL | none | | JSON array of strings |
| preferred_mentee_level | varchar | NULL | none | | **Text containing a JSON-encoded string array**, e.g. `'["beginner","junior"]'`. Written with `serde_json::to_string`, read with `serde_json::from_str`. If the stored value isn't valid JSON (the seeders store `beginner`), it reads back as `[]`. |
| preferred_mentoring_formats | json | NULL | none | | JSON array of strings |
| availability_commitment | varchar | NULL | none | | |
| mentoring_rate | double precision | NULL | none | | The API sends a `u64` amount, stored as f64. No currency is stored. |
| status | varchar | NULL | none | | Free text. The code writes `pending` on registration and any non-empty string via verify. Seeders write `verified` or `active`. Frontends expect `active` / `pending` / `inactive`. |
| is_deleted | boolean | NOT NULL | none | | Soft-delete flag |
| created_at | timestamptz | NOT NULL | none | | |
| updated_at | timestamptz | NOT NULL | none | | |

Indexes: only the PK and the UNIQUE on `user_id`.

Read mapping (`model_to_entity`, `R:imphnen-dimentorin/src/mentors/infrastructure/persistence/postgres_mentor_repository.rs:17-59`):
- NULL json or a non-array value becomes `[]`.
- NULL strings become `""`.
- NULL `years_of_experience` becomes `0`.
- NULL `mentoring_rate` becomes `0.0`.
- NULL `status` becomes `""`.

### 1.3 `sessions` (`R:imphnen-entities/src/seaorm/auth/sessions.rs`)

| Column | PG type | Null | Default | Constraints | Notes |
|---|---|---|---|---|---|
| id | uuid | NOT NULL | none | PRIMARY KEY | The app generates a v4 id. |
| mentor_id | uuid | NOT NULL | none | FK `fk-sessions-mentor_id` → **`app_users(id)`** | **Semantics conflict**: the FK and IAM's user-profile SQL treat it as a *user id*. The frontend passes an *`app_mentors.id`*. See section 5, B4. |
| mentee_id | uuid | NOT NULL | none | FK `fk-sessions-mentee_id` → `app_users(id)` | Taken from the JWT `user_id` claim. |
| topic | varchar | NOT NULL | none | | API: 3..200 chars |
| description | varchar | NULL | none | | API: ≤1000 chars |
| scheduled_at | timestamptz | NOT NULL | none | | |
| duration_minutes | integer | NOT NULL | none | | API: 15..240. The app defaults it to 60. |
| meeting_link | varchar | NULL | none | | Set via status update |
| session_type | varchar | NOT NULL | none | | Entity comment: `video_call`, `phone_call`, `chat`. The app defaults it to `video_call`. Not validated beyond ≤50 chars. The frontend sends `online` / `offline`. |
| status | varchar | NOT NULL | none | | Entity comment: `pending`, `confirmed`, `completed`, `cancelled`, `no_show`. Not validated beyond 1..50 chars. |
| feedback | varchar | NULL | none | | API: 10..2000 chars |
| rating | integer | NULL | none | | API: 1..5 |
| feedback_submitted_at | timestamptz | NULL | none | | |
| created_at | timestamptz | NOT NULL | none | | |
| updated_at | timestamptz | NOT NULL | none | | |

Indexes: PK only. The port should add indexes on `(mentor_id, scheduled_at)` and `(mentee_id, scheduled_at)`.

There is no soft delete. `SessionRepository::delete` (hard delete) exists but is not routed.

### 1.4 Other tables this domain touches

**`app_users`** (`R:imphnen-entities/src/seaorm/auth/users.rs`). Read by every mentor endpoint. Written by mentor registration.

| Column | Type | Null | Notes |
|---|---|---|---|
| id | uuid PK | NOT NULL | |
| email | varchar UNIQUE | NOT NULL | |
| password_hash | varchar | NOT NULL | Argon2id PHC string (`Argon2::default()`: m=19456, t=2, p=1), `R:imphnen-libs/src/argon/mod.rs` |
| username | varchar | NOT NULL | Set to the email |
| role_id | uuid, FK → app_roles(id) | NULL | |
| first_name, last_name | varchar | NULL | `fullname` is split on the **first** space: first = before, last = rest (`""` if no space). Read back as `trim(first + " " + last)`. |
| avatar_url | varchar | NULL | |
| is_verified | boolean | NOT NULL | |
| is_active | boolean | NOT NULL | Mentor registration sets it to **false**. |
| metadata | json | NULL | The "profile extension" object (below) |
| created_at, updated_at | timestamptz | NOT NULL | |
| deleted_at | timestamptz | NULL | Soft delete |

`metadata` JSON shape (`UserProfileExtensionDto`, `R:imphnen-entities/src/users.rs:24-45`). Keys: `phone_number` (omitted if null), `phone_for_verification` (omitted if null), then `gender`, `birthdate`, `domicile`, `bio`, `last_education`, `linkedin_url`, `github_url`, `cv_url`, `portfolio_url`, `website_url`, `twitter_url`, `location`, `skills` (string[]), `experience` (array), `education` (array), `career_status`. All nullable, serialised as `null` when absent. The mentor detail fields `gender`, `domicile`, `phone_for_verification`, `bio`, `last_education`, `linkedin_url`, `github_url`, `cv_url` and `portfolio_url` **come from this JSON**, not from `app_mentors`. `legal_name` has no storage anywhere; the lookup always returns `None` (`R:imphnen-libs/src/services/dto.rs:51`).

**`app_roles`** (`R:imphnen-entities/src/seaorm/auth/roles.rs`): `id` uuid PK, `name` varchar, `description` varchar, `is_system_role` bool, `is_default` bool, `permissions` json (array of permission-id strings, or names), `created_at`, `updated_at`, `deleted_at`. Registration looks up the role with `name = 'Mentor' AND deleted_at IS NULL` (exact, case-sensitive).

Other readers of these tables outside this crate:
- `GET /v1/iam/users/...` with `include=mentor,sessions` (`R:imphnen-iam/src/users/infrastructure/http/handlers/get_handlers.rs:210-275`) reads `app_mentors`: `id, status, current_company, "current_role", years_of_experience WHERE user_id=$1 AND is_deleted=false`.
- The same endpoint reads `sessions WHERE mentor_id=$1 OR mentee_id=$1 ORDER BY scheduled_at DESC LIMIT 20`, treating `mentor_id` as a **user id**.
- `POST /v1/iam/auth/login-mentor` requires `role.name == "Mentor"` and `is_active`. It does not check `app_mentors.status`.

---

## 2. Endpoints

16 routes: 10 mentor, 6 session. "Protected" means the auth middleware from section 0.5 runs first.

### 2.0 Summary

| # | Method | Path | Auth | Permission |
|---|---|---|---|---|
| M1 | POST | `/v1/dimentorin/mentors/create` | **public** | none |
| M2 | GET | `/v1/dimentorin/mentors` | protected | `Read List Mentors` |
| M3 | GET | `/v1/dimentorin/mentors/me` | protected | `Read Own Mentor Profile` |
| M4 | PUT | `/v1/dimentorin/mentors/me/update` | protected | `Update Own Mentor Profile` |
| M5 | GET | `/v1/dimentorin/mentors/me/status` | protected | `Read Own Mentor Status` |
| M6 | GET | `/v1/dimentorin/mentors/detail/{id}` | protected | `Read Detail Mentors` |
| M7 | PUT | `/v1/dimentorin/mentors/update/{id}` | protected | `Update Mentors` |
| M8 | PUT | `/v1/dimentorin/mentors/update` | protected | none (stub, always 400) |
| M9 | DELETE | `/v1/dimentorin/mentors/delete/{id}` | protected | `Delete Mentors` |
| M10 | PUT | `/v1/dimentorin/mentors/verify/{id}` | protected | `Verify Mentors` |
| S1 | GET | `/v1/dimentorin/mentors/{id}/availability` | **public** | none |
| S2 | POST | `/v1/dimentorin/mentors/{id}/sessions/create` | protected | none |
| S3 | GET | `/v1/dimentorin/mentors/{id}/sessions` | protected | none |
| S4 | PUT | `/v1/dimentorin/sessions/update/{id}/status` | protected | none |
| S5 | POST | `/v1/dimentorin/sessions/{id}/feedback/create` | protected | none |
| S6 | GET | `/v1/dimentorin/sessions/me` | protected | none |

Sources: routes in `R:imphnen-dimentorin/src/mentors/infrastructure/http/routes.rs` and `R:imphnen-dimentorin/src/sessions/infrastructure/http/routes.rs`. Handlers are in the sibling `handlers/*.rs` files.

### 2.1 Shared response DTOs

**MentorDetail** (`R:imphnen-dimentorin/src/mentors/infrastructure/http/dto/response.rs:30-60`). All keys are always present; nullable keys are `null`:
```json
{
  "id": "uuid (app_mentors.id)",
  "user_id": "uuid",
  "fullname": "string|null",
  "email": "string|null",
  "legal_name": "string|null",
  "gender": "string|null",
  "domicile": "string|null",
  "phone_for_verification": "string|null",
  "bio": "string|null",
  "last_education": "string|null",
  "linkedin_url": "string|null",
  "github_url": "string|null",
  "cv_url": "string|null",
  "portfolio_url": "string|null",
  "industries": ["string"],
  "expertise": ["string"],
  "languages": ["string"],
  "current_company": "string",
  "current_role": "string",
  "years_of_experience": 0,
  "topics_of_interest": ["string"],
  "preferred_mentee_level": ["string"],
  "preferred_mentoring_formats": ["string"],
  "availability_commitment": "string",
  "mentoring_rate": 100000.0,
  "status": "string",
  "created_at": "rfc3339",
  "updated_at": "rfc3339"
}
```
The builder is `build_detail` (`R:imphnen-dimentorin/src/mentors/application/mentor_query_service.rs:11-63`). The user part comes from `user_lookup_service.get_user_by_id(user_id)`, which does **not** filter soft-deleted or inactive users. If the lookup fails, all user-derived fields are `null` and the error is swallowed. `fullname` = `trim(first_name + " " + last_name)`. `legal_name` is always `null`. The profile fields come from `app_users.metadata`.

**MentorListItem**:
```json
{"id":"uuid","user_id":"uuid","fullname":"string|null","email":"string|null","status":"string","created_at":"rfc3339","updated_at":"rfc3339"}
```

**SessionListItem** (`R:imphnen-dimentorin/src/sessions/infrastructure/http/dto/response.rs:39-53`):
```json
{"id":"uuid","mentor_id":"uuid","mentee_id":"uuid","mentee_fullname":null,"mentee_email":null,"topic":"string","scheduled_at":"rfc3339","duration_minutes":60,"session_type":"string","status":"string","rating":null,"created_at":"rfc3339"}
```
`mentee_fullname` and `mentee_email` are **always null**; the code never populates them.

**SessionList**: `{"sessions": SessionListItem[], "total": <int>}`. `total` comes from a separate `COUNT` with the same filter. There is no pagination.

### 2.2 Request DTOs for mentor endpoints (`R:imphnen-dimentorin/src/mentors/infrastructure/http/dto/request.rs`, `nested.rs`)

**MentorRegisterRequest** (M1):

| Field | Type | Required | Rule |
|---|---|---|---|
| email | string | yes | email format, min length 1 |
| password | string | yes | min 8, regex `^[A-Za-z\d@$!%*?&]{8,}$` (only these characters are allowed) |
| fullname | string | yes | min 2 |
| phone_number | string | no | none |
| identity_and_verification | object | yes | see below |
| professional_profile | object | yes | see below |
| mentoring_logistics | object | yes | see below |

`identity_and_verification`:
- `legal_name` string, required, min 3
- `gender` string, optional
- `domicile` string, optional
- `identity_document_url` string, required, url
- `phone_for_verification` string, optional, 10..15

`professional_profile`:
- `bio` string, required, min 50
- `last_education` string, optional
- `linkedin_url` optional, url
- `github_url` optional, url
- `cv_url` optional, url
- `portfolio_url` optional, no rule
- `industries`, `expertise`, `languages`: string[], required
- `current_company` string, required, min 1
- `current_role` string, required, min 1
- `years_of_experience` int, required, **min 2**

`mentoring_logistics`:
- `topics_of_interest`, `preferred_mentee_level`, `preferred_mentoring_formats`: string[], required
- `availability_commitment` string, required, min 5
- `mentoring_rate_amount` int ≥1 (u64), required

`MentoringRate {amount, currency, per_duration}` is defined but used by no endpoint.

**MentorUpdateRequest** (M4, M7). Every field is optional. Rules apply only when the field is present and non-null:

| Field | Type | Rule | **Persisted?** |
|---|---|---|---|
| legal_name | string | min 3 | **NO**, silently dropped |
| gender | string | | **NO** |
| domicile | string | | **NO** |
| phone_for_verification | string | 10..15 | **NO** |
| bio | string | min 50 | **NO** |
| last_education | string | | **NO** |
| linkedin_url | string | url | **NO** |
| github_url | string | url | **NO** |
| cv_url | string | url | **NO** |
| portfolio_url | string | url | **NO** |
| industries | string[] | | yes, but only if non-empty (see below) |
| expertise | string[] | | yes, if non-empty |
| languages | string[] | | yes, if non-empty |
| current_company | string | | yes, if non-empty |
| current_role | string | | yes, if non-empty |
| years_of_experience | int | min 2 | yes |
| topics_of_interest | string[] | | yes, if non-empty |
| preferred_mentee_level | string[] | | yes, if non-empty (stored as JSON text) |
| preferred_mentoring_formats | string[] | | yes, if non-empty |
| availability_commitment | string | min 5 | yes |
| mentoring_rate_amount | int ≥1 | | yes (as f64) |

The update logic (`R:imphnen-dimentorin/src/mentors/application/mentor_update_service.rs`, `R:imphnen-dimentorin/src/mentors/infrastructure/persistence/postgres_mentor_write.rs`):
- It loads the entity (non-deleted) and overwrites the fields that were provided.
- The write step then **skips any array or string that is empty**. You cannot clear a list or set a string to `""`; the old value stays.
- `years_of_experience`, `mentoring_rate` and `status` are always re-written from the loaded entity.
- `updated_at` is set to now.
- The row is re-read and returned as a MentorDetail.

**MentorVerifyRequest** (M10): `{"status": string (min 1)}`. Any string is accepted.

### 2.3 Mentor endpoints

#### M1. POST `/v1/dimentorin/mentors/create`: public mentor registration
- Auth: none.
- Body: MentorRegisterRequest.
- 200:
  ```json
  {"data":{"id":"uuid","user_id":"uuid","email":"string","status":"pending","created_at":"rfc3339","updated_at":"rfc3339"},"version":"0.3.0"}
  ```
  Here `created_at` and `updated_at` are the in-memory `Utc::now()` values, not the DB values.
- Errors. The handler converts every service error to `ApiMessage(status, e.to_string())`, so the body shape is the same as AppError:
  - 400 validation (section 0.3)
  - 409 `Conflict error: Mentor profile already exists for this user` (a non-deleted mentor row exists for an existing user)
  - 400 `Bad request: Mentor Role Not Found`
  - 500 `Internal server error: Failed to hash password`
  - 500 `Internal server error: <db error>` (user update or insert failure, or mentor insert failure)
  - 500 `Internal server error: Conflict error: User with this email already exists` (email belongs to a soft-deleted user; see flow)
- Flow: see section 3.1.

#### M2. GET `/v1/dimentorin/mentors`: list mentors
- Query: section 0.4. Only `page`, `per_page`, `sort_by` and `sort_direction` have any effect.
- Query: `WHERE is_deleted = false`, ordered as follows:
  - if `sort_by == "updated_at"`: by `updated_at`, ASC when `sort_direction=asc`, otherwise DESC
  - any other `sort_by`, including absent: by `created_at`, same direction rule
- `LIMIT per_page OFFSET (page-1)*per_page`, plus a count.
- Then **one user lookup per row (N+1)** to fill `fullname` and `email`. They are `null` if the lookup fails.
- 200: `{"data": MentorListItem[], "meta": Meta, "version":"0.3.0"}`.
- Errors: 400 (plain text) for a bad query, 401 or 403 from the guard, 500 on DB error.
- `search`, `filter` and `status` filtering are **not** implemented.

#### M3. GET `/v1/dimentorin/mentors/me`
- The email comes from `claims.sub` via `extract_email`, which requires the literal prefix `Bearer `. If it can't be read: 401 `Authentication failed: Token tidak valid`.
- The user is looked up by email (no deleted filter). Then the mentor row where `user_id = user.id AND is_deleted = false`.
- 200: `{"data": MentorDetail}`.
- **Any** service error, including DB errors, becomes 403 `Forbidden: Mentor profile not found for current user`.

#### M4. PUT `/v1/dimentorin/mentors/me/update`
- Body: MentorUpdateRequest. Resolution is the same as M3. Update semantics are in section 2.2.
- 200: `{"data": MentorDetail}`. The user part is re-fetched by id.
- Errors:
  - 401 `Authentication failed: Token tidak valid`
  - 404 `Resource not found: User not found`
  - 404 `Resource not found: Mentor not found`
  - 500

#### M5. GET `/v1/dimentorin/mentors/me/status`
- Resolution is the same as M3.
- 200 is an **ApiMessage, not ApiSuccess**: `{"message": "<status string, e.g. pending>", "version": "0.3.0"}`.
- Any error becomes 403 `Forbidden: No mentor application found for current user`. A missing token gives 401 as in M3.

#### M6. GET `/v1/dimentorin/mentors/detail/{id}`
- `id` must be a UUID (`app_mentors.id`). Otherwise 400 `Bad request: Invalid mentor ID format. Must be a valid UUID.`, checked before permissions.
- 200: `{"data": MentorDetail}`.
- 404 `Resource not found: Mentor not found` if the mentor is missing or soft-deleted.

#### M7. PUT `/v1/dimentorin/mentors/update/{id}`
- UUID check as in M6. Body: MentorUpdateRequest. Same semantics as M4, targeting `app_mentors.id`.
- 200: `{"data": MentorDetail}`.
- Errors: 400, 401, 403, 404 `Resource not found: Mentor not found`, 500.

#### M8. PUT `/v1/dimentorin/mentors/update` (no id)
- Behind the auth middleware (401 without a valid token). No body parsing.
- Always 400 `{"message":"Mentor ID is required for update","version":"0.3.0"}`.

#### M9. DELETE `/v1/dimentorin/mentors/delete/{id}`
- UUID check. Soft delete: `is_deleted = true`, `updated_at = now()`, only if it is currently `false`.
- The user's role and `is_active` are **not** changed.
- 200: `{"message":"Mentor deleted successfully","version":"0.3.0"}`.
- 404 `Resource not found: Mentor not found` if missing or already deleted.

#### M10. PUT `/v1/dimentorin/mentors/verify/{id}`
- UUID check. Body: `{"status": string}`.
- Loads the non-deleted mentor, sets `status` to the body value **verbatim** (there is no allowed-values list), sets `updated_at`, saves, and re-reads.
- 200: `{"data": MentorDetail}`.
- 404 if missing or deleted. 400 on validation. An empty body gives 400 `Invalid JSON: EOF ...`.
- No email is sent and the user is not activated.

### 2.4 Session endpoints (`R:imphnen-dimentorin/src/sessions/...`)

The protected session handlers do their own token reading. `extract_user_id` returns `claims.user_id`, and on failure 401 `Authentication failed: Token tidak valid`. The auth middleware has already validated the token.

#### S1. GET `/v1/dimentorin/mentors/{id}/availability`: public
- `id` is parsed as a UUID. On failure: 400 `Bad request: Invalid mentor ID: <uuid crate error text>`. The code does **not** check that the mentor exists.
- `booked_dates` = the `scheduled_at` (rfc3339) of every `sessions` row with `mentor_id = id AND status IN ('pending','confirmed')`, ordered by `scheduled_at` ASC. Past sessions are included.
- Slots: for `i` in 0..6 (7 days) starting at **today's UTC date**, and hour `h` in 9..16 (8 slots per day, including weekends):
  - `date = YYYY-MM-DD`, `time = "HH:00"`
  - `available = !booked_dates.any(d => d.startsWith("YYYY-MM-DDTHH"))`, comparing the first 13 chars in **UTC**
  - This gives 56 slots in date-then-hour order.
- 200:
  ```json
  {"data":{"mentor_id":"<id exactly as given in the path>","availability_commitment":"Available weekdays 9 AM - 5 PM","preferred_formats":["video_call","phone_call"],"slots":[{"date":"2025-07-06","time":"09:00","available":true}],"booked_dates":["2025-07-06T09:00:00+00:00"]},"version":"0.3.0"}
  ```
  `availability_commitment` and `preferred_formats` are **hard-coded constants**. The mentor's real data is ignored.
- 500 on DB error.

#### S2. POST `/v1/dimentorin/mentors/{id}/sessions/create`: book a session
- Body (`BookSessionRequestDto`):

  | Field | Type | Required | Rule |
  |---|---|---|---|
  | topic | string | yes | 3..200 |
  | description | string | no | ≤1000 |
  | scheduled_at | string | yes | min 1; must then parse as RFC 3339 with an offset |
  | duration_minutes | int | no | 15..240, default 60 |
  | session_type | string | no | ≤50, default `"video_call"` |

- Order of checks:
  1. body validation (400)
  2. JWT user id (401)
  3. `scheduled_at` RFC 3339 parse: 400 `Bad request: Invalid scheduled_at format: <chrono error>`
  4. mentor id UUID: 400 `Bad request: Invalid mentor ID: <e>`
  5. user id UUID: 400 `Bad request: Invalid user ID: <e>`
- Inserts a row: `id = new v4`, `mentor_id = path id` (**no existence check, no mentor-status check**), `mentee_id = JWT user_id`, `status = "pending"`, `meeting_link`/`feedback`/`rating`/`feedback_submitted_at` = null, `created_at = updated_at = now()`. `scheduled_at` is stored in UTC.
- No checks for: double booking, a past `scheduled_at`, mentor == mentee, or duration overlap.
- **200** (the OpenAPI docs say 201, but the code returns `ApiSuccess`, which is 200):
  ```json
  {"data":{"id":"uuid","mentor_id":"uuid","mentee_id":"uuid","topic":"string","description":"string|null","scheduled_at":"rfc3339","duration_minutes":60,"session_type":"video_call","status":"pending","created_at":"rfc3339"},"version":"0.3.0"}
  ```
- 500 `Internal server error: <db error>`. This includes an FK violation when `mentor_id` is not an `app_users.id` (see section 5, B4).

#### S3. GET `/v1/dimentorin/mentors/{id}/sessions`
- Query: `status` (optional; exact, case-sensitive equality). Note that `?status=` sends an empty string and matches nothing.
- Requires `claims.sub` to be readable (401 otherwise); the value is not used.
- **No ownership check.** Any authenticated user can list any mentor's sessions.
- 400 `Bad request: Invalid mentor ID: <e>` for a bad UUID. There is no existence check, so an unknown id gives an empty list.
- Query: `WHERE mentor_id = id [AND status = ?] ORDER BY scheduled_at DESC`, with no limit.
- 200: `{"data": SessionList, "version":"0.3.0"}`.

#### S4. PUT `/v1/dimentorin/sessions/update/{id}/status`
- Body: `{"status": string 1..50 (required), "meeting_link": string url (optional)}`.
- 400 `Bad request: Invalid session ID: <e>`. 404 `Resource not found: Session not found`.
- Sets `status` verbatim. Sets `meeting_link` only if provided; it cannot be cleared. Sets `updated_at = now()`. Then does a full-row update.
- **No authorisation.** Any authenticated user can change any session to any status (the user id is ignored: `_user_id`). There is no transition validation.
- 200: `{"data":{"id":"uuid","status":"string","meeting_link":"string|null","updated_at":"rfc3339"},"version":"0.3.0"}`.

#### S5. POST `/v1/dimentorin/sessions/{id}/feedback/create`
- Body: `{"feedback": string 10..2000, "rating": int 1..5}` (both required).
- Checks, in order:
  - 400 invalid session UUID
  - 404 `Resource not found: Session not found`
  - 403 `Forbidden: Only the mentee can submit feedback` when `mentee_id != JWT user_id` (string compare of hyphenated lowercase UUIDs)
  - 400 `Bad request: Feedback can only be submitted for completed sessions` when `status != "completed"`
- Sets `feedback`, `rating`, `feedback_submitted_at = now()` and `updated_at = now()`. **Resubmission is allowed and overwrites** the previous feedback.
- 200: `{"data":{"id":"uuid","feedback":"string","rating":5,"submitted_at":"rfc3339"},"version":"0.3.0"}`.

#### S6. GET `/v1/dimentorin/sessions/me`
- Query: `status` (optional, exact match).
- Returns the sessions where `mentee_id = JWT user_id` (**mentee side only**; a mentor's own bookings don't appear here), ordered by `scheduled_at DESC`, with no limit.
- Errors: 401 `Authentication failed: Token tidak valid` for a bad or missing token; 400 `Bad request: Invalid user ID: <e>`.
- 200: `{"data": SessionList}`.

Service methods that exist but are **not routed**: `get_session_detail(session_id)`, which would return a SessionDetail with `mentor_fullname`/`mentee_fullname` always null; `SessionRepository::delete`; and `find_all_paginated` for sessions (sorted by `created_at`).

---

## 3. Business rules

### 3.1 Mentor registration (M1): `R:imphnen-dimentorin/src/mentors/application/mentor_registration_service.rs:23-176`
There is no DB transaction; the steps below are independent writes.

1. Look up the user by email in `app_users` with `deleted_at IS NULL`.
2. **The user exists:**
   - a. If that user already has a non-deleted `app_mentors` row, return 409.
   - b. Load role `Mentor`. If it is missing, return 400.
   - c. **Overwrite the existing user**:
     - `fullname` becomes the request fullname (first and last name re-split)
     - `is_active = false`
     - `role_id` becomes the Mentor role
     - **`password_hash` becomes the hash of the request password**
     - `metadata`: the existing profile extension is merged. `phone_number`, `phone_for_verification`, `gender`, `domicile`, `bio`, `last_education`, `linkedin_url`, `github_url`, `cv_url` and `portfolio_url` are replaced by the request values, including `null` when absent. Other keys are kept.
     - `email`, `avatar_url` and `updated_at` are also written.
   - This is an **unauthenticated overwrite of any account by email**, including admin accounts. See section 5, B1.
3. **The user does not exist:**
   - Load role `Mentor` (400 if missing) and hash the password.
   - Create the user with `email`, `username = email`, the split fullname, `is_active = false`, `is_verified = false`, the Mentor role, and `metadata` containing the profile-extension fields above (other keys null).
   - The request's `legal_name` is passed but **not stored**; there is no column.
   - `UserRepository::create` **ignores the id it is given and generates its own** (`R:imphnen-iam/src/users/infrastructure/persistence/postgres_user_repository.rs:108`). The service then uses its *own* `new_user_id` for the mentor row. See section 5, B2.
   - If the email belongs to a soft-deleted user, `create` returns a Conflict, which is wrapped as 500.
4. Insert `app_mentors`:
   - `user_id`
   - arrays as json
   - `preferred_mentee_level` as JSON text
   - `current_company`, `current_role`, `years_of_experience`, `availability_commitment`
   - `mentoring_rate = amount as f64`
   - `status = "pending"`
   - `is_deleted = false`
   - `created_at = updated_at = now()`
   - `id` is **not set** in the insert (`R:imphnen-dimentorin/src/mentors/infrastructure/persistence/postgres_mentor_repository.rs:106-151`), so it relies on a DB default. See section 5, B3.
5. `identity_document_url` is validated but **discarded**; it is not stored anywhere.
6. No email, no OTP and no notification are sent. The new mentor cannot log in until `is_active` becomes true. Two IAM routes, outside this domain, can do that: `POST /v1/iam/auth/verify-email`, or an admin with `Activate Users`.

### 3.2 Approval / verification
- M10 sets `app_mentors.status` to any string. No state machine, no role change, no activation and no notification.
- Status values seen in the code:
  - `pending`: registration
  - `verified`: `seed_mentor_user`
  - `active`: `seed_test_data`
  - Backoffice UI expects `active`, `pending` or `inactive`.
  - Dimentorin UI has `register-mentor/pending` and `success` pages.
- `login-mentor` (IAM) does not look at `app_mentors.status` at all. It only checks role name == `Mentor` and `is_active`.
- Suggested canonical set for the port, to confirm with product: `pending | active | rejected | inactive`.

### 3.3 Session booking and scheduling
- Anyone authenticated can book with any mentor id. Nothing validates availability, conflicts, time in the future, the mentor's status, or self-booking.
- Defaults: `duration_minutes = 60`, `session_type = "video_call"`, `status = "pending"`.
- A slot counts as "booked" in S1 only if there is a `pending` or `confirmed` session whose `scheduled_at` UTC hour matches exactly. Durations are ignored.
- Status transitions are **unconstrained** (S4). The only rule that depends on status is that feedback requires `completed`.
- Feedback: only the mentee may submit; the rating is 1..5; resubmission overwrites.

### 3.4 External calls, emails, storage, audit
- **None** in this crate. No Google or GitHub API, no calendar, no payments, no email sending, no MinIO/storage calls, and no writes to `audit_logs`. `identity_document_url` and `cv_url` are plain URL strings that the client obtains elsewhere (dimentorin uses `useUploadCV` / `useUploadAvatar` from the service package; that is not part of this domain).
- Logging: `tracing::error!` on registration failures only.

### 3.5 Seeders (`R:imphnen-backend/src/bin/`)
- **`seed_roles.rs`**: creates the role `Mentor` with fixed id `3b9f8c4e-6a2d-4f8a-9a12-2d6f8b3c4e5a` (`is_system_role = true`, `permissions = []`) if absent. Other roles:
  - Admin `f6b03f25-e416-4893-ac88-caaa690afb07`
  - User `5713cb37-dc02-4e87-8048-d7a41d352059`
  - Staf `50133429-f4b1-4249-9f97-7b86e6ee9d86`
  - Staff Aktivasi User `60f1aeb7-dad2-4e06-bcb5-be1ba510c906`
  - Admin Pembayaran `6d4fea5d-4a08-4b8a-9782-f2ab2183dcf0`
- **`seed_roles_permissions.rs`** writes `app_roles.permissions` as an array of permission **ids**:
  - Admin: `[Administrator]`
  - Mentor: `ReadListUsers`, `ReadOwnMentorProfile`, `UpdateOwnMentorProfile`, `ReadOwnMentorStatus`, `ReadListMentors`, `ReadDetailMentors`, `ReadListGachaItems`, `ReadDetailGachaItems`, `ReadDetailGachaRolls`, `CreateGachaRolls`, `ExecuteGachaRolls`
  - User: gacha perms, plus `ReadListUsers`, `ReadDetailUsers`, `RegisterMentors`, `ReadListMentors`, `ReadDetailMentors`, `ReadOwnMentorProfile`, `ReadOwnMentorStatus`
  - Staf: includes `ReadListMentors` (listed twice) and `ReadDetailMentors`
  - Only Admin has `UpdateMentors`, `VerifyMentors` and `DeleteMentors`, via Administrator.
- **`seed_users.rs`**: `mentor2@example.com` (id `33333333-3333-3333-3333-333333333333`) with the Mentor role but **no `app_mentors` row**. The password for all seeded users is `password`.
- **`seed_mentor_user.rs`**:
  1. `DELETE FROM app_mentors WHERE id='e6f78d23-83bf-5c2b-bcd4-001345678901'`. This never matches, because the id inserted later is random.
  2. `DELETE FROM app_users WHERE email='mentor@example.com'`. This fails on the FK if a mentor row exists; the error is ignored.
  3. Insert user `mentor@example.com` / `password`: random id, username = email, first `Mentor`, last `User`, avatar `https://example.com/avatar.jpg`, `is_active` and `is_verified` = true, role Mentor.
  4. Insert the mentor row:
     - industries `["Software","Education"]`
     - expertise `["Rust","Microservices"]`
     - languages `["Indonesian","English"]`
     - company `PT Contoh`, role `Senior Backend Engineer`, 5 years
     - topics `["Rust Programming","Backend Development"]`
     - preferred_mentee_level `beginner` (not JSON, so it reads as `[]`)
     - formats `["online","offline"]`
     - availability `2 jam per minggu untuk mentoring online dan offline`
     - rate `100000.0`, status `verified`
  - **It is not re-runnable**: on the second run the user insert hits the unique email constraint.
- **`seed_test_data.rs`** inserts a mentor row for the admin user `c3b1d6a8-8d4f-4b36-b789-2e532ec7a7b2`: industries `["Technology","Education"]`, expertise `["Software Development"]`, level `Beginner` (reads as `[]`), formats `["1:1","Group"]`, availability `Weekly`, rate `100.0`, status `active`. It is not re-runnable either (unique `user_id`).
- **`seeder.rs`** runs `seed_mentor_user` and then `seed_test_data`, among others. No seeder creates `sessions` rows.
- **`clear_db.rs`** targets `app_sessions`, which does not exist, so `sessions` is never cleared.

---

## 4. Frontend callers

The service package is `F:packages/service/src/api/mentors/index.ts`, `.../api/sessions/index.ts`, `.../hooks/mentors/index.ts` and `.../hooks/sessions/index.ts`. Types are in `.../types/mentors/index.ts` and `.../types/sessions/index.ts`. The axios base URL comes from `PUBLIC_API_URL`, `NEXT_PUBLIC_API_URL` or `VITE_API_URL`, falling back to `https://api.imphnen.dev`.

### 4.1 Per endpoint

| Endpoint | Service fn / hook | Actual callers | Mismatch |
|---|---|---|---|
| M1 POST mentors/create | `registerMentor(data)` | **None.** `F:apps/dimentorin/src/routes/_public/auth/register-mentor.tsx` is an unwired 4-step form with no submit handler. | The fn sends a flat `MentorUpdateRequestDto & {email,password}`; the backend requires nested `identity_and_verification`, `professional_profile` and `mentoring_logistics` objects plus `fullname`, so it would return 400. It is typed to return `MentorDetailResponseDto`, but the backend returns `{id,user_id,email,status,created_at,updated_at}`. |
| M2 GET mentors | `getMentorList` / `useMentorList` | See the notes below this table. | **Public page against an authenticated endpoint**: anonymous visitors get 401. The list DTO has only 7 fields, but the UI reads `expertise`, `years_of_experience`, `current_role`, `current_company`, `rating`, so they render empty. `search` and `order` are ignored. `sort_by=rating` falls back to `created_at`. |
| M3 GET mentors/me | `getMentorMe` / `useMentorMe` | `F:apps/dimentorin/src/routes/_site/profile_/_components/contexts/profile-context.tsx:114`. It is always fired, even for non-mentors, who get 403. | `mentoring_rate` is typed `{amount,currency}`; the backend sends a number. `rating`, `mentoring_sessions`, `experience` and `education` are expected but never returned. |
| M4 PUT mentors/me/update | `updateMentorMe` / `useUpdateMentorMe` | profile-context.tsx:174, fed by `F:apps/dimentorin/src/routes/_site/profile_/_components/profile/profile-form-handlers.ts` | The handlers send `bio`, `linkedin_url`, `github_url`, `portfolio_url`, `cv_url` and `phone_for_verification`: all **accepted but not persisted**. `location`, `twitter_url`, `experience` and `education` are unknown keys and ignored. `cv_url` may be a bare filename, which fails the url rule with 400. `languages` works. `expertise` (skills) works. |
| M5 GET mentors/me/status | `getMentorStatus` | **None.** | It reads `response.data.data.status`; the backend returns `{"message":"<status>"}`, so the value would be `undefined`. |
| M6 GET mentors/detail/{id} | `getMentorById` / `useMentorById` | `F:apps/dimentorin/src/routes/_site/mentoring_/$id.tsx:21` (public page, same 401 issue); profile-context.tsx:115 (always fired with the profile id, which may be a *user* id, giving 404); `F:apps/backoffice/src/routes/_authenticated/users-dimentorin_/$id.tsx:53` | Same missing fields as M3. |
| M7 PUT mentors/update/{id} | `updateMentorById` / `useUpdateMentorById` | profile-context.tsx:180, when editing someone else's mentor profile | It needs `Update Mentors`, which only Admin has. |
| M8 PUT mentors/update | none | none | none |
| M9 DELETE mentors/delete/{id} | `deleteMentor` / `useDeleteMentor` | `F:apps/backoffice/src/routes/_authenticated/users-dimentorin.tsx:70,79`; `users-dimentorin_/$id.tsx:51,65` | OK. The response is `{message}`. |
| M10 PUT mentors/verify/{id} | `verifyMentor(id)` / `useVerifyMentor` | **None.** | It sends **no body**; the backend requires `{"status": "..."}` and returns 400 `Invalid JSON: EOF...`. |
| S1 GET mentors/{id}/availability | `getMentorAvailability` / `useMentorAvailability` | **None.** The mentor schedule section (`F:apps/dimentorin/src/routes/_site/mentoring_/$id/_components/sections/senpai-schedule.tsx`) uses a static `SCHEDULES` constant. | |
| S2 POST mentors/{id}/sessions/create | `bookSession` / `useBookSession` | `F:apps/dimentorin/src/routes/_site/mentoring_/$id/_components/modals/appointment/index.tsx:43,61`, which sends `{topic: joined topic names or "General Mentoring", description?, scheduled_at: new Date(date+"T"+time).toISOString(), session_type: "online"\|"offline"}` | `mentorId` is the **`app_mentors.id`** taken from the route; the DB FK expects an `app_users.id`, so it fails with 500 if the FK exists. `session_type` values differ from the backend vocabulary. Booking happens in the "payment" step, but the QRIS/VA payment steps have no backend. |
| S3 GET mentors/{id}/sessions | `getMentorSessions` / `useMentorSessions` | **None.** | |
| S4 PUT sessions/update/{id}/status | `updateSessionStatus` / `useUpdateSessionStatus` | **None.** | |
| S5 POST sessions/{id}/feedback/create | `submitFeedback` / `useSubmitFeedback` | **None.** The dimentorin `mentoring-feedback-modal.tsx` is mock-only. | |
| S6 GET sessions/me | `getMySessions` / `useMySessions` | Four backoffice pages (below). | The backoffice uses the *admin's own mentee sessions* as if they were platform-wide session data. The session status maps include `ongoing`. `mentee_fullname` and `mentee_email` are always null. |

Callers of M2 (`useMentorList`):
- `F:apps/dimentorin/src/routes/_site/mentoring.tsx:30`, a public page, with `{page, per_page: 8, search}`
- `F:apps/backoffice/src/routes/_authenticated/users-dimentorin.tsx:60` with `{search, page, per_page}`
- `F:apps/backoffice/src/routes/_authenticated/dashboard-dimentorin.tsx:61` with `{per_page: 5, sort_by: 'rating', order: 'desc'}`, which counts `status === 'active'`

Callers of S6 (`useMySessions`), all in `F:apps/backoffice/src/routes/_authenticated/`:
- `dashboard-dimentorin.tsx:67`, for totals, completed count and top topics
- `session-dimentorin.tsx:52`, with a status filter
- `session-dimentorin_/$id.tsx:42`, which fetches the whole list and finds the session by id client-side
- `feedback-review-dimentorin.tsx:62`, with `status: 'completed'`

### 4.2 Frontend features or calls with no backend route
These are UI features that need data this domain doesn't provide. Mock or static data is used today unless stated.

1. **Public (anonymous) mentor browse and detail.** Dimentorin `/mentoring` and `/mentoring/$id` are public routes, but M2 and M6 require auth and permissions.
2. **Rich list items**: `expertise`, `years_of_experience`, `current_role`, `current_company` and `rating` in list results; the mentor-card uses them.
3. **Mentor aggregates**: `rating` (average of `sessions.rating`), `mentoring_sessions` (count), and `experience[]` / `education[]` on the mentor. They are typed in `MentorDetailResponseDto` and read by `senpai-statistics.tsx`, `profile.tsx`, `experience.tsx`, `education.tsx`.
4. **Mentor list search and sort by rating** (backoffice and dimentorin).
5. **Admin, platform-wide session list** with pagination and status filter (backoffice session pages). A paginated repo query exists but no route.
6. **Session detail by id**, `GET /sessions/{id}`. The backoffice fakes it from the `/sessions/me` list. The service method `get_session_detail` exists but has no route.
7. **Registration status as JSON** (`{status}`) for the register-mentor pending/success pages; M5 returns `{message}`.
8. **Verify/approve mentor without a body**, or with a fixed status (`useVerifyMentor`).
9. **Persisting user-level mentor profile fields** through the mentor update endpoints: bio, social URLs, cv_url, phone, legal name, gender, domicile, last education, location, twitter.
10. **Mentor dashboard** (`F:apps/dimentorin/src/routes/_authenticated/dashboard/mentor/*`, all mock via `_data/mock/dashboard-mock.ts` or inline constants):
    - rating, sessions completed, mentees impacted, total feedback
    - topic chips, mentoring setup (rate, availability, expertise, level, completeness)
    - **payments** list
    - **mentee list** (`list-mentee.tsx`)
    - **feedback list with rating filter** (`feedback.tsx`)
    - **mentoring setup** with topic toggles and session days/time slots (`mentoring-setup.tsx`)
11. **User dashboard** (`.../dashboard/user/*`, mock):
    - mentoring history with Done/To do, contact mentor, submit feedback, and a detail modal (`mentoring.tsx`)
    - articles submitted/published (`article-builder.tsx`)
    - learning path / roadmap discovery (roadmap is CMS, not this domain)
12. **Booking payments** (QRIS / VA steps in the appointment modal). There is no payment backend.
13. **Mentor availability tied to mentor config**: S1 returns constants, and the UI doesn't call it.
14. Outside this domain but noticed: `F:apps/dimentorin/src/routes/_hooks/use-google-login.ts:53` calls `/v1/auth/google/login`, and `google-oauth-popup.tsx:30` calls `/v1/auth/google/callback`. The gateway has no such routes.

### 4.3 Backend routes with no frontend caller
M1 (the form isn't wired), M5, M8, M10, S1, S3, S4 and S5.

---

## 5. Open questions, oddities, bugs

### Bugs (decide: replicate or fix)
- **B1 (critical, security).** M1 is public and, for an **existing** email, overwrites that user's password, role (to Mentor) and `is_active=false` (`mentor_registration_service.rs:29-87`). Anyone can take over or lock any account, including admins. **Recommendation:** in the port, return 409 for an existing email, or require an authenticated user and register *that* user (see the unused `MentorRegisterFromTokenRequestDto` in `R:imphnen-dimentorin/src/mentors/infrastructure/http/dto/request.rs:176-181`, which hints at an intended "register from token" flow).
- **B2.** On the new-user path, `UserRepository::create` generates its own UUID and ignores `UserEntity.id` (`R:imphnen-iam/src/users/infrastructure/persistence/postgres_user_repository.rs:108`). The mentor row therefore gets a `user_id` that doesn't exist. With the FK present, the insert fails with 500 *after* the user was created, and a retry then goes down the existing-user path and succeeds. Without the FK, you get an orphan mentor row. **Fix:** use the created user's actual id, inside one transaction.
- **B3.** `PostgresMentorRepository::create` never sets `id`, and the entity's `default = "gen_random_uuid()"` is ignored by SeaORM. Under `create_schema` DDL, the insert fails with NOT NULL on `id`. This only works if production has a DB default. **Fix:** set `id` explicitly.
- **B4.** What `sessions.mentor_id` identifies is contradictory:
  - The FK points to `app_users.id`, and IAM's profile query uses a user id.
  - The frontend passes `app_mentors.id` to S1, S2 and S3.
  - Neither the backend nor the frontend translates between them.
  - **Decide:** store `app_mentors.id`, and change the FK and the IAM query; or have S1, S2 and S3 resolve mentor id → user id.
- **B5.** S4 has no authorisation: any authenticated user can set any session's status or meeting link. S3 leaks any mentor's sessions to any user.
- **B6.** The mentor update endpoints accept 10 user-level fields and silently drop them. `legal_name` and `identity_document_url` are never stored anywhere.
- **B7.** Empty arrays or strings in an update can't clear a field (`postgres_mentor_write.rs:10-62`).
- **B8.** A soft-deleted mentor's user can never re-register: the non-deleted lookup misses, then the insert hits UNIQUE(`user_id`) and returns 500.
- **B9.** M3, M4 and M5 treat `claims.sub` as an email. Tokens minted by `generate_jwt(user_id)`, where `sub` is the uuid, fail (403/404). The permission guard, by contrast, falls back to an id lookup.
- **B10.** S1 ignores the mentor's actual availability, formats and existence. Slots are in UTC and include weekends, but the text says "weekdays". Past pending sessions stay in `booked_dates`.
- **B11.** `preferred_mentee_level` is stored as JSON-in-varchar while its sibling columns are `json`. Seeded rows hold plain strings and read back as `[]`.
- **B12.** S2 returns 200 while the docs say 201. It has no double-booking, past-date or self-booking checks, and doesn't check the mentor's status.
- **B13.** Seeders aren't idempotent. `clear_db` uses the wrong table name (`app_sessions`).
- **B14.** The auth middleware's "User not found or inactive" check doesn't check `is_active` or `deleted_at`, so deactivated and soft-deleted users still pass on protected routes.

### Open questions
- **Q1.** What is the actual production DDL for `app_mentors` and `sessions`: `json` vs `jsonb`, defaults, FKs present, table name `sessions`? Run `\d app_mentors` and `\d sessions` on prod before writing the Drizzle schema. Also audit the existing data for B2 and B4 inconsistencies (`app_mentors.user_id` not in `app_users`; `sessions.mentor_id` values that are mentor ids vs user ids).
- **Q2.** What is the canonical mentor `status` vocabulary: `pending`/`verified`/`active`/`inactive`/`rejected`? Should verify also activate the user (`is_active=true`) and send an email?
- **Q3.** What is the canonical `session_type` vocabulary: `video_call`/`phone_call`/`chat` or `online`/`offline`? And the session status set: should `ongoing` (frontend) and `no_show` (backend comment) both be included? Which transitions should be allowed, and by whom (mentor vs mentee vs admin)?
- **Q4.** Should mentor list and detail be public for dimentorin browsing, as the frontend assumes? If so, which fields may anonymous users see? `email` and `phone_for_verification` should probably not be public.
- **Q5.** Should the port keep `/mentors/me/status` returning `{message}` for compatibility, or switch to `{data:{status}}` as the frontend expects? No frontend calls it today, so switching is low risk.
- **Q6.** Should the list DTO be enriched with the fields the frontend reads (expertise, role, company, years, rating, session count)?
- **Q7.** Where should `experience[]`, `education[]`, `location` and `twitter_url` for mentors live? The IAM `metadata` JSON already has `experience`, `education`, `location` and `twitter_url` keys.
- **Q8.** Should `mentoring_rate` gain a currency or unit? The frontend type is `{amount,currency}`, and `MentoringRate{amount,currency,per_duration}` exists unused in Rust.
- **Q9.** Is payment (QRIS/VA) in scope for booking? Currently no backend.
- **Q10.** Is the `RegisterMentors` permission meant to guard an authenticated registration route? It is granted to the User role but checked nowhere.

### Compatibility notes for the TS implementer
- Keep the envelope (`data`/`meta`/`message` + `version: "0.3.0"`), the error message prefixes, and the status codes as listed. The frontend reads `response.data.data`, `response.data.meta.total` and `error.response.data.message`.
- The pagination query keys are `page`, `per_page`, `sort_by` and `sort_direction`. Consider also accepting `order` and `search`, since the frontend sends them.
- Quote the `current_role` column. Store `preferred_mentee_level` compatibly (JSON text) unless you migrate it.
- Emit timestamps with `+00:00` if you need byte-compatibility; otherwise ISO `Z` is fine for the current frontends.
