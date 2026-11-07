# Official Truth Persisted Canonical Read 1 — TASK V1

Date: 2026-11-07. Tracking: #1150. Parents: #917 / #751.
Technical Lead selection: explicit, one coherent larger functional package.
Implementation author: **Jetnity Official Truth Persisted Canonical Read 1 — Codex Generation 1**.
Planned actual session: `/root/persisted_canonical_read_writer`; dispatch receipt must record actual session.
Branch: `feat/official-truth-persisted-canonical-read-1-20261107`.
Immutable baseline: `main@a5be31e0798cf1d03aae70cdf3b68cddd115ff3a`, tree `bc295cf45b3bfcd6c7dfcc696e613409eea9e6f1`.
This TASK is frozen before implementation. Do not edit it; return concrete scope/contract gaps to TL.

## 1. Outcome and rationale

Complete the missing dormant native-local path from the existing durable original/provenance store and unique current-version lookup through the existing canonical Evidence → historical Review → Rule → Requirements engine. This must be a real write/acknowledged COMMIT/closed producer/fresh reader/projection proof, not another metadata-only report or accepted DTO supplied from producer memory.

The existing M1–M4 store, full closure verifier, current lookup and canonical engine are the foundation. Reuse them. Do not replace stores, add a parallel rules engine, redesign global retention, or claim production authority. This is useful independent work toward persistent/versioned/refreshable entry rules. It is **not a new prerequisite for the first current-request-only CH→DE pilot**.

The only facts in this package are the already-existing **fictional CH→GB** conformance corpus: CH passport, visa / requirement_effect / required / electronic_visa. Positive primary and composed examples must both reach one synthetic visa cell; unrelated unqualified requirements remain unknown. No statement about real GB or CH entry law.

## 2. Authority, prior continuity and preserved blocks

Binding Owner-delegated CODE/local-PG direction:
`docs/OFFICIAL_TRUTH_SOURCE_ORIGINAL_RETENTION_TL_OWNER_DELEGATED_DIRECTION_2026-10-11.md`
blob `db9b62a0d2637e40eefe25ee49c0e7a08be3b420`.
Root #928 R4: https://github.com/Jetnity/jetnity/pull/928#pullrequestreview-5483417695.
Latest accepted release #1149: https://github.com/Jetnity/jetnity/pull/1149#issuecomment-6706790008.
Current continuity: https://github.com/Jetnity/jetnity/issues/751#issuecomment-6706802404 and https://github.com/Jetnity/jetnity/issues/917#issuecomment-6706802675.

Read repository entry/operating standard/current handoff/ACTIVE_WORK_STATUS plus these newer independent receipts. Historical current blocks do not supersede actual Root acceptance.

Development `yfvbxvijcorffwxbxahl`: Stage 1 = **APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING**, actual new ledger ID **UNKNOWN**; Stage 2 = **NOT_ATTEMPTED**. No new platform clearance exists for the original denied readback. No hosted call, replay, reformulation, alternate tool/agent/operator/access route, migration apply, or target authority assertion in this task. Existing Owner authorization retains its original scope.
#1139 effective target baseline/binding and #1142 target installation remain open.
#1131 HTTP-completion hold: no copying/integrating held transport code, no HTTP-reader work.
#985 Protocol-3/current-request review-identity/marker/getter hold: no investigation, repair, or semantic alternate integration.
#937 paused App/Signer/Owner-Mac/Time-Machine/Bern lane and #913 privacy hold remain closed.
Cursor remains quota-paused; no polling/resume/settings/cost changes.

## 3. Frozen foundations and source admission

Use the exact existing synthetic corpus:
`scripts/official-truth-integrated-pilot-1/corpus.ts`
blob `742fd1edbd53a9bad00fe2ae1751244f30dfc7f9`.
Do not change its parser, facts, scope, source identity, profiles or extractors.

Sources: `regulations.example`, JSON, `synthetic-pilot-authority`, `synthetic-pilot-whole-response`.
SourceFingerprint **Protocol 1** only in this package. Local closure profile V2 is not Source Protocol 2 or 3.
Existing SQL admission remains 65,536 bytes, synthetic-local review, ephemeral synthetic key and actual schema retention maximum 30 days. Do not import the separate abstract 180-day design ceiling into SQL.
No actual AA/Bern request, source-rights decision, retention approval, key hosting or real source body.

