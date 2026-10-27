# V2-S1 Nights and Hotel Truth 1 — SELF_REVIEW

Author review only. This is not a Technical Lead PASS.

## Checked

- Preflight matched the dispatch: main `d31a16af`, mode NORMAL, seed `0b3076ba`, 1 ahead / 0 behind before the product commits. Main CI 40531046407 had completed success. No drift stop.
- F02: `lib/trips/naechte-abdeckung.ts` appends the valid trip calendar after complete stage intervals. First stage keeps an overlap. Transition gaps use `stageId: null`. The evaluator still does not list nights. The independent oracle in `lodging-interval-evaluation-1.test.ts` was updated to the same rule and still deep-equals the implementation.
- The 12-day fixture reports 11 intervals and the nights of 3 Oct and 8 Oct as the two transitions. Stage B and C gaps stay on those stages. The booked 1–3 Oct stay remains booked and covers 2 nights.
- A 7-day calendar stays 6 intervals. Two identical stage spans count as 6, not 12. Missing stage dates stay unknown and produce no gap list.
- Distant stages in 1800 and 2200 do not create a gap across the centuries. The default 2026 trip window between them is now a transition interval, because it is inside the trip calendar and outside both stages.
- F03: `checkInAus` / `checkOutAus` no longer read trip dates. Multi-stage `hotelZeitraumAusEtappe` returns null without both stage bounds, and `suchanfrageAusKontext` then returns null, so `hotelsSuchen` does not call a provider. HotelBereich returns before `fetch` and does not render the trip month. One stage with empty dates still sends the trip span.
- Lodging audit: stage gaps stay `known_gap`. Transition gaps are `unknown` with a title that does not say a hotel night is missing. Coverage is `partial` while any transition remains, and `partial` when several stages are only partly dated. Flight and mobility sections were not edited.
- Guest and account calls of `unterkunftAbdeckung` and the lodging section match on the synthetic 12-day trip. No second reader was added.
- Bookings are not rewritten. No SQL, Auth, RLS, provider key, or activity file changed.

## Limits

- Static markup is not a 320/390/768 or 200% host-font pass, and not a device pass. No browser was opened.
- `npm test` did not go green on this machine: 11 Official Truth PostgreSQL proofs failed because PostgreSQL 16 binaries are absent. They do not import the lodging or hotel files. CI must be the native proof.
- `npm run build` and `tsc --noEmit` passed here. That does not replace exact-head CI or Preview.
- A client that puts the whole trip into `stage.arrivalDate` can still ask for that period. Closing that would need a stage count on the untrusted search schema, which is outside this file ownership.
- Single-stage trips whose stage span is shorter than the trip now show the remainder as transition. That is the same calendar rule as multi-stage. Hotel search for one stage is unchanged.
- Author tests are not independent acceptance.
