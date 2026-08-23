# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R6-Merge-Blocker 12 ist im Code geschlossen. Exact-Head-Gate auf dem neuen Runtime-Head und unabhängiger R7-Re-Review stehen aus.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R6 Review: `docs/PR38_CHATGPT_R6_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- Letzter bestätigter Runtime-Head vor diesem Fix: `249d4b9b24fed89070adfbd0bcaaacaeb481ba46`
- PR-Zustand: **open, Draft, nicht gemergt**
- Tatsächlichen Head vor jeder Gate-Aussage neu prüfen.

## 3. Status

**R6-Codefix für Blocker 12 implementiert. Noch kein Closure/PASS. Exact-Head-Gate und R7 offen.**

12. Foundation D projiziert Airport-Zeitkontakte nur innerhalb eines belegten Legs. Getrennte Flight-Items / Legs bleiben getrennte Kontakte. Seasonal-Relevanz, Provider-Request und Safety lesen dieselbe Liste.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Bereits umgesetzt / bestätigt

- Seasonal Foundation-Runtime
- Review-Blocker 1–11 auf den bisherigen Runtime-Heads
- Blocker 12 im nachfolgenden Runtime-Head
- `seasonalProviderAus()` bleibt `null`
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. Gerade offen

- Exact-Head Full Gate auf dem R6-Fix-Runtime-Head
- unabhängiger R7-Closure-Review
- keine Merge-Freigabe
- kein echter Seasonal-Provider

## 6. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine Development-/Production-Migration
- `seasonalProviderAus()` bleibt `null`
- kein Live-Provider / Secret / neue laufende Kosten

## 7. Offene Nutzerentscheidungen / Freigaben

- keine Merge-Freigabe
- kein Mark Ready freigegeben
- keine Provider-/Kosten-/Secret-Freigabe
- keine DB-/Production-Migration freigegeben

## 8. Exakter nächster Schritt

Exact-Head Full Gate auf dem Blocker-12-Runtime-Head, danach unabhängigen R7-Closure-Review nach Stop-Kriterium. Kein PASS allein wegen grüner Gates.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 9. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_R6_REVIEW.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `lib/route/kontakte.ts`
4. `lib/route/ableitung.ts`
5. `lib/seasonal/route-kontakte.ts`
6. `lib/safety/relevanz.ts`
