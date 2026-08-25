# Trip Workspace TW-3 – Status

Stand: 25. August 2026  
Status: **aktiv / Draft-Vorbereitung / Ist-Audit vor Runtime**

## Identität

- Agent: `Trip workspace audit architecture`
- Branch: `feat/trip-workspace-tw3-timeline`
- Base / Merge-Base: `origin/main` `c935dd9fbb6f3365ed515c1f8fa3b781f20cfb9f`
- ADR: `docs/ADR_0166_TRIP_WORKSPACE_TW3_TIMELINE.md`
- Auftrag: `docs/TRIP_WORKSPACE_TW3_TASK.md`

## Vorbedingungen

- TW-1 / PR #56: merged
- TW-2 / PR #58: merged
- TW-4 / PR #60: merged; Merge-Commit `c935dd9fbb6f3365ed515c1f8fa3b781f20cfb9f`

## Ist-Audit vor Runtime

Geprüft gegen `c935dd9f` / aktuellen Branch-Head.

### Vorhandene Pfade

| Thema | Befund |
| --- | --- |
| Graph | `Trip.stages`, `Trip.days` (`stageId`, `dayIndex`, `dayDate`, `items`), `Trip.ohneTag` |
| Auswahl | `gewaehlterTagId(reise, bisher)` in `lib/trips/arbeitsbereich.ts`; Client-State `aktiverTag` in `TripWorkspace` |
| Mutation | `useEffect` leitet `aktiverTag` bei jedem `reise`-Wechsel über `gewaehlterTagId` neu ab |
| Ungeplant | `ohneTag`-Prop oder `reise.ohneTag`; bereits sichtbar im Plan |
| Transit | Flight-`routeItinerary` landet in Route-Facts, nicht in `stages`. Timeline darf Transitländer nicht als Etappe lesen |
| URL | aktiver Bereich und Tag sind Client-State, nicht in der URL |
| Persistenz | keine Tag-Auswahl-Tabelle, kein `trips.status`-Write |

### Mobile / Desktop-Komposition

- Produktpfad hängt `TripWorkspacePlan` immer mit `eingebettet` in die Übersicht.
- Kompakt und eingebettet teilen denselben Baum: horizontale Tageschips + gewählter Tag darunter; `aria-label="Tagesplan"` und `data-tagesplan-modul="ein"`.
- Ein zweiter Desktop-Drei-Spalten-Zweig existiert nur wenn `!kompakt && !eingebettet`. Im Produktpfad tot, aber eine zweite Presentation-IA.

### UI-Audit-Anker, die TW-3 nicht zerbrechen darf

- `aria-label="Tagesplan"`
- `data-tagesplan-modul="ein"`
- kein `[aria-label="Gewählter Reisetag"]` als zweite Karte
- kein `.overflow-y-auto` innerhalb des Tagesplans
- horizontaler Scroll nur in der bestehenden Tageszeile, falls sie bleibt
- sichtbarer Text `Tagesplan` in der leeren Übersicht

### P0 / P1

1. **P0 – Etappen fehlen in der Presentation.** Multi-Stage-Reisen werden als flache Tagesliste gezeigt. Der Graph kennt `stages` und `day.stageId`, die UI gruppiert nicht.
2. **P1 – zweite Presentation-IA im unbenutzten Desktop-Zweig.** Drei-Spalten-Layout inkl. vertikalem Scroller würde den UI-Audit brechen, falls der Zweig je aktiv würde. TW-3 vereinheitlicht auf einen Baum.
3. **P1 – Transit-Risiko indirekt.** Solange die Timeline nur `reise.stages` liest, ist Transit kein Ziel. Eine versehentliche Nutzung von `routeFacts.transitCountryCodes` als Etappen wäre ein Truth-Defekt.
4. **kein P0 zur Auswahl.** `gewaehlterTagId` hält gültige Tags und fällt deterministisch zurück. Tests dafür existieren bereits und müssen um Timeline-Gruppierung erweitert werden.

### Traveller-Kontext

TW-3 zeigt Orte/Tage/Punkte. Es sammelt keine Citizenships/Dokumente und darf Transit nicht als Reisendenziel behandeln. Nicht relevant für Credential-Auswahl.

## Noch nicht umgesetzt

Runtime-Timeline folgt nach diesem Audit. Kein TW-5.

## Nächster Schritt

Timeline-Ableitung und gemeinsame Presentation implementieren, Tests und Exact-Head-Gates, dann STOPP für unabhängigen Technical-Lead-Re-Review.
