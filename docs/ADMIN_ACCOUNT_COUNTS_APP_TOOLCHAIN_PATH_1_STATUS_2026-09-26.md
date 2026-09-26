# Admin Account Counts App Toolchain PATH Fix 1 — STATUS

Stand: 2026-09-26  
Slice: **IMPLEMENTATION FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO REAL MAC RERUN / NO PRODUCTION MUTATION**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `58962638d4b3b55824497d9b77ad5b3f75025168` (Merge #566) |
| Binding task | `docs/ADMIN_ACCOUNT_COUNTS_APP_TOOLCHAIN_PATH_1_TASK_2026-09-26.md` |
| Branch | `fix/admin-account-counts-app-toolchain-path-1` |
| PR | https://github.com/Jetnity/jetnity/pull/567 (Draft) |
| Code commit | `6b6b6334fd218ac260c701c79ea06babfa2464c8` — `fix: reuse sanitized runtime PATH for isolated app env` |
| Frozen interface | Task §4 `jetnity.account-counts.local-acceptance.v1` (unchanged) |
| Official CLI pin | v2.117.0 / unchanged |

Reconstruct live HEAD after this persist; a later commit invalidates older gates. Exact-head CI/Auth/Preview were not yet bound to this persist when these files were written.

## This writer

| Field | Value |
| --- | --- |
| Agent | Jetnity admin account counts app toolchain path 1 |
| Generation | 1 |
| Required / actual model | cursor-grok-4.6-high-fast |
| Session | `bc-95f0abec-5902-4d07-8efe-7f939ba33521` |
| URL | https://cursor.com/agents/bc-95f0abec-5902-4d07-8efe-7f939ba33521 |
| Display name | `Admin account app path` — UI rename not performed |

## What this head implements

Smallest coherent repair of the verified empty-`parentEnv` PATH drop.

- `defaultStartRuntime` now builds one `appParentEnv` from the already-sanitized runtime `childEnv` via `baueRuntimeAppParentQuelle`.
- The same object is the parent source for `baueRuntimeAppUmgebung` (prepare), `starteOwnedApp` (initial launch) and `appController.options` (restart).
- Raw `process.env` is refused as the parent source.
- The existing allowlist rebuild remains authoritative: only PATH/LANG/LC_ALL/TZ may survive from the parent candidate.
- Docker connection variables, NODE_OPTIONS / NODE_PATH / NODE_PRELOAD / NODE_EXTRA_CA_CERTS, hosted credentials, provider/model/SMTP/Vercel markers remain stripped.
- Run-owned HOME, npm cache, `npm_config_offline=true`, `npm_config_ignore_scripts=true` and locked `npm ci --no-audit --no-fund` remain.
- No Docker shim/CLI pin/config/Auth/SQL/product/root-dependency/CI change.

`IMPLEMENTATION.codeCompleteClaim` remains **false**.

## Authoritative real-Mac trigger (not re-run here)

Authorized Apple-Silicon Mac full acceptance run `aaclr1-20260926T142727Z` on exact main `58962638d4b3b55824497d9b77ad5b3f75025168`:

- pinned official Supabase CLI path reached real local stack execution
- local services started
- app preparation failed with `spawnSync npm ENOENT`
- owned cleanup stopped the stack
- cited failure receipt: `docs/evidence/admin-account-counts-local-runtime-1/aaclr1-20260926T142727Z-failure.json`

This writer did not add, rewrite or re-run that receipt. The file is not present in this checkout; the task citation remains the authoritative trigger description.

## What was executed here

| Class | Result | Kind |
| --- | --- | --- |
| `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` | **61/61 PASS, 0 FAIL** (13.7s) | controlled helpers only |
| Artifact | `/opt/cursor/artifacts/aaclr1-app-toolchain-path-controlled-tests.log` | local agent evidence |
| Real Docker / official binary / user's Mac / hosted Supabase / Production | **NOT RUN / NOT MUTATED** | forbidden by task |

## What is not done

- No real Docker daemon, no user's Mac, no official CLI download, no stack/browser execution
- No product/Auth/SQL/root dependency/CI change
- Independent Technical-Lead exact-head review has not happened
- Authorized later real-Mac full acceptance rerun after merge remains a later TL step
- Exact-head CI/Auth/Preview for the persist head were not recorded in this file at write time

## First unfinished action

Independent Technical-Lead exact-head review of this PR/head. Cursor does not Ready, merge, or start a follow-up.
