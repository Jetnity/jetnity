# W R2 layout correction — independent bounded review

Reviewer: `/root/dependency_review`, read-only helper for root Technical Lead. This is not formal acceptance, Ready, or merge authority.

## Identity and delivery

- PR: Jetnity/jetnity #1018, open Draft, branch `feat/r107-account-world-visit-workflow-1`.
- Head: `c68ef9e152a35fbe94f54fa753fe1f9c64ac4caa`.
- Tree: `a82e2e0744160ea7b6b0fd97782297c6ec30b64c`.
- Base / independently compared merge-base: `a74c443c6be3f064f150fcf021ab6154bda325e5`.
- Independently compared: 16 ahead / 0 behind; 69 total changed files.
- Delta reviewed: `a547366a5107e445642f980b621dff7c7b5adaa8...c68ef9e152a35fbe94f54fa753fe1f9c64ac4caa`, two commits. Sole product delta is `components/account/AccountBesuchFormular.tsx`; remaining changes are bounded proof/evidence/documentation.
- Final delivery is explicit in same-session comments 6400998207 (updated 18:14:09 UTC) and 6401227758 (updated 18:14:55 UTC), both identifying final head/tree and STOP for independent re-gating. This is a complete layout delivery, not an intermediate runtime-only head.
- Author: Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1.
- Session: `bc-af293d35-d2af-43d8-b193-9fbaab7c351b`; author-attested runtime `grok-4.7-high-fast`.
- TASK Git blob remains `9fb3c8f242014761af64aa342a3222cf7d15f180`; PLAN remains `771313c5c3ee601598d41e83e9ad2e1b6f6b73a4`, independently observed in the full compare.
- Author receipt code head/tree: `e4b4c0bb16a68c982a9bf65445c9aab01a4bed15` / `fced10150f700e318b4d3cbb6b5b15554caa70cb`. The subsequent docs head is the review target above.
- Fresh post-test PR read still returned the same c68 head, a74 base, open Draft.

## Bounded result

No additional finding in this correction. The specific editor-footer overlap reproduced on a547 is absent on c68 at every requested width. Full card/form/footer/button rectangles, text DOM rectangles, client/scroll sizes, overflow values and neighboring intersections are retained in `layout-results.json`.

Fixture: actual AccountBesuche, dense40 list with first12 visible, first card editor opened by real pointer click, root font32px, viewport height900. Existing project dependencies and Chromium were reused, with action/navigation shims and a fully intercepted invalid-domain page. No installs, hosted calls, external writes, or product mutations.

| Viewport width | Card width | Form width | Each editor button width | Save / Cancel height | Right inset from card | Editor footer | Neighbor intersections |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| 320 | 320 | 270 | 204 | 112 / 88 | 58 | column | 0 |
| 390 | 390 | 340 | 274 | 112 / 88 | 58 | column | 0 |
| 768 | 376 | 326 | 244 | 112 / 88 | 66 | column | 0 |
| 1440 | 469.328125 | 419.328125 | 337.328125 | 112 / 88 | 66 | column | 0 |

Both editor buttons have nonzero bounds wholly inside their own form and card, and their text DOM rectangles and scroll sizes fit. Form and footer also remain inside their owners. No clipping rule was added. Section/document overflow is0 at all4 widths. Action count0; page errors0.

The create footer remains column at320/390 and row at768/1440. Its button width is254/324/373.140625/373.140625; height112/112/88/88. It is contained at all4 widths, its label fits, and it intersects no visit article. Author font rendering gives a somewhat smaller desktop create-button width; both independently satisfy containment, and compiled CSS is identical.

## Source and proof binding

- New form Git blob: `ca9d6faeddce5fec8fe37feabca781f179c5f6e2`.
- The fix at form line122 and lines233–261 adds width constraints, uses a column footer when `zeitNebeneinander` is false, and wraps full-width editor button labels. Create retains its breakpoint row behavior. Event handlers, disabled conditions, callback bindings and input semantics are unchanged.
- `AccountBesuche`, hook, pure workflow, copy, and harness/shims are unchanged relative to the previously verified a547 packet. Their exact SHA256 values match the c68 receipt. The seven prior focus/Enter/revoke cases were deliberately preserved, not rerun; no changed focus-ownership logic required re-execution.
- All9 fetched changed text files match their exact Git blobs (`source-blob-verification.json`).
- All12 author source/proof hashes match staged/unchanged exact bytes (`receipt-source-bindings.json`). Bundle metafile proves that the actual new form plus the unchanged reviewed current product files were inputs (`bundle-inputs.json`).
- Compiled project CSS SHA256 is exactly `b1ca9a5fdfee85f34812d64c71cb7d643ff5ae7b74ce9c89e939401d7b6586cc`, matching the new author receipt. Tailwind used the existing config/content with the prior form path excluded and the exact current form supplied as raw TSX content; no test CSS overrides were added.
- New mounted proof now measures card/form/button/text containment and neighboring-card intersections at all4 widths; it asserts the create/editor footer directions and expected button labels. Editor screenshots now target the containing article at all4 widths. This resolves the previous evidence gap where section/document overflow alone hid the spill.
- All4 exact repository editor PNGs downloaded from the pinned public raw URLs match their known Git blobs. All4 were visually inspected: each shows the open editor, complete save/cancel controls, and both buttons inside the visible card. Own screenshots are retained too, and own1440 was visually inspected. These are honestly labeled element captures, not viewport crops.

## Records and limits

- `layout-probe.mjs`: reviewed layout-only isolated runner.
- `layout-results.json`: raw full geometry and zero-action result, CSS/bundle hashes and prior interaction receipt SHA256.
- `screens/editor-card-{320,390,768,1440}.png`: own four captures.
- `author-image-verification.json` and `author-images/`: exact repository-image download and Git/SHA256 binding.
- `source-manifest.json`, `source-blob-verification.json`, `receipt-source-bindings.json`, `bundle-inputs.json`.
- `live-identity.json`: exact identity, product patch, same-session final delivery texts.
- Prior packet remains unmodified at `/tmp/r107-world-r1-review/core-r2-a547`, including seven actual-keyboard/focus/Enter counterexamples and original failing layout evidence.

Native CI, deployment evidence, full project lint/tests, hosted Account, SQL/RLS, full Next router/device proof and formal Technical-Lead acceptance belong to root. This bounded follow-up did not rerun them or promote older gates to the new head. No further optional test expansion was performed.
