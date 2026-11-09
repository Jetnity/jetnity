# C1 — versioned global application conditions, TASK V1

9 November 2026. Root / Technical Lead deliberately selects this bounded implementation from the existing authorized PROGRAM V1 and D1 prerequisite M02. The Owner already requested continued code/tests/Draft PRs for the database and entry-requirements product. No new general authorization is requested. This task closes the expression/identity/transport gap; it does not claim current global source qualification or complete method readiness.

## Inputs, writer and start gate

- Live main ce3366e26de73961d4682236af92347bfc3a4ca8, NORMAL; fresh #751 and new #748 material read at task preparation found no changed operating gate.
- Base IN1 #1171 exact head 0b704d0fa5d90031ca3ee80aabf2d8578d4cd2d5, tree f03b04bd43c4a0fe6cedd742e309957222efdf44. Root source review 6740039565 accepted the same-session R1 correction and independently ran459 offline checks. CI42616948893 is still running at task creation; Preview dpl_FTXYE73chxVzYk7bG5yFrmBPTCkY is READY on this exact head. No IN1 native PASS is assumed.
- S1 bb5ce4d69f9e479867581ecf0262e549bfc20e6c has Root native/code PASS6739931009; N1 input10d3e4f44460513e6425714af2c8c0b3ab4678a6 is genuinely merged into IN1.
- D1 documents are read-only external input at300946991376b8969b383a087d47b49a7636f722, especially D1_METHOD_PACKAGE_V1.md and D1_METHOD_MANIFEST_V1.json. Do not silently merge D1 or rewrite its historical manifest.
- Branch feat/official-truth-v3-global-conditions-1-20261109; worktree /workspace/scratch/01cbe1264212/jetnity-v3-global-conditions.
- One writer: **Jetnity Official Truth V3 Global Conditions 1 — Codex Generation 1**, actual session **/root/v3_global_conditions_writer**. This is an explicitly selected new bounded contract revision task, not an invented resumption of a previous Cursor session.

First read the startup/operating documents, this task, D1 input and actual legacy readers, pilot mapping, retention and UI seams. Produce C1_PLAN_V1.md with exact paths, compatibility and tests. **No implementation until Root accepts the plan and explicitly confirms the IN1 base gate.** If IN1 needs a new head, Root alone repins/rebases and all downstream gates restart.

## Frozen contract decision

Retain the existing untagged global context exactly: scope, route, conditions. It remains implicit context revision1; do not stamp a new revision field into it and do not change its hash input.

Add a second strict closed form inside the existing outer V3 envelope:
- contextRevision:2, existing scope/route/conditions, plus mandatory application;
- application has exactly purpose:'tourism' and tripStartAndEndWindow;
- tripStartAndEndWindow has exactly from and through, valid civil dates with from<=through;
- semantics: from <= trip start <= trip end <= through, inclusive. These are global application restrictions, not collected personal trip dates, legalValidity, today's date or a derived maximum stay.
- No optional endpoint, coercion, unknown field/revision/purpose, legacy/new mixed fallback, or stripping application to recover a legacy record. Generic revision2 can represent valid finite windows; the specific mapper below is pinned to the reviewed pilot window.

The existing Schema1/Schema2 canonical readers, REISEZWECKE, rule claims, temporal meaning, content identities and all legacy fingerprints remain byte-identical. tourism must not be silently translated to visitor. Existing RegulierungsAusdruckV2 supplies ordinary document class and CH journey origin; no new canonical predicate is needed.

For legacy contextIdentity retain the exact previous canonical input {scope,route,conditions}. Revision2 hashes {contextRevision:2,scope,route,conditions,application}, including every restriction and normalized expression. Keep the official-truth-context:v3 prefix. Full contextKey and V3 jobKey must change with either window bound; the existing base ruleScopeKey/research identity semantics are unchanged. Never use a base scope key as proof that restricted contexts are identical.

## Dormant concrete mapping

Implement a small server-only pure mapping of the existing code-owned AA pilot metadata to a new global context candidate. It must positively produce:
- destination DE, one CH citizenship, linked CH passport, residence not_applicable;
- ordinary document class, journey origin CH, direct_entry and no transit;
- explicit tourism; trip start AND end in **2026-11-07 through2026-11-13**;
- global scope validity remains not_applicable.

Bind the mapping revision/digest to the exact existing candidate/application metadata and the new complete context identity. No caller-chosen country, purpose, date, accepted status, source qualification or receipt. Preserve exact reviewed pins; no automatic window extension. It returns a context candidate only, no fact acceptance, Evidence/Qualification receipt, method approval or runtime registry entry. Existing travel_date-scoped AA receipts cannot be converted to global evidence. No invented stay-limit fact; no copying the application window into legalValidity. AA current:false, empty production extractor/application catalogs and disabled applicationPilotEnabled remain unchanged.

## Required composition and presentation

Every existing nested V3 reader must keep the full new context through proposal, research job, source observation/decision, version, projection, audit/outcome and replay. Positive shape alone is never authority.

Extend the closed S1 TypeScript retention descriptor and its generated SQL descriptor for the exact new subtree; bump the descriptor revision. Preserve all legacy branches. Only regenerate the marked S1_RETENTION_SHAPE block of the UNAPPLIED candidate SQL; no table/role/grant/RLS/RPC-signature/transaction/driver change. The canonical V3 reader validates ordering and semantic/key binding. SQL retention is closed data-shape validation, not a new claim of full semantic/source qualification. Preserve that distinction and test it honestly.

