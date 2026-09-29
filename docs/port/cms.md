# Porting spec: CMS domain (events, testimonials, roadmap, QR)

Source: `imphnen-backend-service/imphnen-cms` (Rust, axum 0.8, SeaORM 1.1.19, sqlx), crate version `0.3.0`.
Target: TypeScript rewrite. This document is meant to be sufficient on its own. Every non-obvious claim cites a Rust file, with paths relative to `imphnen-backend-service/`.

Scope covered:

- `imphnen-cms/src/events`, `imphnen-cms/src/testimonials`, `imphnen-cms/src/roadmap`: mounted under `/v1/landing/cms`.
- `imphnen-cms/src/qr/{users,campaigns,middleware}`: mounted under `/v1/qr`.
- `imphnen-cms/src/v2`: contains only `.gitkeep`, so there is no code and there are no routes.
- `/v1/cms/*`, `/v1/cms/landing`, `/v1/cms/admin`: **no routes exist at these paths.** They appear only as string prefixes in unused or ineffective middleware (see 3.6), and as paths in a stale, unused frontend type file (see 4.3).

---

## 0. Cross-cutting behaviour (applies to every endpoint below)

### 0.1 Mounting (`imphnen-gateway/src/lib.rs`)

```
Router
  .nest("/v1/landing/cms", cms_routes)       // events + testimonials + roadmap
  .nest("/v1/qr", qr_router(db))              // qr users + qr campaigns
  .layer(cors_middleware())
  .layer(from_fn(security_headers_middleware))
  .layer(Extension(AppState))
```

`cms_routes` = public routers (events, testimonials, roadmap) merged with a protected router. The protected router (create/update/delete of all three) is wrapped in `auth_middleware`. The QR routers are **not** wrapped in `auth_middleware`. Each QR sub-router applies its own `qr_auth_middleware` instead (see 0.5).

Axum `.layer()` applies only to matched routes. Unknown paths return a bare `404` (empty body) without any auth check. A known path with the wrong method returns a bare `405` (empty body).

### 0.2 Response envelopes (`imphnen-utils/src/response_format.rs`, `imphnen-utils/src/errors.rs`)

`version` is always the literal string `"0.3.0"`. It comes from `env!("CARGO_PKG_VERSION")` of `imphnen-utils` or `imphnen-libs`, and both are 0.3.0.

| Name | Status | JSON body |
|---|---|---|
| `ApiSuccess(x)` | 200 | `{"data": x, "version": "0.3.0"}` |
| `ApiCreated(x)` | 201 | `{"data": x, "version": "0.3.0"}` |
| `ApiPaginated(p)` | 200 | `{"data": [...], "meta": Meta, "version": "0.3.0"}` |
| `ApiMessage::ok(m)` / `created(m)` / `new(s,m)` | 200 / 201 / s | `{"message": m, "version": "0.3.0"}` |
| `AppError` | see table below | `{"message": "<Prefix>: <msg>", "version": "0.3.0"}` |

`AppError` variants map to status codes and message prefixes as follows. The message is `Display`, which is always `"<prefix>: <inner>"`.

| Variant | Status | Prefix |
|---|---|---|
| ValidationError | 400 | `Validation error` |
| AuthenticationError | 401 | `Authentication failed` |
| AuthorizationError | 403 | `Authorization failed` |
| ForbiddenError | 403 | `Forbidden` |
| NotFoundError | 404 | `Resource not found` |
| BadRequestError | 400 | `Bad request` |
| InternalServerError | 500 | `Internal server error` |

Example: `{"message":"Resource not found: Event not found","version":"0.3.0"}`.

Some handlers catch an `AppError` and re-wrap it with `ApiMessage::new(<fixed status>, e.to_string())`. The message then keeps the prefix but the status is overridden. Each endpoint below notes where this happens.

`Meta` (`paginator-utils 0.2.2`, `PaginatorResponseMeta::new(page, per_page, total)`):

```json
{"page": 1, "per_page": 20, "total": 3, "total_pages": 1, "has_next": false, "has_prev": false}
```

- `total_pages = ceil(total / per_page)`, computed in f32. It is 0 when total is 0.
- `has_next = page < total_pages`.
- `has_prev = page > 1`.
- `next_cursor` and `prev_cursor` are omitted, because they are None and `skip_serializing_if`.

### 0.3 Pagination query (`paginator-axum 0.2.2`, `src/query.rs`) — used by the 3 CMS list endpoints

| Query param | Type | Default | Behaviour |
|---|---|---|---|
| `page` | u32 | 1 | `max(1)` |
| `per_page` | u32 | 20 | `clamp(1, 100)` |
| `sort_by` | string? | none | Each repo accepts only specific values (see the endpoints). Anything else falls back to `created_at`. |
| `sort_direction` | string? | none | Case-insensitive `asc` or `desc`. Any other value is treated as None. **Note:** the OpenAPI docs and the frontend call this `order`. `order` is ignored. |
| `search` | string? | none | **Only takes effect if `search_fields` is also present and non-empty.** Otherwise it is dropped (`search = None`). The content of `search_fields` is otherwise irrelevant, because each repo decides which column to search. |
| `search_fields` | string? | none | Comma list. It only needs to be non-empty. |
| `filter` | `Vec<String>` | [] | Parsed but ignored by every CMS repo. INFERRED: `serde_urlencoded` cannot deserialize a `Vec<String>`, so sending `filter=...` probably causes a 400. |

A malformed query, for example `page=abc` or `page=-1`, returns **400 with a `text/plain` body** `Invalid query params: <serde error>`. This body is not JSON.

### 0.4 CMS auth (`imphnen-middleware/src/auth_middleware/mod.rs`, `imphnen-iam/src/permissions_guard.rs`, `imphnen-iam/src/permission_macros.rs`)

JWT is HS256, using the access secret `ENV.access_token_secret` and `jsonwebtoken::Validation::default()`, so `exp` is checked. The claims are `{exp, iat, sub, user_id}`. `sub` is the user's email as typed at login. `user_id` is the `app_users.id` UUID string (`imphnen-libs/src/jsonwebtoken/mod.rs`, `imphnen-iam/src/auth/application/mod.rs:78`).

Protected CMS routes go through two layers.

1. **`auth_middleware`** (router layer). Every failure returns 401 JSON via `ApiMessage`, with no prefix:
   - No `Authorization: Bearer <t>` header returns `"Invalid or missing authorization token"`.
   - A token that fails to decode returns `"Invalid or expired token"`.
   - A `user_id` claim that is not a UUID returns `"Invalid user identifier format"`.
   - If `app_users` has no row with `id = user_id`, the response is `"User not found or inactive"`. Despite the message, `is_active` and `deleted_at` are **not** checked.
