# Jetnity – Hotels

**Stand:** 20. August 2026 · Phase 3.2c  
**Gilt für:** die interne Hotel-/Quartierdomäne, die Suchpipeline, den Trip-Workspace und die serverseitige Vertrauensgrenze der `stay`-Übernahme.

Diese Datei beschreibt den **tatsächlichen** Hotelweg. Produktprinzip: [JETNITY_VISION.md](../JETNITY_VISION.md) Abschnitt 5 und [JETNITY_HANDOFF.md](../JETNITY_HANDOFF.md). Entscheidungen: ADR-0070 bis ADR-0077 in [DECISIONS.md](../DECISIONS.md). Strategie: [HOTEL_PROVIDER_STRATEGY.md](HOTEL_PROVIDER_STRATEGY.md).

---

## 1. Was Phase 3.2 / 3.2b / 3.2c ist – und was nicht

Jetnity bestimmt zuerst, **in welcher Gegend** eine Etappe sinnvoll liegt, und erst danach wenige Hotels in dieser Gegend.

Gebaut:

- provider-unabhängige Hotel-/Quartierdomäne
- Quartierkontext aus dem echten Reisegraphen
- deterministische Quartierbewertung und Hotelrangfolge
- geschlossene Suchpipeline und Client-Sicht
- Hotelbereich je Etappe im bestehenden Reise-Arbeitsbereich
- Übernahme-Abbildung auf das bestehende `trip_items`-Schema (`kind = stay`)
- serverseitige Vertrauensgrenze: Konto-Übernahme nur über `HotelNachweis`
- Reisegraph-Prüfung für Etappe, Tag und Zeitraum
- API-Härtung von `POST /api/hotels/search` (Content-Length, Stream-Cap 16 KB, Content-Type, `Retry-After`)
- `HotelNachweis` gebunden an Ziel, Zeitraum, Belegung und Währung

Nicht gebaut:

- ein echter Hotelprovider oder Affiliate-/Booking-Deeplink
- ein produktiver Nachweis; `hotelNachweisAusUmgebung()` gibt `null` zurück
- Production-Hotelsuche
- eine neue Migration
- Routing-/POI-Daten für reale Wegezeiten
- eigene Hotelbuchung
- ein globales, gespeichertes Rate-Limit

Kein Hotel in der Oberfläche ist erfunden. Fixtures leben nur in Tests.

---

## 2. Schichten

```
Reise-Arbeitsbereich
  → POST /api/hotels/search
    → Zod (untrusted input)
      → Quartierkontext aus Etappe, Zeitraum, Ankern, Flügen
        → deterministische Quartierbewertung
          → Zustand (Production, Kill Switch, fehlender Provider)
            → Rate-Limit
              → HotelProvider.suchen()
                → Normalisierung + Jetnity-Kontext
                  → deterministisches Ranking
                    → Client-Sicht (ohne Score, ohne Rohdaten)
```

| Schicht | Datei | Aufgabe |
| --- | --- | --- |
| Domäne | `lib/hotels/domain.ts` | Suchanfrage, Option, Quartier, Evidenz, Status |
| Prüfung | `lib/hotels/schema.ts` | Zod, untrusted input |
| Quartierkontext | `lib/hotels/quartier-kontext.ts` | nur vorhandene Reisedaten |
| Quartierbewertung | `lib/hotels/quartier-ranking.ts` | Lageentscheidung vor der Hotelsuche |
| Interface | `lib/hotels/provider.ts` | `HotelProvider` – ein späterer Adapter ohne UI-Rewrite |
| Zustand | `lib/hotels/zustand.ts` | Production aus, Kill Switch, ohne Provider unavailable |
| Anreicherung | `lib/hotels/anreichern.ts` | Quartier-Fit aus Koordinaten; Wegezeiten bleiben null |
| Ranking | `lib/hotels/ranking.ts` | provisionsneutral, deterministisch, kein Modell |
| Orchestrierung | `lib/hotels/suche.ts` | Kontext → Limit → Provider → Ranking |
| Client-Sicht | `lib/hotels/client-sicht.ts` | keine Tokens, kein Score, keine Rohfelder |
| Übernahme | `lib/hotels/uebernahme.ts` | nachgewiesene Option → kommerzieller `stay`-Planpunkt |
| Nachweis | `lib/hotels/nachweis.ts` | Auswahlbestätigung gegen `HotelNachweisKontext`, heute `null` |
| Reisegraph | `lib/hotels/reisegraph.ts` | Etappe, Tag und Zeitraum aus der Reise |
| Konto-Kern | `lib/hotels/konto-uebernahme.ts` | identifiers + Nachweis + Graph, fail closed |
| Factory | `lib/hotels/factory.ts` | Phase 3.2 gibt `null` zurück |

Die UI (`components/trips/HotelBereich.tsx`) spricht nur die interne Domäne.

---

## 3. Quartier zuerst

Verbindliche Frage:

> Wo sollte der Nutzer für genau diese Etappe wohnen?

Der Kontext nutzt nur belastbare Reisedaten:

- Etappenname, `place_id` und Koordinaten, soweit vorhanden
- An-/Abreise oder Reisezeitraum und daraus die Nächte
- Reiseanker nur mit echten Koordinaten; ein Aktivitätstitel ohne Ort wird nicht zum POI
- früher Abflug (`startsAt` vor 08:00 am Abreisetag) erhöht die Transferpriorität, erfindet aber keine Transferzeit
- Budget pro Nacht nur, wenn Budget und Nächte bekannt sind
- Interessen `food` / `beach` / `wellness` und Tempo `calm` als Nutzerwunsch – nicht als Quartierprofil

Ohne Routing-/POI-Provider bleiben Wegezeiten, ÖV-Zeiten, Geh-Scores und Quartierprofile `null`. Die Begründung darf dann keine kurzen Wege, keine ÖV-Güte und keine Passung zu einem unbekannten Gegendprofil behaupten.

Aktuelle feste Gewichte der Quartierbewertung:

| Faktor | Gewicht |
| --- | ---: |
| Reisewege | 35 |
| Transfer | 15 |
| Mobilität | 15 |
| Präferenzen | 25 |
| Budget | 10 |

Ohne echte Werte bleibt der jeweilige Faktor neutral (0,5). Das ist Absicht, keine Scheingenauigkeit.

---

## 4. Hotelranking

Innerhalb der ausgewählten Gegend:

| Faktor | Gewicht |
| --- | ---: |
| Lage / Wege zur Reise | 34 |
| Preis | 28 |
| Qualität | 14 |
| Flexibilität / Stornierbarkeit | 10 |
| Nutzerpräferenzen | 8 |
| Evidenz / Bewertungsbasis | 6 |

Der billigste Preis ist nicht automatisch die Jetnity-Empfehlung. Provision und Providername fliessen nicht ein.

Labels:

- `jetnity` – Jetnity empfiehlt
- `best_value` – Bestes Preis-Leistungs-Verhältnis
- `best_location` – Beste Lage
- `quiet` – Ruhigere Alternative, nur wenn `ruheScore` vorhanden
- `premium` – Premium-Option

Die Client-Antwort enthält höchstens fünf Optionen. Interne Scores verlassen den Server nicht.

---

## 5. Sicherheit und Kosten

- Nur serverseitig, geschlossener Endpunkt, kein Provider-Proxy
- Eingaben begrenzt: Zimmer 1–8, Erwachsene 1–16, Kinder 0–12, Timeout 12 s, max. 40 Providerangebote, Request höchstens 16 KB UTF-8
- `Content-Length` über dem Limit wird **vor** dem Lesen mit 413 abgewiesen. Der Body wird zusätzlich streamend mit hartem Byte-Cap gelesen; ein irreführendes `Content-Length` hilft nicht
- nur `application/json`; sonst 415. Zu gross: 413. Ungültiges JSON: 400
- Rate-Limit im Prozess: 8 Suchen / 10 min und 24 / Tag je IP-Kennung. Bei 429 setzt die Route `Retry-After`
- Die IP-Kennung ist **kein** Authentizitätsbeweis. Das In-Memory-Limit schützt nur Preview/Development
- Production hart aus (`VERCEL_ENV=production`), auch wenn `JETNITY_HOTEL_AKTIV` gesetzt ist
- `JETNITY_HOTEL_AKTIV` muss `true` oder `1` sein, **und** ein Provider muss existieren
- Phase 3.2c hat keinen Provider und keinen Nachweis; Suche und Konto-Übernahme sind `unavailable` / fail closed
- Client-Antwort ohne Score, Rohdaten, Secrets, Stacktraces oder Umgebungsdaten; `cache-control: no-store`
- keine `NEXT_PUBLIC_*`-Hotel-Secrets
- keine kommerziellen Fakten aus dem Sprachmodell
- Tests rufen keinen echten Hotelprovider auf

---

## 6. Übernahme in die Reise

Ein später ausgewähltes Hotel wird als kommerzieller `trip_item` mit `kind = stay` gespeichert. Dafür reicht das bestehende Schema. **Keine neue Migration.**

### Konto

Der Browser darf nur `tripId`, `stageId`, `dayId` und `optionId` schicken. Kommerzielle Fakten (Preis, Provider, External-Ref, Sterne, Storno, …) und der Zeitraum kommen **nicht** aus dem Request.

Die persistierte Momentaufnahme entsteht nur, wenn:

1. die Reise dem angemeldeten Konto gehört (RLS über `reiseLaden`)
2. Etappe und optionaler Tag zum Reisegraphen passen (`trip_days.stage_id`, Check-in-Tag)
3. Check-in/Check-out aus der Etappe bzw. der Reise vollständig sind – sonst fail closed, keine stille Korrektur
4. ein serverseitiger `HotelNachweis` die `optionId` **und** den erwarteten Suchkontext bestätigt

