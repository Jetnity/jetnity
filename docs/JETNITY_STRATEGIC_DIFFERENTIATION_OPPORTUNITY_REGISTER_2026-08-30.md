# Jetnity – Strategic Differentiation Opportunity Register

Stand: 30. August 2026  
Status: **PRODUCT-OWNER-VERBINDLICH ALS STRATEGISCHES REGISTER / KEINE AUTOMATISCHE BAUFREIGABE**

## 1. Zweck

Dieses Dokument bewahrt strategisch wertvolle Produktideen dauerhaft chat- und agentenübergreifend auf.

Es ist **kein Backlog, das automatisch abgearbeitet wird**. Jede Idee braucht vor Umsetzung weiterhin:

- einen frischen Binding Slice Precheck;
- Abgleich mit `docs/JETNITY_BINDING_BUILD_ORDER.md`;
- aktuellen Wettbewerbscheck;
- Differentiation Impact;
- Architektur-/Truth-/Security-/Privacy-Prüfung;
- einen bounded Slice mit eigenem Review- und Exact-Head-Gate.

Verbindliche Leitfrage aus der Product Differentiation Doctrine:

> **Macht das Jetnity einzigartiger oder nur größer?**

Die hier gespeicherten Ideen wurden aufgenommen, weil sie einen konkreten Nutzwert besitzen und Jetnitys zusammenhängende Reise-Wahrheit sinnvoll nutzen können.

## 2. Strategische Prioritätsgruppe A

### OP-01 – Jetnity Trip Audit / Journey Integrity Audit

**Nutzerproblem:** Viele Reisende haben ihre Reise bereits teilweise über mehrere Anbieter gebucht. Sie wissen nicht zuverlässig, ob die Gesamtreise vollständig und widerspruchsfrei ist.

**Produktidee:** Jetnity kann eine bestehende oder teilweise bestehende Reise als Ganzes prüfen und verständlich zeigen, was fehlt, kollidiert oder riskant ist.

Mögliche spätere Prüfpunkte:

- fehlende Hotelnacht zwischen zwei Etappen;
- Flugankunft und Check-in/Transfer passen zeitlich nicht;
- unrealistische Verbindung zwischen getrennt gebuchten Segmenten;
- fehlender Transfer;
- doppelte oder kollidierende Aktivitäten;
- Dokument läuft vor oder während der Reise ab;
- offene Reiseabschnitte ohne Unterkunft oder Transport;
- bekannte Buchung steht im Widerspruch zum Trip Graph.

**Direkter Mehrwert:** Der Nutzer muss seine bereits gebuchte Reise nicht neu planen, sondern bekommt schnell eine Antwort auf: **„Funktioniert meine gesamte Reise wirklich?“**

**Strategischer Wert:** Kann ein eigenständiger Einstieg in Jetnity werden, auch für Nutzer, die ihre Reise nicht mit Jetnity begonnen haben.

**Voraussetzungen:** belastbare Trip-/Traveller-/Route-/Booking-Truth; später sichere Importwege für Buchungsbestätigungen/E-Mails/PDFs nur nach eigener Privacy-/Security-Freigabe.

**Nicht verwechseln mit:** generischem Dokument-Upload oder reinem Reservierungsordner.

**Status:** STRATEGISCHER KANDIDAT / NICHT AUTOMATISCH STARTEN.

---

### OP-02 – Change Impact & Recovery Engine

**Nutzerproblem:** Eine Änderung an einem Flug, Hotel oder anderen Bestandteil kann mehrere weitere Teile der Reise beschädigen. Heute muss der Reisende die Folgen meist selbst zusammensuchen.

**Produktidee:** Jetnity bestimmt bei einer Änderung die Auswirkungen auf die gesamte Reise und bereitet wenige konkrete Recovery-Optionen vor.

Beispiel:

> Flug kommt 23 Stunden später an → betroffene Hotelnacht, Transfer, Aktivität, Mietwagen und Anschluss werden identifiziert → Jetnity zeigt Lösung A/B samt Kosten-, Zeit- und Komfortauswirkung → Nutzer entscheidet.

