# Jetnity – Mietwagen

**Stand:** 22. August 2026 · Foundation B / Draft-PR #31, Logic-/Truth-Fix  
**Gilt für:** Mietwagendomäne, Persistenz, Trip-Workspace-Unterbereich in Mobilität und geschlossene Suchnaht.

Diese Datei beschreibt den tatsächlichen Mietwagenweg. Produktprinzip: [JETNITY_VISION.md](../JETNITY_VISION.md), operativer Stand: [JETNITY_HANDOFF.md](../JETNITY_HANDOFF.md), Logikstandard: [docs/LOGIC_STANDARD.md](LOGIC_STANDARD.md). Entscheidungen: ADR-0092 und ADR-0093 in [DECISIONS.md](../DECISIONS.md).

---

## 1. Was Foundation B ist – und was nicht

Ein Mietwagen ist Teil derselben Reise, keine isolierte Autovermietungs-Suchmaschine. Fachlich ist er anders als ein einzelner Transfer: Er hat Abholung und Rückgabe, kann mehrere Reisetage überspannen und an unterschiedlichen Stationen beginnen und enden. Er ist **nicht** automatisch der Beweis, dass eine konkrete Bewegungskante mit diesem Auto gefahren wird.

Gebaut:

- persistenter Planpunkt `trip_items.kind = rental_car`
- wenige optionale Spalten auf `trip_items` (kein `metadata`-JSON, keine 1:1-Tabelle)
- Abholung/Rückgabe nutzen die vorhandenen Ortsfelder `origin_*` / `destination_*`
- Zeitraum über vorhandene `starts_on/at` und `ends_on/at`
- One-way wird aus Ortsfakten abgeleitet, nicht gespeichert
- provider-unabhängige Domäne unter `lib/rental-cars/`
- manueller Buchungsstatus analog zu Flug/Stay/Transfer: `unconfirmed` oder `booked`, Quelle nur `user`
- manuelle Erfassung als ausdrücklich gekennzeichnete Nutzerangabe
- geschlossene Suchpipeline und Client-Sicht
- Production-Suche fail closed, ohne gewählten Provider und ohne erfundene Secrets
- Integration in den bestehenden Hauptbereich **Mobilität**, ohne sechsten Workspace-Tab

Nicht gebaut:

- echter Mietwagenprovider oder Affiliate-/Booking-Deeplink
- produktiver Provider-Nachweis; `rentalCarNachweisAusUmgebung()` gibt `null` zurück
- Production-Mietwagensuche
- Führerschein-, Pass-, Zahlungs- oder Kreditkartendaten
- Fahreralter als persistentes Feld
- Versicherungsverkauf, Kautionssystem, Routing
- automatische Transportabdeckung aus Mietzeitraum oder Ortsüberlappung

Keine Oberfläche zeigt erfundene Fahrzeuge, Preise, Verfügbarkeiten oder Mietbedingungen. Fixtures leben nur in Tests und im UI-Audit-Harness.

---

## 2. Schichten

```text
Reise-Arbeitsbereich / Mobilität → Unterbereich Mietwagen
  → Bestand aus dem Reisegraphen
  → POST /api/rental-cars/search
    → Zod (untrusted input)
      → Zustand (Production, Kill Switch, fehlender Provider)
        → Rate-Limit
          → RentalCarProvider.suchen()   ← heute null
            → Ranking (nur bei echten Optionen)
              → Client-Sicht ohne Scores/Provider/Ref
```

Persistenz läuft über denselben Reisegraphen wie Flug, Stay, Aktivität und Transfer. Gast und Konto teilen dieselbe `TripItem`-Form.

---

## 3. Datenmodell

Entscheidung ADR-0092: Variante A.

| Fakt | Abbildung |
| --- | --- |
| Art | `trip_items.kind = rental_car` |
| Abholort | `origin_place_id`, `origin_name` |
| Rückgabeort | `destination_place_id`, `destination_name` |
| Abholung | `starts_on`, `starts_at` |
| Rückgabe | `ends_on`, `ends_at` |
| Vermieter | `rental_supplier` – Nutzerfakt, nicht Such-Provider |
| Fahrzeugklasse | `vehicle_class`: `economy`, `compact`, `intermediate`, `fullsize`, `suv`, `van`, `luxury` |
| Getriebe | `transmission`: `automatic`, `manual` |
| Evidenz | `rental_evidence` – in dieser Foundation nur `user` |
| Preis / Booking | vorhandene Handels- und Booking-Spalten |

One-way vs. gleiche Station ist abgeleitet (`rentalOneWay()`). Transfer-Felder `mobility_mode`, `connection_ref`, `mobility_changes`, `mobility_evidence` bleiben auf einem Mietwagen leer.

`public.reise_anlegen()` schreibt die Mietwagenfelder und erlaubt `booked` für `rental_car` nur als `user`. `public.reise_aendern()` wird nicht ersetzt; sie schreibt keine Handels-, Mobilitäts- oder Mietwagenfelder. TypeScript-seitig schützt `lib/reiseaenderung/geschuetzt.ts` gebuchte Mietwagen gegen stille Modellmutation.

