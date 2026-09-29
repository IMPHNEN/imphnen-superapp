# Port spec: Gacha domain (`imphnen-gacha`)

Source of truth: `/Users/ms/Development/imphnen-backend-service` (Rust, axum 0.8.7, SeaORM 1.1.19, crate version `0.3.0`).
Target: the TypeScript API. `apps/api` runs on Cloudflare Workers, uses Drizzle, and binds a **D1 (SQLite)** database (`apps/api/wrangler.jsonc`), so read section 6 before porting the SQL.

All Rust paths below are relative to the backend repo root. `GR` = `imphnen-gacha/src`.

---

## 0. Crate layout and mounting

| Piece | File |
|---|---|
| Top-level router (`gacha_router`) | `GR/lib.rs` |
| Mount point | `imphnen-gateway/src/lib.rs:84-92`: `.nest("/v1/gacha", gacha_router(db, state).layer(from_fn(auth_middleware)))` |
| Sub-routers | `/credits` → `GR/gacha_credits/infrastructure/http/routes.rs`; `/items` → `GR/gacha_items/infrastructure/http/routes.rs`; `/rolls` → `GR/gacha_rolls/infrastructure/http/routes.rs`; `/claims` → `GR/gacha_claims/infrastructure/http/routes.rs`; `/admin` → inline in `GR/lib.rs:25-42` |
| Entities | `imphnen-entities/src/seaorm/gacha/{gacha_items,gacha_rolls,gacha_credits,gacha_claims,gacha_items_queries}.rs` |
| Schema creation | `imphnen-backend/src/bin/create_schema.rs` (no SQL migrations exist in the repo) |
| Seeders | `imphnen-backend/src/bin/seed_gacha_rolls.rs`; permission and role wiring in `seed_permissions.rs` and `seed_roles_permissions.rs` |

The crate has **no v2 routes**. `grep` for `/v2` across the workspace finds only hackathon sample data. **`payment_middleware` is not used by gacha**: `PaymentLayer` is exported from `imphnen-middleware/src/lib.rs:12` and never attached anywhere. It only matches paths that contain `/premium/`, `/paid/` or `/subscription/`. **Do not port it for gacha.**

Gacha has no email, no object storage (MinIO), no audit logging and no rate limiting.

---

## 1. Tables

### 1.1 How the schema is actually produced (read first)

Tables are created by `imphnen-backend/src/bin/create_schema.rs`. The binary runs `DROP TABLE IF EXISTS … CASCADE` and then `Schema::create_table_from_entity(Entity)` for each entity. No handwritten DDL exists. Consequences:

- **The `default = "..."`, `not_null` and `type = "jsonb"` attributes in the entity files are silently ignored.** SeaORM's derive only understands `default_value`, `default_expr`, `column_type`, `nullable`, `unique`, `indexed` and similar. Any other key hits a catch-all branch that discards it (`~/.cargo/registry/src/*/sea-orm-macros-1.1.19/src/derives/entity_model.rs`, the `else { let _: Option<Expr> = … }` branch). So **there are no DB-side defaults** (no `gen_random_uuid()`, no `now()`, no `0`/`false`), and `metadata` is `json`, not `jsonb`.
- NOT NULL is emitted for every non-`Option<T>` field. NULL is allowed only for `Option<T>` fields.
- Foreign keys are emitted only for `belongs_to` relations. `ON DELETE` and `ON UPDATE` are not specified, so the default `NO ACTION` applies. SeaORM auto-generates the FK names.
- Rust type → Postgres type: `Uuid`→`uuid`, `String`→`varchar` (no length), `i32`→`integer`, `f64`→`double precision`, `f32`→`real`, `bool`→`boolean`, `DateTime<Utc>`→`timestamp with time zone`, `sea_orm::prelude::DateTime` (= `NaiveDateTime`)→`timestamp without time zone`, `serde_json::Value`→`json`.
- The field `type_` maps to a column named **`type`**. The macro applies `to_snake_case`, which drops the trailing underscore (`entity_model.rs` lines ~116-124). The JSON field is still `type_` (see the DTOs).
- The application always writes every column explicitly, including `id`, `created_at` and `updated_at`, so the missing defaults never bite at runtime.

> Open question: production may have been created some other way (manually or with an older schema). Before choosing DDL, check with `\d+` on prod (see §5).

The four tables are inconsistent on purpose-free grounds. Two are prefixed `app_` and two are not. Two use `deleted_at` timestamps, two use an `is_deleted` bool. Two use `timestamptz`, two use naive `timestamp`.

### 1.2 `app_gacha_items` (entity `imphnen-entities/src/seaorm/gacha/gacha_items.rs`)

| Column | PG type | Null | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `id` | uuid | NOT NULL | none | PRIMARY KEY | App generates it with UUIDv4 |
| `item_code` | varchar | NOT NULL | none | **UNIQUE** | Duplicate → DB error → HTTP 500 |
| `name` | varchar | NOT NULL | none | | Search target (`LIKE`) |
| `description` | varchar | NOT NULL | none | | Empty string allowed |
| `rarity` | varchar | NOT NULL | none | | Free text. Values seen: `"common"`. **Never used by any logic.** |
| `type` | varchar | NOT NULL | none | | JSON key `type_`. Free text. Values seen: `"physical"` (backoffice), `"item"` (seeder) |
| `category` | varchar | NOT NULL | none | | Free text. Values seen: `"merchandise"`, `"test"` |
| `value` | integer | NOT NULL | none | | Never used by logic |
| `weight` | double precision | NOT NULL | none | | **Not used by the roll algorithm** (see §3) |
| `stock` | integer | NOT NULL | none | | **Never read or decremented by the roll** |
| `is_limited` | boolean | NOT NULL | none | | Never used by logic |
| `metadata` | json | NULL | none | | Any JSON value (not only objects) |
| `created_at` | timestamptz | NOT NULL | none | | App sets `now()` |
| `updated_at` | timestamptz | NOT NULL | none | | App sets `now()` |
| `deleted_at` | timestamptz | NULL | none | | Soft delete. `is_deleted` in DTOs = `deleted_at IS NOT NULL` |

No relations are declared on this entity.

### 1.3 `gacha_rolls` (entity `.../gacha/gacha_rolls.rs`): the **roll pool** (despite the name, a row is a prize-pool entry, not a roll event)

