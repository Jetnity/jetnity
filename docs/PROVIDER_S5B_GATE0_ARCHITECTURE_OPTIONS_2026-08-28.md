# Provider S5-B Gate 0 – Architecture Options

Stand: 28. August 2026  
Status: **REVIEW-FIX FÜR 5453748651 / PROPOSED / NOT ACCEPTED / NOT IMPLEMENTED**  
Agent: `Cursor-Agent: Jetnity provider readiness audit 2`  
Bezug: `docs/PROVIDER_S5B_GATE0_READINESS_STATUS_2026-08-28.md`  
ADR-0168 bleibt die kanonische S5-A-Entscheidung. Dieses Dokument deutet sie nicht um.

> Keine Production-Entscheidung. Keine Schemaänderung. Keine Runtime.

---

## 0. Entwurfsgrenzen

Jede spätere S5-B-Variante muss:

- den S5-A-Vertrag persistieren, nicht durch ein `UniversalOffer` ersetzen;
- Flight/Hotel/Activity/Mobility/Rental fachlich getrennt lassen;
- Actor↔Source fail-closed halten — Actor nur als Write-Time-Kontext, nicht als persistiertes S5-A-Feld;
- Legacy ohne Provenance als `unknown` belassen;
- Guest→Account nicht zu Provider-Hard-Truth machen;
- Browser-/RPC-/Direct-DML-Bypässe analog S2-B1/B2 schließen, bevor Spalten Hard Truth tragen;
- keinen zweiten widersprüchlichen Commercial-Truth-Store erzeugen;
- Service-Role im Produktpfad vermeiden;
- TW-8 nicht implizit entsperren.

`trip_items.metadata` ist kanonisch Flight-`routeItinerary` und auf 8192 Zeichen begrenzt. Das ist kein leerer Beutel.

---

## 1. Option A – Minimale additive Felder auf `trip_items`

**Idee:** S5-A-Mindestfelder als neue Spalten auf der bestehenden Zeile: z. B. `source_kind`, `provider_belegt`, `observed_at`, `retrieved_at`, `fresh_until`, `requested_currency`, `amount_status`, Affiliate-Status plus enge CHECKs. Bestehende `price_*` / `provider` / `external_ref` werden als Träger weiterverwendet.

### Bewertung

| Kriterium | Bewertung |
| --- | --- |
| Truth Integrity | Schwach, solange `authenticated` INSERT/UPDATE und `reise_anlegen` Nicht-Flight-Handelsfelder weiter schreiben. Additive Spalten ohne Write-Authority-Fix machen Fake-`source_kind=live_api` möglich; Persistenz allein macht `live_api` nicht zu `persisted_snapshot`. |
| Domain Isolation | Gut, wenn Domain weiter `trip_items.kind` bleibt. Risiko: eine „commercial“-Spaltenmenge auf allen Kinds wirkt wie ein Offer-Monolith. |
| Queryability | Hoch — native Spalten, filterbar. |
| RLS / Ownership | Folgt bestehendem Owner-RLS. Privileged Write ist damit **nicht** gelöst: Owner darf heute schon schreiben. |
| Guest → Account | Mapping einfach. Strip-Regeln müssen SourceKind/Provider-Claims mit streichen, sonst wird LocalStorage zu Fake-Provider-Truth. Actor ist kein persistiertes Feld. |
| Update / Refresh | Refresh/Match gilt am **selben** Item (Domain+Provider+belegte Ref). Kein datenbankweites Unique über `(domain, provider_id, external_ref)`. History fehlt. |
| Retention / Privacy | Eine Zeile = aktuelle Aussage. Keine Snapshot-Historie; Löschen folgt Trip-Delete/Archive. |
| Migration Complexity | Mittel: additive Spalten + CHECKs + Trigger-Erweiterung. Production-PO-Gate. |
| Rollback | Additive Spalten sind rückziehbar, Trigger/RPC-Rewrites nicht leicht. |
| Backfill / Legacy Unknown | Pflicht: bestehende `price_*` **nicht** zu `quoted`/`current` backfillen. Default `unknown`. |
| Indexing / Performance | Gut für „current row“. Kein History-Wachstum. |
| Native / API-Readiness | Eine Zeile ist mobilfreundlich. Contract muss trotzdem serverseitig geprüft werden. |
| Admin / Observability | Einfacher Anschluss, aber kein Audit-Log der Quote-Wechsel. |
| Provider Neutrality | Haltbar, wenn keine Provider-SDK-Felder. |
| UniversalOffer-Gefahr | Mittel — dieselben Commercial-Spalten auf jedem Kind. |
| Testbarkeit | Gut testbar, wenn Write-Guards existieren. |
| Multi-Provider-Konflikte | Schlecht — eine Zeile kann Konflikt nicht stehen lassen. |
| Kosten / Betrieb | Niedrig (keine neue Tabelle), aber Production-Migration. |

