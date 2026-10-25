# Jetnity Dependency Advisory Triage 1 — Handoff

Date: 2026-10-25. Stop here for independent Technical-Lead re-gating.

## For the Technical Lead

Review the exact head that contains this file. It corrects candidate `b905f89eafa0a2c614ca125316497716db27eb91`. The accepted plan head remains `1fcb220a03bb895e3a6609ad81b9a9f7fedb992b`, PLAN blob `436fc2561289baa2da9583c070662a6b8c9ad82b`, TASK blob `4a4b686fbcc429a4041012f3d967b3f5d1767bc0`. Package blobs must still be `e6187432cb8f224c10281b7b476bb24eb8ef1c1b` and `4c64e03d16a54ae6c648dc3e40c88d6b94c5cfbe`. Main at the start of this correction was `a74c443c6be3f064f150fcf021ab6154bda325e5`. If `origin/main` has moved, that drift is reported with the delivery; this lane was not rebased.

Read:

- `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_REPORT_2026-10-25.md`
- `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_SELF_REVIEW_2026-10-25.md` for the R1 and R2 resolution map
- `docs/evidence/dependency-advisory-triage-1/triage-matrix.json`
- `docs/evidence/dependency-advisory-triage-1/commands.txt`
- `docs/evidence/dependency-advisory-triage-1/validation.json`

The `01f4f2b9` priority summary (0 / 28 / 12 / 2) is withdrawn. The corrected matrix is 0 provisional P0, 40 provisional P1, and 2 P2. Bucket U is the floor. Four advisory ids, not three, cover `zod@3.25.76`, `ws@8.18.3`, and `source-map-js@1.2.1`. That is an advisory-to-lock concern. Exploitability was not demonstrated. No remediation group is activated.

`b905f89` labeled publication time as retrieval. This head sets `retrievedAt` to null and `acquisitionState` to `UNAVAILABLE`. The priority counts are unchanged. The validator now parses the raw lock and the retained omit-dev output.

The corrected provisional P1 flag belongs on Draft PR #1021 and replaces the earlier numerical flag.

## Not done

No dependency update, no Ready, no merge, no close of #1016, no write to `main`, no sibling merge, no new task. Holds #985/#982, #917, #913/#911, #968, #748, #626, #937/#936, and Bern #934 stay as they are.

Installed consistency remains UNVERIFIED. `next-env.d.ts` was already dirty and was left untouched. npm audit and npm view were not repeated in this correction.
