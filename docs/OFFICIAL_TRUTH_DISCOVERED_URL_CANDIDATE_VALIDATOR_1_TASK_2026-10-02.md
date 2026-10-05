# Official Truth Discovered URL Candidate Validator 1 — Binding Task

Date: 2 October 2026
Issue: #710
Baseline: `main@3f4b1bfd5fe545c36fdc689cb0c6204b4287c403`
Logical agent: **Jetnity Official Truth discovered URL candidate validator 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Validate URL candidates that a later discovery/search step may propose.

This slice performs no discovery and no network access.

## Input

- existing #702 research request;
- current Source Registry;
- current source descriptors;
- proposed candidates: bounded list of exact pairs `{ sourceId, url }`.

Do not accept a caller-built #708 plan as truth. Re-run #708 from request + registry + descriptors.

## Eligibility

A candidate may pass only if:
1. #708 returns `ready`;
2. candidate sourceId appears in that plan;
3. source is `official_authority`;
4. URL resolves through existing `quellenUrlAufloesen`;
5. resolved sourceId equals the candidate sourceId;
6. resolved host is covered by that source's exact #708 domain allowlist;
7. URL is tracking-clean.

Reject:
- licensed provider;
- source not in plan;
- another source's URL;
- unregistered/blocked/local/insecure/credential URL;
- malformed candidate;
- duplicate canonical URL for the same source;
- candidate count > 16.

Tracking-only names, case-insensitive:
`utm_*`, `gclid`, `dclid`, `fbclid`, `msclkid`, `gbraid`, `wbraid`, `mc_cid`, `mc_eid`.

Do not silently strip tracking parameters.

Functional `lang` and generic `ref` stay allowed.

## Output

Deterministic, stable, unique URL candidates only:
- sourceId;
- canonicalUrl.

No score/rank/preference/default source.
Sort stability by sourceId then canonicalUrl only.

No source metadata, no publisher text, no authority ranking.

## Security / Privacy

No personal/traveller data fields.
Reject representative passport/document number, MRZ, scan, biometric, health, DOB, names, email, account/user/trip/traveller ids and traveller/free-form notes without echoing values.

No URL credential value echo.

## No execution / no truth

No:
- fetch/browser/search/OpenAI/model;
- provider adapter;
- source registration/catalog write;
- Candidate Evidence;
- Evidence/Rule acceptance;
- DB/RPC/Supabase/Auth/RLS;
- cron/queue;
- public API/UI.

`requirementsProviderAus()` stays null.

## Tests

Synthetic `.example` only.

Prove:
1. allowed official URL passes;
2. two candidates sort deterministically;
3. licensed/source-not-in-plan fails;
4. another source URL fails;
5. blocked/local/insecure/credentials fail;
6. tracking params fail without echo;
7. lang/ref allowed;
8. duplicate canonical candidate fails rather than silently deduping;
9. >16 candidates fails;
10. tampered request/registry/descriptors fails via #708;
11. no personal/sensitive values in errors;
12. no network/model/DB/truth path.

Run focused tests, full npm test, typecheck, lint, build, hygiene, git diff --check.

## Ownership

Allowed:
- `lib/readiness/official-truth-discovered-url-candidates.ts`
- `lib/readiness/official-truth-discovered-url-candidates.test.ts`
- `docs/OFFICIAL_TRUTH_DISCOVERED_URL_CANDIDATE_VALIDATOR_1_*`

Read-only:
- #702 request;
- #705 routing;
- #708 execution plan;
- source registry/router.

Forbidden:
- modifying existing runtime;
- Lane B candidate-evidence bridge files;
- Candidate Batch Validator;
- Supabase/migrations;
- app/components;
- package/lockfile;
- global continuity.

Before final push integrate then-current main, remain 0 behind, rerun all gates.
Stay Draft. Do not Ready or merge. Do not start actual discovery/fetch.
STOP for independent TL review.
