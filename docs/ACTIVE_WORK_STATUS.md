# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation E – Traveller Context – Re-Review-Blocker-Fixes auf Draft PR #35**

## 1. Aktueller Zustand

Foundation D – Route & Transit Intelligence ist vollständig abgeschlossen und **nicht erneut zu bauen**.

- PR #34: gemergt
- Merge-Commit auf `main`: `5bc93bcd35421e3763dc8a3515f254c209b63d6a`
- Production-Abnahme: `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`

Foundation E läuft auf:

- Branch: `feat/traveller-context-intelligence`
- Basis: `origin/main` @ `ae64e4ff88ddacf4bbb6d9521e003fb1cc9653aa`
- Draft PR: https://github.com/Jetnity/jetnity/pull/35
- Fachdokument: `docs/TRAVELLER_CONTEXT.md`
- Acceptance: `docs/FOUNDATION_E_TRAVELLER_CONTEXT_ACCEPTANCE.md`
- Audit vor Schemaänderung: `docs/FOUNDATION_E_ARCHITECTURE_AUDIT.md`

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

## 3. Verifizierter Nachweis

| Nachweis | Ergebnis |
| --- | --- |
| `npm test` | 1311/1311 |
| Typecheck | grün |
| Lint | grün |
| Hygiene | grün |
| Production-Build | grün, 38/38 Seiten |
| Development-Migrationen `20260822160000`–`20260822180000` | angewendet |
| Live-FKs | Citizenship `SET NULL (citizenship_id)`, Readiness `CASCADE` |
| Live-Lock | `FOR NO KEY UPDATE`; Backfill-Relikte `citizenship_id` **0** |
| `db:rechte` | OK, 51 Rechte |
| `db:rls` | grün |
| `db:sicherheit` | **208/208** |
| `db:parallelitaet` | **7/7**, inkl. parallele Citizenship-Inserts bei 7/8 ohne Deadlock |
| Production-Schema | unverändert |
| UI-Audit nach Re-Review-Fixes | **838/838, 0 Fehler**, WebKit + Chromium, 8 Viewports |

## 4. Harte Grenzen

- kein Merge ohne ausdrückliche Product-Owner-Freigabe
- keine Production-Migration
- kein echter Travel-Requirements-Provider
- keine Passnummern, Scans, MRZ, Biometrie
- kein LLM als regulatorische Truth-Quelle
- keine Workspace-Neugestaltung, keine Safety-/Seasonality-Implementierung

## 5. Exakter nächster Schritt

1. Unabhängiger ChatGPT-Abschlussreview gegen `docs/PR35_CHATGPT_REREVIEW.md`.
2. Draft bleibt Draft. Nicht Mark Ready, nicht mergen.
3. Product Owner entscheidet separat über Merge.
4. Production-Migration erst nach Merge und separater Freigabe.

Die drei Re-Review-Blocker sind im Code behoben. Ein Docs-Nachzug, der nur diesen Nachweis festhält, startet neues CI; das wird nicht erneut dokumentiert, solange es nicht fehlschlägt.

Kein zweiter Foundation-E-Block auf einem anderen Branch beginnen.
