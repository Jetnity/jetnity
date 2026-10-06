# Official Truth same-request request provenance capture 1 — Task

Date: 6 October 2026
Issue: #887
Repository: Jetnity/jetnity
Baseline: `main@fc2734ca60ae3c578fbcd414055fe983773d74d2`
Branch: `feat/official-truth-same-request-request-provenance-capture-1`
Execution lane: Codex Desktop
Parallel-safe with #884/#885/#886.

## Objective

Implement the smallest safe first part of #863 section 12 step 2.

The same-request loop already selects an approved initial request URL from the exact representation and passes it into server-owned retrieval. The successful retrieval/result projection currently exposes only the final canonical URL. A later provenance receipt must not reconstruct the initial URL using `requestUrls[0]` or any after-the-fact guess.

Capture the actual validated initial request URL at execution time and preserve it through same-request extraction provenance.

This is **step 2A only**, not completion of all safe same-request integration.

## Binding reads

Re-read:
- live main/mode/#751/#741/#887;
- merged #855/#861/#863/#880;
- #855 receipt architecture, especially `freshRetrieval.requestUrl`;
- current `official-truth-server-owned-retrieval.ts` and tests;
- current `official-truth-same-request-extraction-server.ts` and tests;
- current content-identity R2 tests/import guards.

## Required runtime contract

### Server-owned retrieval

On successful `server_owned_official_retrieval`, add an immutable field:

`requestUrl: string`

Semantics:
- it is the **actual validated canonical initial URL used for the first HTTP hop**;
- capture after fragment removal and registry/source validation;
- preserve an approved query string exactly;
- do not silently drop query parameters;
- tracking URLs continue to fail closed under the existing policy;
- do not expose raw caller input if canonicalization changed it;
- `canonicalUrl` remains the final verified URL;
- requestUrl and canonicalUrl may differ because of an approved redirect/final-only representation;
- no raw redirect chain, headers, cookies, DNS/IP, body bytes or secrets are added.

### Same-request extraction

Extend the internal retrieval provenance to retain the exact `requestUrl` from the successful retrieval.

The same-request selector already chooses:
- support canonical URL when it is itself in the representation request set; otherwise
- the first approved representation request URL.

Tests must prove the returned provenance contains the URL actually selected and used, not one reconstructed after the retrieval.

The output stays internal material, not Evidence, acceptance or authority.

## Required cases

Prove at least:

1. no-redirect request: requestUrl equals actual approved initial URL and canonicalUrl equals final;
2. support canonical final URL not allowed as initial request: same-request chooses another approved request URL; output preserves that initial request URL while canonicalUrl remains the final support URL;
3. approved query string survives exactly;
4. fragment is excluded from request provenance and HTTP request as today;
5. tracking parameter remains blocked;
6. redirect path never overwrites requestUrl with a later hop;
7. multiple supports each retain their own exact requestUrl in proof support order;
8. source/content identity matching remains unchanged;
9. sourceSnapshot/raw body is not present in exported same-request provenance;
10. result is deeply frozen;
11. caller cannot inject `requestUrl`/authority fields through input;
12. existing empty production extractor/policy behavior is unchanged;
13. no DB/Supabase/store/Evidence/Rule/F8 side effect;
14. existing importer restrictions remain exact.

## Explicit non-completion

This slice does NOT yet implement:
- executable release pins beyond already existing identity fields;
- full original-observation / validity-origin / accepted-origin issuer resolution;
- full phase-A/B immutable context artifact;
- receipt/custody-binding emission;
- graph closure;
- persistence;
- F8.

Document these as remaining #863 step-2/3 prerequisites.

## Allowed files

TASK immutable:
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_REQUEST_PROVENANCE_CAPTURE_1_TASK_2026-10-06.md`

May modify:
- `lib/readiness/official-truth-server-owned-retrieval.ts`
- `lib/readiness/official-truth-server-owned-retrieval.test.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `lib/readiness/official-truth-same-request-extraction-server.test.ts`
- `lib/readiness/official-truth-content-identity-r2.test.ts` only if an exact existing result-shape/import assertion requires reconciliation

May create:
- `lib/readiness/official-truth-same-request-request-provenance-capture.test.ts`
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_REQUEST_PROVENANCE_CAPTURE_1_REPORT_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_REQUEST_PROVENANCE_CAPTURE_1_HANDOFF_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_REQUEST_PROVENANCE_CAPTURE_1_SELF_REVIEW_2026-10-06.md`

No other path without STOP + TL approval.

## Hard non-scope

No source/profile/corpus registration.
No new production extractor/policy.
No provider/model call.
No DB/Supabase/RPC/SQL.
No Evidence acceptance.
No Rule acceptance.
No persistence.
No retention decision.
No F8.
No Auth/AAL/background identity.
No change to #880 live root.
No receipt/custody emission.
No Production activation.
No global continuity edit.
No follow-up.

## Security requirements

- Existing SSRF/DNS/redirect/domain/content-identity controls remain unchanged or stricter.
- No URL token/secret is introduced into provenance by bypassing existing validation.
- Request URL is provenance data, never request authority for a later run.
- Historical requestUrl must never authorize a future network call.
- No caller-supplied requestUrl field is accepted as authority.
- Output remains immutable/frozen.

## Checks

Run:
- retrieval tests;
- same-request extraction tests;
- content-identity R2 tests where affected;
- relevant #880 foundation/v3 tests to prove no accidental authority bridge;
- broad relevant Official Truth suite;
- typecheck, lint, Production build, hygiene/mode, `git diff --check`;
- exact-head remote CI/Vercel after push.

## Delivery

Commit + push same authorized branch.
Report exact head, merge-base/ahead/behind, changed files, TASK blob, tests, security/zero-side-effect evidence, P0–P3, Codex session/model.

Classification:
- `OFFICIAL_TRUTH_SAME_REQUEST_REQUEST_PROVENANCE_CAPTURE_1_READY`
or
- `OFFICIAL_TRUTH_SAME_REQUEST_REQUEST_PROVENANCE_CAPTURE_1_NOT_READY`

Stay Draft. Do not Ready. Do not merge. Do not start receipt emission.

STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