Migration `20260821200000_trip_items_rental_car.sql` gilt **nur Development**. Nicht Production.

---

## 4. Wahrheit / Reisegraph

Verbindliche Invarianten:

1. Ausgewählt/eingetragen ist nicht gebucht.
2. Provider verfügbar ist nicht Fahrzeug verfügbar.
3. Preis vorhanden ist nicht Gesamtpreis, ausser die Quelle sagt das ausdrücklich.
4. Ein Mietwagenzeitraum, der einen Reisetag überlappt, deckt keine Strecke ab.
5. Gleicher Ort oder gleiches Datum ist keine bewiesene Verbindung.
6. Unbekannte Uhrzeit, Klasse, Getriebe, Kaution, Kilometer, Tankregel oder Storno bleiben unbekannt.
7. Manuelle Werte sind Nutzerangaben, keine Providerbestätigung.
8. Mehrdeutige Orte werden nicht geraten.
9. Ein vorhandener Mietwagen markiert eine `Bewegungskante` niemals als `covered`.
10. Reise-Origin, Etappen oder Gesamtreisedaten sind keine bestätigte Mietwagen-Suchabsicht und keine gespeicherten Abhol-/Rückgabefakten.
11. `one_way` gilt nur bei beweisbar unterschiedlichen Orten (zwei verschiedene Place-IDs). Verschiedene Labels ohne zwei IDs bleiben `unknown`.
12. Kalendertage des Mietzeitraums sind keine Reisetage und keine Streckenabdeckung.
13. Preisranking und `Best Value` nur für nachweislich vergleichbare Gesamtpreise in derselben Währung.

Die Übersicht zeigt eine knappe Mietwagenzeile nur, wenn ein Mietwagen existiert. «Kein Mietwagen geplant» ist keine Pflichtlücke.

---

## 5. Suche und Kill Switch

`POST /api/rental-cars/search` ist geschlossen: nur `application/json`, höchstens 16 KB UTF-8. Production ist hart aus. Ohne Provider keine Fake-Ergebnisse.

Kill Switch: `JETNITY_RENTAL_CAR_AKTIV` (`true` oder `1`). Das ist kein Provider-Secret und benennt keinen Anbieter. Production bleibt selbst bei gesetztem Schalter fail closed.

Rate Limit: 8 Anfragen / 10 Minuten und 24 / Tag je Kennung. `429` setzt `Retry-After`.

`rentalCarProviderAus()` gibt `null` zurück. Die Konto-Übernahme einer späteren Provideroption verlangt einen serverseitigen `RentalCarNachweis` und ist heute fail closed.

Das Öffnen von Mobilität → Mietwagen startet **keine** Suche. Eine Provideranfrage darf erst nach ausdrücklicher Nutzeraktion mit sichtbaren, vom Nutzer gesetzten Kriterien laufen. Solange kein Suchformular existiert, bleibt der Bereich ehrlich `unavailable`/`vorbereitet`.

---

## 6. UX

Fünf Hauptbereiche bleiben:

`Übersicht · Flüge · Unterkunft · Aktivitäten · Mobilität`

Innerhalb von Mobilität gibt es die Unterbereiche **Verbindungen** und **Mietwagen**. Bestand und Status stehen vor der Suche. Ohne Provider erscheint ein ehrlicher Unavailable-Text, ohne automatischen Request. Die manuelle Erfassung startet leer; Reiseorte dürfen höchstens als unverbindlicher Platzhalter (`z. B. …`) erscheinen, niemals als vorbelegter Fakt oder Place-ID. `One-way` wird nur bei `rentalOneWay() === 'one_way'` gezeigt. Mietdauer heisst `Kalendertage Mietzeitraum`, nicht `Reisetage`.

---

## 7. Security / Privacy

- keine neue Tabelle, vorhandene `trip_items`-RLS bleibt die Eigentumsgrenze
- kein Service Role im Browser
- keine Führerschein-, Pass-, Kreditkarten- oder CVV-Daten
- keine Booking-URL aus dem Browser
- der Browser darf `rental_evidence` nicht auf eine Providerquelle setzen
- Search-Route ist in Production unabhängig vom Kill Switch aus

---

## 8. Qualität / Nachweis

Stand Draft-PR #31 Logic-/Truth-Fix, 22. August 2026:

- Review-Fix der vier Wahrheitsbefunde ist im Code; vollständiger Qualitätsnachweis folgt auf dem neuen Head
- echter iPhone-Test **offen**, erst nach diesem Review-Fix

---

## 9. Kosten

Keine neuen laufenden Kosten. Kein bezahlter Mietwagen-Account. Der Kill Switch allein erzeugt keine Providerkosten.

---

## 10. Nächster Schritt

Foundation B nicht um einen Fake-Provider erweitern. Real-Device-iPhone-Test kommt nach diesem Review-Fix und bleibt offen, bis der Nutzer ihn bestätigt. Production-Migration und Production-Suche brauchen jeweils eine ausdrückliche Freigabe.

Danach geplant: **Travel Readiness & Dokumente Foundation**. Phase 3.4 bleibt extern blockiert.
