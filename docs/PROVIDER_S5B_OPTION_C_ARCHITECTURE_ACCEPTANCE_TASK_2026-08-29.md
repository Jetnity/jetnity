# Provider S5-B – Option C Architecture Acceptance – Agent Task

Stand: 29. August 2026  
Status: **AUTHORIZED / DOCS + DOMAIN-ARCHITECTURE ONLY / KEIN RUNTIME / KEINE MIGRATION / KEIN SUPABASE-WRITE**  
Workstream: Provider Readiness / Commercial Truth  
Cursor-Agent: **Jetnity provider readiness audit 3**  
Start-Baseline: `main @ f7527899d716edfb23d5cab8ab0d9d40bec0a0a5`  
Branch: `architecture/provider-s5b-option-c-acceptance-2026-08-29`

> Live-Evidence gewinnt immer. Vor Arbeit und vor Handoff `origin/main` erneut holen und Drift offen dokumentieren. Dieser Auftrag autorisiert **keinen** Production-Apply, keine Provider-Aktivierung und keinen TW-8-Slice.

## 1. Ausgangslage

Provider S5-A ist integriert. Provider S5-B Gate 0 wurde auf PR #141 unabhängig durch den Technical Lead auf Exact Head `a2f1f0a80e5715b5ab0fef39b671dd887ae0204b` bestanden und anschließend gemergt. Gate 0 hat mehrere Persistenzoptionen untersucht und **Option C – eigene provider-neutrale Provenance-Relation** als Zielarchitektur empfohlen, aber bewusst nicht angenommen oder implementiert.

Die aktuelle Binding Build Order hält TW-8 hinter Provider S5 und realer Commercial-Provenance-Evidence. Der Technical Lead wählt deshalb Option C jetzt als technische Zielrichtung innerhalb des bestehenden S5-A-Shared-Contracts. Diese Auswahl ist **keine** Freigabe für produktive Schema-/RLS-/Ownership-/REVOKE-/SECURITY-DEFINER-Änderungen und keine Provider-Aktivierung.

Live verifiziert am 29. August 2026:

- `main = f7527899d716edfb23d5cab8ab0d9d40bec0a0a5`;
- Actions auf diesem Exact Head erfolgreich;
- Vercel Production auf diesem Exact Head READY;
- Supabase Production `qscbgcdmivbbnzrcyegn` ACTIVE_HEALTHY;
- Production-Migrationshead `20260828015304_traveller_write_contract_integrity`;
- `trip_items` hat owner-scoped RLS, `authenticated` besitzt INSERT/UPDATE; nur Flight hat den spezifischen Legacy-Commercial-Field-Guard;
- keine aktive S5-B-Runtime, kein realer Provider, keine paid calls;
- `/privacy` und `/terms` bleiben ein separates AP-6a/Legal-PO-Gate und sind Non-Scope dieses Provider-Slices.

## 2. Ziel dieses Slices

Aus der Gate-0-Empfehlung einen **expliziten, implementierungsfähigen, aber noch nicht produktiv angewendeten Architekturvertrag** machen.

Der Slice soll genau festhalten, was ein späterer S5-B-Persistenzslice bauen darf und was nicht. Er darf keine Tabelle, Migration, RLS-Policy, Grant/Revoke, Function, Trigger, Runtime-Route oder UI implementieren.

## 3. Verbindliche Architekturentscheidung

Option C ist die Zielarchitektur:

1. Commercial Provenance wird später in einer **eigenen provider-neutralen Relation** an `trip_item_id` gebunden.
2. Der erste persistente Vertrag ist **ein aktueller Provenance-Snapshot pro `trip_item`**. Quote-History / 1:n-Historisierung bleibt späterer eigener Bedarf; nicht vorbauen.
3. Lifecycle und Ownership hängen am `trip_item`; Domain + Provider + belegte `externalRef` sind Refresh-/Match-Identität **am selben Item**, niemals ein datenbankweites Unique.
4. S5-A-Domains bleiben `flights`, `hotels`, `activities`, `mobility`, `rental_cars`. `note` ist keine Commercial-Provenance-Domain.
5. Persistiert wird **Evidence**, nicht zeitabhängige Bewertung. Insbesondere dürfen `freshnessStatus`, `commercialStatus`, `currencyStatus` und `darfAlsCurrentQuoteDargestelltWerden` nicht als autoritative Source of Truth modelliert werden; sie werden beim Lesen mit aktuellem `nowMs` neu aus S5-A abgeleitet.
6. Persistierte Provider-Truth entsteht nur aus einer **serverseitig validierten** Provider-Quote und wird als `sourceKind='persisted_snapshot'` / `persistenz='snapshot'` repräsentiert. Ein vom Client geliefertes `sourceKind` oder ein bloß gespeichertes `live_api` wird nie vertrauenswürdig.
7. `CommercialAkteur` bleibt Write-Time-Trust-Kontext der S5-A-Prüfer und wird nicht still zu einem persistierten S5-A-Feld.
8. Legacy-Zeilen ohne Provenance bleiben `unknown`. Kein Backfill aus `price_amount`, `provider`, `external_ref`, `booking_url`.
9. Legacy-Flachfelder dürfen nach S5-B keine unabhängige zweite Provider-Hard-Truth bilden. Ein späterer Implementierungsslice muss eine einzige kontrollierte Projection-/Read-Regel definieren.
10. Guest-LocalStorage und Guest→Account dürfen niemals Provider-Provenance oder `persisted_snapshot` aus untrusted Client-Daten minten.
11. Kein Service Role im normalen Produktpfad.
12. Kein Default-Provider, keine Fake-Freshness, keine stille Currency Conversion, keine erfundene Affiliate-/Availability-Wahrheit.

