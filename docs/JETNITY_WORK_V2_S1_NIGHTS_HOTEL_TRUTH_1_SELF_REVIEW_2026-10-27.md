# V2-S1 Nights and Hotel Truth 1 — SELF_REVIEW

Author review of the R1 correction only. This is not a Technical Lead PASS.

## Checked against review 5671376100

- R1-F1: a dated trip no longer unions full stage ranges with the full trip range. `naechteGesamt` is the calendar length. The 1800/2200 stages around the 2026 window contribute 14 trip nights, and the century pieces are `ausserhalb` with their own lengths. A stage that starts before the trip and ends after it does not add those outside nights. The first stored stage still owns an overlap inside the calendar. A booked stay entirely outside remains booked and `ausserhalb`, with `naechteGebucht` 0.
- R1-F2: three stages on a 12-day trip with all dates null report `kalenderNaechte` 11, `naechteGesamt` null, empty gaps, and no Übergang wording in the audit or the lodging list. One known stage plus missing siblings stays partial, keeps the known stage piece, and does not invent a transition or a hotel gap.
- R1-F3: multi-stage hotel search still shows „Hotelzeitraum für diesen Ort noch offen“ and does not call `/api/hotels/search`. One undated stage still uses the trip span. Flight and mobility audit sections were not edited. No DB, provider, booking, or TripDay write.

## Limits

- Static markup is not a 320/390/768 or 200% host-font pass. No browser was opened. The task gates still forbid private browser and CUA.
- `origin/main` advanced to `d698ee9e3e365b09295effc1db5a4f9db165eec8`. This branch was not rebased. CI and Preview on `b91256e3` are not claimed.
- A client can still send fabricated stage dates to the search route. The server does not fill them from the trip.
- The change-preview text uses the clipped night totals. It does not yet list each `ausserhalb` interval; those intervals are on the coverage result and in `UnterkunftBestand`.
- Author tests are not independent acceptance.
