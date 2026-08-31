# Entry Requirements E5-B3A – Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity entry requirements event provenance persistence 1`**, Generation 1  
Session: `bc-e7a50347-1c66-4cd1-bbd2-979b89590a40`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

Geprüfter vorheriger TL-Head: `79dda7593bb9fbb20c36dc54348920e994da6823`  
P2-Fix-Head dieser Review-Runde: `f918dc0ed58b4962389a860d5a1b6bf74513cd1b`  
Docs-Commit danach erzeugt einen neuen Head. Alte Exact-Head-Evidence verfällt dann.

## 1. Auftrag gegen Diff

Auftrag: Issue #338 / E5-B3A repository-only Flight-Event-Provenance auf Draft-PR #340, plus enger P2-Fix aus TL CHANGES REQUIRED: verpflichtende konkrete `external_ref`.

Geänderte Agent-Dateien gegenüber Pre-agent-Head `8fec368c`:

- `supabase/migrations/20260831190000_trip_item_flight_event_provenance.sql`
- `lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts`
- diese drei Delivery-Docs nach dem Implementation-Commit

Geprüft:

- eigene Relation statt `trip_items.metadata` oder Commercial Provenance
- Occurrence-Identität Item × Leg × Segment × Endpoint kann nicht kollabieren
- lokale Wanduhr, IANA-Zone und Instant getrennt
- Event-Ref nur serverseitig
- `external_ref` Pflicht; `provider_belegt=true` ohne konkrete Provider-Referenz unmöglich
- Owner-Read, kein Direct-Write, kein anon
- privater SECURITY-DEFINER-Writer, `search_path=''`, NOLOGIN-Rollen
- Runtime-Gate default false/unallocated und im Writer erzwungen
- DELETE-all vor INSERT, leerer Satz löscht stale Zeilen
- SQL ist kein zweiter DST-/Timezone-Resolver
- keine Runtime-Änderung an Flight/Readiness/Route/API/Workspace
- `types/supabase.ts` nicht als Live-Relation vorgetäuscht
- `flugNachweisAusUmgebung()` bleibt `null`
- `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md` nicht editiert
- kein Production-Apply, kein Runtime-Write, kein Folgeslice

Traveller-Context-Intelligence: für diesen Slice **nicht relevant**. Es werden keine Citizenships, Dokumente oder Residence gelesen oder gespeichert.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Sitzt Event-/Timezone-Truth in `trip_items.metadata`? | Nein. Eigene Relation. Writer schreibt `trip_items` nicht. |
| Wurden Commercial-Provenance-Spalten überladen? | Nein. Keine price/affiliate/currency-Felder. Commercial-SQL unverändert. |
| Können zwei Endpunkte derselben IATA kollidieren? | Nein. Unique `(trip_item_id, leg_index, segment_index, endpoint)`. Collision reject im Writer. |
| Kann `departure` eine Arrival-Zeit tragen, ohne Endpoint-Trennung? | Nein. Endpoint ist geschlossenes `departure\|arrival` und Teil der Identität. |
| Werden lokale Zeit und Instant vermischt? | Nein. `local_date`/`local_time` vs `time_zone` vs `event_instant`. Kein `AT TIME ZONE`, kein `\|\| 'Z'`. |
| Wird Zone aus IATA/Land/Stadt geraten? | Nein. Kein `airports`-Join, kein `flug_route_punkt_aus_iata`. Zone nur Syntaxgrenze. |
| Kann ein Client `eventRef` als Provenance adeln? | Nein. Top-level und Occurrence-Keys `eventRef`/`event_ref`/`occurrence_event_ref` werden rejected. Ref wird nur aus Item+Identity+IATA gemintet. |
| Kann `provider_belegt=true` ohne konkrete Provider-Referenz persistieren? | Nein. `external_ref text not null` + nonblank-Check + `provider_source_ref`. Writer wirft `missing_external_ref` vor jedem DELETE. `occurrence_event_ref` zählt nicht als Source-Referenz. |
| Kann authenticated/anon direkt schreiben? | Nein. Revoke ALL, nur SELECT an authenticated, keine Write-Policy. |
| Ist der Writer PostgREST-erreichbar? | Nein. `jetnity_internal` nicht in `[api].schemas`. EXECUTE nur NOLOGIN-Writer. |
| Ist Production-Runtime schon allokiert? | Nein. Gate-Insert `false`/`null`. Writer wirft `production write path unallocated`. |
| Kann ein Refresh alte Occurrences stehen lassen? | Nein. `DELETE WHERE trip_item_id = _item.id` vor jedem INSERT, inkl. leerem Satz. |
| Wird SQL zur zweiten DST-Engine? | Nein. Instant nur aus explizitem Offset-String via `::timestamptz`. Keine Zonenrechnung. |
| Wurde `FlugSegment` / E5-A / Route / Nachweis aktiviert? | Nein. Diff gegen `main` für diese Runtime-Pfade ist leer. Nachweis bleibt `null`. |
| Täuscht `types/supabase.ts` eine live Tabelle vor? | Nein. Datei unverändert, enthält den neuen Namen nicht. |
| Wurde Production mutiert? | Nein. Kein `apply_migration`, kein `db push`, kein `db:anwenden`, kein live GRANT/DML in dieser Session. |
| Wurde ein App-/API-Write-Pfad gebaut? | Nein. Kein `.from('trip_item_flight_event_provenance')`, kein RPC im Anwendungscode. `check:schema-bezug` bleibt gegen die alten Typen grün. |

