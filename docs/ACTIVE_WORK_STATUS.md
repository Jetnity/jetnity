# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R5-Merge-Blocker 10–11 sind geschlossen. Exact-Head-Gate auf Runtime `249d4b9b` ist lokal und remote grün. Unabhängiger R6-Closure-Review steht aus.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R1/R2 Review: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
R3 Review: `docs/PR38_CHATGPT_R3_REVIEW.md`  
R4 Review: `docs/PR38_CHATGPT_R4_REVIEW.md`  
R5 Review: `docs/PR38_CHATGPT_R5_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R5-Runtime-Head: `249d4b9b24fed89070adfbd0bcaaacaeb481ba46`
- Sync: **0 behind** `origin/main`
- PR-Zustand: **open, Draft, nicht gemergt**

## 3. Status

**R5-Blocker 10–11 geschlossen. Exact-Head-Gate grün. Noch kein Closure/PASS – R6 offen.**

10. Provider-Request trägt kanonische Stage-Targets und getrennte Route-/Airport-Zeitkontakte. Die grobe Top-Level-Hülle bleibt erhalten, ersetzt die konkreten Kontakte aber nicht.
11. Explizite Acute-/Safety-Klasse bleibt `rejected_acute` / `acuteRejected=true`, auch kombiniert mit `temporarily_unavailable`. Kein Rematerialisieren als `seasonal_pattern`.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Bereits umgesetzt / bestätigt

- Seasonal Foundation-Runtime
- Erst-Review-Blocker 1–4 auf `89290eff`
- R2 Missing-Class- und Tripgraph-Fixes auf `aa6cafa2`
- R3 rejected-acute- und Reverse-Date-Fixes auf `4f9eb1e8`
- R4 Top-Level-Hülle- und Day→Stage-Impact-Fixes auf `f077d4d1`
- R5-Blocker 10–11 auf `249d4b9b`
- `seasonalProviderAus()` bleibt `null`
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. Gerade offen

- unabhängiger R6-Closure-Review nach Stop-Kriterium
- keine Merge-Freigabe
- kein echter Seasonal-Provider

## 6. R5 Exact-Head-Gate auf `249d4b9b`

Lokal und remote verifiziert:

- `npm test` **1567/1567**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, 8 Viewports
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- GitHub Actions Run `32648396768`: **SUCCESS** auf exakt `249d4b9b24fed89070adfbd0bcaaacaeb481ba46`
- Vercel Deployment `dpl_GPSjX8wWkst6hWTCqSk2TVkE9EZW`: GitHub-Status **success** auf exakt `249d4b9b`
- Main unverändert `cd220beb`, Branch **0 behind**

Grüne Gates ersetzen den R6-Code-Review nicht.

## 7. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine Development-/Production-Migration
- `seasonalProviderAus()` bleibt `null`
- kein Live-Provider / Secret / neue laufende Kosten
- Blocker 10 ist nur der Jetnity-seitige provider-neutrale Request-Vertrag, kein Live-Adapter

## 8. Bekannte spätere Nähte – aktuell nicht merge-blocking

- In-process Rate-Limit nur Preview/Dev
- Account-`tripId`-Serverload spätere Naht
- keine persistierte Nutzerentscheidung `Trotzdem so planen`
- title-only Geo bleibt unknown
- konkrete Provider-Auth/Parameter/Lizenzen/Kosten bleiben spätere Live-Providerphase

## 9. Offene Nutzerentscheidungen / Freigaben

- keine Merge-Freigabe
- kein Mark Ready freigegeben
- keine Provider-/Kosten-/Secret-Freigabe
- keine DB-/Production-Migration freigegeben

## 10. Exakter nächster Schritt

Unabhängiger ChatGPT-Re-Review R6 nach Stop-Kriterium. Kein PASS allein wegen grüner Gates.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 11. Welche Dateien zuerst gelesen werden müssen

1. `JETNITY_HANDOFF.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
4. `docs/PR38_CHATGPT_R5_REVIEW.md`
5. `docs/PR38_CURSOR_REVIEW_FIXES.md`
6. `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`
7. `lib/seasonal/provider.ts`
8. `lib/seasonal/kontext.ts`
9. `lib/seasonal/route-kontakte.ts`
10. `lib/seasonal/normalisieren.ts`
11. `lib/seasonal/engine.ts`
12. `lib/seasonal/status.ts`
