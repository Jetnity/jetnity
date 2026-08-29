# Traveller / Account / Multi-Citizenship Gap Audit — 2026-08-29

Stand: 29. August 2026  
Status: **AUDIT + ARCHITECTURE ONLY / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**  
Logical Cursor-Agent: **`Cursor-Agent: Jetnity traveller account audit 1`**  
Task: `docs/TRAVELLER_ACCOUNT_MULTICITIZENSHIP_GAP_AUDIT_TASK_2026-08-29.md`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/192  
Branch: `audit/traveller-account-multicitizenship-gap-2026-08-29`  
Baseline `origin/main` (Task + Re-Fetch vor Handoff): `69ef27b169780e41ba506a69acb15caafa645517`

> Keine produktive Runtime-Änderung. Keine Supabase-/Vercel-/Production-Mutation. Keine echten Dokumentdaten. Keine Visa-/Provider-Calls. Keine Account-Platform-Implementierung.

Vertrag: `docs/TRAVELLER_ACCOUNT_MULTICITIZENSHIP_ENTITY_OWNERSHIP_CONTRACT_2026-08-29.md`  
Backlog: `docs/TRAVELLER_ACCOUNT_MULTICITIZENSHIP_IMPLEMENTATION_BACKLOG_2026-08-29.md`

---

## 0. Evidence-Basis

Gelesen vor der Rekonstruktion (verbindliche Start-/Operating-/Build-Order-/Account-/Traveller-/TW-/Security-Dokumente):

- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md` §2–§3
- `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` AP-5–AP-12
- `docs/AP7_DUAL_AUTHORITY_PRODUCT_OWNER_APPROVAL_2026-08-28.md`
- `docs/AP7_GATE0_ACCOUNT_TRAVELLER_REGISTRY_ARCHITECTURE_STATUS_2026-08-28.md`
- `docs/AP7_S1_DUAL_AUTHORITY_DOMAIN_CONTRACT_STATUS_2026-08-28.md`
- `docs/TRAVELLER_CONTEXT.md`
- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`
- `docs/CURSOR_ROUTE_TRANSIT_TRAVELLER_CONTEXT_AMENDMENT.md`
- ADR-0102, ADR-0117, ADR-0178, ADR-0180, ADR-0181, ADR-0186, ADR-0187
- `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT.md` (historisch, 26. August)
- `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md` (Feature-Branch-Continuity; Live-Evidence gewinnt)

Verifiziert gegen Code, Migrationen, Typen und Tests auf Baseline `69ef27b1` plus Task-Commit. Historische Audits sind Evidence ihres Zeitpunkts.

Klassifikation je Aussage: **implemented** / **partially implemented** / **documented-only** / **absent**.

---

## 1. Binding product model vs live

Kanonisches Produktmodell (Task + Binding Order §2 + Foundation E):

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Dokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

| Regel | Live-Stand |
| --- | --- |
| Mehrere Citizenships | **Implemented** trip-scoped (`trip_traveller_citizenships`, max 8) |
| Mehrere Dokumente inkl. mehrerer Pässe | **Implemented** trip-scoped (`trip_traveller_documents`, max 12) |
| Citizenship ≠ Document | **Implemented** kanonisch; Legacy-Singularspalten **partial** (DEPRECATED, nicht gedroppt) |
| Kontextabhängige Bewertung | **Partial** — Engine + Vergleichslibrary; Provider `null`; UI zeigt nur fail-closed Copy |
| Keine stille Identitätsumschrift | **Implemented** in Contracts/Tests; Winner wird nicht persistiert |
| Guest / Account / Co-Traveller getrennt | Guest+Account **partial** (Trip-Copy ja, Registry-Claim nein); Co-Traveller **absent** |
| Least privilege / datensparsam | **Implemented** für gespeicherte Felder; sensible Schlüssel fail-closed abgewiesen |

