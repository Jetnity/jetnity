# UK ETA Legal-Proof Readiness 1 — Self Review

Date: 9 October 2026. Author: **Jetnity Official Truth UK ETA legal proof readiness 1 — Generation 1**. This is author evidence, not independent Technical-Lead PASS.

| Threat / failure mode | Implemented protection and exercised evidence |
| --- | --- |
| Model/free-text injection or extra personal/operational fields | No free-text fields; strict nested schemas, canonical data preflight, static output labels. Tests inject PII, raw bodies, request metadata and acceptance fields; no input value/path/error is echoed |
| Getter/prototype/cycle/symbol/proxy/non-JSON abuse | Reused descriptor preflight before access; post-preflight structuredClone; bounded parsing; finite refusal. Getter counters stay zero; nested and revoked proxies, sparse arrays, cycles, inherited/non-enumerable keys fail |
| Source identity laundering | Exact fixed source-label/URL pairs; all labels RESEARCH_ONLY; no new content item/registry. Crossed, tracked, encoded and fragmented URLs refused |
| Historical or synthetic source as current law | Origin retained; historical/stale/ambiguous/conflicting reasons accumulate. No sourceRevision or legal validity invented; clarification-located stays unreviewed |
| R1 time substitution | Separate qualifier-target and never-applied predicates; application assertion cannot resolve either. No applicationDate/reference event generated |
| Negative knowledge | Full R1–R6/20-case coverage; non-exhaustive set and class-wide permission absence always explicit. Missing/expired/unreviewed context never becomes false |
| School/status/CTA oversimplification | Distinct residence/entitlement/restriction, origin, age/proof duty, school relation/count/listing/form authority/adult custody labels. BOTC/BNO, forces, crew, status and agreement routes stay unresolved |
| Issuer/citizenship/default selection | Existing canonical scope parser; exact full CH set; no first-array default; missing and unlinked credential gaps preserved. Other scope refused, never narrowed |
| Destination-to-transit leakage | Explicit research journey flag required before transit cases can be excluded; airside/landside input refused outside this slice |
| Silent stripping of an inactive union field | Canonical input/output serialization comparison; contradictory inactive fields refused. This tightened the task boundary without editing the shared parser |
| Source acceptance/F8/hosted action | No imports/calls to acceptance, source retrieval, store, client/env or runtime engine. Explicit independent platform gaps; no app/components/lib consumer outside the dedicated test |
| #913 ownership/safety | Only public PR state and #751 index checked. No access to blocked session/payload, no copy, republish, history rewrite or branch change |

## Actual corrections and test failures disclosed

1. Initial focused run: 91/93 passed. One test incorrectly expected out-of-scope instead of the canonical invalid-scope classification for a missing destination. One real boundary defect allowed a known-but-inactive residence field to be silently dropped by the canonical reader. The test expectation was aligned with the existing parser; the new intent now requires canonical byte-equivalent shape. A second run exposed two ordering classifications for unsorted multi-citizenship; out-of-scope classification now precedes canonical-form comparison, so ordering cannot change that reason. Third run: 93/93. Later coverage additions bring the final dedicated suite to 97 tests.
2. Combined host regressions: 511/513 passed. The native store test needed the existing Linux PostgreSQL path, absent on macOS. The other failure was the fixed canonical importer inventory. Its exact four-line additive amendment was explicitly approved by the Product Owner before applying. No guard, threshold or test was removed or evaded; see PLAN.
3. First full Linux run: 6,184/6,188 passed, four native proofs refused the image's inherited PG_MAJOR/PG_VERSION/PGDATA variables. Only those image defaults were removed for the next disposable, network-disabled run. The local connection-override guard and all source/tests remain unchanged. This initial run is not reported as a pass.
4. The sandboxed setup invocation could not open tsx's local IPC socket. The same unchanged command was rerun with the permitted local execution capability and passed. No missing-secret skip is claimed as an executed Auth test.
5. Final review removed redundant “unreviewed” labels for actually missing passport/CTA context; each fact now has exactly its supplied coverage state. Source locators were aligned with the original audit, including the distinct German form content item. These changes are included in the final test runs.

Raw test logs remain local and are not published because they can contain machine paths. Validation evidence contains finite counts, outcomes, safe environment versions and failure classifications. The manifest hashes only this task's code/docs/synthetic evidence and the immutable TASK; no live source/opaque identifier is hashed or exported. Existing historical evidence is untouched.

Remaining uncertainty is substantive: whole-source privacy, operative clause revision/effect, R1–R6 semantics, exhaustive exceptions, journey/credential/context proof and acceptance/activation authority. No self-review removes these gates. Exact-head CI/Auth/Preview and independent TL review remain separate from local author validation.

**STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW.**