| Column | PG type | Null | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `id` | uuid | NOT NULL | none | PRIMARY KEY | UUIDv4 from app |
| `user_id` | uuid | NOT NULL | none | FK → `app_users(id)` | The **admin who created the pool entry**, not a roller |
| `gacha_id` | varchar | NOT NULL | none | | API always writes `"default"`. Seeder writes a random UUID string. Never read by logic. |
| `item_id` | uuid | NOT NULL | none | FK → `app_gacha_items(id)` | Prize item |
| `weight` | real (float4) | NOT NULL | none | | Pool weight (f32) |
| `quantity` | integer | NOT NULL | none | | Multiplies the weight. **Never decremented.** |
| `is_deleted` | boolean | NOT NULL | none | | Soft delete flag |
| `created_at` | timestamp (no tz) | NULL | none | | App writes `Utc::now().naive_utc()` |
| `updated_at` | timestamp (no tz) | NULL | none | | same |

### 1.4 `gacha_credits` (entity `.../gacha/gacha_credits.rs`)

| Column | PG type | Null | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `id` | uuid | NOT NULL | none | PRIMARY KEY | |
| `user_id` | uuid | NOT NULL | none | FK → `app_users(id)`. **Not unique, not indexed** | App assumes one live row per user and uses `.one()`. If duplicates exist, Postgres picks an arbitrary row. |
| `available_rolls` | integer | NOT NULL | none | | Can go negative through `/credits/add` with a negative amount |
| `is_deleted` | boolean | NOT NULL | none | | All queries filter `is_deleted = false`. No endpoint sets it to true. |
| `created_at` | timestamp (no tz) | NULL | none | | |
| `updated_at` | timestamp (no tz) | NULL | none | | |

### 1.5 `app_gacha_claims` (entity `.../gacha/gacha_claims.rs`): prize ledger (one row per win)

| Column | PG type | Null | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `id` | uuid | NOT NULL | none | PRIMARY KEY | |
| `user_id` | uuid | NOT NULL | none | **no FK** | Winner |
| `gacha_item_id` | uuid | NOT NULL | none | **no FK** | Won item (copied from `gacha_rolls.item_id`) |
| `claim_id` | uuid | NOT NULL | none | | A second random UUIDv4 with no meaning or reader |
| `claim_type` | varchar | NOT NULL | none | | Enum-like: `"roll"` (from execute), `"standard"` (from admin create), `"direct"` (Rust unit test only) |
| `status` | varchar | NOT NULL | none | | Only value ever written: `"claimed"` |
| `quantity` | integer | NOT NULL | none | | Always `1` |
| `metadata` | json | NULL | none | | Always NULL |
| `claimed_at` | timestamptz | NOT NULL | none | | now() |
| `created_at` | timestamptz | NOT NULL | none | | now() |
| `updated_at` | timestamptz | NOT NULL | none | | now() |
| `deleted_at` | timestamptz | NULL | none | | Never set by any endpoint |

No indexes exist beyond the PKs and the `item_code` unique constraint.

### 1.6 Seeder: `imphnen-backend/src/bin/seed_gacha_rolls.rs` (run by `seeder.rs` after `seed_events`)

1. `SELECT id FROM app_gacha_items WHERE item_code='ITEM_TEST_1' LIMIT 1`.
2. If no row: run a no-op `DELETE ... WHERE item_code='ITEM_TEST_1'`, then insert an item with `id`=v4, `item_code`=`ITEM_TEST_1`, `name`=`Test Gacha Item`, `description`=`Test item for gacha`, `rarity`=`common`, `type`=`item`, `category`=`test`, `value`=1, `weight`=1.0, `stock`=10, `is_limited`=false, timestamps=now.
3. **Always** insert **two** `gacha_rolls` rows: `user_id`=`c3b1d6a8-8d4f-4b36-b789-2e532ec7a7b2` (the seeded `admin@example.com`, role Admin), `gacha_id`=random UUID string, `item_id`=the item, `weight`=1.0, `quantity`=10, `is_deleted`=false. The step is not idempotent: every run adds two more rows.
4. No credits and no claims are seeded.

Other seeders that touch gacha:
- `seed_permissions.rs` seeds every gacha permission **except `Delete Gacha Rolls`**.
- `seed_roles_permissions.rs` stores the **permission UUIDs** (not names) in `app_roles.permissions` (a JSON string array). Gacha grants per role:
  - Admin `f6b03f25-…` gets `Administrator`, which bypasses all checks.
  - Mentor `3b9f8c4e-…` gets ReadList/ReadDetail Gacha Items, ReadDetail/Create/Execute Gacha Rolls.
  - User `5713cb37-…` gets ReadList/ReadDetail Gacha Items, Create/ReadDetail Gacha Claims, ReadDetail/Create/Execute Gacha Rolls.
  - Staf `50133429-…` gets ReadList/ReadDetail Gacha Items and ReadDetail/Create/Execute Gacha Rolls.
  - No non-admin role has Create/Update/Delete Gacha Items or Delete Gacha Rolls.
- `clear_db.rs` lists `gacha_items` and `gacha_claims`. The real tables are `app_gacha_items` and `app_gacha_claims`, so those two are silently skipped (a bug).

---

## 2. Endpoints

### 2.1 Cross-cutting behaviour (applies to every gacha route)

**Auth layer** (`imphnen-middleware/src/auth_middleware/mod.rs`, applied to the whole `/v1/gacha` subtree):
1. Missing or non-`Bearer` `Authorization` header → **401** `{"message":"Invalid or missing authorization token","version":"0.3.0"}`.
2. JWT (HS256, `ACCESS_TOKEN_SECRET`) fails to decode or has expired → **401** `"Invalid or expired token"`.
3. `claims.user_id` is not a UUID → **401** `"Invalid user identifier format"`.
4. No `app_users` row has id = `claims.user_id` → **401** `"User not found or inactive"`. Despite the message, `is_active` and `deleted_at` are **not** checked.

JWT claims: `{ sub: <email>, user_id: <uuid>, iat, exp }` (`imphnen-libs/src/jsonwebtoken/mod.rs`). `sub` holds the email for normal logins (`imphnen-iam/src/auth/application/mod.rs:78,125,222`).