Freeze all SQL/migrations/ACLs/roles, including:
- `20261011111839_official_truth_original_custody_lifecycle_1.sql`: `36b525580509069039ca6787c25a0a5b94155986`.
- `20261023153726_official_truth_current_version_lookup_1.sql`: `609d10b9727e5fa4f91896d64086798e989ae50b`.

Existing reuse points:
- M1–M4 storage `scripts/db/official-truth-original-custody-1/storage.ts`, baseline `e9798d606309fa121cf4fb21a28cf15e191fd27d`.
- Current lookup `scripts/db/official-truth-current-version-lookup-1/lookup.ts`, baseline `d9a22eba073752a94bdc58616c70100d557b3f61`.
- Integrated storage `scripts/db/official-truth-integrated-pilot-1/storage.ts`, `109e8ac57029a03afa55219c8132e8bf004b2dee`.
- Complete verifier `lib/readiness/official-truth-integrated-pilot-bundle.ts`, `ee4a35d224b7177c6b07efcf4b131433751f70d1`.
- Historical review constructor `lib/readiness/official-truth-autonomous-review-material-server.ts`, `68d2ff362c3aec1bceda430518422c60b60ae785`.
- Existing canonical Evidence/Rule acceptance, extractor/composition seams and `requirementsFuerReise`.

## 4. Exact read and projection contract

### 4.1 Code-owned selection

The new public script-local entry selects only `primary` or `composed`. Derive the exact expected GlobalCellDefinition and pin independently of producer material:
`{ id: 'pilot-' + mode + '-global-cell', version: 1, scope: PILOT_CORPUS.scope }`, using the existing historicalPinFor contract. Construct the exact CurrentVersionRequest from this definition, fixed scope, `requirement_effect` and `visa`.
No caller-selected fingerprint, arbitrary definition/digest, accepted DTO, rule, review, source body, source registry, extractor or clock is a truth input. If an internal seam accepts CurrentVersionRequest, require all four fields to equal the code-owned contract.
Never accept an arbitrary DB definition of the same ID as current.

The original full-current-set lookup is normative: no LIMIT/latest/first-match shortcut, no ignoring a damaged rival, no positive cache. Missing vs operational failure must remain distinguishable and both fail closed for projection.
Existing `readCandidate` and `lookupCurrentVersion` metadata/result contracts stay unchanged, including `productionAcceptedRead: 'NOT_AUTHORIZED'`, `positiveVisaCells: 0`, and `reusablePositiveCache: false`.

### 4.2 Read complete persisted material under lifecycle protection

Use a fresh reader connection after the producer's acknowledged COMMIT and closed connection. The reader must not receive producer Evidence/Claim/Review/body objects. Expected code-owned constants and the external monotonic lifecycle witness/key are authority inputs, not evidence substitutes.

Retain existing READ COMMITTED lifecycle guard with SHARE lock and the separate REPEATABLE READ READ ONLY archive/23-column readback contract. Full provenance closure, ordered originals, digests, content identity, timestamps, observation/validity artifacts, review/rule binding and all pins must be verified.
A narrow private material handoff/refactor may let the projection consume verified material inside this protected operation. No generic raw-byte export, public material callback, retained accepted capability, caller-extensible projection callback, or ordinary reader result containing originals/keys.

Lifecycle/cursor/source/profile status and freshness/validity must be checked before projection and again after relevant awaited operations and immediately before successful completion. Refuse stale/foreign witness, withdrawn/superseded/conflicted/disposed/expired data, ambiguity and changed current selection. Keep the guard held through projection/recheck; release on every exit. Output describes the checked read instant, not an ongoing authorization lease.

### 4.3 One existing canonical engine

Reconstruct Evidence from the actual freshly read original bytes and verified historical observation/validity artifacts with `evidenceKandidatAusModell` / `evidenceKandidatAkzeptieren`. Do not trust an Accepted DTO or a receipt fact as the evidence.

