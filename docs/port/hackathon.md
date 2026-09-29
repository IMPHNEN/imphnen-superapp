# Porting spec: `imphnen-hackathon` (Rust) to TypeScript

Source crate: `/Users/ms/Development/imphnen-backend-service/imphnen-hackathon` (crate version 0.3.0, about 7.3k lines).
Mount point: `imphnen-gateway/src/lib.rs:93`, `.nest("/v1/hackathon", hackathon_router(db.clone(), minio))`.
Router assembly: `imphnen-hackathon/src/lib.rs` merges 10 sub-routers (users, teams, invitations, join_requests, chat, submissions, storage, certificates, winners, admin).

All paths below are relative to the Rust crate root `imphnen-hackathon/src/` unless they start with another crate name.

---

## 0. Cross-cutting behaviour (read this first)

### 0.1 Response envelopes (from `imphnen-utils/src/response_format.rs`, `imphnen-utils/src/errors.rs`)

`version` is always the string `"0.3.0"`. It comes from `env!("CARGO_PKG_VERSION")`, which expands inside `imphnen-utils` (version 0.3.0).

| Kind | HTTP | Body |
|---|---|---|
| `ApiSuccess(T)` | 200 | `{ "data": T, "version": "0.3.0" }` |
| `ApiMessage::ok(msg)` | 200 | `{ "message": msg, "version": "0.3.0" }` |
| `AppError` | varies | `{ "message": "<Prefix>: <detail>", "version": "0.3.0" }` |

The hackathon crate never uses `ApiCreated` (201) or `ApiPaginated` (`meta`). All creates return **200**. Paginated lists nest their own `{data,total,page,...}` object inside `data` (see 2.x).

The `AppError` message prefixes come from the `Display` impl, and the frontend shows them verbatim, so they must match exactly:

| Variant | HTTP | message format |
|---|---|---|
| `BadRequestError(d)` | 400 | `Bad request: {d}` |
| `ValidationError(d)` | 400 | `Validation error: {d}` (unused in crate) |
| `ForbiddenError(d)` | 403 | `Forbidden: {d}` |
| `NotFoundError(d)` | 404 | `Resource not found: {d}` |
| `ConflictError(d)` | 409 | `Conflict error: {d}` |
| `InternalServerError(d)` | 500 | `Internal server error: {d}` (d is often the raw sqlx/driver error string, which leaks SQL details) |

Non-`AppError` failures are **plain text** (not JSON), produced by axum or the middleware:

| Source | HTTP | Body (text/plain) |
|---|---|---|
| Missing `Authorization` header | 401 | `Missing Authorization header` |
| Header not starting with `Bearer ` (case-sensitive, single space) | 401 | `Invalid Authorization header format` |
| JWT decode/verify failure or expiry | 401 | `Invalid or expired token` |
| `claims.user_id` not a UUID | 401 | `Invalid user ID in token` |
| `admin_only` rejection | 403 | JSON `{ "message": "Forbidden - Admin access required" }` (**no** `version`) |
| Path param not a UUID (axum `Path<Uuid>`) | 400 | `Invalid URL: ...` (axum text) |
| Query param parse failure (e.g. `page=abc`, `has_submission=yes`) | 400 | `Failed to deserialize query string: ...` |
| JSON body missing field / wrong type | 422 | `Failed to deserialize the JSON body into the target type: ...` |
| JSON body syntactically invalid | 400 | `Failed to parse the request body as JSON: ...` |
| Missing `Content-Type: application/json` on Json endpoints | 415 | `Expected request with \`Content-Type: application/json\`` |
| JSON body over 2 MB (axum default `DefaultBodyLimit`; there is no override anywhere in the workspace) | 413 | `Failed to buffer the request body: length limit exceeded` |

### 0.2 Serialization conventions

- UUIDs: lowercase hyphenated strings.
- Timestamps: `chrono::DateTime<Utc>`, serialized as RFC 3339 with `Z` suffix. Fractional seconds appear only when non-zero (up to microseconds from Postgres), e.g. `"2025-11-20T10:11:12.345678Z"`.
- `Option<T>` fields serialize as `null` when absent. They are never omitted, because no `skip_serializing_if` exists in this crate.
- `Option<Vec<String>>` (skills, screenshots) serializes as `null` or `[...]`.
- JSON field names are snake_case exactly as listed. There are no serde renames.

### 0.3 Authentication: the hackathon crate's own middleware

File: `middleware/hackathon_auth.rs`. This is **not** the gateway `imphnen-middleware::auth_middleware`. The hackathon router is nested **without** the IAM auth layer (`imphnen-gateway/src/lib.rs:93`), and each sub-router attaches `hackathon_auth_middleware` itself.

The middleware runs these steps in order:
1. It reads the `Authorization` header. If absent, it returns 401 text.
2. It strips the literal prefix `"Bearer "`. If the prefix is absent, it returns 401 text.
3. It calls `imphnen_libs::decode_access_token(token)` (`imphnen-libs/src/jsonwebtoken/mod.rs`). The token is HS256 (jsonwebtoken `Header::default()`), the secret is env `ACCESS_TOKEN_SECRET`, and `Validation::default()` applies (alg HS256, `exp` required and checked with 60 s leeway). Claims are `{ exp: usize, iat: usize, sub: String, user_id: String }`. The tokens are the **same IAM access tokens** issued by `/v1/iam/auth/*`, with a 15-minute lifetime.
4. It parses `claims.user_id` as a UUID.
5. It runs `SELECT COALESCE(is_admin,false) FROM hackathon_users WHERE id = $1`. Any DB error **or** a missing row produces `is_admin = false`. The request is **not rejected** when the user has no `hackathon_users` row.
6. It inserts `HackathonAuthUser { user_id, is_admin }` into the request extensions.

Admin guard (`middleware/admin_only.rs`): it runs after the auth middleware and rejects with 403 JSON when `!is_admin`. Admin status is the `hackathon_users.is_admin` column. It is **not** tied to IAM roles or permissions.

**Permissions:** the hackathon crate does **not** use `imphnen-entities/src/permissions` at all. There are no `require_permissions!` calls and no hackathon permission names in `definitions.rs` or `mappings.rs`. The "Permission" column in section 2 is therefore either none, `hackathon_users.is_admin`, or a resource-level rule such as team leader or team member.

Identity linkage: the JWT `user_id` (the IAM `users.id`) is used directly as `hackathon_users.id`. IAM also reads `hackathon_users WHERE id = <IAM user id>` for the unified `/v1/iam/users/me?include=hackathon` (`imphnen-iam/src/users/infrastructure/http/handlers/get_handlers.rs:171-190`). **Nothing in the current codebase inserts into `hackathon_users`**. The old Supabase/GitHub signup that created rows was removed in commit `2ae43b3` (see section 5).

Public (no auth) routes: `GET /teams/browse`, `GET /teams/{team_id}`, `GET /certificates/{user_id}`, `GET /winners`.

### 0.4 Deadlines (hard-coded UTC constants)

| Constant | Value (UTC) | WIB | Used in |
|---|---|---|---|
| Team features close | `2025-11-30T16:59:00Z` | Nov 30 2025 23:59 | `teams/application/team_service.rs:11`, `invitations/application/invitation_service.rs:9`, `join_requests/application/join_request_service.rs` (`is_team_features_closed`) |
| Submission deadline | `2025-12-07T16:59:00Z` | Dec 7 2025 23:59 | `submissions/application/submission_service.rs:9` |

The check is `now >= deadline`. Today (2026-09-29) **both deadlines have passed**, so every deadline-gated mutation currently returns 400. Port them as configuration, not constants.

