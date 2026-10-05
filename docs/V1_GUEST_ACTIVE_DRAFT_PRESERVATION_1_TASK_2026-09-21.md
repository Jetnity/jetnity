# V1 Guest Active Draft Preservation 1 — Binding Task
Agent: **Jetnity V1 guest active draft preservation 1**, Generation1
Tracking: #530
Branch: `fix/v1-guest-active-draft-preservation-1`

## Goal and actual residual
Implement the explicitly deferred loader/create residual from completed #517, not a repeat of TA-R1 adoption work.
On e818c13, independent TL synthetic probe: active v3 raw `{bad-json` plus valid legacy draft => `aktiveGastreiseVorpruefen().art=ungueltig`, then `gastspeicherLaden()` returns legacy as active, overwrites original active bytes and performs3 writes/deletes. `gastreiseAnlegen` and `gastreiseAblegen` also consider invalid active null, permitting replacement. Existing test 'nach Korrektur liest die Vorprüfung frisch' actually creates over invalid raw without a user correction: adjust the fixture to explicitly simulate correction, not enshrine this defect.

## Binding protection and create contract
Reuse the existing read-only active-key preflight; keep localStorage ownership in gastspeicher.ts. No new storage key, backup, repair/reset/delete/export product or guessed recovery data.
- A present malformed/schema-invalid/empty/primitive active value is **occupied but unusable**, never free capacity. All raw active/legacy/queue keys stay byte-identical through ordinary reads and rejected create attempts.
- A throwing localStorage getter/getItem is unavailable, not empty or corrupt. No writes/deletes/network. SSR/not-yet-observed must not authorize client create actions before browser observation.
- `gastspeicherLaden` must not run legacy migration/normalization that overwrites an invalid or unreadable active key, even if valid legacy/queue exists. Preserve existing loader shape if feasible; do not introduce an unhandled exception into every read-only consumer. A bounded guest-create-specific state is allowed; generic UI rewrites are not.
- Both `gastreiseAnlegen` and `gastreiseAblegen` recheck before writes and reject invalid/unreadable active storage with a meaningful error handled by current callers. Same valid-id idempotent proposal retry remains. Existing valid active blocks another draft; confirmed absence still permits creation/legacy migration under current rules.
- /planen shows distinct invalid-draft vs storage-unavailable feedback and offers a non-destructive recheck/reload. No claim 'lost', 'safe/recoverable' or 'no draft'; no fake 'continue' destination for unreadable IDs. Do not offer a destructive fix. Valid guest gate and signed-in multi-trip path stay intact.
- Protect every existing create preflight in TripPlanner/Reiseidee: before place/model/network and again before proposal adoption/persistence. Re-observe active bytes at time of action, not merely initial mount. A draft changed in another tab to invalid/unreadable must block. Do not swallow a read exception and continue a paid call. Preserve existing validation/prefill/manual focus and #528 reflow classes.
- Signed-in create must not be blocked by or needlessly inspect unrelated guest-localStorage. No Auth change.
- Existing #517 adoption preflight, retry/client_ref/abort-on-first-error and delete-only-after-confirmed-account-adoption remain unchanged.
Only ordinary loader and create paths are authorized. Explicit user deletion semantics and guest editing operations are not a new cleanup project. Broader malformed legacy/queue handling is out of scope; report residual separately.

## Exclusive ownership
Runtime:
- `lib/trips/gastspeicher.ts`: preflight reuse, loader/migration guard, two create persistence guards and minimal own error/helper. No domain/revision/commercial/adoption rewrite.
- `lib/trips/create-entry.ts`: minimal guest-create state/preflight contract if needed; preserve existing caller compatibility and account path.
- `components/trips/PlanenCreateGate.tsx`: pending/invalid/unavailable gate with non-destructive retry.
- `components/trips/TripPlanner.tsx`, `components/trips/Reiseidee.tsx`: existing guest preflight and error handling ONLY; no layout/class change, validation/model/provider logic change or redesign.
Tests: gastspeicher/create-entry tests plus own `lib/trips/guest-active-draft-preservation.test.ts` if meaningful.
Own `docs/V1_GUEST_ACTIVE_DRAFT_PRESERVATION_1_{TASK,STATUS,HANDOFF,SELF_REVIEW,DECISION}_2026-09-21.md`, `docs/evidence/v1-guest-active-draft-preservation-1/**`, optional own audit script.
Read-only: types/trips, all schema/mappers/readiness/credentials/registry/SQL/Auth; account daten/foundation-e-select and A files; uebernahme/GastreiseBruecke; other UI/global styles. If a necessary caller lies outside this ownership, stop with concrete smallest expansion request.

