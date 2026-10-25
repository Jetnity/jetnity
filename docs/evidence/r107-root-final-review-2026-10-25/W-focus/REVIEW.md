# R107-W R2 bounded independent re-review

Reviewer `/root/dependency_review`, read-only helper. Root Technical Lead owns formal disposition, Ready and merge. No external review or acceptance was issued.

## Outcome

The original editor cancellation/focus defect is corrected in the independently exercised cases. The promised real keyboard case and control-targeted screenshots are present; focused lint is clean and the previous warning claim has been corrected.

The additional P2 in root comment `6400997304` remains unchanged and independently reproduced: the edit form's Abbrechen button escapes its own card at 768 and 1440 pixels with root text 32px and is covered by the adjacent card. The candidate packet is delivered, but the correction is incomplete. This is the same existing R2 layout finding, not a newly introduced regression.

## Exact candidate and complete handoff

- PR #1018, open and Draft; branch `feat/r107-account-world-visit-workflow-1`.
- Head `a547366a5107e445642f980b621dff7c7b5adaa8`, unchanged in a fresh read after the mounted check.
- Tree `32242ff4f3e1cb0ce922d960e95d959f67a3ddf1`.
- Main / merge-base `a74c443c6be3f064f150fcf021ab6154bda325e5`; independent compare 14 ahead / 0 behind, 51 changed paths including retained/new evidence.
- Author: Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1.
- Original session `bc-af293d35-d2af-43d8-b193-9fbaab7c351b`, attested runtime `grok-4.7-high-fast`.
- Same-session comment `6400974498`, updated 2026-10-25 18:00:35 UTC, explicitly delivers final a547 and stops for independent re-gating. Updated HANDOFF and lane documents exist.
- Product/proof head named by the receipt: `31dcf14acd919b729b8cd0d05a3c4dc3960d33e7`, tree `ff541a3da49668b5684858b96d606707c0cd6675`.
- TASK unchanged: `9fb3c8f242014761af64aa342a3222cf7d15f180`.
- PLAN unchanged: `771313c5c3ee601598d41e83e9ad2e1b6f6b73a4`.

The 90b2-to-a547 delta contains three commits and 23 paths. Only `AccountBesuche.tsx` changes product behavior: it adds an editor-cancel path, current-surface/epoch information and a button-specific focus target. The form footer file is not changed. The other changes are the lane runner/test, documentation, a receipt and targeted PNGs/manifest. Final a547 is documentation/evidence only after the proof-code head.

## Remaining P2: editor footer is not contained

Actual fresh-head mounted test: dense40 fixture, first12 cards visible, first card's editor open, project CSS, reduced motion, root font32px. Card, form and both action-button rectangles were recorded at every required width.

| Viewport | Card width | Form bounding width | Form client / scroll width | Cancel right edge | Outside card | Outside form |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 320 | 320 | 270 | 268 / 268 | 262 | 0 | 0 |
| 390 | 390 | 340 | 338 / 338 | 332 | 0 | 0 |
| 768 | 376 | 326 | 324 / 551 | 576.578125 | 200.578125 | 225.578125 |
| 1440 | 469.328125 | 419.328125 | 417 / 551 | 576.578125 | 107.25 | 132.25 |

All measurements are CSS pixels. Section and document overflow remain 0 at all four widths. These do not establish containment inside an individual card. The new independent viewport screenshot at1440 visibly shows the neighboring card painting over the cancel button and cutting off its label. It is not merely a locator-image crop.

Source remains `components/account/AccountBesuchFormular.tsx:233–249`, blob `b500f9b44b18339dc86342837e43f9ac69ef9485`: the footer unconditionally switches to `sm:flex-row` while sitting in a narrow multi-column card. Its class list and both button classes are unchanged from the reviewed failing head. There is no local footer layout correction.

