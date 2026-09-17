# Jetnity – Realistic World Cartography 1 Task

Stand: 17. September 2026  
Status: **ACTIVE / PRESENTATION-ONLY / NO PERSISTENCE / NO PROVIDER**

Issue: #442  
Product-Owner directive: #441  
Canonical base: `03842a64698cae1f4f20f54b7e6aa5016982562c`  
Branch: `feat/phase-1-realistic-world-cartography-1`

Cursor-Agent: **Jetnity realistic world cartography 1**  
Generation: **1**  
Required parent model: **Claude Opus 5 High**

Do not use Auto. If Claude Opus 5 High is unavailable, stop and report instead of silently substituting another model.

---

## Status

**ACTIVE CODING CANDIDATE / PHASE-1 ACCOUNT WORLD / PRESENTATION-ONLY / NO PERSISTENCE / NO PROVIDER**

Product-Owner directive: #441  
Canonical base: `main@03842a64698cae1f4f20f54b7e6aa5016982562c` (World Map Polish 2 merged)

## Goal

Replace the current schematic/custom land silhouette with a **materially more geographically realistic and professional world map**, while preserving all existing World Map truth and interaction contracts.

This is not a visit-history persistence slice. Explicit historical visit truth will follow separately after this cartography foundation.

## Product target

The Account World Map should feel like a premium travel product:
- recognisable, geographically accurate continents/coastlines;
- clean ocean/land visual hierarchy;
- optional subtle country boundaries where they improve orientation;
- current Jetnity markers remain legible and interactive;
- excellent 390px mobile rendering and strong desktop use of space;
- no prototype-looking blocks/bars or cartoonishly coarse geography.

“Realistic” here means **accurate geographic vector cartography**, not a satellite/photo basemap.

## Binding truth / runtime constraints

Preserve:
- planned != visited;
- no inferred visit history;
- no geocoding;
- no deriving country/coordinates from names;
- no second trip query;
- no provider/commercial search;
- no new persistence;
- no Supabase migration;
- no location tracking;
- no external map/tile/geocoder fetch on mount or interaction.

The existing marker/place/trip truth is unchanged. This slice changes cartography/presentation only.

## Cartography source requirements

Preferred direction: repository-local vector geography derived from a **legally compatible/public-domain source such as Natural Earth**.

Requirements:
- document exact source/dataset/version/download location and license/public-domain status in repository evidence;
- do not copy proprietary Google/Apple/Mapbox/HERE imagery or styling assets;
- no runtime dependency on Mapbox, Google Maps, OSM tiles, MapTiler, HERE, ArcGIS, etc.;
- no new paid map dependency;
- no external runtime requests for base-map rendering;
- derived geometry must be local and deterministic;
- keep client payload/performance bounded and measure it;
- choose an appropriate dataset/detail level for 390px + desktop (e.g. Natural Earth 110m/50m or an equivalent) based on measured visual quality and payload;
- if country borders are shown, treat them as orientation cartography, not as an authoritative legal/political boundary source.

Prefer precomputed SVG path geometry or another lightweight local representation over shipping a general map framework.

## Required visual improvements

1. **Geography**
   - continents/coastlines recognisable and proportionally correct;
   - remove obviously invented/placeholder shapes;
   - islands/peninsulas important at world scale should not look broken;
   - do not distort marker coordinates relative to the map projection.

2. **Map composition**
   - premium but restrained Jetnity styling;
   - clear ocean/land separation;
   - subtle grid only if it improves orientation;
   - country/internal boundaries only if visually helpful;
   - no dark admin-style theme.

3. **Markers**
   - preserve current dense-marker collision handling;
   - preserve >=44px hit targets;
   - selected state not colour-only;
   - labels stay within usable map/card bounds;
   - no marker location inference.

4. **Responsive / accessibility**
   - explicit 390px and desktop evidence;
   - no horizontal overflow;
   - keyboard selection works;
   - reduced-motion respected;
   - SVG has useful title/description;
   - no inaccessible tiny text baked into the geometry.

