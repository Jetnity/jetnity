# Jetnity Trip Traveller Snapshot Workflow Completion 1 — TASK V1

Date: 2026-10-25. **Immutable Technical-Lead task.** Parent [R107 #1011](https://github.com/Jetnity/jetnity/issues/1011); tracking [#1012](https://github.com/Jetnity/jetnity/issues/1012); lane **T**.

## 1. Authority, baseline and first delivery

Cursor-Agent: **Jetnity Trip Traveller Snapshot Workflow Completion 1 — Cursor Generation 1**. Fresh genuine **Generation 1**, requested **Grok 4.7 High Fast / grok-4.7-high-fast**. No Auto or silent model substitution; if unavailable, STOP and report. Attest actual runtime model, exact session ID/link and logical name. A visible UI rename is best effort and must be reported as actually done or unavailable; no invented independent UI proof.

Branch: `feat/r107-trip-traveller-snapshot-workflow-1`. Base/current main at dispatch: **a74c443c6be3f064f150fcf021ab6154bda325e5**, tree **c1fe5a50b0da710ef425674057f782b1dff6f8bc**, mode NORMAL. Root verified R106 closure, actual-main CI, Production/direct domain, open work and active strict ruleset 21875372. [Root precheck](https://github.com/Jetnity/jetnity/issues/1011) and [intake](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6399573707) are binding.

**FIRST DELIVERY IS PLAN ONLY.** Read this complete TASK and the relevant actual code/contracts. Commit only `docs/JETNITY_TRIP_TRAVELLER_SNAPSHOT_WORKFLOW_COMPLETION_1_PLAN_2026-10-25.md` in addition to this immutable TASK. The plan must provide source-confirmed design, exact file ownership, reused contracts, failure/state matrix, proof approach, costs and limits. Post actual main/head/merge-base/ahead/behind, plan link/blob, model/session/name, then **STOP before any implementation, test addition, audit execution or other document changes**. Root will independently review the exact plan head and authorize this same session. This internal TL gate requires no additional Owner confirmation.

Required reading: AGENTS.md; JETNITY_START_HERE.md; Technical-Lead/Cursor Operating Standard; current handoff and ACTIVE_WORK_STATUS; live #751/#1011; three-phase strategy; V1 binding build order; Multi-Agent Slice Planning Standard; relevant existing contracts/tests. Earlier dated pending/current markers are historical snapshots. R106 is completed and must not be reopened.

## 2. Goal and source-confirmed need

Deliver a reliable current-trip traveller editor and the existing explicit Account Registry → Trip intake. Preserve every existing traveller/citizenship/document identity and explicit relationship while completing pending, conflict, removal, acknowledgement, observed-state and uncertain-outcome behavior.

**Priority P1, independently reproduced:** Registry materialization in lib/traveller/account-registry-trip.ts creates fresh UUID child refs. Reisevorbereitung.tsx currently stores citizenships as country strings and submits country-derived refs. Root executed the existing dokumenteAusTraveller → dokumenteAlsPayload transformation with citizenship ref a1111111-1111-4111-8111-111111111111 and a passport referring to it; unchanged-country serialization returned citizenship:CH and a null document relation. The actual pure helper ran on Node v24.22.1; this was exploratory source-bound proof, not the required Node-22/mounted/hosted acceptance. First implement a meaningful mounted regression of a residence-only edit on the real editor, showing the old failing payload and corrected preserved relationship.

Additional source-confirmed risks: one-time field initialization can disagree with refreshed canonical slot props; save/remove have no owned in-flight/exception boundary; errors are shared among cards; registry intake has no trip identity and treats callback null after router.refresh() as finished display. Prove actual failure modes before broad claims.

## 3. Exclusive allowed files

Existing files, with narrow edits:
- components/trips/Reisevorbereitung.tsx — only traveller-card composition/extraction and traveller-specific lifecycle/error wiring. Personal preparation and Official Truth evaluation surfaces are frozen.
- components/trips/RegistryReiseUebernahme.tsx — explicit target-bound intake, lifecycle, confirmation, focus and honest feedback.
- components/trips/TripWorkspace.tsx — minimal traveller controller lifetime and traveller-only props/wiring. No plan editing, routing/mode change or personal-preparation lifecycle rewrite.
- components/trips/KontoArbeitsbereich.tsx — only traveller/import callbacks and narrowly needed current raw canonical-trip/refresh wiring, preserving existing actions/graph fetch.
- components/trips/GastArbeitsbereich.tsx — only traveller adapter/context wiring; existing storage writes/read contracts frozen.
- lib/traveller/account-registry-trip-copy.ts — necessary workflow wording only.
- lib/traveller/account-registry-trip-ui.test.ts — preserve all domain/authority assertions; only obsolete approved UI-shape assertions may change.

New optional implementation files, omit unnecessary abstractions:
- components/trips/TripTravellerSnapshotEditor.tsx
- components/trips/useTripTravellerSnapshotLifecycle.ts
- lib/readiness/trip-traveller-snapshot-workflow-1.ts
- lib/readiness/trip-traveller-snapshot-workflow-1.test.ts
- The lane's named proof/evidence/documentation paths in section 7.

Initially freeze lib/readiness/dokument-formular.ts and its tests. Reuse its identity-preserving read behavior where appropriate; new typed UI draft logic must not use country identity as a replacement for existing citizenship refs. If replacing its only runtime callers creates a demonstrable hygiene conflict, flag the exact required narrow adaptation in PLAN for TL decision; no silent broad cleanup.

Also frozen: lib/readiness/reisende-aktionen.ts, reisende-gast.ts, reisende.ts, schema.ts, party.ts; lib/traveller/account-registry.ts and account-registry-trip.ts; gastspeicher core; lib/trips/daten.ts; all canonical Trip/domain types, server writers/RPCs/migrations/Auth/RLS; Account Registry CRUD; R106 EigeneReisevorbereitung/usePersonalPreparationLifecycle; all sibling ownership. Existing permitted raw read surfaces may be reused, but no new hosted query or extra unapproved guest persistence path.

## 4. Required behavior

1. Preserve imported UUID refs, supported legacy refs and every unchanged document relation exactly through a no-op/residence-only edit. No first/default/primary citizenship or document, no issuer/label/index-based identity.
2. Model citizenship/document rows with stable identities. Allocate each new local identity once; keep it across edits/retries. Deliberate removal clears only relations to that removed row. Do not silently relink to another same-country row or replace existing refs merely because their encoding differs.
3. Retain existing field set and limits (multiple citizenships/documents). Existing server validation remains authoritative; malformed/duplicate input cannot be silently dropped to fabricate success. No passport number, MRZ, biometrics, health or new document data.
4. Bind each intent to trip identity, traveller clientRef, captured draft generation and operation generation. Immediate duplicate/save-vs-remove protection must work before React rerender, including real Enter/form submissions.
5. Clean drafts adopt new canonical target data coherently. Dirty drafts encountering changed canonical data retain edits and expose an explicit reload/discard/conflict choice. Known-stale drafts must not silently overwrite fresh observed values.
6. Save/remove results affect only their initiating target/intent. Catch thrown/malformed callbacks; do not present uncertain transport outcome as rollback, rejection, or safe automatic retry.
7. Distinguish accepted write from a requested refresh and later observed target state. Existing actions provide no versioned/correlated transaction receipt; no causal/exactly-once claim. Full unmount and cross-tab whole-graph residuals remain explicit.
8. Named removal confirmation removes only saved details for that trip slot. It does not change headcount, remove the Account Registry source, or pretend the placeholder slot itself disappears.
9. Explicit registry intake preserves source-ID choice and server capacity checks; same-label records remain distinct. An uncertain import cannot be automatically repeated because materialization creates a fresh snapshot. No new-ID correlation by label/country/count/order.
10. Preserve pending/uncertain intent through ordinary section navigation using the appropriate existing stable Workspace/adapter lifetime. Do not invent persistent recovery, a second raw graph writer or a universal mutation framework.
11. Give each target accessible, meaningful pending/error/acknowledged/conflict feedback and deliberate focus/confirmation/cancel behavior; late responses must not steal focus from newer work.

## 5. Acceptance and evidence

- Mounted real-editor regression for imported UUID relation + residence-only save; preserve document identity and relation. Add legacy refs, 2+ citizenships, 2+ documents, deliberate citizenship removal, explicit relation selection and invalid/duplicate input.
- Pure draft/serialization tests and mounted controlled promise tests for double save, save/remove race, returned error, thrown/malformed response, stale success/error/finally, clean/dirty canonical props, target replacement/removal and trip identity change.
- Mounted real RegistryReiseUebernahme and actual Workspace/adapter wiring with two same-label sources, capacity changing before result, source list/read failure, accepted-awaiting-read, unknown outcome, section navigation, and full unmount limits.
- Exercise actual DOM pointer/keyboard/form events; direct private React handler calls are not sufficient proof of user behavior.
- Preserve the relevant existing traveller, registry materialization/orchestration, personal-preparation and Workspace regressions. No fixture editing to hide the original P1.
- Actual project CSS/layout proof at 320/360/390/768/1280 widths, root text 32px at narrow width, long labels, multiple children, confirmations, conflicts, pending/error states, keyboard and reduced motion. Do not hide page overflow to pass.
- Mark stubbed router/actions/guest storage and every untested hosted boundary explicitly. If correctness needs a schema/RPC/versioned mutation/atomicity change, STOP at that reserved boundary instead of widening scope.


## 6. Multi-Agent Suitability and frozen boundaries

Decision: **MULTI_AGENT**. Five independent lanes on one verified main: T traveller snapshot, W World visits, M My Trips collection/archive, D Admin user directory, S dependency advisory triage. This lane owns only its exact allowlist above and its named delivery files. All others are read-only dependencies. Shared contracts do not change silently. If an unlisted file or contract is truly necessary, describe the narrow need to TL and STOP at that boundary; do not alter the TASK yourself.

Integration priority **T → S → D → W → M**. Do not merge or cherry-pick sibling branches. Do not automatically merge/rebase new main into this branch: report drift and wait for the TL's explicit same-session integration instruction. Every new head requires fresh acceptance. Product-facing work must keep existing premium/mobile-first tokens and semantics.

Preserve #985/#982 scoped HOLD, including no retry/rephrase/reroute/substitute review or held-implementation inspection; #917 denied hosted-readback STOP (hosted UNKNOWN, Stage 2 NOT_ATTEMPTED; no alternate query/apply/connector/operator/manual-SQL route); #913/#911 block; #968 legacy Preview cleanup PAUSED; #748 personal-browser/CUA SUSPENDED; #626 STOP; #937/#936 PAUSED; Bern #934 HARD-BLOCKED; #944 no autostart; #585 deferred; #960 separate; #957 dormant.

No hosted DB operations, schema/migration/RLS/grant changes, Auth/AAL/session/identity expansion, new sensitive passport/MRZ/biometric/health fields, secret/protection modification, provider activation or paid call, payment, contract/legal acceptance, launch/indexing or new paid service. Existing prelaunch/noindex and USD 100 monthly infrastructure boundary remain. Routine repository and synthetic local development operations within this task are authorized. A denied action must not be bypassed.

No edits to global continuity/governance/ROADMAP/DECISIONS/ARCHITECTURE/DESIGN_SYSTEM, package files, lockfiles, workflows, operating mode or broad shared types unless explicitly included above. In this batch none of those global changes is allocated. Root owns consolidated continuity. Findings outside scope are reported with evidence and severity, not silently fixed.

## 7. Implementation/audit deliverables after TL PLAN acceptance

- Only named runtime/proof paths above and this lane's documentation:
  - `docs/JETNITY_TRIP_TRAVELLER_SNAPSHOT_WORKFLOW_COMPLETION_1_PLAN_2026-10-25.md`
  - `docs/JETNITY_TRIP_TRAVELLER_SNAPSHOT_WORKFLOW_COMPLETION_1_STATUS_2026-10-25.md`
  - `docs/JETNITY_TRIP_TRAVELLER_SNAPSHOT_WORKFLOW_COMPLETION_1_REPORT_2026-10-25.md`
  - `docs/JETNITY_TRIP_TRAVELLER_SNAPSHOT_WORKFLOW_COMPLETION_1_SELF_REVIEW_2026-10-25.md`
  - `docs/JETNITY_TRIP_TRAVELLER_SNAPSHOT_WORKFLOW_COMPLETION_1_HANDOFF_2026-10-25.md`
- Proof runners, if allowed above: `scripts/trip-traveller-snapshot-workflow-completion-1/**`.
- Sanitized synthetic evidence: `docs/evidence/trip-traveller-snapshot-workflow-completion-1/**`, with source/head/dirty-state binding, exact commands, exit codes, versions, test totals, stubs, screenshots where relevant, and honest failed/aborted/skipped limits. No real user data, credentials, raw sensitive platform responses, node_modules or reproducible bundle bulk.
- Never relabel pure/source/synthetic/mocked evidence as hosted, authenticated, native-device, full-router, SQL/RLS or Production evidence. A refresh request does not prove causal readback. A local operation guard does not prove atomicity or exactly-once writes.
- Product lanes must run meaningful focused regressions and actual-component interaction/CSS evidence as specified, then ordinary project Typecheck, lint, all five hygiene guards, production build and tests. Existing native App/Auth/Vercel gates are required; do not alter gates or use skipped work as a pass. Record local environment failures honestly. The read-only audit lane runs its specific evidence validation and the normal native docs gates; it does not introduce runtime tests mirroring its report.
- The two established conditional browser skips, 181 existing lint warnings, 11 previously reported untriaged dependency advisories, guest cross-tab non-atomicity and full-unmount limits are existing evidence limits, not new successes or globally accepted security clearance.

## 8. Mandatory STOP and handoff

At the next agreed delivery boundary, push only to the existing assigned branch/PR and report exact main/head/tree/merge-base/ahead/behind, full changed-file list, model/session/name, executed evidence, failed or skipped checks, open P0/P1/P2/P3 findings and remaining limits.

**Do not mark Ready. Do not merge. Do not close tracking issues. Do not write main. Do not start a follow-up slice.** Keep this TASK byte-identical. Self-review is not Technical-Lead PASS. Only root TL makes acceptance/Ready/merge decisions. An immediate CHANGES REQUIRED fix stays with this same original author/session; a changed head invalidates every previous exact-head gate.
