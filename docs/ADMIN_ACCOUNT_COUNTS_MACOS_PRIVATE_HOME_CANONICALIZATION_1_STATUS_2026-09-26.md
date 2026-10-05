# Admin Account Counts macOS Private HOME Canonicalization 1 — STATUS

Stand: 2026-09-26  
Slice: **IMPLEMENTATION FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO REAL MAC RERUN / NO PRODUCTION MUTATION**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `c599077e9cb4eeb114e1bd2a89afc81cbb492c45` (Merge #568) |
| Binding task | `docs/ADMIN_ACCOUNT_COUNTS_MACOS_PRIVATE_HOME_CANONICALIZATION_1_TASK_2026-09-26.md` |
| Branch | `fix/admin-account-counts-macos-private-home-canonicalization-1` |
| PR | https://github.com/Jetnity/jetnity/pull/569 (Draft) |
| Task seed | `4541637f147d08bce43e4de593178f95c03f2328` |
| Frozen interface | Task §4 `jetnity.account-counts.local-acceptance.v1` (unchanged) |
| Official CLI pin | v2.117.0 / unchanged |

Reconstruct live HEAD after this persist; a later commit invalidates older gates. CI/Auth/Preview are not claimed on the implementation head from this writer.

## This writer

| Field | Value |
| --- | --- |
| Agent | Jetnity admin account counts macOS private home canonicalization 1 |
| Generation | 1 |
| Required / actual model | cursor-grok-4.6-high-fast |
| Session | `bc-8b4a0114-fce4-4a28-bd40-a367a1f78ae2` |
| URL | https://cursor.com/agents/bc-8b4a0114-fce4-4a28-bd40-a367a1f78ae2 |
| Display name | `Private HOME canonical equivalence` — UI rename not performed |

## What this head implements

Smallest coherent repair of the verified macOS tmpdir alias after #568 cache seed.

- Original HOME and source `~/.npm/_cacache` stay on `assertLocalNonSymlinkDirectory()`: visible final entry non-symlink, directory, and `realpath === visible`.
- New run-owned helper `assertRunOwnedPrivateHome()` accepts visible != canonical only when the private HOME already exists and the final entry itself is a real directory, not a symlink.
- Containment uses the visible private HOME first, then the same relative suffix under `realpathSync(privateHome)`.
- Nested symlinks and escapes inside the private HOME still fail closed, including broken symlinks via lstat.
- Missing destination descendants require the nearest existing ancestor to satisfy that same canonical relation before create/copy.
- After create/copy, destination entries are re-checked: not a symlink, still under the canonical root + same suffix.
- Isolated env continues to expose the visible private HOME / `NPM_CONFIG_CACHE`. Those paths are not rewritten to the canonical alias.
- npm stays offline + ignore_scripts + lockfile-bound. `.npmrc` / auth / logs are still not copied.

No Docker shim/CLI pin/config/Auth/SQL/product/root-dependency/CI change. `run.mjs` was not changed.

`IMPLEMENTATION.codeCompleteClaim` remains **false**.

## Authoritative real-Mac trigger (not re-run here)

Authorized Apple-Silicon Mac full acceptance run `aaclr1-20260926T162500Z` on exact main `c599077e9cb4eeb114e1bd2a89afc81cbb492c45`:

- pinned official Supabase CLI path executed
- local owned stack started
- prior npm PATH blocker resolved
- offline npm cache seed was reached
- seed stopped only with: `private HOME real path escaped its visible path`
- that is the normal macOS `/var/folders/... -> /private/var/folders/...` canonicalization of the harness-created tmpdir root
- owned cleanup completed/stopped local stack resources
- cited failure receipt: `docs/evidence/admin-account-counts-local-runtime-1/aaclr1-20260926T162500Z-failure.json`

This writer did not add, rewrite or re-run that receipt. The file is not present in this checkout; the task citation remains the authoritative trigger description.

## What was executed here

| Class | Result | Kind |
| --- | --- | --- |
| `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` | **78/78 PASS, 0 FAIL** (14.7s) | controlled helpers only |
| Artifact | `/opt/cursor/artifacts/aaclr1-macos-private-home-canonicalization-controlled-tests.log` | local agent evidence |
| Real Docker / official binary / user's Mac / hosted Supabase / Production | **NOT RUN / NOT MUTATED** | forbidden by task |
| Outbound registry/package fetch | **NOT PERFORMED** | forbidden by task |

Prior #568 cache-seed tests remain in this suite and stayed green. Eleven new run-owned canonicalization proofs were added.

## What is not done

- No real Docker daemon, no user's Mac, no official CLI download, no stack/browser execution
- No product/Auth/SQL/root dependency/CI change
- Independent Technical-Lead exact-head review has not happened
- Authorized later real-Mac full acceptance run after integration remains a later TL step
- GitHub CI / Auth / Vercel Preview are not claimed on this implementation persist

## First unfinished action

Independent Technical-Lead exact-head review of this PR/head. Cursor does not Ready, merge, or start a follow-up.
