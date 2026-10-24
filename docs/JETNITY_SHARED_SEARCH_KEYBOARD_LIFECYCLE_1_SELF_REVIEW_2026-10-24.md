# Jetnity — Shared Search Keyboard Lifecycle 1 — SELF REVIEW

Date: 24 October 2026
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Session: `bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e`
Model: `grok-4.7-high-fast`
Runtime head reviewed by the author: `ddfee63444b739119233376a2f823e7f027f4026`

This is the author's self-review of the R2 fix. It is not Technical-Lead PASS. A later docs commit does not extend this review to a new runtime head. Any further code head needs a new review.

## Scope check

R2 production edit is only `components/places/OrtSuche.tsx`. The regression lives in `scripts/shared-search-keyboard-lifecycle-1/harness.tsx` and `run.mjs`, plus regenerated evidence. `components/airports/FlughafenSuche.tsx`, `lib/suche/tastatur.ts`, and `components/suche/Suchliste.tsx` are unchanged in this fix. TASK V1 is byte-identical, blob `2e1a966a23bbc302bb59bd367740f2425060f445`. Suchliste blob remains `d69781e62dae73acde6590bde03f3533c8388b77`. No dependency, workflow, config, API, schema, Auth, or provider edit. No main merge. Callers stay read-only.

## Reconciled unchanged-seed claim

R1 correctly stopped the empty→same-seed resurrection. Its clear condition was still wrong. It treated `initialText !== text` as a parent replacement even when `initialText` itself had not changed. Under a parent that keeps the original seed and only stores `onChange` as the canonical value, typing `Edited` left the seed at `Original`. Every ArrowDown set an index and the next render cleared it. Enter then selected nothing. The same fixture selected `geonames:2000001 / Edited Alpha` once on the pre-R1 runtime. The R1 self-review's sentence that an unchanged seed cannot suppress navigation was false.

R2 uses the same distinction as `ortSucheAnzeigetextAbstimmen`. The highlight clears only when `initialText` or the confirmed value name changes, and only when the adopted text differs from the current field. An unchanged seed leaves ArrowDown and Enter usable. An echo that already equals the field updates the seen seed and does not clear. A real change to `""` and back to the previous seed still clears, because those are new adoptions. Confirmed Place-ID and IATA selection are unchanged.

## Behavior still in force

- Escape, blur outside the combobox, and an outside pointer set `offen` false and `aktiv` to `-1`. Tab and Shift+Tab are not intercepted.
- Close does not clear the input and does not call `onChange`.
- `sucheAktiveOption` returns an index only when it names a rendered result row.
- Enter selects only a visible active option. The place role change from a 3-row highlight at index 2 to a 1-row response does not select the remaining row.
- Pointer selection still uses `Suchliste`'s `mousedown` `preventDefault`. The harness selected Beta / `BBB` once by mouse at 1280 and by tap at 390 for both components.
- `ort/empty-seed/1280` still ends with a null active descendant and no canonical Enter selection.
- `ort/fixed-seed/1280` keeps `initialText` at `Original` while the user fills `Edited`, with echo disabled. ArrowDown highlights Edited Alpha. Enter emits exactly one `{id: geonames:2000001, name: Edited Alpha}`.

## Limits, not hidden

- An in-range active index can remain when a later response still contains that index. That is a description of the current list and Enter mapping. It is not this finding, and it is not evidence of another hidden stale selection. This fix does not add response-identity behavior.
- Airport refetch is tied to text or value changes. The R2 defect was the place seed path.
- Local full `npm test` was not re-run on this head. See STATUS. The earlier 11 failures were not used as a reason to edit unrelated proofs.

## P0–P3

- P0: none found.
- P1: none in this slice.
- P2: an in-range index can remain visible when a replacement response still contains that index. The empty-seed resurrection and the unchanged-seed ArrowDown regression are both corrected on this head.
- P3: the blur and pointer-flag logic is duplicated in the two owned components so `Suchliste` could stay read-only.

## Verdict

Author considers the R2 correction implemented and locally exercised on the real place component. Stop for independent exact-head Technical-Lead re-review. Do not Ready. Do not merge. Do not start a follow-up.
