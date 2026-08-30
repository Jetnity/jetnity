# Jetnity – Product Differentiation Doctrine

Stand: 30. August 2026  
Status: **PRODUCT-OWNER-VERBINDLICH / CHATÜBERGREIFEND / AGENTENÜBERGREIFEND**

## 1. Verbindliche Produktentscheidung

Jetnity wird **nicht** als weiterer generischer Reiseplaner gebaut.

Der Markt besitzt bereits zahlreiche Produkte, die Reisepläne, Tagesabläufe, Karten, gemeinsame Planung, Buchungslinks oder generische Assistenten anbieten. Reine Feature-Parität in diesen Bereichen ist kein ausreichender Grund, eine Funktion zu priorisieren.

Der verbindliche strategische Anspruch lautet:

> **Jetnity soll etwas bauen, das andere Reiseplaner in dieser Kombination und Tiefe nicht haben: eine zusammenhängende Entscheidungs-, Wahrheits- und Reisebereitschaftsschicht für die konkrete Reise.**

Der Reiseplaner ist Bestandteil von Jetnity, aber nicht die alleinige Produktidentität.

## 2. Produkt-Nordstern

Arbeitsbegriff für die langfristige Produktarchitektur:

> **Jetnity = Travel Operating System für die konkrete Reise.**

Das bedeutet nicht, dass Jetnity jedes denkbare Reisefeature besitzen soll. Es bedeutet, dass Jetnity die relevanten Fakten einer Reise zusammenführt, ihre Abhängigkeiten versteht und daraus wenige, begründete und kontextbezogene Entscheidungen vorbereitet.

Jetnity soll zunehmend verstehen:

- **wer** reist;
- mit welchen **Traveller-Fakten**, Staatsbürgerschaften und Dokumenten;
- **wohin** und über welche geordnete Route gereist wird;
- **wann** die Reise und ihre Etappen stattfinden;
- welche Reisebestandteile bereits feststehen, ausgewählt, gebucht oder noch offen sind;
- welche belegten Anforderungen und Einschränkungen für die konkrete Person/Route gelten;
- welche kommerziellen Optionen tatsächlich verfügbar und vergleichbar sind;
- welche Auswirkungen eine Änderung auf den Rest der Reise hat;
- welche Option für die **Gesamtreise** sinnvoller ist, statt isoliert nur den niedrigsten Preis zu betrachten.

## 3. Drei verbindliche Produktpfeiler

### 3.1 Planen

Jetnity verwandelt natürliche Reiseabsicht in eine strukturierte, bearbeitbare, mehrstufige Reise.

Der Nutzer soll nicht gezwungen werden, technische Codes, interne IDs oder starre Formulare zu verstehen, wenn Jetnity die Absicht sicher und transparent auflösen kann.

### 3.2 Entscheiden

Jetnity soll nicht nur Optionen auflisten, sondern belegte Trade-offs der **Gesamtreise** verständlich machen.

Beispiele für spätere kontextuelle Faktoren:

- Preis;
- Reisezeit;
- Anzahl und Qualität von Umstiegen;
- Lage und tägliche Wege;
- Anschlussrisiken;
- zeitliche Konflikte;
- Komfort;
- bereits vorhandene Buchungen;
- Traveller-/Dokumentkontext;
- belegte offizielle Anforderungen;
- Auswirkungen auf andere Reisebestandteile.

Der billigste Einzelpreis ist nicht automatisch die beste Reiseentscheidung.

Empfehlungen müssen nachvollziehbar sein. Kommerzielle Provisionen dürfen die fachliche Empfehlung nicht verfälschen.

### 3.3 Reisebereit sein

Jetnity soll für eine konkrete Reise ehrlich erkennen können, was bereits belegt ist, was fehlt, was abläuft, was erneut geprüft werden muss und wo offizielle Evidenz noch nicht vorhanden ist.

Traveller-/Dokument-Wahrheit, Route, Termine, Requirements-Evidence und spätere Live-Reiseinformationen sollen zusammenarbeiten.

Ohne belastbare Quelle darf Jetnity keine Visa-, Einreise-, Transit-, Boarding- oder Dokument-Sufficiency erfinden.

## 4. Der Differenzierungs-Gate für jede neue Funktion

Vor Priorisierung eines neuen Produktfeatures muss der Technical Lead die Frage stellen:

> **„Macht das Jetnity einzigartiger oder nur größer?“**

Ein Feature wird nicht allein deshalb gebaut, weil ein Wettbewerber es besitzt.

Mindestens eine der folgenden Begründungen muss überzeugend vorliegen:

1. Es stärkt Jetnitys zusammenhängende Reise-Wahrheit oder nutzt sie auf eine Weise, die isolierte Reiseplaner nicht leisten.
2. Es verbessert die Qualität kontextabhängiger Entscheidungen für die gesamte Reise.
3. Es reduziert nachweisbar Wechsel zwischen mehreren Apps/Websites, Doppelarbeit oder Entscheidungsstress.
4. Es verstärkt einen schwer kopierbaren Jetnity-Vorteil, z. B. Traveller-/Multi-Citizenship-/Document-Kontext, Route/Transit, Requirements-Evidence, Commercial Truth, Change-Impact oder Provenance.
5. Es ist eine zwingende Enabler-, Security-, Privacy-, Reliability-, Accessibility-, Compliance- oder Operations-Voraussetzung für den differenzierten Produktkern.

Wenn keine dieser Begründungen trägt, wird das Feature grundsätzlich **nicht priorisiert**.

## 5. Feature-Parität ist kein Ziel

