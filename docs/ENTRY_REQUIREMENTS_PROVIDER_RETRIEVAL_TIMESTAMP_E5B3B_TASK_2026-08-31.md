# Entry Requirements E5-B3B – Server-observed Flight Provider Retrieval Timestamp – Binding Task

Stand: 31. August 2026  
Status: **PREPARED / NOT YET DISPATCHED / DRAFT ONLY / NO PRODUCTION APPLY**  
Issue: #343  
Parent: #294  
Baseline: `main@ad7fb1fa5d0bd6ac3fe2a7085a65fb8d56cecbb8`

## 1. Ziel

Ergänze an der bereits serverseitigen aktiven `FlugProviderTreffer`-Naht genau einen vertrauenswürdigen **server-observed retrieval timestamp** für den Provider-Snapshot, aus dem `FlugOption[]`, E5-B1R Timezone-Evidence und E5-B2A Event-Instant-Evidence entstanden sind.

Dieser Slice liefert nur den fehlenden vertrauenswürdigen Zeitfakt für einen späteren Event-Provenance-Persistenz-Mint.

Er baut **keinen Mint und keinen DB-Writer**.

## 2. Warum dieser Slice nötig ist

E5-B3A verlangt im Persistenzvertrag `retrieved_at` und `observed_at`.

Der aktive Runtime-Pfad liefert aktuell:

- `FlugOption[]`;
- `airportTimezoneEvidence`;
- `airportEventInstantEvidence`;
- `airportEventInstantIssues`.

Er liefert keinen belastbaren Zeitpunkt, zu dem genau dieser Provider-Snapshot serverseitig eingegangen/erfolgreich gelesen wurde.

Ein späterer Persistenz-Mint darf diesen Zeitpunkt nicht nachträglich mit einem beliebigen `Date.now()` erfinden.

## 3. Zuerst vollständig lesen

1. Issue #343
2. `JETNITY_START_HERE.md`
3. `docs/ACTIVE_WORK_STATUS.md`
4. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3A_CLOSED_2026-08-31.md`
5. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B1R_CLOSED_2026-08-31.md` falls vorhanden, andernfalls E5-B1R Handoff/Task/Review
7. `lib/flights/provider.ts`
8. `lib/flights/duffel/adapter.ts`
9. `lib/flights/duffel/adapter.test.ts`
10. `lib/flights/duffel/factory.ts`
11. `lib/flights/suche.ts`
12. `lib/flights/suche.test.ts`
13. `lib/flights/client-sicht.ts`
14. `lib/flights/domain.ts`
15. `lib/flights/airport-event-instant.ts`
16. `supabase/migrations/20260831190000_trip_item_flight_event_provenance.sql`
17. `lib/commercial-provenance/persistenz.ts` nur als Architekturpattern, nicht als Runtime-Pfad

## 4. Bindender Vertrag

### 4.1 `FlugProviderTreffer`

`FlugProviderTreffer` erhält einen **verpflichtenden** server-only Timestamp-Fakt, vorzugsweise:

```ts
retrievedAt: string
```

Semantik:

- Jetnity-Serverzeit, zu der die erfolgreiche Provider-Antwort als Snapshot beobachtet/gelesen wurde;
- kanonisches UTC ISO-8601 mit `Z`;
- genau ein Wert pro Provider-Treffer;
- keine Provider-Behauptung und kein Browser-Input;
- keine Freshness-/Gültigkeitsbehauptung;
- kein Feld in `FlugOption` oder `FlugSegment`.

Der Vertrag soll required sein. Kein `retrievedAt?: string` und kein `string | null`, sofern kein echter Blocker gefunden wird. Wenn ein Provider keinen erfolgreichen Treffer liefert, gibt es ohnehin keinen `FlugProviderTreffer`.

### 4.2 Minting im aktiven Duffel-Adapter

`lib/flights/duffel/adapter.ts` mintet `retrievedAt` erst **nach erfolgreicher HTTP-Antwort und erfolgreichem JSON-Lesen**.

Der Wert darf nicht aus dem Duffel-Payload gelesen werden.

Für deterministische Tests darf ein kleiner Clock-Port als dritter optionaler Parameter eingeführt werden, z. B. eine Funktion, die einen `Date` oder Millisekunden liefert. Production muss ohne zusätzliche Konfiguration echte Serverzeit verwenden.

Kein neuer globaler Time-Service, keine Dependency, keine Infrastruktur.

### 4.3 Canonical timestamp

- UTC;
- ISO-8601;
- `Z`;
- keine lokale Zeitzone;
- keine String-Inferenz aus Airportdaten;
- bei einem injizierten festen Date/Test-Clock muss exakt reproduzierbarer Output entstehen.

### 4.4 Browser-/Ranking-Grenze

`lib/flights/suche.ts` darf den Timestamp **nicht** in Ranking oder Client-Antwort übertragen.

`optionenBewerten(...)` bekommt weiterhin ausschließlich `treffer.options`.

`sucheFuerClient(...)` bekommt keinen `retrievedAt`-Wert.

Serialisierte `FlugSucheAntwort` darf den Wert nicht enthalten.

## 5. Expected implementation scope

Erwartete Runtime-Dateien:

- `lib/flights/provider.ts`
- `lib/flights/duffel/adapter.ts`
- `lib/flights/duffel/adapter.test.ts`
- `lib/flights/suche.test.ts`

Möglicherweise weitere **Testfixtures/fake providers**, wenn `FlugProviderTreffer` dort explizit konstruiert wird.

