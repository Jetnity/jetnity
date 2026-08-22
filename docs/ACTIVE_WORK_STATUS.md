# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Foundation E – Traveller Context – Closure-Review-Blocker auf Draft PR #35**

## 1. Aktueller Zustand

Foundation D – Route & Transit Intelligence ist vollständig abgeschlossen und **nicht erneut zu bauen**.

- PR #34: gemergt
- Merge-Commit auf `main`: `5bc93bcd35421e3763dc8a3515f254c209b63d6a`
- Production-Abnahme: `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`

Foundation E läuft auf:

- Branch: `feat/traveller-context-intelligence`
- Code-Head des Abschluss-Gates: `08716228d2e6a5404730276843374cf7d3f9e066`
- Basis: `origin/main` @ `c8dbe904faac49745bd149e3d2e85ca30ebd384c` (0 hinter)
- Draft PR: https://github.com/Jetnity/jetnity/pull/35
- Fachdokument: `docs/TRAVELLER_CONTEXT.md`
- Acceptance: `docs/FOUNDATION_E_TRAVELLER_CONTEXT_ACCEPTANCE.md`
- Audit vor Schemaänderung: `docs/FOUNDATION_E_ARCHITECTURE_AUDIT.md`
- Review-Tiefe: `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` plus Product-Owner-Nachtrag `docs/PRODUCT_OWNER_REVIEW_DEPTH_MANDATE.md`

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

## 3. Verifizierter Nachweis auf `08716228`

| Nachweis | Ergebnis |
| --- | --- |
| `npm test` | **1349/1349** |
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
| UI-Audit | **838/838, 0 Fehler**, WebKit + Chromium, 8 Viewports |
| GitHub Actions `ci.yml` | **success** – https://github.com/Jetnity/jetnity/actions/runs/32604932045 |
| Vercel Preview | **SUCCESS** – https://jetnity-du5dlqhww-jetnity-e1b93c82.vercel.app |
| PR-Mergebarkeit | `MERGEABLE`; Draft bleibt Draft |

## 4. Harte Grenzen

- kein Merge ohne ausdrückliche Product-Owner-Freigabe
- keine Production-Migration
- kein echter Travel-Requirements-Provider
- keine Passnummern, Scans, MRZ, Biometrie
- kein LLM als regulatorische Truth-Quelle
- keine Workspace-Neugestaltung, keine Safety-/Seasonality-Implementierung

## 5. Exakter nächster Schritt

1. Die zwei Closure-Blocker aus `docs/PR35_CHATGPT_FINAL_CLOSURE_REVIEW.md` sind im Code umgesetzt: `officialClass` in der Konfliktsignatur; strikte Legacy-Singularfelder an der Requirements-API.
2. Vollständiges Abschluss-Gate auf dem finalen Head laufen lassen: Tests, Typecheck, Lint, Hygiene, Production-Build, DB-Checks, UI-Audit, Actions, Vercel.
3. Draft bleibt Draft. Nicht Mark Ready, nicht mergen.
4. Danach unabhängiger ChatGPT-Closure-Check. Merge nur nach ausdrücklicher aktueller Product-Owner-Freigabe.
5. Production-Migration erst nach Merge und separater Freigabe.

`origin/main` @ `c8dbe904` bleibt 0 hinter. Kein Docs-Commit nur zum Festhalten von Checks.

Kein zweiter Foundation-E-Block auf einem anderen Branch beginnen.
