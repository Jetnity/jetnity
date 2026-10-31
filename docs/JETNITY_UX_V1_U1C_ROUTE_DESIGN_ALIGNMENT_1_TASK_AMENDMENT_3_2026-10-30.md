# U1-C — Technical Lead amendment 3: integrate the released Workspace without function loss

30 October 2026, Europe/Zurich. PR #1082 / tracking #1081 / parent #1064. This is an additive versioned task amendment; TASK V1 and amendments 1–2 remain immutable historical contracts. Current explicit Product Owner instruction: analyse live state, decide and start Cursor independently. This authorizes the bounded source work below, not special Production/account/provider gates.

## Independently reconstructed baseline

- Protected main: `ac2199dba64e458a20a155b5d1bb826ea99949d3`, tree `b0557fe704d3bab9d4d74031e0d4909a06ed6327`, mode NORMAL.
- #1092 unified Workspace is merged at `6b929baec81e6c561142db4e6a9636e1bb30c873`; its own accepted develop-account/guest checks and post-merge receipt are in #751/6521948798. Do not repeat its implementation as unfinished work.
- #1093 light default / Green-Light switch is merged at current main. Current-main push CI41060421679 App124078457849 and Auth124078458070 independently return completed/success. Vercel `dpl_7JmKTqXFcutRyve8Gn4wW8otf9oS` independently READY, production/main/exact SHA, jetnity.com alias and aliasError null. Deployment metadata is not new browser acceptance.
- U1-C PR #1082 remains OPEN/DRAFT and GitHub reports mergeable=false. Frozen author head before this amendment: `f2ff4928c551125b250706793195ee849fce0ce6`; merge-base `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc`; 8 ahead / 32 behind current main; 32 changed paths. Old green CI/Preview does not gate a future integrated head.
- Main `components/trips/TripWorkspaceKopf.tsx` blob `edc834270617a7e230f23697d2db624ba913bcbb` was read independently. Its Workspace-specific early return renders kopfzeile but not U1-C's reiseoptionen. U1-C moves guest discard/account deletion into reiseoptionen. Cross-PR P2 risk recorded at #1082/6520929459: naive integration can hide both real actions. This is an integration risk, not a proven current Production incident.

## Ownership and suitability

