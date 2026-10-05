# Organize Premium Experience 6 — TASK

Stand: 1 Oct 2026
Issue: #666
Branch: feat/organize-premium-experience-6
Baseline: main@2530020dbc6797b17d64c064ca5474cf90804272

## Goal
Refine Organisieren presentation only. Preserve accepted domain truth, detail semantics and explicit-search/no-auto-call guarantees.

## Primary runtime ownership
- components/trips/TripWorkspaceDomainNavigation.tsx
- components/trips/TripWorkspaceDetail.tsx
- presentation-only seams in:
  - components/trips/FlugSuche.tsx
  - components/trips/HotelBereich.tsx
  - components/trips/AktivitaetenBereich.tsx
  - components/trips/MobilitaetBereich.tsx
  only where needed for spacing/hierarchy/form grouping, never business logic
- focused pure presentation helper/tests if useful
- audit/evidence/docs

Do not edit TripWorkspace.tsx, TripWorkspacePlan.tsx, Reisevorbereitung.tsx, TripWorkspaceModeNavigation.tsx, TripWorkspaceKopf.tsx, TripWorkspaceUebersicht.tsx while parallel slices are active.

## Product requirements

### Desktop split
- preserve left domain rail + right detail/work surface;
- active domain visually obvious;
- status copy uses only existing coverage truth;
- optional sticky rail only if focus/sticky-header coverage remains correct;
- reduce visual weight/redundancy of “Zurück zur Reise” on wide desktop while preserving close/focus semantics;
- do not remove a keyboard-accessible way to close/return.

### Domain detail hierarchy
Order the existing truth clearly:
1. domain identity;
2. current state;
3. next explicit action;
4. Bestand/status;
5. search only after explicit open.

Avoid repeating the same empty-state meaning multiple times in adjacent blocks. Do not remove distinct facts.

### Inventory / Bestand
- flights, accommodation, activities and mobility remain existing canonical surfaces;
- preserve selected/planned/open status truth;
- no fake price, availability, booking or provider result;
- route/segment facts stay lossless.

### Explicit search
- opening a domain never auto-searches;
- search component remains unmounted until existing explicit search action;
- provider/model call still only occurs after the user submits the existing search action;
- no background search;
- no new default provider;
- no business/domain adapter changes.

### Forms
- group related route/date/options controls more efficiently;
- improve desktop use of width without making phone cramped;
- primary search button visually clear;
- compact-device inputs >=16px;
- preserve all fields, defaults, validation, query payload and submit semantics.

### Phone 360/390
- one domain detail at a time;
- explicit Back to domain list;
- focus returns to the domain trigger;
- no desktop split squeezed onto phone;
- full-width forms and >=44px touch targets.

### Tablet / desktop
Test 768x1024, 1024x768, 1440x900, 1920x1080.
200% text at 360.
No page horizontal overflow.

## Functional regression
Verify for each domain where available:
- domain open does not call provider;
- search stays unmounted until explicit search/open action;
- explicit search form opens correctly;
- provider call occurs only on existing submit action;
- Back closes detail and restores focus;
- Escape/wide behavior remains accepted;
- URL/deep link/back-forward/reload contracts remain unchanged;
- current inventory/status remains lossless.

## Performance / accessibility
No new dependency.
No animation library.
Reduced motion.
Visible focus.
>=44px targets.
No global overflow masking.
No unnecessary client state.

## Gates
Focused Organisieren/domain tests, existing cross-device tests, full npm test, typecheck, lint, build, setup/dead/exports/deps/api/schema/operating-mode checks, production-like browser audit, exact-head CI/Auth and Vercel Preview.

If main moves, integrate current main in the same branch/session, confirm 0 behind, rerun gates.

## Hard boundaries
No TripWorkspace parent.
No plan/preparation paths.
No provider/business logic/adapters.
No schema/data model.
No Auth/Supabase/RLS.
No payment/provider activation.
No package changes.
No #626.
No legal/privacy rewrite.
No tracking.
No indexing/robots/launch.
No navbar/footer/favicon/homepage.
No Production config.

Required model: Grok 4.7 High Fast, not Auto.
Stay Draft. No Ready. No merge. No follow-up slice.
STOP for independent TL code + visual + mobile + interaction review.
