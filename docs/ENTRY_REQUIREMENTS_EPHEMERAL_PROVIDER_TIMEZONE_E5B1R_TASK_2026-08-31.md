# Entry Requirements E5-B1R – Ephemeral Provider-Observed Airport Timezone Evidence

Stand: 31. August 2026  
Status: **BINDING IMPLEMENTATION TASK / FRESH RECUT / NO PERSISTENCE / NO CLIENT EXPOSURE / NO AUTO-FOLLOW-UP**

## 1. Baseline

Arbeite ausschließlich gegen:

`main@7fdd06f983a47afbbb28313479adf4e81fb9a359`

Issue:

#330 – `Entry Requirements E5-B1R – ephemeral provider-observed airport timezone evidence`

Parent target:

#294 – Entry Requirements Detail Architecture

Vor Implementierung vollständig lesen:

1. `JETNITY_START_HERE.md`;
2. `docs/ACTIVE_WORK_STATUS.md`;
3. `docs/CHATGPT_TECHNICAL_LEAD_E5B1_TRUST_BOUNDARY_BLOCKER_CLOSED_2026-08-31.md`;
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`;
5. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5A_CLOSED_2026-08-31.md`;
6. `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_HANDOFF_2026-08-31.md`;
7. Issue #330 und Parent #294;
8. `origin/main` live.

## 2. Warum dieser Recuttet-Slice existiert

Der erste E5-B1-Versuch #327 / PR #328 ist **geschlossen, not planned und nicht gemergt**.

Verworfener Head:

`fdf05f26928dfc556cc3b3b954eb3c61981b29c4`

Er ist ausschließlich Review-Evidence. **Nicht cherry-picken. Nicht als bereits akzeptierte Architektur behandeln.**

Production-live wurde bestätigt:

- `trip_items.metadata` ist für authenticated Owner direkt schreibbar;
- Owner-RLS beweist Ownership, nicht Provider-Provenance;
- die bestehende DB-Kanonisierung erhält keine Timezone-Felder.

Daher bindend:

> **Persisted does not mean provider-proven.**

Dieser Slice löst das nicht durch neue Persistenz, sondern bleibt bewusst vor dieser Grenze.

## 3. Verbindliche Architektur

### 3.1 Product Flight Truth bleibt unverändert

Nicht ändern:

- `FlugSegment`;
- `FlugOption`;
- `BewerteteFlugOption`;
- `flugOptionSchema`;
- `FlugOptionSichtbar` / `FlugSucheAntwort`;
- Route-Itinerary;
- `trip_items.metadata`;
- `flugNachweis` / Konto-Übernahme.

Insbesondere darf **kein** `departureTimezone` / `arrivalTimezone` Feld in die normale FlightOption-Welt gelangen.

### 3.2 Companion Evidence nur am serverseitigen Provider-Port

Erweitere die aktive Runtime-Naht:

`lib/flights/provider.ts`

mit einem kleinen provider-neutralen Contract für **flüchtige provider-observed airport timezone evidence**.

Die Evidence muss deterministisch genau einem normalisierten Flight-Segment-Endpunkt zuordenbar sein.

Erforderliche semantische Identität:

- konkrete Option-Identität – bevorzugt die bestehende normalisierte `option.id` plus stabile Provider-/External-Ref nur wenn wirklich nötig;
- `legIndex`;
- `segmentIndex`;
- Endpoint `departure | arrival`;
- exakter IATA-Code dieses Endpunkts;
- vom Provider gelieferter Timezone-Identifier.

Keine freie Country-/City-/Name-Zuordnung. Kein first-match. Keine Annahme über gleiche IATA an anderer Stelle.

### 3.3 Herkunft

Evidence wird ausschließlich innerhalb der validierten serverseitigen Provider-Adapter-Grenze erzeugt.

Verboten als Trust-Signal:

- client-supplied `trusted`;
- client-supplied `providerProven`;
- client-supplied `source` / `actor`;
- Local Storage;
- Browser-Roundtrip;
- Trip-/Route-Metadata;
- IATA-/Country-/City-Inferenz.

Die Herkunft ist durch den Codepfad begründet, nicht durch ein vom Payload behauptetes Label.

## 4. Duffel Boundary

Aktuelle Duffel-Antwort erlaubt bei Airport-Endpunkten:

- IATA-String oder
- strukturiertes Objekt mit `iata_code`.