2. **Handler extractors run next.** For example, `ValidatedJson` can return 400 before any permission check.
3. **`require_permissions!` / `require_auth!`**, inside the handler, calls `permissions_guard`:
   - It re-decodes the token. Failure returns 401 `"Authentication failed: Invalid or missing authorization token"` or `"Authentication failed: Invalid or expired token"`.
   - It loads the user by `email = claims.sub`. If that fails, it parses `sub` as a UUID and loads by id. If that also fails, it returns 401 `"Authentication failed: User not found"`, or `"Authentication failed: Invalid user ID format"` when `sub` is not a UUID.
   - It collects the user's permissions from `app_roles.permissions`, a JSON array of strings for the user's role (`imphnen-libs/src/services/dto.rs`). Each string counts as both a name and an id.
   - **Admin bypass:** a user passes when the set contains `"Administrator"` or `"d6e7f8a9-0123-4567-8901-6789012345ab"`.
   - Otherwise every required permission must be present by display name or by fixed id. On failure it returns 403 `"Forbidden: You don't have the required permissions"`.
   - `require_auth!` passes an empty required list, so any valid user passes.

The only permission used in this domain is **`Administrator`** (`PermissionsEnum::Administrator`). Its display string is `"Administrator"` and its id is `d6e7f8a9-0123-4567-8901-6789012345ab` (`imphnen-entities/src/permissions/definitions.rs:106`, `mappings.rs:134`). The QR domain does not use IAM permissions at all.

### 0.5 QR auth (`imphnen-cms/src/qr/middleware/qr_auth.rs`) — applied to every `/v1/qr/*` route

Every failure returns 401 with a **`text/plain`** body (a `(StatusCode, &str)` tuple, not JSON):

1. No `Authorization` header returns `Missing Authorization header`.
2. A header that does not start with `"Bearer "` (case-sensitive, one space) returns `Invalid Authorization header format`.
3. A token that fails `decode_access_token` (same secret as IAM) returns `Invalid or expired token`.
4. A `claims.user_id` that is not a UUID returns `Invalid user ID in token`.
5. **Side effect (auto-provision):** the middleware runs the SQL below and ignores any error.

   ```sql
   INSERT INTO qr_users (id, email, name, role, provider)
   VALUES ($user_id, $sub, $sub, 'user', 'external')
   ON CONFLICT (id) DO NOTHING
   ```

   Both `email` and `name` are set to the JWT `sub`, which is the email.
6. It runs `SELECT role FROM qr_users WHERE id = $user_id`. On any error or a missing row, `role` defaults to `"user"`.
7. It injects `QrAuthUser { user_id: Uuid, role: String }`.

The middleware does not check that the user exists in `app_users`. "Admin" means exactly `role == "admin"` (a case-sensitive string compare in each handler). A non-admin gets 403 JSON `{"message":"Forbidden: Admin access required","version":"0.3.0"}`.

QR handlers use plain axum extractors, not `ValidatedJson`. Their rejections are **`text/plain`**:

- `Json<T>` without `Content-Type: application/json` returns 415.
- Malformed JSON returns 400.
- A missing field or wrong type returns 422.
- `Path<Uuid>` with a non-UUID value returns 400 `Invalid URL: Cannot parse ...`.

Extractors run **before** the admin check, so a non-admin sending a bad body gets 4xx from the extractor, not 403.

### 0.6 `ValidatedJson` (CMS create/update bodies) (`imphnen-libs/src/axum/validated_json.rs`)

Every failure returns 400 JSON `{"message": ..., "version":"0.3.0"}`:

- A body that cannot be read returns `"Failed to read body: <e>"`.
- A body that is not JSON returns `"Invalid JSON: <serde err>"`. Content-Type is **not** required.
- Schema validation failure returns `"Validation error: <e>"`. For events and roadmap, `<e>` is a serde_json error, for example `missing field \`name\``. For testimonials it is a zod-rs error string.

Unknown fields are ignored.

### 0.7 Timestamp serialization — IMPORTANT for byte-compatible output

- **CMS DTOs (events, testimonials, roadmap)** format times with chrono `to_rfc3339()` on a UTC time. The output looks like `2025-09-20T13:00:00+00:00`, **with `+00:00`, not `Z`**. Fractional seconds are printed only when non-zero, as 3, 6 or 9 digits (chrono `SecondsFormat::AutoSi`), for example `2025-09-20T13:00:00.123456+00:00`. Postgres timestamptz has microsecond precision, so expect either 0 or 6 digits (3 when the micros are a multiple of 1000).
- **QR entities** are serialized through serde's chrono impl. The output looks like `2025-01-01T00:00:00Z` or `2025-01-01T00:00:00.123456Z`, **with a `Z`**. The same AutoSi fraction rule applies. UUIDs are lowercase hyphenated.
- `price` (f64) serializes as a JSON float. serde_json writes `150.0`; JS writes `150`. The two are numerically equal.

### 0.8 CORS (`imphnen-middleware/src/cors_middleware/mod.rs`)

The allowed methods are GET, POST, PUT, DELETE and OPTIONS. **PATCH is not allowed.** The allowed headers are Authorization and Content-Type. Credentials are allowed. Origins come from `ENV.cors_allowed_origins`. See 5.1 for the consequence.

---

## 1. Tables

### 1.0 Provenance of DDL

- `events` and `testimonials` are created by `imphnen-backend/src/bin/create_schema.rs` using SeaORM `Schema::create_table_from_entity`. This drops and re-creates each table with CASCADE.
- **`roadmap_items` is NOT in `create_schema.rs`.** There is no DDL for it anywhere in the repo. The shape below comes from the SeaORM entity.
- **`qr_users` and `qr_campaigns` have no DDL and no SeaORM entity.** Their columns are INFERRED from the raw sqlx queries, `FromRow` structs and INSERT/UPDATE column lists.
- **SeaORM attribute caveat:** the entity files use `#[sea_orm(default = "...")]` and `#[sea_orm(not_null)]`. sea-orm-macros 1.1.19 only recognizes `default_value` / `default_expr` / `nullable` / `unique` / `indexed` (`sea-orm-macros-1.1.19/src/derives/entity_model.rs:129-210`). `default` and `not_null` are **silently ignored**. As a result, tables created by `create_schema.rs` have **no DB-level defaults**, and nullability comes only from the Rust type (non-`Option` means NOT NULL). The app always sets every column explicitly. In the port, add the defaults listed as "intended" below.
- SeaORM type mapping: `String` maps to `varchar` (no length), `f64` to `double precision`, `bool` to `boolean`, `DateTime<Utc>` to `timestamp with time zone`, `Uuid` to `uuid`, and `i32` to `integer`.

