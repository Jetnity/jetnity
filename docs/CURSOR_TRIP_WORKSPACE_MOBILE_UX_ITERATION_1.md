# Cursor-Auftrag – Trip Workspace Mobile UX · Iteration 1

Stand: 21. August 2026

## Status

Dieser Auftrag ist die erste gezielte UX-Iteration für die wichtigste operative Jetnity-Seite: `/reisen/[tripId]`.

Ziel ist **nicht** ein vollständiges Redesign von Jetnity und **nicht** der Umbau der Startseite. Ziel ist, die mobile Reiseansicht so zu strukturieren, dass der Nutzer jederzeit versteht, wo er ist, was bereits geplant ist und wie er direkt zu Plan, Flügen, Unterkunft und Aktivitäten gelangt.

PR bleibt Draft. Kein Merge. Keine Production-Aktivierung.

---

## 1. Pflichtlektüre vor Umsetzung

Vor Codeänderungen vollständig lesen:

- `AGENTS.md`
- `JETNITY_HANDOFF.md`
- `JETNITY_VISION.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/REISEN.md`
- `docs/HOTELS.md`
- `docs/ACTIVITIES.md`
- `components/trips/TripWorkspace.tsx`
- `components/trips/KontoArbeitsbereich.tsx`
- `components/trips/GastArbeitsbereich.tsx`
- `components/trips/ReiseAenderung.tsx`
- `components/trips/FlugSuche.tsx`
- `components/trips/HotelBereich.tsx`
- `components/trips/AktivitaetenBereich.tsx`
- relevante Trip-/UI-Tests und bestehende Browser-Audit-Skripte

Danach kurz den Ist-Zustand analysieren und erst dann implementieren.

---

## 2. Produktproblem

Die mobile Reiseansicht ist aktuell technisch funktional, aber informationstechnisch zu linear.

Der Nutzer sieht beim Scrollen nacheinander:

- große Reisekopfkarte
- Reise ändern
- Flugsuche
- Unterkunft
- Aktivitäten
- Tagesplan
- Tagesinhalt
- Reiseprofil / weitere Informationen

Jeder Block für sich ist verständlich, aber in Summe entsteht auf dem Smartphone eine lange Folge von Karten. Nach längerem Scrollen verliert man den Überblick, in welchem Teil der Reise man sich befindet und wie man schnell zu einem anderen Bereich gelangt.

Die Seite `/reisen/[tripId]` ist der zentrale Produktarbeitsbereich von Jetnity. Sie muss deshalb besonders logisch, ruhig, übersichtlich und leicht einhändig bedienbar sein.

### Produktprinzip dieser Iteration

**Auf Mobile zuerst Orientierung, dann Aktion.**

Nicht alle großen Bereiche dauerhaft untereinander ausbreiten. Der Nutzer soll einen klaren Reise-Kontext und eine klare Hauptnavigation haben.

---

## 3. Zielbild Iteration 1

Mobile Hauptstruktur:

1. kompakter Reise-Kopf
2. klare, sticky erreichbare Bereichsnavigation
3. Bereiche:
   - Übersicht
   - Plan
   - Flüge
   - Unterkunft
   - Aktivitäten
4. auf Mobile primär nur der aktive Bereich sichtbar
5. „Reise ändern“ als kompakte Aktion statt dauerhaft großer Fläche
6. Tagesplan als eigenständiger, prominenter Hauptbereich
7. Desktop darf seine sinnvolle breite Arbeitsansicht behalten; kein erzwungener Mobile-Look auf Desktop

Diese Iteration soll zunächst das Navigations- und Informationsproblem lösen. Keine unnötigen zusätzlichen Produktfunktionen.

---

## 4. Mobile Navigation

Baue für kleine und mittlere Viewports eine klare Bereichsnavigation im Trip Workspace.

Bevorzugte Tabs/Segmente:

- `Übersicht`
- `Plan`
- `Flüge`
- `Unterkunft`
- `Aktivitäten`

### Anforderungen

