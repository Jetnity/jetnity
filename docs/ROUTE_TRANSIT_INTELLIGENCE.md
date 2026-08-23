# Jetnity – Route & Transit Intelligence

Stand: 22. August 2026  
Status: **Foundation D umgesetzt auf Draft-PR #34; nicht gemergt, keine Production-Migration**

Fachdokument zur gemeinsamen Route Truth. Acceptance: `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`.

---

## Ziel

Jetnity versteht eine Reise als belastbare, strukturierte Route – nicht als Freitexttitel und nicht als isolierte Produktsuche.

Eine gültige Route sieht fachlich so aus:

`ZRH (CH) → DOH (QA) → BKK (TH)`

mit eindeutiger Trennung von Origin, Destination, Segmenten, Transit, Ländern, Zeiten, Connection Duration und Evidence.

Leitsätze:

> **Eine Route, eine strukturierte Wahrheit.**

> **Der Nutzer sieht die Reise – nicht die Komplexität des Datenmodells dahinter.**

---

## Was Route Truth ist – und was nicht

Route Truth entsteht nur aus einer validierten Flight-Itinerary.

Keine Route entsteht aus:

- Flugtiteln oder Notizen
- Ortsnamen wie `Doha`, `Paris`, `San José`
- Place-IDs oder GeoNames
- `trips.origin`
- LLM-Vermutung
- erfundenen Zeiten oder Transitländern

Wenn Country, Duration oder Airport Change nicht belegbar sind: `null` / `unknown`. Kein Raten.

---

## Domain

Provider-neutrale Typen leben in `lib/route/`.

| Begriff | Bedeutung |
| --- | --- |
| `FlugRouteItinerary` | persistierte Momentaufnahme: Legs mit geordneten Segmenten |
| `RouteFacts` | abgeleitete Reise-Route: Origin, Destination, Segmente, Connections, Transitländer |
| `RouteVerbindung` | Umstieg zwischen zwei Segmenten derselben Itinerary |
| `FlughafenReferenzKarte` | IATA → Country/City/Name, nur aus `public.airports` oder Test-Fixtures |

`routeFactsAusReise()` in `lib/readiness/kontext.ts` bleibt die einzige Readiness-Naht. Sie liest dieselbe Ableitung (`routeFactsAusGraph`) und liefert nicht mehr grundsätzlich `quelle: 'none'`, sobald eine gültige Itinerary im Graphen liegt.

---

## Evidence und Country-Auflösung

Länder kommen nur aus expliziten Airport-Referenzen:

1. Suche: ein Batch-Lookup `public.airports` (`flughafenReferenzLesen`), kein N+1
2. Konto-Anlage aus Browser-/Local-Storage-Nutzlast: `reiseAusNutzlastAnlegen()` sammelt alle IATA-Codes, holt dieselben Referenzen einmal und baut jeden Route-Punkt mit `flughafenPunkt()` neu. Clientwerte für `countryCode`, `city` und `country` werden verworfen (ADR-0114)
3. Direkte Account-Flugübernahme: weiterhin `itineraryAusFlugOption()` plus Batch-Referenz, unverändert
4. Gast: übernimmt die in der Suchantwort mitgelieferte Referenzkarte in die lokale Itinerary; das ist nur lokaler Entwurf, keine Account-Truth
5. Anzeige: City/Country nur, wenn die Referenz sie trägt

Ohne Treffer in `airports` oder bei Lookup-Fehler bleibt `countryCode` `null`. Es gibt keinen Fallback auf Client-Länder. Die Route darf trotzdem IATA-Segmente zeigen. Die SQL-Helferfunktion `flug_route_itinerary_metadata()` verwirft Client-`countryCode`/`city`/`country` und baut die Punkte aus `public.airports` neu (ADR-0115). Ein BEFORE-Trigger auf `trip_items` wendet dieselbe Grenze auf jeden direkten INSERT/UPDATE an (ADR-0116). Die TypeScript-Kanonisierung bleibt Defense in Depth.

---

## Persistenz

Keine neue Tabelle, keine neue Spalte, keine Production-Migration.

Die Itinerary liegt in der bestehenden Spalte `trip_items.metadata` als validierte Hülle:

```json
{ "routeItinerary": { "v": 1, "type": "flight_route_itinerary", "legs": [...] } }
```