### 1.1 `events` (`imphnen-entities/src/seaorm/common/events.rs`)

| Column | PG type | Null | Default (intended; not in DB) | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK. App sets `uuid v4`. |
| name | varchar | NOT NULL | – | Searchable (LIKE) and sortable. |
| description | varchar | NOT NULL | – | |
| detail_link | varchar | NOT NULL | – | No URL validation. |
| price | double precision | NOT NULL | – | |
| is_online | boolean | NOT NULL | false | |
| is_deleted | boolean | NOT NULL | false | Soft-delete flag. |
| location | varchar | NULL | – | |
| start_date | timestamptz | NOT NULL | – | |
| end_date | timestamptz | NOT NULL | – | No check that end ≥ start. |
| created_at | timestamptz | NOT NULL | now() | App sets `Utc::now()`. |
| updated_at | timestamptz | NOT NULL | now() | App sets `Utc::now()`. |

There are no indexes, unique constraints or FKs besides the PK.

### 1.2 `testimonials` (`imphnen-entities/src/seaorm/common/testimonials.rs`)

| Column | PG type | Null | Default (intended) | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| user_id | uuid | NOT NULL | – | **FK → `app_users.id`, ON UPDATE NO ACTION, ON DELETE NO ACTION.** `create_table_from_entity` emits belongs_to relations as FKs. |
| role | varchar | NOT NULL | – | The author's job title (free text), not an RBAC role. |
| content | varchar | NOT NULL | – | |
| is_deleted | boolean | NOT NULL | false | |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NOT NULL | now() | |

### 1.3 `roadmap_items` (`imphnen-entities/src/seaorm/common/roadmap_items.rs`) — no DDL in repo

| Column | PG type | Null | Default (intended) | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| title | varchar (INFERRED) | NOT NULL | – | Searchable and sortable. |
| description | varchar (INFERRED) | NOT NULL | – | |
| status | varchar (INFERRED) | NOT NULL | `'upcoming'` | **Not validated by the backend.** The frontend uses `upcoming` / `in_progress` / `completed`. |
| votes | integer | NOT NULL | 0 | |
| is_deleted | boolean | NOT NULL | false | |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NOT NULL | now() | |

### 1.4 `qr_users` — ALL INFERRED (no DDL in the repo; from `qr/users/infrastructure/persistence/postgres_user_repository.rs` and `qr/middleware/qr_auth.rs`)

| Column | PG type (INFERRED) | Null (INFERRED) | Default (INFERRED) | Evidence |
|---|---|---|---|---|
| id | uuid | NOT NULL | – | PK or unique. `ON CONFLICT (id)` requires a unique index. The value always equals `app_users.id`, taken from the JWT `user_id`, but no FK is known. |
| email | text/varchar | NOT NULL | – | `String` in FromRow. The middleware inserts JWT `sub`. |
| name | text/varchar | NOT NULL | – | `String`. The middleware inserts JWT `sub`, which is the email. |
| role | text/varchar | NOT NULL | probably `'user'` | Values seen: `'user'` and `'admin'`. It is free-form, because the admin endpoint accepts any string. |
| provider | text/varchar | NOT NULL | – | Values seen: `'external'` (auto-provision) and `'google'` (OpenAPI example, from a legacy QR service). |
| created_at | timestamptz | NULL | probably now() | `Option<DateTime<Utc>>`. INSERT omits it, so a DB default must exist or the value stays null. |
| updated_at | timestamptz | NULL | probably now() | Same as created_at. Set to `NOW()` on UPDATE. |

The table may carry extra legacy columns, for example a password hash from the old `api-qr` service. Any such column must be nullable or have a default, because the INSERT lists only five columns. The IAM crate also reads this table: `imphnen-iam/src/users/infrastructure/http/handlers/get_handlers.rs:199` runs `SELECT role, provider FROM qr_users WHERE id=$1`.

### 1.5 `qr_campaigns` — ALL INFERRED (no DDL; from `qr/campaigns/infrastructure/persistence/postgres_campaign_repository.rs`)

| Column | PG type (INFERRED) | Null (INFERRED) | Default (INFERRED) | Evidence |
|---|---|---|---|---|
| id | uuid | NOT NULL | – | PK. App sets `uuid v4`. |
| name | text/varchar | NOT NULL | – | |
| url | text/varchar | NOT NULL | – | The payload encoded in the QR. |
| qr_code_data | bytea | NOT NULL | – | PNG bytes. Read as a non-optional `Vec<u8>`. |
| is_active | boolean | NOT NULL | – | At most one row should be true. The app enforces this in a transaction, not by a constraint. |
| created_by | uuid | NOT NULL | – | The creating user's id (`qr_users.id` / `app_users.id`). An FK is unknown. |
| expires_at | timestamptz | NOT NULL | – | The app sets `NOW() + INTERVAL '30 days'`. **Never enforced.** |
| created_at | timestamptz | NULL | probably now() | `Option`. Omitted in the INSERT. |
| updated_at | timestamptz | NULL | probably now() | `Option`. Set to `NOW()` on updates. |

### 1.6 Tables referenced but owned by other domains

- `app_users`: `id` uuid PK, `email` unique, `first_name`/`last_name` nullable, `role_id` → `app_roles.id`, `is_active`, `deleted_at`, and so on (`imphnen-entities/src/seaorm/auth/users.rs`). It is used for testimonial author names and for auth.
- `app_roles`: `permissions` jsonb, an array of permission names or ids. It is used by `permissions_guard`.
- `audit_logs` and `rate_limits` exist, but this domain never writes them (see 3.6).

---

## 2. Endpoints

There are 26 routes: events 5, testimonials 5, roadmap 6, qr users 5, qr campaigns 5.

For "Auth", *auth_mw* means the `auth_middleware` in 0.4, *qr_mw* means the `qr_auth_middleware` in 0.5, and *none* means public.

### 2.1 Events (`imphnen-cms/src/events/infrastructure/http/{routes,handlers,dto}.rs`)

#### Shapes

`EventListItem`:

```json
{"id":"uuid","name":"str","description":"str","detail_link":"str","price":150.0,
 "is_online":false,"start_date":"rfc3339(+00:00)","end_date":"...","created_at":"...",
 "location":"str|null","is_deleted":false}
```

`EventDetailItem` has the same fields, minus `is_deleted`, plus `"updated_at"`. Its field order is `id, name, description, detail_link, price, is_online, start_date, end_date, created_at, updated_at, location`.