**Permission guard** (`imphnen-iam/src/permissions_guard.rs`, invoked through `require_permissions!` inside each handler):
1. Re-decodes the token. Errors here → **401** `"Authentication failed: Invalid or missing authorization token"` / `"Authentication failed: Invalid or expired token"` (normally unreachable because the middleware already checked).
2. Loads the user by `email = claims.sub`. If that fails, it parses `sub` as a UUID and loads by id. A parse failure gives **401** `"Authentication failed: Invalid user ID format"`, and a missing user gives **401** `"Authentication failed: User not found"`. This path is reachable when the user's email changed after the token was issued.
3. Builds the user's permission set. The role's `permissions` JSON is a string array, and each string is treated as **both** a name and an id (`imphnen-libs/src/services/dto.rs` `model_to_dto`).
4. If the set contains `"Administrator"` or `d6e7f8a9-0123-4567-8901-6789012345ab`, the request passes.
5. Otherwise, for each required permission, the set must contain its display name **or** its id by exact string compare. Failure → **403** `{"message":"Forbidden: You don't have the required permissions","version":"0.3.0"}`.

**"Current user" resolution** in the credits handlers and in `rolls/create` and `rolls/execute`: `extract_email(headers)` returns `claims.sub`, then `get_user_by_email(sub)`:
- If extraction fails → **401** `"Authentication failed: Unauthorized"`.
- If the lookup fails → **404** `"Resource not found: User not found"`. This happens when `sub` is a UUID, as in tokens from `generate_jwt` or `mk_token`.
- The resulting `user.id` string is parsed to a UUID. Failure → 400.

**Envelopes** (`imphnen-utils/src/response_format.rs`, `errors.rs`). `version` is the compile-time crate version, currently `"0.3.0"`:
- Success with data: `200 {"data": <T>, "version": "0.3.0"}`
- Paginated: `200 {"data": [<T>], "meta": {…}, "version": "0.3.0"}`
- Message: `<status> {"message": "<text>", "version": "0.3.0"}`
- Error: `<status> {"message": "<Prefix>: <text>", "version": "0.3.0"}`. The prefix comes from the `AppError` Display impl:

| AppError | Status | Message prefix |
|---|---|---|
| BadRequestError / ValidationError | 400 | `Bad request: ` / `Validation error: ` |
| AuthenticationError | 401 | `Authentication failed: ` |
| ForbiddenError | 403 | `Forbidden: ` |
| NotFoundError | 404 | `Resource not found: ` |
| InternalServerError | 500 | `Internal server error: ` (followed by the raw SeaORM `DbErr` text) |

**JSON body parsing** (`imphnen-libs/src/axum/validated_json.rs`). Every DTO's `zod_validate` is just `serde_json::from_value`, so there is **no business validation** (ranges, lengths, non-empty):
- Unreadable body → 400 `{"message":"Failed to read body: …"}`.
- Invalid JSON, **including an empty body** → 400 `{"message":"Invalid JSON: …"}`.
- Type or shape error → 400 `{"message":"Validation error: <serde msg>"}`, for example `missing field \`item_code\``, `invalid type: null, expected a string`, `invalid type: floating point \`1.5\`, expected i32`.
- Unknown fields are ignored. `Content-Type` is **not** checked.
- **Ordering:** axum runs extractors before the handler body. The JSON body is therefore validated **before** the permission check, and a malformed body returns 400 even to a user without the permission (after the auth middleware has passed). The pagination query is likewise parsed before the permission check.

**Pagination query** (`paginator-axum 0.2.2` `PaginationQuery`). Query params:
- `page`: u32, default 1, clamped with `max(1)`.
- `per_page`: u32, default 20, clamped to 1..100.
- `sort_by`: string.
- `sort_direction`: `asc`/`desc`, case-insensitive. Any other value → none.
- `search`: string.
- `search_fields`: comma-separated list.
- `filter`: parsed but ignored by gacha.
- Non-numeric or negative `page` or `per_page` → **400 with a `text/plain` body** `Invalid query params: …` (not JSON).
- `search` takes effect **only if `search_fields` is also non-empty**. The field list itself is then ignored (see items list).
- Meta: `{page, per_page, total, total_pages, has_next, has_prev}`, where `total_pages = ceil(total/per_page)`, `has_next = page < total_pages`, `has_prev = page > 1`. `next_cursor` and `prev_cursor` are omitted.

**Timestamp string formats** (they must match byte for byte if clients parse them):
- `DateTime<Utc>.to_rfc3339()` → `2025-03-01T12:34:56.123456+00:00`. The offset is always `+00:00`, never `Z`. Fractional digits are omitted when zero, otherwise 3, 6 or 9 digits (the shortest group that is exact). Postgres gives microsecond precision.
- `NaiveDateTime.to_string()` → `2025-03-01 12:34:56.123456`. There is a **space** separator and **no offset**, and the same fractional rule applies. Used for credits and rolls.

**Unmatched paths or methods**: axum returns a bare 404 or 405 with an empty body, and no auth runs. Trailing slashes are **not** normalized: `/v1/gacha/items/` does not match `/v1/gacha/items`.

### 2.2 Endpoint table (15 routes)

Every route requires `Authorization: Bearer <access JWT>` (§2.1). The "Permission" column lists the exact display string, with its UUID in parentheses. Administrator bypasses every check.