### 0.5 Transactions and concurrency

There are **no transactions anywhere** in the crate. Every multi-step write is a sequence of independent autocommit statements: create team + add leader + reject invites + reject join requests, and accept invitation + add member + reject others. Member-limit checks are check-then-insert races. Port with transactions (and optionally `SELECT ... FOR UPDATE` on the team row).

---

## 1. Tables

No DDL exists in the repo or its git history (`init.sql` never contained hackathon tables). Everything below is **inferred** from sqlx queries, `FromRow` structs, and INSERT/UPDATE column lists. Types come from the Rust types bound or decoded: `Uuid`→`uuid`, `String`→`text`/`varchar`, `Option<X>`→nullable-or-unknown, `Vec<String>`→`text[]`, `i32`→`int4`, `i64` from `COUNT(*)`, `DateTime<Utc>`→`timestamptz`, `bool`→`boolean`. Anything not proven is marked **INFERRED**. Status/role/visibility columns are bound as Rust `&str`/`String` (a text parameter), so they are text or varchar, **not** Postgres enums; binding text to an enum column would fail without a cast.

"Nullable?" meanings:
- **NN** means the Rust decode type is non-`Option`, so NULL would crash decoding. The column is very likely `NOT NULL`.
- **N?** means it is decoded as `Option`, so it may be nullable. Often it is actually `NOT NULL DEFAULT now()` but code is defensive (INFERRED).

### 1.1 `hackathon_users`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NN | none (supplied) | PK (INFERRED). Equals IAM `users.id` (JWT `user_id`). |
| email | text | NN | none | **UNIQUE**. Historical `ON CONFLICT (email)` in removed auth code (`git show 11442c6:imphnen-hackathon/src/auth/application/auth_service.rs:45,80,109`). Old signup stored `LOWER(email)`. |
| fullname | text | NN | none | |
| avatar | text | N? | NULL | Storage key or URL. |
| phone_number | text | N? | NULL | |
| location | text | N? | NULL | Frontend onboarding gate checks it. |
| bio | text | N? | NULL | |
| skills | text[] | N? | NULL | |
| is_active | boolean | N? | INFERRED (old signup inserted `false`, GitHub login inserted `true`) | Never checked by current code. |
| is_admin | boolean | N? | INFERRED `false` | Read via `COALESCE(is_admin,false)`. Set by `POST /admin/users/{id}/set-admin`. |
| created_at | timestamptz | N? | INFERRED `now()` | |
| updated_at | timestamptz | N? | INFERRED `now()` | Set explicitly on profile update. |

### 1.2 `hackathon_teams`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NN | supplied (`Uuid::new_v4`) | PK |
| name | text | NN | none | Not unique in code (no ON CONFLICT or unique error handling). INFERRED non-unique. |
| description | text | **N?** | NULL | `TeamRow.description: Option<String>`, but `users/.../postgres_user_repository.rs` `get_user_teams` decodes it as `String` (bug, see section 5). |
| city | text | NN | none | Validated against `common/cities.rs` (500 names) on create/update. |
| visibility | text | NN | none | Expected `'public'` or `'private'` but **not validated**. Browse filters `visibility = 'public'`. |
| logo | text | N? | NULL | |
| banner | text | N? | NULL | |
| leader_id | uuid | NN | none | FK → `hackathon_users.id` (INFERRED). |
| created_at | timestamptz | NN (admin `AdminTeamRow.created_at` is non-Option) | supplied `now` | |
| updated_at | timestamptz | NN (users-repo `TeamRow.updated_at` non-Option) | supplied | |

Indexes (INFERRED, recommended): `(visibility, created_at DESC)`, `(leader_id)`, `(city)`.

### 1.3 `hackathon_team_members`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NN | supplied | PK |
| team_id | uuid | NN | none | FK → `hackathon_teams.id`, **ON DELETE CASCADE (INFERRED)**. `DELETE FROM hackathon_teams` succeeds while the leader member row exists (`teams/.../postgres_team_repository.rs` `delete`), which requires cascade. |
| user_id | uuid | NN | none | FK → `hackathon_users.id` (INFERRED) |
| role | text | NN | none | `'leader'` or `'member'` |
| status | text | NN | none | Only `'active'` is ever written. Every read filters `status='active'`. Other historical values are possible (INFERRED). |
| joined_at | timestamptz | N? | supplied `now`/`NOW()` | |

Constraint: **UNIQUE (team_id, user_id)**, proven by `ON CONFLICT (team_id, user_id) DO NOTHING` in `teams/infrastructure/persistence/postgres_team_repository.rs` `add_member`.
Removal is a hard `DELETE` (`remove_member`). There is no soft-delete.

### 1.4 `hackathon_team_invitations`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NN | supplied | PK |
| team_id | uuid | NN | none | FK → teams (cascade INFERRED) |
| inviter_id | uuid | NN | none | FK → users (INFERRED) |
| invitee_email | text | NN | none | Stored **as given** (not lowercased). All matching is exact and case-sensitive. |
| status | text | NN | inserted `'pending'` | `'pending'`, `'accepted'`, `'rejected'` |
| created_at | timestamptz | N? | `NOW()` in insert | |

There is no `updated_at` or `invitee_id` column referenced. The frontend type has `invitee_id` (not provided).

### 1.5 `hackathon_team_join_requests`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NN | supplied | PK |
| team_id | uuid | NN | none | FK → teams (cascade INFERRED) |
| user_id | uuid | NN | none | FK → users |
| message | text | NN | none | May be empty string. |
| status | text | NN | `'pending'` | `'pending'`, `'accepted'`, `'rejected'` |
| created_at | timestamptz | N? | `NOW()` | |

### 1.6 `hackathon_project_submissions`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NN | supplied | PK |
| team_id | uuid | NN | none | FK → teams (cascade INFERRED). One per team, enforced in service. DB UNIQUE is INFERRED (queries use `LIMIT 1`, `SELECT DISTINCT team_id`). |
| project_name | text | NN | none | |
| description | text | NN | none | |
| repository_url | text | NN | none | |
| demo_url | text | N? | NULL | |
| presentation_url | text | N? | NULL | |
| screenshots | text[] | N? | NULL | |
| status | text | NN | `'draft'` on insert | `'draft'`, `'pending'`, `'submitted'`. Swagger examples show `confirmed`/`cancelled`, which are never produced. |
| submitted_at | timestamptz | N? | NULL | Set to `NOW()` when status becomes `'submitted'`. Never cleared. |
| submitted_by | uuid | NN | none | FK → users. It is the **creator** (leader at create time), not the confirmer. |
| created_at | timestamptz | N? | supplied | |
| updated_at | timestamptz | N? | supplied | |

### 1.7 `hackathon_winners`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NN | supplied | PK |
| team_id | uuid | NN | none | **UNIQUE**, proven by `ON CONFLICT (team_id)` in `admin/.../postgres_admin_repository.rs` `set_winner`. FK → teams (INFERRED). |
| rank | int4 | NN | none | Not unique in code; duplicate ranks allowed. |
| prize | text | N? | NULL | Free text, e.g. `"Rp 10.000.000"`. |
| announced_at | timestamptz | N? | `NOW()` on first insert | Not updated on upsert. |
| created_at | timestamptz | N? | `NOW()` | |
| updated_at | timestamptz | INFERRED | `NOW()` | Written, never read. |

