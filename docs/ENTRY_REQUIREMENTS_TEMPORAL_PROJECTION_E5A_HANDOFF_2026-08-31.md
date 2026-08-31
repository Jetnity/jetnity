# Entry Requirements Temporal Projection E5-A – Handoff

Stand: 31. August 2026  
Status: **TL CHANGES REQUIRED BEHOBEN / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW / KEIN READY / KEIN MERGE / KEIN E5-B**  
Cursor-Agent: **`Jetnity entry requirements temporal projection 1`**, Generation 1  
Ursprüngliche Implementation: Session `bc-01a057e1-e45f-79d8-a828-97be0e060415` (abgeschlossen; nicht wieder geöffnet)  
TL-Review-Fix-Recovery: Session `bc-c3909ff8-66de-4b95-afeb-cff18935b4fc`  
Grund: GitHub/Cursor konnte die abgeschlossene ursprüngliche Session trotz expliziter Fortsetzungsanweisung nicht wieder öffnen.  
Rolle: nur mechanischer enger Review-Fix — **keine** gleiche Session, keine neue Produktgeneration, kein neuer Slice  
Issue: [#323](https://github.com/Jetnity/jetnity/issues/323)  
Branch: `feat/entry-requirements-temporal-projection-e5a-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/324

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR, nicht self-embedded.

## Session-Abweichung

Live Evidence: ursprüngliche Implementation-Session `bc-01a057e1-e45f-79d8-a828-97be0e060415` war abgeschlossen. GitHub/Cursor konnte sie trotz expliziter Fortsetzungsanweisung nicht wieder öffnen und erzeugte Recovery-Session `bc-c3909ff8-66de-4b95-afeb-cff18935b4fc`.

STOP und alle späteren Recovery-Anweisungen landeten in `bc-c3909ff8-66de-4b95-afeb-cff18935b4fc`. Das ist **nicht** die ursprüngliche Session und **keine** „gleiche Session“.

Sie darf nur den TL-Befund aus Kommentar `5478873885` und den Provenance-Grenzfall (whitespace-only `eventRef`) tragen. Kein Generation-2-Auftrag, kein Folgeslice.

## Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_TASK_2026-08-31.md`
2. Technical-Lead-Kommentar `5478873885` auf PR #324 (CHANGES REQUIRED auf `ae091777...`)
3. `docs/CHATGPT_TECHNICAL_LEAD_READINESS_WORKSPACE_INTEGRATION_R1_CLOSED_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_STATUS_2026-08-31.md`
6. `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_SELF_REVIEW_2026-08-31.md`
7. ADR-0206 in `DECISIONS.md`
8. ADR-0204 bleibt verbindlich für relative Regeln; ADR-0205 für Workspace-Presentation

## Was ein neuer Chat wissen muss

E5-A aktiviert **keinen** Provider und löst **kein** Reiseereignis auf.

Harte Wahrheiten:

1. Einzige Temporal-Domain bleibt E4 in `lib/readiness/temporal.ts`. E5-A projiziert nur.
2. Input ist `OfficialTemporalRule` plus explizite Bindings `Anchor → { eventRef, instant }`.
3. Der Core sucht keinen Trip, Stage, Segment, Airport oder Country und wählt keinen first match.
4. Absolute Truth nur mit `Z` oder numerischem Offset. `2026-09-12T18:00` und Date-only sind `invalid_instant`.
5. Fehlender benötigter Anchor ist `missing_anchor` und fällt nicht auf ein anderes Binding zurück.
6. Unterschiedliche Anchors werden erst nach beiden projizierten Instants verglichen. `availableFrom > dueBy` → `actionWindow: null` / `invalid_projected_window`.
7. `eventRef` bleibt bis zur Projektion erhalten. Gleiche Eingabe ist value-stabil. Whitespace-only ist keine stabile Identität und wird `missing_anchor`.
8. Leere/ungültige Regeln geben **pro Aufruf** eine frische Projection zurück (`leereProjektion()`). Kein gemeinsam mutierbares Modul-Singleton.
9. `requirementsProviderAus()` bleibt `null`.
10. `docs/ACTIVE_WORK_STATUS.md` wird vom Cursor-Agenten nicht geändert.
11. Generation 1 bleibt der Slice. Recovery-Session `bc-c3909ff8-66de-4b95-afeb-cff18935b4fc` ist nur der mechanische Carrier; sie ist nicht die ursprüngliche Implementation-Session.

## Review-Fix dieser Recovery-Session

Geprüfter TL-Head: `ae091777e5aec0d5a0b6baf8b28a5ce1234c967d`.

Befund: `LEERE_PROJEKTION` war ein modulweites mutable Singleton. Ein Aufrufer konnte `issues.push(...)` oder Felder mutieren und spätere unabhängige Aufrufe kontaminieren. Das verletzt **pure domain** und **gleiche Eingabe → value-stabile Ausgabe**.

Fix (Commit `85aef5e2673bc06f0e6d7cb76d91aeeadf47e590`):

- `leereProjektion()` statt gemeinsamer Konstante
- Regressionstest für Cross-Call-Isolation (Referenzungleichheit + Mutation eines früheren Ergebnisses ändert spätere Aufrufe nicht)
- Quelltext-Guard gegen Rückkehr von `LEERE_PROJEKTION`

Zusätzlicher Provenance-Befund: `eventRefLesen()` akzeptierte jeden String mit `length > 0`, also auch `'   '`.

Fix (Commit `fbf631c3cf86b26b069ac028dd2aef303162f6c2`):

- Whitespace-only `eventRef` → `missing_anchor`, `eventRef: null`
- kein Fallback auf ein anderes Binding
- keine neue Taxonomie, kein Trim/Rewrite gültiger Identitäten
- Regressionstest für `'   '`, Tab, Newline

Nicht angefasst: Resolver, Timezone, Provider, Factory, UI, Tasks, Notifications, Supabase, E5-B, `ACTIVE_WORK_STATUS.md`.

`origin/main` vor Handoff erneut gelesen: weiterhin `1600767be5ec87961e1d5b5e10c4bcc2f6eb51aa`. Branch 0 behind.

## Duplicate-/Integration-Entscheidung

Geprüft vor neuem Helper (unverändert):

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
| `ARCHITECTURE.md` | AGENTS.md: neue Rechennaht an Official Timing (bereits im Slice, nicht in diesem Fix) |
| `DECISIONS.md` ADR-0206 | absolute-vs-zoneless Grenze, keine Occurrence-Auswahl (bereits im Slice, nicht in diesem Fix) |

Dieser Review-Fix ändert nur Core, Test und die drei E5-A Status-/Handoff-/Self-Review-Dateien.

Nicht angefasst: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, ROADMAP, Vision, Continuity, `OfficialEvaluation`, Provider-Port, Workspace-UI, Migrationen, Auth.

## Residuals

- Kein Resolver. Ein späterer Slice muss Events binden, nicht dieser Core.
- Lokale Gates nach Provenance-Fix: `npm test` 2946/2946, Typecheck, Lint 0/137, Production-Build, Hygiene. Gates auf `85aef5e2...` sind historisch. CI/Vercel müssen live am Exact Head geprüft werden.
- Kein Browser-/Real-Device-Abnahmebeweis, weil keine UI.
- Folgeslice nur nach TL-PASS und neuem versionierten Auftrag.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Re-Review auf dem **neuen** Head. Nicht Ready. Nicht mergen. Kein E5-B/Resolver/Deadline-UI-Start.
