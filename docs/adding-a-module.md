# Adding a module

`apps/api` is organised by module, not by layer, so a new capability is a new directory under
`src/`, not a new file in a shared one. `role` and `user` are the reference implementations, so read them alongside this list.

Nothing here is discoverable from the directory tree alone, which is the reason the list exists. A
module that is written but not registered compiles and does nothing.

## Inside `apps/api/src/<module>/`

| Path | Holds |
|---|---|
| `domain/<module>.ts` | The row type and the port type (`TUserRepo`), no Effect program |
| `application/<module>-<use-case>.ts` | One `Effect.fn("name")(function* ...)` per use case, one file each |
| `application/to-<module>-dto.ts` | Row to wire shape, so the router never maps by hand |
| `infrastructure/<module>-repository.ts` | The Drizzle implementation and its `Layer` |
| `presentation/<module>-router.ts` | The oRPC handlers for the module's contract, each built from `permissionGuarded(...)` in `platform/orpc/implementer.ts`. Method, path, input and output come from `@app/contract`, so a procedure that is not declared there cannot be implemented here |
| `index.ts` | The only surface other code may import: `{ layer, routerBuild }`. Its type is written out on purpose: an inferred object would pull the router types in, and those reach back to the composition root through the request context, which is a cycle TypeScript refuses |

Use cases carry their own `*.test.ts` next to them, with the repository replaced by a fake layer.

## Register it

Five edits, none of them optional:

1. `packages/contract/src/<module>.ts`: declare every procedure with `oc.route(...)`, its input and
   its output, and add the object to `appContract` in `src/index.ts`. The web client is typed from
   this, so a procedure missing here is invisible to the web
2. `apps/api/scripts/architecture-rules.ts`: add the module to `MODULE`, and give it an entry in
   `MODULE_MAY_IMPORT`. An empty array is the right default; a module that imports nothing is a
   module that can be deleted on its own
3. `apps/api/src/bootstrap/compose.ts`: add `<module>Module.layer` to the composition. A module that
   needs only the platform joins the merged module layer; one that needs another module's service
   is provided with it there, in the composition root, never inside the module
4. `apps/api/src/bootstrap/router.ts`: add `<module>: <module>Module.routerBuild()`. The router is
   built with `implementer.router(...)`, so a contract key with no implementation is a type error
5. `apps/api/src/shared/repo-tags.ts`: add the repository tag id. It is a constant, never a literal
   at the `Context.Service` call

`moon run api:arch` fails on a module that is missing from the rules, and `api:build` depends on it,
so a forgotten step 2 stops CI rather than shipping.

## Shared packages it touches

| Package | What the module adds |
|---|---|
| `@app/schemas` | `src/<module>/`: the zod input and output schemas, exported from the package index. Both the contract and the web import these, so the wire shape has one definition |
| `@app/contract` | `src/<module>.ts`: the procedures, each with its method, path, input and output. The API implements it and the web client is typed against it, so neither side depends on the other |
| `@app/messages` | `src/<module>/message.ts`: a `SCREAMING_SNAKE` const object for every user-facing string |
| `@app/permissions` | `permissions.ts` for the keys, `roles.ts` to grant them to a fixed role. A key is `<resource>:<action>` in this app and `<app>:<resource>:<action>` in any other app of the workspace. The text the role editor shows lives in `@app/messages`, in `permission/labels.ts` |
| `@app/activity` | `actions.ts` for the resource type and the action keys. An action is `<resource>.<action>` in this app and `<app>.<resource>.<action>` in any other app. Its label lives in `@app/messages`, in `activity/message.ts` |

## Database

The table lives in `apps/api/src/platform/db/tables/<module>.ts` and is re-exported from
`db/schema.ts`. Generate the migration with `moon run api:db-generate`, never by writing SQL by hand. D1 is SQLite:
there are no interactive transactions, so a write that must be atomic goes through `db.batch([...])`
or a single conditional `UPDATE ... WHERE`, never read-then-write across two awaits.

## Web

The apps call the API through the typed oRPC client in `packages/service`. A feature keeps its data
access in a hook (`useQuery` / `useMutation` over the client) and its components render only.
