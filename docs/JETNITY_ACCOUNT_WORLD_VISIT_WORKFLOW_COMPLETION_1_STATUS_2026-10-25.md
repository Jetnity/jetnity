# R107-W — Account World Visit Workflow Completion 1 — STATUS

Date: 2026-10-25

State: candidate re-review R2 is corrected on this branch. Draft PR #1018 waits for a full independent Technical-Lead re-gating of the exact head that contains this file. This is not a candidate FINAL PASS, not Ready, and not a merge.

| Field | Value |
| --- | --- |
| Logical name | Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1 |
| Actual runtime model | `grok-4.7-high-fast` |
| Session | https://cursor.com/agents/bc-af293d35-d2af-43d8-b193-9fbaab7c351b |
| Branch | `feat/r107-account-world-visit-workflow-1` |
| Reviewed head | `90b2bbdcea77c5da28b2d90290eaf093adbb8235` |
| Correction code head | `31dcf14acd919b729b8cd0d05a3c4dc3960d33e7` |
| Correction code tree | `ff541a3da49668b5684858b96d606707c0cd6675` |
| `origin/main` / merge-base | `a74c443c6be3f064f150fcf021ab6154bda325e5` |
| Main tree | `c1fe5a50b0da710ef425674057f782b1dff6f8bc` |
| Ahead / behind at the correction code head | 13 ahead / 0 behind |
| TASK blob | `9fb3c8f242014761af64aa342a3222cf7d15f180` (unchanged) |
| PLAN blob | `771313c5c3ee601598d41e83e9ad2e1b6f6b73a4` (unchanged) |
| Operating mode | `NORMAL` |
| Tracking | #1013, batch #1011 |

The corrected receipt is `docs/evidence/account-world-visit-workflow-completion-1/run-31dcf14acd91.json`. It names `31dcf14a`. This status and the other delivery notes sit on the following commit. Re-check ahead/behind there.

`origin/main` was fetched again immediately before this note and was still `a74c443c`. No sync was performed.

## This correction

- Editor Escape and the cancel button return focus to that visit's Bearbeiten control. Search, the create draft, and another visit's opener keep focus. A late status still does not move focus.
- The mounted runner now presses Enter and Escape. The same-turn double submit stays `requestSubmit` and is labeled as guard admission.
- Screenshots are element captures of the editor, the revoke confirmation, and the recovery panels, each bound to viewport, state, source hashes, and CSS. Section overflow at 320/390/768/1440 with a 32px root font was 0.
- The unused `existsSync` import is gone. Project lint is 181 warnings and 0 errors. None of those warnings are in this lane's files. The earlier report's claim that none of 182 warnings were in this lane was wrong.

Next actor: root Technical Lead, fresh-head re-gating. Cursor does not Ready, merge, close #1013, write main, integrate a sibling, or start another task.
