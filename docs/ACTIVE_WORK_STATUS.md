# Jetnity – Active Work Status

Stand: 24. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R15-Merge-Blocker 30 ist auf Runtime `5cc4488e` im `FlugOption`-Pfad geschlossen und gegated. Der unabhängige R16-Review hat jedoch einen neuen konkreten Trust-Defekt gefunden: untrusted Browser-/LocalStorage-`routeItinerary` kann `surfaceFromAirportCode` weiterhin selbst behaupten und damit Surface-Truth erzeugen. Noch kein technisches Closure/PASS.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R16 Review: `docs/PR38_CHATGPT_R16_REVIEW.md`  
R15 Review: `docs/PR38_CHATGPT_R15_REVIEW.md`  
R14 Review: `docs/PR38_CHATGPT_R14_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`  
Multi-Agent-Folgeentscheidung: `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main beim R16-Review: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R15-Runtime-Head: `5cc4488e3b30aeb3c8afe1eb2ff7bc9627987e88`
- Docs-Lock vor R16: `3d632ca048633d96b389327522468ce6a0592f5f`
- R16-Review-Commit: `3a77fcdd14e321b440213f635c093283722ceb48`
- PR-Zustand vor R16-Dokumentation: **open, Draft, mergeable, nicht gemergt**

## 3. Status

**R15-Fix 30 ist implementiert und gegated. R16 findet Blocker 31. REQUEST CHANGES. Noch kein Closure/PASS.**

30. **`itineraryAusFlugOption()` erfindet keine Surface-Evidence mehr.** Untrusted Browser-`FlugOption` mit `LAX→JFK` + `SFO→NRT` bleibt ohne Surface-Evidence chronology unknown. Extra-Felder, `provider` und `externalRef` aus dem Browser sind kein Surface-Beweis.

31. **Untrusted `routeItinerary` kann dieselbe Evidence weiterhin selbst behaupten.** `lib/route/schema.ts` akzeptiert `surfaceFromAirportCode` ausdrücklich auch für Browser-/LocalStorage-Input. Der Guest→Account-Serverpfad kanonisiert IATA/Land/Stadt, erhält aber ein syntaktisch gültiges `surfaceFromAirportCode`. Die aktive Development-DB-Funktion persistiert dieses Feld ebenfalls. Damit kann eine manipulierte Route `LAX→JFK`, `SFO→NRT` mit `surfaceFromAirportCode='JFK'` wieder als `JFK⇢SFO`-Surface-Kette erscheinen, obwohl keine serverseitig belegte Evidence existiert.

R14-Fix 29 und Blocker 1–30 bleiben in ihren jeweils geprüften Pfaden geschlossen; Blocker 31 ist ein neuer, separater Provenance-Pfad.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Exact-Head-Evidence des letzten Runtime-Heads

Auf exakt `5cc4488e3b30aeb3c8afe1eb2ff7bc9627987e88` verifiziert:

- `npm test` **1695/1695**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, 8 Viewports (`AUDIT_PORT=3499`)
- DB: Rechte 51 / RLS Exit 0 / Sicherheit **216/216** / Parallelität **7/7**
- GitHub Actions Run `32675079113`: **SUCCESS**
- Vercel Preview `dpl_CxwJcoU3PcMddaGKDaXvJAxZuBMj`: **READY**

Docs-Lock `3d632ca048633d96b389327522468ce6a0592f5f`:

- GitHub Actions Run `32675858792`: **SUCCESS**
- Vercel Preview `dpl_GcW1UCPMvVS7yWFExRpseDaNc3Ht`: **READY**

Grüne Gates ersetzen den R16-Truth-Befund nicht. Nach einem Fix von Blocker 31 ist ein neues Exact-Head-Gate erforderlich.

## 5. Live Infra / DB – R16 unabhängig geprüft

- Vercel Production `jetnity-app.vercel.app`: READY auf `main` `cd220beb`.
- Vercel Runtime Errors letzte 24h: keine gefunden.
- Supabase Production `qscbgcdmivbbnzrcyegn`: ACTIVE_HEALTHY.
- Supabase Development `yfvbxvijcorffwxbxahl`: ACTIVE_HEALTHY.
- Development-Funktion `public.flug_route_itinerary_metadata(text,jsonb)`: SECURITY INVOKER; `anon` kein EXECUTE; `authenticated` EXECUTE.
- Migration `20260824120000_flug_route_itinerary_surface_evidence`: **Development ja, Production nein**.
- Live-SELECT-Reproduktion auf Development: manipuliertes `surfaceFromAirportCode='JFK'` bleibt in der kanonischen `LAX→JFK`, `SFO→NRT`-Itinerary erhalten.

Supabase Security Advisor meldet bestehende WARNs zur GraphQL-Exponierung verschiedener Objekte und zu mehreren SECURITY-DEFINER-RPCs. R16 behauptet daraus kein automatisches Datenleck und keine neue PR-#38-Regression; diese Hinweise bleiben separate Security-Evidence.

## 6. DB / Kosten / Provider

- keine Seasonal-Tabelle
- `seasonalProviderAus()` bleibt `null`
- keine Live-Provider-Aktivierung
- keine neuen Secrets
- keine neuen laufenden Kosten
- Route-Persistenzmigration nur auf Development
- **keine Production-Migration**

## 7. Exakter nächster Schritt

Nur **R16-Blocker 31** kohärent schließen.

Ziel: Browser-/LocalStorage-/Guest-Input darf `surfaceFromAirportCode` nicht allein durch syntaktische Plausibilität zu belegter Route-Evidence machen. Die Evidence-Quelle muss an der Trust-Grenze unterschieden werden. Zulässig sind insbesondere fail-closed Strip/Reject am untrusted Intake oder ein explizit trusted serverseitiger Evidence-Contract; eine spätere User-Deklaration muss eine eigene Evidence-Klasse sein und darf nicht still als Provider-/Server-Evidence wirken.

Danach:

1. Pflicht-Regressionen aus `docs/PR38_CHATGPT_R16_REVIEW.md` ergänzen.
2. Exact-Head-Gate auf neuem Runtime-Head.
3. Unabhängiger ChatGPT-Re-Review **R17**.
4. Wenn R17 keinen neuen konkreten relevanten Truth-/Security-/Provider-/SoT-/Cross-Domain-/Release-Defekt findet: technisches Closure/PASS dokumentieren und die Review-Schleife nach strengem Stop-Kriterium beenden.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 8. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_R16_REVIEW.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/PR38_CHATGPT_R15_REVIEW.md`
4. `lib/route/schema.ts`
5. `lib/route/kanonisieren.ts`
6. `lib/route/itinerary.ts`
7. `lib/route/chronologie.ts`
8. `lib/trips/aktionen.ts`
9. `lib/trips/anlegen.ts`
10. `supabase/migrations/20260824120000_flug_route_itinerary_surface_evidence.sql`
11. `lib/route/r15-flugoption.test.ts`
12. `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 9. Verbindliche Folgeentscheidung – Multi-Agent-Entwicklungsteam

Account-/Admin-Audits dürfen als abgeschlossene Analyse-/Vorbereitungsworkstreams bestehen bleiben. Ihre Kernimplementierung bleibt bis zum technischen Closure/PASS von PR #38 gesperrt. Gemeinsame Auth/RLS/DB/Traveller-/Route-/Readiness-/Safety-/Seasonal-Contracts bleiben zentral koordiniert.

## 10. Agent-Handoff dieser Session

- Vollständiger Cursor-Anzeigename des PR-#38-Agenten ist dem Technical Lead weiterhin nicht sicher bekannt; in der UI erscheint nur der abgeschnittene Name `Reisezeitpunkt saisonale intellig...`.
- Branch/PR: `feat/travel-timing-seasonal-intelligence` / `#38`
- Letzter Runtime-Head: `5cc4488e`
- R15-Fix 30: implementiert und gegated
- R16: **REQUEST CHANGES / Blocker 31**
- Nicht umgesetzt / nicht behauptet: Blocker-31-Fix, R17, Closure/PASS, Mark Ready, Merge, Production-Migration, Provider-Live-Aktivierung
- Exakter nächster Schritt: Blocker 31 durch denselben PR-#38-Workstream schließen; danach Exact-Head-Gate und unabhängiger R17
