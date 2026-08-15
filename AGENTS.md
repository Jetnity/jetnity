# Jetnity V2 – verbindliche Regeln für alle Coding Agents

Dieses Repository enthält Jetnity V2.

Diese Datei ist für alle Coding Agents verbindlich, insbesondere für Cursor, Codex und andere automatisierte Entwicklungsagenten.

Sie definiert nicht die gesamte Produktvision, sondern die Arbeitsweise, mit der Jetnity entwickelt werden soll.

Vor jeder größeren Aufgabe müssen außerdem die folgenden Projektdateien gelesen werden, sofern vorhanden:

- [JETNITY_VISION.md](JETNITY_VISION.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [ROADMAP.md](ROADMAP.md)
- [DECISIONS.md](DECISIONS.md)
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
- relevante README-Dateien
- relevante Datenbankmigrationen
- relevante Tests

Wenn Informationen widersprüchlich sind, darf nicht geraten werden.

Der Widerspruch muss transparent benannt werden.

---

## 1. Grundregel

Jetnity darf niemals nur aufgrund des bestehenden Codes weiterentwickelt werden.

Der bestehende Code ist nicht automatisch die Produktspezifikation.

Die maßgebliche Richtung ergibt sich aus:

1. Jetnity-Vision
2. dokumentierten Produktentscheidungen
3. aktueller Architektur
4. aktueller Roadmap
5. verbindlichem Design-System
6. erst danach dem bestehenden Code

Wenn alter Code der neuen Jetnity-V2-Strategie widerspricht, darf und soll er hinterfragt werden.

---

## 2. Jetnity V2 nicht wieder aufblasen

Eine der wichtigsten Regeln:

Jetnity soll nicht wieder zu einer überladenen Reiseplattform mit unzähligen Modulen werden.

Nicht automatisch weiterbauen:

- Creator Hub
- Creator Feed
- Media Studio
- Story-System
- große Social-Funktionen
- umfangreiches Blogging
- Video-/Render-Pipeline
- unnötige Transportkategorien
- komplexe Enterprise-Systeme ohne konkreten Bedarf

Neue Features müssen mindestens eine dieser Fragen überzeugend mit Ja beantworten:

- Macht die Funktion Reiseplanung deutlich einfacher?
- Erhöht sie Nutzerbindung oder Wiederkehr sinnvoll?
- Erhöht sie das realistische Umsatzpotenzial?
- Ist sie technisch notwendig, damit ein Kernfeature zuverlässig funktioniert?

Wenn nicht:

Nicht bauen.

---

## 3. Produktkern schützen

Der zentrale Produktkern von Jetnity V2 ist:

Eine Reiseidee wird möglichst einfach in eine strukturierte, bearbeitbare und buchbare Reise verwandelt.

Der intelligente Trip Builder und Trip Workspace haben Vorrang vor Nebenfeatures.

Relevante Kernbereiche:

- Reiseidee
- Trip-Erstellung
- Trip-Persistenz
- Trip-Bearbeitung
- natürliche Sprache
- Flug
- Hotel
- Aktivitäten
- Budget
- Preisübersicht
- Reiseoptionen
- Buchungs-/Affiliate-Übergabe
- Nutzerkonto
- persönliche Präferenzen

Keine Nebenfunktion darf den Aufbau dieses Kerns unnötig verzögern.

---

## 4. Vor jeder größeren Entwicklungsphase

Vor einer größeren Änderung muss der Agent zunächst:

1. relevante Projektdateien lesen,
2. relevanten bestehenden Code analysieren,
3. bestehende Tests prüfen,
4. Datenbankschema und Migrationen prüfen,
5. aktuelle Roadmap lesen,
6. relevante Entscheidungen in DECISIONS.md lesen.

Danach muss ein kurzer Umsetzungsplan erstellt werden.

Der Plan soll enthalten:

- Ziel
- betroffene Module
- betroffene Dateien
- Datenbankänderungen
- API-Auswirkungen
- mögliche Risiken
- mögliche Security-Auswirkungen
- mögliche Kosten
- geplante Tests

Erst danach implementieren.

---

## 5. Produktentscheidungen nicht eigenmächtig treffen

Technische Detailentscheidungen darf der Agent selbstständig treffen.

Größere Produktentscheidungen benötigen Freigabe.

Dazu gehören insbesondere:

- neues Geschäftsmodell
- neue Hauptproduktkategorie
- grundlegende Änderung des Trip Builders
- grundlegende UX-Neuausrichtung
- neues Bezahlmodell
- neuer kostenpflichtiger Infrastruktur-Anbieter
- Wechsel des Haupt-Tech-Stacks
- Entfernung eines aktiven Kernfeatures
- wesentliche Änderung der Markenidentität
- neue laufende Kosten mit relevanter Auswirkung

Wenn eine solche Entscheidung sinnvoll erscheint:

1. Problem erklären
2. Empfehlung geben
3. Alternativen nennen
4. Auswirkungen erklären
5. auf Freigabe warten

---

## 6. Dokumentation ist Teil der Implementierung

Eine größere Aufgabe ist nicht abgeschlossen, solange die Projektdokumentation nicht aktuell ist.

Nach jeder relevanten Entwicklungsphase muss geprüft werden, ob folgende Dateien aktualisiert werden müssen:

### ARCHITECTURE.md

Aktualisieren bei:

- neuer Systemkomponente
- geändertem Datenfluss
- neuer API-Schicht
- neuer Provider-Integration
- geänderter Auth-Architektur
- Datenbankarchitektur
- Deployment-Architektur
- Security-Architektur
- relevanten Infrastrukturänderungen

### ROADMAP.md

Aktualisieren bei:

- abgeschlossener Phase
- neu priorisierten Aufgaben
- blockierten Aufgaben
- verschobenen Features
- neu entstandenen Voraussetzungen

Die Roadmap muss immer klar zeigen:

- Was ist fertig?
- Was ist in Arbeit?
- Was kommt als Nächstes?
- Was ist blockiert?
- Was ist bewusst verschoben?

### DECISIONS.md

Jede wichtige technische oder produktnahe Entscheidung muss dokumentiert werden.

Beispiele:

- warum Amadeus verwendet wird
- warum ein bestimmtes Datenmodell gewählt wurde
- warum ein Alt-Modul entfernt wurde
- warum ein Framework nicht eingeführt wurde
- warum eine Provider-Abstraktion noch nicht gebaut wird
- warum Gastreisen erlaubt bleiben
- warum eine bestimmte Security-Lösung gewählt wurde

Für jede Entscheidung dokumentieren:

- Datum
- Entscheidung
- Kontext
- Alternativen
- Begründung
- Konsequenzen

### DESIGN_SYSTEM.md

Aktualisieren bei:

- neuen Design-Tokens
- neuen Komponentenprinzipien
- Typografieänderungen
- Spacing-System
- Farbsystem
- Interaktionsmustern
- Responsive-Regeln
- visuellen Ausnahmen

Die bestehende Jetnity-V2-Markenwirkung darf nicht stillschweigend verändert werden.

---

## 7. Am Ende jeder größeren Aufgabe

Der Agent muss einen Abschlussbericht liefern.

Mindestens:

**Umgesetzt** – Was wurde konkret geändert?

**Dateien** – Welche wichtigen Dateien wurden verändert?

**Datenbank** – Welche Migrationen oder Schemaänderungen wurden vorgenommen?

**Tests** – Welche Tests wurden ausgeführt? Mit Ergebnis.

**Build** – Wurde ein Production-Build durchgeführt? Mit Ergebnis.

**Security** – Gab es relevante Security-Auswirkungen?

**Kosten** – Entstehen neue laufende Kosten?

**Dokumentation** – Welche Dokumentationsdateien wurden aktualisiert?

**Offene Punkte** – Was ist noch nicht fertig?

**Risiken** – Welche Risiken bestehen weiterhin?

**Empfehlung** – Was sollte als Nächstes gemacht werden?

---

## 8. Dokumentation darf nicht geschönt werden

Wenn etwas nicht funktioniert: Dokumentieren.

Wenn ein Test fehlschlägt: Dokumentieren.

Wenn ein Build fehlschlägt: Nicht behaupten, die Aufgabe sei fertig.

Wenn eine Migration nicht getestet wurde: Dokumentieren.

Wenn ein Security-Risiko übrig bleibt: Dokumentieren.

Wenn etwas nur teilweise implementiert wurde: Klar als teilweise implementiert kennzeichnen.

---

## 9. Keine stillen Architekturänderungen

Architektur darf verbessert werden.

Aber größere Änderungen dürfen nicht unsichtbar im Code verschwinden.

Wenn Architektur verändert wurde:

- ARCHITECTURE.md aktualisieren
- relevante Entscheidung in DECISIONS.md ergänzen
- Auswirkungen im Abschlussbericht erklären

---

## 10. Keine stillen Produktänderungen

Wenn während der Implementierung eine Produktanforderung verändert werden müsste:

Nicht einfach ändern.

Beispiel:

Die Anforderung lautet: Gastnutzer können Reisen erstellen.

Der Agent darf daraus nicht eigenständig machen: Registrierung ist zwingend erforderlich.

Stattdessen: Problem erklären und Freigabe einholen.

---

## 11. Design-Regeln

Die Jetnity-V2-Designrichtung ist verbindlich.

Markencharakter:

- tiefes Dunkelgrün
- hochwertiges Grün
- Lime-Akzent
- warmes Creme / Off-White
- zurückhaltende helle Grünflächen
- große, hochwertige Typografie
- viel Weißraum
- ruhige Premium-Wirkung
- hochwertiges Consumer-Produkt
- mobile-first

Nicht ohne Freigabe:

- Blau als neue Hauptfarbe
- Violett als neue Hauptfarbe
- AI-Gradient-Look
- Neon-SaaS-Look
- unnötiger Glassmorphism
- überladene Dashboards
- generische Template-Ästhetik

Neue Komponenten müssen visuell zum bestehenden Jetnity-V2-System passen.

Bestehende Tokens verwenden.

Keine neuen Fast-Duplikate von Farben einführen.

---

## 12. Codequalität

Bevorzugen:

- klar verständliche Module
- kleine Komponenten
- klare Verantwortlichkeiten
- starke TypeScript-Typen
- Zod oder vergleichbare Runtime-Validierung
- zentrale Business-Logik
- saubere Fehlerbehandlung
- serverseitige sensible Logik
- wiederverwendbare Datenzugriffsschichten
- nachvollziehbares Logging

Vermeiden:

- `any`
- riesige Komponenten
- duplizierte Business-Logik
- harte Secrets
- schwer nachvollziehbare Magic Values
- unkontrollierte globale Zustände
- unnötige Libraries
- Abstraktionen ohne realen Bedarf
- vorzeitige Microservices
- vorzeitige Multi-Provider-Systeme

---

## 13. Datenbankregeln

Die Datenbank ist zentrale Source of Truth.

Für neue persistente Funktionen:

- Migration erstellen
- Migration versionieren
- Typen aktualisieren
- RLS definieren
- RLS testen
- notwendige Indizes prüfen
- Ownership-Modell dokumentieren

Keine kritische Geschäftsfunktion nur in:

- Local Storage
- Client State
- URL State
- Browser Cache

Gastmodus darf Local Storage verwenden, sofern die Daten später sauber migriert werden können.

---

## 14. Supabase-Regeln

Service Role niemals leichtfertig verwenden.

Wenn Service Role verwendet wird:

- serverseitig
- Auth prüfen
- Ownership prüfen
- Eingaben validieren
- Rate Limiting prüfen
- Datenzugriff minimieren

RLS darf nicht umgangen werden, nur weil es einfacher ist.

Admin-Funktionen müssen klar getrennt sein.

---

## 15. Security by Default

Für jede neue API-Route prüfen:

- Auth erforderlich?
- Ownership erforderlich?
- Admin-Recht erforderlich?
- Input validiert?
- Rate Limit erforderlich?
- Missbrauchskosten möglich?
- Service Role notwendig?
- sensible Daten in Antwort?
- Logging nötig?

Neue Endpunkte dürfen nicht standardmäßig offen sein.

---

## 16. Secrets

Keine Secrets in:

- Client Components
- Browser-Bundles
- öffentlichen ENV-Variablen
- Logs
- Git
- Error Messages

Nur Variablen mit `NEXT_PUBLIC_` dürfen in den Browser gelangen.

Auch dann nur, wenn sie tatsächlich öffentlich sein dürfen.

---

## 17. KI-/Modellkosten

Jede kostenpflichtige Modellfunktion muss Kostenkontrolle besitzen.

Je nach Funktion prüfen:

- Request-Limit
- Tageslimit
- Nutzungsquote
- Timeout
- Max Tokens
- Modellwahl
- Fallback
- Kill Switch
- Logging der Nutzung

Ein öffentlicher, unlimitierter kostenpflichtiger Modell-Endpunkt ist nicht akzeptabel.

---

## 18. Infrastrukturkosten

Neue laufende Infrastrukturkosten müssen niedrig bleiben.

Als Richtlinie:

Die gesamte neue Infrastruktur soll möglichst innerhalb eines Gesamtbudgets von etwa USD 100 pro Monat bleiben, solange Jetnity noch nicht entsprechend Umsatz erzeugt.

Wenn eine Entscheidung diese Grenze deutlich gefährdet:

Nicht eigenmächtig einführen.

Zuerst:

- Kosten nennen
- Nutzen erklären
- Alternative nennen
- Freigabe einholen

---

## 19. Provider-Regel

Keine Multi-Provider-Abstraktion auf Vorrat.

Zuerst:

- ein funktionierender Flight Provider
- ein funktionierender Hotel-Weg
- ein funktionierender Activities Provider

Erst bei echtem Bedarf abstrahieren.

Komplexität muss verdient werden.

---

## 20. Git-Regeln

Für größere Änderungen:

- eigener Branch
- verständliche Commits
- keine riesigen Misch-Commits
- funktional zusammengehörende Änderungen bündeln
- keine unnötigen Formatierungsänderungen im gesamten Repo
- keine Veränderung fremder Bereiche ohne Grund

Vor Merge:

- Tests
- TypeScript
- Lint
- Build
- relevante Integrationschecks

---

## 21. Main muss stabil bleiben

`main` ist der stabile Integrationsbranch.

Keine experimentellen Großumbauten direkt auf `main`.

Preview zuerst.

Production danach.

---

## 22. Alte Jetnity-Module

Alt-Code darf entfernt werden, wenn er der V2-Strategie nicht mehr dient.

Aber:

Vor großen Entfernungen:

- Archiv-Tag oder Archiv-Branch
- Abhängigkeiten prüfen
- relevante wiederverwendbare Teile retten
- Auswirkungen dokumentieren

Nicht erst Wochen in Alt-Code investieren, wenn er unmittelbar danach entfernt wird.

---

## 23. Keine unnötige Perfektion vor dem Produktkern

Jetnity soll hochwertig gebaut werden.

Aber technische Perfektion darf den Kern nicht blockieren.

Beispiel:

Nicht erst eine universelle Provider-Plattform für zehn Anbieter bauen, bevor ein einziger echter Flug angezeigt werden kann.

Nicht erst ein riesiges Event-System bauen, bevor eine Reise gespeichert werden kann.

Nicht erst eine hochkomplexe Personalisierungsplattform bauen, bevor der Trip Builder funktioniert.

---

## 24. Tests

Kernlogik braucht Tests.

Priorität:

1. Auth
2. Rollen und Berechtigungen
3. RLS
4. Trip-Erstellung
5. Trip-Persistenz
6. Trip-Bearbeitung
7. strukturierte Sprachoperationen
8. Provider-Integration
9. Affiliate-Tracking
10. kritische Admin-Funktionen

Nicht jede kleine Präsentationskomponente benötigt zwingend Unit Tests.

Tests dort einsetzen, wo Fehler teuer wären.

---

## 25. Build-Regel

Eine Entwicklungsphase gilt nicht als technisch abgeschlossen, wenn:

- `npm ci` fehlschlägt
- TypeScript fehlschlägt
- relevante Lint-Checks fehlschlagen
- Production-Build fehlschlägt
- zentrale Tests fehlschlagen

Wenn eine Ausnahme notwendig ist:

Explizit dokumentieren.

---

## 26. Roadmap-Treue

Der Agent darf Verbesserungsideen entdecken.

Diese Ideen dürfen dokumentiert werden.

Aber nicht jede entdeckte Idee muss sofort implementiert werden.

Neue Ideen kommen in ROADMAP.md oder einen Bereich BACKLOG.

Sie dürfen die aktuelle Phase nicht ohne Grund verdrängen.

---

## 27. Fokus der aktuellen V2-Entwicklung

Solange die Roadmap nichts anderes sagt, liegt der Schwerpunkt auf:

1. stabile V2-Basis
2. Security
3. versionierte Datenbank
4. generisches Nutzerkonto
5. Trip-Schema
6. intelligenter Trip Builder
7. Trip Workspace
8. Flüge
9. Hotels
10. Aktivitäten
11. Monetarisierung
12. Launch-Reife

---

## 28. Wenn ein Agent unsicher ist

Nicht raten.

Stattdessen:

- bestehende Dokumentation prüfen
- Code prüfen
- Git-Historie prüfen
- Tests prüfen
- relevante Entscheidung suchen

Wenn weiterhin unklar: Frage stellen.

---

## 29. Wenn Dokumentation und Code widersprechen

Priorität:

1. explizit freigegebene aktuelle Produktentscheidung
2. aktuelle JETNITY_VISION.md
3. DECISIONS.md
4. ARCHITECTURE.md
5. ROADMAP.md
6. DESIGN_SYSTEM.md
7. bestehender Code

Der Widerspruch muss behoben werden.

Nicht stillschweigend eine Seite ignorieren.

---

## 30. Der rote Faden muss im Repository leben

Jetnity darf niemals davon abhängig werden, dass ein einzelner Chat oder Agent alle früheren Entscheidungen erinnert.

Nach jeder wichtigen Phase muss ein neuer Entwickler oder neuer Agent anhand des Repositories nachvollziehen können:

- Was ist Jetnity?
- Was bauen wir?
- Was bauen wir bewusst nicht?
- Wie ist das System aufgebaut?
- Warum wurde es so aufgebaut?
- Was ist bereits fertig?
- Was kommt als Nächstes?
- Welche Risiken bestehen?
- Welche Entscheidungen sind verbindlich?

Wenn diese Fragen nicht aus dem Repository beantwortet werden können, ist die Dokumentation unvollständig.

---

## 31. Definition of Done

Eine größere Aufgabe ist erst Done, wenn:

- Implementierung abgeschlossen
- TypeScript grün
- relevante Tests grün
- Build grün
- Security geprüft
- Migrationen vorhanden und geprüft
- Dokumentation aktualisiert
- Roadmap aktualisiert
- wichtige Entscheidungen dokumentiert
- offene Risiken genannt

Code allein bedeutet nicht Done.

---

## 32. Abschlussformat

Am Ende jeder größeren Phase antworte immer mit:

**Status** – Fertig / teilweise fertig / blockiert

**Umgesetzt** – Kurze Zusammenfassung

**Tests** – Was wurde ausgeführt und mit welchem Ergebnis?

**Build** – Ergebnis des Production-Builds

**Security** – Relevante Punkte

**Datenbank** – Migrationen / RLS / Typen

**Dokumentation** – Welche Dateien wurden aktualisiert?

**Kosten** – Neue oder veränderte laufende Kosten

**Offene Risiken** – Was bleibt?

**Nächster Schritt** – Eine klare Empfehlung

---

## 33. Leitprinzip

Bei jeder größeren Entscheidung gilt:

Baue nicht möglichst viel Jetnity.

Baue das richtige Jetnity so einfach, sicher und hochwertig wie möglich.

Das ist wichtiger als die Menge an Code.
