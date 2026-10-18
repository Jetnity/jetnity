# JETNITY — R68 Local Development Reference Import Test Gate Integration
**Supplemental immutable Technical-Lead-controlled task, 17 October 2026**

**Status: REVIEW-GATE / TEST-HARNESS INTEGRATION ONLY. NO LIVE DATABASE CONNECTION, SQL, OR IMPORT.**
**Parent original immutable task:** `docs/JETNITY_DEV_REFERENCE_LOCAL_PG_WRITER_PREP_1_TASK_2026-10-17.md` — unchanged. This supplemental task adds **only one explicit, narrow exception** to the original task's `package.json` no-edit rule, authorizing **solely the npm `test` script glob addition** necessary to run 116 existing new offline security tests in standard CI. It does NOT waive other R65 constraints.

**Owner authorization:** The Product Owner expressly authorized *preparing and independently reviewing*, not running, the local Development-only Postgres writer. The independently observed Owner's local Mac terminal screenshot (2026-10-17 ~22:13 CEST) proved **116/116** new offline tests PASS on PR #962. [TL R67 code-only signoff](https://github.com/Jetnity/jetnity/pull/962#pullrequestreview-5559877697); old four F1–F4 review threads are resolved. Exact-head old CI [#39064565967](https://github.com/Jetnity/jetnity/actions/runs/39064565967) SUCCESS but **does not include the 116 tests**, and therefore CI test gap R66-F5 remains.

**Baseline:** protected `main@a2dbfc09468f819f05d150bf02e287eb6b00544d`; existing Draft PR [#962](https://github.com/Jetnity/jetnity/pull/962), `feat/dev-reference-local-pg-writer-prep-1`, initial corrected reviewed code HEAD `1962d8c3bc85ec227b34572e53cd398607fd610e`. Re-fetch exact newest commit before touching source. Mode `NORMAL`.
**Sole writer:** SAME local Mac Cursor session/logical author `Jetnity Local Development Reference Import Transport Prep 1 — Cursor Generation 1`, Owner-selected Claude Opus 5.5 High; no new agent, new branch, new PR or Work. No automatic follow-up.
**Review checkpoint:** independent TL **R68** after pushed exact head.

## Goal / acceptance

Update the EXISTING `package.json` `scripts.test` entry minimally to include quoted:
`"scripts/dev-reference-local-pg-prep-1/*.test.ts"`
in addition to, NOT replacing or rewriting, existing `"lib/**/*.test.ts"` and `"scripts/operating-mode-guard.test.mjs"`. Thus normal `npm test` and GitHub CI invoke all **116** now independently checked security tests. The new tests remain synthetic/fake-psql, do not dial any remote database.

**Hard allowed changes:** `package.json` **only** the existing npm `test` script string; add task-owned report/handoff/self-review updates if absolutely needed and only this supplemental task file seeded independently before author begins. No other source file changes, no lockfile or package dependencies, no new npm lifecycle scripts, no workflows, no operating guard change. Do not touch original R65 immutable task, app/lib, original Management API importers, SQL/Auth/rollout, schema/supabase, Production or Trip Audit #955. No upgrade, install, docker pull or external service.

**Tests/gates:** verify precise npm `test` glob diff and `git diff --check`; independently run direct security suite (expect 116/0) and `npm test` on local Mac. Existing 10 native Linux `initdb` errors may persist locally: record honestly (not full PASS). Standard **GitHub CI** (Linux) must subsequently be checked by TL on pushed exact head; do not self-declare success. Relevant `npm run typecheck`, `npm run lint` (report warnings) and `check:operating-mode` as feasible. Verify no test sends remote requests or DB queries. No need to install Docker/Postgres or evaluate true native protocol in this task.

**Security:** `SCHREIBEN_FREIGEGEBEN = false` MUST remain exact and untouched. No hosted Development OR Production database connection/query, no passwords, tokens, `.env*`, keychain, session, CA private key, no new PAT, no SQL, provider, browser QA, no import, no direct native writer activation. R56 original Development import consent DOES NOT authorize a new Postgres write, which needs its own later explicit PO decision.

**Handoff:** commit/push only existing #962 branch, sanitized exact head + tree + changed path list, confirmation the only npm test script string changed, exact tests and CI verification pending, author self-review in SAME #962, STOP for independent TL R68. No Ready, Merge, separate PR, or further slice. If glob causes unexpected errors or reviewer rules conflict, STOP NOT VERIFIED rather than broadening scope.
