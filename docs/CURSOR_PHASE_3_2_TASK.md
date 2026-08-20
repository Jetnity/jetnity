# Cursor-Arbeitsauftrag – Phase 3.2 Hotel Foundation

Stand: 20. August 2026
Branch: `phase-3-2-hotel-foundation`
PR: #22

## Vor dem Arbeiten zwingend lesen

1. `JETNITY_HANDOFF.md`
2. `JETNITY_VISION.md`
3. `AGENTS.md`
4. `ARCHITECTURE.md`
5. `DECISIONS.md`
6. `ROADMAP.md`
7. `docs/HOTELS.md`
8. `docs/REISEN.md`
9. bestehende Flugarchitektur unter `lib/flights/` als Muster, nicht als Kopiervorlage

## Ausgangslage

Phase 3.1 ist abgeschlossen und auf `main`. Phase 3.2 wurde auf diesem Branch begonnen. Bereits vorhanden sind eine provider-unabhängige Hotel-/Quartierdomäne, ein schmales `HotelProvider`-Interface, deterministische Quartierbewertung, deterministisches provisionsneutrales Hotelranking sowie Foundation-Tests.

Die zentrale Produktregel ist verbindlich:

> Nicht zuerst das billigste Hotel suchen. Zuerst bestimmen, in welcher Gegend der Nutzer für genau diese Reise sinnvoll wohnen sollte; danach wenige passende Hotels in dieser Gegend empfehlen.

Provisionen, Provider oder Affiliate-Interessen dürfen weder Quartierwahl noch Ranking beeinflussen.

## Auftrag

Führe Phase 3.2 als nächsten größeren Implementierungsschritt weiter und mache die Foundation integrationsbereit, ohne einen echten Hotelprovider vorzutäuschen.

### 1. Bestehenden Foundation-Code zuerst reviewen

- Prüfe `lib/hotels/*` fachlich, typseitig und gegen die Produktvision.
- Behebe Inkonsistenzen, unnötige Exporte, instabile Scores oder fehlende Validierung an der Ursache.
- Keine Wegwerfarchitektur und keine Providerdetails in Domain/Ranking.

### 2. Hotel-Suchpipeline analog zur guten Flugtrennung vervollständigen

Baue eine klare serverseitige Pipeline mit getrennten Verantwortlichkeiten:

`validierte Suchanfrage → Quartierkontext → Quartierbewertung → ausgewähltes/empfohlenes Quartier → HotelProvider-Suche → Normalisierung → Jetnity-Hotelranking → sichere Client-Antwort`

Anforderungen:

- kein offener Proxy
- keine Provider-Secrets im Client
- Providerfehler sauber auf Statusklassen abbilden
- Timeout und Mengenlimits explizit
- nur normalisierte interne Typen verlassen die Serverschicht
- Tests dürfen niemals einen echten Hotelprovider aufrufen
- kein Modell für Preis, Verfügbarkeit, Bewertung, Stornierung oder andere kommerzielle Fakten
- unbekannte Fakten bleiben `null`

### 3. Quartierkontext an den echten Reisegraph anbinden

Die Quartierbewertung soll vorhandene vertrauenswürdige Reisedaten nutzen können, soweit sie heute real vorhanden sind:

- Ziel-/Etappen-Place und Koordinaten
- Reisezeitraum und Aufenthaltsdauer
- vorhandene Tages-/Planpunkte mit kanonischen Orten, soweit verfügbar
- Abreise-/Ankunftskontext, soweit belastbar
- Nutzerpräferenzen nur, wenn sie tatsächlich vorhanden sind

Keine erfundenen POIs, Wegzeiten oder ÖV-Zeiten. Wenn echte Routing-/POI-Daten noch fehlen, muss die Domain das klar als unbekannt ausdrücken und darf keine Scheingenauigkeit erzeugen.

### 4. UI im bestehenden Trip Workspace vorbereiten

Kein separates Demo bauen. Die Hotel-Funktion gehört in den bestehenden Reise-Arbeitsbereich.

Ziel für diesen Schritt:

- Hotelbereich pro relevanter Etappe
- verständlicher Zustand, solange noch kein echter Hotelprovider konfiguriert ist
- Quartierempfehlung und Begründung nur anzeigen, wenn sie auf vorhandenen Daten beruht
- später einsetzbare Kartenstruktur für 3–5 Hoteloptionen mit Labels: Jetnity empfiehlt, Best Value, beste Lage, ruhigere Alternative, Premium
- Loading/Empty/Unavailable/Timeout/Error als getrennte Zustände
- mobile-first und Accessibility beibehalten

Keine Fake-Hotels in der echten UI. Fixtures nur in Tests.

### 5. Trip-Integration fachlich vorbereiten

Prüfe, wie ein später ausgewähltes Hotel als kommerzieller `trip_item` gespeichert werden soll, analog zu Flügen, aber ohne bereits eine Production-Migration oder einen erfundenen Booking-Link einzuführen.

Dokumentiere genau:

- welche Momentaufnahme gespeichert wird
- welche Felder Provider-/External-Ref tragen
- was niemals aus dem Modell stammen darf
- wie spätere Preis-/Verfügbarkeitsänderungen behandelt werden
- wie Hotelnächte mit Etappe/Zeitraum verbunden sind

Nur implementieren, wenn es ohne neue ungeprüfte Production-Migration sauber auf dem bestehenden Schema möglich ist. Sonst als konkrete nächste Migration dokumentieren und zuerst Development vorsehen.

### 6. Tests und Qualitätsnachweise

Mindestens abdecken:

- deterministische Quartier- und Hotelrangfolge
- billigstes Hotel ist nicht automatisch Jetnity-Empfehlung
- Provider-/Provisionswechsel verändert den Score nicht
- unbekannte Fakten werden nicht erfunden
- Eingabegrenzen und ungültige Daten fail closed
- Fehler-/Timeout-/Empty-Zustände
- keine Secrets in Client-Nutzlasten
- keine echten Providercalls in Tests
- bestehende Phase-3.1-Funktionen bleiben grün

Danach vollständige Projektprüfungen ausführen: Tests, Typecheck, Lint, Hygiene, Build und CI-relevante Checks.

## Nicht Teil dieses Auftrags

- keinen echten Hotelprovider auswählen oder anbinden, solange dafür keine gesonderte Entscheidung gefallen ist
- keine Affiliate-/Booking-Deeplinks erfinden
- keine Production-Hotelsuche aktivieren
- keine Production-Migration anwenden
- keine Production-Secrets setzen
- keine Production-Daten verändern
- den historischen Supabase-Cronjob nicht entfernen
- Production-Flugsuche und Modellweg nicht aktivieren
- PR nicht auf Ready setzen und nicht mergen

## Abschluss

Am Ende:

1. `docs/HOTELS.md`, `ROADMAP.md`, `DECISIONS.md` und falls nötig `ARCHITECTURE.md` aktualisieren.
2. PR #22 mit präzisem Stand, Tests und offenen Punkten aktualisieren.
3. Alle Änderungen auf `phase-3-2-hotel-foundation` committen und pushen.
4. PR #22 Draft lassen.
5. Kurz berichten, was umgesetzt wurde, welche Checks grün sind und welche Entscheidungen für den ersten echten Hotelprovider noch offen sind.
