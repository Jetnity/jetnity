# Manual Journey Editor Completion 1 — STATUS

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379`
Model: `grok-4.7-high-fast`
Issue: #998
Draft PR: #1001
Branch: `fix/manual-journey-editor-completion-1`

## State

Review fixes for Technical-Lead CODE REVIEW V3 are in the runtime commit below. This is not a Technical-Lead PASS, not Ready, and not merged.

- Binding TASK V1 and addendum V1 are unchanged.
- Accepted plan remains `e763caa51b0213bd3c0e71afe948b00ab402eb5d`, blob `09d936699a0ba16ba035ceea74d6c00bb530bebd`.
- Reviewed evidence head `52779d7f5307b7de5389e76e982c2eb208aa04c6`, tree `886ef27c9fd48cdb08c3d9bd10c88112d46dd28b`, is the parent of the product fix.
- Product runtime head: `ecdaef7b7ecb24b34b3bc482810ed646a405c807`, tree `2169a040ae2b25d19f8a0fdd77c875603a660687`. `components` and `lib` are unchanged after that commit.
- Harness head / `headAtRun`: `9b11323dccf844d850dd444b1b4d205bf754109c`, tree `e612aec3d10878322e789d6f7b47220b093605c2`. It records the behavior context's page errors and blocked requests separately from the layout contexts and asserts both empty.
- Merge-base with live `origin/main` is still `0c37d318c47a758f06634448d6e0de3856bbc6a6`. The harness commit is **12 ahead** of that merge-base.
- Live `origin/main` fetched this turn is `43124e28f0c2ac366d25a86787f055b885b1fc00`. Against that main the harness commit is **12 ahead / 16 behind**. This branch was not rebased. The evidence commit that adds this file is the harness commit's child.
- `sourceSha256` binds the four implementation files. Their flight blob is still the `ecdaef7b` file.

## Review findings addressed

- C-P2-CODE-02: a flight save captures the surface generation before its callback. Settlement cannot adopt a newer generation. The editor's success, domain, and rejection paths move focus only when that generation is still current. The parent graph readback uses the same captured generation. A newer row interaction, including one that has already closed, keeps its control. The saved route still updates when the graph is delivered. The ordinary current-operation success path still focuses and publishes the selected-flight status.
- C-P2-PROOF-03 counting: `behaviorCount` is the number of named scenario groups. It is not an execution count and not an assertion count. This head has 20 groups. Three of those groups each run success, domain, and reject for late R1 (9 executions). `flight-pending-a-newer-b-keeps-focus` is one group with 6 executions: success, domain, and reject, each with B open and B closed. `layoutCount` is 9 separate measurements.
- P3 evidence accounting: the result on `00c09935` left `pageErrors` and `blockedRequests` empty because only the layout contexts were copied. That did not prove the behavior session. `9b11323d` keeps the behavior context, copies its arrays before close, and asserts them empty. Layout contexts are asserted and stored separately. The concatenated arrays are labeled as a concatenation.

## Not claimed

CI, Preview, hosted account, screen reader, native zoom, and a physical device are not verified for this head. Native CI `40106541141` is `c2220a1a` only. No database, provider, payment, or new cost. Author does not Ready, merge, close #998, rebase onto #999, or start a follow-up.

Next actor: Technical Lead, exact-head review of the evidence commit.
