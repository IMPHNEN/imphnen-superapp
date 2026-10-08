## Type

<!-- one: new feat | refactor | fix | chore -->

- [ ] New feature / Refactor / Bug fix / Chore

## Summary

<!-- One short paragraph: what this PR does and why. Keep it concise; this is what appears in reports. -->

## Changelog

<!-- Human-readable, one verb-leading bullet per line. No implementation detail. For reporting. -->

- Added ...
- Refactored ...
- Fixed ...

## Migration / Env

<!-- Schema, env vars, or infra changes required. Write "None" if not applicable. -->

- [ ] D1 migration / schema change (generated with `moon run api:db-generate`, applied by the deploy)
  - [ ] It is additive, or it is the contract phase of an expand and contract whose expand phase is already deployed
- [ ] New or renamed env vars, bindings or secrets (`wrangler.jsonc` + `moon run api:types`, app `.env.example`)
- [ ] Infra / config change
- [ ] None

Notes: ...

## Breaking Changes / Feature Impact

<!-- Behavior that changes for existing users/callers, or a new capability unlocked. Write "None" if not applicable. -->

- None

## Version

<!-- Every PR bumps the root package.json version: patch for fix/chore/docs, minor for feature/refactor, major for breaking. It is what /health serves on the API. Tag `vX.Y.Z` after merge. -->

- [ ] Root `package.json` version bumped: `0.0.0` -> `0.0.0`

## Verification

- [ ] `moon run :typecheck` passes
- [ ] `moon run :check` passes
- [ ] `moon run :test` passes
- [ ] `moon run <app>:build` passes

## Follow-up

<!-- Anything intentionally out of scope. Write "None" if not applicable. -->