`EventWriteBody` (create and update are identical, deserialized with plain serde, with no extra rules):

| Field | Type | Required | Rule |
|---|---|---|---|
| name | string | yes | Any string, including an empty one. |
| description | string | yes | |
| detail_link | string | yes | |
| price | number | yes | JSON number. A string returns 400. |
| start_date | string | yes | **RFC 3339 with offset**, for example `2025-09-20T13:00:00Z`. `2025-09-20` returns 400. |
| end_date | string | yes | Same as start_date. |
| location | string \| null | no | Missing is treated as null. |
| is_online | boolean | yes | |

#### Routes

| # | Method & path | Auth | Permission | Request | Success | Errors |
|---|---|---|---|---|---|---|
| E1 | `GET /v1/landing/cms/events` | none | – | Query: pagination (0.3). `sort_by`: `name` (default direction **ASC**, DESC if `sort_direction=desc`); anything else sorts by `created_at` (default **DESC**, ASC if `sort_direction=asc`). Search (needs `search_fields`): `name LIKE '%q%'`, which is **case-sensitive**. Always filters `is_deleted = false`. | 200 `ApiPaginated<EventListItem>` | Query parse failure: 400 text/plain. Any service or DB error: **400** JSON (overridden). |
| E2 | `GET /v1/landing/cms/events/detail/{id}` | none | – | Path `id`: string | 200 `ApiSuccess<EventDetailItem>` | Invalid UUID: 400 `"Invalid UUID: <uuid err>"` (no prefix). Not found or soft-deleted: **404** `"Resource not found: Event not found"`. **Any other error (including DB) is also 404.** |
| E3 | `POST /v1/landing/cms/events/create` | auth_mw | `Administrator` | Body: `EventWriteBody` | **201** `{"message":"Event created","version":"0.3.0"}`. **No `data`.** | 401 (0.4); 400 body (0.6); 403; 500 on insert error |
| E4 | `PATCH /v1/landing/cms/events/update/{id}` | auth_mw | `Administrator` | Path `id`; body: `EventWriteBody`. This is a full replace of name, description, detail_link, price, is_online, location, start_date and end_date. | 200 `{"message":"Event updated",...}` | 401; 400 body; 403; 400 `"Bad request: Invalid UUID: ..."`; 404 `"Resource not found: Event not found"` (also when soft-deleted); 500 |
| E5 | `DELETE /v1/landing/cms/events/delete/{id}` | auth_mw | `Administrator` | Path `id` | 200 `{"message":"Event deleted",...}` | 401; 403; 400 bad UUID; 404 if the id does not exist. **An already soft-deleted row returns 200 again.** 500 |

Delete is a soft delete: it sets `is_deleted = true` and `updated_at = now()`. Update sets `updated_at = now()` and never touches `is_deleted` or `created_at`.

### 2.2 Testimonials (`imphnen-cms/src/testimonials/infrastructure/http/{routes,handlers,dto}.rs`)

#### Shapes

`TestimonialListItem`:

```json
{"id":"uuid","user_id":"uuid","user_fullname":"str","role":"str","content":"str","created_at":"rfc3339(+00:00)","is_deleted":false}
```

`TestimonialDetailItem`:

```json
{"id","user_id","user_fullname","role","content","created_at","updated_at"}
```

`user_fullname` is `trim(coalesce(first_name,'') + ' ' + coalesce(last_name,''))`, taken from `app_users` at read time. It may be `""`.

`TestimonialWriteBody` (zod-rs 0.4 validation; create and update are identical):

| Field | Type | Rule |
|---|---|---|
| role | string | Length between 1 and 100 **bytes** (UTF-8 `len()`, not chars) |
| content | string | Length between 1 and 1000 **bytes** |

#### Routes

| # | Method & path | Auth | Permission | Request | Success | Errors |
|---|---|---|---|---|---|---|
| T1 | `GET /v1/landing/cms/testimonials` | none | – | Query: pagination. `sort_by`: `updated_at` (default DESC, ASC with `asc`); anything else sorts by `created_at` (default DESC). **The search param is ignored entirely.** Query: `testimonials LEFT JOIN app_users ON user_id`, where `is_deleted = false`. | 200 `ApiPaginated<TestimonialListItem>` | 400 text/plain on bad query. Service error: **400** JSON. |
| T2 | `GET /v1/landing/cms/testimonials/detail/{id}` | none | – | Path `id` | 200 `ApiSuccess<TestimonialDetailItem>` | 400 `"Invalid UUID: ..."`; 404 `"Resource not found: Testimonial not found"`; 404 `"Resource not found: User not found for testimonial"` when the author row is missing; any other error 404 |
| T3 | `POST /v1/landing/cms/testimonials/create` | auth_mw | *(authenticated only; any user)* | Body: `TestimonialWriteBody` | **201** `ApiCreated<TestimonialDetailItem>` | 401 (0.4); 400 zod; 401 `"Authentication failed: Token tidak valid"` if the email cannot be extracted; 404 `"Resource not found: User not found"` if no `app_users` row has `email = sub`; 400 bad user id; 500 |
| T4 | `PATCH /v1/landing/cms/testimonials/update/{id}` | auth_mw | *(authenticated only)* **No ownership check.** | Path `id`; body: `TestimonialWriteBody`. Replaces `role` and `content`. | 200 `{"message":"Testimonial updated",...}` | 401; 400 zod; 400 bad UUID; 404 `Testimonial not found` (also when soft-deleted); 404 `User not found for testimonial`; 500 |
| T5 | `DELETE /v1/landing/cms/testimonials/delete/{id}` | auth_mw | *(authenticated only)* **No ownership check.** | Path `id` | 200 `{"message":"Testimonial deleted",...}` | 401; 400; 404 if missing (an already-deleted row still returns 200); 500 |

T3 details:

- The author is the caller. `user_id` is the caller's `app_users.id`, found by looking up `email = JWT sub`.
- `user_fullname` in the response comes from that lookup.
- `created_at` and `updated_at` in the response are the inserted values.

In T1, rows whose joined user is missing are dropped from `data`, but they are still counted in `meta.total`. Soft-deleted users (`deleted_at` set) are still included.

### 2.3 Roadmap (`imphnen-cms/src/roadmap/infrastructure/http/{routes,handlers,dto}.rs`)

#### Shapes

`RoadmapListItem`:

```json
{"id":"uuid","title":"str","description":"str","status":"str","votes":0,"is_deleted":false,"created_at":"rfc3339(+00:00)"}
```

It has **no `updated_at`**.

