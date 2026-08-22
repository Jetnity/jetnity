# Jetnity – PR #34 Human-/Architecture-Review Fixes

Stand: 22. August 2026  
Status: **verbindlicher Review-Nachtrag – PR #34 bleibt Draft / Merge nicht freigegeben**

Branch: `feat/route-transit-intelligence`  
PR: #34 – Foundation D – Route & Transit Intelligence

## 1. Review-Ergebnis

Foundation D ist technisch weit fortgeschritten und die dokumentierten Tests/CI/Preview-Nachweise auf dem verifizierten Code-Stand sind grün. Der Human-/Architecture-Review akzeptiert den aktuellen Stand jedoch **noch nicht als merge-freigabefähig**, weil ein fachlicher DoD-Punkt aus dem ursprünglichen Task verletzt werden kann.

Verbindlicher Task, Abschnitt `Guest / Account`:

> Route-/Transit-Information darf bei Guest → Account nicht verloren gehen oder doppelt entstehen.

Der aktuelle Nachlauf `flugRoutenInReiseSchreiben()` kann Select-/Update-Fehler still schlucken. Dadurch kann eine Guest-Reise beim Account-Anlegen erfolgreich erscheinen, obwohl ihre vorhandene `routeItinerary` nicht persistiert wurde.

Das widerspricht dem Foundation-D-Ziel **„Eine Route, eine strukturierte Wahrheit“** und der geforderten Guest-/Account-Parität.

## 2. BLOCKER – Route-Persistenz bei Guest → Account muss zuverlässig sein

### Aktueller problematischer Pfad

- `reise_anlegen()` legt Reise / Items an, persistiert `route_itinerary` aber nicht selbst.
- Danach ruft `reiseAusNutzlastAnlegen()` `flugRoutenInReiseSchreiben()` auf.
- `flugRoutenInReiseSchreiben()` gibt bei Select-Fehler / fehlenden Items still zurück.
- `trip_days`-Select-Fehler wird nicht als Fehler behandelt.
- einzelne `trip_items.update(...)`-Fehler werden nicht ausgewertet.
- Die Server-Action kann danach `{ ok: true }` liefern, obwohl Route Truth verloren ging.

### Verbindliches Ziel

Nach erfolgreicher Guest → Account-Anlage gilt:

1. Jede eindeutig zugeordnete valide `routeItinerary` ist persistiert, **oder**
2. die Gesamtoperation darf nicht so tun, als sei die vollständige Reise erfolgreich übernommen worden.

Ein stiller Route-Verlust ist verboten.

### Bevorzugte Architektur

**Bevorzugt: Route-Itinerary atomar im bestehenden `reise_anlegen`-Transaktionspfad persistieren.**

- Bestehende Reise-/Item-Erstellung weiterverwenden.
- `route_itinerary` / validierte Metadata als Teil derselben fachlichen Transaktion schreiben.
- Keine zweite Route-Wahrheit.
- Keine freie Client-Metadata ungeprüft übernehmen; nur das validierte kanonische Route-Itinerary-Format.
- RLS / SECURITY-DEFINER-Grenzen / Owner-Checks unverändert korrekt halten.
- Idempotenz und bestehende Item-Zuordnung nicht verschlechtern.

Wenn dafür die bestehende SQL-Funktion/RPC angepasst werden muss:

- saubere neue Migration im Repository;
- **nur Development anwenden**;
- Production nicht migrieren;
- keine Production-Freigabe aus diesem Review ableiten.

### Alternative nur bei sauberer Begründung

Falls atomare RPC-Persistenz aus realer Architektur-Sicht unverhältnismäßig oder falsch ist, darf eine andere Lösung gewählt werden, aber nur wenn sie beweist:

- kein stilles `ok` bei verlorenem Route-State;
- wiederholbarer/idempotenter Retry oder eindeutige Recovery;
- kein doppeltes Trip-/Item-Anlegen nach Fehlermeldung;
- Nutzer-/Serverzustand bleibt konsistent;
- Fehler wird observierbar und testbar;
- kein neues Shadow-System.

Ein bloßes `throw` nach bereits dauerhaft angelegter Reise ohne Recovery-/Idempotenzkonzept reicht **nicht**.

## 3. Pflicht-Tests für den Fix

Mindestens automatisiert nachweisen:

1. Guest → Account mit Direct Flight behält `routeItinerary`.
2. Guest → Account mit 1 Transit behält vollständige Route.
3. Guest → Account mit Multi-Transit behält vollständige Route.
4. Ein simulierter Persistenz-/DB-Fehler darf nicht zu falschem vollständigem Erfolg führen.
5. Retry erzeugt keine doppelte Reise / keine doppelten Flug-Items.
6. Route-Fingerprint bleibt nach erfolgreicher Übernahme stabil.
7. Readiness wird nicht unnötig stale, wenn fachlich dieselbe Route übernommen wurde.
8. Ungültige / übergroße / nicht valide Route-Metadata bleibt fail-closed.
9. Bestehende Flight-/Trip-/Readiness-/Mobility-Regressionen bleiben grün.

Danach erneut ausführen und dokumentieren:

- `npm test`
- Typecheck
- Lint
- Hygiene
- Production Build
- Auth checks
- relevante DB/RLS/Security-Checks, falls RPC/Migration berührt
- Trip Workspace Audit WebKit + Chromium
- GitHub CI
- Vercel Preview

## 4. Andere Senior-Expert-Funde

### Gesamt-Destination / Multi-City

Kein PR-#34-Blocker. Die vollständigen `destinationCountryCodes` sind für Readiness vorhanden. Die kanonische „Gesamt-Destination“-Regel wird vor First-Class-Multi-City/Open-Jaw als eigener Graph-/UX-Schritt entschieden.

### Route-Fingerprint ohne Uhrzeiten

Kein PR-#34-Blocker. Für Visa-/Transit-Länderregeln ist der pfadbezogene Fingerprint korrekt. Connection-Risk/Minimum-Connection-Time/operative Zeitrisiken bekommen später einen eigenen zeitabhängigen Kontext statt die Readiness-Route-Wahrheit zu vermischen.

## 5. Dokumentation / Kontinuität

Nach Umsetzung:

- `docs/ACTIVE_WORK_STATUS.md` aktualisieren;
- `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md` aktualisieren;
- ADR/Architektur nachziehen, wenn der Persistenzpfad geändert wurde;
- exakten neuen Head, Migration/Development-Stand, Tests, CI und Preview dokumentieren;
- verbleibende Risiken ehrlich stehen lassen.

## 6. Merge-Gate

PR #34 bleibt **Draft**.

- nicht Mark Ready;
- nicht mergen;
- keine Production-Migration;
- keine Provider-Aktivierung.

Nach dem Fix führt ChatGPT erneut den Human-/Architecture-/UX-/Security-Review durch. Danach erhält der Product Owner erneut die Möglichkeit für Änderungen. Erst eine ausdrückliche aktuelle Product-Owner-Freigabe erlaubt den Merge.

## Merksatz

> **Eine Route darf beim Kontoübergang nicht still verschwinden. Erfolgreiche Übernahme bedeutet auch erfolgreiche Übernahme der Route Truth.**