Foundation E darf **nicht** neu gebaut werden (`docs/JETNITY_BINDING_BUILD_ORDER.md` §2; Production-Acceptance in `docs/TRAVELLER_CONTEXT.md`).

---

## 2. Inventar nach Schicht

| Fähigkeit | Klasse | Primäre Evidence |
| --- | --- | --- |
| Account-Identität `profiles` | **implemented** | `supabase/migrations/20260817120300_generisches_profil.sql`; `types/supabase.ts` `profiles.Row` |
| Trip-Kopfzahl `trips.travellers` | **implemented** | `types/trips.ts` L367; kein FK zu `trip_travellers` |
| Trip-Traveller Parent | **implemented** | `20260822020000_trip_travellers.sql` |
| 1:n Citizenships | **implemented** | `20260822160000_traveller_context_intelligence.sql` L21–43 |
| 1:n Documents | **implemented** | dieselbe Migration L59–88 |
| Atomarer Write `party_schreiben` | **implemented** | dieselbe Migration; C1 `20260828015304_*` |
| Domain `TripTraveller` | **implemented** | `types/trips.ts` L163–201 |
| AP-7-S1 Registry-Contract | **implemented** (kein Schema) | `lib/traveller/account-registry.ts`; `lib/traveller/account-registry.test.ts` |
| Account-Registry Persistenz | **documented-only** | keine `account_traveller*`-Tabelle |
| Guest `Trip.party` | **implemented** | `lib/trips/gastspeicher.ts`; `lib/readiness/reisende-gast.ts` |
| Guest→Account Trip+Party | **implemented** | `lib/trips/uebernahme.ts`; `components/trips/GastreiseBruecke.tsx` |
| Guest→Registry Import/Dedup | **absent** | Gate 0 §6 / PO-Approval L24–25 |
| Credential options | **implemented** | `credentialOptionsAus` in `lib/readiness/traveller-kontext.ts` L246–275 |
| Option-Vergleich | **partial** | `lib/readiness/vergleich.ts`; **0** Component-Imports |
| Requirements-Provider | **absent** (Port vorhanden) | `requirementsProviderAus()` return `null` |
| Flug/Hotel/Mobility Traveller-PII | **absent by design** | `flugPassagiereAusReise` nur Kopfzahl |
| Co-Traveller / Share-RLS | **absent** | nur `user_id = auth.uid()` |
| Preferred/Default Document | **absent by design** | `VERBOTENE_WAHL_SCHLUESSEL` |
| Passnummer / MRZ / Biometrie | **absent by design** | DB-Kommentare + Parser-Blacklists |
| Collaboration Runtime | **absent** | PR #28 `KEEP-FUTURE` |

---

## 3. Citizenship

**Implemented**

- Tabelle `public.trip_traveller_citizenships`: `country_code` `^[A-Z]{2}$`, unique `(traveller_id, country_code)`.
- Domain `TripTravellerCitizenship`: `id`, `clientRef`, `countryCode`, Zeitstempel.
- Sortierung deterministisch nach `countryCode` dann `clientRef` (`citizenshipsSortieren` in `lib/readiness/traveller-kontext.ts`). Kein `is_primary`.
- Leere Menge → Missing Fact `'nationality'` (`travellerFehlendeKernfakten`). Keine Default-Citizenship aus Wohnsitz/Standort/Domain (`docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`).
- Progressive Pflicht: nicht beim Reise-Start; hart sobald Official/Regulatory ausgewertet werden soll.
- Registry-Contract: Arrays, Limit 8, Legacy-Singular `nationalityCountryCode` auf untrusted Input → reject/null.

**Partial**

- Legacy `trip_travellers.nationality_country_code` existiert, Kommentar DEPRECATED. Expand nur wenn Child-Array **nicht** geladen (`travellerLegacyLesen` L171–174). Geladene leere Relation bleibt leer.

**Absent**

