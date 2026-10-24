# Manual Journey Editor Completion 1 — STATUS

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379`
Model: `grok-4.7-high-fast`
Issue: #998
Draft PR: #1001
Branch: `fix/manual-journey-editor-completion-1`

## State

Review fixes for Technical-Lead CODE REVIEW V2 are in the runtime commit below. This is not a Technical-Lead PASS, not Ready, and not merged.

- Binding TASK V1 and addendum V1 are unchanged.
- Accepted plan remains `e763caa51b0213bd3c0e71afe948b00ab402eb5d`, blob `09d936699a0ba16ba035ceea74d6c00bb530bebd`.
- Reviewed evidence head `9c80c8ffa95589d8be4922ca1eb55ecdf627df7f`, tree `933511932b486d848e75f5a510aa812ce49f9158`, is the parent of this runtime fix. CODE REVIEW V1 parent remains `c2220a1a2677ab3d25f9701dbfbdb7f586f626a6`.
- Runtime head: `fc0999815fe1b002f3b56978842d8653966466d8`, tree `7374d03f43d12e5ce7f026a58bf837d2b86ddbb3`.
- Merge-base with live `origin/main` is still `0c37d318c47a758f06634448d6e0de3856bbc6a6`. The runtime commit is **8 ahead** of that merge-base.
- Live `origin/main` fetched this turn is `43124e28f0c2ac366d25a86787f055b885b1fc00` (merge of #999, lane A). Against that main the runtime commit is **8 ahead / 16 behind**. This branch was not rebased and was not synchronized. The evidence commit that adds this file is the runtime commit's child.
- Harness `headAtRun` is the runtime head. `sourceSha256` binds the four implementation files in that commit.

## Review findings addressed

- C-P2-CODE-02: delayed flight readback focus and status follow the flight-surface generation. A newer interaction inside any flight editor, including another row, clears the older entitlement. A matching closed editor with the same generation still receives the saved-graph focus and status. Graph truth stays on the parent trip.
- C-P2-PROOF-03: connection, flight, and stay each run late R1 as success, then domain, then reject, while R2 stays pending and then completes as success alone. The aborted transition waits for a fixture-only suspend witness before abandon or resolve. The two-row A→B readback case is a separate behavior case. Behavior count is 19. Layout count is 9.
- The `9c80c8ff` report called those R1/R2 cases late R1 success/domain/reject. That harness armed R1 as success and varied R2. This report does not repeat that claim.
- C-P2-CODE-01 stays the committed-generation repair from `0ce2a3fa`. This turn does not reopen it.

## Not claimed

CI, Preview, hosted account, screen reader, native zoom, and a physical device are not verified for this head. Native CI `40106541141` is `c2220a1a` only. No database, provider, payment, or new cost. Author does not Ready, merge, close #998, rebase onto #999, or start a follow-up.

Next actor: Technical Lead, exact-head review of the evidence commit.
