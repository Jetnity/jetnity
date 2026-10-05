# V1 Account Graph Read Completeness 1 — Binding Task
Agent: **Jetnity V1 account graph read completeness 1**, Generation1
Tracking: #529
Branch: `fix/v1-account-graph-read-completeness-1`

## Goal and live evidence
Implement TA-R3 from #509 `V1_TRIP_ACCOUNT_REVALIDATION_1_NEXT_SLICES_2026-09-21.md`, narrowed to the account graph read boundary.
Live `reiseLaden` retries a missing Foundation-E child relation with TRIP_GRAPH_SELECT_LEGACY, then maps it through reiseAus/partyAusZeilen as a normal successful Reisegraph. Independent TL probe on e818c13: one synthetic row with missing child arrays and legacy CH/passport fields becomes one citizenship and one document. Canonical empty arrays are correctly kept empty. A cosmetic warning would still let consumers use the incomplete credentials.

## Versioned read-state / consumer contract
**Use the existing `Lesung<Reisegraph>` success/problem contract. Do not add a flag to persisted Trip or redesign Traveller/Readiness types.**
- Complete canonical rows remain exactly the existing successful graphs; canonical `trip_travellers: []` is a valid empty party, and loaded empty child arrays are authoritative empty, never legacy expansion.
- A successful canonical row whose traveller relation is missing/null/not an array, or where any actual traveller lacks either loaded child array, is incomplete and must not be mapped/exposed as a successful graph. Check structural load completeness, not credential sufficiency or citizenship/document validity rules.
- Preserve the narrowly detected expand/contract fallback query compatibility. If fallback yields actual trip rows, report a sanitized explicit `Lesung.problem` with `zeilen:null` BEFORE mapping; no ready/credential/editable Trip can escape. Do not treat missing relations as empty data. Retain the detector/select compatibility path; no schema changes/removal of expand-contract foundations.
- Fallback empty result remains genuine absent/not-owned (empty), preserving non-disclosure/404. Fallback errors and unrelated canonical errors retain existing error handling; no broad retry for arbitrary errors. Never return data alongside problem.
- Use an internal failure status500 for incomplete graph (this is not evidence the database is unreachable). Internal technical message may identify incomplete traveller load safely; product must not expose SQL/schema/raw rows. Existing public page and server action consumers already handle problem before mapping/rendering/mutation; prove that all reiseLaden consumers actually do so.
- **Deliberate bounded availability tradeoff:** while this exceptional read is incomplete, the affected account trip workspace/actions report unavailable rather than presenting a partly trusted Trip. No claim of deleted data. Canonical path unaffected. This closes the safety gap without redesigning every downstream credential consumer. A later partial-workspace experience would require a separate contract.
- Fix foundation-e-select.ts header: describe fallback for missing relation only, not an unsupported claim that Production lacks child tables.
- Do not change `partyAusZeilen` legacy semantics globally; guest legacy/registry snapshots/dual authority stay unchanged. The boundary owns whether that result can enter current account Trip consumers.

## Exclusive ownership
Runtime:
- `lib/trips/daten.ts` ONLY account reiseLaden flow, extracting the minimum injectable orchestration needed for meaningful tests if required.
- `lib/trips/foundation-e-select.ts` detector/query compatibility, truthful header and minimal read-completeness helper.
- optional new `lib/trips/account-graph-read.ts` pure/injected read orchestration so tests execute production logic without live Supabase.
- `app/(public)/reisen/[tripId]/page.tsx` ONLY if necessary for honest existing error-state copy; no normal workspace/layout/Auth change.
Tests: own `lib/trips/account-graph-read.test.ts`, existing `lib/trips/foundation-e-select.test.ts`; minimal additional behavioural consumer test next to own tests if necessary.
Own `docs/V1_ACCOUNT_GRAPH_READ_COMPLETENESS_1_{TASK,STATUS,HANDOFF,SELF_REVIEW,DECISION}_2026-09-21.md`, `docs/evidence/v1-account-graph-read-completeness-1/**`, optional own audit script.
Read-only: types/trips, lib/readiness/*, lib/traveller/*, abbildung/schema, shared API read contract, all mutations/Auth/schema/SQL, all guest storage/create components and B's files. If any consumer violates problem-before-use, report exact caller and smallest needed expansion to TL before editing outside scope.

## Acceptance / adversarial tests
Execute the actual orchestration with injected responses, not duplicated policy:
1. Complete canonical multi-citizenship/multi-document party unchanged, selected option associations unchanged.
2. Empty canonical party and authoritative empty child arrays remain valid; legacy singular values cannot refill loaded empties.
3. Each detected missing child relation → one narrowly bounded fallback → nonempty legacy result becomes explicit problem/null rows, mapper not called. Empty fallback remains absent/not-owned. Failed fallback returns error.
4. Canonical success with one missing/null child array (including mixed complete/incomplete travellers) fails before mapping; no success by filtering incomplete traveller away.
5. Other canonical error, null-data/no-error, thrown reader and fallback error preserve error semantics and never produce empty success/fabricated credentials. Preserve ownership filtering.
6. Enumerate reiseLaden consumers: page, readiness/traveller operations, travel changes, companion, hotel/flight/activity/mobility/rental actions. Prove failure stops before actionable graph or mutation. No live writes required or authorized.
7. Existing Foundation-E mapper, party/credential/dual-authority tests stay green without changing their semantics.
No new official entry guidance or claim of Production schema validation. Source/data-boundary evidence is primary; if no UI changes, a general visual audit is not required.

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
