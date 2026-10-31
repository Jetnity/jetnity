# Jetnity UX V1 U1-C Route Design Alignment 1 — immutable TASK V1

28 October 2026, Europe/Zurich. Tracking #1081; parent #1064, remaining visual acceptance #1067. Product Owner now explicitly asks Work to compare original design with actual site and take over bounded Cursor coordination. Former TL confirmed no active Workspace writer/no U3-A dispatch and will not run parallel integration.

## Baseline and objective
Verified main 8fc72a18390af1650d6902fb2a20a64e4f7f8ccc, tree24770e02bd176f06040ccaf515783534ca5c83e6, mode NORMAL. PR1080 is merged; its accepted head e20de0ba488e9bcf834f3f586d580242548b3756 and post-main receipt6476307183 are history, not full UX acceptance. Actual Production dpl_RQ5MiR7hVKrxhW3KF55pw2KZCmZ1 serves jetnity.com with same SHA.
Existing four-mode shell, split route/day detail, mobile Zur Route, history/focus/editor handling must be retained. Correct remaining VISUAL/INTERACTION divergence from the original Work design; do not build a second Workspace.

Reference artifacts in this branch:
- docs/evidence/ux-v1-u1c-route-design-alignment-1/original-work-specification.txt (original 12-page text, immutable evidence)
- docs/evidence/ux-v1-u1c-route-design-alignment-1/original-reisecockpit.html (synthetic standalone mock, immutable evidence; open at desktop/mobile)
These are design references, NOT executable production logic or proof of supported provider/storage functions. The mock adapts to dark surroundings; public product stays approved warm/light Jetnity theme, existing tokens. Do not add dark mode or copy fake mock data into runtime.

