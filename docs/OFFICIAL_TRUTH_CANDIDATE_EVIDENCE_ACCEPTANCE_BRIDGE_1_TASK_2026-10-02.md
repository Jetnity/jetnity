# Official Truth Candidate Evidence Acceptance Bridge 1 — Binding Task

Date: 2 October 2026
Issue: #714
Baseline: `main@16f3a8d631bb823c9daafc724df67c000dcb5985`
Logical agent: **Jetnity Official Truth candidate evidence acceptance bridge 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Re-run the trusted retrieval→candidate path and then use only the existing canonical `evidenceKandidatAkzeptieren` function to accept that Evidence version.

This accepts source/provenance Evidence only. It does not assert an entry rule.

## Input

- original #709 retrieval envelope;
- injected validation clock;
- the bounded extraction metadata accepted by #713.

Do not accept a caller-built Candidate Evidence object.

## Required flow

1. Call/reuse #713 from the original envelope + clock + extraction.
2. Require `candidate_evidence`.
3. Read registry only from the original validated envelope.
4. Call existing `evidenceKandidatAkzeptieren(candidate, registry)`.
5. Return only the canonical accepted Evidence result or a closed error.
6. Verify output remains same source/scope/url/retrievedAt/hash as the candidate except canonical acceptance state.

Success must be:
- lifecycle `accepted`;
- validationState `valid`;
- sourceClass `official_authority`.

## Non-scope

No:
- Rule Candidate / Rule Claim;
- `regelKandidatErstellen` / `regelKandidatAkzeptieren`;
- trusted Rule Fact;
- store/catalog RPC;
- DB/Supabase/Auth/RLS;
- browser/search/OpenAI/model/provider/network;
- source registration;
- UI/API;
- Production mutation.

Do not persist accepted Evidence.

`requirementsProviderAus()` remains null.

## Privacy

Reject/propagate fail-closed handling for personal/sensitive keys. Do not echo rejected values.

## Tests

Synthetic `.example` only.

Prove:
1. valid #713 path -> accepted/valid official Evidence;
2. candidate identity/provenance/scope preserved;
3. candidate object from caller is not accepted as input;
4. tampered envelope/extraction fails through #713;
5. accepted Evidence still contains no rule result/effect;
6. `regelKandidatAkzeptieren` is absent;
7. no store/RPC/DB/network/model path;
8. input not mutated.

Run focused/full tests, typecheck, lint, build, hygiene, diff check.

## Ownership

Allowed:
- `lib/readiness/official-truth-accepted-evidence.ts`
- `lib/readiness/official-truth-accepted-evidence.test.ts`
- `docs/OFFICIAL_TRUTH_CANDIDATE_EVIDENCE_ACCEPTANCE_BRIDGE_1_*`

Read-only:
- #709, #713, evidence.ts, registry/router.

Forbidden:
- modifying existing runtime;
- Lane B Rule Candidate files;
- rule-claims.ts;
- store/catalog;
- Supabase/migrations;
- app/components;
- package/lock;
- global continuity.

Before final push integrate then-current main, remain 0 behind, rerun all gates.
Stay Draft. Do not Ready or merge. Do not start persistence or Rule acceptance.
STOP for independent TL review.