**Passt wenn:** nur genau ein aktueller Snapshot pro Item gewollt ist **und** gleichzeitig ein privilegierter Write-Pfad plus die Guard-Matrix aus dem Status §5.6 gilt (Stay/Activity: ganze Legacy-Menge untrusted; Transfer/Rental: User-Intake-Preis erhalten; `note`: Handelsfelder leeren, keine Domain).

**Passt nicht wenn:** Write-Authority unverändert bleibt. Dann ist A eine Namenslüge.

---

## 2. Option B – Strukturierte Provenance in begrenzter Metadata

**Idee:** `CommercialProvenance` als namespaced JSON, z. B. `metadata.commercialProvenance`, mit App-Zod-Prüfung. Keine oder fast keine neuen Spalten.

### Bewertung

| Kriterium | Bewertung |
| --- | --- |
| Truth Integrity | Schlecht. `metadata` ist vom Owner schreibbar (`lib/route/schreiben.ts` patched metadata). Flight-Itinerary-Trigger kanonisiert nur Route, nicht Commercial. |
| Domain Isolation | Scheinbar gut, faktisch ein generischer Beutel neben Route. |
| Queryability | Schlecht — kein zuverlässiges SQL über Source/Freshness/Currency. |
| RLS / Ownership | Gleicher Owner-Write wie heute. |
| Guest → Account | JSON würde mitreisen, sofern nicht gestrichen. Heutiger Strip kennt diesen Schlüssel nicht. |
| Update / Refresh | JSON-Replace; Konflikte/History unsauber. |
| Retention / Privacy | JSON in derselben 8192-Grenze wie `routeItinerary`. Große Itineraries + Provenance kollidieren. |
| Migration Complexity | Scheinbar gering, fachlich hoch: stiller zweiter Store neben `price_amount`. |
| Rollback | JSON-Key entfernen ist einfach; verdorbene Dual-Truth nicht. |
| Backfill / Legacy Unknown | Verführerisch, `price_amount` in JSON zu kopieren. Das wäre Fake-Provenance. |
| Indexing / Performance | GIN möglich, teuer, wenig hilfreich. |
| Native / API-Readiness | Instabiles JSON-Contract-Risiko. |
| Admin / Observability | Schwer auswertbar. |
| Provider Neutrality | Haltbar im Typ, nicht in der Speicherung. |
| UniversalOffer-Gefahr | Hoch — ein JSON-Objekt „ist das Offer“. |
| Testbarkeit | Viele Bypass-Pfade. |
| Multi-Provider-Konflikte | Nur als Array im JSON, ungeprüft. |
| Kosten / Betrieb | Keine neue Tabelle, aber hohes Reparaturkosten-Risiko. |

**Ablehnung als Zielarchitektur empfohlen.** Höchstes Dual-Truth- und Bypass-Risiko. Verletzt den bestehenden Metadata-Vertrag (`lib/route/metadata.ts`: kein allgemeiner Jutesack).

---

## 3. Option C – Eigene provider-neutrale Provenance-Relation