The new author `mounted.ts` still measures only section/document width. It does not assert card/form/button bounds. It creates images only at320/1440, not the addendum-requested 768 control image. Consequently, the author-reported15/15 cannot close this known defect. REPORT/HANDOFF describe the focus/screenshot/lint fixes but do not resolve the layout addendum.

Evidence: `bounded-results.json`, last case; `screens/editor-viewport-1440.png`; also `screens/editor-card-768.png` and `screens/editor-card-1440.png`.

## Corrected focus and preserved keyboard behavior

Seven specific interaction checks passed on the real current component:

1. Enter opens A's editor; real pointer click focuses its year field; Escape closes it and returns to A's Bearbeiten button. Zero actions.
2. The actual Abbrechen pointer click closes A and returns to A's Bearbeiten button. Zero actions.
3. Search Escape and create-field Escape retain their own focus and leave A's editor open; opening B closes A and retains B's opener focus. Zero actions.
4. Revoke cancellation via real Enter returns to the same visit's revoke opener. Zero actions.
5. A real Enter pair in the edit year field produces exactly one captured edit with A's id and year2017.
6. A real Enter pair on create produces exactly one country-only PT create.
7. A real Enter pair on revoke confirmation produces exactly one revoke for A's id.

Keyboard receipts capture actual trusted keydown events. Initial focus placement is only setup; these checks do not present programmatic requestSubmit as keyboard input. The author runner now also contains actual `page.keyboard.press` calls and accurately labels its separate same-turn requestSubmit admission test. No broader mutation/recovery matrix was repeated.

## Screenshots, receipt binding and lint

All13 downloaded final-head text files independently match GitHub Git blobs. All12 author receipt source/proof SHA-256 bindings match the exercised current files and unchanged retained harness/fixture files. The compiled project CSS hash matches the author's exactly:

`7e913d744353e72444dcbbf08cb9241f34836143b0961d8703e0c26faaa85e79`

Four exact-head author PNGs were independently downloaded, checked against their Git blobs and visually inspected: editor320, editor1440, revoke1440, and failed-read edit recovery320. They do show the intended controls, not the map. The editor1440 image visibly cuts off Abbrechen at its right edge and does not establish containment. The independent viewport image additionally proves actual neighboring-card occlusion. The recovery panel shows the unresolved edit and explicit Liste prüfen control. Other author images were not independently inspected in this bounded re-review.

The retained manifest/receipt identify element capture, layout viewport, root32, target selector, state, CSS and source bindings. The image-boundary labels are accurate. The missing card-specific assertions and requested768 image remain part of the uncompleted layout correction.

Focused lint of the three changed code/proof files (`AccountBesuche.tsx`, `mounted.ts`, `run.mjs`) exits0 with **0 warnings / 0 errors**. The unused existsSync import is removed. REPORT now correctly acknowledges that its previous claim about none of182 warnings being in this lane was wrong, and reports181 global warnings. This helper independently verified the focused zero-warning result; it did not rerun repository-wide lint to claim the global total.

## Artifacts and execution boundary

- `bounded-probe.mjs`, `bounded-results.json`: reviewed bounded runtime and exact observations; exit1 solely because the existing layout test fails.
- `bundle-inputs.json`, `source-blob-verification.json`, `receipt-source-bindings.json`: actual source bindings.
- `focused-lint.json`: actual zero-warning changed-file result.
- `author-image-verification.json`: exact public GitHub PNG bindings.
- `live-identity.json`, `verification-record.json`: fresh identity and artifact hashes.

Execution used Node v24.22.1 and existing Chromium140.0.7339.16 from `/tmp/r106-review-browsers`; no install. Actual component/project CSS plus existing action/navigation shims, locally intercepted invalid-domain page. No hosted Account, native Node22 CI, full Next router, SQL/RLS or Production claim. A nonfatal old Browserslist-data warning was observed; no update was performed.

Prior world review artifacts remain preserved. No source implementation changes, credentials, held branch/source work, external mutations, Ready or merge occurred. Root handles formal correction and remaining native/Preview gates.
