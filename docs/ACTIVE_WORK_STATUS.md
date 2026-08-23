# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R3-Merge-Blocker sind im Code geschlossen; unabhängiger R4-Re-Review ist der nächste Schritt.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R1/R2 Review: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
R3 Review: `docs/PR38_CHATGPT_R3_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R3-Runtime-Head: `4f9eb1e8c524494fa8ab300bdfe24ec372e9e109`
- Sync: **0 behind** `main`
- PR-Zustand: **open, Draft, nicht gemergt**

## 3. Status

**R3-Fixes umgesetzt. Kein Closure/PASS ohne R4.**

Geschlossen auf `4f9eb1e8`:

1. Residual Blocker 5: `active_warning` / `acute` / `acute_event` tragen intern und API-sichtbar `rejected_acute` mit `acuteRejected=true`. Acute-only ist fail-closed `unknown`, kein sauberes `checked_empty` / vollständiges `ok`.
2. Blocker 7: rückwärts laufende Top-Level- und Stage-Datumsbereiche werden an der untrusted API-Grenze abgelehnt; Relevanz-/Kalenderhelfer erzeugen daraus kein falsches `not_applies`.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Bereits umgesetzt / bestätigt

- Seasonal Foundation-Runtime
- Erst-Review-Blocker 1–4 auf `89290eff`
- R2 Missing-Class-Kernfix und API-ID-/Referenzintegrität auf `aa6cafa2`
- R3 rejected-acute- und Reverse-Date-Fixes auf `4f9eb1e8`
- `seasonalProviderAus()` bleibt `null`
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. Gerade offen

- unabhängiger R4-Re-Review / Closure nach Stop-Kriterium
- keine Merge-Freigabe
- kein echter Seasonal-Provider

## 6. R3 Exact-Head-Gate auf `4f9eb1e8`

Lokal und remote verifiziert:

- PR open / Draft / nicht gemergt
- `main` = `cd220beb`
- Branch = **0 behind**
- `npm test` **1557/1557**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, 8 Viewports
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- GitHub Actions SUCCESS: https://github.com/Jetnity/jetnity/actions/runs/32643429557
- Vercel Preview READY: https://vercel.com/jetnity-e1b93c82/jetnity-app/ERBqeUKG7NWQ2agr4GiR5JpAxxit
- Production/Main unverändert `cd220beb`

## 7. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine Development-/Production-Migration
- `seasonalProviderAus()` bleibt `null`
- kein Live-Provider / Secret / neue laufende Kosten

## 8. Bekannte spätere Nähte – aktuell nicht merge-blocking

- In-process Rate-Limit nur Preview/Dev
- Account-`tripId`-Serverload spätere Naht
- keine persistierte Nutzerentscheidung `Trotzdem so planen`
- title-only Geo bleibt unknown

## 9. Offene Nutzerentscheidungen / Freigaben

- keine Merge-Freigabe
- kein Mark Ready freigegeben
- keine Provider-/Kosten-/Secret-Freigabe
- keine DB-/Production-Migration freigegeben

## 10. Exakter nächster Schritt

Unabhängiger ChatGPT-Re-Review R4 nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` und Stop-Kriterium gegen Head `4f9eb1e8` plus nachfolgenden Docs-Lock. Ein PASS nur, wenn keine konkrete merge-blocking Truth-/Security-/Data-Loss-/Release-Lücke bleibt.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 11. Welche Dateien zuerst gelesen werden müssen

1. `JETNITY_HANDOFF.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
4. `docs/PR38_CHATGPT_R3_REVIEW.md`
5. `docs/PR38_CURSOR_REVIEW_FIXES.md`
6. `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`
7. `lib/seasonal/normalisieren.ts`
8. `lib/seasonal/engine.ts`
9. `lib/seasonal/status.ts`
10. `lib/seasonal/schema.ts`
11. `lib/seasonal/relevanz.ts`
12. `lib/seasonal/kalender.ts`