- Navigation bleibt beim Scrollen sinnvoll erreichbar, bevorzugt sticky unterhalb der globalen Kopfzeile.
- Bei sehr schmalen Geräten darf die Navigation horizontal scrollbar sein, wenn alle Ziele per Wischen/Tastatur erreichbar bleiben.
- Kein abgeschnittener Tab-Text ohne erreichbare Alternative.
- Aktiver Bereich visuell eindeutig, aber ruhig und passend zum Jetnity Design System.
- Touch-Ziele mindestens nach bestehendem Qualitätsstandard.
- Tastaturbedienbar mit klar sichtbarem Fokus.
- Semantik passend, bevorzugt echte Tabs (`role=tablist/tab/tabpanel`) nur wenn korrekt implementiert; andernfalls einfache, robuste Navigationsbuttons. Keine halb korrekte ARIA-Tabs-Implementierung.
- Zustandswechsel darf keine Seite neu laden müssen.
- Keine unerwarteten Sprünge oder Scroll-Jitter.
- Beim Wechsel in `Plan` soll der aktuell gewählte Reisetag erhalten bleiben.
- Aktivitäten müssen weiterhin auf den fachlich gewählten Tag reagieren; keine neue zweite Tag-Wahrheit erzeugen.

### Deep Link / Reload

Iteration 1 muss nicht zwingend jeden Bereich in der URL persistieren. Prüfe aber, ob ein kleiner Query-/Hash-Ansatz ohne Komplexität sinnvoll ist. Wenn nicht, dokumentiere bewusst, dass der aktive Bereich Client-State ist. Keine unnötige Router-Komplexität nur für diese Iteration.

---

## 5. Kompakter Reise-Kopf auf Mobile

Der aktuelle große dunkelgrüne Reise-Hero ist visuell hochwertig, verbraucht auf Mobile aber viel vertikalen Raum.

Mobile soll kompakter werden, ohne den Markencharakter zu verlieren.

Mindestens sichtbar:

- Reisetitel, z. B. `Bali`
- Ziel/Etappen in kompakter Form
- Zeitraum
- Reisende
- Budgetstatus
- Speicherstatus (Gast/Konto) ohne übermäßige Dominanz

### Anforderungen

- deutlich weniger Höhe als heute auf 320–430 px
- keine wichtige Information verstecken
- lange Reise-/Etappennamen sauber umbrechen
- Gastwarnung weiterhin verständlich sichtbar
- Konto-Löschen nicht als primäre mobile Aktion hervorheben; darf in sekundärer Aktion sinnvoll platziert werden, aber bestehende Funktion nicht verlieren
- Desktop kann die bisherige reichhaltigere Kopfansicht beibehalten, sofern konsistent

---

## 6. Bereich `Übersicht`

Dies ist der Default-Bereich beim Öffnen einer Reise auf Mobile.

Er soll **kein zweiter langer Workspace** sein, sondern in wenigen Sekunden vermitteln:

- Worum geht es bei dieser Reise?
- Was ist bereits geplant?
- Welche Hauptbausteine sind noch offen?
- Wie komme ich direkt zum gewünschten Bereich?

### Erwartete Inhalte

Kompakte Statusblöcke oder Zeilen für:

- Tagesplan
- Flüge
- Unterkunft
- Aktivitäten

Nur aus echten vorhandenen Trip-/Providerzuständen ableiten.

Beispiele für ehrliche Statusformulierungen:

- `3 Punkte geplant`
- `Noch kein Flug ausgewählt`
- `Noch keine Unterkunft ausgewählt`
- `1 Aktivität geplant`

Keinen Status behaupten, den die vorhandene Datenstruktur nicht zuverlässig bestimmen kann.

### Aktionen

Jeder Statusblock kann direkt den entsprechenden Hauptbereich öffnen.

Bevorzugt eine ruhige App-/Dashboard-Anmutung statt vier riesiger Marketingkarten.

### Reiseprofil

Tempo/Interessen dürfen in Übersicht sekundär erscheinen, wenn das die Seite nicht wieder verlängert. Alternativ kompakte Zusammenfassung oder sekundäre Aktion. Bestehende Daten nicht entfernen.

---

## 7. `Reise ändern` kompakt machen

`ReiseAenderung` ist fachlich wichtig, soll auf Mobile aber nicht permanent einen großen Bildschirmbereich beanspruchen.

Iteration 1:

- in der Übersicht eine klare kompakte Aktion wie `Reise ändern`
- beim Aktivieren öffnet sich die bestehende Bearbeitungsfunktion in einem geeigneten mobilen Container

Bevorzugte Varianten:

1. vorhandener UI-Dialog/Sheet, falls im Design-System bereits robust vorhanden
2. ansonsten ein sauber eingeblendeter/aufgeklappter Bereich direkt innerhalb der Übersicht

Nicht für diese Iteration eine neue komplexe Bottom-Sheet-Library einführen.

### Wichtig

- bestehende Reiseänderungslogik nicht neu schreiben
- Modell-/Security-Trust-Boundaries nicht verändern
- Production-Modellweg bleibt aus
- Vorschau-/Bestätigungsfluss bleibt erhalten
- Fokusmanagement beim Öffnen/Schließen korrekt
- Escape/Schließen sauber, wenn Dialog benutzt wird

---

## 8. Bereich `Plan`

Der Tagesplan wird ein Hauptbereich statt ein Element weit unten auf der Seite.

### Mobile Ziel

- Tagesauswahl kompakt und schnell erreichbar
- darunter nur der aktuell gewählte Tag mit seinen Punkten
- `Punkt hinzufügen` klar sichtbar
- lange Reisen dürfen nicht eine 15-Zeilen-Liste als erstes Element zeigen

Prüfe für Mobile bevorzugt:

- horizontal scrollbare Tageschips / Datumsleiste
- oder kompakter Day Picker mit aktuellem Tag und nächster/vorheriger Navigation

Wähle die einfachste robuste Lösung, die auf 15–30 Tagen noch verständlich bleibt.

### Anforderungen

- Tagesdatum und Tagnummer klar
- Anzahl vorhandener Punkte optional sichtbar
- aktuell gewählter Tag eindeutig
- kein verschachteltes Scrollen, das die Seite auf Mobile blockiert
- der bestehende Formular- und Löschfluss für Planpunkte bleibt funktional
- `ohneTag`-Punkte dürfen nicht verschwinden; vorhandenes Verhalten erhalten oder verständlicher einordnen

---

## 9. Bereiche `Flüge`, `Unterkunft`, `Aktivitäten`

Die bestehenden Komponenten bleiben die fachliche Quelle.

Auf Mobile werden sie nur im jeweils aktiven Hauptbereich gerendert/angezeigt, statt alle dauerhaft untereinander.

### Anforderungen

- keine Provider-/Suchlogik neu schreiben
- keine Fake-Daten
- Production-Kill-Switches unverändert
- bestehende Loading-/Unavailable-/Empty-/Error-/Timeout-/Rate-Limit-Zustände erhalten
- bei Bereichswechsel laufende Requests nicht unnötig vervielfachen
- vorhandenes Activity-Abort-/Race-Verhalten nicht verschlechtern
- keine unkontrollierten Search-Loops durch Mount/Unmount
- prüfen, ob Bereiche beim Umschalten besser gemountet bleiben und nur verborgen werden oder bewusst neu mounten; Entscheidung anhand Request-Verhalten und Performance treffen und dokumentieren

### Übersicht vs. Suchbereich

Die Übersicht zeigt nur einen kompakten Status. Die volle Such-/Empfehlungsoberfläche gehört in den jeweiligen Hauptbereich.

---

## 10. Desktop und Tablet

Der Nutzer hat konkret die mobile Ansicht kritisiert.

Deshalb:

- Desktop nicht unnötig komplett neu gestalten
- vorhandene 3-Spalten-/Arbeitsansicht darf sinnvoll bleiben
- gemeinsame Komponenten dürfen verbessert werden, aber keine Regression auf ≥1024 px
- Tablet 768/834 px bewusst prüfen: Navigation und Inhalt dürfen weder wie zu enger Desktop noch wie aufgeblasenes Mobile wirken

Wenn eine einheitliche Architektur für Mobile/Desktop einfacher und qualitativ besser ist, darf sie gewählt werden, solange Desktop nicht an Nutzbarkeit verliert.

---

## 11. State- und Architekturregeln

