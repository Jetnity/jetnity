# Jetnity Account Home and Export Completion 1 — Cursor Generation 1

**R109-K · TASK V1 · 26 October 2026 · immutable Technical-Lead assignment**

## Goal and source-confirmed need

Close real Account overview/calendar/export gaps. Existing home/world readers load only the latest200 updated trips, while next-trip/all-planned-places copy overstates scope. AccountUebersichtLive captures local day only on mount. Settings export is a bare navigation link, sending failure responses into rawJSON. The13-table export uses range pagination without deterministic order.

Recent booking-folder/traveller/visit-management/My-Trips work is already delivered; do not rebuild it or expand profile/identity features.

## Exact owned files

- app/account/page.tsx; app/account/welt/page.tsx; app/account/settings/page.tsx.
- components/account/AccountUebersicht.tsx; AccountUebersichtLive.tsx.
- components/account/AccountWeltKarte.tsx ONLY coverage wording/props; geography and interaction semantics frozen.
- lib/account/naechste-reise.ts and lib/account/naechste-reise.test.ts.
- lib/account/account-home-premium-overview-1.test.ts; lib/account/uebersicht-grenzen.test.ts.
- lib/account/datenexport.ts and lib/account/datenexport.test.ts ONLY deterministic pagination/integrity, preserving frozen export fields/table/schema/owner/cap contracts.
- New components/account/account-home-export-1/**, lib/account/account-home-export-1/**.
- scripts/account-home-export-completion-1/** and own docs/evidence.

FREEZE lib/trips/daten.ts and all trip writers/schema/types, Account Registry/booking/visit writers, Auth/MFA/session/logout/deletion implementations including KontoLoeschen.tsx, export API route, privacy policy, DB/RLS and all shared CSS/packages/workflows. No new download endpoint/storage service.

## Acceptance A — truthful and current overview

1. Explain the loaded-window boundary for home/world; at200 rows do not assert either global completeness or proven truncation. No globally earliest next-trip/all-places claim based solely on the window. Link to existing complete collection.
2. Preserve independent trip and visit error/empty/loaded states; no fallback zero/all-clear. Add useful explicit overview recovery without claiming router.refresh confirms new data.
3. Recompute from device-local calendar at midnight and resume/focus/offset change. Do not assume UTC/travel timezone, persist derived dates or poll an API.
4. Existing next/open trip, bookings, travellers, world and saved-trip navigation stays coherent. No invented progress score or readiness claim.
5. Preserve known geography/interactions and complete-world claims only for what the reader actually supplies.

## Acceptance B — controlled export and pagination

1. Explicit activation only, one request for same-turn duplicate clicks, no automatic retry. User stays in Account for401/500/503/nonJSON/malformed response/timeout/cancel.
2. Validate the success response sufficiently before download, preserve frozen format, provide safe messages and cancellation. Late response after cancellation/unmount/new generation cannot download.
3. Temporary response data stays in request/download memory; no localStorage/logging/analytics/external transmission. Revoke objectURLs. Success means handed to browser, never OS-saved/legal-complete/deletion-authorized.
4. Correct deterministic pagination for the existing13tables using a stable existing unique key. Preserve EXACT column lists, schemaVersion, table scope, authenticated session client, owner predicate, no-store and20,000-row/table bound. No widened permissions/query scope/schema change.
5. Fail honestly on page errors, bound violations, detected duplicate/nonprogress/invalid identity; no partial success document. Stable ordering is NOT an atomic cross-table snapshot under concurrent writes; document that limitation.
6. Use current Supabase reference for order/range; no SDK upgrade or hosted test. Root checked https://supabase.com/docs/reference/javascript/using-modifiers-range and /using-modifiers-order: range without order can behave unexpectedly. Read current relevant docs/changelog before coding; test actual query construction with controlled fixtures. Do not reinterpret #917 as permission for a live proof.
7. No new sensitive fields/exports, account profile mutation or changes to deletion/auth flows. The secondary export anchor in KontoLoeschen remains outside this lane.

## Required behavioral proof

Mounted home across local midnight, positive/negative offsets, focus after multi-day suspension/device offset change and cleanup.0/199/200-row coverage, archived-only rows, earlier upcoming trip outside loaded window, independent visit/trip failures. Actual export action/download count/objectURL cleanup for success/401/503/nonJSON/cancel/stale/unmount/retry/double activation. Pagination1000/1001/20000/20001, stable ordering/duplicate/nonprogress/page failure, unchanged fields/owner predicates. No real account/private export. Actual keyboard/focus/mobile/projectCSS at320/390/768/1440 and200%text.

## Authority, baseline and execution contract

Parent [R109 #1026](https://github.com/Jetnity/jetnity/issues/1026) records the Product Owner's explicit 26 October 2026 request for substantial Phase-1 work in parallel. This is a finite five-lane batch, not an automatic follow-up to R108-A.

Baseline main **6ae344f4453b16514f9048083bb8b07396135fa2**, tree **3bbc26038dfd2d2da471fbc2dea9d0b8331b0d61**, operating mode **NORMAL**. Before work re-read mode, main, this exact task, #751, sibling metadata and your branch. Unexpected branch/main changes return to TL; do not overwrite another writer or independently merge sibling branches.

**Cursor-Agent: Jetnity Account Home and Export Completion 1 — Cursor Generation 1**  
Required actual runtime: **Grok 4.7 High Fast / `grok-4.7-high-fast`**. No Auto or silent fallback. First reply records actual model, session ID/link and logical name. Attempt supported visible rename; an unavailable cosmetic rename is not a blocker. An unavailable/unverifiable required runtime is a capability blocker before implementation.

One fresh genuine Cursor session owns this branch and Draft PR. Immediate review corrections stay in that session. Read AGENTS.md, START_HERE, Technical-Lead/Cursor standard, Multi-Agent Operating System, slice-planning standard, model/name discipline, relevant architecture/vision/roadmap/design/quality/continuity documents, Phase-1 build order/DoD and the exact source contracts below. Later live receipts supersede dated historical task statuses.

Record a concise source-confirmed PLAN, then **implement the authorized scope**. No routine plan-only stop and no repeated general Owner approval. This TASK V1 is immutable: do not edit it. A genuinely necessary frozen-file/contract change must be proposed to Technical Lead before implementation.

## Multi-Agent Suitability — MULTI_AGENT

Five separate branches from the same accepted main: **S dependencies; T multi-stop creation/input bounds; A Admin Security; U Admin Users; K Account home/export**. Your lane is **K**. File ownership is exclusive; shared dependencies are read-only unless explicitly allowlisted below. T alone owns trip create schema/actions; S alone owns package resolution. No shared CSS, workflow, global documentation or sibling-branch writes.

Planned integration **S → T → A → U → K**. Root reviews each exact head independently and evaluates drift after every accepted merge. S changes the dependency baseline; later lanes require renewed combined-baseline gates. Authors must not auto-merge/rebase main or siblings. This task authorizes implementation from its seed, not integration.

## Common frozen boundaries

No hosted DB query/apply, new migration, RLS/grant/identity/Auth/session/MFA/AAL/capability change; no new sensitive fields, secret/environment changes, real provider/model requests, provider activation, payment, external terms, indexing/launch or new infrastructure cost. Existing native CI is allowed, not an alternate hosted SQL readback. No personally signed-in browser/CUA. Synthetic/local tests use blocked external networking; do not exercise real accounts or administrative mutations.

Preserve #985/#982 HOLD without inspecting held implementation as a substitute; #917 denied hosted-readback STOP; #913/#911 blocked; #968 cleanup PAUSED; #748 personal-browser SUSPENDED; #626 STOP; #937/#936 PAUSED; #934 HARD-BLOCKED; #944 no autostart; #585 deferred; #960 separate; #957 dormant. Official Truth OFF, noindex/prelaunch, Production provider hard-off and USD100/month remain.

Never modify AGENTS/operating mode/workflows/rulesets, shared auth/policies, global CSS or global continuity documents. For any file not explicitly owned, STOP at that boundary and report the exact proposal to TL. Root maintains global status.

## Verification and handoff

Use the project's Node 22 runtime and existing toolchain. No OS-package installation or infrastructure provisioning. Run focused meaningful behavioral/counterexample tests, typecheck, lint, the five existing hygiene checks and production build; run the existing test command and report all failures/skips honestly. Do not add tests that merely repeat version literals or source implementation. Do not weaken existing tests to conceal a failure.

For product UI, exercise actual mounted production components with project CSS using the existing isolated audit approach, synthetic fixtures and blocked external network. Prove clicks/keyboard/focus and real outcomes, not helper predicates alone. Include 320/390px, tablet and desktop, enlarged text, long content and error/recovery states. Do not ship an ungated public audit route or claim real-device/hosted acceptance.

Owned documentation prefix **docs/JETNITY_ACCOUNT_HOME_EXPORT_COMPLETION_1**: PLAN, STATUS, REPORT, SELF_REVIEW and HANDOFF dated 2026-10-26; evidence under **docs/evidence/account-home-export-completion-1**. Preserve original failures and limitations. Do not publish credentials, private logs, raw personal data or browser state.

Handoff must contain actual main/head/tree/merge-base/ahead/behind, changed-file list, exact session/model, tests and browser execution provenance, checked/not-checked systems, P0/P1/P2/P3 findings, CI/Preview links when available, remaining gate and next responsible actor. A callback acknowledgement, synthetic fixture or successful build is not persistence/Production proof.

Keep this PR Draft. **STOP for independent Technical-Lead review.** Only Root may PASS, Ready and merge.  
**do not mark Ready · do not merge · do not start a follow-up slice**
