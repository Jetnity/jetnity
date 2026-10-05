# Foundation E – Phase-1 Architektur-Audit

Stand: 22. August 2026  
Status: **Ist-Stand vor Schemaänderung, geprüft gegen frisches `origin/main` (`ae64e4ff`)**

Dieses Audit ist die Voraussetzung für das Traveller-Context-Datenmodell. Es ersetzt keine älteren Docs, sondern hält fest, **was der Code und das Schema heute wirklich tun**.

## 1. Geprüfter Stand

- Branch-Basis: `origin/main` @ `ae64e4ff88ddacf4bbb6d9521e003fb1cc9653aa`
- Foundation D ist auf `main` und Production (siehe `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`)
- Foundation C Production-Tabellen: `trip_travellers`, `trip_readiness_items`
- Kein Travel-Requirements-Provider aktiv
- Keine Foundation-E-Migration auf Production

## 2. Kanonische singuläre Felder heute

`public.trip_travellers` besitzt genau ein Credential-Bündel je Zeile:

- `nationality_country_code`
- `residence_country_code`
- `document_type`
- `document_issuing_country_code`
- `document_expires_on`

Dieselbe Form liegt in `TripTraveller` (`types/trips.ts`) und im Provider-Port (`RequirementsTravellerInput`).

`residence_country_code` bleibt fachlich ein datensparsamer Wohnsitzkontext. Die vier übrigen Credential-Felder sind transitional und **keine** langfristige Source of Truth.

## 3. Leser und Schreiber der fünf Felder

### Account

| Weg | Datei | Rolle |
| --- | --- | --- |
| SELECT `trip_travellers(*)` | `lib/trips/daten.ts` | Liest die flache Zeile |
| Abbildung | `lib/trips/abbildung.ts` → `partyAusZeilen()` | snake_case → `Trip.party` |
| Mapping | `lib/readiness/reisende.ts` | Liest/schreibt alle fünf Felder |
| INSERT/UPDATE/UPSERT | `lib/readiness/reisende-aktionen.ts` | `travellerSetzen`, `partyUebernehmen` |
| DELETE | `lib/readiness/reisende-aktionen.ts` | `travellerEntfernen` |

`public.reise_anlegen()` und `public.reise_aendern()` schreiben **keine** Traveller- oder Readiness-Zeilen, nur `trips.travellers` (Kopfzahl).

### Guest

| Weg | Datei |
| --- | --- |
| Persistenz | `lib/trips/gastspeicher.ts` (`jetnity:reise:v3`) |
| Mutation | `lib/readiness/reisende-gast.ts` |
| Validierung | `lib/readiness/schema.ts` → `partySchema` |

Legacy-v2-Gastreisen besitzen **kein** `party`. Alte Foundation-C-Gäste besitzen die flache Singularform.

### Engine / API / UI

- `lib/readiness/engine.ts` – Official-Fingerprint und Missing Facts aus genau einem Nationalitäts-/Dokumentbündel
- `lib/readiness/party.ts` – ein Slot = ein Traveller = eine Nationalität
- `lib/readiness/anforderungen.ts` – API-Party bleibt flach
- `app/api/readiness/requirements/route.ts` – Body darf `party[]` mit Singularfeldern tragen
- `components/trips/Reisevorbereitung.tsx` – ein Formular je Slot, keine Mehrfachstaatsbürgerschaft
- `components/trips/GastreiseBruecke.tsx` – Guest→Account mappt Singularfelder 1:1

## 4. Implizite 1:1-Annahmen

1. **Schema:** keine Child-Tabellen für Staatsbürgerschaften oder Dokumente.
2. **Slots:** `traveller:1..N` folgen der Kopfzahl `trips.travellers`, nicht einer Menge rechtlicher Optionen.
3. **Official Engine:** eine Evaluation je Traveller × Destination × Requirement, nicht je Credential-Option.
4. **User Readiness:** `trip_readiness_items` hat **kein** `traveller_id`. Einreise-/Visum-/Dokumentkarten sind trip-level.
5. **Provider-Port:** `RequirementsTravellerInput` kennt nur ein Dokumentprofil.
6. **Hotels/Flüge/Mobilität:** nutzen nur die Kopfzahl. Das ist für Suche akzeptabel und darf nicht zur rechtlichen Traveller-Wahrheit werden.

