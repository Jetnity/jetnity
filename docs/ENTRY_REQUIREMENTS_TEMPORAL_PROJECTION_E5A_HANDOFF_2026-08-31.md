# Entry Requirements Temporal Projection E5-A – Handoff

Stand: 31. August 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN E5-B**  
Cursor-Agent: **`Jetnity entry requirements temporal projection 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-01a057e1-e45f-79d8-a828-97be0e060415`  
Issue: [#323](https://github.com/Jetnity/jetnity/issues/323)  
Branch: `feat/entry-requirements-temporal-projection-e5a-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/324

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR, nicht self-embedded.

## Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_TASK_2026-08-31.md`
2. `docs/CHATGPT_TECHNICAL_LEAD_READINESS_WORKSPACE_INTEGRATION_R1_CLOSED_2026-08-31.md`
3. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_STATUS_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_SELF_REVIEW_2026-08-31.md`
6. ADR-0206 in `DECISIONS.md`
7. ADR-0204 bleibt verbindlich für relative Regeln; ADR-0205 für Workspace-Presentation

## Was ein neuer Chat wissen muss

E5-A aktiviert **keinen** Provider und löst **kein** Reiseereignis auf.

Harte Wahrheiten:

1. Einzige Temporal-Domain bleibt E4 in `lib/readiness/temporal.ts`. E5-A projiziert nur.
2. Input ist `OfficialTemporalRule` plus explizite Bindings `Anchor → { eventRef, instant }`.
3. Der Core sucht keinen Trip, Stage, Segment, Airport oder Country und wählt keinen first match.
4. Absolute Truth nur mit `Z` oder numerischem Offset. `2026-09-12T18:00` und Date-only sind `invalid_instant`.
5. Fehlender benötigter Anchor ist `missing_anchor` und fällt nicht auf ein anderes Binding zurück.
6. Unterschiedliche Anchors werden erst nach beiden projizierten Instants verglichen. `availableFrom > dueBy` → `actionWindow: null` / `invalid_projected_window`.
7. `eventRef` bleibt bis zur Projektion erhalten. Gleiche Eingabe ist value-stabil.
8. `requirementsProviderAus()` bleibt `null`.
9. `docs/ACTIVE_WORK_STATUS.md` wird vom Cursor-Agenten nicht geändert.
10. Generation 1 arbeitet nur diesen Slice/PR. Review-Fixes bleiben dieselbe Session.

## Duplicate-/Integration-Entscheidung

Geprüft vor neuem Helper:

| Baustein | Entscheidung |
| --- | --- |
| `lib/readiness/temporal.ts` | wiederverwendet; keine zweite Enum-/Union-Kopie |
| `lib/safety/evidence.ts` `isoZeitLesen` | **nicht** importiert. Akzeptiert nur `Z`, keine Offsets; Safety-Domäne. Task verbietet Safety→Readiness-Kopplung nur um Parserzeilen zu sparen. |
| `lib/flights/zeit.ts` | Ortszeit ohne Zone; bewusst nicht als Instant-Parser missbraucht |
| `lib/route/kontakte.ts` | bleibt zonenlose `YYYY-MM-DDTHH:mm`; E5-A hängt kein `Z` daran |

Kleiner eigener Instant-Parser im Readiness-Core ist die scope-treue Lösung.

## Dateien ausserhalb der Task-Kernliste – Begründung

| Datei | Warum |
| --- | --- |
| `ARCHITECTURE.md` | AGENTS.md: neue Rechennaht an Official Timing |
| `DECISIONS.md` ADR-0206 | absolute-vs-zoneless Grenze, keine Occurrence-Auswahl |

Nicht angefasst: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, ROADMAP, Vision, Continuity, `OfficialEvaluation`, Provider-Port, Workspace-UI, Migrationen, Auth.

## Residuals

- Kein Resolver. Ein späterer Slice muss Events binden, nicht dieser Core.
- Lokale Gates: `npm test` 2944/2944, Typecheck, Lint 0/137, Production-Build, Hygiene. CI/Vercel müssen live am Exact Head geprüft werden.
- Kein Browser-/Real-Device-Abnahmebeweis, weil keine UI.
- Folgeslice nur nach TL-PASS und neuem versionierten Auftrag.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review. Nicht Ready. Nicht mergen. Kein E5-B/Resolver/Deadline-UI-Start.