Display all application restrictions in the existing conditional visitor result: Tourismus and explicitly Reisebeginn und Reiseende, both bounds inclusive. Preserve pass, route and origin text. No assertion that a visitor satisfies these conditions and no extra visitor fields. If revision2 has no additional expression conditions, do not render a blanket 'keine weiteren Bedingungen' that hides application restrictions.

Add an isolated clearly synthetic UI case for revision2, through the actual existing query/reproof/presentation/component path. Keep existing cases. Normal UI CI must exercise and screenshot narrow320px and200% text, checking complete restriction text/no horizontal overflow. No public route or navigation.

## Ownership

Allowed shared implementation changes:
- lib/readiness/official-truth-product-v3/contract.ts and contract.test.ts;
- new lib/readiness/official-truth-product-v3/global-conditions/ files;
- visitor/presentation.ts, presentation.test.ts, and test-fixtures.ts only for exact context/display/synthetic fixture support;
- storage/retention-shape.ts and retention-shape.test.ts; only its contract.ts source-hash pin changes after reviewed carrier edits, all other source pins remain exact;
- scripts/db/official-truth-v3-intake-store-1/intake-candidate.sql, generated marked descriptor block ONLY;
- new scripts/db/official-truth-v3-global-conditions-1/ test proof and mandatory lib/readiness/official-truth-product-v3/integration/global-conditions-native.test.ts wrapper;
- scripts/official-truth-product-v3-ui/synthetic-server.ts, mount.tsx, run.mjs and ci-contract.test.mjs for the added synthetic case, retaining existing checks;
- docs/official-truth-product-v3/C1_*.

No changes to other writers' implementation, native adapter/cluster/driver, legacy canonical modules, frozen storage/intake-contract.ts, migrations, central CI/dependencies, code authority or operating-mode files. If an actual necessary change falls outside this finite list, report the concrete finding to Root before editing. In particular, quarantine-codec/postgres and visitor/query are expected to compose unchanged; prove it through tests.

## Acceptance evidence

1. Freeze actual pre-change golden identities for several existing contexts/jobs/scopes and keep them exact. Explicitly test rejected new fields in legacy form, unknown versions, missing/null/additional fields, bad/reversed civil dates, wrong purpose and descriptor/getter safety inherited from the canonical reader.
2. Positive exact dormant pilot-context mapping; neither tourism=visitor nor legal validity/window/duration conflation. Pin unchanged old source/extractor/application code.
3. Change either date bound and prove different context/job keys; reject old keys attached to changed or stripped restrictions. Show same base scope is not same full context.
4. Through actual S0/I1/visitor canonical readers demonstrate positive explicitly synthetic revision2 data preservation, cross-context refusal and unchanged legalValidity. No fabricated real AA source proof.
5. Mandatory native CI: real temp file→N1→S1 SQL custody→fresh reopened original→actual I1 under unapproved synthetic method, full context bytes/references and full honest outcome/audit retained, no Accepted/cache writes. Reuse existing owned test transport. Direct SQL shape cases retain the exact new closed form and reject new nested unknown/private/null/wrong-type/enum fields; duplicate keys are refused before any original retention. Keep existing S1/IN1 suites mandatory.
6. Actual synthetic UI proof as above, plus display unit tests, unchanged visitor input envelope, existing privacy/authority/queue/history guards.
7. Whole typecheck, scoped lint, relevant offline suites and existing five hygiene checks; mandatory full exact-head CI, native logs, build and Preview reviewed by Root. Do not add skips or increase operational/test transport budgets to hide a failure.

Local PostgreSQL creation is blocked and must not be retried via another socket/TCP/operator. Existing unchanged mandatory GitHub CI is the allowed native environment. Do not claim a local native run. Existing UI proof may run only through an allowed environment; report a concrete failure rather than switching around a refusal.

Deliver actual commands/log hashes, source and protected-file manifests, compatibility/rollback note, self-review and C1_HANDOFF_V1.md. Legacy readers after rollback must fail closed on revision2; never down-convert stored revision2 to legacy. Existing SQL is UNAPPLIED, so no hosted data migration is performed.

## Reserved gates and stop

Method NOT_APPROVED; Dev package NOT_RELEASE_READY. M02 expression/transport evidence is only part of the wider mapping/qualification prerequisite. Actual current global source qualification, revocable method authority, durable service/Accepted/cache wiring, measured operations and target-bound activation remain separate.

No hosted DB/Auth/RLS/ACL/migration/credential reads/writes, real source/provider/researcher calls, scheduler/notification activation, cost, environment or secret change. The specifically refused #917 readback is not retried, rephrased, delegated, rerouted or handed to a human replacement. #1139/17 pre-Owner gaps, #1131 Ready-STOP, #1135, #968, #911/#913 and all Owner gates remain.

Work only in this assigned worktree. No commit/ref/remote mutation unless Root expressly instructs. No Ready, merge or automatic next slice. STOP for independent Root review; immediate CHANGES REQUIRED fixes return to this same session. Any head change invalidates prior exact-head gates.

