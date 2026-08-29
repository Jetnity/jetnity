# Provider S5-B – Option C Target Architecture

Stand: 29. August 2026  
Status: **ACCEPTED TARGET ARCHITECTURE / PERSISTENCE TRANSLATED IN REPO BY ADR-0198 / NO PRODUCTION APPLY / NO TW-8**  
Workstream: Provider Readiness / Commercial Truth  
Cursor-Agent: **Jetnity provider readiness audit 3**  
ADR: `docs/ADR_0197_PROVIDER_S5B_OPTION_C_TARGET_ARCHITECTURE.md`  
S5-A bleibt kanonisch: ADR-0168 / `lib/commercial-provenance`

> Dieser Vertrag sagt, **was** ein späterer Persistenzslice bauen darf. Er implementiert **nichts**. Er ist keine Product-Owner-Freigabe für Migration, RLS, Ownership, GRANT/REVOKE, SECURITY DEFINER, Provider-Aktivierung oder TW-8.

---

## 1. Annahme

Technical-Lead-Auswahl nach integriertem Gate 0 (PR #141, Exact Head `a2f1f0a80e5715b5ab0fef39b671dd887ae0204b`) und Live-Rekonstruktion am 29. August 2026:

**Option C ist die Zielarchitektur.** Commercial Provenance wird später in einer **eigenen provider-neutralen Relation** an `trip_item_id` gebunden. Der erste persistente Vertrag ist **ein aktueller Snapshot pro `trip_item`**.

Abgelehnt als Ziel:

- **Option A** – additive Spalten auf `trip_items` unter dem heutigen `authenticated` INSERT/UPDATE. Würde denselben Owner-Bypass wiederholen.
- **Option B** – JSON in `trip_items.metadata`. Verletzt den Route-Metadata-Vertrag, teilt das 8192-Limit und erzeugt Dual-Truth neben `price_amount`.
- **Option D** – nur ephemere Quotes plus User-Intake. Ehrliche Zwischenhärtung, aber kein S5-B und kein TW-8-Pfad.

Option A wäre nur dann eine komprimierte C-Variante, wenn sie Write-Authority, Quote→`persisted_snapshot` und Legacy-Unknown identisch nachbildet. Das ist keine billige Abkürzung und hier nicht gewählt.

Gate-0-Evidence bleibt gültig:

- `docs/PROVIDER_S5B_GATE0_ARCHITECTURE_OPTIONS_2026-08-28.md`
- `docs/PROVIDER_S5B_GATE0_READINESS_STATUS_2026-08-28.md`

---

## 2. Trennscharfe Zustände

| Zustand | Gilt jetzt? |
| --- | --- |
| Option C als Zielarchitektur angenommen | **ja** |
| S5-A Domainvertrag (ADR-0168) umgedeutet | **nein** |
| Relation / Tabelle / Migration existiert | **im Repository (ADR-0198 / PR #182), nicht auf Production** |
| RLS / GRANT / REVOKE / SECURITY DEFINER geändert | **im Repository, nicht auf Production** |
| Persistierte Provider-Truth vorhanden | **nein – kein realer Snapshot, kein Production-Apply** |
| TW-8 entsperrt | **nein** |
| Provider aktiviert / Secrets / paid calls | **nein** |

Arbeitsname der späteren Relation: `trip_item_commercial_provenance`. Das ist ein Vertragname, keine erzeugte Tabelle.

---

## 3. Zwölf verbindliche Architekturregeln

1. **Eigene Relation, keyed auf `trip_item_id`.** `trip_items` bleibt der Reisegraph. Commercial Provenance ist kein `UniversalOffer` und keine Flight-/Hotel-/Activity-/Mobility-/Rental-Semantik.
2. **Erster Scope: 1 aktueller Snapshot pro Item.** Quote-History / 1:n-Historisierung ist späterer eigener Bedarf. Kein History-Schema vorbauen, keine History-Indizes, keine History-RPCs.
3. **Lifecycle und Ownership folgen dem `trip_item`.** `trip_id` / `user_id` dürfen denormalisiert mitgeführt werden, sind aber keine unabhängige Identität. Refresh-/Match-Identität ist Domain + Provider + belegte `externalRef` **am selben Item**. Kein datenbankweites Unique über diese drei Felder. Dieselbe Ref darf auf mehreren Items stehen.
4. **S5-A-Domains bleiben genau fünf:** `flights`, `hotels`, `activities`, `mobility`, `rental_cars`. `note` ist keine Commercial-Provenance-Domain und erweitert die Enum nicht. Ein `note`-Item darf später **keine** Provenance-Zeile tragen.
5. **Persistiert wird Evidence, nicht Bewertung.** `freshnessStatus`, `commercialStatus`, `currencyStatus` und `darfAlsCurrentQuoteDargestelltWerden` sind `CommercialBewertung` und werden beim Lesen mit aktuellem `nowMs` aus S5-A neu abgeleitet. Eine denormalisierte Status-Spalte wäre Cache mit Invalidierung, nicht Source of Truth.
6. **Provider-Hard-Truth nur aus serverseitig validierter Quote.** Persistierte Darstellung: `sourceKind='persisted_snapshot'` und `persistenz='snapshot'`. Ein vom Client geliefertes `sourceKind` oder ein gespeichertes `live_api` wird durch Persistenz allein nie vertrauenswürdig. Mint-Actor ist Write-Time `provider_adapter`; Lesen der persistierten Zeile prüft als `system` + `persisted_snapshot`.
7. **`CommercialAkteur` bleibt Write-Time-Kontext** der S5-A-Prüfer. Er wird nicht still zu einem persistierten S5-A-Feld. Eine spätere Audit-/Write-Actor-Spalte wäre ein zusätzliches Audit-Konzept, nicht Teil von ADR-0168.
8. **Legacy ohne Provenance-Zeile bleibt `unknown`.** Kein Backfill aus `price_amount`, `price_currency`, `provider`, `external_ref`, `booking_url` oder Note-Preisprosa.
9. **Legacy-Flachfelder dürfen nach S5-B keine unabhängige zweite Provider-Hard-Truth bilden.** Ein späterer Implementierungsslice muss **eine** kontrollierte Projection-/Read-Regel definieren: entweder schreibt derselbe trusted Pfad eine Display-Projektion, oder die Flachfelder bleiben ausschließlich User-Intake / untrusted Display.
10. **Guest-LocalStorage und Guest→Account minten niemals Provider-Provenance** und kein `persisted_snapshot` aus untrusted Client-Daten. Heutiger Strip für Flight/Stay/Activity bleibt die Untergrenze, nicht die Obergrenze.
11. **Kein Service Role im normalen Produktpfad.** Write-Authority wird später getrennt (enges privilegiertes Konstrukt oder anderer kontrollierter Datenpfad). Mechanismus, Threat Model und Production-Gate gehören in den Implementierungsslice, nicht hier.
12. **Keine erfundenen Wahrheiten:** kein Default-Provider, keine Fake-Freshness, keine stille Currency Conversion, keine erfundene Affiliate- oder Availability-Wahrheit, kein `available: boolean`.

---

## 4. Persistierte Evidence vs. Lesezeit-Bewertung

S5-A bleibt die Gate-Funktion. Die spätere Zeile speichert nur Felder, die `CommercialProvenance` bereits kennt:

| Persistiert (Evidence) | Nicht als autoritative SoT |
| --- | --- |
| `domain` | `freshnessStatus` |
| `quelle` (`providerId`, `providerBelegt`, `sourceKind`, `sourceLabel`) | `commercialStatus` |
| `referenz` (`externalRef`, `providerOfferId`) | `currencyStatus` |
| `zeit` (`retrievedAt`, `observedAt`, `freshUntil`) | `darfAlsCurrentQuoteDargestelltWerden` |
| `waehrung` (`requestedCurrency`, `quotedCurrency`) | `darfAlsLiveDargestelltWerden` (Snapshot immer `false`) |
| `preis` (`amount`, `amountStatus`) | `darfRequestedWaehrungAlsVergleichbarGelten` |
| `persistenz='snapshot'` | `CommercialAkteur` |
| `affiliate` (`status`, `partnerId`, `clickId`, `attributionRef`) | |
| `availabilityStatus` als Eingabe (`unavailable` \| `unknown`) | |
| `vergleichsschluessel` | |

`affiliate.status='present'` braucht Beleg. Fehlende Affiliate-Evidence bleibt `unknown`, nicht `absent`. `requestedCurrency != quotedCurrency` ohne Conversion-Evidence bleibt `mismatch`. Conversion bleibt `absent`, bis ein eigener belegter Conversion-Vertrag existiert.

---

## 5. Kind-Mapping und Guard-Matrix

Noch **nicht** implementieren. Späterer Slice muss diese Matrix erhalten:

| `trip_items.kind` | S5-A-Domain? | Provenance-Zeile? | Bis ein trusted S5-B-Write existiert |
| --- | --- | --- | --- |
| `flight` | `flights` | ja, später | Bestehender DB-Guard bleibt. Nicht entfernen oder rewinden. |
| `stay` | `hotels` | ja, später | Untrusted Direct-DML/RPC mintet **keine** Provider-Hard-Truth in der gesamten Legacy-Menge, einschließlich `price_amount` / `price_currency`. |
| `activity` | `activities` | ja, später | wie `stay` |
| `transfer` | `mobility` | ja, später | User-Intake von `price_amount` / `price_currency` bleibt zulässig. `provider` / `external_ref` / `booking_url` bleiben untrusted, solange kein trusted S5-B-Write sie belegt. |
| `rental_car` | `rental_cars` | ja, später | wie `transfer` |
| `note` | **nein** | **nein** | Alle Legacy-Handelsfelder verbieten/leeren. Keine Enum-Erweiterung. |

Nur Provider/Ref/URL zu schützen und Stay/Activity-Preise offen zu lassen wäre ein unvollständiger Vertrag.

---

## 6. 1:1-Slot und User-Intake

Der erste persistente Vertrag ist **höchstens eine aktuelle Provenance-Zeile pro `trip_item`**.

Daraus folgt eine Implementierungsentscheidung, die dieser Slice **nicht** vorwegnimmt, aber begrenzt:

- Provider-Hard-Truth darf diesen Slot nur als `persisted_snapshot` aus einer serverseitig validierten Quote belegen.
- User darf eine vorhandene `providerBelegt`-Zeile nicht ersetzen.
- Transfer/Rental-User-Intake-Preis darf auf den Legacy-Flachfeldern bleiben, bis der Implementierungsslice entscheidet, ob `user_intake` / `manual` denselben 1:1-Slot nutzen oder bewusst nur Flachfelder bleiben.
- Zwei unabhängige Current-Stores (Flachfelder **und** Provenance als Provider-Hard-Truth) sind verboten. Die Projection-/Read-Regel aus Regel 9 ist deshalb Pflichtbestandteil des ersten Persistenzslices.
- 1:n für Quote-History oder Multi-Provider-Konflikt ist späterer Bedarf, nicht dieser Vertrag.

---

## 7. Refresh, Guest, Privacy

Refresh/Match gilt nur zwischen bestehender und vorgeschlagener Provenance **desselben** Items: identische Domain + identische `providerId` + identische belegte `externalRef`. Fehlende Ref auf einer Seite ist kein Refresh. `providerOfferId` reicht nicht.

Guest-LocalStorage bleibt untrusted. Promotion mintet keine Provenance-Zeile. Hotel-/Activity-Providerpreise im Browser werden nicht zu Account-Hard-Truth.

Commercial-Felder werden personenbezogen, sobald sie an Trip/User hängen. Keine Pass-/MRZ-/Biometrie-/Gesundheitsdaten als Commercial-Targeting. Traveller-Context ist **kein** Commercial-Schlüssel; Credentials nicht erheben. Retention/Delete folgt später dem Trip; Archive ist kein Commercial-Delete. Kein Marketing-Shadow-Store.

---

## 8. Was der nächste Persistenzslice bauen darf — und was nicht

Ein späterer, separat versionierter Slice darf den Vertrag in Schema + Write-Authority + Read-Projektion übersetzen. Dafür braucht er mindestens:

1. eigenen Task;
2. Threat Model für den Write-Pfad;
3. ausdrückliche Product-Owner-Freigabe, sobald Migration / RLS / Ownership / GRANT/REVOKE / SECURITY DEFINER Production berühren;
4. unabhängigen Technical-Lead-PASS;
5. Legacy-Unknown und die eine Projection-Regel;
6. Tests analog S2-Bypass plus S5-A Actor↔Source.

Er darf **nicht** aus diesem Annahme-Slice entstehen:

- Tabelle, Migration, Trigger, RPC, RLS, Grant/Revoke, SECURITY DEFINER;
- Runtime in `app/`, `components/`, Provider-Adaptern oder Server Actions;
- Provider-Aktivierung, Secrets, paid calls, Verträge;
- TW-8 / TW-9;
- Account / AP-6 / AP-7;
- Auth / MFA / AAL;
- Service Role im Produktpfad;
- History-Tabelle „gleich mit“;
- Fake-`live_api` in der Zeile;
- Backfill aus Legacy-Handelsfeldern.

TW-8 bleibt hinter **implementierter** persistierter S5-A-Evidence **und** mindestens einem serverseitig nachgewiesenen realen Snapshot geschlossen. Architekturannahme allein entsperrt TW-8 nicht.

---

## 9. Severity – unverändert, wo nicht ausdrücklich geschlossen

| ID | Klasse nach diesem Slice |
| --- | --- |
| `S5B-G0-ARCH-01` | **geschlossen als Architekturwahl.** Option C angenommen. Implementation bleibt offen. |
| `S5B-G0-PO-MIG-01` | unverändert: jede Schema-/RLS-/REVOKE-/DEFINER-Arbeit braucht PO-Gate. |
| `S5B-G0-P2-01` | unverändert P2 residual trust. Direct-DML / `reise_anlegen` auf Nicht-Flight-Kinds. |
| `S5B-G0-P2-02` | unverändert P2 dual-display. Hotel-/Activity-Note-Preisprosa. |
| `S5B-G0-P3-01` | Hygiene: aktuelle Provider-Readiness-Docs beschreiben S5-B nicht mehr als „keine Zielarchitektur“. Historische Dateien bleiben Evidence. |
| `S5B-G0-TW8-GATE-01` | unverändert geschlossen für TW-8. |
| `S5B-G0-ACT-GATE-01` | unverändert: keine Provideraktivierung. |

Kein neues Production-P0/P1.
