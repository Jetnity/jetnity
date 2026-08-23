# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R8-Merge-Blocker 14 und 15 sind auf Runtime `de83d026` geschlossen. Exact-Head-Gate auf diesem Head ist lokal und remote grün. Unabhängiger R9-Closure-Review steht aus.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R8 Review: `docs/PR38_CHATGPT_R8_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R8-Runtime-Head: `de83d0269e1910ef82a596dd6e7005001f1cb860`
- Sync: **0 behind** `origin/main`
- PR-Zustand: **open, Draft, nicht gemergt**

## 3. Status

**R8-Blocker 14 und 15 geschlossen. Exact-Head-Gate grün. Noch kein Closure/PASS – R9 offen.**

14. Spätere Leg-Ursprünge, die nicht das bewiesene Reise-Origin sind, gehören zur Country-Truth. Open Jaw trägt `TH` und `SG`. Unklare Chronologie erfindet kein Origin aus dem lexikographischen Pfad.

15. Fingerprint und Anzeige behalten Leg-Grenzen und jeden Leg-Origin. `SIN` und `HKG` als Rückflug-Origin sind unterschiedliche Identitäten.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Bereits umgesetzt / bestätigt

- Seasonal Foundation-Runtime
- Review-Blocker 1–13 auf den bisherigen Runtime-Heads
- Blocker 14 und 15 auf `de83d026`
- `seasonalProviderAus()` bleibt `null`
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. Gerade offen

- unabhängiger R9-Closure-Review nach Stop-Kriterium
- keine Merge-Freigabe
- kein echter Seasonal-Provider

## 6. R8 Exact-Head-Gate auf `de83d026`

Lokal und remote verifiziert:

- `npm test` **1593/1593**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, 8 Viewports
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- GitHub Actions Run `32654092944`: **SUCCESS** auf exakt `de83d0269e1910ef82a596dd6e7005001f1cb860`
- Vercel Preview: **SUCCESS** auf `https://vercel.com/jetnity-e1b93c82/jetnity-app/F9g6B69cw1B12Q2YRK2oyoC9okTE`
- Main unverändert `cd220beb`, Branch **0 behind**

Grüne Gates ersetzen den R9-Code-Review nicht.

## 7. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine Development-/Production-Migration
- `seasonalProviderAus()` bleibt `null`
- kein Live-Provider / Secret / neue laufende Kosten

## 8. Offene Nutzerentscheidungen / Freigaben

- keine Merge-Freigabe
- kein Mark Ready freigegeben
- keine Provider-/Kosten-/Secret-Freigabe
- keine DB-/Production-Migration freigegeben

## 9. Exakter nächster Schritt

Unabhängiger ChatGPT-Re-Review R9 nach Stop-Kriterium. Kein PASS allein wegen grüner Gates.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 10. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_R8_REVIEW.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/PR38_CURSOR_REVIEW_FIXES.md`
4. `lib/route/laender.ts`
5. `lib/route/chronologie.ts`
6. `lib/route/fingerprint.ts`
7. `lib/route/anzeige.ts`
8. `lib/route/ableitung.ts`
