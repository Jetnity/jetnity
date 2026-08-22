# Jetnity – Handoff und nächste Schritte

Stand: 22. August 2026
Status: verbindlicher operativer Übergabepunkt

Dieser Handoff ist bewusst kompakt. Details stehen in den Fach- und Architekturdateien. Ein neuer Chat oder Coding Agent soll zuerst diese Quellen lesen:

- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- relevante Fach-Dokumente unter `docs/`

Wenn Erinnerung, Chat und Repository widersprechen, aktuellen Repository-/PR-/CI-/Production-Stand prüfen und nicht raten.

---

## 1. Produkt-Nordstern

Jetnity ist ein **zusammenhängendes intelligentes Reisesystem**, keine Sammlung isolierter Suchmaschinen.

Der gemeinsame Reisegraph ist die fachliche Grundlage. Flug, Unterkunft, Aktivitäten, Mobilität, Tagesplan, Budget, Reisende, Präferenzen und spätere Reisebereitschafts-/Live-Informationen sollen dieselbe Reise verstehen und bekannten Kontext wiederverwenden.

Verbindliches Nutzerziel:

> **So viel sinnvolle Arbeit, Suchaufwand, Doppelarbeit, Entscheidungsstress und organisatorische Reibung wie möglich abnehmen – ohne dem Nutzer die Kontrolle über wichtige Entscheidungen zu entziehen.**

Für Reiseänderungen gilt:

`Änderung erkennen → Auswirkungen auf die Gesamtreise bestimmen → optimierte Anpassung vorschlagen → Vorher/Nachher zeigen → erst nach ausdrücklicher Nutzerfreigabe übernehmen`

Die erste vollständig mit Jetnity geplante und begleitete Reise ist ein zentraler Produkttest. Nutzerbindung soll aus realem Nutzen, Vertrauen, Zeitersparnis und geringerem Reisestress entstehen.

---

## 2. Verbindlicher Logikstandard

`docs/LOGIC_STANDARD.md` ist für größere Produkt-, Daten- und Architekturarbeiten Pflicht.

Ab jetzt gehören **Logik, Datenwahrheit und bereichsübergreifende Konsistenz zu den höchsten Jetnity-Prioritäten**.

Insbesondere:

- eine Reise, möglichst eine Source of Truth
- `unknown` bleibt `unknown`; nichts plausibel erfinden
- `offen`, `ausgewählt`, `gebucht`, `unbestimmt`, `nicht verfügbar` müssen überall dieselbe Semantik haben
- bekannte Informationen werden wiederverwendet statt parallel neu erfunden
- Änderungen müssen auf Auswirkungen auf andere Reisebereiche geprüft werden
- Kernlogik braucht Positiv-, Negativ-, Grenz- und Mehrdeutigkeitsfälle
- gefundene Logikfehler erhalten nach Möglichkeit Regressionstests
- kein bekannter fachlicher Wahrheits-/Logikfehler darf gemergt werden

Leitsatz:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

---

## 3. Aktueller `main`-Stand

`main` enthält den Squash-Merge von Foundation B / PR #31:

`315d9b31e69fcd5fd40227f65aa97587efc3bec4`

Bereits abgeschlossen und auf `main`:

- Phase 3.1 – Flight Foundation
- Phase 3.2 / 3.2c – Hotel Foundation
- Phase 3.3 / 3.3b / 3.3c – Activities Foundation
- Trip Workspace Mobile UX Iteration 1–3 – PR #27
- Trip Coverage & Booking Status – PR #29
- Foundation A – Mobilität & Transfers – PR #30
- Foundation B – Mietwagen – PR #31
- Produktqualitäts- und Kontinuitätsstandards

Stabile öffentliche Production-URL:

`https://jetnity-app.vercel.app`

Production-Suchen bleiben weiterhin deaktiviert für:

- Flüge
- Hotels
- Aktivitäten
- Mobilität
- Mietwagen

Keine Provider-Suche darf ohne separate Production-Freigabe aktiviert werden.

---

## 4. Foundation A – Mobilität & Transfers / PR #30

**Gemergt nach `main`.** Foundation A nicht erneut bauen.

Pull Request: **#30 – Foundation A – Mobilität & Transfers**

Umgesetzt:

- ein gemeinsamer Workspace-Bereich **Mobilität**
- Bahn, Bus, Fähre und Transfer unter einer gemeinsamen Domäne
- persistenter Mobilitäts-Planpunkt bleibt `trip_items.kind='transfer'`
- strukturierte Mobilitätsfelder statt versteckter JSON-Metadaten
- provider-neutrale `lib/mobility/`-Domäne
- geschlossene `POST /api/mobility/search`
- Provider-Factory und serverseitige Nachweis-Naht fail closed
- keine Fake-Fahrpläne, Preise oder Verfügbarkeiten
- manuelle Mobilitätsangaben sind ausdrücklich Nutzerangaben
- manueller Buchungsstatus für Transfers
- konservative Reisegraph-Abdeckung über Bewegungskanten
- gleichdatiger Flug ohne vertrauenswürdige strukturierte Route bleibt `unknown`, nicht `covered_by_flight`
- Commercial Protection / natürliche Reiseänderung berücksichtigt Mobilitätsfelder
- Mobile Navigation: `Übersicht · Flüge · Unterkunft · Aktivitäten · Mobilität`

