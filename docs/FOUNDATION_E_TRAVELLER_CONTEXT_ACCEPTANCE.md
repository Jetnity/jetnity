# Foundation E – Traveller Context Acceptance

Stand: 22. August 2026  
Status: **technisch verifiziert auf Development; Draft PR; Merge- und Production-Gate offen**

Branch: `feat/traveller-context-intelligence`  
PR: https://github.com/Jetnity/jetnity/pull/35  
PR-Zustand: **Draft**  
Base: `main` @ `ae64e4ff88ddacf4bbb6d9521e003fb1cc9653aa`  
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
| `npm run db:sicherheit` | **204/204** |

---

## Lokale Verifikation auf diesem Branch

| Nachweis | Stand |
| --- | --- |
| `npm test` | **1304 pass / 0 fail** |
| Typecheck | **grün** (`tsc --noEmit`) |
| Lint | **grün** (`next lint`, 0 warnings/errors) |
| Hygiene | **grün** – `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` |
| Production Build | **grün** (`next build`, 38/38 Seiten) |
| Trip-Workspace-UI-Audit | Script um Foundation-E-Varianten erweitert; **Lauf in dieser Umgebung noch nicht ausgeführt** |
| GitHub CI | noch nicht auf diesem Head gelaufen |
| Vercel Preview | noch nicht auf diesem Head gelaufen |

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
10. Vergleich ohne Evidence: `Noch nicht zuverlässig vergleichbar.`
11. Guest-Form und Account-RPC teilen dieselbe fachliche Party-Form
12. Cross-User-/Cross-Trip-INSERT auf Child-Tabellen abgewiesen
13. fremde Citizenship-ID am Dokument abgewiesen

---

## Offene Gates

- Draft PR bleibt Draft
- kein Mark Ready ohne Product-Owner-Entscheidung
- kein Merge
- keine Production-Migration
- kein echter Requirements-Provider
- Trip-Workspace-UI-Audit auf der Device-Matrix nachziehen, sobald Playwright in der Zielumgebung läuft
- Guest→Account bleibt für Readiness ein nachgelagerter Schritt; nur Party ist atomar

---

## Expert-Funde außerhalb des Einbau-Scopes

1. Hotels, Flüge und Mobilität nutzen weiter nur die Kopfzahl. Das ist für Suche akzeptabel und darf nicht zur rechtlichen Traveller-Wahrheit werden.
2. Die vollständige Guest→Account-Kette (`reise_anlegen` → Party → Readiness) ist noch nicht eine einzige Transaktion. Party selbst ist fail-closed/atomar.
3. Ein späterer Contract-Cleanup muss Legacy-Spalten erst droppen, nachdem Production backfilled und alle Leser umgestellt sind.
