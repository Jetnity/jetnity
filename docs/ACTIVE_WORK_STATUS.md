# Jetnity – Active Work Status

Stand: 23. August 2026
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne: kanonischer Trip-/Stage-/Route-/Datums-Kontext gegen source-backed saisonale Facts, fail-closed, geo-/zeitpräzise, ohne Safety-Vermischung.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`

## 2. Branch / PR / aktueller Head

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Basis: `origin/main` @ `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- Head: Feature-Branch, Runtime implementiert, Full Gate folgt

## 3. Status

**in Arbeit** – Runtime und Docs stehen; Full Gate / CI / Preview noch nicht auf finalem Head gelockt. PR bleibt Draft. Kein Mark Ready, kein Merge.

## 4. Bereits umgesetzt

- Ist-Audit gegen aktuellen Code verifiziert
- `lib/seasonal/` Domain, Fenster, Evidence, Relevanz, Impact, Engine, API
- `seasonalProviderAus()` bleibt `null`
- `POST /api/seasonal/evaluate` geschlossen
- minimale Workspace-Naht `ReisezeitHinweise`
- UI-Audit-Zustände für Seasonal
- ADRs 0133–0137, Fachdokument, Architektur-Nachzug
- Seasonal-Unit-Tests lokal 59/59

## 5. Gerade offen / noch nicht umgesetzt

- vollständiges `npm test` + Typecheck/Lint/Hygiene/Build
- UI-Audit WebKit + Chromium / 8 Viewports
- DB-Gates unverändert nachweisen
- GitHub Actions + Vercel Preview auf finalem Head
- 0 behind zu `origin/main`

## 6. Letzte relevanten Änderungen

Seasonal-Runtime und minimale Workspace-Naht. Safety bleibt unangetastet ausser Architektur-Docs-Korrektur (PR #37 ist gemergt).

## 7. Tests / CI / Preview

Seasonal-Unit-Tests: 59/59 lokal. Gesamt-Gate, CI und Preview noch offen.

## 8. DB / RLS / Production-Grenze

- keine Seasonal-Tabelle
- keine Development-/Production-Migration
- Production-Schema unverändert

## 9. Kosten / Provider / Secrets

- `seasonalProviderAus()` ist `null`
- kein Live-Provider, kein Secret, keine neuen laufenden Kosten

## 10. Bekannte Risiken / Review-Funde

- In-process Rate-Limit ist nur Preview/Dev-Schutz
- Account-`tripId`-Serverload bleibt spätere Naht
- keine persistierte Nutzerentscheidung `Trotzdem so planen`
- title-only Geo bleibt unknown

## 11. Offene Nutzerentscheidungen / Freigaben

- keine Merge-Freigabe
- keine Provider-/Kosten-/Secret-Freigabe

## 12. Exakter nächster Schritt

Full Gate auf diesem Branch ausführen, Runtime-Head locken, PR-Docs aktualisieren, danach unabhängiger ChatGPT-Review.

## 13. Welche Dateien zuerst gelesen werden müssen

1. `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`
2. `docs/TRAVEL_TIMING_SEASONAL.md`
3. `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ACCEPTANCE.md`
4. `docs/ACTIVE_WORK_STATUS.md`
5. `lib/seasonal/`
