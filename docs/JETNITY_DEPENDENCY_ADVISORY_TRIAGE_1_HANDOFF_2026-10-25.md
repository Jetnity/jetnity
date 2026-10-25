# Jetnity Dependency Advisory Triage 1 — Handoff

Date: 2026-10-25. Stop here for independent root re-gating of integration sync 1. This handoff is not a Technical-Lead PASS.

## Integration sync 1

Review the exact notes head that contains this file. It is one commit on merge `354c0093a952552956b9f5007e0e9265bde692ac`. That merge joined reviewed S head `70b609c745e1bb266f419efd722cb71690ee1a0e` (tree `d85dba80c45af47830858fe6b8e9876287ce3c94`) with verified main `60b8e75ece16a8640d21e460380f25d627bbe700` (tree `0bda1d7556dcbda64e77600a1658bf934b84b583`). Parents, in order: `70b609c745e1bb266f419efd722cb71690ee1a0e`, `60b8e75ece16a8640d21e460380f25d627bbe700`. Re-read `origin/main` at review time. This lane does not sync again without a new root instruction.

TASK blob `4a4b686fbcc429a4041012f3d967b3f5d1767bc0` and PLAN blob `436fc2561289baa2da9583c070662a6b8c9ad82b` are unchanged. Package blobs remain `e6187432cb8f224c10281b7b476bb24eb8ef1c1b` and `4c64e03d16a54ae6c648dc3e40c88d6b94c5cfbe`. Committed matrix SHA-256 remains `dc7b201dc0b0f12c34c95fcd48eb3859a93982e3749dd9ec679dbc92a7d09d47`.

`input-binding.mainAtExecution` remains `a74c443c6be3f064f150fcf021ab6154bda325e5`. That field records the main commit at the original execution. It is not a full source-snapshot hash. Retained `literalImports` are historical pre-T observations from the a74-based S checkout: 45 server seeds, 126 client seeds, 82 package names. The report's Zod-only literal-import chains, and its statements that `ws` and `source-map-js` have no literal import, are the same historical observations. T changes files in that census and adds source and proof imports. `inventory.mjs` was not run on this sync. Earlier inventory-rerun claims describe the pre-integration checkout.

On Node `v22.23.4` the existing validator, its 15 fixture assertions, and the matrix rebuild against the pinned inputs exited 0. Rebuilt JSON matched the committed matrix byte for byte. `EVIDENCE_VALID rows=42`. `FIXTURE_RESULT pass`. Builder stdout `MATRIX rows=42 {"provisional P1":40,"P2":2}`. `git diff --check` exited 0. Those commands are in `commands.txt` under `INTEGRATION_SYNC1`. They establish retained-evidence and package consistency. They do not establish a new source traversal or installed or deployed execution. Acquisition stays `UNAVAILABLE`. `retrievedAt` stays null.

Counts stay 0 provisional P0, 40 provisional P1, and 2 P2. No S-FIX group is activated. Prior native run 40219265005 (App 121247068711, Auth 121247068533) and Preview `dpl_2M6Lsaux6QUNethN8Lzk6mLDJpa5` belong to exact `70b609c`. Fresh App, Auth, and Vercel gates are required for the notes head. Ids for that head are assigned only after the push and are reported in the delivery comment when GitHub has them.

## For the Technical Lead

The sections below record the pre-integration correction of candidate `595ccfcba5d549fb568791f36b73ae2564c5ada9`. The accepted plan head remains `1fcb220a03bb895e3a6609ad81b9a9f7fedb992b`, PLAN blob `436fc2561289baa2da9583c070662a6b8c9ad82b`, TASK blob `4a4b686fbcc429a4041012f3d967b3f5d1767bc0`. Package blobs must still be `e6187432cb8f224c10281b7b476bb24eb8ef1c1b` and `4c64e03d16a54ae6c648dc3e40c88d6b94c5cfbe`. `mainAtExecution` in the binding remains `a74c443c6be3f064f150fcf021ab6154bda325e5`.

Read:

- `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_REPORT_2026-10-25.md`
- `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_SELF_REVIEW_2026-10-25.md` for the R1 and R2 resolution map
- `docs/evidence/dependency-advisory-triage-1/triage-matrix.json`
- `docs/evidence/dependency-advisory-triage-1/commands.txt`
- `docs/evidence/dependency-advisory-triage-1/validation.json`

The `01f4f2b9` priority summary (0 / 28 / 12 / 2) is withdrawn. The corrected matrix is 0 provisional P0, 40 provisional P1, and 2 P2. Bucket U is the floor. Four advisory ids, not three, cover `zod@3.25.76`, `ws@8.18.3`, and `source-map-js@1.2.1`. That is an advisory-to-lock concern. Exploitability was not demonstrated. No remediation group is activated.

`b905f89` labeled publication time as retrieval. `retrievedAt` is null and `acquisitionState` is `UNAVAILABLE`. The priority counts are unchanged. Candidate review R3 requires each omit-dev package's nonempty node paths to match that package in the raw lock and in the full-lock audit. The retained omit-dev file still names `node_modules/source-map-js`, `node_modules/ws`, and `node_modules/zod`.

The corrected provisional P1 flag belongs on Draft PR #1021 and replaces the earlier numerical flag.

Native App job 121241015963 on run 40217244719, read by root for exact `595ccfc`, used Node 22.23.3. It reported 7274 tests, 7272 passes, 0 failures, and 2 existing skips. Typecheck, guards, and the build succeeded. Auth on that run also succeeded. Lint reported 183 warnings against 181 already present. The two new warnings were unused `packageName` bindings at `scripts/dependency-advisory-triage-1/build-matrix.mjs` lines 27 and 89. This head removes those bindings. The npm-view loop still uses the filename match, and the audit loop now reads vulnerability values in the same enumeration order. A local rebuild of `triage-matrix.json` was byte-equivalent to the committed matrix. No classification, acquisition field, package, or lock byte changed. No S-FIX group is activated.

## Not done

No dependency update, no Ready, no merge, no close of #1016, no write to `main`, no sibling merge, no new task, no further sync. Holds #985/#982, #917, #913/#911, #968, #748, #626, #937/#936, and Bern #934 stay as they are. Provider and sourcegate stay off. Prelaunch and cost limits stay in force. The denied #917 boundary stays denied.

Installed consistency remains UNVERIFIED. Deployed selection remains unknown. `next-env.d.ts` was already dirty and was left untouched. npm audit, npm view, and `inventory.mjs` were not run for integration sync 1.
