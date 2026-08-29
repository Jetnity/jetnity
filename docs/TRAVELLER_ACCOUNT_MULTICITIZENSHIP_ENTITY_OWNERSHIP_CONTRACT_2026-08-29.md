# Traveller / Account / Multi-Citizenship – kanonischer Entity-/Ownership-Vertrag

Stand: 29. August 2026  
Status: **VORGESCHLAGENER VERTRAG AUF CLOSED-AS-DUPLICATE-BRANCH / NICHT KANONISCH / KEINE PERSISTENZ / KEIN ADR-ERSATZ**  
Branch: `audit/traveller-account-multicitizenship-gap-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/192  
Task: `docs/TRAVELLER_ACCOUNT_MULTICITIZENSHIP_GAP_AUDIT_TASK_2026-08-29.md`  
Logical Cursor-Agent: **`Cursor-Agent: Jetnity traveller account audit 1`**

> Dieser Vertrag präzisiert die bereits product-owner-freigegebene Dual-Authority (`docs/AP7_DUAL_AUTHORITY_PRODUCT_OWNER_APPROVAL_2026-08-28.md`, ADR-0186 Nachtrag, ADR-0187). Er autorisiert **keine** Tabelle, RLS, UI, Guest→Registry-Import, Production-Migration oder Follow-up-Implementierung.

> Technical-Lead-Review kann ihn annehmen, schärfen oder zurückweisen. Er ist kein unabhängiger PASS und kein neuer Binding-ADR, solange der Technical Lead das nicht ausdrücklich macht.

---

## 1. Kanonischer Grundsatz

1. **Traveller**, **Citizenship** und **Travel Document** sind getrennte Entitäten.
2. Ein Traveller **kann und muss** mehrere Staatsbürgerschaften halten können.
3. Ein Traveller **kann und muss** mehrere Reisedokumente halten können, einschließlich mehrerer Pässe.
4. Citizenship ist keine Dokumenteigenschaft. Issuer ist keine Citizenship.
5. Kontextbezogene Empfehlung / Eligibility ist **abgeleitete Evaluationswahrheit**, niemals gespeicherte Identitätswahrheit.
6. Eine Empfehlung darf gespeicherte Citizenships/Dokumente nicht still umschreiben, löschen, primär setzen oder als Default persistieren.
7. Guest, Account-Owner und künftige Co-Traveller bleiben ownership-getrennt.
8. Web, Mobile und Native verwenden dieselben Entitäten. Kein plattformspezifisches Schattenmodell.

Leitsatz:

> **Gespeicherte Wahrheit = wer die Person ist und welche legalen Credential-Optionen sie besitzt.  
> Dynamische Wahrheit = welche Option für diese Route/diesen Provider gerade zulässig oder vorteilhaft erscheint.**

---

## 2. Entity-Graph

```
auth.users
  ├── profiles                         Account-Identität (kein Traveller)
  └── trips.user_id                    alleiniger Trip-Owner heute
        └── trip_travellers            Trip-Snapshot-Traveller (Current Truth der Reise)
              ├── trip_traveller_citizenships     0..8 ISO-2
              └── trip_traveller_documents        0..12 Credential-Profile
                    └── optional citizenship_id / citizenshipClientRef

AccountRegistryTraveller               account-owned wiederverwendbare Fakten
  authority = 'account_registry'       (Domain-Contract existiert; Persistenz fehlt)
  └── facts
        ├── citizenships[]
        └── documents[]

