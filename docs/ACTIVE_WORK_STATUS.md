# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation E – Traveller Context – Review-Blocker-Fixes auf Draft PR #35**

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
| `npm test` | 1310/1310 |
| Typecheck | grün |
| Lint | grün |
| Hygiene | grün |
| Production-Build | grün, 38/38 Seiten |
| Development-Migration `20260822160000` | angewendet |
| Development-Migration `20260822170000` | angewendet; Live-FKs: Citizenship `SET NULL (citizenship_id)`, Readiness `CASCADE` |
| `db:rechte` | OK, 51 Rechte |
| `db:rls` | grün |
| `db:sicherheit` | **207/207** inkl. Citizenship-Unlink, Traveller-Delete, 9. Citizenship |
| Production-Schema | unverändert |
| UI-Audit nach Review-Fixes | **838/838, 0 Fehler**, WebKit + Chromium, 8 Viewports |
| Foundation-E-Auditfälle | 1 Citizenship, 2 Citizenships, 2 Traveller, Dokument fehlt, Citizenship fehlt, langes Label (40 Zeichen), Provider unavailable |
| GitHub CI | **success** auf Head `5cb207d3` – https://github.com/Jetnity/jetnity/actions/runs/32596833189 |
| Vercel Preview | **READY** auf `5cb207d3` – https://jetnity-l6141bwaw-jetnity-e1b93c82.vercel.app |

## 4. Harte Grenzen

- kein Merge ohne ausdrückliche Product-Owner-Freigabe
- keine Production-Migration
- kein echter Travel-Requirements-Provider
- keine Passnummern, Scans, MRZ, Biometrie
- kein LLM als regulatorische Truth-Quelle
- keine Workspace-Neugestaltung, keine Safety-/Seasonality-Implementierung

## 5. Exakter nächster Schritt

1. Unabhängiger ChatGPT-Re-Review von PR #35 gegen `docs/PR35_CHATGPT_INDEPENDENT_REVIEW.md`.
2. Draft bleibt Draft. Nicht Mark Ready, nicht mergen.
3. Product Owner entscheidet separat über Merge.
4. Production-Migration erst nach Merge und separater Freigabe.

Die drei Review-Blocker sind im Code behoben. Ein Docs-Nachzug, der nur diesen Nachweis festhält, startet neues CI; das wird nicht erneut dokumentiert, solange es nicht fehlschlägt.

Kein zweiter Foundation-E-Block auf einem anderen Branch beginnen.
