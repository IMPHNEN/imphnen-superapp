---
name: ts-conventions
description: Apply this project's TypeScript conventions. Load this BEFORE writing or editing any .ts/.tsx file in this repo, including a one-line change, and re-check it before calling the work done. Covers the React component signature (`const X: FC<TProps> = (props): ReactElement =>`, props read as `props.x`), arrow functions only (no `function` keyword except generators), no plain strings (user-facing copy in @app/messages, domain keys in shared const objects), 200-line file limit, logic/UI separation, T/I/E naming prefixes, ts-pattern for conditionals, ts-belt for arrays/objects, Effect for apps/api business logic, explicit return types everywhere, and no em dashes anywhere in the repository.
---

# TypeScript conventions

Non-negotiable rules for every `.ts`/`.tsx` file written or edited in this project.

Read the whole file before writing code, and run through it again before calling the work done; the rule most often missed on the second pass is **no plain strings**, immediately below.

## React component signature

Every component is written exactly like this:

```tsx
const UsersPage: FC = (): ReactElement => { ... };

export const UserTable: FC<TUserTableProps> = (props): ReactElement => {
	return match(A.isEmpty(props.users)) ...
};
```

Three parts, all required:

1. The const carries `FC`, or `FC<TProps>` when the component takes props
2. The return type `ReactElement` is still written out, even though `FC` implies it
3. **Props are never destructured in the parameter list.** The parameter is a single `props`, and values are read as `props.users`

The one case that destructures is a props type with defaults or a rest element, where the destructuring moves to the first line of the body and the rest element is named `rest`, never `props`:

```tsx
export const Guard: FC<TGuardProps> = (props): ReactElement => {
	const { permissions, mode = "all", fallback = null, children } = props;
	...
};

const Card: FC<ComponentProps<"div">> = (props): ReactElement => {
	const { className, ...rest } = props;
	return <div className={cn("...", className)} {...rest} />;
};
```

This applies to the shadcn/ui primitives in `packages/components/src/ui/` too, which arrive from upstream with destructured parameters and must be converted by hand.

## Arrow functions only

Every function is an arrow function assigned to a `const`. The `function` keyword is not used: not for React components, not for route pages, not for default-exported helpers.

```ts
const HealthPage = (): ReactElement => { ... };

const globalSetup = async (): Promise<void> => { ... };
export default globalSetup;
```

**The one exception is generators**, and it is a language limit rather than a style choice: an arrow function cannot be a generator. Effect's idioms therefore keep the keyword, and converting them is an error:

```ts
export const noteCreate = Effect.fn("noteCreate")(function* (input) { ... });
const program = Effect.gen(function* () { ... });
```

The shadcn/ui primitives in `packages/components/src/ui/` follow this rule too, so they differ from what `shadcn add` emits upstream; convert any newly added component by hand before committing it.

## No plain strings

Every string that carries meaning is named by a shared constant and referenced from there. A literal typed directly into a file is a bug waiting for the day someone changes it in three places out of four.

Two categories, two homes:

**User-facing copy** (labels, status text, error messages, empty states, button text) lives in `@app/messages`, one `SCREAMING_SNAKE` const object per feature in `packages/messages/src/<feature>/message.ts`, declared `as const` and re-exported from the package index.

```ts
export const HEALTH_MESSAGE = {
	STATUS: "Status",
	STATUS_OK: "Ok",
} as const;
```

Components and hooks import the constant. They never contain the sentence itself.

**Domain keys and enum-like values** (statuses, role keys, permissions, `Context.Service` tag ids, env keys, queue names) live in a shared const object near their domain, with the union type derived from it:

```ts
export const HEALTH_STATUS = { OK: "ok", READY: "ready" } as const;
export type THealthStatus = (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS];
```

Reference the constant at **every** call site, including the places that look too small to matter and are exactly where literals survive:

```ts
z.literal(HEALTH_STATUS.OK)                          // not z.literal("ok")
match(status).with(HEALTH_STATUS.OK, () => ...)      // not .with("ok", ...)
{ status: HEALTH_STATUS.OK }                         // not { status: "ok" as const }
```

That last set matters because TypeScript does not protect you here: rename the value and a stale `.with("ok", ...)` arm still compiles, silently never matching.

