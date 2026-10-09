# Trip Workspace Contextual Editing UX 1 — Binding Integrated Implementation TASK

Date: 9 October 2026
Issue: https://github.com/Jetnity/jetnity/issues/907
Repository: Jetnity/jetnity
Owner: Trip Workspace Contextual Editing UX 1 — Generation 1, dedicated NEW Codex Desktop session and worktree
Authorized branch: feat/trip-workspace-contextual-editing-ux-1
Precheck baseline: main 2ee48bcd40ba9c056898474a2eab87d0ce0d91ca (after #905 merge)
Status: ONE BOUNDED INTEGRATED PRODUCT / UX ASSIGNMENT; NO AUTO-MERGE OR SHARED-CONTRACT CHANGES

## 1. Goal and Product Owner authorization

The Product Owner explicitly authorized two substantial parallel workstreams on 9 October: Trip Workspace and Official Truth. This task is the Trip Workspace writer ONLY. Deliver a polished, progressive, contextual, mobile-first editing flow for EXISTING trips, improving the live direct-edit experience rather than building another travel planner.

Real supplied production screenshots: the current long in-page direct-edit form pushes the overview far below the fold; the sticky four-tab Workspace navigation sits close to and can visually interfere with form content while scrolling. This is UX evidence, not an assertion of failed persistence, bad data or a broken user session. The goal is a single intuitive flow that keeps trip context, draft, impact, confirmation and the active Workspace location clear on desktop, tablet and smartphone.

One owner implements the ENTIRE connected assignment without recurring routine questions: plan, inspect, code, focused tests, browser/device emulation, errors/retries, docs, commits/push to this branch, CI troubleshooting, final evidence and handoff. Each phase is an internal checkpoint, not a fresh approval gate. No premature stop after a plan or first screenshot. Only Technical Lead independently reviews and controls Ready/main-sync/merge and postmerge verification.

## 2. Mandatory fresh reconstruction

Read JETNITY_START_HERE.md, TL Operating Standard, Binding Slice Precheck, Multi-Agent Planning Standard, Product Differentiation Doctrine, Binding Build Order, latest ACTIVE_WORK_STATUS, actual #751 and #748 newer MATERIAL; verify live main/branches/PRs/CI/Vercel/mode. Read issue #907, this immutable task, PRECHECK and STATUS. Current main 2ee is the PREPARED baseline, not a forever-current assumption. Never reset another writer or overwrite unpublished files. Record actual author session and model/reasoning metadata from execution; do not invent. If the future actual main moves, preserve work on this branch, do not merge/rebase/main-sync yourself; TL later reconciles.

Specific existing implementation: merged #902/#903 trip-plan, merged #904/#905 direct-trip-editing A01–A24 including A09 v1.1 valid/invalid Preparation reference, trip data schema/Guest/Account session/readback and existing four Workspace modes. Read ADR-0163 through ADR-0167, docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md, docs/DIRECT_TRIP_EDITING_1_CONTRACTS_2026-10-07.md, and actual code/tests before designing. Verify exact production screenshots only as user-provided visual reference. Treat all pre-existing protected booking/Preparation, route/traveller and ownership/identity contracts as FROZEN.

## 3. Required whole user journey

Workspace overview / trip header -> obvious Edit entry -> focused editing surface -> structured groups Grunddaten, Zeitraum and vorhandene Etappen -> see complete factual impact before acceptance -> explicit single confirmation -> Guest or Account save through the CURRENT authoritative path -> independent readback -> return to right Workspace context without searching. Existing "In eigenen Worten" remains accessible with truthful proposal-only semantics and without calls from direct editing.

Choose and IMPLEMENT the best accessible navigation design based on actual source: desktop could be an anchored contextual workspace pane or controlled surface, smartphone a full-width/focused progressive sheet/page. The user must never need to scroll through a giant open form to find a saved trip's next action. Do not invent a fifth top-level Workspace mode or duplicate trip data. Separate draft, prospective preview, in-flight, uncertain, error and confirmed states visibly and faithfully.

Navigation and sticky layers: preserve the FOUR current top tabs, active tab visibility, the header and travel summary, and appropriate scroll anchor; ensure no heading, field, validation error, drawer edge, button, screen-reader announcement or focused control is hidden behind sticky tabs/header. Respect device safe areas and browser zoom. Do not add a second conflicting sticky navigation or inescapable fixed footer. Existing focus restoration/inert/hidden semantics and scroll helper must be reused or corrected in a bounded way, NOT disabled to get tests green.

## 4. Scope and strict ownership

Owned source surfaces (only where needed):
- components/trips/TripWorkspace.tsx, TripWorkspaceModeNavigation.tsx, TripWorkspaceNavigation.tsx and narrow TripWorkspace* UI composition/seams;
- components/trips/ReiseAenderung.tsx, ReiseAenderungManuell.tsx, ReiseAenderungAuswirkungen.tsx and new task-local UI components under components/trips/TripWorkspaceEdit* or ReiseAenderung*;
- existing lib/trips PRESENTATION / focus / scroll / IA helpers and targeted UI behavior tests when necessary;
- isolated task-owned UX audit runner and browser/regression tests under scripts/trip-workspace-contextual-editing-ux-1/ and task-specific docs/evidence;
- only task-owned PLAN, CONTRACTS, STATUS, REPORT, SELF_REVIEW, HANDOFF, and test evidence documents.

Forbidden: lib/readiness/**, scripts/official-truth-*/**, scripts/db/official-truth-*/**, Official Truth registry, authority, provenance and sources; no shared package/lock/npm deps, app layout/global CSS, existing DB migrations/SQL/RLS/Auth/identity/ownership, trip serialization/persistence semantics, booking/route/pricing/eligibility/fact/retention, provider contracts, global governance/index docs, or production/hosted writes. For an unavoidable out-of-scope shared edit, retain all in-scope independent work and report precise blocker to TL; do not silently expand ownership.

No new external services, credentials, costs, paid APIs, telemetry on personal travel text, or direct Production change. Budget remains <= USD 100/month. Owner and production gates remain.

## 5. User-facing behavior — mandatory

- A usable/editable trip context remains recognizable: destination/title, departure/end dates and location within current Workspace. Do not display unsaved input as already accepted truth in the trip header.
- Progressive and discoverable editing without burying itinerary overview: clear groups and active context; on mobile thumb-friendly spacing and reachable Confirm/Back/Cancel controls; no excessive permanent vertical form when no edits are active.
- Existing direct-edit fields preserve exact allowed canonical meaning (title, budget in unchanged currency, pace, interest, wish, start date, total duration and allowed existing-stage duration/removal). No new write contract, no silent clearing, no default citizenship/passport, no model rewriting.
- Complete preview renders prior/proposed values, ALL impacted stages/days, every removed ordinary point, booking/unplanned retained protected items and legal Preparation-reference impossibility. May progressively disclose large detail, but totals, categories, warnings and access to all elements are complete and honest.
- Explicit confirmation required; Preview/back/cancel = zero writes. On successful confirmed save display independently READ committed content and return user to correct saved Workspace area; no stale-success while account refresh pending.
- Guest storage and Account authenticated RPC/RLS route must stay unchanged, with same trip ID and revision binding, mutation identity/idempotence, lost-ACK/uncertain readback and stale drafts.
- Support no-op/error/validation/stale/conflict/unknown/timeout/retry without lost input or invented certainty; pending and uncertainty must block competing mode/nav actions as before.
- Preserve the "In eigenen Worten" mode and its existing expensive/model-supported activation rules; direct mode issues NO model, quota, catalog, provider or network request.
- Keyboard/screen-reader semantics: meaningful labelled regions and headings, correct dialog/focus management if a modal/sheet is chosen, Escape/Back handling according to pending protection, focus restoration to initiating trigger, reduced-motion, touch target >=44 CSS pixels, 200% text, no keyboard trap or unintended background focus.
- No layout shift/scroll jump on open, preview, confirmation, back, browser refresh, tab switching, or for nested affected-item details; do not auto-scroll into unrelated overview.
- Same underlying IA and operation semantics on every device; no desktop-only product truth. No claims of physical-device or assistive-technology tests not actually executed.

## 6. Required integrated engineering phases

Phase A — executable PLAN/CONTRACTS, actual component map and initial failing screenshot/browser reproduction. Identify sticky offset and focus root cause with real browser viewport geometry before changes; test baseline 360,390,768,1024,1440 plus 200% text and safe-area. Document alternatives considered and why selected solution reduces cognitive load.

Phase B — implement coherent contextual edit surface for desktop AND mobile, progressive groups and completion feedback; integrate existing actual callbacks/visible state. Preserve existing four-tab IA and other Workspace panels.

Phase C — implement correct scroll/anchor/tab/keyboard/a11y layers; compare before/after actual screenshot geometry; no hidden controls behind sticky bars or horizontal overflow.

Phase D — full A01–A27 regression matrix, including all old #903/#905 behavior, Guest and real locally authenticated Account browser test execution, repository full tests/Build/hygiene and tight failure-injection.

Phase E — sanitized evidence, source-backed actual code fingerprints, all final changed files enumerated, PLAN/CONTRACTS/REPORT/STATUS/SELF_REVIEW/HANDOFF, original screenshots vs new screenshots for multiple devices. Commit/push without force ONLY branch; final exact-head CI/Auth/Preview. STOP for independent TL review.

## 7. Binding acceptance criteria (A01–A27)

A01. Existing Workspace overview opens and the trip identity/date context is visible before editing.
A02. User can start contextual editing with obvious labelled action, from Guest and Account.
A03. Mobile 360px experience has focused progressive layout with no always-open giant form.
A04. Desktop 1440px displays trip context alongside or immediately accessible from edit task.
A05. Tablet 768px has fully usable responsive flow, not a clipped desktop copy.
A06. Actual top navigation never covers focused fields, headings or preview after scroll.
A07. No horizontal overflow at 360/390/768/1440px in ordinary and 200%-text modes.
A08. 200% text, reduced motion and minimum touch targets in open/preview/confirm/error flows.
A09. Real keyboard-only edit, preview, Back, confirmation and focus restoration.
A10. Screen reader semantics inspected: labelled regions, active step, error and success announcements; do not claim real screen-reader run if absent.
A11. Title/budget/pace/interests/wish stay exact and unchanged validation rules persist.
A12. Start date/duration/stage editing/valid removal work with same graph semantics.
A13. Unreferenced removal allowed and protected unplanned items remain intact.
A14. Preparation-linked impossible removal refused for Guest and Account with no write, intact draft/graph.
A15. Preview truthfully enumerates all material changes and distinguishes possible/proven temporal conflicts and unknown coverage.
A16. Large 1000-item case includes complete inspectable consequences, bounded visible pages and stable browser performance.
A17. Preview/back/cancel results in ZERO localStorage/RPC POST writes and preserves draft.
A18. Confirmation writes exactly once, followed by independent stable committed-graph readback.
A19. Booking IDs, locked booking dates, protected route/places and Preparation truths remain unchanged.
A20. Guest saved flow persists after reload and cannot apply to a different active trip with same revision.
A21. Real locally authenticated Account/RLS/RPC test proves exact committed graph after reload.
A22. Lost ACK / uncertain readback / retry remains truthful and idempotent; no fabricated saved status.
A23. Concurrent revision and stale session fail closed without clearing user input.
A24. Under pending/uncertain state users cannot silently switch modes/close with unsafely discarded state.
A25. Existing "In eigenen Worten" works and direct flow causes no model/quota/provider activation.
A26. Existing #903/#905 navigation/plan/attention/Trip Workspace regression scenarios pass, including tab scroll behavior and action anchor.
A27. Final published head has independent Linux CI tests (zero fail/skip), Typecheck, Lint, hygiene, Build, actual Auth comparison, exact-head Vercel Preview, bounded browser screenshots/evidence; no false Production E2E claim.

## 8. Completion, non-goals and delivery

Report user-observable UX benefits, measured scroll/focus states, screenshots, all 27 criteria with links to source/tests, actual browser/user source/no synthetic-success claims, what stayed unchanged, and environmental limitations. Full integrated code and tests, no demo-only UI. Do not update global governance or current #751 directly; TL owns authoritative handoff and main changes.

PR stays DRAFT. No author main synchronization, rebase, Ready, merge, Production, followed task, or independent autopilot authorization. Final line:
TRIP_WORKSPACE_CONTEXTUAL_EDITING_UX_1_READY_FOR_TL_REVIEW
STOP FOR INDEPENDENT TECHNICAL LEAD EXACT-HEAD REVIEW.
