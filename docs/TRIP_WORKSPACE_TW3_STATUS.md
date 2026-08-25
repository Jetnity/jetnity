# Trip Workspace TW-3 – Status

Stand: 25. August 2026  
Status: **Runtime umgesetzt / Draft-PR #64 / STOPP für unabhängigen Technical-Lead-Re-Review**

## Identität

- Agent: `Trip workspace audit architecture`
- Branch: `feat/trip-workspace-tw3-timeline`
- Draft-PR: #64 – `Trip Workspace TW-3 – Timeline / Etappe / Tag`
- Base / Merge-Base: `origin/main` `c935dd9fbb6f3365ed515c1f8fa3b781f20cfb9f`
- Runtime-Head: `d912c657e4d1b9fb37bf29f7ddb8b6ec3d0d72ad`
- ADR: `docs/ADR_0166_TRIP_WORKSPACE_TW3_TIMELINE.md`
- Auftrag: `docs/TRIP_WORKSPACE_TW3_TASK.md`

## Vorbedingungen

- TW-1 / PR #56: merged
- TW-2 / PR #58: merged
- TW-4 / PR #60: merged; Merge-Commit `c935dd9fbb6f3365ed515c1f8fa3b781f20cfb9f`

## Ist-Audit vor Runtime

Geprüft gegen `c935dd9f` vor dem Runtime-Commit. Historische Audit-Evidence, nicht der aktuelle Review-Head.

| Thema | Befund |
| --- | --- |
| Graph | `Trip.stages`, `Trip.days` (`stageId`, `dayIndex`, `dayDate`, `items`), `Trip.ohneTag` |
| Auswahl | `gewaehlterTagId(reise, bisher)` in `lib/trips/arbeitsbereich.ts`; Client-State `aktiverTag` in `TripWorkspace` |
| Mutation | `useEffect` leitet `aktiverTag` bei jedem `reise`-Wechsel über `gewaehlterTagId` neu ab |
| Ungeplant | `ohneTag`-Prop oder `reise.ohneTag` |
| Transit | Flight-`routeItinerary` landet in Route-Facts, nicht in `stages` |
| URL | aktiver Bereich und Tag sind Client-State, nicht in der URL |
| Persistenz | keine Tag-Auswahl-Tabelle, kein `trips.status`-Write |

P0/P1 vor dem Fix:

1. **P0 – Etappen fehlten in der Presentation.** Behoben: `timelineAbleiten` gruppiert Tage nach `stageId`.
2. **P1 – zweite Presentation-IA im unbenutzten Desktop-Zweig.** Behoben: ein gemeinsamer Plan-Baum.
3. **P1 – Transit-Risiko.** Unverändert fail-closed: Timeline liest nur `reise.stages`.
4. Auswahlvertrag `gewaehlterTagId` blieb die einzige Quelle.

## Umgesetzt

Runtime:

- `lib/trips/timeline.ts`
- `lib/trips/timeline.test.ts`
- `components/trips/TripWorkspacePlan.tsx`
- `components/trips/TripWorkspace.tsx` (Kommentar / ADR-0166)

Wiederverwendet:

- `gewaehlterTagId` / `planStatus`
- kanonischer Trip-Graph
- bestehende Plan-Schreibpfade

Nicht umgesetzt und nicht vorgetäuscht:

- keine Timeline (TW-5 Details)
- kein Multi-Destination-Create
- keine URL-Tag-Wahrheit
- keine Provideraktivierung / Secrets / paid calls
- kein `trips.status` / keine Persistenz

## Exact-Head-Gates auf `d912c657`

Lokal, alle grün:

- `check:setup:ci` – OK, 1 Warning: keine `.env`
- `npm run typecheck` – OK
- `npm run lint` – OK
- gezielte TW-3-Tests – **10/10** Timeline plus bestehende Arbeitsbereich-Tests
- `npm test` – **1953/1953**
- `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` – OK
- `npm run build` – OK
- `npm run audit:trip-workspace` – 1018 Kombinationen, 0 Fehler. Bericht: `/opt/cursor/artifacts/tw3_audit_d912c657.json`

Remote, derselbe Runtime-SHA:

- GitHub Actions: SUCCESS – https://github.com/Jetnity/jetnity/actions/runs/32855585901
- Vercel Preview: SUCCESS – Deployment `6084561853`

Der nachfolgende Status-Commit ist docs-only. CI/Vercel auf dem Persist-Head erneut prüfen; das UI-Audit gilt für den unveränderten Runtime-Stand `d912c657`.

## Self-Review

- Multi-Stage-Reisen erscheinen als Etappen mit zugeordneten Tagen.
- Leere Tage bleiben leer, nicht fehlerhaft.
- `ohneTag` bleibt ungeplant und wird nicht dem letzten Tag zugeschlagen.
- Gültiger Tag überlebt Graph-Updates; entfallener Tag fällt auf `days[0]` bzw. `''`.
- Guest/Account und Mobile/Desktop teilen dieselbe Ableitung.
- Transitländer aus Flight-Itineraries werden nicht zu Timeline-Etappen.
- Keine zweite Auswahl in URL oder Persistenz.
- UI-Audit-Anker `aria-label="Tagesplan"` und `data-tagesplan-modul="ein"` bleiben.
- Kein TW-5, keine Writes/Side Effects, keine neue Persistenz/Hard Truth.

## Offene Risiken

- Sehr lange Etappennamen können auf 280px umbrechen; der Audit blieb overflow-frei.
- Tage ohne `stageId` heißen ehrlich „Ohne Etappe“, nicht ein erfundenes Ziel.
- Budget, Pace und Domain-Suchen bleiben unverändert keine Timeline-Wahrheit.

## Nächster Schritt

Unabhängiger ChatGPT/Technical-Lead-Re-Review von Draft-PR #64. Kein Ready, kein Merge, kein TW-5.
