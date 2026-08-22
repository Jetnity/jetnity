# Jetnity – PR #34 Human-/Architecture-/Security-/Truth Review Round 3

Stand: 22. August 2026  
Status: **verbindlicher Review-Nachtrag – PR #34 bleibt Draft / Merge nicht freigegeben**

Branch: `feat/route-transit-intelligence`  
PR: #34 – Foundation D – Route & Transit Intelligence

## 1. Review-Ergebnis

Round 2 hat den normalen Jetnity-Schreibweg korrekt gehärtet: `reiseAusNutzlastAnlegen()` verwirft Browser-/Local-Storage-Werte für `countryCode`, `city` und `country`, löst alle IATA-Codes in einem Batch gegen `public.airports` auf und übergibt nur die kanonisierte Route an RPC und Recovery.

Der aktuelle Stand lässt jedoch weiterhin eine zweite Trust Boundary offen:

- `public.reise_anlegen(jsonb)` ist für `authenticated` direkt ausführbar;
- die RPC akzeptiert `route_itinerary` im JSON;
- `public.flug_route_itinerary_metadata(text, jsonb)` prüft die Route strukturell, übernimmt aber vorhandene `countryCode`-/`city`-/`country`-Werte aus dem übergebenen JSON;
- damit kann ein authentifizierter direkter RPC-Aufrufer die TypeScript-Kanonisierung umgehen;
- die so persistierte Metadata wird später von `routeFactsAusGraph()` als `flight_itinerary`-Truth verwendet und kann Readiness-/Transit-Logik beeinflussen.

Das ist **kein akzeptiertes Restrisiko**. Eine fachliche Wahrheit mit regulatorischer Folgewirkung darf nicht davon abhängen, dass jeder Aufrufer freiwillig den vorgesehenen TypeScript-Pfad benutzt.

## 2. BLOCKER – letzte Trust Boundary muss in der Datenbank fail-closed sein

### Verbindliches Ziel

Ein direkter Aufruf von `public.reise_anlegen(jsonb)` darf niemals Browser-/Client-Country-Facts als Route Truth persistieren.

Für jeden Route-Punkt gilt:

1. `airportCode` darf als strukturierter Lookup-Key verwendet werden;
2. `countryCode`, `city` und `country` aus dem eingehenden JSON werden verworfen;
3. diese Werte werden innerhalb der Datenbank aus `public.airports` neu aufgebaut;
4. gibt es keine eindeutige Airport-Referenz, bleiben `countryCode`, `city` und `country` `null`;
5. kein Guessing aus Namen, keine Client-Fallbacks;
6. Datum/Uhrzeit dürfen erhalten bleiben, sofern strukturell valide;
7. die bestehende TypeScript-Kanonisierung bleibt als frühere Defense-in-Depth-Schicht bestehen.

## 3. Bevorzugte Architektur

Die bestehende Development-Migration / RPC-Lösung sauber weiterentwickeln, nicht ein neues Shadow-System bauen.

Bevorzugt:

- `flug_route_itinerary_metadata(...)` bzw. eine eng dazugehörige SQL-Hilfsfunktion wird zur kanonischen DB-Trust-Boundary;
- sie liest `public.airports` anhand des IATA-Codes und baut den Punkt serverseitig neu;
- die Funktion darf dann nicht fälschlich `IMMUTABLE` bleiben, wenn sie Tabellen liest; passende Volatilität (`STABLE`/`VOLATILE`) fachlich korrekt wählen;
- `SECURITY INVOKER` und bestehende Ownership/RLS-Prinzipien beibehalten, sofern der Lookup damit zuverlässig funktioniert;
- keine Service-Role nur für diese Lösung einführen;
- keine neue Tabelle/Spalte nötig;
- bestehende `reise_anlegen`-Idempotenz und Transaktionssemantik erhalten.

Falls ein SQL-Airport-Lookup mit den aktuellen Grants nicht sauber möglich ist, darf eine andere Lösung gewählt werden, aber sie muss beweisen, dass **kein `authenticated`-Aufrufer den kanonischen Country-Truth-Pfad umgehen kann**.

Ein bloßer Hinweis „direkten RPC nicht verwenden“ reicht nicht.

## 4. Pflicht-Tests

Mindestens automatisiert / gegen Development nachweisen:

1. normaler Guest→Account-Pfad mit `ZRH → DOH → BKK` speichert CH/QA/TH aus `public.airports`;
2. direktes `reise_anlegen` mit manipuliertem `ZRH.countryCode = 'US'` speichert **nicht** US;
3. direktes RPC mit manipuliertem `DOH.countryCode` kann Transitland nicht verfälschen;
4. manipulierte `city`/`country`-Texte werden ebenfalls nicht übernommen;
5. unbekannter, strukturell gültiger IATA-Code → `countryCode/city/country = null`, kein Client-Fallback;
6. Route ohne Country-Referenz bleibt fail-closed und erzeugt keine erfundene Readiness-Truth;
7. Direct/1-Transit/Multi-Transit bleiben korrekt;
8. Guest→Account Retry bleibt idempotent;
9. bestehende 1295+ Tests und Flight-/Trip-/Readiness-/Mobility-Regressionen bleiben grün.

Danach erneut dokumentieren:

- `npm test`
- Typecheck
- Lint
- Hygiene
- Production Build
- Auth checks
- Development-Migration/SQL-Test
- `db:rechte`
- `db:rls`
- `db:sicherheit`
- Trip Workspace Audit WebKit + Chromium
- GitHub CI
- Vercel Preview

## 5. Development / Production

- Änderung nur auf Development anwenden;
- Production weiterhin **nicht** migrieren;
- keine Production-Freigabe aus diesem Review ableiten;
- bestehende Production endet weiterhin vor der Foundation-D-RPC-Migration.

## 6. Dokumentation

Nach Umsetzung aktualisieren:

- `docs/ACTIVE_WORK_STATUS.md`
- `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`
- `ARCHITECTURE.md`
- `DECISIONS.md` mit ADR-Nachzug/neuerm ADR, falls nötig
- `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- exakten finalen Head, Dev-Migration, Tests, CI und Preview dokumentieren.

## 7. Merge-Gate

PR #34 bleibt **Draft**.

- nicht Mark Ready;
- nicht mergen;
- keine Production-Migration;
- keine Provider-Aktivierung.

Nach diesem Fix führt ChatGPT den finalen Human-/Architecture-/UX-/Security-/Truth-Review erneut durch. Danach entscheidet ausschließlich der Product Owner über weitere Änderungen oder Merge-Freigabe.

## Merksatz

> **Die letzte Grenze der Route Truth liegt dort, wo die Daten dauerhaft gespeichert werden. Kein authentifizierter Aufrufer darf diese Wahrheit durch einen direkten RPC-Call umgehen können.**
