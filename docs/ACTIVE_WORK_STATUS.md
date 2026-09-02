# Jetnity – Active Work Status

Stand: 2. September 2026
Status: **CURRENT / PHASE 1 JETNITY CORE / WORLD MAP 1 DRAFT IMPLEMENTATION / STOP FOR TECHNICAL-LEAD EXACT-HEAD REVIEW / NO READY / NO MERGE**

## 1. Arbeitsblock / Ziel

World Map 1 / Planned Account Truth.

Add a bounded responsive **Deine Welt** surface to authenticated Account Home using only existing canonical account-trip stage truth. Planned places may come from stored `trip_stages` country/place/coordinate fields. Past dates, archived status, trip status or labels are never proof of a visit.

Binding task: `docs/WORLD_MAP_1_PLANNED_TRUTH_TASK_2026-09-02.md`
Issue: #419
Decision: ADR-0210

## 2. Branch / PR / Head

- Branch: `feat/phase-1-world-map-1-planned-truth`
- Draft PR: #422
- Cursor-Agent: **`Jetnity world map 1`**
- Generation: **1**
- Session: `bc-bcfe4a30-460b-439d-8f14-96ec910487ac`
- Canonical base: `main@7feb9960bdb4ddac07465ab7fc0a62d9d9fe28e6`
- Runtime implementation head: `e7514acf95a4160858325d40adad6f604c5bc561`
- This status file is updated on the final agent head after evidence.

## 3. Status

**technisch review-bereit. STOP FOR TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Kein Ready. Kein Merge. Kein Folgeslice.

## 4. Bereits umgesetzt

- `TripSummaryStage` trägt `countryCode`, `placeId`, `latitude`, `longitude`
- `reisenLaden()` / `UEBERSICHT_SPALTEN` liest die bereits vorhandenen Stage-Spalten im bestehenden einen Select
- `tripAlsUebersicht()` lässt die Felder nicht fallen
- eine Presentation-Derivation `worldMapAbleiten()`
- lokale Landsilhouette ohne Runtime-Fetch
- `Deine Welt` auf Account Home mit Liste, Karte, Error/Empty-Trennung und ehrlicher visited-Lage `nicht_erfasst`
- fokussierte Tests plus angepasste Account/Trip-Summary-Regressionen

## 5. Gerade offen / noch nicht umgesetzt

- unabhängiger Technical-Lead Exact-Head-Review
- visited/travel-history Persistenz (bewusst out of scope)

## 6. Letzte relevanten Änderungen

World Map 1 implementation plus hygiene/typecheck fix.

## 7. Tests / CI / Preview

Verified locally on `e7514acf95a4160858325d40adad6f604c5bc561` unless noted:

- focused World Map + account/trip-summary tests: **3187/3187 pass** for full `npm test`; focused world-map tests 13/13
- `npm run typecheck`: **pass**
- `npm run lint`: **0 errors** (138 preexisting warnings)
- `check:setup:ci`, `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`: **pass**
- `npm run build`: **pass**
- GitHub CI on `e7514acf`: Typecheck/Lint/Build **SUCCESS**, Auth-Konfiguration **SUCCESS**
- Vercel Preview URL exists and is **SSO-protected** (`302` to `vercel.com/sso-api`). Exact-head HTML was not readable without SSO.
- Local production-build `/ui-audit/account` evidence: mobile 390 and desktop 1280 for `reise` / `leer` / `fehler` all green; no console errors; no horizontal overflow; visited stays `nicht_erfasst`; error ≠ empty world; marker touch target ≥ 44px

## 8. DB / RLS / Production-Grenze

Keine Schema-/Migrations-/RLS-/Grant-/Functions-Änderung. Existing owner-RLS on `trips` / `trip_stages` remains the authority. Diff vs `origin/main` contains no `supabase/migrations` files.

## 9. Kosten / Provider / Secrets

Keine neue laufende Kostenstelle. Kein Karten-API, kein Tile-Token, kein Geocoder, kein Provider, kein Secret, kein Production S6.

Land asset: original simplified equirectangular silhouette in `lib/account/world-map-land.ts`. License: original work in this repository. No runtime geography fetch. No new npm package.

## 10. Bekannte Risiken / Review-Funde

- Viele Etappen ohne Koordinaten bleiben nur in der Liste; die Karte kann dann leer wirken, ist aber ehrlich.
- Marker können sich bei nahen Koordinaten überlappen; die Liste bleibt die zugängliche Quelle.
- Bestätigte Besuchshistorie fehlt in Production und darf nicht nachgereicht werden, indem Status oder Daten umgedeutet werden.
- Preview-HTML bleibt Vercel-SSO-geschützt. Technical Lead muss Preview authentifiziert lesen oder die lokale Audit-Evidence verwenden.

## 11. Offene Nutzerentscheidungen / Freigaben

Technical-Lead Exact-Head-Review, Ready und Merge. Keine Product-Owner-Special-Gates durch diesen Slice berührt.

## 12. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft PR #422. Cursor-Agent stoppt.

## 13. Welche Dateien zuerst gelesen werden müssen

1. `docs/WORLD_MAP_1_PLANNED_TRUTH_TASK_2026-09-02.md`
2. `docs/WORLD_MAP_1_PLANNED_TRUTH_HANDOFF_2026-09-02.md`
3. `docs/WORLD_MAP_1_PLANNED_TRUTH_SELF_REVIEW_2026-09-02.md`
4. `DECISIONS.md` ADR-0210
5. `lib/account/world-map.ts`
6. `lib/trips/daten.ts`
7. `components/account/AccountWeltKarte.tsx`
