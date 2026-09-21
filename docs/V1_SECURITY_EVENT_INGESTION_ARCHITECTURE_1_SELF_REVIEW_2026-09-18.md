# Jetnity – V1 Security Event Ingestion Architecture 1 SELF-REVIEW

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #486  
Draft PR: #487  
Binding task + 21 September amendment  
TL CHANGES REQUIRED: `5265503350` on `035486e0`  
Same-session dispatch: comment `5759015153` (architecture already replaced in `c7c614d8`)

This document argues against the correction. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the correction

| Attack | Result |
| --- | --- |
| Append caveats to actor-JWT INSERT | Rejected. Contract replaced. |
| Keep Writer 1 and add “don’t call Data API” | Rejected. |
| Call integration preservation a prior PASS | Rejected. |
| Persist AAL1 step-up by weakening `darf_*` | Rejected. Unobserved. |
| Table CHECK that bans `login_failed` | Rejected. Historical/test compatibility. |
| Implement the trigger in this slice | Rejected. Docs only. |
| Invent a legal retention period | Rejected. Activation prerequisite only. |
| Treat this evidence persist as a new architecture change | Rejected. Gates only. |
| Ready / merge / start follow-up | Rejected. |

## 2. Residual risks

- Trigger DEFINER is still privilege. Specification is least-privilege; implementation can get it wrong.
- `service_role` ALL remains a latent bypass of the “no app DML” rule.
- Unobserved auth signals can be misread as “no attacks” if #485 copy is later removed.
- No PostgreSQL test of the new matrix was run here.
- Block/unblock vs trigger-failure semantics are only recommended, not coded.

## 3. Adversarial matrix — reasoning vs tests run

| Case | Source reasoning | Test actually run this slice |
| --- | --- | --- |
| Same-JWT bypass | No INSERT grant ⇒ Data API fail | **None** (no DB) |
| Moderator forges operator event | No `blocked_ips` write; no event INSERT | **None** |
| AAL1 | `darf_betrieb_eingreifen()` false | **None** |
| AAL2 operator mutation | Trigger would fire after real change | **None** |
| Break-glass | `adminWriteErlaubt` + RLS | **None** |
| Foreign actor | `auth.uid()` in trigger | **None** |
| Arbitrary JSON / supplied time | Function-built extra/now() | **None** |
| Oversized / replay | Cap + one-event-per-mutation | **None** |
| Logging failure | Auth path does not write | **None** |
| Historical `login_failed` | No destructive type CHECK | **None** |

TL synthetic evaluation on the **old** predicate is evidence against that predicate, not a test of this replacement.

## 4. Dispatch compliance

| Requirement | Met? |
| --- | --- |
| Same session / branch / PR | Yes |
| Replace F1–F3, do not caveat | Yes — `c7c614d8` |
| No runtime / migration / privileged activation | Yes |
| Writer 1 withdrawn | Yes |
| No false prior-PASS / self-SHA as current PASS | Yes |
| Fresh exact-head CI on recorded HEAD | Yes on `61c65be9`: CI `35589413339` SUCCESS; Auth `106300164451`; Typecheck `106300164095`; Vercel `9hzjqpe84FMGrv8sCeg5iHqUBTy3` READY. This persist invalidates that SHA. |
| Merge-base = current main / behind = 0 | Yes before this persist: `4a223d34` / **9 / 0** |
| Stop for TL review | Yes |

## 5. What remains

`61c65be9` had CI `35589413339` SUCCESS and Vercel `9hzjqpe84FMGrv8sCeg5iHqUBTy3` READY. This evidence persist is a newer HEAD and invalidates those gates. Re-fetch on the live HEAD. Formal review `5265503350` still applies to `035486e0` until independent re-review. Agent self-review is not PASS.
