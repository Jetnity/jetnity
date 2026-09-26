# Admin Account Counts Offline npm Cache Seed 1

Date: 2026-09-26
Status: IMPLEMENTATION FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / DO NOT READY / DO NOT MERGE
Base: `418f008f134d925edb45701a806b1a9bc17201c8`
Branch: `fix/admin-account-counts-offline-npm-cache-seed-1`

## Trigger

Authorized real Apple-Silicon Mac full acceptance run on exact main `418f008f134d925edb45701a806b1a9bc17201c8`.

Run id:
`aaclr1-20260926T144930Z`

Observed sequence:
- pinned official Supabase CLI 2.117.0 executed;
- local owned Supabase stack started;
- Docker publication safety progressed past the prior blockers;
- app toolchain PATH fix worked: `npm` was found and executed;
- locked install then failed with:
  `npm error code ENOTCACHED`
  `request to https://registry.npmjs.org/zod-validation-error/-/zod-validation-error-4.0.2.tgz failed: cache mode is 'only-if-cached' but no cached response is available`
- owned cleanup stopped the stack;
- failure receipt:
  `docs/evidence/admin-account-counts-local-runtime-1/aaclr1-20260926T144930Z-failure.json`

This is a local acceptance-harness dependency-cache blocker. It is not a Production incident.

## Current invariant

The isolated app environment intentionally sets:
- run-owned private HOME;
- run-owned `NPM_CONFIG_CACHE`;
- `npm_config_offline=true`;
- `npm_config_ignore_scripts=true`.

Those controls are correct and MUST remain.

The failure occurs because the new run-owned cache starts empty.

## Goal

Seed the run-owned private npm cache from the Product Owner Mac's existing local npm content-addressable cache without inheriting npm configuration, auth credentials, logs, or network access, then keep `npm ci` strictly offline and lockfile-bound.

## Required design

### 1. Source cache discovery
Use only an explicitly local source rooted under the original user's HOME.

Default source candidate:
`<original HOME>/.npm/_cacache`

Do NOT read or copy:
- `.npmrc`;
- `_logs`;
- auth tokens;
- registry credentials;
- arbitrary npm config;
- global npm directories.

Do not infer a remote/cache URL.

If original HOME is unavailable, source cache is absent, outside HOME, non-directory, symlinked, or otherwise unsafe: fail closed before install.

### 2. Run-owned destination
Destination remains the existing private run cache under the run-owned HOME.

Only npm cache data required for offline resolution may be copied into the run-owned cache, e.g. `_cacache` content/index structures. The actual `npm ci` MUST read/write only the run-owned destination, not the user's source cache.

### 3. Ownership and symlink rules
- never modify/delete/prune the user's source cache;
- recursively refuse symlinks in source material copied;
- create destination files/directories under run-owned HOME only;
- bounded copy with explicit maximum total bytes/files; exceed => fail closed;
- preserve no executable trust from cache metadata; package execution remains disabled by `npm_config_ignore_scripts=true`.

### 4. Lockfile / registry integrity
Before install, validate the dedicated checkout's `package-lock.json` for registry packages:
- every registry tarball used for install must have an integrity field;
- registry-resolved package URLs must be HTTPS and limited to the expected npm registry host(s) already represented by the lockfile;
- no git/file/http/custom remote dependency is silently accepted by this cache-seed step;
- do not rewrite package-lock.json.

`npm ci` remains the final dependency-tree/lockfile authority and must continue to verify SRI integrity.

### 5. No network relaxation
Keep:
- `npm_config_offline=true`;
- no `--prefer-online`;
- no registry fetch fallback;
- no curl/wget/network prefetch;
- no temporary disabling of isolation.

If a required package is still absent from the seeded cache, fail with a truthful `ENOTCACHED`/BLOCKED outcome. Do not fetch it.

### 6. App/install contract
Keep:
`npm ci --no-audit --no-fund`

Keep `npm_config_ignore_scripts=true`.

No use of shell strings / `sh -c`.

### 7. Existing safety boundaries unchanged
Do not change:
- Docker publish shim;
- Docker endpoint;
- Supabase CLI version/pins/archive binding;
- #564 NetworkSettings.Ports inspection;
- SQL/migrations;
- Auth/RLS;
- product/browser contracts except the cache preparation hook necessary before app install;
- root package.json/package-lock.json;
- CI;
- Production.

## Required tests

Controlled tests must prove at minimum:
1. safe local `~/.npm/_cacache` source is copied into private run cache;
2. `.npmrc`, logs and sibling files are never copied;
3. source cache remains byte-identical/read-only from harness perspective;
4. source symlink is refused;
5. nested symlink is refused;
6. outside-HOME source is refused;
7. byte/file cap is enforced;
8. package-lock registry entries without integrity fail closed;
9. HTTP/custom/git/file dependency source fails closed for this seed contract;
10. expected HTTPS npm-registry lockfile entries pass validation;
11. seeded destination is under private HOME;
12. install env still points only to private destination cache;
13. offline=true and ignore_scripts=true remain;
14. fake controlled npm can observe the private cache and no source-cache path/config credentials;
15. missing cached package remains a truthful offline failure rather than network fallback;
16. existing full helper suite remains green.

Do not weaken prior tests.

## Scope

Allowed:
- `scripts/e2e/admin-account-counts-local-runtime-1/app.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/env.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/runtime.mjs`
- a new narrowly named cache helper under `scripts/e2e/admin-account-counts-local-runtime-1/`
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
- own STATUS/HANDOFF/SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md`

Forbidden:
- root package.json/package-lock.json changes
- product code outside E2E harness
- Supabase SQL/migrations/config
- Auth/RLS
- Docker global/Desktop settings
- provider/payment/domain/secrets
- CI changes

## Execution boundary

Cursor may run controlled Node tests and normal exact-head CI/Preview.

Cursor MUST NOT:
- run real Docker;
- run the Product Owner Mac full acceptance;
- make outbound registry/package requests for this proof;
- mutate hosted Supabase/Production;
- apply migrations/RLS/grants;
- activate account-count Production functionality.

## Agent

Logical name: **Jetnity admin account counts offline npm cache seed 1**
Generation: **1**
Required model: **cursor-grok-4.6-high-fast**

## STOP

Do not mark Ready.
Do not merge.
Do not start a follow-up slice.
STOP for independent Technical-Lead exact-head review.
