# Effect services in `apps/api`

The rule is in `.claude/skills/ts-conventions/SKILL.md`: a service is a `Context.Service` tag
declared as a `const`, an error is a `Schema.TaggedError` class. This file is the reasoning behind
it, which belongs here rather than in the ruleset, and it is also the answer to "surely those two
should be consistent".

Read `node_modules/effect/AGENTS.md` first for anything else. It ships with the installed v4 package
and therefore describes the exact API in this repository, which general Effect knowledge does not.

## Why a service is a const

Effect v4 ships a functional overload of `Context.Service` (`dist/Context.d.ts:239`) alongside the
class one (`:290`), and the runtime lookup token is the key string, not the class. Both forms return
the same object with `self.key = key`, and every lookup is `lookup(self, key.key)`
(`src/Context.ts:394-417`, `:681`). Effect's own modules use the const form: `HttpClient`,
`HttpRouter`, `HttpServerRequest`, `AtomRegistry`.

`of`, `use`, `useSync` and `context` are declared on `interface Service`
(`dist/Context.d.ts:90-95`), so `Tag.of(...)` and `Tag.use(...)` work identically on the const form.

What the const form cannot carry is a `static readonly layer`, because the functional overload's
options parameter is `{}`. The layer is therefore a sibling export in the same file:

```ts
export const noteRepoLayer = Layer.effect(NoteRepo, ...);
```

Three things stay non-negotiable:

- The shape is a separately named `type TXxx = {...}`, suffixed `Shape` when a same-named `T` type
  already exists (`TAuthServiceShape`, `TActivityRepoShape`)
- The identifier is a phantom `type TXxxId = TServiceId<typeof SERVICE_TAG.XXX>`. With one type
  argument `Identifier` defaults to `Shape`, and two structurally identical services would become
  interchangeable in the `R` channel
- The tag id comes from the shared `SERVICE_TAG` or `REPO_TAG` constant, never a literal

## Why an error is still a class

`Schema.TaggedError`'s overloads return
`[Self] extends [never] ? MissingSelfGeneric<"Schema.TaggedError"> : Class<...>` (`dist/Schema.d.ts`),
so TypeScript hands you a string telling you to use a class. The value is a constructor carrying
`Error`'s prototype chain, which is what makes `return yield* new ENotFound({...})` work.

That is the whole distinction: a service's identity is a string, so it can be a const; an error's
identity is a constructor, so it cannot.
