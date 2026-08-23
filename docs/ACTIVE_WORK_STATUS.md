# Jetnity – Active Work Status

Stand: 23. August 2026
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne: kanonischer Trip-/Stage-/Route-/Datums-Kontext gegen source-backed saisonale Facts, fail-closed, geo-/zeitpräzise, ohne Safety-Vermischung, ohne echten Provider, ohne Fake-Daten, ohne automatische Reiseänderung, ohne DB-Migration.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`

## 2. Branch / PR / aktueller Head

- Branch: `feat/travel-timing-seasonal-intelligence`
- Basis: `origin/main` @ `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- Draft PR: wird mit diesem Start-Commit geöffnet
- Head: Feature-Branch, noch vor Runtime-Implementierung

## 3. Status

**in Arbeit** – Ist-Audit gegen aktuellen Code verifiziert; Implementierung beginnt. PR bleibt Draft. Kein Mark Ready, kein Merge.

## 4. Bereits umgesetzt

- `git fetch origin` ausgeführt
- Feature-Branch von aktuellem `origin/main` erstellt
- Pflichtdokumente gelesen
- versionierter Ist-Audit gegen tatsächlichen Code verifiziert (siehe Audit §14)
- Safety PR #37 als Ancestor bestätigt
- `lib/seasonal/` existiert noch nicht; kein bestehendes Seasonal-Runtime

## 5. Gerade offen / noch nicht umgesetzt

- Domain `lib/seasonal/`
- Provider-Port `seasonalProviderAus() → null`
- Recurring-/Absolute-Window-Engine
- Evidence/Freshness/Reference-Period-Trennung
- API `POST /api/seasonal/evaluate`
- minimale Workspace-Naht `ReisezeitHinweise`
- Pflicht-Testmatrix + UI-Audit-Zustände
- ADRs, Fachdokument, Acceptance-Nachzug
- Full Gate auf finalem Runtime-Head

## 6. Letzte relevanten Änderungen

Audit-Verifikation dokumentiert: seit Audit-SHA `211f8b2e` nur Docs, kein Runtime-Diff. Architektur-Empfehlung bleibt gültig.

## 7. Tests / CI / Preview

Noch nicht gelaufen für diesen Branch. Baseline auf `main`: 1481/1481 Tests, Build 38/38, UI-Audit 886/886. Neue Zahlen erst nach Implementierung und Gate.

## 8. DB / RLS / Production-Grenze

- keine Seasonal-Tabelle geplant
- keine Development-/Production-Migration
- Production-Schema unverändert

## 9. Kosten / Provider / Secrets

- `seasonalProviderAus()` wird `null`
- kein Live-Provider, kein Secret, keine neuen laufenden Kosten

## 10. Bekannte Risiken / Review-Funde

- Recurring Windows über Jahreswechsel und Leap-Day müssen explizit getestet werden
- Freshness darf Safety-7-Tage-Default nicht kopieren
- Active Warning darf nicht als Seasonal erscheinen; `seasonal_pattern` bleibt in Safety verworfen
- `ARCHITECTURE.md` auf `main` ist für Safety-PR-Status veraltet; wird in diesem Branch korrigiert

## 11. Offene Nutzerentscheidungen / Freigaben

- keine Merge-Freigabe
- keine Provider-/Kosten-/Secret-Freigabe
- keine Migrationsfreigabe nötig, solange compute-on-read bleibt

## 12. Exakter nächster Schritt

Seasonal-Runtime implementieren: Domain, Fenster, Engine, API, Tests, minimale Workspace-Naht. Danach Full Gate, Docs-Lock, unabhängiger ChatGPT-Review.

## 13. Welche Dateien zuerst gelesen werden müssen

1. `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`
2. `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ARCHITECTURE_AUDIT.md`
3. `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ACCEPTANCE.md`
4. `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`
5. `docs/TRAVEL_SAFETY_DISRUPTION.md`
6. `lib/safety/` als Schwesterarchitektur, nicht als zu kopierende Wahrheit
