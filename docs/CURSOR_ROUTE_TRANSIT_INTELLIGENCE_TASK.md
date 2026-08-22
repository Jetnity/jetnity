# Cursor Task – Route & Transit Intelligence Foundation

Stand: 22. August 2026  
Status: **verbindlicher Implementierungsauftrag**  
Branch: `feat/route-transit-intelligence`

## 1. Auftrag

Baue die nächste Jetnity-Kernfoundation: **Route & Transit Intelligence**.

Jetnity muss eine Reise nicht nur als Ziele und einzelne Produkte verstehen, sondern als belastbare, strukturierte Route. Flüge, Segmente, Umstiege, Transitländer, Verbindungspunkte und Reiseänderungen sollen in denselben Reisegraphen einfließen und von Readiness, Mobilität und weiteren Domänen wiederverwendet werden.

Die Umsetzung muss gleichzeitig technisch erstklassig und psychologisch sehr gut verständlich sein.

## 2. Pflichtlektüre vor Code

Vor Änderungen vollständig lesen:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `AGENTS.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/CHATGPT_CURSOR_WORKFLOW.md`
- `docs/TRAVEL_READINESS.md`
- relevante Flight-, Mobility-, Trip-Graph- und Change-Engine-Dateien

Synchronisiere zuerst den aktuellen Branch mit `main`. Vorhandene gültige Architektur wiederverwenden; nichts unnötig neu bauen.

## 3. Verbindliche Produktregel – UX websiteweit

Die neue Nutzerentscheidung ist verbindlich:

> Jetnity muss psychologisch und logisch so gebaut sein, dass Besucher alle Bereiche der Website schnell, ruhig und eindeutig verstehen. Hohe fachliche Komplexität darf nicht zu visueller oder mentaler Überlastung führen.

`docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md` ist deshalb Teil der Definition of Done.

Für diesen Block bedeutet das insbesondere:

- keine neue Hauptnavigation nur für Route/Transit
- keine technischen Rohdaten im Vordergrund
- wichtigste Reiseinformation zuerst
- Segmente und Umstiege verständlich gruppieren
- klare Status- und Änderungswirkung
- Details progressiv öffnen
- Mobile und Desktop dieselbe Produktlogik
- keine konkurrierenden Primäraktionen

## 4. Kernziel

Aus einer belastbaren Flight-/Itinerary-Struktur soll Jetnity strukturierte Route Facts ableiten können, z. B.:

`ZRH (CH) → DOH (QA) → BKK (TH)`

mit eindeutiger Trennung von:

- Origin
- Destination
- Segmenten
- Transit-/Connection-Punkten
- Ländern
- Flughäfen/Orten
- geplanten Zeiten
- Connection Duration, wenn aus echten Zeiten berechenbar
- Evidence / Herkunft
- Aktualität / Revisionsbezug

Kein Raten aus Freitext-Ortsnamen.

## 5. Route Facts – fachliche Anforderungen

Entwirf eine provider-neutrale Route-Facts-Domäne, die mindestens folgende Informationen ausdrücken kann, soweit echte Daten vorhanden sind:

- origin airport/place code
- origin country code
- destination airport/place code
- destination country code
- ordered segments
- departure / arrival timestamps
- transit airport/place code
- transit country code
- connection duration
- airport change, falls fachlich aus strukturierten Daten bestimmbar
- source/evidence
- source item / flight association
- context fingerprint / revision relevance, falls für bestehende Change-/Readiness-Logik nötig

Ein Segment darf nicht aus UI-Text rekonstruiert werden.

## 6. Evidence- und Truth-Regeln

- Nur strukturierte, belastbare Daten als Route Truth verwenden.
- Airport-/Place-Referenzen dürfen für Country-Auflösung genutzt werden, wenn sie eindeutig referenziert sind.
- Kein Geo-Guessing aus Namen wie `Doha`, `Paris`, `San José`.
- Kein LLM als Quelle für Airport-, Country- oder Transit-Wahrheit.
- Wenn Country/Transit nicht sicher bestimmbar ist: `unknown`/`null`, nicht erraten.
- Provider-Snapshot und Nutzerplan müssen fachlich unterscheidbar bleiben, wenn nötig.
- Kein Fake-Flugplan, keine Fake-Verbindungszeit.

