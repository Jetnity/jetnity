# Jetnity – Active Work Status

Stand: 24. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R16-Merge-Blocker 31 ist auf Runtime `57824019` geschlossen und gegated. Untrusted Browser-/Guest-/LocalStorage-`routeItinerary` kann `surfaceFromAirportCode` nicht mehr allein durch syntaktische Plausibilität zu Surface-Truth machen. Noch kein technisches Closure/PASS; unabhängiger R17-Review steht aus.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R16 Review: `docs/PR38_CHATGPT_R16_REVIEW.md`  
R16 Cursor-Auftrag: `docs/PR38_CURSOR_R16_BLOCKER31_TASK.md`  
R15 Review: `docs/PR38_CHATGPT_R15_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`  
Multi-Agent-Folgeentscheidung: `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R16-Runtime-Head: `5782401943b41ddd1eea1337c93cb37163210362`
- R15-Runtime-Head: `5cc4488e3b30aeb3c8afe1eb2ff7bc9627987e88`
- Docs-Lock vor R16: `3d632ca048633d96b389327522468ce6a0592f5f`
- PR-Zustand: **open, Draft, nicht gemergt**

## 3. Status

**R16-Fix 31 ist implementiert und gegated. R17 steht aus. Noch kein Closure/PASS.**

30. **`itineraryAusFlugOption()` erfindet keine Surface-Evidence mehr.** Untrusted Browser-`FlugOption` mit `LAX→JFK` + `SFO→NRT` bleibt ohne Surface-Evidence chronology unknown. Extra-Felder, `provider` und `externalRef` aus dem Browser sind kein Surface-Beweis.

31. **Untrusted `routeItinerary` adelt keine Client-Surface mehr.** `flugRouteItineraryLesen()` / Guest-`reiseLesen()` / Nutzlast-Schema verwerfen `surfaceFromAirportCode`. `itineraryKanonisieren()` kopiert das Feld nicht. Die Development-Funktion `public.flug_route_itinerary_metadata` baut Segmente ohne das Feld neu (`20260824140000_flug_route_itinerary_untrusted_surface`). `LAX→JFK` + `SFO→NRT` mit Client-`surfaceFromAirportCode='JFK'` bleibt chronology unknown. Es gibt in dieser Foundation keinen trusted Surface-Schreibpfad; echte `CDG⇢ORY`-Claims aus Browser/Guest werden nach Intake ebenfalls unknown. Die Chronologie-Engine darf das Feld nur an bereits typisierten Objekten lesen (`flugRouteItineraryTrustedLesen`).

R14-Fix 29 (Persistenz gültiger Evidence) ist für untrusted Intake durch ADR-0151 ersetzt. Blocker 1–30 bleiben in ihren jeweils geprüften Pfaden geschlossen.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Exact-Head-Evidence des R16-Runtime-Heads

Auf exakt `5782401943b41ddd1eea1337c93cb37163210362` verifiziert:

- `npm test` **1703/1703**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, 8 Viewports (`AUDIT_PORT=3485`)
- DB: Rechte 51 / RLS Exit 0 / Sicherheit **216/216** / Parallelität **7/7**
- GitHub Actions Run `32677741683`: **SUCCESS**
- Vercel Preview `dpl_74A67UxWrCLWviihrsn9hfYqqZDQ`: **READY**

Development-Migration `20260824140000_flug_route_itinerary_untrusted_surface` ist angewendet. Production bleibt ohne diese Migration.

Grüne Gates ersetzen den unabhängigen R17-Befund nicht.

## 5. Live Infra / DB

- Vercel Production `jetnity-app.vercel.app`: READY auf `main` `cd220beb`.
- Supabase Production `qscbgcdmivbbnzrcyegn`: ACTIVE_HEALTHY; Route-Surface-Migrationen **nicht** angewendet.
- Supabase Development: ACTIVE_HEALTHY; `20260824120000` und `20260824140000` angewendet.
- Development-Funktion `public.flug_route_itinerary_metadata(text,jsonb)`: SECURITY INVOKER; `anon` kein EXECUTE; `authenticated` EXECUTE; Client-`surfaceFromAirportCode` wird verworfen.

## 6. DB / Kosten / Provider

- keine Seasonal-Tabelle
- `seasonalProviderAus()` bleibt `null`
- keine Live-Provider-Aktivierung
- keine neuen Secrets
- keine neuen laufenden Kosten
- Route-Persistenzmigration nur auf Development
- **keine Production-Migration**

## 7. Exakter nächster Schritt

Unabhängiger ChatGPT-Re-Review **R17**.

R17 prüft gezielt die Evidence-Provenance an allen Browser/LocalStorage/Guest→Server/DB-Grenzen, Save→Reload, Guest/Account-Parität und prior blockers.

Nur wenn R17 keinen neuen konkreten relevanten Truth-/Security-/SoT-/Cross-Domain-/Provider-/Release-Defekt findet, kann der Technical Lead das technische Closure/PASS nach Stop-Kriterium dokumentieren.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 8. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_R16_REVIEW.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/PR38_CURSOR_REVIEW_FIXES.md` §31
4. `lib/route/schema.ts`
5. `lib/route/itinerary.ts`
6. `lib/route/ableitung.ts`
7. `lib/route/kanonisieren.ts`
8. `supabase/migrations/20260824140000_flug_route_itinerary_untrusted_surface.sql`
9. `lib/route/r16-untrusted-surface.test.ts`
10. `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 9. Verbindliche Folgeentscheidung – Multi-Agent-Entwicklungsteam

Account-/Admin-Audits dürfen als abgeschlossene Analyse-/Vorbereitungsworkstreams bestehen bleiben. Ihre Kernimplementierung bleibt bis zum technischen Closure/PASS von PR #38 gesperrt. Gemeinsame Auth/RLS/DB/Traveller-/Route-/Readiness-/Safety-/Seasonal-Contracts bleiben zentral koordiniert.

## 10. Agent-Handoff dieser Session

- Branch/PR: `feat/travel-timing-seasonal-intelligence` / `#38`
- Letzter Runtime-Head: `57824019`
- R16-Fix 31: implementiert und gegated
- Nicht umgesetzt / nicht behauptet: R17, Closure/PASS, Mark Ready, Merge, Production-Migration, Provider-Live-Aktivierung
- Exakter nächster Schritt: unabhängiger ChatGPT-Re-Review R17
