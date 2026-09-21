# Jetnity – V1 Security Event Ingestion Architecture 1 SELF-REVIEW

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #486  
Draft PR: #487  
Binding task amendments §13 and §14  
TL reviews: `5265503350` on `035486e0`; `5265844197` on `86540c7a`

This document argues against the correction. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the correction

| Attack | Result |
| --- | --- |
| Re-open actor-JWT INSERT / F1 | Rejected. F1 preserved. |
| Weaken AAL2 to persist login/step-up | Rejected. F2 preserved. Unobserved. |
| Leave fail-closed vs best-effort open | Rejected. R1 binds fail-closed for in-scope writes. |
| Treat a count cap as retention or activation | Rejected. R2. |
| COUNT-then-INSERT as a bound | Rejected. Serialized quota UPDATE required. |
| Claim trigger+function alone is complete | Rejected. Quota object is an extra dependency. |
| Implement the trigger / quota in this slice | Rejected. Docs only. |
| Invent a legal retention period | Rejected. |
| Persist another commit only to store CI SHAs | Rejected per `5265844197`. |
| Ready / merge / start Producer 1 | Rejected. |

## 2. Residual risks

- Fail-closed will, after a later activation, refuse some local blocklist writes when audit/quota fails. That availability cost is documented but not product-accepted beyond this contract.
- Null-uid / `service_role` mutations remain unaudited by design. Operators can still confuse “no event” with “no change”.
- A buggy quota UPDATE or missing row lock would re-introduce the C−1 race. Tests are specified, not run.
- Trigger DEFINER remains privilege.
- No PostgreSQL test of R1/R2 was run here.

## 3. Adversarial matrix — reasoning vs tests run

| Case | Source reasoning | Test actually run this slice |
| --- | --- | --- |
| Same-JWT bypass | No INSERT grant ⇒ Data API fail | **None** (no DB) |
| Moderator forges operator event | No `blocked_ips` write; no event INSERT | **None** |
| AAL1 | `darf_betrieb_eingreifen()` false | **None** |
| AAL2 operator mutation | Atomic derived row | **None** |
| Break-glass | `adminWriteErlaubt` + RLS | **None** |
| Foreign actor | `auth.uid()` in trigger | **None** |
| Arbitrary JSON / supplied time | Function-built extra/now() | **None** |
| Oversized payload | RAISE; source rolls back | **None** |
| Injected event failure | Neither source nor event remains | **None** |
| Outer rollback | Pair disappears; quota released | **None** |
| Zero-row DELETE | No success event | **None** |
| Two admissions at C−1 | Cannot commit C+1 tracked rows | **None** |
| Invalid cap config | Producer disabled | **None** |
| Historical `login_failed` | Outside quota; remains readable | **None** |
| Login logging failure | Auth path does not write | **None** |

TL synthetic evaluation on the **old** actor-JWT predicate is not a test of this replacement.

## 4. Dispatch compliance

| Requirement | Met? |
| --- | --- |
| Same session / branch / PR | Yes |
| Preserve F1/F2; correct only R1/R2 | Yes |
| No runtime / migration / privileged activation | Yes |
| Writer 1 withdrawn; Producer Contract 1 not started | Yes |
| No false prior-PASS / self-SHA as current PASS | Yes |
| No extra persist-only-for-CI commit | Yes — CI for this head goes in a PR comment |
| Stop for TL review | Yes after freeze |

## 5. What remains

Independent Technical-Lead re-review of the frozen R1/R2 head. Guardian event assessment `5759414802` is not that review. Agent self-review is not PASS.
