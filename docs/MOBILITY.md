# Jetnity – Mobilität & Transfers

**Stand:** 21. August 2026 · Foundation A (Draft-PR #30)  
**Gilt für:** die interne Mobilitätsdomäne, den Reisegraphen, den Trip-Workspace-Bereich und die geschlossene Suchnaht.

Diese Datei beschreibt den **tatsächlichen** Mobilitätsweg. Produktprinzip: [JETNITY_VISION.md](../JETNITY_VISION.md) und [JETNITY_HANDOFF.md](../JETNITY_HANDOFF.md). Entscheidungen: ADR-0090 und ADR-0091 in [DECISIONS.md](../DECISIONS.md).

---

## 1. Was Foundation A ist – und was nicht

Mobilität ist kein Bündel isolierter Suchmaschinen. Bahn, Bus, Fähre und Transfer teilen **einen** Workspace-Bereich und hängen am selben Reisegraphen wie Flug, Unterkunft, Aktivitäten, Tagesplan, Budget und Buchungsstatus.

Gebaut:

- gemeinsamer persistenter Planpunkt `trip_items.kind = transfer`
- strukturierte optionale Spalten auf `trip_items` (kein `metadata`-JSON, keine 1:1-Tabelle)
- provider-unabhängige Domäne unter `lib/mobility/`
- konservative, deterministische Abdeckung (`Bewegungskante`)
- manueller Buchungsstatus für Transfer analog zu Flug/Stay
- manuelle Erfassung als Nutzerangabe
- geschlossene Suchpipeline und Client-Sicht
- Production fail closed, ohne gewählten Provider und ohne erfundene Secrets

Nicht gebaut:

- ein echter Mobilitätsprovider oder Affiliate-/Booking-Deeplink
- ein produktiver Nachweis; `mobilityNachweisAusUmgebung()` gibt `null` zurück
- Production-Mobilitätssuche
- Mietwagen
- Kreuzfahrten
- lokale ÖV-Komplettplattform
- angenommene Wegezeiten zwischen Flughafen, Bahnhof, Hotel oder Hafen
- Bewertung „knapp/genug“ für Umstiege
- eigene Top-Level-`kind`-Werte `rail` / `bus` / `ferry`

Keine Verbindung in der Oberfläche ist ein erfundener Fahrplan oder Preis. Fixtures leben nur in Tests und im UI-Audit-Harness.

---

## 2. Schichten

```
Reise-Arbeitsbereich
  → Bestand / Bewegungskanten aus dem Reisegraphen
  → POST /api/mobility/search
    → Zod (untrusted input)
      → Zustand (Production, Kill Switch, fehlender Provider)
        → Rate-Limit
          → MobilityProvider.suchen()   ← heute null
            → Normalisierung
              → deterministisches Ranking
                → Client-Sicht (ohne Score, ohne Rohdaten)
```

| Schicht | Datei | Aufgabe |
| --- | --- | --- |
| Domäne | `lib/mobility/domain.ts` | Suchanfrage, Option, Evidenz, Status |
| Prüfung | `lib/mobility/schema.ts` | Zod, untrusted input, manuelle Eingabe |
| Kanten | `lib/mobility/kanten.ts` | Verbindungsbedarf und Abdeckung |
| Interface | `lib/mobility/provider.ts` | `MobilityProvider` – ein späterer Adapter ohne UI-Rewrite |
| Zustand | `lib/mobility/zustand.ts` | Production aus, Kill Switch, ohne Provider unavailable |
| Ranking | `lib/mobility/ranking.ts` | provisionsneutral, deterministisch, kein Modell |
| Orchestrierung | `lib/mobility/suche.ts` | Limit → Provider → Ranking |
| Client-Sicht | `lib/mobility/client-sicht.ts` | keine Tokens, kein Score, keine Rohfelder |
| Nachweis | `lib/mobility/nachweis.ts` | spätere Auswahlbestätigung, heute `null` |
| Konto-Kern | `lib/mobility/konto-uebernahme.ts` | identifiers + Nachweis, fail closed |
| Factory | `lib/mobility/factory.ts` | Foundation A gibt `null` zurück |
| Manuell | `lib/mobility/manuell.ts` | Nutzerangabe → `transfer`-Planpunkt |
| Felder | `lib/trips/mobilitaet-felder.ts` | Lesen/Normalisieren der persistierten Spalten |

Die UI (`components/trips/MobilitaetBereich.tsx`) spricht nur die interne Domäne.

---

## 3. Persistenz

Bahn, Bus, Fähre und Transfer bleiben `kind = transfer`. Die fachliche Art steht in `mobility_mode`.

Strukturierte Spalten auf `trip_items`:

| Spalte | Bedeutung |
| --- | --- |
| `mobility_mode` | `rail` \| `bus` \| `ferry` \| `transfer` |
| `origin_place_id` / `destination_place_id` | optionale Place-IDs, **ohne FK** auf `places` |
| `origin_name` / `destination_name` | Anzeigenamen |
| `connection_ref` | Zug-/Bus-/Fahrnummer, nur wenn bekannt |
| `mobility_changes` | Umstiege; `0` = direkt; `null` = unbekannt |
| `mobility_evidence` | in dieser Foundation nur `user` |

Nicht-Transfer-Zeilen und historischer Transfer-Altbestand bleiben `null`. Es gibt keine FK auf `places`, damit eine Gastreise-Übernahme nicht an fehlenden Ortszeilen scheitert.

`starts_on` / `starts_at` / `ends_on` / `ends_at` werden wiederverwendet. Die vorhandene, ungenutzte Spalte `time_zone` wird in dieser Foundation nicht in `TripItem` aufgenommen.

`public.reise_anlegen()` schreibt die neuen Felder und erlaubt `booked` für `transfer` nur als Quelle `user`. `public.reise_aendern()` wird **nicht** ersetzt: sie schreibt keine Handels- oder Mobilitätsfelder; bestehende Werte bleiben stehen.

Migration: `supabase/migrations/20260821120000_trip_items_mobility.sql`. **Nur Development.** Nicht Production.

---

## 4. Abdeckung

`mobilitaetsAbdeckung()` leitet `Bewegungskante`n aus Origin und Etappen ab:

- Hinfahrt Origin → erste Etappe
- Verbindungen zwischen aufeinanderfolgenden Etappen
- Rückfahrt letzte Etappe → Origin

Regeln:

- fehlendes Datum → `unknown`, nicht fälschlich `open`
- eindeutiger passender Transfer → `selected` oder `booked`
- eindeutiger passender Flug am Kantendatum → `covered_by_flight`
- mehrere Treffer oder Transfer plus Flug → `unknown`
- ein vorhandener Planpunkt ist ausgewählt, nicht automatisch gebucht
- Dauer in Minuten nur bei vollständigen lokalen Datums-/Zeitpaaren
- keine Bewertung „knapp/genug“

Die bestehende Flugabdeckung in `lib/trips/flug-abdeckung.ts` bleibt unverändert.

---

## 5. Buchungsstatus und manuelle Eingabe

`kind = transfer` darf manuell `unconfirmed → booked → unconfirmed` durchlaufen. Quelle ist immer `user`. Der Browser darf keine Providerbestätigung setzen.

Manuelle Mobilität ist eine **Nutzerangabe**:

- keine manuelle Booking-URL
- kein `provider` aus dem Formular
- serverseitige Zod-Prüfung inkl. Datum/Zeit, Preis/Währung, Body-Limits
- Commercial Protection behandelt Mobilitätsfelder wie Preis, Provider und Booking-Status

---

## 6. Provider-Naht

`POST /api/mobility/search` ist geschlossen: nur `application/json`, höchstens 16 KB. Production ist hart aus. Ohne Provider keine Fake-Ergebnisse.

Kill Switch: `JETNITY_MOBILITY_AKTIV` (`true` oder `1`). Das ist kein Provider-Secret und benennt keinen Anbieter.

`mobilityProviderAus()` gibt `null` zurück. `mobilityNachweisAusUmgebung()` gibt `null` zurück. Eine spätere Konto-Übernahme aus Providerergebnissen bleibt fail closed.

Ranking ist deterministisch und provisionsneutral. Providername, Affiliate oder Umsatz sind keine Faktoren. Fehlende Fakten bleiben `null`.

---

## 7. Oberfläche

Genau ein Hauptbereich **Mobilität**. Keine separaten Tabs für Bahn, Bus, Fähre und Transfer.

Mobile-Navigation unter 1024 px:

`Übersicht · Flüge · Unterkunft · Aktivitäten · Mobilität`

Die Navigationszeile darf horizontal scrollen, die Seite nicht. Nur der aktive kompakte Bereich ist sichtbar (`hidden` ohne `grid`/`flex`/`block`). Desktop ab 1024 px behält die breite Arbeitsansicht.

Suche ohne Provider: ehrlicher Unavailable-State, keine Fake-Angebote. Manuelle Erfassung ist als Nutzerangabe gekennzeichnet.

---

## 8. Security

- keine neue Tabelle; vorhandene `trip_items`-RLS und Ownership bleiben die Grenze
- kein Service-Role-Pfad im Browser
- keine Secrets im Client
- Request-Body-Cap vor Allokation
- Commercial Protection für gebuchte Transfers
- Production-Suche fail closed
- interne Audit-Route bleibt in Production fail closed

---

## 9. Kosten

Keine neuen laufenden Kosten. Keine bezahlte Mobilitäts-API. Der Kill Switch allein erzeugt keine Providerkosten.

---

## 10. Nächster Schritt

Nicht automatisch ein Provider. Nach Review/Merge von PR #30 entscheidet die Roadmap zwischen Mietwagen-Foundation, Travel-Readiness-Foundation oder einem inzwischen verfügbaren echten Providerzugang. Phase 3.4 (Hotelprovider) bleibt extern blockiert.
