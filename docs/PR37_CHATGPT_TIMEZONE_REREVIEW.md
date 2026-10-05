# PR #37 – ChatGPT Timezone Re-Review

Stand: 23. August 2026  
Status: **REQUEST CHANGES – ein letzter direkt code-derived Timezone-Truth-Pfad**

PR: #37 `Travel Safety & Disruption Intelligence – provider-neutrale Foundation`  
Branch: `feat/travel-safety-disruption-intelligence`  
Geprüfter Runtime-Head: `09fedc4f`  
Docs-Head vor diesem Review: `434fd0f262b48082f31f07db201d989334aef2b7`  
Base/main: `91e644b279c802c5a5d7a88135ed8ab9c4229a34`  
Stand beim Review: **26 ahead / 0 behind**, Draft, offen, mergeable.

## Ergebnis des Timezone-Closure-Fixes

Der in `docs/PR37_CHATGPT_TIMEZONE_CLOSURE_REVIEW.md` beschriebene direkte Route-Clock-Fehler ist geschlossen:

- `routeKontaktZeit()` hängt kein `Z` mehr an Foundation-D-Ortszeiten;
- Route `date + HH:mm` bleibt zonenlose Wanduhrzeit;
- zonenlose Routeuhr gegen UTC-Instant wird ohne belastbare Zone nicht minutengenau als `affected`/`not_affected` entschieden;
- die geforderten DOH-Tests für `16:00Z` und `19:00Z` gehen auf `insufficient_context`;
- Date-only gegen Date-only bleibt kalenderbasiert;
- Wiederholungs-Airports und unresolved Routekontakte bleiben erhalten.

Laut finalem Gate auf Runtime `09fedc4f`: `npm test` **1478/1478**, Typecheck/Lint/Hygiene grün, Production-Build **38/38**, UI-Audit **886/886**; GitHub Actions und Vercel grün. Keine Production-Migration, kein Live-Safety-Provider.

Der Closure-Check findet jedoch noch einen unmittelbar angrenzenden Pfad derselben Zeitsemantik.

---

## Merge-Blocker – zonenlose Date-only-Reise-/Stage-Tage werden gegen UTC-Instant noch als UTC-Tagesgrenzen interpretiert

### Betroffene Dateien

- `lib/safety/scope.ts`
- `lib/safety/relevanz.ts`
- `lib/safety/kontext.ts`
- Tests: `lib/safety/engine.test.ts`

### Ursache

`SafetyReisekontext.startDate/endDate`, Stage `arrivalDate/departureDate` sowie Day-Daten sind zonenlose Kalenderdaten (`YYYY-MM-DD`).

`zeitraeumeUeberschneiden()` behandelt den neuen Fall `clock ↔ instant` korrekt mit einer Offset-Unsicherheitszone. Für `date ↔ instant` fällt die Funktion aber weiterhin in den generischen Pfad:

- Date-only Start wird zu `YYYY-MM-DDT00:00:00Z`;
- Date-only Ende wird zu `YYYY-MM-DDT23:59:59.999Z`;
- der UTC-Instant wird direkt dagegen verglichen.

Damit wird ein lokaler Kalendertag ohne bekannte Zeitzone implizit zu einem UTC-Kalendertag gemacht.

### Warum das konkrete Safety-Truth verfälschen kann

Beispiel UTC+14:

- Reise-/Stage-Tag: `2026-09-12` lokal;
- tatsächlicher lokaler Zeitpunkt `2026-09-12 08:00` entspricht `2026-09-11T18:00:00Z`;
- der aktuelle generische Date-only-Vergleich sieht `2026-09-11T18:00Z < 2026-09-12T00:00Z` und kann `before` liefern;
- `zeitAufRefsAnwenden()` kann dadurch bereits auf Trip-Ebene `not_affected` zurückgeben, bevor der sichere zonenlose Routekontakt-Vergleich greift.

Analog kann bei westlichen Offsets ein UTC-Instant des Folgetags noch zum lokalen Reisetag gehören und fälschlich als `after` aussortiert werden.

Das ist ein direkt code-derived falscher `not_affected`-Pfad und erfüllt das Stop-Kriterium.

### Required fix

1. `date ↔ instant` darf ohne belastbare Zone ebenfalls **nicht** als UTC-Tagesgrenze behandelt werden.
2. Verwende dieselbe konservative weltweite Offset-Hülle wie beim zonenlosen Clock-Vergleich:
   - frühestmöglicher UTC-Beginn eines lokalen Kalendertags: lokale `00:00` minus UTC+14;
   - spätestmögliches UTC-Ende: lokale `23:59:59.999` minus UTC−12.
3. Nur wenn ein Event-Instant klar vollständig außerhalb dieser möglichen UTC-Hülle liegt, darf `before`/`after` entstehen.
4. Liegt der Instant innerhalb der möglichen Hülle und fehlt eine Zone, darf der Date-only-Pfad keine sichere `not_affected`-Entscheidung erzeugen; für feinere Entscheidung muss die nachfolgende Ref-/Route-Logik greifen bzw. `insufficient_context` bleiben.
5. `date ↔ date` bleibt kalenderbasiert.
6. Bestehende `clock ↔ instant`-Semantik aus `09fedc4f` unverändert lassen.
7. Keine IANA-Zone, kein Offset und keine Provider-/Airport-Heuristik erfinden.

### Pflicht-Regressionstests

Mindestens:

1. Trip/Stage Date-only `2026-09-12`, Event-Instant `2026-09-11T18:00:00Z` => darf bei möglicher UTC+14-Lokallage **nicht** bereits auf Date-only-Ebene `not_affected/before` werden.
2. Trip/Stage Date-only `2026-09-12`, Event-Instant `2026-09-13T08:00:00Z` => darf bei möglicher westlicher Lokallage **nicht** bereits auf Date-only-Ebene `not_affected/after` werden.
3. Ein Instant deutlich außerhalb der maximal möglichen Offset-Hülle bleibt sicher `before` bzw. `after`.
4. `date ↔ date` gleicher Tag bleibt Overlap.
5. Die bestehenden DOH-`16:00Z`/`19:00Z`-Tests und Wiederholungs-Airport-Tests bleiben grün.

### Dokumentation

ADR-0132 bzw. der aktuelle Timezone-Nachzug muss ausdrücklich festhalten:

- zonenlose `HH:mm` **und** zonenlose Date-only-Kalendertage werden nicht still als UTC interpretiert;
- UTC-Minutenwahrheit entsteht erst mit belastbarer Zone/Offset;
- ohne diese Wahrheit gilt fail-closed.

---

## Stop-Kriterium danach

Nach Schließen **dieses einen Date-only↔Instant-Pfads** kein weiterer Foundation-Pass für Stil, theoretische Mikro-Härtung oder Providerdetails.

Wenn der Fix die oben genannten Regressionen erfüllt, vollständiges Gate grün ist, Branch 0 behind bleibt und kein neuer konkret reproduzierbarer Truth-/Security-/SoT-/Rollout-Defekt erscheint, ist PR #37 **technisch Closure/PASS** und soll dem Product Owner zur ausdrücklichen Merge-Freigabe empfohlen werden.

Bis dahin:

- PR bleibt Draft;
- kein Mark Ready;
- kein Merge;
- keine Production-Migration;
- kein Live-Safety-Provider.