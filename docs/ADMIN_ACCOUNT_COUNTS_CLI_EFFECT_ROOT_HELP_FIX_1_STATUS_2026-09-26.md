# Admin Account Counts CLI Effect Root Help Fix 1 — STATUS

Stand: 2026-09-26  
Slice: **IMPLEMENTATION FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO REAL MAC RUN / NO PRODUCTION MUTATION**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `6cdc357f2759bda8b4196e5643ba3847e13151b3` (Merge #561) |
| Binding task | `docs/ADMIN_ACCOUNT_COUNTS_CLI_EFFECT_ROOT_HELP_FIX_1_TASK_2026-09-26.md` |
| Branch | `fix/admin-account-counts-cli-effect-root-help-1` |
| PR | https://github.com/Jetnity/jetnity/pull/562 (Draft) |
| Frozen interface | Task §4 `jetnity.account-counts.local-acceptance.v1` (unchanged) |
| Official CLI pin | v2.117.0 / checksums `afcec54b3b19d8c73957cafb4956bb10cb7493207c29df60cdcd9afe6317cdb0` / darwin-arm64 `c8a298065b374836a42945f5d78ab9348d328bcfd099c14d3e5b0b537791209b` |

Implementation persist: `89b4922bcbebdaf4c3a4725046f3447f5d2f471e`. The following STATUS / HANDOFF / SELF_REVIEW persist on this branch is the exact frozen head after push. Reconstruct live HEAD; a later commit invalidates older gates.

## This writer

| Field | Value |
| --- | --- |
| Agent | Jetnity admin account counts CLI effect root help fix 1 |
| Generation | 1 |
| Required / actual model | cursor-grok-4.6-high-fast |
| Session | `bc-e00055d4-896d-4c02-b3e5-0ab38d659aa8` |
| URL | https://cursor.com/agents/bc-e00055d4-896d-4c02-b3e5-0ab38d659aa8 |
| Display name | `Supabase root help parser` — UI rename not performed |

## What this head implements

Smallest fail-closed correction of the general/root `supabase --help` parser to the actual v2.117 Effect CLI root-help shape.

- Docker endpoint selection, archive provenance, version parser and `start --help` remain unchanged.
- Official CLI 2.117.0 version/hash pins remain unchanged. No CLI upgrade.
- Primary root `--help` now requires the official Effect usage identity `supabase [flags]` and all three official v2.117 short-description command entries:
  - `start` → `Start local Supabase stack`
  - `status` → `Show status of local Supabase containers`
  - `stop` → `Stop all local Supabase containers`
- Historical Go/Cobra root help (`Usage: supabase [command]` plus the long local-development descriptions, or the already-modeled `supabase start|status|stop` lines under that same Usage identity) remains only as a separate complete alternative. Mixed Effect usage + Cobra-only start description fails closed.
- `start --help` text, a missing command, an arbitrary sentence, or unrelated binary help is rejected as root help.
- `IMPLEMENTATION.codeCompleteClaim` remains **false**. `run.mjs` / `implementation.mjs` were not edited (out of this slice allowlist); durable receipts still carry the previous macOS-Docker implementation metadata.

## Authoritative real-Mac trigger (not re-run here)

Third authorized Mac preflight on exact main `6cdc357f`:
- `dockerUsable=true`
- `archiveBound=true`
- `versionVerified=true`
- `startHelpVerified=true`
- `helpVerified=false`
- `failedIdentityChecks=["help"]`
- G1 PASS / G20 PASS / G2–G19 NOT RUN because G0 stayed BLOCKED solely on root help

Same SHA-verified v2.117 Darwin ARM64 binary then produced:
- `supabase [flags]`
- `start  Start local Supabase stack`
- `status Show status of local Supabase containers`
- `stop   Stop all local Supabase containers`

Independent official tag `v2.117.0` source (`apps/cli/src/cli/root.ts`, `start.command.ts`, `status.command.ts`, `stop.command.ts`) confirms Effect CLI root + those short descriptions.

## What was executed here

| Class | Result | Kind |
| --- | --- | --- |
| `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` | **46/46 PASS** (prior 45 preserved + 1 focused Effect-root regression) | controlled helpers only |
| `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` | exit 2 / `BLOCKED_ENVIRONMENT` / `fullLocalExecution=false` | default no-start |
| Receipt | `aaclr1-20260926T095843Z` | sanitized; no user home path |
| Real Docker / official binary / user's Mac / hosted Supabase / Production | **NOT RUN / NOT MUTATED** | forbidden by task |

## What is not done

- No real Docker daemon, no user's Mac, no official CLI download, no stack/browser execution
- No product/Auth/SQL/root dependency/CI change
- Exact-head CI / Auth / Preview belong to the frozen head after push; they are not claimed in this persist
- Independent Technical-Lead exact-head review has not happened
- Authorized later real-Mac preflight after merge remains a later TL step

## First unfinished action

Independent Technical-Lead exact-head review of this PR/head. Cursor does not Ready, merge, or start a follow-up.
