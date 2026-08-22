# Cursor-Review-Fix – PR #31: Mietwagen Logic / Truth

Stand: 22. August 2026  
Branch: `feat/rental-car-foundation`  
PR: #31 – Foundation B – Mietwagen  
Basis vor Review-Fix: `e58d42f09d95f326c7f686ebeee52a6c5d6d3b9a`  
Status: **umgesetzt und lokal nachgewiesen**; Ranking-Fix und Real-Device-iPhone **bestanden**; Production-Schema später separat übernommen; Suche aus

## Ziel

Der unabhängige Review von Foundation B hat vier fachliche Wahrheitsrisiken gefunden. Behebe sie **gezielt auf demselben Branch/PR**, ohne neue Provider-, Production- oder Side-Quest-Arbeit.

Verbindlich lesen: `docs/LOGIC_STANDARD.md`, `docs/RENTAL_CARS.md`, `docs/MOBILITY.md`, `JETNITY_HANDOFF.md`, `DECISIONS.md`, `docs/CURSOR_RENTAL_CAR_FOUNDATION_TASK.md` und den aktuellen Code/Diff.

**Nicht mergen. Keine Production-Migration. Keine Production-Aktivierung. Keine neuen Secrets/Kosten. PR bleibt Draft.**

---

## Befund 1 – keine automatisch erfundene Mietwagen-Suchabsicht

Aktuell startet `components/trips/MietwagenBereich.tsx` beim Öffnen automatisch eine Suche mit aus der Gesamtreise abgeleiteten Werten (`origin/erste bzw. letzte stage`, `startDate/endDate`). Das ist keine bestätigte Mietwagenabsicht des Nutzers.

Problem:

- Trip-Origin → letzte Etappe kann fachlich unsinnig sein (z. B. interkontinentale Reise).
- Gesamtreisezeitraum ist nicht automatisch Mietwagenzeitraum.
- Sobald ein echter Provider aktiviert würde, könnte bereits das Öffnen des Tabs eine kostenpflichtige/limitierte Suche mit geratenen Kriterien auslösen.
- Das widerspricht `unknown bleibt unknown` und dem Ziel, die Foundation provider-ready **ohne späteren Logik-Rewrite** zu bauen.

### Muss geändert werden

- Keine Provider-/Search-Anfrage allein durch Mount/Tab-Öffnen aus geratenem Reise-Kontext.
- Suche nur nach **expliziter Nutzeraktion** und mit explizit sichtbaren/änderbaren Suchkriterien.
- Keine Route oder Mietdauer als Tatsache aus Origin/Stages/Gesamtreisedaten ableiten.
- Wenn im aktuellen Foundation-Scope kein vollständiges Suchformular sinnvoll ist, darf der Suchbereich ehrlich `unavailable/vorbereitet` bleiben und die Route weiterhin separat getestet werden; aber kein automatischer Request mit geratenen Kriterien.
- Abort/Race- und Loading-State weiterhin korrekt.

Regressionstest/Audit: Öffnen von `Mobilität → Mietwagen` darf ohne Nutzeraktion keine Rental-Search auslösen.

---

## Befund 2 – manuelle Erfassung darf keine falschen Standardfakten vorbelegen

Aktuell werden im manuellen Mietwagenformular u. a. `pickupName`, `dropoffName`, `pickupOn`, `dropoffOn` aus Trip-Origin/erster Stage/Gesamtreise vorbelegt. Das kann bei mehrstufigen oder internationalen Reisen objektiv unpassend sein.

### Muss geändert werden

- Unbekannte Mietwagenfakten standardmäßig **leer/unbekannt** lassen.
- Reise-Kontext darf höchstens als klar erkennbare, unverbindliche Hilfe/Placeholder/Suggestion dienen, nicht als gespeicherter Fakt ohne bewusste Auswahl.
- Nutzer muss Abholung/Rückgabe explizit bestätigen/eingeben, bevor gespeichert wird.
- Keine automatische Place-ID an einen manuell frei eingegebenen Ortsnamen hängen.
- Datumswerte nur vorbelegen, wenn es dafür eine deterministische, fachlich dokumentierte Grundlage gibt; sonst leer.

Tests für Reise mit Origin und entfernten Etappen: Formular darf daraus nicht still eine interkontinentale Mietwagenroute erzeugen.

---

## Befund 3 – `one_way` nur bei beweisbar unterschiedlichen Orten

In `lib/rental-cars/zeitraum.ts` liefert `selberOrt()` aktuell `false`, sobald zwei vorhandene Namen textlich verschieden sind. Damit wird `rentalOneWay()` zu `one_way`, obwohl z. B. `Zürich Flughafen` und `Zurich Airport` dieselbe Station sein können.

Das verletzt die Jetnity-Wahrheitsregel: **verschiedene Labels ohne stabile Identität beweisen nicht verschiedene Orte**.

### Muss geändert werden

Konservative Semantik:

- beide stabilen Place-IDs vorhanden und gleich → `same_location`
- beide stabilen Place-IDs vorhanden und verschieden → `one_way`
- keine/teilweise IDs, aber normalisierte Namen eindeutig gleich → `same_location`
- Namen verschieden, während keine zwei belastbaren unterschiedlichen IDs vorliegen → `unknown`
- fehlende Angaben → `unknown`

Keine fuzzy/semantische Ortsauflösung in diesem Fix.

Regressionstests mindestens:

- gleiche IDs / verschiedene Labels → `same_location`
- verschiedene IDs → `one_way`
- `Zürich Flughafen` vs `Zurich Airport` ohne IDs → `unknown`
- exakt gleiche Namen ohne IDs → `same_location`
- nur eine ID vorhanden + verschiedene Namen → `unknown`

UI darf `One-way` nur bei `one_way`, niemals bei `unknown`, zeigen.

---

## Befund 4 – Mietkalendertage nicht als „Reisetage“ ausgeben + Preisranking währungssicher

### 4A – Zeitwahrheit

`rentalKalendertage()` zählt heute inklusive Abhol-/Rückgabetag Kalendertage des Mietzeitraums. `mietwagenDetails()` bezeichnet diese Zahl als `Reisetage`, ohne sie mit den tatsächlichen `reise.days` zu schneiden.

Das ist semantisch falsch.

Ändern:

- Entweder tatsächliche betroffene Reisetage deterministisch aus dem Reisegraphen berechnen, **oder**
- die Zahl ehrlich als Miet-/Kalenderzeitraum formulieren, z. B. `5 Kalendertage Mietzeitraum`, ohne behauptete Reiseabdeckung.
- Nie `deckt ... Reisetage ab`, solange keine echte Abdeckungslogik existiert.

### 4B – Preis-/Best-Value-Wahrheit

`lib/rental-cars/ranking.ts` darf numerische Gesamtpreise verschiedener Währungen niemals direkt vergleichen. Die Provider-Naht garantiert heute nicht im Typ, dass alle Optionen bereits in derselben Währung normalisiert sind.

Ändern:

- Preisranking nur für nachweislich vergleichbare Gesamtpreise in derselben Währung bzw. ausdrücklich dokumentierter normalisierter Request-Währung.
- Bei gemischten/fehlenden Währungen Preis-Signal konservativ weglassen; nicht umrechnen/raten.
- `Best Value` darf nur einer deterministisch bestimmbare(n) Option(en) mit vergleichbarer Grundlage zugewiesen werden – nicht allgemein jeder Option mit irgendeinem `preisFit`.
- Providername/Provision/Umsatz bleiben ohne Einfluss.

Regressionstests mindestens:

- CHF 200 vs CHF 300 → CHF 200 preislich besser
- EUR 190 vs CHF 200 ohne FX-Normalisierung → **kein** numerischer Cross-Currency-Sieger aufgrund 190 < 200
- fehlende/unklare Gesamtpreisflagge → kein Preisranking
- `Best Value` nur bei tatsächlich bestimmbarer vergleichbarer Grundlage

---

## Unverändert schützen

- `trip_items.kind = rental_car` Architektur / ADR-0092
- kein sechster Haupt-Tab
- Mietwagen markiert keine `Bewegungskante` automatisch als covered
- Booking: `unconfirmed ↔ booked`, Quelle in Foundation B nur `user`
- Commercial Protection
- `reise_aendern()` nicht durch stale Definition ersetzen
- RLS/Auth/Ownership
- Search/Factory/Nachweis fail closed
- 16-KB Body-Cap und Rate-Limit
- keine Fake-Angebote
- keine Provider-/Affiliate-/Booking-URL
- Development-Migration `20260821200000` bleibt Development-only
- Production bleibt unverändert

---

## Verifikation / Definition of Done

Nach Fix vollständig ausführen und dokumentieren:

1. `npm test`
2. Typecheck
3. Lint
4. alle Hygiene-Checks
5. Production-Build
6. DB-Typprüfung + relevante DB/RLS/Security/Auth-Checks gegen Development
7. Trip Workspace Audit WebKit + Chromium mit allen bestehenden Viewports/Zuständen
8. Activities-Regression unverändert grün
9. neue Audit-/Testszenarien für explizite Search-Aktion, leere manuelle Defaults, One-way-Unknown und Cross-Currency-Ranking
10. CI für **exakten neuen Head** grün
11. Vercel Preview für exakten neuen Head READY
12. relevante Doku (`docs/RENTAL_CARS.md`, ADR/Handoff/Task falls nötig) aktualisieren

Der echte iPhone-Test kommt **erst nach** diesem Review-Fix.

## Abschlussbericht

Berichte kompakt:

- neuer Head
- welche vier Befunde wie behoben wurden
- geänderte Tests und neue Regressionstests
- DB Development vs Production
- Test-/Audit-Zahlen
- CI/Preview
- verbleibende Risiken
- ausdrücklich: PR Draft, nicht gemergt, keine Production-Migration/Provider-Aktivierung