Nicht Teil der Foundation und bewusst nicht nachgezogen:

- echter Bahn-/Bus-/Fähren-/Transferprovider
- Productive Mobility Search
- Kreuzfahrten
- erfundene Wegezeiten oder Mindestumstiege

Qualitätsnachweis vor Production-Migration:

- `npm test`: **1100/1100**
- Typecheck grün
- Lint grün
- Hygiene grün
- Production-Build grün
- GitHub CI grün
- Vercel Preview grün
- Trip-Workspace-Audit WebKit + Chromium: **358 Kombinationen, 0 Fehler**
- Activities-Regression: **184 Kombinationen, 0 Fehler**
- echter iPhone-Test bestanden; fünf Bereiche funktionieren stabil

Fachdoku:

- `docs/MOBILITY.md`
- ADR-0090 / ADR-0091 in `DECISIONS.md`

---

## 5. Production-Datenbank

Supabase Production:

`qscbgcdmivbbnzrcyegn`

Region:

`eu-central-2`

Relevante Production-Migrationen:

1. `20260820100000_reise_anlegen_handelsfelder`
2. `20260820110000_airports_referenz`
3. `20260820120000_places_referenz`
4. `20260820130000_reise_aendern_places`
5. `20260821100000_trip_items_booking_status`
6. `20260821120000_trip_items_mobility`
7. `20260821200000_trip_items_rental_car`

### Booking Status

`20260821100000_trip_items_booking_status` wurde am 21. August 2026 nach ausdrücklicher Nutzerfreigabe auf Production angewendet und verifiziert.

### Mobility

`20260821120000_trip_items_mobility` wurde am 21. August 2026 nach ausdrücklicher Nutzerfreigabe auf Production angewendet und verifiziert.

Verifiziert auf Production:

- acht Mobilitätsspalten auf `public.trip_items` vorhanden
- neun relevanten Mobility-/Booking-CHECK-Constraints vorhanden
- `reise_anlegen(jsonb)` schreibt Mobilitätsfelder und erlaubt manuellen `booked`-Status für `transfer`
- Funktion bleibt `SECURITY INVOKER` (`prosecdef=false`) mit `search_path=public, pg_temp`
- vorhandene Production-Daten: **0** ungültige Nicht-Transfer-Mobility-Zeilen
- **0** ungültige gebuchte Nicht-Kommerzielle Zeilen
- **0** ungültige Mobility-Evidenzwerte
- Migrationshistorie ist auf Production, Development und Repository wieder auf der kanonischen Version `20260821120000` ausgerichtet

Wichtig: Die Production-Migration aktiviert **keine** Mobility-Suche und keinen Provider. Sie stellt nur das persistente Schema bereit, damit nach Merge der Anwendungscode nicht auf fehlende Spalten trifft.

### Mietwagen

`20260821200000_trip_items_rental_car` wurde am 22. August 2026 nach ausdrücklicher Nutzerfreigabe über den Supabase-Branch-Migrationsweg nach Production übernommen und verifiziert. Nachweis: `docs/PR31_PRODUCTION_MIGRATION_ACCEPTANCE.md`.

Verifiziert auf Production:

- vier Spalten `rental_supplier`, `vehicle_class`, `transmission`, `rental_evidence` vorhanden
- neun relevanten Rental-/Mobility-/Booking-CHECKs vorhanden
- 0 ungültige Mietwagenfelder auf Nicht-Mietwagen
- 0 ungültige `rental_evidence`
- 0 Transfer-spezifische Mobility-Felder auf `rental_car`
- 0 ungültige gebuchte Kinds
- 0 gebuchte Mietwagen mit anderer Quelle als `user`
- zum Migrationszeitpunkt 0 bestehende `rental_car`-Zeilen
- `reise_anlegen(jsonb)` bleibt `SECURITY INVOKER`, `search_path=public, pg_temp`, schreibt Mietwagenfelder
- `reise_aendern(jsonb)` bleibt unverändert und schreibt keine Mietwagenfelder

Die Production-Migration aktiviert **keine** Mietwagensuche und keinen Provider.

Keine weitere riskante Production-DB-Aktion ohne ausdrückliche Freigabe.

---

## 6. Phase 3.4 – echter Hotelprovider

Status: **WARTET / EXTERN BLOCKIERT**.