Use `constructHistoricalAutonomousReview` over complete persisted artifacts and newly accepted versions. Require the actually stored proposal to be null; never silently replace a non-null proposal. Reconstructed safePreimage, ordered supports and reviewPacketKey must exactly match the stored reviewed material.

Re-extract the fact from those exact stored bytes using the fixed unchanged existing synthetic corpus extractor and existing primary/composition execution seams. Compare fact, citations/assignments, support IDs and extractor/policy pins to the verified receipt. A fully rehashed stored fact contradicting originals must still be rejected.
Historical replay is not a new fetch. Do not manufacture current-request HTTP/same-request authority or a fresh retrieval timestamp; preserve original source retrieval time separately from read/recheck time.

Use `officialTruthRegelKandidatAusEvidence`, `regelKandidatAkzeptieren`, then a tightly scoped synthetic provider for unchanged `requirementsFuerReise`. This provider cannot escape the local operation or be wired into the app.
Compare exact current code-owned synthetic registry/profile/extractor/policy descriptors to persisted material; do not infer current code authority solely from self-consistent hashes or historical current:true. Historical implementation bundles are fully retained and verified, but are never dynamically executed by the reader. The reader executes the fixed current approved synthetic extractor functions.

### 4.4 Closed, explicit output

Return a bounded immutable script-local synthetic Requirements result plus sanitized proof metadata: selected version/fingerprint, source attribution, original retrieval time, historical review identity, current read/recheck time, lifecycle witness, and explicit synthetic-local status.
Do not return full closure, source bytes, keys, accepted Evidence/Rule capability, body-bearing error, or global reusable cache.
Use an unambiguous real-world counter such as `positiveRealVisaCells: 0`; do not call a fictional positive cell a real approved visa result.
Production accepted read remains NOT_AUTHORIZED. Failure returns no positive requirements.

## 5. Fresh exact-code fixture — narrow additional allowance

The old current-version test rewrites dates and swaps implementation_bundle with a one-file synthetic conformance stub. It is valid existing storage testing but **not** sufficient for the new central executed-code proof.

Primary and composed positive proofs must preserve the real captured Controlled Runtime implementation bundles and use genuinely executed fresh synthetic observations.
TL permits a narrowly scoped additional finite fresh-clock entry/option in:
- `scripts/official-truth-integrated-pilot-1/controlled-runtime.ts`
- `scripts/official-truth-integrated-pilot-1/engine.ts`.

The clock is code-owned and derived inside the controlled execution, with a fixed sensible relation between synthetic origin/reference/completion and current wall time. No arbitrary caller timestamp, source/registry/DTO/handle authority injection. Fresh mode is admitted only with fault === 'none'; explicitly refuse other combinations. Original, optional extra observation, proof reference, completion and receipt derive consistently from one internal base, and must all be at or before actual current wall time (do not make reference/completion future now+60s). Existing static/default behavior and fault cases remain unchanged. Strict argument-count/mode validation, one-shot handles, captured bootstrap, worker bounds and closed errors remain intact; the finite clock selector is the only additional Worker input. No freely callable uncontrolled authority path or caller snapshot. Exact loaded worker/emitted bytes and parameters remain bound by the existing captured implementation mechanism.
Do not rewrite timestamps/identities/reviews after production and then label them actually executed. Do not replace or truncate implementation bundles for the central positive proof.
No change to HTTP/same-request/extraction authority implementations is authorized by this clock allowance. If this cannot be achieved within the existing mechanism, return the precise gap to TL before widening it.

## 6. Allowed files and invariants

Allowed:
- New focused implementation/proof helpers under `scripts/db/official-truth-persisted-canonical-read-1/`.
- New focused unit/native tests under `lib/readiness/official-truth-persisted-canonical-read-1*.test.ts`.
- Narrow internal refactor of the two existing M1–M4 storage/lookup modules above, preserving old public behavior.
- The two synthetic runtime files, only for the explicit fresh-clock allowance.
- Exact new importer/export/dead-code allowlist entries in existing hygiene scripts where the new approved script/test edges require them. No wildcards, skip, guard weakening, or unrelated pin updates.
- This frozen TASK and matching `docs/OFFICIAL_TRUTH_PERSISTED_CANONICAL_READ_1_HANDOFF_2026-11-07.md`; concise relevant architecture/status documentation if needed.