- `Trip` bleibt einzige fachliche Reisequelle.
- Kein duplizierter Reise-State als zweite Wahrheit.
- Persistente Änderungen weiterhin über bestehende Aktionen + `router.refresh()` im Konto.
- Gast- und Konto-Workspace sollen weiterhin dieselbe zentrale `TripWorkspace`-Darstellung nutzen.
- Kein Copy-Paste eines zweiten Mobile-Workspaces.
- UI-/Navigationsstate darf lokal sein.
- Tagesauswahl nicht doppelt an mehreren Stellen unabhängig halten.
- Search-Komponenten nicht in die Domain ziehen.
- keine neue Datenbankmigration für diesen UX-Auftrag.
- keine neue API-Route nötig, sofern nicht zwingend durch einen realen Defekt begründet.

---

## 12. Accessibility

Verbindlich:

- vollständige Tastaturbedienung der neuen Hauptnavigation
- sichtbarer Fokus
- sinnvolle Überschriftenhierarchie
- aktiver Bereich für Screenreader verständlich
- keine unsichtbaren fokussierbaren Elemente aus inaktiven Bereichen
- bei Dialog/Sheet: Fokus hinein, Fokus zurück, Escape, Scroll-Verhalten korrekt
- Icon-only Buttons mit Accessible Name
- Status nicht nur über Farbe kommunizieren
- Touch-Ziele mindestens 44 px, sofern Design-System nicht bereits strengere Regel vorgibt

---

## 13. Performance / perceived speed

Die neue Struktur soll die Seite gefühlt schneller und ruhiger machen.

Prüfen:

- keine fünf großen Module unnötig gleichzeitig mit neuen Requests starten, wenn der Nutzer nur Übersicht sieht
- aber auch keine Request-Schleifen durch häufiges Tab-Umschalten
- kein unnötiges globales State-Framework
- keine große neue UI-Library
- keine Layout Shifts bei Navigation
- sticky Navigation darf nicht ruckeln
- Client-Bundle-Auswirkung dokumentieren, falls neue Abhängigkeit unvermeidlich wäre; bevorzugt keine neue Abhängigkeit

---

## 14. Mobile-/Browser-Abnahme

Diese Iteration ist erst fertig, wenn der neue Trip Workspace real im Browser geprüft wurde.

Mindestens:

### Engines

- WebKit
- Chromium

### Breiten

- 280 px
- 320 px
- 360 px
- 390 px
- 430 px
- 768 px
- Desktop-Gegenprobe ≥1280 px

### Zusätzlich

- iPhone-artiges Landscape, z. B. 844×390
- lange Reisebezeichnung
- viele Etappen
- 15+ Reisetage
- leerer Plan
- mehrere Planpunkte
- Gastreise
- Kontoreise
- offene Providerzustände, da Production-Suchen deaktiviert sind
- Loading-/Error-/Unavailable-Zustände der kommerziellen Bereiche über vorhandene sichere Test-/Auditwege

### Prüfkriterien

- kein horizontaler Seitenoverflow
- nichts abgeschnitten
- Navigation vollständig erreichbar
- Sticky-Leiste verdeckt keine Überschrift/Fokusziele
- keine winzigen Touch-Ziele
- keine Fokusfallen
- kein Doppelscrollen im Tagesplan
- keine Layoutsprünge beim Bereichswechsel
- schnelle Tabwechsel verursachen keine Request-/State-Races
- Scrollposition verhält sich nachvollziehbar

Wenn möglich bestehenden Audit-Harness erweitern statt eine parallele Wegwerf-Messung zu bauen.

---

## 15. Tests

Mindestens passende Tests für:

- Default-Bereich ist Übersicht auf Mobile-Logik
- Bereichswechsel
- aktiver Bereich bleibt eindeutig
- Tagesauswahl bleibt beim Wechsel zwischen Plan/Aktivitäten konsistent
- Statusberechnung der Übersicht ohne erfundene Fakten
- Reise-ändern-Öffnen/Schließen
- inaktive Bereiche sind accessibility-seitig korrekt
- Gast- und Konto-Variante bleiben funktionsfähig
- Planpunkt anlegen/löschen nicht regressiert
- Search-Komponenten verursachen keine offensichtlichen mehrfachen Request-Schleifen

Bestehende Flight-/Hotel-/Activity-/Trip-Tests dürfen nicht regressieren.

---

## 16. Qualitäts-Gates

