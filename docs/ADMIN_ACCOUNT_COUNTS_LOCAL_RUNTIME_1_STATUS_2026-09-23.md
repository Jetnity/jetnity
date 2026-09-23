# Admin Account Counts Local Runtime 1 — STATUS

Stand: 2026-09-23  
Slice: **F1–F4 REVIEW 5294264491 FIX APPLIED / NOT CLAIMED CODE-COMPLETE / REAL STACK NOT RUN / STOP for independent TL exact-head re-review**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `fa7f651c023eb361fb142cbb931bc702f3a3d213` |
| Task seed | `0aa33e88a021756a5cee64a130d544122977880a` |
| Binding TL re-review | `5294264491` on `12f42ab2ab2a8a9b67086dece9f0b76fd84f767c` = CHANGES REQUIRED |
| Independent diagnostic spec | comment `5799328807` |
| Branch | `test/admin-account-counts-local-runtime-1` |
| PR | https://github.com/Jetnity/jetnity/pull/558 (Draft) |
| Frozen interface | Task §4 `jetnity.account-counts.local-acceptance.v1` (unchanged) |
| Official CLI candidate | v2.117.0 / release 384221143 / non-prerelease |

## This writer

| Field | Value |
| --- | --- |
| Agent | Jetnity admin account counts local runtime 1 |
| Generation | 1 |
| Model | cursor-grok-4.6-high-fast (required = actual) |
| Session | `bc-1054a840-ce3b-4451-9903-7836344b5149` (SAME session) |
| Display name | `Admin account counts local runtime` — UI rename not performed |

## What this correction did

Same-session consolidated F1–F4 package from review `5294264491` in owned runtime files only. Preserved offline `--cli-archive`/`--cli-checksums`, no sidecar trust, exact prosrc/proconfig, typed resource uncertainty, and existing app/observer behavior. Task §4 unchanged. #556 lifecycle module not edited.

- **F1** — `hashTarMember` extracts to an isolated file with timeout, isolated env and `maxBytes`. 64KiB and 2MiB real members hash; oversize/timeout/corrupt fail. Default stdout buffering is not used.
- **F2** — Disclosed snapshot exclusion of dotenv templates including tracked `.env.example`. Product template is not edited. Inherited `.env*` and symlinks still fail. Positive path uses the actual baseline inventory. Git archive is file-backed so the full baseline no longer ENOBUFS. macOS extract remains unverified.
- **F3** — `createOwnershipRegistry` exposes one `browsers` map aliased as `browserRegistry`. Acquired Context is recorded before `attachLocalTrafficPolicy`. Pending launch is not treated as closed. Request-event violations are contained on the handle. Unknown retains resources and fails G20.
- **F4** — Stop → export sanitized whitelist → delete private state. Secret JSON / HAR / profiles never export. `persistFailureReceipt` writes only the durable evidence dir and does not recreate a deleted private HOME.

`IMPLEMENTATION.codeCompleteClaim` is **false**.

## What is not done

- No owned GoTrue/PostgREST/Next.js/Playwright stack was started
- No Docker/CLI install, official-binary download, hosted fallback, Mac access, sibling-code import, main sync
- No Ready, merge, rebase, force, reset, cherry-pick, or follow-up agent
- Helper/contract tests **35/35 PASS**; they are not full local execution
- Default no-start receipt `aaclr1-20260923T172002Z` is `BLOCKED_ENVIRONMENT` / exit 2 / `fullLocalExecution=false` / `codeCompleteClaim=false`

## First unfinished action

Independent Technical-Lead exact-head re-review of this 5294264491 head. Helper PASS is not full local execution. Cursor does not Ready or merge.
