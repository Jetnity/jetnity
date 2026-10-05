# Jetnity – PR #34 Human-/Architecture-/Truth-Review Round 2

Stand: 22. August 2026  
Status: **verbindlicher Review-Blocker – PR #34 bleibt Draft / Merge nicht freigegeben**

Branch: `feat/route-transit-intelligence`  
PR: #34 – Foundation D – Route & Transit Intelligence

## 1. Anlass

Der erste Human-Review-Blocker (stiller Verlust der `routeItinerary` bei Guest → Account) wurde technisch sauber adressiert:

- Development-RPC schreibt die Route atomar;
- der TypeScript-Nachlauf ist fail-closed Recovery;
- Retry bleibt idempotent;
- Development-Migration `20260822130000_reise_anlegen_route_itinerary.sql` ist angewendet;
- Production ist unverändert.

Beim erneuten Truth-/Security-Review ist jedoch eine zweite, unabhängige Trust-Boundary-Lücke aufgefallen.

## 2. BLOCKER – Client darf Route-Country-/Display-Truth nicht setzen

### Beobachtung

`gastreiseUebernehmen()` ist eine Server Action und akzeptiert eine Nutzlast aus Browser / Local Storage.

`reiseNutzlastSchema` / `flugRouteItinerarySchema` prüfen `airportCode`, `countryCode`, `city` und `country` strukturell. Die Prüfung beweist aber nicht, dass z. B.:

- `ZRH` wirklich `CH` ist;
- `DOH` wirklich `QA` ist;
- ein angegebener Stadt-/Ländername zur IATA-Referenz gehört.

Die neue SQL-Funktion `flug_route_itinerary_metadata()` prüft ebenfalls nur Formate / Größe und persistiert anschließend die übergebene Itinerary in `trip_items.metadata`.

`routeFactsAusGraph()` liest diese persistierte Itinerary danach als `quelle: 'flight_itinerary'` und leitet daraus Origin-, Destination- und Transit-Länder für Readiness ab.

Damit könnte ein manipuliertes Browser-Payload strukturell gültige, aber fachlich falsche Country-/Display-Facts persistieren.

Das widerspricht den verbindlichen Foundation-D-Truth-Regeln:

> Länder nur aus eindeutigen Airport-/Referenzdaten; keine Client-/Ortsnamen-Wahrheit.

und dem allgemeinen Jetnity-Grundsatz:

> Eine Reise, eine Wahrheit.

### Warum das vor Merge behoben werden muss

Foundation D schafft ausdrücklich die gemeinsame Route Truth, auf der Readiness, Transitlogik, Mobilität und spätere Provider-Auswertungen aufbauen.

Eine Route Truth, deren Länderwerte ein Browser setzen kann, wäre eine falsche Trust Boundary. Spätere Timatic-/Requirements-Logik dürfte diese Werte niemals als belastbaren Kontext verwenden.

Das ist deshalb kein späteres Hardening, sondern Teil des aktuellen Foundation-D-Scopes.

## 3. Verbindliche Lösung

### Bevorzugt: zentrale serverseitige Kanonisierung vor Persistenz

Vor jedem Account-Schreibpfad, der eine `route_itinerary` aus Client-/Browser-Kontext übernehmen kann, muss Jetnity die Route serverseitig kanonisieren.

Bevorzugter Ort: zentral vor `reiseAusNutzlastAnlegen()` / RPC-Aufruf, sodass Gastübernahme, Retry und weitere Browserpfade dieselbe Trust Boundary nutzen.

Verbindlich:

1. Itinerary strukturell lesen.
2. Alle vorhandenen IATA-Codes aller Legs/Segmente sammeln.
3. Ein **einziger Batch-Lookup** gegen `public.airports` – kein N+1.
4. Jeden Route-Punkt aus IATA + serverseitiger Referenz neu aufbauen, bevorzugt mit der vorhandenen `flughafenPunkt()`-/Referenzlogik.
5. Clientwerte für `countryCode`, `city` und `country` **nicht übernehmen**.
6. Fehlt eine Airport-Zeile oder schlägt die Referenzauflösung fehl, bleiben `countryCode`, `city` und `country` `null`/unknown; niemals auf Clientwerte zurückfallen.
7. Datum/Uhrzeit dürfen aus der strukturell validierten Itinerary erhalten bleiben; sie sind keine Airport-Country-Truth.
8. Genau die kanonisierte Nutzlast wird sowohl an `reise_anlegen()` als auch an den fail-closed Recovery-/Nachzugpfad übergeben.
9. Direkte Account-Flugübernahme (`flugInReiseUebernehmen`) behält ihre bestehende serverseitige Airport-Auflösung und darf nicht regressieren.

### SQL-Grenze

Die SQL-Helferfunktion darf als strukturelle letzte Schutzschicht bestehen bleiben. Sie darf aber nicht als Beweis dafür dokumentiert werden, dass Client-Country-Facts vertrauenswürdig sind.

Eine zweite DB-Wahrheit / ein N+1-Lookup pro Segment in SQL ist nicht erwünscht, wenn die bestehende serverseitige Batch-Referenzlogik zentral wiederverwendet werden kann.

## 4. Pflicht-Tests

Mindestens automatisiert nachweisen:

1. Manipuliertes `ZRH` + falsches `countryCode` wird vor Persistenz zu `CH` kanonisiert, wenn `public.airports` die Referenz liefert.
2. Manipuliertes `DOH` + falsches Transitland wird zu `QA` kanonisiert.
3. Client-`city` / `country` werden durch serverseitige Referenzwerte ersetzt oder auf `null` gesetzt.
4. Unbekannter / nicht gefundener IATA-Code erzeugt **keinen** übernommenen Client-Country-Wert.
5. Fehler beim Airport-Referenz-Lookup fällt fail-closed zurück: keine erfundenen / clientseitigen Länderwerte.
6. Direct Flight, 1 Transit und Multi-Transit bleiben nach Kanonisierung vollständig.
7. Guest → Account und Retry bleiben idempotent; keine doppelte Reise / keine doppelten Items.
8. Route-/Readiness-Fingerprint basiert nach Account-Übernahme auf der kanonischen Route und bleibt bei fachlich gleicher Route stabil.
9. Direkte Account-Flugübernahme bleibt serverseitig referenzbasiert.
10. Bestehende Flight-/Trip-/Readiness-/Mobility-/Route-Regressionen bleiben grün.

Danach erneut dokumentieren:

- `npm test`
- Typecheck
- Lint
- Hygiene
- Production Build
- Auth checks
- Trip Workspace Audit WebKit + Chromium
- GitHub CI
- Vercel Preview
- DB/RLS/Security nur erneut, falls zusätzlich Schema/RPC geändert wird

## 5. Dokumentation / Kontinuität

Nach Umsetzung aktualisieren:

- `docs/ACTIVE_WORK_STATUS.md`
- `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`
- `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- `ARCHITECTURE.md` / `DECISIONS.md`, falls Trust-Boundary-Architektur präzisiert wird

Dokumentiere ausdrücklich:

- Browser-/Local-Storage-Itinerary ist Input, nicht Country-Truth;
- Account-Route-Country-/City-Facts entstehen ausschließlich aus serverseitiger Airport-Referenz;
- unbekannte Referenz bleibt unknown;
- kein Fallback auf Client-Country-Facts.

## 6. Merge-/Production-Gate

PR #34 bleibt **Draft**.

- nicht Mark Ready;
- nicht mergen;
- keine Production-Migration;
- keine Provider-Aktivierung.

Nach dem Fix führt ChatGPT erneut den Human-/Architecture-/UX-/Security-/Truth-Review durch. Erst danach erhält der Product Owner wieder die Entscheidung über weitere Änderungen oder eine spätere Merge-Freigabe.

## Merksatz

> **Ein IATA-Code aus dem Client darf ein Hinweis sein. Das zugehörige Land wird auf dem Server aus Jetnitys Airport-Referenz bestimmt – niemals vom Browser behauptet.**
