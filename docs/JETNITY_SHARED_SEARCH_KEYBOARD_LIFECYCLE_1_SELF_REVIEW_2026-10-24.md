# Jetnity — Shared Search Keyboard Lifecycle 1 — SELF REVIEW

Date: 24 October 2026
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Session: `bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e`
Model: `grok-4.7-high-fast`
Runtime head reviewed by the author: `349852387950529296058997b168fcbfea1b15ed`

This is the author's self-review of the R3 fix. It is not Technical-Lead PASS. A later docs commit does not extend this review to a new runtime head. Any further code head needs a new review.

## Scope check

R3 production edit is only `components/places/OrtSuche.tsx`. The regression lives in `scripts/shared-search-keyboard-lifecycle-1/harness.tsx` and `run.mjs`, plus regenerated evidence. `components/airports/FlughafenSuche.tsx`, `lib/suche/tastatur.ts`, and `components/suche/Suchliste.tsx` are unchanged in this fix. TASK V1 is byte-identical, blob `2e1a966a23bbc302bb59bd367740f2425060f445`. Suchliste blob remains `d69781e62dae73acde6590bde03f3533c8388b77`. No dependency, workflow, config, API, schema, Auth, or provider edit. No main merge. Callers stay read-only.

## Reconciled same-text value claim

R2 kept ArrowDown under an unchanged seed and still cleared a real seed change, including empty then the same seed. It did not clear a canonical value whose name already equalled the field, and it did not clear when that value was removed while `initialText` stayed undefined. The helper returns the same text on adoption and null on removal, so the index survived both. The closed list hid it. The next results rendered it again, and Enter selected the old row.

That is a controlled-parent gap. It is not the separate observation that an in-range index can stay while a visible list is replaced. Here the parent adopts a value, the popup closes, and the parent then removes that value.

R3 clears the index when the canonical id/name key changes, including adoption and removal with the same visible label. Text adoption still follows `ortSucheAnzeigetextAbstimmen`. A seed echo that already matches the field, and an unchanged seed while the user types, do not clear.

## Behavior still in force

- Escape, blur outside the combobox, and an outside pointer set `offen` false and `aktiv` to `-1`. Tab and Shift+Tab are not intercepted.
- Close does not clear the input and does not call `onChange`.
- `sucheAktiveOption` returns an index only when it names a rendered result row.
- Enter selects only a visible active option. The place role change from a 3-row highlight at index 2 to a 1-row response does not select the remaining row.
- Pointer selection still uses `Suchliste`'s `mousedown` `preventDefault`. The harness selected Beta / `BBB` once by mouse at 1280 and by tap at 390 for both components.
- `ort/empty-seed/1280` still ends with a null active descendant and no canonical Enter selection.
- `ort/fixed-seed/1280` keeps `initialText` at `Original`, highlights Edited Alpha, and selects `geonames:2000001` once.
- `ort/value-clear/1280` keeps `initialText` undefined. After Probe, ArrowDown twice, value `{id: geonames:1000001, name: Probe}`, the list is closed and the descendant is absent. Clearing the value restores three results with no highlight. Enter emits no canonical selection, and the input stays `Probe`.

## Limits, not hidden

- An in-range active index can remain when a later response still contains that index and the list stays open. That is not this closed-popup value removal, and this fix does not add response-identity behavior.
- Airport refetch is tied to text or value changes. The R3 defect was the place value path.
- Local full `npm test` was not re-run on this head. See STATUS. The earlier 11 failures were not used as a reason to edit unrelated proofs.

## P0–P3

- P0: none found.
- P1: none in this slice.
- P2: an in-range index can remain visible when a replacement response still contains that index. The empty-seed resurrection, the unchanged-seed ArrowDown regression, and the same-text canonical value removal are corrected on this head.
- P3: the blur and pointer-flag logic is duplicated in the two owned components so `Suchliste` could stay read-only.

## Verdict

Author considers the R3 correction implemented and locally exercised on the real place component. Stop for independent exact-head Technical-Lead re-review. Do not Ready. Do not merge. Do not start a follow-up.
