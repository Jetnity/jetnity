# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R4-Merge-Blocker 8–9 sind geschlossen; unabhängiger R5-Re-Review hat zwei neue konkrete Merge-Blocker 10–11 gefunden.

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
- Docs-Lock zu R5-Beginn: `37f1ec4317c13ba007a1bd75283ed6102c6acc8b` (keine Runtime-Änderung)
- Sync zu R5-Beginn: **24 ahead, 0 behind** `main`
- PR-Zustand: **open, mergeable, Draft, nicht gemergt**
- Nachfolgende R5-Review-/Status-Commits ändern keine Runtime; tatsächlichen Head vor jeder weiteren Aussage neu prüfen.

## 3. Status

**REQUEST CHANGES – R5: Blocker 10 und 11 offen. Noch kein Closure/PASS.**

Auf Runtime `f077d4d1` bestätigt geschlossen:

1. Blocker 8: konkrete Stage-/Route-Kontakte bestimmen die lokale Zeitrelevanz; widersprüchliche grobe Top-Level-Hülle erzeugt kein vorzeitiges `not_applies`.
2. Blocker 9: belegte `item.dayId → day.stageId`-Beziehung erzeugt konservativen Cross-Domain-Impact; betroffene Activity kann `check_activity` auslösen.

Neu merge-blocking aus R5:

10. Der provider-neutrale Request überträgt nur Top-Level-Daten plus flache Country-/Airport-/Place-Mengen. Er verliert die konkrete Stage-/Route-Zeitzuordnung, die R4 jetzt als präzisere Truth priorisiert. Ein echter Adapter kann bei Multi-Destination, repeated destinations oder widersprüchlicher Top-Level-Hülle nicht erkennen, welcher Ort/Airport zu welchem Zeitkontakt gehört.
11. `availability='temporarily_unavailable'` wird vor `evidenceClass` ausgewertet. Eine explizite `active_warning` / `acute` / `acute_event`-Zeile kann dadurch wieder als `seasonal_pattern` mit `acuteRejected=false` materialisiert werden. Die Safety-vs-Seasonal-Grenze ist in dieser kombinierten Failure-Semantik noch offen.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Bereits umgesetzt / bestätigt

- Seasonal Foundation-Runtime
- Erst-Review-Blocker 1–4 auf `89290eff`
- R2 Missing-Class- und Tripgraph-Fixes auf `aa6cafa2`
- R3 rejected-acute- und Reverse-Date-Fixes auf `4f9eb1e8`
- R4 Top-Level-Hülle- und Day→Stage-Impact-Fixes auf `f077d4d1`
- R5 bestätigt R4-Fixes fachlich
- `seasonalProviderAus()` bleibt `null`
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. Gerade offen

- Blocker 10: provider-neutralen Request um minimale strukturierte Stage-/Route-Zeitkontakte vervollständigen
- Blocker 11: Acute-/Safety-Klasse darf auch kombiniert mit `temporarily_unavailable` nie als `seasonal_pattern` materialisiert werden
- adversarial Regressionen aus `docs/PR38_CHATGPT_R5_REVIEW.md`
- neuer Exact-Head Full Gate nach den Fixes
- unabhängiger R6-Closure-Review
- keine Merge-Freigabe
- kein echter Seasonal-Provider

## 6. R4 Exact-Head-Gate auf `f077d4d1`

Unabhängig verifiziert:

- GitHub Actions Run `32645477815`: **SUCCESS** auf exakt `f077d4d1e45366dd7dfa50bf2f98461d71b8279c`
- Vercel Deployment `dpl_zm3hQgmNLkLG6aagbdPePF1Jqyr7`: **READY**, exakt Runtime `f077d4d1`
- `npm test` laut Gate: **1559/1559**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- Docs-Lock `37f1ec43`: GitHub Actions **SUCCESS**, Vercel `dpl_3dhDgLcKScd9LVCGHpFAyPbkXryC` **READY**
- Diff Runtime → Docs-Lock enthält nur Dokumentation
- Main/Production unverändert `cd220beb`

Grüne Gates ersetzen den R5-Code-Review nicht. Nach Blocker 10/11 muss das Full Gate auf dem neuen Runtime-Head erneut laufen.

## 7. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine Development-/Production-Migration
- `seasonalProviderAus()` bleibt `null`
- kein Live-Provider / Secret / neue laufende Kosten
- Blocker 10 verlangt **keinen** konkreten Provideradapter; nur einen ausreichend vollständigen Jetnity-seitigen provider-neutralen Request-Vertrag

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

Cursor schließt **ausschließlich Blocker 10 und 11** aus `docs/PR38_CHATGPT_R5_REVIEW.md`, ergänzt die dort verlangten Regressionen und führt danach das vollständige Exact-Head-Gate auf dem neuen Runtime-Head aus.

Danach: tatsächlichen PR-/Main-/Head-/CI-/Preview-Stand erneut unabhängig verifizieren und R6-Closure-Review nach Stop-Kriterium durchführen. Kein PASS allein wegen grüner Gates.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 11. Welche Dateien zuerst gelesen werden müssen

1. `JETNITY_HANDOFF.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
4. `docs/PR38_CHATGPT_R5_REVIEW.md`
5. `docs/PR38_CHATGPT_R4_REVIEW.md`
6. `docs/PR38_CURSOR_REVIEW_FIXES.md`
7. `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`
8. `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ACCEPTANCE.md`
9. `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`
10. `lib/seasonal/provider.ts`
11. `lib/seasonal/kontext.ts`
12. `lib/seasonal/normalisieren.ts`
13. `lib/seasonal/engine.ts`
14. `lib/seasonal/relevanz.ts`
15. `lib/seasonal/impact.ts`
