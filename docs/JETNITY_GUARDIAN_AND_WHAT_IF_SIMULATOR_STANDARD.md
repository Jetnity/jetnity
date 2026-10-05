# Jetnity – Guardian / Reise-Autopilot & What-if-Reise-Simulator

Stand: 25. August 2026  
Status: **Product-Owner-verbindliche Produkt- und Architekturvorgabe**

## 1. Verbindliche Entscheidung

Jetnity muss zwei zusätzliche Kernfunktionen vollständig bauen:

1. **Jetnity Guardian / Reise-Autopilot** – erkennt relevante Änderungen oder Probleme, versteht deren Auswirkungen auf die gesamte Reise und führt den Nutzer zu einer belastbaren nächsten Entscheidung.
2. **Jetnity What-if-Reise-Simulator** – erlaubt Änderungen an einer Reise zunächst in einer sicheren Simulation und zeigt die Auswirkungen, bevor die reale Reise verändert wird.

Diese Funktionen sind keine optionalen Ideen und dürfen von späteren Chats, Technical Leads oder Coding Agents nicht still aus dem Produktplan entfernt oder zu bloßen Chat-/LLM-Features reduziert werden.

Leitsatz:

> **Jetnity soll nicht nur wissen, was in einer Reise steht. Jetnity soll verstehen, was eine Änderung für die restliche Reise bedeutet – und Änderungen sicher simulieren können, bevor der Nutzer sie übernimmt.**

Beide Funktionen müssen dem allgemeinen Jetnity-Prinzip folgen:

> **Eine Reise, eine Wahrheit. Komplexität intern, Klarheit für den Nutzer.**

---

## 2. Jetnity Guardian / Reise-Autopilot

### 2.1 Produktziel

Guardian ist die cross-domain Intelligence-Schicht über der kanonischen Reise. Er darf keine zweite Reise-Wahrheit erzeugen.

Wenn sich ein relevanter Fakt ändert oder ein Problem erkannt wird, soll Guardian – soweit belastbare Daten vorhanden sind – nicht nur die isolierte Meldung anzeigen, sondern die **Auswirkungen auf abhängige Teile der Reise** bewerten.

Beispiele:

- Flugverspätung → Anschluss, Transfer, Hotel-Check-in, Aktivität und Tagesplan prüfen.
- Flugausfall → erreichbare Alternativen, Zeitverlust, Mehrkosten und betroffene Buchungen gegenüberstellen.
- Streik / Safety-Ereignis → betroffene Etappen und Alternativen bestimmen.
- Wetter-/Seasonal-Veränderung → nur dort reagieren, wo vorhandene belegte Daten eine Aussage erlauben.
- Einreise-/Transit-Anforderung → je Traveller alle relevanten Staatsbürgerschaften und zulässigen Dokumentoptionen prüfen; niemals implizit einen Standard-Pass wählen.
- Zeit-/Routenänderung → nachgelagerte Reservierungen oder Aktivitäten auf Konflikte prüfen.

### 2.2 Guardian-Ausgabe

Eine Guardian-Empfehlung soll – wenn verfügbar – kompakt beantworten:

1. **Was hat sich geändert?**
2. **Was ist davon betroffen?**
3. **Wie dringend ist es?**
4. **Welche belastbaren Optionen gibt es?**
5. **Was sind Preis-, Zeit-, Komfort- und Risiko-Unterschiede?**
6. **Was empfiehlt Jetnity und warum?**
7. **Welche Information ist unbekannt, stale oder aktuell nicht prüfbar?**

Die Oberfläche darf niemals mehr Sicherheit vortäuschen, als die Evidence trägt.

### 2.3 Architekturregeln

Guardian muss:

- den bestehenden kanonischen Reisegraphen und die vorhandenen Fachdomänen verwenden;
- Auswirkungen **ableiten**, nicht als zweite Wahrheit persistieren;
- Evidence, Authority, Freshness und Source/Provider-Provenance erhalten;
- `unknown`, `stale`, `error`, `unavailable`, `insufficient_context`, `noch_nicht_geprueft` und bestätigte unauffällige Zustände getrennt behandeln;
- Cross-Domain-Abhängigkeiten explizit modellieren, statt sie nur durch LLM-Text zu erraten;
- möglichst deterministische/rule-based oder provider-backed Berechnungen für Hard Truth verwenden;
- LLM/Assistant nur für Erklärung, Zusammenfassung, Priorisierung und Dialog einsetzen – niemals als Quelle für Preis, Verfügbarkeit, Visa, Safety, Route oder andere Hard Truth;
- Guest/Account bei identischem Reisegraphen fachlich identisch bewerten;
- Mobile/Tablet/Desktop dieselbe Produktlogik bieten;
- multi-traveller, multi-citizenship und multi-document von Anfang an korrekt unterstützen.

### 2.4 Keine stillen Reiseänderungen

Guardian darf standardmäßig **keine kanonische Reise, Buchung, Zahlung oder Provideraktion still verändern**.

Er darf Vorschläge und vorbereitete Änderungen erzeugen. Eine reale Änderung muss über einen kontrollierten Command-/Apply-Pfad mit:

- expliziter Nutzeraktion;
- Ownership-/RLS-/Auth-Prüfung;
- aktueller Version / Conflict Detection;
- Validierung aller betroffenen Shared Contracts;
- klarer Änderungszusammenfassung

erfolgen.

Automatische reale Änderungen dürfen später nur als gesondert freigegebene, eng begrenzte Opt-in-Funktion eingeführt werden.

---

## 3. Jetnity What-if-Reise-Simulator

### 3.1 Produktziel

Der Simulator beantwortet Fragen wie:

- „Was passiert, wenn wir einen Tag später fliegen?“
- „Was passiert, wenn wir Kyoto vor Osaka besuchen?“
- „Was passiert, wenn wir drei Tage länger bleiben?“
- „Was ändert sich, wenn wir Direktflug statt Umstieg wählen?“
- „Was passiert mit Budget und Reisezeit, wenn wir dieses Hotel nehmen?“
- „Welche Teile der Reise werden kritisch, wenn sich diese Etappe verschiebt?“

Der Nutzer soll die Konsequenzen **vor einer echten Änderung** verstehen.

### 3.2 Sandbox-Prinzip

Eine Simulation darf die kanonische Reise niemals während des Vergleichs verändern.

Technisch muss sie auf einem isolierten **Proposal-/Sandbox-/Scenario-State** arbeiten, der vom aktuellen kanonischen Reise-Snapshot abgeleitet wird.

Pflicht:

- Baseline bleibt unverändert.
- Scenario erhält explizite Änderungen.
- Betroffene Ableitungen werden neu berechnet.
- Baseline und Scenario werden als Delta verglichen.
- Erst ein ausdrückliches **„Übernehmen“** darf über den normalen kontrollierten Write-/Command-Pfad reale Änderungen auslösen.

Kein Simulator-Code darf direkte versteckte Writes in `trips`, `trip_items`, Traveller-, Route-, Booking- oder Provider-Wahrheiten durchführen.

### 3.3 Was der Simulator vergleichen soll

Sobald die jeweilige Evidence verfügbar ist, soll er unter anderem Veränderungen zeigen bei:

- Gesamtreisezeit;
- Fahrt-/Flug-/Transferzeit;
- Anzahl/Qualität von Umstiegen;
- Route und Reihenfolge;
- Aufenthaltsdauer und Nächte;
- Plan-/Aktivitätskonflikten;
- Unterkunfts- und Transport-Coverage;
- Budget / Gesamtpreis / Preisdelta;
- Preis vs. Zeit / Komfort / Gesamtnutzen;
- Safety-/Disruption-Relevanz;
- Seasonal-/Timing-Relevanz;
- Readiness-/Einreise-/Transit-Auswirkungen;
- Traveller-/Citizenship-/Document-Kontext;
- bestehenden Buchungen oder Reservierungen, die durch die Änderung gefährdet würden.

Wenn eine Dimension nicht belastbar berechenbar ist, wird sie **nicht erfunden**, sondern als unbekannt / nicht prüfbar / nicht verfügbar gekennzeichnet.

### 3.4 Explainable Delta

Das Ergebnis soll nicht nur Zahlen zeigen, sondern die Ursache verständlich machen, z. B.:

> „CHF 55 mehr, dafür 5 Stunden weniger Gesamtreisezeit und ein Umstieg weniger.“

oder:

> „Diese Variante verschiebt die Ankunft hinter den bestehenden Hotel-Check-in und erzeugt einen Konflikt mit Aktivität X.“

Jede Aussage muss aus vorhandener fachlicher Evidence ableitbar sein.

---

## 4. Gemeinsame Intelligence-Bausteine

Guardian, What-if-Simulator und der geplante Value Optimizer dürfen **keine drei voneinander abweichenden Berechnungswelten** entwickeln.

Wo fachlich identisch, müssen sie gemeinsame kanonische Komponenten wiederverwenden für:

- Reise-/Route-Abhängigkeiten;
- Coverage;
- Zeit-/Dauerberechnung;
- Commercial Value / Preis-vs-Zeit-vs-Komfort;
- Traveller-/Citizenship-/Document-Evaluation;
- Readiness;
- Safety/Disruption;
- Seasonal/Timing;
- Evidence/Freshness/Authority/Provenance;
- Konflikt- und Impact-Erkennung.

Unterschied:

- **Guardian** bewertet reale aktuelle Reise + reale neue Evidence.
- **Simulator** bewertet eine hypothetische Änderung gegen eine unveränderte Baseline.
- **Value Optimizer** vergleicht belastbare kommerzielle Alternativen.

Die drei Funktionen sollen sich gegenseitig ergänzen, nicht widersprechen.

---

## 5. UX-Regeln

Die Funktionen dürfen Jetnity nicht in ein Experten-Dashboard verwandeln.

### Guardian

Primär in `Jetzt wichtig` / relevanten Workspace-Kontext integrieren. Nur relevante Auswirkungen zeigen; Details progressiv öffnen.

### Simulator

Als klar erkennbarer **Vorschau-/Simulation-Modus**. Der Nutzer muss jederzeit sehen:

- was aktuell real ist;
- was nur simuliert wird;
- welche Änderungen angenommen wurden;
- welche Auswirkungen sicher, wahrscheinlich, unknown oder nicht prüfbar sind;
- ob „Übernehmen“ reale Änderungen erzeugen würde.

Mobile und Desktop müssen dieselbe fachliche Kontrolle erlauben.

---

## 6. Security, Privacy und Safety

Beide Funktionen unterliegen vollständig dem Jetnity Engineering Excellence Standard.

Zusätzlich zwingend:

- keine unerlaubte cross-user / cross-trip Datenvermischung;
- RLS/Ownership bei jedem realen Apply-/Write-Pfad;
- keine sensiblen Dokumentdaten in Logs/Analytics/LLM-Prompts, sofern nicht ausdrücklich erlaubt und erforderlich;
- keine Passnummern, MRZ, Scans oder Biometrie nur für diese Funktionen neu einführen;
- keine automatische Weitergabe sensibler Traveller-Daten an Provider;
- provider-/LLM-Ausfälle fail-closed behandeln;
- stale Evidence darf nicht wie aktuelle Evidence aussehen;
- keine reale Buchung, Zahlung oder Stornierung ohne expliziten dafür vorgesehenen Flow und jeweilige besondere Gates.

---

## 7. Provider- und Kostenregeln

Die Funktionen dürfen bereits provider-neutral architektonisch vorbereitet und mit vorhandener belastbarer Evidence gebaut werden.

Echte Providerdaten dürfen erst verwendet werden, wenn der jeweilige Provider gemäß Provider-Readiness, Verträgen, Secrets, Lizenz/Privacy, Kosten und Production-Gates freigegeben ist.

Vorher gilt insbesondere:

- keine Fake-Preise;
- keine Fake-Verfügbarkeit;
- keine erfundenen Alternativflüge;
- keine erfundenen Live-Disruption-Daten;
- keine simulierte „Live“-Provider-Evidence.

Paid Calls und neue laufende Kosten unterliegen den bestehenden Product-Owner-Gates.

---

## 8. Implementierungsreihenfolge

Diese beiden Funktionen sind verbindlich, werden aber **nicht in den aktuell laufenden TW-2-Slice hineingezogen**.

Große Reihenfolge:

1. aktuellen Trip-Workspace-Plan sauber fertigbauen;
2. Traveller-/Account-/Provider-/Admin-Grundlagen gemäß verbindlicher Build-Reihenfolge vervollständigen;
3. Commercial-/Value-Bausteine mit echter Evidence bereitstellen;
4. Guardian und What-if-Simulator als eigenes kontrolliertes Programm vollständig integrieren;
5. danach finaler cross-domain Production-/Launch-Hardening-Audit.

Technische Hooks oder gemeinsame reine Domain-Bausteine dürfen früher vorbereitet werden, wenn sie ohnehin für einen aktuellen Slice nötig sind und keinen Scope-Creep erzeugen. Es darf jedoch kein Monster-PR entstehen und kein laufender priorisierter Block verdrängt werden.

---

## 9. Pflicht-Acceptance für Guardian

Guardian ist erst fachlich fertig, wenn mindestens reale Testfälle für folgende Klassen abgedeckt sind:

- isolierte Änderung ohne Cross-Domain-Auswirkung;
- Änderung mit einer Folgeabhängigkeit;
- Änderung mit mehreren Folgeabhängigkeiten;
- widersprüchliche Evidence;
- stale Evidence;
- Provider-/Domain-Timeout;
- unknown / insufficient traveller context;
- mehrere Traveller mit unterschiedlichen Citizenship-/Document-Optionen;
- Guest/Account-Parität;
- Mobile/Tablet/Desktop-Parität;
- Vorschlag ohne stillen Write;
- Apply-Flow mit Ownership/Conflict Detection;
- Regression gegen bestehende Workspace-/Account-/Provider-Truth.

---

## 10. Pflicht-Acceptance für Simulator

Der Simulator ist erst fachlich fertig, wenn mindestens nachgewiesen ist:

- Baseline bleibt bei Simulation byte-/semantik-equivalent unverändert;
- ein Scenario kann verworfen werden, ohne reale Daten zu verändern;
- mehrere Änderungen in einem Scenario werden deterministisch verarbeitet;
- Delta-Berechnung ist korrekt;
- unknown/stale/unavailable werden nicht als Null oder „kein Problem“ interpretiert;
- mehrere Traveller/Citizenships/Documents bleiben korrekt;
- bestehende Reservierungs-/Plan-Konflikte werden nicht fälschlich der Simulation zugerechnet;
- neu erzeugte Konflikte werden nachvollziehbar erklärt;
- Apply verwendet denselben kontrollierten kanonischen Write-Pfad wie normale Reiseänderungen;
- Concurrent-Edit/Version-Konflikte verhindern blindes Überschreiben;
- Mobile/Tablet/Desktop-Parität;
- vollständige Unit-/Integration-/E2E-/Regression-Gates sowie unabhängiger Technical-Lead-Review.

---

## 11. Definition of Done

Weder Guardian noch Simulator sind „fertig“, nur weil ein Chatfenster passende Texte erzeugt.

Fertig bedeutet:

- fachliche Domain-Logik implementiert;
- klare Source-of-Truth-Grenzen;
- belastbare Evidence-/Freshness-/Authority-Behandlung;
- sicherer Datenfluss;
- vollständige relevante Tests und reale sequentielle Szenarien;
- professionelle UX auf allen Zielgeräten;
- Accessibility und Performance;
- keine versteckten Fake-/Demo-Wahrheiten;
- keine stillen kanonischen Writes;
- unabhängiger Technical-Lead-Review;
- CI/Vercel/Provider-/Production-Evidence entsprechend dem jeweiligen Integrationsstand;
- Dokumentation/Handoff aktualisiert.

---

## 12. Verbindlichkeit für neue Chats und Agenten

Jeder neue Chat, Technical Lead und relevante Coding Agent muss diese Datei vor Produkt-/Architektur-/Implementierungsentscheidungen zu Guardian, Simulator, Value Optimizer, Workspace-Attention oder Cross-Domain-Reiseintelligenz lesen.

Bei Konflikt mit älteren Handoffs gilt diese neuere ausdrückliche Product-Owner-Entscheidung, sofern keine noch neuere ausdrückliche Product-Owner-Entscheidung sie ersetzt.