| # | Method | Path | Permission required | Rust handler |
|---|---|---|---|---|
| C1 | GET | `/v1/gacha/credits` | `Read Detail Gacha Items` (`9c7857d7-b5ae-4688-923d-ef5572e9bc8b`) | `GR/gacha_credits/infrastructure/http/handlers.rs:get_user_credits` |
| C2 | POST | `/v1/gacha/credits/add` | `Create Gacha Items` (`cf063be1-4d71-489e-b9fb-1c08c65f396c`) | `…:post_add_credits` |
| C3 | POST | `/v1/gacha/credits/consume` | `Update Gacha Items` (`2d0cf4ae-56ae-4714-a12e-655cfc3d9eb2`) | `…:post_consume_credit` |
| I1 | GET | `/v1/gacha/items` | `Read List Gacha Items` (`fa6eb842-0a61-40c2-9c24-b226ad975037`) | `GR/gacha_items/infrastructure/http/handlers.rs:get_gacha_item_list` |
| I2 | GET | `/v1/gacha/items/detail/{id}` | `Read Detail Gacha Items` (`9c7857d7-…`) | `…:get_gacha_item_by_id` |
| I3 | POST | `/v1/gacha/items/create` | `Create Gacha Items` (`cf063be1-…`) | `…:post_create_gacha_item` |
| I4 | PUT | `/v1/gacha/items/update/{id}` | `Update Gacha Items` (`2d0cf4ae-…`) | `…:put_update_gacha_item` |
| I5 | DELETE | `/v1/gacha/items/delete/{id}` | `Delete Gacha Items` (`46f8c6cf-ea0c-4c90-860c-69e2e65f7eb1`) | `…:delete_gacha_item` |
| A1 | GET | `/v1/gacha/admin` | `Read List Gacha Items` (`fa6eb842-…`) | same handler as I1 (`GR/lib.rs:25-42`) |
| R1 | GET | `/v1/gacha/rolls/detail/{id}` | `Read Detail Gacha Rolls` (`53d6483a-04cd-4667-8792-2d0cc8e2d343`) | `GR/gacha_rolls/infrastructure/http/handlers.rs:get_gacha_roll_by_id` |
| R2 | POST | `/v1/gacha/rolls/create` | `Create Gacha Rolls` (`18e36c63-fcb7-4877-b911-c5aa611e878f`) | `…:post_create_gacha_roll` |
| R3 | POST | `/v1/gacha/rolls/execute` | `Execute Gacha Rolls` (`14c6a1cd-5c63-4643-89b5-b1a5f9920cc0`) | `…:post_execute_gacha_roll` |
| R4 | DELETE | `/v1/gacha/rolls/delete/{id}` | `Delete Gacha Rolls` (`12345678-ABCD-EFAB-CDEF-0123456789AB`, uppercase placeholder, compared as a literal string) | `…:delete_gacha_roll` |
| L1 | GET | `/v1/gacha/claims/detail/{id}` | `Read Detail Gacha Claims` (`c1c3d6c2-19fb-4b70-b58c-c19f2e8cfc79`) | `GR/gacha_claims/infrastructure/http/handlers.rs:get_gacha_claim_by_id` |
| L2 | POST | `/v1/gacha/claims/create` | `Create Gacha Claims` (`f41d53ce-4f88-4bb6-b9b4-5e3a8c38d962`) | `…:post_create_gacha_claim` |

Permission sources: names in `imphnen-entities/src/permissions/definitions.rs:79-89`, ids in `.../mappings.rs:57-89`. Note that the credits endpoints reuse the **Gacha Items** permissions (C1 = read item, C2 = create item, C3 = update item). This is odd, but it is the contract.

Path `{id}` params are strings. Every handler parses them with `Uuid::parse_str`, and a failure → **400** `"Bad request: Invalid UUID: <uuid crate error text>"`. The parse happens **after** the permission check.

### 2.3 Endpoint details

#### C1 `GET /v1/gacha/credits`: the caller's own roll balance
- Request: no params or body.
- Flow: guard → resolve the current user by email (§2.1) → `SELECT * FROM gacha_credits WHERE user_id=$1 AND is_deleted=false LIMIT 1`.
- 200 when a row exists:
  ```json
  {"data":{"id":"<uuid>","user_id":"<uuid>","available_rolls":3,"is_deleted":false,
           "created_at":"2025-03-01 12:34:56.123456","updated_at":"2025-03-01 12:34:56.123456"},
   "version":"0.3.0"}
  ```
  (`created_at` and `updated_at` use the NaiveDateTime format, or `null` if the column is NULL.)
- 200 when no row exists (synthetic, nothing is inserted):
  `{"data":{"id":"","user_id":"<caller uuid>","available_rolls":0,"is_deleted":false,"created_at":null,"updated_at":null},"version":"0.3.0"}`
- Errors: 401 / 403 / 404 `User not found` (§2.1); 500 on a DB error.

#### C2 `POST /v1/gacha/credits/add`: add credits to **the caller's own** balance
- Body: `{"amount": <i32>}`, required. Any i32 is accepted, including 0 and negatives. Floats and out-of-range values → 400 Validation error.
- Flow (`GR/gacha_credits/infrastructure/persistence/postgres_gacha_credit_repository.rs:52-86`), with no transaction:
  1. `SELECT … WHERE user_id=$caller AND is_deleted=false LIMIT 1`.
  2. If found: `UPDATE gacha_credits SET available_rolls = <read value + amount>, updated_at = now_naive_utc WHERE id=$id`. This writes an absolute value computed in the app (read-modify-write, so a lost update is possible). Rust i32 addition wraps silently on overflow in release builds.
  3. Else: `INSERT` with `id`=v4, `user_id`, `available_rolls`=amount, `is_deleted`=false, `created_at`=`updated_at`=now (naive UTC).
- 200 `{"message":"Added <amount> credits successfully","version":"0.3.0"}`. **No data is returned.**
- Errors: 400 body errors (checked before the permission); 401 / 403 / 404; 500.
- **No endpoint can grant credits to another user.**

#### C3 `POST /v1/gacha/credits/consume`: burn 1 credit from the caller
- Request: no body (any body is ignored).
- Flow: find the row (as in C1). None → **404** `"Resource not found: No credit record found"`. `available_rolls <= 0` → **400** `"Bad request: No extra roll credits remaining"`. Otherwise `UPDATE … SET available_rolls = <read - 1>, updated_at = now WHERE id=$id` (read-modify-write).
- 200 `{"message":"Consumed 1 credit successfully","version":"0.3.0"}`.
- No roll or claim is created. This endpoint is only a counter decrement.

#### I1 `GET /v1/gacha/items` and A1 `GET /v1/gacha/admin`: paginated item list (the two are identical)
- Query: see §2.1.
- SQL: `SELECT … FROM app_gacha_items WHERE deleted_at IS NULL`, followed by:
  - **Search:** only when both `search` and a non-empty `search_fields` are present: `AND name LIKE '%<search>%'`. The match is **case-sensitive**, LIKE wildcards in user input are **not escaped**, and `search_fields` is otherwise ignored.
  - **Sort:** if `sort_by == "name"`: `ORDER BY name DESC` when `sort_direction=desc`, otherwise `ASC`. For any other or missing `sort_by`: `ORDER BY created_at ASC` when `sort_direction=asc`, otherwise `DESC`. There is no tiebreaker.
  - **Paging:** `COUNT(*)` of the same filtered query, then `LIMIT per_page OFFSET (page-1)*per_page`.
