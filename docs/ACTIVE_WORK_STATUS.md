# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation E – Traveller Context / Multi-Citizenship / Multi-Document – Draft PR / Development verifiziert**

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
| `npm test` | 1304/1304 |
| Typecheck | grün |
| Lint | grün |
| Hygiene | grün |
| Production-Build | grün, 38/38 Seiten |
| Development-Migration `20260822160000` | angewendet |
| `db:rechte` | OK, 51 Rechte |
| `db:rls` | grün |
| `db:sicherheit` | 204/204 |
| Production-Schema | unverändert |
| UI-Audit-Lauf | **838/838, 0 Fehler**, WebKit + Chromium, 8 Viewports inkl. 280–430 / Tablet 768 / Landscape 844×390 / Desktop 1280 |
| Foundation-E-Auditfälle | 1 Citizenship, 2 Citizenships, 2 Traveller, Dokument fehlt, Citizenship fehlt, langes Label (40 Zeichen), Provider unavailable |
| GitHub CI | **success** auf Docs-Heads bis `b8a11be4`; Audit-Heads `02421f6d` / `17763238` nach dem Lauf, CI auf dem Docs-Nachzug ausstehend |
| Vercel Preview | **pass** auf `16ddea63`, `ff4cb765`, `fef11a38` und `b8a11be4`; neuer Head nach Docs-Nachzug |

## 4. Harte Grenzen

- kein Merge ohne ausdrückliche Product-Owner-Freigabe
- keine Production-Migration
- kein echter Travel-Requirements-Provider
- keine Passnummern, Scans, MRZ, Biometrie
- kein LLM als regulatorische Truth-Quelle
- keine Workspace-Neugestaltung, keine Safety-/Seasonality-Implementierung

## 5. Exakter nächster Schritt

1. Draft PR #35 reviewen. Nicht Mark Ready, nicht mergen.
2. GitHub CI und Vercel Preview auf dem Head nach diesem Docs-Nachzug prüfen.
3. Product Owner entscheidet separat über Merge.
4. Production-Migration erst nach Merge und separater Freigabe.

Kein zweiter Foundation-E-Block auf einem anderen Branch beginnen.
