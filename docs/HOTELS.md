# Hotels – Phase 3.2 Foundation

Stand: 20. August 2026  
Status: in Arbeit auf `phase-3-2-hotel-foundation`

## Ziel

Jetnity soll Hotels nicht wie eine klassische Ergebnisliste behandeln. Die zentrale Frage lautet zuerst:

> In welcher Gegend sollte der Nutzer für genau diese Reise wohnen?

Erst danach werden wenige passende Hotels innerhalb der sinnvollsten Gegend bewertet.

## Architektur

Die Hotelarchitektur bleibt provider-unabhängig:

`Reisekontext → Quartier-Kandidaten → deterministische Quartierbewertung → HotelProvider → normalisierte Hoteloptionen → Jetnity-Kontext → deterministisches Hotelranking → Nutzerentscheidung → Trip-Übernahme`

Die Schichten sind bewusst getrennt:

- `lib/hotels/domain.ts`: interne Hotel-/Quartiertypen
- `lib/hotels/provider.ts`: schmales Suchprovider-Interface
- `lib/hotels/quartier-ranking.ts`: Lageentscheidung vor der Hotelsuche
- `lib/hotels/ranking.ts`: Hotelranking innerhalb der ausgewählten Gegend

Kein Provider-SDK darf in UI, Ranking oder Trip-Logik durchsickern.

## Quartierbewertung

Die erste Foundation bewertet Gegenden deterministisch anhand von:

- tatsächlichen Wegezeiten zu den bekannten Reiseankern
- An- und Abreisetransfers
- Geh- und ÖV-Eignung
- Nutzerpräferenzen wie Ruhe, Nachtleben, Essen, Strand und Familie
- typischem Preisniveau relativ zum Budget

Aktuelle feste Gewichte:

| Faktor | Gewicht |
| --- | ---: |
| Reisewege | 35 |
| Transfer | 15 |
| Mobilität | 15 |
| Präferenzen | 25 |
| Budget | 10 |

Die Gewichte enthalten keine Provider- oder Provisionskomponente.

Fehlende Geodaten werden nicht erfunden. Unbekannte Werte bleiben neutral und werden später durch echte Routing-/POI-Daten ersetzt oder ergänzt.

## Hotelranking

Innerhalb der ausgewählten Gegend bewertet Jetnity:

| Faktor | Gewicht |
| --- | ---: |
| Lage / Wege zur Reise | 34 |
| Preis | 28 |
| Qualität | 14 |
| Flexibilität / Stornierbarkeit | 10 |
| Nutzerpräferenzen | 8 |
| Evidenz / Bewertungsbasis | 6 |

Der billigste Preis ist damit bewusst nicht automatisch die Jetnity-Empfehlung.

Vorgesehene Labels:

- `jetnity` – beste Gesamtpassung
- `best_value` – starkes Verhältnis aus Preis, Qualität und Lage
- `best_location` – beste Lage für die konkrete Reise
- `quiet` – ruhigere Alternative, wenn Daten vorhanden
- `premium` – höchste Qualitätsoption

Die Empfehlung erklärt die wichtigsten Trade-offs. Provisionen dürfen Score oder Labels nicht beeinflussen.

## Provider-Trennung

`HotelProvider` liefert nur normalisierte Suchdaten. Es erzeugt keine Booking-/Affiliate-URL und bucht nichts.

Search-Provider und Monetarisierungs-/Deeplink-Provider können später identisch sein, müssen es aber architektonisch nicht sein. Dadurch kann Jetnity einen Hotelanbieter austauschen oder ergänzen, ohne UI, Quartierlogik, Ranking und Trip-Integration neu zu bauen.

## Kommerzielle Fakten

Providerdaten dürfen nur gespeichert oder angezeigt werden, wenn sie tatsächlich geliefert wurden. Unter anderem:

- Hotelname und Lage
- Preis und Währung
- Zimmer-/Rate-Bezeichnung
- Sterne und Gästebewertung
- Stornierbarkeit / Deadline
- Frühstück
- Steuerhinweis
- Provider und External-Ref

Fehlende Fakten bleiben `null`; Jetnity darf sie nicht aus dem Sprachmodell ergänzen.

## Noch nicht Teil der Foundation

- kein echter Hotelprovider
- keine Production-Hotelsuche
- keine Affiliate-/Booking-Deeplinks
- keine eigene Hotelbuchung
- keine neue Production-Migration
- noch keine persistente Hotelübernahme in den Trip
- noch kein Routing-/POI-Provider für reale Wegezeiten

Diese Punkte werden schrittweise ergänzt, nachdem Domain, Ranking und Sicherheitsgrenzen grün sind.

## Nächste Schritte innerhalb Phase 3.2

1. Foundation durch CI/Typecheck/Lint absichern.
2. Quartier-Datenquelle und Routingstrategie auswählen, ohne unnötige laufende Kosten.
3. aktuellen Hotel-Daten-/Affiliateanbieter für die Schweiz und spätere Internationalisierung vergleichen.
4. genau einen ersten Hoteladapter implementieren.
5. Preview-Suche und 3–5 Ergebnisoptionen in den bestehenden Trip Workspace integrieren.
6. ausgewähltes Hotel als kommerziellen Trip-Baustein übernehmen; Modell darf kommerzielle Fakten nicht still überschreiben.
7. Production-Aktivierung erst nach separater Freigabe.

## Verbindliche Leitplanken

- Gesamtreise statt Einzelpreis optimieren.
- Erst Gegend, dann Hotel.
- Provisionen dürfen weder Quartierwahl noch Hotelranking verändern.
- Keine erfundenen Preise, Verfügbarkeiten, Stornoregeln oder Booking-URLs.
- Keine Secrets im Client oder Repository.
- Production bleibt kontrolliert und benötigt ausdrückliche Freigabe.
