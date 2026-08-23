# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Foundation E – Traveller Context – unabhängiger Closure-Check PASS; wartet auf Merge-Freigabe**

## 1. Aktueller Zustand

Foundation D – Route & Transit Intelligence ist vollständig abgeschlossen und **nicht erneut zu bauen**.

- PR #34: gemergt
- Merge-Commit auf `main`: `5bc93bcd35421e3763dc8a3515f254c209b63d6a`
- Production-Abnahme: `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`

Foundation E läuft auf:

- Branch: `feat/traveller-context-intelligence`
- Code-Head des Closure-Gates: `b1f9d6543aa153bacaa126f71d39c6a434dfbebb`
- Vorheriger voller Gate-Head (Depth-Re-Review): `08716228d2e6a5404730276843374cf7d3f9e066`
- Basis: `origin/main` @ `c8dbe904faac49745bd149e3d2e85ca30ebd384c` (0 hinter)
- Draft PR: https://github.com/Jetnity/jetnity/pull/35
- Fachdokument: `docs/TRAVELLER_CONTEXT.md`
- Acceptance: `docs/FOUNDATION_E_TRAVELLER_CONTEXT_ACCEPTANCE.md`
- Audit vor Schemaänderung: `docs/FOUNDATION_E_ARCHITECTURE_AUDIT.md`
- Review-Tiefe: `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` plus Product-Owner-Nachtrag `docs/PRODUCT_OWNER_REVIEW_DEPTH_MANDATE.md`
- Closure-Review: `docs/PR35_CHATGPT_FINAL_CLOSURE_REVIEW.md` / ADR-0126
- Unabhängiger Closure-Check: `docs/PR35_CHATGPT_INDEPENDENT_CLOSURE_CHECK.md` – **PASS**

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
| Development-Migrationen `20260822160000`–`20260822180000` | angewendet, `db:anwenden --probe` nichts offen |
| Live-FKs | Citizenship `SET NULL (citizenship_id)`, Readiness `CASCADE` |
| Live-Lock | `trip_traveller_kinder_limit_pruefen` mit `FOR NO KEY UPDATE`; Backfill-Relikte **0** |
| `db:rechte` | OK, 51 Rechte |
| `db:rls` | grün (Exit 0) |
| `db:sicherheit` | **210/210** inkl. party_schreiben leert Children trotz Legacy-Spalten |
| `db:parallelitaet` | **7/7**, inkl. parallele Citizenship-Inserts bei 7/8 ohne Deadlock |
| Production-Schema | endet bei `20260822150000`; Foundation-E-Tabellen **nicht** vorhanden |
| UI-Audit | **838/838, 0 Fehler**, WebKit + Chromium, 8 Viewports – `/opt/cursor/artifacts/trip_workspace_ui_audit_b1f9d654.json` |
| GitHub Actions `ci.yml` | **success** – https://github.com/Jetnity/jetnity/actions/runs/32606428866 |
| Vercel Preview | **SUCCESS** – https://jetnity-hkscn5xjt-jetnity-e1b93c82.vercel.app |
| PR-Mergebarkeit | `MERGEABLE`; Draft bleibt Draft |

Historischer voller Gate auf `08716228`: 1349/1349, Actions `32604932045`, Vercel `jetnity-du5dlqhww-...`. Nicht mehr der aktuelle Nachweis.

## 4. Harte Grenzen

- kein Merge ohne ausdrückliche Product-Owner-Freigabe
- keine Production-Migration
- kein echter Travel-Requirements-Provider
- keine Passnummern, Scans, MRZ, Biometrie
- kein LLM als regulatorische Truth-Quelle
- keine Workspace-Neugestaltung, keine Safety-/Seasonality-Implementierung

## 5. Exakter nächster Schritt

1. Product Owner entscheidet über Merge von Draft PR #35. Technische Empfehlung des unabhängigen Closure-Checks: merge-bereit nach ausdrücklicher aktueller Freigabe.
2. Draft bleibt Draft. Nicht Mark Ready, nicht mergen, solange keine ausdrückliche Freigabe vorliegt.
3. Production-Migration erst nach Merge und separater Freigabe.
4. Kein zweiter Foundation-E-Block auf einem anderen Branch beginnen.

`origin/main` @ `c8dbe904` bleibt 0 hinter. Dieser Commit hält nur den PASS-Review fest; kein weiterer Docs-Commit nur zum Festhalten von Checks.
