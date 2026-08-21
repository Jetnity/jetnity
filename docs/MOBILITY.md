# Jetnity – Mobilität & Transfers

**Stand:** 21. August 2026 · Foundation A / PR #30  
**Gilt für:** Mobilitätsdomäne, Reisegraph, Trip-Workspace-Bereich, Persistenz und geschlossene Suchnaht.

Diese Datei beschreibt den tatsächlichen Mobilitätsweg. Produktprinzip: [JETNITY_VISION.md](../JETNITY_VISION.md), operativer Stand: [JETNITY_HANDOFF.md](../JETNITY_HANDOFF.md), Logikstandard: [docs/LOGIC_STANDARD.md](LOGIC_STANDARD.md). Entscheidungen: ADR-0090 und ADR-0091 in [DECISIONS.md](../DECISIONS.md).

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
- Production-Suche fail closed, ohne gewählten Provider und ohne erfundene Secrets

Nicht gebaut:

- echter Mobilitätsprovider oder Affiliate-/Booking-Deeplink
- produktiver Provider-Nachweis; `mobilityNachweisAusUmgebung()` gibt `null` zurück
- Production-Mobilitätssuche
- Mietwagen als eigener Transportnachweis (siehe Foundation B / [docs/RENTAL_CARS.md](RENTAL_CARS.md); ein Mietwagen deckt keine Bewegungskante)
- Kreuzfahrten
- lokale ÖV-Komplettplattform
- angenommene Wegezeiten zwischen Flughafen, Bahnhof, Hotel oder Hafen
- Bewertung „knapp/genug“ für Umstiege
- eigene Top-Level-`kind`-Werte `rail` / `bus` / `ferry`

Keine Verbindung in der Oberfläche ist ein erfundener Fahrplan oder Preis. Fixtures leben nur in Tests und im UI-Audit-Harness.

---

## 2. Schichten

