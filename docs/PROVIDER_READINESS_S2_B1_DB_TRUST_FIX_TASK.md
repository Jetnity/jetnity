# Jetnity – Provider Readiness S2-B1 / DB Trust Boundary Fix

Stand: 24. August 2026
Status: **VORBEREITET – wartet auf Product-Owner-Freigabe für DB-Contract-/Development-Migrations-Scope**

Cursor-Agent: `Provider S2 flugnachweis`
Draft-PR: `#51`
Review: `docs/PROVIDER_READINESS_S2_CHATGPT_REVIEW.md`

## Auftrag nach Freigabe

Schließe ausschließlich **S2-B1 – Direct-RPC-Bypass**.

Die TypeScript-App-Grenze ist bereits korrekt fail-closed. Der offene Pfad ist `public.reise_anlegen(jsonb)`: ein authentifizierter Client kann die RPC direkt aufrufen und derzeit kommerzielle Flugfelder aus Browser-JSON persistieren.

## Verbindlicher Zielvertrag

Für `kind='flight'` gilt auch an der Datenbankgrenze:

- unbewiesenes `price_amount` aus dem öffentlichen/authenticated Reise-Anlage-RPC wird nicht als kommerzielle Wahrheit persistiert;
- unbewiesenes `price_currency` wird nicht als kommerzielle Wahrheit persistiert;
- unbewiesenes `provider` wird nicht als kommerzielle Wahrheit persistiert;
- unbewiesenes `external_ref` wird nicht als kommerzielle Wahrheit persistiert;
- `booking_url` bleibt ohne vertrauenswürdigen Nachweis `null`;
- Route-Itinerary bleibt Foundation-D-Truth und darf nicht durch diesen Fix geschwächt werden;
- keine fremde Domain pauschal verändern.

## Implementierungsregeln

1. **Keine bestehende angewandte Migration editieren.** Neue additive Migration verwenden.
2. Nur Development anwenden, sofern der Product Owner genau diesen Scope freigibt.
3. **Production nicht migrieren.** Production bleibt separates Product-Owner-Gate.
4. Keine Service Role, keine Auth-/MFA-/AAL-/Capability-Neudefinition.
5. Keine Provideraktivierung, keine Secrets, keine Verträge, keine kostenpflichtigen Calls.
6. Kein S3–S7.
7. Keine zweite Flight-/Route-Truth.
8. Bestehende Hotel-/Activity-/Mobility-/Rental-Verträge nicht unbeabsichtigt verändern.
9. Falls die saubere Lösung eine breitere DB-/RPC-Neuarchitektur erfordert: STOPP und Befund dokumentieren, nicht still erweitern.

## Bevorzugte minimale Lösung

Härtung von `public.reise_anlegen(jsonb)` über eine **neue** Migration so, dass die öffentlich/authenticated erreichbare Reise-Anlage bei Flight-Punkten die oben genannten unbewiesenen Handelsfelder DB-seitig verwirft/nullt.

Ein späterer vertrauenswürdiger Flight-Nachweis darf einen separaten expliziten Schreibvertrag erhalten. Nicht den heute browser-erreichbaren JSON-Vertrag als vertrauenswürdige Providerquelle behandeln.

## Pflichtregressionen

- direkter authentifizierter RPC mit manipuliertem Flight-Preis → nicht als Preis persistiert;
- direkter authentifizierter RPC mit manipuliertem Provider/ExternalRef/BookingURL → nicht persistiert;
- `booking_url` bleibt null;
- nichtkommerzielle Flight-User-Intake-Felder bleiben gemäß bestehendem Produktvertrag möglich;
- Route-Itinerary Foundation D bleibt korrekt;
- Guest→Account bleibt ohne Hochstufung;
- normaler Account-/Trip-Anlagepfad bleibt funktionsfähig;
- Hotel-/Activity-/Mobility-/Rental-Verträge bleiben unverändert;
- DB Rights/RLS/Security/Parallelity grün;
- vollständiges `npm test`, Typecheck, Lint, Hygiene, `check:api-schutz`, Production Build, relevanter UI-Audit grün;
- GitHub Actions SUCCESS und Vercel READY auf demselben neuen Runtime Exact Head.

## Handoff

Nach Implementierung:

- S2 Status/Handoff/Self-Review aktualisieren;
- exakte neue Development-Migration nennen;
- Development-Anwendung belegen;
- ausdrücklich dokumentieren: **Production unverändert**;
- dann STOPP für unabhängigen Technical-Lead-Re-Review.

## Harte Governance

Bis zur ausdrücklichen Product-Owner-Freigabe dieses DB-Scopes: **nicht implementieren**.

Auch danach: kein Mark Ready, kein Merge, kein S3 und keine Production-Migration ohne separate ausdrückliche aktuelle Product-Owner-Freigabe.