# N12 Chronological Days 1 — SELF REVIEW

This is the author's review of product commit `d57eac4903f3e63ac0ee23eb577ed4fd709e29cc`. It is not a Technical Lead PASS.

## Checked

- `timeline.etappen` for the 22-day fixture is still Bangkok, Chiang Mai, then one trailing null group `day-1`, `day-11`, `day-22`.
- The new runs place those three null days where their `dayIndex` sits. Previous/next from day 1 goes to day 2, from day 11 to day 10 and day 12, from day 22 back to day 21.
- Day 1 with a flight is `Reisetag mit geplantem Flug/Transfer`. Clearing that item, even with title `Hinreise`, becomes `Noch keinem Ziel zugeordnet` or `Ohne Etappe` when the mode is missing. Day 22 behaves the same. A note, stay, or rental car does not open a travel heading.
- Day 11 keeps transfer `transfer-11` and stay `stay-11` on the same day object.
- The outbound flight stays item `flight-out` on `day-1` only. Day 2 gets a continuation note with the same id. The trip stays 22 days. No `Date` timezone conversion.
- Reversed `days` does not mutate the array. Duplicate ids and non-integer or duplicate indexes return no runs.
- Guest and account copies of the same graph deep-equal. The mounted harness shows the same visible chip ids for `?quelle=gast` and `?quelle=konto`.
- `planTageFolgen` still returns the group order it is given, including the old non-chronological fixture in `trip-plan-premium-experience-4.test.ts`.
- Booked return flight fields are still `booked` / `user` / the original confirmation timestamp.
- `unterkunftAbdeckung` on the fixture is unchanged by the projection: `bekannt false`, `naechteGesamt null`, `naechteAbgedeckt null`, `kalenderNaechte 21`, summary `Unterkunftsstand noch unklar`. The 21 adjacent stored dates are counted in the test. This slice does not recalculate hotel nights.
- Mounted Chrome 148, kanal `chrome`: 320, 390, 768, 1440 at 16px and 32px. Visible chips `day-1` … `day-22`. Previous/next at least 44px. Keyboard Enter on Next. No document horizontal overflow. No fetch/xhr. No page errors.
- Diff paths stay inside the task allowlist plus the immutable task seed.

## Not claimed

- Technical Lead source PASS.
- GitHub CI PASS or Vercel Preview PASS. They start after push and are head-bound.
- The 11 PostgreSQL 16 failures in local `npm test`. `initdb` is missing. Those tests failed; they were not turned into skips. They are outside this diff.
- A personal account trip. N12 was not reproduced as one.
- Production, provider, cost, indexing, or F01.

## Reviewer note

The Etappen list still shows one trailing group named `Noch keinem Ziel zugeordnet` for days 1, 11, and 22 together. That is the preserved stage contract. The sentence under it says it is not the calendar order. The day strips use the travel heading for each of those days. S0's older sentence that this graph has `naechteGesamt 21` does not match the current nights reader, which leaves `naechteGesamt` null and `kalenderNaechte` 21. Changing that reader is not this task.