Frozen:
App/routes/Workspace/provider/engine; canonical acceptance/schema/identity/fingerprint/HTTP/marker/getter modules; Source/Identity/Extractor production registries; AA/Bern mappings; all SQL/ACL/Auth/grant/Owner candidates; package/lock/dependencies; CI workflow and existing timeouts/skips; env/settings; held branches.
Only add genuinely required exact hygiene entries for approved imports. Report any existing static pin of an allowed changed file before updating it; TL decides the precise change, not a blanket repin.

No network access by the new reader. Synthetic producer continues existing simulated I/O only. No actual source body or sensitive data in GitHub/logs/report.
No new dependency, service, purchase or cost. Existing $100 cap unchanged.

## 7. Meaningful acceptance proof

Use actual native PostgreSQL 16 and the existing local schema setup. No hosted environment, secret-dependent skip or mocked SQL success.
One bounded shared native suite should reuse setup and avoid duplicating the entire existing schema test matrix. Retain phase diagnostics; no raw material. Existing full tests still run.

Required positive bridge proof:
1. Primary and composed genuine Controlled Runtime output, actual stored full originals/closure/review/binding, acknowledged COMMIT, close producer, fresh reader with distinct backend.
2. Exactly one fictional visa Requirements cell from fresh DB bytes through all canonical acceptance steps; other unsupported requirements unknown.
3. Preserved attribution and distinct historical retrieval/current read timestamps and exact review/version/witness.
4. Existing alternate receipt: ambiguity rejects, lifecycle supersession makes one unique version selectable. An unchanged fact across alternate receipt proves version selection only.

Required focused negative families (reuse existing helpers; do not invent a second schema suite):
- Wrong mode/context/scope/document/definition or unsupported requirement cannot yield a positive result.
- Missing/wrong original digest/ordering/version and missing/mismatched review/rule binding fail.
- Semantically forged but self-consistently rehashed fact inconsistent with original bytes fails re-extraction.
- Ambiguous/invalid competing record fails instead of ignoring it.
- Lifecycle withdrawal/source/profile withdrawal/conflict/supersession/expiry/disposal and stale/foreign witness cannot yield positive output.
- Expiry/cancellation/failure during await or lock wait and final recheck cannot leak a successful cached projection; connections/locks cleaned up.
- Unacknowledged COMMIT or rollback is never a successful persisted-path proof.
- Unauthorized existing local roles remain denied; no new privileges.
- No reader HTTP/network, no app import edge, no originals/keys in output/errors.

Use existing tests for unchanged lifecycle/schema coverage when sufficient, plus bridge-specific paths proving these conditions cannot be bypassed by projection. The HANDOFF must map each criterion to concrete tests and identify reused tests honestly.

Local environment currently has no PostgreSQL binary and no complete Next runtime. Report that honestly; root will obtain actual native/full verification from CI. Do not invent a local native PASS. A new bounded test timeout may be justified by the actual full-capsule native work; do not raise existing timeout/workflow budgets or introduce retries/skips.

## 8. Author return, review and merge discipline

Implement in a new isolated workspace from exact baseline. Prepare a complete changed-file manifest for TL publishing if no authenticated Git remote is available. Do not mutate shared old author workspaces or unrelated files.

Return same-session HANDOFF with:
- exact file list, behavior/contract decisions and fresh-clock details;
- tests actually run, exact outputs, outstanding environment limitations;
- immutable TASK, baseline, known issue/PR/head;
- acceptance matrix and P0/P1/P2/P3 risks;
- explicit production/hosted/source/Owner gates still closed;
- status **returned / STOP**, no next slice.

Only Root TL may independently PASS, mark Ready or merge. Self-review is not TL PASS. On CHANGES REQUIRED, fix only in this same session; every new head requires complete re-gating.
Required TL gates: independent full diff/import/authority review; exact-head typecheck/lint/full suite with real PG16, five hygiene checks, build and fresh Auth; exact preview + open thread/ruleset/base checks. After merge, verify actual-main push CI and exact Production/jetnity.com deployment before closing #1150.
Persist concrete progress/handoff in #751/#917/#1150 and PR. Do not say full feature or live pilot complete.
