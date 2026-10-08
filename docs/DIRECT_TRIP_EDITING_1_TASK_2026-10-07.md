# Direkte Reisebearbeitung 1 — binding integrated implementation task

Date: 7 October 2026 (Europe/Zurich)
Repository: Jetnity/jetnity
Issue: #904
Branch: `feat/direct-trip-editing-1`
Baseline: `main@9ea0e068e1d28b18ed15059fa5bf9b63c0689cfe` (merged #903)
Logical writer: **Direkte Reisebearbeitung 1 — Generation 1**
Execution: a NEW dedicated Codex Desktop session; record actual session/model/reasoning metadata when observed.
Task version: **1.0 / immutable after TL publication**. Changes to requirements require a separately versioned TL amendment; do not edit this TASK to fit the implementation.
Initial state: **PREPARED_FOR_CODEX_START / IMPLEMENTATION_NOT_STARTED**. This is a complete implementation assignment, not a request for another design-only slice.

## 1. Authority and autonomous execution

The Product Owner requested: “solange wir warten, können wir mit einer grösser aufgabe weiter machen?” This is the next explicitly requested, independently scoped work package. It does not reopen #903/#902 or replace the existing #900 writer. The preference for substantial integrated Codex assignments remains binding.

All ordinary in-scope actions are approved together: fresh reconstruction, an internal plan, precise contract reconciliation, implementation, bounded refactoring and correction of directly encountered task blockers, tests, owned disposable local fixtures, documentation, commits and non-force pushes to this branch. Work continuously through these activities. Do not stop after each component, test stage, failed attempt or internal checkpoint to ask for routine approval. A real external gate does not prevent independent authorized work from continuing.

Only ChatGPT/Technical Lead independently accepts, marks Ready or merges. Author self-review is evidence, never TL PASS. Do not resolve TL review threads, request a competing writer, ping Cursor/Grok, merge main, rebase, force-push, bypass protection or start a subsequent slice. Immediate review corrections use this same new session and generation.

The existing Official Truth writer stays “Official Truth integrated development pilot 1 — Generation 1”, session `01a11333-cbc2-7282-b194-27335e632c61`. Do not reuse that session/worktree for this task. This task has no dependency on unmerged #900.

## 2. Product outcome and why this task exists

Deliver one coherent manual editing experience for an EXISTING trip:

**Open the actual trip → choose direct editing in the existing “Reise ändern” surface → change supported basic details, dates and existing stages → understand every material consequence → explicitly confirm → save through the existing Guest/Account mechanism → see the independently confirmed current trip and continue in its Workspace.**

The current surface in `components/trips/ReiseAenderung.tsx` only creates proposals through `aenderungErzeugen` / `aenderungErzeugenGast`; both require the model path. `docs/REISEN.md` sections 7–8 explicitly leave the separate basic-details/stage form open. Deterministic operations, commercial protection and normal persistence already exist. #903 supplies point editing and the integrated day experience; it does not supply this manual trip-wide editor.

Differentiation impact: let people act on their own known trip facts without restating the trip or consuming a model call, while preserving the connected graph, protected bookings, honest consequences and explicit control. This strengthens the reliable Trip Workspace and reduces needless work. It is not a claim to invent manual itinerary editing.

TL market check on 7 October 2026: TripIt documents direct editing of trip dates/name/destination; Wanderlog documents date changes and moving itinerary places. Primary sources:
- https://help.tripit.com/en/support/solutions/articles/103000063279-edit-trip-itinerary-in-the-tripit-website
- https://help.wanderlog.com/hc/en-us/articles/4625659806363-Change-dates-of-a-trip
- https://help.wanderlog.com/hc/en-us/articles/5159751100443-Move-a-place

These are evidence of existing capabilities, not an exhaustive competitive test. Jetnity's reason for this task is its controlled graph-wide outcome. No uniqueness claim, parity backlog, new Guardian/What-if simulator or OP-02/Trip Audit closure follows.

## 3. Mandatory reconstruction and binding reads

Start with `JETNITY_START_HERE.md`, the TL/Cursor Operating Standard and its current handoff, `docs/ACTIVE_WORK_STATUS.md`, then live #751, this issue/TASK/Draft PR and the latest relevant review/continuity evidence. Verify actual main, operating mode, branch/head, merge-base, ahead/behind, complete diff, open writers, checks/Preview and relevant #748 MATERIAL before implementation. Live evidence wins.

Read the relevant portions of:
- `AGENTS.md`, `JETNITY_VISION.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md` (especially ADR-0059/0060/0061), `DESIGN_SYSTEM.md`;
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`, `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`;
- Product Differentiation Doctrine, Binding Build Order, V1 Binding Build Order, Product Quality, Logic, Continuity and Independent Review Depth standards;
- `docs/REISEN.md`, `docs/ORTE.md`, current four-mode Workspace navigation and Guest/Account contracts;
- merged `TRIP_PLAN_INTEGRATED_OPERATING_EXPERIENCE_1_TASK/CONTRACTS/REPORT/HANDOFF_2026-10-07.md` and actual #903 code; #897 temporal invariants as a consumer;
- actual `lib/reiseaenderung/{schema,anwenden,geschuetzt,diff,nutzlast,aktionen,erzeugen}.ts`, Guest storage, Trip readers and current migrations for `reise_aendern` and child-revision triggers.

The adjacent `DIRECT_TRIP_EDITING_1_TL_PRECHECK_2026-10-07.md` records the initial evidence and its limits. It is not a future gate certificate. A later main/head change requires fresh reconciliation; request TL-controlled synchronization only when actually needed, never silently import #900.

## 4. Binding scope decisions made by TL

| Area | Authorized outcome |
| --- | --- |
| Entry | A direct editing mode inside the existing “Reise ändern” surface. Reuse the four Workspace modes and existing show/hide/inert/focus behavior. The natural-language path remains independently usable. Opening or choosing direct mode triggers no model/quota/provider call. |
| Basic details | Set/replace title, budget TARGET in the trip's existing currency, pace, interests and a nonempty travel wish, within existing schema semantics and maxima. Display existing values and only emit intended changes. Interests may use the existing empty-array semantics. |
| Dates | Set the first explicit start date on a flexible trip or shift the existing start. Change total duration using existing operations. Calendar dates remain civil dates; no timezone, boarding, availability or elapsed-time authority is created. |
| Existing stages | Change the duration of an identified existing stage; remove a permitted existing stage. Show days, resulting date range and consequences. A repeated city/name is not a stage identifier. |
| Excluded field semantics | No new stage/place, origin editing, stage rename/reorder, traveller count, party/document/registry mutation, currency change, or new clear-to-null semantics. Existing `null` means unchanged where the operation defines it. Do not advertise or silently simulate unsupported clearing. Use the existing Preparation entry for people/documents if a link is useful. |
| One operation world | Translate strict manual input to the existing closed operations; reuse `operationenAnwenden`, schema validation, commercial protection and RPC payload rules. No full replacement graph supplied by the browser, second mutation engine, direct child-row batch writes or hidden JSON metadata. |
| Preview | Build from the actual accepted operations and actual before/after graphs. Supplement the existing concise diff where it omits material consequences, including interests-only and travel-wish-only changes. No LLM explanation is necessary to know what will change. |
| Persistence | Existing authenticated RLS client and `public.reise_aendern(jsonb)`; Guest uses the existing active-trip storage and mutation protocol. A small shared orchestration/readback helper or strictly validated manual action entry is allowed, with the same authority and RPC. |
| Location | Manual scope never changes locations. Preserve all existing stored place/coordinate/route facts from the authoritative graph. An unrelated title/date edit must not erase valid location facts because an unnecessary name-resolution request failed. Do not import client-provided place authority. |
| Downstream | The existing Workspace consumes the confirmed new Trip. Recompute existing date/route/coverage/attention/plan/cost/Preparation projections through their current consumers; reuse #903 impact helpers where semantically adequate. Do not rewrite Readiness conclusions, done state, provenance or external fact contracts. |

These decisions authorize implementation of the complete scope now. They do not delegate new product, identity, commercial or temporal-truth policies.

## 5. Workstream A — one safe editing session

Use one explicit in-memory edit session bound to trip identity, source (Guest/Account), authoritative base, form generation and accepted operations. Do not persist drafts in a new store, URL, log or telemetry. Ordinary field edits must not create writes.

The user can combine compatible basic, start-date and stage-duration changes into one comprehensible proposal. Overall duration and per-stage duration describe the same resulting trip: reconcile them visibly in the draft or reject a contradictory combination before preview. Do not silently stack two independent duration requests. Respect existing operation count/delta and graph maxima; do not chunk requests to evade a limit.

A no-op, unknown/cross-trip stage, last-stage removal, invalid civil date, impossible duration, empty required text, invalid budget, unsupported field or malformed extra property cannot produce an enabled save action. Validate manual input as untrusted at the actual write boundary as well as in the UI. Manual values are user-authored. Validate them through a strict manual subset using the existing Trip field constraints and operation bounds; do not silently apply model-only price stripping to a literal budget mentioned in a travel wish. A separate manual input validator is allowed, not a new operation kind or mutation engine. Preview, accepted operations and apply must carry the same validated meaning. Unsupported input must be rejected intelligibly, not silently truncated, emptied or rewritten.

Changes made after a preview invalidate that preview and its operation identity. Back to editing retains the user's draft. Cancel discards the proposal without a write. Closing/reopening the existing surface must have a deliberate draft/focus behavior and must never look like a successful save. A save-in-flight prevents conflicting edits and duplicate apply; delayed responses may not erase a newer draft, replace a different trip, or update a closed/replaced session as if it were current.

Keep the manual experience usable when the model is disabled, lacks a key, has exhausted its quota, is unavailable or its separate request fails. The free-text generation path retains its existing cost, quota and protection rules. Switching paths never starts generation implicitly or imports one path's old result into the other.

## 6. Workstream B — complete consequences and bounded compatibility fixes

The existing `reiseDiff` is not by itself evidence of a complete consequence preview. The new experience must show, in understandable groups with accessible expansion:
- original and proposed basic values, start/end and day counts;
- changes to each relevant existing stage and date/day placement;
- each removed normal plan point, identified with its day/stage context rather than title alone;
- each protected commercial/booked point that becomes unplanned when its day/stage disappears;
- protected points whose own dates remain fixed when the trip's dates move;
- material date/time/placement changes of surviving noncommercial points;
- uncertainty or a conflict actually derived by the current consumers, without claiming an airline/hotel reservation, price or official requirement changed.

Use exact identities internally; do not display technical IDs as product prose. All affected items remain inspectable at the existing graph maximum without a silent top-N truncation or one DOM node per hidden property. Counts mean unique items, not fields/reasons.

Commercial protection remains exactly binding: a protected item's factual content, dates, prices, provider references and booking state are not edited by this path. If its container disappears, the existing unplanned preservation rule applies. Ordinary unprotected contents can be removed by a confirmed structural operation; the user must see this destructive consequence before confirmation. No automatic cancellation, refund, rebooking, preparation completion or dependent cleanup is implied.

Targeted compatibility correction is explicitly authorized where the current shared orchestration/applier would violate this outcome. Known inspection risks to prove or refute:
1. `reindex` runs after any operation and can overwrite a #903 explicit item start date from its assigned day, even for a title-only change, while leaving its end date unchanged. A metadata-only change must preserve every unrelated temporal/placement value. Reindexing day/stage order or duration must not overwrite surviving points' explicit startsOn/endsOn/startsAt/endsAt from their container. The existing explicit whole-trip shift remains the operation that shifts eligible noncommercial civil dates together, preserving point interval relationships and nulls. Apply this small shared correction to the existing free-text path too; do not create a second manual-only date algorithm. Never repair a contradiction by inventing a timezone, clamping an explicit date or dropping an end field.
2. Unconditional place re-resolution on an edit that changes no location can clear stored canonical references during a lookup failure. Preserve authoritative existing location facts for this manual subset; do not weaken the model path's canonicalization.
3. The Guest apply interface historically checks revision but not explicit expected trip ID. A different active trip with the same revision must not receive a proposal intended for the previous trip. Check expected trip identity immediately after loading current storage, before the idempotency/revision branches, and bind both the manual and existing free-text caller.

Resolve verified task-blocking defects with the smallest shared correction and baseline/fixed regression evidence. Keep operation kinds, bounds, commercial protection, schema authority and persistence semantics intact. Existing stage/day structural semantics must be reconciled and documented against the accepted operations; surface their exact material effects. If making a requested edit truly requires a new operation, hosted schema, identity model or different protected-booking rule, keep that dependent capability pending and report the concrete gate. Do not weaken the TASK, hide a mandatory defect as optional, or stop independent work.

## 7. Workstream C — authoritative save, recovery and readback

Account preview/apply must use the owner-visible current Trip, normal authenticated session validation, exact trip identity and current revision. Client operations and revisions are claims; the existing SQL compare and transaction remain decisive. Preserve server-side ownership checks, RLS and the actual child-trigger revision behavior. A parallel #903 item edit must make an older trip proposal stale.

Use one stable mutation ID for one accepted proposal and its retries. A new proposal receives a new ID. Repeated confirmation or response loss must not produce duplicate days, apply a duration change twice, overwrite newer edits or adopt a different proposal under an old ID. Check the actual stored result before claiming a successful retry. The existing single lastMutationId is not an unlimited mutation journal: if a later mutation replaced it, an honest conflict/reconciliation is acceptable; do not invent proof of an earlier commit.

Success is not merely a resolved callback, an `ok` response without the expected result, a guessed next revision or an optimistic local candidate. After writing, perform an independent read through the existing authoritative Trip reader; verify identity and the committed result, then update/refresh the actual Workspace. New generated IDs need not equal preview-only IDs; their identity mapping and semantic equivalence must be proved, not assumed. Existing stable IDs and protected facts must match exactly.

A committed write followed by failed/unavailable readback is “confirmation unavailable”, not “nothing was saved” and not success. Preserve the proposal/mutation ID and provide a safe verify/retry path. Distinguish validation rejection, stale base, lost ownership/session, storage failure, confirmed saved state and uncertain outcome. Never infer rollback from a transport failure.

Guest uses its current active trip and the same pure operations. Verify expected trip ID and revision at the actual synchronous mutation boundary, not only before an awaited step. Preserve a newer active trip and reject cross-trip replays even when revision numbers match. Re-read persisted storage after the save for the accepted result; handle unavailable/full/corrupt storage and cross-tab changes. This task does not claim that localStorage gains a new globally atomic multi-tab transaction protocol.

Only the confirmed current Trip drives “saved” UI and post-save consequences. First load/reload without an actual before snapshot cannot claim historical changes. Persist no new change history.

## 8. Workstream D — integrated product behavior and accessibility

Deliver the real production components in the existing Guest and Account routes, not a special audit-only editor. Date and duration controls use calendar/day semantics and sensible existing bounds. Budget copy states target and original trip currency; no real-total, paid, per-person, nightly, FX or booking conclusion is implied.

Connect successful changes back to affected current days/stages and existing details using supported navigation contracts. Deleted targets have a useful current fallback. Preserve active Workspace mode where meaningful, return focus to a visible sensible control, keep hidden panes inert, and reject stale async navigation. Do not create a fifth mode or rebuild the #903 timeline/editors.

Exercise 360, 390, 768 and 1440 CSS-pixel widths, 200% text, keyboard-only flow, visible focus, field-linked errors, status announcements, reduced motion, long names/text and large valid trips. Touch targets and input text follow the design standard. Focus must not land on the old free-text textarea when the direct form is active. Opening/canceling/pending/error/success must be as usable as the default view.

Use existing styling/components and lazy boundaries. No new package, map/service call, public marketing change or workspace-wide cosmetic redesign. Describe any physical-device, WebKit or screen-reader coverage that was not actually run; browser emulation is not physical-device evidence.

## 9. File ownership and parallel operation

**Project mode: MULTI_AGENT with disjoint tasks; this task: SINGLE_WRITER integrated implementation.** Existing #900 is the other writer. Internal planning/review subtasks are permitted within the current session/budget with disjoint files; their self-review never becomes TL PASS.

Primary allowed new files:
- `lib/reiseaenderung/direct/**`, with focused pure/session/readback tests;
- `components/trips/ReiseAenderungManuell*.tsx` and `components/trips/ReiseAenderungAuswirkungen*.tsx`;
- `scripts/direct-trip-editing-1-audit.mjs`, `scripts/direct-trip-editing-1/**`, `scripts/db/direct-trip-editing-1/**`;
- `lib/reiseaenderung/direct-trip-editing-1*.test.ts`;
- task-owned `docs/DIRECT_TRIP_EDITING_1_{PLAN,CONTRACTS,STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-07.md` and `docs/evidence/direct-trip-editing-1/**`.

Allowed narrow existing integration edits:
- `components/trips/ReiseAenderung.tsx`, `AenderungVorschau.tsx`;
- `components/trips/TripWorkspaceUebersicht.tsx`, `TripWorkspace.tsx`, `GastArbeitsbereich.tsx`, `KontoArbeitsbereich.tsx`, only for this entry/session/navigation/readback;
- `lib/reiseaenderung/aktionen.ts`, `diff.ts`, `erzeugen.ts` for shared orchestration/types, neutral conflict copy and complete preview, without changing model routing/quota/generation authority;
- `lib/reiseaenderung/anwenden.ts` only for proved compatibility fixes described in section 6;
- `lib/trips/gastspeicher.ts` only for identity-bound reuse/readback of this mutation, including the existing free-text caller and its focused tests;
- focused existing tests directly covering the changed seams; `docs/REISEN.md` only to reconcile these specific now-implemented fields/flows, leaving unrelated historical entries untouched.

Read-only shared contracts: existing operation/schema/limits, `geschuetzt.ts`, `nutzlast.ts`, Trip schema/types/mappers, Place/Route/Traveller domains, #897 temporal kernels, #903 plan editors and projection implementations, SQL/RLS/migrations and Auth configuration.

Explicitly excluded: **all `lib/readiness/**` and #900-owned files, `package.json`, all lockfiles/dependency upgrades, `.github/**`, global governance/entry/handoff/roadmap/vision/ADR files and operating mode**, all hosted schema or application mutations, secrets, providers, registry, F8, tracking and retention. Do not add an npm script to the shared package file; the owned audit is run directly with Node. TL updates global continuity/#751 and any necessary global documentation from your precise proposed reconciliation in REPORT.

One branch/worktree/Draft PR; never change another writer's branch. Neither task is based on the other. Main synchronization and merge order are TL decisions after content acceptance; every changed head invalidates earlier exact-head gates. New main changes are a reason to report current ancestry, not to silently merge them.

## 10. Mandatory acceptance matrix

Report every row with implemented path, test/evidence and actual outcome. A helper/mock pass does not substitute for the required integrated row.

| ID | Required proof |
| --- | --- |
| A01 | Real Guest and Account routes expose direct editing and preserve the separate explicit free-text path. |
| A02 | With model disabled/unavailable, direct preview/save succeeds; zero model invocation, quota use and provider calls are evidenced. |
| A03 | Title, target budget/currency, pace, interests and nonempty travel wish use actual existing values and validated intentional changes. Interests-only/wish-only proposals and literal amounts in user text are covered. Unsupported clearing cannot look saved. |
| A04 | Flexible → dated trip, shifted dated trip, overall duration and existing-stage duration/removal show the correct resulting days/ranges. |
| A05 | Compound compatible edits yield one accepted operation set; contradictory totals, no-op, bounds, invalid dates and extras fail without writes. |
| A06 | Repeated stage names/cities, missing/deleted/foreign IDs and duplicate identities cannot select or remove the wrong stage. |
| A07 | Metadata-only changes preserve every unrelated date/time/placement and location fact, including explicit #903 item dates different from the assigned day. |
| A08 | Reindexing preserves explicit surviving point dates; whole-trip date shift preserves nulls and supported start/end relationships; protected commercial/booked dates and facts remain exact. |
| A09 | Stage/trip shortening lists removed normal content and preserved unplanned protected items completely before confirmation. Last day/stage and impossible graphs are safely rejected. |
| A10 | Preview accounts for all material changed fields and actual structural consequences. No hidden top-N loss or incomplete generic “all moved” claim. |
| A11 | Preview, cancel, mode switch and reopening perform zero writes; future-tense preview and confirmed saved UI are distinct. |
| A12 | Changing fields, source or trip invalidates an earlier preview/async result; pending locks all relevant controls; failure retains the intended draft. |
| A13 | Same active Guest trip saves, independently reads back and reloads; full/unavailable/corrupt storage does not produce success. |
| A14 | Guest switches to a different active trip with identical revision while old proposal is open/in-flight: neither trip is overwritten; same-trip stale revision is also refused. |
| A15 | Actual local Account browser → normal authenticated action → unchanged RLS/RPC → fresh independent reader/reload. Use synthetic owners only; no hosted application data. |
| A16 | Actual second owner/no session cannot read or mutate the first owner's trip; client-supplied identity/graph/authority cannot bypass the write boundary. |
| A17 | A real concurrent #903 item write changes the base; old macro proposal is refused without losing the newer point. Test stale base at the database boundary. |
| A18 | Double confirmation, response loss, stable-ID retry, changed proposal and later unrelated edit preserve one committed meaning with no duplicate days or false saved state. |
| A19 | Write acknowledged but readback fails/unavailable/mismatches: confirmation remains pending/uncertain, draft/mutation retained; explicit verification recovers truthfully. |
| A20 | Unchanged canonical locations survive the no-location manual path without new resolver authority, including catalog-read failure where relevant. |
| A21 | Current Workspace projections/navigation update after confirmed save; #903 explicit-time editing, protected-booking editors and currentness behavior remain correct. |
| A22 | Actual old free-text generation/proposal/apply behavior and its protections are regressions tested without requiring a paid call. |
| A23 | Keyboard/focus/inert, narrow widths/200% text, error/pending/success and large valid trips are tested through real production components. |
| A24 | Complete local quality suite and fresh exact-head Linux CI/Auth/Preview gates, truthful source/session/command evidence, unchanged TASK and scoped diff. |

Use baseline/fixed counterexamples for discovered shared defects. Native PostgreSQL/real local Auth/RLS checks are mandatory for storage/concurrency claims; a unit fake or in-browser substitute cannot be called native or authenticated E2E. Reuse the existing local disposable infrastructure used for #903, but prove this task's actual production entry points. Document any fixture-only support distinctly.

## 11. Verification, evidence and runtime bounds

Use repository Node 22 and installed dependencies. Run the normal typecheck, lint, full test suite, production build and all six relevant hygiene/mode commands (`check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`). Run focused operation/protection/Guest/Workspace regressions and the existing #903 integrated audit where the changed seams affect it.

Provide one directly runnable owned developer command `node scripts/direct-trip-editing-1-audit.mjs` that exercises the manual Guest and Account stories, negative/recovery controls and reports bounded sanitized results. Do not require a new package.json entry. The command owns and cleans up only its disposable local resources. Never reset another task's database, use a hosted project for fixtures or hide a missing prerequisite as a passing skip.

All final local commands need real exit status, totals, durations, environment and useful failure classification. Keep failed implementation/setup attempts distinct from final results. Do not increase timeouts, delete tests or suppress errors merely to make a gate green. Repeated testing should resolve actual risks or required gates.

Publication evidence must bind the exact final branch head/tree, unchanged TASK blob, full changed-file list, current main/merge-base/ahead/behind, actual GitHub Actions run/check execution, Auth check (not a secret-missing skip) and matching Vercel Preview. Distinguish workflow head metadata from any synthetic merge actually tested. A later doc-only commit still invalidates head-bound gates. A separately published final delivery receipt can bind a committed report to the final hash.

Evidence uses synthetic trips and bounded redacted outputs. No real account/trip/documents, tokens, cookies, local home paths, connection strings, raw SQL errors or public raw network/HAR bundles. Record enough provenance to distinguish captured production components, actual native/authenticated runs and test doubles; do not claim private raw logs are repository evidence.

## 12. Special gates and risk ownership

No new material cost, billing/retention choice, provider/model activation, API secret, hosted Development/Production write, migration, RLS/Auth/role/AAL change, real personal-data fixture, official-source campaign, registry/F8 activation, public launch or domain change is authorized. Existing protected gates in #395/#585/#626 and the USD-100/month boundary persist. `realOfficialSourcePilot=BLOCKED` remains owned by #900; it is not this task's blocker or deliverable.

Initial risks:
- **P0:** no identified P0 in this preparation; this is not a security certification.
- **P1:** accidental loss/overwrite of saved trip or protected booking facts, cross-owner/cross-trip application, hidden multi-step write or false confirmation. These are release blockers if reproduced.
- **P2:** incomplete preview, stale-session/retry behavior, explicit-date regression, location loss, stale downstream projections and accessibility failures. They must be resolved in scope before acceptance.
- **P3:** nonblocking polish or documented untested physical-device coverage; classify honestly, do not downgrade correctness.
- **Separate #900:** current R3 native CI failure and independent review remain open; this branch must not “fix” or suppress them.

Stop only the dependent path for a concrete missing special authority/access or a real contract impossibility; continue all independent in-scope work. Report the exact fact, existing gate and minimum required decision. Routine implementation choices and regressions inside this assignment do not need a new PO approval.

## 13. Required deliverables and final stop

Deliver working product code, focused regressions, one complete integrated audit and:
1. PLAN with internal phases and file ownership;
2. CONTRACTS with field/operation mapping, temporal/placement consequences, transaction/readback/session identity, unchanged boundaries and any proved minimal compatibility fixes;
3. STATUS and REPORT with A01–A24 evidence, code paths, test outcomes, security/data/cost/performance/mobile findings, actual current refs and remaining risks;
4. SELF_REVIEW clearly labeled author evidence;
5. HANDOFF with exact logical name/generation, observed actual Codex session/model/reasoning, starting and ending refs, commands, review-fix identity, current next step and final receipt link;
6. an exact, narrow proposal for any global docs/index changes for TL to persist without conflicting edits.

Use **DIRECT_TRIP_EDITING_1_READY_FOR_TL_REVIEW** only after actual complete delivery; otherwise use PARTIAL/BLOCKED with the first unfinished acceptance row. Neither marker changes GitHub Draft or constitutes acceptance.

Then **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**. Same session handles TL changes. Only TL decides content acceptance, controlled main sync, full renewed gates, Ready and merge. No automatic next task.