`lib/flights/duffel/factory.ts` sollte semantisch unverändert bleiben; nur anpassen, falls TypeScript wegen einer rückwärtskompatiblen Adapter-Signatur zwingend etwas verlangt.

## 6. STOP bei unerwarteter Scope-Erweiterung

Ohne erneuten TL-Recut keine semantischen Änderungen an:

- `lib/flights/domain.ts`
- `lib/flights/schema.ts`
- `lib/flights/client-sicht.ts`
- `lib/route/*`
- `lib/trips/*`
- `lib/readiness/*`
- `app/api/*`
- `supabase/*`
- `scripts/db/*`
- `types/supabase.ts`
- `lib/providers/*`
- `lib/commercial-provenance/*`

Wenn eine solche Änderung tatsächlich notwendig scheint: **STOP und dokumentiere den Blocker**, nicht Scope still erweitern.

## 7. Pflichtregressionen

Mindestens folgende Beweise:

1. erfolgreicher Duffel-Treffer enthält `retrievedAt`;
2. fester Test-Clock-Wert erzeugt exakt erwartetes UTC-ISO mit `Z`;
3. Provider-Payload kann `retrievedAt`, `retrieved_at`, `observedAt` o. ä. enthalten, beeinflusst aber Jetnity-`retrievedAt` nicht;
4. HTTP 500/401/403/Timeout liefern keinen erfolgreichen `FlugProviderTreffer`;
5. invalid/unlesbares JSON liefert keinen erfolgreichen Treffer;
6. `FlugProviderTreffer`-Fake/Test-Provider besitzen einen expliziten validen Timestamp;
7. leere Timezone-/Instant-Evidence ändert den Timestamp-Vertrag nicht;
8. Angebots-Cap/Option-ID-Filter bleibt unverändert korrekt;
9. `airportTimezoneEvidence`, `airportEventInstantEvidence`, `airportEventInstantIssues` bleiben unverändert funktionsfähig;
10. Ranking erhält nur Optionen;
11. JSON/serialisierte `FlugSucheAntwort` enthält weder `retrievedAt` noch `retrieved_at` noch `observedAt`/`observed_at`;
12. `FlugOption` / `FlugSegment` bleiben ohne Retrieval-/Observation-Felder;
13. Route/Trip-Metadata bleibt unverändert;
14. kein DB-/Supabase-/API-Write, keine Migration, keine Provider-Aktivierung.

## 8. Hard non-scope

Absolut nicht in E5-B3B:

- E5-B3A-Migration anwenden;
- RLS/Grant/Role/Function live ändern;
- Runtime-Principal aktivieren;
- realen Persistenz-Writer bauen/aufrufen;
- `jetnity.flight_event_persistence.v1` TypeScript-Mint bauen;
- `e5b2a_validated_snapshot` Payload-Builder bauen;
- `flugNachweisAusUmgebung()` aktivieren;
- Provider/Secret/paid call hinzufügen/aktivieren;
- `FlugOption` oder `FlugSegment` erweitern;
- Timezone/Event/Retrieval-Felder in Browser oder Route-Metadata;
- E5-A auto binden;
- Deadlines/Urgency/Tasks/Reminder/Notifications;
- Requirements-Provider;
- Credential-/Passport-Ranking;
- Folgeslice.

## 9. Security / Truth requirements

- Server-observed ≠ provider-supplied.
- Kein Payload-Feld darf Trust erzeugen.
- `retrievedAt` ist Observation-Zeit, keine Freshness-/Availability-Garantie.
- Fehlender erfolgreicher Provider-Treffer → kein Timestamp-Objekt.
- Keine clientseitige Möglichkeit, den Timestamp zu setzen oder wieder einzuspeisen.
- Bestehende E5-B1R/E5-B2A Identity-/DST-Truth bleibt unangetastet.

## 10. Product-Owner gate assessment

Für diesen Slice **kein besonderes Product-Owner-Gate**, solange er exakt in-memory/server-only bleibt.

STOP vor:

- Production-DB-/Security-Mutation;
- Runtime-Principal;
- realem Writer/Backfill;
- Provider-/Secret-/paid activation;
- neuen laufenden Kosten.

## 11. Delivery

Pflicht-Dateien des Agenten:

- `docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_STATUS_2026-08-31.md`
- `docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_HANDOFF_2026-08-31.md`
- `docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_SELF_REVIEW_2026-08-31.md`

Self-Review muss adversarial enthalten:

- exact changed files;
- exact final head;
- Clock-/Timestamp-Provenance;
- Browser no-leak;
- Proof `FlugOption`/`FlugSegment` unchanged;
- Proof E5-B1R/E5-B2A unchanged;
- Proof no DB/Production/provider activation;
- P0/P1/P2/P3-Risiken;
- full repository Typecheck/Lint/Tests/Hygiene/Production Build.

`docs/ACTIVE_WORK_STATUS.md` ist **Technical-Lead-owned** und darf vom Agenten nicht verändert werden.

## 12. Cursor governance

Frischer Agent:

**`Jetnity entry requirements provider retrieval timestamp 1`**, Generation 1.

Agent darf:

- implementieren;
- testen;
- eigene Status/Handoff/Self-Review-Dokumente schreiben.

Agent darf nicht:

- Ready setzen;
- mergen;
- Production verändern;
- `docs/ACTIVE_WORK_STATUS.md` verändern;
- einen Folgeslice starten.

Nach Delivery: **STOP für unabhängigen Technical-Lead Exact-Head-Review.**
