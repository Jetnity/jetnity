# Official Truth Rule Acceptance Trust Boundary Architecture 1 — Binding Task

Date: 2 October 2026
Issue: #729
Baseline: `main@5e291ed7c4814f034224eda46c3bd62cc9815ea3`
Logical agent: **Jetnity Official Truth Rule acceptance trust boundary architecture 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Define the binding architecture for the final authority boundary before `regelKandidatAkzeptieren`.

Docs only. Do not implement acceptance runtime.

## Binding principle

Jetnity must preserve:

> **Model/plugin output may suggest, extract, compare, or flag review material, but it may never directly become `trustedRuleFact`.**

A future `trustedRuleFact` may enter `regelKandidatAkzeptieren` only through a server-verified, explicitly authorized human/operator review boundary.

Do not describe a caller field like `reviewerKind: human` as sufficient authority. Caller assertions are untrusted.

## Architecture must define

1. **Packet binding**
   - every decision binds to an exact #726 `reviewPacketKey`;
   - packet/fingerprint are re-proven at decision time;
   - stale/different packet invalidates the decision.

2. **Reviewer authority**
   - authenticated session;
   - server-verified role/capability;
   - sufficient AAL where current admin/security contracts require it;
   - reviewer identity comes from verified auth context, never request body;
   - no shared generic token in browser storage.

3. **Decision states**
   - needs_more_evidence;
   - reject_candidate;
   - proceed_to_trusted_fact_entry;
   - only the final fact-entry step may provide a candidate `trustedRuleFact` to canonical acceptance.

4. **Trusted fact entry**
   - typed fact must be entered/confirmed at the human boundary;
   - never auto-copy model proposal into trustedRuleFact;
   - reviewer must see the candidate + official support material;
   - explicit/composed accepted-quality rules remain;
   - research_gap/stale/conflict cannot be approved into accepted truth.

5. **Revalidation before acceptance**
   - re-prove #723 packet and #726 key;
   - re-prove accepted Evidence/support;
   - ensure no source/scope/version drift;
   - canonical `regelKandidatAkzeptieren` remains the only Rule acceptance function.

6. **Audit/provenance**
   - define minimal audit fields for a later design:
     reviewPacketKey, ruleScopeKey, factKind, reviewer auth uid (server-derived), decision timestamp (server-derived), decision type;
   - do not include passport/MRZ/scans/biometric/health data;
   - do not yet choose retention or implement DB storage.

7. **Model boundary**
   - #728-style suggestions are advisory only;
   - no model/tool/plugin can assert operator identity or final approval;
   - model suggestion cannot silently pre-fill trusted fact as accepted;
   - if pre-fill is later used for UX, it must remain visibly untrusted until explicit human confirmation.

8. **Smallest future implementation sequence**
   - pure decision-intent contract;
   - authenticated server review endpoint;
   - privileged reviewer authorization check;
   - fact-entry validation;
   - canonical `regelKandidatAkzeptieren`;
   - separate persistence via existing accepted-store writer;
   - audit/retention design separately.

9. **Gate classification**
   Identify which future step becomes a special Product-Owner/security gate under current governance:
   - any major Auth/AAL/role/RLS change;
   - persistent reviewer audit/retention DB change;
   - Production activation;
   - model/live API calls with secrets/cost.

Do not label docs-only/pure contracts as those gates.

## Must read

- `lib/readiness/rule-claims.ts`
- #723/#726 contracts/docs
- admin authorization/AAL contracts on current main
- TL operating standard
- current continuity
- issue #626 for retention/audit precedent
- OpenAI Developers tooling note (no secret/cost authorization).

## Deliverables

Docs only:
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
- lane report/handoff/self-review/task docs.

Do not edit global continuity unless explicitly amended by TL.

## Forbidden

- no runtime;
- no API route;
- no Auth/RLS/DB/Supabase;
- no `regelKandidatAkzeptieren` caller implementation;
- no trustedRuleFact generation;
- no OpenAI/model call;
- no provider/contact/secret;
- no Production/indexing/cost change.

Before final push integrate current main, remain 0 behind, run required docs/full repo gates.

Stay Draft. Do not Ready or merge. Do not start the implementation sequence.
STOP for independent TL review.
