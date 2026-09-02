# World Map 1 – Implementation Handoff

Stand: 2. September 2026
Status: **REVIEW-FIX IMPLEMENTED / STOP FOR TECHNICAL-LEAD EXACT-HEAD REVIEW**
Issue: #419
Draft PR: #422
Branch: `feat/phase-1-world-map-1-planned-truth`
Cursor-Agent: **`Jetnity world map 1`**
Generation: **1**
Session: `bc-bcfe4a30-460b-439d-8f14-96ec910487ac`

Binding: `docs/WORLD_MAP_1_PLANNED_TRUTH_TASK_2026-09-02.md`
Decision: ADR-0210
Canonical base: `main@7feb9960bdb4ddac07465ab7fc0a62d9d9fe28e6`
Rejected exact head: `bf2936c9fb41a6e65ed4d29f573c2820c0a7e3dc` (review `5092964996`)
Runtime review-fix head: `81ee553ea5853ab41e016c2953cf0e178a8bcf76`

`origin/main` re-fetched before this handoff: **0 behind** the binding SHA `7feb9960`. Merge-base is still that baseline. Branch-only ahead.

## Review `5092964996` — three findings only

1. **Navigation.** Aggregated canonical places no longer hide unique trips behind `herkuenfte[0]`. `WorldMapOrt.reisen` is unique by `tripId`, never title. One unique trip keeps visible `Reise öffnen`; two or more get one labelled action each, including same-title trips.
2. **Compatibility.** `TripSummaryStage` map fields are optional. Legacy `{ name, position }` remains type-valid and fail-closed to unplotted / no-country. `reisenLaden()` and `tripAlsUebersicht()` still populate explicit stored values. Unrelated `reise-archiv` fixture churn was reverted.
3. **Continuity.** `docs/ACTIVE_WORK_STATUS.md` was restored from `origin/main` and World Map 1 was added additively. Provider readiness, Product-Owner gates A–E UNAPPROVED, provider-contact deferral, hard traveller truth, truth-class invariants, deferred boundaries and broader V1 gaps remain.

## Truth boundary kept

- planned ≠ visited
- no country from name/coordinates/placeId
- no coordinates from name/country/placeId
- no visited from dates/status/archive/order
- account load error ≠ empty world
- missing evidence stays missing
- no silent single-trip navigation default for aggregated places

## Out of scope and not introduced

- Supabase schema/migration/RLS/grant/function mutation
- visited persistence or write UI
- Auth/session/MFA/AAL
- provider/contact/secret/paid/live call, Production S6, Commercial writer
- TW-8/TW-9
- service worker/offline/push
- indexing/domain cutover
- follow-up slice

Changed-file list vs `origin/main` contains no `supabase/migrations`, no `package.json` / lockfile change, no Auth/MFA/AAL files.

## Land asset

- File: `lib/account/world-map-land.ts`
- Provenance: original simplified equirectangular continent rings for Jetnity World Map 1
- License: original work in this repository
- Runtime fetch: none
- No new npm package

## Gates / evidence

Verified locally on runtime review-fix head `81ee553ea5853ab41e016c2953cf0e178a8bcf76` unless a later docs-only evidence commit is the reviewed head:

- focused World Map + related account/trip-summary tests: **50/50 pass**
- full `npm test`: **3190 pass / 0 fail** (3187 prior + 3 review-fix regressions)
- `npm run typecheck`: **pass**
- `npm run lint`: **0 errors** (138 preexisting warnings)
- `check:setup:ci`, `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`: **pass**
- `npm run build`: **pass**

`origin/main` drift: **0 behind** `7feb9960`.

The repository `audit:account` Playwright harness was **not** used as the exact-head proof: its spawned `next dev` collided with the already-running workspace lock and aborted with `Connection terminated unexpectedly`. A focused production-build Playwright check against `next start` on port 3470 with `JETNITY_UI_AUDIT=1` and `VERCEL_ENV=preview` was used instead.

Local production-build `/ui-audit/account` on that server:

- `reise` 390 and 1280: `lage=geplant`, Lisbon plotted, one `Reise öffnen` to the unique trip, aria-label includes title + tripId, visited `nicht_erfasst`
- `leer` 390: empty planned copy, no `Reise öffnen`, no fabricated history
- `fehler` 390: world-map error, not empty-world copy
- no `0 besucht`
- no horizontal overflow

Vercel Preview / GitHub CI on the new exact head were not claimed at the time of this local handoff. Technical Lead must read live CI/Preview on the exact reviewed SHA.

## Next step

Independent Technical-Lead exact-head review of Draft PR #422.
**Do not Ready. Do not merge. Do not start another slice.**