```text
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
| Interface | `lib/mobility/provider.ts` | `MobilityProvider` – späterer Adapter ohne UI-Rewrite |
| Zustand | `lib/mobility/zustand.ts` | Production aus, Kill Switch, ohne Provider unavailable |
| Ranking | `lib/mobility/ranking.ts` | provisionsneutral, deterministisch, kein Modell |
| Orchestrierung | `lib/mobility/suche.ts` | Limit → Provider → Ranking |
| Client-Sicht | `lib/mobility/client-sicht.ts` | keine Tokens, kein Score, keine Rohfelder |
| Nachweis | `lib/mobility/nachweis.ts` | spätere Auswahlbestätigung, heute `null` |
| Konto-Kern | `lib/mobility/konto-uebernahme.ts` | identifiers + Nachweis, fail closed |
| Factory | `lib/mobility/factory.ts` | Foundation A gibt `null` zurück |
| Manuell | `lib/mobility/manuell.ts` | Nutzerangabe → `transfer`-Planpunkt |
| Felder | `lib/trips/mobilitaet-felder.ts` | Lesen/Normalisieren persistierter Spalten |

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

Migration:

`supabase/migrations/20260821120000_trip_items_mobility.sql`

Status:

- Development: angewendet und verifiziert
- Production: am 21. August 2026 nach ausdrücklicher Nutzerfreigabe angewendet und verifiziert
- Production-Migrationshistorie auf kanonische Version `20260821120000` ausgerichtet

Die Production-Migration aktiviert **keinen Provider und keine Suche**. Sie stellt nur das persistente Schema bereit.

---

## 4. Abdeckung

`mobilitaetsAbdeckung()` leitet `Bewegungskante`n aus Origin und Etappen ab:

- Hinfahrt Origin → erste Etappe
- Verbindungen zwischen aufeinanderfolgenden Etappen
- Rückfahrt letzte Etappe → Origin

Regeln:

- fehlendes Datum → `unknown`, nicht fälschlich `open`
- eindeutiger passender Transfer (Start, Ziel und Datum) → `selected` oder `booked`
- ein gleichdatiger Flug ohne strukturierten Routennachweis → `unknown`, nicht `covered_by_flight`
- mehrere Treffer oder Transfer plus gleichdatiger Flug → `unknown`
- ohne Transfer und ohne gleichdatigen Flug bleibt eine vollständige Kante `open`
- ein vorhandener Planpunkt ist ausgewählt, nicht automatisch gebucht
- Dauer in Minuten nur bei vollständigen lokalen Datums-/Zeitpaaren
- keine Bewertung „knapp/genug“ ohne belastbare Regel/Daten

`covered_by_flight` bleibt als Statuswert reserviert, entsteht in Foundation A aber nicht. Persistierte Flüge speichern Start und Ziel bisher nicht als vertrauenswürdige strukturierte Route. Freitext aus Titel/Notiz ist keine Trust Boundary. Ein Datum allein ist kein Routennachweis.

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

Echter iPhone-Preview-Test am 21. August 2026: bestanden; fünf Bereiche funktionieren stabil und die Darstellung wurde als gut bewertet. Größere optische Optimierungen sind bewusst auf einen späteren Gesamtbild-Pass verschoben.

---

## 8. Security

- keine neue Tabelle; vorhandene `trip_items`-RLS und Ownership bleiben Grenze
- kein Service-Role-Pfad im Browser
- keine Secrets im Client
- Request-Body-Cap vor Allokation
- Commercial Protection für gebuchte Transfers
- Production-Suche fail closed
- interne Audit-Route bleibt in Production fail closed
- `reise_anlegen(jsonb)` bleibt `SECURITY INVOKER`

---

## 9. Production-Verifikation

Nach ausdrücklicher Freigabe wurde `20260821120000_trip_items_mobility` auf Production angewendet.

Bestätigt:

- acht neue Mobilitätsspalten vorhanden
- neun relevante Mobility-/Booking-CHECK-Constraints vorhanden
- `reise_anlegen(jsonb)` schreibt Mobility-Felder
- `reise_anlegen(jsonb)` erlaubt `booked` für `flight`, `stay`, `transfer`
- `security_definer = false` / also SECURITY INVOKER
- `search_path=public, pg_temp`
- vorhandene Production-Daten: 0 ungültige Nicht-Transfer-Mobility-Zeilen
- 0 ungültige gebuchte Nicht-Kommerzielle Zeilen
- 0 ungültige Mobility-Evidenzwerte
- Production-/Development-/Repository-Migrationsversion: `20260821120000`

Die Production-Suche bleibt trotzdem **aus**.

---

## 10. Qualität / Nachweis

Route-Truth-Korrektur auf demselben PR: gleichdatiger Flug ohne strukturierte Route ist `unknown`, nicht `covered_by_flight`.

- `npm test` 1100/1100
- Typecheck, Lint, Hygiene grün
- Production-Build grün
- Development-Migration angewendet und DB-Checks grün
- Trip-Workspace-Audit WebKit + Chromium: 358 Kombinationen, 0 Fehler
- Activities-Regression: 184 Kombinationen, 0 Fehler
- GitHub CI grün vor Production-Doku-Sync
- Vercel Preview grün vor Production-Doku-Sync
- echter iPhone-Test bestanden

Nach dem Production-Doku-Sync muss der neue finale Head erneut CI/Vercel grün haben, bevor PR #30 gemergt wird.

---

## 11. Kosten

Keine neuen laufenden Kosten. Keine bezahlte Mobilitäts-API. Der Kill Switch allein erzeugt keine Providerkosten.

---

## 12. Nächster Schritt

Foundation A nicht um einen Fake-Provider erweitern. PR #30 ist auf `main`; das Production-Schema ist angewendet, die Suche bleibt aus.

Mietwagen ist Foundation B auf Draft-PR #31 und lebt als Unterbereich im Mobilitäts-Workspace. Ein Mietwagen darf eine Bewegungskante nicht als `covered` markieren. Siehe [docs/RENTAL_CARS.md](RENTAL_CARS.md).

Danach:

**Travel Readiness & Dokumente Foundation**

Phase 3.4 (erster echter Hotelprovider) bleibt extern blockiert, bis Booking.com Demand API / Managed Affiliate Partner oder der dokumentierte HBX-Backup-Weg tatsächlich verfügbar ist.