**Direkter Mehrwert:** Weniger Stress, weniger manuelle Neuplanung, geringeres Risiko, eine abhängige Buchung zu vergessen.

**Strategischer Wert:** Nutzt den Reisegraphen als echtes System statt als statischen Tagesplan.

**Voraussetzungen:** saubere Dependency-/Trip-Graph-Wahrheit, Commercial Truth, später Live-Change-Evidence von Providern.

**Harte Regel:** Keine externe Änderung darf still andere Reiseelemente verändern. Erst analysieren und erklären, dann Nutzerfreigabe.

**Status:** STRATEGISCHER KANDIDAT / HOHE LANGFRISTIGE PRIORITÄT / NICHT AUTOMATISCH STARTEN.

---

### OP-03 – Multi-Citizenship / Entry Decision Engine

**Nutzerproblem:** Reisende mit mehreren Staatsbürgerschaften oder Dokumenten müssen selbst herausfinden, ob sich Einreise-, Visa-, Transit- oder Aufenthaltsbedingungen unterscheiden.

**Produktidee:** Jetnity bewertet für die konkrete Route und den konkreten Traveller mehrere vorhandene Credentials separat auf Basis belastbarer offizieller Evidenz und zeigt Unterschiede verständlich an.

Mögliche spätere Aussagen:

- beide Dokumente führen zur gleichen belegten Anforderung;
- für eine Etappe unterscheiden sich belegte Anforderungen;
- Transit benötigt eine separate Prüfung;
- ein Dokument läuft vor der relevanten Etappe ab;
- Bearbeitungszeit oder belegte Kosten unterscheiden sich.

**Direkter Mehrwert:** Der Nutzer muss komplexe Regeln nicht manuell pro Pass, Land und Transit kombinieren.

**Strategischer Wert:** Besonders starker Jetnity-Vorteil durch das bereits verbindliche Modell `1 Traveller → mehrere Citizenship(s) → mehrere Documents`.

**Voraussetzungen:** echter Requirements Provider bzw. belastbare offizielle Sources, Provenance, Freshness und klare Unsicherheitsdarstellung.

**Harte Regeln:** Kein Default-/Primary-/Best-Pass aus Gewohnheit. Keine Visa-/Entry-/Boarding-Behauptung ohne belastbare Evidenz. Issuer Country != Citizenship.

**Status:** STRATEGISCHER KANDIDAT / HOHE PRIORITÄT NACH REQUIREMENTS-EVIDENCE / NICHT AUTOMATISCH STARTEN.

## 3. Strategische Prioritätsgruppe B

### OP-04 – True Trip Cost / Gesamtreisekosten statt Einzelpreis

**Nutzerproblem:** Der billigste Flug oder das billigste Hotel ist häufig nicht die günstigste oder sinnvollste Gesamtreise.

**Produktidee:** Jetnity vergleicht belegte Gesamtfolgen einer Option, z. B.:

- Basispreis;
- Gepäck und belegbare Zusatzkosten;
- Transfers;
- zusätzliche Hotelnacht wegen Flugzeiten;
- Flughafenwechsel;
- belegte Visa-/Einreisekosten, wenn verlässlich verfügbar;
- lokale Wege;
- Zeitverlust als separate Dimension.

Beispiel:

> Option B kostet CHF 55 mehr, spart aber 6 h 40 min Reisezeit und vermeidet einen Flughafenwechsel.

**Direkter Mehrwert:** Bessere Entscheidungen als ein einfacher „billigster Preis“-Vergleich.

**Strategischer Wert:** Verbindet Commercial Truth mit Trip Context und Nutzerzeit.

**Voraussetzungen:** echte Providerpreise, Provenance, sauber modellierte Extras und keine erfundenen Kosten.

**Status:** STRATEGISCHER KANDIDAT / PROVIDER- UND COMMERCIAL-TRUTH-ABHÄNGIG.

---

### OP-05 – Route & Connection Feasibility

