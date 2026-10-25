# Jetnity My Trips Collection and Archive Workflow Completion 1 — TASK V1

Date: 2026-10-25. **Immutable Technical-Lead task.** Parent [R107 #1011](https://github.com/Jetnity/jetnity/issues/1011); tracking [#1014](https://github.com/Jetnity/jetnity/issues/1014); lane **M**.

## 1. Authority, baseline and first delivery

Cursor-Agent: **Jetnity My Trips Collection and Archive Workflow Completion 1 — Cursor Generation 1**. Fresh genuine **Generation 1**, requested **Grok 4.7 High Fast / grok-4.7-high-fast**. No Auto or silent model substitution; if unavailable, STOP and report. Attest actual runtime model, exact session ID/link and logical name. A visible UI rename is best effort and must be reported as actually done or unavailable; no invented independent UI proof.

Branch: `feat/r107-my-trips-collection-archive-workflow-1`. Base/current main at dispatch: **a74c443c6be3f064f150fcf021ab6154bda325e5**, tree **c1fe5a50b0da710ef425674057f782b1dff6f8bc**, mode NORMAL. Root verified R106 closure, actual-main CI, Production/direct domain, open work and active strict ruleset 21875372. [Root precheck](https://github.com/Jetnity/jetnity/issues/1011) and [intake](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6399573707) are binding.

**FIRST DELIVERY IS PLAN ONLY.** Read this complete TASK and the relevant actual code/contracts. Commit only `docs/JETNITY_MY_TRIPS_COLLECTION_AND_ARCHIVE_WORKFLOW_COMPLETION_1_PLAN_2026-10-25.md` in addition to this immutable TASK. The plan must provide source-confirmed design, exact file ownership, reused contracts, failure/state matrix, proof approach, costs and limits. Post actual main/head/merge-base/ahead/behind, plan link/blob, model/session/name, then **STOP before any implementation, test addition, audit execution or other document changes**. Root will independently review the exact plan head and authorize this same session. This internal TL gate requires no additional Owner confirmation.

Required reading: AGENTS.md; JETNITY_START_HERE.md; Technical-Lead/Cursor Operating Standard; current handoff and ACTIVE_WORK_STATUS; live #751/#1011; three-phase strategy; V1 binding build order; Multi-Agent Slice Planning Standard; relevant existing contracts/tests. Earlier dated pending/current markers are historical snapshots. R106 is completed and must not be reopened.

## 2. Goal and source-confirmed need

Deliver a **bounded, URL-addressable saved-trip collection** at the existing /reisen route, with continuation beyond 200 trips, server-scoped title/origin search, archive selection and reliable existing archive/restore interaction.

Current reisenLaden() intentionally caps at 200; KontoReisenGruppen search/group/archive cover only that loaded subset and honestly disclose the limit. There is no continuation. The existing archive UI has no rejected-promise boundary and resets pending on unrelated props. Its server action already has status + updated_at optimistic guards and stays unchanged.

The existing search contract reisePasstZurSuche searches only title and origin, case-insensitively after trim. Preserve this supported field scope and describe real database matching/locale limitations accurately; do not invent destination search or silently claim exact JavaScript/SQL collation equivalence.

## 3. Exclusive allowed files

Existing:
- app/(public)/reisen/page.tsx — authenticated collection read/control integration while preserving existing guest surface and auth boundary.
- components/trips/KontoReisenGruppen.tsx
- components/trips/KontoReiseArchivAktion.tsx
- components/trips/KontoReiseEintrag.tsx — only necessary archive/controller binding.
- lib/trips/daten.ts — **only a narrow extraction of existing summary selection/row mapping into one shared helper**, preserving reisenLaden() signature, 200 cap, order/error behavior, canonical output and all graph-read logic.

New optional files:
- components/trips/MyTripsCollection.tsx
- components/trips/useMyTripsCollectionNavigation.ts
- components/trips/useTripArchiveWorkflow.ts
- lib/trips/reisen-uebersicht.ts — the single reused summary selection/mapping source, with focused regression tests.
- lib/trips/reisen-sammlung-abfrage.ts and .test.ts — pure bounded URL/filter/cursor contract.
- lib/trips/reisen-sammlung-daten.ts and .test.ts — separate bounded authenticated RLS reader.
- lib/trips/trip-archive-workflow.ts and .test.ts — UI-only operation state if needed.
- The lane's named proof/evidence/documentation paths in section 7.

Any exact existing UI/source assertion requiring adaptation must be named in PLAN and approved by root before editing. No broad test rewrite.

Frozen: lib/trips/archiv-aktionen.ts and its status/updated_at guards; canonical TripSummary/types, lib/account/reise-archiv.ts and reise-lage.ts; guest storage/transfer and guest collection; Workspace and traveller surfaces; Account home/world readers and behavior; graph reads including reiseLaden/accountGraphLesen; schema/RLS/Auth/server client; shared search/error helpers; providers, costs, global navigation/styles. Do not duplicate the summary mapper or broaden reisenLaden() for other consumers.

## 4. Required behavior

1. Add deliberate bounded continuation over the account's existing saved trips beyond 200. Use the same authenticated server client/RLS and canonical summary fields. No service role, extra account access, schema/index/RPC/migration or new API endpoint.
2. One bounded collection query per explicitly requested page, using a documented page size and deterministic updated_at plus unique ID ordering. A small lookahead is allowed for has-more. No N+1, unbounded full list fetch, background prefetch/polling or global total inferred from a page.
3. Use a validated cursor/query contract with maximum lengths, exact field types, finite valid date/ID values, filter binding and bounded arithmetic. Preserve ordering precision rather than truncating the stored timestamp into a lossy cursor. Reject malformed/oversized/mismatched values before a DB request.
4. Search covers the server result scope for the existing title/origin fields with verified literal substring input handling. Reusing textSuchfilter establishes PostgREST grammar quoting, not literal percent/underscore matching: the new query layer must separately preserve the existing local-search literal semantics with verified pattern handling. If the unchanged helper cannot represent that safely, PLAN must identify the exact bounded query-builder need for TL review; the shared helper stays unchanged. Account archive-state selection is separate from calendar-date grouping. Do not create new lifecycle statuses.
5. Store the committed filter/continuation in the URL so reload, deep links and Back/Forward are meaningful. A genuine filter change starts its own result sequence; stale replies/acknowledgments cannot overwrite a newer query/draft. Explain which query owns displayed rows.
6. Keep current, pending, returned empty, no matches, end of continuation, invalid request and read error distinct. Read failure cannot assert “all trips are saved” or masquerade as an empty account. Retain useful controls and an explicit bounded retry/refresh action.
7. Existing device-calendar grouping remains local and date-only; do not silently replace it with UTC or classify a partial page as the complete account. Label page/result-scope counts honestly.
8. This is a live list, not a database snapshot. updated_at can move records during pagination or archive operations. Provide explicit restart/refresh and document possible concurrent movement; promise exactly-once traversal only for an unchanged fixture/data set.
9. Archive/restore retains the existing server action and concurrency guards. Capture trip ID, existing displayed status/provenance, operation and context generation. Protect same-turn duplicate activation; catch thrown/malformed response; distinguish returned rejection, acknowledged-awaiting-read and unknown outcome.
10. A same-ID new prop/status or removed/filtered/page-switched card cannot falsely settle another operation, clear newer feedback or enable an automatic replay of uncertain archive/restore. Appropriate collection-level state may outlive a card; full-unmount limits remain explicit.
11. Never auto-restore without the existing recorded previous-status evidence. Preserve the card/link and separate action accessibility; no nested interactive controls.
12. Guests continue to use the existing guest route/surface and issue no account collection query. Account home and World still use the unchanged reisenLaden() contract.

## 5. Acceptance and evidence

- At least 251 synthetic unchanged saved trips; all expected IDs are reachable exactly once through the actual page-query seam. Include tied timestamps and preserve full ordering precision.
- Empty first/final page, lookahead, malformed/oversized cursor, cursor/filter mismatch, repeated/invalid params, invalid date/ID, invalid archive selector and bounded search input. Prove invalid requests do not invoke the DB boundary.
- Demonstrate actual emitted server query/filter/order/range or cursor behavior with a faithful synthetic boundary. String assertions do not establish real PostgreSQL execution; mark hosted SQL/RLS untested.
- Search title/origin, punctuation, comma, percent/underscore, Unicode; state actual matching semantics and scope. No changed account identity or extra selected private fields.
- Reuse/extraction regression proving original reisenLaden() rows, cap/error behavior, Account home/World consumers and graph-read paths unchanged.
- Actual rendered collection controls: reload/remount, Back/Forward, rapid filter/continuation changes, slow reads, stale result props, retry of correct committed query, clear search and restart.
- Actual archive controls: returned rejection, thrown/malformed result, duplicate activation, accepted-awaiting-read, target removal, same-ID canonical update, query navigation and deliberate recovery. No action call from a read-only navigation.
- Project CSS with real pointer/keyboard events at 320/390/768/1440 widths, root text 32px, long titles/origins, dense results, pending/error/end states and reduced motion.
- Preserve existing canonical archive/group/date tests. Sibling T's traveller/Workspace code is out of scope.


## 6. Multi-Agent Suitability and frozen boundaries

Decision: **MULTI_AGENT**. Five independent lanes on one verified main: T traveller snapshot, W World visits, M My Trips collection/archive, D Admin user directory, S dependency advisory triage. This lane owns only its exact allowlist above and its named delivery files. All others are read-only dependencies. Shared contracts do not change silently. If an unlisted file or contract is truly necessary, describe the narrow need to TL and STOP at that boundary; do not alter the TASK yourself.

Integration priority **T → S → D → W → M**. Do not merge or cherry-pick sibling branches. Do not automatically merge/rebase new main into this branch: report drift and wait for the TL's explicit same-session integration instruction. Every new head requires fresh acceptance. Product-facing work must keep existing premium/mobile-first tokens and semantics.

Preserve #985/#982 scoped HOLD, including no retry/rephrase/reroute/substitute review or held-implementation inspection; #917 denied hosted-readback STOP (hosted UNKNOWN, Stage 2 NOT_ATTEMPTED; no alternate query/apply/connector/operator/manual-SQL route); #913/#911 block; #968 legacy Preview cleanup PAUSED; #748 personal-browser/CUA SUSPENDED; #626 STOP; #937/#936 PAUSED; Bern #934 HARD-BLOCKED; #944 no autostart; #585 deferred; #960 separate; #957 dormant.

No hosted DB operations, schema/migration/RLS/grant changes, Auth/AAL/session/identity expansion, new sensitive passport/MRZ/biometric/health fields, secret/protection modification, provider activation or paid call, payment, contract/legal acceptance, launch/indexing or new paid service. Existing prelaunch/noindex and USD 100 monthly infrastructure boundary remain. Routine repository and synthetic local development operations within this task are authorized. A denied action must not be bypassed.

No edits to global continuity/governance/ROADMAP/DECISIONS/ARCHITECTURE/DESIGN_SYSTEM, package files, lockfiles, workflows, operating mode or broad shared types unless explicitly included above. In this batch none of those global changes is allocated. Root owns consolidated continuity. Findings outside scope are reported with evidence and severity, not silently fixed.

## 7. Implementation/audit deliverables after TL PLAN acceptance

- Only named runtime/proof paths above and this lane's documentation:
  - `docs/JETNITY_MY_TRIPS_COLLECTION_AND_ARCHIVE_WORKFLOW_COMPLETION_1_PLAN_2026-10-25.md`
  - `docs/JETNITY_MY_TRIPS_COLLECTION_AND_ARCHIVE_WORKFLOW_COMPLETION_1_STATUS_2026-10-25.md`
  - `docs/JETNITY_MY_TRIPS_COLLECTION_AND_ARCHIVE_WORKFLOW_COMPLETION_1_REPORT_2026-10-25.md`
  - `docs/JETNITY_MY_TRIPS_COLLECTION_AND_ARCHIVE_WORKFLOW_COMPLETION_1_SELF_REVIEW_2026-10-25.md`
  - `docs/JETNITY_MY_TRIPS_COLLECTION_AND_ARCHIVE_WORKFLOW_COMPLETION_1_HANDOFF_2026-10-25.md`
- Proof runners, if allowed above: `scripts/my-trips-collection-archive-workflow-completion-1/**`.
- Sanitized synthetic evidence: `docs/evidence/my-trips-collection-archive-workflow-completion-1/**`, with source/head/dirty-state binding, exact commands, exit codes, versions, test totals, stubs, screenshots where relevant, and honest failed/aborted/skipped limits. No real user data, credentials, raw sensitive platform responses, node_modules or reproducible bundle bulk.
- Never relabel pure/source/synthetic/mocked evidence as hosted, authenticated, native-device, full-router, SQL/RLS or Production evidence. A refresh request does not prove causal readback. A local operation guard does not prove atomicity or exactly-once writes.
- Product lanes must run meaningful focused regressions and actual-component interaction/CSS evidence as specified, then ordinary project Typecheck, lint, all five hygiene guards, production build and tests. Existing native App/Auth/Vercel gates are required; do not alter gates or use skipped work as a pass. Record local environment failures honestly. The read-only audit lane runs its specific evidence validation and the normal native docs gates; it does not introduce runtime tests mirroring its report.
- The two established conditional browser skips, 181 existing lint warnings, 11 previously reported untriaged dependency advisories, guest cross-tab non-atomicity and full-unmount limits are existing evidence limits, not new successes or globally accepted security clearance.

## 8. Mandatory STOP and handoff

At the next agreed delivery boundary, push only to the existing assigned branch/PR and report exact main/head/tree/merge-base/ahead/behind, full changed-file list, model/session/name, executed evidence, failed or skipped checks, open P0/P1/P2/P3 findings and remaining limits.

**Do not mark Ready. Do not merge. Do not close tracking issues. Do not write main. Do not start a follow-up slice.** Keep this TASK byte-identical. Self-review is not Technical-Lead PASS. Only root TL makes acceptance/Ready/merge decisions. An immediate CHANGES REQUIRED fix stays with this same original author/session; a changed head invalidates every previous exact-head gate.