## 5. Guest → Account

Ablauf in `lib/trips/uebernahme.ts` / `GastreiseBruecke.tsx`:

1. `reise_anlegen` (Reisegraph)
2. `partyUebernehmen` (separater Upsert)
3. `readinessUebernehmen` (separater Upsert)

Das ist **nicht atomar**. Ein Fehler nach Schritt 1 hinterlässt eine Konto-Reise ohne Party. Der Browser-Entwurf bleibt fail-closed erhalten.

Foundation E muss Traveller + Citizenships + Documents in **einer** serverseitigen Transaktion/RPC schreiben.

## 6. Fingerprints

Zwei getrennte Systeme:

| Fingerprint | Ort | Enthält heute Credentials? |
| --- | --- | --- |
| User Readiness | `lib/readiness/fingerprint.ts` | **Nein.** Kommentar: „Nicht enthalten: Pass, Nationalität, Wohnsitz“ |
| Official | `lib/readiness/engine.ts` `officialFingerprint()` | Ja, aber nur singular (`nat`, `doc`, `iss`, `exp`) |

`docs/TRAVEL_READINESS.md` nennt Nationalitäts-/Dokumentänderungen als Recheck-Anlass. Der User-Fingerprint tut das **nicht**. Das ist ein Truth-Defekt und muss in Foundation E geschlossen werden.

Foundation-D-Route (`orig`, `tr`, `route`) ist in Einreise-/Visum-/Dokument-/Versicherungs-/Preparations-Fingerprints enthalten. Ticket-/Buchungsbestätigungen bleiben item-bezogen ohne Route.

## 7. Route Truth

`routeFactsAusReise()` / `routeFactsAusGraph()` bleibt die einzige Origin-/Transit-Quelle. Foundation E darf sie nicht duplizieren und nicht traveller-spezifisch machen.

## 8. Security / RLS heute

`trip_travellers`:

- FK `(trip_id, user_id)` → `trips`
- Unique `(user_id, trip_id, client_ref)`
- RLS nur `authenticated` + `user_id = auth.uid()`
- `anon`/`public` ohne Rechte
- Label-Checks gegen HTML und Ausweisnummern

`scripts/db/sicherheit.mjs` prüft Cross-User-INSERT/SELECT und Label-PII. Child-Tabellen existieren noch nicht.

## 9. Migrations- und Rollout-Risiken

- Production enthält echte Foundation-C-Zeilen. Expand/Contract mit Backfill ist Pflicht; kein Drop der Legacy-Spalten in diesem Block.
- Guest-JSON ändert die Form. Alte Singularobjekte müssen gelesen, nicht verworfen werden.
- Guest→Account mit mehr Tabellen erhöht das Teilfehler-Risiko, solange kein RPC existiert.
- User-Checks werden nach Credential-Aufnahme in den Fingerprint ehrlich `stale`.
- Array-Reihenfolge darf Fingerprints nicht ändern.
- Änderung an Traveller A darf Traveller B nicht als identischen Kontext behandeln.

## 10. Architekturentscheidung nach Audit

Der Ist-Stand zeigt **keinen** besseren Weg als die im Task bevorzugte Parent/Child-Struktur:

- `trip_travellers` bleibt stabiler Parent inkl. `residence_country_code`
- `trip_traveller_citizenships` 1:n
- `trip_traveller_documents` 1:n
- optionales `trip_readiness_items.traveller_id` für traveller-spezifische Karten
- Legacy-Spalten bleiben compatibility-only, nach Backfill nicht mehr Source of Truth
- alle neuen Writes über eine `SECURITY INVOKER`-RPC mit festem `search_path`

Hotels, Flüge und Mobilität bleiben kopfzahlbasiert, bis eine spätere Eligibility-Evidence Traveller-Kontext wirklich braucht.
