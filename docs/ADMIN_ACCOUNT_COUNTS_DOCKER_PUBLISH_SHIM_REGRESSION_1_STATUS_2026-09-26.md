# Admin Account Counts Docker Publish Shim Regression 1 — STATUS

Stand: 2026-09-26  
Slice: **IMPLEMENTATION FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO REAL MAC RERUN / NO PRODUCTION MUTATION**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `0e08e22cb859818d902bfff1ecdea654f33abc39` (Merge #565) |
| Binding task | `docs/ADMIN_ACCOUNT_COUNTS_DOCKER_PUBLISH_SHIM_REGRESSION_1_TASK_2026-09-26.md` |
| Branch | `fix/admin-account-counts-docker-publish-shim-regression-1` |
| PR | https://github.com/Jetnity/jetnity/pull/566 (Draft) |
| Code commit | `6b6218730f77af43e52b953f0de2e32969dffa95` |
| Frozen interface | Task §4 `jetnity.account-counts.local-acceptance.v1` (unchanged) |
| Official CLI pin | v2.117.0 / checksums `afcec54b3b19d8c73957cafb4956bb10cb7493207c29df60cdcd9afe6317cdb0` / darwin-arm64 `c8a298065b374836a42945f5d78ab9348d328bcfd099c14d3e5b0b537791209b` |

This persist is later than the code commit. Reconstruct live HEAD after this persist; a later commit invalidates older gates.

## This writer

| Field | Value |
| --- | --- |
| Agent | Jetnity admin account counts docker publish shim regression 1 |
| Generation | 1 |
| Required / actual model | cursor-grok-4.6-high-fast |
| Session | `bc-059589a4-a529-4c73-97b9-3a9e3f093fc4` |
| URL | https://cursor.com/agents/bc-059589a4-a529-4c73-97b9-3a9e3f093fc4 |
| Display name | `Admin account shim regression` — UI rename not performed |

## What this head implements

Smallest coherent repair of the merged #565 helper regression.

- Module-scope `parseDockerPublishValue(value)` and `formatLoopbackPublishValue(parsed)` are restored with the exact accepted strict publication contract from historical `15c6bbc8` / generated `e5e6557` strings.
- `rewriteDockerArgv()` and `renderShimSource()` now share those same functions. C1 still freezes them via `.toString()` into the run-owned hashed 0700 shim. No repository import at shim execution time.
- C2 image/CMD boundary is unchanged: options before image only; image + CMD copied byte-for-byte, including literal `-p` / `--publish`.
- `-P` / `--publish-all` remain fail-closed with the existing `/publish-all/` assertion (`docker create --publish-all is refused`). Unknown other pre-image options still fail closed.
- Harness Docker still bypasses the shim. #564 `NetworkSettings.Ports` remains authoritative.
- No CLI pin/archive/Docker endpoint/config/Auth/SQL/browser/product/root-dependency/CI change.

`IMPLEMENTATION.codeCompleteClaim` remains **false**.

## Authoritative real-Mac trigger (not re-run here)

Authorized Apple-Silicon Mac controlled suite on exact main `0e08e22cb859818d902bfff1ecdea654f33abc39`:

- 57 tests total / 48 PASS / 9 FAIL
- dominant failures: `ReferenceError: parseDockerPublishValue is not defined` and `ReferenceError: formatLoopbackPublishValue is not defined`
- generated-shim creation, provenance, rewrite and composed start were blocked
- therefore the real full acceptance run must stay blocked until this repair is independently reviewed and integrated

## What was executed here

| Class | Result | Kind |
| --- | --- | --- |
| `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` | **57/57 PASS, 0 FAIL** (14.2s) | controlled helpers only |
| Artifact | `/opt/cursor/artifacts/aaclr1-controlled-tests.log` | local agent evidence |
| Real Docker / official binary / user's Mac / hosted Supabase / Production | **NOT RUN / NOT MUTATED** | forbidden by task |

## What is not done

- No real Docker daemon, no user's Mac, no official CLI download, no stack/browser execution
- No product/Auth/SQL/root dependency/CI change
- Exact-head CI / Auth / Preview belong to the persist head after push; reconstruct live
- Independent Technical-Lead exact-head review has not happened
- Authorized later real-Mac rerun after merge remains a later TL step and is still required

## First unfinished action

Independent Technical-Lead exact-head review of this PR/head. Cursor does not Ready, merge, or start a follow-up.
