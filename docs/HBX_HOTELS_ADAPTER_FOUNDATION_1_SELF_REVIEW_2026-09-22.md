# HBX Hotels Adapter Foundation 1 — Self-Review

Stand: 22. September 2026  
Agent: **Jetnity HBX hotels adapter foundation 1**, Generation 1  
Session: `bc-c538c2b5-3cc6-4f9f-8f00-2ccac1bb9cf1`  
Model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)

This is an adversarial self-review. It is **not** a Technical-Lead PASS.

---

## 1. Did I execute only the dispatched runtime?

| Requirement | Verdict |
| --- | --- |
| New files only under `lib/providers/hotelbeds/hotels/*` + named docs/evidence | Yes |
| Existing HotelOption / shared core / factory READ ONLY | Yes — `hotelOptionLesen` is a final gate, not a domain edit |
| Fixture-only stay/pricing/currency context | Yes — second argument; invalid context empties the result |
| Unknown model => no HotelOption | Yes — dedicated test |
| Never display net / no markup / no FX | Yes — sellingRate only; mismatch rejects |
| No invented availability/cancellation/breakfast | Yes — those HotelOption fields stay null |
| rateKey opaque; no raw key in IDs/logs | Yes — sha256 of original bytes; JSON leak tests |
| R1: no silent trim before hash/dedup | Yes — `rateKeyLesen`; TL `rate-A` / ` rate-A ` regression |
| Deterministic multi-rate IDs; duplicate first-wins | Yes |
| Strict malformed input / impossible dates | Yes — stronger than Skyscanner Date.parse |
| No factory/HTTP/env/secrets/UI/DB/Production | Yes |
| No shared writes; disjoint from #545/#547 | Yes — path lists recorded |
| No Ready / merge / Viator follow-up | Yes |

---

## 2. Attacks on the implementation

### 2.1 Could unknown pricing still mint a price because sellingRate exists?

`displayPreis` returns null for `unknown` before reading `sellingRate`. The unknown-model test keeps `sellingRate`, `net` and `hotelMandatory: true` and expects an empty result.

### 2.2 Could `net` become the consumer price?

The adapter never reads `offer.net` for display. Net-model tests keep a different `net` and assert `preisGesamt === sellingRate` only when `hotelMandatory === true`. String `"true"` / `1` / `false` / missing do not permit.

### 2.3 Could packaging or hotelMandatory be inferred from truthy strings?

Both require exact booleans (`packaging === false`, net-path `hotelMandatory === true`). `"false"`, `0`, `null` and missing packaging reject.

### 2.4 Could Date.parse turn 2026-02-30 into a priced stay or timestamp?

Stay dates use UTC calendar reconstruction identical to hotel schema. `retrievedAt` requires an offset-bearing pattern **and** a real calendar day, so `2026-02-30T12:00:00Z` is rejected.

### 2.5 Could DST change the night count?

Nights are `UTC date difference / 86400000` and must be a positive integer. 2026-03-28→03-30 and 2026-10-24→10-26 both yield two nights.

### 2.6 Could raw rateKey leak into identity or output?

IDs use `sha256(original rateKey bytes).slice(0,32)`. Tests stringify the result and options and fail if the fixture keys appear. No logging exists in the adapter.

### 2.6a R1 — could trim collapse `'rate-A'` and `' rate-A '`?

The first freeze hashed `nichtLeer()`’s trimmed value, so both keys became `hbx:12345:c2b264a5ce7dae15d4716be4e65c2e12` and a combined input kept one option with `partial=true`. `rateKeyLesen` now rejects only blank/whitespace-only/overlong strings and returns the original bytes. Combined padded+unpadded input now yields two options. The old collapsed digest is asserted not to be used for the padded key.

### 2.7 Could injected live_api / persistenz / affiliate promote the fixture?

Output is a freshly built object. Forbidden keys are asserted absent at result and option level. `commercialEingabeLesen(result)` is null.

### 2.8 Could a later runtime silently register this module?

`hotelProviderAus()` is unchanged and still returns null. No app/factory/core import of the new path. `check:dead` stays green because the test file is the only in-repo caller.

### 2.9 Did I treat local green as TL PASS or live HBX proof?

No. Fixture tests are transformation tests. Preview is not HBX access. Exact-head CI after this persist is a later comment, not this self-review.

### 2.10 Did later main syncs rewrite HBX or drop Admin surfaces?

No. `git diff 2542a95b HEAD -- lib/providers/hotelbeds/hotels` is empty. The final merge brought in #545 only on top of already-merged #547. `IndexingStatus` remains on System Health. Admin search remains on layout/topbar. Search 10/10, indexing 14/14. No rebase.

---

## 3. Residual risks

- Historical audit/proposal wording can still be misread as unfinished or as a weaker cancellation mapping. This task’s conservative null cancellation supersedes that wording for this slice only.
- `createHash` could be misread as a signature factory. It is identity opacity only; HMAC/signature/env are absent.
- Later live transport still needs an explicit commercial pricing model. This fixture context must not be reused as that evidence.
