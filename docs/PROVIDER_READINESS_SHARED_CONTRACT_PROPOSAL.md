# Jetnity – Shared Provider Contract Proposal

Stand: 24. August 2026  
Status: **Vorschlag aus dem Provider-Readiness Audit / keine Implementierungsfreigabe**  
Gilt nur zusammen mit `docs/PROVIDER_READINESS_AUDIT.md`

## 1. Entscheidung des Audits

Ein **minimaler gemeinsamer Operationsvertrag** ist sinnvoll.

Eine **gemeinsame Provider-Plattform**, ein gemeinsames Offer-Modell oder eine gemeinsame Official-/Safety-/Seasonal-Wahrheit ist **nicht** sinnvoll.

AGENTS.md Regel 19 bleibt verbindlich: keine Multi-Provider-Abstraktion auf Vorrat. Dieser Vorschlag zentralisiert nur das, was heute achtmal kopiert ist oder bereits divergiert und bei der ersten Aktivierung Schaden anrichten würde.

---

## 2. Warum ein gemeinsamer Vertrag nötig ist

Belegte Drift im aktuellen Code:

| Thema | Ist | Risiko |
| --- | --- | --- |
| Rate Limit | Acht nahezu identische In-Memory-Zähler | Der erste bezahlte Adapter erbt den schwächsten Schutz |
| Request-Härtung | Hotels/Activities/Truth-APIs mit Body-Cap; Flights `req.json()` | Kosten- und DoS-Asymmetrie |
| Failure-HTTP | Hotels/Flights 200+Status; Mobility/Rental Timeout 504 | Clients und späteres Admin-Health lesen verschiedene Semantiken |
| Nachweis | Hotels/Activities async + Kontext; Flights fehlt; Mobility/Rental Stub | Kommerzielle Persistenz mit zwei Wahrheiten |
| Timeout | Safety/Seasonal 4 s + AbortSignal; Readiness nur `catch` | Hängender Regulatory-Call |
| Kill Switch | `JETNITY_{FLIGHT,HOTEL,ACTIVITY,MOBILITY,RENTAL_CAR}_AKTIV`; Readiness/Safety/Seasonal ohne Flag | Unkontrollierte spätere Aktivierung |
| Observability | nirgends | `unavailable` vs `empty` vs intern nicht messbar |

Das sind Operationsverträge, keine Fachdomänen.

---

## 3. Minimaler gemeinsamer Vertrag

Vorgeschlagenes späteres Modul, Name nur als Arbeitsbegriff: `lib/provider-ops/`.

Kein SDK, kein Provider-Router, keine gemeinsame `suchen()`-Funktion.

### 3.1 Failure-Taxonomie

Gemeinsame **Statuswerte**, die Search und Evaluate bereits fast teilen:

- `ok`
- `partial`
- `empty` / `checked_empty`
- `unavailable`
- `timeout`
- `invalid`
- `rate_limited`
- `error`

Regeln:

- Fachliche Leere (`empty`, `checked_empty`) ist eine Aussage.
- Technisches Fehlen (`unavailable`, `timeout`, `error`) ist keine Aussage.
- HTTP: Search/Evaluate bleiben gegenüber dem Nutzer ehrlich im Body. Timeout sollte **nicht** zwischen 200 und 504 divergieren, ohne dass Clients das kennen. Empfehlung: Body-Status kanonisch, HTTP 200 für orchestrierte Providerzustände, 429 für Rate Limit, 413/415 für Request-Härtung. 504 nur wenn der Edge selbst abbricht.

Nicht vereinheitlichen: Safety-`recheck_needed`, Seasonal-`rejected_acute`, Official-`insufficient_context`. Das sind Fachzustände.

### 3.2 Request-Härtung

Gemeinsame Hülle, analog `lib/hotels/anfrage.ts`:

- nur `application/json`
- Content-Length-Precheck + Stream-Cap
- `cache-control: private, no-store`
- `Retry-After` bei 429
- Domain setzt nur `maxBytes` und Fehlermeldungen

Flights muss auf diese Hülle gehoben werden, bevor Preview-Suche mit echten Kosten diskutiert wird.

### 3.3 Kill Switch / Zustand

Gemeinsame Form, fachliche Flags bleiben getrennt:

```text
aktiv = nicht Production
      AND Flag ausdrücklich true|1
      AND Zugang vorhanden (Token/Adapter nicht null, Test-Regel domain-spezifisch)
```

Fehlender Zugang = `unavailable`, kein Buildfehler.

Readiness, Safety und Seasonal brauchen dasselbe Flag-Muster **bevor** ein Adapter verdrahtet wird. Heute reicht `*ProviderAus() === null`. Sobald ein Adapter existiert, darf null nicht die einzige Bremse sein.

Production bleibt ein separates Product-Owner-Gate, nicht ein implizites Flag.

### 3.4 Cost Guard

Gemeinsames **Interface**, zwei Stufen:

1. Preview: In-Memory-IP-Limit bleibt zulässig (heutiger Code).
2. Bezahlte oder Production-Aktivierung: persistenter globaler Zähler, Vorbild `lib/modell/kontingent.ts`.

Das Interface muss können:

- Fenster- und Tagesbudget je Domäne
- optionales gemeinsames Tagesdach über alle Provider
- Dedup-Schlüssel für identische Suchen (optional, domain-spezifisch)
- Kennung ohne PII (IP-Hash oder Guest-Cookie-Hash wie Modellweg; keine Reiseinhalte)

DB-Migration für Stufe 2 ist ein **eigenes Gate**. Dieser Audit fordert sie nicht.

