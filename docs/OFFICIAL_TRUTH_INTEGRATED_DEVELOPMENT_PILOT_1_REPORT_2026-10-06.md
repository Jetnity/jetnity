# Integrated development pilot 1 — consolidated TL-R2 report

**OFFICIAL_TRUTH_INTEGRATED_DEVELOPMENT_PILOT_1_READY_FOR_TL_REVIEW**. Author correction evidence only; PR #900 remains Draft and the R2 review threads remain Technical-Lead-owned. `realOfficialSourcePilot = BLOCKED`. This is the same Generation1 writer and implementation, with no main synchronization. Final exact-head remote gates are recorded in the delivery receipt after publication; historical gates are not transferred to a new head.

## Binding scope and corrected behavior

TASK blob `ca60cdd60bdd9682fc0f0a05d9e9f53fe17986ad` is unchanged. The binding inputs are [TL-R1](https://github.com/Jetnity/jetnity/pull/900#issuecomment-6027081169), [TL-R2 and its three threads](https://github.com/Jetnity/jetnity/pull/900#pullrequestreview-5442544139), and [checkpoint #751](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6038338666).

| Finding | Consolidated correction and evidence |
| --- | --- |
| R2-F1 | SQL independently requires candidate/global-scope requirement equality, canonical MIME for every descriptor including unselected definitions, and exact travel_date/evaluationDatePlan equivalence. Native correctly rehashed counterexamples fail at the public publisher; attempted COMMIT retains zero rows in all eight tables and fresh independent reads report absent. |
| Related finite-codec omissions | Canonical path alphabet/no double dots/length200; JSON-pointer length256; UTF-16 lengths for locators, display names and implementation text; exact source-name whitespace normalization. Matching Unicode/boundary positives and negatives are documented in the regression evidence and CONTRACTS audit. No canonical reader or fact namespace was changed. |
| R2-F2 | Backend startup establishes25s statements,15s locks,20s idle open transactions and no ordinary idle-session timeout. An independently armed native20s backend guard covers deferred COMMIT work, where PostgreSQL disables statement_timeout. Tests prove interruption, complete rollback, advisory-lock release and a succeeding independent writer with verified readback. Unknown COMMIT remains unknown until explicit verification. |
| R2-F3 | Only the new local TS descriptor maximum8 changes to canonical16. Actual9/16 bundles pass;17 fails. A16-representation bundle commits and passes complete independent readback. Remaining R1 byte/graph/node/edge/transport limits are unchanged. |

Both actual captured Primary and Composition paths retain the existing local-v2 depth16 profile and complete SQL roundtrips. The exact same depth11 envelopes still refuse legacy-v1 maximum8. Receipt/C/H/Pin/K, application activation guards and canonical contracts remain frozen.

## RED/GREEN and validation

Native PostgreSQL17.6: all3 mandatory storage tests pass (0 failures/skips), including69 semantic/security groups and the separate16-group structural proof. Primary652/composed720-row complete readbacks pass. R2 includes9 positive controls,14 rehashed negative packages, one16-representation committed roundtrip and7 deadline/recovery checks. The full native run took397,202ms; timings are observed local measurements, not a Linux benchmark.

The baseline native probe accepted the contradictory F1 packages and the related omitted refinements. For F3 it accepted9/16 while the local TS reader rejected them;17 already failed. Those are actual RED outcomes, not synthetic expectations. The additional audit probe uses the baseline SQL with the current owned-cluster runner and is labelled accordingly.

Moving statement_timeout to startup alone still failed the deferred-COMMIT test at the client fallback. PostgreSQL's upstream finish_xact_command disables that timer before transaction completion. The native guard fixes the reproduced gap without changing any frozen contract or adding PGlite. PID, backend birth and transaction identity are checked after the server-side sleep; the adapter verifies that the guard is armed before sending COMMIT and cancels/joins it afterwards.

The first UTF-16 implementation also failed a concurrent positive writer test. That attempt did not retain its precise rejected SQLSTATE, so no more specific cause is claimed. The implementation was corrected to an ASCII fast path plus counting supplementary characters; the full native regression is repeated without increasing time limits or dropping constraints.

Local full suite:5,627 tests /810 suites;5,622 passed,5 failed,0 skipped. Four unchanged tests require hardcoded Linux PostgreSQL16 initdb and fail on this Mac. The fifth was the newly discovered exact importer guard; the precise path was reconciled and all49 Content Identity/guard tests now pass (0 failures/skips). No test is skipped or weakened. Fresh final-head Linux CI must run and pass the full suite. Typecheck, Lint (0 errors/145 existing warnings), Build and all six hygiene/mode checks pass. Descriptor/bundle tests:16 passed, including9/16 acceptance and17 refusal. Final developer command: PASS/exit0, both actual producer roundtrips,50 controlled failure paths,69 semantic SQL groups and16 structural groups. No real-source attempt in R2.

The command manifest distinguishes failed setup/implementation attempts from final local checks. Raw logs remain private; public evidence contains bounded results and log digests without local home paths, account values, SQL parameters or database error text. `r2-regression-evidence.json` contains the actual RED/GREEN matrix; developer-report contains producer fingerprints, stages, counters and native check names. The C01–C29 coverage matrix retains its prior helper-versus-integrated distinctions.

## Preserved limits and separate source outcome

The accepted integrated namespace remains legacy `requirement_effect / visa`, applicabilitySchema null. No conditional/atom/otherwise/visa-option production claim is added. The frozen deeper graph16/17 boundary is exercised by the existing traversal instrumentation; actual producer graphs remain depth11. Historical receipt readback confers no current issuer, accepted Evidence/Rule, F8 or network authority.

R2 performs no new official-source campaign. The retained actual GOV.UK evidence remains BLOCKED by the unchanged65536-byte whole-response limit and the separate opaque publishing-metadata qualification prerequisite. No real source origin/fact/receipt was issued. The R2 developer command records NOT_RUN for that invocation, while STATUS and retained official-source.json preserve the independently documented overall BLOCKED result.

Captured application inputs and exact emitted/bootstrap bytes are executed; the host loader, compiler, Node and finite builtins remain trusted. Native deadlines are operational limits, not retention/TTL choices. They rely on PostgreSQL interrupt processing and operating-system behavior; they are not hard real-time hardware guarantees. A COMMIT transport error or termination signal is never used to infer non-commit without readback.

## Identity, publication and handoff

Session `01a11333-cbc2-7282-b194-27335e632c61`; actual model `gpt-6-astra`, reasoning `xhigh`, re-read from current session metadata. R2 uses the same writer without a replacement agent or new delegated slice. Starting head `7f440f4136f54931f9bc1df6b97d03a7718bfe1a`; observed main `9ea0e068e1d28b18ed15059fa5bf9b63c0689cfe`; merge-base `ecc0ecf3b9c024b295034b6985fa26ca40bc82f1`. Final delivery re-reads current refs, ahead/behind, full remote tree, TASK and exact changed-file scope.

The authorized branch is published through authenticated GitHub git-object/ref APIs with the expected predecessor and no force. A commit cannot contain its own hash; the separately delivered final receipt binds this committed report to its exact final head/tree and freshly verified CI/Auth/Preview. Every later head invalidates these gates.

No hosted Development/Production modification, migration, Auth/RLS/F8/provider/registry activation, new retention/cost/secret/launch decision, Ready or merge. #903/#902 are finished and were not restarted. Remaining P1/P2 review dispositions belong to the independent TL; the author does not declare acceptance.

STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW. Only the TL may decide acceptance, controlled main synchronization, renewed complete gates, Ready and merge.
