# Jetnity – verbindliche Cursor-Agent-Session-Rotation und Namensführung

Stand: 26. August 2026  
Status: **Product-Owner-verbindlich; für alle aktuellen und zukünftigen ChatGPT-/Technical-Lead-Chats sowie alle Cursor-Agenten verpflichtend**

## 1. Grundprinzip

Der fachliche **Workstream bleibt dauerhaft**, die konkrete Cursor-Agent-Session dagegen nicht zwingend.

Ein Cursor-Agent darf für denselben Slice, denselben PR, dieselbe unmittelbare Korrektur oder dasselbe eng zusammenhängende Debugging weiterverwendet werden. Nach Abschluss einer logischen Arbeitseinheit soll jedoch standardmäßig eine **frische Cursor-Agent-Session** verwendet werden, damit alter Gesprächskontext, Zusammenfassungsverluste und vermischte Aufgaben nicht die Qualität verschlechtern.

## 2. Wann derselbe Agent weiterverwendet wird

Denselben Cursor-Agenten verwenden bei:

- demselben Slice;
- demselben PR;
- Korrektur eines Findings aus dem unabhängigen Technical-Lead-Review;
- eng zusammenhängendem Debugging derselben Implementierung;
- Exact-Head-Revalidation nach einer kleinen Korrektur;
- solange der Agent seinen unmittelbaren Arbeitskontext noch sauber und fokussiert hält.

## 3. Wann ein frischer Agent gestartet wird

Standardmäßig einen **neuen Cursor-Agenten** starten bei:

- abgeschlossenem und gemergtem Modul-/Slice-Checkpoint;
- Beginn eines neuen klar abgegrenzten Slices im selben Workstream;
- Wechsel in ein neues Modul oder einen neuen fachlichen Teilbereich;
- stark angewachsenem oder unübersichtlichem Agenten-Chat;
- wiederholten Fehlannahmen, Kontextverwechslungen oder regressiven Schleifen;
- wenn ein unabhängiger frischer Blick für Architektur, Audit oder Review sinnvoll ist.

Der Technical Lead darf auch innerhalb eines Moduls früher rotieren, wenn Kontextqualität, Review-Unabhängigkeit oder Effizienz dies rechtfertigen.

## 4. Verbindliche Namensführung

Jeder ChatGPT-/Technical-Lead-Chat muss bei jedem Cursor-Auftrag ausdrücklich angeben, ob:

- ein **bereits gespeicherter Agent** weiterverwendet wird, inklusive exaktem Anzeigenamen; oder
- ein **neuer Agent** gestartet werden soll.

Bei neuen Agenten bleibt der fachliche Basisname erhalten und erhält eine fortlaufende Nummer.

Beispiele:

- `Trip workspace audit architecture 1`
- `Trip workspace audit architecture 2`
- `Trip workspace audit architecture 3`

Entsprechend für die anderen Workstreams, zum Beispiel:

- `Account plattform audit vorbereitung 1`
- `Jetnity provider readiness audit 1`
- `Admin platform audit 1`
- `Jetnity growth discoverability 1`
- `Jetnity quality security audit 1`
- später `Jetnity native app architecture 1`

Die Nummer bezeichnet die Cursor-Agent-Session-Generation innerhalb desselben fachlichen Workstreams. Sie erzeugt **keinen neuen fachlichen Owner** und keine zweite Truth-Schicht.

## 5. Verantwortlichkeit des Technical Lead

ChatGPT / Technical Lead führt die Nummerierung workstreamweise fort und muss vor Vergabe eines Namens den aktuellen Repository-/Continuity-Stand prüfen.

Der Technical Lead dokumentiert bei Rotation mindestens:

- bisherigen Agentennamen;
- neuen Agentennamen;
- Grund der Rotation;
- aktuellen `main` / relevanten Merge-Checkpoint;
- zugehörigen Task/PR/Branch;
- welche alten Agenten nur noch historische Evidence sind;
- ob der neue Agent aktiv, wartend, blockiert oder reserviert ist.

Ein neuer ChatGPT-Chat darf die Nummer nicht aus Erinnerung erraten. Er rekonstruiert sie aus der Repository-Continuity und dem aktuellen Workstream-Status. Ist die nächste Nummer nicht eindeutig belegbar, muss er zuerst live prüfen und dann die nächste freie Nummer vergeben.

## 6. Handoff-Regel

Ein frischer Agent bekommt **nicht** einfach den gesamten alten Chat als Wahrheit.

Er startet aus:

1. `JETNITY_START_HERE.md`;
2. kanonischer Pflichtlektüre;
3. aktuellem `main` und Live-Evidence;
4. aktuellem Workstream-Task/Status/Handoff;
5. relevanten ADRs;
6. einem neuen versionierten Technical-Lead-Auftrag.

Historische Agenten-Chats bleiben Evidence, aber operative Wahrheit kommt aus Repository + Live-Systemen.

## 7. Unabhängige Reviews

Autor-Agent und unabhängiger Reviewer dürfen nicht als dieselbe unabhängige Instanz behandelt werden.

ChatGPT / Technical Lead führt weiterhin den finalen unabhängigen Review. Bei besonders riskanten Slices kann zusätzlich ein frischer Quality-/Security-Agent oder ein neuer fachlicher Agent für adversarial Review eingesetzt werden.

## 8. Aktuelle Übergangsregel für bestehende unnummerierte Agents

Die heute bereits gespeicherten unnummerierten Agenten bleiben gültig und werden **nicht rückwirkend umbenannt**.

Sie gelten als Generation 1 ihres Workstreams, solange sie für ihren aktuellen Slice weiterverwendet werden. Beim nächsten frischen Agenten desselben Workstreams wird die sichtbare Nummerierung fortgeführt, zum Beispiel:

- bestehend: `Trip workspace audit architecture`
- nächster frischer Agent: `Trip workspace audit architecture 2`

Dasselbe Prinzip gilt für alle bestehenden gespeicherten Workstreams.

## 9. Verbindlichkeit für neue ChatGPT-Chats

Jeder neue ChatGPT-/Technical-Lead-Chat muss diese Regel weiterführen. Bei jedem neuen Cursor-Prompt muss für den Product Owner klar und ausdrücklich stehen:

- **„Nimm den gespeicherten Agenten: <exakter Name>“**

oder

- **„Nimm einen neuen Agenten und nenne ihn: <exakter nummerierter Name>“**

Keine mehrdeutigen Formulierungen wie „nimm den Agenten“ ohne Namen.

Diese Regel gilt projektweit und dauerhaft, bis der Product Owner sie ausdrücklich ändert.