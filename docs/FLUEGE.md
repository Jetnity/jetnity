# Jetnity – Flüge

**Stand:** 20. August 2026 · Phase 3.1  
**Gilt für:** die interne Flugdomäne, den ersten Duffel-Adapter, das Ranking und die Übernahme in die Reise.

Diese Datei beschreibt den **tatsächlichen** Flugweg. Produktprinzip: [JETNITY_HANDOFF.md](../JETNITY_HANDOFF.md). Entscheidungen: ADR-0062 bis ADR-0066 in [DECISIONS.md](../DECISIONS.md). Die Flughafenbasis steht in [docs/FLUGHAFEN.md](FLUGHAFEN.md).

---

## 1. Was Phase 3.1 ist – und was nicht

Jetnity kann für einen Reiseabschnitt echte Flugoptionen suchen, rangieren und als kommerziellen Planpunkt in die Reise übernehmen.

Nicht gebaut:

- eigene Flugbuchung
- Deeplinks / Affiliate-Übergabe
- Hotels, Aktivitäten, Transfers
- Production-Aktivierung
- ein Enterprise-Framework für zehn Provider
- ein Amadeus-Adapter (Amadeus Self-Service wurde am 17. Juli 2026 eingestellt)

`booking_url` bleibt bei Duffel `null`. Eine spätere Buchungs- oder Affiliate-Schicht ist eine **andere** Verantwortlichkeit als die Suche. Sie darf einen anderen Partner nutzen als den Suchadapter.

---

## 2. Schichten

```
Suchanfrage (Browser)
  → POST /api/flights/search
    → Zustand (Kill Switch, Production-Sperre, Test-Token)
      → Rate-Limit
        → FlightProvider.suchen()
          → Duffel Adapter (Offer Requests, Zod)
            → interne FlugOption
              → deterministisches Ranking
                → Client-Sicht (ohne Score, ohne Rohdaten)
```

Übernahme:

```
Nutzer wählt Option
  → Zod erneut
    → Momentaufnahme (Route, Termin, Preis, Provider, Ref)
      → Gast: localStorage  |  Konto: INSERT trip_items (RLS)
```

| Schicht | Datei | Aufgabe |
| --- | --- | --- |
| Domäne | `lib/flights/domain.ts` | Suchanfrage, Segment, Option, Status |
| Prüfung | `lib/flights/schema.ts` | Zod, untrusted input |
| Interface | `lib/flights/provider.ts` | `FlightProvider` – ein zweiter Adapter ohne UI-Rewrite |
| Zustand | `lib/flights/zustand.ts` | Production aus, Kill Switch, nur Duffel-Test-Token |
| Ranking | `lib/flights/ranking.ts` | provisionsneutral, deterministisch, kein Modell |
| Gründe | `lib/flights/gruende.ts` | 2–4 Sätze für „Jetnity empfiehlt“ |
| Orchestrierung | `lib/flights/suche.ts` | Zustand → Limit → Provider → Ranking |
| Client-Sicht | `lib/flights/client-sicht.ts` | keine Tokens, kein Score, keine Rohfelder |
| Übernahme | `lib/flights/uebernahme.ts` | Option → kommerzieller Planpunkt |
| Duffel | `lib/flights/duffel/*` | erster Daten-/Entwicklungsadapter |

Die UI (`components/trips/FlugSuche.tsx`) spricht nur die interne Domäne. Duffel-Typen kommen dort nicht vor.

---

## 3. Duffel ist der erste Adapter, nicht die Architektur

Amadeus Self-Service ist seit dem 17. Juli 2026 eingestellt und wird **nicht** angebunden. Duffel Flights API ist der erste Suchadapter: ein Daten- und Entwicklungsweg, keine technische oder geschäftliche Kopplung.

Ein späterer Metasuch-Provider (Skyscanner, Aviasales) muss dasselbe `FlightProvider`-Interface erfüllen. Search, Ranking und Trip-Domain bleiben. Search-Provider und Affiliate-/Booking-Provider sind getrennt.

Umgebung:

| Variable | Wirkung |
| --- | --- |
| `JETNITY_FLIGHT_AKTIV` | Kill Switch. Nur `true` oder `1` |
| `DUFFEL_ACCESS_TOKEN` | serverseitig, nur `duffel_test_…` |

`VERCEL_ENV=production` schaltet hart aus – auch wenn Kill Switch und Token gesetzt wären. Ein Live-Token (`duffel_live_…`) gilt als Feature-unavailable. Es gibt keine `NEXT_PUBLIC_DUFFEL_*`-Variable. Fehlende Credentials sind Feature-unavailable, kein Buildfehler.

Die Suche spricht `https://api.duffel.com/air/offer_requests`. Test und Live teilen den Hostname; die Umgebung steht im Token. Phase 3.1 akzeptiert nur Test-Tokens. Buchungsendpunkte (`/air/orders`) werden nicht aufgerufen.

`/api/search/airports` liest nur `public.airports`. Es gibt keinen Amadeus-Fallback, keinen Duffel-Airport-Weg und keine Live-Abfrage gegen OurAirports. Quelle, Filter, Import und Refresh stehen in [docs/FLUGHAFEN.md](FLUGHAFEN.md).

---

## 4. Ranking

Kein LLM. Gewichte stehen in `RANGLISTE_GEWICHTE`:

Preis, Gesamtreisezeit, Stopps, sehr früher Abflug, sehr späte Ankunft, lange Umstiege, Overnight-Verbindungen, Passung zum Reisetag.

Marken in der Oberfläche:

- **Jetnity empfiehlt** – höchster Score
- **Günstigste** – niedrigster Preis
- **Schnellste** – kürzeste Dauer

Dieselbe Option darf mehrere Marken tragen. Die Empfehlung erklärt 2–4 Gründe, etwa „CHF 42 teurer, aber 4 h 15 min schneller und ohne Umstieg“.

Provision, Providername und interne Score-Zahlen fliessen nicht in das Ranking und nicht in die Gründe.

---

## 5. Sicherheit und Kosten

- Nur serverseitig, geschlossener Endpunkt, kein Provider-Proxy
- Eingaben begrenzt: 1–6 Beine, 1–9 Personen, IATA, Kabine, Währung
- Keine Passagiernamen oder Geburtsdaten
- Rate-Limit im Prozess: 8 Suchen / 10 min und 24 / Tag je IP
- Timeout 12 s, Duffel-Lieferanten-Timeout 10 s
- Secrets nicht in Logs, Client oder Fehlermeldungen
- Keine neuen laufenden Infrastrukturkosten

Das In-Memory-Limit gilt je Serverless-Instanz. Das ist für Development/Preview bewusst schmaler als die Datenbankschranke des Modellwegs.

---

## 6. Aktivierung (Development / Preview)

1. Duffel-Test-Token anlegen (`duffel_test_…`)
2. `DUFFEL_ACCESS_TOKEN` nur serverseitig setzen
3. `JETNITY_FLIGHT_AKTIV=true`
4. Nicht in Production setzen, kein Live-Token

Die Development-Migration `20260820100000_reise_anlegen_handelsfelder.sql` muss auf dem Development-Branch angewendet werden, damit eine Gastreise mit Flug beim Login Preis und Provider behält. Production nicht ohne Freigabe.
