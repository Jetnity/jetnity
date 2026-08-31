# Jetnity – Entry Requirements E5-B1 – Trusted Airport Timezone Provenance

Stand: 31. August 2026  
Status: **BINDING TASK / BOUNDED RUNTIME FOUNDATION / NO TIMEZONE RESOLUTION / NO AUTO-FOLLOW-UP**

Issue: **#327**  
Parent target: **#294**  
Baseline: `main@6928ea637133ff91cfb207cfd5b1175fecbc9699`  
Branch: `feat/entry-requirements-trusted-timezone-e5b1-2026-08-31`  
Logical Cursor agent: **`Jetnity entry requirements trusted event time 1`**, Generation 1

> Audit first. Reuse before add. Integrate before duplicate. Live evidence before assumptions.

## 1. Warum dieser Slice existiert

E4 modelliert belastbare relative Official Temporal Rules. E5-A kann diese Regeln deterministisch projizieren, **wenn** der Aufrufer bereits einen expliziten absoluten Event-Instant mit stabiler `eventRef` liefert.

Die aktuelle Flight-/Route-Wahrheit kann einen solchen Instant bewusst noch nicht erzeugen:

- `lib/flights/domain.ts`: Flight-Segmentzeiten sind Ortszeiten des jeweiligen Flughafens;
- `lib/flights/zeit.ts`: lokale Flugzeiten dürfen weder als Serverzeit interpretiert noch durch Anhängen von `Z` zu UTC erfunden werden;
- `lib/route/domain.ts` / `lib/route/schema.ts` / `lib/route/kontakte.ts`: Route Truth trägt lokale Datum-/Uhrzeit, aber keine belastbare IANA-/Offset-Wahrheit;
- `lib/readiness/temporal-projection.ts`: E5-A akzeptiert deshalb absichtlich nur bereits absolute `Z`-/Offset-Instants;
- Repository-Code-Suche fand keinen bestehenden IANA-/Timezone-/Temporal-Resolver und keine Timezone-Library;
- `public.airports` / aktueller OurAirports-Import führen keine Timezone-Spalte in Jetnitys Airport-Truth;
- die bestehende Duffel Offer-Response enthält bei Airport-Objekten `time_zone` als tz-database/IANA-Name, Jetnitys aktuelles Duffel-Schema/-Mapping verwirft dieses Feld aber.

Die kleinste verantwortbare nächste Änderung ist daher **nicht** schon die Zeitzonen-Umrechnung. Zuerst muss die explizit belegte Timezone-Provenance verlustfrei durch die bestehende Flight-/Route-Truth getragen werden.

## 2. Verifizierte Live-Baseline vor Task-Cut

Vor dem Slice live verifiziert:

- `main@6928ea637133ff91cfb207cfd5b1175fecbc9699`;
- E5-A Runtime + Continuity vollständig CLOSED;
- Main CI #1491 / Run `33404116202`: **SUCCESS** auf exakt diesem Main;
- Vercel Production `dpl_9gLJih2vBvzKExiikYy9vrix7Cuc`: **READY** auf exakt diesem Main;
- Ruleset `Jetnity main protection` / ID `21875372`: **active**, strict Required Checks, Conversation Resolution, merge-only, Bypass leer;
- keine aktuelle konkurrierende Runtime-PR; offene #52/#50/#40/#39/#28 sind historische Drafts;
- Issue #294 bleibt bindender Entry-Requirements-/Travel-Companion-Zieltracker;
- kein Supabase-/DB-/RLS-/Auth-Scope für E5-B1.

## 3. Externe Provider-Evidence – nur als bestehende Input-Eigenschaft

Duffels öffentliche API-Dokumentation beschreibt `time_zone` eines Airport-Objekts als Namen aus der tz database, z. B. `Europe/London`.

Diese Evidence rechtfertigt **nur**, das bereits vom existierenden Flight-Adapter gelieferte Feld zu erhalten. Sie ist **keine** Freigabe für:

- einen neuen Provider;
- einen zusätzlichen API-Call;
- einen Airport-Lookup;
- paid calls;
- eine Requirements-Provider-Aktivierung;
- eine Zeitzonen-Inferenz aus IATA/Land/Stadt.

## 4. Binding Product / Truth Rule

> **Timezone Truth darf in E5-B1 nur aus einer expliziten, validierten, serverseitig belegten Flight-Provider-Response für genau den Segment-Endpunkt stammen.**

Daraus folgen zwingend:

- keine Timezone aus IATA-Code raten;
- keine Timezone aus Country/City/Name ableiten;
- kein Default und kein `first match`;
- fehlende/ungültige Timezone bleibt `null` / unavailable;
- lokale Flight-Zeit bleibt lokale Flight-Zeit;
- keine versteckte UTC-Normalisierung;
- Browser-/Local-Storage-/Guest-Input darf keine Timezone-Hard-Truth etablieren.

## 5. Scope

### 5.1 Provider-neutraler Flight Contract

Der normalisierte `FlugSegment`-Contract erhält optionale, endpoint-spezifische Timezone-Fakten für:

