# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Foundation E auf `main` gemergt; Production-Migration wartet auf Freigabe**

## 1. Aktueller Zustand

Foundation D – Route & Transit Intelligence bleibt abgeschlossen.

- PR #34: gemergt
- Merge-Commit auf `main`: `5bc93bcd35421e3763dc8a3515f254c209b63d6a`
- Production-Abnahme: `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`

Foundation E – Traveller Context ist auf `main` gemergt:

- PR #35: https://github.com/Jetnity/jetnity/pull/35 – **MERGED**
- Gemergt von Product-Owner-Konto `Jetnity` am 23. August 2026, 00:30 UTC
- Merge-Commit: `3bf1eaaa78ef6ac33bb3baff84650a143720e91d`
- Gemergter Head: `52601ea0f770cf4265a5bdf5cb2356557ef7dcde`
- Code-Head des Closure-Gates: `b1f9d6543aa153bacaa126f71d39c6a434dfbebb`
- Unabhängiger Closure-Check: **PASS** – `docs/PR35_CHATGPT_INDEPENDENT_CLOSURE_CHECK.md`
- Fachdokument: `docs/TRAVELLER_CONTEXT.md`
- Acceptance: `docs/FOUNDATION_E_TRAVELLER_CONTEXT_ACCEPTANCE.md`

## 2. Was bereits umgesetzt ist

- 1:n-Modell `trip_travellers` → `trip_traveller_citizenships` / `trip_traveller_documents`
- Expand/Contract-Migration mit Backfill; Legacy-Spalten bleiben
- atomare Account-Writes über `party_schreiben` (`SECURITY INVOKER`)
- Guest/Account-Parität derselben Party-Form; Legacy-Guest wird expandiert
- traveller-spezifische Readiness-Items (`traveller_id` optional)
- Fingerprint v2: sortierte Citizenship-/Document-Mengen, isoliert je Traveller
- provider-neutrale Credential-Optionen; Factory bleibt `null`
- Vergleich ohne Evidence: `Noch nicht zuverlässig vergleichbar.`
- UX erfasst mehrere Citizenships/Documents, behauptet keine Visa-Vorteile

## 3. Verifizierter Nachweis auf `b1f9d654`

| Nachweis | Ergebnis |
| --- | --- |
| `npm test` | **1353/1353** |
| Typecheck | grün |
| Lint | grün |
| Hygiene | grün |
| Production-Build | grün, 38/38 Seiten |
| Development-Migrationen `20260822160000`–`20260822180000` | angewendet |
| `db:rechte` | OK, 51 Rechte |
| `db:rls` | grün (Exit 0) |
| `db:sicherheit` | **210/210** |
| `db:parallelitaet` | **7/7** |
| Production-Schema | endet bei `20260822150000`; Foundation-E-Tabellen **nicht** vorhanden |
| UI-Audit | **838/838, 0 Fehler**, WebKit + Chromium, 8 Viewports |
| GitHub Actions auf gemergtem Head `80a85bd5` | **success** – https://github.com/Jetnity/jetnity/actions/runs/32607036298 |

## 4. Harte Grenzen

- Merge von PR #35 ist erfolgt; das ist **keine** Production-Migrationsfreigabe
- keine Production-Migration ohne ausdrückliche aktuelle Product-Owner-Freigabe
- kein echter Travel-Requirements-Provider
- keine Passnummern, Scans, MRZ, Biometrie
- kein LLM als regulatorische Truth-Quelle
- keine Workspace-Neugestaltung, keine Safety-/Seasonality-Implementierung ohne neuen Auftrag

## 5. Exakter nächster Schritt

1. Product Owner entscheidet über die **Foundation-E-Production-Migration** (`20260822160000`–`20260822180000`). Ohne ausdrückliche Freigabe nicht anwenden.
2. Danach Production-Abnahme analog Foundation D dokumentieren.
3. Erst danach der nächste Produktblock: provider-neutrale Safety-Foundation.
4. Keinen zweiten Foundation-E-Implementierungsblock beginnen.

Merge-Freigabe gilt nur für PR #35. Production bleibt ein separates Gate.
