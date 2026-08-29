# Provider S5-B – Commercial Provenance Persistence Implementation Task

Stand: 29. August 2026
Status: **AUTHORIZED BY PRODUCT OWNER / IMPLEMENTATION TASK / DRAFT-PR ONLY**
Workstream: Provider Readiness / Commercial Truth
Cursor-Agent: **`Cursor-Agent: Jetnity provider readiness audit 4`**
Baseline: `main @ f638b4417140816bf7dfc26034cdb3da1538fd37`
PO-Gate: `S5B-G0-PO-MIG-01` **FREIGEGEBEN am 29.08.2026**

## 1. Ziel

Implementiere den ersten echten S5-B-Persistenzslice gemäß ADR-0197 / Option C: eine provider-neutrale, höchstens 1:1 an `trip_items.id` gebundene Relation `trip_item_commercial_provenance`, die ausschließlich persistierte S5-A-Evidence abbildet und deren Write-Authority untrusted Client-/Owner-Writes verhindert.

Dieser Slice schließt die Schema-/RLS-/Write-Authority-Grundlage. Er aktiviert **keinen** realen Provider und entsperrt **nicht** TW-8; TW-8 bleibt geschlossen, bis zusätzlich mindestens ein serverseitig nachgewiesener realer Snapshot existiert.

## 2. Verbindliche Architektur

Lies vollständig vor Änderung:

- `docs/ADR_0197_PROVIDER_S5B_OPTION_C_TARGET_ARCHITECTURE.md`
- `docs/PROVIDER_S5B_OPTION_C_TARGET_ARCHITECTURE_2026-08-29.md`
- `docs/ADR_0168_COMMERCIAL_PROVENANCE_DOMAIN_CONTRACT.md`
- `lib/commercial-provenance/domain.ts`
- `lib/commercial-provenance/pruefen.ts`
- `lib/commercial-provenance/quelle.ts`
- `lib/commercial-provenance/bindung.ts`
- `docs/PROVIDER_S5B_GATE0_READINESS_STATUS_2026-08-28.md`
- `docs/PROVIDER_S5B_GATE0_ARCHITECTURE_OPTIONS_2026-08-28.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`

Aktuelle Production-Evidence beim Task-Start:

- Supabase Project `qscbgcdmivbbnzrcyegn`
- PostgreSQL `17.6`
- Migration head `20260828015304_traveller_write_contract_integrity`
- `trip_items` ist owner-scoped und `authenticated` darf heute direkt INSERT/UPDATE; deshalb darf Commercial Provenance **nicht** denselben Owner-Write-Vertrag erben.

## 3. Implementierungs-Scope

Der Agent darf im Repository implementieren:

1. **Schema/Migration** für `public.trip_item_commercial_provenance` mit genau einem Current-Snapshot-Slot pro `trip_item_id`.
2. FK/Lifecycle an `public.trip_items(id)`; Löschen des Trip-Items muss keine orphaned Provenance hinterlassen.
3. Persistierte Felder nur aus dem ADR-0197-Evidence-Vertrag; keine persistierten `CommercialBewertung`-Felder.
4. DB-Constraints für die fünf S5-A-Domains (`flights`, `hotels`, `activities`, `mobility`, `rental_cars`), `persistenz='snapshot'`, `source_kind='persisted_snapshot'`, zulässige Evidence-Enums und strukturell sichere Werte.
5. **Kein `note`** und keine Erweiterung der S5-A-Domains.
6. RLS auf der neuen Tabelle.
7. Owner-read nur über das zugehörige `trip_item`; kein cross-user read.
8. `anon` keinerlei Zugriff.
9. `authenticated` darf die Provenance-Tabelle **nicht direkt INSERT/UPDATE/DELETE**.
10. Engen, serverseitig kontrollierbaren privilegierten Write-Vertrag. Wenn `SECURITY DEFINER` wirklich nötig ist: nicht in einem exponierten Schema; `search_path=''`; alle Objekte schema-qualified; `PUBLIC`-EXECUTE widerrufen; nur minimal notwendige Rolle(n) erhalten EXECUTE; Auth/Ownership muss im Funktionsvertrag explizit geprüft werden. Kein Service-Role-Normalpfad.
11. Write-Input darf Client-`sourceKind`/`persistenz` nicht vertrauen; der kontrollierte Pfad mintet ausschließlich `persisted_snapshot`/`snapshot` nach serverseitiger S5-A-Validierung.
12. Eine kontrollierte Legacy-Projektionsregel, damit `trip_items.price_amount`, `price_currency`, `provider`, `external_ref`, `booking_url` keine zweite unabhängige Provider-Hard-Truth werden.
13. Bestehenden Flight-Guard nicht schwächen. Guard-Matrix für `stay`, `activity`, `transfer`, `rental_car`, `note` gemäß ADR-0197 schließen; insbesondere dürfen Stay/Activity-Owner-Writes keine Provider-Hard-Truth-Preise erzeugen, Note darf keine Commercial-Legacy-Felder tragen.
14. `reise_anlegen` und andere bestehende DB-Write-Pfade auf Bypass prüfen und so härten, dass sie den neuen Trust-Vertrag nicht umgehen können.
15. Repo-/DB-Tests für Allow/Deny: own read; foreign read deny; anon deny; authenticated direct insert/update/delete deny; controlled trusted write allow; forged source/actor reject; note reject; wrong kind/domain reject; Legacy-Unknown bleibt unknown; gleiche Provider+Ref darf auf mehreren Items vorkommen.
16. Status/Handoff/Self-Review aktualisieren. Self-Review ist **kein** TL PASS.

Migration-Datei nach Repo-/Supabase-Konvention erzeugen; keine erfundene Dateinummer. Vor Schema-Authoring Supabase-CLI-Konventionen/aktuelle Doku prüfen.

## 4. Non-Scope / harte Grenzen

- **Keine Provider-Aktivierung**, Secrets, paid calls, Affiliate-Verträge oder Credentials.
- Keine echten Provider-API-Requests.
- Kein TW-8 / TW-9.
- Kein Account/AP-6/AP-7.
- Keine Auth/MFA/AAL-/Session-Änderung.
- Keine History-/1:n-Tabelle, keine Quote-History-Indizes.
- Kein Backfill aus Legacy-Handelsfeldern.
- Keine Fake-Freshness, keine stille Currency Conversion, keine erfundene Availability/Affiliate-Wahrheit.
- Kein Guest→Account-Minting von Provider-Provenance.
- Kein Service Role im normalen Produktpfad.
- **Keine Production-Supabase-Anwendung durch Cursor.** Der Agent authorisiert und testet Repository-Code/Migration, aber Production Apply erfolgt ausschließlich nach unabhängigem Technical-Lead Exact-Head-PASS und separater kontrollierter Ausführung durch den TL unter der bereits erteilten PO-Freigabe.
- Cursor setzt niemals Ready und merget niemals.
- Kein automatischer Folgeslice.

## 5. Security-/Threat-Model-Pflicht

Vor Abschluss dokumentieren:

- Angreifer: anon, eigener authenticated user, fremder authenticated user, kompromittierter Client, manipulierte RPC-/REST-Payload.
- Zu schützende Assets: Provider-Herkunft, Price/Currency-Evidence, externalRef, Affiliate-Evidence, Snapshot-Zeit.
- Trust boundary: nur serverseitig validierte S5-A-Quote darf Provider-Hard-Truth minten.
- Bypass-Pfade: direkte Data-API-DML, `reise_anlegen`, vorhandene Trigger/RPCs, Legacy-Flachfelder, Guest-Promotion.
- Warum Grants + RLS + privilegierter Write-Vertrag gemeinsam fail-closed sind.

## 6. STOP

Nach Implementation + Tests + Self-Review:

1. exakten Head nennen;
2. alle geänderten Dateien nennen;
3. lokale/CI-Testevidence nennen;
4. keine Production-Mutation durchführen;
5. **STOP für unabhängigen Technical-Lead Exact-Head-Review**.
