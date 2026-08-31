# Provider Activation Readiness Precheck – Adversarial Self-Review

Stand: 1. September 2026  
Status: **REVIEW-FIX SELF-REVIEW / NOT A TECHNICAL-LEAD PASS**  
Agent: **`Jetnity provider activation readiness precheck 1`**  
Generation: **1**  
Against TL #5072115941 on rejected head `43bb9876`

---

## 1. Sandbox as `live_api` / real Commercial Truth

**Previous defect:** F1 minted Duffel test as `live_api` and called that a real snapshot.

**Now:** Next Slice §0 splits pipeline harness vs C1. Recommendation and Gate Matrix forbid sandbox `live_api`. Official Help Centre cited: sandbox prices are not real/live. S5-A is not extended with a silent new sourceKind.

Residual risk: a reader still says “Duffel first” and hears “turn on test search as Commercial Truth”. Status/Handoff lead with S6 and “test ≠ truth”.

---

## 2. Binding Build Order bypass

**Previous defect:** Gate Matrix called S6/S7/S8 non-blockers; F1 was the next implementation.

**Now:** Immediate next = **S6**. `PO-SEQ-00` binding. `PO-SEQ-01` named and **not inferred**. TW-8 audit is not treated as a sequence rewrite.

Residual risk: someone starts a sandbox harness “because it is specified”. The spec says do not start it and do not place it before S4–S8 without PO-SEQ-01.

---

## 3. Process-local search session

**Previous defect:** memory/process lifetime / 30-minute session as Nachweis store.

**Now:** one server-side invocation for any zero-persist proof. Durable store = separate gated architecture. Reuse map matches.

---

## 4. Viator Basic

**Previous defect:** “no real-time availability” as a hard disqualifier.

**Now:** technical guide: `/availability/schedules/{product-code}` allowed (real-time schedules); `/availability/check` denied (booking-grade). Marketing table is not the disqualifier. Ranking **not** flipped to Activities-first — schedule ≠ booking-grade, and flights remain the harder Commercial Truth problem.

---

## 5. Task §9 questions (re-asked)

| Question | Answer after fix |
| --- | --- |
| Persisted = provider truth? | No. 0 rows; write path false. Sandbox also ≠ truth. |
| Favour Duffel for code? | Live path is Flights-domain; live vendor open. Test adapter is harness reuse only. |
| Cost/licence/DPA underestimated? | Live persist still VENDOR-CONFIRMATION-REQUIRED. S6 restored as activation gate. |
| Client-trusted price? | Still forbidden. |
| Silent TW-8? | Still forbidden. Sandbox cannot unlock it. |
| Smaller proof? | Immediate smaller *implementation* is S6 (Jetnity-side), not a vendor call. |
| Implicit PO gate? | `PO-SEQ-01` explicitly not granted. |
| Distinctive vs bigger? | Real live quote later; sandbox mint rejected as fake progress. |

---

## 6. Known remaining weaknesses

1. Residual S4 vs S6 “which first” is reconstructed as **S6 serial**, with residual S4 tracked — TL may prefer a residual-S4 task first. That is a TL sequencing choice inside readiness, not a vendor activation.
2. Hotelbeds eval rate realism still UNKNOWN — not treated as `live_api`.
3. Production not re-queried in this review-fix (prior SELECT + TL recheck).
4. Draft PR body still TL-owned / not agent-rewritable.
5. Self-review is not PASS.

---

## 7. Verdict

Review-fix is internally consistent with the four mandatory outcomes and ready for **independent exact-head re-review**.

**Not PASS. Not Ready. Not merge. No slice start.**
