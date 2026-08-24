# Jetnity – Provider-Readiness Audit Auftrag

Stand: 24. August 2026
Status: **Audit ausgeführt / unabhängiger Technical-Lead-Review PASS / planning accepted / keine Implementierungsfreigabe**
Branch: `audit/provider-readiness`
Draft-PR: `#45`
Verantwortlicher Cursor-Anzeigename: `Jetnity provider readiness audit`

## Ziel

Dieser Workstream prüft, ob Jetnity technisch und fachlich bereit ist, später reale Reise-Provider kontrolliert anzuschließen, ohne bestehende Truth-, Security-, Kosten-, Lizenz- oder UX-Verträge zu verletzen.

Der Audit ist provider-neutral. Er soll keine Anbieter bevorzugen und noch keine echten Provider aktivieren.

## Pflichtquellen

Vor Beginn vollständig lesen und gegen den tatsächlichen Code verifizieren:

- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/ACTIVE_WORK_STATUS.md`
- relevante Fach-/Policy-Dokumente für Flights, Hotels, Activities, Mobility/Transfers, Rental Cars, Readiness, Safety und Seasonal
- aktueller Code der jeweiligen Domain-Adapter, API-Routen, Schemas, Persistence- und Evidence-Grenzen

Bei Widersprüchen gilt nicht die Chat-Historie, sondern der verifizierte Repository-/Runtime-Stand. Widersprüche dokumentieren, nicht raten.

## Zu auditierende Domänen

Mindestens:

1. Flights
2. Hotels / Accommodation
3. Activities / Tickets
4. Mobility / Transfers / Train / Bus / Ferry-nahe Adaptergrenzen
5. Rental Cars
6. Travel Requirements / Readiness
7. Safety & Disruption
8. Travel Timing & Seasonal

Zusätzlich prüfen, ob gemeinsame Provider-Verträge sinnvoll zentralisiert werden können, ohne Fachdomänen künstlich zu vermischen.

## Pro Domäne zwingend prüfen

### 1. Request-Grenze

- Welche Eingaben verlassen Jetnity?
- Sind Locale, Currency, Traveller-Kontext, Citizenship, Dates, Route und Preferences sauber getrennt?
- Gibt es Browser-/Client-Felder, die fälschlich als Provider-Truth wirken könnten?
- Sind personenbezogene Daten minimiert und nur dort vorgesehen, wo fachlich erforderlich?

### 2. Response-/Truth-Grenze

- Welche Providerdaten dürfen kanonische Jetnity-Truth werden?
- Welche Daten bleiben reine Offer-/Search-/Suggestion-Evidence?
- Wo fehlt Provenance?
- Source / Authority / Freshness / Scope / Retrieved-at / Provider-ID getrennt?
- `unknown`, stale, malformed, timeout, unavailable und conflict fail-closed?
- Keine LLM- oder Browser-Felder als Provider-Evidence aufwerten.

### 3. Adapter-/Port-Architektur

- Gibt es eine klare provider-neutrale Schnittstelle?
- Ist Provider-spezifisches Mapping von Domain-Truth getrennt?
- Sind Versionierung und Schemaänderungen beherrschbar?
- Lassen sich Provider später austauschen oder parallel vergleichen?
- Sind Preisvergleich/Aggregator-Szenarien möglich, ohne Buchungs- und Truth-Semantik zu vermischen?

### 4. Failure-Verhalten

- Timeout
- Rate limit
- Provider down
- malformed response
- partial response
- stale cache
- missing coverage
- conflicting providers
- duplicate offers/events

Für jeden Fall dokumentieren, was Jetnity anzeigen, persistieren und ausdrücklich **nicht** behaupten darf.

### 5. Kosten-/Rate-Limit-Schutz

- Welche Calls könnten teuer oder hochfrequent werden?
- Wo braucht es serverseitige Budgets, Throttling, Deduping oder Cache?
- Wie wird verhindert, dass Browser/Clients unkontrolliert Providerkosten erzeugen?
- Welche Telemetrie ist nötig, bevor ein Provider live gehen darf?

Keine echten Kosten erzeugen. Keine kostenpflichtige Provideraktivierung im Audit.

### 6. Cache / Lizenz / Display

- Welche Daten dürfen wie lange gecacht werden?
- Welche Daten dürfen überhaupt persistiert werden?
- Welche Attribution-/Display-Pflichten müssten Adapter unterstützen?
- Wo muss stale sichtbar werden?
- Wo darf kein historischer Providerpreis als aktueller Preis erscheinen?

Noch keine externen Vertragsannahmen als Fakt festschreiben; Unsicherheiten als Provider-Contract-Gate markieren.

### 7. Security / Privacy

- server-only Secrets
- kein Secret im Browser
- Least Privilege
- PII-Minimierung
- Logging ohne sensible Payload-Leaks
- Replay-/Tampering-Risiken
- SSRF-/open-redirect-/injection-nahe Adapterrisiken
- RLS/Auth-Grenzen zu Account/Trip/Traveller-Daten

### 8. Observability / Health

- Was muss gemessen werden, damit Jetnity zwischen `provider unavailable`, `no results`, `partial coverage` und internem Fehler unterscheiden kann?
- Welche read-only Health-Signale gehören später in Admin System Health?
- Keine Fake-Health und kein pauschales Grün.

## Cross-Domain-Pflichtprüfung

Der Audit muss besonders prüfen, dass gemeinsame Reisedaten nicht mehrfach und widersprüchlich modelliert werden:

- Route / Segment / Stage
- Traveller / Citizenship / Documents
- Readiness
- Safety
- Seasonal
- Offer / Booking reference / Itinerary
- Price / Currency / Fees

Providerdaten dürfen bestehende kanonische Jetnity-Truth nicht still überschreiben.

## Pflicht-Deliverables

Der Agent liefert ausschließlich Audit-/Planungsartefakte, keine Runtime-Implementierung:

1. `docs/PROVIDER_READINESS_AUDIT.md`
   - Ist-Zustand pro Domäne
   - konkrete Dateien/Module/Ports
   - vorhandene Stärken
   - konkrete Lücken
   - belegte Risiken

2. `docs/PROVIDER_READINESS_MATRIX.md`
   - Domäne × Request × Response × Evidence × Failure × Cache/Lizenz × Cost Guard × Security × Observability
   - je Feld: `ready`, `partial`, `missing`, `blocked`, plus Begründung

3. `docs/PROVIDER_READINESS_SHARED_CONTRACT_PROPOSAL.md`
   - nur wenn wirklich sinnvoll
   - minimaler gemeinsamer provider-neutraler Vertrag
   - klar benennen, was fachdomänenspezifisch bleiben muss

4. `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md`
   - priorisierte, konfliktarme Implementierungsslices nach dem Audit
   - Abhängigkeiten
   - welche Slices parallel möglich sind
   - welche Shared-Contract-Änderungen seriell unter Technical-Lead-Steuerung bleiben müssen

5. Handoff-/Status-Update auf dem Audit-Branch.

## Bewertung

Jede Lücke bekommt Schweregrad:

- **P0** – Provideraktivierung wäre sicherheits-, kosten- oder truth-kritisch falsch
- **P1** – vor echter Providerphase zwingend schließen
- **P2** – wichtig für Zuverlässigkeit/UX/Skalierung, kann nach Core-Gates folgen
- **P3** – Verbesserung ohne Aktivierungsblocker

Keine erfundenen Probleme: Jeder P0/P1-Befund braucht konkrete Code-/Contract-Evidence.

## Explizit verboten in diesem Audit

- keine echte Providerintegration
- keine API Keys / Secrets
- keine Provider-Verträge abschließen
- keine kostenpflichtigen Calls
- keine neuen laufenden Kosten
- keine Production-Migration
- keine DB-Migration ohne separat freigegebenen späteren Implementierungsslice
- keine Auth-/RLS-/Capability-Änderung
- keine Account-/Admin-Implementierung
- keine Homepage-Änderung
- keine Änderung an kanonischer Route-/Traveller-/Readiness-/Safety-/Seasonal-Truth
- keine direkten Runtime-Fixes, außer der Technical Lead erteilt nach einem konkret belegten kritischen Defekt separat einen engen Fix-Auftrag

## Parallelitätsregel

Der Audit darf parallel zu Account AP-1 und Admin Slice A laufen, weil er primär lesend und dokumentierend arbeitet.

Falls der Agent einen notwendigen Shared-Contract-Fix entdeckt, dokumentiert er ihn nur und stoppt an dieser Grenze. Er implementiert ihn nicht eigenmächtig.

## Abschlusskriterien

Audit-PASS bedeutet ausschließlich:

- alle Pflichtdomänen untersucht,
- Matrix vollständig,
- P0/P1/P2/P3 nachvollziehbar belegt,
- gemeinsamer Contract nur dort vorgeschlagen, wo er fachlich sinnvoll ist,
- Implementierungsslices priorisiert,
- keine Provider-/Secret-/Kostenaktivierung erfolgt.

Audit-PASS ist **keine** Implementierungs-, Mark-Ready-, Merge- oder Providerfreigabe.

## Governance

- PR bleibt Draft.
- Kein Mark Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Provideraktivierung, Secrets, Verträge und Kosten bleiben separate Product-Owner-Gates.
- Der Agent soll wichtige neue Risiken proaktiv benennen und nicht nur auf einzelne Fragen warten.
