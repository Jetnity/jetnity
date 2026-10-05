# Admin Account Counts Docker Publish Shim 1 — STATUS

Stand: 2026-09-26  
Slice: **IMPLEMENTATION FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO REAL MAC RERUN / NO PRODUCTION MUTATION**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `8bb9dd31d5b1a585262c3e773bddab0693d0d3ba` (Merge #564) |
| Binding task | `docs/ADMIN_ACCOUNT_COUNTS_DOCKER_PUBLISH_SHIM_1_TASK_2026-09-26.md` |
| Branch | `fix/admin-account-counts-docker-publish-shim-1` |
| PR | https://github.com/Jetnity/jetnity/pull/565 (Draft) |
| Frozen interface | Task §4 `jetnity.account-counts.local-acceptance.v1` (unchanged) |
| Official CLI pin | v2.117.0 / checksums `afcec54b3b19d8c73957cafb4956bb10cb7493207c29df60cdcd9afe6317cdb0` / darwin-arm64 `c8a298065b374836a42945f5d78ab9348d328bcfd099c14d3e5b0b537791209b` |

Task-seed persist `1a3f9065cfd3b1d3fca069f28bb433850ef8d58a` is historical. Reconstruct live HEAD after this persist; a later commit invalidates older gates.

## This writer

| Field | Value |
| --- | --- |
| Agent | Jetnity admin account counts docker publish shim 1 |
| Generation | 1 |
| Required / actual model | cursor-grok-4.6-high-fast |
| Session | `bc-71eec955-6442-47db-83e9-404c7be6d4d3` |
| URL | https://cursor.com/agents/bc-71eec955-6442-47db-83e9-404c7be6d4d3 |
| Display name | `Localhost docker publish shim` — UI rename not performed |

## What this head implements

Private run-owned Docker publish shim for the official Supabase CLI child only.

- Official pinned v2.117.0 archive/binary remains untouched and must stay archiveBound.
- After CLI identity and local Docker verification, the harness writes an executable named exactly `docker` under the already-private HOME/tooling area (`0700` dir and file, no symlink, SHA256 recorded).
- That directory is prepended only to the official CLI child PATH. Parent/user PATH and Docker Desktop settings are not changed.
- `docker create -p` / `--publish` values of the v2.117 form `hostPort:containerPort[/protocol]` become explicit `127.0.0.1:hostPort:containerPort[/protocol]` before container start.
- Already-explicit `127.0.0.1:...` is preserved. `0.0.0.0`, `::`, `localhost`, LAN IPs, ranges, `-P` / `--publish-all`, missing/malformed/single-field values fail closed.
- `--expose` is not rewritten. Non-create commands are delegated byte-for-byte to the exact harness-selected real Docker binary.
- Harness Docker operations keep using that absolute real binary and bypass the shim.
- Caller `shimVerified=true` cannot bypass archive/identity/hash/PATH/ownership proof.
- If shim creation/hash/PATH proof is missing or fails, stack start stays BLOCKED.
- #564 `NetworkSettings.Ports` inspection and `assertLoopbackBindings` are unchanged and remain authoritative after start.
- Mailpit stays enabled. Canonical config/Auth/SQL/product/CI/root dependencies were not changed.

`IMPLEMENTATION.codeCompleteClaim` remains **false**.

## Authoritative real-Mac trigger (not re-run here)

Authorized Apple-Silicon Mac full run after #564, run id `aaclr1-20260926T113202Z` on exact main `8bb9dd31d5b1a585262c3e773bddab0693d0d3ba`:

- official Supabase CLI-managed stack started
- runtime binding truth reported `{"containerPort":"8025/tcp","HostIp":"0.0.0.0","HostPort":"54324"}`
- harness correctly aborted
- this is a real exposure, not a parser false-positive
- the earlier owned-network option `com.docker.network.bridge.host_binding_ipv4=127.0.0.1` is not sufficient on that Docker Desktop path

## What was executed here

| Class | Result | Kind |
| --- | --- | --- |
| `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` | **55/55 PASS** (prior 48 preserved; seven shim cases added) | controlled helpers only |
| `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` | exit 2 / `BLOCKED_ENVIRONMENT` / `fullLocalExecution=false` | default no-start |
| Receipt | `aaclr1-20260926T114704Z` | sanitized; no user home path |
| Real Docker / official binary / user's Mac / hosted Supabase / Production | **NOT RUN / NOT MUTATED** | forbidden by task |

## What is not done

- No real Docker daemon, no user's Mac, no official CLI download, no stack/browser execution
- No product/Auth/SQL/root dependency/CI change
- Exact-head CI / Auth / Preview belong to the frozen head after push; reconstruct live
- Independent Technical-Lead exact-head review has not happened
- Authorized later real-Mac rerun after merge remains a later TL step and is still required

## First unfinished action

Independent Technical-Lead exact-head review of this PR/head. Cursor does not Ready, merge, or start a follow-up.
