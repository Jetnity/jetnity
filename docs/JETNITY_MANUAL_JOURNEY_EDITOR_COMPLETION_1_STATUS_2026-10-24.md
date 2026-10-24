# Manual Journey Editor Completion 1 — STATUS

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379`
Model: `grok-4.7-high-fast`
Issue: #998
Draft PR: #1001
Branch: `fix/manual-journey-editor-completion-1`

## State

Review fixes for Technical-Lead CODE REVIEW V1 are in the runtime commit below. This is not a Technical-Lead PASS, not Ready, and not merged.

- Binding TASK V1 and addendum V1 are unchanged.
- Accepted plan remains `e763caa51b0213bd3c0e71afe948b00ab402eb5d`, blob `09d936699a0ba16ba035ceea74d6c00bb530bebd`.
- Reviewed code head `c2220a1a2677ab3d25f9701dbfbdb7f586f626a6` is the parent of the runtime fix.
- Runtime head: `0ce2a3faf21baea965c8e9cbbdf35f3181079fcc`, tree `fa09e196e22cffa554836efcb4c7206db89cbc00`.
- Live `origin/main` fetched this turn: `0c37d318c47a758f06634448d6e0de3856bbc6a6`. Merge-base is that SHA. The runtime commit is **6 ahead / 0 behind**. The evidence commit that adds this file is its child. No main synchronization.
- Harness `headAtRun` is the runtime head. `sourceSha256` binds the four implementation files in that commit.

## Review findings addressed

- C-P2-CODE-01: request identity is the committed generation and trip, copied into primitive refs in `useLayoutEffect`. A discarded speculative render no longer advances that identity. The immutability suppression is removed.
- C-P2-CODE-02: a later open draft clears the pending flight readback. A matching closed editor still receives the saved-graph focus. A different trip does not.
- C-P2-PROOF-03: each held request has its own payload and outcome. Behavior cases and layout measurements are counted separately. R103 and R104 reruns record new provenance and leave the historical evidence byte-identical.

## Not claimed

CI, Preview, hosted account, screen reader, native zoom, and a physical device are not verified for this head. Native CI `40106541141` is the reviewed parent `c2220a1a`, not this head. No database, provider, payment, or new cost. Author does not Ready, merge, close #998, or start a follow-up.

Next actor: Technical Lead, exact-head review of the evidence commit.
