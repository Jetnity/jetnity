# Jetnity – TW6-B Runtime – Progressive Ziele / bestehende Trip-Stages

Stand: 26. August 2026  
Agent: **`Trip workspace audit architecture`**  
Branch: `feat/tw6-rest-progressive-stages`  
Typ: **RUNTIME / Product-Owner-Option 1 / TW6-B / TW6-REST-01**  
Baseline: `main @ 9e1868ea2b78b714e1c2f3ea1e1e2fd8ed5b6ae6`

`docs/ACTIVE_WORK_STATUS.md` wird in diesem Slice **nicht** parallel geändert.

## 1. Gate / Ausgangslage

Dieser Slice ist kein neuer Product-Owner-Entscheid.

Bereits kanonisch bestätigt:

- Product Owner hat Option 1 aus dem TW-6 Dependency Audit ausdrücklich genehmigt;
- TW6-A ist über PR #82 integriert;
- TW6-A hat progressive weitere Ziele / zusätzliche `trip_stages` ausdrücklich als `TW6-REST-01` offengelassen;
- Guest-One-Trip und Guest→Account bleiben unverändert;
- D0-2 und P1-D0-LIVE-01 sind integriert; `/planen`-Metadata/robots/canonical gehören **nicht** diesem Slice;
- aktuelle Continuity ist über PR #85 integriert;
- historische offene PRs werden nicht wieder aufgenommen.

Verbindliche Evidence:

- `docs/TRIP_WORKSPACE_TW6_DEPENDENCY_AUDIT.md`
- `docs/TRIP_WORKSPACE_TW6_DEPENDENCY_AUDIT_STATUS.md`
- `docs/TRIP_WORKSPACE_TW6_CREATE_ENTRY_TASK.md`
- `docs/TRIP_WORKSPACE_TW6_CREATE_ENTRY_STATUS.md`
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- `JETNITY_START_HERE.md`
- `JETNITY_HANDOFF.md`

Vor Runtime-Änderung aktuellen `main`, offene PRs, Branches und Datei-Kollisionen erneut live prüfen.

## 2. Ziel

Nur `TW6-REST-01` schließen:

> `/planen` erlaubt nach dem verpflichtenden ersten Reiseziel **progressiv optionale weitere Ziele**. Jedes bestätigte Ziel wird in derselben Reihenfolge zu einer bestehenden `trip_stage`. Guest und Account erzeugen denselben fachlichen Reisegraphen.

Kein neues Reise-, Stage-, Traveller-, Route-, Provider- oder Account-Modell.

## 3. Verbindliche Produktwahrheit

1. Das erste Ziel bleibt verpflichtend. Weitere Ziele sind optional und werden erst nach ausdrücklicher Nutzeraktion sichtbar.
2. Ein persistiertes Ziel braucht eine bestätigte kanonische `places`-/`geonames:`-Referenz. Freitext ist keine bestätigte Stage-Wahrheit.
3. Die Reihenfolge der bestätigten Ziele ist die Stage-Reihenfolge (`position` 1..n).
4. Derselbe Ort darf absichtlich mehrfach vorkommen, z. B. Paris → Rom → Paris. Nicht nach `placeId` deduplizieren.
5. Keine erfundenen Länder, Koordinaten, Stage-Daten, Transitkanten, Aufenthaltsdauern oder Tageszuordnungen.
6. Globaler Reisezeitraum bleibt Trip-Wahrheit. Er darf nicht still in behauptete Etappenzeiträume umgedeutet werden.
7. Bestehende technische Fallbacks dürfen nicht als ausdrückliche Nutzerwahl dargestellt werden. Wenn der bestehende `reise_anlegen`-/Day→Stage-Vertrag ohne neue Nutzereingabe zwingend eine fachlich falsche sichtbare Zuordnung erzeugen würde, **STOPP und Technical Lead informieren**, statt eine Migration oder neue Produktannahme einzubauen.
8. Keine stille zweite Destination-Wahrheit. Nach Validierung/Normalisierung muss es eine geordnete kanonische Create-Zielliste geben, aus der die Stage-Nutzlast abgeleitet wird.
9. Guest und Account müssen dieselbe Stage-Reihenfolge und dieselben kanonischen Ortsfakten erhalten.
10. Ein Gast bleibt auf genau eine aktive Gastreise begrenzt. Der bestehende Fail-fast-Gate muss vor allen zusätzlichen Orts-/Netz-/Modellschritten greifen.
11. Keine Citizenship-/Pass-Erhebung im Create.
12. Kein implizites `balanced` als Nutzerwahl. Der bereits genehmigte Persistenz-Default bleibt außerhalb dieses Rest-Slices unverändert und darf im UI weiterhin nicht als gewählt behauptet werden.
13. Kein Fake-Preis, keine Availability-, Provider-, Visa-, Safety- oder andere Hard-Truth-Erzeugung.