- Departure Airport;
- Arrival Airport.

Benennung ist Implementation-owned, muss aber eindeutig zwischen Departure und Arrival unterscheiden und `null`/fehlend sauber tragen können.

Bestehende Felder bleiben unverändert:

- `departureDate`;
- `departureTime`;
- `arrivalDate`;
- `arrivalTime`.

Diese bleiben **lokale Wall-Clock-Werte**.

### 5.2 Duffel Adapter Boundary

Am bestehenden Duffel-Adapter:

- `origin` / `destination` als strukturierte Airport-Objekte dürfen deren explizites `time_zone` liefern;
- string-/IATA-only Form liefert **keine** Timezone;
- fehlende oder ungültige Timezone liefert `null`;
- keine zusätzliche Duffel-Anfrage;
- keine Airport-API-Nachladung;
- keine Provider-Rohdaten außerhalb der bestehenden normalisierten Domäne leaken.

Timezone-Input muss bounded/validiert sein. Die Validierung darf keinen absoluten Instant berechnen.

### 5.3 Server-proven Flight Snapshot → Trusted Route Itinerary

Die Timezone-Fakten müssen lossless durch den bereits serverseitig nachgewiesenen Account-Flow gelangen:

`Flight provider response -> normalized FlugOption -> server proof -> FlugMomentaufnahme -> trusted Route Itinerary -> trip_items.metadata`

Wichtig:

- der Browser liefert bei Account-Adoption weiterhin nur Identifier;
- Price/Time/Provider/Legs/Timezone kommen aus serverseitigem Nachweis;
- `metadata` bleibt Route-Itinerary-only, kein allgemeiner Datencontainer;
- bestehende Metadata-Größenbegrenzung bleibt erhalten.

### 5.4 Trusted vs. Untrusted Route Boundary

Die bestehende Trust-Grenze ist zwingend zu erhalten:

- Browser-/Local-Storage-/Guest-Route-Payload ist untrusted;
- untrusted Route Parsing/Kanonisierung darf injizierte Timezone-Felder nicht als Hard Truth übernehmen;
- serverseitig belegte persistierte Route-Metadata muss die Trusted-Timezone dagegen wieder lesen können;
- die bereits existierende Trusted-only-Semantik um `surfaceFromAirportCode` darf nicht regressieren.

Wenn dafür getrennte trusted/untrusted Parser-/Reader-Wege nötig sind, müssen sie die bestehende Domain wiederverwenden und dürfen keine zweite Route-Engine erzeugen.

### 5.5 Backward Compatibility

- vorhandene timezone-lose `flight_route_itinerary`-v1-Daten bleiben lesbar;
- keine Migration bestehender `trip_items`;
- keine Pflichtfelder, die alte Daten invalidieren;
- keine stille Itinerary-Versionserhöhung.

Falls ein Breaking Version Bump oder DB-Migration tatsächlich notwendig erscheint: **STOPP und Technical Lead informieren. Nicht eigenmächtig erweitern.**

## 6. Mandatory Regressions

Mindestens folgende Tests müssen vorhanden sein:

1. Duffel Segment mit strukturiertem Origin-Airport + validem `time_zone` erhält Departure-Timezone.
2. Duffel Segment mit strukturiertem Destination-Airport + validem `time_zone` erhält Arrival-Timezone.
3. String-/IATA-only Origin/Destination erhält `null`, keine Inferenz.
4. Fehlendes `time_zone` bleibt `null`.
5. Malformed/unbounded Timezone wird fail-closed und nicht Trusted Truth.
6. Normale lokale Flight-Datum-/Uhrzeit bleibt byte-/semantikgleich; kein `Z`, kein Offset wird erfunden.
7. Server-proven Flight-Snapshot trägt Timezone in die persistierbare Trusted Route Itinerary.
8. Trusted DB-Metadata-Lesepfad kann die Timezone wiederherstellen.
9. Untrusted Browser-/Local-Storage-/Guest-Itinerary mit injizierter Timezone wird gestript/rejected und erzeugt keine Trusted Timezone.
10. Guest→Account-/Route-Kanonisierung erfindet keine Timezone aus Airport-Refs.
11. Timezone-less Legacy-Itinerary bleibt kompatibel.
12. `surfaceFromAirportCode` Trusted-/Untrusted-Invarianten bleiben grün.
13. Route chronology/country/transit/fingerprint/local-time Invarianten bleiben grün.
14. Flight proof/account-adoption Invarianten bleiben grün.
15. E4/E5-A Tests bleiben unverändert grün.
16. vollständige Repository-Gates grün.

## 7. Hard Non-Scope

E5-B1 darf **nicht** enthalten:

