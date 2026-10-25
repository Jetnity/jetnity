# R107-W — Account World Visit Workflow Completion 1 — SELF-REVIEW

Date: 2026-10-25

Reviewer: the same implementation author. This is not an independent Technical-Lead review and it is not a PASS.

Reviewed correction head: `31dcf14acd919b729b8cd0d05a3c4dc3960d33e7`. The head root re-reviewed was `90b2bbdcea77c5da28b2d90290eaf093adbb8235`. TASK blob `9fb3c8f242014761af64aa342a3222cf7d15f180`. PLAN blob `771313c5c3ee601598d41e83e9ad2e1b6f6b73a4`.

## Re-review findings

| Id | Was found | Resolution in `31dcf14a` |
| --- | --- | --- |
| P2 focus | Escape from the year field closed the editor and left focus on the body. | Escape and **Abbrechen** return focus to that event's Bearbeiten button. Search, the create draft, and another visit's opener keep focus. The mounted test uses Enter, Escape, and a pointer click. One keyboard Enter submits one edit. `requestSubmit` is labeled as guard admission. |
| Screenshots | Dense editor/revoke viewport crops showed the map. | PNGs are element captures of the editor, revoke confirmation, and both recovery panels, with viewport, state, target, overflow, CSS, and source hashes. Overflow remains 0. |
| Lint | Unused `existsSync` in `run.mjs`, and the report said none of 182 warnings were in this lane. | The import is removed. Observed lint is 181 warnings and 0 errors. None are in this lane's files. |

The R1 kind-binding and detached-recovery behavior was left in place. One confirmation is still the only visible revoke confirmation. A returned `{ ok: false }` stays unconfirmed.

## Remaining limits

| Id | Severity | Finding |
| --- | --- | --- |
| W-S1 | P2 limit | Frozen RPCs still have no version token. |
| W-S2 | P2 limit | Full unmount drops the ledger. |
| W-S3 | P3 evidence | `npm test` exits 1 because local PostgreSQL 16 is absent. The 11 failures are not visit failures. |
| W-S4 | P3 evidence | Project lint reports 181 warnings. This lane's files contributed none on this run. The previous "none of 182" sentence was wrong and is corrected in the report. |
| W-S5 | P3 evidence | Element screenshots show the named control. They are not viewport crops. At 32px root font this Chromium clamps `scrollTop` below the list. |
| W-S6 | P3 | After an accepted create, the empty form is the module empty value. Discard uses `BESUCH_FORMULAR_LEER`. The fields are the same six empty values. |

## Not claimed

Hosted Account, SQL, RLS, full Next router, device, a new native CI pass, Preview, Production, Ready, or merge.
