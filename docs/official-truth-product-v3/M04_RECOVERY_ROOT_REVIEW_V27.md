# M04 R36 / V27 — Root source review and failure28 continuity

**Captured 2026-11-11T01:16:00Z.** This record supports source selection and later immutable candidate review. **R36 runtime acceptance is pending; no TL-PASS, Ready or merge is asserted.** Baseline actual main is fbcb72e7c65a5e7c7e4f2e20105ab6f4b2201a54, tree2d5413d86c3200ce05863d1f09062a3a5a142c32. Binding task: [V27 v2](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6784040002).

## Root decision and exact scope

Select the same author's independently reviewed revision4 positive canonical object-tree path, limited to two literal spans in jobs-candidate.sql. New SQL161125 bytes / SHA25692ca2bf0c45c9e3702b2de63bf984d6a1f30b6fe4c9c3ee83de35ae470ab2d16 / Gitblob9d15e032dea6dd9a5ab6cbb8537220f6fa23529e.18-source aggregate01977b08156ecf0d77a068a29d3874b7944d0e272f71345e0ac3c3e42e42af7a.

Root independently reconstructed the author's exact literals and reversed both changes to the full158670-byte baseline. All29 complete declaration/LANGUAGE/attribute headers match; every byte before and after canonical_v1 matches. Every original fallback byte remains. The other17 protected sources remain exact. This is a source-text proof, without a project parser, SQL or runtime execution.

- Existing root guard still rejects SQL NULL, invalid/null depth before new probe.
- Admission only object raw text <=8192 and another literal brace after root opener; false positives harmless, no nested-object false negatives.
- Root type object already proved; each child carries one fixed jsonb_typeof(j.value) tag with same default text collation, including JSON null distinct from SQL NULL.
- Only object nodes below24 expand; explicit WHERE and safe CASE retain valid scalar/depth guards.
- ASCII-key and ASCII-string checks, integer/safe-range number conversion and scalar renders identical to original expressions.
- Typed text[] C ordering, NULL closing sentinel, unique paths and lag punctuation give parent open, children, close in canonical C key order; empty keys/objects and sibling transitions handled.
- Allpieces must be nonNULL via bool_and IS TRUE; unsupported arrays, invalid key/value/depth return to exact full original fallback; new fast_text cleared.
- All original validation, authority, snapshots, errors, transactions, quota, history and cleanup remain unchanged.

## Independent review and authorship

Author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, same actual session **/root/m04_durable_jobs_writer_g3**, independently fetched all18 baseline source files and delivered exact revision4. Source reviewer **/root/m04_recovery_source_review_g3** independently reconstructed those same literals, inverse, declarations, other28functions, fallback and digest; no concrete source blocker. Cost/CI/live reviewer **/root/m04_recovery_live_audit_g3** independently derived the complete two-quota model and conservative input bound. Root separately recomputed every trace/root/node/member/path-slot sum and the field-length totals. Bound-contract readback and subsequent immutable-candidate readback are separate receipts, retained in docs/official-truth-product-v3/M04_RECOVERY_R36_EVIDENCE_V27.json and later existing PR comments.

No author self-review is treated as Root acceptance. All three remain source-only dispositions until the full new-head and actual-main runtime gates.

## Actual-main failure28; preceding R35 PR success preserved

R35 PR CI42927749592/#4096 genuinely passed all8jobs and all31 M04 groups in197851ms on exact9981a4a. Root full gate/Ready/expected-head merge produced actualmainfbcb at00:26:42Z, with the exact same2d5413d tree. That historic PASS remains true.

Actualmain CI42931400600/#4097/attempt1 then failed. Root personally read each completed job's metadata before the seven allowed logs and explicitly authorized independent reviewers; all permitted logs were read in full. Auth was metadata-only.

Native proof:24/31groups; first23=100660ms; full254/255/256 ledger65545ms PASS. Cycle_fail zero-based50 started/49completed,51 START reservations/152ACK,153/152commandcalls,205/204fixedcalls; next unacknowledged FAIL outcome UNKNOWN.240287ms including24ms cleanup. Full64/65 and expected pointer refusal, inherited761/minOwned4182 and all last6groups are NOT_REACHED. All27296operations/4242connections/1cluster closed; no pending work, live children or cleanup failures. Both realR9 wait/abort/drain/backend-departure/zero-terminal-effect witnesses remain valid. Full native3816bytes SHA256028d2e8dc6e655efd1f193714563bfcb8c5a1f80a6fc04c181909745acd62999.