- Local Date/Time + IANA -> UTC/Offset-Konvertierung;
- DST Gap-/Ambiguity-Resolver;
- `Temporal`-/Luxon-/date-fns-tz-/moment-timezone-Einführung nur zur Vorwegnahme von E5-B2;
- Trip/Route -> Event-Occurrence Resolver;
- `trip_departure`, `destination_arrival`, `transit_arrival`, `border_crossing` automatisch an Route-Events binden;
- E5-A automatisch aufrufen;
- konkrete Workspace-Deadline / Action Window UI;
- `too early | upcoming | actionable | overdue` State Machine;
- Task-/Completion-Persistenz;
- Reminder / Push / E-Mail / Notification;
- Airport-DB-Timezone-Spalte oder Airport-Import-Erweiterung;
- Supabase Migration / RLS / Ownership / Auth / MFA / AAL;
- neuer Provider / Vertrag / DPA / Secret / API Key / paid call / Live-Aktivierung;
- Requirements Provider Aktivierung; `requirementsProviderAus()` bleibt `null`;
- sensible Pass-/MRZ-/Scan-/Biometrie-/Health-Daten;
- Credential Ranking / automatische Passauswahl;
- E5-B2 oder sonstiger Folgeslice.

## 8. Shared-Contract-Grenzen

Potentiell berührt:

- `lib/flights/domain.ts`;
- `lib/flights/schema.ts`;
- `lib/flights/duffel/antwort.ts`;
- `lib/flights/duffel/mapping.ts`;
- `lib/flights/uebernahme.ts`;
- `lib/route/domain.ts`;
- `lib/route/schema.ts`;
- `lib/route/itinerary.ts`;
- `lib/route/metadata.ts`;
- ggf. enge Trusted-Metadata-/Route-Reader;
- zugehörige Tests.

Nicht automatisch berühren:

- Requirements Provider contracts;
- Readiness persistence;
- Trip DB schema;
- Supabase migrations;
- Auth/Account/Traveller contracts;
- UI außer notwendiger Type-Compile-Kohärenz.

Scope drift in einen dieser Bereiche: **STOPP und TL informieren.**

## 9. Product-Owner-Gate Assessment

Für E5-B1 ist kein besonderer Product-Owner-Gate ausgelöst:

- keine Production-Migration;
- keine RLS-/Ownership-Änderung;
- keine Auth-/MFA-/AAL-Änderung;
- keine neue sensitive Speicherung;
- kein neuer Provider/Vertrag/Secret/paid call;
- keine neue laufende Infrastruktur;
- kein Payment;
- kein Public Launch.

## 10. Agentenregeln

Exakter logischer Anzeigename:

**`Jetnity entry requirements trusted event time 1`**  
Generation: **1**

Agent:

1. liest `JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md`, Operating Standard, E5-A Closure/Handoff, diesen Task und Issue #327;
2. verifiziert `origin/main` vor Implementierung;
3. arbeitet ausschließlich in diesem Slice/PR;
4. ändert `docs/ACTIVE_WORK_STATUS.md` **nicht** – TL-owned;
5. liefert eigene:
   - `docs/ENTRY_REQUIREMENTS_TRUSTED_AIRPORT_TIMEZONE_E5B1_STATUS_2026-08-31.md`;
   - `docs/ENTRY_REQUIREMENTS_TRUSTED_AIRPORT_TIMEZONE_E5B1_HANDOFF_2026-08-31.md`;
   - `docs/ENTRY_REQUIREMENTS_TRUSTED_AIRPORT_TIMEZONE_E5B1_SELF_REVIEW_2026-08-31.md`;
6. aktualisiert `ARCHITECTURE.md` / `DECISIONS.md` nur soweit die tatsächlich implementierte Semantik es erfordert;
7. startet keinen Folgeslice;
8. setzt PR nicht Ready;
9. merged niemals;
10. stoppt vollständig nach Delivery für unabhängigen TL Exact-Head-Review.

Agent-Self-Review ist kein TL-PASS.

## 11. Gates vor Agent-Handoff

Pflicht:

- gezielte E5-B1-/Flight-/Route-Tests;
- vollständige Tests;
- Typecheck;
- Lint;
- Admin-API-Schutz;
- Schema-Bezug;
- dead/unreachable code;
- unused exports;
- unused packages;
- Production build;
- `origin/main` Drift/Ahead/Behind prüfen;
- Draft-PR aktualisieren;
- STOPP.

## 12. Technical-Lead Review danach

Der TL prüft auf exaktem finalem Head unabhängig insbesondere:

- Provider-response -> normalized-domain Data Loss;
- Trusted vs. untrusted Timezone-Provenance;
- kein IATA-/Country-/City-Fallback;
- kein verstecktes `Z` / UTC / DST-Resolver;
- Route-Itinerary backward compatibility;
- DB-Metadata Read/Write Trust Boundary;
- Guest/Account Unterschiede;
- `surfaceFromAirportCode` Regressionen;
- E4/E5-A Invarianten;
- Scope-/Non-Scope-Treue;
- CI/Vercel/Threads/Mergeability.

Jeder neue Head invalidiert alte Review-/Gate-Evidence.

Bei `CHANGES REQUIRED`: derselbe Agent / dieselbe Session nur für unmittelbare Review-Fixes, danach vollständiger Re-Review.

**Kein E5-B2 automatisch.**