## 3. Direct-Write-Schutz

Technisch erzwungen, nicht nur kommentiert:

1. `REVOKE ALL` auf der Relation von `public`, `anon`, `authenticated`, `service_role`
2. nur `GRANT SELECT` an `authenticated`
3. eine RLS-Policy, nur `FOR SELECT`
4. Writer nicht in `public`, `search_path=''`, `SECURITY DEFINER`
5. `REVOKE ALL` + `GRANT EXECUTE` ausschließlich an `jetnity_flight_event_writer`
6. Writer- und Runtime-Rollen `NOLOGIN`; Runtime `NOINHERIT`
7. kein GRANT der Rollen an `anon` / `authenticated` / `service_role`
8. fail-closed bei `auth.uid() is null`, fremdem Owner und Non-Flight
9. unvalidated raw / camelCase / `trusted` / `providerProven` reject
10. Gate-Check vor jedem Write

## 4. Event-Ref-Provenance

- Client darf keine Ref liefern.
- Writer baut `jetnity.flight_event.v1:{trip_item_id}:{leg_index}:{segment_index}:{endpoint}:{iata}`.
- Unique-Constraint auf `occurrence_event_ref`.
- Die Ref ist damit an dieselbe Identität gebunden, die E5-B1R/E5-B2A ephemeral schon tragen, und später als E5-A-`eventRef` verwendbar.
- `occurrence_event_ref` ist **keine** Provider-Source-Referenz.
- Konkrete Provider-Belegreferenz ist `external_ref` (analog `FlugOption.externalRef`): `NOT NULL`, nonblank 1–200, Writer-fail-closed vor Snapshot-Replacement.
- Eine bloße persistierte Zeichenkette gilt trotzdem nicht als Provider-Beweis, solange der Write-Pfad nicht server-owned und gegatet ist.

## 5. Atomare Snapshot-Semantik

In derselben Funktion, nach vollständiger Validierung inklusive `external_ref`:

1. `DELETE FROM public.trip_item_flight_event_provenance WHERE trip_item_id = _item.id`
2. INSERT des neuen Satzes
3. gemeinsame `snapshot_version` pro Write
4. `SELECT … FOR UPDATE` auf dem Flight-Item serialisiert parallele Writes
5. Fehler nach DELETE rollen in derselben Transaktion zurück

Ein späterer Refresh mit weniger oder null eindeutig resolvten Endpunkten kann alte Zeilen nicht still stehen lassen.

## 6. Production unberührt / kein Runtime-Write

Beweis dieser Session:

- Arbeitsbaum nach Gates clean; keine Apply-Artefakte
- keine Apply-/Push-/anwenden-Kommandos in den Terminals
- `types/supabase.ts` ohne neue Relation
- kein Anwendungscode spricht die neue Tabelle oder den neuen RPC an
- `flugNachweisAusUmgebung()` ist weiterhin `return null`
- Gate-Zeile wird mit `production_write_path_allocated=false` angelegt
- GitHub CI wendet keine Supabase-Migrationen an

Diese Session hat Production-Supabase **nicht** live abgefragt. Der Pre-Cut-Read-only-Check des Technical Lead bleibt die letzte Production-Evidence. Ich behaupte keine neue Live-Katalogprüfung.

## 7. Bewusste Schwächen, die bleiben

- Der Vertrag ist repository-only. Ohne späteres PO-Apply existiert die Tabelle nicht in Production.
- SQL akzeptiert syntaktisch gültige, aber nicht Intl-verifizierte IANA-Namen. Das verhindert einen zweiten Resolver und verlangt Qualität vom zukünftigen Trusted-Mint.
- Instant und lokale Wanduhr werden nicht gegeneinander geprüft. Eine inkonsistente Trusted-Nutzlast könnte beide Fakten speichern. Der Schutz sitzt in der noch nicht gebauten Mint-Schicht, nicht in SQL.
- Kein lokales PostgreSQL-Execute. RLS/Grant-Verhalten ist vertraglich spezifiziert, nicht gegen eine laufende Instanz beobachtet.
- Dieses Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

## 8. Proaktive Residual-Empfehlung (nicht ausgeführt)

**Beobachtung:** Der Writer ist strenger als S5-B, weil er das geschlossene Runtime-Gate selbst prüft. Nach einem späteren Production-Apply bleibt Schreiben trotzdem unmöglich, bis Gate **und** Invoker-Rolle allokiert sind.

**Empfehlung:** So lassen. Nicht in E5-B3A aufweichen. Jede Allokation ist ein eigenes Product-Owner-Gate. Keine App-Mint, keine E5-A-Bindung, kein lokales Apply ohne neuen Auftrag.

**Priorität:** später / nach TL-PASS. Product-Owner-Gate erst bei Production-Wirkung.

## 9. Urteil des Autors

P2-Fix scope-treu: `external_ref` ist jetzt die verpflichtende Provider-Source-Referenz. Lokale Gates auf `f918dc0e...` grün: `npm test` 3005/3005, Typecheck, Lint 0/137, Production-Build, Hygiene. `origin/main` unverändert `3df9af4d...`, 0 behind.

**Unabhängiger Technical-Lead-Review:** ausstehend auf dem **finalen** Head. PR bleibt Draft. Kein Ready, kein Merge, kein Production-Apply, kein E5-B3B.