**Idee:** Neue Relation, z. B. `trip_item_commercial_provenance`, 1:1 (current) oder später 1:n (history). Ownership und Lifecycle hängen an `trip_item_id` (plus folgendem `trip_id`/`user_id`). `trip_items` bleibt der Reisegraph. Die S5-A-Domain folgt nur den fünf kommerziellen Kinds, nicht `note`. Die Relation trägt **persistierte S5-A-Evidence**: Quelle, Referenz, Zeiten, requested/quoted Currency, Amount + `amountStatus`, Affiliate, `availabilityStatus`, Persistenzklasse, Vergleichsschlüssel. **Kein Actor-Feld.** **Keine** autoritative `CommercialBewertung` (`freshnessStatus`, `commercialStatus`, `currencyStatus`, `darfAlsCurrentQuoteDargestelltWerden`) — die wird zur Lesezeit mit `nowMs` neu berechnet. Eine denormalisierte Status-Spalte wäre Cache, nicht Source of Truth. Domain-Enum bleibt S5-A (`flights`/`hotels`/`activities`/`mobility`/`rental_cars`); `note` wird nicht aufgenommen.

Mint-Regel: nur eine serverseitig validierte Provider-Quote darf die Zeile erzeugen. Persistiert wird `sourceKind='persisted_snapshot'` / `persistenz='snapshot'`, unter Erhalt von Provider, belegter `externalRef` und Abruf-/Beobachtungszeit. Ein gespeichertes ephemeres `live_api` wird dadurch nicht vertrauenswürdig. Client-`sourceKind` nie durch Persistenz allein.

Legacy-Spalten `price_amount` / `provider` / `external_ref` / `booking_url`:

- bleiben vorerst stehen;
- gelten **nicht** als Provider-Hard-Truth;
- dürfen höchstens User-Intake oder untrusted Display sein;
- Current Quote nur, wenn die **zur Lesezeit** neu berechnete Bewertung das erlaubt, nicht weil eine Status-Spalte `current` speichert.

Writes auf die Provenance-Relation: **kein** `authenticated` INSERT/UPDATE der Rohspalten. Konzept: REVOKE Direct-Write + eine enge privilegierte Funktion **oder** Trigger, der nur einem serverseitig gesetzten Kontext vertraut. Service-Role im Produktpfad bleibt verboten. Das ist ein späteres PO-Gate, kein Gate-0-Bau.

### Bewertung

| Kriterium | Bewertung |
| --- | --- |
| Truth Integrity | Am stärksten, weil Write-Authority von Owner-DML getrennt werden kann. S5-A-Prüfer bleiben die Gate-Funktion. |
| Domain Isolation | Gut — keine Flight-Felder in der Relation; Domain nur als Enum analog S5-A. |
| Queryability | Hoch für Evidence (Provider, Ref, Zeiten, Amount-Status). Abgeleiteter Freshness-/Commercial-Status ist keine persistierte Wahrheit und kein Unique-Index-Ziel. |
| RLS / Ownership | Primärschlüssel/Lifecycle: `trip_item_id`. `trip_id`/`user_id` folgen `trip_items`. SELECT owner-only. WRITE nicht owner-beliebig. |
| Guest → Account | Keine Guest-Provider-Zeile. Promotion mintet keine Provider-Provenance und kein `persisted_snapshot` aus LocalStorage. User-Intake optional separat. |
| Update / Refresh | Refresh/Match am selben Item: Domain + `providerId` + belegte `externalRef`. **Kein** Unique-Constraint über diese drei Spalten — dieselbe Ref darf auf mehreren Items stehen. Lookup/Vergleich darf nicht-eindeutig bleiben, bis ein späterer Providervertrag Uniqueness beweist. 1:n später möglich, nicht jetzt nötig. |
| Retention / Privacy | Eigene Retention/Delete mit Trip. Quote-History kann begrenzt werden. Kein Pass/MRZ. |
| Migration Complexity | Höher: neue Tabelle, RLS, Grants, ggf. privilegierte Funktion. PO-Gate. |
| Rollback | Tabelle droppen/leer lassen, ohne Flight-Guard oder `reise_anlegen` zurückzudrehen. |
| Backfill / Legacy Unknown | Keine Zeile = `unknown`. Kein Copy aus `price_amount`. |
| Indexing / Performance | Ein Join. Für Workspace tragbar. History erst bei Bedarf. |
| Native / API-Readiness | Klarer Read-Contract; Server prüft, Client zeigt Bewertung. |
| Admin / Observability | Anschluss an spätere S7 ohne Offer-Monolith. |
| Provider Neutrality | Genau der S5-A-Schnitt. |
| UniversalOffer-Gefahr | Niedrig, wenn keine domain-spezifischen Offer-Felder einwandern. |
| Testbarkeit | Write-Time-Matrix `CommercialAkteur`×Source×Kind plus Bypass-Tests analog S2. Actor nicht als persistiertes Feld testen. |
| Multi-Provider-Konflikte | 1:1 reicht für „current“. Konflikt mehrerer Quellen braucht 1:n oder separate Konflikt-Sicht — später, nicht Gate 0. |
| Kosten / Betrieb | Eine Tabelle, kein neuer Vendor. Production-Migration ist der eigentliche Kosten-/Gate-Punkt. |

