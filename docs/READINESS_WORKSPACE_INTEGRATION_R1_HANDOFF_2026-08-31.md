# Readiness Workspace Integration R1 – Handoff

Stand: 31. August 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**  
Cursor-Agent: **`Jetnity readiness workspace integration 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-5bb53c9a-e6bf-4189-bd4f-bb2dc1f6eda3`  
Issue: [#319](https://github.com/Jetnity/jetnity/issues/319)  
Branch: `feat/readiness-workspace-integration-r1-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/320

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR, nicht self-embedded.

## Zuerst lesen

1. `docs/READINESS_WORKSPACE_INTEGRATION_R1_TASK_2026-08-31.md`
2. `docs/READINESS_WORKSPACE_INTEGRATION_R1_STATUS_2026-08-31.md`
3. `docs/READINESS_WORKSPACE_INTEGRATION_R1_SELF_REVIEW_2026-08-31.md`
4. ADR-0205 in `DECISIONS.md`
5. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
6. ADR-0201 / ADR-0202 / ADR-0203 / ADR-0204 bleiben verbindlich

## Was ein neuer Chat wissen muss

R1 aktiviert **keinen** Provider und ändert **keine** Official- oder User-Readiness-Wahrheit.

Harte Wahrheiten:

1. Official Scope bleibt `Traveller × Credential-Option × Destination/Transit × Requirement Type`.
2. User Readiness bleibt `trip_readiness_items` / `ReadinessViewItem`. Kein User-Häkchen ändert Official Truth.
3. Kein Default-Pass, keine Default-Citizenship, kein `documents[0]`, kein `evaluations[0]`.
4. In `Reisevorbereitung` dürfen grobe `entry_check` / `visa_check` / `travel_document_check` / `insurance_check` nicht zusätzlich zu Official Requirements stehen.
5. Domain-/Persistenzobjekte dieser Kinds bleiben erhalten. `readinessAnsicht()` und TW-4 Attention wurden nicht auf den UI-Filter umgestellt.
6. Ticket-/Booking-/Custom-Preparation bleiben sichtbar. Sichtbare Counts zählen nur sichtbare persönliche Tasks.
7. Nur echte leere Placeholder dürfen kompakt werden. Current, stale, recheck und evidence-bearing Rows bleiben einzeln.
8. Kompakte Copy lautet `Einreiseanforderungen noch nicht prüfbar` plus fail-closed Begründung.
9. `requirementsProviderAus()` bleibt `null`.
10. `docs/ACTIVE_WORK_STATUS.md` wird vom Cursor-Agenten nicht geändert.
11. Generation 1 arbeitet nur diesen Slice/PR. Review-Fixes bleiben dieselbe Session.

## Dateien ausserhalb der Task-Kernliste – Begründung

| Datei | Warum |
| --- | --- |
| `lib/readiness/workspace-presentation.ts` | Presentation-only Filter und sichtbare Counts, ohne Domain-Änderung |
| `lib/readiness/workspace-integration-r1.test.ts` | 13 Pflichtregressionen plus Invarianten |
| `ARCHITECTURE.md` | Besucher-Checkliste darf reine Placeholder kompakt zeigen |
| `DECISIONS.md` ADR-0205 | Presentation-Deduplizierung ohne Truth-Mix |
| `docs/TRAVEL_READINESS.md` | UX: keine parallelen groben Karten, kompakte Placeholder |
| Status / Handoff / Self-Review | Continuity für unabhängigen TL-Review |

Nicht angefasst: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, ROADMAP, Vision, Continuity-Stammdatei, Migrationen, Auth, `lib/readiness/status.ts`, `lib/readiness/ableitung.ts`, `lib/trips/attention.ts`.

## Residuals

- Lokale Gates: im Status-/PR-Protokoll; CI/Vercel müssen live am Exact Head geprüft werden.
- Kein Browser-/Real-Device-Abnahmebeweis.
- Folgeslice nur nach TL-PASS und neuem versionierten Auftrag.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review. Nicht Ready. Nicht mergen. Kein E5/Adapter/Deadline-/Completion-Start.
