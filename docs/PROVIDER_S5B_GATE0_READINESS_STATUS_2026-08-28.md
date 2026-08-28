# Provider S5-B Gate 0 – Commercial Provenance Persistence Readiness – Status

Stand: 28. August 2026  
Status: **REVIEW-FIX FÜR 5453667424 / READ-ONLY ARCHITECTURE & READINESS ONLY / DRAFT / KEIN READY / KEIN MERGE / KEIN S5-B-RUNTIME / KEIN TW-8**  
Agent: `Cursor-Agent: Jetnity provider readiness audit 2`  
Auftrag: `docs/PROVIDER_S5B_GATE0_READINESS_TASK_2026-08-28.md`  
Review-Fix gegen Exact Head: `9674a658e697dd4dd1743046911cff1a29305b5c`  
Branch: `audit/provider-s5b-gate0-readiness-2026-08-28`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/141

> Gate 0 entsperrt TW-8 nicht. Dieses Dokument ist Architektur-/Readiness-Evidence. Es implementiert nichts.

`docs/ACTIVE_WORK_STATUS.md` wurde **nicht** geändert. Die Datei führt weiter den integrierten AP-5-S2-/PR-#138-Continuity-Stand. Eine Überschreibung dieser Current Truth wäre falsch.

---

## 0. Live-Rekonstruktion dieses Agenten

Rekonstruiert gegen `origin/main` bei Arbeitsbeginn, vor dem ersten Handoff und erneut vor diesem Review-Fix. `origin/main` blieb `b4c295e43021c22d863abb12702ef1ec3d18eb98`. Gates auf `9674a658` gelten nicht für den neuen Head. Siehe Handoff.

| Fakt | Wert |
| --- | --- |
| Task-Start-Baseline | `main @ b4c295e43021c22d863abb12702ef1ec3d18eb98` — `Merge PR #140: finalize chat handoff after PR #138` |
| Lokales `main` beim Boot | `f11a1753` — hinter Remote, **nicht** verwendet |
| `origin/main` nach Fetch | `b4c295e43021c22d863abb12702ef1ec3d18eb98` |
| Branch-Head bei Start | `6e1dbcecab25017e716d5c0e2c36124c285a761b` — nur Task-Datei |
| Merge-Base | `b4c295e4` = `origin/main` |
| Ahead / Behind bei Start | 1 ahead / 0 behind |
| Draft-PR | #141 OPEN, Draft, `MERGEABLE` |
| Task-Head CI | Actions Run `33178665628` SUCCESS auf exakt `6e1dbcec` |
| Task-Head Vercel | StatusContext `SUCCESS` / Deployment `2p5FpLQRoWa5vtmFJt678b2EoHW2` |
| `main` CI | Run `33174919835` SUCCESS auf exakt `b4c295e4` |
| Branch Protection | GitHub-API 403 in diesem Environment. Letzte kanonische Evidence: `protected=false`. **not independently re-verified by this agent.** |
| Supabase Production / develop | **not independently live-verified by this agent.** Keine sichere read-only Session in diesem Environment. Timestamped Handoff-Evidence unten, nicht als Live-Beweis. |
| Provider / Secrets / paid calls | nicht aktiviert; nicht aufgerufen |

Historische Dokumente, ältere PR-Bodies und S4–S8-Audit-SHAs sind Evidence ihres Zeitpunkts. Aktueller Code auf dieser Baseline und neuere kanonische Docs gewinnen.

---

## 1. Verbindliche Product Truth – unverändert