- Persistiertes `preferredCitizenship` / `primaryCitizenship` — **by design**.
- Explizites Citizenship-Enum `unknown` — Abwesenheit ist missing, nicht unknown-country.

---

## 4. Travel documents

**Implemented**

- Typen: `'passport' | 'national_id' | 'unknown'` (`TRAVELLER_DOCUMENT_TYPES`).
- Felder: `issuingCountryCode` nullable ISO-2, `expiresOn` date only, optionale Citizenship-Relation.
- Mehrere Dokumente inkl. zweier Pässe gleichen Typs/Issuers über UUID/`clientRef` unterscheidbar (Registry-Tests).
- Limit 12; Trigger `trip_traveller_kinder_limit_pruefen`.
- Document↔Citizenship FK `ON DELETE SET NULL` (`20260822170000_traveller_context_fk_delete.sql`).
- Backfill-Anti-Invention: Issuer ≠ Citizenship (`20260822180000_traveller_context_rereview.sql`).
- UI: getrennte Fieldsets in `components/trips/Reisevorbereitung.tsx`; Link-Select; Link fällt weg wenn Citizenship entfernt (`lib/readiness/dokument-formular.ts`).
- Kein Dokument aus Citizenship erfinden: `lib/readiness/traveller-kontext.test.ts`.

**Partial**

- Legacy `document_type` / `document_issuing_country_code` / `document_expires_on` auf Parent.
- Keine `valid_from`, kein provider-verifiziertes Validity-Flag, kein „läuft bald ab“-Attention-Signal.

**Absent by design**

- Dokumentnummer, Scan, MRZ, Biometrie, Chip. DB-Kommentar und `SENSIBLE_SCHLUESSEL` in Registry + `lib/readiness/traveller-anfrage.ts`.

---

## 5. Account vs Traveller vs Booking-Input

| Schicht | Inhalt | Scope |
| --- | --- | --- |
| Account | `profiles` ohne Citizenship/Dokumente | Account |
| Trip-Metadaten | `travellers: number` | Kopfzahl 1–20 |
| Trip-Party | `Trip.party?: TripTraveller[]` — Kommentar „Keine accountweiten Profile“ (`types/trips.ts` L410–414) | Reise |
| Readiness-API | `RequirementsTravellerInput`: Residence, Citizenship-Codes, Documents ohne Nummern, CredentialOptions | Request |
| Flug-Suche | `flugPassagiereAusReise(reise: Pick<Trip, 'travellers'>)` → `{ adults, children: 0, infants: 0 }` | Booking search |
| Hotel/Mobility | analog adults/count | Booking search |
| Seasonal-Port | Test verbietet Citizenship/Document/LLM-Felder (`lib/seasonal/provider-anfrage.test.ts`) | Foundation context |
| Safety | nur Citizenship-Codes wenn `travellerDependent` (`lib/safety/engine.ts`) | Safety facts |
| Registry | `AccountRegistryTraveller.authority = 'account_registry'` | Contract only |

Compile-Zeit-Grenze: Registry ist nicht `TripTraveller`-zuweisbar (`account-registry.test.ts`).

---

## 6. Guest-Lifecycle

**Implemented**

- Guest speichert denselben `Trip`-Graph inkl. `party` in `jetnity:guest-trips:v2` / Reise `v3`.
- Legacy-Singular-Guest-Objekte expandiert der Legacy-Leser, statt sie zu verwerfen (`lib/trips/gastspeicher.test.ts`).
- Übernahme-Reihenfolge (`lib/trips/uebernahme.ts`): `reise_anlegen` → `party_schreiben` → Readiness → lokalen Draft erst nach Erfolg löschen.
- Idempotenz: `unique (user_id, client_ref)` / `on conflict do nothing`.
- `GastreiseBruecke` kopiert Citizenship- und Document-Arrays inkl. `citizenshipClientRef`.
- `travellerClientRef` überlebt Guest→Account für Readiness (`lib/readiness/uebernahme.test.ts`).