CredentialOption[]                     abgeleitet, nicht persistiert
OfficialEvaluation[]                   abgeleitet, provider-gated, nicht Identitätswahrheit
CredentialVergleich                    abgeleitet, fail-closed ohne option-level Evidence
```

### 2.1 Entitäten

| Entität | Was sie ist | Was sie nicht ist |
| --- | --- | --- |
| **Account** | Auth-User + `profiles` (`user_id`, email, display_name, avatar, role, status) | Traveller, Citizenship, Dokument, Wohnsitz, Präferenz |
| **Traveller** | Stabile Personenidentität im jeweiligen Authority-Raum (Registry oder Trip-Snapshot) | Account, Slot-Kopfzahl, erste Citizenship, erstes Dokument |
| **Citizenship** | ISO-3166-1-alpha-2 Staatsangehörigkeit eines Travellers | Wohnsitz, Ausstellerland, Domain, Sprache, Markt, Standort |
| **Travel Document** | Datensparsames Credential-Profil: Typ, Aussteller, Ablauf, optionale Citizenship-Relation | Passnummer, Scan, MRZ, Biometrie, Visa-Nummer, „der Pass“ |
| **Credential Option** | Auswertungssicht `traveller + document-or-none` | Persistierte Wahl, Default, primäres Dokument |
| **Trip Snapshot** | Einzige Current Truth einer konkreten Reise | Live-Referenz auf die Registry |
| **Recommendation / Eligibility** | Evidenzgebundene, kontextscharfe Ableitung | Identitätsfeld, globales Default, überschreibbare Citizenship |

### 2.2 Cardinalities

| Relation | Kardinalität | Limit | Evidence |
| --- | --- | --- | --- |
| Account → Traveller (Registry) | 1:n geplant | unspezifiziert bis Persistence-ADR | `lib/traveller/account-registry.ts`; keine Tabelle |
| Trip → Traveller (Snapshot) | 1:n | 20 | `TRAVELLER_CONTEXT_GRENZEN.travellersJeReise`; Trigger `trip_traveller_party_limit_pruefen` |
| Traveller → Citizenship | 1:n | 8 | `citizenshipsJeTraveller`; unique `(traveller_id, country_code)` |
| Traveller → Document | 1:n | 12 | `documentsJeTraveller` |
| Document → Citizenship | 0..1 optional | — | `citizenship_id` / `citizenshipClientRef`; `ON DELETE SET NULL` |
| Trip → Kopfzahl | 1:1 Zahl | 1–20 | `trips.travellers`; **keine** Identität |

---

## 3. Identifiers

| ID | Stabilität | Authority | Regel |
| --- | --- | --- | --- |
| DB `id` UUID | stabil | jeweilige Tabelle | Server erzeugt; nicht aus Fakten ableiten |
| `clientRef` | client-stabil | Snapshot: unique `(user_id, trip_id, client_ref)`; Registry: UUID-backed | Positions-/Fakten-Refs (`traveller:N`, `document:passport:CH`) sind in der Registry ungültig |
| Snapshot-`id` / `clientRef` | neu bei Materialisierung | Trip | **Disjunkt** zum gesamten Registry-Universum (Parent + alle Children, inkl. id↔clientRef-Kreuzung) |
| `optionRef` | abgeleitet | Evaluation | `${travellerClientRef}:${documentClientRef}` oder `${travellerClientRef}:none` — niemals persistierte Identität |
| `trips.travellers` | mutierbar | Trip-Metadaten | Kopfzahl, kein Traveller-FK |

**Mutierbar:** `label`, `residenceCountryCode`, Citizenship-Menge, Document-Menge (Typ / Issuer / Expiry / Citizenship-Link).

**Nicht mutierbar als Identität:** `id`, erfolgreiche Snapshot-Materialisierung, historische Trip-Wahrheit nach Registry-Edit.

**Voll-Replace-Kinder:** `party_schreiben` löscht und schreibt Citizenships/Documents atomar neu. Semantische Stabilität kommt über `clientRef`, nicht über physische Child-Row-Kontinuität.

---

## 4. Dual-Authority

Bereits product-owner-freigegeben. Dieser Vertrag wiederholt die Grenze, er ändert sie nicht.

| Authority | Besitz | Current Truth für | Darf |
| --- | --- | --- | --- |
| `account_registry` | Account-Owner | wiederverwendbare aktuelle Fakten | explizit in einen **neuen** Trip-Snapshot projeziert werden |
| Trip Snapshot | Trip-Owner (`trips.user_id`) | die konkrete Reise | unabhängig vom Registry-Stand weiterleben |

Harte Verbote:

- Registry-Edit schreibt bestehende Snapshots nicht um.
- Snapshot ist Kopie/Materialisierung, keine Live-Referenz.
- `AccountRegistryTraveller` ist compile-zeitlich **kein** `TripTraveller` (`facts`-Nesting, `authority`).
- `travellerLegacyLesen` / `credentialOptionsAus` sind Guest-/Readiness-Pfade, nicht Registry-Authority.
- Guest→Account-Trip-Copy bleibt trip-scoped. Registry-Import ist getrenntes Opt-in.
- Delete/Archive der Registry lässt historische Snapshots stehen.

---

## 5. Ownership

### 5.1 Heute implementiert

- Alleiniger Owner: `auth.uid() = trips.user_id = trip_travellers.user_id = children.user_id`.
- RLS: `user_id = (select auth.uid())` auf Parent und Children.
- Writes nur über `party_schreiben` / `party_loeschen` (`SECURITY INVOKER`).
- Guest hat keine Server-Identität; Daten leben in `localStorage` (`lib/trips/gastspeicher.ts`).

### 5.2 Vorgeschriebene Zukunftsgrenze

| Rolle | Sieht / schreibt | Sieht nicht |
| --- | --- | --- |
| Account-Owner | eigene Registry; eigene Trip-Snapshots | fremde Registry |
| Trip-Owner | Party-Snapshots der eigenen Reise | fremde Account-Registry |
| Künftiger Collaborator | nur freigegebene **Trip-Snapshots** laut späterem Trip-Permission-Vertrag | private Registry eines anderen Users |
| Guest | lokale Entwürfe auf dem Gerät | Server-Registry, fremde Reisen |
| Admin / Support | keine Traveller-Nebenwahrheit | keine Support-Kopie von Pässen |
| Marketing / Growth | keine Citizenship-/Dokument-Segmente | keine Identity-Payloads |

Co-Traveller-Collaboration (`KEEP-FUTURE` PR #28 / Issue #20) bleibt **ungebaut**. Dieser Vertrag darf sie nicht vorwegnehmen. Vor Enablement braucht sie einen eigenen Ownership-/Share-ADR.

---

## 6. Empfehlung darf Identität nicht überschreiben

| Schicht | Persistiert? | Beispiel |
| --- | --- | --- |
| Identity facts | ja, datensparsam | CH + US Citizenships; CH-Pass + US-Pass |
| Credential options | nein | zwei Optionen aus zwei Dokumenten |
| Official evaluation | nein als Identität | visumfrei für Option A nach TH |
| Winner / recommendation | nein als Identität | „für diese Route CH-Pass“ |
| User-gewählte Option | nur falls später eigener kontextscharfer Vertrag | Traveller + Option + Destination/Route/Transit + Evaluation-Fingerprint |

Verbotene Identitätsfelder (bereits im Registry-Contract):

`preferredDocument`, `defaultCitizenship`, `defaultPassport`, `primaryDocument`, `chosenCredentialOptionRef` und Äquivalente (`VERBOTENE_WAHL_SCHLUESSEL` in `lib/traveller/account-registry.ts`).

Falls Jetnity später eine explizite Nutzerwahl speichert, gilt ADR-0186 Punkt 8:

- trip-scoped
- kontext-/evaluationsscharf
- niemals globaler Traveller-Default
- route-weit einheitliche Nutzung nur bei belastbarer regulatorischer/Provider-Evidence

Eine solche Wahl **ersetzt nicht** die gespeicherten Citizenships/Dokumente und **löscht** keine Alternative.

---

## 7. Stored facts vs dynamic eligibility

| Gespeicherte Fakten (Minimum) | Dynamische Evidence |
| --- | --- |
| `label` ≤ 40, ohne Nummernmuster | Visa / ETA / Transit / Health-Requirement |
| `residenceCountryCode` ISO-2 oder null | optionEligibility / optionMandate |
| Citizenship `countryCode` ISO-2 | Winner / „am einfachsten“ |
| Document `documentType` | Provider-/Carrier-APIS-Pflicht |
| Document `issuingCountryCode` | Gültigkeit gegenüber Einreiseregel (über Expiry hinaus) |
| Document `expiresOn` date | Freshness / stale / recheck |
| optionale Document↔Citizenship-Relation | |

`TripReadinessItem` speichert nur Nutzer-Vorbereitungsstand, niemals Official Truth (`types/trips.ts`).

Ohne Requirements-Provider bleibt Official `unknown` / `unavailable` / `insufficient_context`. Keine erfundene Eligibility.

---

## 8. Privacy-Minimum

**Speicherbar im Kernmodell:** ISO-2 Citizenship, Document-Typ, Issuer-ISO-2, Ablaufdatum, neutrales Label, Residence-ISO-2.

**Nicht im Kernmodell, extra Product-Owner- + Security-Gate:**

- Pass-/Ausweis-/Visa-Nummern
- Scans, Fotos, MRZ
- Biometrie / Chip / RFID
- Geburtsdatum
- Gesundheitsakte / Impf-Uploads
- gesetzlicher Name, sofern nicht später bewusst und datensparsam für Booking/APIS benötigt

Provider-Requests commercieller Suche (Flug/Hotel/Mobility) erhalten heute **nur Kopfzahl**. Citizenship/Dokumente gehören dort nicht hinein, bis ein echter Provider das Feld nachweislich verlangt. Requirements-Port darf die datensparsamen Felder aus `RequirementsTravellerInput` nutzen, sobald ein Provider existiert.

---

## 9. Guest → Account → Registry

| Schritt | Heute | Künftig |
| --- | --- | --- |
| Guest speichert `Trip.party` lokal | implementiert | unverändert |
| Login übernimmt Trip + Party via `reise_anlegen` + `party_schreiben` | implementiert, trip-scoped, idempotent über `(user_id, client_ref)` | unverändert automatischer Trip-Copy |
| Readiness-Copy | implementiert, fail-closed, retry-fähig | unverändert |
| Import in Account-Registry | **absent** | nur explizites Opt-in; kein Auto-Match auf Label/Residence/Citizenship-Set |
| Dedup zweier Personen | **absent** | nur nach ausdrücklicher Nutzerbestätigung |

---

## 10. Native / Mobile

Derselbe Graph, dieselben Feldnamen, dieselben Authorities, dieselben Verbote. Ein nativer Client darf keine zweite Traveller-Tabelle, keinen Default-Pass und keine plattformlokale „beste Staatsbürgerschaft“ einführen.

Heute kann Native nur trip-scoped `Trip.party` sehen. Account-Registry-API existiert nicht.

---

## 11. Was dieser Vertrag nicht entscheidet

- Ob AP-7-S2 jetzt startet (Product-Owner Identity-/RLS-/Migrations-Gate + Persistence-ADR).
- Ob AP-6a-Runtime oder AP-6b vor AP-7-S2 laufen (kanonischer Account-Plan).
- Ob ein Requirements-Provider gewählt wird.
- Ob Collaboration (PR #28) gebaut wird.
- Ob sensible Dokumentpayloads jemals gespeichert werden.
- Ob eine kontextscharfe Credential-Wahl jemals persistiert wird.

Diese Fragen bleiben bewusst offen. Der Vertrag legt nur fest, **wie** sie gebaut werden müssten, falls sie später gegatet werden.
