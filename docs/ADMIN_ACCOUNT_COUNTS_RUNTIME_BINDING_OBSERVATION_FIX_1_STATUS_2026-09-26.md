# Admin Account Counts Runtime Binding Observation Fix 1 — STATUS

Stand: 2026-09-26  
Slice: **IMPLEMENTATION FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO REAL MAC RERUN / NO PRODUCTION MUTATION**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `40fffe38102012ae3ffa5f5b7e2bc24c1a100b42` (Merge #563) |
| Binding task | `docs/ADMIN_ACCOUNT_COUNTS_RUNTIME_BINDING_OBSERVATION_FIX_1_TASK_2026-09-26.md` |
| Branch | `fix/admin-account-counts-runtime-binding-observation-1` |
| PR | https://github.com/Jetnity/jetnity/pull/564 (Draft) |
| Frozen interface | Task §4 `jetnity.account-counts.local-acceptance.v1` (unchanged) |
| Official CLI pin | v2.117.0 / checksums `afcec54b3b19d8c73957cafb4956bb10cb7493207c29df60cdcd9afe6317cdb0` / darwin-arm64 `c8a298065b374836a42945f5d78ab9348d328bcfd099c14d3e5b0b537791209b` |

Implementation persist: `3ee98cb665ca2682962821bd2c6096d74f15e7de`. The following STATUS / HANDOFF / SELF_REVIEW persist on this branch is the exact frozen head after push. Reconstruct live HEAD; a later commit invalidates older gates.

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

Smallest fail-closed correction of post-start Docker binding observation.

- For a started container, `parseDockerPortBindings()` now prefers `NetworkSettings.Ports` when that field exists.
- Empty `HostConfig.PortBindings` HostIp placeholders cannot override a concrete resolved runtime mapping.
- If `NetworkSettings.Ports` is present but a published mapping is empty, public or malformed, observation fails closed. HostConfig cannot manufacture PASS.
- HostConfig is only a bounded fallback when `NetworkSettings.Ports` is genuinely absent, and only explicit `127.0.0.1` can pass.
- Loopback policy remains strict: PASS only for resolved `127.0.0.1`. Empty HostIp, `0.0.0.0`, `::` / `[::]`, hostname `localhost` and other host IPs remain FAIL.
- Pre-launch owned network option `com.docker.network.bridge.host_binding_ipv4=127.0.0.1` is unchanged and is not treated as proof of post-start publication.
- Mailpit is not disabled or excluded. Auth semantics stay unchanged.
- CLI identity, Docker endpoint, runtime/fixtures/browser/config/Auth/SQL/Production were not touched.
- `IMPLEMENTATION.codeCompleteClaim` remains **false**. `implementation.mjs` / `run.mjs` were not edited (out of this slice allowlist); durable receipts still carry the previous macOS-Docker implementation metadata.

## Authoritative real-Mac trigger (not re-run here)

First real stack startup on Product Owner Mac after #563, run id `aaclr1-20260926T104932Z` on exact main `40fffe38102012ae3ffa5f5b7e2bc24c1a100b42`:
- real Supabase CLI-managed stack STARTED
- dedicated owned network was created with `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`
- post-start verification aborted on Mailpit `8025/tcp -> 54324`
- observed fail: `Public or unspecified bind observed: {"containerPort":"8025/tcp","HostIp":"","HostPort":"54324"}`
- current source preferred `HostConfig.PortBindings` (`HostIp:""`) over resolved `NetworkSettings.Ports`

This is a P1 isolation false-positive / P2 runtime-observation defect. The loopback requirement was not weakened and Mailpit was not excluded to hide it.

## What was executed here

| Class | Result | Kind |
| --- | --- | --- |
| `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` | **47/47 PASS** (prior 46 preserved; one focused binding-observation test added) | controlled helpers only |
| `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` | exit 2 / `BLOCKED_ENVIRONMENT` / `fullLocalExecution=false` | default no-start |
| Receipt | `aaclr1-20260926T110432Z` | sanitized; no user home path |
| Real Docker / official binary / user's Mac / hosted Supabase / Production | **NOT RUN / NOT MUTATED** | forbidden by task |

## What is not done

- No real Docker daemon, no user's Mac, no official CLI download, no stack/browser execution
- No product/Auth/SQL/root dependency/CI change
- Exact-head CI / Auth / Preview belong to the frozen head after push; they are not claimed in this persist
- Independent Technical-Lead exact-head review has not happened
- Authorized later real-Mac rerun after merge remains a later TL step and is still required

## First unfinished action

Independent Technical-Lead exact-head review of this PR/head. Cursor does not Ready, merge, or start a follow-up.
