# Jetnity – Active Work Status

Stand: 24. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R13-Merge-Blocker 28 ist auf Runtime `2ba32449` implementiert und lokal/remote gegated. Der unabhängige R14-Review wurde durchgeführt und findet einen neuen konkreten Merge-Blocker 29 an der Route-Persistenzgrenze. Noch kein technisches Closure/PASS.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R14 Review: `docs/PR38_CHATGPT_R14_REVIEW.md`  
R13 Review: `docs/PR38_CHATGPT_R13_REVIEW.md`  
R12 Review: `docs/PR38_CHATGPT_R12_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`  
Multi-Agent-Folgeentscheidung: `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main beim R13-Runtime-Lock: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R13-Runtime-Head: `2ba324495bcbe0acf9c106a68d7d004f69279930`
- R13-Docs-Lock vor R14: `b3035ffd1f7e9483524ad1089d4730b421edc208`
- R14-Review-Doku: `5744e3327e31bb8abfb15efdb9f3494dd30e6e9f`
- PR-Zustand: **open, Draft, nicht gemergt**

## 3. Status

**R14 = REQUEST CHANGES. Blocker 29 offen. Noch kein Closure/PASS.**

R13-Fix 28 ist im TypeScript-/Route-Runtime substanziell geschlossen:

28. Country-Gleichheit beweist keine Surface-Verbindung. Eine Surface-Kante existiert nur bei explizitem `surfaceFromAirportCode` am Folgesegment. `LAX→JFK` + `SFO→NRT` und `CDG⇢ORY` ohne dieses Feld bleiben fail-closed. `CDG⇢ORY` mit Evidence bleibt im Runtime-Modell bewiesen und rekonstruierbar.

R14-Blocker 29:

29. **Die kanonische Supabase-Persistenz entfernt `surfaceFromAirportCode`.** Die aktive Development-Funktion `public.flug_route_itinerary_metadata(text,jsonb)` baut Segmente ohne dieses Feld neu auf; der aktive Trigger `trip_items_route_itinerary_schuetzen` ruft sie bei INSERT/UPDATE auf. Eine unabhängige SELECT-Probe auf Development `yfvbxvijcorffwxbxahl` bestätigt, dass eine gültige `CDG⇢ORY`-Evidence beim Kanonisieren verloren geht. Dadurch kann dieselbe Reise nach Persistieren/Reload von bewiesen auf unknown wechseln; Fingerprint, Connections, Readiness, Safety und Seasonal können sich allein durch Speichern ändern.

R12-Fix 27, R11-Fixes 24–26 und Blocker 1–28 bleiben ansonsten geschlossen.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Exact-Head-Evidence des R13-Runtime-Heads

Auf exakt `2ba324495bcbe0acf9c106a68d7d004f69279930` unabhängig verifiziert:

- GitHub Actions Run `32671367206`: **SUCCESS**
- Vercel Deployment `dpl_7mKYGGX5LhTAUUwFYNrBTtrjnsou`: **READY**, `githubCommitSha=2ba324495bcbe0acf9c106a68d7d004f69279930`
- Cursor-Gate: `npm test` **1675/1675**, Typecheck/Lint/Hygiene grün, Production-Build Exit 0, UI-Audit **1014/1014**, DB Rechte 51 / RLS Exit 0 / Sicherheit **210/210** / Parallelität **7/7**
- Docs-Lock `b3035ffd` hat ebenfalls erfolgreiche CI; er ist kein zweites Runtime-Gate.

Grüne Gates ersetzen den Persistenz-Review nicht.

## 5. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine Seasonal-Provider-Live-Aktivierung
- `seasonalProviderAus()` bleibt `null`
- keine neuen Secrets
- keine neuen laufenden Kosten
- keine Production-Migration ohne ausdrückliche Freigabe

Blocker 29 kann eine kleine **Route-Persistenz-/Function-Migration auf Development** erforderlich machen, weil eine bereits angewandte DB-Funktion den neuen Domainvertrag nicht kennt. Eine bereits angewandte Migration darf nicht still umgeschrieben werden. Production bleibt gesperrt.

## 6. Exakter nächster Schritt

Nur Blocker 29 kohärent schließen:

1. kanonische DB-Persistenz muss gültiges `surfaceFromAirportCode` bzw. äquivalente explizite Surface-Evidence erhalten;
2. Persistenz-/Reload-/Guest→Account-Roundtrip testen;
3. Fingerprint, Connection/UI, Readiness, Safety und Seasonal müssen vor/nach Persistenz identisch bleiben;
4. ungültige Evidence weiter fail-closed behandeln;
5. Exact-Head-Gate auf neuem Runtime-Head;
6. unabhängiger ChatGPT-Re-Review **R15**.

Wenn R15 keinen neuen konkreten relevanten Truth-/Security-/Provider-/SoT-/Cross-Domain-/Release-Defekt findet: technisches Closure/PASS dokumentieren und die Review-Schleife nach strengem Stop-Kriterium beenden.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 7. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_R14_REVIEW.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/PR38_CHATGPT_R13_REVIEW.md`
4. `docs/PR38_CURSOR_REVIEW_FIXES.md`
5. `lib/route/domain.ts`
6. `lib/route/schema.ts`
7. `lib/route/itinerary.ts`
8. `lib/route/chronologie.ts`
9. `supabase/migrations/20260822140000_flug_route_itinerary_airport_truth.sql`
10. `supabase/migrations/20260822150000_trip_items_route_itinerary_guard.sql`
11. `lib/route/r13-chronologie.test.ts`
12. `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 8. Verbindliche Folgeentscheidung – Multi-Agent-Entwicklungsteam

Account-/Admin-Audits dürfen parallel als Analyse-/Vorbereitungsworkstreams laufen. Gemeinsame Auth/RLS/DB/Traveller-/Route-/Readiness-/Safety-/Seasonal-Contracts bleiben bis zur koordinierten Integrationsfreigabe geschützt.

Grundprinzip:

> **Parallel entwickeln, zentral koordinieren, unabhängig prüfen, kontrolliert integrieren.**

## 9. Agent-Handoff dieser Session

- Vollständiger Cursor-Anzeigename des PR-#38-Agenten ist dem Technical Lead weiterhin nicht sicher bekannt; in der UI erscheint nur der abgeschnittene Name `Reisezeitpunkt saisonale intellig...`. Nicht umbenennen oder ergänzen, bis der exakte Name sichtbar bestätigt ist.
- Branch/PR: `feat/travel-timing-seasonal-intelligence` / `#38`
- Letzter geprüfter Runtime-Head: `2ba32449`
- R14-Ergebnis: REQUEST CHANGES, Blocker 29 Persistenzverlust der Surface-Evidence
- Nicht umgesetzt / nicht behauptet: Blocker-29-Fix, R15, Mark Ready, Merge, Production-Migration, Provider-Live-Aktivierung
- Exakter nächster Schritt: R14 lesen und nur Blocker 29 kohärent schließen
