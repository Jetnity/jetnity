# Planning Entry Premium Experience 7 — TASK

Stand: 1 Oct 2026
Issue: #668
Branch: feat/planning-entry-premium-experience-7
Baseline: main@2530020dbc6797b17d64c064ca5474cf90804272

## Goal
Premium refinement of /planen only. Preserve both existing creation engines and all validation, persistence, metadata and model-call boundaries.

## Allowed runtime ownership
- app/(public)/planen/page.tsx
- components/trips/Reiseidee.tsx
- components/trips/TripPlanner.tsx
- components/trips/PlanenEinstiegNavigation.tsx
- components/trips/PlanenCreateGate.tsx only if needed for visual consistency
- optional pure presentation helper/tests for this slice
- audit/evidence/docs

Do not edit Trip Workspace runtime, preparation, organize, plan, navbar/footer/favicon/homepage or package files.

## Product requirements

### 1. Entry choice
- free-description path remains first and primary;
- manual path remains complete and first-class;
- improve in-page navigation so the two paths feel intentionally related;
- explicit user activation may scroll/focus only;
- no hidden automatic mode switch and no model call from navigation.

### 2. Free-description card
- make hierarchy more premium and concise;
- preserve exact textarea, examples, submit/loading/error/proposal-preview behavior;
- no model call until explicit submit;
- keep “preview before save” and storage/privacy truth;
- examples remain shortcuts, not recommendations.

### 3. Manual planner
Preserve every field and exact business/validation semantics.

Group visually into:
- Route & Ziele
- Zeitraum
- Reisende & Budget
- Wünsche

Improve density and hierarchy without removing fields.
Multi-destination order/reorder/remove remains lossless and keyboard accessible.
No inferred route/stay/order truth.

### 4. Guidance panel
- desktop may use a supporting side panel with bounded sticky behavior;
- phone/tablet must use a compact non-dominant version;
- copy remains truthful: manual path works without intelligent planning and both paths create the same trip.

### 5. Primary actions
- “Entwurf erstellen” remains intelligent-path submit;
- “Reise erstellen” remains manual-path submit;
- make each clearly associated with its path;
- no extra network/model/provider call.

## Responsive acceptance
320x568
360x800
375x812
390x844
412x915
430x932
768x1024
820x1180
1024x768
1280x800
1440x900
1728x1117
1920x1080
phone landscape
200% text at 360
desktop zoom sanity 125/150 where feasible

No page horizontal overflow.
>=44px targets.
Compact inputs >=16px.
Safe-area and sticky header respected.
Focus visible.
Reduced motion.
No clipped validation/errors.
Mobile must feel intentionally designed, not stacked desktop.
Tablet must be intentionally composed.

## Functional regression
Verify:
- free-description submit/model call only on explicit submit;
- proposal preview-before-save unchanged;
- manual path never invokes model;
- manual validation/focus-to-error unchanged;
- additional destinations add/reorder/remove unchanged;
- guest/account create gate unchanged;
- create idempotency/clientRef unchanged;
- metadata/canonical/robots contract unchanged;
- URL prefill/confirmed route handoff unchanged;
- no localStorage access added to server page;
- Back/Forward/hash navigation remains sane.

## Gates
Focused planning-entry tests, existing create-entry/manual planning/SEO tests, full npm test, typecheck, lint, build, setup/dead/exports/deps/api/schema/operating-mode checks, production-like browser audit, exact-head CI/Auth/Vercel.

If main moves, integrate current main in same branch/session and rerun exact-head gates.

## Hard boundaries
No create business logic redesign.
No model/provider config.
No new model/provider call.
No schema/data model/Auth/Supabase/payment.
No indexing/robots/canonical change.
No #626.
No legal/privacy rewrite.
No tracking.
No package/dependency change.
No navbar/footer/favicon/homepage.
No Production config.

Required model: Grok 4.7 High Fast, not Auto.
Stay Draft. No Ready. No merge. No follow-up slice.
STOP for independent TL code + visual + mobile + interaction review.