Der Nachweis-Kontext kommt nur aus dem Reisegraphen:

| Feld | Quelle |
| --- | --- |
| `destinationPlaceId` | kanonische `placeId` der Etappe, sonst `stage:{etappenId}` – kein Client-Ortsname |
| `checkIn` / `checkOut` | Etappe, sonst Reisezeitraum |
| `adults` | `trip.travellers` |
| `rooms` / `children` | feste Suche-Defaults `1` / `0`, solange die Reise keine eigenen Zimmer-/Kinderfelder trägt |
| `currency` | `trip.currency` |

Zimmer und Kinder darf der Browser bei der Übernahme nicht setzen. Eine Option, die zu einem anderen Ziel, Zeitraum, einer anderen Belegung oder Währung gehört, wird als `geaendert` abgelehnt.

Heute gibt es keinen Nachweis. Eine authentifizierte, selbst gebaute Server-Action speichert deshalb keinen erfundenen `stay`. Tests dürfen einen Fake-Katalog injizieren.

`HotelNachweis` ist bewusst getrennt von `HotelProvider.suchen()`. Der spätere Suchadapter oder ein Jetnity-eigener serverseitiger Nachweis implementiert diese Naht. Search-Provider und Affiliate-/Booking-Partner müssen nicht identisch sein. Keine Secret-Signatur, keine Booking.com-/HBX-Annahme.

### Gast

LocalStorage ist vom Nutzer manipulierbar. Die Oberfläche übernimmt nur Optionen aus der letzten Jetnity-Suche und den Zeitraum aus dem Reisegraphen. **Gastdaten sind nicht serverseitig verifiziert.**

Gespeicherte Momentaufnahme:

| Feld | Inhalt |
| --- | --- |
| `title` | Hotelname, optional Quartiername |
| `note` | Adresse, Sterne, Bewertung, Zimmer, Frühstück, Storno, Zeitraum, Nachtpreis – nur gelieferte Fakten |
| `starts_on` / `ends_on` | Check-in / Check-out der Etappe |
| `starts_at` / `ends_at` | `null` (keine erfundenen Check-in-Uhrzeiten) |
| `price_amount` / `price_currency` | Gesamtpreis der angebotenen Rate |
| `provider` / `external_ref` | Suchanbieter und dessen Angebots-ID |
| `booking_url` | immer `null` |
| `stage_id` | Etappe der Unterkunft |
| `day_id` | Check-in-Tag, falls vorhanden; sonst ungeplant |

Was niemals aus dem Modell stammen darf: Preis, Währung, Provider, External-Ref, Booking-URL, Sterne, Bewertung, Storno, Frühstück, Verfügbarkeit.

Spätere Preis- oder Verfügbarkeitsänderungen ändern die gespeicherte Zeile nicht still. Wie beim Flug ist die Reise eine Momentaufnahme. Eine Überwachung ist Backlog, keine stille Aktualisierung. Modelloperationen dürfen kommerzielle `stay`-Punkte nicht verändern (`istKommerziell`).

Nächte gehören zur Etappe, nicht zu einem einzelnen Tag. Deshalb hängt der Punkt an `stage_id`. Ein späterer Bedarf an eigenen Hotel-Nacht-Zeilen oder Quartier-IDs wäre eine **Development-Migration**, nicht Teil dieser Phase.

---

## 7. Oberfläche

Im bestehenden Trip Workspace, nicht als Demo:

- ein Hotelbereich je Etappe
- Gegend nur bei vorhandenem Ort **und** Koordinaten
- ist die Gegend nur der Etappenort (`herkunft: etappenort`), keine Viertel-Empfehlung
- Loading / Empty / Unavailable / Timeout / Error / Rate-Limit als getrennte Zustände
- `unavailable` ruhig, nicht als Fehler der Reise
- Hotelkarten nur bei echten Optionen
- mobile-first, 44 px Trefferflächen, Status über `aria-*`

Solange kein Provider konfiguriert ist, erklärt die Fläche das ehrlich und zeigt höchstens den Etappenort aus der Reise.

---

## 8. Aktivierung (später, nicht jetzt)

1. Genau einen Hotel-Datenanbieter entscheiden (eigene Freigabe).
2. Adapter gegen `HotelProvider` bauen. Keine Booking-URL erfinden.
3. `JETNITY_HOTEL_AKTIV=true` nur in Development/Preview.
4. Niemals Production, kein Live-Token ohne eigene Freigabe.

---

## 9. Weiterhin offen

1. Genau einen ersten Hotel-Datenanbieter entscheiden und `HotelProvider` plus `HotelNachweis` implementieren · **eigene Freigabe**
2. Preview mit echtem Provider-Key verifizieren
3. Globales/gespeichertes Rate-Limit, bevor Production überhaupt zur Debatte steht
4. Reale Routing-/POI-/ÖV-Daten für echte Quartierwege
5. Production-Aktivierung nur nach separater Freigabe
