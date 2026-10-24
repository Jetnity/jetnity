# Manual Journey Editor Completion 1 — STATUS

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379`
Model: `grok-4.7-high-fast`
Issue: #998
Draft PR: #1001
Branch: `fix/manual-journey-editor-completion-1`

## State

CODE REVIEW V4 repairs are in the runtime commit below. This is not a Technical-Lead PASS, not Ready, and not merged.

- TASK V1 blob `abf6f8f6edc3448b519c9b5370724cfac9b38f10`, accepted PLAN blob `09d936699a0ba16ba035ceea74d6c00bb530bebd`, and ADDENDUM V1 blob `d0bcd55c7feea575f44dc39e176f11d5a0d2cc9a` are unchanged.
- ADDENDUM V2 blob `7ef1b8a9883e841b25f1df4e2f3483b26f756ede` is the fast-forwarded TL commit `a0106b362eb837107f43d05f307cf59cb0611e43`.
- Accepted main `43124e28f0c2ac366d25a86787f055b885b1fc00` was merged with a normal merge. It was re-fetched before this handoff and is still that SHA. Merge-base is that main. No unexpected main commit appeared.
- Runtime / harness `headAtRun`: `b356fd9ff1215174511bd59a0eddc27206e47f69`, tree `de25e46694a26405d9e3b7635fc0caf578a14cb7`.
- Before this evidence commit the branch is **16 ahead / 0 behind** that main. The evidence commit is its child.
- `sourceSha256` in the harness result binds the four implementation files at `b356fd9f`.

## Review findings addressed

- C-P2-CODE-04: a stay save captures the manual-stay surface generation before its callback. A later interaction in a different manual stay editor advances that generation, so the older success, domain, and rejection paths do not move focus. The same editor still receives its own success button focus and its own error alert. The draft and the real outcome remain. Escape, Abbrechen, and the toggle still focus the trigger of the editor being closed.
- C-P2-PROOF-04: `suspendRenders` is read before `suspendConnection` and `suspendFlightTrip`. `awaitSuspend` waits for an increase from that baseline. The committed-context assertions are unchanged.
- C-P3-CONTEXT-05: `vorgabeSchluessel` JSON-encodes the existing normalized tuple. Schema-accepted presets `origin a\u001fb` / stage `c` and `origin a` / stage `b\u001fc` now have different keys. Identical presets keep the same key. The trip schema and character policy are unchanged.
- P3 diagnostic separation from `9b11323d` remains. Behavior and layout lists are still stored and asserted separately.

## Counting

`behaviorCount` 22 is named scenario groups. It is not an execution count and not an assertion count. Three late-R1 groups execute 9 times. `flight-pending-a-newer-b-keeps-focus` executes 6 times. `stay-current-owner-focus` executes 3 times. `stay-pending-a-newer-b-keeps-focus` executes 6 times. `layoutCount` 9 is separate.

## Not claimed

Native App/Auth/Vercel for the evidence SHA starts when this commit is pushed. This file does not record that run. CI, Preview, a hosted account, a screen reader, native zoom, and a physical device are not a PASS inside this commit. No database, provider, payment, or new cost. Author does not Ready, merge, close #998, or start a follow-up.

Next actor: Technical Lead, exact-head review of the evidence commit.
