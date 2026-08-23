# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R2-Kernfixes sind verifiziert; unabhängiger R3-Re-Review hat zwei konkrete merge-blocking Restdefekte gefunden.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R1/R2 Review: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
R3 Review: `docs/PR38_CHATGPT_R3_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main bei R3-Beginn: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R2-Runtime-Fix-Head: `aa6cafa2f4997c22081dff35fe950a18190e7886`
- PR-/Docs-Head bei R3-Beginn: `8d238e38ff8d94f74a5b5240f370c330837324c0`
- Sync bei R3-Beginn: **15 ahead, 0 behind** `main`
- R3-Review-Commit: `55d14f0e9a333ac27557a9ca25146dfc09587653`
- Nachfolgende Review-/Status-Docs-Commits ändern keine fachliche Runtime; vor jeder neuen Aussage tatsächlichen Head erneut prüfen.

## 3. Status

**REQUEST CHANGES – kein Closure/PASS.**

Die Kernteile von R2-Blocker 5 und 6 sind geschlossen:

- Missing/null/empty/malformed `evidenceClass` wird für normale Seasonal-Facts nicht mehr zu `seasonal_pattern` defaulted.
- Duplicate Stage-/Day-/Item-IDs sowie die konkret benannten dangling/widersprüchlichen Referenzen werden fail-closed abgelehnt; kein stilles `day.stageId -> null` mehr.

R3 findet jedoch zwei Merge-Blocker:

1. **Residual aus Blocker 5:** `active_warning` / `acute` / `acute_event` werden intern/API-seitig weiterhin als `evidenceClass: seasonal_pattern` materialisiert; acute-only kann über `acute_rejected` in einen cleanen `checked_empty`/`complete=true`-Seasonal-Status fallen. Falsche Safety-Domain darf niemals als Seasonal Pattern erscheinen.
2. **Neuer Blocker 7:** `seasonalAnfrageSchema` prüft die Datumsreihenfolge nicht. Rückwärts laufende `startDate/endDate` bzw. Stage `arrivalDate/departureDate` können von der Zeitrelevanz zu `before`/`after` und dadurch zu falschem `not_applies` werden statt fail-closed abgelehnt/als insufficient behandelt zu werden.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Bereits umgesetzt / bestätigt

- Seasonal Foundation-Runtime
- Erst-Review-Blocker 1–4 auf `89290eff`
- R2 Missing-Class-Kernfix und API-ID-/Referenzintegrität auf `aa6cafa2`
- adversarial Regressionen für Missing-Class sowie Duplicate-/Dangling-IDs
- `seasonalProviderAus()` bleibt `null`
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. Gerade offen

- Residual Blocker 5 vollständig schließen: rejected Acute-/Safety-Domain darf weder intern noch API-visible `seasonal_pattern` sein; acute-only darf kein sauberer vollständiger Seasonal-Check werden
- Blocker 7 schließen: Top-Level- und Stage-Datumsbereiche in untrusted Seasonal-Request fail-closed ordnen/validieren; keine stille Reparatur
- adversarial Regressionen laut `docs/PR38_CHATGPT_R3_REVIEW.md`
- Full Gate auf exakt neuem Runtime-/PR-Head
- unabhängiger R4-Re-Review / Closure
- keine Merge-Freigabe
- kein echter Seasonal-Provider

## 6. R3 Reality-/Gate-Stand

Unabhängig verifiziert zu R3-Beginn:

- PR open / Draft / mergeable / nicht gemergt
- `main` = `cd220beb`
- Branch = **15 ahead, 0 behind**
- GitHub Actions auf R2-Runtime `aa6cafa2`: **SUCCESS**
- GitHub Actions auf damaligem PR-Head `8d238e38`: **SUCCESS**
- Vercel Preview auf `aa6cafa2`: **READY**
- Vercel Preview auf `8d238e38`: **READY**
- Production/Main unverändert `cd220beb`

Cursor-Full-Gate auf `aa6cafa2`:

- `npm test` **1553/1553**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0
- UI-Audit **1014/1014**, 0 Fehler
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**

Zwischen `aa6cafa2` und `8d238e38` wurde `lib/seasonal/provider.ts` nur um einen Kommentar an der unveränderten `evidenceClass`-Typzeile ergänzt; keine Runtime-Semantik. Nach den R3-Fixes muss dennoch der vollständige Gate neu auf dem finalen Head laufen.

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

Cursor schließt **ausschließlich die zwei R3-Merge-Blocker** aus `docs/PR38_CHATGPT_R3_REVIEW.md`, ergänzt die dort verlangten Regressionen und führt danach das vollständige Exact-Head-Gate aus.

Danach tatsächlichen PR-/Main-/Head-/Sync-/CI-/Preview-Stand erneut unabhängig verifizieren und R4-Re-Review nach Stop-Kriterium durchführen. Kein PASS allein wegen grüner Gates.

## 11. Welche Dateien zuerst gelesen werden müssen

1. `JETNITY_HANDOFF.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
4. `docs/PR38_CHATGPT_R3_REVIEW.md`
5. `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`
6. `docs/PR38_CURSOR_REVIEW_FIXES.md`
7. `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`
8. `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ACCEPTANCE.md`
9. `lib/seasonal/normalisieren.ts`
10. `lib/seasonal/engine.ts`
11. `lib/seasonal/schema.ts`
12. `lib/seasonal/relevanz.ts`
13. `lib/seasonal/kalender.ts`
14. `app/api/seasonal/evaluate/route.ts`
