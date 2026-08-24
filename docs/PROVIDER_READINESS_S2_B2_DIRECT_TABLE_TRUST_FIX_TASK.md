# Jetnity – Provider Readiness S2-B2 / Direct-Table Trust Boundary Fix

Stand: 24. August 2026

Status: **IMPLEMENTIERT AUF SUPABASE DEVELOPMENT – lokale Gates und Vercel grün; GitHub Actions auf dem neuen Head nicht gestartet; STOPP für Technical-Lead-Re-Review; Production unverändert**

Cursor-Agent: `Provider S2 flugnachweis`
Draft-PR: `#51`
Re-Review: `docs/PROVIDER_READINESS_S2_B1_REREVIEW.md`
Product-Owner-Freigabe: `docs/PROVIDER_READINESS_S2_B2_PRODUCT_OWNER_APPROVAL.md`

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

## Product-Owner-Freigabe

Am 24. August 2026 hat der Product Owner unmittelbar auf die angeforderte S2-B2-Freigabe mit

> „Freigabe“

geantwortet.

Damit ist ausschließlich folgender Scope freigegeben:

- minimaler S2-B2 Direct-Table-Trust-Fix;
- **eine neue additive Migration**;
- Anwendung **nur auf Supabase Development**;
- notwendige Regressionen und vollständige Exact-Head-Gates.

Production bleibt unverändert.

Weiterhin nicht freigegeben:

- Production-Migration;
- Mark Ready;
- Merge;
- S3;
- Provideraktivierung, Secrets, Verträge oder kostenpflichtige Calls;
- Service-Role-/Auth-/MFA-/AAL-/Capability-Ausweitungen außerhalb des minimal erforderlichen S2-B2-Vertrags.

## Pflichtregressionen

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

Nach Implementierung Status/Handoff/Self-Review aktualisieren und **STOPP für erneuten unabhängigen Technical-Lead-Re-Review**.

Kein Mark Ready. Kein Merge. Kein S3. Keine Production-Migration.
