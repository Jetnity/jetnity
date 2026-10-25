# Jetnity Dependency Advisory Triage 1 — Status

Date: 2026-10-25. Lane: R107-S. State: integration sync 1 delivered for independent root re-gating. This is not candidate FINAL PASS, Ready, or merge.

## Integration sync 1

Explicit root instruction merged verified main `60b8e75ece16a8640d21e460380f25d627bbe700` (tree `0bda1d7556dcbda64e77600a1658bf934b84b583`) into reviewed S head `70b609c745e1bb266f419efd722cb71690ee1a0e` (tree `d85dba80c45af47830858fe6b8e9876287ce3c94`). Merge commit `354c0093a952552956b9f5007e0e9265bde692ac`. Parents, in order: `70b609c745e1bb266f419efd722cb71690ee1a0e`, `60b8e75ece16a8640d21e460380f25d627bbe700`. History preserved. No rebase, no force-push, no cherry-pick, no sibling-branch merge. The delivery head is the notes commit on top of that merge. This file does not contain that notes hash.

The merge brought the T traveller-snapshot files. It did not change S audit payloads, the matrix, TASK, PLAN, `package.json`, or `package-lock.json`.

`input-binding.mainAtExecution` stays `a74c443c6be3f064f150fcf021ab6154bda325e5`. That value is the main commit at the original execution. It is not a full source-snapshot hash. `literalImports` stays the historical pre-T census from the a74-based S checkout: 45 server seeds, 126 client seeds, 82 package names. Zod literal-import chains, and the absence of literal `ws` and `source-map-js` imports, are historical observations from that checkout. `inventory.mjs` was not run. Retained acquisition stays `UNAVAILABLE` with `retrievedAt` null. Installed and deployed applicability stay unknown.

On Node `v22.23.4`, before these notes, the existing matrix rebuild wrote `/tmp/r107-sync-matrix.json` with stdout `MATRIX rows=42 {"provisional P1":40,"P2":2}` and exit 0. Its SHA-256 matched the committed matrix: `dc7b201dc0b0f12c34c95fcd48eb3859a93982e3749dd9ec679dbc92a7d09d47`. The committed matrix was not rewritten. The 15 existing fixture assertions exited 0 with `FIXTURE_RESULT pass`. The validator exited 0 with `EVIDENCE_VALID rows=42`. `git diff --check` exited 0. The same three commands are recorded in `commands.txt` under `INTEGRATION_SYNC1`. That success is retained-evidence and package consistency. It is not a new source traversal and not installed or deployed execution proof.

Priority counts stay 0 provisional P0, 40 provisional P1, and 2 P2. No S-FIX group is activated. Fresh App, Auth, and Vercel gates are required for the notes head. Native run 40219265005, App job 121247068711, Auth job 121247068533, and Preview `dpl_2M6Lsaux6QUNethN8Lzk6mLDJpa5` gate exact `70b609c` only. They do not gate this head. Native and Preview ids for the notes head are not assigned in this file.

`next-env.d.ts` stayed at its pre-command dirty bytes and is not staged.

## Binding

- Logical agent: Jetnity Dependency Advisory Triage 1 — Cursor Generation 1.
- Runtime: `grok-4.7-high-fast`. Session: `bc-ace2870d-6fe3-4d6f-9213-676752ad3b9b`.
- Accepted plan parent: `1fcb220a03bb895e3a6609ad81b9a9f7fedb992b`. PLAN blob `436fc2561289baa2da9583c070662a6b8c9ad82b`. TASK blob unchanged `4a4b686fbcc429a4041012f3d967b3f5d1767bc0`.
- Corrects candidate `595ccfcba5d549fb568791f36b73ae2564c5ada9` for two unused-binding lint warnings. The earlier candidate `01f4f2b97b614c3b16048fa8585e1e635c93286f` remains the head whose priority summary was withdrawn. The delivery head is the commit that adds this revision; this file does not contain its own hash.
- Package blobs unchanged: `e6187432cb8f224c10281b7b476bb24eb8ef1c1b`, `4c64e03d16a54ae6c648dc3e40c88d6b94c5cfbe`.
- Main at the start of this correction: `a74c443c6be3f064f150fcf021ab6154bda325e5`. No rebase in this packet.
- Draft PR #1021. Tracking #1016 stays open.

## Audit state

The registry commands were not repeated. Retained state remains `REGISTRY_AUDIT_OK` for both explicit dependency sets and `ADVISORY_PRIMARY_OK` for the 23 GHSA payloads. Every current matrix row is `RANGE_DECIDED`. `EVIDENCE_VALID` is the validator result in `docs/evidence/dependency-advisory-triage-1/validation.json` when that command exits 0.

The numerical summary from `01f4f2b9` (0 / 28 provisional P1 / 12 provisional P2 / 2 P3) is withdrawn. The corrected matrix is 0 provisional P0, 40 provisional P1, 2 P2, and 0 P3. Bucket U is the floor on every row. Execution of the vulnerable function is `NOT_ASSESSED`. No remediation group is activated.

Candidate review R2: `retrievedAt` is null and `acquisitionState` is `UNAVAILABLE` on every row. `primaryPublished` and `primaryUpdated` stay the payload times. The validator parses the raw lock, requires the row fields, rejects a retained candidate from another major than the primary patch, and reads the omit-dev audit. The retained omit-dev output still names `source-map-js`, `ws`, and `zod`.

Candidate review R3: those three omit-dev rows must keep nonempty node paths. Each path must be that package in the raw lock and in the full-lock audit, with the same per-package advisory ids. Emptying the node lists is no longer accepted. The retained omit-dev JSON was not changed.

Native lint on exact `595ccfc`, App job 121241015963, run 40217244719, Node 22.23.3: 183 warnings, two more than the 181 already present. Both new warnings were unused `packageName` bindings in `scripts/dependency-advisory-triage-1/build-matrix.mjs` at lines 27 and 89. Those bindings are removed. The matrix rebuild is byte-equivalent. Classifications, acquisition state, and remediation groups are unchanged. That native job also reported 7274 tests, 7272 passes, 0 failures, 2 existing skips, with typecheck, guards, and build successful. Auth on the same run succeeded. This note records root's completed-log reading. It is not a new native gate for the head that contains this file.

Four advisory ids cover three production-closure packages: GHSA-mrhx-c7xc-m3w5 (`zod@3.25.76`), GHSA-96hv-2xvq-fx4p and GHSA-58qx-3vcg-4xpx (`ws@8.18.3`), and GHSA-68fv-2mgg-jv7q (`source-map-js@1.2.1`). Those rows are an advisory-to-lock concern. They are not an exploit finding and not a deployed-bundle finding.

Lock counts on the same blob: 611 entries, 565 path suffixes, 562 canonical names. Installed consistency: **UNVERIFIED**. Deployed selection: unknown. No package, lock, runtime, workflow, or config edit. `next-env.d.ts` stayed at its pre-command dirty bytes and is not staged.

## Holds

#985/#982, #917, #913/#911, #968, #748, #626, #937/#936, Bern #934, and the other recorded holds are unchanged. No Production, provider, secret, payment, legal, or launch action. Integration order remains T → S → D → W → M. No sibling merge.

## Next step

Independent Technical-Lead re-gating of the new exact head. Cursor does not Ready, merge, close #1016, write `main`, or start a fix slice.
