# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R7-Merge-Blocker 13 ist auf Runtime `ece075e7` geschlossen. Der unabhängige R8-Closure-Review wurde vollständig durchgeführt und hat zwei konkrete Restdefekte der Leg-/Route-Topologie gefunden.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R8 Review: `docs/PR38_CHATGPT_R8_REVIEW.md`  
R7 Review: `docs/PR38_CHATGPT_R7_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main beim R8-Lock: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- geprüfter R8-Runtime-Head: `ece075e702c491454c553a9fc931b26308cab1a9`
- R7-Docs-Lock vor R8: `c13cd3f8f208900a230d0173bfe563fd97109a0c`
- Sync beim R8-Lock: **0 behind** `origin/main`
- PR-Zustand: **open, mergeable, Draft, nicht gemergt**

## 3. Status

**REQUEST CHANGES – R7-Blocker 13 geschlossen; R8-Blocker 14 und 15 offen. Noch kein Closure/PASS.**

14. **Open-Jaw-/diskontinuierliche Leg-Ursprünge fehlen in Country-Truth.** Beispiel `ZRH→BKK` und später `SIN→ZRH`: SG ist durch die strukturierte Route belegt, fehlt aber aktuell aus `destinationCountryCodes`; dadurch kann SG aus Seasonal Country Scope/Provider Request, Readiness und Safety verschwinden. Derselbe Fix muss die nullable Item-Chronologie fail-closed behandeln, damit ein strukturiert datierter Outbound nicht wegen fehlendem `TripItem.startsOn` hinter dem Return landet und Country-Rollen invertiert.

15. **Leg-Ursprünge/Leg-Grenzen fehlen in kanonischer Route-Identität und Anzeige.** `segmenteAusItinerary()` + `pfadAusSegmenten()` können `ZRH→BKK | SIN→ZRH` und `ZRH→BKK | HKG→ZRH` auf denselben flachen Pfad reduzieren. Das kann Readiness-Stale verpassen und eine falsche kontinuierliche Route anzeigen.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Bereits umgesetzt / bestätigt

- Seasonal Foundation-Runtime
- Review-Blocker 1–12 auf den bisherigen Runtime-Heads
- R7-Blocker 13 auf `ece075e7` für Roundtrip/Multi-City/Transit-Fälle
- `seasonalProviderAus()` bleibt `null`
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. Gerade offen

- R8-Blocker 14: vollständige source-backed Country-Rollen über Open-Jaw-/diskontinuierliche Legs plus sichere Chronologie
- R8-Blocker 15: leg-aware Route-Fingerprint und menschliche Route-Darstellung
- adversarial Regressionen aus `docs/PR38_CHATGPT_R8_REVIEW.md`
- finaler Exact-Head-Gate nach den Runtime-Fixes
- unabhängiger R9-Closure-Review
- keine Merge-Freigabe
- kein echter Seasonal-Provider

## 6. Letzter grüner Runtime-Gate-Lock auf `ece075e7`

Unabhängig verifiziert:

- GitHub Actions Run `32652022144`: **SUCCESS** auf exakt `ece075e702c491454c553a9fc931b26308cab1a9`
- Vercel Deployment `dpl_ErhdduWunftgMmRRUxqBGCJPtRnV`: **READY** auf exakt `ece075e7`
- Cursor dokumentiert `npm test` **1580/1580**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, 8 Viewports
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- Branch beim Lock **0 behind main**

Diese grünen Gates ersetzen den R8-Code-Review nicht. Nach den R8-Fixes muss das vollständige Gate erneut auf dem neuen Runtime-Head laufen.

## 7. Warum Blocker 14 Cross-Domain ist

Der Open-Jaw-Fall betrifft nicht nur Readiness:

- `seasonalReisekontext().countryCodes` kann das spätere Leg-Origin-Land verlieren;
- `routeBeruehrtLand()` kann einen Country-Seasonal-Fact für dieses Land fälschlich `not_applies` machen;
- `readinessReisekontext()` kann Entry-/Visa-/Document-Kontext für das Land auslassen;
- `safetyReisekontext().countryCodes` kann dasselbe Land aus einer landesweiten Safety-Abfrage verlieren.

Damit greift der verbindliche Jetnity-Standard: fachlich abhängige Funktionen müssen dieselbe kanonische Route-Truth einwandfrei teilen.

## 8. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine Development-/Production-Migration
- `seasonalProviderAus()` bleibt `null`
- kein Live-Provider / Secret / neue laufende Kosten

## 9. Offene Nutzerentscheidungen / Freigaben

- keine Merge-Freigabe
- kein Mark Ready freigegeben
- keine Provider-/Kosten-/Secret-Freigabe
- keine DB-/Production-Migration freigegeben

## 10. Exakter nächster Schritt

Cursor schließt **ausschließlich R8-Blocker 14 und 15 als gemeinsame Leg-Topologie-Härtung**, ergänzt alle Pflicht-Regressionen aus `docs/PR38_CHATGPT_R8_REVIEW.md` und führt danach das vollständige Exact-Head-Gate aus.

Danach unabhängiger ChatGPT-R9-Closure-Review nach Stop-Kriterium. Wenn R9 keinen weiteren konkreten relevanten Defekt findet, technisches Closure/PASS.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 11. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_R8_REVIEW.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/PR38_CURSOR_REVIEW_FIXES.md`
4. `lib/route/laender.ts`
5. `lib/route/ableitung.ts`
6. `lib/route/itinerary.ts`
7. `lib/route/fingerprint.ts`
8. `lib/route/anzeige.ts`
9. `lib/seasonal/kontext.ts`
10. `lib/seasonal/relevanz.ts`
11. `lib/readiness/kontext.ts`
12. `lib/safety/kontext.ts`