Repository's two TAP failures are the timeout child and parent M04. Core8697tests/8693PASS/2FAIL/2inheritedSkips; Typecheck/Lint successful; five later hygiene checks and Build skipped. Final aggregate correctly propagated Core failure. All6companions completedSUCCESS:
- UI50/50, six actual HTTP requests,12layouts/11interactions/10screenshots; exact push/main/source binding. Artifact13816432689/15files/3739904bytes/digestbd2d3078407d32fd3d3ae6a156cca561fc82330e4614be39f5073009a25745a6, metadata-only artifact verification. Synthetic latency numbers are not a production SLO.
- Persisted1/1,95events,45readerresults; every phase/status/query/cancel/deadline/backendcleanup/rollback object retained.
- Store4/4,39events; all12Trip negatives,7integrity,6semantic-binding,4mismatch witnesses, fresh committed reader/lost ACK/support/restore retained.
- Lifecycle4/4,29events; actual mount bundle76f5a82c5beb4f8b607c9ff1b074b830f1b4fc188a389d2922cc33fbb6b33cb9,113modules85repository,13proofs61/61observers and0pending/errors.
- Atomic1/1,151ordinary JSON events,30rollbackpairs,10coordinatoroutcomes,49closedbackendrows;11012/11012operations248/248connections11clusters0pending. Its additional TAP-escaped R9 invalid-bigint/missing-target proof is retained separately in raw form, expected22P02 and both implementations checked. It is not an additional test failure.
- Auth metadataSUCCESS only; no Auth logs.

Actualmain log-byte hashes and complete native/companion event objects are preserved in docs/official-truth-product-v3/M04_RECOVERY_R36_EVIDENCE_V27.json. Varying timers and owned-operation counts are retained as observed; no CPU, runner or performance-causality conclusion is invented.

Productiondpl_HV5HcshbAcnBem14oPJpDGANb1pX is READY/exactfbcb in projectprj_wTTVawPItEO7a4HihEmaU3PsuaXM, bothaliases independently bound/no redirect. Deployment success does not convert failed actualmain CI into acceptance. SQL remains unapplied.

## Cost and resource assessment

Complete frozen quota roots548593, comprising493889objects and54704scalarroots. Retain133836flatobjectqueries. Replace1549094 nested-object aggregate SELECTs by360053whole-treequeries; total objectqueries493889 versus1682930. Source-level aggregate invocations1121614 versus5048790. Original8135205frame-array loop sites bypassed; existing declaration initializations remain.

Admitted-tree counts1750237objects/10484394members/10844447walkrows/12594684tokens. Member+closing path slots21670783+4128281=25799064 across12234631array_append sites. Those are MORE array-operation sites than the old loop, with different payload widths/types from43218116old mixed stack slots. No physical allocation, byte or timing equivalence is claimed. Raw walk loses same-parent memo, adding201143objects/1542089members/1407993scalarchecks versus memo-aware R35.

Recursive walk and explicitly materialized encoded_nodes each hold10844447logical rows over complete traces. LAG and orderedstring_agg each consume12594684tokens across360053queries; two ordering source sites, no asserted physical-sort reuse. The revision4 tag avoids23799184 repeated type expressions versus unselectedv3, while carrying a≤7-character tag perwalkrow, up to75911129cumulative logicalcharacters. Query startup, tuples, raw serialization, bounded substring/brace search, sorting and existing validation remain costs. Function growth2455bytes adds1276600catalog-hash inputbytes across520quotaAPIcalls, not whole-suite total.

Conservative native input maximum3519bytes fits8192. Largest native shape16objects85members86rows102tokens405pathslots, maximum path6. Generic admitted rawR>=5N−3 boundsN<=1639/tokens<=3278/path24or25closing. Full rawv::text is allocated before the cap. Bound excludes tuplestore/header/copy/sort memory; peakRSS/resource-error context/timing equivalence unproved. Invalid or array-containing admitted objects pay the new failed probe plus complete original fallback. The history algorithm remains quadratic.

## Coverage and primary source limits

- No project/SQL/parser/native execution during source review.
- Full raw v::text allocation precedes8192 cap; arbitrary resource-error timing, exception context and peakRSS not equivalent/proved.
- R26 nested non-array positives exercise selected mechanism; several old decimal/escaping cases are flat or arrays and exercise fallback, not dedicated positive-probe coverage.
- Frozen suite has no new8192-edge/exhaustiveNULL-path/alternatecollation probe oracle; no new test authorized.
- Source-shaped model covers complete two quotas, not all other29groups; full native PR/main gates required.
- Quadratic history traversal remains; counts do not establish wall time or guaranteed240s margin.