`RoadmapDetailItem`:

```json
{"id","title","description","status","votes","created_at","updated_at"}
```

`RoadmapWriteBody` (plain serde; any strings accepted):

```json
{"title":"string","description":"string","status":"string"}
```

All three fields are required. `status` is not validated.

#### Routes

| # | Method & path | Auth | Permission | Request | Success | Errors |
|---|---|---|---|---|---|---|
| R1 | `GET /v1/landing/cms/roadmap` | none | – | Query: pagination. `sort_by`: `title` (default **ASC**), `votes` (default **DESC**), anything else sorts by `created_at` (default DESC). Search (needs `search_fields`): `title LIKE '%q%'` (case-sensitive). Filters `is_deleted = false`. | 200 `ApiPaginated<RoadmapListItem>` | 400 text/plain on bad query. Service error: 400 JSON. |
| R2 | `GET /v1/landing/cms/roadmap/detail/{id}` | none | – | Path `id` | 200 `ApiSuccess<RoadmapDetailItem>` | 400 `"Invalid UUID: ..."`; 404 `"Resource not found: Roadmap item not found"`; any error 404 |
| R3 | `POST /v1/landing/cms/roadmap/vote/{id}` | **none** | – | Path `id`; no body | 200 `{"message":"Vote recorded",...}` | 400 `"Invalid UUID: ..."`; **400** (not 404) `"Resource not found: Roadmap item not found"` when the item is missing or soft-deleted; any error returns 400 |
| R4 | `POST /v1/landing/cms/roadmap/create` | auth_mw | `Administrator` | Body: `RoadmapWriteBody`. `votes` is forced to 0. | **201** `{"message":"Roadmap item created",...}` (no data) | 401; 400; 403; 500 |
| R5 | `PATCH /v1/landing/cms/roadmap/update/{id}` | auth_mw | `Administrator` | Path; body: `RoadmapWriteBody`. Replaces title, description and status. Keeps votes. | 200 `{"message":"Roadmap item updated",...}` | 401; 400; 403; 400 bad UUID; 404 (also when soft-deleted); 500 |
| R6 | `DELETE /v1/landing/cms/roadmap/delete/{id}` | auth_mw | `Administrator` | Path | 200 `{"message":"Roadmap item deleted",...}` | 401; 403; 400; 404 if missing (an already-deleted row still returns 200); 500 |

R3 notes:

- Vote increments `votes` by 1 and sets `updated_at = now()`.
- It is **not atomic**: it reads the row and then writes `votes+1`, so concurrent votes are lost.
- It applies **no de-duplication and no rate limit**.
- There is no un-vote endpoint.

### 2.4 QR users (`imphnen-cms/src/qr/users/infrastructure/http/{routes,handlers,dto}.rs`)

`QrUser` (serialized `UserEntity`, field order as shown; timestamps use the `Z` format, see 0.7):

```json
{"id":"uuid","email":"str","name":"str","role":"user|admin|<any>","provider":"str","created_at":"...Z|null","updated_at":"...Z|null"}
```

(`UserResponse` in `dto.rs` is unused.)

| # | Method & path | Auth | Permission | Request | Success | Errors |
|---|---|---|---|---|---|---|
| Q1 | `GET /v1/qr/users/me` | qr_mw | any authenticated | – | 200 `ApiSuccess<QrUser>` | 401 text/plain (0.5); 404 `"Resource not found: User not found"` (only if the auto-provision failed); 500 |
| Q2 | `PUT /v1/qr/users/me` | qr_mw | any authenticated | JSON `{"name"?: string\|null, "email"?: string\|null}`. SQL: `UPDATE qr_users SET name=COALESCE($name,name), email=COALESCE($email,email), updated_at=NOW() WHERE id=$me RETURNING ...` | 200 `ApiSuccess<QrUser>` | 401; 415/400/422 text/plain; **400 `"Validation error: Email cannot be empty"`** if `email` is present and whitespace-only. An empty `name` is allowed. 500 if the row is missing (`fetch_one`). |
| Q3 | `GET /v1/qr/users` | qr_mw | `qr_users.role == "admin"` | – | 200 `ApiSuccess<QrUser[]>`, all rows `ORDER BY created_at DESC`, with no pagination | 401; 403 `"Forbidden: Admin access required"`; 500 |
| Q4 | `PUT /v1/qr/users/{id}/role` | qr_mw | admin | Path `id`: UUID; JSON `{"role": string}` (required; **any value accepted**) | 200 `ApiSuccess<QrUser>` | 401; 400 path; 415/400/422 body; 403; **500** when the id does not exist (sqlx RowNotFound, message `"Internal server error: no rows returned by a query that expected to return at least one row"`) |
| Q5 | `DELETE /v1/qr/users/{id}` | qr_mw | admin | Path `id`: UUID | 200 `{"message":"User deleted successfully","version":"0.3.0"}` | 401; 400; 403; 500 on DB error (for example an FK from `qr_campaigns.created_by`, if that FK exists). A missing id still returns 200. |

Routing note: `DELETE /v1/qr/users/me` matches the static `/users/me` route, which only has GET and PUT, so it returns 405.

### 2.5 QR campaigns (`imphnen-cms/src/qr/campaigns/infrastructure/http/{routes,handlers,dto}.rs`)

`QrCampaign` (serialized `CampaignEntity`; `qr_code_data` is never returned):

```json
{"id":"uuid","name":"str","url":"str","is_active":true,"created_by":"uuid","expires_at":"...Z","created_at":"...Z|null","updated_at":"...Z|null"}
```

| # | Method & path | Auth | Permission | Request | Success | Errors |
|---|---|---|---|---|---|---|
| C1 | `POST /v1/qr/campaigns` | qr_mw | admin | JSON `{"name": string, "url": string}`. Both are required and **not validated**; empty strings are allowed. `url` is not checked to be a URL. | **201** `ApiCreated<QrCampaign>`. The new campaign has `is_active: true`. (The OpenAPI example showing `false` is wrong.) | 401; 415/400/422; 403; 500 if QR encoding fails (data too long for QR v40-M, about 2331 bytes) or on a DB error |
| C2 | `GET /v1/qr/campaigns` | qr_mw | admin | – | 200 `ApiSuccess<QrCampaign[]>`, `ORDER BY created_at DESC`, with no pagination. Includes expired campaigns. | 401; 403; 500 |
| C3 | `PUT /v1/qr/campaigns/{id}/activate` | qr_mw | admin | Path `id`: UUID; no body | 200 `ApiSuccess<QrCampaign>` | 401; 400; 403; **500** RowNotFound when the id does not exist. The transaction rolls back, so the previous active campaign stays active. |
| C4 | `DELETE /v1/qr/campaigns/{id}` | qr_mw | admin | Path `id`: UUID | 200 `{"message":"Campaign deleted successfully",...}` | 401; 400; 403; 500. A missing id returns 200. Deleting the active campaign leaves **no** active campaign. |
| C5 | `POST /v1/qr/campaigns/process-image` | qr_mw | **any authenticated** (no role check) | `multipart/form-data`. The first part named **`file`** is used; other parts are ignored. The body limit is the axum default of **2 MiB** (no `DefaultBodyLimit` override anywhere). | 200, `Content-Type: image/png`, raw PNG bytes (not JSON) | 401; 400 `"Bad request: <multipart err>"`, including body over 2 MiB (mapped to 400, not 413); 400 `"Bad request: No file provided"` when there is no `file` part or it is empty; **404 `"Resource not found: No active campaign"`**; 400 `"Bad request: Invalid image format"` when decoding fails; 500 |

