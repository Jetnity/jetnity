# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R5-Merge-Blocker 11 ist im R6-Re-Review bestätigt geschlossen; Blocker 10 ist grundsätzlich umgesetzt, hat aber einen konkreten Routekontakt-Restpfad. **Merge-Blocker 12 ist offen.**

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R1/R2 Review: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
R3 Review: `docs/PR38_CHATGPT_R3_REVIEW.md`  
R4 Review: `docs/PR38_CHATGPT_R4_REVIEW.md`  
R5 Review: `docs/PR38_CHATGPT_R5_REVIEW.md`  
R6 Review: `docs/PR38_CHATGPT_R6_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main bei R6: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- letzter geprüfter Runtime-Head: `249d4b9b24fed89070adfbd0bcaaacaeb481ba46`
- R5-Docs-Lock: `286d91b10d4299d01e4346bb9f7dbbe748281d69`
- Sync zu R6-Beginn: **29 ahead, 0 behind** `main`
- PR-Zustand zu R6-Beginn: **open, mergeable, Draft, nicht gemergt**

## 3. Status

**R6 = REQUEST CHANGES. Kein Closure/PASS.**

Bestätigt geschlossen:

- Blocker 11: Acute-/Safety-Klassen bleiben auch mit `temporarily_unavailable` `rejected_acute` / `acuteRejected=true`.
- Blocker 10: Stage-Targets und die grundsätzliche Routekontakt-Naht sind im Provider-Request vorhanden.

Offen:

- **Blocker 12:** `airportKontakte()` verbindet jede benachbarte `destination(code) → origin(code)`-Kombination in der abgeflachten Foundation-D-Segmentliste zu einem Intervall. Dadurch können getrennte Flight-Items / getrennte Legs über einen mehrtägigen Zielaufenthalt hinweg zu einem falschen Dauer-Airport-Kontakt verschmolzen werden. Lokale Seasonal-Relevanz und Provider-Request konsumieren dieselbe falsche Kontaktprojektion.

Beispiel: separate Flüge `ZRH→BKK` Ankunft 13.09. und `BKK→ZRH` Abflug 20.09. dürfen für BKK **nicht** den Kontakt `13.09→20.09` erzeugen. Ein BKK-Airport-Fact nur am 15.09. darf dadurch nicht fälschlich `applies` werden.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Bereits umgesetzt / bestätigt

- Seasonal Foundation-Runtime
- Erst-Review-Blocker 1–4 auf `89290eff`
- R2 Missing-Class- und Tripgraph-Fixes auf `aa6cafa2`
- R3 rejected-acute- und Reverse-Date-Fixes auf `4f9eb1e8`
- R4 Top-Level-Hülle- und Day→Stage-Impact-Fixes auf `f077d4d1`
- R5 Provider-Target-/Acute-Unavailable-Fixes auf `249d4b9b`
- `seasonalProviderAus()` bleibt `null`
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. R5 Exact-Head-Evidenz auf `249d4b9b`

Unabhängig verifiziert:

- `npm test` laut Gate **1567/1567**
- Typecheck / Lint / Hygiene laut Gate grün
- Production-Build Exit 0, UI-Audit 1014/1014 laut Gate
- DB-Gates laut Gate: Rechte 51, RLS Exit 0, Sicherheit 210/210, Parallelität 7/7
- GitHub Actions Run `32648396768`: **SUCCESS** auf exakt `249d4b9b`
- Vercel Deployment `dpl_GPSjX8wWkst6hWTCqSk2TVkE9EZW`: **READY**, Commit exakt `249d4b9b`
- Docs-Lock `286d91b1`: GitHub Actions Run `32649108342` **SUCCESS**, Vercel `dpl_5NAH3iYZSskTWUFhy2YtW9bExVgc` **READY**
- Diff Runtime → Docs-Lock: nur Dokumentation

Grüne Gates überstimmen Blocker 12 nicht.

## 6. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine Development-/Production-Migration
- `seasonalProviderAus()` bleibt `null`
- kein Live-Provider / Secret / neue laufende Kosten

## 7. Bekannte spätere Nähte – aktuell nicht merge-blocking

- In-process Rate-Limit nur Preview/Dev
- Account-`tripId`-Serverload spätere Naht
- keine persistierte Nutzerentscheidung `Trotzdem so planen`
- title-only Geo bleibt unknown
- konkrete Provider-Auth/Parameter/Lizenzen/Kosten bleiben spätere Live-Providerphase

## 8. Offene Nutzerentscheidungen / Freigaben

- keine Merge-Freigabe
- kein Mark Ready freigegeben
- keine Provider-/Kosten-/Secret-Freigabe
- keine DB-/Production-Migration freigegeben

## 9. Exakter nächster Schritt

Cursor schließt ausschließlich Blocker 12 nach `docs/PR38_CHATGPT_R6_REVIEW.md` und ergänzt die dort verlangten Regressionen. Wenn dafür Foundation-D-Routecode geändert wird, müssen Route-/Safety-Regressionen vollständig mitlaufen.

Danach vollständiges Exact-Head-Gate und unabhängiger R7-Closure-Check nach strengem Stop-Kriterium. Kein Mark Ready. Kein Merge.

## 10. Welche Dateien zuerst gelesen werden müssen

1. `JETNITY_HANDOFF.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
4. `docs/PR38_CHATGPT_R6_REVIEW.md`
5. `docs/PR38_CHATGPT_R5_REVIEW.md`
6. `lib/seasonal/route-kontakte.ts`
7. `lib/seasonal/relevanz.ts`
8. `lib/seasonal/kontext.ts`
9. `lib/route/ableitung.ts`
10. `lib/route/itinerary.ts`
11. `lib/seasonal/provider-anfrage.test.ts`
12. `lib/seasonal/engine.test.ts`
