# Trip edit structure preservation — implementation and evidence

## Result

The shared travel-edit algorithm preserves intentionally unassigned destinations when shortening a trip or deleting one day. It records the stages of the actually removed days at each operation, then removes only affected stages that have become empty. A previous destination with no assigned day is retained with its stable ID, place reference, country, coordinates and position relative to the other surviving destinations. Existing structural date recalculation is unchanged.

An additional reviewed boundary belongs to the same defect: if removing the assigned tail would otherwise remove the entire destination list while open days remain, all existing destinations are retained without day assignments. The algorithm does not arbitrarily choose a last destination. The existing single-stage protection for individual day removal is preserved. Explicit stage removal remains separate and retains its existing last-stage restriction.

New days first use an explicitly requested stage, then the actual immediate anchor day's stage. Only the historical legacy mode or a genuine single-destination trip may fall back to the last stage in the list. A fully unassigned trip or an explicit trip with an open ending stays open; there is no backward search for an earlier assignment. Existing assignment preprocessing and explicit stage creation/extensions are unchanged.

A protected point that was already dayless now keeps its valid optional stage reference, including on title changes and whole-trip date shifts. A point whose actual former day or stage has been removed still detaches as before. Protected amounts, booking status, route facts, content and original dates remain protected; no new point may invent commercial facts.

## Authority, scope and review

Sasa authorized necessary Dev work; Production, merges, new costs and login/2FA remain reserved. Main baseline is `63544e820e912bd275556588c956a09b99b1cf90`, tree `85735a12a34506b586482bd4610e335d4b14051d`. Task commit `58b6e25306a083b13d21dff2429344e0af2e2a42` predates implementation. Draft [#1204](https://github.com/Jetnity/jetnity/pull/1204), branch `fix/trip-edit-structure-preservation-20261115`, remains Draft and unmerged.

Root is the only writer. Journey audit independently established the source defects, call-site and assignment-mode boundaries, the all-destinations edge case and the current protected-file/pin boundary. Its full source review of the five completed code/test files found no remaining concrete finding. Root independently checked the changed runtime and tests, the real Account action and the latest existing RPC definition: the serializer's stage references are written by that unchanged RPC. The reviewed file hashes were verified again before publication. The final PR body binds this review to the published head and records complete CI results.

Runtime changes are confined to `lib/reiseaenderung/anwenden.ts` and `lib/reiseaenderung/geschuetzt.ts`. Meaningful regression tests extend their two existing test files and `lib/reiseaenderung/direct-trip-editing-1.test.ts`. This package adds only its own TASK/HANDOFF documents. Current full lists for #1196/#1197/#1198 contain 102/359/98 changed paths, with no overlap. No UI, entry display, SQL, Auth, API, generated type, permission, provider, package, workflow or global coordination file was changed. No architecture, provider activation, new cost or hosted write is introduced.

## Failures collected and corrected together

The complete initial run of the three existing focused test files executed 110 tests: 88 passed and 22 failed, zero skips. All 22 failures were collected before modifying runtime code. They reproduced lost unassigned destinations, invented day assignment and lost valid stage references on protected dayless points. Seven additional new counterexamples already passed on the baseline. The original 81 tests were retained.

The single correction batch fixed both domain modules together. The same 110 tests then passed, with zero failures or skips. Broader local verification ran all 12 existing edit-domain test files plus 12 related create/assignment/schema/Guest-storage/transfer/lodging files: **494/494 passed**, zero failures/skips. Type generation and full TypeScript checking passed. Scoped lint passed with zero errors and one pre-existing type-only constant warning in `geschuetzt.ts`. All five existing hygiene gates passed: dead code, exports, dependencies, Admin API protection (12 routes on this main baseline), and schema references. `git diff --check` passed.

The 29 added cases cover fully/partially unassigned trips, duration shortening, individual day removal, actually emptied stages, explicit stage removal, all destinations in the removed tail, fresh operation-local scope in a compound batch, open-ended extension/insertion, actual assigned continuation, explicitly requested destinations, single-destination/legacy behavior and protected dayless points with a price or booking status.

The integrated tests call actual Guest creation with synthetic confirmed Paris/Rome place facts, actual manual preview, Guest save, reload and idempotent retry. Account tests call the actual manual Account preview/save coordinator and actual `aenderungAlsNutzlast` serializer with in-memory reader/writer ports. These prove preserved stage IDs/place facts, null day assignments and dayless protected `stage_id` at the RPC payload boundary; they do not claim a real account login or new hosted persistence proof. Existing revision/fingerprint/readback tests remain unchanged and pass.

## Remaining verification and handoff

At this committed handoff, normal published-head CI/build and final independent review are pending. The normal repository workflow supplies its native and browser gates; no locally blocked PostgreSQL/Chromium sockets were retried. There is no product UI change requiring new browser infrastructure. The final PR body must identify the exact implementation head/tree, normal CI run and Preview status, including every failed gate.

The known separate Auth `uri_allow_list` versus `config.toml` drift is not changed here. Counts #1202 remains separately prepared/unapplied because of the installed entry-lane BG1 contract. Neither issue is resolved or bypassed by this travel correction. Positive hosted Account/real-device acceptance remains unrun without Sasa's legitimate session.

Do not mark Ready. Do not merge. Sasa owns integration and Production. A future integration must recheck the then-current sibling branches and their tests; these independent Drafts are not an already combined main release.