## 4. Guard-Matrix, die erhalten bleiben muss

Noch **nicht implementieren**, aber im Architekturvertrag eindeutig festhalten:

- `flight`: bestehender DB-Guard bleibt; nicht entfernen oder rewinden.
- `stay` / `activity`: untrusted Direct-DML/RPC darf keine Provider-Hard-Truth in der gesamten Legacy-Commercial-Menge minten, einschließlich Provider-abgeleitetem Betrag/Währung.
- `transfer` / `rental_car`: User-Intake von `price_amount` / `price_currency` bleibt zulässig; `provider` / `external_ref` / `booking_url` bleiben untrusted, solange kein späterer trusted S5-B-Write sie belegt.
- `note`: alle Legacy-Commercial-Felder später verbieten/leeren; `note` nicht in die S5-A-Domain-Enum aufnehmen.

Der genaue technische Guard-/Write-Mechanismus (z. B. enge privilegierte Funktion versus anderer kontrollierter Datenpfad) ist **nicht** in diesem Slice zu implementieren. Er muss in einem späteren separaten Implementation-Task mit Threat Model und Production-Gate entschieden werden.

## 5. Erwartete Änderungen

Erlaubt:

- eigener Architecture-Acceptance-/Status-/Handoff-/Self-Review-Text;
- neuer ADR-Eintrag, sofern die nächste freie ADR-Nummer live erneut geprüft wurde (bei Task-Erstellung war `ADR-0197` frei);
- gezielte Aktualisierung veralteter Provider-Readiness-Dokumentation, **nur** soweit nötig, damit S5-B nicht mehr als „nicht gestartet / keine Zielarchitektur“ beschrieben wird;
- klare Trennung `accepted target architecture` versus `not implemented`.

Nicht erlaubt:

- Dateien unter `supabase/migrations/`;
- Supabase-Mutation auf Production oder develop;
- Tabellen/Spalten/RLS/Policies/GRANT/REVOKE/SECURITY DEFINER;
- Runtime in `app/`, `components/`, Provider-Adapter oder produktive Server-Actions;
- Provider-Aktivierung, Secrets, paid calls, Verträge;
- TW-8/TW-9;
- Account/Legal/AP-6/AP-7;
- Auth/MFA/AAL/Session;
- Branch Protection;
- Ready/Merge;
- automatischer Folgeslice.

`docs/ACTIVE_WORK_STATUS.md` nicht eigenmächtig zu einer zweiten Current Truth umbauen. Falls eine zentrale Continuity-Anpassung nötig erscheint, im Handoff benennen; der Technical Lead integriert sie kontrolliert.

## 6. Required Evidence

Vor Handoff dokumentieren:

- aktuelles `origin/main`;
- Branch Exact Head;
- Merge-Base sowie Ahead/Behind;
- tatsächliche geänderte Dateiliste;
- keine Runtime-/Migration-/Schema-Datei im Diff;
- relevante Tests/Docs-/Type-Checks, soweit durch die Änderungen betroffen;
- GitHub Actions auf Exact Head;
- Vercel Preview auf Exact Head;
- offene Review-/Toolbar-Threads;
- bestätigte Non-Mutation von Supabase;
- P0/P1/P2/P3 inklusive der bestehenden S5-B-P2-Restbefunde.

## 7. Definition of Done

Review-bereit erst wenn:

1. Option C ausdrücklich als Zielarchitektur angenommen ist, ohne Production-Freigabe zu behaupten.
2. 1:1 current snapshot pro `trip_item` als erster Scope festgelegt ist; History nicht vorgebaut wird.
3. alle zwölf Architekturregeln und die Guard-Matrix konsistent dokumentiert sind.
4. S5-A / ADR-0168 nicht umgedeutet wird.
5. TW-8 weiterhin geschlossen bleibt.
6. der nächste Runtime-/Persistence-Slice als **separater** Schritt beschrieben wird und Production-Migration/RLS/privilegierte Writes ausdrücklich Product-Owner-Gates bleiben.
7. Self-Review keine Technical-Lead-Freigabe behauptet.

## 8. STOPP

Nach der Autorenarbeit auf Draft-PR stoppen.

- Nicht Ready setzen.
- Nicht mergen.
- Kein S5-B-Runtime-/Migration-Folgeslice starten.
- Keine Production-/Supabase-Mutation.

Der nächste Schritt ist ausschließlich der unabhängige Technical-Lead-Exact-Head-Review.