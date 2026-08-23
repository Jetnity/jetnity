# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne: kanonischer Trip-/Stage-/Route-/Datums-Kontext gegen source-backed saisonale Facts, fail-closed, geo-/zeitpräzise, ohne Safety-Vermischung.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
Independent Review: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
Cursor-Fixes Erst-Review: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / aktueller Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main/Basis beim R2-Review: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- Geprüfter Runtime-Head R2: `89290effba61602a71418ab3904b4dc42e76709d`
- Sync beim Runtime-Review-Lock: **8 ahead, 0 behind** `main`
- Nachfolgende Review-/Status-Docs-Commits ändern keine Runtime; vor jeder weiteren Aussage tatsächlichen PR-Head erneut verifizieren.

## 3. Status

**REQUEST CHANGES – unabhängiger Deep-Review noch offen.**

Die vier Merge-Blocker des ersten Reviews wurden auf Runtime `89290eff` geschlossen. Der verpflichtende adversarielle R2-Durchgang hat zwei neue merge-blocking Truth-/Trust-Boundary-Defekte gefunden:

1. fehlende `evidenceClass` wird aktuell zu `seasonal_pattern` aufgewertet;
2. die untrusted Seasonal-API validiert ID-/Referenzintegrität des Tripgraphen nicht vollständig und `tripAusSeasonalAnfrage()` kann malformed Referenzen still reparieren bzw. Items mit dangling `dayId` verlieren.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Freigabe des Product Owners. Noch kein finales Closure/PASS.

## 4. Bereits umgesetzt

- Seasonal Foundation-Runtime inkl. Domain, Fenster, Evidence, Relevanz, Impact, Engine und API
- `seasonalProviderAus()` bleibt `null`
- minimale Workspace-Naht `ReisezeitHinweise`
- Erst-Review mit vier konkreten Merge-Blockern
- Runtime-Fixes auf `89290eff` für alle vier Erst-Review-Blocker
- unabhängiger R2-Re-Review inkl. adversarial second pass
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. Gerade offen / noch nicht umgesetzt

- R2-Blocker 5: `evidenceClass` muss explizite Provider-Truth sein; kein Default aus missing/null/empty
- R2-Blocker 6: API-Tripgraph muss eindeutige IDs und referentielle Integrität fail-closed validieren; kein stilles Repair/Drop
- adversarial Regressionen für beide R2-Blocker
- finaler Exact-Head Full Gate nach den R2-Fixes
- finaler unabhängiger Re-Review / Closure
- keine Merge-Freigabe
- kein echter Seasonal-Provider
- keine persistierte Nutzerentscheidung `Trotzdem so planen`
- Account-`tripId`-Serverload der Evaluation bleibt spätere Naht

## 6. Letzte relevanten Runtime-Änderungen

Runtime-Head `89290eff` (`fix: close PR38 independent review blockers`) hat die vier Erst-Review-Funde korrigiert:

- Summary/Status bei gemischter Unsicherheit fail-closed
- strikte Kalender-/Instant-Validierung absoluter Fenster
- verlustfreie entscheidungsrelevante Koordinatenidentität in Fingerprints/Scopes
- strengere Provider-Normalisierung für `sourceUrl`, `availability`, `route.airportCodes[]`

Danach nur Review-/Status-Dokumentation, solange kein neuer Runtime-Fix gepusht wurde.

## 7. Tests / CI / Preview

Unabhängig verifiziert auf Runtime `89290effba61602a71418ab3904b4dc42e76709d`:

- GitHub Actions CI #390: **SUCCESS** auf exakt diesem SHA
- CI-Job `test`: **SUCCESS**; Typecheck, Lint, Tests, Artifact-Check und Branch-Hygiene erfolgreich
- Vercel Preview für exakt diesen SHA: **READY**
- Main/Production blieb `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- Sync beim R2-Lock: **8 ahead, 0 behind**

Cursor dokumentiert für denselben Runtime-Head zusätzlich den lokalen Full Gate mit:

- `npm test` **1550/1550**
- Production-Build Exit 0
- UI-Audit **1014/1014**, 0 Fehler
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**

Diese grünen Gates ersetzen nicht den Code-Review. Nach den noch nötigen R2-Runtime-Fixes muss das vollständige Gate auf dem neuen finalen Runtime-Head erneut laufen.

## 8. DB / RLS / Production-Grenze

- keine Seasonal-Tabelle
- keine Development-/Production-Migration
- Production-Schema unverändert

## 9. Kosten / Provider / Secrets

- `seasonalProviderAus()` ist `null`
- kein Live-Provider
- kein Secret
- keine neuen laufenden Kosten
- keine Provider-/Kostenaktivierung ohne separates Gate

## 10. Bekannte Risiken / Review-Funde

Merge-blocking und aktuell offen:

- missing/null/empty `evidenceClass` darf nicht zu erfundener `seasonal_pattern`-Truth werden
- API-Tripgraph muss Duplicate IDs, dangling IDs und widersprüchliche Stage-/Day-/Item-Referenzen als `400` ablehnen

Dokumentierte spätere Nähte / aktuell nicht merge-blocking:

- In-process Rate-Limit ist nur Preview/Dev-Schutz
- Account-`tripId`-Serverload bleibt spätere Naht
- keine persistierte Nutzerentscheidung `Trotzdem so planen`
- title-only Geo bleibt unknown

## 11. Offene Nutzerentscheidungen / Freigaben

- keine Merge-Freigabe
- kein Mark Ready freigegeben
- keine Provider-/Kosten-/Secret-Freigabe
- keine DB-/Production-Migration freigegeben

## 12. Exakter nächster Schritt

Cursor schließt **ausschließlich die zwei R2-Merge-Blocker** aus `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`, ergänzt die dort verlangten adversarial Regressionen und führt danach das vollständige Gate auf exakt dem neuen Runtime-/PR-Head aus.

Danach: tatsächlichen PR-/Main-/Head-/Sync-/CI-/Preview-Stand erneut unabhängig verifizieren und vollständigen ChatGPT-Re-Review fortsetzen. Kein Closure/PASS allein wegen grüner Gates.

## 13. Welche Dateien zuerst gelesen werden müssen

1. `JETNITY_HANDOFF.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
4. `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`
5. `docs/PR38_CURSOR_REVIEW_FIXES.md`
6. `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`
7. `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ACCEPTANCE.md`
8. `docs/TRAVEL_TIMING_SEASONAL.md`
9. `lib/seasonal/`
10. `app/api/seasonal/evaluate/route.ts`
11. Foundation-D-Route-Ableitung, soweit durch Seasonal referenziert
