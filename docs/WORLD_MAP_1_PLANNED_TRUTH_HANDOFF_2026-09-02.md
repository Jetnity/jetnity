# World Map 1 – Implementation Handoff

Stand: 2. September 2026  
Status: **DRAFT IMPLEMENTATION / STOP FOR TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Issue: #419  
Draft PR: #422  
Branch: `feat/phase-1-world-map-1-planned-truth`  
Cursor-Agent: **`Jetnity world map 1`**  
Generation: **1**  
Session: `bc-bcfe4a30-460b-439d-8f14-96ec910487ac`

Binding: `docs/WORLD_MAP_1_PLANNED_TRUTH_TASK_2026-09-02.md`  
Decision: ADR-0210

## Implemented

- Extended `TripSummaryStage` with stored `countryCode`, `placeId`, `latitude`, `longitude`
- Extended `UEBERSICHT_SPALTEN` / `reisenLaden()` on the existing single trips select
- `tripAlsUebersicht()` preserves the new fields
- Deterministic `worldMapAbleiten({ problem, reisen })`
- Account Home surface `Deine Welt`
- Local land silhouette, no runtime map/geocoding/tile fetch
- Focused tests and updated list-select regressions

## Truth boundary kept

- planned ≠ visited
- no country from name/coordinates/placeId
- no coordinates from name/country/placeId
- no visited from dates/status/archive/order
- account load error ≠ empty world
- missing evidence stays missing

## Out of scope and not introduced

- Supabase schema/migration/RLS/grant/function mutation
- visited persistence or write UI
- Auth/session/MFA/AAL
- provider/contact/secret/paid/live call, Production S6, Commercial writer
- TW-8/TW-9
- service worker/offline/push
- indexing/domain cutover
- follow-up slice

## Land asset

- File: `lib/account/world-map-land.ts`
- Provenance: original simplified equirectangular continent rings for Jetnity World Map 1
- License: original work in this repository
- Runtime fetch: none
- No new npm package

## Next step

Independent Technical-Lead exact-head review.  
**Do not Ready. Do not merge. Do not start another slice.**
