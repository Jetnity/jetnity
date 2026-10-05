# Jetnity – Trip Workspace Transformation Scope Policy

Stand: 22. August 2026  
Status: **verbindliche Product-Owner-Produktregel**

## 1. Grundsatz

Der spätere große Trip-Workspace-/Übersicht-Umbau umfasst **nicht nur die bereits geöffnete Workspace-Seite**, sondern den vollständigen zusammenhängenden Nutzerweg, der zu einer Reise und in den Workspace führt.

Leitsatz:

> **Der Besucher soll nicht erst im Workspace ein professionelles Jetnity erleben. Der gesamte Weg von der Reiseidee bis zum intelligenten Reise-Kontrollzentrum muss eine einzige verständliche Produktlogik bilden.**

## 2. Verbindlicher Scope des großen Umbaus

Der Umbau umfasst mindestens:

1. **Reiseeinstieg auf der öffentlichen Startseite**
   - einfacher Einziel-Einstieg bleibt leicht
   - progressives `+ Weiteres Ziel hinzufügen`
   - Multi-Destination ohne starre Ziel-1/2/3-Logik
   - alle gewählten Ziele verlustfrei weitergeben
   - Nutzerziele strikt von Flight-Transit unterscheiden
   - keine stille Reorder-Optimierung ohne Nutzerfreigabe

2. **Planungs-/Reise-anlegen-Flow**
   - Ziele hinzufügen, entfernen, ersetzen und ordnen
   - vorhandene `trip_stages` als gemeinsame Wahrheit verwenden
   - Hard Facts und Soft Preferences sauber trennen
   - keine Reisetempo-/Interessen-Chips als vorprägende Pflichtlogik
   - kein verstecktes `balanced` als bestätigte Nutzerpräferenz
   - optionaler Freitext `Wünsche & Prioritäten`
   - so wenig Fragen wie möglich, so viele wie für eine echte Entscheidung nötig

3. **Gast-/Konto-Übergang und „Meine Reisen“**
   - `Meine Reisen` bleibt zentraler Reise-Hub
   - eine aktive Gastreise transparent erklären
   - bei vorhandener Gastreise nicht irreführend eine parallele zweite Reise vortäuschen
   - niemals still überschreiben
   - Guest→Account verlustfrei
   - Multi-Destination auf Reisekarten verständlich erkennbar

4. **Übergang in den Trip Workspace**
   - keine erneute Eingabe bereits bekannter Reise-Facts
   - gleiche Reise-Wahrheit aus Einstieg/Planung/Hub/Workspace
   - keine semantischen Sprünge, widersprüchlichen Labels oder versteckten Defaults
   - Nutzer muss verstehen, was gerade erstellt wurde und wie er weiterarbeitet

5. **Trip Workspace als Ganzes**
   - Übersicht als wichtigstes intelligentes Kontrollzentrum
   - Flüge
   - Unterkunft
   - Aktivitäten
   - Mobilität / Transfers / Mietwagen
   - Tagesplan
   - Readiness / Einreise & Vorbereitung
   - Traveller Context / Multi-Citizenship / Multi-Document
   - Route & Transit Truth
   - Safety & Disruption
   - Timing & Seasonal Intelligence
   - Wünsche & Prioritäten
   - Reiseänderungen
   - Buchungs-/Planungsstatus
   - relevante Budget-/Coverage-/Fortschrittslogik

6. **Workspace-Übersicht / Priorisierungslogik**
   Die Übersicht muss sofort verständlich beantworten:
   - Was ist diese Reise?
   - Was ist erledigt?
   - Was fehlt?
   - Was ist unsicher?
   - Gibt es Warnungen/Risiken?
   - Welche Entscheidung ist offen?
   - Was empfiehlt Jetnity als Nächstes?

   Sie ist keine Sammlung gleichgewichteter Karten. Relevanz, Dringlichkeit, Truth, Nutzerkontext und Reisephase bestimmen die Priorität.

