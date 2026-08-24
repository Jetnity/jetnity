# Jetnity – Provider Readiness S2-B2 / Direct-Table Trust Boundary Fix

Stand: 24. August 2026

Status: **WAITING PRODUCT-OWNER APPROVAL – noch keine Runtime-/DB-Implementierung starten**

Cursor-Agent: `Provider S2 flugnachweis`
Draft-PR: `#51`
Re-Review: `docs/PROVIDER_READINESS_S2_B1_REREVIEW.md`

## Blocker

S2-B1 schützt `public.reise_anlegen(jsonb)`, aber `public.trip_items` ist für `authenticated` weiterhin direkt `INSERT`-/`UPDATE`-fähig. Die RLS-Policies prüfen Eigentum, nicht die Provenienz der fünf kommerziellen Flugfelder.

Live auf Supabase Development reproduziert: Ein authentifizierter Benutzer konnte einen eigenen `kind='flight'`-Planpunkt innerhalb einer Testtransaktion direkt auf Browserwerte für `price_amount`, `price_currency`, `provider`, `external_ref` und `booking_url` aktualisieren. Der Test wurde anschließend vollständig zurückgerollt.

Damit bleibt der End-to-End-Vertrag „Browserdaten dürfen keine kommerzielle Flugwahrheit persistieren“ offen.

## Zielvertrag

Für direkte `authenticated` Tabellenmutationen auf `public.trip_items` gilt bei `kind='flight'`:

- `price_amount` darf nicht aus untrusted Client-Write als kommerzielle Wahrheit persistieren;
- `price_currency` darf nicht aus untrusted Client-Write persistieren;
- `provider` darf nicht aus untrusted Client-Write persistieren;
- `external_ref` darf nicht aus untrusted Client-Write persistieren;
- `booking_url` bleibt ohne vertrauenswürdigen serverseitigen Nachweis `null`;
- Route-Itinerary bleibt Foundation-D-Truth;
- manueller User-Buchungsstatus bleibt erlaubt;
- Hotel/Activity/Mobility/Rental bleiben fachlich unverändert.

## Harte Architekturregel

Nicht nur den reproduzierten UPDATE-Fall patchen. Die Trust-Grenze muss für direkte `authenticated` INSERT **und** UPDATE gelten.

Bevorzugt ist eine DB-seitige Lösung, die den heutigen Browservertrag fail-closed macht und einen späteren ausdrücklich getrennten trusted server write contract ermöglicht.

Der Agent muss vor Implementierung prüfen, ob die minimal saubere Lösung mit einem neuen Guard/Trigger möglich ist oder ob vorhandene Tabellen-Grants/RPC-Abhängigkeiten eine Rechte-Neuarchitektur erfordern.

Nicht zulässig:

- bestehende angewandte Migrationen editieren;
- Service Role als Abkürzung;
- Client-setzbare oder leicht spoofbare „trusted“-Flags;
- Route-/Country-/Distance-Heuristiken;
- globale Nullung fremder Domains;
- stilles Entziehen von Tabellenrechten, wenn dadurch bestehende `SECURITY INVOKER`-App-Pfade brechen;
- Provideraktivierung, Secrets, Verträge oder bezahlte Calls.

Wenn die saubere Lösung breiter als ein minimaler additiver DB-Guard wird: **STOPP und Architektur-Befund dokumentieren**, nicht still erweitern.

## Product-Owner-Gate

Der frühere Product-Owner-Satz

> „Freigegeben für S2-B1: neue Migration nur auf Supabase Development. Production bleibt unverändert.“

war ausdrücklich auf S2-B1 begrenzt. Er autorisiert **keine weitere S2-B2-Migration**.

Daher gilt aktuell:

- Code-/Architekturprüfung und Dokumentation: erlaubt;
- **neue DB-Migration implementieren/anwenden: erst nach neuer ausdrücklicher Product-Owner-Freigabe**;
- Production bleibt unverändert;
- kein Mark Ready;
- kein Merge;
- kein S3.

## Pflichtregressionen nach Freigabe

1. Direkter `authenticated` UPDATE eines eigenen Flight-Punkts mit manipulierten fünf Handelsfeldern kann diese Werte nicht persistieren.
2. Direkter `authenticated` INSERT eines Flight-Punkts mit diesen Feldern kann sie nicht persistieren.
3. Reiner User-Intake für Flight bleibt möglich.
4. Manueller Buchungsstatus `booking_status` / `booking_source='user'` bleibt funktionsfähig.
5. `reise_anlegen` B1 bleibt fail-closed und alle bisherigen B1-Regressions bleiben grün.
6. Route-Itinerary/Foundation D bleibt unverändert geschützt.
7. Guest→Account bleibt ohne Hochstufung.
8. Hotel/Activity/Mobility/Rental-Verträge bleiben unverändert.
9. DB Rights/RLS/Security/Parallelity grün.
10. `npm test`, Typecheck, Lint, Hygiene, `check:api-schutz`, Production Build und relevanter UI-Audit grün.
11. GitHub Actions SUCCESS + Vercel READY auf demselben neuen Exact Runtime Head.
12. Development-Anwendung explizit belegen; Production explizit unverändert belegen.

## Abschluss

Nach einem später freigegebenen Fix: Status/Handoff/Self-Review aktualisieren und STOPP für erneuten unabhängigen Technical-Lead-Re-Review.

Bis dahin keine weitere Runtime-Arbeit auf S2-B2.