**Absent**

- Account-Registry-Claim.
- Personen-Dedup.
- Server-seitige Guest-Identität / Guest-RLS.

---

## 7. Ownership / RLS / Collaboration

**Implemented:** Single-account-owner. Policies auf `trip_travellers`, `trip_traveller_citizenships`, `trip_traveller_documents`, `trip_readiness_items`: `user_id = (select auth.uid())`. Composite-FKs `(trip_id, user_id)` und Document→Citizenship verhindern Cross-Trip-/Cross-User-Refs.

Write-Inventory: produktiver Code spricht Child-Tabellen nicht direkt an (`lib/readiness/p2-ta04-write-path-inventory.test.ts`). C1 entfernt produktives `trip_travellers` DELETE zugunsten `party_loeschen`.

**Partial:** C2 (REVOKE direkter DML / optional DEFINER) ist Residual, Product-Owner-gegatet (ADR-0180).

**Absent:** Share-Tabelle, Collaborator-Policies, Traveller-Owner ≠ Trip-Owner. PR #28 bleibt `KEEP-FUTURE`. PO-Approval: Collaboration darf Snapshots zeigen, nicht fremde Registry.

---

## 8. Trip Workspace und Dokumentwahl

`TripWorkspace` reicht Party-Writes an `Reisevorbereitung`. Account-Workspace (`KontoArbeitsbereich.tsx`) verdrahtet `travellerSetzen` → `party_schreiben`, übergibt aber **keine** `officialEvaluations`.

Attention erzeugt Slots pro Credential-Option × Destination × Requirement (`lib/trips/attention.ts`). Ohne Documents: `${clientRef}:none`. Keine Citizenship-only-Optionen.

Vergleich (`credentialOptionenVergleichen`) ist library-only. UI-Copy:

> Offizielle Prüfung noch nicht verfügbar. Angaben werden nur erfasst, nicht bewertet.

und `VERGLEICH_NICHT_VERFUEGBAR` = „Noch nicht zuverlässig vergleichbar.“

**Keine zweite persistierte Wahrheit.** Winner wird nicht geschrieben. Itinerary selektiert kein Dokument.

Risiko „zweite Wahrheit“:

| Risiko | Bewertung |
| --- | --- |
| Legacy-Spalten | managed, nicht vom Write-Pfad beschrieben |
| `travellers` count vs `party[]` | **partial** — Slots vs Profile können divergieren (`lib/readiness/party.ts`) |
| Client-local Official | by design, nicht persistiert; API unverdrahtet |
| Registry vs Snapshot | Authorities getrennt; Registry nicht persistiert |

---

## 9. Route / Transit / Multi-Destination

Route bleibt traveller-neutral (`lib/route/ableitung.ts`). Readiness-Kontext mischt Stage-Länder + Route origin/transit/destinations (`lib/readiness/kontext.ts`).

Engine erzeugt getrennte Evaluations je Traveller, Destination und Transitland (`lib/readiness/engine.test.ts`). Transit ohne belastbare Route → `insufficient_context`. Fingerprint enthält sortierte Citizenship- und Document-Mengen (`docs/TRAVELLER_CONTEXT.md`; `READINESS_FINGERPRINT_VERSION = 'v4'`).

Dokumentwahl ist nicht route-selektiert. Alle Optionen werden gegen alle Route-Länder enumeriert.

---

## 10. Entry / Visa / Requirements

```
Trip + party → requirementsAnfrageAusReise → requirementsAuswerten → OfficialEvaluation[]
                     ↑                              ↑
              readinessReisekontext          requirementsProviderAus() → null
```

Tests (`lib/readiness/engine.test.ts`):

- ohne Provider keine `required`/`not_required`/`conditional`
- fehlende Nationalität → `insufficient_context`
- keine Transit-/Health-Erfindung
- LLM/Browser überschreibt Official nicht
- widersprüchliche Providerzeilen → `unknown` / recheck

