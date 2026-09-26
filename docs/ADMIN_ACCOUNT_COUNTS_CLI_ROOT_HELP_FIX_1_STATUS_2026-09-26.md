# Admin Account Counts CLI Root Help Fix 1 — STATUS

Stand: 2026-09-26  
Slice: **IMPLEMENTATION FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO REAL MAC RUN / NO PRODUCTION MUTATION**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `4df0a8bff16f050314a3a0bc75827a9764173eb7` (Merge #560) |
| Binding task | `docs/ADMIN_ACCOUNT_COUNTS_CLI_ROOT_HELP_FIX_1_TASK_2026-09-26.md` |
| Branch | `fix/admin-account-counts-cli-root-help-1` |
| PR | https://github.com/Jetnity/jetnity/pull/561 (Draft) |
| Frozen interface | Task §4 `jetnity.account-counts.local-acceptance.v1` (unchanged) |
| Official CLI pin | v2.117.0 / checksums `afcec54b3b19d8c73957cafb4956bb10cb7493207c29df60cdcd9afe6317cdb0` / darwin-arm64 `c8a298065b374836a42945f5d78ab9348d328bcfd099c14d3e5b0b537791209b` |

Implementation persist: `8756b87e9e0ad99285e38fb23fa8df7521342710`. A later docs-only SHA pin on this branch invalidates this candidate and becomes the new exact head.

## This writer

| Field | Value |
| --- | --- |
| Agent | Jetnity admin account counts CLI root help fix 1 |
| Generation | 1 |
| Required / actual model | cursor-grok-4.6-high-fast |
| Session | `bc-107166c0-7d11-4d69-8bd8-c01cbdb5c26b` |
| URL | https://cursor.com/agents/bc-107166c0-7d11-4d69-8bd8-c01cbdb5c26b |
| Display name | `Supabase CLI root help` — UI rename not performed |

## What this head implements

Smallest fail-closed correction of the general/root `supabase --help` parser.

- Docker endpoint selection, archive provenance, version parser and `start --help` remain unchanged.
- Official CLI 2.117.0 version/hash pins remain unchanged. No CLI upgrade.
- Root `--help` now requires Cobra root usage identity (`Usage:` + `supabase [command]`) and the official local-development `start` / `status` / `stop` command entries.
- Command descriptions may wrap across lines. Historical `supabase start|stop|status` lines are accepted only when that same root usage identity is present.
- `start --help` text, a missing command, or an arbitrary `supabase start` sentence is rejected as root help.
- `IMPLEMENTATION.codeCompleteClaim` remains **false**. `run.mjs` / `implementation.mjs` were not edited (out of this slice allowlist); durable receipts still carry the previous macOS-Docker implementation metadata.

## Authoritative real-Mac trigger (not re-run here)

Second authorized Mac preflight on exact main `4df0a8bf`:
- Docker endpoint `desktop-linux` PASS
- `archiveBound=true`
- `versionVerified=true`
- `startHelpVerified=true`
- `helpVerified=false`
- `failedIdentityChecks=["help"]`

## What was executed here

| Class | Result | Kind |
| --- | --- | --- |
| `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` | **45/45 PASS** (prior 44 preserved + 1 focused root-help regression) | controlled helpers only |
| `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` | exit 2 / `BLOCKED_ENVIRONMENT` / `fullLocalExecution=false` | default no-start |
| Receipt | `aaclr1-20260926T014638Z` | sanitized; no user home path |
| Real Docker / official binary / user's Mac / hosted Supabase / Production | **NOT RUN / NOT MUTATED** | forbidden by task |

## What is not done

- No real Docker daemon, no user's Mac, no official CLI download, no stack/browser execution
- No product/Auth/SQL/root dependency/CI change
- Exact-head CI / Auth / Preview belong to the frozen head after push; they are not claimed in this persist
- Independent Technical-Lead exact-head review has not happened
- Authorized third real-Mac preflight after merge remains a later TL step

## First unfinished action

Independent Technical-Lead exact-head review of this PR/head. Cursor does not Ready, merge, or start a follow-up.