**Passt wenn:** S5-B echte persistierte Commercial Truth werden soll, ohne `trip_items` weiter zu überladen.

**Nicht in Gate 0 bauen.** Braucht Architektur-Annahme + späteres PO-Migrationsgate.

---

## 4. Option D – Provider-Snapshots ephemer; nur ehrliches User-Intake persistieren

**Idee:** Keine Provider-Quote in der DB, bis Aktivierung + Nachweis existieren. Search bleibt ephemer. Ein späteres Mint erzeugt `persisted_snapshot`-Evidence, nicht liegengebliebenes `live_api`. Bewertung bleibt Lesezeit.

Konzeptionelle Guard-Matrix — **nicht** als „nur Provider/Ref/URL schützen“ implementierbar:

| Kind | Konzept |
| --- | --- |
| `stay` / `activity` | Untrusted Direct-RPC/DML mintet **keine** Provider-Hard-Truth in der ganzen Legacy-Menge, einschliesslich `price_amount` / `price_currency`. Ein in die Flachspalten geschriebener Provider-Preis wird dadurch nicht vertrauenswürdig. |
| `transfer` / `rental_car` | User-Intake `price_amount` / `price_currency` erhalten. `provider` / `external_ref` / `booking_url` bleiben untrusted/verboten als Provider-Hard-Truth, bis ein trusted S5-B-Write existiert. |
| `note` | Alle Legacy-Handelsfelder verbieten/leeren. Keine S5-A-Domain, keine Enum-Erweiterung. |

Kein Trigger/RPC in Gate 0. Production-Guards wären eigenes PO-Gate.

### Bewertung

| Kriterium | Bewertung |
| --- | --- |
| Truth Integrity | Ehrlicher Ist-Zustand. Schließt `S5B-G0-P2-01`, erzeugt aber keine Provider-Provenance. |
| Domain Isolation | Unverändert. |
| Queryability | Unverändert schwach für Commercial. |
| RLS / Ownership | Eine spätere Guard-Umsetzung nach der Matrix oben wäre Production-Migration / PO-Gate. Nicht in Gate 0. |
| Guest → Account | Heutiger Strip bleibt; LocalStorage bleibt untrusted. |
| Update / Refresh | Kein Provider-Refresh. |
| Retention / Privacy | Weniger Providerdaten. |
| Migration Complexity | Kann klein sein (nur Guards) oder null, wenn nur Docs/App-Strip. Guards auf Production = PO-Gate. |
| Rollback | Wie S2-B2: Guard stehen lassen, nicht rewinden. |
| Backfill / Legacy Unknown | Stay/Activity-Legacy-Handelsfelder inkl. Preis: nicht zu Provider-Truth backfillen. Transfer/Rental-Betrag nicht automatisch streichen. `note`-Handelsfelder leeren, nicht als Domain behandeln. |
| Indexing / Performance | unverändert |
| Native / API-Readiness | Kein persistierter Quote-Contract. |
| Admin / Observability | Kein Commercial-Snapshot. |
| Provider Neutrality | Ja, weil nichts Provider-Hartes gespeichert wird. |
| UniversalOffer-Gefahr | Keine. |
| Testbarkeit | Bypass-Tests wie S2. |
| Multi-Provider-Konflikte | entfällt |
| Kosten / Betrieb | Niedrig. |

