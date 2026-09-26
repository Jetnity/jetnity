# Admin Account Counts Runtime Binding Observation Fix 1 — STATUS

Stand: 2026-09-26  
Slice: **C1 REVIEW-FIX FROZEN FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO REAL MAC RERUN / NO PRODUCTION MUTATION**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `40fffe38102012ae3ffa5f5b7e2bc24c1a100b42` (Merge #563) |
| Binding task | `docs/ADMIN_ACCOUNT_COUNTS_RUNTIME_BINDING_OBSERVATION_FIX_1_TASK_2026-09-26.md` |
| TL review applied | `5325722210` C1 only |
| Branch | `fix/admin-account-counts-runtime-binding-observation-1` |
| PR | https://github.com/Jetnity/jetnity/pull/564 (Draft) |
| Frozen interface | Task §4 `jetnity.account-counts.local-acceptance.v1` (unchanged) |
| Official CLI pin | v2.117.0 / checksums `afcec54b3b19d8c73957cafb4956bb10cb7493207c29df60cdcd9afe6317cdb0` / darwin-arm64 `c8a298065b374836a42945f5d78ab9348d328bcfd099c14d3e5b0b537791209b` |

Previous freeze `fc5473e3b8f3f5128f578b9a8b4ec378249baf8c` is historical. C1 implementation persist: `7509ae3f38883895855936170b9c6ba36b1ab7d4`. The following STATUS / HANDOFF / SELF_REVIEW persist on this branch is the exact frozen head after push. Reconstruct live HEAD; a later commit invalidates older gates.

## This writer

| Field | Value |
| --- | --- |
| Agent | Jetnity admin account counts runtime binding observation fix 1 |
| Generation | 1 |
| Required / actual model | cursor-grok-4.6-high-fast |
| Session | `bc-abaf4d85-1737-4b3d-b5d4-802ea7bc697a` |
| URL | https://cursor.com/agents/bc-abaf4d85-1737-4b3d-b5d4-802ea7bc697a |
| Display name | `Docker runtime binding observation` — UI rename not performed |

## What this head implements

NetworkSettings-first observation from the first persist is preserved. This head adds only the C1 fail-closed reconcile.

- For a started container, `parseDockerPortBindings()` still prefers `NetworkSettings.Ports` when that field exists.
- Empty `HostConfig.PortBindings` HostIp placeholders cannot override a concrete resolved runtime mapping.
- When `NetworkSettings.Ports` is present, every HostConfig-configured published port must have at least one well-formed authoritative runtime mapping.
- Configured ports that are absent, `null`, `[]`, non-array, or missing HostIp/HostPort emit an unresolved binding that `assertLoopbackBindings` rejects. A sibling valid `127.0.0.1` mapping cannot manufacture aggregate PASS.
- Unconfigured internal `NetworkSettings.Ports` `null` entries do not create a false failure.
- HostConfig is only a bounded fallback when `NetworkSettings.Ports` is genuinely absent, and only explicit `127.0.0.1` can pass.
- Loopback policy remains strict: PASS only for resolved `127.0.0.1`.
- Pre-launch owned network option and Mailpit remain unchanged.
- CLI identity, Docker endpoint, runtime/fixtures/browser/config/Auth/SQL/Production were not touched.
- `IMPLEMENTATION.codeCompleteClaim` remains **false**.

## Authoritative real-Mac trigger (not re-run here)

First real stack startup on Product Owner Mac after #563, run id `aaclr1-20260926T104932Z` on exact main `40fffe38102012ae3ffa5f5b7e2bc24c1a100b42`:
- real Supabase CLI-managed stack STARTED
- dedicated owned network was created with `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`
- post-start verification aborted on Mailpit `8025/tcp -> 54324`
- observed fail: `Public or unspecified bind observed: {"containerPort":"8025/tcp","HostIp":"","HostPort":"54324"}`

TL review `5325722210` accepted that Mailpit false-positive correction and required C1 so a configured published port cannot disappear from authoritative runtime mappings without failing closed.

## What was executed here

| Class | Result | Kind |
| --- | --- | --- |
| `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` | **48/48 PASS** (prior 47 preserved; one C1 regression test added) | controlled helpers only |
| `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` | exit 2 / `BLOCKED_ENVIRONMENT` / `fullLocalExecution=false` | default no-start |
| Receipt | `aaclr1-20260926T111109Z` | sanitized; no user home path |
| Real Docker / official binary / user's Mac / hosted Supabase / Production | **NOT RUN / NOT MUTATED** | forbidden by task |

## What is not done

- No real Docker daemon, no user's Mac, no official CLI download, no stack/browser execution
- No product/Auth/SQL/root dependency/CI change
- Exact-head CI / Auth / Preview belong to the frozen head after push; they are not claimed in this persist
- Independent Technical-Lead exact-head re-review has not happened
- Authorized later real-Mac rerun after merge remains a later TL step and is still required

## First unfinished action

Independent Technical-Lead exact-head re-review of this PR/head after C1. Cursor does not Ready, merge, or start a follow-up.
