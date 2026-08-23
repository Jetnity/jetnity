# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R5-Merge-Blocker 10–11 sind im Code geschlossen. Exact-Head-Gate auf dem neuen Runtime-Head und unabhängiger R6-Re-Review stehen noch aus.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R1/R2 Review: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
R3 Review: `docs/PR38_CHATGPT_R3_REVIEW.md`  
R4 Review: `docs/PR38_CHATGPT_R4_REVIEW.md`  
R5 Review: `docs/PR38_CHATGPT_R5_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main bei R5: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R4-Runtime-Head: `f077d4d1e45366dd7dfa50bf2f98461d71b8279c`
- R5-Review-Docs-Head: `14c39467a7a559593219a96c9649805dc5d35b04`
- PR-Zustand: **open, Draft, nicht gemergt**
- Tatsächlichen Head vor jeder Gate-/CI-/Preview-Aussage neu prüfen.

## 3. Status

**R5-Codefixes für Blocker 10–11 implementiert. Noch kein Closure/PASS. Exact-Head-Gate und R6 offen.**

Im Code geschlossen, lokal gegen Seasonal-Tests geprüft:

10. Provider-Request trägt kanonische Stage-Targets und getrennte Route-/Airport-Zeitkontakte. Die grobe Top-Level-Hülle bleibt erhalten, ersetzt die konkreten Kontakte aber nicht.
11. Explizite Acute-/Safety-Klasse bleibt `rejected_acute` / `acuteRejected=true`, auch kombiniert mit `temporarily_unavailable`. Kein Rematerialisieren als `seasonal_pattern`.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Bereits umgesetzt / bestätigt

- Seasonal Foundation-Runtime
- Erst-Review-Blocker 1–4 auf `89290eff`
- R2 Missing-Class- und Tripgraph-Fixes auf `aa6cafa2`
- R3 rejected-acute- und Reverse-Date-Fixes auf `4f9eb1e8`
- R4 Top-Level-Hülle- und Day→Stage-Impact-Fixes auf `f077d4d1`
- R5 bestätigt R4-Fixes fachlich
- R5-Blocker 10–11 im nachfolgenden Runtime-Head
- `seasonalProviderAus()` bleibt `null`
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. Gerade offen

- Exact-Head Full Gate auf dem neuen Runtime-Head
- unabhängiger R6-Closure-Review
- keine Merge-Freigabe
- kein echter Seasonal-Provider

## 6. R4 Exact-Head-Gate auf `f077d4d1`

Unabhängig verifiziert, gilt **nicht** als R5-Fix-Gate:

- GitHub Actions Run `32645477815`: **SUCCESS** auf exakt `f077d4d1e45366dd7dfa50bf2f98461d71b8279c`
- Vercel Deployment `dpl_zm3hQgmNLkLG6aagbdPePF1Jqyr7`: **READY**, exakt Runtime `f077d4d1`
- `npm test` laut Gate: **1559/1559**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**

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

Exact-Head Full Gate auf dem R5-Fix-Runtime-Head ausführen, danach unabhängigen R6-Closure-Review nach Stop-Kriterium. Kein PASS allein wegen grüner Gates.

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
