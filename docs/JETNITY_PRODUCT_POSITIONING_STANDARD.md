# Jetnity – verbindliche Produktpositionierung

Stand: 25. August 2026  
Status: **verbindliche Product-Owner-Vorgabe**

## 1. Kernziel

Jetnity soll nicht der Reiseplaner mit den meisten sichtbaren Funktionen werden, sondern der Reiseplaner, bei dem Nutzer **am wenigsten selbst zusammensuchen, vergleichen, koordinieren und nachdenken müssen**.

Die Komplexität von Flights, Hotels, Activities, Mobility, Route, Readiness, Safety, Seasonal, Traveller Context, Dokumentenwahl, Preisvergleich und späteren Provider-Systemen bleibt soweit möglich intern. Für den Nutzer erscheint daraus **eine Reise, eine verständliche Oberfläche und eine klare nächste Aktion**.

## 2. Produktversprechen

Jetnity soll eine Reise vom ersten Wunsch bis zur Durchführung möglichst umfassend unterstützen:

- Inspiration und Zielwahl
- Reiseplanung und Tages-/Etappenstruktur
- ehrlicher Preis- und Leistungsvergleich, sobald echte Provider-Evidence vorhanden ist
- Einreise-/Transit-/Dokumentkontext auf Basis belegter Quellen
- mehrere Reisende, mehrere Staatsbürgerschaften und mehrere Reisedokumente ohne impliziten Standard-Pass
- Route, Unterkunft, Flug, Aktivitäten und Mobilität als Teile derselben Reise
- Readiness, Safety und Seasonal/Timing ohne erfundene Hard Truth
- Änderungen, Hinweise und relevante nächste Schritte während der Reise
- später Reisehistorie/Reisebuch und wiederverwendbarer Reisekontext

Jetnity soll nicht nur Inhalte anzeigen, sondern vorhandene belastbare Daten **sinnvoll zusammenführen, priorisieren und erklären**.

## 3. Differenzierungsprinzip

Ein Nutzer soll Jetnity beispielsweise mit einem komplexen Wunsch ansprechen können – Budget, Zeitraum, mehrere mögliche Ziele, Präferenzen, mehrere Staatsbürgerschaften/Dokumente, gewünschte Flugzeit, Wetter/Saison und Einreisebedingungen – und Jetnity soll daraus schrittweise eine belastbare Reise aufbauen.

Dabei gilt:

- LLM/Assistant darf erklären, strukturieren und priorisieren, aber keine regulatorische, Safety-, Preis-, Verfügbarkeits-, Provider- oder Route-Hard-Truth erfinden.
- Wenn ein vorhandenes zulässiges Dokument einen besseren Einreise-/Transitweg ermöglicht, muss die Architektur diese Option berücksichtigen können.
- `unknown`, `stale`, `error`, `unavailable`, `noch_nicht_geprueft` und `nichts_dringend_geprueft` bleiben getrennte Zustände.
- Mehr sichtbare Features sind kein Qualitätsziel. Weniger Reibung, weniger manuelle Recherche, bessere Entscheidungen und höhere Vertrauenswürdigkeit sind das Qualitätsziel.

## 4. UX-Leitsatz

> **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

Der Nutzer soll die internen Fachdomänen nicht als lose Sammlung von Apps erleben. Mobile und Desktop dürfen unterschiedlich viel Fläche nutzen, aber keine unterschiedlichen Produktlogiken besitzen.

## 5. Wettbewerbsregel

Jetnity wird nicht dadurch bewertet, ob es eine lange Featureliste gegen einzelne Reiseplaner gewinnt. Entscheidend ist, ob Jetnity den gesamten Reiseprozess **einfacher, vertrauenswürdiger und zeitsparender** macht.

Für jede neue Funktion muss deshalb geprüft werden:

1. Reduziert sie echte Nutzerarbeit oder Unsicherheit?
2. Nutzt sie vorhandene Wahrheit korrekt oder erzeugt sie neue belastbare Evidence?
3. Passt sie in die eine Reiseoberfläche, ohne Feature-Wand zu erzeugen?
4. Ist sie besser integriert als eine isolierte Einzelfunktion?
5. Unterstützt sie das Ziel, dass der Nutzer weniger selbst recherchieren und vergleichen muss?

Wenn diese Fragen überwiegend mit Nein beantwortet werden, ist die Funktion nicht automatisch sinnvoll, auch wenn Wettbewerber sie anbieten.

## 6. Monetarisierung

Ein Abosystem gehört grundsätzlich zur Produktstrategie. Die Architektur muss Free/monatlich/jährlich sowie eine optionale Lifetime-/Founder-Lifetime-Variante unterstützen können. Konkrete Preise, Testdauer, Limits und Entitlements werden später als eigene Product-Owner-Entscheidung festgelegt und dürfen heute nicht als harte Produktannahmen eincodiert werden.

## 7. Verbindlichkeit

Diese Positionierung ist für Product, UX, Architektur, technische Reviews, Agentenaufträge und spätere Priorisierung verbindlich. Sie darf nicht still durch eine reine Feature-Maximierungsstrategie ersetzt werden.
