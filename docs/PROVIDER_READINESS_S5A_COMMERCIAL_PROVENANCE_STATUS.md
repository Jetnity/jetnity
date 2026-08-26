# Provider S5-A – Commercial Provenance Domain Contract – Status

Stand: 26. August 2026  
Agent: `Jetnity provider readiness audit`  
Branch: `feat/provider-s5-commercial-provenance-contract`  
Baseline: `origin/main @ 71230c280b1cd2500d224095fa84f4472101d31f`  
PR #77: **MERGED** (`75dfb4308e9aeba2d14353831f016eee84c4fac6`)  
Status: **IMPLEMENTIERT / NICHT READY / NICHT MERGEN / WARTE AUF TECHNICAL-LEAD-REVIEW**

Auftrag: `docs/PROVIDER_READINESS_S5A_COMMERCIAL_PROVENANCE_TASK.md`.  
ADR: `docs/ADR_0168_COMMERCIAL_PROVENANCE_DOMAIN_CONTRACT.md`.

`docs/ACTIVE_WORK_STATUS.md` wurde **nicht** geändert.

---

## 1. Live-Evidence vor Implementierung

| Fakt | Wert |
| --- | --- |
| `origin/main` | `71230c280b1cd2500d224095fa84f4472101d31f` |
| PR #77 | MERGED, Audit-only, kein Runtime-Contract |
| Offene PRs ohne Commercial-Typen-Kollision | #80 QS-2 Admin AAL2; #52/#50/#40/#39/#28 historisch/docs |
| Alter Audit-Branch | nicht weiterverwendet |

## 2. Ist-Vertrag vor Änderung

Optionen und `trip_items` kannten `provider` + `externalRef` + Betrag/Währung. Es gab kein `retrievedAt`, `freshUntil`, requested-vs-quoted Currency, Commercial-Stale, Affiliate-Provenance oder Multi-Provider-Konflikt. S1 bleibt Ops. Official/Safety/Seasonal bleiben Nicht-Offer-Truth.

## 3. Zielvertrag / tatsächlicher Diff

Neuer Contract in `lib/commercial-provenance/*`. Domain-Optionen bleiben fachlich getrennt; nur Kommentare + optionale Komposition `optionMitCommercialProvenance`. Keine Zod-Pflichtfelder an bestehenden Offers. Keine `trip_items`-Felder. Keine UI. Keine Factories. Keine Migration.

Der Vertrag kann ausdrücken:

- Provider-/Source-Identität;
- `retrievedAt` / `observedAt`;
- `freshUntil` nur bei quellenbelegter API/Snapshot-Quelle;
- requested vs quoted Currency ohne Conversion;
- Commercial-Status getrennt von Availability;
- External Ref als Provenance, nicht Trust;
- Affiliate `present` / `absent` / `unknown`;
- Multi-Provider-Konflikt ohne beste Quelle.

Fail-closed: ungültiger/zukünftiger `retrievedAt`, `freshUntil` vor `retrievedAt`, fehlende Source, Conversion ohne Evidence, Assistant-Overwrite, User-Intake ohne Freshness-Erfindung.

## 4. Domain-Grenzen

| Darf | Darf nicht |
| --- | --- |
| Gemeinsame Commercial-Provenance-Primitiven | UniversalOffer / S1 zu einem Offer-Modell ausbauen |
| Flight/Hotel/Activity/Transport-Modelle belassen | Official/Safety/Seasonal-Evidence mischen |
| Snapshot ≠ live | Availability als `available=true` erfinden |
| Conflict darstellbar lassen | Beste Quelle, Mittelwert, stille Conversion |

Traveller-Kontext ist für diesen Slice **nicht relevant**. Es werden keine Credentials erhoben.

## 5. P0 / P1 / P2 / P3

Taxonomie wie im S4–S8-Audit: P0 = akuter Production-Incident. Dieses Slice erzeugt keinen Production-Incident.

