# Jetnity Remaining Build Map 1 — ADVERSARIAL SELF-REVIEW (R1–R3 correction)

Stand: 22. September 2026  
Status: **AGENT SELF-REVIEW AFTER CHANGES REQUIRED — NOT A TECHNICAL-LEAD PASS**

Draft PR: #544  
Reviewed artefact: `docs/JETNITY_REMAINING_BUILD_MAP_1_REPORT_2026-09-22.md` after correction of `962b2209`.

---

## 1. Where this correction is most likely to be wrong

### 1.1 Admin D mixed class may still be flattened

I split D into presentation/architecture built vs ingestion open. A reviewer can still want a single primary label. I kept the split because collapsing D to `DELIBERATELY_LATER` would repeat the original defect.

### 1.2 Admin F “later ungated” vs “none additional”

R3 asked both to keep “none” bounded and to classify Admin F. I listed F as a real later option and still refused current dispatch. A reviewer who wants F as candidate C1 can do that without changing the V1-critical conclusion. I did not promote F to a recommended next slice.

### 1.3 Guardian/What-if phase mapping is intentionally non-exact

ADR-0204 Phase 2 mentions advanced companion / change detection; Binding Build Order §10 names Guardian/What-if as must-build; ADR-0204 also supersedes reading the old build order as “all before V1”. I used `BINDING_LONG_TERM` and refused an invented Phase-1.5. A reviewer may still want a harder V1-blocker label because §11 lists a final Guardian/Simulator audit before launch. That audit is release-proof after product maturity, not authorization to start the programme now.

### 1.4 Billing-P1 Production schema not re-read

I re-read the route. The 24 Aug Production schema notes (no FK, text payment_id) were not freshly verified. Live schema is `UNVERIFIED`. The integrity residual in source remains true regardless.

### 1.5 Account AP-5 “built” may hide gated extras

S1–S5 are integrated; P1–P5 and backup codes remain gated. I used a mixed class. Repeating AP-5-S1–S5 would be the duplicate this map exists to prevent.

### 1.6 TW-9 `RELEASE_PROOF_MISSING` could be read as “start the audits now”

The plan says start TW-9 only after required dependencies. I deferred a TW-9 slice. The class records that programme closure is not done.

---

## 2. Where I believe the correction is solid

- AP-7 S4 reconciliation and `app/account/bookings/page.tsx` make the stale plan sentences impossible to keep.  
- AdminTopbar disabled search is visible; F is not a nonexistent feature.  
- Refund route still matches the Billing-P1 description.  
- TW-9 is no longer called `RUNTIME_BUILT`.  
- “None” is explicitly bounded.  
- Diff remains docs-only.  
- German overview recount is 275 words, still ≤ 350.  
- #543 observed head was refreshed to `676d64b4` without treating the draft as main or auditing it.

---

## 3. Attacks against this correction

| Attack | Result |
| --- | --- |
| Did I dump all Admin D–K as later? | No. Per-letter table. |
| Did I mark TW-9 built via UX repairs? | No. |
| Did I erase Admin F by saying none? | No. Named and deferred. |
| Did I invent a Guardian phase number? | No. |
| Did I implement Billing-P1 or Admin F? | No. |
| Did I change the V1 build order or start Phase 2? | No. |
| Did I touch #543 runtime? | No. |
| Did I claim a fresh Production schema read? | No. |

---

## 4. R1–R3 compliance

| Finding | Met? |
| --- | --- |
| R1 programme tables + stale AP-7/AP-10 + superseded Admin findings + Billing-P1 + named Guardian/What-if | Yes |
| R2 TW-9 not over-closed | Yes |
| R3 bounded none + assessed later options | Yes |
| Same session / owned paths only | Yes |
| No Ready / merge / follow-up | Yes |

---

## 5. Stop

**STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW.**