### 1.8 `hackathon_team_messages`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NN | supplied | PK |
| team_id | uuid | NN | none | FK → teams (cascade INFERRED) |
| user_id | uuid | NN | none | FK → users (INFERRED). Messages are inner-joined to users on read, so orphans are hidden. |
| message | text | NN | none | No length limit. |
| created_at | timestamptz | N? | supplied | Index `(team_id, created_at)` recommended. |
| updated_at | timestamptz | N? | supplied (= created_at) | There is no edit endpoint. |

No other hackathon tables are referenced. The FK and cascade behaviour for `hackathon_users` deletion (admin delete user) is unknown; see section 5.

---

## 2. Endpoints (44 routes)

Legend for the Auth column:
- **none**: public.
- **H**: `hackathon_auth_middleware` (section 0.3).
- **H+A**: H plus `admin_only` (`hackathon_users.is_admin = true`).

Auth failures from H and H+A are described in 0.1 and are not repeated per row. Path-UUID, JSON, and query extraction errors (400/415/422) also apply everywhere and are not repeated. "Leader" means `hackathon_teams.leader_id = caller`. "Member" means an active `hackathon_team_members` row for the caller.

Common DTO shapes:

```jsonc
// UserResponse (users module)
{ "id": uuid, "email": str, "fullname": str, "avatar": str|null, "phone_number": str|null,
  "location": str|null, "bio": str|null, "skills": [str]|null, "is_active": bool|null,
  "created_at": ts|null, "updated_at": ts|null }

// UserInfoResponse (inside teams) = UserResponse WITHOUT created_at/updated_at

// TeamMemberResponse
{ "id": uuid, "team_id": uuid, "user_id": uuid, "user": UserInfoResponse,
  "role": "leader"|"member", "status": "active", "joined_at": ts|null }

// TeamResponse
{ "id", "name", "description": str|null, "city", "visibility", "logo": str|null, "banner": str|null,
  "leader_id": uuid, "leader": UserInfoResponse|null, "members": [TeamMemberResponse]|null,
  "member_count": int|null, "has_submission": bool|null, "created_at": ts|null, "updated_at": ts|null }

// InvitationResponse
{ "id", "team_id", "team_name", "inviter_id", "inviter_fullname", "invitee_email", "status", "created_at": ts|null }

// JoinRequestResponse
{ "id", "team_id", "user_id", "user_fullname", "user_email", "user_avatar": str|null,
  "message", "status", "created_at": ts|null }

// MessageResponse
{ "id", "team_id", "user_id", "user_fullname", "user_avatar": str|null, "message",
  "created_at": ts|null, "updated_at": ts|null }

// SubmissionResponse
{ "id", "team_id", "project_name", "description", "repository_url", "demo_url": str|null,
  "presentation_url": str|null, "screenshots": [str]|null, "status", "submitted_at": ts|null,
  "submitted_by": uuid, "created_at": ts|null, "updated_at": ts|null }
```

`TeamResponse` variants. The same DTO is populated differently per endpoint:

| Endpoint | leader | members | member_count | has_submission |
|---|---|---|---|---|
| POST /teams, GET /teams/{id}, PUT /teams/{id} (`assemble_team_details`) | object or null | full array (active only) | `members.length` | bool |
| GET /teams/browse | object or null (batch) | **null** | int, or **null** when team has 0 active members | bool |
| GET /teams/my | object or null | **null** | int or null | **null** |

### 2.1 Users (`users/infrastructure/http/*`). All routes use H.

| # | Method | Path | Auth | Request | Response 200 | Errors |
|---|---|---|---|---|---|---|
| 1 | GET | `/v1/hackathon/users/me` | H | none | `ApiSuccess(UserResponse)` for caller | 404 `Resource not found: User not found` when no `hackathon_users` row |
| 2 | PUT | `/v1/hackathon/users/me` | H | JSON, all optional: `fullname?: string, phone_number?: string, avatar?: string, location?: string, bio?: string, skills?: string[]`. No validation. `null` or absent means "don't change", so a field **cannot be cleared**. | `ApiSuccess(UserResponse)` (updated). `updated_at = now` only if at least one field was given. If none are given it returns the current row. | 404 if no row and body empty. If no row and body non-empty, `fetch_one` fails and returns **500** `Internal server error: no rows returned by a query that expected to return at least one row` |
| 3 | GET | `/v1/hackathon/users/{user_id}` | H (Swagger wrongly shows public) | path uuid | `ApiSuccess(UserResponse)`, including email and phone of any user | 404 `User not found` |
| 4 | GET | `/v1/hackathon/users/{user_id}/teams` | H | path uuid | `ApiSuccess([{id,name,description,city,visibility,logo,banner,leader_id,created_at,updated_at}])`: active memberships, `ORDER BY t.created_at DESC`. This is **not** a TeamResponse: there is no `member_count` or `leader` (Swagger example is wrong). Returns `[]` for unknown user (no 404). | **500** if any matched team has `description IS NULL` (decoded as non-Option `String`) |

### 2.2 Teams (`teams/infrastructure/http/*`, service `teams/application/team_service.rs`)