Erweitere ausschließlich das strukturierte Objekt um optionales, zunächst untrusted `time_zone`.

Regeln:

- nur das strukturierte Objekt darf Timezone-Evidence liefern;
- IATA-String liefert niemals Timezone-Evidence;
- fehlend = keine Evidence;
- invalid = keine Evidence, aber kein Offer-Fail, sofern bestehende Pflichtdaten gültig sind;
- keine Ableitung aus `departing_at` / `arriving_at` Offset;
- keine Ableitung aus Airport Code, Land, Stadt oder Airport-Reference.

## 5. Timezone-Identifier Validation

Dieser Slice validiert nur, ob ein Provider-Identifier als bounded timezone identifier akzeptabel ist. Er löst keine Zeit auf.

Pflicht:

- string;
- nicht leer;
- keine führenden/trailing Whitespaces;
- harte Längengrenze;
- Control-/Path-Junk ablehnen;
- `Z` und reine numerische Offsets ablehnen;
- bekannte IANA/tzdb-Zone kann über die Plattform (`Intl.DateTimeFormat(..., { timeZone })`) geprüft werden, ohne Datum oder Offset zu berechnen;
- Providerwert nicht still auf eine aus IATA geratene Zone umschreiben.

Wenn `Intl`-Kompatibilität eine breitere Abstraktion oder eigenes tzdb verlangt: **STOPP**, nicht Scope erweitern.

Keine künstliche Region-City-Regex, die reale IANA-Namen unnötig ausschließt, wenn die Plattform sie sicher validieren kann.

## 6. Provider-Result Contract

`FlugProviderTreffer` soll Evidence explizit tragen.

Bevorzugtes Invariant:

- `options` bleibt `FlugOption[]`;
- `partial` bleibt bestehende Semantik;
- neuer Evidence-Container ist immer vorhanden und darf leer sein.

Bestehende Testprovider/Fakes entsprechend explizit aktualisieren.

Keine `undefined`-Semantik, wenn ein leeres Array die Vertragsgrenze klarer macht.

## 7. Duffel Mapping

Vermeide unnötige API-Breite.

Geeigneter Ansatz:

- bestehendes `duffelAngebotMappen()` darf weiterhin nur `FlugOption | null` liefern, wenn das die aktuelle öffentliche Test-/Aufruferfläche stabil hält;
- intern darf ein richer mapping result erzeugt werden;
- `duffelAntwortMappen()` / `duffelAdapter()` tragen die Companion-Evidence bis `FlugProviderTreffer`.

Wenn eine andere kleine Struktur weniger Duplikation verursacht, ist sie erlaubt, solange `FlugOption` selbst timezone-frei bleibt.

Evidence muss anhand der **final normalisierten Option-Identität** gebunden werden, nicht an rohes Array-Glück.

## 8. Search / Browser Boundary

`lib/flights/suche.ts` erhält `FlugProviderTreffer`.

Die Evidence darf dort für diesen Slice **nicht** weiterverwendet werden.

Sie wird vor der Browser-Antwort bewusst nicht an `optionenBewerten()` oder `sucheFuerClient()` als Teil der Option gekoppelt.

Pflichtregression:

Eine Test-Providerantwort mit gültiger Timezone-Evidence muss nach `fluegeSuchen()` eine normale `FlugSucheAntwort` ergeben, deren serialisierte Form **keinen** Timezone-/Evidence-Wert enthält.

Keine Änderung an `clientEnthaeltGeheimnis` als Ersatz für diese Architekturgrenze; der Contract selbst muss lecken verhindern.

## 9. Pflicht-Regressionen

Mindestens:

1. strukturierter Duffel-Origin mit gültigem `time_zone` → Departure-Evidence;
2. strukturierte Destination → Arrival-Evidence;
3. IATA-String → keine Evidence;
4. fehlendes `time_zone` → keine Evidence;
5. invalid / Offset / `Z` / Whitespace / unbounded → keine Evidence;
6. ungültige Timezone verwirft kein sonst gültiges Offer;
7. Multi-Segment: korrekte `legIndex` / `segmentIndex` / Endpoint / IATA-Zuordnung;
8. Multi-Leg: keine Cross-Leg-Verwechslung;
9. Option-Reordering/Ranking kann Evidence nicht auf eine andere Option umhängen;
10. `FlugOption` Shape bleibt timezone-frei;
11. `FlugSegment` Shape bleibt timezone-frei;
12. `flugOptionLesen()` ignoriert/strippt injizierte Timezone-Extra-Felder wie bisherige Zod-Objektsemantik;
13. Browser-Antwort enthält keine Timezone-/Evidence-Felder;
14. bestehende lokale Flight-Zeiten bleiben byte-semantisch unverändert;
15. `partial` / `invalid` Duffel-Semantik bleibt unverändert;
16. bestehende Ranking-/Client-Security-Tests grün;
17. kein `lib/route/*` Diff;
18. kein `supabase/*` / `scripts/db/*` Diff;
19. kein `lib/providers/flights/*` semantischer Umbau;
20. vollständige Repository-Gates grün.

