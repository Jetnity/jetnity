# Admin Account Counts macOS Docker Runtime Fix 1 — STATUS

Stand: 2026-09-26  
Slice: **IMPLEMENTATION FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO REAL MAC RUN / NO PRODUCTION MUTATION**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `b440a6759c7c479d1b7509ecbefcac7b95c4ea35` |
| Binding task | `docs/ADMIN_ACCOUNT_COUNTS_MACOS_DOCKER_RUNTIME_FIX_1_TASK_2026-09-26.md` |
| Branch | `fix/admin-account-counts-macos-docker-runtime-1` |
| PR | https://github.com/Jetnity/jetnity/pull/560 (Draft) |
| Frozen interface | Task §4 `jetnity.account-counts.local-acceptance.v1` (unchanged) |
| Official CLI pin | v2.117.0 / checksums `afcec54b3b19d8c73957cafb4956bb10cb7493207c29df60cdcd9afe6317cdb0` / darwin-arm64 `c8a298065b374836a42945f5d78ab9348d328bcfd099c14d3e5b0b537791209b` |

Implementation persist / current freeze candidate: `49efbd95903c45d8a7e21c5bf9719da0a4e06707`. A later docs-only SHA pin on this branch invalidates this candidate and becomes the new exact head.

## This writer

| Field | Value |
| --- | --- |
| Agent | Jetnity admin account counts macOS Docker runtime fix 1 |
| Generation | 1 |
| Required / actual model | cursor-grok-4.6-high-fast |
| Session | `bc-11e9fb78-8111-4af3-8af7-73aa0ed1c9f6` |
| URL | https://cursor.com/agents/bc-11e9fb78-8111-4af3-8af7-73aa0ed1c9f6 |
| Display name | `Admin account counts macos docker` — UI rename not performed |

## What this head implements

Smallest safe cross-platform correction of isolated Docker endpoint selection in the already-reviewed local acceptance harness.

- Isolated child env no longer invents `DOCKER_HOST=unix:///var/run/docker.sock`.
- Parent machine environment is read only as input to local endpoint selection (`docker context show` / `inspect`).
- Only a verified local Unix endpoint (`unix://...`) is written into the private child env.
- Linux default `/var/run/docker.sock` and `/run/docker.sock` remain supported.
- Docker Desktop macOS local Unix endpoints/contexts are supported without a hard-coded username or machine path.
- Remote / tcp / ssh / http / cloud contexts and hostile parent `DOCKER_HOST` fail closed.
- Private HOME remains private. Docker credentials/config are not copied.
- `docker info` and official CLI `start --help` use the same verified host when one exists.
- Official CLI 2.117.0 archive identity and version/help/start-help checks are unchanged. Independent identity failures now name `version` / `help` / `start-help`.
- `IMPLEMENTATION.codeCompleteClaim` remains **false**.

## What was executed here

| Class | Result | Kind |
| --- | --- | --- |
| `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` | **44/44 PASS** | controlled helpers only |
| `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` | exit 2 / `BLOCKED_ENVIRONMENT` / `fullLocalExecution=false` | default no-start |
| Receipt | `aaclr1-20260926T010618Z` | sanitized; no user home path |
| Real Docker / user's Mac / hosted Supabase / Production | **NOT RUN / NOT MUTATED** | forbidden by task |

New controlled cases cover Linux default success, macOS Docker Desktop-style local Unix success with private HOME, remote/tcp/ssh refusal, hostile parent `DOCKER_HOST` not inherited, missing/non-responsive endpoint block, and consistent host use by Docker capability plus official CLI start-help. Existing ownership/cleanup/foreign-resource tests stayed green.

C2 full-mode helper was adapted only because this base already contains the merged #559 sibling module. The importer is still not a real consumer and still cannot become `LOCAL_FULL_STACK_PASS`. #559 product files were not edited.

## What is not done

- No real Docker daemon, no user's Mac, no official CLI download, no stack/browser execution
- No product/Auth/SQL/root dependency/CI change
- Exact-head CI / Auth / Preview belong to the frozen head after push; they are not claimed in this persist
- Independent Technical-Lead exact-head review has not happened

## First unfinished action

Independent Technical-Lead exact-head review of this PR/head. After PASS, the remaining authorized step is a real Mac preflight/runtime with the local Docker Desktop `desktop-linux` engine. Cursor does not Ready, merge, or start a follow-up.