- 200:
  ```json
  {"data":[{"id":"<uuid>","name":"Pin","is_deleted":false,
            "created_at":"2025-03-01T12:34:56.123456+00:00","updated_at":"2025-03-01T12:34:56.123456+00:00"}],
   "meta":{"page":1,"per_page":20,"total":1,"total_pages":1,"has_next":false,"has_prev":false},
   "version":"0.3.0"}
  ```
  `GachaItemDto` (`GR/gacha_items/infrastructure/http/dto.rs:73-92`) exposes **only** `id, name, is_deleted, created_at, updated_at`. `created_at` and `updated_at` are typed `Option<String>` but are always strings. **`item_code`, `description`, `rarity`, `type_`, `category`, `value`, `weight`, `stock`, `is_limited` and `metadata` are NOT returned by any endpoint.**
- Errors: 400 text/plain for a bad query; 401 / 403; 500.

#### I2 `GET /v1/gacha/items/detail/{id}`
- `SELECT … WHERE id=$1 AND deleted_at IS NULL`. Missing or soft-deleted → **404** `"Resource not found: Gacha item not found"`.
- 200 `{"data": GachaItemDto, "version":"0.3.0"}` (same 5 fields as I1).

#### I3 `POST /v1/gacha/items/create`
- Body (all keys required except `metadata`):
  ```ts
  { item_code: string; name: string; description: string; rarity: string; type_: string;
    category: string; value: i32; weight: f64; stock: i32; is_limited: boolean; metadata?: any|null }
  ```
  No other validation is done. Empty strings and negative numbers are accepted.
- Insert: `id`=v4, the fields as given, `created_at`=`updated_at`=now (tz), `deleted_at`=NULL.
- 201 `{"message":"Gacha item created","version":"0.3.0"}`. **The new id is not returned.**
- Errors: 400 body; a duplicate `item_code` → **500** `"Internal server error: <DbErr text>"`, not 409.

#### I4 `PUT /v1/gacha/items/update/{id}`: **full replacement**
- Body: exactly the same shape and requirements as I3. **Partial bodies fail with 400** (`missing field …`).
- Flow:
  1. Parse `id`.
  2. `get` the item with `deleted_at IS NULL`. Missing or soft-deleted → 404 `"Resource not found: Gacha item not found"`.
  3. Re-read it by id (without the deleted filter).
  4. Set **all** 11 business columns, plus `updated_at=now`. If `metadata` is omitted or null, the column becomes NULL.
- 200 `{"message":"Gacha item updated","version":"0.3.0"}`.
- Errors: 400 / 401 / 403 / 404; duplicate `item_code` → 500.

#### I5 `DELETE /v1/gacha/items/delete/{id}`: soft delete
- Find by id **without** the deleted filter. Missing → 404 `"Resource not found: Gacha item not found"`. Then set `deleted_at=now` and `updated_at=now`. Deleting an already-deleted item returns 200 and re-stamps `deleted_at`.
- 200 `{"message":"Gacha item deleted","version":"0.3.0"}`.
- Pool rows (`gacha_rolls`) that point at the item are **not** touched, so the deleted item can still be won (§3).

#### R1 `GET /v1/gacha/rolls/detail/{id}`: one pool entry
- `SELECT … FROM gacha_rolls WHERE id=$1 AND is_deleted=false`. Missing → **404** `"Resource not found: Gacha roll not found"`.
- 200:
  ```json
  {"data":{"id":"<uuid>","user_id":"<creator uuid>","gacha_id":"default","item_id":"<item uuid>",
           "weight":1.0,"quantity":10,"is_deleted":false,
           "created_at":"2025-03-01 12:34:56.123456","updated_at":"2025-03-01 12:34:56.123456"},
   "version":"0.3.0"}
  ```
  `weight` is an f32 serialized with its shortest round-trip form: the JSON number `1.0` (serde prints `1.0`; JS receives `1`), and 0.1f32 prints as `0.1`. `created_at` and `updated_at` are NaiveDateTime strings or `null`.

#### R2 `POST /v1/gacha/rolls/create`: add a pool entry
- Body: `{"item_id": string (UUID), "weight": f32, "quantity": i32}`, all required, no range checks.
- Flow: guard → resolve the current user → parse `item_id` (failure → **400** `"Bad request: Invalid item_id UUID: …"`) → insert `id`=v4, `user_id`=caller, `gacha_id`=`"default"`, `item_id`, `weight`, `quantity`, `is_deleted`=false, `created_at`=`updated_at`=now (naive UTC).
- The item's existence is not checked in code. The FK (if present) makes a bad id → 500. A soft-deleted item is accepted.
- 201 `{"message":"Gacha roll created","version":"0.3.0"}`. The id is not returned.

#### R3 `POST /v1/gacha/rolls/execute`: **spend 1 credit and roll**
- Request: no body.
- Algorithm: see §3.1.
- 200 `{"data": <GachaRollItemDto of the WINNING POOL ENTRY>, "version":"0.3.0"}`. The shape is the same as R1. The winning item is `data.item_id`. `data.user_id` is the **pool-entry creator, not the roller**. Neither the claim id nor any item details are returned.
- Errors:
  - 400 `"Bad request: No credit record found"` (no credits row; note the 400 here, whereas C3 uses 404).
  - 400 `"Bad request: Not enough credits to perform this action"` (`available_rolls <= 0`).
  - 400 `"Bad request: No extra roll credits remaining"` (race between the check and the consume).
  - 404 `"Resource not found: No credit record found"` (row disappeared between the check and the consume).
  - 404 `"Resource not found: No rollable item available"` (empty pool; the credit is refunded).
  - 500 on a DB error (the credit is refunded on a claim insert failure).
  - 401 / 403 / 404 `User not found`.

