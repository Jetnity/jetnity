# Foundation E – Traveller Context Acceptance

Stand: 22. August 2026  
Status: **technisch verifiziert auf Development; Draft PR; Merge- und Production-Gate offen**

Branch: `feat/traveller-context-intelligence`  
Head: `08716228d2e6a5404730276843374cf7d3f9e066`  
PR: https://github.com/Jetnity/jetnity/pull/35  
PR-Zustand: **Draft**, `MERGEABLE`  
Base: `main` @ `c8dbe904faac49745bd149e3d2e85ca30ebd384c`  
Task: `docs/CURSOR_FOUNDATION_E_TRAVELLER_CONTEXT_TASK.md`  
Fachdokument: `docs/TRAVELLER_CONTEXT.md`

Merge-Approval: `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`  
Kein Merge und keine Production-Migration ohne ausdrückliche aktuelle Freigabe.

---

## Was dieser Block beweist

Jetnity besitzt eine kanonische 1:n-Traveller-Wahrheit:

- ein stabiler Traveller
- mehrere Staatsbürgerschaften
- mehrere Reisedokumente / Credentials
- provider-neutrale Auswertung je vorhandener Credential-Option

Alte Foundation-C-Singularfelder bleiben compatibility-only und sind nach Backfill nicht mehr Source of Truth. Route/Transit kommt weiter nur aus Foundation D. Ohne Requirements-Provider entsteht keine Visa-/Transit-/Health-Wahrheit.

---

## Datenbankgrenze

- Development-Migration `20260822160000_traveller_context_intelligence.sql` **angewendet**
- Development-Nachtrag `20260822170000_traveller_context_fk_delete.sql` **angewendet**
- Development-Nachtrag `20260822180000_traveller_context_rereview.sql` **angewendet**
- neue Tabellen: `trip_traveller_citizenships`, `trip_traveller_documents`
- optionales `trip_readiness_items.traveller_id` mit Composite-FK
- RPC `public.party_schreiben(jsonb)` – `SECURITY INVOKER`, fester `search_path`
- Legacy-Spalten auf `trip_travellers` **nicht gedroppt**
- Production-Schema unverändert

Nachweise nach Anwendung:

| Prüfung | Ergebnis |
| --- | --- |
| `npm run db:anwenden -- --probe` vor dem Schreiben | nur `20260822160000` offen, Ziel `entwicklung` |
| `npm run db:anwenden` | angewendet |
| `npm run db:rechte` | OK – 51 Tabellenrechte, jedes durch eine Policy gedeckt; RLS aktiv |
| `npm run db:rls` | grün, inkl. neuer Child-Tabellen; anon/fremd abgewiesen |
| `npm run db:sicherheit` | **210/210** |
| `npm run db:parallelitaet` | **7/7**, parallele Citizenship-Inserts ohne Deadlock, Limit nie überschritten |

---

## Lokale Verifikation auf diesem Branch

| Nachweis | Stand |
| --- | --- |
| `npm test` | **1349 pass / 0 fail** auf `08716228` |
| Typecheck | **grün** (`tsc --noEmit`) |
| Lint | **grün** (`next lint`, 0 warnings/errors) |
| Hygiene | **grün** – `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` |
| Production Build | **grün** (`next build`, 38/38 Seiten) |
| Trip-Workspace-UI-Audit auf `08716228` | **838 Kombinationen, 0 Fehler**, WebKit + Chromium. Viewports: 280, 320, 360, 390, 430, 768, 844×390, 1280. Bericht: `/opt/cursor/artifacts/trip_workspace_ui_audit_08716228.json` |
| GitHub Actions `ci.yml` | **success** auf `08716228` – https://github.com/Jetnity/jetnity/actions/runs/32604932045 |
| Vercel Preview | **SUCCESS** auf `08716228` – https://jetnity-du5dlqhww-jetnity-e1b93c82.vercel.app |
| Erster Audit-Lauf (vor Review-Fixes) | 16 Fehler, alle `readiness-user-done`: v1-Fingerprint wurde nach Foundation E korrekt stale. Fixture auf v2 gesetzt. |
| Zweiter Audit-Lauf | **838/0** nach Fixture-Korrektur auf Head `17763238` |
| Foundation-E-Zustände im Audit | `eine-staatsbuergerschaft`, `zwei-staatsbuergerschaften`, `dokument-fehlt`, `staatsbuergerschaft-fehlt`, `zwei-reisende`, `langes-label`, `provider-unavailable` |
| Historisches CI/Preview vor Depth-Review | success/READY auf älteren Heads, nicht mehr der aktuelle Nachweis |

---

## Kernfälle

Automatisiert nachgewiesen:

1. Legacy-Singularform expandiert verlustfrei zu Citizenship + Document
2. 1 Traveller / mehrere Citizenships / mehrere Documents
3. Duplicate Citizenship wird deterministisch verhindert
4. Limits 8 / 12 / 20
5. Fingerprint unabhängig von Array-Reihenfolge
6. Add/Remove/Change von Citizenship oder Document ändert den Fingerprint
7. Änderung an Traveller A ändert Traveller B nicht
8. Route-/Transitänderung macht abhängige Entry-Checks stale
9. ohne Provider kein `required` / `not_required` / `conditional`
10. Vergleich ohne Evidence oder ohne option-level Semantik: `Noch nicht zuverlässig vergleichbar.`
11. Guest-Form und Account-RPC teilen dieselbe fachliche Party-Form
12. Cross-User-/Cross-Trip-INSERT auf Child-Tabellen abgewiesen
13. fremde Citizenship-ID am Dokument abgewiesen
14. Ausstellerland wird nicht zur Staatsbürgerschaft; Relation nur bei gespeicherter Citizenship-Ref
15. visa `required` gegen `not_required` ohne Eligibility ist kein Winner
16. explizit mandatory / not-allowed Optionen sind vergleichbar; gleichwertige Optionen nicht
17. Citizenship-Löschung nullt nur `citizenship_id`; Traveller-Löschung entfernt traveller-spezifische Readiness
18. Trip-Workspace-UI-Audit: 1/2 Citizenships, 2 Traveller, fehlendes Dokument, fehlende Citizenship, langes Label, Provider unavailable – WebKit + Chromium, 8 Viewports
19. Legacy-Backfill (nationality=CH, issuer=CH) erzeugt Citizenship und Document, aber `citizenship_id` bleibt null
20. Provider-Port transportiert `optionEligibility`/`optionMandate` nur über vertrauenswürdige current Evidence in die Engine
21. Parallele Citizenship-Inserts deadlocken nicht und überschreiten Limit 8 nicht
22. Kanonisch leere Child-Relationen bleiben leer trotz Legacy-Singularspalten
23. Fehlende Foundation-E-Relation fällt lesend auf Legacy zurück; andere DB-Fehler nicht
24. Explizite Document↔Citizenship-Relation ändert den Official Fingerprint; Issuer bleibt getrennt
25. Bestehende Document-`clientRef` und `citizenshipClientRef` überleben Edit/Save; neue Docs bekommen stabile UUID-Refs
26. Unauflösbare Traveller-Ref wird abgewiesen und degradiert nicht zu trip-level
27. Unvollständige/widersprüchliche option-level Evidence erzeugt keinen Winner
28. Explizites `citizenships: []` / `documents: []` bleibt leer; ungültige Party-Einträge verschwinden nicht still
29. Drei Credential-Optionen: Konflikt auf A lässt B/C nicht gewinnen; A bleibt als unknown/recheck sichtbar; Reihenfolge der Konfliktzeilen ändert das Ergebnis nicht; drei konsistente Optionen bleiben nach Comparator-Regeln auswertbar
30. Requirements-API: malformed Child, falsch typisierte Canonical-Property, Limit- oder Duplicate-Verletzung und erkennbare Passnummer/MRZ sind fail-closed; echte Legacy-Form ohne Canonical-Properties bleibt gültig
31. Doppelte current Zeilen derselben Option mit gleichem Result/Eligibility/Mandate, aber abweichender `officialClass` (`requirement` vs. `unknown`/`recommendation`/`advisory`) bleiben konfliktierte `unknown`/`recheck_needed`; Reihenfolge ändert das Ergebnis nicht; eine zweite konsistente Option gewinnt nicht; identische Duplikate inkl. abweichender Evidence-URL bleiben deduplizierbar
32. Requirements-API: vorhandene Legacy-Singularfelder (`documentType`, `documentExpiresOn`, Länder-Codes) werden vor `travellerLegacyLesen()` strikt validiert; `foobar` / `kaputt` / falscher Typ sind fail-closed und erreichen den Provider nicht; Guest-/Storage-Reader bleibt tolerant

---

## Offene Gates

- Draft PR bleibt Draft
- kein Mark Ready ohne Product-Owner-Entscheidung
- kein Merge
- keine Production-Migration
- kein echter Requirements-Provider
- Guest→Account bleibt für Readiness ein nachgelagerter Schritt; nur Party ist atomar
- Unabhängiger ChatGPT-Abschlussreview gegen `docs/PR35_CHATGPT_FINAL_CLOSURE_REVIEW.md` steht nach dem nächsten Gate aus
- `origin/main` @ `c8dbe904` ist semantisch synchronisiert; kein weiterer `main`-Sync nötig, solange `main` nicht erneut vorgeht
- Nach diesem Status-Commit folgt kein weiterer Docs-Commit nur zum Festhalten von Checks

---

## Expert-Funde außerhalb des Einbau-Scopes

1. Hotels, Flüge und Mobilität nutzen weiter nur die Kopfzahl. Das ist für Suche akzeptabel und darf nicht zur rechtlichen Traveller-Wahrheit werden.
2. Die vollständige Guest→Account-Kette (`reise_anlegen` → Party → Readiness) ist noch nicht eine einzige Transaktion. Party selbst ist fail-closed/atomar.
3. Ein späterer Contract-Cleanup muss Legacy-Spalten erst droppen, nachdem Production backfilled und alle Leser umgestellt sind.
