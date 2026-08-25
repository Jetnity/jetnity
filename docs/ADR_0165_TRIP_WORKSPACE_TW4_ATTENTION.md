# ADR-0165 – Trip Workspace TW-4: Aufmerksamkeit / „Jetzt wichtig“

Stand: 25. August 2026  
Status: **verbindlicher Slice-Entscheid; Runtime nur innerhalb dieses Scopes**

## Kontext

TW-1 (Shell & Geräteparität) und TW-2 (Reiseübersicht) sind auf `main`. Gemäß `docs/JETNITY_BINDING_BUILD_ORDER.md` folgt jetzt TW-4 vor TW-3.

TW-4 löst das P0-Problem, dass der Workspace relevante vorhandene Signale zwar in einzelnen Domänen kennen kann, aber keine ehrliche, begrenzte Priorisierung „Was ist jetzt wichtig?“ besitzt. Gleichzeitig darf die heutige Safety-/Seasonal-Stille im realen Produktpfad nicht dauerhaft dadurch kaschiert werden, dass fehlende Evaluation einfach als „nicht geprüft“ stehen bleibt, **wenn Jetnity bereits eine sichere provider-neutrale, side-effect-freie Evaluation mit vorhandenem Kontext ausführen kann**.

## Entscheidung

TW-4 baut ausschließlich einen **reinen, abgeleiteten Attention-Layer** über bereits vorhandene Trip-/Coverage-/Readiness-/Safety-/Seasonal-Ableitungen.

Er erzeugt keine neue Hard Truth, keinen zweiten Reise-Lifecycle, keine Persistenz und keinen LLM-Score.

Wo der aktuelle Code bereits eine provider-neutrale, side-effect-freie Safety-/Seasonal-Evaluations- oder Orchestrierungsnaht besitzt und alle erforderlichen vorhandenen Inputs vorliegen, darf TW-4 diese im Workspace-Produktpfad **wiederverwenden bzw. anbinden**, damit echte Evaluation statt künstlicher Dauer-Stille entsteht. Das ist nur erlaubt, wenn dadurch keine Provideraktivierung, kein Secret, kein paid call, keine neue Truth-Domäne, kein Shared-Contract-Write und keine Migration nötig werden. Fehlt diese sichere Naht oder notwendiger Kontext, bleibt der Zustand ehrlich ungeprüft/nicht prüfbar.

### Kanonische Attention-Truth

Die vier Leerstände aus `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md` §5.4 bleiben zwingend getrennt:

- `nichts_dringend_geprueft`
- `noch_nicht_geprueft`
- `noch_nicht_pruefbar`
- `pruefung_nicht_verfuegbar`

Zusätzlich bleiben `unknown`, `stale` und `error` fachlich getrennt.

Eine fehlende Safety-/Seasonal-Evaluation oder fehlende Prop darf **niemals** als clean (`nichts_dringend_geprueft`) und **niemals** automatisch als unavailable (`pruefung_nicht_verfuegbar`) erscheinen. Der ehrliche Zustand ist grundsätzlich `noch_nicht_geprueft`, sofern der Kontext grundsätzlich prüfbar wäre.

`nichts_dringend_geprueft` ist nur zulässig, wenn die für diese Aussage relevanten Prüfungen nachweislich erfolgreich ausgeführt wurden und keine priorisierbaren Signale liefern. Die bloße Abwesenheit eines Ergebnisses oder Props reicht nie.

## Erlaubter Scope

TW-4 darf:

- vorhandene Graph-/Coverage-Gaps priorisieren;
- Readiness `stale` / offene bereits vorhandene Checks sichtbar machen;
- vorhandene Safety-/Seasonal-Evaluationen nur nach deren kanonischer Lage/Freshness einordnen;
- eine **bereits vorhandene provider-neutrale, side-effect-freie** Safety-/Seasonal-Evaluationsnaht aus dem Workspace heraus verwenden, wenn ihre Inputs aus kanonischem Graph/Context stammen und keine besonderen Gates berührt werden;
- Evaluationserfolg, `unknown`, `stale`, `error`, `unavailable` und fehlende Orchestrierung weiterhin getrennt halten;
- `insufficient_context` / fehlenden erforderlichen Traveller-Kontext ehrlich als nicht prüfbar darstellen;
- einen begrenzten Satz sichtbarer Punkte zeigen und den Rest progressiv zugänglich machen;
- pro Punkt genau einen nachvollziehbaren nächsten Schritt anbieten, falls der bestehende Produktpfad ihn bereits unterstützt;
- Mobile/Tablet/Desktop mit derselben fachlichen Priorisierungslogik bedienen.

## Nicht-Scope

TW-4 darf nicht:

- neue Tabellen, Spalten, Migrationen, RLS oder Persistenz einführen;
- `trips.status` oder einen Schatten-Lifecycle erzeugen;
- einen LLM-Prioritätsscore oder frei erfundene Severity erzeugen;
- neue Safety-/Seasonal-Provider, externe Datenquellen oder Providerverträge einführen;
- Official `required` ohne Official Evidence behaupten;
- fehlende Safety-/Seasonal-Evaluation als „keine Warnungen“ interpretieren;
- eine Staatsbürgerschaft oder ein Dokument als Standard auswählen;
- Traveller Registry, Citizenship-/Document-Modell oder Route-Verträge verändern;
- Guardian-/What-if-Simulator-Runtime bauen;
- TW-3 Timeline, TW-5 Details oder spätere Workspace-Slices hineinziehen;
- Provider aktivieren, Secrets/API-Keys hinzufügen, paid calls ausführen oder Production-Provider-Verträge ändern;
- Production-Migrationen oder öffentliche/produktive Aktivierungen durchführen;
- Marketing-/Growth-Runtime vorziehen.

## Multi-Citizenship

Ein Traveller mit mehreren Staatsbürgerschaften/Dokumenten darf nicht auf `[0]`, „primary“ oder impliziten Default reduziert werden. Fehlt für eine Official-Prüfung die notwendige Auswahl/Context-Evidence, ist der Attention-Zustand ehrlich `noch_nicht_pruefbar` / `insufficient_context` gemäß bestehendem Vertrag, nicht „Visa fehlt“ oder „alles gut“.

Safety-/Seasonal-Signale dürfen traveller-neutrale bestehende Route-/Ortskontexte verwenden, aber keine Citizenship- oder Document-Entscheidung simulieren, die der zuständigen Official-/Traveller-Logik gehört.

## Priorisierungsprinzip

Priorisierung ist eine UI-/Presentation-Ableitung über vorhandene Signale. Sie darf nur aus maschinenlesbarer Domain-Lage entstehen, nicht aus lokalisierten Anzeigetexten.

Die Ordnung muss deterministisch und testbar sein. Blockierende bzw. zeitkritische belegte Signale dürfen vor allgemeinen Hinweisen stehen; bei gleicher Lage wird eine stabile, dokumentierte Reihenfolge verwendet. Keine künstliche Dringlichkeit.

Der Attention-Layer darf keine Domainlage „verbessern“: `unknown`, `stale`, `error`, `unavailable`, `insufficient_context` und „noch nicht geprüft“ bleiben verlustfrei erkennbar.

## Gates

Vor Ready/Merge auf Exact Head mindestens:

- Self-Review des Agenten;
- TypeScript / Lint / vollständige Tests;
- gezielte TW-4-Unit-Tests;
- `npm run audit:trip-workspace` zusätzlich;
- GitHub Actions SUCCESS;
- Vercel Preview SUCCESS/READY;
- unabhängiger ChatGPT/Technical-Lead-Review;
- Branch 0 behind gegen `main` oder erneute Synchronisierung + vollständige Exact-Head-Gates.

Besondere Product-Owner-Gates aus `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md` bleiben unverändert.