**Exempt:** Tailwind class strings inside `className`, and route paths handled by the router's own typed API. Those are styling and framework syntax, not named values, and constant-ising them makes the code worse.

**Two catalogues are shared by every app in the workspace**, and their keys have a fixed shape so a second app can add to them without colliding with the first:

- A permission key is `<resource>:<action>` in the central app (`note:read`, `user:update`) and `<app>:<resource>:<action>` in any other app. Lower-case, a hyphen inside a segment if needed, never a space. The key goes in `PERMISSION` in `@app/permissions`, its label in `PERMISSION_LABEL` in `@app/messages`, and a grant in `ROLE_PERMISSIONS` when a fixed role should hold it
- An activity action is `<resource>.<action>` in the central app (`note.create`, `user.password_reset`) and `<app>.<resource>.<action>` in any other app. The resource type goes in `ACTIVITY_RESOURCE_TYPE` and the action in `ACTIVITY_ACTION`, both in `@app/activity`, with the labels in `ACTIVITY_ACTION_LABEL` and `ACTIVITY_ENTITY_LABEL` in `@app/messages`

## File size

200 lines max per file. Split by responsibility (one use case, one component, one repository per file), not by mechanically chopping a large file in half.

## Separate logic from UI

Components render. Nothing else.

- Data fetching, mutations, derived state, and business logic live in a hook or use-case file, never inline in JSX
- A route's `_components/*.tsx` renders; its `_hooks/*.ts` owns the data

```
note-list.tsx      -> renders <ul>, no useQuery/useMutation calls
use-notes.ts        -> useNoteList(), useNoteCreate(), useNoteDelete()
```

## No comments

Code has to read clearly enough that a comment adds nothing. Rename the variable, extract the function, or restructure the condition instead of explaining it.

- No `//` or `/* */` explaining what code does
- No JSDoc restating a signature that's already typed
- If something genuinely needs documenting (a non-obvious external constraint, a workaround), it belongs in the PR description or a README, not the source file

## No em dashes

The rule and the rewrites that replace it are in `AGENTS.md`, and they cover source files too. Placeholder text for an empty value uses a plain hyphen (`NOT_SET = "-"` in `@app/format`).

## Naming prefixes

- `T` for anything declared with `type`: `TNote`, `TCreateNoteInput`, `TNoteRepo`, `TSession`, `TDbService` (the plain shape behind a `Context.Service`, see below). An object-shaped `type` alias is still a `type`, so it gets `T`, never `I`
- `I` only for a literal `interface` declaration, which is rare here; the one legitimate case is declaration-merging into a third-party module (`interface Register` for TanStack Router)
- `E` for enums, and for `Schema.TaggedError` classes: `EStatus`, `ERole`, `ENotFound`, `EDatabase`

Every type alias, interface, enum, and tagged error carries its prefix. No exceptions, no unprefixed `Note`/`Status`/`Repo`/`NotFound` names.

## No inline object types on inputs

A parameter is never typed with an object literal (`input: { title: string; body: string }`). Input shapes come from the zod schemas in `@app/schemas` (`TNoteCreateInput`, `TNoteUpdateInput`, `TNoteListInput`, `TPagination`), and a repo/port signature takes exactly that inferred type. Don't hand-write a domain twin of a schema type (`TNoteQuery` duplicating `TNoteListInput`); import the schema type. Values that aren't part of the wire input (an actor id from the session) travel as a separate parameter, not merged into a new object type.

```ts
create: (input: TNoteCreateInput, authorId: string) => Effect.Effect<TNoteRow, EDatabase>;
update: (input: TNoteUpdateInput) => Effect.Effect<TNoteRow | null, EDatabase>;
```

Never inline a raw string where a shared constant already names that value: a role, a permission, a `Context.Service` tag id, an env key. Reference `ROLE.ADMIN`, `SERVICE_TAG.DB`, etc., not `"admin"`/`"app/DbService"` repeated at each call site.

## ts-pattern for conditionals

Replace `if`/`else` chains, `switch`, and nested ternaries with `match(...).with(...).exhaustive()`. Use `.otherwise()` only when a fallback is intentional, never to paper over a missed case.

```ts
import { match } from "ts-pattern";

const label = match(status)
	.with("pending", () => "Pending")
	.with("done", () => "Done")
	.exhaustive();
```