## 7. Integration in Foundation C / Readiness

`routeFactsAusReise()` darf nach diesem Block nicht mehr grundsätzlich `quelle: 'none'` liefern, wenn echte strukturierte Flight-/Itinerary-Daten im Trip vorhanden sind.

Readiness soll daraus automatisch erhalten können:

- origin country
- destination country/countries
- vollständige Transit-Country-Liste

Wichtig:

- Multi-Transit vollständig erhalten
- Reihenfolge nicht verlieren, wenn fachlich relevant
- Flight-/Route-Änderungen müssen Readiness Context/Fingerprint korrekt stale/recheck auslösen
- ohne strukturierten Kontext weiterhin fail-closed
- kein echter Timatic-/Requirements-Provider in diesem Task

## 8. Integration in Flugbereich

Der Besucher soll eine Route verständlich sehen.

Beispiel kompakt:

`Zürich ZRH → Doha DOH → Bangkok BKK`

Sekundär:

`1 Umstieg · Doha, Katar · 2 h 15 min`

Details, wenn geöffnet:

- Segment 1: ZRH → DOH
- Transit/Connection
- Segment 2: DOH → BKK

Die konkrete Darstellung an bestehende Jetnity-Komponenten anpassen, nicht eine neue Stilwelt bauen.

### UX-Regeln

- Direktflug muss einfacher aussehen als Umsteigeverbindung.
- Anzahl Umstiege sofort erkennbar.
- Connection Details nur dort prominent, wo sie entscheidungsrelevant sind.
- Flughafenwechsel/auffällige Connection-Risiken nur anzeigen, wenn echte Evidence vorliegt.
- Keine dichte Airline-GDS-Rohdarstellung.

## 9. Integration in Reiseübersicht

Route darf in der Übersicht dezent zusammengefasst werden, wenn es die Orientierung verbessert, z. B.:

`Zürich → Doha → Bangkok`

Nicht als neuer großer Modulblock, wenn bestehende Übersicht bereits ausreichend Struktur besitzt.

Die Übersicht soll bereichsübergreifende Auswirkungen zeigen können, ohne dieselbe Information mehrfach zu wiederholen.

## 10. Integration in Reiseänderungen

Beispiel:

Vorher: `ZRH → DOH → BKK`  
Neu: `ZRH → SIN → BKK`

Jetnity muss logisch erkennen:

- Transit QA entfernt
- Transit SG hinzugefügt
- Route Context geändert
- Readiness erneut prüfen
- weitere betroffene Domänen nur dann markieren, wenn fachlich tatsächlich betroffen

Keine stille Übernahme alter Transit-/Readiness-Wahrheit.

## 11. Mobilität / Connections

Bestehende Mobility-Logik prüfen und Route Facts dort wiederverwenden, wo es fachlich sinnvoll ist.

Nicht in diesem Task ein neues komplettes Connection-Risk-Produkt erfinden. Aber Architektur so bauen, dass spätere Funktionen für:

- Transfer zum/vom Flughafen
- Airport Change
- Connection Time
- Anschlussrisiken

auf denselben Route Facts aufbauen können.

## 12. Datenmodell / Persistenz

Vor neuer DB-Struktur zuerst bestehendes `trips`, `trip_stages`, `trip_items` und Flight-Modell prüfen.

Bevorzugung:

- vorhandene strukturierte Felder korrekt nutzen/erweitern
- neue Tabelle/Spalten nur, wenn semantisch wirklich nötig
- keine redundante zweite Reisegraph-Wahrheit

Wenn eine Migration nötig ist:

- nur Development anwenden
- RLS / Ownership / Grants vollständig
- Production **nicht** migrieren
- Production-Migration erst nach Human Review und separater Freigabe

## 13. Guest / Account

Route-/Transit-Information darf bei Guest → Account nicht verloren gehen oder doppelt entstehen.

Bestehende idempotente Übernahme-/Mapping-Logik berücksichtigen.

## 14. API-/Provider-Neutralität

Dieser Task aktiviert keinen echten Flight- oder Requirements-Provider.

Architektur muss:

- bestehende Flight Provider Snapshots verarbeiten können
- später echte Itinerary-Daten aufnehmen können
- Provider-spezifische Shapes an Adaptergrenzen normalisieren

Keine Provider-Details in UI-/Trip-Kernmodell leaken, soweit vermeidbar.

## 15. Websiteweite UX-Prüfung innerhalb dieses Blocks

Zusätzlich zum Route-Feature einen gezielten Cross-Surface-Review der betroffenen Websitebereiche durchführen:

- Reiseübersicht
- Flüge
- Mobilität
- Einreise & Reisevorbereitung
- Tagesplan, falls Route-Auswirkungen sichtbar werden

Prüfen:

- Wo bin ich?
- Was ist wichtig?
- Was ist der Status?
- Was ist der nächste Schritt?
- Welche Änderung hat welche Wirkung?

Nicht unbeteiligte Bereiche komplett redesignen. Gefundene systemische UX-Probleme dokumentieren und nur dann mitfixen, wenn der Fix klein, sicher und konsistent ist. Größere Redesigns als eigenen Follow-up-Track festhalten.

## 16. Accessibility

- semantische Route-/Segmentstruktur
- Status nicht nur über Farbe
- Tastaturbedienung
- verständliche Screenreader-Texte für Route, Umstieg und Details
- mobile Touch-Ziele gemäß Design-System
- keine Hover-only-Information

## 17. Performance

- Route Facts deterministisch und günstig ableiten
- keine zusätzlichen Provider-Calls nur für UI-Darstellung
- kein N+1 auf Airport/Place-Lookups
- serverseitige/normalisierte Ableitung bevorzugen, wenn passend
- keine schwere Client-Berechnung für einfache Facts

## 18. Tests – Mindestfälle

Automatisierte Regressionen mindestens für:

1. Direktflug CH → TH
2. ein Transit CH → QA → TH
3. zwei Transits
4. fehlender Airport-Country-Kontext → unknown, kein Guess
5. gleiche Stadt / unterschiedlicher Airport, soweit Modell relevant
6. Transitwechsel QA → SG erzeugt neue Route Facts
7. Readiness Context wird bei Transitänderung stale/recheck
8. Segmentreihenfolge bleibt korrekt
9. Connection Duration aus validen Zeiten
10. ungültige/fehlende Zeiten erzeugen keine erfundene Duration
11. Guest-/Account-Parität
12. Mobile-/Desktop-Darstellung
13. Accessibility relevante Zustände
14. bestehende Flight-, Mobility-, Readiness-Regressionen bleiben grün

## 19. Audits / Definition of Done

Vor Abschluss ausführen und dokumentieren:

- `npm test`
- Typecheck
- Lint
- Hygiene
- Production build
- Auth config checks
- relevante DB/RLS/Security-Checks, falls Schema berührt
- Trip Workspace Audit WebKit
- Trip Workspace Audit Chromium
- Flight-/Mobility-/Readiness-Regressionen
- Vercel Preview
- GitHub CI

UI-Audit-Fixtures um Route-/Transit-Kombinationen erweitern, wenn nötig.

## 20. Dokumentation

Am Ende aktualisieren:

- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `DECISIONS.md` für neue ADRs
- eigenes Fach-Dokument für Route/Transit, z. B. `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- Acceptance-/Verification-Dokument mit tatsächlichem Head, Tests, Preview, DB-Grenzen, Risiken

## 21. Harte Grenzen

- PR bleibt Draft bis Human-/Architecture-Review
- nicht selbst mergen
- keine Production-Migration
- kein Timatic-Vertrag
- kein echter Requirements-Provider
- kein neuer kostenpflichtiger Provider
- keine Secrets
- keine Fake-Routen/Transitländer/Zeiten
- kein großflächiges unaufgefordertes Redesign der Website
- bestehende Foundations nicht neu bauen

## 22. Ergebnis

Am Ende soll Jetnity eine belastbare gemeinsame Route Truth besitzen, die der Besucher einfach versteht und die mehrere Bereiche intelligent versorgt.

Technisches Ziel:

> **Eine Route, eine strukturierte Wahrheit.**

UX-Ziel:

> **Der Nutzer sieht die Reise – nicht die Komplexität des Datenmodells dahinter.**