## Acceptance / tests
1. Invalid active alone and plus valid legacy/queue: loader and both create APIs cannot write/delete/replace bytes; no normalization 'fix'.
2. Include malformedJSON, schema-invalid object, empty string, primitive and JSONnull; getter/getItem exceptions separately. No raw data logging.
3. Missing active with valid legacy keeps current migration/dedup/queue/confirmed-write semantics; normal valid storage and blocked/stummschalt storage tests pass.
4. Valid active prevents second create; valid same-clientRef proposal retry remains idempotent; genuinely empty storage can create under the existing contract.
5. Retry after explicit synthetic storage correction freshly observes new state. Simulate the external correction in test fixture; do not perform a forbidden overwrite to 'fix' it.
6. Before-network tests for both create paths: invalid/unavailable/pending → zero place/model/create calls; valid/absent allowed according to existing rules; authenticated bypass is independent of guest-localStorage. Change storage after initial render to ensure action-time recheck.
7. #517 adoption tests and meaningful existing create/manual-entry/reflow checks remain green. No superficial class-string tests.
8. Narrow compiled-CSS synthetic screenshots at390 for invalid/unavailable/retry and existing valid gate, plus360/200% for new message readability. Preserve existing #528 runtime layout classes. Block all actual model/provider/mutation routes, show raw-byte equality, attempts/completed counts and visible honest state.

## Multi-Agent Suitability — binding
Mode NORMAL. **MULTI_AGENT across two independent PRs; SINGLE_AGENT within each.**
A: **Jetnity V1 account graph read completeness 1**, Gen1, issue529, branch `fix/v1-account-graph-read-completeness-1`: account graph read boundary and its pure tests/own evidence.
B: **Jetnity V1 guest active draft preservation 1**, Gen1, issue530, branch `fix/v1-guest-active-draft-preservation-1`: browser active-key preservation, create preflight and its dedicated UI/tests/own evidence.
Both branch from e818c13. No shared runtime write path. Existing Trip/Reisegraph, persisted schemas, identity/credential/readiness contracts remain unchanged and read-only to both. A uses existing Lesung.problem instead of changing shared Trip metadata; B owns only guest/create-specific contracts. No dependency on unmerged sibling code. Each can be independently tested/reviewed.
**TL merge order A then B**, with explicit single main-integration authorization for B after A postmerge verified. This is integration order, not implementation dependency. A discovered need for a shared type/domain/schema change is a STOP with smallest requested expansion, not permission to cross ownership. Additional writers inside either scope add risk. Presentation-only work and additional Admin runtime remain separate; #518 first read-only Admin implementation is completed and not restarted.

## Binding baseline and workflow
Date: 21 September 2026. Baseline main **e818c13ed009932bc06be1382a89467866699995**. Latest completed handoff: #512 comment5767628048. TL re-read live main, NORMAL operating mode, active strict Ruleset21875372 with no bypass; CI35655738463, Auth106518836056 and TLB106518836237 all successful including every step; direct Production dpl_Eb4CESWbsphdcTtm3ZQPiUvu3YVU READY exact main, aliasError null. Previous #526/#528 and #516/#517/#518/#520/#522/#524 are completed. No previous implementation session is to be restarted for this new task.
Before editing read JETNITY_START_HERE.md, AGENTS.md, operating mode, TL operating standard, Multi-Agent Operating System, Slice Planning Standard, vision/architecture/decisions/roadmap, product/design/continuity standards, V1 binding build order and relevant tests. Live evidence wins. Read source before choosing implementation; create a short concrete plan in own STATUS.
Required **Cursor Grok 4.6 High Fast**, no Auto/substitution. Record actual session/model; unverified remains unverified. New named Generation1; immediate review fixes reuse this exact session. No local imitation of Cursor or Guardian.
No Production SQL/migration/schema/Auth/RLS/secrets, new data collection, real account/trip mutation, provider/model/paid calls, payment, external settings, dependencies/lockfile/workflows, public launch or reserved PO-gate crossing. No broad audit or redesign. All fixtures disposable and synthetic.
Own TASK/STATUS/HANDOFF/SELF_REVIEW, implementation decision, changed-path manifest, risks/limitations, relevant evidence and next owner are required. Do not write global continuity files or sibling files. Important technical decision goes in own versioned decision note; TL integrates continuity centrally. Freeze substantive source/docs once. Exact final SHA, main/ahead-behind, model/session, CI/Auth/direct Preview and GitHub/toolbar thread counts go in PR receipt, not repetitive bookkeeping commits.
Run meaningful existing/added tests, typecheck, lint, full tests, hygiene (dead/exports/deps/api-schutz/schema-bezug), build. New head invalidates previous exact-head gates. Distinguish actual executed checks from skips. No implementation-mirroring source-regex tests.
For changed UI provide narrowly targeted real Chromium/Playwright captures with compiled product CSS; exact product SHA/tree, dirty paths, timestamp, browser/version, viewport, route, synthetic state and action sequence. Inspect actual images. Intercept provider/API requests and abort unexpected mutation methods including same-route server actions BEFORE interaction; record attempts vs completed. No actual account creation, model invocation or destructive browser action. Do not call local synthetic evidence authenticated Preview/hardware/Safari/WCAG proof.
STOP FOR INDEPENDENT TECHNICAL-LEAD CODE / CONTRACT / VISUAL REVIEW. **Do not mark Ready. Do not merge. Do not start a follow-up slice.** TL alone can Ready/merge after independent exact-head gates and must verify exact main/Production afterwards. Do not autonomously merge/rebase main or sibling branch; report drift and await explicit TL integration boundary. Guardian is separate PO app, never a Cursor writer; TL reassesses independent Guardian need at review, no Guardian run is created here.