A plain ternary for a single true/false branch is fine (`isLoading ? <Spinner /> : <Content />`); ts-pattern is for anything with more than one meaningful case.

**Exception, inside `Effect.gen`/`Effect.fn` bodies** (see below), error-raising control flow uses Effect's own idiom instead: a plain `if` guard that returns the failure, never `match`.

```ts
if (row === null) {
	return yield* new ENotFound({ message: NOTE_MESSAGE.NOT_FOUND });
}
```

This is what forcing ts-pattern here would fight: Effect's own style guide (shipped in the `effect` package as `AGENTS.md`/`CLAUDE.md`) requires exactly this shape so TypeScript can see the function won't continue past a raised error. Everywhere else (routers, hooks, components, oRPC middleware) ts-pattern stays the rule.

## Effect for apps/api business logic

`apps/api` is organised by module: `src/<module>/{domain,application,infrastructure,presentation}` with `src/shared/` and `src/platform/` alongside. A module is reachable only through its `index.ts`, and the boundaries are enforced by `moon run api:arch`. Those layers are built on [Effect](https://effect.website) (`effect@rc`, v4), not because it's trendy, but because it's the DI, error-typing, and composition mechanism for that layer. Read the actual guidance shipped with the installed package (`node_modules/effect/AGENTS.md` and `ai-docs/`) before writing Effect code, because it reflects the exact installed API, not general Effect knowledge, which drifts fast across major versions.

- **Errors** are `Schema.TaggedError` classes, not thrown exceptions: `application/shared/errors.ts` (`ENotFound`, `EForbidden`, `EDatabase`, ...). A use case fails with `return yield* new EError({...})`, never `throw`
- **Services** are `Context.Service` tags declared as a `const`, never a class: `export const NoteRepo = Context.Service<TNoteRepoId, TNoteRepo>(REPO_TAG.NOTE)`. The layer is a sibling `export const xxxLayer = Layer.effect(Xxx, ...)` in the same file, the shape is a separately named `type TXxx = {...}` (suffixed `Shape` when a same-named `T` type already exists), the identifier is a phantom `type TXxxId = TServiceId<typeof SERVICE_TAG.XXX>`, and the tag id comes from `SERVICE_TAG`/`REPO_TAG`, never a literal. Why a service is a const while an error is a class is in [`docs/effect-services.md`](../../../docs/effect-services.md)
- **Use cases** are `Effect.fn("name")(function* (input) {...})` programs that pull dependencies with `yield* SomeService`, never a hand-rolled `makeXxx(deps) => (input) => ...` DI pattern; Effect's own context resolution replaces that entirely
- **The oRPC boundary** (`platform/orpc/run-effect.ts`) is the only place an Effect program is run and crosses back into Promise-land: it catches every expected tagged error into a plain value *before* `runPromise` (so only real defects can reject the promise), then maps by `_tag` to an `ORPCError`
- Third-party Promise-based APIs that aren't Effect-aware (better-auth's `databaseHooks`, a callback-based queue consumer) are left as plain async functions at that exact seam, so wrap them in `Effect.tryPromise` on the Effect side rather than forcing the whole third-party surface through Effect
- Everything outside `apps/api`'s business-logic layers (React components/hooks, oRPC/Hono framework wiring, scripts) stays plain Promise/async-await, because Effect isn't a repo-wide requirement, it's scoped to where it's actually doing DI/error-typing work

## ts-belt for arrays and objects

Use `@mobily/ts-belt`'s `A` (array) and `D` (dict/object) modules instead of native `Array.prototype`/`Object.*` methods.

```ts
import { A, D } from "@mobily/ts-belt";

const titles = A.map(notes, (note) => note.title);
const found = A.find(notes, (note) => note.id === id);
const patched = D.merge(note, { title: "Updated" });
```

Native syntax is fine only where ts-belt has no equivalent: object/array literals, spread, destructuring.

## Explicit return types

Every function, arrow function, and method declares its return type. Never rely on inference: not for one-liners, not for anything exported, not for anything with a single return path.

```ts
const toLabel = (status: TStatus): string =>
	match(status)
		.with("pending", () => "Pending")
		.with("done", () => "Done")
		.exhaustive();
```
