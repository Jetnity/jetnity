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
- Runtime-Head: `2dfec9bc2ae7336d7ca4e918a25c186efa2cecab`
- Dieser Docs-Nachzug ändert keine Runtime. Docs-Head ist der Commit dieses Nachzugs.
- Ahead/behind zum Runtime-Lock: **5 ahead, 0 behind** `origin/main`

## 3. Status

**technisch reviewbereit auf Draft-PR #38** – Full Gate auf Runtime `2dfec9bc` lokal und remote grün. PR bleibt Draft. Kein Mark Ready, kein Merge.

## 4. Bereits umgesetzt

- Ist-Audit gegen aktuellen Code verifiziert (`docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ARCHITECTURE_AUDIT.md` §14)
- `lib/seasonal/` Domain, Fenster, Evidence, Relevanz, Impact, Engine, API
- `seasonalProviderAus()` bleibt `null`
- `POST /api/seasonal/evaluate` geschlossen
- minimale Workspace-Naht `ReisezeitHinweise`
- UI-Audit-Zustände für Seasonal
- ADRs 0133–0137, Fachdokument, Architektur-Nachzug
- Full Gate auf Runtime `2dfec9bc`

## 5. Gerade offen / noch nicht umgesetzt

- unabhängiger ChatGPT-Review nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
- keine Merge-Freigabe
- kein echter Seasonal-Provider
- keine persistierte Nutzerentscheidung `Trotzdem so planen`
- Account-`tripId`-Serverload der Evaluation bleibt spätere Naht

## 6. Letzte relevanten Änderungen

Seasonal-Runtime und minimale Workspace-Naht. Safety bleibt unangetastet ausser Architektur-Docs-Korrektur (PR #37 ist gemergt). Full Gate gelockt.

## 7. Tests / CI / Preview

Auf Runtime `2dfec9bc`:

- `npm test` **1540/1540**
- Typecheck / Lint / Hygiene / Exports / Dead / Deps / API-Schutz / Schema-Bezug grün
- Production-Build Exit 0, Route `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, Viewports 280 / 320 / 360 / 390 / 430 / 768 / 844x390 / 1280
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- GitHub Actions SUCCESS: https://github.com/Jetnity/jetnity/actions/runs/32636986916
- Vercel Preview READY: https://vercel.com/jetnity-e1b93c82/jetnity-app/9PGmTy7EdXDpPXVy1PL8TXnE5hYU
- Preview: https://jetnity-app-git-feat-travel-timing-seas-feb71e-jetnity-e1b93c82.vercel.app

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

Unabhängiger ChatGPT-Review von Draft-PR #38 nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`. PR bleibt Draft. Kein Mark Ready, kein Merge.

## 13. Welche Dateien zuerst gelesen werden müssen

1. `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`
2. `docs/TRAVEL_TIMING_SEASONAL.md`
3. `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ACCEPTANCE.md`
4. `docs/ACTIVE_WORK_STATUS.md`
5. `lib/seasonal/`
