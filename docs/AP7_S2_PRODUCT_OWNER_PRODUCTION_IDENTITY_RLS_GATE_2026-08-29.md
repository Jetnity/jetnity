# Jetnity – AP-7-S2 Product-Owner Production / Identity / RLS Gate

Stand: 29. August 2026  
Status: **PRODUCT-OWNER DECISION REQUIRED / PROPOSAL ONLY / NO MIGRATION OR PRODUCTION MUTATION AUTHORIZED YET**  
Workstream: Account / Traveller  
Proposed next logical slice: **AP-7-S2 – Account Traveller Registry Persistence / Identity / RLS**

> Live-Evidence gewinnt immer. Dieses Dokument ist die konkrete Entscheidungsvorlage für das bereits dokumentierte besondere Product-Owner-Gate. Es startet keine Implementierung, erstellt keine Migration und mutiert weder Supabase Development noch Production.

## 1. Warum diese Entscheidung jetzt erforderlich ist

Die verbindliche Build-Reihenfolge verlangt nach dem Traveller-/Multi-Citizenship-Programm die vollständige Account Platform, bevor Provider Runtime weiter vorgezogen wird. Das aktuelle Traveller-Audit identifiziert AP-7-S2 als ersten echten Blocker für accountweite Wiederverwendung.

Bereits integriert und nicht neu zu bauen:

- trip-scoped Foundation E mit 1:n Citizenships und 1:n Documents;
- explizite Document↔Citizenship-Relation;
- kein Default-Pass / keine Default-Citizenship;
- Guest→Account Trip-Copy bleibt trip-scoped;
- AP-7 Gate 0;
- Product-Owner-Freigabe der **Dual-Authority**-Architektur;
- AP-7-S1 Shared Domain Contract und explizite Registry→Trip-Snapshot-Projektion.

Die Product-Owner-Architekturfreigabe sagt ausdrücklich: **Production migration / Identity / RLS bleibt separat gegated**. Genau dieses Gate ist jetzt erreicht.

## 2. Frisch verifizierte Live-Baseline

Repository / Delivery:

- `main @ 149d9213d3d745aae3e3b1d060a12b033bbc57f3`
- Post-Merge GitHub Actions CI `33271466452` / #1261 = **SUCCESS** auf exakt diesem SHA
- Vercel Production `dpl_51NKub4TryBk43E2EGuWSQxXoKNs` = **READY** auf exakt diesem SHA
- `main protected=false` bleibt bekanntes Governance-Risiko; Non-Scope dieses Gates
- keine AP-7-S2-Branch/PR/Implementierung vorhanden
- keine Skyscanner Create/Poll-Transport-Implementierung vorhanden; Provider bleibt hinter dem Binding Build Order
- offene PRs #52/#50/#40/#39/#28 sind historische/future Drafts und nicht der aktuelle Integrationspfad

Supabase Production `qscbgcdmivbbnzrcyegn`, am 29. August 2026 **read-only** neu geprüft:

- `profiles`, `trip_travellers`, `trip_traveller_citizenships`, `trip_traveller_documents` existieren und haben RLS aktiv;
- `profiles.user_id → auth.users(id) ON DELETE CASCADE`, `UNIQUE(user_id)`;
- trip-scoped Traveller-Tabellen erzwingen Ownership über `user_id`, Composite-FKs und owner-only `auth.uid()`-Policies;
- `trip_traveller_citizenships`: ISO-2, eindeutiges Land je Traveller, max. 8 via bestehender Foundation-E-Grenze;
- `trip_traveller_documents`: `passport | national_id | unknown`, optionaler expliziter Citizenship-FK, max. 12;
- bestehende Dokumenttabellen enthalten **keine** Dokumentnummern, Scans, MRZ oder Biometrie;
- es gibt **keine** Account-Traveller-Registry-Tabelle und keinen Account-Registry-Runtime-Pfad.

Keine Production-Mutation wurde für diese Entscheidungsvorlage durchgeführt.

## 3. Binding Architektur, die nicht neu entschieden wird

Bereits Product-Owner-approved:

> **Account Registry = wiederverwendbare aktuelle Traveller-Identität/Fakten.**  
> **Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Daraus folgen für S2 zwingend:

1. Registry-Änderungen schreiben bestehende Trips niemals still um.
2. Trip-Snapshots erhalten eigene IDs/ClientRefs und bleiben unabhängig.
3. Kein globaler/default Passport, keine Primary-Citizenship.
4. Issuer Country ist nicht Citizenship.
5. Guest→Account Trip-Transfer importiert nicht automatisch in die Registry.
6. Registry bleibt privat account-owned; spätere Trip-Collaboration teilt sie nicht automatisch.
7. Keine besonders sensitiven Dokumentdaten im Core.

## 4. Konkreter vorgeschlagener AP-7-S2-Scope

### 4.1 Additive Tabellen

Der Technical Lead empfiehlt genau drei neue account-owned Tabellen, analog zur bewährten Foundation-E-Form, aber **ohne `trip_id`**:

#### `public.account_travellers`

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `client_ref uuid not null`
- `label text null`
- `residence_country_code text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `unique (user_id, client_ref)`
- zusätzlich eine Composite-Identity auf `(id, user_id)` für child ownership

Constraints übernehmen die bereits bewährten Foundation-E-Grenzen:

- Label leer → nicht persistieren bzw. normalisieren; wenn vorhanden max. 40 Zeichen;
- keine offensichtlichen Pass-/Ausweisnummern oder sensitiven Muster im Label;
- kein HTML;
- Residence nur ISO-2 oder `NULL`.

**Bewusst kein 20-Personen-Limit:** Die trip-scoped 20er-Grenze ist eine Party-Grenze einer konkreten Reise und darf nicht unbelegt als Account-Registry-Limit wiederverwendet werden.

#### `public.account_traveller_citizenships`

- `id uuid primary key default gen_random_uuid()`
- `traveller_id uuid not null`
- `user_id uuid not null default auth.uid()`
- `client_ref uuid not null`
- `country_code text not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Composite-FK `(traveller_id, user_id) → account_travellers(id, user_id) ON DELETE CASCADE`
- `unique (user_id, traveller_id, client_ref)`
- `unique (traveller_id, country_code)`
- ISO-2-Check
- max. **8** Citizenships je Registry-Traveller auch bei INSERT/UPDATE/Reparenting fail-closed
- Composite-Identity für den Document→Citizenship-FK

#### `public.account_traveller_documents`