7. **Cross-Domain-Intelligence**
   Alle relevanten Funktionen müssen miteinander arbeiten. Beispiele:
   - Flug-/Transitänderung → Readiness, Transfer, Unterkunft, Tagesplan prüfen
   - Traveller-/Dokumentänderung → betroffene regulatorische Ergebnisse neu bewerten
   - Safety-Ereignis → konkrete Etappen, Route, Unterkunft, Aktivitäten und Mobilität prüfen
   - saisonaler Nachteil → Aktivitäten, Transfers, Erreichbarkeit, alternative Zeiträume sinnvoll bewerten
   - Datums-/Zieländerung → alle davon abhängigen Empfehlungen/Freshness neu bewerten

   Keine isolierten Fachmodule mit widersprüchlicher Reise-Wahrheit.

8. **Nutzerkontrolle**
   Jetnity darf analysieren, warnen, priorisieren und Anpassungen vorbereiten. Relevante Reiseänderungen werden nicht still übernommen.

   Prinzip:

   > **Änderung erkennen → Auswirkungen auf Gesamtreise bestimmen → optimierte Anpassung vorschlagen → Vorher/Nachher zeigen → erst nach ausdrücklicher Nutzerfreigabe übernehmen.**

9. **Geräte-/Viewport-Parität**
   Smartphone, Tablet, Laptop und Desktop müssen denselben mentalen Produktfluss, dieselbe Reise-Wahrheit und dieselbe Nutzerkontrolle bieten. Mobile ist nicht komprimierter Desktop; Desktop ist nicht gestrecktes Mobile.

10. **Bestehende Funktionen ohne Bestandsschutz**
    Frühere Implementierungen dürfen verändert, refaktoriert, ersetzt, vereinfacht oder nach Product-Owner-Freigabe entfernt werden, wenn sie dem heutigen Jetnity-Standard oder dem fehlerfreien Gesamtsystem widersprechen.

## 3. Was bewusst NICHT Teil dieses Umbaus ist

Die **finale Marketing-/Positionierungsoptimierung der öffentlichen Startseite** bleibt ein späterer eigener Abschlussblock gemäß:

`docs/FINAL_HOMEPAGE_POSITIONING_OPTIMIZATION_POLICY.md`

Unterscheidung:

- **Teil des Workspace-Umbaus:** funktionaler Reiseeinstieg auf der Startseite, Multi-Destination, Übergabe in Planung, CTA-/Gastlogik, verlustfreier Weg bis in die Reise.
- **Später separat:** finale Markenstory, Positionierung, Erklärung „Was ist Jetnity / was macht es anders / warum Jetnity?“, finale Kommunikationshierarchie und Marketing-Copy auf Basis des tatsächlich fertigen Produkts.

## 4. Voraussetzungen vor dem Umbau

Der große Umbau soll auf den relevanten fachlichen Foundations aufsetzen und nicht danach noch einmal wegen grundlegender Truth-/Provider-Schnittstellen neu strukturiert werden müssen.

Verbindliche Zielreihenfolge vor dem Umbau:

1. Foundation D – Route & Transit abschließen
2. Foundation E – Traveller Context / Multi-Citizenship / Multi-Document
3. Travel Safety & Disruption – provider-neutrale Intelligence Foundation
4. Travel Timing & Seasonal – provider-neutrale Intelligence Foundation
5. Provider-Readiness-Pass über alle externen Datenfunktionen gemäß `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`
6. danach großer End-to-End Trip-Workspace-/Übersicht-Umbau inklusive Weg dorthin

Echte Production-Provider, Verträge, Secrets und laufende Providerkosten werden dadurch nicht vorgezogen.

## 5. Abschluss / Audit

Nach dem Umbau folgt der verbindliche vollständige Workspace Intelligence Audit gemäß:

`docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`

Dieser Audit muss ausdrücklich auch den Weg **vor** dem Workspace prüfen:

- Startseite → Reiseeinstieg
- Multi-Destination
- Planungsflow
- Gastregel
- `Meine Reisen`
- Guest→Account
- Eintritt in den Workspace
- Übersicht und alle Fachbereiche
- Cross-Domain-Auswirkungen
- alle unterstützten Geräteklassen

Eine hervorragende Workspace-Übersicht reicht nicht, wenn der Nutzer auf dem Weg dorthin Informationen verliert, falsche Erwartungen erhält, doppelt eingeben muss oder die Produktlogik wechselt.