Routing note: `/campaigns/process-image` is a static segment, so it takes priority over `/campaigns/{id}`. `POST /campaigns/{uuid}` returns 405.

---

## 3. Business rules and side effects

### 3.1 Soft delete (events, testimonials, roadmap)

- Every read, including detail, list, vote, and the pre-fetch done by update, filters `is_deleted = false`.
- Delete looks the row up **without** that filter, so deleting twice succeeds.
- There is no restore endpoint.
- There is no hard delete.

### 3.2 QR code generation (`imphnen-cms/src/qr/campaigns/application/campaign_service.rs::create`)

- Library: Rust `qrcode` 0.14.1 with the `image` feature.
- Encoding: `QrCode::new(url.as_bytes())` picks the version automatically, uses **error correction level M**, and chooses the mode (numeric, alphanumeric or byte) automatically.
- Encoded payload: **exactly the campaign `url` string bytes**, with no wrapping, tracking parameters or campaign id.
- Rendering:
  - `render::<Luma<u8>>().min_dimensions(256, 256)`.
  - Quiet zone is on at 4 modules per side.
  - Module pixel size is `ceil(256 / (modules + 8))`, so the image is at least 256×256 and exactly `(modules + 8) * unit` pixels square.
  - Dark modules are 0 (black) and light modules are 255 (white).
- Output format: 8-bit **grayscale PNG**.
- Storage: stored in `qr_campaigns.qr_code_data` (bytea). There is no object storage and no MinIO; MinIO is used only by the hackathon crate.

### 3.3 Campaign activation invariant (`postgres_campaign_repository.rs`)

- **Create** runs in one transaction:

  ```sql
  UPDATE qr_campaigns SET is_active=false, updated_at=NOW();   -- all rows
  INSERT ... (id, name, url, qr_code_data, is_active=true, created_by=<caller>, expires_at=NOW()+INTERVAL '30 days')
  ```

  The new campaign therefore always becomes the only active one.
- **Activate** runs in one transaction: deactivate all rows, then `UPDATE ... SET is_active=true, updated_at=NOW() WHERE id=$1 RETURNING ...`.
- "Active" lookup is `SELECT qr_code_data FROM qr_campaigns WHERE is_active = true LIMIT 1`. It has no ORDER BY and **ignores `expires_at`**.
- `expires_at` is informational only.

### 3.4 Image watermarking (`process_image`)

1. Load the active campaign's QR PNG. If none exists, return 404.
2. Decode the upload with `image::load_from_memory` (image 0.25, default formats plus png/jpeg: PNG, JPEG, GIF, WebP, BMP, TIFF, ICO and so on). The format is sniffed from magic bytes. A failure returns 400 `Invalid image format`.
3. `(w, h)` = upload dimensions. `qr_size = max(floor(min(w, h) / 5), 100)`.
4. Resize the QR to `qr_size × qr_size` exactly, using **nearest-neighbour** filtering.
5. Convert the upload to RGBA8 and overlay the QR at `x = w - qr_size - 10`, `y = h - qr_size - 10`. That is the bottom-right corner with a 10 px margin. The overlay uses alpha-blending, but the QR is opaque.
6. Encode as **RGBA PNG** and return it with `Content-Type: image/png`. No EXIF or orientation handling is done.
7. Edge case: if `w` or `h` is less than `qr_size + 10` (any side under 110 px), the u32 subtraction underflows. In a release build (overflow checks off) the value wraps to a huge offset, so no overlay is drawn and the image comes back unmodified, converted to PNG. A debug build would panic. The port should either reject such images or clamp the offset. This is a documented deviation choice.
8. Nothing is persisted.

### 3.5 Testimonial authoring

- On create, the author is resolved from `app_users` by the JWT `sub` (email), not by `user_id`.
- `user_fullname` is always derived live from `app_users.first_name`/`last_name`. It is never stored.

### 3.6 Emails, audit, caching, rate limiting, storage

- **Emails:** none.
- **Audit log:**
  - None is written.
  - `audit_logging_middleware` (`imphnen-middleware/src/audit_logging_middleware/mod.rs`) is exported but **never layered** anywhere.
  - Its matcher uses the prefix `/v1/cms/admin/`, which no route uses.
  - The port does not need to write audit entries to keep behaviour identical. Adding them for admin CMS/QR mutations is optional.
- **Rate limiting:**
  - None applies to this domain.
  - `rate_limiting_middleware` is layered only on the IAM public auth routes.
  - Its list includes the prefix `/v1/cms/landing` (`imphnen-middleware/src/rate_limiting_middleware/mod.rs:115`), which matches no route and is also not layered on the CMS routes.
  - Roadmap vote (R3) is therefore completely unthrottled.
- **Caching:** there is none on the server (no cache headers and no memoization). The global `security_headers_middleware` adds HSTS, CSP (with a nonce), `X-Frame-Options: DENY`, `nosniff` and similar headers to every response.
- **Storage uploads:** none in CMS. QR PNGs are stored in the DB as bytea (3.2).

### 3.7 QR user provisioning and roles

- Any valid IAM access token gets a `qr_users` row on first use, with `role='user'` and `provider='external'`.
- There is no API path that creates the first admin. It must be set in the DB (`UPDATE qr_users SET role='admin' ...`), or through Q4 by an existing admin.
- Deleting a qr user is not permanent: the next request with that user's token re-creates the row as `'user'`.

---

## 4. Frontend callers

Base URL resolution:

