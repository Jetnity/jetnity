# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R3-Merge-Blocker sind im Code geschlossen; unabhängiger R4-Re-Review hat zwei weitere konkrete Merge-Blocker gefunden.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R1/R2 Review: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
R3 Review: `docs/PR38_CHATGPT_R3_REVIEW.md`  
R4 Review: `docs/PR38_CHATGPT_R4_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main zu R4-Beginn: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R3-Runtime-Head: `4f9eb1e8c524494fa8ab300bdfe24ec372e9e109`
- PR-Head zu R4-Beginn: `218961b337b585da691d6b310dda24b9653d4568`
- R4-Review-Commit: `3a3e7d645cf53d4234b338afd11eedc38249401b`
- Sync zu R4-Beginn: **20 ahead, 0 behind** `main`
- PR-Zustand zu R4-Beginn: **open, mergeable, Draft, nicht gemergt**

## 3. Status

**R4: REQUEST CHANGES. Kein Closure/PASS.**

Bestätigt geschlossen auf Runtime `4f9eb1e8`:

1. Residual Blocker 5: `active_warning` / `acute` / `acute_event` bleiben `rejected_acute` mit `acuteRejected=true`; acute-only ist fail-closed `unknown`.
2. Blocker 7: rückwärts laufende Top-Level- und Stage-Datumsbereiche werden abgelehnt bzw. zu `insufficient` degradiert; kein falsches `not_applies`.

Neu offen aus R4:

3. **Blocker 8 – konkrete Stage-/Route-Zeit darf nicht von widersprüchlicher Top-Level-Hülle überstimmt werden.** Ein formal geordnetes Top-Level-Fenster kann derzeit vor Prüfung konkreter `affectedRefs` zu `not_applies` abbrechen, obwohl eine konkret betroffene Stage/Route das Seasonal Window überlappt.
4. **Blocker 9 – belegte `item.dayId → day.stageId`-Beziehung fehlt in der Item-Impact-Ableitung.** Ein gültiges Item mit `stageId=null`, das über seinen Tag eindeutig an einer betroffenen Stage hängt, erhält derzeit keinen passenden Activity/Stay/Mobility/Rental-Car-Impact; dadurch kann auch `nextAction` zu unspezifisch werden.

Details und Pflicht-Regressionen: `docs/PR38_CHATGPT_R4_REVIEW.md`.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Bereits umgesetzt / bestätigt

- Seasonal Foundation-Runtime
- Erst-Review-Blocker 1–4 auf `89290eff`
- R2 Missing-Class-Kernfix und API-ID-/Referenzintegrität auf `aa6cafa2`
- R3 rejected-acute- und Reverse-Date-Fixes auf `4f9eb1e8`
- R4 bestätigt diese R3-Fixes unabhängig
- `seasonalProviderAus()` bleibt `null`
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. Gerade offen

- Blocker 8 aus R4 schließen
- Blocker 9 aus R4 schließen
- adversarial Regressionen aus `docs/PR38_CHATGPT_R4_REVIEW.md`
- danach kompletter Exact-Head-Gate auf neuem Runtime-Head
- danach unabhängiger R5-Closure-Re-Review
- keine Merge-Freigabe

## 6. R3 Exact-Head-Gate auf `4f9eb1e8`

Lokal von Cursor dokumentiert und remote unabhängig bestätigt:

- `npm test` **1557/1557**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, 8 Viewports
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- GitHub Actions SUCCESS auf Runtime `4f9eb1e8`: Run `32643429557`
- Vercel Preview READY auf Runtime `4f9eb1e8`: Deployment `dpl_ERBqeUKG7NWQ2agr4GiR5JpAxxit`, Commit exakt `4f9eb1e8`
- GitHub Actions SUCCESS auf Docs-/Evidence-Head `218961b3`: Run `32644542681`
- Vercel Preview READY auf `218961b3`: Deployment `dpl_D5XUmap2LVproLHT1MBSkvwzFuHc`
- Diff `4f9eb1e8 → 218961b3`: ausschließlich Dokumentation, keine Seasonal-Runtime-Änderung
- Production/Main zu R4-Beginn unverändert `cd220beb`

Diese grünen Gates sind Evidenz, aber kein Fehlerfreiheitsbeweis; R4-Blocker 8–9 bleiben merge-blocking.

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

Cursor soll ausschließlich die beiden R4-Blocker nach `docs/PR38_CHATGPT_R4_REVIEW.md` schließen, die verlangten Regressionen ergänzen und danach den vollständigen Exact-Head-Gate inklusive **0 behind** ausführen.

Danach unabhängiger ChatGPT-Re-Review **R5** nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` und Stop-Kriterium. Ein PASS nur, wenn keine konkrete merge-blocking Truth-/Security-/Data-Loss-/Release-/zentrale Foundation-Lücke mehr verbleibt.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 11. Welche Dateien zuerst gelesen werden müssen

1. `JETNITY_HANDOFF.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
4. `docs/PR38_CHATGPT_R4_REVIEW.md`
5. `docs/PR38_CHATGPT_R3_REVIEW.md`
6. `docs/PR38_CURSOR_REVIEW_FIXES.md`
7. `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`
8. `lib/seasonal/relevanz.ts`
9. `lib/seasonal/impact.ts`
10. `lib/seasonal/kontext.ts`
11. `lib/seasonal/schema.ts`
12. `lib/seasonal/kalender.ts`
13. `lib/seasonal/engine.test.ts`