## 4. UX-Scope

Auf `/planen`:

- bestehendes primäres Ziel weiterverwenden;
- eine klare progressive Aktion wie `Weiteres Ziel hinzufügen`;
- zusätzliche Ziele mit derselben kanonischen `OrtSuche`-Semantik erfassen;
- zusätzliche Ziele einzeln wieder entfernen können;
- Reihenfolge ist in diesem Slice die Eingabereihenfolge; **kein Drag-and-drop-/Reorder-Umbau** erforderlich;
- keine zweite Wizard-/Create-IA bauen;
- keine Homepage-/Hero-/Marketing-Neugestaltung;
- bestehende `zielId`/`idee`-Handoffs für das erste Ziel erhalten;
- Mobile, Tablet und Desktop dieselbe Produktlogik;
- Tastaturbedienung, sichtbarer Fokus, verständliche Labels, Error-Summary/Feldfehler und Touch-Ziele gemäß bestehendem Standard.

Keine künstliche niedrigere Zielgrenze erfinden. Bestehende `GRENZEN.etappenJeReise` / DB-Grenzen wiederverwenden.

## 5. Runtime-/Architektur-Scope

Der Agent darf nur die minimal nötigen Create- und Trip-Graph-Flächen ändern, insbesondere soweit fachlich nötig:

- `components/trips/TripPlanner.tsx`
- `lib/trips/schema.ts`
- `types/trips.ts`
- `lib/trips/aktionen.ts`
- `lib/trips/gastspeicher.ts`
- `lib/places/aktionen.ts`
- kleine neue create-spezifische Helper/Tests
- diese Task-Datei + eigene TW6-B Status-/Evidence-Datei

Anforderungen:

- Client-Eingabe für mehrere Ziele strikt validieren und begrenzen;
- serverseitig **jedes** persistierte Ziel gegen kanonische `places`-Evidence bestätigen; Client-Name/Land/Koordinaten nie als Wahrheit übernehmen;
- wenn mehrere Ziele bestätigt werden, Reihenfolge und Duplikate stabil erhalten;
- bevorzugt bounded/batched Place-Validierung statt unkontrollierter N+1-Aufrufe;
- Account-Pfad weiterhin über die bestehende `reiseAusNutzlastAnlegen` / `public.reise_anlegen()`-Grenze;
- Guest-Pfad weiterhin über den bestehenden Gastspeicher und denselben `Trip`-Graphen;
- vorhandene `trip_stages`-Struktur nutzen; **keine neue Stage-Tabelle, keine Schattenpersistenz**;
- Single-Destination-Verhalten regressionsfrei halten;
- Titel-Semantik nicht nebenbei neu definieren oder aus mehreren Orten Marketing-artig zusammensetzen;
- `Reiseidee` bleibt der bestehende zweite Create-UI-Weg und wird nicht zu einem dritten Pfad erweitert, sofern für die gemeinsame Datenform keine kleine kompatible Anpassung zwingend nötig ist.

## 6. Harte Non-Scope-Grenzen

Nicht ändern / nicht aktivieren:

- keine Supabase-/Production-Migration;
- keine RLS-/Ownership-Änderung;
- kein Auth/MFA/AAL-/Session-Umbau;
- kein Guest→Account-Umbau;
- keine Account-Registry;
- kein Traveller-/Citizenship-/Document-Shared-Contract-Umbau;
- kein Route-/Transit-Shared-Contract-Umbau;
- keine Provideraktivierung, Secrets, paid calls oder Commercial Surfaces;
- kein TW-7, TW-8 oder TW-9;
- kein D1/G1;
- keine `/planen` Metadata/robots/sitemap/canonical/origin-Änderung;
- kein DNS, Domain-Cutover oder Public Indexing;
- keine Homepage-Positionierung/Marketing-Copy;
- kein SQL-Default-/`balanced`-DB-Slice;
- keine neue laufende Infrastrukturkosten.