- `packages/service/src/api/index.ts` `getBaseURL()` uses `PUBLIC_API_URL`, then `NEXT_PUBLIC_API_URL`, then `VITE_API_URL`, with fallback `https://api.imphnen.dev`. It adds the Bearer token from the `token` cookie JSON.
- The landing app uses `apps/landing/src/utils/api.ts` `getApiUrl()`, which follows the same precedence.
- The qrcampaign app uses its **own** axios instance with `baseURL: 'https://api-qr.imphnen.dev/api/v1'` and a token from `localStorage.token` (`apps/qrcampaign/src/app/features/auth/api/auth.service.ts`).

### 4.1 CMS endpoints

| Endpoint | Service function (`packages/service/src/api/...`) | Hook (`packages/service/src/hooks/...`) | App call sites |
|---|---|---|---|
| E1 GET events | `events/index.ts` `getEventList(params)` | `events/index.ts` `useEventList` | `apps/backoffice/src/routes/_authenticated/cms-events.tsx` (list with `search`, `page`, `per_page=10`); `apps/backoffice/src/routes/_authenticated/cms-events_/$id.tsx` (fetches `per_page=100`, then finds by id client-side instead of calling E2); `apps/landing/src/pages/events.astro` (direct `fetch`, SSR, reads `json.data`, first page only) |
| E2 GET event detail | `getEventById` | `useEventById` | **none** (unused) |
| E3 POST create | `createEvent` (expects `data.data`, but the backend returns only a message) | `useCreateEvent` | `apps/backoffice/src/routes/_authenticated/cms-events_/create.tsx` |
| E4 PATCH update | `updateEvent` | `useUpdateEvent` | `apps/backoffice/src/routes/_authenticated/cms-events_/$id.tsx` |
| E5 DELETE | `deleteEvent` | `useDeleteEvent` | `apps/backoffice/src/routes/_authenticated/cms-events.tsx` |
| T1 GET testimonials | `testimonials/index.ts` `getTestimonialList` | `testimonials/index.ts` `useTestimonialList` | `apps/backoffice/src/routes/_authenticated/cms-testimonials.tsx`; `apps/backoffice/src/routes/_authenticated/cms-testimonials_/$id.tsx` (`per_page=100`, finds client-side); `apps/landing/src/components/TestimonialSection.tsx` (direct fetch, filters `!is_deleted`, takes 6); `apps/landing/src/pages/testimonials/index.astro` (direct fetch, SSR) |
| T2 GET testimonial detail | `getTestimonialById` | `useTestimonialById` | **none** |
| T3 POST create | `createTestimonial` | `useCreateTestimonial` | `apps/backoffice/src/routes/_authenticated/cms-testimonials_/create.tsx`; `apps/landing/src/components/TestimonialSubmitForm.tsx` (direct fetch with Bearer; enforces content of at least 20 chars client-side; reads `data.message` on error) |
| T4 PATCH update | `updateTestimonial` | `useUpdateTestimonial` | `apps/backoffice/src/routes/_authenticated/cms-testimonials_/$id.tsx` |
| T5 DELETE | `deleteTestimonial` | `useDeleteTestimonial` | `apps/backoffice/src/routes/_authenticated/cms-testimonials.tsx` |
| R1 GET roadmap | `roadmap/index.ts` `getRoadmapList()` (no params, so only the first 20 rows; typed as `ApiResponse<T[]>`, ignores `meta`) | `roadmap/index.ts` `useRoadmapList` | `apps/backoffice/src/routes/_authenticated/roadmap-dimentorin.tsx`; `apps/backoffice/src/routes/_authenticated/roadmap-dimentorin_/$id.tsx` (finds by id client-side); `apps/landing/src/components/RoadmapVote.tsx` (direct fetch, groups by status `upcoming`/`in_progress`/`completed`) |
| R2 GET roadmap detail | – | – | **none** |
| R3 POST vote | – | – | `apps/landing/src/components/RoadmapVote.tsx` `handleVote` (direct `fetch` POST, no auth, fire-and-forget; "un-vote" is client-side only) |
| R4 POST create | `createRoadmap` | `useCreateRoadmap` | `apps/backoffice/src/routes/_authenticated/roadmap-dimentorin_/create.tsx` |
| R5 PATCH update | `updateRoadmap` | `useUpdateRoadmap` | `apps/backoffice/src/routes/_authenticated/roadmap-dimentorin_/$id.tsx` |
| R6 DELETE | `deleteRoadmap` | `useDeleteRoadmap` | `apps/backoffice/src/routes/_authenticated/roadmap-dimentorin.tsx` |

Frontend types: `packages/service/src/types/{events,testimonials,roadmap,common}/index.ts`. `TRoadmapListItem` declares `updated_at`, but the backend list item does not include it. `TPaginationParams` sends `order`, `filter` and `filter_by`, none of which the backend honours. Backoffice navigation lives in `apps/backoffice/src/components/sidebar.tsx`, with routes `/cms-events`, `/cms-testimonials` and `/roadmap-dimentorin`.

### 4.2 QR endpoints (`apps/qrcampaign`)

All paths below are relative to `https://api-qr.imphnen.dev/api/v1`. They **do not match** this backend's `/v1/qr/...` prefix unless a reverse proxy rewrites `/api/v1/*` to `/v1/qr/*`. `apps/infra/src/routes/index.tsx:34` lists `api-qr.imphnen.dev` as a separate service.

| Backend route | Frontend call | File |
|---|---|---|
| Q1 GET /users/me | `authService.getProfile()` (expects a bare `User`, not `{data}`; **never called**) | `apps/qrcampaign/src/app/features/auth/api/auth.service.ts` |
| Q2 PUT /users/me | – | none |
| Q3 GET /users | `userService.getUsers()` | `apps/qrcampaign/src/app/features/admin/api/user.service.ts`, used by `apps/qrcampaign/src/routes/_authenticated/admin/users.tsx` |
| Q4 PUT /users/{id}/role | `userService.updateUserRole(id, role)` (role is `user` or `admin`) | same |
| Q5 DELETE /users/{id} | `userService.deleteUser(id)` | same |
| C1 POST /campaigns | `campaignService.createCampaign({name,url})` | `apps/qrcampaign/src/app/features/admin/api/campaign.service.ts`, used by `apps/qrcampaign/src/routes/_authenticated/admin/campaigns.tsx` |
| C2 GET /campaigns | `campaignService.getCampaigns()` | same |
| C3 PUT /campaigns/{id}/activate | `campaignService.activateCampaign(id)` | same |
| C4 DELETE /campaigns/{id} | `campaignService.deleteCampaign(id)` | same |
| C5 POST /campaigns/process-image | `api.post('/campaigns/process-image', formData, {responseType:'blob'})`. **Sends field `image`, but the backend reads `file`.** | `apps/qrcampaign/src/routes/_authenticated/index.tsx` `handleGenerate` |

