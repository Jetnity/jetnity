# Jetnity – Hotels

**Stand:** 20. August 2026 · Phase 3.2  
**Gilt für:** die interne Hotel-/Quartierdomäne, die Suchpipeline, den Trip-Workspace und die vorbereitete Übernahme als `stay`.

Diese Datei beschreibt den **tatsächlichen** Hotelweg. Produktprinzip: [JETNITY_VISION.md](../JETNITY_VISION.md) Abschnitt 5 und [JETNITY_HANDOFF.md](../JETNITY_HANDOFF.md). Entscheidungen: ADR-0070 bis ADR-0074 in [DECISIONS.md](../DECISIONS.md).

---

## 1. Was Phase 3.2 ist – und was nicht

Jetnity bestimmt zuerst, **in welcher Gegend** eine Etappe sinnvoll liegt, und erst danach wenige Hotels in dieser Gegend.

Gebaut:

- provider-unabhängige Hotel-/Quartierdomäne
- Quartierkontext aus dem echten Reisegraphen
- deterministische Quartierbewertung und Hotelrangfolge
- geschlossene Suchpipeline und Client-Sicht
- Hotelbereich je Etappe im bestehenden Reise-Arbeitsbereich
- Übernahme-Abbildung auf das bestehende `trip_items`-Schema (`kind = stay`)

Nicht gebaut:

- ein echter Hotelprovider oder Affiliate-/Booking-Deeplink
- Production-Hotelsuche
- eine neue Migration
- Routing-/POI-Daten für reale Wegezeiten
- eigene Hotelbuchung

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
| Übernahme | `lib/hotels/uebernahme.ts` | Option → kommerzieller `stay`-Planpunkt |
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
- Eingaben begrenzt: Zimmer 1–8, Erwachsene 1–16, Kinder 0–12, Timeout 12 s, max. 40 Providerangebote
- Rate-Limit im Prozess: 8 Suchen / 10 min und 24 / Tag je IP
- Production hart aus (`VERCEL_ENV=production`)
- `JETNITY_HOTEL_AKTIV` muss `true` oder `1` sein, **und** ein Provider muss existieren
- Phase 3.2 hat keinen Provider; der Normalzustand ist `unavailable`
- keine `NEXT_PUBLIC_*`-Hotel-Secrets
- keine kommerziellen Fakten aus dem Sprachmodell
- Tests rufen keinen echten Hotelprovider auf

---

## 6. Übernahme in die Reise

Ein später ausgewähltes Hotel wird als kommerzieller `trip_item` mit `kind = stay` gespeichert. Dafür reicht das bestehende Schema. **Keine neue Migration.**

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
- Quartierempfehlung nur bei vorhandenem Ort **und** Koordinaten
- Loading / Empty / Unavailable / Timeout / Error / Rate-Limit als getrennte Zustände
- Hotelkarten nur bei echten Optionen
- mobile-first, 44 px Trefferflächen, Status über `aria-*`

Solange kein Provider konfiguriert ist, erklärt die Fläche das ehrlich und zeigt höchstens die Gegeneinordnung aus der Reise.

---

## 8. Aktivierung (später, nicht jetzt)

1. Genau einen Hotel-Datenanbieter entscheiden (eigene Freigabe).
2. Adapter gegen `HotelProvider` bauen. Keine Booking-URL erfinden.
3. `JETNITY_HOTEL_AKTIV=true` nur in Development/Preview.
4. Niemals Production, kein Live-Token ohne eigene Freigabe.

---

## 9. Nächste Schritte nach Phase 3.2

1. Hotel-Daten-/Affiliateanbieter für die Schweiz vergleichen und genau einen wählen.
2. Quartier-Datenquelle bzw. Routing nur, wenn der Nutzen die Kosten trägt.
3. Ersten Adapter implementieren und in Preview verifizieren.
4. 3–5 echte Optionen im Workspace zeigen und übernehmen.
5. Production-Aktivierung erst nach separater Freigabe.