### 3.5 Observability-Event

Ein schmaler, serverseitiger Event-Typ **ohne Payload-Leak**:

- domain (`flights` | `hotels` | …)
- providerId oder `null`
- operation (`search` | `evaluate` | `nachweis`)
- outcome (Failure-Taxonomie)
- durationMs
- partial / droppedOffers (Zahlen, keine Offers)
- rateLimitHit
- retrievedAt

Nicht loggen: Tokens, Traveller-Namen, Dokumente, Rohantworten, genaue Routen, Preise.

Admin System Health darf später nur aggregierte, ehrliche Signale lesen. Kein pauschales Grün. Dieser Health-Slice gehört **nicht** in Admin Slice A.

### 3.6 Kommerzieller Nachweis (nur Offer-Domänen)

Gemeinsame **Form**, nicht gemeinsame Option:

```text
nachweisen({ optionId, kontext }):
  ok + domainOption
  | unavailable | unbekannt | abgelaufen | geaendert | invalid | error
```

`kontext` bleibt fachlich:

- Hotels: Ziel, Daten, Belegung, Währung
- Activities: Ziel, Tag, Teilnehmer, Währung, Timeslot
- Flights: Legs, Passagierzahlen, Kabine, Währung, Offer-ID
- Mobility: Origin/Destination-PlaceIds, Datum, Mode, Währung
- Rental: Pickup/Dropoff, Zeitraum, Währung, Klasse

Browser sendet nur IDs. Kommerzielle Fakten kommen serverseitig.

Hotels/Activities sind die Referenz. Flights muss nachziehen, bevor Preview-Persistenz als vertrauenswürdig gilt. Mobility/Rental Stubs werden auf diese Form angehoben, **bevor** ihr erster Adapter persistiert.

### 3.7 Provenance an der Option, nicht in der Route

Gemeinsame optionale Felder für kommerzielle Optionen:

- `providerId`
- `externalRef`
- `retrievedAt`
- `freshUntil` (optional, providerabhängig)
- `quotedCurrency`
- `requestedCurrency`

Regel: ein persistierter Preis ohne `retrievedAt` darf nicht als aktueller Preis angezeigt werden. Route-/Airport-Truth bleibt Foundation D und wird nicht Teil dieses Vertrags.

### 3.8 Cache- und Lizenz-Hooks

Nur Hooks, keine erfundenen Vertragsinhalte:

- `cacheClass`: `forbidden` | `short_search` | `reference`
- `attributionRequired: boolean`
- `displayNotice: string | null`
- `persistClass`: `ephemeral_offer` | `user_snapshot` | `forbidden`

Default bis ein echter Vertrag geprüft ist: `cacheClass = forbidden`, Search-Responses `no-store`, persistierte Übernahme = `user_snapshot` mit sichtbarem Zeitpunkt.

Government-/Timatic-/Climate-Lizenzen bleiben Provider-Contract-Gates.

---

## 4. Was fachdomänenspezifisch bleiben muss

Nicht zentralisieren:

| Bleibt in der Domäne | Warum |
| --- | --- |
| `FlugSuchanfrage` / `HotelSuchanfrage` / … | andere Pflichtfelder |
| Ranking und Labels | provisionsneutral, aber fachlich verschieden |
| Quartier- vs Tages- vs Kantenlogik | nicht dasselbe Problem |
| Official Evidence Trust Gate | Regulatory ≠ Offer |
| Safety Fact / Relevanz / Impact | akut, travellerbedingt möglich |
| Seasonal Window / Reference Period | traveller-neutral, nicht akut |
| Route Facts | Foundation D, eine Quelle |
| Traveller Credentials | Foundation E; nur Readiness outbound |
| `preisIstGesamt`, Konfliktfenster, Recurring Windows | Invarianten der Fachdomäne |
| Konkretes Adapter-Mapping | erst nach echtem API-Vertrag |

Search-Provider, Truth-Quelle und Booking-/Affiliate-Partner dürfen weiter verschiedene Organisationen sein (`docs/PROVIDER_INTEGRATION_READINESS_POLICY.md` §4).

---

## 5. Was dieser Vorschlag ausdrücklich nicht ist

- kein `UniversalProvider`
- kein gemeinsames Offer-Schema für Flug+Hotel+Zug
- keine Vereinigung von Safety und Seasonal
- kein Live-Health-Grün ohne Messwerte
- keine Secret-Verwaltung
- keine Preisvergleichs-Plattform
- keine Implementierung in PR #45

---

## 6. Einführungsschnitt

1. Technical Lead gibt den minimalen Vertrag als eigenen Implementierungsslice frei.
2. Bestehende Domain-Module werden **nacheinander** auf die Hüllen umgestellt, ohne Verhalten zu erweitern.
3. Flights-Nachweis und Cost-Guard-Stufe-2 sind eigene Slices.
4. Konkrete Adapter bleiben in der späteren Providerphase.

Parallel zu Account AP-1 und Admin Slice A ist nur **Dokumentation** dieses Vertrags zulässig. Der Shared-Contract-Fix selbst ist seriell und wird in diesem Audit nicht gebaut.

---

## 7. Product-Owner-Entscheidung

Empfehlung: den minimalen Operationsvertrag annehmen und die Implementierungsslices in `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` als nächsten Jetnity-seitigen Provider-Readiness-Block behandeln – **nach** Review dieses Audits, nicht still in Account/Admin-PRs.

Keine Freigabe in diesem Dokument für Secrets, Verträge, Kosten, Migrationen oder Mark Ready.
