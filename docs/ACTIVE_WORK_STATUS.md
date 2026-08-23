# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R4-Merge-Blocker 8–9 sind im Code geschlossen; unabhängiger R5-Re-Review ist der nächste Schritt.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R1/R2 Review: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
R3 Review: `docs/PR38_CHATGPT_R3_REVIEW.md`  
R4 Review: `docs/PR38_CHATGPT_R4_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R4-Runtime-Head: `f077d4d1e45366dd7dfa50bf2f98461d71b8279c`
- Sync: **0 behind** `main`
- PR-Zustand: **open, Draft, nicht gemergt**

## 3. Status

**R4-Fixes umgesetzt. Kein Closure/PASS ohne R5.**

Geschlossen auf `f077d4d1`:

1. Blocker 8: konkrete Stage-/Route-Kontakte bestimmen die zeitliche Relevanz; eine widersprüchliche Top-Level-Hülle erzeugt kein vorzeitiges `not_applies`.
2. Blocker 9: belegte `item.dayId → day.stageId`-Beziehung erzeugt konservativen Item-Impact; `nextAction` wird bei betroffener Activity zu `check_activity`.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Bereits umgesetzt / bestätigt

- Seasonal Foundation-Runtime
- Erst-Review-Blocker 1–4 auf `89290eff`
- R2 Missing-Class- und Tripgraph-Fixes auf `aa6cafa2`
- R3 rejected-acute- und Reverse-Date-Fixes auf `4f9eb1e8`
- R4 Top-Level-Hülle- und Day→Stage-Impact-Fixes auf `f077d4d1`
- `seasonalProviderAus()` bleibt `null`
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. Gerade offen

- unabhängiger R5-Re-Review / Closure nach Stop-Kriterium
- keine Merge-Freigabe
- kein echter Seasonal-Provider

## 6. R4 Exact-Head-Gate auf `f077d4d1`

Lokal und remote verifiziert:

- PR open / Draft / nicht gemergt
- `main` = `cd220beb`
- Branch = **0 behind**
- `npm test` **1559/1559**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, 8 Viewports
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- GitHub Actions SUCCESS: https://github.com/Jetnity/jetnity/actions/runs/32645477815
- Vercel Preview READY: https://vercel.com/jetnity-e1b93c82/jetnity-app/zm3hQgmNLkLG6aagbdPePF1Jqyr7
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

Unabhängiger ChatGPT-Re-Review R5 nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` und Stop-Kriterium gegen Runtime `f077d4d1`. Ein PASS nur, wenn keine konkrete merge-blocking Truth-/Security-/Data-Loss-/Release-/Foundation-Lücke bleibt.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 11. Welche Dateien zuerst gelesen werden müssen

1. `JETNITY_HANDOFF.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
4. `docs/PR38_CHATGPT_R4_REVIEW.md`
5. `docs/PR38_CURSOR_REVIEW_FIXES.md`
6. `lib/seasonal/relevanz.ts`
7. `lib/seasonal/impact.ts`
8. `lib/seasonal/kontext.ts`
9. `lib/seasonal/engine.test.ts`
