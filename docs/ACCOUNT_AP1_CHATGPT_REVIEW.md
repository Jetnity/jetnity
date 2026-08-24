# Account AP-1 – Independent Technical-Lead Review

Stand: 24. August 2026  
PR: #43 / `feat/account-ap1`  
Review-Head: `62868d2c8abe5688750829aee5d091b8c6592c89`  
Ergebnis: **REQUEST CHANGES** (als COMMENT, weil GitHub an diesem eigenen PR kein formales Request-changes zulässt)

Quelle: https://github.com/Jetnity/jetnity/pull/43#pullrequestreview-5004214062

## Geforderte AP-1-Truth-Punkte

1. Account-„heute“ darf keinen UTC-Kalendertag erfinden. `aktiv` / `kommend` brauchen einen vertrauenswürdigen Geräte-Kalendertag oder bleiben stumm. Keine IANA-Zone raten. Datumsgrenztests um UTC/lokalen Tageswechsel.
2. 503-Text darf Persistenz nicht behaupten. Ein fehlgeschlagenes `reisenLaden()` prüft den Speicherstand nicht.

## Umsetzung

- `kalendertagAusInstant()` / Client `AccountUebersichtLive`
- 503-Copy: „Wir konnten deinen aktuellen Speicherstand gerade nicht prüfen; bitte lade später neu.“
- ADR-0153

Nicht umgesetzt: AP-2, Auth/RLS/DB, Scope-Erweiterung.

## Integrationsgate nach den Fixes

- `feat/account-ap1` mit `main` `e4f4cca7` synchronisieren
- GitHub Actions CI **und** Vercel Preview auf demselben Exact Head
- PR bleibt Draft
