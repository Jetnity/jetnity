# Admin Account Counts App Toolchain PATH Fix 1

Date: 2026-09-26
Status: ACTIVE / BOUNDED LOCAL-HARNESS REPAIR / DO NOT READY / DO NOT MERGE
Base: `58962638d4b3b55824497d9b77ad5b3f75025168`
Branch: `fix/admin-account-counts-app-toolchain-path-1`

## Trigger

Authorized real Apple-Silicon Mac full acceptance run on exact main `58962638d4b3b55824497d9b77ad5b3f75025168`.

Run id:
`aaclr1-20260926T142727Z`

Observed sequence:
- official pinned Supabase CLI 2.117.0 archive/binary verification succeeded far enough to execute the real local stack path;
- local Supabase services started;
- owned cleanup later stopped the local stack;
- application preparation failed at locked dependency installation with:
  `Error: spawnSync npm ENOENT`
- failure receipt:
  `docs/evidence/admin-account-counts-local-runtime-1/aaclr1-20260926T142727Z-failure.json`

This is a local acceptance-harness blocker, not a Production incident and not a hosted Supabase failure.

## Verified root cause

In `scripts/e2e/admin-account-counts-local-runtime-1/runtime.mjs`, after the stack and local DB/GoTrue setup, the app environment is built with:

`baueRuntimeAppUmgebung({ parentEnv: {}, ... })`

and the owned app launch is also given:

`parentEnv: {}`

The accepted environment guard only preserves an explicit allowlist:
`PATH`, `LANG`, `LC_ALL`, `TZ`.

Because the runtime passes an empty parent environment, the isolated app environment has no `PATH`.

`defaultInstallLockedDependencies()` then correctly executes:
`npm ci --no-audit --no-fund`

but `execFile('npm', ...)` cannot resolve npm and fails with ENOENT.

The surrounding security model already rebuilds the child environment from an allowlist and strips Docker/Auth/provider/model/hosted variables. The fix must preserve that model.

## Goal

Provide the isolated app preparation/launch path with the already-sanitized local runtime toolchain PATH without inheriting arbitrary parent secrets or remote connection state.

## Required design

1. Do NOT pass raw `process.env` into the app path.
2. Reuse the already-sanitized runtime environment available to `defaultStartRuntime` (`childEnv`) as the source for `baueRuntimeAppUmgebung`.
3. The app environment builder remains authoritative:
   - only allowlisted PATH/LANG/LC_ALL/TZ may survive;
   - Docker variables are removed;
   - NODE_OPTIONS / NODE_PATH / NODE_PRELOAD / NODE_EXTRA_CA_CERTS are absent;
   - hosted Supabase credentials/tokens/provider/model/SMTP/Vercel markers remain absent;
   - only local numeric loopback Supabase URL + synthetic local anon key are added.
4. Apply the same sanitized parent source consistently to initial app launch and restart/controller options. Do not create an initial/restart PATH mismatch.
5. Do not resolve `npm` through shell execution, do not use `sh -c`, do not hard-code user paths, and do not copy npm credentials/config.
6. Existing private HOME and offline/no-script npm protections remain:
   - run-owned HOME;
   - run-owned NPM cache;
   - `npm_config_offline=true`;
   - `npm_config_ignore_scripts=true`.
7. Keep locked install `npm ci --no-audit --no-fund`.
8. Preserve Docker publish shim, CLI identity/pins/archive binding, Docker endpoint selection, #564 runtime binding inspection, SQL/migrations, Auth semantics, browser contract, cleanup ownership and Production boundaries unchanged.

## Required tests

Add or strengthen controlled tests proving:

- sanitized runtime PATH containing a fake npm/bin directory survives into the app env;
- forbidden parent values do NOT survive even when supplied in the sanitized-source candidate;
- Docker connection variables are removed from app env;
- NODE_OPTIONS and other denied Node variables remain absent;
- initial app preparation and restart/controller path use the same sanitized PATH source;
- `defaultInstallLockedDependencies` can resolve a controlled fake `npm` through the resulting PATH;
- missing npm still fails closed;
- existing full helper suite remains green.

Do not weaken existing tests.

## Execution boundary

Cursor may run controlled Node tests and normal exact-head CI/Preview.

Cursor MUST NOT:
- run real Docker;
- run the Product Owner Mac full acceptance;
- execute hosted Supabase mutations;
- apply Production migrations/RLS/grants;
- activate account-count Production functionality;
- change Auth, provider, payment, secret, domain or recurring-cost state.

## Scope

Allowed:
- `scripts/e2e/admin-account-counts-local-runtime-1/runtime.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/app.mjs` only if a narrowly required safety/helper change is necessary
- `scripts/e2e/admin-account-counts-local-runtime-1/env.mjs` only if a narrowly required testable contract change is necessary
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
- this slice STATUS/HANDOFF/SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md` continuity only

Forbidden:
- product/runtime app code outside this E2E harness
- package/lock/root CI
- Supabase SQL/migrations/config
- Auth/RLS
- Docker global/Desktop settings
- provider/payment/domain/secrets

## Agent

Logical name: **Jetnity admin account counts app toolchain path 1**
Generation: **1**
Required model: **cursor-grok-4.6-high-fast**

## STOP

Do not mark Ready.
Do not merge.
Do not start a follow-up slice.
STOP for independent Technical-Lead exact-head review.
