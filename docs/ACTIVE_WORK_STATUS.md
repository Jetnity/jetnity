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
| UI-Audit-Lauf | Script erweitert, Lauf ausstehend |
| GitHub CI | **success** auf `fef11a38` – https://github.com/Jetnity/jetnity/actions/runs/32592236126 |
| Vercel Preview | **pass** auf `fef11a38` – Deployment completed |

## 4. Harte Grenzen

- kein Merge ohne ausdrückliche Product-Owner-Freigabe
- keine Production-Migration
- kein echter Travel-Requirements-Provider
- keine Passnummern, Scans, MRZ, Biometrie
- kein LLM als regulatorische Truth-Quelle
- keine Workspace-Neugestaltung, keine Safety-/Seasonality-Implementierung

## 5. Exakter nächster Schritt

1. Draft PR reviewen.
2. Trip-Workspace-UI-Audit auf der Device-Matrix nachziehen, sobald Playwright verfügbar ist.
3. Product Owner entscheidet separat über Merge.
4. Production-Migration erst nach Merge und separater Freigabe.

Kein zweiter Foundation-E-Block auf einem anderen Branch beginnen.