#### R4 `DELETE /v1/gacha/rolls/delete/{id}`: soft delete a pool entry
- Find by id **without** the `is_deleted` filter. Missing → 404 `"Resource not found: Gacha roll not found"`. Then set `is_deleted=true` and `updated_at=now`. Idempotent: it returns 200 when the entry is already deleted.
- 200 `{"message":"Gacha roll deleted","version":"0.3.0"}`.
- `Delete Gacha Rolls` is not seeded, so in practice only Administrator can call this.

#### L1 `GET /v1/gacha/claims/detail/{id}`
- Flow (`GR/gacha_claims/infrastructure/persistence/postgres_gacha_claim_repository.rs:34-84`):
  1. Load the claim by id **without** the `deleted_at` filter. Missing → **404** `"Resource not found: Gacha claim not found"`.
  2. Load the user through `user_lookup_service.get_user_by_id(claim.user_id)`. Any failure, **including not found**, → **500** `"Internal server error: Failed to fetch user: <ServiceError>"`.
  3. Load the item by id **without** the deleted filter. Missing → **404** `"Resource not found: Gacha item not found"`.
- 200:
  ```json
  {"data":{
     "id":"<claim uuid>",
     "user":{ "id":"<uuid>",
              "role":{"id":"<uuid or ''>","name":"User","is_deleted":false,
                      "permissions":[{"id":"<raw string>","name":"<same raw string>","created_at":null,"updated_at":null}],
                      "created_at":null,"updated_at":null},
              "fullname":"First Last", "legal_name":null, "email":"a@b.c", "avatar":null|"url",
              "is_active":true, "profile_extension":{…}  /* key omitted when absent */,
              "created_at":"<rfc3339>", "updated_at":"<rfc3339>" },
     "item":{"id":"…","name":"…","is_deleted":false,"created_at":"<rfc3339>","updated_at":"<rfc3339>"},
     "is_deleted":false,
     "created_at":"<rfc3339>","updated_at":"<rfc3339>"},
   "version":"0.3.0"}
  ```
  - `user` is `UsersDetailItemDto` (`imphnen-iam/src/users/infrastructure/http/dto.rs:74-86`), built from `model_to_dto` (`imphnen-libs/src/services/dto.rs:38-95`).
  - `fullname` = `trim(first_name + " " + last_name)`. `legal_name` is always null.
  - Role permissions are the raw strings stored in `app_roles.permissions`. Per the seeder these are UUIDs, so `name` is a UUID too.
  - A user with no role gets `role = {"id":"","name":"","is_deleted":false,"permissions":[],"created_at":null,"updated_at":null}`.
  - The IAM spec owns the canonical user DTO; reuse it.
  - Claim fields `claim_type`, `status`, `quantity`, `claimed_at` and `metadata` are **not** returned.
- **No endpoint returns a claim id**: R3 and L2 both return nothing identifying the claim, and no list endpoint exists. L1 is therefore unreachable from the product today.

#### L2 `POST /v1/gacha/claims/create`: manual prize grant
- Body: `{"user_id": string, "item_id": string}`, both required.
- Parse failures → **400** `"Bad request: Invalid user_id UUID: …"` / `"Bad request: Invalid item_id UUID: …"`.
- Insert: `id`=v4, `user_id`, `gacha_item_id`=item_id, `claim_id`=v4, `claim_type`=`"standard"`, `status`=`"claimed"`, `quantity`=1, `metadata`=NULL, `claimed_at`=`created_at`=`updated_at`=now, `deleted_at`=NULL.
- There are **no existence checks and no FKs**, so orphan rows are possible. No stock change and no credit change.
- 201 `{"message":"Gacha claim created","version":"0.3.0"}`.

---

## 3. Business rules

### 3.1 Roll execution (`GR/gacha_rolls/application/gacha_roll_service.rs:31-134`)

The steps run in this order, each against the DB **without a transaction and without row locks**:

1. **Credit pre-check**: `SELECT * FROM gacha_credits WHERE user_id=$u AND is_deleted=false LIMIT 1`.
   - None → 400 `No credit record found`.
   - `available_rolls <= 0` → 400 `Not enough credits to perform this action`.
2. **Consume** (same code as C3): re-select the row, then:
   - None → 404 `No credit record found`.
   - `<= 0` → 400 `No extra roll credits remaining`.
   - Otherwise `UPDATE gacha_credits SET available_rolls=<read-1>, updated_at=<now naive utc> WHERE id=$id`.
3. **Load the pool**: `SELECT * FROM gacha_rolls WHERE is_deleted=false AND quantity > 0`.
   - There is **no ORDER BY**, so the order is whatever Postgres returns. The order affects only which entry the fallback in step 4 picks, not the probabilities.
   - The pool is **global**: every user's (admin's) rows. It is not scoped by `gacha_id` and it does **not** join `app_gacha_items`, so pool rows whose item is soft-deleted can still win.
4. **Weighted pick** (`roll_once`):
   - `filtered` = rows with `!is_deleted && quantity > 0` (redundant with the SQL).
   - If empty → go to the refund in step 5.
   - `w_i = f64(weight_i as f32) * f64(quantity_i)`, and `total = Σ w_i`.
   - If `total <= 0.0`, for example when every weight is 0 or when negative weights cancel out: pick a **uniform** random index in `[0, len)`.
   - Otherwise draw `r` uniformly from **[0, total)** (`rand 0.9` `ThreadRng.random_range(0.0..total)`, a ChaCha12 CSPRNG). Walk `filtered` in order with `cum += w_i`, and return the first row where `r <= cum`.
   - Fallback: if the loop never returns, which can only happen with negative weights, return `filtered[0]`.
   - Effective probability: `P(i) = weight_i * quantity_i / Σ_j weight_j * quantity_j`. For example, A(weight 1.0, qty 10) and B(weight 0.5, qty 2) give P(A) = 10/11 and P(B) = 1/11.
   - Negative weights are accepted by R2 and distort the math. No NaN or Infinity can arrive through JSON.
   - A `weight` of 0 with a positive quantity makes the entry unwinnable, unless all entries are 0, in which case the pick is uniform.
5. **Empty pool**: `add_credit(user, 1)` (read-modify-write +1; **its error is ignored**), then return 404 `No rollable item available`.
6. **Record the win**: insert into `app_gacha_claims` with `user_id`=roller, `gacha_item_id`=`selected.item_id`, `claim_id`=v4, `claim_type`=`"roll"`, `status`=`"claimed"`, `quantity`=1, `metadata`=NULL, all three timestamps=now (tz). On an insert error: `add_credit(user, 1)` (error ignored), then return the insert error (500).
7. Return the selected `gacha_rolls` row.