Fresh independent visitor reproduction: home → normal manual planner → Bangkok city / Ko Chang island / Phuket city, Zurich explicitly selected, 15Nov–6Dec2026. Enable explicit day allocation: Bangkok16–22Nov, KoChang23–29Nov, Phuket30Nov–5Dec. 22 dates with days1/22 unassigned. Current route expands all daily chips and duplicate stage summary; phone requires horizontal daily scrolling. Planned days still appear with "Aufenthalt noch nicht festgelegt". At390x844 scrolled route, BackToTop rect x322..366/y776..820 overlaps fixed navigation y791..844. Organizer not visibly visit-scoped (U3-A #1068 stays queued). No personal session or account mutation used.

## Single writer / two-stage dispatch
Decision SINGLE_AGENT: route presentation, selection and return share one state; no parallel shell writer.
Exact logical name: **Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1**.
Use one NEW genuine Cursor Cloud session; actual run-info.originalModelName **grok-4.7-high-fast**, no Auto/substitute. Record actual model/session/name evidence; use rename/re-read if exposed. Do not invent unavailable runtime evidence. Model mismatch/unavailable mandatory capability: STOP and report.
Read AGENTS, Operating Standard, #751 latest, #1064, #1067, #1068, #1081, relevant vision/architecture/decisions/design/quality/logic/continuity and source/tests.
FIRST post PRE-CODE PLAN with exact branch/head/tree/main/merge-base/ahead-behind/mode/session/model, file ownership, state/selection strategy, desktop/mobile sketch, retained contracts, tests and risks. Commit task-owned PLAN/STATUS if needed. Then STOP for explicit TL plan acceptance. No runtime edits before that receipt. Immediate review fixes stay in this session. No Ready, merge, deployments, follow-up or second writer.

## Accepted product direction / required behavior
1. Default route is compact, chronological and visit-first, with labelled selectable stops and relevant existing connections. Desktop route left / ONE selected detail right where measured space suffices; narrow layout route → focused detail → Zur Route. Preserve the existing four labelled top-level modes. No admin sidebar or fifth main tab.
2. A 22-day journey should NOT expose 22 equal-weight day chips in the initial route and then duplicate all stages underneath. One compact entry per canonical chronological run/occurrence; selected stop opens its days/detail with an accessible day chooser. All dates remain reachable by keyboard and touch without compulsory horizontal swiping. Previous/next chronology remains intact. Do not hide information behind clipping or remove day access.
3. Use canonical IDs and N12 chronology; two Bangkok visits remain distinct. Non-contiguous runs of one stage must not be silently collapsed across intervening days; unassigned runs remain in calendar order. Never infer arrival/departure/hotel nights from assigned days. It is safe to show "Geplante Tage:16.–22.Nov." from explicit day assignment, clearly distinguished from lodging dates. Use real stored stage dates when present with honest semantics.
4. Include visit identity, country when verified, readable date/unknown context, clear selection and next action. Avoid repeated empty stage summaries and repeated long warnings. Full labels visible without hover. Country unknown stays unknown. Explicit role/flight/transfer data can label travel time; unassigned first/last dates MUST NOT automatically become Hinreise/Rückreise. F01 persistent travel roles are excluded.
5. Connection entries use the EXISTING first-party adjacent connection identities/derivation. Bangkok→KoChang→Phuket yields the two internal neighbors, no all-pairs shortcut. No guessed travel date/duration/mode/price/availability/covered state. If safely connecting selection to existing organizer requires new context contracts outside approved scope, identify exact minimum in PLAN and STOP for TL amendment; do not ship a misleading inert selector. Existing 12Go remains explicit external generic search with manual route/date. No live provider loading.
6. Stop/day/item selection and return preserve existing canonical state, URL/back/forward/reload, focus and scroll. Removed/reordered IDs invalidate honestly; repeated city names never select a different visit. Existing six item kinds and no-day entries, draft validation and unsaved editor recovery survive.
7. Keep useful content higher on the page with the approved compact heading. Move destructive discard/delete behind clearly labelled Reiseoptionen with the existing concrete confirmation; do not change deletion behavior/storage. Existing title/date/route and Reise ändern stay obvious; guest/account storage truth stays visible. No new account flow or global marketing redesign.
8. Fix reproduced BackToTop/navigation overlap. Respect live navigation height, safe-area, root text and layout modes; no fixed magic offset that fails when nav wraps. Either safely position or hide the optional floating control in the conflicting Workspace state. Preserve keyboard access to primary navigation and existing non-Workspace behavior.
9. Responsive behavior is measured, not device-name-only. At320/390/768/1440 and inherited280/360/430, no normal-content overflow, hidden actions, clipped focus or unwanted double mount. 390 normal type compact bottom navigation; narrow/enlarged text may use readable flow. Existing accepted sticky containment stays. Touch targets per design system. No new provider requests on select/tab/resize.
10. Do not claim complete UX V1 after this slice. U3-A #1068 visible organization context, broader U4 #1069, F01 travel intent and provider gates remain separate.

## Allowed write paths
- components/trips/TripWorkspacePlan.tsx
- components/trips/TripWorkspace.tsx, minimal presentation callbacks/selection glue only
- components/trips/TripWorkspaceKopf.tsx, limited compact options placement
- components/layout/BackToTop.tsx, only reproduced Workspace overlap
- new components/trips/TripWorkspaceRoute*.tsx or TripWorkspaceReiseoptionen*.tsx if needed for clear extraction
- new lib/trips/ux-u1c-route-design-alignment-1/** pure presentation helpers/tests
- scripts/ux-u1c-route-design-alignment-1/**
- docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_{PLAN,STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-28.md
- sanitized task-owned evidence under docs/evidence/ux-v1-u1c-route-design-alignment-1/ (original references immutable).

Before-code PLAN must enumerate exact files. Any change to lib/trips/workspace-mode.ts, lib/trips/detail.ts, provider/search components, existing route/mobility contracts, header/nav or other path requires TL reviewed amendment FIRST. Do not relax old tests or broad-format shared source.
READ ONLY all storage/writers/forms/DB/Auth/RLS/Official Truth/provider adapters/API/search contracts/packages/workflows/env/infra/global continuity. Do not alter ReiseAenderungManuell duration semantics to make route screenshots look right.

## Additional finding to triage only
On a fully unassigned22-day guest journey, editing Etappendauer to7+7+8 retained22 unassigned days and produced44days after preview/explicit save. This is NOT asserted as silent save or PR1080 regression. Explain existing duration-vs-allocation semantics and propose a separate bounded issue if needed; no domain/storage correction in this presentation slice. Original manual day allocation successfully yields22days.

## Tests and delivery
Start with the actual normal manual guest creation flow above, then same-country, repeatedBangkok and genuinely unknown/unassigned cases. Mount real Workspace for controlled fixtures:22days, repeated occurrences, same-day transfer+stay, no-day/six kinds, chronological prev/next, reorder/removal, query/history/reload, pending editor failure, route/detail/back focus, root200% reflow. Show side-by-side before/after screenshots of SAME dataset/viewport; HTML mock as reference, not data seed.
Independent verification must include geometry and clickability for nav/BackToTop, usable day selection without horizontal scrolling, route→detail→ZurRoute, selection highlight and dates. Record actual browser/viewport/version/time. Root32px is NOT true browser zoom; report browserzoom/physicalSafari/VoiceOver as untested unless truly run.
Retain provider/search single mount and no passive requests using controlled instrumentation; no real provider API or paid calls. Run focused meaningful regression tests, typecheck/lint/hygiene/build and required native exact-head App/Auth CI plus exact Preview identity. Preview READY is not browser acceptance. Every changed head resets gates. Preserve any baseline limitations honestly.
Final exact-head STATUS/HANDOFF/REPORT/SELF_REVIEW with changed files, main drift, native checks, sanitized evidence and open limitations. STOP for independent TL review. No Ready/Merge/follow-up. TL separately verifies and controls protected SHA-bound integration and actual-main post checks.

## Hard boundaries
#917 readback STOP; #985/#982 HOLD; #968 Preview/Production credential/isolation PO gate; #748 personal CUA SUSPENDED; #1073 GYG privacy P1; #1059 rental Preview BLOCKED; #1079 Viator genuine Sandbox BLOCKED; Trip.com#1056 HOLD; 12Go attribution not proved. Never retry denied operations through another route.
No Auth/RLS/SQL/provider activation/keys/secrets/paid calls/booking/payment/contracts/indexing/public launch or new recurring services. Preserve prelaunch noindex and <=USD100/month. No private data/screenshots/session archives/machine paths in GitHub. Existing synthetic guest creation allowed; Production account writes forbidden.
