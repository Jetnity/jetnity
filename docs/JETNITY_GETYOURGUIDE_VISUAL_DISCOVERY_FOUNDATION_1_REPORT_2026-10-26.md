# GetYourGuide Visual Discovery Foundation 1 — REPORT

Date: 26 October 2026.
Author: Jetnity GetYourGuide Visual Discovery Foundation 1 — Cursor Generation 1.
Tracking #1038. Draft PR #1039.

This report covers the Review R1 correction. The first foundation remains on `3051d4d868bb4139f1dd5a9f70e3247bd084f8cd`. Root reproduced the defects below on that head. This correction does not activate the provider.

## What changed

- `components/trips/GetYourGuideAktivitaeten.tsx` gives every load its own node, detaches that node before disposal, and keeps country radios whenever a choice must remain. A synchronous throw from `laden` becomes the recoverable error state. A fulfilled decline does the same immediately: that load is aborted, detached and disposed, and the fixed German sentence is shown. A successful result keeps its node.
- `lib/activities/getyourguide/kontext.ts` puts place type and public identifier into the operation key. Country evidence is deduplicated by read and checked per occurrence. Unresolved or conflicting extra stages do not auto-select the one remaining country. A selected day accepts a city, region or island only when the canonical country code is already two uppercase letters. A missing or malformed code is not replaced by the stage hint.
- `lib/activities/getyourguide/aufloesung.ts` is the generation boundary for a late exact confirmation. The application does not call it against Places.
- `lib/activities/getyourguide/widget.ts` adds `kanonBestaetigen`. `ANWENDUNGS_NAHT` sets it to null, beside the empty mapping and the null renderer.
- `scripts/getyourguide-visual-discovery-1/gegenprobe.tsx` mounts the counterexamples with a renderer that ignores abort. The local server answers `POST /api/activities/search` with one synthetic card so the native result is populated.
- Native `AktivitaetenBereich.tsx`, `suchlebenszyklus.ts` and `lib/places/aktionen.ts` were not edited.
- ADR-0221 now records the R1 precision. The gate stays closed. Work V2 is recorded as received evidence, not as a registry.

## What the checks showed

Focused GetYourGuide tests: 34 passed, 0 failed. Node v22.23.4. Added coverage: same place id as city and region, mapping-only identifier change, both conflict orderings, an unresolved extra stage, San José as city and region in two countries, Lisbon as a further destination, deduplicated reads, late confirmation that drops a foreign id and a caller's error text, and a selected day whose canonical country is null, empty, lowercase or otherwise not two uppercase letters. City, region and island keep a ready result for uppercase agreement and a contradiction for a different uppercase code.

Mounted harness, headless Chromium, after the final component edit: exit 0. Ten requests, all `http://127.0.0.1`, including one synthetic search POST. Zero GetYourGuide, Supabase, GeoNames or other external requests. The cooperative page still records 7 loads, 7 disposals and 7 aborts. The counterexample page starts A, switches to B, returns to A, retries, repeats a stage, changes type and mapping, keeps a harmless reallocation, changes country by keyboard without remounting, and withdraws permission. The late writer ignores abort. Visible results stay on the current node. A thrown setup error and a thrown disposal do not remain as page errors or as URL text. The native card title “Synthetische Bootsfahrt” stays after those failures. Viewports include 320, 390, 768, 1440 and 200% root text. Screenshots are synthetic and live under `/opt/cursor/artifacts/gyg-visual-discovery/`.

`eslint .`: 0 errors, 175 warnings, exit 0. The warnings are the existing set. No new warning was left in the edited GetYourGuide files.

`check:dead`, `check:exports`, `check:deps` and `check:api-schutz` exited 0. `check:schema-bezug` exited 0 and still reports the pre-existing LOCAL/UNAPPLIED RPCs. No new RPC.

`npm run typecheck` and `npm run build` exited 0. `next-env.d.ts` was not kept as a change.

The selected-day addendum was rechecked on Node v22.23.4. Focused GetYourGuide tests: 34 passed. The mounted harness still exited 0: ten localhost requests, zero external requests, 7 loads, 7 disposals and 7 aborts on the cooperative page.

Full `npm test` on that addendum: 7359 tests, 885 suites, 7343 pass, 11 fail, 5 skipped. The 11 failures are local PostgreSQL proofs. They are the same class as on the reviewed head and are not fixed here. The 5 skips are the existing native-PostgreSQL, CI-only and shared-layout-audit skips.

Review R2 was rechecked on Node v22.23.4. Focused GetYourGuide tests: 34 passed. The mounted harness exited 0: ten localhost requests, zero external requests. A fulfilled decline detaches and disposes its own node before another click, a throwing disposer does not leave that node mounted, retry still reaches a new display, and a late decline leaves the newer display in place. The cooperative renderer still supplies the sentence “Die synthetische Prüfung ist fehlgeschlagen.” The page shows the fixed sentence instead. That is the original probe, recorded here, and it is no longer the visible contract.

`npm run typecheck`, `npm run lint`, the hygiene commands and `npm run build` exited 0 on this correction. Lint remains 0 errors and 175 warnings. The full `npm test` suite was not repeated. Its last observed result remains the addendum counts: 7359 tests, 7343 pass, 11 fail, 5 skipped. The 11 failures are local PostgreSQL proofs.

The enlarged-text correction is local to the GetYourGuide heading and its action labels. They can break inside their own boxes. Root's harness on `22cbfb77` exited 1 with `Überlauf langer Name: Seite 324px bei 320px`. The post-fix harness in this environment exited 0 and also checks that the heading and buttons stay inside their content box and inside a clipping ancestor. Native layout and global CSS were not changed.

No migration. No new dependency. No package, workflow or global CSS change.

## Security and cost

The application path cannot be opened. The renderer still receives only the three public fields. The closed path does not confirm a place. Exception text is not shown. No secret, service role, provider call or trip write. No new ongoing cost.

## Honest limit

The synthetic card and the synthetic GetYourGuide node are not provider offers. Work V2's sample ids were not copied into the runtime. A green harness does not mean pictured offers are available.