Jetnity führt keinen pauschalen Feature-Krieg gegen Lambus, Wanderlog, TripIt, Mindtrip, Layla oder andere Reiseprodukte.

Beispiele für Funktionen, die ohne stärkeren Jetnity-Zusammenhang keine hohe Priorität erhalten:

- generische Packlisten;
- Fotoalben;
- beliebige Social-Feeds;
- rein dekorative Reise-Tagebücher;
- ein Chatbot nur um einen Chatbot zu besitzen;
- weitere isolierte Suchmasken ohne Reisegraph-Kontext;
- Funktionen, deren Hauptbegründung „andere haben das auch“ ist.

Solche Funktionen dürfen später sinnvoll werden, wenn sie den Kern messbar unterstützen. Sie sind aber kein strategischer Nordstern.

## 6. Was schwer kopierbar werden soll

Jetnitys langfristiger Moat soll aus der **Kombination sauberer Truth-Schichten und ihrer Nutzung** entstehen, nicht aus einer einzelnen UI-Funktion.

Besonders wertvoll sind deshalb:

- Account Registry als wiederverwendbare aktuelle Traveller-Fakten;
- unabhängige Trip Snapshots als konkrete Reise-Wahrheit;
- mehrere gleichberechtigte Staatsbürgerschaften und mehrere Dokumente pro Traveller;
- keine willkürliche Default-/Primary-/First-Pass-Wahrheit;
- kontextabhängige Credential-/Requirements-Auswertung mit Evidence;
- Multi-Destination-/Transit-/Route-Wahrheit;
- Commercial Truth und Provenance;
- Vergleich von Preis **und** Zeit/Komfort/Reibung/Risiko im Gesamtreisekontext;
- Change-Impact über abhängige Reisebestandteile;
- ehrliche Unterscheidung zwischen Nutzerangabe, abgeleiteter Information, Provider-Fakt und offizieller Evidenz;
- ein Workspace, der nächste sinnvolle Entscheidungen aus dem realen Zustand der Reise ableitet.

Diese Fähigkeiten sollen miteinander verbunden werden. Eine Sammlung unabhängiger Features erzeugt diesen Vorteil nicht.

## 7. Kein falscher Anspruch auf Einzigartigkeit

„Etwas bauen, was andere nicht haben“ bedeutet **nicht**, ungeprüft zu behaupten, eine einzelne Funktion sei weltweit einzigartig.

Vor strategischen Markt-/Differenzierungsentscheidungen wird aktuelle Wettbewerbs-Evidence geprüft.

Jetnitys Differenzierung darf auch in einer bislang ungewöhnlich guten **Kombination, Tiefe, Truth-Architektur und Ausführung** liegen.

Marketing darf keine unbelegten „einzigartig“, „weltweit erstmals“ oder vergleichbaren Claims verwenden.

## 8. Intelligenz ist Produktverhalten, kein Selbstzweck

Jetnity wird nicht dadurch besser, dass überall „KI“ oder ein Chatfenster erscheint.

Intelligenz soll sichtbar werden, indem Jetnity:

- vorhandenen Kontext wiederverwendet;
- Zusammenhänge erkennt;
- Widersprüche und Lücken aufdeckt;
- Auswirkungen einer Änderung versteht;
- wenige gute Optionen statt Option-Overload zeigt;
- Empfehlungen begründet;
- Unsicherheit und fehlende Evidenz ehrlich kennzeichnet;
- dem Nutzer konkrete Arbeit abnimmt, ohne wichtige Entscheidungen still zu übernehmen.

## 9. Beziehung zu Build Order, Security und Produktqualität

Diese Doctrine ist ein **Priorisierungs- und Produktdesign-Gate**, kein Freibrief für ungeplanten Scope.

Sie überschreibt nicht:

- `docs/JETNITY_BINDING_BUILD_ORDER.md`;
- besondere Product-Owner-Gates;
- Security-/Privacy-/RLS-/Ownership-Regeln;
- Commercial-Truth-/Provider-Gates;
- Continuity-/Exact-Head-/Review-Governance;
- das USD-100/Monat-Kostenlimit;
- Accessibility-/Quality-Anforderungen.

Ein Security-, Privacy-, Reliability-, Accessibility- oder Compliance-Slice kann höchste Priorität haben, obwohl er für Nutzer nicht sichtbar differenziert. Solche Arbeit schützt die Fähigkeit, das differenzierte Produkt verantwortbar zu betreiben.

## 10. Verbindliche Anwendung durch Technical Lead und Agents

Für jeden neuen größeren Product-/Runtime-Slice muss der Technical Lead künftig zusätzlich dokumentieren:

- **Differentiation Impact:** Welchen Jetnity-Vorteil stärkt der Slice?
- oder **Enabler Justification:** Warum ist der Slice technisch, sicherheits-, privacy-, quality- oder compliance-seitig notwendig?

Cursor-/Coding-Agenten dürfen den Scope nicht eigenmächtig mit Wettbewerber-Paritätsfeatures erweitern.

Wenn ein Agent eine wichtige neue Produktidee erkennt, soll er sie als Vorschlag an den Technical Lead melden, aber nicht ungefragt implementieren.

## 11. Produktentscheidungs-Satz

Die folgende Kurzform ist chat- und agentenübergreifend verbindlich:

> **Jetnity wird nicht gebaut, um der Reiseplaner mit den meisten Funktionen zu sein. Jetnity wird gebaut, um die konkrete Reise besser zu verstehen als gewöhnliche Reiseplaner und daraus belegte, kontextbezogene Entscheidungen und Reisebereitschaft abzuleiten. Bei jedem Feature gilt: Macht es Jetnity einzigartiger oder nur größer?**
