# R107-W — Account World Visit Workflow Completion 1 — STATUS

Date: 2026-10-25

## Main-sync1

This is a history-preserving merge of authorized main into the same branch. It is not a new visit execution, not a candidate FINAL PASS, not Ready, and not a merge to main. Draft #1018 stays draft.

| Field | Value |
| --- | --- |
| Logical name | Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1 |
| Actual runtime model | `grok-4.7-high-fast` |
| Session | https://cursor.com/agents/bc-af293d35-d2af-43d8-b193-9fbaab7c351b |
| Sync commit | `5888614f608d9c066fbf1d289ce115fad6377e82` |
| Sync tree | `6d2f07857af87adba66687c9fd395d90d22879dc` |
| Parents | `c68ef9e152a35fbe94f54fa753fe1f9c64ac4caa` and `30119c5affbd391cce31f2ceade2e4b068dfbcba` |
| Authorized main | `30119c5affbd391cce31f2ceade2e4b068dfbcba` |
| Main tree | `76654739b7882f954508299721c5d40fbb4df4b0` |
| Ahead / behind at the sync commit | 17 ahead / 0 behind |
| TASK blob | `9fb3c8f242014761af64aa342a3222cf7d15f180` (unchanged) |
| PLAN blob | `771313c5c3ee601598d41e83e9ad2e1b6f6b73a4` (unchanged) |

The commit that adds this section comes after the sync commit. Re-read that later head. Do not treat `5888614f` as the review head once this section exists.

Incoming main changed 128 paths. None of them are this lane's paths. Visit product, runner, harness, receipts, screenshots, fixture, package, lockfile, Tailwind config, and `styles/globals.css` match `c68ef9e1`. Dense fixture SHA256 `d2771930f5392fcd5b31889857c82241220ff4d6d70a5fd401aa438aea84aa14`. Historical receipts were not rewritten. The a547 packet still exits 1 because its old layout case failed. The separate c68/e4b4 geometry supersedes that layout result only. Generated CSS byte identity is not claimed. Retained c68 CSS SHA256 `b1ca9a5fdfee85f34812d64c71cb7d643ff5ae7b74ce9c89e939401d7b6586cc`. The root CSS binding check is pending. No containment replay was run. Fresh Typecheck, Lint & Build, Auth, and Preview IDs are reported after the push, not in this file.

## Pre-sync correction record

State: the candidate re-review R2 findings and the R2 layout addendum were corrected before this sync. The main SHA and ahead/behind in the table below are that correction's record, not the integrated head.

| Field | Value |
| --- | --- |
| Logical name | Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1 |
| Actual runtime model | `grok-4.7-high-fast` |
| Session | https://cursor.com/agents/bc-af293d35-d2af-43d8-b193-9fbaab7c351b |
| Branch | `feat/r107-account-world-visit-workflow-1` |
| Earlier re-reviewed head | `90b2bbdcea77c5da28b2d90290eaf093adbb8235` |
| Correction code head | `e4b4c0bb16a68c982a9bf65445c9aab01a4bed15` |
| Correction code tree | `fced10150f700e318b4d3cbb6b5b15554caa70cb` |
| `origin/main` / merge-base | `a74c443c6be3f064f150fcf021ab6154bda325e5` |
| Main tree | `c1fe5a50b0da710ef425674057f782b1dff6f8bc` |
| Ahead / behind at the correction code head | 15 ahead / 0 behind |
| TASK blob | `9fb3c8f242014761af64aa342a3222cf7d15f180` (unchanged) |
| PLAN blob | `771313c5c3ee601598d41e83e9ad2e1b6f6b73a4` (unchanged) |
| Operating mode | `NORMAL` |
| Tracking | #1013, batch #1011 |

The corrected receipt is `docs/evidence/account-world-visit-workflow-completion-1/run-e4b4c0bb16a6.json`. It names `e4b4c0bb`. This status and the other delivery notes sit on the following commit. Re-check ahead/behind there.

`origin/main` was fetched again immediately before this note and was still `a74c443c`. No sync was performed.

## This correction

- The editor inside a visit card keeps **Änderung speichern** and **Abbrechen** stacked. They stay inside that form and that card at 320, 390, 768, and 1440 with a 32px root font. The measured right edge is 66px inside the card at 768 and at 1440. The earlier spill was 200.58px past the card at 768 and 107.25px at 1440.
- The create form still places its button in a row from the small breakpoint upward. Its button stays inside the create form at the same four widths.
- No overflow is clipped or hidden, and no global CSS changed.
- Editor Escape and **Abbrechen** still return focus to that visit's Bearbeiten control. The mounted runner still uses real Enter, Escape, and a pointer click. `requestSubmit` remains labeled guard admission.
- Card screenshots are element captures at 320, 390, 768, and 1440. Older receipts `run-82260869d6cb.json`, `run-8b1e6ac0185c.json`, and `run-31dcf14acd91.json` were not rewritten.
- Project lint is 181 warnings and 0 errors. None of those warnings are in this lane's files.

Next actor: root Technical Lead, fresh-head re-gating. Cursor does not Ready, merge, close #1013, write main, integrate a sibling, or start another task.
