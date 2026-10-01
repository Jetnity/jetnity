# Trip Plan Premium Experience 4 — TASK

Stand: 30 Sep 2026
Issue: #662
Branch: feat/trip-plan-premium-experience-4
Baseline: main@2530020dbc6797b17d64c064ca5474cf90804272

## Goal
Refine Reiseplan presentation only. Preserve all accepted Trip Workspace behavior and trip truth.

## Required product outcome

### Desktop
- Long trips must not become a random wall of pills.
- Use a structured day grid with at most 7 day columns per row at wide widths.
- Keep destination/stage grouping and date ranges.
- Active day must be obvious.
- Existing day item count may be shown.

### Phone 360/390
- Do not wrap all days into a giant wall.
- Use a compact day navigator with:
  - active day,
  - Tag X von Y,
  - previous/next controls >=44px,
  - short scroll/snap strip if useful,
  - selected day auto-visible.
- No hidden-only navigation.

### Tablet
- Intentional bridge between phone and desktop. Test 768x1024 and 1024x768.

### Selected day
- Day heading and Punkt hinzufügen must feel like one working context.
- Empty day becomes compact and intentional; no huge blank state.
- Keep current add-form behavior and validation.

### Planned items
- Read as a chronological sequence/timeline.
- Time first when present; then type/icon, title, optional note, existing price truth.
- Preserve item open/delete semantics and >=44px targets.
- Do not invent missing time or status.

### Multi-stage / long-trip
- Keep canonical day-stage assignment.
- Test 1, 7, 14, 21 and 30+ day shapes where feasible.

## Preserve exactly
- Trip graph/data model
- timelineAbleiten
- day order and stage assignment
- onTagWechseln
- add/delete point mutations
- item detail opening
- Reiseplan URL / Back / Forward / reload
- focus and sticky coverage
- no provider or assistant call on first paint
- no fake progress, route, booking, status, itinerary or score

## Primary allowed runtime paths
- components/trips/TripWorkspacePlan.tsx
- optional pure helper under lib/trips/trip-plan-premium-experience-4*
- corresponding focused tests
- conditional minimal TripWorkspace.tsx change only if needed for selected-day focus/visibility
- scripts/trip-plan-premium-experience-4-audit.mjs
- own report/handoff/self-review/evidence

Do not edit other Trip Workspace sections unless a real blocker requires STOP for TL scope amendment.

## Device / accessibility acceptance
- 360x800
- 390x844
- 768x1024
- 1024x768
- 1440x900
- 1920x1080
- 200% text at 360
- no page horizontal overflow
- focus visible
- reduced motion
- >=44px controls
- compact input font >=16px
- active day never hidden under sticky chrome

## Functional proof
- first / middle / last day
- empty day
- day with >=3 items
- previous/next
- direct day selection
- add form open/close
- delete contract unchanged
- item detail open unchanged
- Back/Forward/reload unchanged
- no new network call on first paint

## Gates
Run focused tests, existing Trip Workspace tests, npm test, typecheck, lint, build, setup/dead/exports/deps/api/schema/operating-mode checks, production-like browser audit, exact-head GitHub CI/Auth and Vercel Preview.

If main moves, integrate current main into same branch/session and re-run exact-head gates.

## Hard boundaries
No dependency changes. No Auth/Supabase/schema. No provider activation. No payment. No #626. No legal/privacy rewrite. No tracking. No indexing/robots/launch. No navbar/footer/favicon/homepage work. No Production config.

Cursor stays Draft. Cursor never Ready or merge. STOP for independent TL review.

Required model: Grok 4.7 High Fast, not Auto.
