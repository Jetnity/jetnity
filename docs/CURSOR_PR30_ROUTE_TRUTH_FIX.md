# Cursor-Fixauftrag – PR #30: Mobility Route Truth

Stand: 21. August 2026

Branch: `feat/mobility-transfers-foundation`

Draft-PR: #30 – Foundation A – Mobilität & Transfers

Dieser Auftrag ist ein **gezielter Review-Fix** auf dem bestehenden PR #30. Keine neue Phase, kein neuer Provider, keine Production-Migration.

## 1. Root Cause / Review-Befund

Die unabhängige Review hat in `lib/mobility/kanten.ts` einen fachlichen Wahrheitsfehler gefunden:

```ts
const flugTreffer = restFluege.filter((flug) => flug.startsOn === kante.date)
```

Ein einzelner Flug am selben Datum kann dadurch aktuell eine Bewegungskante als `covered_by_flight` markieren, obwohl **Start und Ziel des Fluges nicht strukturiert gegen Start und Ziel der Bewegungskante geprüft werden**.

Das verletzt die verbindliche Wahrheitsregel aus `docs/CURSOR_MOBILITY_TRANSFERS_FOUNDATION_TASK.md`:

> Eine Verbindung darf nur als abgedeckt gelten, wenn Start/Ziel und relevante Zeit-/Datumsbeziehung deterministisch passen.

Ein Datum allein ist kein belastbarer Routennachweis.

Beispiel: Eine Reise hat die benötigte Kante `Zürich → Lugano` am 12.09. Wenn an diesem Datum genau ein gespeicherter, aber anders gerouteter Flug existiert, darf Jetnity **nicht** „Über Flug abgedeckt“ anzeigen.

## 2. Verbindliche Korrektur

`covered_by_flight` darf nur entstehen, wenn die bestehende strukturierte Datenlage die Route **deterministisch** beweist.

Harte Regeln:

1. **Nicht** nur über `startsOn === date` matchen.
2. **Nicht** `title` oder `note` parsen, um IATA-/Routentexte als Wahrheit zurückzugewinnen. Freitext ist keine Trust Boundary.
3. Keine neue speculative Flight-Refaktorierung nur für diesen Fix.
4. Wenn der heutige strukturierte `TripItem`-Flug die Route nicht zuverlässig beweisen kann, muss der konservative Foundation-Fallback gelten:
   - ein möglicher gleichdatiger Flug macht die betroffene Mobilitätskante **`unknown`**, nicht `covered_by_flight`;
   - ohne passenden/verifizierbaren Flug und ohne Transfer kann eine ansonsten deterministisch bekannte Kante `open` bleiben.
5. Falls es bereits eine belastbare strukturierte Zuordnung über Reisegraph/Stage/Day gibt, darf sie nur verwendet werden, wenn du beweisen und testen kannst, dass sie Start **und** Ziel der konkreten Kante eindeutig repräsentiert. Keine Annahmen.
6. `covered_by_flight` darf in der UI nur erscheinen, wenn dieser deterministische Nachweis tatsächlich vorliegt.

## 3. Tests – Pflicht

Mindestens ergänzen/anpassen:

- **same date, wrong/unknown route:** ein einzelner Flug am Kantendatum darf die Kante nicht als `covered_by_flight` markieren;
- gleichdatiger Flug ohne strukturierten Routennachweis → `unknown`;
- exakter Transfer mit Start + Ziel + Datum bleibt `selected` / `booked`;
- mehrere Flug-/Transfer-Kandidaten bleiben `unknown`;
- kein Flug/Transfer bei vollständiger Kante bleibt `open`;
- bestehende Flight-, Booking-, Trip-Workspace- und Activities-Tests bleiben grün.

Wenn `covered_by_flight` mit dem heutigen Datenmodell überhaupt nicht sicher beweisbar ist, ist es akzeptabel und erwünscht, diese Statusableitung in Foundation A vorerst **nicht zu verwenden**. Truth > scheinbare Vollständigkeit.

## 4. Dokumentation korrigieren

Aktualisiere mindestens:

- `docs/MOBILITY.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`, falls dort die konkrete Flight-Coverage-Semantik beschrieben wird
- `DECISIONS.md`, falls ADR-0091 die alte Datum-only-Semantik festschreibt
- `docs/CURSOR_MOBILITY_TRANSFERS_FOUNDATION_TASK.md` Abschlussstatus nur, wenn nötig

Die Dokumentation darf danach **nicht** mehr behaupten, dass „ein eindeutiger Flug am Kantendatum“ automatisch abdeckt.

Zusätzlich die Migrationsdokumentation sprachlich eindeutig machen:

- Production **hat** `20260821100000_trip_items_booking_status` nach separater Freigabe bereits angewendet;
- `docs/PRODUCTION_ROLLOUT.md` hält `20260820130000` weiterhin bewusst als Default-Sicherheitsgrenze für automatische Production-Läufe;
- das ist eine Guardrail, kein Gegenbeweis zum realen Production-Migrationsstand;
- `20260821120000_trip_items_mobility` bleibt Development-only und darf nicht auf Production angewendet werden.

Keine Formulierung „Widerspruch bleibt bewusst stehen“ als dauerhafte Source-of-Truth-Ambiguität. Der Unterschied zwischen **tatsächlich angewendetem Production-Stand** und **Default-Playbook-Grenze** muss eindeutig sein.

## 5. Nicht verändern

- kein Mobility-Provider
- keine Fake-Fahrpläne/Preise
- keine Production-Migration
- keine Production-Provider-Aktivierung
- keine Secrets
- keine Mietwagen-/Travel-Readiness-Arbeit
- keine unnötige Flight-Neuarchitektur

## 6. Qualität / Abschluss

Nach dem Fix vollständig ausführen:

- `npm test`
- Typecheck
- Lint
- Hygiene
- Production-Build
- relevante DB-/Security-Checks gegen Development, sofern Code/Docs sie berühren
- Trip-Workspace-Audit WebKit + Chromium
- Activities-Regression
- GitHub CI
- Vercel Preview

Der PR bleibt **Draft**. Nicht mergen. Kein Production-Schritt.

Erst nach grünem Fix-Head folgt der echte iPhone-Preview-Test.

---

## Abschlussstatus

Stand: 21. August 2026 · Draft-PR #30 · Branch `feat/mobility-transfers-foundation`

**Status:** Route-Truth-Korrektur im Repository. PR bleibt Draft. Nicht mergen. Nicht Production.

Umgesetzt:

- `covered_by_flight` entsteht nicht mehr aus `startsOn === date`
- gleichdatiger Flug ohne strukturierten Routennachweis → `unknown`
- Titel/Notiz eines Fluges werden nicht als Route gelesen
- eindeutiger Transfer mit Start + Ziel + Datum bleibt `selected` / `booked`
- ohne Flug/Transfer bleibt eine vollständige Kante `open`
- Production-Stand (`20260821100000` angewendet) und Playbook-Grenze (`20260820130000`) sind getrennt dokumentiert, kein offener Widerspruch
- `20260821120000` bleibt Development-only

`npm test` **1100/1100**. Hygiene, Build, Audits und Preview folgen auf diesem Head.