**Nutzerproblem:** Einzelne Reisebausteine können jeweils korrekt aussehen, aber in Kombination unrealistisch oder riskant sein.

**Produktidee:** Jetnity prüft die praktische Durchführbarkeit von Übergängen und Verbindungen im Gesamtroutenkontext.

Mögliche spätere Faktoren:

- separate Tickets / Self-Transfer;
- Gepäck neu aufgeben;
- Terminal- oder Flughafenwechsel;
- Immigration-/Transitbedarf;
- knappe Anschlusszeit;
- Nachtankunft ohne realistischen Weitertransport;
- Fähre/Zug/Bus fährt vor der geplanten Ankunft;
- Grenzübergänge und Etappenfolge.

**Direkter Mehrwert:** Weniger fehlgeschlagene oder extrem stressige Verbindungen.

**Strategischer Wert:** Besonders wertvoll für Multi-Destination-Reisen, bei denen isolierte Suchmaschinen die Gesamtkette nicht verstehen.

**Harte Regel:** Jetnity unterscheidet belegte Fakten, berechnete Puffer und unbekannte Faktoren. Unsicherheit wird nicht als Sicherheit verkauft.

**Status:** STRATEGISCHER KANDIDAT / ROUTE-, TRANSIT- UND PROVIDER-EVIDENCE-ABHÄNGIG.

---

### OP-06 – What-if Simulator / Änderungen gefahrlos simulieren

**Nutzerproblem:** Reisende möchten eine Reiseoption ausprobieren, ohne bestehende Planung oder Buchungen sofort zu verändern.

**Produktidee:** Nutzer kann fragen: „Was passiert, wenn wir einen Tag später fliegen?“ oder „Was, wenn wir Bangkok um zwei Nächte verkürzen?“ Jetnity simuliert die Folgen, ohne Current Truth zu überschreiben.

Mögliche Ausgabe:

- welche Reiseelemente bleiben unverändert;
- welche kollidieren;
- welche Kosten/Zeiten ändern sich;
- welche Elemente neu gewählt werden müssten;
- Vorher/Nachher-Vergleich.

**Direkter Mehrwert:** Sichere Entscheidungsfindung ohne Trial-and-Error im echten Reiseplan.

**Strategischer Wert:** Natürliche Erweiterung der Change-Impact-Engine.

**Voraussetzungen:** stabile Simulation-/Proposal-Schicht getrennt von Current Truth; keine stillen Writes.

**Status:** STRATEGISCHER KANDIDAT / NACH CHANGE-IMPACT-GRUNDLAGE.

---

### OP-07 – Next Best Action / „Was muss ich jetzt wirklich tun?“

**Nutzerproblem:** Reise-Apps zeigen viele Kacheln, Listen und Statuswerte, aber lassen den Nutzer selbst entscheiden, was tatsächlich dringend oder wichtig ist.

**Produktidee:** Jetnity leitet aus der realen Reise-Wahrheit wenige nächste sinnvolle Aktionen ab.

Beispiele:

- Dokument von Traveller 2 läuft während der Reise ab;
- für Etappe 3 fehlt noch Unterkunft;
- kostenlose Stornierungsfrist endet bald;
- Anschluss ist wegen einer bestätigten Flugänderung betroffen;
- eine offizielle Requirement-Evidence ist stale und muss erneut geprüft werden.

**Direkter Mehrwert:** Nutzer öffnet Jetnity und versteht sofort, worum er sich als Nächstes kümmern sollte.

**Strategischer Wert:** Macht aus Account/Workspace ein entscheidungsorientiertes System statt ein passives Dashboard.

**Voraussetzungen:** belastbare Truth-/Currentness-/Deadline-/Attention-Modelle. Keine erfundenen Dringlichkeiten und keine Dark Patterns.

**Status:** STRATEGISCHER KANDIDAT / STUFENWEISE AUF BESTEHENDER ATTENTION-ARCHITEKTUR.

## 4. Strategische Kombination

Besonders stark ist nicht eine einzelne Funktion, sondern die Kombination:

> **Trip Audit → Change Impact / Recovery → Multi-Citizenship / Requirements → True Trip Cost → Route Feasibility → What-if → Next Best Action.**

Damit könnte Jetnity langfristig eine Reise nicht nur erstellen, sondern:

> **verstehen → prüfen → vergleichen → vorbereiten → simulieren → bei Änderungen retten → den nächsten sinnvollen Schritt erklären.**

Das ist näher an einem Travel Operating System als an einem klassischen Itinerary Builder.

## 5. Empfohlene strategische Reihenfolge – keine Build-Order-Änderung

Wenn die Binding Build Order und technische Voraussetzungen es erlauben, sind aktuell die stärksten langfristigen Kandidaten:

1. **Trip Audit / Journey Integrity** – hoher sofort sichtbarer Nutzen und möglicher Akquisitions-Einstieg.
2. **Change Impact & Recovery** – sehr hoher wiederkehrender Nutzen und schwer kopierbarer Trip-Graph-Vorteil.
3. **Multi-Citizenship / Entry Decision Engine** – hoher spezieller Nutzwert, aber strikt abhängig von offizieller Requirements-Evidence.
4. **Next Best Action** – macht bestehende Truth-Schichten für den Nutzer täglich verwertbar.
5. **True Trip Cost + Route Feasibility** – besonders stark, sobald reale Provider-/Commercial-/Transit-Evidence vorhanden ist.
6. **What-if Simulator** – danach als sichere Entscheidungsoberfläche auf Change Impact.

Diese Liste ist **strategische Priorisierung, nicht technische Bau-Reihenfolge**. `docs/JETNITY_BINDING_BUILD_ORDER.md` bleibt bindend und kann nur durch Product-Owner-Entscheidung geändert werden.

## 6. Wettbewerbs- und Marktregel

Die Ideen bleiben nur dann strategisch wertvoll, wenn sie bei einem späteren Implementierungsfenster noch echten Mehrwert und Differenzierung besitzen.

Deshalb muss vor jedem entsprechenden Slice geprüft werden:

- Was können Lambus, Wanderlog, TripIt, Mindtrip, Layla und neue relevante Wettbewerber inzwischen?
- Ist der Nutzwert noch klar?
- Ist Jetnitys Ausführung durch Truth-Architektur und Gesamtreisekontext besser bzw. anders genug?
- Gibt es eine einfachere Lösung mit höherem Nutzerwert?

Die bereits eingerichtete wiederkehrende Konkurrenzbeobachtung unterstützt diese Prüfung, ersetzt aber keinen Slice-spezifischen Live-Check.

## 7. Schutz vor Feature-Bloat

Eine dieser Ideen darf nicht gebaut werden, nur weil sie in diesem Register steht.

Vor jeder Umsetzung muss der Technical Lead beantworten:

1. Welches konkrete Nutzerproblem lösen wir?
2. Welchen messbaren oder klar beobachtbaren Nutzen erhält der Reisende?
3. Welche vorhandenen Jetnity-Truth-Schichten werden sinnvoll genutzt?
4. Was ist der kleinste Slice, der diesen Nutzen ehrlich beweist?
5. Welche Evidence fehlt noch?
6. Macht der Slice Jetnity **einzigartiger oder nur größer**?

Wenn die Antwort nicht überzeugend ist: **nicht bauen oder später neu bewerten.**

## 8. Kurzform für neue Chats und Agenten

> **Strategische Jetnity-Ideen dürfen nicht verloren gehen, aber sie sind keine automatische Roadmap. Die wichtigsten Differenzierungs-Kandidaten sind Trip Audit, Change Impact/Recovery, Multi-Citizenship/Entry Decisions, True Trip Cost, Route/Connection Feasibility, What-if Simulation und Next Best Action. Jeder Kandidat muss beim tatsächlichen Bauzeitpunkt erneut gegen Markt, Nutzerwert, Binding Build Order, Evidence und Product Differentiation Doctrine geprüft werden.**
