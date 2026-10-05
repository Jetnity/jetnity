# Official Truth Same-Source Review Architecture Reconciliation 1 — Binding Task

Date: 2 October 2026
Issue: #737
Baseline: `main@f970669b084b288c3adbc85333ab6f12ce0589d1`
Branch: `docs/official-truth-same-source-review-architecture-reconciliation-1`
Logical agent: **Jetnity Official Truth same-source review architecture reconciliation 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## 1. Purpose

Correct one later architecture statement that conflicts with already accepted fail-closed runtime semantics.

This is **docs only**.

Do not change #717, #723, #726, #734 or any runtime/test file.

## 2. Established live truth

The Technical Lead has re-read current main.

### #717 — canonical Rule Candidate bridge

`officialTruthRegelKandidatAusEvidence` calls `regelKandidatErstellen`, then explicitly checks:

- if `evidenceQuality === 'composed_from_multiple_primary_sources'`;
- collect `sourceId` values from the accepted official Evidence;
- fewer than two distinct source ids returns `{ ok: false, reason: 'same_source_composition' }`;
- the failure carries **no candidate**.

This was intentional in the #717 binding task/report/self-review: returning a same-source composed candidate would falsely present a claim as composed from multiple primary sources.

### #723 — canonical Rule Review Packet

#723 calls #717. Therefore a same-source composed input fails before a `rule_review_packet` exists.

It cannot take any decision state because it has no packet/fingerprint key.

### #731 — later architecture inconsistency

The binding architecture currently says, in section 5, in substance:

> A composed packet whose supports share one source can exist as review material because distinct sources are enforced at acceptance.

That statement is false against accepted #717/#723 runtime truth.

### #734 — decision intent

#734 correctly exposed this discrepancy and did not widen scope.

Its defensive same-source proceed guard may remain. No runtime edit is authorized here.

## 3. Binding correction

Preserve #717/#723 fail-closed semantics.

Correct `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md` so it says unambiguously:

- `composed_from_multiple_primary_sources` means multiple distinct official sources before a Rule Candidate is emitted;
- same-source composition is rejected by #717 with `same_source_composition`;
- therefore #723 has no Rule Review Packet and #726 has no review key for that input;
- no decision intent exists for that rejected input;
- `needs_more_evidence` / `reject_candidate` apply only to an input that successfully became a Rule Review Packet;
- if more evidence is required after same-source rejection, the upstream research/evidence path must obtain an eligible distinct official source or otherwise produce a valid candidate quality; the review layer must not relabel an invalid composition as valid review material;
- the #734 defensive same-source check is defense in depth / currently unreachable through successful #723 output; it is not a new candidate path;
- `regelKandidatAkzeptieren` remains the only canonical acceptance function;
- no runtime behavior changes.

Do not rewrite history as if the original #731 delivery had contained the correction. Add a clearly dated Technical-Lead reconciliation/correction note in the binding architecture.

## 4. Scope

Allowed:
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_SAME_SOURCE_REVIEW_ARCHITECTURE_RECONCILIATION_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_SAME_SOURCE_REVIEW_ARCHITECTURE_RECONCILIATION_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_SAME_SOURCE_REVIEW_ARCHITECTURE_RECONCILIATION_1_SELF_REVIEW_2026-10-02.md`

Read-only:
- this binding task;
- #717 task/report/self-review and runtime/tests;
- #723 task/report/self-review and runtime/tests;
- #731 task/report/handoff;
- #734 task/report/handoff/self-review and runtime/tests;
- `rule-claims.ts`.

Forbidden:
- all `lib/`, `app/`, `components/`, `types/`, `hooks/`, `supabase/`;
- migrations, DB, Auth, AAL, role/capability/RLS;
- provider/model/network/API calls;
- secrets/cost/Production/indexing/launch;
- global current-state files;
- #626;
- any follow-up endpoint or acceptance implementation.

If the correction cannot be made without changing runtime, STOP and report instead.

## 5. Acceptance criteria

1. The binding #731 architecture no longer claims same-source composed input can be a successful review packet.
2. It explicitly points to #717 fail-closed candidate semantics and #723 consequence.
3. It preserves all three decision states for **valid** review packets.
4. It does not weaken acceptable-quality, official-source, support-count, packet-key, human authority, AAL2, capability, trusted-fact or canonical acceptance boundaries.
5. It does not select/remap a capability.
6. It does not authorize an authenticated endpoint.
7. It does not alter the current V1 human/operator path or future deterministic-non-model compatibility rule.
8. It does not modify historical #731 task/report/handoff author records.
9. #734 runtime remains untouched.
10. No special Product-Owner gate is crossed.

## 6. Validation

Before handoff:
- fetch latest `origin/main`;
- remain 0 behind;
- `git diff --check`;
- operating-mode guard;
- full `npm test`;
- typecheck;
- lint;
- production build;
- existing hygiene/API/schema checks.

Exact-head GitHub CI/Auth/Vercel Preview are Technical-Lead gates after push.

## 7. Governance

Stay Draft.
Do not Ready.
Do not merge.
Do not start a follow-up slice.
Self-review is not Technical-Lead PASS.
On CHANGES REQUIRED, use this same logical agent/session and fix only the named findings.

**STOP for independent Technical-Lead exact-head review.**
