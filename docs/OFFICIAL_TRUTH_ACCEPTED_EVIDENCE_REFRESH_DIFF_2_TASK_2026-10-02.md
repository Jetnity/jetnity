# Official Truth Accepted Evidence Refresh Diff Bridge 2 — Binding Task

Date: 2 October 2026
Issue: #718
Baseline: `main@708a77defa5092e43d5dec991aa09a77e34822db`
Logical agent: **Jetnity Official Truth accepted Evidence refresh diff bridge 1**
Generation: **2**
Required model: **Grok 4.7 High Fast** — not Auto.

## Why Generation 2 exists

Generation 1 / Draft PR #719 found the right R1 correction locally but could not publish it because that agent VM lost valid GitHub write credentials.

Do not reuse or trust the old PR head.

Generation 2 rebuilds the accepted design cleanly on current main.

## Purpose

Compare one **re-proven existing accepted official Evidence** with one newly validated #709 retrieval for the same official source and regulatory cell.

This is a pure refresh optimization contract. It does not create or accept new truth.

## Critical trust correction from R1

**Never accept a caller-supplied EvidenceVersion as the trusted baseline.**

The old Generation-1 API `bestehend: unknown` is forbidden.

The baseline must be reconstructed through the existing trusted pipeline:

- baseline original retrieval envelope;
- baseline injected validation clock;
- baseline extraction metadata;
- call/reuse #716 `officialTruthAkzeptierteEvidenceAusAbruf`.

Only that newly re-proven accepted Evidence may provide the baseline `sourceContentHash`.

The new material must independently re-run #709.

A caller-edited accepted-looking Evidence object, versionId, hash, Object.freeze state or lifecycle flag is never authenticity.

## Input

Equivalent to:
- baseline:
  - original #709 retrieval envelope;
  - injected validation clock;
  - #713 extraction metadata;
- refreshed:
  - original #709 retrieval envelope;
  - injected validation clock.

No caller-built Evidence object.
No caller-built receipt.
No caller-built comparison result.
No arbitrary hashes.

## Required flow

1. Re-prove baseline via #716 from baseline envelope + baseline clock + extraction.
2. Require baseline result `accepted_evidence`.
3. Re-run #709 for refreshed envelope + refreshed clock.
4. Require same `official_authority` sourceId.
5. Require same canonical rule scope/key.
6. Compare only with existing `evidenceVersionenVergleichen(baselineAcceptedEvidence, { sourceContentHash: refreshedReceipt.sourceContentHash })`.
7. Return deterministic refresh decision.

## Output semantics

- `unchanged_source_content`
  - baselineVersionId
  - baselineRequestKey
  - refreshedRequestKey
  - ruleScopeKey
  - sourceId
  - contentChanged: false
  - laterAnalysisShortCircuit: true
  - ruleChange: 'not_asserted'

- `changed_source_content`
  - same ids
  - contentChanged: true
  - laterAnalysisShortCircuit: false
  - ruleChange: 'not_asserted'

- `blocked` with closed reason.

Do not return URL, snapshot, hash, lookup key, candidate Evidence or rule truth.

## Truth rule

Equal source content means only the same normalized source text.

It does NOT mean:
- the legal rule is reaffirmed;
- a prior Rule Claim is current forever;
- entry is allowed;
- requirement is not required;
- the authority did not change another page.

`ruleChange` remains exactly `not_asserted`.

## Security / privacy

Propagate fail-closed results from #716 and #709.

Do not echo snapshot text, URL credentials/tracking values or personal/sensitive values.

No passport/document number, MRZ, scan, biometrics, health, DOB, names, email, user/account/trip/traveller ids or notes in output.

## No execution / no writes

No:
- fetch/browser/search/OpenAI/model/provider;
- caller Evidence acceptance;
- Candidate Evidence constructor;
- Rule Candidate/Claim;
- trusted store/catalog RPC;
- Supabase/DB/Auth/RLS;
- cron/queue;
- UI/API.

`requirementsProviderAus()` remains null.

## Tests

Synthetic `.example` only.

Prove at minimum:
1. re-proven baseline + same new snapshot => unchanged/short-circuit true;
2. changed new snapshot => changed/short-circuit false;
3. ruleChange stays `not_asserted`;
4. no API accepts caller-supplied EvidenceVersion;
5. a fabricated accepted-looking Evidence/hash cannot influence comparison;
6. invalid baseline envelope fails via #716;
7. candidate/invalid baseline extraction fails;
8. licensed baseline fails through trusted path;
9. different source fails;
10. different rule scope fails;
11. tampered refreshed envelope fails via #709;
12. success/error output contains no URL/snapshot/hash/private value;
13. no not_required/rule acceptance/store/DB/model/network path;
14. inputs are unchanged.

Run focused/full tests, typecheck, lint, build, hygiene, git diff --check.

## Ownership

Allowed:
- `lib/readiness/official-truth-refresh-diff.ts`
- `lib/readiness/official-truth-refresh-diff.test.ts`
- `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_REFRESH_DIFF_2_*`

Read-only:
- #709 retrieved material;
- #713 candidate bridge;
- #716 acceptance bridge;
- evidence.ts;
- rule-claims.ts;
- source registry/router.

Forbidden:
- modifying existing runtime;
- rule candidate/acceptance paths;
- store/catalog;
- Supabase/migrations;
- app/components;
- package/lockfile;
- global continuity.

Before final push:
- fetch then-current main;
- integrate it;
- remain 0 behind;
- rerun all gates.

Stay Draft.
Do not Ready.
Do not merge.
STOP for independent TL review.
