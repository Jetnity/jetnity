# Jetnity — Manual Mobility Pending Draft Guard 1 — SELF REVIEW

Date: 24 October 2026
Author: **Jetnity Manual Mobility Pending Draft Guard 1 — Cursor Generation 1**
Session: `bc-529c718d-03e4-43f9-a8fa-7e555d3f4cbf`
Model: `grok-4.7-high-fast`

This is the author self-review. It is not Technical-Lead PASS. A later head invalidates it.

## Scope

Production diff is only `disabled={laeuft}` on the ten submitted controls inside exported `ManuelleVerbindung`, plus `aria-busy={laeuft}` on that form. Submit was already disabled. `schreibt`, `lebendig`, the payload object, the success sentence, and the success clear of `connectionRef` and `note` are unchanged. Outer `MobilitaetBereich`, search, booking, tabs, and `MietwagenBereich` are unchanged. No new export. TASK V1 blob `3e5d971be2234c0bd8adf487bd5ac673021bc07e` is unchanged.

## Acceptance

| Case | Result |
| --- | --- |
| A01 pending controls cannot be edited | PASS. Keyboard, pointer, and focus attempts left every value unchanged at 320, 390, and 1280. Disabled was recorded together with the values, not instead of them. |
| A02 one write | PASS. Two `requestSubmit` calls before paint produced one callback. Further `requestSubmit`, disabled-button click, and Enter during pending did not add a call. |
| A03 success is draft A | PASS. Captured payload matched the submitted mode, day, place ids, times, reference, and note. After success, reference and note were empty and the other submitted fields remained. Copy remains the existing user-entered sentence. |
| A04 both failures | PASS. Returned string `Synthetischer Speicherfehler. Die Eingabe bleibt erhalten.` and a rejected promise each restored editing, kept reference and note, showed an alert, and showed no success. The string path was corrected and retried once. |
| A05 late completion | PASS. Unmount, remount, and typing `Neu nach Remount` survived release of the old success. No success or alert appeared on the new instance. Call list stayed the old epoch. |
| A06 real component | PASS. esbuild mounted `ManuelleVerbindung` from `components/trips/MobilitaetBereich.tsx`. No substitute component and no source-string assertion. |
| A07 contract | PASS. `vorgabe.startsOn: null` left the date empty. Matching names kept `airport:ZRH` / `airport:BRN`. Changing destination to Thun sent `destinationPlaceId: null` and kept the origin place id. Props and payload keys were not changed. |

## Not claimed

No hosted route, personal browser profile, account, or Production data. Playwright's downloaded Chromium was missing; installed Chrome 148 ran the harness. Local `npm test` is not green: 11 pre-existing native PostgreSQL proofs failed in this environment. GitHub CI and Preview for the final head were not treated as acceptance.

## P0–P3

- P0: none.
- P1: none in this slice. Disabling controls does not add server validation. The existing save contract is unchanged.
- P2: local `npm test` exit 1 from missing PostgreSQL 16 binaries and forbidden local proof connections. Not this component. Not repaired.
- P3: disabled date/time controls can still show the browser format hint beside the value. DOM values were `2026-11-02` and `09:15`. Shared input CSS was left unchanged. `check:setup` warned that no `.env` file is present and exited 0. Lint remains 146 pre-existing warnings, including `UNTERBEREICHE` in this file, which this diff does not use.

## Next

Independent exact-head Technical-Lead review. Do not Ready. Do not merge. Do not start a follow-up. Planned integration remains A then B.
