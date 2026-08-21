# Jetnity – Roadmap

Stand: 21. August 2026

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
| Phase 3.4 | erster echter Hotel-Suchadapter | **als Nächstes; wartet primär auf Booking.com-Zugang** |
| Querschnitt | Trip Workspace Mobile UX Iteration 1 | **in Arbeit, Draft-PR #27; nicht gemergt** |
| Phase 3.5 | erster echter Activity-Suchadapter | geplant nach 3.4 |
| Phase 3.6 | Transfers Foundation / erster Integrationsweg | geplant |
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

Ziel: Die bereits fertige Hotelarchitektur erstmals mit echten Hotelpreisen, Verfügbarkeiten und Providerfakten verbinden.

**Primärer externer Blocker:** gültiger Booking.com Demand API / Managed Affiliate Partner Zugang.

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

### Querschnitt – Trip Workspace Mobile UX Iteration 1

Gezielte Mobile-IA für `/reisen/[tripId]`, parallel zu Phase 3.4, ohne Provider- oder Production-Änderung.

- Branch `ux-trip-workspace-mobile-iteration-1`, Draft-PR #27
- kompakter Reisekopf, klebende Bereichsnavigation, Übersicht als Default
- Plan, Flüge, Unterkunft, Aktivitäten als getrennte Mobile-Bereiche
- Desktop-Arbeitsansicht bleibt
- Typecheck, Lint, Hygiene, Production-Build, GitHub CI und Vercel Preview grün
- Trip-Workspace-Audit: 178 Kombinationen, 0 Fehler
- Activities-Regression-Audit: 184 Kombinationen, 0 Fehler
- **nicht mergen**, bis der Nutzer den Preview auf einem echten iPhone beurteilt hat

### Während Booking.com noch offen ist

Keine spekulative Providerintegration bauen.

Sinnvolle Arbeiten, die parallel erlaubt sind:

- konkrete UX-/Design-/Navigationsprobleme aus der echten Website korrigieren
- Mobile-UX, Accessibility, Performance, Loading/Error States verbessern
- kleine produktnahe Qualitätslücken schließen
- Dokumentation und Tests aktuell halten

Solche Änderungen müssen klar abgegrenzt bleiben und dürfen Phase 3.4 nicht vortäuschen.

## Danach

### Phase 3.5 – erster echter Activity-Provider

- genau einen passenden Provider anbinden
- kommerzielle Fakten serverseitig nachweisen
- echter Affiliate-/Redirect-Weg
- reale Preview-Verifikation
- Production zunächst aus

### Phase 3.6 – Transfers

- nur bauen, wenn der konkrete Reisegraph davon profitiert
- keine unnötige Transportplattform
- Provider-/Routingdaten niemals erfinden

### Phase 4 – Launch-Reife

Schwerpunkte:

- zentrale Free-/Pro-Entitlements vor erster echten Pro-Funktion
- Monetarisierung/Affiliate-Flüsse
- globale/gespeicherte Rate-Limits vor Production-Aktivierung kommerzieller Suchen
- Security-/RLS-/Auth-Abnahme
- Performance-Pass
- reale Hardware-/Browser-Abnahme
- observability und kontrollierte Production-Rollouts
- Travel Readiness später nur mit belastbaren aktuellen Quellen

## Offene externe Abhängigkeiten

Diese Punkte bleiben sichtbar, bis sie nachweislich erledigt sind:

- Booking.com Demand API / Managed Affiliate Partner Zugang
- HBX / Hotelbeds als Hotel-Backup
- Duffel Sandbox-/Testtoken für echte Preview-Verifikation
- Duffel Production-Zugang separat und später
- erster echter Activity-Provider und dessen Zugang

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