Things the roll does **not** do (it is important to reproduce them, or to consciously change them):
- It does **not** decrement `gacha_rolls.quantity` or `app_gacha_items.stock`. Stock is never consumed. `quantity` is purely a weight multiplier, and a prize can be won unlimited times.
- It does **not** use `app_gacha_items.weight`, `stock`, `rarity`, `is_limited` or `value`.
- There is no pity counter, no per-user limit, no cooldown, no time window (the "Periode Gacha" text on the frontend is static copy), and no idempotency key.
- It writes no audit log and sends no email.

**Concurrency.** Every credit mutation is a read-modify-write that writes an absolute value.
- N concurrent `/execute` calls with `available_rolls = 1` can all pass the check and all write `0`, producing N claims for 1 credit (a double-spend).
- Concurrent `add` calls lose updates.
- The refund is also read-modify-write.
- A TypeScript port **should** use a single conditional update: `UPDATE … SET available_rolls = available_rolls - 1 WHERE id=? AND available_rolls > 0 RETURNING available_rolls`, with zero rows affected treated as the "not enough credits" case. It should also make "decrement + insert claim" atomic (a D1 `batch()`). This is a deliberate fix; flag it to the owner (§5).

### 3.2 Credit granting
- The only code path that increases credits is C2 `/credits/add`. It is **self-only**: it adds to the caller resolved from the JWT. It requires `Create Gacha Items`, which only Administrator holds among the seeded roles.
- The refund inside execute is the only other increase.
- In practice, regular users can get credits only through a direct DB insert or update. There is no purchase, payment, or webhook integration.
- A user without a row is treated as having 0 credits (C1 synthesizes the zero response). The first `add` creates the row.

### 3.3 Claims flow
- Claims are created automatically by R3 (`claim_type="roll"`) or manually by L2 (`claim_type="standard"`).
- `status` is always `"claimed"`. No state machine exists: no "shipped" or "fulfilled" state, no update endpoint, no list endpoint.
- The backoffice has a static "process item / send prize" modal (`apps/backoffice/src/routes/_authenticated/_components/prizes/modal-process-item.tsx`) with no backend.

### 3.4 Soft-delete semantics
| Table | Mechanism | Read filters | Delete endpoint |
|---|---|---|---|
| items | `deleted_at` | list and detail filter `deleted_at IS NULL`. Update pre-checks the filter. Delete and claim-detail do not filter. | I5 |
| rolls | `is_deleted` | detail and pool filter. Delete does not. | R4 |
| credits | `is_deleted` | all queries filter | none |
| claims | `deleted_at` | claim detail does NOT filter | none |

---

## 4. Frontend callers

The client lives in `packages/service/src/api/gacha/index.ts` (axios, `baseURL = getBaseURL()`, paths include `/v1`). React Query hooks live in `packages/service/src/hooks/gacha/index.ts`. Types live in `packages/service/src/types/gacha/index.ts`.

| Endpoint | API fn / hook | Used by (app/file) | Mismatch with backend |
|---|---|---|---|
| C1 GET `/credits` | `getUserCredits` / `useUserCredits` | `apps/gacha/src/routes/index.tsx:28` (shows "Roll tersisa") | Fired even when logged out → 401 (harmless) |
| C2 POST `/credits/add` | `addCredits` / `useAddCredits` | **no app uses it** | FE expects `data: TGachaCreditDto`; BE returns `{message}` |
| C3 POST `/credits/consume` | `consumeCredit` / `useConsumeCredit` | **no app uses it** | none |
| I1 GET `/items` | `getGachaItemList` / `useGachaItemList` | `apps/gacha/src/routes/index.tsx:29` (`per_page:10`); `apps/backoffice/.../gacha-roll.tsx:49` (`search, page, per_page`); `.../dashboard.tsx:68` (`per_page:9`); `.../gacha-roll_/$id.tsx:22` and `.../dashboard_/$id.tsx:22` (`per_page:100`, then a client-side find by id) | FE sends `search` without `search_fields`, **so search is a no-op**. FE type has `order`; BE reads `sort_direction`. The edit pages read `item.stock` and `item.weight`, **which the list DTO does not contain** (they are `undefined`). |
| I2 GET `/items/detail/{id}` | `getGachaItemById` / `useGachaItemById` | **no app uses it** | none |
| I3 POST `/items/create` | `createGachaItem` / `useCreateGachaItem` | `apps/backoffice/.../gacha-roll_/create.tsx:26` (weight = "chance rate" 0.1–1, stock = quantity, `type_:'physical'`, `rarity:'common'`, `category:'merchandise'`, `value:0`, `description:''`, `item_code = slug(name)`); `.../dashboard_/create.tsx:26` (weight 1) | FE expects `data`; BE returns `{message}`, so the mutation result is `undefined`. A duplicate name gives a duplicate `item_code` → 500. **Items created here never enter the roll pool** (the pool is `gacha_rolls`). |
| I4 PUT `/items/update/{id}` | `updateGachaItem` / `useUpdateGachaItem` | `.../gacha-roll_/$id.tsx:44` sends `{name, weight, stock}`; `.../dashboard_/$id.tsx:42` sends `{name, stock}` | **Always fails with 400** (`missing field \`item_code\``) because BE requires the full body. The FE type makes every field optional. |
| I5 DELETE `/items/delete/{id}` | `deleteGachaItem` / `useDeleteGachaItem` | `.../gacha-roll.tsx:54`, `.../dashboard.tsx:69` | none |
| A1 GET `/admin` | none | none | BE-only duplicate |
| R1 GET `/rolls/detail/{id}` | `getGachaRollById` (no hook) | none | none |
| R2 POST `/rolls/create` | `createGachaRoll` (no hook) | **none**: no UI populates the pool | FE expects `data`; BE returns a message |
| R3 POST `/rolls/execute` | `executeGachaRoll` / `useExecuteGachaRoll` | `apps/gacha/src/routes/index.tsx:30,53` | FE finds the won item's name with `gachaItems.find(i => i.id === result.item_id)` over the **first 10 items only**, and falls back to `'item'` otherwise |
| R4 DELETE `/rolls/delete/{id}` | `deleteGachaRoll` (no hook) | none | none |
| L1 GET `/claims/detail/{id}` | `getGachaClaimById` (no hook) | none | FE `user` type is a subset (fine) |
| L2 POST `/claims/create` | `createGachaClaim` / `useCreateGachaClaim` | **no app uses it** | FE expects `data: TGachaClaimDetailDto`; BE returns a message |