| # | Method | Path | Auth | Request | Response 200 | Errors (in check order) |
|---|---|---|---|---|---|---|
| 5 | GET | `/v1/hackathon/teams/browse` | none | Query: `search?: string` (ILIKE `%s%` on name; `%`/`_` are **not** escaped), `city?: string` (exact, case-sensitive `=`), `min_members?: i64`, `max_members?: i64` (compare active-member count; teams with 0 members have NULL count and are **excluded** whenever either filter is set), `has_submission?: bool` (`true`/`false` only; EXISTS on any submission row incl. draft), `page: i64 = 1` (<1 → 1), `per_page: i64 = 10` (<1 → 10, >100 → 100). Always `visibility='public'`. `ORDER BY created_at DESC LIMIT per_page OFFSET (page-1)*per_page`. | `{ "data": { "data": [TeamResponse(browse variant)], "total": int, "page": int, "per_page": int }, "version": "0.3.0" }`. `total` is the filtered count; a count-query failure is silently 0. | 500 on select failure |
| 6 | GET | `/v1/hackathon/teams/{team_id}` | none | path uuid | `ApiSuccess(TeamResponse full)`. Works for **private** teams too, and exposes all members' email and phone. | 404 `Team not found` |
| 7 | POST | `/v1/hackathon/teams` | H | JSON: `name: string` (required, may be empty), `description?: string`, `city: string` (required), `visibility: string` (required, unvalidated), `logo?: string`, `banner?: string` | `ApiSuccess(TeamResponse full)` (status **200**) | 400 `Bad request: Team features are closed. The deadline was November 30, 2025 at 23:59 WIB.`; 400 `Bad request: Invalid city '{city}'. Only Indonesian cities are allowed.` (case-insensitive match against `common/cities.rs`); 409 `Conflict error: You are already a member of team '{name}'. Leave your current team first.`; 500 on insert (e.g. FK when caller has no `hackathon_users` row, if FK exists) |
| 8 | GET | `/v1/hackathon/teams/my` | H | none | `ApiSuccess([TeamResponse(my variant)])`. Active memberships, **no ORDER BY** (unspecified order). | 500 |
| 9 | PUT | `/v1/hackathon/teams/{team_id}` | H, leader | JSON all optional: `name, description, city, visibility, logo, banner` (strings). null/absent means no change (cannot clear). `updated_at` always set. | `ApiSuccess(TeamResponse full)` | 400 deadline (same text as #7); 403 `Forbidden: Only team leader can perform this action` (also when the team doesn't exist); 400 invalid city |
| 10 | DELETE | `/v1/hackathon/teams/{team_id}` | H, leader | none | `{ "message": "Team deleted successfully", "version": "0.3.0" }` | 403 not leader (also nonexistent team); 409 `Conflict error: Cannot delete team with other members. Remove all members first.` when active count > 1; 404 `Team not found` if the delete affected 0 rows. **Not deadline-gated.** Does not check for a submission. Cascade removes the leader membership, submission, messages, invitations, join requests, and winner (INFERRED). |
| 11 | POST | `/v1/hackathon/teams/{team_id}/leave` | H, member | none (no body) | `{ "message": "Left team successfully", ... }` | 400 deadline; 404 `Resource not found: You are not a member of this team`; 409 `Conflict error: Cannot leave team after project submission` (any submission row, including draft); 400 `Bad request: Team leader cannot leave team. Transfer leadership or delete the team.` |
| 12 | DELETE | `/v1/hackathon/teams/{team_id}/members/{member_id}` | H, leader | `member_id` = **user id** (not membership id) | `{ "message": "Member removed successfully", ... }` | 400 deadline; 403 not leader; 400 `Bad request: Team leader cannot remove themselves`; 409 `Conflict error: Cannot remove members after project submission`. Returns 200 even if `member_id` is not in the team. |

Route precedence: the static segments `/teams/browse` and `/teams/my` win over `/teams/{team_id}`. The TS router must register the static paths first.

### 2.3 Invitations (`invitations/*`). All routes use H.

| # | Method | Path | Auth | Request | Response 200 | Errors |
|---|---|---|---|---|---|---|
| 13 | GET | `/v1/hackathon/invitations/my` | H | none | `ApiSuccess([InvitationResponse])`: `status='pending'` and `invitee_email = caller.email` (exact case), joined to team and inviter. No ORDER BY. | 404 `User not found` (no `hackathon_users` row) |
| 14 | POST | `/v1/hackathon/invitations/{invitation_id}/respond` | H, invitee | JSON `{ "accept": boolean }` (required) | `{ "message": "Invitation accepted" }` or `{ "message": "Invitation declined" }` (+version) | 404 `Invitation not found`; 404 `User not found`; 403 `Forbidden: This invitation is not for you` (email mismatch, case-sensitive); 400 `Bad request: Invitation is no longer pending`. On accept: 400 `Bad request: Cannot join a team that has already submitted`; 409 `Conflict error: You are already a member of team '{name}'`; 400 `Bad request: Team is already full` (active ≥ 5). **Not deadline-gated.** |
| 15 | POST | `/v1/hackathon/invitations/teams/{team_id}/invite` | H, leader | JSON `{ "invitee_email": string }` (required; not validated as email, not normalized) | `ApiSuccess(InvitationResponse)` with status `pending`. `inviter_fullname` falls back to `"Unknown"`. | 400 `Bad request: Team invitations are closed (deadline: November 30, 2025).`; 404 `Team not found`; 403 `Forbidden: Only the team leader can send invitations`; 400 `Bad request: Cannot invite after submitting a project`; 400 `Bad request: Team already has the maximum of 5 members`. Duplicate pending invites, inviting self or existing members, and inviting non-registered emails are all **allowed**. |

### 2.4 Join requests (`join_requests/*`). All routes use H.

| # | Method | Path | Auth | Request | Response 200 | Errors |
|---|---|---|---|---|---|---|
| 16 | POST | `/v1/hackathon/join-requests/teams/{team_id}` | H | JSON `{ "message": string }` (required, may be empty) | `ApiSuccess(JoinRequestResponse)` (status `pending`). Re-read via `find_by_user`, so the caller must have a `hackathon_users` row; otherwise 500 `Failed to retrieve created join request`. | 400 `Bad request: Join requests are closed (deadline: November 30, 2025).`; 404 `Team not found`; 400 `Bad request: Cannot request to join a team that has already submitted`; 409 `Conflict error: You are already a member of team '{name}'`; 400 `Bad request: Team is already full (max 5 members)`; 409 `Conflict error: You already have a pending request for this team`. Private teams accept requests too. |
| 17 | GET | `/v1/hackathon/join-requests/my` | H | none | `ApiSuccess([JoinRequestResponse])`: all statuses, `ORDER BY created_at DESC` | 500 |
| 18 | GET | `/v1/hackathon/join-requests/teams/{team_id}/pending` | H, leader | none | `ApiSuccess([JoinRequestResponse])`: pending only, `ORDER BY created_at ASC` | 404 `Team not found`; 403 `Forbidden: Only the team leader can view join requests` |
| 19 | POST | `/v1/hackathon/join-requests/{request_id}/respond` | H, leader of the request's team | JSON `{ "accept": boolean }` | `{ "message": "Join request accepted" }` or `{ "message": "Join request rejected" }` | 404 `Join request not found`; 404 `Team not found`; 403 `Forbidden: Only the team leader can respond to join requests`; 400 `Bad request: Join request is no longer pending`. On accept only: 400 `Bad request: Team features are now closed` (deadline); 400 `Bad request: Cannot accept join request after submitting a project`; 409 `Conflict error: User is already a member of team '{name}'`; 400 `Bad request: Team is already full`. Reject works after the deadline. |

### 2.5 Chat (`chat/*`). All routes use H.

| # | Method | Path | Auth | Request | Response 200 | Errors |
|---|---|---|---|---|---|---|
| 20 | GET | `/v1/hackathon/chat/teams/{team_id}` | H, member | none (**no pagination**) | `ApiSuccess([MessageResponse])`: all messages `ORDER BY created_at ASC`, inner-joined to users | 403 `Forbidden: Only team members can view messages` (also nonexistent team) |
| 21 | POST | `/v1/hackathon/chat/teams/{team_id}` | H, member | JSON `{ "message": string }`. Rejected if `trim()` is empty. Stored **untrimmed**. No max length. | `ApiSuccess(MessageResponse)` (200) | 400 `Bad request: Message cannot be empty` (checked **before** membership); 403 `Forbidden: Only team members can send messages`; 404 `User not found` |
| 22 | DELETE | `/v1/hackathon/chat/messages/{message_id}` | H, author OR current leader of the message's team | none | `{ "message": "Message deleted", ... }` | 404 `Message not found`; 403 `Forbidden: You can only delete your own messages or messages as team leader`. An author who has left the team can still delete their own messages. |

### 2.6 Submissions (`submissions/*`, service `submissions/application/submission_service.rs`). All routes use H.

| # | Method | Path | Auth | Request | Response 200 | Errors |
|---|---|---|---|---|---|---|
| 23 | POST | `/v1/hackathon/submissions/teams/{team_id}` | H, leader | JSON: `project_name: string`, `description: string`, `repository_url: string` (all required, no URL/emptiness validation), `demo_url?: string`, `presentation_url?: string`, `screenshots?: string[]`. Unknown fields (e.g. frontend `video_url`) are **ignored**. | `ApiSuccess(SubmissionResponse)`, status `draft`, `submitted_by = caller` | 400 `Bad request: Submission deadline has passed (December 7, 2025 23:59 WIB).`; 403 `Forbidden: Only team leader can create submission`; 409 `Conflict error: Team already has a submission`. No minimum-member check at create. |
| 24 | GET | `/v1/hackathon/submissions/teams/{team_id}` | H, member | none | `ApiSuccess(SubmissionResponse)` | 403 `Forbidden: Only team members can view submission`; 404 `Resource not found: No submission found` |
| 25 | PUT | `/v1/hackathon/submissions/{submission_id}` | H, leader | JSON all optional: `project_name, description, repository_url, demo_url, presentation_url` (strings), `screenshots` (string[]). null/absent means unchanged (cannot clear). | `ApiSuccess(SubmissionResponse)` | 400 `Bad request: Submission deadline has passed.`; 404 `Submission not found`; 403 `Forbidden: Only team leader can update submission`; 400 `Bad request: Can only update draft submissions` |
| 26 | POST | `/v1/hackathon/submissions/{submission_id}/submit` | H, leader | none | `ApiSuccess(SubmissionResponse)`, status `pending` | 400 deadline (`Submission deadline has passed.`); 404; 403 `Only team leader can submit`; 400 `Bad request: Can only submit from draft status`; 400 `Bad request: Team must have at least 2 members to submit` |
| 27 | POST | `/v1/hackathon/submissions/{submission_id}/confirm` | H, **leader** (Swagger says admin, but it is the leader) | none | `ApiSuccess(SubmissionResponse)`, status `submitted`, `submitted_at = NOW()` | 404; 403 `Forbidden: Only team leader can confirm submission`; 400 `Bad request: Can only confirm pending submissions`. **Not deadline-gated.** |
| 28 | POST | `/v1/hackathon/submissions/{submission_id}/cancel` | H, leader | none | `ApiSuccess(SubmissionResponse)`, status `draft` | 404; 403 `Forbidden: Only team leader can cancel submission`; 400 `Bad request: Cannot cancel a confirmed submission` (when `submitted`). Works on `draft` (no-op) and `pending`. Not deadline-gated. |

### 2.7 Storage uploads (`storage/*`, `imphnen-storage/src/*`). All routes use H.

All four routes share the same JSON body. It is **not multipart**:

```json
{ "filename": "logo.png", "content_type": "image/png", "data": "<base64 or data-URL>" }
```

All fields are required strings.

| # | Method | Path | Folder |
|---|---|---|---|
| 29 | POST | `/v1/hackathon/upload` | `uploads` |
| 30 | POST | `/v1/hackathon/upload/avatar` | `avatars` |
| 31 | POST | `/v1/hackathon/upload/team` | `teams` |
| 32 | POST | `/v1/hackathon/upload/submission` | `submissions` |

Response 200: `ApiSuccess({ "url": "<folder>/<uuidv4>.<ext>" })`. **This value is the object key, not a URL**, despite the name and the Swagger examples. See 3.8 for the algorithm.
Errors, all **500** `Internal server error: ...`:
- `Failed to decode base64 data: ...`
- `File size exceeds 10MB limit`
- `Invalid JPEG file`, `Invalid PNG file`, `Invalid PDF file`, `Invalid WebP file`, `Invalid document file`
- `Unsupported file type: {ct}`
- `Failed to upload to MinIO. Status: ... Message: ...`

Bodies over 2 MB return 413 (axum default).

### 2.8 Certificates (`certificates/*`)

| # | Method | Path | Auth | Request | Response 200 | Errors |
|---|---|---|---|---|---|---|
| 33 | GET | `/v1/hackathon/certificates/{user_id}` | **none** (public; exposes email) | path uuid | `ApiSuccess({ user_id, fullname, email, avatar, team_id, team_name, is_leader, project_name, submission_status, winner_rank, winner_prize })`. Fields other than user_id, fullname, and email are nullable. `is_leader` is null when the user has no team. | 404 `User not found` |

SQL (`certificates/infrastructure/persistence/postgres_certificate_repository.rs`): `hackathon_users u LEFT JOIN hackathon_team_members tm ON tm.user_id=u.id AND tm.status='active' LEFT JOIN hackathon_teams t ON t.id=tm.team_id LEFT JOIN hackathon_project_submissions ps ON ps.team_id=t.id LEFT JOIN hackathon_winners w ON w.team_id=t.id WHERE u.id=$1 LIMIT 1`. It returns data only. **No image or PDF is generated server-side** (see 3.6). `submission_status` is returned regardless of value; there is no eligibility check.

### 2.9 Winners (`winners/*`)

| # | Method | Path | Auth | Request | Response 200 | Errors |
|---|---|---|---|---|---|---|
| 34 | GET | `/v1/hackathon/winners` | none | none | `ApiSuccess([{ id, team_id, team_name, rank: int, prize: str|null, announced_at: ts|null, created_at: ts|null }])`, `ORDER BY rank ASC`, inner join teams | 500 |

### 2.10 Admin (`admin/*`). All routes use H+A.

Query struct `PageQuery` (`admin/infrastructure/http/dto.rs`): `page: i64 = 1`, `limit: i64 = 20`, `search?: string`, `status?: string`. There is **no clamping**: `page=0` gives a negative OFFSET and a Postgres error (500), and negative `limit` also errors. `per_page` (sent by the frontend) is **ignored**.

Paged response shape:

```json
{ "data": { "data": [...], "total": int, "page": int, "limit": int }, "version": "0.3.0" }
```

`page` and `limit` echo the raw query values.

| # | Method | Path | Request | Response 200 | Errors |
|---|---|---|---|---|---|
| 35 | GET | `/v1/hackathon/admin/users` | `page, limit, search` (ILIKE `%s%` on email OR fullname) | paged `AdminUserRow { id, email, fullname, avatar, is_active, is_admin, created_at }` (bools and ts nullable), `ORDER BY created_at DESC`. Count failure is silently 0. | 500 |
| 36 | GET | `/v1/hackathon/admin/users/{user_id}` | none | `ApiSuccess(AdminUserRow)` | 404 `User not found` |
| 37 | DELETE | `/v1/hackathon/admin/users/{user_id}` | none | `{ "message": "User deleted" }` (200 even if absent) | 500 on FK violation (behaviour depends on unknown FK rules) |
| 38 | POST | `/v1/hackathon/admin/users/{user_id}/set-admin` | JSON `{ "is_admin": boolean }` | `{ "message": "User admin status updated" }` (200 even if user absent) | none. Admins can demote themselves. |
| 39 | GET | `/v1/hackathon/admin/teams` | `page, limit, search` (ILIKE on name) | paged `AdminTeamRow { id, name, city, visibility, leader_id, created_at }` | 500 |
| 40 | DELETE | `/v1/hackathon/admin/teams/{team_id}` | none | `{ "message": "Team deleted" }` (200 even if absent). No member or submission checks. Relies on cascades. | 500 |
| 41 | GET | `/v1/hackathon/admin/submissions` | `page, limit, status` (exact match). `search` is **ignored**. | paged `AdminSubmissionRow { id, team_id, project_name, status, submitted_at, created_at }` | 500 |
| 42 | GET | `/v1/hackathon/admin/winners` | none | `ApiSuccess([{ id, team_id, rank, prize, created_at }])` ordered by rank. There is no team_name here, unlike public #34. | 500 |
| 43 | POST | `/v1/hackathon/admin/winners` | JSON `{ "team_id": uuid, "rank": i32, "prize"?: string }` | `{ "message": "Winner set" }`. It upserts on `team_id` (updates rank, prize, updated_at; keeps announced_at). No validation of rank range or of the team having a submission. | 500 if team doesn't exist (FK INFERRED) |
| 44 | DELETE | `/v1/hackathon/admin/winners/{team_id}` | path = **team id** | `{ "message": "Winner removed" }` (200 even if absent) | 500 |

---

## 3. Business rules

### 3.1 Team size and membership
- **Max 5 active members**, counting the leader. The limit is checked on invite creation (`count >= 5`), invitation accept, join-request create, and join-request accept.
- **Min 2 active members** to move a submission `draft → pending` (`submit`).
- A user may be an active member of **at most one team**, enforced via `user_active_team_name` on team create, invite accept, join-request create, and join-request accept (`LIMIT 1`).
- The leader is `hackathon_teams.leader_id` and also has a member row with `role='leader'`. There is **no leadership transfer** endpoint, even though the error text suggests one.
- The leader cannot leave (400) or remove themselves (400). The leader can delete the team only when active count ≤ 1.
- **Submission lock:** once *any* submission row exists (including `draft`), the team is locked. After that, nobody can leave, invite, join, accept join requests, accept invitations, or have members removed. There is no endpoint to delete a submission, and cancel only returns it to `draft`, so the lock is permanent.
- **Deadline lock (Nov 30 2025 16:59 UTC):** after this time, team create, update, member removal, leave, invite creation, join-request create, and join-request *accept* all fail. Not gated: team delete, invitation respond (accept or reject), join-request reject, and all reads.
- Side effects on joining any team (create team, accept invite, accept join request): the joiner's other `pending` invitations (by email) and `pending` join requests are set to `rejected`.
- Member removal and leave are hard `DELETE`s. Old invitations and join requests are not touched.
- `get_members` orders by `role DESC, joined_at ASC`. Because `'member' > 'leader'` lexically, **members sort before the leader** (probably unintended; preserve for parity or fix deliberately).

### 3.2 Invitation state machine (`invitations/application/invitation_service.rs`)

```
(create by leader) → pending
pending --accept by invitee--> accepted   [+ insert member(role=member,status=active); reject other pending invites for same email; reject caller's pending join requests]
pending --decline by invitee--> rejected
pending --invitee joins another team (create/accept/join-accept)--> rejected
accepted/rejected: terminal (respond → 400 "Invitation is no longer pending")
```

The invitee is identified by `invitations.invitee_email == hackathon_users.email` (exact, case-sensitive). Invitations are not expired or cancelled when the team becomes full, submits, or is deleted (cascade INFERRED). They fail only at accept time. There is no endpoint for a leader to list or cancel sent invitations.

Accept inserts the member **without** `ON CONFLICT`, so a leftover row for the same (team,user) gives 500. This cannot normally happen because leave hard-deletes.

### 3.3 Join-request state machine (`join_requests/application/join_request_service.rs`)

```
(create by non-member) → pending      [dup pending for same team → 409]
pending --leader accepts--> accepted  [+ insert member; reject requester's pending invitations (by email) and other pending join requests]
pending --leader rejects--> rejected
pending --requester joins another team--> rejected
terminal otherwise
```

The requester cannot cancel their own request (there is no endpoint). A requester can re-request after rejection.

### 3.4 Submission state machine (`submissions/application/submission_service.rs`)

```
(create by leader, before Dec 7 deadline) → draft
draft   --update (leader, before deadline)--> draft
draft   --submit (leader, before deadline, active members >= 2)--> pending
pending --confirm (leader, NO deadline check)--> submitted (submitted_at = NOW())
draft|pending --cancel (leader, no deadline check)--> draft
submitted: terminal (cancel → 400; update/submit/confirm → 400)
```

There is one submission per team (409 on a second create). "Confirm" is a leader self-confirmation, not an admin review. The frontend calls submit and then confirm back-to-back (`packages/service/src/hooks/teams/index.ts` `useSubmitProject`). Admins cannot change submission status. They can only list.

### 3.5 Winners
- Admins upsert with `POST /admin/winners` (keyed by `team_id`) and delete with `DELETE /admin/winners/{team_id}`.
- Public `GET /winners` joins team names and orders by rank.
- There are no constraints: ranks may repeat or be arbitrary, and the team need not have a submitted project.
- No notifications or emails are sent.

### 3.6 Certificate generation
- The backend **only returns JSON data** (`GET /certificates/{user_id}`). No image or PDF library, template, font, or file output exists server-side. `Cargo.toml` has no image or PDF crates.
- Rendering is **client-side** in `apps/hackathon/src/routes/_public/certificate/$certId.tsx`: the page renders a React DOM template, rasterizes it with `html2canvas`, generates a QR code with `qrcode` pointing to `${origin}/certificate/${encodedCertId}`, and downloads the PNG `certificate-<team>.png`.
- Certificate IDs are AES-encrypted client-side (`apps/hackathon/src/utils/certificate.ts`, hard-coded key `'imphnen-hackathon-2025'`) as `teamId::submissionId::userId`, or `winner::teamId` for winner certificates. The backend never sees or validates these IDs.
- Winner certificates (`routes/_public/certificate/winner/$certId.tsx`) are assembled client-side from `useWinners`, `useTeamById`, and `useTeamSubmission`. The certificate endpoint is not used for them.

### 3.7 Chat
- **No websocket, SSE, or pub/sub.** Plain REST.
- Realtime is **client polling**: `useTeamMessages` sets `refetchInterval: 3000`, `refetchIntervalInBackground: true` (`packages/service/src/hooks/messages/index.ts`). Every poll returns the full history (no cursor or `since`), so it grows unbounded.
- Messages are persisted in `hackathon_team_messages` and hard-deleted on delete. There is no edit.
- Read and send require active membership. Delete is allowed for the author or the current team leader.

### 3.8 Storage uploads (`storage/application/storage_service.rs`, `imphnen-storage/src/service.rs`, `imphnen-storage/src/types.rs`, `imphnen-storage/src/helpers.rs`)
- Backend: MinIO/S3-compatible storage, one bucket from env `MINIO_BUCKET_NAME` (default `imphnen-uploads`). Other settings: `MINIO_ENDPOINT` (default `http://localhost:9000`), `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_REGION` (default `us-east-1`), and `MINIO_SECURE` (unused by `put_object`, which **always uses `https://{host-without-scheme}/{bucket}/{key}`**). Requests are signed with SigV4 and `UNSIGNED-PAYLOAD`.
- Key algorithm:
  1. `ext1 = filename.rsplit('.').next()`. This is the whole filename if there is no dot.
  2. `unique = "{user_id}-{now_ms}.{ext1}"`.
  3. `MinioService.upload_file` then **discards** `unique` except for its extension: `ext = lowercase(Path(unique).extension() ?? "bin")`.
  4. Key = `"{folder}/{uuid_v4}.{ext}"`. For example, `filename="Photo.PNG"` gives `teams/0b6c...-....png`, and `filename="photo"` gives `teams/<uuid>.photo`.
- Base64 decoding: if `data` contains `,`, the part after the **first** comma is used (this strips `data:...;base64,`). The standard alphabet with padding is required.
- Validation (`validate_file_type`): decoded size must be ≤ 10 MiB. Allowed `content_type` values, with magic-byte checks:

  | content_type | Magic-byte check |
  |---|---|
  | `image/jpeg`, `image/jpg` | starts with `FF D8 FF` |
  | `image/png` | 8-byte PNG signature |
  | `image/webp` | `RIFF....WEBP` |
  | `application/pdf` | starts with `%PDF` |
  | `application/msword`, docx | length ≥ 512 |

  **GIF is rejected** as `Unsupported file type`. The claimed `content_type` is trusted for the S3 `Content-Type` header, and the filename extension is not cross-checked.
- Effective size limit: the axum 2 MB JSON body limit applies, so decoded files are about 1.5 MB at most.
- There is no DB record of uploads, no dedup (`upload_file_with_deduplication` is unused), no delete endpoint, and the per-folder route has no authorization beyond login.
- **The response `url` is the object key.** Consumers must prefix a public base URL themselves. The frontend currently stores it directly as `logo`, `banner`, `avatar`, or screenshot, which is probably broken; see section 5.

### 3.9 Emails
- None. `invitation_service.rs` `do_invite` logs `tracing::warn!("Email sending is not available; invitation created for {}")`. The SMTP env exists globally but is unused here.

### 3.10 Audit
- None. There are no activity or audit tables, events, or logs beyond `tracing`. The target TS app has `@app/activity` and `shared/activity-recorder.ts`, so decide whether to add auditing.

### 3.11 City validation
- `common/cities.rs`: `INDONESIAN_CITIES` holds 500 names (provinces, cities, and regencies). `is_valid_indonesian_city` does a case-insensitive exact match. The stored value is the user's original casing. Copy the list verbatim. The frontend has its own list in `packages/service/src/constants` (compare them).

---

## 4. Frontend callers

Repo: `/Users/ms/Development/imphnen-standard`. All calls use the shared axios `api` (base `getBaseURL()`, Bearer from cookie `token`, auto-refresh on 401 via `/v1/iam/auth/refresh`) in `packages/service/src/api/index.ts`. `hackathonApi` is an alias of the same instance (`packages/service/src/api/hackathon.ts`).

"Status" legend:
- **OK**: the shapes match.
- **MISMATCH**: the call works at HTTP level but the shape differs.
- **BROKEN**: the request fails.

| # | Endpoint | Caller(s) | Status |
|---|---|---|---|
| 1 | GET /users/me | `apps/hackathon/src/routes/_authenticated.tsx:43` calls `hackathonApi.get('/users/me')`, **without the `/v1/hackathon` prefix**, so it hits `{base}/users/me` (404). The error is swallowed and it falls back to `user.location`. | BROKEN (no route at that path) |
| 2 | PUT /users/me | none (profile uses IAM `PUT /v1/iam/users/update/me`) | unused |
| 3 | GET /users/{id} | none | unused |
| 4 | GET /users/{id}/teams | `hooks/teams` `useTeamsByUserId` → `apps/hackathon/.../users/$userId.tsx` | OK (maps `item.team ?? item`) |
| 5 | GET /teams/browse | `hooks/teams` `useTeams` → `teams/browse.tsx`; `useInfiniteTeams` (unused by apps); `api/teams` `getTeams` (unused); `apps/landing/src/pages/hackathon.astro:27` (`?per_page=20`, reads `json.data.data`) | Landing OK. `useTeams` MISMATCH: it expects top-level `{data: Team[], meta:{total_data,total_page,...}}` but gets `data = {data,total,page,per_page}`, so `teams` becomes an object. `useInfiniteTeams` sends `limit` (ignored) and reads `data` as an array. `visibility` param ignored by backend. |
| 6 | GET /teams/{id} | `useTeamById`, `useTeamMembers` (reads `.members`), `apps/hackathon/src/hooks/use-team-guards.ts`, `teams/$teamId*.tsx`, winner certificate page | OK. Members' `user` object matches. |
| 7 | POST /teams | `useCreateTeam` → `teams/create.tsx` | OK |
| 8 | GET /teams/my | `useMyTeams` → navigation, sidebar, dashboard, browse, winner certificate | OK |
| 9 | PUT /teams/{id} | `useUpdateTeam` → `teams/$teamId/edit.tsx` | OK |
| 10 | DELETE /teams/{id} | `useDeleteTeam` → `teams/$teamId.tsx` | OK |
| 11 | POST /teams/{id}/leave | `useLeaveTeam` → `teams/$teamId.tsx` | OK |
| 12 | DELETE /teams/{id}/members/{uid} | `useRemoveMember`, `useManageMember` → `teams/$teamId/members.tsx` | OK |
| 13 | GET /invitations/my | `useMyInvitations` → `dashboard.tsx` | MISMATCH: UI reads `invitation.team?.name` and `invitation.inviter?.fullname`, but the backend sends flat `team_name` and `inviter_fullname`. The UI shows "Unnamed Team" and "Unknown User". |
| 14 | POST /invitations/{id}/respond | `useRespondToInvitation` → `dashboard.tsx`; `api/teams.respondToInvitation` | **BROKEN**: it sends `{action:'accept'|'reject'}` but the backend requires `{accept: bool}`, so the response is **422**. |
| 15 | POST /invitations/teams/{id}/invite | `useInviteMember` (sends `{invitee_email: data.email}`) → `teams/$teamId.tsx`, `members.tsx` | OK. `api/teams.inviteMember` sends `{email}` (would be 422, but it is unused). |
| 16 | POST /join-requests/teams/{id} | `useJoinTeam` → `teams/browse.tsx` | OK |
| 17 | GET /join-requests/my | none | unused |
| 18 | GET /join-requests/teams/{id}/pending | `useTeamJoinRequests` → `teams/$teamId.tsx`, `members.tsx` | MISMATCH: UI reads `request.user.fullname` and `request.user.avatar`, but the backend sends flat `user_fullname` and `user_avatar`. `request.user` is undefined, which risks a crash. |
| 19 | POST /join-requests/{id}/respond | `useRespondToJoinRequest` → `teams/$teamId.tsx`, `members.tsx` | **BROKEN**: it sends `{action}` instead of `{accept}`, so the response is 422. |
| 20 | GET /chat/teams/{id} | `useTeamMessages` (3 s polling) → `teams/$teamId/chat.tsx` | MISMATCH: UI reads `msg.user.fullname` and `msg.user.avatar`, but the backend sends flat `user_fullname` and `user_avatar`. |
| 21 | POST /chat/teams/{id} | `useSendMessage` | OK |
| 22 | DELETE /chat/messages/{id} | `useDeleteMessage` | OK |
| 23-25 | POST, GET, PUT submissions | `useSubmitProject`: GET, then PUT if it exists or POST on any error, then submit, then confirm. Also `useTeamSubmission` → `submission.tsx`, `submit.tsx`, `use-team-guards.ts` | OK at HTTP level. The UI checks status `'pending_verification'`, which is never produced, and the frontend `video_url` is silently dropped. |
| 26 | POST /submissions/{id}/submit | `useSubmitProject` | OK |
| 27 | POST /submissions/{id}/confirm | `useSubmitProject` | OK |
| 28 | POST /submissions/{id}/cancel | none | unused |
| 29-32 | POST /upload[/avatar\|/team\|/submission] | `api/upload` `multipartPost` via `hooks/upload` `useUploadFile` (calls `/upload/team`), `useUploadAvatar`, `useUploadTeamFile`, and `useUploadSubmission` → `teams/create.tsx`, `teams/$teamId/edit.tsx`, `teams/$teamId/submit.tsx`, `onboarding/user.tsx`, `_components/profile-modal.tsx` | **BROKEN**: the frontend sends **multipart/form-data** (`file` field) and the backend expects JSON base64, so the response is **415**. The frontend also allows GIF (rejected by the backend) and expects `url` to be a URL, but the backend returns a key. |
| 33 | GET /certificates/{user_id} | `hooks/users` `useCertificatePublicData` → `routes/_public/certificate/$certId.tsx` | MISMATCH: the frontend expects nested `{user:{...}, team:{id,name,logo,is_leader}, submission:{id,title,...}, winner:{rank,prize}}`, but the backend is flat. |
| 34 | GET /winners | `hooks/winners` `useWinners` → `dashboard.tsx`, `routes/_public/winners.tsx`, winner certificate; `apps/landing/src/pages/hackathon.astro:28` | MISMATCH: UI reads `winner.team.name`, `winner.team.logo`, and `winner.team.city`, but the backend sends only `team_name`. The winners page would crash on `winner.team.logo`. |
| 35 | GET /admin/users | `api/admin` `getAdminUsers` → `apps/backoffice/src/routes/_authenticated/hackathon-users.tsx`, `hackathon-dashboard.tsx` | MISMATCH: it sends `per_page` (ignored; backend uses `limit`) and `is_admin` (ignored), and expects `{data:[], meta:{total_data,total_page}}` while the backend sends `{data:{data,total,page,limit}}`. Access also requires `hackathon_users.is_admin`, not the backoffice IAM role. |
| 36 | GET /admin/users/{id} | `getAdminUserById`, not used by apps | unused |
| 37 | DELETE /admin/users/{id} | `deleteAdminUser`, not used | unused |
| 38 | POST /admin/users/{id}/set-admin | `setAdminUser`, not used | unused |
| 39 | GET /admin/teams | `getAdminTeams` → `hackathon-teams.tsx`, `hackathon-dashboard.tsx` | MISMATCH (same as #35). Frontend type expects description, logo, and more, which are not returned. |
| 40 | DELETE /admin/teams/{id} | `deleteAdminTeam`, not used | unused |
| 41 | GET /admin/submissions | `getAdminSubmissions` → `hackathon-submissions.tsx`, `hackathon-dashboard.tsx` | MISMATCH (same as #35). `search` is ignored and the frontend type expects full submission fields. |
| 42-44 | admin winners GET, POST, DELETE | `getAdminWinners`, `setWinner`, `removeWinner`, not used by any app | unused |

Frontend calls with **no matching backend route**:
- `GET /users/me` (no prefix) from `apps/hackathon/src/routes/_authenticated.tsx:43`. The intended target is `/v1/hackathon/users/me`.
- Multipart uploads to `/v1/hackathon/upload*`. The route exists, but the multipart contract does not.
- `packages/service/src/api/upload` `uploadService.*` → `/v1/iam/users/upload` (IAM domain, out of scope).
- `apps/landing/src/pages/daftar-hackathon.astro` makes no API call. It is a meta-refresh redirect to a Google Form.
- There are no frontend calls for leadership transfer, withdrawing a join request, cancelling an invitation, deleting a submission, or editing a chat message. None of these exist in the backend either.

---

## 5. Open questions, oddities, and bugs

1. **Who creates `hackathon_users` rows?** No code inserts them after commit `2ae43b3` ("centralize auth", which removed Supabase/GitHub signup). A new IAM user gets 404 on `/users/me` and cannot receive invitations (email lookup). Creating a team may 500 if an FK exists, and a join-request create 500s after inserting (`Failed to retrieve created join request`). Decide: lazily upsert a `hackathon_users` row from IAM `users` on first authenticated hackathon request, or merge the profile columns into the IAM user table.
2. **Relationship with IAM users table.** Duplicate email, fullname, and avatar can diverge. The IAM `/v1/iam/users/me` reads `hackathon_users` by IAM id.
3. **No DDL.** All FKs, cascades, uniques (except `email`, `(team_id,user_id)`, and winners `team_id`), and defaults are INFERRED. Before porting, dump the production schema with `pg_dump -s -t 'hackathon_*'`.
4. **Deadlines passed.** All team and submission mutations are currently closed (Nov 30 and Dec 7, 2025). Confirm whether the TS port targets a new hackathon edition. If so, make deadlines configurable per event. There is no `hackathons`/`events` table, so the system is single-event.
5. **Upload contract mismatch.** The frontend sends multipart and the backend expects JSON base64, so every upload currently fails (415). The backend also returns a key, not a URL. GIF is allowed client-side but rejected server-side. The 2 MB axum limit conflicts with the 5 MB frontend limit and the 10 MB storage limit. `MINIO_SECURE` is ignored (always https). Base64 and validation errors return 500 instead of 400.
6. **Respond endpoints broken.** The frontend sends `{action}` and the backend wants `{accept}`, so invitation and join-request responses are 422 today.
7. **Response shape mismatches** for chat, join requests, invitations, winners, certificates (flat vs nested), browse (nested `data.data` vs `data`+`meta`), and admin lists (`limit` vs `per_page`, nested vs `meta`). Decide whether the port preserves the Rust shapes (the landing page relies on `data.data`) or adopts what the frontend expects.
8. **Admin authorization.** `admin_only` uses `hackathon_users.is_admin`, not IAM roles or permissions. Backoffice admins without that flag get 403. There is no hackathon permission in `imphnen-entities/src/permissions`. Decide whether to map to IAM permissions in the port.
9. **`users/{id}/teams` 500** if any team has `description IS NULL`. The row struct uses non-Option `String` (`users/infrastructure/persistence/postgres_user_repository.rs`, `get_user_teams`).
10. **PUT /users/me 500** (not 404) for a user without a row when the body is non-empty.
11. **Privacy.** Public `GET /teams/{id}` returns every member's email and phone, including for private teams. Public `GET /certificates/{user_id}` returns email. `GET /users/{id}` returns email and phone to any logged-in user.
12. **Private teams** are hidden from browse only. They are fully readable by id and joinable via join request.
13. **Submission lock via draft.** Any submission row, including a draft or a cancelled-to-draft row, locks team membership permanently. There is no delete-submission endpoint.
14. **"Confirm" is leader self-confirmation.** Swagger says admin, and Swagger examples show `confirmed` and `cancelled` statuses that never exist. The frontend checks `pending_verification`, which never exists. Confirm and cancel are not deadline-gated, so a team with a `pending` submission can still confirm after the deadline.
15. **Inconsistent deadline gating.** Invitation accept is not gated, but join-request accept is. Team delete is not gated.
16. **Case-sensitive emails** for invitations. Old signup stored lowercased email, but invite input is not normalized.
17. **No duplicate-invite protection.** Leaders can invite themselves, existing members, or the same email repeatedly.
18. **Race conditions / no transactions.** The 5-member cap and one-team-per-user rule can be violated concurrently. The multi-step writes are non-atomic; for example, a member can be inserted while rejection of other invites fails.
19. **Member ordering bug.** `ORDER BY tm.role DESC` puts `member` before `leader`.
20. **Browse quirks.** Filtering by min or max members excludes 0-member teams. `search` doesn't escape `%`/`_`. A count-query failure silently returns `total: 0`. `city` is case-sensitive here but city validation is case-insensitive.
21. **Admin lists.** There is no page or limit validation (page 0 or negative gives 500) and no max limit. Admin submissions ignores `search`. Admin delete, set-admin, and remove-winner return 200 for nonexistent ids.
22. **Admin delete user/team** depends on unknown FK cascade rules. For example, deleting a user who leads a team: `hackathon_teams.leader_id` FK may block (500) or cascade-delete the team.
23. **Certificate query** uses `LIMIT 1` over multiple LEFT JOINs with no ORDER BY, so it is non-deterministic if data is inconsistent. There is no eligibility gating: any user id yields data.
24. **Chat full-history polling** every 3 s with no pagination has scalability risk.
25. **401s are plain text.** The frontend reads `error.response.data.message`, which is undefined for them, but still refreshes on 401 status, so this is fine. In the port, JSON `{message,version}` would be harmless.
26. **Unknown-route auth ordering.** Each sub-router uses `.layer(...)`, not `.route_layer(...)`, so unauthenticated requests to some unknown `/v1/hackathon/*` paths may return 401 rather than 404. This is a minor parity note.
27. **Frontend target runtime.** The TS `apps/api` is Cloudflare Workers + D1 (SQLite) + R2 with a 1 MiB default body limit (`apps/api/src/platform/http/mount-body-limit.ts`). Postgres-specific features used here are `text[]` (skills, screenshots), `ILIKE`, `timestamptz`, `EXISTS`, and `ON CONFLICT`. SQLite needs JSON arrays for the `text[]` columns and `LIKE ... COLLATE NOCASE` for `ILIKE`. Uploads should move to multipart with R2 `publicUrlOf`.
