# Jetnity – PR #34 Human-/Architecture-/Security-/Truth Review Round 4

Stand: 22. August 2026  
Status: **verbindlicher finaler Truth-Boundary-Nachtrag – PR #34 bleibt Draft / Merge nicht freigegeben**

Branch: `feat/route-transit-intelligence`  
PR: #34 – Foundation D – Route & Transit Intelligence

## 1. Review-Ergebnis

Round 3 schützt den direkten `reise_anlegen(jsonb)`-RPC korrekt: Country-/City-Truth wird in Development aus IATA + `public.airports` neu aufgebaut.

Beim finalen Datenbank-Review ist jedoch ein letzter persistenter Bypass bestätigt worden:

- Rolle `authenticated` besitzt auf `public.trip_items` weiterhin `INSERT` und `UPDATE`;
- RLS schützt die Eigentümergrenze (`user_id = auth.uid()`), aber validiert den Inhalt von `metadata` nicht;
- damit kann ein authentifizierter Eigentümer eine Flight-Zeile direkt anlegen oder `trip_items.metadata` direkt aktualisieren;
- ein direkt geschriebenes `metadata.routeItinerary` umgeht damit sowohl TypeScript-Kanonisierung als auch den geschützten `reise_anlegen`-RPC;
- `routeFactsAusGraph()` liest persistierte `routeItinerary` später als `flight_itinerary`-Truth und kann damit Readiness-/Transit-Logik beeinflussen.

Das ist für Jetnitys Prinzip **„Eine Route, eine strukturierte Wahrheit“** kein akzeptiertes Restrisiko. Die letzte Trust Boundary muss jeden dauerhaften Schreibweg schützen, nicht nur den vorgesehenen RPC.

## 2. BLOCKER – jede persistierte Flight-Route muss DB-seitig kanonisiert werden

### Verbindliches Ziel

Kein `authenticated`-Schreibweg darf ein unkanonisches `metadata.routeItinerary` dauerhaft in `public.trip_items` hinterlassen.

Das gilt ausdrücklich für:

1. `reise_anlegen(jsonb)`;
2. direkte `trip_items`-INSERTs;
3. direkte `trip_items.metadata`-UPDATEs;
4. den bestehenden TypeScript-Recovery-/Nachzug;
5. spätere legitime Server-Schreibwege, solange sie dieselbe Tabelle nutzen.

### Bevorzugte Architektur

**Bevorzugt: ein enger BEFORE-Trigger auf `public.trip_items`, der nur Route-Metadata schützt.**

- `BEFORE INSERT OR UPDATE OF metadata, kind`;
- bei `kind = 'flight'` und vorhandenem `metadata.routeItinerary` wird dieses Feld durch die bestehende kanonische DB-Funktion aus IATA + `public.airports` neu aufgebaut;
- Browser-/Clientwerte für `countryCode`, `city`, `country` werden verworfen;
- ungültige Route → `routeItinerary` fail-closed entfernen / nicht als Truth persistieren;
- unbekannte Airport-Referenz → Country/City/Country `null`, kein Client-Fallback;
- andere Metadata-Schlüssel müssen erhalten bleiben;
- Nicht-Flight-Metadata darf nicht unnötig verändert werden;
- eine spätere Änderung von `kind` zu `flight` muss ebenfalls geschützt sein;
- RLS, `SECURITY INVOKER`, bestehende Grants und legitime Buchungsstatus-/Mobility-Schreibwege nicht unnötig verändern.

Eine alternative Lösung ist zulässig, wenn sie nachweislich **alle** direkten INSERT-/UPDATE-Pfade schließt, ohne ein Shadow-System zu erzeugen.

## 3. Pflicht-Tests

Mindestens auf Development nachweisen:

1. direkter `trip_items`-INSERT eines Flight mit `ZRH.countryCode = 'US'` speichert CH, nicht US;
2. direkter Eigentümer-UPDATE von `metadata.routeItinerary` mit manipuliertem Transitland speichert die Airport-Truth;
3. manipulierte `city`/`country`-Texte werden nicht persistiert;
4. unbekannter IATA-Code bleibt `null` statt Client-Fallback;
5. ungültige `routeItinerary` wird fail-closed nicht zur Route Truth;
6. andere vorhandene Metadata-Schlüssel bleiben bei der Kanonisierung erhalten;
7. Nicht-Flight-Items werden nicht unnötig verändert;
8. normales `reise_anlegen` Direct/1-Transit/Multi-Transit bleibt korrekt;
9. Guest→Account Recovery/Retry bleibt idempotent;
10. Buchungsstatus-/Mobility-/Rental-Schreibwege bleiben grün;
11. `routeFactsAusGraph()` kann nach direktem Tabellen-Schreibversuch keine manipulierte Country-Truth lesen.

Danach erneut dokumentieren:

- `npm test`
- Typecheck
- Lint
- Hygiene
- Production Build
- Auth checks
- Development-Migration / direkte SQL-Manipulationstests
- `db:rechte`
- `db:rls`
- `db:sicherheit`
- Trip Workspace Audit WebKit + Chromium
- GitHub CI
- Vercel Preview

## 4. Development / Production

- neue Guard-Migration nur auf Development anwenden;
- Production weiterhin **nicht** migrieren;
- keine neue Tabelle oder Spalte erforderlich;
- keine Provider-/Secret-/Kostenänderung;
- Production-Freigabe bleibt ein separates Product-Owner-Gate.

## 5. Dokumentation

Nach Umsetzung aktualisieren:

- `docs/ACTIVE_WORK_STATUS.md`
- `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`
- `ARCHITECTURE.md`
- `DECISIONS.md` (ADR-Nachzug)
- `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- exakten Code-/Docs-Head, Migration, Tests, CI und Preview dokumentieren.

## 6. Merge-Gate

PR #34 bleibt **Draft**.

- nicht Mark Ready;
- nicht mergen;
- keine Production-Migration;
- keine Provider-Aktivierung.

Nach diesem Guard führt ChatGPT den finalen Re-Review durch. Danach erhält der Product Owner das Ergebnis und entscheidet allein über Änderungen oder Merge-Freigabe.

## Merksatz

> **RLS schützt den Eigentümer. Der Route-Guard schützt die Wahrheit. Beides ist nötig.**
