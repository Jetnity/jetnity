# Entry Requirements Visitor Checklist E3 – Handoff

Stand: 31. August 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN E4**  
Cursor-Agent: **`Jetnity entry requirements checklist 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-101a3978-c843-4ac5-8678-112eef039283`  
Issue: [#311](https://github.com/Jetnity/jetnity/issues/311)  
Branch: `feat/entry-requirements-checklist-e3-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/312

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR, nicht self-embedded.

## Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_VISITOR_CHECKLIST_E3_TASK_2026-08-31.md`
2. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
3. `docs/ENTRY_REQUIREMENTS_VISITOR_CHECKLIST_E3_STATUS_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_VISITOR_CHECKLIST_E3_SELF_REVIEW_2026-08-31.md`
5. ADR-0203 in `DECISIONS.md`
6. ADR-0201 / ADR-0202 bleiben verbindlich für Visa-Modus und Official Actions

## Was ein neuer Chat wissen muss

E3 aktiviert **keinen** Provider und erfindet keine Official Truth. Es macht die vorhandene E1/E2-Wahrheit sichtbar.

Harte Wahrheiten:

1. Eine sichtbare Official-Zeile bleibt exakt `Traveller × Credential-Option × Destination/Transit × Requirement Type`.
2. Kein Default-Pass, keine Default-Citizenship, kein `documents[0]`, kein `evaluations[0]`.
3. Harte Ergebnis-Copy nur bei `status === 'current'` **und** `freshness === 'current'`.
4. eTA bleibt `electronic_travel_authorization`. Visa-Modi bleiben Subtypen am Typ `visa`.
5. Credential-Label nur aus exakt aufgelösten Dokumentdaten. Issuer Country ≠ Citizenship. Unbekannt → `Reisedokument-Option`.
6. Action-Labels nur aus `purpose`. Keine URL-Heuristik. Keine doppelte gleiche URL.
7. Keine Gebühren, Stay-Dauer, Seitenzahl, Proof-of-Funds-Beträge oder Deadlines erfinden.
8. `requirementsProviderAus()` bleibt `null`.
9. `docs/ACTIVE_WORK_STATUS.md` wird vom Cursor-Agenten nicht geändert.
10. Generation 1 arbeitet nur diesen Slice/PR. Review-Fixes bleiben dieselbe Session.

## Dateien ausserhalb der Task-Kernliste – Begründung

| Datei | Warum |
| --- | --- |
| `ARCHITECTURE.md` | Besucher-Checkliste ist die sichtbare Official-Presentation-Naht |
| `DECISIONS.md` ADR-0203 | Presentation-only, keine neue Hard Truth |
| `docs/TRAVEL_READINESS.md` | UX beschrieb bisher nur Status-Summen; First-Class-Typen nachziehen |

Nicht angefasst: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, ROADMAP, Vision, Continuity, Migrationen, Auth.

## Residuals

- Targeted E3-Tests 16/16. Full `npm test` / Typecheck / Lint / Build folgen im Delivery-Satz und müssen am Exact Head gelten.
- Kein Browser-/Real-Device-Abnahmebeweis.
- Folgeslice nur nach TL-PASS und neuem versionierten Auftrag.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review. Nicht Ready. Nicht mergen. Kein E4/Adapter/Deadline-Start.
