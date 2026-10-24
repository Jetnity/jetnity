# Jetnity — Shared Search Keyboard Lifecycle 1 — SELF REVIEW

Date: 24 October 2026
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Session: `bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e`
Model: `grok-4.7-high-fast`
Runtime head reviewed by the author: `a911177fb14896bdc59ff3b31d755453b2e5b4f2`

This is the author's self-review of the R1 fix. It is not Technical-Lead PASS. A later docs commit does not extend this review to a new runtime head. Any further code head needs a new review.

## Scope check

R1 production edit is only `components/places/OrtSuche.tsx`. The regression lives in `scripts/shared-search-keyboard-lifecycle-1/run.mjs` and the regenerated evidence. `components/airports/FlughafenSuche.tsx`, `lib/suche/tastatur.ts`, and `components/suche/Suchliste.tsx` are unchanged in this fix. TASK V1 is byte-identical, blob `2e1a966a23bbc302bb59bd367740f2425060f445`. Suchliste blob remains `d69781e62dae73acde6590bde03f3533c8388b77`. No dependency, workflow, config, API, schema, Auth, or provider edit. No main merge. Callers stay read-only.

## Reconciled parent-reset claim

The first self-review said a parent replacement clears the highlight whenever the displayed text changes, while an echoed `initialText` equal to the current text does not. That second half still holds. The first half did not hold for an empty replacement.

`elternErsatz` was tested with a truthy check, so `initialText=""` never counted as a replacement. `aktivResetFuer` then remembered the last nonempty token. Clearing the list hid the stale index through `sucheAktiveOption`, but `aktiv` stayed at the old row. Setting the same seed again did not look like a new token, so ArrowDown's highlight returned with the results and Enter selected it. Technical Lead reproduced that on the real component: Probe, ArrowDown twice to Beta, empty parent text, then Probe again selected `geonames:1000002 / Probe Beta` without new navigation.

The R1 condition clears `aktiv` when the parent text or confirmed name differs from the current displayed text, including `""`, and only when `aktiv` is not already `-1`. It does not store the last token. After the empty reset, the same seed starts with no active descendant. Enter does not select. Ordinary echoes where `initialText === text` still produce no replacement, so a highlight from ArrowDown is kept. The mount seed is the initial `text`, so an unchanged seed does not clear. Canonical `onChange({ id, name })` and the airport value-key reset are unchanged.

## Behavior still in force

- Escape, blur outside the combobox, and an outside pointer set `offen` false and `aktiv` to `-1`. Tab and Shift+Tab are not intercepted.
- Close does not clear the input and does not call `onChange`.
- `sucheAktiveOption` returns an index only when it names a rendered result row. Loading, empty, error, and unavailable popups have no active descendant.
- Enter selects only a visible active option. The place role change from a 3-row highlight at index 2 to a 1-row response does not select the remaining row.
- Pointer selection still uses `Suchliste`'s `mousedown` `preventDefault`. The harness selected Beta / `BBB` once by mouse at 1280 and by tap at 390 for both components.
- The new `ort/empty-seed/1280` case keeps focus, sets `Probe`, activates Beta, replaces with `""`, restores `Probe`, and asserts a null active descendant, no canonical event after Enter, and input text `Probe`.

## Limits, not hidden

- If a later response keeps the old index inside the new length, that in-range row can stay highlighted. The guard stops out-of-range and hidden references. It does not treat every replaced row as a new identity. This is separate from the empty-seed bug, which is corrected above.
- Airport refetch is tied to text or value changes. Those paths clear the highlight when the controlled value key changes. The R1 defect was the place `initialText` path, not the airport value key.
- Local full `npm test` was not re-run on this head. See STATUS. The earlier 11 failures are not a search-code failure and were not used as a reason to edit unrelated proofs.

## P0–P3

- P0: none found.
- P1: none in this slice.
- P2: in-range index after a same-length or still-containing response can refer to a different row until the user moves. Out-of-range selection is blocked. The empty-parent same-seed resurrection is corrected in this head and is not this remaining P2.
- P3: the blur and pointer-flag logic is duplicated in the two owned components so `Suchliste` could stay read-only.

## Verdict

Author considers the R1 correction implemented and locally exercised on the real place component. Stop for independent exact-head Technical-Lead re-review. Do not Ready. Do not merge. Do not start a follow-up.
