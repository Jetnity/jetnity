# Jetnity – Roadmap

Stand: 22. August 2026

Diese Datei ist die operative Roadmap. Historische Detailstände bleiben über Git, Pull Requests und `DECISIONS.md` nachvollziehbar. Für den aktuellen Übergabestand zusätzlich `JETNITY_HANDOFF.md` und `docs/CONTINUITY_STANDARD.md` lesen.

## Übersicht

| Phase | Inhalt | Status |
| --- | --- | --- |
| Phase 0 | V2-Basis, Build, CI, Design-Tokens, Dokumentation | **fertig** |
| Querschnitt | Mobile- und Responsive-Qualität der V2-Seiten | **abgeschlossen, in Production verifiziert** |
| Phase 1.1–1.5 | V2-Sicherheit, Auth, Datenbank-Baseline, Reiseschema, Persistenz | **fertig** |
| Phase 2.1 | natürliche Sprache → strukturierter Reisevorschlag | **fertig; Production-Modellweg aus** |
| Phase 2.2 | bestehende Reise per Sprache ändern | **fertig, nach `main` gemergt; Production-Modellweg aus** |
| Phase 3.1 | Flight Foundation + erster Duffel-Adapter | **fertig, nach `main` gemergt; Production-Flugsuche aus** |
| Phase 3.2 | Hotel Foundation + Quartierlogik + 3.2b/3.2c-Härtung | **fertig, nach `main` gemergt; Production-Hotelsuche aus** |
| Phase 3.3 | Activities Foundation + Tageskontext + Ranking + UI-Audit | **fertig, nach `main` gemergt; Production-Aktivitätensuche aus** |
| Phase 3.4 | erster echter Hotel-Suchadapter | **wartet / extern blockiert durch Booking.com-Zugang; HBX/Hotelbeds Backup** |
| Querschnitt | Trip Workspace Mobile UX Iteration 1–3 | **fertig, nach `main` gemergt (PR #27)** |
| Querschnitt | Trip Coverage & Booking Status | **auf `main` (PR #29, `211872c1`); Production-Booking-Migration nach Nutzerfreigabe angewendet** |
| Foundation-Track A | Mobilität & Transfers – Bahn, Bus, Fähre, Transfers | **fertig, nach `main` gemergt (PR #30); Production-Schema angewendet, Suche aus** |
| Foundation-Track B | Mietwagen Foundation | **fertig, nach `main` gemergt (PR #31)**; Schema auf Production; Suche aus |
| Foundation-Track C | Travel Readiness & Dokumente Foundation | **Draft-PR #32**; reviewbar; Development-Migration; nicht mergen; kein Production-Schema |
| Foundation-Track D | Gesamt-Abdeckung im Reisegraphen erweitern | geplant nach C |
| Phase 3.5 | erster echter Activity-Suchadapter | geplant; bei fehlendem Zugang extern blockiert |
| Phase 3.6 | echte Mobilitäts-/Transferprovider auf Foundation A | geplant |
| Phase 4 | Launch-Reife, Monetarisierung, Production-Freigaben | geplant |

## Aktueller stabiler Stand

### Phase 3.1 – Flight Foundation

Abgeschlossen und auf `main`.

- provider-neutrale Flugdomäne
- Duffel als erster Adapter
- deterministisches, provisionsneutrales Ranking
- geschlossene Jetnity-Suchroute
- lokale Airport-/Place-Basis
- Production-Flugsuche bleibt hart aus
- echter Duffel-Test mit Sandbox-Token wird separat nachgeholt

### Phase 3.2 – Hotel Foundation

Abgeschlossen und auf `main`.

- provider-neutrale Hotel-Domäne und Suchpipeline
- Quartier-/Gegendlogik vor der konkreten Hotelwahl
- deterministisches, provisionsneutrales Ranking
- serverseitiger, kontextgebundener `HotelNachweis`
- Browser darf kommerzielle Hotelfakten nicht selbst setzen
- Request-Body wird vor großer Allokation begrenzt
- echter Hotelprovider noch nicht angebunden
- Production-Hotelsuche bleibt hart aus

Providerstrategie: `docs/HOTEL_PROVIDER_STRATEGY.md`.

Verbindliche Reihenfolge:

1. Booking.com Demand API versuchen
2. HBX / Hotelbeds als Backup
3. Expedia Rapid später prüfen
4. langfristig mehrere Quellen nur bei echtem Produktnutzen

### Phase 3.3 – Activities Foundation

**Abgeschlossen, gemergt und Production-deployt.**

Pull Request #24 wurde am 20. August 2026 per Squash Merge nach `main` übernommen.

Merge-Commit:

`2fa0f16a43ebb41c9e453013c38a6eb4979b00ce`

Abschlussstand:

- provider-neutrale Activity-Domäne
- geschlossene `POST /api/activities/search`
- Tageskontext aus dem Reisegraphen
- deterministisches, provisionsneutrales Ranking
- explizite Zeit-/Konfliktlogik; unbekannt bleibt unbekannt
- serverseitige `ActivityNachweis`-Naht
- Konto-Übernahme fail closed, solange kein echter Provider-Nachweis existiert
- Browser sendet bei kommerzieller Konto-Übernahme nur Kennungen
- Speicherung auf bestehendem `trip_items.kind = activity`
- keine Migration nötig
- Production-Aktivitätensuche hart aus
- kein Provider, kein Key/Secret, keine Fake-Aktivitäten im Produktweg
- `/ui-audit/activities` in Production unabhängig vom Audit-Flag immer 404

Qualität vor Merge:

- `npm test`: **1001/1001**
- Typecheck grün
- Lint grün
- Hygiene grün
- Production-Build grün
- GitHub CI grün
- Vercel Preview grün
- WebKit + Chromium Activities-Audit: **184 Kombinationen, 0 Fehler**
- 13 Zustände × 7 Viewports × 2 Engines plus Interaktions-/Race-Prüfungen

## Nächster Hauptblock – Phase 3.4

### Erster echter Hotel-Suchadapter

**Status: WARTET / EXTERN BLOCKIERT.**

Ziel: Die bereits fertige Hotelarchitektur erstmals mit echten Hotelpreisen, Verfügbarkeiten und Providerfakten verbinden.

**Primärer externer Blocker:** gültiger Booking.com Demand API / Managed Affiliate Partner Zugang. Dokumentierter Backup-Weg: HBX / Hotelbeds.

Ohne gültigen Zugang wird kein Booking.com-Adapter simuliert und keine Fake-Integration gebaut.

Sobald Zugang vorliegt:

- echten `HotelProvider` implementieren
- Rohdaten in das neutrale Jetnity-Modell normalisieren
- Preise/Verfügbarkeit/Stornierung serverseitig verifizieren
- echten `HotelNachweis` anbinden
- Search und Affiliate-/Redirect-Pfad getrennt halten
- bestehendes Quartier- und Hotelranking unverändert provisionsneutral nutzen
- echte Hotelkarten im Trip Workspace nur aus echten Providerantworten zeigen
- Error/Timeout/Rate-Limit/Provider-Ausfall sauber behandeln
- Preview-End-to-End-Test und Mobile-/Browser-Audit durchführen
- Production-Hotelsuche weiterhin aus lassen, bis separat freigegeben

### Querschnitt – Trip Workspace Mobile UX Iteration 1–3

**Auf `main` gemergt** als Pull Request #27, Merge-Commit `70e471b00c7505356fe13f8185b204200c4bb781`.

- kompakter Reisekopf, klebende Bereichsnavigation, Übersicht als Default
- sichtbare Mobile-Bereiche waren Übersicht, Flüge, Unterkunft, Aktivitäten; der Tagesplan liegt in der Übersicht. Foundation A ergänzt Mobilität als fünften Bereich.
- Desktop-Arbeitsansicht bleibt
- keine Production-Datenbankänderung, Provider-Suchen unverändert aus

### Querschnitt – Trip Coverage & Booking Status

Gezielter Dashboard-Block, parallel zu Phase 3.4, ohne Provider-Aktivierung. **Auf `main` gemergt** als Pull Request #29, Merge-Commit `211872c1aad0e002d81f5ea1fb2d7eef4490d4b7`.

- Branch war `feat/trip-coverage-booking-status`
- Status: **auf `main`**
- ehrliche Flug-/Nachtabdeckung aus dem Reisegraphen
- expliziter manueller Buchungsstatus (`unconfirmed` / `booked`, Quelle nur `user`)
- Bestand oberhalb der bestehenden Suche
- Migration `20260821100000_trip_items_booking_status.sql` am 21. August 2026 nach ausdrücklicher Nutzerfreigabe auf Production angewendet und verifiziert
- Production-Spalten `booking_status`, `booking_source`, `booking_confirmed_at` vorhanden
- vier Booking-CHECK-Constraints vorhanden
- `reise_anlegen(jsonb)` enthält Booking-Felder
- bestehende Production-Zeilen korrekt als `unconfirmed`; Verifikationsabfrage: **0 ungültige Booking-Zeilen**
- Trip-Workspace-Audit nach Visibility-Fix: **278 Kombinationen, 0 Fehler**, inklusive Wechselketten 390/430 px
- Activities-Regression: **184 Kombinationen, 0 Fehler**
- echter iPhone-Nachtest der Tab-Sichtbarkeit: **bestanden**
- Provider-Suchen/Kill-Switches unverändert aus

## Provider-unabhängiger Foundation-Track während Phase 3.4 wartet

Die Wartezeit auf externe Providerzugänge wird genutzt, um Jetnity funktional bis zu dem Punkt vorzubereiten, an dem später nur noch echte Provider/Nachweise angeschlossen werden müssen. Keine Fake-Suchen, keine erfundenen Fahrpläne und keine überbreite Transportplattform.

### Foundation A – Mobilität & Transfers

**Abgeschlossen und auf `main` (PR #30).** Schema-Migration `20260821120000` ist auf Production angewendet. Die Mobilitätssuche bleibt hart aus. Phase 3.4 bleibt wartend.

Gemeinsames Reisegraph-Modell für Bahn, Bus, Fähre und Transfer:

- persistenter Planpunkt bleibt `trip_items.kind = transfer`
- strukturierte optionale Spalten statt JSON oder 1:1-Tabelle (ADR-0090)
- konservative `Bewegungskante`-Abdeckung (ADR-0091): Transfer nur bei Start + Ziel + Datum; ein Datum allein macht keinen Flug zur Abdeckung
- manueller Buchungsstatus analog zu Flug/Stay
- geschlossene Suchnaht, Factory/Nachweis `null`, Kill Switch `JETNITY_MOBILITY_AKTIV`
- ein Workspace-Bereich „Mobilität“, keine vier Tabs

Fachdoku: [docs/MOBILITY.md](docs/MOBILITY.md). Auftrag: [docs/CURSOR_MOBILITY_TRANSFERS_FOUNDATION_TASK.md](docs/CURSOR_MOBILITY_TRANSFERS_FOUNDATION_TASK.md).

Nicht in diesem Block: Mietwagen, Kreuzfahrten, echter Provider, Fake-Fahrpläne/Preise, Production-Aktivierung.

### Foundation B – Mietwagen

**Abgeschlossen und auf `main` (PR #31).** Production-Schema `20260821200000` ist angewendet; Production-Suche bleibt aus. Nicht erneut bauen.

Nachweis 22. August 2026: Tests **1165/1165**, Typecheck/Lint/Hygiene/Production-Build grün, Development-DB-Checks grün, Workspace-Audit **502/0**, Activities-Regression **184/0**. ADR-0094 und ADR-0095 schließen die Truth- und Ranking-Label-Befunde. Echter iPhone-Preview-Test **bestanden** (`docs/PR31_REAL_DEVICE_ACCEPTANCE.md`). Production-Migration **verifiziert** (`docs/PR31_PRODUCTION_MIGRATION_ACCEPTANCE.md`). Merge nur nach separater Freigabe.

Provider-neutrales Modell:

- persistenter Planpunkt `trip_items.kind = rental_car`
- Abhol-/Rückgabeort über vorhandene Ortsfelder
- Abhol-/Rückgabezeit über vorhandene Zeitfelder
- Fahrzeugklasse/Getriebe/Vermieter nur als bekannte Fakten
- Preis/Booking nur als Nutzerfakt; Quelle `user`
- kein automatisches Covering einer Bewegungskante
- geschlossene Suchnaht, Factory/Nachweis `null`, Kill Switch `JETNITY_RENTAL_CAR_AKTIV`
- UX im bestehenden Bereich Mobilität, kein sechster Tab

Fachdoku: [docs/RENTAL_CARS.md](docs/RENTAL_CARS.md). Auftrag: [docs/CURSOR_RENTAL_CAR_FOUNDATION_TASK.md](docs/CURSOR_RENTAL_CAR_FOUNDATION_TASK.md).

Nicht in diesem Block: echter Provider, Fake-Angebote, Führerschein-/Zahlungsdaten, Production-Aktivierung.

### Foundation C – Travel Readiness & Dokumente

**Draft-PR #32**, Branch `feat/travel-readiness-foundation`, Head `87bb85bd`. Nicht mergen. Keine Production-Migration.

Automatic Travel Requirements & Readiness:

- eigene Tabelle `trip_readiness_items`, kein neuer `trip_items.kind`
- trip-spezifischer Reisendenkontext `trip_travellers`
- Official Requirement Truth bleibt ohne Provider `unknown`
- Nutzer-Häkchen sind User Evidence, keine Visa-Bestätigung
- Context-Fingerprint und Freshness/Recheck
- progressive Missing Facts, keine Dokumentnummern
- Guest und Account dieselbe Form
- UX in der mobilen Übersicht und auf Desktop nach dem Reisekopf, fünf Hauptbereiche unverändert
- kein Dokumententresor, keine OCR, kein Storage-Bucket

Nachweis: Tests **1230/1230**, Workspace-Audit **662/0**, Activities **184/0**, Typecheck/Lint/Hygiene/Build/CI/Preview grün.

Fachdoku: [docs/TRAVEL_READINESS.md](docs/TRAVEL_READINESS.md). Auftrag: [docs/CURSOR_TRAVEL_READINESS_FOUNDATION_TASK.md](docs/CURSOR_TRAVEL_READINESS_FOUNDATION_TASK.md).

### Foundation D – Gesamt-Abdeckung

Die zentrale Reiseübersicht soll danach provider-neutral erkennen können, welche wichtigen Reisebestandteile abgedeckt, offen oder noch nicht bestimmbar sind – über Flug und Hotel hinaus auch Mobilität, Mietwagen und Reisevorbereitung, soweit belastbare Daten vorhanden sind.

### Kreuzfahrten

Bewusst später. Das Reisegraph-Modell soll mehrtägige Reisebausteine zulassen, aber keine große Kabinen-/Tarif-/Deck-/Routenfoundation ohne echten Produktbedarf und Providerzugang.

Konkrete UX-/Design-/Performance-/Accessibility-Verbesserungen bleiben erlaubt, verdrängen diesen funktionalen Unterbau aber nicht ohne Grund.

## Danach

### Phase 3.5 – erster echter Activity-Provider

- genau einen passenden Provider anbinden
- kommerzielle Fakten serverseitig nachweisen
- echter Affiliate-/Redirect-Weg
- reale Preview-Verifikation
- Production zunächst aus
- wenn Zugang fehlt: extern blockiert, keine Fake-Integration

### Phase 3.6 – echte Mobilitäts-/Transferprovider

- auf Foundation A aufsetzen
- echte Fahrplan-/Verfügbarkeits-/Providerdaten anbinden
- Provider-/Routingdaten niemals erfinden
- keine unnötige Transportplattform

### Phase 4 – Launch-Reife

Schwerpunkte:

- zentrale Free-/Pro-Entitlements vor erster echten Pro-Funktion
- Monetarisierung/Affiliate-Flüsse
- globale/gespeicherte Rate-Limits vor Production-Aktivierung kommerzieller Suchen
- Security-/RLS-/Auth-Abnahme
- Performance-Pass
- reale Hardware-/Browser-Abnahme
- observability und kontrollierte Production-Rollouts
- Travel Readiness nur mit belastbaren aktuellen Quellen

## Offene externe Abhängigkeiten

Diese Punkte bleiben sichtbar, bis sie nachweislich erledigt sind:

- Booking.com Demand API / Managed Affiliate Partner Zugang
- HBX / Hotelbeds als Hotel-Backup
- Duffel Sandbox-/Testtoken für echte Preview-Verifikation
- Duffel Production-Zugang separat und später
- erster echter Activity-Provider und dessen Zugang
- echte Bahn-/Bus-/Fähre-/Transfer-/Mietwagenprovider nach den provider-unabhängigen Foundations

## Bekannte technische Punkte

- Hotel-/Activity-/Flight-Rate-Limits sind aktuell teilweise In-Memory je Serverless-Instanz; vor Production-Aktivierung globalen/gespeicherten Schutz ergänzen
- `trips.origin_place_id` und `trip_stages.place_id` benötigen bei späterem Performance-Pass mögliche Covering-Indizes
- historische Production-Cron-Referenz auf `public.sync_creator_profile_core()` erzeugt Logfehler; Entfernung nur als separater ausdrücklich freigegebener Production-Cleanup
- Production-Modellweg bleibt separat freigabepflichtig
- Production-Flug-, Hotel- und Aktivitätensuche bleiben jeweils separat freigabepflichtig

## Verbindliche Qualitätsregel

Eine Phase ist nicht fertig, nur weil der Code kompiliert.

Je nach Änderung gehören dazu:

- professionelle Architektur
- Security / Trust Boundaries
- Tests
- Typecheck / Lint / Hygiene
- Production-Build
- Preview / CI
- Mobile-UX
- Accessibility
- Performance
- Loading / Empty / Error / Timeout / Rate-Limit States
- echte/verifizierte Reisedaten statt Fake-Daten
- aktualisierte Dokumentation

Details: `docs/PRODUCT_QUALITY_STANDARD.md` und `docs/CONTINUITY_STANDARD.md`.