SINGLE_AGENT for this lane: route selection, header options, focus/history and mobile geometry require one coherent writer. Resume the SAME original Cursor session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`, logical name **Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1**. Existing attested model is grok-4.7-high-fast; re-attest actual run-info rather than inferring it from this task. No new generation, no Auto or silent substitution. If session/model cannot be verified, report the capability blocker before code.

The separate 12Go PR #1086 can proceed only in its existing exclusive provider-owned scope; it must not touch this lane. Do not take over Viator, DiscoverCars, shared consent or widget-host work. No new U3-A #1068 writer, broad redesign or automatic follow-up is authorized.

## Accepted bounded continuation

1. Fetch origin/main and this branch; verify current heads, mode and ownership. Post a genuine PRE-CODE plan identifying integration conflicts and exact owned paths, session and model. The finite implementation sequence in this amendment is TL-approved: after this receipt proceed within scope, without an unnecessary plan-only stop. New shared contracts or paths still require explicit TL amendment.
2. Integrate pinned main `ac2199dba64e458a20a155b5d1bb826ea99949d3` into the existing PR by ordinary non-force merge. Resolve conflicts intentionally, never select whole-file ours/theirs blindly. Preserve the released WorkspaceShell, light default, Green-Light toggle/local preference, four modes, header actions, account menu, mobile drawer and both planning entry paths. If main materially advances again, report drift and retain the pinned integration; no arbitrary rolling chase or main writes.
3. Complete the compact chronological visit-route already commissioned in TASK V1: all 22 dates reachable without 22 equal-weight initial chips, repeated visits distinct, unknown/unassigned days in chronological order, one selected detail, true adjacent connections only. Preserve accepted R1–R5 corrections, truthful date/booking labels and ambiguity refusal for repeated same-stage-ID boundaries.
4. Fix the explicit no-loss integration: render the existing guest discard/account trip-delete actions in an accessible Reiseoptionen disclosure in BOTH relevant header variants. Keep save errors and storage truth immediately visible. Preserve existing confirmation, handler, routing, ownership and storage semantics; no new delete implementation or automatic confirmation.
5. Preserve URL/kante/day/item selection, browser back/forward/reload, removed IDs, unsaved editor recovery, keyboard return focus and scroll. Keep Reise ändern and supported Konto-Reisebegleiter in the released header; no added guest AI capability or live model call.
6. Reconcile BackToTop with actual new mobile navigation geometry and safe area. One spacing owner; no double offset or hard-coded device workaround. Light and green presentation must both remain readable, including new route/options/detail surfaces.
7. Repair the existing task-owned hard-coded `/opt/cursor/artifacts` test-output path using an explicit output option or OS temporary directory. Preserve all assertions and disclose old environment limitations; do not weaken geometry or test thresholds to make CI green.

## Exclusive allowed writes

All original TASK/amendment 1–2 paths remain permitted only for their bounded purpose: TripWorkspace/Plan/Kopf/Route, GastArbeitsbereich/KontoArbeitsbereich slot placement, BackToTop, approved workspace-mode presentation selection and corresponding tests, task-owned helpers/scripts/docs/evidence.

Additional narrow permission: `components/workspace/workspace-surfaces.css` solely for new U1-C route/option/detail styling in the existing light/green variants, where existing classes cannot express the correct presentation. No palette redesign, global token change or theme-preference logic change. Name any needed CSS selectors in the pre-code plan. Read the existing actual WorkspaceShell for tests; do not modify its authentication/navigation/theme behavior.

Integration brings reviewed main files into branch ancestry; that is not permission to edit unrelated files. Global continuity remains TL-owned except the already permitted concise additive U1-C pointer. Original reference files and old test failures remain preserved. No package/lock/workflow/timeout changes. No provider, consent/CMP, apps/widgets-host, Auth, Supabase/SQL/RLS, secrets, Vercel environment, DNS, payments, terms, email or launch changes.

## Acceptance evidence before TL integration

- New exact head/tree, pinned integrated main, merge-base/ahead/behind and complete changed-path list.
- Reproduce the combined UI with the REAL WorkspaceShell and TripWorkspace, not only the old standalone harness. Synthetic local guest/account-prop fixtures are allowed; label them as synthetic, not signed-in hosted acceptance.
- Guest discard and account trip-delete reachable by keyboard and touch in both themes; cancellation calls no destructive handler, intended confirmation uses the original handler exactly once. No Production account writes. Hosted account tests require separately verified branch-specific develop authorization and must not borrow another branch's env/credentials.
- Normal 22-day journey, several places in one country, repeated visits, A-B-A-B repeated stage IDs, unassigned first/last dates, unknown dates, six item kinds/no-day entries, missing/reordered/removed selections, editor cancellation/failure, actual back/forward/reload and focus restoration.
- 320/390/768/1440 widths and 200% root text, light and green, header actions, route/detail/back, no clipped focus or overlapping BackToTop/navigation. Distinguish root text, true browser zoom, physical devices and VoiceOver.
- No passive provider/model network requests or duplicate provider mount on navigation, theme changes, resize or selection. No actual third-party search/API call.
- Focused regression tests, typecheck, lint, hygiene and build; new native exact-head App/Auth CI and Vercel Preview identity. A READY Preview alone is not functional browser PASS. Report unavailable hosted gates honestly; do not stop useful local integration merely because those external gates remain closed.
- Updated task PLAN/STATUS/REPORT/SELF_REVIEW/HANDOFF with sanitized evidence, failing cases and remaining P0–P3. Source delivery is not FINAL PASS and does not close broad UX acceptance #1067/#1069.

## STOP and authority

**do not mark Ready; do not merge; do not start a follow-up slice.** Stop after the bounded delivery for independent Technical-Lead review. Every new head invalidates previous exact-head gates. Immediate review fixes stay in this same session.

Preserve #917 denied hosted-readback STOP, #985/#982 HOLD, #968 preview isolation and branch-specific authorization boundaries, #748 personal browser/CUA suspension, #1073/#1087 consent gates, Trip.com HOLD, noindex and USD100/month ceiling. No personal-browser state, real traveller data, credentials or raw session evidence in public GitHub. Closed #1092/#1093 work is retained, never replaced with the old shell.
