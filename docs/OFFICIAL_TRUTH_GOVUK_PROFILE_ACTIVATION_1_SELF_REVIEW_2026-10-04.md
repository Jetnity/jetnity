# Official Truth GOV.UK Profile Activation 1 — Writer Self-Review

Date: 4 October 2026. Issue #824 / Draft PR #825. Same writer/session/model as REPORT and HANDOFF.

Classification: **NO IMPLEMENTATION DEFECT FOUND IN THIS SELF-REVIEW; LOCAL SQL VALIDATION INCOMPLETE; INDEPENDENT TL REVIEW STILL REQUIRED**. This is not Technical-Lead PASS.

| Adversarial question | Evidence and conclusion |
| --- | --- |
| Could activation introduce a clone, extra profile or mutable authority? | Production imports the original exported object into a frozen one-element array. Tests assert strict object/function equality, exact id/v1/current, both freezes and failed array mutation. No second definition/registry or registration mutator was introduced. |
| Does the type dependency create a harmful runtime cycle? | Inspected the unchanged profile module: the sole import is type-only. TypeScript emission contains no runtime dependency. Isolated processes import either module first and observe the same completed object. No partial initialization was observed. |
| Was the old zero-importer guard weakened too far? | It now expects one exact path only. All other non-test importers remain failures; no broad directory allowlist, route/UI exception or scan exclusion was added. |
| Could import do work before a test notices? | Precise V8 coverage starts before importing either module. The existing verifier, graph and Evidence/Rule acceptance functions have zero calls. Network entry points throw; Supabase/catalog/store/extractor modules are not loaded. Existing configured-environment import tests also pass. |
| Are default-path proofs secretly using an injected verifier? | Registration's initial/replay tests inject only transport; successful retrieval injects catalog transport, HTTP/DNS and time. No `identityProfiles` dependency is supplied in either positive default proof. The normal graph fixture likewise uses no profile override. |
| Does structural registration falsely claim origin or invoke the verifier? | Coverage sees zero calls to the actual immutable default verifier during registration. Its positive control then sees one explicit call. Exact payload checks prove structural registration only; no real catalog or government body is used. |
| Does activating a profile weaken existing authority/URL/replay/response checks? | Existing tests remain; new default-path negatives exercise wrong/nonofficial source, URL ownership, changed item/representation replay and caller profile injection before any registration operation. Missing/extra response keys, wrong schema/operation/outcome/tuple still fail after exactly the expected read/write trace. No gateway runtime was edited. |
| Can wrong/retired/duplicate definitions be selected? | R1 checks unavailable ids/versions, malformed verifier, duplicate version/current. Retrieval tests reject wrong catalog pins or unavailable/retired/duplicate test definitions before DNS/HTTP. The production registry has exactly one current match. |
| Can a caller become verifier authority or spoof response material? | Invalid public input rejects profile/verifier/body/catalog fields before external work; a malicious verifier counter stays zero. The test-only observer sees frozen catalog descriptors and only server-received text/final URL/media type. Existing production caller-rejection boundaries remain unchanged. |
| Can a verifier return a different identity? | Each of the seven final binding fields is forged separately through the test seam, plus an extra field. Every attempt fails final rebind and never receives an acceptance time. Real default verification also rejects malformed/sibling/publisher-mismatched responses. |
| Does absent Production v2 turn into empty success or fallback? | The actual default transport is exercised with fake configuration and intercepted missing-RPC/exception responses. Both read and registration return only `catalog_failed`; each trace is one literal v2 `read_registry` POST. No v1 RPC, registration, apply or secret leaves the boundary. Retrieval separately fails before HTTP on missing/failed/v1 catalogs. |
| Did availability accidentally activate other trust paths? | R2 explicitly retains frozen-empty extractor, composition and region-pin registries. Production changes no source rows, gateway call site, Rule constructor, evidence/store, Auth/RLS, migration, provider or runtime-selection code. No F8. |
| Is verification complete enough to claim a global PASS? | No. Local focused/full suites fail one/three existing PostgreSQL tests because the fixed Linux `initdb` path is absent. All remaining tests and required non-SQL gates pass locally. Exact-head Linux CI and independent TL review are mandatory; no skip or invented PASS. |

## Scope and residual risk

Reviewed the complete production diff and all five allowed test diffs. The task and reviewed profile implementation are byte-identical to the seed; report includes their hashes. All implementation files stay within the allowlist. Shared test-fixture reuse stays in the existing R2 test file, whose suite guard prevents duplicate suite execution when imported.

V8 coverage proves the named runtime functions' invocation counts for the executed import/registration scenarios; it is not a blanket proof of arbitrary future code. Finite importer guards and explicit network traps complement it. Tests use synthetic content and transport seams and cannot certify live government origin or current legal facts. The unchanged parser can fail closed if GOV.UK changes shape; no live fetch was authorized here.

The final receipt, not an implementation-tree success claim, binds rerun results to the pushed head. Existing lint/build warnings are documented. No hosted database state was independently refreshed. New recurring cost: **no**; existing CI/Preview resource usage remains possible after the authorized push.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** Keep Draft. No Ready/merge/registration/Development write/F8/follow-up.