Wenn eine korrekte Lösung eine dieser Grenzen erfordern würde: **STOPP**, Blocker mit Evidence dokumentieren und an ChatGPT / Technical Lead zurückgeben.

## 7. Pflicht-Tests / adversarial Fälle

Mindestens:

1. Eine Ziel-Regression: bisheriger Create erzeugt weiterhin genau eine Stage.
2. Drei bestätigte Ziele: Guest und Account behalten exakt dieselbe Reihenfolge.
3. Paris → Rom → Paris bleibt drei Stages; keine Deduplizierung.
4. Zusätzliches Ziel nur als Freitext / ohne bestätigte ID: Create scheitert ehrlich am Feld; nichts teilweise persistieren.
5. Unbekannte/manipulierte Ziel-ID: serverseitig fail-closed; keine Client-Ortsfakten übernehmen.
6. Grenze `GRENZEN.etappenJeReise`: Maximum akzeptiert, Maximum+1 abgelehnt.
7. Bestehende Gastreise: Fail-fast bevor zusätzliche Ortsbestätigung / Modell / teurer Netzschritt läuft.
8. Kein zusätzlicher Modellaufruf nur wegen weiterer Ziele.
9. Kein erfundener Origin / kein ZRH-Default.
10. Keine Citizenship-/Document-Erhebung.
11. Keine erfundenen Stage-Daten oder als Nutzerwahl dargestellte implizite Day→Stage-Verteilung.
12. Guest→Account erhält mehrere Stages verlustfrei und in derselben Reihenfolge.
13. Idempotenz über `clientRef` bleibt erhalten.
14. D0-Metadata-/robots-/sitemap-/canonical-Dateien unverändert.
15. Bestehende Route-/Traveller-/Commercial-Truth-Tests bleiben grün.

Zusätzlich komplette Repo-Gates gemäß aktuellem `package.json`/CI, mindestens Typecheck, Lint, Tests, Production Build sowie Hygiene/API-/Schema-/Auth-Checks, soweit im Workflow vorhanden.

## 8. Agenten-Arbeitsweise

Vor Implementierung:

1. `JETNITY_START_HERE.md` und dortige Pflichtlektüre lesen.
2. `origin/main` und diesen Branch live synchronisieren.
3. tatsächliche Create-/Stage-/Guest-/Account-Verträge selbst lesen; nicht nur diesem Task glauben.
4. offene PRs und Datei-/Shared-Contract-Kollisionen prüfen.
5. den vorhandenen Day→Stage-Fallback (`reise_anlegen`, `tageEtappenZuordnen`) ausdrücklich adversarial bewerten. Keine stille Annahme, dass proportional = Nutzerwahrheit.

Während der Arbeit:

- kleiner reviewbarer Diff;
- keine kosmetischen Nebenarbeiten;
- keine stillen Shared-Contract-Erweiterungen;
- Tests dürfen falsche Semantik nicht zementieren;
- Findings P0/P1/P2/P3 dokumentieren.

## 9. Deliverables

- Runtime-Diff nur im genehmigten Scope;
- relevante neue/angepasste Tests;
- `docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_STATUS.md` mit:
  - Baseline / Exact Head / Merge-Base / Ahead-Behind;
  - tatsächliche Changed Files;
  - Architektur-/Truth-Entscheidungen;
  - Guest-vs-Account-Parität;
  - Day→Stage-Semantik und deren Evidence;
  - P0/P1/P2/P3;
  - Tests;
  - GitHub Actions Exact-Head;
  - Vercel Exact-Head;
  - offene Restpunkte;
- eigener Draft-PR gegen `main`.

`docs/ACTIVE_WORK_STATUS.md` nicht parallel zentral umschreiben; zentrale Continuity zieht der Technical Lead nach unabhängiger Integration nach.

## 10. STOPP

Nach Implementierung, adversarial Self-Review, Tests, Push und Draft-PR:

- **NICHT selbst Ready setzen**;
- **NICHT selbst mergen**;
- **KEINEN Folgeslice starten**;
- **KEIN TW-7/TW-8/TW-9**;
- **STOPP** und vollständigen Bericht an ChatGPT / Technical Lead liefern.

Der unabhängige Technical Lead prüft echten Diff, Truth-Semantik, Tests, Exact-Head GitHub Actions und Exact-Head Vercel und entscheidet erst danach über Korrektur / Ready / Merge.