## 10. Hard Non-Scope

Nicht implementieren:

- Timezone in `FlugSegment` / `FlugOption`;
- Timezone im Browser;
- Timezone im Trip/Route-Modell;
- Persistenz irgendeiner Timezone-Evidence;
- Supabase-/Migration-/RLS-/Grant-/Trigger-Änderung;
- Commercial-Provenance für Timezone missbrauchen;
- Airport-DB-Timezone;
- IATA→Timezone Lookup;
- Country/City→Timezone Lookup;
- Local Time + IANA → UTC;
- DST gap/ambiguity;
- Event occurrence resolver;
- E5-A auto binding;
- `flugNachweisAusUmgebung()` aktivieren;
- Account-Adoption ändern;
- Deadline/Urgency/Tasks/Reminder/Notifications;
- Requirements Provider aktivieren;
- Provider-/Secret-/paid-call-/Live-Aktivierung;
- Credential Ranking;
- E5-B2 oder anderen Folgeslice starten.

`requirementsProviderAus()` bleibt `null`.

## 11. Files / erwarteter enger Scope

Wahrscheinlich relevant:

- `lib/flights/provider.ts`;
- `lib/flights/duffel/antwort.ts`;
- `lib/flights/duffel/mapping.ts`;
- `lib/flights/duffel/adapter.ts`;
- eng relevante Flight-Tests;
- optional eine kleine neue Flight-Timezone-Evidence-Utility/Testdatei.

Nur wenn technisch notwendig:

- `lib/flights/suche.ts` / `lib/flights/suche.test.ts` für explizites Discard-/No-Leak-Regressionsverhalten.

Nicht erwartet:

- `lib/flights/domain.ts`;
- `lib/flights/schema.ts` außer Test-Evidence, falls kein Runtime-Diff nötig;
- `lib/flights/client-sicht.ts`;
- `lib/route/*`;
- `lib/trips/*`;
- `types/*`;
- `supabase/*`;
- `scripts/db/*`;
- `lib/providers/*`.

Wenn diese Non-Expected Bereiche semantisch geändert werden müssten: **STOPP und dokumentieren**, nicht still erweitern.

## 12. Delivery

Pflichtdateien:

- `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_STATUS_2026-08-31.md`;
- `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_HANDOFF_2026-08-31.md`;
- `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_SELF_REVIEW_2026-08-31.md`.

`docs/ACTIVE_WORK_STATUS.md` bleibt **Technical-Lead-owned** und darf vom Agenten nicht verändert werden.

ARCHITECTURE/DECISIONS nur wenn eine tatsächlich neue semantische Entscheidung entsteht; keine Dokumentationsmenge um ihrer selbst willen.

## 13. Gates

Vor Delivery vollständig:

- Typecheck;
- Lint;
- vollständige Tests;
- Admin-API-Schutz;
- Schema-Check;
- Dead-Code;
- Export-Check;
- Dependency-Check;
- Production Build;
- vorhandene weitere CI-Hygiene-Gates.

Vor Handoff:

- `origin/main` erneut fetch;
- merge-base / ahead / behind dokumentieren;
- Diff gegen aktuellen main prüfen;
- keine versehentliche #328-Cherry-Pick-Historie;
- keine offenen eigenen TODOs.

## 14. Governance

Fresh logical Cursor Agent:

**`Jetnity entry requirements provider timezone evidence 1`**, Generation 1.

Do not mark Ready.  
Do not merge.  
Do not start follow-up.  
Do not cherry-pick #328.

Nach Implementation + Self-Review + Gates vollständig STOPP für unabhängigen Technical-Lead Exact-Head-Review.

Jeder Head-Wechsel invalidiert frühere Gates.
