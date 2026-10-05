# Jetnity – Entry Requirements E5-B2A Task

Stand: 31. August 2026  
Status: **BINDING VERSIONED RUNTIME TASK / EPHEMERAL AIRPORT EVENT INSTANTS / FAIL-CLOSED DST / NO PERSISTENCE / NO CLIENT EXPOSURE / NO AUTO-FOLLOW-UP**

Issue: **#334 – Entry Requirements E5-B2A – ephemeral airport event instant resolution**  
Parent: **#294 – Entry Requirements Detail Architecture**  
Baseline at task cut: `main@f7ccdc5b98ce933b06c216135be7c4f4b08f8222`  
Branch: `feat/entry-requirements-airport-event-instant-e5b2a-2026-08-31`

Fresh logical Cursor agent:
**`Jetnity entry requirements airport event instant 1`**, Generation 1.

## 1. Warum dieser Slice jetzt der kleinste verantwortbare nächste Schritt ist

E5-A kann eine offizielle relative Zeitregel nur dann deterministisch projizieren, wenn bereits ein **absoluter Event-Instant** explizit gebunden ist.

E5-B1R liefert inzwischen serverseitig flüchtige, provider-beobachtete Airport-Timezone-Evidence, exakt gebunden an:

- `optionId`;
- `legIndex`;
- `segmentIndex`;
- `departure | arrival`;
- exakte IATA;
- provider-beobachteten IANA-/tzdb-Timezone-Identifier.

Die normale Flight-Domain hält die Segmentzeiten dagegen bewusst als lokale Flughafen-Wanduhrzeit:

- `departureDate` + `departureTime`;
- `arrivalDate` + `arrivalTime`.

Es ist ausdrücklich verboten, diese lokale Zeit einfach als UTC zu behandeln oder `Z` anzuhängen.

Der sichere nächste Brückenbaustein ist deshalb:

> **Exakte lokale Segment-Wanduhrzeit + exakt zugehörige E5-B1R-Timezone-Evidence → entweder genau ein kanonischer absoluter Instant oder explizites fail-closed Problem.**

Noch nicht: Persistenz, Route-Truth, Account Adoption, E5-A Auto-Bindung, Deadline UI oder Aufgaben.

## 2. Fresh live precheck / Evidence

Vor Task-Cut verifiziert:

- canonical `main@f7ccdc5b98ce933b06c216135be7c4f4b08f8222`;
- Main CI #1507 / Run `33415587649`: SUCCESS auf exakt diesem Main;
- Vercel Production: SUCCESS auf exakt diesem Main;
- Ruleset `Jetnity main protection` / ID `21875372`: active;
- required PR + strict up-to-date checks;
- required `Typecheck, Lint & Build`, `Auth-Konfiguration gegen config.toml`, `Vercel`;
- Conversation Resolution;
- merge-only;
- bypass empty;
- E5-B1R #330 CLOSED / completed;
- #331 CLOSED / NOT MERGED;
- recovery #332 MERGED;
- continuity #333 MERGED;
- offene PRs #52/#50/#40/#39/#28 sind historische Drafts, kein konkurrierender aktueller Entry-Requirements-Runtime-Workstream;
- keine bestehende Local-Time+IANA→Absolute-Instant-Engine gefunden;
- keine Timezone-Library in `package.json` vorhanden;
- `lib/flights/zeit.ts` schützt ausdrücklich die lokalen Wall-Clock-Semantiken;
- `lib/flights/airport-timezone.ts` validiert E5-B1R-Timezone-Identifier, rechnet aber nicht;
- `lib/flights/provider.ts` ist die aktive serverseitige FlightProvider-Naht;
- `lib/flights/duffel/mapping.ts` mintet die E5-B1R-Timezone-Evidence passend zur normalisierten Option;
- `lib/readiness/temporal-projection.ts` akzeptiert nur explizite absolute Instants und sucht weder Zone noch Occurrence.

## 3. Bindende Truth-Regeln

### 3.1 Kein geratenes UTC

Nie:

- `departureDate + departureTime + 'Z'`;
- `arrivalDate + arrivalTime + 'Z'`;
- Server-Local-Time;
- Browser-Local-Time;
- aktuelle Systemzone;
- Date.parse auf zonenlose lokale Strings als Truth.

### 3.2 Keine Timezone-Inferenz

