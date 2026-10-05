# Jetnity – World Map Polish 2 Task

Stand: 17. September 2026  
Status: **ACTIVE / PARALLEL-SAFE ACCOUNT UI POLISH / NO DB / NO PROVIDER / NO TRUTH EXPANSION**

Issue: #436  
Canonical base: `15aa125addf39b15dcb50a1cdf8dece661796fc5`  
Branch: `feat/phase-1-world-map-polish-2`

Cursor-Agent: **Jetnity world map polish 2**  
Generation: **1**  
Required parent model: **Claude Opus 5 High**

Do not use Auto. If Claude Opus 5 High is unavailable, stop and report instead of silently substituting another parent model.

---

## Status

**ACTIVE CODING CANDIDATE / PARALLEL-SAFE UI POLISH / NO DB / NO PROVIDER / NO TRUTH EXPANSION**

Product-Owner feedback on 17 September 2026: the current Account World Map is functionally useful but visually not professional enough for Jetnity. The visible mobile surface appears prototype-like: schematic map, weak marker hierarchy, oversized text cards, unclear status framing, a visually awkward map baseline/shape, and repeated-looking trip links.

### Live parallelism decision

Current other active slice:
- Draft PR #435
- Branch `feat/phase-1-assistant-runtime-1`
- Agent: `Jetnity assistant runtime 1`, Generation 1
- Assistant scope is Trip Workspace + `lib/reisebegleiter/**` + `lib/modell/**` + develop-only model-usage migration.

This World Map polish is deliberately isolated to the authenticated **Account** surface.

## Goal

Turn the existing bounded local World Map into a polished, premium Jetnity account surface without changing its truth contract.

The feature should communicate at a glance:
- where Jetnity trips are planned;
- that planned != visited;
- which trip(s) belong to a point;
- what the traveller can open next.

It should feel like a real travel-product feature rather than a technical visualization.

## Binding truth contract to preserve

- Planned places come only from already persisted `trip_stages` fields.
- A past date, archived trip or trip status must never become visited truth.
- Confirmed visited history remains **not captured**.
- Missing country/coordinates remain unknown; do not infer/geocode.
- No second trip query.
- No service-role read.
- No provider/commercial search.
- No external map/tile/geocoder runtime.
- No new persistence.

## Required UX/visual improvements

1. **Map visual hierarchy**
   - Improve map composition, spacing, aspect ratio and mobile legibility.
   - Remove/avoid any prototype-looking baseline/block artifacts.
   - Markers must be visually intentional, not floating dots.
   - Selected marker state must be clear without relying on colour alone.
   - Dense nearby markers must remain usable; do not silently merge distinct places.

2. **Status clarity**
   - Make `Geplant` and future `Besucht` semantics immediately understandable.
   - The current long visited-history warning should be visually calmer and less dominant while remaining honest.
   - Do not display a fake `0 besucht`.

3. **Professional trip/place cards**
   - Reduce oversized repetitive cards.
   - Improve information hierarchy for place, country and linked trips.
   - Repeated-looking `Reise öffnen` rows must be understandable when multiple distinct trips have the same title; never dedupe by title.
   - Navigation must remain by unique `tripId`, never `herkuenfte[0]`.
   - Avoid provider/technical naming where an existing trusted localized display label is already available, but do not invent or rewrite canonical identity when not safely derivable.

4. **Interaction**
   - Selecting a marker should reveal/focus the matching place details cleanly.
   - Mobile interaction should feel native-quality; desktop should use available width.
   - Keyboard/focus/ARIA behavior must remain strong.
   - Respect reduced-motion preferences for any scrolling/animation changes.

5. **Responsive quality**
   - Explicit evidence at iPhone-like 390px width and desktop.
   - No horizontal overflow.
   - Touch targets >= 44px.
   - No tiny unreadable map labels.

## Allowed files

Primary ownership:
- `components/account/AccountWeltKarte.tsx`
- `lib/account/world-map.ts`
- `lib/account/world-map.test.ts`
- `lib/account/world-map-land.ts` only if needed for presentation quality without changing provenance/runtime-fetch contract
- a new local Account World Map presentation helper/test if truly needed
- slice-specific docs only: TASK / STATUS / HANDOFF / SELF_REVIEW

`components/account/AccountUebersicht.tsx` may be touched only if required for local spacing/integration and must not change unrelated account-home behavior.

## Hard file/scope exclusions for collision prevention

Do **not** touch:
- `components/trips/**`
- `lib/reisebegleiter/**`
- `lib/modell/**`
- `supabase/**`
- `types/supabase.ts`
- Assistant Runtime 1 task/status/handoff files
- global active-work/continuity/handoff/roadmap files during implementation
- Auth/MFA/AAL/RLS/Traveller contracts
- provider/search/commercial modules
- PWA/service-worker scope

If a needed change crosses these exclusions: STOP for Technical Lead.

## No external map dependency

Do not add Mapbox, Google Maps, OSM tiles, Leaflet, MapTiler, HERE, geocoding APIs, remote SVG/map assets or runtime fetches.

A future richer cartography/provider decision can be its own slice. This polish must keep the current local/non-commercial architecture.

## Acceptance

- World Map looks materially more polished than current V1 surface on mobile and desktop.
- No truth regression.
- No duplicated-looking action confusion for distinct trips with identical titles.
- Planned/visited distinction remains explicit but visually balanced.
- Existing local map provenance and no-runtime-fetch contract remains intact.
- Existing world-map tests pass; add focused regressions for new behavior.
- Typecheck, lint, tests, production build pass.
- Vercel Preview exact-head is READY.
- Mobile/desktop screenshot or Playwright evidence is persisted.
- No console/runtime errors on the inspected surface.

## Parallelism / agent

**Multi-Agent Suitability: SINGLE_AGENT for this slice, PARALLEL-SAFE versus PR #435 under file ownership above.**

Cursor-Agent: **`Jetnity world map polish 2`**
Generation: **1**
Required parent model: **Claude Opus 5 High**
Do not use Auto. If unavailable, stop rather than silently substituting.

## Governance

- Do not mark Ready.
- Do not merge.
- Do not start a follow-up slice.
- Re-fetch origin/main before final handoff.
- Report exact final head and drift.
- Persist STATUS/HANDOFF/SELF_REVIEW in slice-specific docs.
- Agent self-review is not Technical-Lead PASS.
- Final state: **STOP FOR TECHNICAL-LEAD REVIEW**.


## Technical-Lead file ownership lock

This slice is intentionally parallel to Assistant Runtime 1 / PR #435.

World Map agent owns only the Account World Map presentation files listed above and slice-specific evidence docs.

It must not edit any Assistant Runtime file, Trip Workspace component, model runtime, Supabase migration, shared active-work continuity document or provider contract.

If a needed fix crosses that boundary, STOP for Technical Lead rather than broadening scope.

## Final stop

After implementation/evidence:
- persist slice-specific STATUS, HANDOFF and SELF_REVIEW;
- report exact final head and drift;
- do not mark Ready;
- do not merge;
- do not start another slice;
- STOP FOR TECHNICAL-LEAD REVIEW.
