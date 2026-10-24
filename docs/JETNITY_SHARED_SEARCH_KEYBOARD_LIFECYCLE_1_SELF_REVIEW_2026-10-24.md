# Jetnity — Shared Search Keyboard Lifecycle 1 — SELF REVIEW

Date: 24 October 2026
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Session: `bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e`
Model: `grok-4.7-high-fast`
Runtime head reviewed by the author: `a0a9ff7108e81694f09516f0b403a91f6ca26854`

This is the author's self-review. It is not Technical-Lead PASS. A later docs commit does not extend this review to a new runtime head. Any further code head needs a new review.

## Scope check

Production edits are only `components/places/OrtSuche.tsx`, `components/airports/FlughafenSuche.tsx`, and `lib/suche/tastatur.ts` plus its existing test. The harness and evidence live in the task allowlist. TASK V1 is byte-identical. `components/suche/Suchliste.tsx` is unchanged, blob `d69781e62dae73acde6590bde03f3533c8388b77`. No dependency, workflow, config, API, schema, Auth, or provider edit. No main merge.

## Behavior

- Escape, blur outside the combobox, and an outside pointer set `offen` false and `aktiv` to `-1`. Tab and Shift+Tab are not intercepted.
- Close does not clear the input and does not call `onChange`.
- `sucheAktiveOption` returns an index only when it names a rendered result row. Loading, empty, error, and unavailable popups have no active descendant. The option id is checked in the harness with `document.getElementById`.
- Enter selects only a visible active option. The place role change from a 3-row highlight at index 2 to a 1-row response does not select the remaining row.
- A parent value/text replacement clears the highlight when the displayed text actually changes. An echoed `initialText` equal to the current text does not.
- Pointer selection still uses `Suchliste`'s `mousedown` `preventDefault`. A pointer that starts on an option suppresses blur-close until the click can run. The harness selected Beta / `BBB` once by mouse at 1280 and by tap at 390 for both components.

## Limits, not hidden

- If a later response keeps the old index inside the new length, that in-range row can stay highlighted. The guard stops out-of-range and hidden references. It does not treat every replaced row as a new identity.
- Airport refetch is tied to text or value changes. Those paths clear the highlight when the controlled value key changes. The executed stale-index case is the place `rolle` change.
- Local `npm test` is not fully green on this machine. See STATUS. That is not a search-code failure and was not used as a reason to edit unrelated proofs.

## P0–P3

- P0: none found.
- P1: none in this slice.
- P2: in-range index after a same-length or still-containing response can refer to a different row until the user moves. Out-of-range selection is blocked.
- P3: the blur and pointer-flag logic is duplicated in the two owned components so `Suchliste` could stay read-only.

## Verdict

Author considers the frozen acceptance implemented and locally exercised. Stop for independent exact-head Technical-Lead review. Do not Ready. Do not merge. Do not start a follow-up.