Phase 3.4 bleibt der erste echte Hotel-Suchadapter.

Bevorzugter Weg:

1. Booking.com Demand API / Managed Affiliate Partner – wenn echter Zugang vorhanden
2. HBX / Hotelbeds – Backup
3. Expedia Rapid – späterer Kandidat

Solange kein echter Zugang vorliegt:

- keinen Fake-Adapter bauen
- keine erfundenen Preise/Verfügbarkeiten
- keine Production-Hotelsuche aktivieren
- Phase 3.4 nicht künstlich als abgeschlossen markieren

---

## 7. Provider-unabhängiger Foundation-Track

Während Phase 3.4 auf externen Zugang wartet, wird der fehlende Reise-Unterbau vorbereitet.

### A. Mobilität & Transfers

Auf `main` und Production-Schema. Suche bleibt aus. Nicht erneut bauen.

### B. Mietwagen – PR #31

**Gemergt nach `main`.** Foundation B nicht erneut bauen. Schema `20260821200000` liegt auf Production. Suche bleibt aus.

Umgesetzt:

- `trip_items.kind = rental_car` plus wenige optionale Spalten
- Domäne `lib/rental-cars/`, geschlossene `POST /api/rental-cars/search`
- Kill Switch `JETNITY_RENTAL_CAR_AKTIV`; Production-Suche hart aus
- manuelle Erfassung als Nutzerangabe; Booking nur `user`
- UX als Unterbereich in Mobilität, kein sechster Tab
- Mietwagen deckt keine Bewegungskante
- Migration `20260821200000` auf Development **und** Production
- Review-Fix (ADR-0094 / ADR-0095): keine automatische Suche, leere manuelle Defaults, konservatives One-way, Kalendertage, währungssicheres Ranking; Labels nur bei belastbarem Vergleich

Qualitätsnachweis:

- `npm test`: **1165/1165**
- Typecheck, Lint, Hygiene, Production-Build grün
- Development- und Production-Schema `20260821200000` verifiziert
- `db:rechte`, `db:rls`, `db:sicherheit` 169/169, `db:typen --pruefen`, `auth:pruefen`
- Trip-Workspace-Audit WebKit + Chromium: **502 Kombinationen, 0 Fehler**
- Activities-Regression: **184 Kombinationen, 0 Fehler**
- echter iPhone-Test **bestanden** (`docs/PR31_REAL_DEVICE_ACCEPTANCE.md`)
- Production-Migrationsabnahme: `docs/PR31_PRODUCTION_MIGRATION_ACCEPTANCE.md`

Fachdoku: `docs/RENTAL_CARS.md`, ADR-0092 / ADR-0093 / ADR-0094 / ADR-0095.

Kein Fake-Provider und keine Production-Suche. Merge nur nach separater Freigabe.

### C. Travel Readiness & Dokumente – PR #32

Branch `feat/travel-readiness-foundation`. **Draft, nicht mergen.** Ausgangsbasis ist `main` @ `315d9b31`.

Human-Review-Fixes nach `docs/CURSOR_PR32_HUMAN_REVIEW_FIXES.md` sind im Code. Der Head und die Qualitätszahlen werden nach der erneuten Verifikation gesetzt.

Umgesetzt auf dem Draft-PR:

- eigene Domäne `trip_readiness_items`, kein neuer `trip_items.kind`
- trip-spezifischer Reisendenkontext `trip_travellers` / `Trip.party`
- provider-neutrale Requirements-Engine; Factory `null`
- Trennung Official Requirement Truth vs User Preparation Truth
- Context-Fingerprint, Freshness/Recheck und progressive Missing Facts
- Guest- und Account-Parität plus idempotente Übernahme von Party und Readiness
- geschlossene `POST /api/readiness/requirements` mit kanonischem `evaluations[]`; `official` ist Legacy-Zusammenfassung
- strenge Official-Evidence-Trust-Grenze vor `required` / `not_required` / `conditional` (ADR-0107)
- Multi-Transit bleibt pro Transitland getrennt; Provider darf `insufficient_context` + `missingFacts` liefern
- UX-Copy folgt Official Status/Freshness, kein hartcodiertes „nicht verfügbar“ nach späterer Provideranbindung
- Origin-/Transit-Naht `routeFactsAusReise()` existiert, liefert heute leer (`quelle: 'none'`) – nächste Abhängigkeit, kein Raten aus Ortsnamen (ADR-0108)
- UX als **Einreise & Reisevorbereitung** in der mobilen Übersicht und auf Desktop nach dem Reisekopf, kein sechster Tab
- kein Dokumententresor, keine OCR, kein Storage-Bucket

Development-Migrationen `20260822010000` und `20260822020000` nur Development. Production unverändert. Kein Provider, keine neuen Secrets, keine neuen Kosten.

