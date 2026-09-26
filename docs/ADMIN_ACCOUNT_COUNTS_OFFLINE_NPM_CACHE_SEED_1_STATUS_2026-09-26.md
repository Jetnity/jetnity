# Admin Account Counts Offline npm Cache Seed 1 — STATUS

Stand: 2026-09-26  
Slice: **IMPLEMENTATION FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO REAL MAC RERUN / NO PRODUCTION MUTATION**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `418f008f134d925edb45701a806b1a9bc17201c8` (Merge #567) |
| Binding task | `docs/ADMIN_ACCOUNT_COUNTS_OFFLINE_NPM_CACHE_SEED_1_TASK_2026-09-26.md` |
| Branch | `fix/admin-account-counts-offline-npm-cache-seed-1` |
| PR | https://github.com/Jetnity/jetnity/pull/568 (Draft) |
| Code commit | `31f2f4eb574a3ffb9e5481759cc258174bcfb6d3` — seed run-owned npm cache from local `_cacache` only |
| First persist head with exact-head gates | `318dbefe6ac8359e40d710be6bd9b88d8f515603` — CI `36250359496` SUCCESS, Auth SUCCESS, Vercel `FYizaAyjM9WPRM14svo61jgajQvx` READY |
| Frozen interface | Task §4 `jetnity.account-counts.local-acceptance.v1` (unchanged) |
| Official CLI pin | v2.117.0 / unchanged |

This evidence persist is later than `318dbefe`. Reconstruct live HEAD after this persist; a later commit invalidates older gates. The IDs below were read from GitHub/Vercel for exact `318dbefe` and do not automatically cover a newer head.

## This writer

| Field | Value |
| --- | --- |
| Agent | Jetnity admin account counts offline npm cache seed 1 |
| Generation | 1 |
| Required / actual model | cursor-grok-4.6-high-fast |
| Session | `bc-4d56d48b-bb5f-42e9-a4e7-b5e2321b64d0` |
| URL | https://cursor.com/agents/bc-4d56d48b-bb5f-42e9-a4e7-b5e2321b64d0 |
| Display name | `Admin offline npm cache` — UI rename not performed |

## What this head implements

Smallest coherent repair of the verified empty run-owned npm cache after the PATH fix.

- New helper `npm-cache-seed.mjs` discovers only `<original HOME>/.npm/_cacache`.
- Source must be local, under original HOME, a real directory, and non-symlink. Nested symlinks fail closed.
- Destination remains `<private HOME>/cache/npm/_cacache` from the existing `NPM_CONFIG_CACHE`.
- Copy is bounded (100_000 files / 4 GiB) and never writes outside private HOME.
- `.npmrc`, `_logs`, auth siblings and refused names are never copied. Source bytes stay unchanged.
- Dedicated checkout `package-lock.json` is validated before install: HTTPS npm-registry tarballs with integrity only. git/file/http/custom hosts fail closed. Lockfile is not rewritten.
- `prepareAppForLaunch` seeds first, then keeps `npm ci --no-audit --no-fund` with `npm_config_offline=true` and `npm_config_ignore_scripts=true`.
- Incomplete cache remains a truthful `ENOTCACHED` / BLOCKED outcome. No network fallback, no `--prefer-online`, no registry prefetch.
- `runtime.mjs` passes `leseOriginalHome()` plus `owned.privateHome`. Original HOME is not inherited into the child env.

No Docker shim/CLI pin/config/Auth/SQL/product/root-dependency/CI change.

`IMPLEMENTATION.codeCompleteClaim` remains **false**.

## Authoritative real-Mac trigger (not re-run here)

Authorized Apple-Silicon Mac full acceptance run `aaclr1-20260926T144930Z` on exact main `418f008f134d925edb45701a806b1a9bc17201c8`:

- pinned official Supabase CLI 2.117.0 executed
- local owned Supabase stack started
- app toolchain PATH repair worked; `npm ci --no-audit --no-fund` executed
- locked install failed only because the new private cache was empty: `ENOTCACHED` for `zod-validation-error@4.0.2`
- owned cleanup stopped the stack
- cited failure receipt: `docs/evidence/admin-account-counts-local-runtime-1/aaclr1-20260926T144930Z-failure.json`

This writer did not add, rewrite or re-run that receipt. The file is not present in this checkout; the task citation remains the authoritative trigger description.

## What was executed here

| Class | Result | Kind |
| --- | --- | --- |
| `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` | **67/67 PASS, 0 FAIL** (14.5s) | controlled helpers only |
| Artifact | `/opt/cursor/artifacts/aaclr1-offline-npm-cache-seed-controlled-tests.log` | local agent evidence |
| Real Docker / official binary / user's Mac / hosted Supabase / Production | **NOT RUN / NOT MUTATED** | forbidden by task |
| Outbound registry/package fetch | **NOT PERFORMED** | forbidden by task |

## Exact-head GitHub / Vercel on `318dbefe`

Read after the first persist push. All four completed on that SHA:

| Gate | Result | ID |
| --- | --- | --- |
| GitHub CI `Typecheck, Lint & Build` | **SUCCESS** | run `36250359496` / job `108427163235` |
| GitHub Auth `Auth-Konfiguration gegen config.toml` | **SUCCESS** | run `36250359496` / job `108427163277` |
| Combined commit status | **success** | SHA `318dbefe6ac8359e40d710be6bd9b88d8f515603` |
| Vercel Preview | **READY** | `FYizaAyjM9WPRM14svo61jgajQvx` — https://vercel.com/jetnity-e1b93c82/jetnity-app/FYizaAyjM9WPRM14svo61jgajQvx |
| Review threads | **none claimed here** | re-read on the live head |

This evidence persist will create a newer head. Re-read CI/Auth/Preview on the live SHA before review.

## What is not done

- No real Docker daemon, no user's Mac, no official CLI download, no stack/browser execution
- No product/Auth/SQL/root dependency/CI change
- Independent Technical-Lead exact-head review has not happened
- Authorized later real-Mac full acceptance rerun after merge remains a later TL step
- A later real Mac cache larger than 4 GiB / 100_000 files would fail closed and needs a later size-decision, not a network fallback

## First unfinished action

Independent Technical-Lead exact-head review of this PR/head. Cursor does not Ready, merge, or start a follow-up.
