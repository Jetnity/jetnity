# Manual Journey Editor Completion 1 — TASK ADDENDUM V3 / TL review V6

Date: 2026-10-24. Technical Lead-owned immutable additive correction to TASK V1 and ADDENDA V1/V2. R105 lane C / issue #998 / Draft PR #1001.

Exact author remains **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**, same genuine Cursor session **bc-02fbe98d-97ba-4c0b-a3b0-10857d784379**, model **grok-4.7-high-fast**. No new generation, model, fallback or writer. This is an immediate compatibility correction within the existing accepted editor task, not a new product slice or a reopened PLAN-only gate.

## Verified failure and source basis

Failed native-gate head **961fa594792b5c07f2e8423b31690f433f858fab**, tree **24a1a3a025853a8e8744a80f1820172157c21c40**. While TL diagnosed that failure, the original author independently pushed candidate repair **1990ef0bc0398823b3cdea6a622f6d18bf4e2486**, tree **e7536d22277b4cb397af216d45442823cfd415a1**, sole parent961, 19 ahead / 0 behind. Actual main and merge-base remain **43124e28f0c2ac366d25a86787f055b885b1fc00**.

Native [CI40135029902 attempt1](https://github.com/Jetnity/jetnity/actions/runs/40135029902) failed. Root read the actual [App120994876886 logs](https://github.com/Jetnity/jetnity/actions/runs/40135029902/job/120994876886): **7200 tests, 846 suites, 7190 pass, 8 fail, 0 cancelled, 2 explicit skips**. All eight failures are in the nine-test suite in `lib/trips/lodging-coverage-truth-1.test.ts`, with `Cannot read properties of null (reading 'useRef')`. Typecheck/lint passed; the five later guards and build were skipped, not passed. Auth120994876790 passed. Actual CI checkout498e9b03a57bcb25e001e33c371aeed7bb9b4edd has parents main43124 + candidate961 and exact candidate-tree equality.

Root and an independent read-only review inspected the test and component. The test's `bedienung()` supplies a React double overriding only `useState`, then directly calls `UnterkunftBestand`. The minimal V2-authorized parent manual-editor ownership wiring now calls two `useRef` hooks. Those reach real React without a rendering dispatcher in this old direct-call fixture. The normal `renderToStaticMarkup` path has a real renderer. Test blob at reviewed961: **878d6649ecdd39d66fe46bd6ede9eb9368d08421**.

The existing task's three named direct-hook adapter paths do not include this file. The author candidate1990 preceded this additional ownership grant; that timing is explicitly recorded, not rewritten as prior authorization. Root independently reviewed its five-line adapter addition and four owned-document updates: the candidate matches the minimal remedy below, with all assertions and product source unchanged. This addendum now explicitly permits retaining and completing that exact bounded fixture repair under TL review. Do not repeat the already-present code change or broaden it. No booking/coverage semantics are opened.

## C-P2-PROOF-07 — exact additional fixture ownership

Only in **`lib/trips/lodging-coverage-truth-1.test.ts`**, only within **`bedienung()`**:

- Supply faithful instance-local, stable `useRef` objects in the existing React double, using a ref cursor and per-instance storage or an equally minimal equivalent.
- Reset that ref cursor with the existing state cursor before each direct render.
- Preserve stable ref identity for repeated renders; do not merely return a new ref object each time.
- Keep the existing `useState` double, booking callback/call recorder, render traversal and all other test helpers unchanged except for strictly necessary ref-slot declarations/reset.
- Preserve **all nine tests and every existing assertion** exactly. No skip, deletion, weakening, catch-and-ignore or return-early workaround.

The already-owned `unterkunft-manuell.test.ts` adapter contains a reference pattern; it need not be changed. No generic test framework/refactor is authorized.

Product runtime, booking lifecycle, coverage/projections, writers, schemas, global contracts/styles, dependencies, workflow and guard logic remain frozen for this correction. Do not undo the verified parent focus-ownership fix. If the narrow adapter does not resolve the reported failures, report the actual additional failure before widening scope.

## Evidence, final-head gates and STOP

1. First fetch and fast-forward the TL-only child of candidate1990 containing this addendum; preserve TASK V1, accepted PLAN and ADDENDA V1/V2 byte-for-byte. Main is already integrated; no new main merge is needed if it still equals43124. Retain the existing candidate adapter, test blob60039f4a7b54c7efe9af332ddc6f31103cb25f98, if the required checks pass.
2. Execute the unchanged nine-test lodging coverage file after the adapter correction. Also run the existing relevant focused editor/helper regression command including that file. Preserve the previous CI failure and distinguish it from the new results.
3. Write any new evidence only to a distinct new owned path. Preserve all prior C and historical artifacts, including the V4 archive. No existing run is relabeled as a new-head PASS.
4. Update only own STATUS/REPORT/SELF_REVIEW/HANDOFF with the precise fixture diff, actual command/exits, exact source/test hashes and head/tree/main relationship. Retain existing proof limitations. No additional product/browser rerun is required merely for the fixture-only author correction; root will bind and execute the final source again. Complete native final-head App/Auth/Vercel gating remains mandatory.
5. Deliver final head and STOP for independent Technical-Lead re-review. After this final delivery, STOP is a write freeze: report later CI failures to TL without unsolicited further commits outside the explicit scope. Changed heads invalidate earlier exact-head gates. Never Ready, merge, close #998 or start a follow-up.

This addendum does not excuse the failed CI or authorize a blind rerun. No full C PASS exists. Integration remains **A → C → B**; B stays STOP until C post-merge acceptance.

All named holds persist, including #985/#982 held review; #917 denied hosted readback with no alternate query/tool/operator/credentials/reapply; #913/#911 privacy block; #968 legacy Preview cleanup PAUSED; #748 personal-browser/CUA suspension; #626 STOP; Bern#934/#937 PAUSED; #944 no autostart; #585 deferred. No hosted DB read/write, credential access, old Preview inventory/probe, protection bypass, provider/model/paid/payment/contract/launch/indexing action.