Primary PostgreSQL commitc372fbbd8e911f2412b80a8c39d7079366565d67 was personally fetched and read by Root:
- [src/backend/optimizer/plan/initsplan.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/backend/optimizer/plan/initsplan.c), blob b31d8921211e0e93a00bd755abc869f03f66a5f0.
- [src/backend/optimizer/plan/createplan.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/backend/optimizer/plan/createplan.c), blob 4bb38160b338a61c18d91edc749a68cebc5f8a38.
- [src/backend/executor/nodeWorktablescan.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/backend/executor/nodeWorktablescan.c), blob 0c13448236a80c093fca64dada666988f46c3e59.
- [src/backend/executor/execScan.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/backend/executor/execScan.c), blob a47c8f5f712872f414e2b6c60cada9c4f46b7b86.
- [src/backend/executor/nodeNestloop.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/backend/executor/nodeNestloop.c), blob b3d52e69ecb70b320761098bdd58fbb0d802d3b9.
- [src/pl/plpgsql/src/pl_funcs.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/pl/plpgsql/src/pl_funcs.c), blob f010515fdf6b1b75dde2f195d25f67919931e6f7.
- [src/pl/plpgsql/src/pl_comp.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/pl/plpgsql/src/pl_comp.c), blob a341cde2c142052fbbae9bf2db48ddbc899a75c0.
- [src/backend/utils/adt/jsonb.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/backend/utils/adt/jsonb.c), blob cf43c3f2ded19aabd2a913ab914f84d6c70d3afc.
- [src/backend/utils/adt/arrayfuncs.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/backend/utils/adt/arrayfuncs.c), blob 9000f83a8366d5c8943e71e10bad540fefdcfcef.

These source reads substantiate NULL/C-array order, literal JSONB brace admission, WorkTableScan qual before parameterized expansion, and PL scalar-versus-SQL-alias resolution. They are not an observed runtime plan or SQL execution.

## Evidence custody and publication

Previous27failure observations and genuineR21/R29 proofs remain intact in [V26 evidence](https://github.com/Jetnity/jetnity/blob/fbcb72e7c65a5e7c7e4f2e20105ab6f4b2201a54/docs/official-truth-product-v3/M04_RECOVERY_R35_EVIDENCE_V26.json),892608bytes/SHA25697eb8349018d8279a823c28e4cadd102a5290d6f956e3fc74077311ffa821fb1/blobd3c97f89fc5ba900a10e87670a0356d4c47a4bfe. The new V27 record stores full R35 PR acceptance, actualmain failure28 and companion/terminal/log receipts. Historical snapshot properties such as actualMainAcceptancePending describe their original decision time; the current top-level state is unequivocally FAILED/PENDING_R36.

Only10paths: SQL+6existingcurrent/handoff+3newrecords. Five central blocks identical and outside-marker bytes preserved. Every byte of previous45494-byte M04 handoff retained. Task includes full amendedv1 and fullv2 once. All previous records/9415otherleaf entries, including36parallel#1181leaves, remain unchanged;3new leaves/0deletions. Immutable candidate tree/commit/file readback occurs before new branch publication; receipts are external to this dated source snapshot to avoid self-attestation commits.

## Gates, risks and stop condition

All existing eight CI jobs and31native groups/full quotas/twoR9/inherited761/minOwned4182/rollback/latewriter/drain/allcompanions/Core/hygiene/Build, exactPreview, fresh strictRules/NORMAL/Owner/threads/main/mergebase/ahead/behind/full diff must pass at the exact new head. Root alone TL-PASS/Ready/expectedheadmerge. Changedhead invalidates oldgates. Actual merge-main separately needs the same fullnative/CI and exactProduction/bothaliases. No unchanged-head rerun.

The finite8path documentation completion remains HELD until genuine corrected actualmainPASS; it then requires its own Draft/fullPR+main/Productiongates and final existingPR/#751receipts, thenSTOP. No automatic product follow-on.

P0:no concrete new issue in this bounded source review. P1:actualmainM04acceptance failed. P2:quadratic runtime, unmeasured new materialization/sorting/memory and explicitcoveragegaps. P3:twoinheritedskips and closurepending.

All V27 task execution boundaries and reserved Product-Owner gates apply: SQL_UNAPPLIED, METHOD_NOT_APPROVED, #1139 NOT_RELEASE_READY/17preOwnerGaps, #917 UNKNOWN/Stage2NOT_ATTEMPTED/noindividualaccess or reroute, #1131ReadySTOP, both#1135holds, #968isolation, #911/#913privacy, D1#1169unfinished. No hosted change, activation, recurring cost or local/replacement execution.
