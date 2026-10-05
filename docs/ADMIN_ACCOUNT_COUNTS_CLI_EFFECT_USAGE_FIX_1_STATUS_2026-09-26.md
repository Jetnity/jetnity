# Admin Account Counts CLI Effect Usage Fix 1 — STATUS

Stand: 2026-09-26  
Slice: **IMPLEMENTATION FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO REAL MAC RUN / NO PRODUCTION MUTATION**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `4beaca99586c4f7f1a25e0ab90ed37a3eae965fb` (Merge #562) |
| Binding task | `docs/ADMIN_ACCOUNT_COUNTS_CLI_EFFECT_USAGE_FIX_1_TASK_2026-09-26.md` |
| Branch | `fix/admin-account-counts-cli-effect-usage-1` |
| PR | https://github.com/Jetnity/jetnity/pull/563 (Draft) |
| Frozen interface | Task §4 `jetnity.account-counts.local-acceptance.v1` (unchanged) |
| Official CLI pin | v2.117.0 / checksums `afcec54b3b19d8c73957cafb4956bb10cb7493207c29df60cdcd9afe6317cdb0` / darwin-arm64 `c8a298065b374836a42945f5d78ab9348d328bcfd099c14d3e5b0b537791209b` |

Implementation persist: `9e094128da4044bc9e01f8d35a80f2d42ed4c93d`. The following STATUS / HANDOFF / SELF_REVIEW persist on this branch is the exact frozen head after push. Reconstruct live HEAD; a later commit invalidates older gates.

## This writer

| Field | Value |
| --- | --- |
| Agent | Jetnity admin account counts CLI effect usage fix 1 |
| Generation | 1 |
| Required / actual model | cursor-grok-4.6-high-fast |
| Session | `bc-cd3af49c-ac29-4834-a409-907aa3342058` |
| URL | https://cursor.com/agents/bc-cd3af49c-ac29-4834-a409-907aa3342058 |
| Display name | `Supabase cli root parser` — UI rename not performed |

## What this head implements

Smallest fail-closed correction of the general/root `supabase --help` usage-line parser to the actual v2.117 Effect CLI root usage.

- Docker endpoint selection, archive provenance, version parser and `start --help` remain unchanged.
- Official CLI 2.117.0 version/hash pins remain unchanged. No CLI upgrade.
- Primary root `--help` now requires the official Effect usage identity `supabase <subcommand> [flags]` plus all three official v2.117 short-description command entries:
  - `start` → `Start local Supabase stack`
  - `status` → `Show status of local Supabase containers`
  - `stop` → `Stop all local Supabase containers`
- The previously modelled `supabase [flags]` usage remains only a separate compatibility alternative and is never sufficient without those same three entries.
- Historical Go/Cobra root help (`Usage: supabase [command]` plus the long local-development descriptions, or the already-modeled `supabase start|status|stop` lines under that same Usage identity) remains only as a separate complete alternative. Mixed Effect usage + Cobra-only start description fails closed for both Effect usage forms.
- `start --help` text, a missing command, an arbitrary sentence, or unrelated binary help is rejected as root help.
- `IMPLEMENTATION.codeCompleteClaim` remains **false**. `run.mjs` / `implementation.mjs` were not edited (out of this slice allowlist); durable receipts still carry the previous macOS-Docker implementation metadata.

## Authoritative real-Mac trigger (not re-run here)

Fourth authorized Mac preflight on exact main `4beaca99586c4f7f1a25e0ab90ed37a3eae965fb`:
- `dockerUsable=true`
- `cliVerified=false`
- `fullLocalExecution=false`
- stack/browser did not start
- G0 stayed BLOCKED solely on root-help usage identity

Same SHA-verified v2.117 Darwin ARM64 binary then produced:
- `supabase <subcommand> [flags]`
- `start   Start local Supabase stack`
- `status  Show status of local Supabase containers`
- `stop    Stop all local Supabase containers`

#562 correctly changed the short-description signatures. Its usage identity still required only `supabase [flags]`, which cannot match the real release-binary line with `<subcommand>`.

## What was executed here

| Class | Result | Kind |
| --- | --- | --- |
| `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` | **46/46 PASS** (prior 46 preserved; Effect-root test extended for the real usage line) | controlled helpers only |
| `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` | exit 2 / `BLOCKED_ENVIRONMENT` / `fullLocalExecution=false` | default no-start |
| Receipt | `aaclr1-20260926T102641Z` | sanitized; no user home path |
| Real Docker / official binary / user's Mac / hosted Supabase / Production | **NOT RUN / NOT MUTATED** | forbidden by task |

## What is not done

- No real Docker daemon, no user's Mac, no official CLI download, no stack/browser execution
- No product/Auth/SQL/root dependency/CI change
- Exact-head CI / Auth / Preview belong to the frozen head after push; they are not claimed in this persist
- Independent Technical-Lead exact-head review has not happened
- Authorized later real-Mac preflight after merge remains a later TL step

## First unfinished action

Independent Technical-Lead exact-head review of this PR/head. Cursor does not Ready, merge, or start a follow-up.