Grenzen:

- Zod-Schema, max. 6 Legs, max. 8 Segmente je Leg
- Hülle höchstens 8192 Zeichen; darüber wird nichts geschrieben
- `metadata` ist kein allgemeiner Jutesack
- `public.reise_anlegen()` schreibt eine validierte `route_itinerary` atomar nach `trip_items.metadata` (ADR-0113, nur Development)
- der TypeScript-Nachlauf ist fail-closed Recovery: Lesen-/Schreibfehler oder fehlende Route sind kein vollständiger Erfolg
- Retry über dieselbe `client_ref` erzeugt keine zweite Reise
- `public.reise_aendern()` lässt `metadata` unberührt
- `routeItinerary` ist kommerziell geschützt (`lib/reiseaenderung/geschuetzt.ts`)

Guest → Account: die Browser-Itinerary ist Input. Persistiert wird nur die serverseitig kanonisierte Route. Item-IDs gehören nicht zum Route-Fingerprint, damit Readiness nach der Übernahme nicht stale wird.

---

## Ableitung

- Direktflug: Origin/Destination des einen Segments, keine Connection
- Ein oder mehrere Transits: Zwischenländer in Segmentreihenfolge, ohne das letzte Zielland
- Connections nur innerhalb einer Itinerary, nicht über Hinflug→Rückflug hinweg
- Connection Duration nur aus vollständigen, nicht-negativen Zeiten (`umstiegMinuten`)
- Airport Change nur, wenn beide IATA-Codes vorliegen und verschieden sind
- Destination Countries für Readiness: Etappen-Codes plus Itinerary-Ziel, wenn es nicht der Origin derselben Itinerary ist

Fingerprint: `route-v1|ZRH:CH>DOH:QA>BKK:TH`. Airport-Change-Origins bleiben in der Kette, z. B. `ZRH:CH>CDG:FR>ORY:FR>BKK:TH`. Readiness-Fingerprints sind `v3|sha256:…` über den vollen Kontext, nicht über ein 800-Zeichen-Präfix.

---

## Oberflächen

Keine neue Hauptnavigation.

**Flüge:** kompakte Route zuerst (`Zürich ZRH → Doha DOH → Bangkok BKK`), sekundär `1 Umstieg · Doha, Qatar · 2 h 15 min`. Direktflug bleibt bewusst einfacher. Details öffnen sich progressiv. Flughafenwechsel nur bei Evidence. Screenreader-Text „Route“.

**Übersicht:** eine dezente Zeile, z. B. `Zürich → Doha → Bangkok · {Coverage}`. Kein neuer Modulblock.

**Reiseänderung:** `Route: … → …` plus `Transit QA entfernt` / `Transit SG hinzugefügt`. Readiness wird über den geänderten Fingerprint stale.

**Mobilität:** keine neue Connection-Risk-UI. Airport Change und Duration leben in `lib/route`, nicht in Titel-Raten.

**Einreise:** erhält Origin-/Transit-Codes automatisch, sobald eine Itinerary existiert. Ohne Itinerary bleibt fail-closed. Kein Timatic.

---

## Websiteweite UX-Prüfung in diesem Block

Geprüft: Übersicht, Flüge, Mobilität, Einreise & Reisevorbereitung, Tagesplan.

| Frage | Befund |
| --- | --- |
| Wo bin ich? | Bestehende Bereichsnavigation unverändert; Route hängt am Flug, nicht an einem neuen Tab |
| Was ist wichtig? | Kompakte Route vor Details |
| Was ist der Status? | Direktflug / n Umstiege plus Coverage; fehlende Länder bleiben unsichtbar statt geraten |
| Nächster Schritt? | Eine Primäraktion (Übernehmen / Bereich wechseln), keine konkurrierende Route-Aktion |
| Änderungswirkung? | Diff nennt Route und Transit; Readiness wird stale |

Keine unbeteiligten Bereiche redesignt. Größerer Follow-up: echtes Connection-Risk-Produkt erst, wenn echte Transfer-/Umstiegsdaten das tragen.

---

## Grenzen

- Draft-PR #34, nicht mergen
- kein Timatic, kein Requirements-Provider
- kein echter Flight-Provider in Production
- keine Secrets
- keine Fake-Routen
- bestehende Foundations nicht neu gebaut