Timezone darf ausschließlich aus der bereits vorhandenen exakten `FlugAirportTimezoneEvidence` stammen.

Verbotene Fallbacks:

- IATA→Timezone Lookup;
- Country→Timezone;
- City→Timezone;
- Airport name→Timezone;
- numerischer Offset als Ersatz für fehlende Provider-Zone;
- first-match oder nearest-match.

### 3.3 Exakte Occurrence-Bindung innerhalb der Flight Option

Vor Resolution muss die Evidence erneut gegen die normalisierte Option geprüft werden:

- `optionId` muss exakt passen;
- `legIndex` muss auf ein existierendes Leg zeigen;
- `segmentIndex` muss auf ein existierendes Segment zeigen;
- `departure` muss `segment.origin` + departure local date/time verwenden;
- `arrival` muss `segment.destination` + arrival local date/time verwenden;
- Evidence-IATA muss exakt dem jeweiligen Segment-Endpunkt entsprechen.

Kein Cross-Leg-/Cross-Segment-Fallback.

### 3.4 DST fail closed

Wenn eine lokale Wanduhrzeit in der expliziten Zone:

- **nicht existiert** (DST spring-forward gap) → kein Instant;
- **zweimal existiert** (DST fall-back overlap) → kein Instant;
- genau einmal existiert → kanonischer UTC-Instant.

Nie still `earlier`, `later`, `compatible` oder einen vermeintlich üblichen Offset wählen.

## 4. Ziel-Contract

Der Agent darf konkrete Namen verfeinern, aber semantisch braucht der Slice zwei getrennte Dinge:

### 4.1 Resolved event instant evidence

Serverseitige, flüchtige Companion-Evidence, mindestens äquivalent zu:

```ts
type FlugAirportEventInstantEvidence = {
  optionId: string
  legIndex: number
  segmentIndex: number
  endpoint: 'departure' | 'arrival'
  iata: string
  timeZone: string
  instant: string
}
```

`instant` ist kanonisches UTC ISO/RFC3339 mit `Z`.

Dieser Typ ist **kein Teil von `FlugOption` oder `FlugSegment`**.

### 4.2 Explizite Resolution-Probleme

Unauflösbare Evidence darf nicht still verschwinden, ohne diagnostizierbar zu sein.

Mindestens semantisch unterscheidbar:

- invalid local date/time;
- nonexistent local time / DST gap;
- ambiguous local time / DST overlap;
- option/leg/segment/endpoint/IATA evidence mismatch;
- invalid/unaccepted timezone if encountered despite upstream validation.

Der Agent darf eine kompakte Issue-Struktur wählen. Wichtig ist: kein unresolved state wird in einen Instant umgedeutet.

## 5. Runtime-Integration

Der Slice muss **integriert**, nicht als unbenutzter Utility-Export enden.

Ziel:

1. Duffel → normalisierte `FlugOption` + E5-B1R timezone evidence bleibt bestehen.
2. Innerhalb der aktiven serverseitigen FlightProvider-Pipeline werden aus passender Option + passender timezone evidence die event-instant evidence/Issues berechnet.
3. `FlugProviderTreffer` darf die neue flüchtige Companion-Evidence tragen.
4. Existing fake/test providers müssen den Contract bewusst erfüllen, z. B. mit leeren Arrays.
5. Der bestehende Offer-Cap / retained-options-Filter muss sowohl timezone evidence als auch event-instant evidence auf tatsächlich retained options begrenzen.
6. `fluegeSuchen()` ignoriert/dropt beide Evidence-Arten vor Ranking/Client-Serialization.
7. Browser-/Client-Response bleibt unverändert.

## 6. Timezone-/Civil-Time-Algorithmus

### 6.1 Keine neue Dependency

In diesem Slice **keine neue npm-Abhängigkeit** hinzufügen.

Bevorzugt standardisierte Runtime-APIs (`Intl` / ECMAScript) mit klarer, getesteter fail-closed Semantik.

Wenn robuste DST-Gap-/Overlap-Erkennung ohne neue Bibliothek nicht beweisbar implementiert werden kann:

> **STOPP. Kein Dependency-Add, kein stilles weaker behavior, kein Scope-Widening. Dokumentiere den Blocker für den Technical Lead.**

### 6.2 Bounded / deterministic

