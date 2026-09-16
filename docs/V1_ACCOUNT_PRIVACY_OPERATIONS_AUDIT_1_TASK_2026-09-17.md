# Jetnity – V1 Account / Privacy / Operations Minimum Audit 1

Stand: 17. September 2026  
Status: **ACTIVE AUDIT-ONLY / PARALLEL-SAFE / NO RUNTIME MUTATION**

Issue: #438  
Canonical base: `15aa125addf39b15dcb50a1cdf8dece661796fc5`  
Branch: `audit/v1-account-privacy-ops-1`

Cursor-Agent: **Jetnity V1 account privacy operations audit 1**  
Generation: **1**  
Required parent model: **Claude Opus 5 High**

Do not use Auto. If Claude Opus 5 High is unavailable, stop and report instead of silently substituting another parent model.

---

## Status

**ACTIVE AUDIT-ONLY / PARALLEL-SAFE / NO RUNTIME MUTATION / NO PRODUCTION CHANGE**

Binding source: `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md` §9 — Phase-1 Account / Privacy / Operations Minimum.

Canonical base: `main@15aa125addf39b15dcb50a1cdf8dece661796fc5`.

Current parallel implementation PRs:
- #435 — Assistant Runtime 1
- #437 — World Map Polish 2

This audit must remain docs-only so it cannot collide with either implementation slice.

## Goal

Reconstruct the actual V1 state of Account / Privacy / Operations and identify only genuine V1-blocking gaps.

Evaluate, at minimum:

1. Privacy / Terms / Consent
2. Account data lifecycle
   - export
   - deletion
   - archive/retention semantics
3. Session / MFA / AAL / recovery V1 flows
4. Support minimum
5. Admin incident/error/provider/cost visibility
6. Revenue/conversion/attribution minimum that is required for V1 operational truth
7. Any release-critical ownership, observability or user-facing trust gaps in this domain

## Important constraints

This is **audit-only**.

The agent may READ all relevant repository files but may WRITE only:
- the versioned task file for this slice;
- slice-specific STATUS;
- slice-specific HANDOFF;
- slice-specific SELF_REVIEW;
- one bounded audit/gap-plan document if needed.

Do NOT modify runtime code.

Do NOT modify:
- `components/**`
- `app/**`
- `lib/**`
- `types/**`
- `supabase/**`
- package/dependency files
- CI
- Vercel config
- global `ROADMAP.md`
- global `JETNITY_HANDOFF.md`
- global `docs/ACTIVE_WORK_STATUS.md`
- Assistant Runtime 1 files
- World Map Polish 2 files

## Truth rules

- Live evidence wins over stale plans.
- Distinguish BUILT / PARTIAL / MISSING / BLOCKED / DEFERRED / PO-GATED.
- Do not call a historical plan implemented merely because it exists in docs.
- Do not infer compliance from UI copy.
- Do not claim Production parity without evidence.
- Do not propose collecting more personal data than necessary.
- Do not weaken MFA/AAL/RLS/privacy boundaries.
- Do not treat legal placeholder text as approved legal content.

## Product-Owner gates

If the audit identifies any gap requiring:
- Production migration;
- destructive data change;
- major RLS/identity/auth/session/MFA/AAL contract change;
- sensitive document/biometric storage;
- provider secret/paid call/live activation;
- public launch/indexing/domain cutover;
- new recurring costs above approved ceiling;
then classify it explicitly as a Product-Owner gate.

Do not implement it.

## Required output

Produce a concise V1 gap matrix with:
- capability;
- current evidence;
- current state;
- V1 necessity;
- exact gap;
- severity P0/P1/P2/P3;
- dependency/gate;
- smallest responsible next slice, if any.

Then produce a recommended sequence of **bounded follow-up candidates**, but do not start any of them.

The audit should actively look for places where an older roadmap says something is open although the live implementation already closed it, and the reverse.

## Parallelism

**Multi-Agent Suitability: SINGLE_AGENT for this audit, PARALLEL-SAFE against #435 and #437 because it is docs-only.**

Cursor-Agent: **`Jetnity V1 account privacy operations audit 1`**
Generation: **1**
Required parent model: **Claude Opus 5 High**
Do not use Auto. If unavailable, stop and report instead of silently substituting.

## Validation

Before final handoff:
- re-fetch `origin/main`;
- report exact head;
- report merge-base / ahead / behind;
- prove changed files are docs-only and slice-specific;
- identify stale/conflicting repository evidence;
- perform adversarial self-review;
- persist STATUS/HANDOFF/SELF_REVIEW.

## Governance

- Do not mark Ready.
- Do not merge.
- Do not start any remediation or follow-up slice.
- Do not mutate external systems.
- Final state: **STOP FOR TECHNICAL-LEAD REVIEW**.


## Technical-Lead ownership lock

This agent may read broadly but may write only slice-specific documentation. It must not edit runtime, schema, migrations, provider contracts, Assistant Runtime 1, World Map Polish 2, or global continuity/status documents.

The purpose is to turn Build Order §9 into verified evidence and bounded next-slice candidates, not to implement fixes.

## Final stop

Persist slice-specific STATUS / HANDOFF / SELF_REVIEW and STOP FOR TECHNICAL-LEAD REVIEW.
