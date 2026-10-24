# R105 live continuation checkpoint — 24 October 2026, 21:21 UTC

Technical Lead checkpoint. This supplements, without rewriting, the earlier [19:50Z handoff](JETNITY_CHAT_TRANSITION_R105_2026-10-24_1950Z.md). Reconstruct fresh live state before acting. The canonical live index remains [#751](https://github.com/Jetnity/jetnity/issues/751), currently R105 V12. This is the existing finite A → C → B batch, not a new product slice.

## Verified current state

- Mode NORMAL. Accepted actual main **43124e28f0c2ac366d25a86787f055b885b1fc00**, tree **e98cfcb281078a9eb629ec9ab09ceed7383f46f5**.
- A/#999 is MERGED and independently POST-MERGE PASS; #996 CLOSED/completed. [TL closure6389573939](https://github.com/Jetnity/jetnity/pull/999#issuecomment-6389573939) binds actual main push CI40121989960, App120955360678/Auth120955360969 and Production dpl_9wwkAQCuudQzVWJtN7bWwv4N9pWN plus jetnity.com alias. Actual logs:7196 tests,7194 pass,0 fail,2 explicit optional browser skips;144 existing lint warnings,0 errors. Exact A accepted tree equals the normal merge tree. All closure writes were read back.
- C/#1001 remains Draft. Reviewed product head **be2c4932fc58d0bdca78e91cc7837a666201715f**, tree4c6315603edb46937eab1982e93748a4b6558614. Latest live head at this checkpoint **a0106b362eb837107f43d05f307cf59cb0611e43**, treecff88354ab319652114c8ba1cb3233355ebafefe. This is a TL-only single-file ADDENDUM V2 commit with sole parentbe2, not a completed code repair.
- B/#1000 remains Draft and STOP at **5a28496521c66cb2407f1f897b6c79646df1ea94**, tree9711fcf35161873792d713064203e5a49892b7b5. It awaits C acceptance and same-session accepted-main integration. No integrated full PASS.
- Existing continuity Draft#1002 carries this checkpoint. It is not a fourth product writer and has not been merged.

## C correction V4 is already dispatched and acknowledged

[TL V4 comment6389629355](https://github.com/Jetnity/jetnity/pull/1001#issuecomment-6389629355) is binding together with immutable [TASK ADDENDUM V2](https://github.com/Jetnity/jetnity/blob/a0106b362eb837107f43d05f307cf59cb0611e43/docs/JETNITY_MANUAL_JOURNEY_EDITOR_COMPLETION_1_TASK_ADDENDUM_V2_2026-10-24.md), blob7ef1b8a9883e841b25f1df4e2f3483b26f756ede. It explicitly allows only minimal manual-stay-parent focus ownership plumbing, existing narrow fixes and normal merge of accepted main43124. TASK, accepted PLAN and ADDENDUM V1 stay immutable.

Original author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**, model **grok-4.7-high-fast**, same session **bc-02fbe98d-97ba-4c0b-a3b0-10857d784379**. Genuine receipt [6389630629](https://github.com/Jetnity/jetnity/pull/1001#issuecomment-6389630629) at21:15:40Z links that exact session. It proves receipt, not completion. Do not redispatch while the current correction is active.

Findings bound by V4:
1. **C-P2-CODE-04** — independently executed two-stay focus failure. Pending A, then B open/edit or cancel, then A success/domain/rejection:6/6 steal exact B control focus. Genuine A result/draft/pending and B state were otherwise correct. One callback per case, no page errors or external requests. Source and artifact hashes checked against Git. The original failure remains a failure.
2. **C-P2-PROOF-04** — capture suspendRenders baseline before suspendConnection/suspendFlightTrip and pass it to awaitSuspend; retain real increment and committed-context assertions. The old source could miss an already observed render.
3. **C-P3-CONTEXT-05** — root ran real schema/helper: same-id valid trip A(origin a\u001fb,stage c) and B(origin a,stage b\u001fc) normalize differently but collide under the old delimiter key. Encode the existing tuple unambiguously and preserve stable equivalent-input keys. No schema/character-policy change.

V3 flight source repair and the P3 Behavior/Layout diagnostic-retention repair are already present. Do not ask the agent to repeat the completed P3 work. All16 earlier C evidence files must remain byte-identical. New proof output goes to fresh directories.

## Durable independent evidence and prepared final checks

New evidence directory: `docs/evidence/r105-chat-transition-2026-10-24_2121Z/`.

`stay-focus-pre-v4/` preserves exact runner, fixture, result and original manifest from the six executed failures. Result SHA256 **59d33a477ed33d7ea451431cf0c222c2eecd004c48b7f3342a91a309ad28c238**, manifest **cc2cc06eb30e739bee9c511c2338fb5a00c631fca78898dd4f1dfe205792c5b7**. Six screenshot hashes remain in that manifest; those local screenshots are not copied into this checkpoint. The executable fixture and structured observations are durable. This is isolated synthetic Chromium with minimal focus CSS, not layout/hosted/device acceptance.

`prepared-final-c/` is **PREPARED_NOT_EXECUTED**. Root read the runner envelopes, original flight case body, copied fixture and pure preset runner. Helpers are independent review assistants, not Cursor/Guardian or product writers.

- flight/run.mjs SHA256 **b18d3b8b0174ae8ee8ec82ca0f31accf6c33d2238332af9b738e3d971685db3e**: original nine flight case-body bytes unchanged. Stronger envelope requires exact HEAD/tree/clean source,9 true cases, empty diagnostics and nonzero failure exit. Success status THREE_CONTROLS_AND_SIX_OWNERSHIP_CASES_PASS.
- stay/run.mjs SHA256 **45a70cc8561dd12e0685dc244ea56cf291b683eb40d1b1e3ce698159d738891f**: six original failure case-body bytes unchanged plus3 current-owner A success/domain/rejection controls, preventing blanket focus suppression. Success NINE_STAY_CASES_PASS.
- preset/run.mjs SHA256 **d18a97c61a55699b4143cf94fcc3370466c47da1358e56a5901152392f2d132c**: real normalized helper collision/stability checks. Success PRESET_KEY_REGRESSION_PASS,3 cases.
- prepared-files.sha256.json SHA256 **feb1c441c9bb04a1b43bf94080dbed59cfe277975f0776ab0fc7f03f6815b1d5**. Envelope adaptation diffs and source-body hashes are included.

Run each only after final integrated source review, with arguments `REPO FULL_HEAD FULL_TREE`; each creates a fresh unique output. Local path currently /tmp/jetnity-r105-c-final-independent-mLxGm4. The prior durable nine-flight preparation at90412e remains untouched and unexecuted.

Exact materializer remains /tmp/jetnity-r105-materialize-update.py, SHA25672d491e378a6548637c89234ef4081065ffee432c43bee37189a3a602f4e1fc1. Import exact missing Git objects/blobs from the connector, preserving signed commit payload/signature newlines and independently checking object hashes. Historical0c37 is the graph-closure anchor for this shallow reconstruction; actual-main43124 ancestry/merge-base/zero-behind must be checked separately. Never present historical-anchor ahead/behind as current-main evidence.

## B baseline review and pending proof witness correction

Original author: **Jetnity Account Booking Folder Completion 1 — Cursor Generation 1**, modelgrok-4.7-high-fast, session **bc-a34030c7-4c19-4c9f-863f-193cfdfa34da**. Root and independent helper read the owned runtime, accepted TASK/PLAN, tests and synthetic harness. No new product-code blocker was confirmed. The known Symbol sentinel, applied-address form key and real loader/component repair are present.

A narrow evidence concern remains to resolve during the eventual same-session main integration: ablauf.ts waits for the submit marker before the async load finishes, then reads the last query without a fresh-request witness; its Enter case begins with invalid weiter=seite-2. Next/retry text.includes('Flug 1') can also match first-page Flug10–19. Root read these exact conditions. The separate loader walk gives additional evidence, but these UI assertions alone do not prove a new correct second-page response. Use a valid continuation, a fresh query/request witness, finished applied-view/address state and exact card ID/title. Preserve all data/filter/error/history checks and the explicit non-Next-router limitation. No B correction has yet been dispatched at this checkpoint. B remains STOP until C post-merge acceptance.

No hosted DB/PostgREST/RLS acceptance is claimed. Source still uses the existing authenticated server client;50 visible+1 sentinel; filters before limit; no identity override, writes, migrations, RLS/Auth or provider change.

## Exact next unfinished step

Wait for the active original C author to deliver and STOP. Pin final head/tree and fresh main. Review full final diff and each V4 correction, immutable contracts/historical evidence, final behavioral/layout/regression proof, actual native App/Auth logs and exact-head Preview, review/toolbar threads. Execute the prepared independent final checks; false flags/nonzero status are not PASS. Any further relevant failure stays with the same author/session.

Only after complete independent TL PASS may TL mark Ready and normal SHA-locked merge. Then verify actual-main push CI and Production+jetnity.com alias, close#998/update PR/#751. Only then dispatch B main synchronization and the bounded proof-witness correction in the original B session, followed by its own full re-gating. No new product slice.

## Standing limits and risk state

No new P0/P1 confirmed in this finite batch. C has the two named P2 and one P3 open until independently fixed; B UI witness weakness is open evidence work. A optional browser skips and non-atomic cross-tab guest setter limit remain disclosed. Old CI/Preview success is not final-head acceptance.

All #985/#982 scoped HOLD, #917 denied hosted-readback STOP, #913/#911 privacy block, #968 historical Preview cleanup PAUSE, #748 personal-browser suspension, #626 STOP, Bern PAUSE, #944 no-autostart, #585 deferred and other existing gates remain. No retry/rephrase/reroute/manual substitute of held work. No hosted data or credentials, personal browser, old Preview inventory, provider/model/paid activation, protection change or launch/indexing action.

The #751 protected historical suffix beginning `## 3. Exact next external step` remains byte-identical (8247 characters). Latest material report remains COS-20261024-1122-017/comment6382484050 with PARTIAL intake6382750378; no newer material had been found in the latest bounded read. Refresh the marker when next gating, not by assuming old evidence remains current.