| ID | Klasse | Aussage |
| --- | --- | --- |
| `S5A-TW8-GATE-01` | TW8-START-GATE | TW-8 bleibt gesperrt, bis der Vertrag Technical-Lead-akzeptiert und S5-B/Anzeige geklärt sind |
| `S5A-P1-TW8-01` | P1-before-TW8 | Persistierte `trip_items` haben weiterhin keinen Zeitpunkt – ehrlich unknown, nicht in diesem Slice geschlossen |
| `S5A-ACT-GATE-01` | PROVIDER-ACTIVATION-GATE | Kein bezahlter/Production-Provider durch S5-A |
| `S5A-P2-01` | P2 | `itemTrust` wertet `externalRef` weiter als Herkunft, nicht als diesen Contract |
| `S5A-P3-01` | P3 | Suchkarten-Copy „Preis zum Auswahlzeitpunkt“ bleibt Präsentation ohne gespeicherten Timestamp |

Keine neuen P0.

## 6. Shared-Contract-Einschätzung

S5-A führt einen **neuen** Technical-Lead-kontrollierten Commercial-Provenance-Vertrag ein. Bestehende Shared Contracts ausserhalb dieses Scopes wurden nicht geändert:

- keine Auth/RLS/Traveller/Route/Payment-Änderung;
- keine `trip_items`-Zod-/DB-Änderung;
- keine Pflichtfelder an bestehenden Option-Schemas;
- S1 Ops unverändert.

STOPP für Persistence: siehe §7. Kein weiterer Shared Contract musste geändert werden.

## 7. Spätere Persistence-/Migration-Gates (S5-B, nicht implementiert)

`trip_items` / Graph speichern heute Betrag ohne Beobachtungszeit. S5-B braucht ein gesondertes Product-Owner-/Production-Gate, **bevor** Spalten geschrieben werden.

Empfohlene Minimalfelder, falls an `trip_items` (Alternative: eigene Snapshot-Tabelle):

| Spalte | Typ | Pflicht für Backfill |
| --- | --- | --- |
| `commercial_retrieved_at` | `timestamptz` nullable | nein; Altbestand `null` = unknown |
| `commercial_fresh_until` | `timestamptz` nullable | nein; fehlt = unknown, nicht current |
| `commercial_requested_currency` | `char(3)` nullable | nein |
| `commercial_quoted_currency` | `char(3)` nullable | Altbestand darf `price_currency` nicht still als requested lesen |
| `commercial_source_kind` | text nullable | Altbestand `user_intake` oder null/unknown |
| `commercial_provider_id` | text nullable | bestehendes `provider` nicht umdeuten, bis Mapping belegt ist |
| `commercial_external_ref` | text nullable | bestehendes `external_ref` bleibt Provenance, nicht Trust |
| Affiliate-Spalten | nullable | nur bei Evidence; Default absent/unknown |

Nicht speichern: Provider-Rohangebote, Tokens, Conversion-Kurse ohne Evidence, `available=true`.

Backfill-/Compatibility-Risiko: bestehende `price_amount`-Zeilen dürfen nach Migration **nicht** als current/live gelesen werden. Read-Path muss `retrieved_at IS NULL` → `unknown` machen. RLS analog zu `trip_items` Ownership; keine Service-Role-Abkürzung. Production-Migration ist ein besonderes Product-Owner-Gate.

**STOPP:** in S5-A nicht implementiert, nicht angewendet.

## 8. Tests

Neu: `lib/commercial-provenance/commercial-provenance.test.ts` – ungültiger/zukünftiger `retrievedAt`, `freshUntil` vor retrieved, fehlende Source, Currency-Mismatch, keine Conversion, stale ≠ current/live, fehlende Freshness = unknown, Affiliate absent/unknown, Multi-Provider-Konflikt, Assistant-Overwrite, Domain-Komposition ohne Schema-Mutation, `trip_items` ohne Provenance-Felder.

Bestehende Flight/Hotel/Activity/Transport-Tests bleiben die Semantik der Domänenoptionen. S5-A ändert ihre Pflichtfelder nicht.

Bekannte bestehende Wahrheitsschwäche, nicht in diesem Slice „grün gefixt“: UI-Copy und `itemTrust` dürfen nicht als `retrievedAt` gelesen werden.

## 9. Exact Head / Actions / Vercel

Wird nach Push und Gates in diesem Dokument nachgetragen. Cursor-Aggregat-Views sind keine Evidence.

## 10. STOPP

Nicht Ready. Nicht mergen. Kein S5-B. Kein S6/S7/S8. Kein TW-8. Keine Provideraktivierung.
