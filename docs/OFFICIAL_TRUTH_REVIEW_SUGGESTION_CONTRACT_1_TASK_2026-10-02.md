# Official Truth Non-Authoritative Review Suggestion Contract 1 — Binding Task

Date: 2 October 2026
Issue: #728
Baseline: `main@5e291ed7c4814f034224eda46c3bd62cc9815ea3`
Logical agent: **Jetnity Official Truth non-authoritative review suggestion contract 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Define a pure validation contract for a future reviewer suggestion that is bound to one exact #723/#726 review packet.

This contract may later receive a suggestion from a model or a human reviewer, but the result is **never** Official Truth and must never become `trustedRuleFact`.

## Trusted packet boundary

Input must contain:
- the original input accepted by #723;
- one proposed reviewer suggestion object.

The implementation must:
1. re-run #723 from the original packet input;
2. re-run #726 from that same original packet input;
3. require the packet and fingerprint to agree on ruleScopeKey + supportVersionIds;
4. reject caller-built packet/fingerprint/keys/support lists.

## Suggestion shape

Allow only:
- `assessment`: exactly one of
  - `supports_candidate`
  - `contradicts_candidate`
  - `insufficient_evidence`
  - `needs_human_review`
- `citedSupportVersionIds`: zero or more IDs, all must be in the re-proven packet;
- `reasonCodes`: bounded sorted unique machine-readable codes from a small explicit allowlist:
  - `support_text_matches_candidate`
  - `support_text_conflicts_candidate`
  - `support_scope_ambiguous`
  - `support_stale_or_time_unclear`
  - `support_sources_conflict`
  - `support_insufficient_for_claim`
  - `proposal_requires_human_judgment`
- optional `reviewNote`: null or bounded <= 500 chars, trimmed, no personal/sensitive keys or secret-like material.

No free-form fact object.

## Semantics

- `supports_candidate` is still only a suggestion. It does not mean the candidate is true.
- `contradicts_candidate` does not itself reject a Rule Claim because no Rule Claim exists yet.
- `insufficient_evidence` / `needs_human_review` remain review states only.
- citation IDs are references only; no source ranking.
- suggestion may not add/remove/rewrite candidate/support content.

## Output

Equivalent to:
- `status: 'review_suggestion'`
- `reviewPacketKey`
- `ruleScopeKey`
- `assessment`
- sorted `citedSupportVersionIds`
- sorted `reasonCodes`
- `reviewNote`

Do not output:
- sourceSnapshot;
- canonicalUrl;
- sourceContentHash;
- proposal;
- Rule fact;
- trustedRuleFact;
- acceptance result.

## Privacy/security

Reject personal/sensitive keys recursively:
passport/document number, MRZ, scan, biometric, health, DOB, name, email, user/account/trip/traveller ids, traveller notes.

No value echo on failure.

No:
- `regelKandidatAkzeptieren`;
- trustedRuleFact;
- accepted Rule Claim;
- store/catalog RPC;
- Supabase/DB/Auth/RLS;
- browser/search/OpenAI/model call;
- provider/network;
- public UI/API.

`requirementsProviderAus()` remains null.

## Tests

Synthetic fixtures only.

Prove:
1. valid supports_candidate suggestion binds to exact #726 key;
2. reversing support input order keeps the same key/sorted citations;
3. cited support not in packet fails;
4. duplicate citation fails or canonicalizes only if exact contract says so — prefer fail closed;
5. unknown assessment/reason code fails;
6. personal/sensitive nested value fails without echo;
7. caller packet/fingerprint/trustedRuleFact/support ids fail;
8. output contains no snapshot/url/hash/proposal/fact;
9. no Rule acceptance/store/DB/network/model path;
10. input not mutated.

Run focused/full tests, typecheck, lint, build, hygiene, git diff --check.

## Ownership

Allowed:
- `lib/readiness/official-truth-review-suggestion.ts`
- `lib/readiness/official-truth-review-suggestion.test.ts`
- `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONTRACT_1_*`

Read-only:
- #723 review packet;
- #726 fingerprint;
- existing Official Truth runtime.

Forbidden:
- modifying existing runtime;
- Lane B trust-boundary docs;
- store/catalog;
- Supabase/migrations;
- app/components;
- package/lockfile;
- global continuity.

Before final push integrate then-current main, remain 0 behind, rerun all gates.

Stay Draft. Do not Ready or merge. Do not start model execution or Rule acceptance.
STOP for independent TL review.
