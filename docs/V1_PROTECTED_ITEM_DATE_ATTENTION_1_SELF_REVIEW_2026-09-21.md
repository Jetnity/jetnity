# V1 Protected Item Date Attention 1 — SELF-REVIEW

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW ONLY / NOT TECHNICAL-LEAD PASS**

Agent: Jetnity V1 protected item date attention 1, Generation 1  
Session: `bc-47c25f91-3af3-43ff-ab82-5c5c2fee04ae`  
Required model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)

---

## Held

- The mismatch is a proved calendar difference: valid `startsOn` vs owning `dayDate` on a commercially protected, assigned item.
- Canonical `istKommerziell` is reused. Protection through provider / URL / externalRef / price including zero / booked-only was asserted via that predicate, not redefined.
- Missing, invalid and unassigned values stay silent. `2026-02-31` / `2025-02-29` do not become 1 March via `Date.parse`. `2028-02-29` vs `2028-03-01` is a real mismatch.
- Existing apply preservation tests remain green. Attention does not write the graph.
- Safety-critical, official/safety/seasonal fail-closed, and the visible/weitere split remain. All-clear is suppressed when this stale point exists.
- Display reuse only. `aktion: null`. No AttentionAktion / navigation extension.
- Exclusive file ownership held. No provider/model/paid/DB/Auth work.
- Screenshot provenance is truthful: actual component, compiled `styles/globals.css`, clean `948ad2fc`, SYNTHETIC banner. Not Preview and not a real device.

## Attacked and rejected

- Treating booked-only as “a live booking was moved by the provider”. Copy only states the two dates.
- Inventing a mismatch for `ohneTag`, null `dayDate`, or impossible calendar strings.
- Giving non-commercial items this protected-item signal after they correctly moved.
- Adding a fix action or rewriting `startsOn` to the new day.
- Claiming the generic audit loop or real-device acceptance.

## Residual / not claimed

- Users cannot tap through to the item. That is tasked, not a hidden defect of this slice.
- `endsOn` mismatches are out of scope.
- An unassigned protected item after a deleted day still has no dedicated attention signal.
- `npm test` 3621/3621 was taken on product tree `948ad2fc`. The freeze commit adds tests/docs/evidence only.
- Exact-head CI / Auth / Vercel IDs belong in the freeze PR comment.

## Verdict

Ready for independent Technical-Lead exact-head review. Not Ready. Not merged.
