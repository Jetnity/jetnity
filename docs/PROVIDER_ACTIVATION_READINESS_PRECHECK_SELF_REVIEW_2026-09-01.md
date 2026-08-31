# Provider Activation Readiness Precheck – Adversarial Self-Review

Stand: 1. September 2026  
Status: **SELF-REVIEW COMPLETE / NOT A TECHNICAL-LEAD PASS**  
Agent: **`Jetnity provider activation readiness precheck 1`**  
Generation: **1**

Task §9 questions, answered against the deliverables — not against hope.

---

## 1. Are we mistaking persisted data for provider truth?

**No.** Live Production SELECT this session: `trip_item_commercial_provenance` rowcount **0**, write path **false**. S5-B is named as persistence *foundation* only. E5-B3C mint is explicitly not a commercial snapshot. Workspace prices remain legacy `trip_items` fields.

Residual risk: a later reader of stale “S5-B on Production” sentences. Evidence doc marks those HISTORICAL / SUPERSEDED.

---

## 2. Are we favoring a provider only because code already exists?

**Challenged and documented.**

Independent Duffel-test reasons: official zero-spend sandbox, offer revalidation/`expires_at`, Amadeus SS shutdown, Skyscanner no-cache, Booking.com gated sandbox, Viator Basic without real-time availability.

Code reuse is labelled as a **slice-size** consequence, not a winner condition. If Duffel test mode were unusable, the fallback is Hotelbeds evaluation — which has **no** Jetnity adapter.

ADR-0062 (dev adapter ≠ architecture) is restated. Live Duffel is not recommended.

Remaining risk: social path-dependence (“F1 used Duffel → Duffel is the live provider”). Recommendation §11 and F1 non-scope say that is not a decision.

---

## 3. Are we underestimating cost, licensing, or DPA?

**Partially — and we refuse to fill gaps.**

- Duffel **test** cost: official no-spend (VERIFIED). Live excess-search / per-order fees are documented and parked behind later gates.
- Skyscanner no-cache is treated as a persist **disqualifier**, not a footnote.
- Hotelbeds Content store-and-refresh and all DPAs: **VENDOR-CONFIRMATION-REQUIRED**.
- F1 therefore **does not persist** and sends no traveller identity.

We do **not** claim Duffel ToS allows a stored snapshot. That is why F1 is in-memory only.

---

## 4. Would the suggested slice create client-trusted price/provenance?

**No, if F1 is implemented as specified.** Browser may send `optionId` + trip identity only. Mint uses server `retrievedAt` and nachgewiesen option. Client search already strips `retrievedAt`. Tests must include tampering.

If F1 is later implemented sloppily (writing `trip_items.price_amount` from the client), that would be a defect. The spec forbids it.

---

## 5. Would it silently unlock TW-8 without real Commercial Truth?

**No.** F1 forbids Workspace join, write-path allocation, SQL writer, and TW-8/TW-9 runtime. One in-memory mint is not Commercial Surface.

A hostile misread of “first provider path” as “open TW-8” is the main political risk. Status/handoff say TW-8 stays blocked.

---

## 6. Is there a smaller safe proof slice?

Considered and rejected:

| Smaller idea | Why not |
| --- | --- |
| Docs-only | Does not prove a snapshot |
| Fixture mint | Not provider-backed; foundation forbids promotion |
| Nachweis against fixtures only | Same |
| Production persist in F1 | Larger and gated |
| Hotelbeds adapter+mint | Larger |
| “Just turn on JETNITY_FLIGHT_AKTIV” | Search without Nachweis is still not a snapshot |

F1 is the smallest slice that still meets the task’s “one real server-side snapshot” bar.

---

## 7. Is any Product-Owner gate being crossed implicitly?

**This audit:** no. Production SELECT only. No signup, secret, flag, or write.

**F1 spec:** lists PO-PROV-01/02 and PO-SEC-01 as *preconditions to start F1*, and forbids the closed gates. That is explicit, not implicit.

Risk: someone treats this recommendation as permission to create a Duffel account. Handoff says it is not.

---

## 8. Does the choice make Jetnity more distinctive and useful, not merely bigger?

**Yes, if limited to the truth pipeline.** The distinctive gap is honest commercial freshness, not another search widget.

Rejected “bigger” paths: 12Go first, Viator Basic widgets, multi-provider comparison, TW-8 chrome.

---

## 9. Extra adversarial checks

| Check | Result |
| --- | --- |
| Switzerland-first | 12Go disqualified. Duffel Airways is *not* realistic CH evidence — stated. Live CH quality remains UNKNOWN |
| Traveller context | Quote snapshot must not pick one passport or invent visas |
| Env Supabase ≠ Production | Caught; documented; Production queried by documented ref |
| Binding build order §4 stale | Documented SUPERSEDED for S5-B location, not rewritten as a PO decision |
| Dual ADR-0200 numbering | 12Go proposed doc ≠ DECISIONS ADR-0200 S4-R1 — noted in continuity, not used as accepted 12Go ADR |
| Paid call hidden as “test” | F1 requires `duffel_test_*` and Production hard-off |
| Skyscanner foundation accidentally recommended as live | Explicitly non-promotable |
| Flight-event table | Live absent; not used as commercial path |

---

## 10. Known weaknesses of this audit (do not hide)

1. DPA/subprocessor schedules were not reviewed (correctly left unknown).
2. Duffel rate-limit numbers differ between docs example (60/60s) and help centre live search (120/60s) — recorded, not reconciled.
3. Hotelbeds eval inventory quality for Switzerland was not measured (no calls).
4. Whether Preview already has a Duffel test token is UNKNOWN (secrets not read).
5. Skyscanner partner portal was not accessible (Access Denied).
6. Official vendor pages can change after this date.
7. Self-review cannot substitute independent TL review.

None of these flip the ranking from “Duffel test proof first” to “activate a live vendor” or “open TW-8”.

---

## 11. Self-review verdict

Deliverables are internally consistent, gate-closed, and ready for **independent Technical-Lead exact-head review**.

**Not PASS. Not Ready. Not merge.**