- `id uuid primary key default gen_random_uuid()`
- `traveller_id uuid not null`
- `user_id uuid not null default auth.uid()`
- `client_ref uuid not null`
- `document_type text not null`
- `issuing_country_code text null`
- `citizenship_id uuid null`
- `expires_on date null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Composite-FK `(traveller_id, user_id) → account_travellers(id, user_id) ON DELETE CASCADE`
- Composite-FK für `citizenship_id`, der **denselben Traveller + denselben Owner** erzwingt; bei Citizenship-Löschung nur `citizenship_id` auf `NULL`
- `unique (user_id, traveller_id, client_ref)`
- `document_type ∈ {passport, national_id, unknown}`
- Issuer ISO-2 oder `NULL`
- max. **12** Documents je Registry-Traveller auch bei INSERT/UPDATE/Reparenting fail-closed

### 4.2 RLS / Grants

Auf allen drei Tabellen:

- `ENABLE ROW LEVEL SECURITY`;
- `anon`: **keine** Tabellenprivilegien;
- `authenticated`: nur `SELECT / INSERT / UPDATE / DELETE` unter owner-only RLS;
- SELECT/UPDATE/DELETE: `user_id = auth.uid()`;
- INSERT/UPDATE `WITH CHECK`: `user_id = auth.uid()`;
- kein Admin-Bypass in S2;
- kein Support-Bypass in S2;
- kein Service-Role-Produktpfad;
- kein `SECURITY DEFINER` in S2;
- keine Capability-/Collaboration-Policy in S2.

Die denormalisierte `user_id`-Spalte auf Children ist absichtlich Teil der Ownership-Grenze und wird zusätzlich per Composite-FK an den Parent gebunden, damit ein Child nicht durch manipuliertes `user_id` einem anderen Account oder Traveller zugeordnet werden kann.

### 4.3 Timestamps / Identity

- IDs und `client_ref` sind UUIDs und entsprechen damit dem bereits integrierten AP-7-S1 Domain Contract;
- `updated_at` wird server-/DB-seitig zuverlässig aktualisiert;
- keine fact-derived IDs (`person:0`, `document:passport:CH` etc.);
- Registry-IDs werden **nicht** als Trip-Snapshot-IDs wiederverwendet.

### 4.4 Migration / Rollout

Vorgeschlagene Reihenfolge nach Product-Owner-Freigabe:

1. eigener frischer Cursor-Agent / neue Generation für **AP-7-S2 only**;
2. additive Migration + DB-/RLS-/Ownership-Tests im Repository;
3. keine UI, kein Guest-Import, kein Trip-Rewrite;
4. zuerst non-production / Development-Verifikation;
5. unabhängiger Technical-Lead Exact-Head-Review;
6. vollständige CI + Vercel-Gates;
7. Production-Apply **nur derselben unabhängig geprüften Migration**, wenn Scope und Head unverändert sind;
8. sofortige read-only Production-Verifikation von Tabellen, Constraints, RLS, Grants und Row Counts;
9. Post-Merge/Production-Continuity persistieren.

Ein neuer Head oder eine Änderung an Tabellen-/RLS-/Grant-Semantik invalidiert die Freigabe für den konkreten Apply und verlangt erneute TL-/PO-Bewertung, soweit das besondere Gate materiell verändert wird.

## 5. Harte Non-Scope-Grenzen

AP-7-S2 darf **nicht** enthalten:

- Account Registry UI / CRUD-Screens;
- Registry→Trip Runtime-Materialisierung;
- Guest→Registry-Import oder automatische Deduplication;
- Änderung bestehender `trip_traveller*`-Tabellen;
- Live-FK oder Provenienzlink von Trips auf Registry;
- stilles Aktualisieren bestehender Trips;
- Pass-/Dokumentnummern;
- Scans/Bilder;
- MRZ;
- Biometrie;
- Geburtsdatum oder Health-Daten;
- Auth/Session/MFA/AAL-Grundänderung;
- Admin-/Support-Einsicht in fremde Registry;
- Collaboration-RLS;
- Provider Runtime / Secrets / paid calls / live activation;
- TW-8;
- Payments;
- Branch Protection;
- Build-Order-Änderung;
- Backfill aus bestehenden Trips;
- destruktive Migration.

## 6. Hauptrisiken und Mitigation

### P1 – Cross-account data exposure durch RLS-/Ownership-Fehler

**Risiko:** Traveller-Fakten eines Accounts könnten einem anderen Account sichtbar/schreibbar werden.  
**Mitigation:** owner-only `auth.uid()` auf jeder Tabelle; composite Parent/Child-Ownership; adversarielle Cross-User-Tests; `anon` ohne Grants; kein Admin-/Service-Role-Bypass.

### P1 – Identity confusion / falsche Child-Zuordnung

**Risiko:** Citizenship/Document wird durch manipulierte IDs an fremden Traveller/Owner gebunden.  
**Mitigation:** Composite-FKs mit `user_id`; Document→Citizenship muss denselben Traveller und Owner referenzieren; keine bloße Single-Column-FK.

### P1 – Dual-Authority versehentlich in Live-Link verwandelt

**Risiko:** spätere Trips könnten historische Wahrheit verlieren.  
**Mitigation:** S2 ändert keine Trip-Tabelle und fügt keinen Registry-FK in Trip-Snapshots ein. Materialisierung bleibt späterer expliziter Slice.

### P2 – Sensitive data creep

**Risiko:** Registry wird als Ablage für Passnummern/Scans missverstanden.  
**Mitigation:** solche Spalten existieren nicht; Domain Boundary weist sensitive Keys ab; Kommentare/Checks und Tests dokumentieren das explizit.

### P2 – Direktzugriff über Supabase REST trotz noch fehlender UI

**Risiko:** Nach Grants können authentifizierte Nutzer die eigene Registry technisch bereits direkt über Supabase ansprechen.  
**Mitigation:** DB-Constraints und RLS müssen deshalb vollständig produktionsreif sein, nicht nur UI-validiert. Das ist bewusst Teil dieses Gates. Kein `anon`, kein Cross-User-Zugriff. Ein späterer unterstützter CRUD-Vertrag kann enger werden, ohne die Ownership-Wahrheit zu ändern.

### P2 – Keine accountweite Traveller-Anzahlgrenze

**Risiko:** Ein Account könnte viele Registry-Traveller anlegen.  
**Entscheidung:** In S2 **kein erfundenes 20er-Limit**, da 20 die Trip-Party-Grenze ist. Rate-/Quota-/UX-Regeln sind ein späterer evidenzbasierter Vertrag. RLS schützt Isolation, nicht Abuse-Quota.

### P3 – `main protected=false`

Bekanntes Governance-Risiko. Kein Grund, die AP-7-Architektur fachlich zu verwässern; Branch-Protection-Änderung bleibt separat.

## 7. Rollback-/Failure-Strategie

Da S2 additiv und ohne UI/Import/Backfill startet:

- vor ersten realen Registry-Writes sind die neuen Tabellen erwartungsgemäß leer;
- bei einem Gate-Fehler wird Production nicht weiter geöffnet und kein Folgeslice gestartet;
- RLS/Grant-Fehler werden vor Runtime-Nutzung korrigiert;
- destruktives `DROP` auf Production wird **nicht** als automatischer Rollback ausgeführt;
- sobald reale Registry-Daten existieren, braucht jede destruktive Entfernung wieder ein eigenes Production-/Data-Gate.

## 8. Technical-Lead-Empfehlung

**FREIGEBEN**, aber ausschließlich in der oben beschriebenen engen Form.

Warum:

- AP-7-S2 ist der aktuelle bindende Traveller-/Account-Blocker;
- Dual-Authority wurde bereits ausdrücklich Product-Owner-approved;
- S1 liefert bereits den strikten shared Domain Contract;
- der Vorschlag ist additiv, datensparsam und lässt Trip Current Truth unangetastet;
- er öffnet weder sensible Dokumentablage noch Provider/Payments/TW-8;
- owner-only RLS kann auf dem bewährten Foundation-E-Muster aufgebaut und adversariell geprüft werden.

Provider-Transport jetzt vorzuziehen wäre gegenüber der bindenden Build Order schlechter begründbar, solange AP-7-S2 bewusst auf diese Entscheidung wartet.

## 9. Erforderliche Product-Owner-Entscheidung

### Empfohlene Freigabeformulierung

> **„Ja, AP-7-S2 wie in `docs/AP7_S2_PRODUCT_OWNER_PRODUCTION_IDENTITY_RLS_GATE_2026-08-29.md` beschrieben freigegeben – einschließlich des späteren Production-Apply derselben unabhängig geprüften additiven Migration nach vollständigen Technical-Lead-/CI-/Development-Gates.“**

Diese Freigabe würde **nur** den beschriebenen S2-Scope autorisieren. Sie autorisiert nicht AP-7-S3/CRUD-UI, Registry→Trip-Materialisierung, sensitive Dokumentdaten, Provider-Live, Payments oder andere besondere Gates.

Alternativ kann der Product Owner S2 ablehnen oder einzelne Scope-Punkte ändern. Jede materielle Änderung wird vor Implementierung neu präzisiert.

## 10. STOP

Bis diese Product-Owner-Entscheidung vorliegt:

- keine AP-7-S2-Migration authoren;
- keine Supabase Development-/Production-Mutation;
- keine RLS-/Grant-Änderung;
- kein Cursor-Implementierungsagent für S2;
- kein Ausweichen auf einen späteren Provider-Runtime-Slice nur um das Gate zu umgehen.
