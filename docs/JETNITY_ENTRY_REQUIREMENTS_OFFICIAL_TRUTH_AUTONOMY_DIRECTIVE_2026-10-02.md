# Jetnity Entry Requirements / Official Truth — Product Autonomy Directive

Date: 2 October 2026
Issue: #744
Status: **BINDING PRODUCT DIRECTION / CANONICAL CONTINUITY / LIVE EVIDENCE WINS**

## 1. Strategic product goal

Jetnity is building its own first-party **Entry Requirements / Official Truth system**.

The goal is not merely to cache answers from commercial providers. Jetnity shall be able to research, verify, structure, version, store, refresh and serve entry-requirement truth from approved official primary sources itself.

Commercial providers such as Sherpa or IATA/Timatic may later remain useful as comparison, fallback or supplementary evidence sources if separately approved, but Jetnity's core architecture must not depend on them as the only source of regulatory truth.

## 2. Visitor experience for missing or stale data

When a traveller asks for an Entry Requirement and Jetnity has no current accepted Official Truth for the relevant regulatory cell:

1. Jetnity checks the first-party Official Truth store.
2. If the rule is missing, stale or requires recheck, Jetnity Copilot Pro initiates bounded research immediately.
3. Research is routed to approved official primary sources such as competent government authorities, immigration/border authorities, ministries, official visa/eVisa/ETA portals, embassies/consulates and other competent state authorities.
4. Jetnity re-proves source, scope, provenance, freshness and evidence identity through the Official Truth chain.
5. If the result is sufficiently clear for a user-facing answer, Jetnity may return a clearly labelled **freshly verified / live-verified result** without waiting for manual owner storage approval.
6. The result does not become durable Official Truth merely because it was shown to the visitor.
7. If sources conflict, are stale, incomplete or ambiguous, Jetnity must say so and must not invent certainty.

The visitor must not be blocked behind routine owner approval when Jetnity can safely provide a freshly verified answer.

## 3. Current bootstrap authority

The current protected bootstrap stage is:

- dedicated capability `official-truth-freigeben`;
- V1 minimum role `owner`;
- verified server identity;
- current AAL2 / 2FA;
- normal role grant only;
- no break-glass authority for Official Truth promotion.

This bootstrap stage exists to establish a safe control plane and a human supervision path. It is **not the intended permanent operating ceiling**.

## 4. Jetnity Copilot Pro operating model

Jetnity Copilot Pro is the super-intelligent orchestration brain of the Jetnity Admin Control Center.

The intended operating model is:

> **Owner supervises; Jetnity Copilot Pro autonomously runs and decides the routine Official-Truth pipeline wherever Jetnity's deterministic verification gate proves the case safe.**

Copilot Pro shall be able to:
- detect missing/stale rules;
- trigger and orchestrate research;
- select the proper approved official-source routes;
- compare and reason over evidence;
- identify conflicts/gaps/staleness;
- build or request Candidate Evidence and Rule Review material;
- decide whether a case is eligible for autonomous promotion under the separately versioned policy;
- trigger storage/promotion when that policy passes;
- leave unsafe or ambiguous cases blocked/review-needed;
- surface exceptional cases to the owner.

## 5. Autonomous Official Truth promotion

Autonomous promotion is a **near-term high-priority product goal**, not a distant backlog item.

The model's free-form output alone is never the trust proof.

A future autonomous promotion must independently re-prove, at minimum:
- approved official source identity;
- exact regulatory scope/cell;
- current source material/provenance;
- accepted Evidence;
- Rule Review Packet;
- deterministic packet identity/fingerprint;
- freshness requirements;
- no unresolved conflict;
- no stale primary evidence;
- no research gap;
- bounded automatic-eligibility predicates;
- accepted fact shape without silently copying untrusted model proposal text;
- idempotent/fail-closed behavior.

Only after those deterministic Jetnity gates pass may the autonomous path commit the result as Official Truth.

Copilot Pro owns the intelligent orchestration/decision. The deterministic Jetnity layer owns the technical proof that the decision is safe to commit.

## 6. Human supervision and control

Even after autonomous promotion exists:

- owner override/review remains available;
- the system requires auditable provenance;
- decisions must be attributable to exact source/evidence/packet identity;
- automatic promotion requires a kill switch that can disable autonomous storage without disabling research;
- blocked cases must remain visible to the Admin Control Center;
- lowering source/evidence standards is not an acceptable shortcut to automation.

## 7. Truth-state separation

Keep these concepts structurally separate:

- **Official Truth** — durable accepted Jetnity rule.
- **Freshly verified / live-verified result** — current research result shown to a visitor but not yet durably accepted.
- **Candidate Evidence / Rule Candidate / Review material** — internal review/research states.
- **Provider truth** — third-party commercial/provider data.
- **Jetnity recommendation** — product advice based on truth.
- **Generated suggestion** — model output/advisory material.

Never collapse them merely because the content happens to agree.

`unknown != not_required`.
`unavailable != not_required`.
`stale != current`.
Model agreement != Official Truth.

## 8. Current implementation continuity

As of this directive's creation:
- Product-Owner gate #739 approved the protected owner-only capability foundation.
- Issue #741 is **HIGH PRIORITY** for Jetnity Copilot Pro autonomous Official Truth approval.
- Issue #742 / PR #743 implement the owner-only capability foundation and are still subject to independent Technical-Lead exact-head review before merge.
- No Production database apply is authorized by this directive.
- No live autonomous promotion endpoint or audit store is authorized merely by this document.

After #743 closes, run a fresh Binding Slice Precheck and prioritize the smallest safe path toward the Copilot Pro autonomous Official Truth pipeline.

## 9. Reserved gates that still exist

This directive authorizes the product direction and near-term engineering priority. It does not automatically authorize:
- Production database apply;
- a specific persistent audit/retention implementation;
- provider contracts/secrets/paid live calls;
- public launch/indexing;
- weakening source/evidence requirements;
- bypassing existing security or Product-Owner gates.

## 10. New-chat rule

Every new Jetnity Technical-Lead chat must treat this file as binding product direction unless later explicit Product-Owner evidence supersedes it.

Reconstruct live state first. Do not restart completed slices. Do not misinterpret the owner-only bootstrap as the permanent product model.

**The permanent target is high automation: the owner supervises, and Jetnity Copilot Pro autonomously operates routine Official Truth wherever deterministic Jetnity controls prove it safe.**