5. **Performance**
   - measure added client bundle/static payload;
   - avoid a heavy mapping library unless absolutely necessary;
   - no excessive DOM path count if a simpler local geometry representation can do the job;
   - no visible interaction regression on mobile.

## Allowed files

Primary:
- `components/account/AccountWeltKarte.tsx`
- `lib/account/world-map-land.ts` (may be replaced)
- `lib/account/world-map-ansicht.ts`
- `lib/account/world-map.test.ts`
- a new local cartography/geography module under `lib/account/**`
- a local generated geometry asset under an appropriate repository path
- a bounded generation script under `scripts/**` if needed for reproducibility
- `components/account/AccountAuditClient.tsx` only for local visual evidence fixtures
- slice-specific TASK / STATUS / HANDOFF / SELF_REVIEW / provenance/evidence docs

Avoid changing `lib/account/world-map.ts` unless a presentation-only type seam genuinely requires it. Do not change its truth semantics.

## Hard exclusions / parallel ownership

Do not touch:
- `components/trips/**`
- `lib/reisebegleiter/**`
- `lib/modell/**`
- `supabase/**`
- `types/supabase.ts`
- Auth/MFA/AAL/RLS
- provider/commercial/payment code
- Assistant Runtime #435 files
- V1 Account/Privacy/Ops Audit #439 files
- global continuity/ROADMAP/ACTIVE_WORK_STATUS during implementation

If a needed change crosses these boundaries: STOP for Technical Lead.

## Acceptance evidence

Before handoff:
- targeted World Map tests;
- full tests/typecheck/lint/build;
- exports/dead/deps checks as applicable;
- exact-head GitHub CI;
- exact-head Vercel Preview;
- visual evidence at 390px and >=1280px for normal map, selected marker and dense-marker group;
- compare before/after geography visibly enough to prove the improvement;
- no horizontal overflow;
- no console/page/runtime errors;
- no external runtime map/geocoder/network call;
- report geometry payload/file size and relevant bundle impact;
- document source/provenance/license;
- re-fetch origin/main and report exact final head, merge-base, ahead/behind/drift.

## Parallelism

**SINGLE_AGENT, PARALLEL-SAFE** versus Assistant Runtime #435 and docs-only Account/Privacy/Ops Audit #439 under the ownership lock above.

Cursor-Agent: **`Jetnity realistic world cartography 1`**  
Generation: **1**  
Required parent model: **Claude Opus 5 High**  
Do not use Auto. If unavailable, stop rather than silently substituting.

## Governance

- Agent never marks Ready.
- Agent never merges.
- Agent starts no follow-up slice.
- Agent self-review is not Technical-Lead PASS.
- Any new head invalidates prior exact-head gates.
- Final state: **STOP FOR TECHNICAL-LEAD REVIEW**.


## Technical-Lead ownership lock

This slice owns only the Account World cartography/presentation seam and slice-specific evidence.

It is parallel to:
- Assistant Runtime 1 / PR #435;
- V1 Account / Privacy / Operations Audit 1 / PR #439.

Do not edit either workstream's files. Do not edit shared global continuity docs during implementation.

## Important review expectations

A prettier colour treatment over the existing coarse shapes is **not enough**. The geometry itself must materially improve and be recognisable as real-world geography.

Do not introduce a general third-party map runtime merely to improve the base map. Prefer precomputed, repository-local geometry.

The user-facing map must remain useful even if all JS-enhanced marker interactions fail: geography should still render, and place cards remain the truth-bearing fallback.

## Final stop

Persist STATUS / HANDOFF / SELF_REVIEW plus cartography provenance/evidence.  
Do not mark Ready. Do not merge. Do not start Explicit Visit History 1.  
**STOP FOR TECHNICAL-LEAD REVIEW.**