Vor Abschluss ausführen:

- `npm test`
- Typecheck
- Lint
- bestehende Hygiene-/Export-Checks
- Production Build
- relevante Browser-/Mobile-Audits
- GitHub CI
- Vercel Preview

Kein „fertig“, wenn ein verpflichtender Check nicht ausgeführt wurde. Wenn ein Tool technisch nicht ausführbar ist: transparent dokumentieren und PR Draft lassen.

---

## 17. Dokumentation / Kontinuität

Definition of Done enthält zwingend Dokumentation gemäß `docs/CONTINUITY_STANDARD.md`.

Mindestens aktualisieren, falls durch Code bewiesen:

- `JETNITY_HANDOFF.md`
- `ROADMAP.md` nur wenn dieser UX-Block als eigener Status sinnvoll ist
- `docs/REISEN.md`
- `DESIGN_SYSTEM.md` nur bei neuen verbindlichen Mustern
- `DECISIONS.md` nur wenn eine relevante Architektur-/UX-Entscheidung entsteht
- `docs/PRODUCT_QUALITY_STANDARD.md` nur wenn ein allgemeiner Standard ergänzt werden muss, nicht um die Iteration zu protokollieren

Im Handoff ausdrücklich festhalten:

- Iteration 1 ist Preview oder gemergt – tatsächlichen Stand verwenden
- was sich auf Mobile geändert hat
- was bewusst für Iteration 2 offen blieb
- Browser-/Mobile-Audit-Ergebnis
- keine Provider-/Production-Änderungen
- nächster Schritt: Nutzer prüft Preview auf echtem iPhone und gibt Produktfeedback

---

## 18. Harte Grenzen

Nicht tun:

- Startseite redesignen
- Hotel-/Activity-/Flight-Provider anbinden
- Secrets oder neue Provider-ENV einführen
- Production-Suchen aktivieren
- Datenbankmigrationen ohne zwingenden Grund
- Geschäftslogik oder Ranking umbauen
- Fake-Flüge/Hotels/Aktivitäten in den normalen Produktweg einführen
- Desktop ohne Produktgrund komplett neu gestalten
- eine neue große UI-Library nur für Tabs/Sheet einführen
- mehrere parallele Trip-Workspaces bauen
- `main` mergen
- Production manuell verändern

---

## 19. Gewünschter Abschlussbericht von Cursor

Am Ende klar berichten:

### Umgesetzt
Was wurde an der mobilen Informationsarchitektur konkret geändert?

### UX
Wie funktionieren Übersicht, Plan, Flüge, Unterkunft, Aktivitäten und Reise ändern?

### Dateien
Wichtigste geänderte Dateien.

### Datenbank
`keine`, sofern dieser Auftrag korrekt ohne Migration lösbar war.

### Provider / Production
Bestätigen, dass keine Provider-/Production-Aktivierung erfolgte.

### Tests
Exakte Zahlen und Ergebnisse.

### Browser-Audit
Engines, Viewports, Zustände, Anzahl Kombinationen und Fehlerzahl.

### Build / CI / Vercel
Exakter Status.

### Accessibility
Was wurde konkret geprüft?

### Performance
Request-/Mount-Verhalten der fünf Hauptbereiche und neue Abhängigkeiten.

### Dokumentation
Welche Dateien aktualisiert wurden.

### Offene Punkte
Was bewusst in Iteration 2 gehört.

### Preview
Vercel Preview nennen, damit der Nutzer die Seite auf seinem echten iPhone beurteilen kann.

---

## 20. Erfolgskriterium aus Nutzersicht

Nach Öffnen einer gespeicherten Reise auf dem iPhone soll der Nutzer innerhalb weniger Sekunden verstehen:

- welche Reise geöffnet ist
- was geplant/offen ist
- wo der Tagesplan ist
- wie er zu Flügen, Unterkunft oder Aktivitäten kommt
- wie er die Reise ändern kann

Er soll **nicht mehr durch eine endlose Folge großer Kästchen scrollen müssen, um die Seite zu verstehen**.

Iteration 1 ist bewusst ein erster Produktdurchgang. Der Nutzer wird den Preview anschließend auf dem echten iPhone ansehen; darauf folgt bei Bedarf Iteration 2.