Das ist die richtige Grenze. Eine Empfehlungs-UX vor Provider-Aktivierung hätte keinen neuen Wahrheitsspielraum.

---

## 11. Provider / Search-Grenze

| Port | Traveller-Felder im Request | Status |
| --- | --- | --- |
| Flights | nur `adults` aus Kopfzahl | **implemented boundary** |
| Hotels | `adults` aus `trip.travellers` | **implemented boundary** |
| Mobility | count | **implemented boundary** |
| Seasonal | keine Citizenship/Document | **tested** |
| Requirements | datensparse Arrays + options, keine Nummern | **port ready, provider absent** |
| Safety | Citizenship-Codes wenn dependent | **implemented** |

Parallele offene Adapter-Audits (#187–#190) dürfen diese Grenze nicht still aufweichen. Citizenship/APIS-Felder erst bei nachweislicher Providerpflicht.

---

## 12. UX-Zustand

| Anforderung | Klasse | Evidence |
| --- | --- | --- |
| Progressive Disclosure Citizenship | **implemented** | Policy + `Reisevorbereitung.tsx` Copy |
| Bis 8 Citizenships / 12 Documents | **implemented** | Formulare + Limits |
| Document↔Citizenship-Link | **implemented** | Select + Clear-on-remove |
| Expiry-Erfassung | **implemented** | date only |
| Missing-fact Warnings | **implemented** | `slotMissingFactsErgaenzen` |
| Gruppenunterschiede | **implemented** | `gruppenUnterschiede` |
| Default-/Best-Pass | **absent** | by policy |
| Winner-UX | **absent** | library unverdrahtet |
| Expiry-Attention vor Reiseende | **absent** | Feld vorhanden, kein Signal |
| Read-only ohne Write-Handler | **implemented** | `Reisevorbereitung.tsx` |

---

## 13. Privacy / Security

Gespeichert: ISO-2 Citizenship, Document-Typ, Issuer, Expiry, Residence, neutrales Label.

Nicht gespeichert und in Parsern abgewiesen: Nummern, MRZ, Scan, Biometrie, DOB, Health.

Writes: `SECURITY INVOKER`, Owner-Isolation, Caps, Label-Regex gegen Nummernmuster (`lib/readiness/schema.ts`).

Besondere Product-Owner-Gates bleiben für: Production-Identity/RLS-Migration, sensible Dokumentpayloads, Provider-live/paid, Collaboration-Ownership.

`main` Branch Protection: in diesem Run `403` auf die Protection-API. Letzte dokumentierte Evidence in Continuity-Dateien: `protected=false`. Dieser Audit ändert das nicht.

---

## 14. AP-5–AP-12 und TW-Sequenz

Live auf Baseline `69ef27b1` ( Continuity + Code; ältere Planzeilen können hinterherhinken):

| Slice | Stand |
| --- | --- |
| AP-1–AP-4 | integriert |
| AP-5 Gate 0 + S1–S5 | integriert |
| AP-5 P1–P5 | nicht gestartet / PO-gegatet |
| AP-6a Gate 0 | integriert; Runtime geparkt auf Legal-Content |
| AP-6b | nicht gestartet |
| AP-7 Gate 0 + PO Dual-Authority + S1 Contract | integriert |
| AP-7-S2+ Persistenz/UI/Import | nicht gestartet / PO-gegatet |
| AP-8–AP-12 | nicht gestartet |
| TW-1–TW7-A | integriert |
| TW-8 | geschlossen hinter S5-B + realer Provenance |
| P2-TA-03/04/06 | integriert |
| C2 | offen / PO-gegatet |

**Doc-Drift auf `main`:** `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` AP-7-Zeile nennt S1 noch „self-expiring auf Draft-PR #145“. S1 ist integriert (`4ec83f36` / ADR-0187). Nicht in diesem Audit still umgeschrieben; Continuity-Fix ist ein eigener Docs-Slice.

**ACTIVE_WORK_STATUS auf dieser Baseline** führte vor diesem Stamp den Provider-S5-B-Block #182. Live offene PRs enthalten #182 nicht; parallel offen sind u. a. #187–#191. Live-Evidence gewinnt.

---

## 15. Tests und Lücken

**Vorhanden (Auswahl):**

- `lib/readiness/traveller-kontext.test.ts` — Multi-Citizenship, kein Doc-from-Citizenship, Issuer ≠ Citizenship
- `lib/readiness/traveller-anfrage.test.ts` — sensible Keys, fail-closed Children
- `lib/readiness/engine.test.ts` — Provider-Invention, Multi-Destination/Transit, Multi-Traveller
- `lib/readiness/vergleich.test.ts` — Winner-Regeln fail-closed
- `lib/traveller/account-registry.test.ts` — Dual-Authority, 2+ Citizenships/Documents, keine Defaults
- `lib/readiness/p2-ta04-write-path-inventory.test.ts` — RPC-only Writes
- `lib/trips/gastspeicher.test.ts` — Guest Legacy→Party
- `lib/readiness/uebernahme.test.ts` — Guest Readiness `travellerClientRef`
- `lib/seasonal/provider-anfrage.test.ts` — keine Traveller-PII im Seasonal-Port
- `lib/trips/foundation-e-select.test.ts` — Legacy-Select-Fallback

**Fehlend / schwach:**

- Kein Repo-DB-RLS-Test für Cross-User Traveller-Children (C1/C2 Residual).
- Kein dedizierter E2E-Test, dass `GastreiseBruecke` Multi-Citizenship/Multi-Document vollständig überträgt (Mapping existiert; Abdeckung indirekt).
- Kein Component-Test der Mehrfach-Dokument-Form.
- `credentialOptionenVergleichen` nicht im Produktpfad verdrahtet.
- Keine `route.test.ts` neben der Requirements-API.
- Keine Tests für Registry-Persistenz, Collaboration-RLS, Expiry-Attention, Preferred-Document-UX (letztere bewusst ungebaut).

In diesem Audit-Slice wurden **keine** Test-Suites als Abnahme ausgeführt; die Dateien wurden gelesen. Task-Commit-CI auf `587e58b1`: Typecheck/Lint/Build SUCCESS; Auth-Check SUCCESS; Vercel SUCCESS. Dieser Stamp erzeugt einen neuen Head und invalidiert jene Gates.

---

## 16. Native / Mobile

Ein `Trip` / `TripTraveller` für Guest und Account. Workspace-Logik geräteübergreifend (ADR-0163). Registry bewusst nicht `TripTraveller`-förmig.

Kein Native-Code im Repo. Kanonischer Vertrag gilt trotzdem: keine plattformspezifische Identity. Heute sähe Native nur trip-scoped `party[]`.

---

## 17. Pflichtfragen des Tasks

### Was ist der kanonische Entity-Graph?

Account (`profiles`) → (geplant) Account-Registry-Traveller → Citizenships + Documents.  
Trip-Owner → Trip-Snapshot-Traveller → Citizenships + Documents.  
Credential Options und Evaluations sind abgeleitet.  
Siehe Vertrag §2.

### Welche IDs sind stabil, welche Attribute mutierbar?

Stabil: UUID `id`, `clientRef` (Snapshot unique je User/Trip; Registry UUID-backed). Snapshot-IDs bei Materialisierung **neu und disjunkt**.  
Mutierbar: Label, Residence, Citizenship-Set, Document-Set.  
`optionRef` ist keine Identität. `trips.travellers` ist Kopfzahl.

### Wie Default-Dokument ohne universelle Korrektheit?

**Gar nicht als Identitätsfeld.** Kein `preferred`/`default`/`primary`. UX darf eine kontextscharfe Empfehlung zeigen, sobald Evidence existiert. Persistierte Wahl nur über späteren evaluationsscharfen Vertrag (ADR-0186 Punkt 8).

### Wie kontextspezifische Optionen ohne persistierte Legal-Truth?

`credentialOptionsAus` × Route × Provider-Zeilen → `OfficialEvaluation` → optional `credentialOptionenVergleichen`. Ergebnis bleibt Evaluation. Identity-Rows unverändert.

### Grenze gespeicherte Fakten vs Eligibility?

Gespeichert: datensparse Identity. Dynamisch: Official/Provider. `TripReadinessItem` = User-Status only. Ohne Provider: `unknown` / `unavailable` / `insufficient_context`.

### Guest claim / Dedup?

Heute: trip-scoped Copy, idempotent über `client_ref`.  
Künftig: Registry-Import Opt-in, kein Auto-Match, Merge nur nach Bestätigung.

### Ownership vor Collaboration?

Erst Share-/Permission-ADR. Collaborator: Snapshots only. Nicht in AP-7-S2 mischen. PR #28 nicht beiläufig reaktivieren.

### Welche Gaps blockieren das Traveller/Passport-Programm?

1. Keine accountweite Persistenz (AP-7-S2+).
2. Kein Requirements-Provider → keine echte Empfehlung.
3. Kein Collaboration-Ownership.
4. C2 Privilege-Residual.
5. Count-vs-Party-Entkopplung.
6. Legacy-Singular-Spalten.
7. Unverdrahtete Requirements-API / Vergleichs-UI (letzteres ohne Provider wenig wert).

Foundation E selbst blockiert nicht.

---

## 18. Architektur-Empfehlung

**Keine neue Architekturwahl.** Dual-Authority ist bereits PO-freigegeben. Dieser Audit bestätigt sie gegen aktuellen Code und schließt die Lücke „Empfehlung vs Identität“ ausdrücklich.

Empfehlung an den Technical Lead:

1. Vertrag und Backlog als Architecture-Evidence behandeln, nicht als Startauftrag.
2. Foundation E unverändert lassen.
3. AP-7-S2 nur mit Persistence-ADR + PO Identity/RLS/Migration-Gate + frischer Generation.
4. Recommendation-UX nicht vor Requirements-Provider bauen.
5. Adapter-Slices (#187–#190) an der Search-Grenze Kopfzahl-only halten.
6. Stale Plan-Zeile zu AP-7-S1 / Draft-PR #145 in einem späteren Continuity-Docs-Slice korrigieren.
7. Kein Default-Pass, keine Nummern, kein stiller Guest-Registry-Import.

---

## 19. `origin/main` Drift

Re-Fetch vor diesem Stamp:

| Feld | Wert |
| --- | --- |
| `origin/main` | `69ef27b169780e41ba506a69acb15caafa645517` |
| Merge-Base | `69ef27b1` |
| Behind | **0** |
| Ahead vor diesem Stamp | **1** (Task-Commit `587e58b1`) |
| Task-Baseline | identisch; kein Drift |

`main`-Tip: `Integrate Skyscanner Flights offline adapter foundation`. Keine Traveller-/Account-Registry-Runtime auf `main` seit Task-Baseline.

Parallel offene Drafts (nicht mergen, nicht als Current Traveller-Truth lesen): #191 Security/Privacy Audit, #187–#190 Provider-Adapter, historische #88/#52/#50/#40/#39, Future #28.

---

## 20. Non-Scope gehalten

Keine Änderung an `app/`, `components/`, `lib/`-Runtime, `supabase/migrations`, Grants, RLS, Auth-Config, Vercel, Branch Protection. Keine echten Dokumentdaten. Keine externen Visa-Calls. Kein Ready. Kein Merge. Kein Folgeslice.