- keine unbounded Suche;
- keine Abhängigkeit von aktueller Uhrzeit;
- keine implizite Server-Timezone;
- Ergebnis darf nicht von `process.env.TZ` abhängen;
- Input-Grenzen müssen finite/bounded sein;
- ungültige Kalenderdaten wie `2026-02-30` müssen fail closed bleiben;
- `24:00`, Freitext und Sekunden-/Format-Erweiterungen nur akzeptieren, wenn der aktuelle Flight-Contract sie tatsächlich liefert; sonst nicht heimlich erweitern.

### 6.3 Nicht-ganzstündige Zonen

Der Algorithmus muss mindestens korrekt mit IANA-Zonen umgehen, deren UTC-Offset nicht volle Stunden besitzt, z. B. 30- oder 45-Minuten-Offsets.

Keine Annahme `offset % 60 === 0`.

## 7. Mandatory regression matrix

Mindestens folgende Tests sind Pflicht.

### Civil-time resolution

1. Europe/Zurich Winter-Normalzeit → korrekter UTC-Instant.
2. Europe/Zurich Sommerzeit → korrekter UTC-Instant.
3. Nicht-ganzstündige Zone, z. B. Asia/Kathmandu oder vergleichbar → korrekter UTC-Instant.
4. Europe/Zurich DST spring-forward gap, z. B. lokale 02:30 an geeignetem Umstellungstag → kein Instant + gap issue.
5. Europe/Zurich DST fall-back overlap, z. B. lokale 02:30 an geeignetem Umstellungstag → kein Instant + ambiguous issue.
6. Ungültiges Datum → kein Instant.
7. Ungültige Uhrzeit → kein Instant.
8. Gültige IANA-Zone mit normaler Zeit darf unabhängig von Server-TZ denselben Instant erzeugen.

### Evidence identity / binding

9. `optionId` mismatch → kein Instant.
10. ungültiger `legIndex` → kein Instant.
11. ungültiger `segmentIndex` → kein Instant.
12. departure-IATA mismatch → kein Instant.
13. arrival-IATA mismatch → kein Instant.
14. departure verwendet ausschließlich departure date/time + origin.
15. arrival verwendet ausschließlich arrival date/time + destination.
16. Multi-leg/multi-segment Evidence bleibt exakt zugeordnet.
17. Reordering von Optionen darf Evidence nicht cross-associaten, wenn Identität über `optionId` gebunden ist.

### Provider / client boundary

18. Missing timezone evidence → kein event instant, keine Inferenz.
19. Invalid/unresolvable event instant darf eine ansonsten valide Flight Option nicht verwerfen.
20. Retained offer cap entfernt event-instant evidence verworfener Optionen.
21. `FlugSegment`-Shape unverändert timezone-/instant-frei.
22. `FlugOption`-Shape unverändert timezone-/instant-frei.
23. `FlugSucheAntwort` / serialisierter Browserbody enthält weder timezone evidence noch event-instant evidence.
24. bestehende `clientEnthaeltGeheimnis`-Regressionen grün.
25. bestehende E5-B1R timezone-evidence Regressionen grün.
26. bestehende Duffel `partial` / `invalid` Semantik grün.
27. Ranking-/Sortierung ändert keine Evidence-Zuordnung.

### Repository gates

28. `npm run typecheck` grün.
29. `npm run lint` grün.
30. `npm test` grün.
31. Admin-/Schema-/Dead-/Export-/Dependency-Hygiene grün.
32. `npm run build` / Production Build grün.

## 8. Hard Non-Scope

Der Agent darf in E5-B2A **nicht**:

- Timezone/Instant zu `FlugSegment` hinzufügen;
- Timezone/Instant zu `FlugOption` / `BewerteteFlugOption` hinzufügen;
- Client-/Browser-Contract erweitern;
- Route Itinerary verändern;
- Trip Metadata verändern;
- LocalStorage verändern;
- Account Adoption / `flugNachweis` integrieren;
- Supabase anfassen;
- Migration/RLS/Grant/Trigger/SECURITY DEFINER hinzufügen;
- persistent server-owned timezone/event provenance bauen;
- Airport DB um Timezone erweitern;
- IATA→Timezone Mapping bauen;
- Trip/Route→`OfficialTemporalAnchor` Occurrence Resolver bauen;
- `temporalRuleProjizieren()` automatisch aufrufen;
- E5-A Bindings erzeugen;
- Workspace Deadline-/Action-Window-UI bauen;
- Urgency State Machine bauen;
- Tasks persistieren oder Completion bauen;
- Reminder/Push/E-Mail/Notifications bauen;
- Requirements Provider aktivieren;
- neuen Flight Provider / Secret / paid call / Live-Aktivierung hinzufügen;
- Credential-/Passport-Ranking bauen;
- E5-B2B oder einen anderen Folgeslice starten.