S5-A ist integriert (`lib/commercial-provenance`, ADR-0168, PR #83 / `3b317bc6`). S5-B ist nicht gestartet. S5-A hat ausdrücklich **keine Persistenz und keine `trip_items`-Felder** eingeführt.

Kanonisch bleibt:

- Commercial Provenance ist ein eigener provider-neutraler Vertrag, kein `UniversalOffer`.
- Flight / Hotel / Activity / Mobility / Rental bleiben domain-spezifisch.
- Snapshot ist niemals automatisch live.
- fehlende Freshness = `unknown`.
- keine stille Currency Conversion.
- Current Quote braucht belegte `quotedCurrency`.
- `requestedCurrency != quotedCurrency` bleibt ohne Conversion-Evidence ein Mismatch.
- User-/Manual-/LLM-Wahrheit darf Provider-Hard-Truth nicht erzeugen oder überschreiben.
- Actor ↔ Source ist fail-closed.
- User darf keine Provider-Live-/Provider-Snapshot-Herkunft behaupten.
- `externalRef` ist provider-scoped.
- Provider-Refresh verlangt belegte identische Domain + `providerId` + `externalRef`.
- `providerOfferId` ist in S5-A kein gleichwertiger Refresh-Schlüssel.
- fehlende Affiliate-Evidence bleibt `unknown`.
- widersprüchliche `amount`-/`amountStatus`-Paare werden abgewiesen.

TW-8 bleibt hinter Provider S5 **und** realer Commercial Provenance. Gate 0 ändert das nicht.

---

## 2. A. Persistenzinventar

Alle heute gefundenen kommerziell relevanten Persistenz-, Transformations-, Verwerf- und Lesepfade. Kein Pfad persistiert den S5-A-Vertrag `CommercialProvenance`.

### 2.1 Schema-Ist (`trip_items`)

Quelle: `supabase/migrations/20260817120000_reiseschema.sql` plus additive Migrationen. Typen: `types/supabase.ts`.

Kommerziell relevante Spalten:

| Spalte | Herkunft | Trust-Ist |
| --- | --- | --- |
| `price_amount` / `price_currency` | Basis-Schema; CHECK paarweise null oder beide gesetzt; Betrag ≥ 0; ISO-4217 | Kein Source/Actor/Freshness. Name suggeriert Quote, trägt sie nicht. |
| `provider` | Basis-Schema; 1–40 Zeichen | Unbelegte Zeichenkette. Kein `providerBelegt`. |
| `external_ref` | Basis-Schema; 1–200 Zeichen | Unbelegte Zeichenkette. Kein Provider-Scope. |
| `booking_url` | Basis-Schema; HTTPS, ≤ 2048 | URL-Format, keine Affiliate-Evidence. Domain-Actions setzen immer `null`. |
| `metadata` | JSON-Objekt, ≤ 8192 Zeichen | Kanonisch nur `routeItinerary` (`lib/route/metadata.ts`). Kein Commercial-Provenance-Slot. |
| `booking_status` / `booking_source` / `booking_confirmed_at` | `20260821100000` | Nur `user` oder null. Gebucht ≠ Provider-Bestätigung. |
| `mobility_evidence` / `rental_evidence` | S3-Migrationen | Nur `'user'` oder null. |

RLS: owner-only `user_id = auth.uid()`. Grants: `SELECT, INSERT, UPDATE, DELETE` an `authenticated`. Kein `anon`-Table-Grant.

**Flight-only Guard:** Trigger `trip_items_flug_handelsfelder_schuetzen` (`20260824180000`) nullt bzw. friert die fünf Flug-Handelsfelder, wenn `current_user` `authenticated` oder `anon` ist. Hotel / Activity / Mobility / Rental bleiben unberührt. Ein trusted Write ist im Trigger-Kommentar als späterer `SECURITY DEFINER`-Vertrag genannt und **existiert nicht**.

### 2.2 Pfade

#### PATH A — Guest Local Storage

- **Dateien:** `lib/trips/gastspeicher.ts`
- **Actor / Source:** Gast-Browser; User/UI; kein Server-Nachweis
- **Ziel:** `localStorage` `jetnity:reise:v3` / `jetnity:reisen-warteschlange:v3`
- **Felder:** volles `TripItem` inkl. Preis, Provider, Ref, Booking-URL, Booking-Status
- **Freshness / Currency / Affiliate:** nur `updatedAt` der Reise; Item-`priceCurrency`; keine Affiliate-Evidence
- **Overwrite:** voller Replace
- **RLS:** entfällt
- **Hard Truth?** **Ja für Hotel/Activity.** `gastHotelUebernehmen` / `gastAktivitaetUebernehmen` persistieren Provider+Preis lokal. Kommentare sagen ausdrücklich: keine serverseitige Verifikation.
- **Flight:** `gastFlugUebernehmen` wirft `unavailable` — fail-closed.
- **Manual Planpunkt:** kommerzielle Felder null.
- **Mobility/Rental manual:** User-Intake-Preis erlaubt.
- **Unknown?** Null bleibt Null. Kein S5-A-`unknown`.

#### PATH B — Guest → Account Promotion

- **Dateien:** `lib/trips/uebernahme.ts`, `lib/trips/abbildung.ts`, `lib/trips/anlegen.ts`, `lib/trips/handelsfelder-nutzlast.ts`
- **Actor:** authentifizierter User, Server Action
- **Transform:** `nutzlastOhneUnbewieseneHandelsfelder` streicht Flight/Stay/Activity: `price_*`, `provider`, `external_ref`, `booking_url`
- **Transfer / rental_car:** bewusst unberührt (S3-User-Intake, ADR-0166)
- **DB-Zweitpass:** `reise_anlegen` nullt **nur Flight**-Handelsfelder aus JSON
- **Ziel:** `public.reise_anlegen(jsonb)` → `trips` / `trip_stages` / `trip_days` / `trip_items`
- **Overwrite:** Idempotenz über `trips.client_ref`; Konflikt gibt bestehende ID zurück **ohne Item-Refresh**
- **Hard Truth?** Nein für Flight/Stay/Activity-Handelsfelder nach Strip. Transfer/Rental-**Betrag/Währung** bleiben als User-Intake. Transfer/Rental-`provider` / `external_ref` / `booking_url` werden vom Strip **nicht** entfernt und bleiben untrusted, falls gesetzt.
- **Unknown?** Gestrichene Felder werden DB-`null`, nicht `unknown`.

#### PATH C — Account Create (`/planen`)

- **Dateien:** `lib/trips/aktionen.ts` → `reiseAnlegen`; `lib/trips/anlegen.ts`
- **Commercial:** nur `trips.currency` / `trips.budget_amount`. Keine Item-Handelsfelder.
- **Hard Truth?** Nein.

#### PATH D — Reisevorschlag (LLM)

- **Dateien:** `lib/reisevorschlag/abbildung.ts`, `lib/reisevorschlag/aktionen.ts`
- **Source:** LLM, untrusted (ADR-0054)
- **Commercial:** alle Item-Handelsfelder explizit `null`. Nur Trip-Budget.
- **Hard Truth?** Nein.

#### PATH E — `public.reise_anlegen(jsonb)`

- **Aktuelle Repo-Logik:** `supabase/migrations/20260827010000_reise_anlegen_zero_stage_fail_closed.sql` (Vorgänger enthalten dieselbe Flight-Nullung)
- **Security:** `SECURITY INVOKER`; Execute nur `authenticated`
- **Flight:** JSON-Handelsfelder → `null`
- **Stay / Activity / Transfer / Rental / Note:** JSON-Handelsfelder **akzeptiert**, wenn vorhanden
- **Booking:** `booked` nur für flight/stay/transfer/rental_car; erzwingt `booking_source='user'`
- **Hard Truth?** Direkter RPC-Caller kann für **jedes Nicht-Flight-Kind** (`stay`, `activity`, `transfer`, `rental_car`, `note`) die Legacy-Handelsfelder aus JSON persistieren. Flight wird genullt. Transfer/Rental-**Betrag/Währung** als User-Intake bleibt beabsichtigt; `provider` / `external_ref` / `booking_url` sind dort trotzdem untrusted, wenn der Caller sie setzt.

#### PATH F — Direkte authenticated `trip_items` Writes

| Subpfad | Datei | Commercial Write | Heute |
| --- | --- | --- | --- |
| F1 Planpunkt | `lib/trips/aktionen.ts` `planpunktAnlegen` | keine Handelsfelder | sicher |
| F2 Booking-Status | `planpunktBuchungsstatusSetzen` | nur user-`booked` | User-Selbstaussage |
| F3 Flight | `lib/flights/aktionen.ts` | würde Preis/Provider/Ref schreiben; `booking_url=null` | `flugNachweisAusUmgebung()` = `null` → fail-closed. Selbst bei Nachweis würde der Trigger die Felder auf authenticated INSERT strippen. |
| F4 Hotel/Activity | `lib/hotels/aktionen.ts`, `lib/activities/aktionen.ts` | würde Handelsfelder schreiben | Nachweis-Factories `null` → fail-closed. **Kein DB-Trigger** für Stay/Activity. |
| F5 Mobility/Rental manual | `lib/mobility/aktionen.ts`, `lib/rental-cars/aktionen.ts` | User-Preis; App setzt `provider=null`; evidence=`user` | beabsichtigtes User-Intake **in der App**. Direct-DML kann trotzdem `provider` / `external_ref` / `booking_url` setzen. |
| F6 Route-Metadata | `lib/route/schreiben.ts` | nur `metadata.routeItinerary` | keine Commercial Truth |
| F7 Direct-DML | jeder `authenticated` Owner-Client | INSERT/UPDATE der Legacy-Handelsfelder | Nur Flight hat den DB-Trigger. Stay/Activity/Transfer/Rental/`note` sind nicht gegen Provider-Hard-Truth-Felder geschützt. |

Keine Route-Handler schreiben `trip_items`. Kein `SECURITY DEFINER` trusted commercial write gefunden. Technical-Lead-Review `5453667424` bestätigt read-only Production-Katalog: `authenticated` hat owner-scoped INSERT/UPDATE; nur Flight hat den Handelsfeld-Trigger. Dieser Agent hat Production nicht selbst katalogisiert.

#### PATH G — `public.reise_aendern(jsonb)`

- **Dateien:** `lib/reiseaenderung/nutzlast.ts`; Migration `20260820030000_reise_aendern.sql`
- **Commercial:** bewusst weggelassen. UPDATE ändert Titel/Notiz/Position/Zeiten/Kind/Refs, nicht Handelsfelder.
- **Hard Truth?** Kann Commercial nicht überschreiben.

#### PATH H — Metadata

Nur validierte Flight-`routeItinerary`. Header von `lib/route/metadata.ts`: kein allgemeiner Jutesack. Hotel-/Activity-`note` kann Preisprosa tragen (`lib/hotels/uebernahme.ts`, `lib/activities/uebernahme.ts`) — unstrukturiertes Duplikat, nicht querybar.

#### PATH I — Account Reads

- **Dateien:** `lib/trips/daten.ts`, `lib/trips/abbildung.ts`
- **Liest:** `priceAmount`, `priceCurrency`, `provider`, `externalRef`, `bookingUrl`, Booking-, Mobility-/Rental-Evidence
- **Transform:** Mobility/Rental-Evidence wird bei vorhandenen Fakten auf `'user'` gesetzt
- Empty vs Error: `lese()` / ADR-0037

#### PATH J — Trip Workspace Display

- **Dateien:** `lib/trips/detail.ts`, `components/trips/TripWorkspacePlan.tsx`, `TripWorkspaceDetail.tsx`
- **Persistenz:** keine (ADR-0167)
- **Trust-Label:** `itemTrust()` — vorhandene `provider`/`externalRef`/`bookingUrl` → `herkunft-vorhanden` mit Text *„kein geprüfter Live-Nachweis“*
- Search-UI zeigt ephemere Preise (`FlugKarte` u. a.), nicht persistierte Provenance

### 2.3 Nachweis-Layer – alle Domänen `null`

| Domäne | Factory | Account-Write wenn Nachweis existierte |
| --- | --- | --- |
| Flights | `lib/flights/nachweis.ts` → `null` | INSERT + Trigger-Strip ohne DEFINER |
| Hotels | `lib/hotels/nachweis.ts` → `null` | Direct INSERT würde funktionieren |
| Activities | `lib/activities/nachweis.ts` → `null` | Direct INSERT würde funktionieren |
| Mobility | `lib/mobility/nachweis.ts` → `null` | kein Provider-INSERT, nur Manual |
| Rental | `lib/rental-cars/nachweis.ts` → `null` | kein Provider-INSERT, nur Manual |

---

## 3. B. Schema-Fit ohne Änderung

Keine Schema-Lösung wird implementiert.

### 3.1 Verlustfrei persistierbar heute?

**Keine S5-A-Fakten verlustfrei.** Teilüberlappungen:

| S5-A | Nächste Spalte | Verlustfrei? |
| --- | --- | --- |
| `preis.amount` | `price_amount` | Nein — kein `amountStatus` |
| `waehrung.quotedCurrency` | `price_currency` | Nein — kein requested/mismatch |
| `quelle.providerId` | `provider` | Nein — kein `providerBelegt` / `sourceKind` |
| `referenz.externalRef` | `external_ref` | Nein — kein Provider-Scope |
| Zeit / Affiliate / Status / Persistenzklasse | — | nicht vorhanden. Actor gehört nicht in diese Liste (Write-Time, nicht S5-A-Feld). |

### 3.2 Nur unsauber in Metadata / Note

- `metadata.routeItinerary` ist Route, nicht Commercial.
- Hotel-/Activity-`note` kann `"280 CHF / Nacht"` o. ä. tragen.
- `trips.metadata.account_archive` ist Lifecycle, nicht Commercial.
- Ein `CommercialProvenance`-Objekt hat keinen formalen Metadata-Schlüssel. Ein stiller JSON-Dump wäre ein zweiter Truth-Store und würde das 8192-Zeichen-Limit mit der Itinerary teilen.

### 3.3 Überhaupt nicht

`sourceKind`, `sourceLabel`, `providerBelegt`, `providerOfferId`, `retrievedAt`, `observedAt`, `freshUntil`, `requestedCurrency`, `amountStatus`, `persistenz`, Affiliate-Block, `availabilityStatus`, `freshnessStatus`, `commercialStatus`, `vergleichsschluessel`.

`CommercialAkteur` ist **kein** persistiertes S5-A-Feld. `CommercialProvenance` enthält keinen Actor. Actor ist Write-Time-Kontext der Prüfer (`commercialProvenancePruefen({ akteur })`). Ein fehlender Actor-Column ist daher kein Schema-Loch im S5-A-Vertrag. Eine spätere Audit-/Write-Actor-Spalte wäre ein zusätzliches Audit-Konzept, nicht Teil von ADR-0168.

### 3.4 Spalten mit schwächerer Trust-Semantik als der Name

`price_amount`, `price_currency`, `provider`, `external_ref`, `booking_url`, `booking_status`, `booking_confirmed_at`, `mobility_evidence`, `rental_evidence`, `updated_at`. Details in Abschnitt 2.1.

### 3.5 Zweite / widersprüchliche Commercial-Truth-Stores

1. Guest-LocalStorage (Hotel/Activity-Providerpreise) vs Account-DB nach Strip.
2. `note`-Preisprosa vs Spalten (können null oder anders sein).
3. Ephemere Search-UI vs persistierte `trip_items`.
4. `trips.currency` / `budget_amount` vs Item-`price_currency` — keine Übereinstimmungspflicht.
5. Direkter `reise_anlegen`-RPC umgeht den Server-Action-Strip für alle Nicht-Flight-Kinds (Stay/Activity vollständig; Transfer/Rental Provider/Ref/URL; `note` ungehindert).
6. Zukünftiger Nachweis-INSERT vs Flight-Trigger ohne DEFINER-Pfad — Dual-Write-Risiko.

### 3.6 Fehlende Zeitpunkt / Freshness / Source / Actor / Status / Quote-Currency / Affiliate

Überall in der Persistenz, außer User-Booking-Zeit, Row-`created_at`/`updated_at` und Manual-Evidence=`user`. Workspace-Labels kompensieren nur in der UI und persistieren nicht.

---

## 4. C. Zieloptionen

Mindestens vier Varianten, Bewertung und begründete Empfehlung stehen in:

`docs/PROVIDER_S5B_GATE0_ARCHITECTURE_OPTIONS_2026-08-28.md`

Keine Variante ist hier entschieden oder implementiert.

Kurz: **Empfehlung = Option C** (eigene provider-neutrale Provenance-Relation, Ownership über `trip_item_id`; Legacy-Handelsfelder bleiben untrusted, bis eine geprüfte `persisted_snapshot`-Zeile existiert). Option A ohne Write-Authority-Fix wiederholt den Flight-Bypass für alle Nicht-Flight-Kinds. Option B (Metadata) erzeugt den gefährlichsten zweiten Store. Option D (nur User-Intake persistieren, Provider-Snapshots ephemer) schließt keinen TW-8-Gate. Domain+Provider+`externalRef` ist Refresh-/Match-Identität **am selben Item**, kein datenbankweites Unique.

---

## 5. D. Trust- / Write-Contract – Vorschlag, nicht implementiert

Drei Ebenen bleiben getrennt. S5-A-Prüfer (`commercialTruthUebernehmen`, `commercialAkteurQuellePruefen`, `commercialPersistiertenSnapshotPruefen`) bleiben die fachliche Quelle.

### 5.1 S5-A `CommercialAkteur` ≠ Runtime-Principal ≠ persistierte Provenance

| Ebene | Was sie ist | Was sie nicht ist |
| --- | --- | --- |
| `CommercialAkteur` | Write-Time-Trust-Kontext: `system`, `provider_adapter`, `user`, `assistant`, `llm`. Wird in die Prüfer **übergeben**. | Kein Feld von `CommercialProvenance`. ADR-0168 persistiert keinen Actor. |
| Runtime-Principal / Kanal | Authenticated Owner, Guest-Browser, privilegierter Serverpfad (nur Konzept). | Keine `CommercialAkteur`-Werte. `guest` und `privileged server path` gehören **nicht** zur S5-A-Enum. |
| Persistierte Provenance | S5-A-Felder (Quelle, Ref, Zeit, Währung, Preis, Persistenzklasse, Affiliate, Availability). | Keine Actor-Spalte. Eine spätere Audit-/Write-Actor-Spalte wäre ein **zusätzliches Audit-Konzept**, nicht Teil von ADR-0168. |

### 5.2 Write-Time-Matrix (`CommercialAkteur`)

| `CommercialAkteur` | Erlaubte SourceKinds | Darf Amount/Currency | Darf Provider/ExternalRef | Darf Freshness-Zeiten | Darf vorhandene Provider-Evidence ersetzen |
| --- | --- | --- | --- | --- | --- |
| `user` | `user_intake`, `manual` | ja, als Nutzerangabe | nein (`erfundene_provider_id`) | `observedAt` ja; `retrievedAt` nein | nein, wenn bestehend `providerBelegt` |
| `assistant` / `llm` | keine | nein | nein | nein | nein |
| `provider_adapter` | `live_api`, `provider_snapshot` | ja, mit Quote-Currency | ja, belegt | `retrievedAt` + `observedAt`; `freshUntil` nur mit Quellenbeleg | nur Refresh gleicher Domain+`providerId`+belegter `externalRef` **am selben Item** |
| `system` | `persisted_snapshot` | nur bereits belegte Snapshots prüfen/lesen | nicht erfinden | Snapshot-Zeit erhalten | kein User-Overwrite |

### 5.3 Runtime-Kanäle (nicht S5-A-Actor)

| Kanal | Typischer Write-Time-`akteur` | Grenze |
| --- | --- | --- |
| Authenticated Owner | `user` für Intake/Manual | Darf keine Provider-SourceKinds selbst behaupten. Direct-DML darf das heute noch für Nicht-Flight-Kinds. |
| Guest-Browser | `user`, nur lokal | Hotel/Activity-Providerfelder lokal möglich; **dürfen nicht** zu Account-Provider-Truth werden. Promotion strippt Flight/Stay/Activity-Handelsfelder. |
| Privilegierter Serverpfad | Konzept: `provider_adapter` beim Mint aus geprüfter Quote; später `system` beim Lesen des persistierten Snapshots | Nicht implementieren. Kein Service-Role im Produktpfad. Client-`sourceKind` wird durch Persistenz allein nicht vertrauenswürdig. |

### 5.4 Provider-Quote → persistierter Snapshot

S5-A trennt absichtlich `provider_adapter` + `live_api`/`provider_snapshot` von `system` + `persisted_snapshot`. `commercialPersistiertenSnapshotPruefen` erwartet den persistierten Snapshot-Vertrag.

Ein späterer S5-B-Write darf **kein** ephemeres `live_api`-Objekt speichern und es später nur deshalb vertrauen, weil es in der DB liegt. Konzept, nicht implementiert:

1. Nur eine **serverseitig validierte** Provider-Quote darf die persistierte Darstellung minten.
2. Die persistierte Darstellung muss `sourceKind='persisted_snapshot'` und `persistenz='snapshot'` erfüllen.
3. Dabei bleiben die ursprüngliche Provider-Identität, belegte `externalRef` und Abruf-/Beobachtungszeit als Truth-Evidence erhalten.
4. Der Write-Time-Actor beim Mint ist `provider_adapter`; das **Lesen** der persistierten Zeile prüft als `system` + `persisted_snapshot`.
5. Ein vom Client gelieferter `sourceKind` wird durch bloßes Speichern nicht zu Provider-Hard-Truth.

### 5.5 Refresh-Identität

Refresh/Match gilt zwischen **bestehender und vorgeschlagener** Provenance **desselben** `trip_item`: identische Domain + identische `providerId` + identische belegte `externalRef`. Fehlende Ref auf einer Seite ist kein Refresh. `providerOfferId` reicht nicht.

Das ist **keine** datenbankweite Eindeutigkeit. Dieselbe provider-scoped Ref darf auf mehreren `trip_item`s stehen (andere Reisen, andere Punkte, andere Nutzer). Ownership/Lifecycle einer Provenance-Zeile hängt an `trip_item_id`. Domain/Provider/Ref bleiben nicht-eindeutiger Lookup-/Vergleichsschlüssel, solange kein späterer Providervertrag stärkere Uniqueness beweist.

**Legacy ohne Provenance:** `unknown`. Kein stilles Backfill aus `price_amount`/`provider`. Workspace darf weiter `herkunft-vorhanden` zeigen, nie Current Quote / Live.

### 5.6 Bypass-Verhinderung analog Flight

Provider-Hard-Truth-Schutz muss **alle** kommerziellen Domänen und `note` abdecken, bevor Legacy-Spalten Hard Truth tragen dürfen. Server-Action-Strip allein reicht nicht: `authenticated` Direct-DML und `reise_anlegen`-JSON schreiben Nicht-Flight-Handelsfelder weiter.

Transfer/Rental-**User-Intake** von Betrag/Währung bleibt erlaubt und muss erhalten bleiben. Untrusted bleiben dort `provider`, `external_ref`, `booking_url`. `note` ist heute nicht gegen diese Legacy-Felder constrained.

Ein späterer trusted Write darf nicht über denselben authenticated INSERT-Grant laufen. Service-Role im Produktpfad bleibt verboten.

---

## 6. E. Freshness- / Statusmodell

S5-A trennt bereits:

- Freshness: `current` / `stale` / `unknown`
- Commercial Status: `current` / `stale` / `unknown` / `unavailable` / `error` / `partial`
- Availability: nur `unavailable` | `unknown` — **kein `available: boolean`**

`insufficient_context` ist im Commercial-Vertrag kein eigener Status. Für Commercial-Persistenz reicht S5-A. Traveller-/Readiness-`insufficient_context` nicht hier mischen.

Zeitfelder, die später semantisch nötig wären — **nicht jetzt bauen**:

| Feld | Rolle |
| --- | --- |
| `observedAt` | massgeblich für User-Intake/Manual; Pflicht in S5-A |
| `retrievedAt` | nur bei echtem Provider-Abruf |
| `freshUntil` | nur mit Quellenbeleg; nicht vor `retrievedAt` |
| Row-`updated_at` | Mutationszeit, **kein** Quote-Zeitpunkt |

Persistierter Snapshot bleibt `snapshotIstNieLive: true`. Current Quote ≠ Live-Verfügbarkeit.

---

## 7. F. Currency Contract

Persistenzanforderungen, nicht implementiert:

- `quoted` amount und `quotedCurrency` zusammen oder Amount-Status ehrlich `missing`/`error`
- `requestedCurrency` optional; fehlt sie, gilt Quote-Währung für Display
- `requested != quoted` ohne Conversion-Evidence = `mismatch`, nicht umgerechnet
- Conversion später nur mit eigener belegter Conversion-Evidence; S5-A setzt `conversionEvidence: 'absent'`
- `trips.currency` ist Reisewährung, keine Quote-Wahrheit

Kein FX-Provider, keine Conversion, keine externen Calls in Gate 0.

---

## 8. G. Affiliate / Booking / Revenue Truth

| Schicht | Heute | Darf nicht werden |
| --- | --- | --- |
| Commercial Search Snapshot | ephemere Domain-Optionen; Persistenz ohne Provenance | Live-Preis / Buchung / Provision |
| Booking Intent / Redirect | `booking_url` existiert als HTTPS-Slot; Domain-Actions schreiben `null` | belegte Buchung oder Affiliate-present |
| Belegte Buchung | nur User-`booking_status='booked'` + `booking_source='user'` | Provider-Bestätigung |
| Revenue / Commission | kein Trip-Item-Feld. Admin-`total_revenue_cents` ist Payments-Summary, nicht Affiliate | Commercial-Snapshot-Ableitung |

S5-A Affiliate: fehlende Evidence = `unknown`, nicht `absent`. `present` braucht Beleg (`partnerId` / `clickId` / `attributionRef`). Keine dieser Wahrheiten darf aus einer anderen erfunden werden.

---

## 9. H. Privacy / Retention / Sensitive Data

Commercial-Felder werden personenbezogen, sobald sie an Trip / User / später Traveller gekoppelt sind (Preis, Provider, Ref, Booking-URL, Zeiten, Orte in Note).

| Thema | Ist | Gate-0-Grenze |
| --- | --- | --- |
| Datenminimierung | Guest speichert Hotel/Activity-Providerpreise lokal; Account speichert User-Intake-Preise | Keine Pass-/MRZ-/Biometrie-Daten als Commercial-Targeting |
| Retention | kein Commercial-Retention-Vertrag | Spätere Snapshots brauchen eigene Retention, nicht „für immer Quote“ |
| Löschung / Archive | AP-4 archiviert Reisen (`trips.status`); kein Consumer-Datenexport / keine Kontolöschung (`docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`: missing) | Archive ist kein Commercial-Delete |
| Export | keine Consumer-Runtime | nicht erfinden |
| Guest → Account | Strip Flight/Stay/Activity-Handelsfelder | Provider-Snapshots nicht aus LocalStorage hochstufen |
| Analytics / Marketing | G3 darf Commercial erst nach realer Provenance nutzen | kein Marketing-Shadow-Store |

Keine Legal Claims. Traveller-Kontext ist für diesen Slice **nicht** als Commercial-Schlüssel relevant; Credentials nicht erheben.

---

## 10. I. Production- / Migration-Gate

Gate 0 legt keine Migration an und wendet nichts an.

Falls spätere S5-B-Arbeit Schema / Migration / RLS / REVOKE / privilegierte Writes braucht, greifen besondere Product-Owner-Gates:

- neue Production-Migration
- große produktive RLS-/Ownership-Änderung
- `SECURITY DEFINER` / REVOKE (P5/C2-Klasse, nicht „normaler Slice“)
- reale Provider / Secrets / paid calls bleiben zusätzlich gegated und sind **nicht** S5-B-Gate-0

**Vorbedingungen für ein späteres Apply (Konzept):**

1. Unabhängiger Technical-Lead-PASS der S5-B-Implementierung
2. Ausdrückliche Product-Owner-Freigabe für genau benannte Migrationsdateien und Reihenfolge
3. Production-Evidence vorher: aktuelle History, SHA der Dateien, Rollback-Plan, kein Sammel-Apply
4. Write-Authority und Dual-Truth-Regel entschieden
5. Kein TW-8-Start aus dem Apply allein

**Rollback-/Failure-Plan (Konzept):** additive Relation oder additive Spalten bevorzugt; kein Function-Rewind bereits angewendeter RPCs; Flight-Guard nicht entfernen, um Nicht-Flight-Handelsfelder zu „reparieren“.

**Niemals erneut anwenden (timestamped Handoff-Evidence, nicht von diesem Agenten live geprüft):**

- `20260824160000` / `20260824180000` — Production Gate A, bereits angewendet
- `20260826220000` → `20260826230000` → `20260826240000` → `20260827010000` — Gate B, kein Re-Apply
- `20260827170000_admin_aal2_data_plane_alignment` — exakt einmal
- `20260828015304_traveller_write_contract_integrity` — C1, kein Re-Apply
- historische/development-only `20260826090000` / `20260826052735` / develop `20260828120000` — nicht als Production-Replay

---

## 11. J. TW-8-Gate

**Warum Gate 0 TW-8 nicht entsperrt**

1. Build Order: TW-8 bleibt hinter Provider S5 **und** realer Commercial Provenance. S5-A allein reicht nicht. Gate 0 ist nur Readiness.
2. Es gibt keine persistierte S5-A-Provenance.
3. Es gibt keine Real-Commercial-Evidence (keine Provider, keine paid quotes, keine belegte Freshness).
4. Direct-DML/`reise_anlegen` können für alle Nicht-Flight-Kinds weiterhin unbelegte Provider-/Ref-/URL-Felder speichern.
5. Workspace darf vorhandene Herkunftsfelder nicht als geprüften Live-Nachweis zeigen — und tut das heute auch nicht.

**Mindestens später nötig, bevor TW-8 starten darf**

1. Entschiedene S5-B-Architektur (nicht dieser Draft)
2. Implementierter persistenter S5-A-Vertrag mit Write-Authority analog Flight-Guards, erweitert auf alle kommerziellen Domänen inkl. `note`; Transfer/Rental-User-Intake von Betrag/Währung bleibt erhalten. Persistierte Provider-Truth nur als `persisted_snapshot`, nicht als liegengebliebenes `live_api`.
3. Production-Apply nur nach PO-Gate, falls Schema/RLS/DEFINER
4. Read-Pfad, der Legacy ohne Provenance als `unknown` belässt
5. **Reale** Commercial-Provenance-Evidence: mindestens ein serverseitig nachgewiesener Snapshot mit `retrievedAt`/`observedAt`, belegter `quotedCurrency`, fail-closed Actor↔Source — nicht nur Schema
6. S4/S6–S8 bleiben eigene Gates; S6 Cost Guard bleibt Provider-Activation-Gate, nicht TW-8-Ersatz

Keine TW-8-Runtime-Datei wurde geändert.

---

## 12. Severity – getrennt

Keine fehlende Zukunftsfähigkeit als heutiger P0.

### 12.1 Aktuelle Production-Findings

| ID | Klasse | Aussage |
| --- | --- | --- |
| `S5B-G0-P2-01` | **P2 residual trust** | Authenticated Direct-DML und `reise_anlegen`-JSON können für alle Nicht-Flight-Kinds (`stay`, `activity`, `transfer`, `rental_car`, `note`) Legacy-Handelsfelder ohne Nachweis schreiben. Nur Flight hat den DB-Trigger. Transfer/Rental-Betrag/Währung als User-Intake ist beabsichtigt; `provider` / `external_ref` / `booking_url` und `note`-Handelsfelder sind trotzdem untrusted. Owner-scoped, kein Live-Provider, UI disclaimed. Nicht P0. Muss vor Provider-Hard-Truth geschlossen werden. |
| `S5B-G0-P2-02` | **P2 dual-display** | Hotel-/Activity-`note` kann Preisprosa tragen, unabhängig von Spalten. |
| `S5B-G0-P3-01` | **P3 hygiene** | `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` ist hinter `main` (behauptet S3 nur auf Feature-Branch). Historische Evidence; dieser Slice korrigiert die Datei nicht still. |

Kein neues Production-P0. Kein neues Production-P1-Incident. Fehlende Snapshot-Zeit ist kein heutiger Produktionsausfall.

### 12.2 Pre-TW8 Gate / Blocker

| ID | Klasse |
| --- | --- |
| `S5B-G0-TW8-GATE-01` | Gate 0 und fehlende persistierte S5-A-Provenance. TW-8 bleibt geschlossen. |
| `S5A-TW8-GATE-01` / `S4S8-TW8-GATE-01` | unverändert bestätigt |

### 12.3 Pre-Provider-Activation Gate

| ID | Klasse |
| --- | --- |
| `S5B-G0-ACT-GATE-01` | Keine Provideraktivierung, keine Secrets, keine paid calls. S6 persistenter Cost Guard bleibt Activation-Gate. |
| `S4S8-ACT-GATE-01` | unverändert bestätigt |

### 12.4 Architekturentscheidung / PO-Gate

| ID | Klasse |
| --- | --- |
| `S5B-G0-ARCH-01` | Wahl zwischen Optionen A–D. Nicht in Gate 0 entscheiden/implementieren. |
| `S5B-G0-PO-MIG-01` | Jede spätere Schema-/RLS-/REVOKE-/DEFINER-Arbeit braucht ausdrückliches PO-Gate. |

### 12.5 Hygiene / Future Hardening

Stale Slice-Doku, fehlender Consumer-Export/Delete, `main` Branch Protection zuletzt `protected=false` (nicht von diesem Agenten live re-verifiziert).

---

## 13. Untersuchte Dateien (Auszug)

Runtime/Schema nur gelesen, nicht geändert:

- `lib/commercial-provenance/*`
- `lib/trips/{schema,gastspeicher,handelsfelder-nutzlast,anlegen,aktionen,daten,abbildung,detail,buchung}.ts`
- `lib/{flights,hotels,activities,mobility,rental-cars}/{aktionen,nachweis,uebernahme}.ts`
- `lib/reisevorschlag/abbildung.ts`, `lib/reiseaenderung/nutzlast.ts`, `lib/route/{metadata,schreiben}.ts`
- `supabase/migrations/20260817120000_reiseschema.sql`
- `20260821100000`, `20260821120000`, `20260821200000`, `20260822150000`, `20260824160000`, `20260824180000`, `20260827010000`
- `types/supabase.ts`, `DECISIONS.md` ADR-0054/0060/0156/0157/0161/0166/0168

---

## 14. STOPP

Draft bleibt Draft. Kein Mark Ready. Kein Merge. Kein Folge-Slice. Kein S5-B Runtime. Kein TW-8.

Nächster Schritt: unabhängiger Technical-Lead-**Re-Review** von Draft-PR #141 auf dem neuen Exact Head. Agent-Self-Review ist keine Freigabe. Alte Gates auf `9674a658` sind ungültig.