**Frontend calls with no backend route:** none. Every path in `api/gacha/index.ts` exists in the backend.

Related gaps:
- `apps/landing/src/openapi-types.ts` (generated from Swagger) omits `/credits*`, `/rolls/delete` and `/admin`.
- `packages/service/src/schemas/gacha/index.ts` has a `foto` (image) field, and git history contains "add image url to gacha DTO". **The current backend has no image field.**
- `packages/service/src/constants/permissions.ts` lacks `Delete Gacha Rolls`.

**Recommended compatibility stance for the port:** keep the paths and envelopes. Returning `data` on create, update and add (in addition to `message`) is backward compatible and fixes the FE. Either accept partial PUT bodies (PATCH semantics) or fix the FE; decide with the owner (§5).

---

## 5. Open questions, oddities and bugs

1. **The pool and the item catalogue are disconnected.** The backoffice "Gacha Roll" UI edits `app_gacha_items.weight` and `stock` as "chance rate" and "quantity". The roll algorithm reads only `gacha_rolls.weight × quantity`, and nothing in the UI calls `/rolls/create`. Should the port roll directly over items (`weight × stock`, excluding deleted items and stock ≤ 0, decrementing stock)? The product decision is needed before implementation.
2. **Stock is never decremented.** Prizes are effectively infinite. Is that intended?
3. **The credit double-spend race and lost updates** (§3.1). Should the port fix them (recommended) or reproduce them?
4. **Credits have no admin grant path.** `/credits/add` credits only the caller. How are credits issued in production (manual SQL)? Is an admin "grant to user X" endpoint expected?
5. **Credits permissions reuse item permissions** (`Read Detail`, `Create` and `Update Gacha Items`). Should they keep these strings or get dedicated ones? Changing them requires a role-data migration.
6. **`Delete Gacha Rolls` has the placeholder id `12345678-ABCD-EFAB-CDEF-0123456789AB`** (uppercase) and is not seeded. Any UUID normalization (lowercasing) in the TS permission check would break equality if a role ever stores it.
7. **Is the prod schema really what `create_schema` produces?** There are no defaults, `metadata` is `json`, there is no unique `user_id` on credits, and there are no FKs on claims. Run `\d+` on the four tables before writing D1 or Drizzle migrations. `create_schema` is destructive (it drops with CASCADE).
8. **Timestamp inconsistency.** Credits and rolls use `timestamp` without tz and serialize as `"YYYY-MM-DD HH:MM:SS.ffffff"`. Items and claims use `timestamptz` and serialize as RFC 3339 with `+00:00`. The FE does not parse these, so normalizing is probably safe, but the change should be confirmed.
9. **The execute response returns the pool row**, including the admin's `user_id`, not the claim or the item. The FE resolves the item name client-side from a 10-item page.
10. **No claim id is exposed anywhere**, so `/claims/detail/{id}` is unreachable. L1 returns 500 (not 404) when the claim's user is missing.
11. **Error code inconsistencies:** duplicate `item_code` gives 500 instead of 409; "No credit record found" is 400 in execute and 404 in consume; bad query params return a text/plain 400.
12. **Search is broken:** it needs `search_fields`, and it is a case-sensitive `LIKE` without wildcard escaping. The utoipa doc advertises `order`, but the real param is `sort_direction`.
13. **PUT is full-replace** and resets `metadata` to NULL when omitted. The FE sends partial bodies, so every backoffice edit currently fails with 400.
14. **The list DTO lacks the business fields** (`stock`, `weight`, `rarity` and so on), so the backoffice edit form cannot prefill.
15. **Negative or zero values are accepted everywhere** (amount, weight, quantity, stock, value). Negative pool weights break the weighted pick. i32 overflow on `add` wraps in release builds.
16. **`clear_db.rs` uses the wrong table names** for items and claims. `seed_gacha_rolls` is not idempotent: it adds two pool rows per run.
17. **Auth nit:** the middleware says "User not found or inactive" but never checks `is_active` or `deleted_at`. `extract_email` assumes `sub` is an email, so tokens whose `sub` is a UUID (`generate_jwt`, `mk_token`) get 404 `User not found` on credits and rolls create/execute. The reset-password token is signed with the access secret, making it a valid access token (a cross-cutting IAM issue).
18. **JSON bodies are validated before permissions** (extractor ordering). Keep this only if exact error parity matters.

---

## 6. Porting notes for D1 / Drizzle (target `apps/api`)

- **Type mapping:**
  - uuid → `text` (lowercase canonical, except the uppercase `DeleteGachaRolls` id in permission data).
  - `timestamptz` / `timestamp` → `text` (ISO) or `integer` (ms). Re-create the two serialization formats in §2.1 at the DTO layer if parity is required.
  - `json` → `text` with `mode: 'json'`.
  - `double precision` / `real` → `real`. For byte parity, emulate f32 rounding of `gacha_rolls.weight` with `Math.fround` when storing or returning; D1 has no float4.
  - `boolean` → `integer` with `mode: 'boolean'`.
- **Randomness:** use `crypto.getRandomValues` to build a uniform double in [0,1) (53 bits), multiplied by `total`. Keep the `r <= cum` comparison and the uniform fallback when `total <= 0`.
- **Atomicity:** D1 has no `SELECT … FOR UPDATE`. Use conditional `UPDATE … WHERE available_rolls > 0 RETURNING`, and group "decrement credit + insert claim" with `db.batch([...])`, which runs as one transaction in D1. Replace the ignore-errors refund with this atomic path.
- **Uniqueness:** keep `UNIQUE(item_code)`. Consider adding `UNIQUE(user_id) WHERE is_deleted = 0` on credits (a partial index is supported in SQLite) to make "one balance per user" real. Confirm first that prod has no duplicates.
- **`version` field:** every JSON envelope carries `"version": "0.3.0"`. Source it from `@app/version` or pin it for parity.