**Passt als möglicher erster Härungs-Slice**, nicht als S5-B-Ziel. **Entsperrt TW-8 nicht.**

---

## 5. Vergleich

| | A Additive Spalten | B Metadata-JSON | C Eigene Relation | D Ephemeral + User-Intake |
| --- | --- | --- | --- | --- |
| Truth ohne Write-Fix | schlecht | schlecht | gut, *wenn* Write getrennt | gut für Nicht-Provider |
| Dual-Truth-Risiko | hoch | sehr hoch | niedrig, wenn Legacy untrusted bleibt | niedrig |
| Queryability | hoch | niedrig | hoch | niedrig |
| TW-8-tauglich später | nur mit Guards | nein | ja, plus Real-Evidence | nein |
| PO-Migrationsgate | ja | vermeintlich vermeidbar, fachlich trotzdem | ja | nur wenn Guards auf Production |
| UniversalOffer-Risiko | mittel | hoch | niedrig | niedrig |

---

## 6. Begründete Empfehlung — nicht entschieden

**Zielarchitektur für ein späteres S5-B: Option C.**

Gründe:

1. S5-A ist zu reich für die heutigen fünf Handelsfelder. Ohne Source/Zeit/Amount-Status/Affiliate bleibt jeder Preis eine Behauptung. Actor gehört nicht in die persistierte Zeile.
2. `trip_items` ist bereits ein gemischter Trust-Store. Additive Spalten (A) auf demselben `authenticated`-Grant wiederholen den Flight-P0-Klasse-Bypass für Stay/Activity (inkl. Preis) und Transfer/Rental-Providerfelder.
3. Metadata (B) verletzt den Route-Metadata-Vertrag, teilt das 8192-Limit und erzeugt den klarsten zweiten Store neben `price_amount`.
4. Eine eigene Relation, keyed auf `trip_item_id`, kann SELECT owner-only und WRITE privileged trennen, ohne Service-Role im Produktpfad und ohne globale Unique auf Provider+Ref.
5. Legacy-Zeilen ohne Provenance-Row bleiben ehrlich `unknown`. Kein Backfill.
6. Domain-Modelle bleiben unangetastet — kein UniversalOffer.
7. Rollback ist isolierter als ein RPC-Rewrite von `reise_anlegen`.

**Begleitregel, ohne die C wieder Dual-Truth wird:**

- `price_amount` / `provider` / `external_ref` dürfen nach S5-B **nicht** unabhängig von der Provenance-Relation Provider-Wahrheit tragen.
- Entweder schreibt derselbe trusted Pfad eine kontrollierte Display-Projektion, oder die Legacy-Spalten bleiben ausschließlich User-Intake / untrusted.
- `note` ist kein S5-A-Domain. Legacy-Handelsfelder dort verbieten/leeren; Preisprosa in Hotel-/Activity-`note` ist keine Quote.
- Domain+Provider+`externalRef` ist Refresh-/Match-Identität am selben Item, kein Unique über Nutzer/Reisen/Items.
- Persistierte Provider-Truth ist `persisted_snapshot`-**Evidence**; `CommercialBewertung` wird zur Lesezeit neu berechnet.

**Option D** ist die ehrlichste Zwischenhärtung gegen `S5B-G0-P2-01`, ersetzt S5-B aber nicht und öffnet TW-8 nicht.

**Option A** nur akzeptabel, wenn sie C in der Write-Authority und in der Quote→Snapshot-Übergang nachbildet (REVOKE/Trigger/DEFINER, kein Fake-`live_api` in der Zeile) und Legacy nicht backfillt. Dann ist A eine komprimierte C-Variante, keine billige Abkürzung.

Keine dieser Optionen darf in Gate 0 implementiert werden. Keine neue ADR-Nummer; bei späterer Annahme einen eigenen `PROPOSED`-ADR-Slice, ohne ADR-0168 umzudeuten.
