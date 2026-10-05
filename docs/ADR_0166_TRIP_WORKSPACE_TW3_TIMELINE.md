# ADR-0166 – Trip Workspace TW-3: Timeline / Etappe / Tag

Stand: 25. August 2026  
Status: **verbindlicher Slice-Entscheid; Runtime nur innerhalb dieses Scopes**

## Kontext

TW-1, TW-2 und TW-4 sind auf `main`. Merge von TW-4 / PR #60: `c935dd9fbb6f3365ed515c1f8fa3b781f20cfb9f`. Gemäß `docs/JETNITY_BINDING_BUILD_ORDER.md` folgt jetzt TW-3.

Die Ziel-IA (`docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md` §3, §6) verlangt Verlauf statt Modulwechsel: Etappen und Tage als eine Timeline aus dem kanonischen Trip-Graphen. Der heutige `TripWorkspacePlan` zeigt eine flache Tageszeile ohne Etappengruppierung und besitzt zusätzlich einen unbenutzten Desktop-Drei-Spalten-Zweig.

## Entscheidung

TW-3 baut eine **abgeleitete Timeline-Presentation** über den vorhandenen Trip-Graphen (`stages`, `days`, `items`, `ohneTag`).

Sie erzeugt keine zweite Tageswahrheit, keine URL-Auswahl, keine Persistenz und keinen neuen `trips.status`.

### Kanonische Auswahl

Die einzige Auswahlquelle bleibt `gewaehlterTagId(reise, bisher)`:

- existiert der bisherige Tag noch, bleibt er gewählt;
- sonst fällt die Auswahl deterministisch auf den ersten vorhandenen Tag (`days[0]`) oder `''`, wenn keine Tage existieren.

Etappenwechsel ändert nur den gewählten Tag (erster Tag der Etappe). Kein paralleler `gewaehlteEtappeId`-State.

### Kanonische Timeline-Wahrheit

- Etappen kommen ausschließlich aus `reise.stages`, sortiert nach `position`.
- Tage kommen ausschließlich aus `reise.days`, sortiert nach `dayIndex`, gruppiert nach `stageId`.
- Tage ohne passende Etappe bleiben ehrlich als „ohne Etappe“ sichtbar; sie werden nicht einem Nutzerziel zugeordnet.
- Tage ohne Items bleiben sichtbare leere Tage, nicht ein Fehler.
- Punkte ohne Tag bleiben in `ohneTag` sichtbar; sie gehören nicht zum letzten Tag.
- Flight-Transitländer sind **keine** Timeline-Etappen und keine Nutzerziele.

Guest und Account liefern bei gleichem Graphen dieselbe fachliche Timeline. Mobile, Tablet und Desktop teilen dieselbe Ableitung; unterschiedlich ist nur die Fläche.

## Erlaubter Scope

TW-3 darf:

- Etappen und Tage als zusammenhängenden Verlauf darstellen;
- ungeplante Punkte ehrlich sichtbar halten;
- `gewaehlterTagId` als einzige Auswahlquelle behalten und nach Graph-Mutation neu ableiten;
- Multi-Stage-/Multi-Destination-Reisen aus vorhandenen `stages` zeigen;
- dieselbe fachliche Timeline-Logik auf allen Geräten verwenden;
- den bestehenden Plan-Schreibpfad (Punkt anlegen/entfernen) auf dem gewählten Tag belassen.

## Nicht-Scope

TW-3 darf nicht:

- TW-5 Item-/Gap-Details oder Domain-Suchen zur Haupt-IA machen;
- Multi-Destination-Create / TW-6;
- DB/Migration/RLS/Auth/Traveller-/Route-Neumodellierung;
- neuen `trips.status` oder Schatten-Lifecycle;
- zweite Tages-/Timeline-Wahrheit in URL, Local Storage oder neuer Persistenz;
- Transit als Nutzer-Reiseziel umdeuten;
- Provider aktivieren, Secrets, paid calls, Guardian/Simulator oder Homepage/Marketing.

## Qualitätsgrenze

Eine hübsche Zeitleiste ist kein Beweis. Jede Etappe, jeder Tag und jeder ungeplante Punkt muss auf den Graphen zurückführbar sein. Error ≠ Empty ≠ Unknown. Ein leerer Tag ist leer, nicht fehlerhaft.

## Autonomie / Gates

Dieser Slice ist durch `docs/JETNITY_BINDING_BUILD_ORDER.md` gedeckt.

Nach Implementierung: Self-Review → vollständige Exact-Head-Gates → GitHub Actions/Vercel → unabhängiger ChatGPT/Technical-Lead-Review. Kein Ready/Merge durch den Coding Agent.