Wenn eine semantische Änderung nötig scheint in:

- `lib/route/*`;
- `lib/trips/*`;
- `lib/readiness/temporal-projection.ts`;
- `supabase/*`;
- `scripts/db/*`;
- Account-Adoption-Code;
- Public Client Contracts;

→ **STOPP und Technical Lead informieren**, nicht Scope ausweiten.

## 9. Erwartete Dateien / Ownership

Wahrscheinlicher Runtime-Scope:

- `lib/flights/provider.ts`;
- neue kleine Flight-time/Event-Instant-Datei unter `lib/flights/`;
- zugehörige Tests;
- ggf. `lib/flights/duffel/mapping.ts` oder `adapter.ts` für Integration;
- ggf. `lib/flights/suche.ts` nur um das bewusste Drop/Ignore weiterhin explizit zu halten;
- bestehende provider/fake tests.

Nicht voraussetzen, dass exakt diese Files geändert werden müssen. Scope-Truth gewinnt.

Agent-owned Delivery Docs:

- `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_STATUS_2026-08-31.md`;
- `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_HANDOFF_2026-08-31.md`;
- `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_SELF_REVIEW_2026-08-31.md`.

`docs/ACTIVE_WORK_STATUS.md` ist **Technical-Lead-owned** und vom Agenten nicht zu verändern.

`JETNITY_START_HERE.md` ist ebenfalls TL-Continuity; nicht eigenmächtig überschreiben.

## 10. Agent Self-Review Pflicht

Vor Handoff adversarial prüfen:

- Kann irgendein Browser-/client-supplied Feld einen `trusted`/`providerProven`-Status vortäuschen?
- Kann Evidence wegen nur passendem IATA auf falsches Segment rutschen?
- Kann Option-Reordering Evidence vertauschen?
- Kann DST overlap still einen der beiden Instants wählen?
- Kann DST gap auf den nächsten gültigen Zeitpunkt normalisiert werden?
- Kann Server-TZ das Ergebnis beeinflussen?
- Kann eine ungültige Timezone die gesamte valide Flight Option verwerfen?
- Bleibt Browser JSON evidence-frei?
- Wurde versehentlich Route/Trip/Persistenz berührt?
- Wurde eine neue Dependency hinzugefügt?
- Sind alle neuen Exporte tatsächlich integriert/aufgerufen?

## 11. Gates / Handoff

Vor STOPP:

1. exakten finalen Head dokumentieren;
2. `origin/main` live fetchen;
3. merge-base / ahead / behind dokumentieren;
4. kompletten Diff gegen aktuellen `origin/main` prüfen;
5. vollständige Repository-Gates ausführen;
6. Vercel Preview Status dokumentieren;
7. GitHub Review Threads / Vercel unresolved feedback dokumentieren soweit verfügbar;
8. STATUS + HANDOFF + SELF_REVIEW committen/pushen;
9. **nicht Ready setzen**;
10. **nicht mergen**;
11. **keinen Folgeslice starten**;
12. STOPP für unabhängigen Technical-Lead Exact-Head-Review.

Jeder neue Head invalidiert frühere Exact-Head-Gates.

## 12. Product-Owner-Gate

E5-B2A selbst braucht **keine** zusätzliche PO-Freigabe.

Sofort STOPP, falls Umsetzung plötzlich benötigt:

- Production DB/RLS/Ownership/Grant/Trigger/write-authority Änderung;
- persistente Trusted Timezone/Event Provenance;
- neue Providerwahl/Secret/paid call/live activation;
- Auth/MFA/AAL-Änderung;
- sensible Dokument-/Biometrie-/Gesundheitsdaten;
- Payment;
- neue laufende Infrastrukturkosten;
- Public Launch / irreversible externe Aktivierung.

**Live-Evidence gewinnt immer. Scope nicht aufblasen.**