Dead duplicates hard-code `http://localhost:8080/api/v1/...` and are not imported by any route:

- `apps/qrcampaign/src/app/features/admin/pages/CampaignManagement.tsx` (campaigns GET/POST/PUT activate/DELETE).
- `apps/qrcampaign/src/app/features/admin/pages/UserManagement.tsx` (users GET/PUT role/DELETE).
- `apps/qrcampaign/src/app/features/campaign/api/useActiveCampaignQR.ts`.

### 4.3 Frontend calls in this domain with NO matching backend route

1. `GET {api-qr}/api/v1/campaigns/active/qr`: `apps/qrcampaign/src/app/features/campaign/api/useActiveCampaignQR.ts` (dead code). The backend has no endpoint that returns the active QR PNG.
2. `POST {api-qr}/api/v1/auth/login` and `POST {api-qr}/api/v1/auth/register`: `apps/qrcampaign/src/app/features/auth/store/auth.store.ts` via `authService` in `auth.service.ts`. There is no QR auth route; the equivalent is IAM `/v1/iam/auth/*`. The expected response `{success, message, data:{tokens, user:{...name, role, provider}}}` matches the legacy QR service, not this backend.
3. The entire qrcampaign base path `/api/v1/*`, compared with the backend's `/v1/qr/*` (see 4.2).
4. `/v1/cms/landing/events*` and `/v1/cms/landing/testimonials*`: listed in `apps/landing/src/openapi-types.ts` (lines 131–290). This is a stale generated file that nothing imports.
5. Query params `order`, `filter` and `filter_by` in `TPaginationParams` (`packages/service/src/types/common/index.ts`). They are not honoured, and `filter` may cause a 400. `search` is sent without `search_fields`, so it is a no-op.
6. Roadmap "un-vote" in `apps/landing/src/components/RoadmapVote.tsx`: the client decrements locally, but there is no endpoint.

---

## 5. Open questions, oddities and bugs

1. **CORS blocks PATCH.** All three CMS update endpoints (E4, T4, R5) use PATCH, but `cors_middleware` allows only GET, POST, PUT, DELETE and OPTIONS. Cross-origin browser updates from the backoffice should fail the preflight unless a proxy makes the calls same-origin. **Decision needed:** in the port, add PATCH to CORS, or also accept PUT.
2. **Backoffice event form sends `type="date"` values** (`YYYY-MM-DD`) for `start_date` and `end_date` (`apps/backoffice/src/routes/_authenticated/cms-events_/create.tsx:115,124`). The Rust backend requires RFC 3339 with an offset, so create and update fail with 400. The number input may also send `price` as a string unless it is coerced. **Decision:** should the port accept date-only and numeric strings (lenient), or stay strict?
3. **qrcampaign upload field mismatch:** the frontend sends `image` and the backend reads `file`, so every call returns 400 `No file provided`. The port could accept both.
4. **qrcampaign targets a different API** (`api-qr.imphnen.dev/api/v1`) that has its own `/auth/login` and `/auth/register`. The backend QR module instead trusts IAM tokens. The migration strategy for existing `qr_users` rows (provider `google` etc.) and passwords is unknown.
5. **Search is effectively disabled** unless `search_fields` is sent, and the frontend never sends it. When it is active, it is a case-sensitive `LIKE`. Testimonials ignore search completely. **Decision:** should the port make `search` work on its own (ILIKE)? That would change behaviour.
6. The documented query param `order` (utoipa) is actually named `sort_direction`. Default sort directions differ per field (name and title default to ASC; votes and created_at default to DESC).
7. **Testimonial update and delete have no ownership or admin check.** Any logged-in user can edit or delete anyone's testimonial. This is likely a security bug. **Decision:** should the port add "owner or Administrator"?
8. **Roadmap vote is anonymous, unthrottled and non-atomic** (read then write, `votes + 1`), so votes can be lost or inflated. The port should use `UPDATE ... SET votes = votes + 1` and consider rate limiting or dedupe. A missing item returns 400, not 404.
9. Public detail and list handlers override error statuses. Lists return 400 on DB errors, and detail returns 404 on DB errors.
10. Create endpoints for events and roadmap return a message only, with no `data`. The frontend `createEvent`/`createRoadmap` return `response.data.data`, which is `undefined`, but nothing uses the value.
11. `meta.total` for testimonials counts rows that are later dropped because the author row is missing.
12. `roadmap_items` has no DDL in the repo (it is missing from `create_schema.rs`), and `qr_users` and `qr_campaigns` have no DDL or entity at all. Production column types, defaults, indexes and FKs must be confirmed against the live DB (`\d qr_users`, `\d qr_campaigns`, `\d roadmap_items`).
13. SeaORM `default=` and `not_null` attributes are no-ops, so tables built by `create_schema.rs` have no defaults. If production was built that way, the port must always supply every value on insert. Otherwise add defaults.
14. `expires_at` on campaigns is set to +30 days and never enforced. An expired active campaign keeps watermarking.
15. Activate or role-update of a missing id returns 500 (RowNotFound) instead of 404. Deletes of missing QR ids return 200.
16. Q4 accepts any role string. For example, `"Admin"` locks the user out of admin, because the check is case-sensitive.
17. The QR admin bootstrap has no API; it needs a manual DB update.
18. `process_image`: images under 110 px on either side are returned without a watermark (u32 wrap; see 3.4). Uploads over 2 MiB return 400, not 413. There is no EXIF-orientation handling.
19. QR 401 responses and axum extractor rejections are `text/plain`, while the rest of the API uses a JSON `{message, version}`. The frontend axios interceptor reads `error.response.data.message`, which is undefined for these. **Decision:** should the port normalize to JSON?
20. `permissions_guard` looks users up by `email = sub`, while `auth_middleware` looks them up by `id = user_id`. Neither checks `is_active` or `deleted_at`, so deactivated users can still use admin CMS endpoints if their role has `Administrator`.
21. Audit logging and the `/v1/cms/landing` rate-limit prefix are dead configuration. Confirm whether the port should implement audit entries for CMS admin mutations.
22. The two timestamp formats differ within the same API: `+00:00` for CMS and `Z` for QR (0.7). Keep them as-is for compatibility, or unify to `Z`? The frontend parses both with `new Date()`, so unifying is likely safe.
23. `imphnen-iam` reads `qr_users` (role, provider) for the user profile (`get_handlers.rs:199`). This is a cross-domain dependency the IAM port must keep.
24. `v2` is an empty placeholder with no routes.