Fachdoku: `docs/TRAVEL_READINESS.md`, ADR-0096 bis ADR-0108. Verbindlicher Nachtrag: `docs/CURSOR_TRAVEL_READINESS_AUTOMATION_AMENDMENT.md`. Review-Fixes: `docs/CURSOR_PR32_HUMAN_REVIEW_FIXES.md`.

### D. Gesamt-Abdeckung

Danach soll die zentrale Reiseübersicht Flug, Unterkunft, Aktivitäten, Mobilität, Mietwagen und Reisevorbereitung logisch zusammenführen und belastbar zeigen, was abgedeckt, offen oder noch nicht bestimmbar ist.

### Kreuzfahrten

Bewusst später. Das Reisegraph-Modell soll sie ermöglichen, aber Kabinen-/Tarif-/Deck-/Routenlogik wird nicht ohne echten Produktbedarf auf Vorrat gebaut.

---

## 8. Provider-Abhängigkeiten, die offen bleiben

Diese Punkte dürfen nicht aus der Dokumentation verschwinden:

- Booking.com Demand API / Managed Affiliate Partner Zugang
- HBX / Hotelbeds als Hotel-Backup
- Duffel Sandbox-/Testtoken für echte Preview-Verifikation
- Duffel Production-Zugang später separat
- erster echter Activity-Provider und Zugang
- echte Mobility-/Mietwagenprovider später nach Foundation und Providerwahl

Duffel-Testtoken nur Preview:

- `JETNITY_FLIGHT_AKTIV=true`
- `DUFFEL_ACCESS_TOKEN=duffel_test_...`

Keine Secrets in Git, Browser, Chat-Logs oder `NEXT_PUBLIC_*`.

---

## 9. Bekannte technische Punkte / Schulden

- Flight-/Hotel-/Activity-/Mobility-Rate-Limits müssen vor Productive kommerzieller Suche global/gespeichert belastbar sein, soweit aktuell In-Memory
- Duffel Offer IDs sind kurzlebig; gespeicherte Reise bleibt Momentaufnahme
- GeoNames-Anzeigenamen können von gebräuchlichen Namen abweichen
- gleichnamige Orte bleiben absichtlich disambiguiert; bei Mehrdeutigkeit nicht raten
- `trips.origin_place_id` und `trip_stages.place_id` haben laut Performance Advisor noch keine eigenen Covering-Indizes; späterer Performance-Pass
- historischer Production-Cron referenziert `public.sync_creator_profile_core()`, obwohl die Legacy-Funktion entfernt ist; Cleanup nur mit separater Production-Freigabe
- Production-Modellweg und alle produktiven Provider-Suchen benötigen eigene Freigaben

---

## 10. Arbeitsweise

Cursor ist Hauptentwickler für größere Implementierungsaufgaben. ChatGPT hält Produkt-, Architektur-, Security-, Kosten- und Review-Faden.

Größere Aufgabe:

`analysieren → Logik/Architektur entscheiden → implementieren → Tests → Build/CI → Security-/Produktreview → Dokumentation → Preview/Real Device → Freigabe → Production-Schritt falls nötig → Merge`

Verbindlich:

- `JETNITY_VISION.md` schützen
- `docs/LOGIC_STANDARD.md` anwenden
- `docs/PRODUCT_QUALITY_STANDARD.md` anwenden
- `docs/CONTINUITY_STANDARD.md` anwenden
- mobile-first
- echte/verifizierte Reisedaten
- keine Fake-Daten im Produktweg
- Security by default
- keine Secrets im Client/Git/Logs
- Kostenkontrolle; bei relevanter Überschreitung des vereinbarten Budgets zuerst fragen
- `main` nur kontrolliert ändern
- Production-Schritte immer separat prüfen/freigeben

---

## 11. Sofortiger Startpunkt für einen neuen Chat / Agenten

1. Pflichtdokumente aus dem Kopf dieses Handoffs lesen.
2. Aktuellen `main`-, PR-, CI-, Vercel- und Production-Stand prüfen.
3. PR #29 nicht erneut bauen: Coverage/Booking Status ist abgeschlossen.
4. PR #30 ist gemergt: Foundation A nicht erneut bauen.
5. PR #31 ist gemergt: Foundation B nicht erneut bauen. Mietwagen-Schema liegt auf Production; die Suche bleibt aus.
6. PR #32 ist Draft und **nicht mergen**. Foundation C / Travel Readiness. Keine Production-Migration.
7. Phase 3.4 bleibt extern blockiert, bis echter Hotelprovider-Zugang vorliegt.
8. Keine Fake-Providerdaten, keine Production-Provideraktivierung und keine Secrets ohne separate Freigabe.
9. Bei jeder neuen Funktion zuerst prüfen, wie sie logisch mit dem bestehenden Reisegraphen und den anderen Reisebereichen zusammenarbeitet.
