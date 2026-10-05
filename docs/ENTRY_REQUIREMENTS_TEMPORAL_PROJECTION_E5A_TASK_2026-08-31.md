# Jetnity – Entry Requirements E5-A: Exact Event-Instant Temporal Projection Core

Stand: 31. August 2026  
Status: **BINDING BOUNDED AGENT TASK / ISSUE #323 / NO AUTO-FOLLOW-UP**

## 1. Baseline

Exakter Startpunkt:

`main@1600767be5ec87961e1d5b5e10c4bcc2f6eb51aa`

Branch:

`feat/entry-requirements-temporal-projection-e5a-2026-08-31`

Issue:

`#323 – Entry Requirements E5-A – exact event-instant temporal projection core`

Parent target:

`#294 – Entry Requirements Detail Architecture`

Vor Start verifiziert:

- Main CI #1475 / Run `33390379263`: SUCCESS auf exakt `1600767b...`;
- Vercel auf exakt `1600767b...`: SUCCESS / Production `dpl_CLM1GtM9HR3h5nFudtVvetPgzWka`;
- Ruleset `Jetnity main protection` / ID `21875372`: active, PR + strict CI/Auth/Vercel + thread resolution + merge-only, bypass leer;
- keine konkurrierende aktuelle Runtime-PR; #52/#50/#40/#39/#28 sind historische Drafts;
- kein aktiver Cursor-Runtime-Slice vor E5-A.

## 2. Warum dieser Slice und nicht sofort konkrete Deadlines

E4 kann bereits belastbare relative Regeln tragen, z. B.:

- `72 Std. vor destination_arrival` verfügbar;
- `24 Std. vor trip_departure` verpflichtend.

Der aktuelle Trip-/Route-Unterbau trägt aber **keine belastbare IANA-Zeitzone oder UTC-Offset-Wahrheit** für lokale Flug-/Stage-Uhrzeiten.

Bestehende Wahrheit, die wiederverwendet werden muss:

- `lib/readiness/temporal.ts` = einzige E4-Relative-Rule-Domain;
- `lib/route/kontakte.ts` = lokale `YYYY-MM-DDTHH:mm` ohne erfundenes `Z`;
- `lib/route/domain.ts` = lokale Segmentzeiten + `chronologieBewiesen`;
- `lib/safety/scope.ts` = konservative fail-closed Erkenntnis: zonenlose Date-/Clock-Werte dürfen nicht als UTC-Minutenwahrheit behandelt werden;
- historische Timezone-Reviews #37/#38 bestätigen dieselbe Trust Boundary.

Zusätzlicher Scope-Befund:

- `RequirementsAnfrage` / `OfficialEvaluation` unterscheiden Traveller/Credential/Destination/Transit, aber nicht automatisch eine eindeutige konkrete Route-Occurrence;
- dieselbe Destination / dasselbe Transitland kann mehrfach in einer Reise vorkommen;
- deshalb darf dieser Core **niemals selbst** ein Reiseereignis nach Land, Arrayposition oder `first match` auswählen.

E5-A baut ausschließlich die sichere Rechenfunktion **nachdem** ein Aufrufer ein konkretes Ereignis bereits explizit gebunden hat.

## 3. Verbindliche Produkt- und Truth-Regel

> **OfficialTemporalRule + explizit gebundener absoluter Event-Instant → deterministisch projizierter absoluter Zeitpunkt / Action Window.**

Ohne expliziten absoluten Instant keine Projektion.

Keine Zeitzonenheuristik. Keine Occurrence-Heuristik. Keine Freitextableitung. Kein `Z` an lokale Wanduhrzeiten.

## 4. Pflicht-Implementierung

### 4.1 Pure Domain

Implementiere einen kleinen, Next-freien Core im Readiness-Bereich, bevorzugt:

`lib/readiness/temporal-projection.ts`

Die konkrete Benennung darf angepasst werden, solange keine zweite Temporal-Domain entsteht.

Der Core muss die bestehenden E4-Typen aus `lib/readiness/temporal.ts` wiederverwenden:

- `OfficialTemporalRule`
- `OfficialTemporalAnchor`
- `OfficialTemporalPunkt`
- `OfficialTemporalDueBy`

Keine Kopie dieser Enums/Unions in einer zweiten Datei.

### 4.2 Explizite Event-Bindings

Der Input muss typed ausdrücken:

- E4-Anchor;
- stabile `eventRef` / Occurrence-Identität;
- absoluter RFC3339/ISO-Instant mit explizitem `Z` oder numerischem Offset.

Wichtig:

- der Core sucht **keinen** Trip, Stage, Segment, Airport oder Country;
- der Core wählt **keinen** ersten Treffer;
- der Core mappt **keinen** Country-Code auf ein Ereignis;
- der Core löst **keine** Zeitzone auf.

Ein Aufrufer muss für jede benötigte Anchor-Seite bereits exakt sagen, welches Event gemeint ist.

### 4.3 Absolute Instant-Validierung

Akzeptiert werden nur gültige absolute Date-Time-Strings mit:

- `Z`, oder
- explizitem numerischen Offset wie `+02:00` / `-05:00`.

Nicht akzeptieren als absolute Truth:

- `2026-09-12T18:00`;
- `2026-09-12`;
- leere Strings;
- ungültige Datums-/Offsetwerte;
- Browser-/locale-abhängige Date-Strings.

Gültige Offset-Instants deterministisch nach UTC ISO normalisieren.

Kein stilles Interpretieren zonenloser Werte als lokale Maschinenzeit oder UTC.

### 4.4 Projektion

Für einen E4-Punkt:

- `before` → Offset exakt subtrahieren;
- `at` → unverändert;
- `after` → Offset exakt addieren.

E4 validiert die Offset-Grenzen bereits. E5-A darf sie nicht neu semantisch umdefinieren.

Output muss mindestens erhalten:

- projizierten normalisierten absoluten Instant;
- verwendete Anchor-Art;
- verwendete `eventRef`;
- bei `dueBy` zusätzlich `mandatory | recommended`.

### 4.5 Partial / Fail-Closed

Wenn nur eine Seite einer Regel projizierbar ist:

- keine zweite Seite erfinden;
- die valide Seite darf erhalten bleiben, sofern sie unabhängig fachlich nutzbar ist;
- Outcome/Issues müssen die fehlende/ungültige Seite sichtbar unterscheiden.

Mindestens unterscheidbar:

- `missing_anchor`;
- `invalid_instant`;
- `invalid_projected_window`.

Exakte Typnamen sind frei, Semantik nicht.

### 4.6 Cross-Anchor Window

E4 kann verschiedene Anchors in einer Regel enthalten und ordnet diese bewusst nicht relativ.

E5-A darf sie erst vergleichen, **nachdem beide Seiten auf absolute Instants projiziert wurden**.

Wenn dann gilt:

`availableFrom > dueBy`

muss das Action Window fail-closed als ungültig behandelt werden.

Nie ein unmögliches Fenster als aktuelle Handlungswahrheit ausgeben.

### 4.7 Determinismus / Provenance

- gleiche Eingabe → byte-/value-stabile fachliche Ausgabe;
- keine Abhängigkeit von Object-Key-Reihenfolge;
- `eventRef` muss bis zur Projektion erhalten bleiben;
- kein `Date.now()` in der Projektion;
- keine implizite Maschinen-Zeitzone.

## 5. Pflicht-Tests

Mindestens eine neue fokussierte Testdatei, z. B.:

`lib/readiness/e5a-temporal-projection.test.ts`

Pflichtfälle:

1. `72h before destination_arrival`, Event `2026-10-10T12:00:00Z` → exakt `2026-10-07T12:00:00.000Z`.
2. `24h before trip_departure`, Event mit `+02:00` → zuerst korrekte absolute Normalisierung, dann exakte Projektion.
3. `at` → identischer Instant.
4. `after` → exakte Addition.
5. `availableFrom` und `dueBy` auf verschiedenen Anchors funktionieren nur mit expliziten Bindings für beide Anchors.
6. fehlender Anchor → fail-closed, kein Fallback auf anderen Event.
7. zonenlose lokale Wanduhr `2026-09-12T18:00` wird als absoluter Event-Instant abgelehnt.
8. Date-only `2026-09-12` wird abgelehnt.
9. ungültiger Offset / ungültiges Datum / beliebiger Freitext wird abgelehnt.
10. Cross-Anchor-Projektion mit `availableFrom > dueBy` → `invalid_projected_window`, kein valides Action Window.
11. `eventRef` bleibt für available/due provenance erhalten.
12. zwei mögliche Occurrences werden vom Core niemals first-picked; Tests müssen zeigen, dass nur die explizit übergebene `eventRef` verwendet wird.
13. bestehende E4-Temporal-Tests bleiben unverändert grün.
14. vollständige Repository-Test-Suite grün.

Zusätzlich adversarial prüfen:

- DST-Übergang ist für E5-A kein Heuristikfall: ein bereits absoluter Offset-/Z-Instant ist Rechenwahrheit; der Core versucht keine Zone zu rekonstruieren;
- negative / Overflow-Arithmetik darf nicht aus dem E4-Bound ausbrechen;
- kein system-local `new Date('zoneless')`-Pfad.

## 6. Duplicate-/Integration-Regeln

Vor neuem Helper prüfen:

- `lib/readiness/temporal.ts`;
- `lib/safety/evidence.ts` / `lib/safety/scope.ts`;
- `lib/flights/zeit.ts`;
- `lib/route/kontakte.ts`.

Aber:

- keine Safety→Readiness-Domainkopplung nur um zehn Zeilen Parser zu sparen;
- wenn ein bestehender Baustein wirklich generisch/shared ist, wiederverwenden;
- wenn er fachlich Safety-spezifisch ist, einen kleinen Readiness-Core sauber halten und die Entscheidung im Handoff dokumentieren;
- kein grosser Cross-Domain-Refactor in E5-A.

## 7. Harte Non-Scope-Grenzen

Nicht implementieren:

- Trip/Route→Event-Resolver;
- Country→Occurrence-Matching;
- Stage-/Segment-Auswahl;
- IANA-Zone / Offset-Resolver;
- Airport-/Place-Zeitzonen-Heuristik oder neue Timezone-Datenbank;
- `Z` an lokale Flug-/Stage-Zeiten;
- Requirements Provider Contract-Erweiterung;
- `OfficialEvaluation`-Scope-Erweiterung;
- konkretes Workspace-Deadline-UI;
- `too early / upcoming / actionable / overdue` State Machine;
- Task-/Completion-Persistenz;
- Reminder/Push/E-Mail/Notifications;
- Supabase/Migration/RLS/Auth/MFA/AAL;
- Provider/Secrets/API-Key/paid call/Vendor;
- Credential-Ranking;
- E5-B oder Folgeslice.

`requirementsProviderAus()` bleibt `null`.

## 8. Dokumentation / Handoff

Agent liefert zusätzlich:

- `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_STATUS_2026-08-31.md`
- `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_HANDOFF_2026-08-31.md`
- `docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_SELF_REVIEW_2026-08-31.md`
- passende kleine Aktualisierung in `ARCHITECTURE.md` und `DECISIONS.md` nur für die tatsächlich implementierte Semantik.

`docs/ACTIVE_WORK_STATUS.md` ist TL-owned. Agent darf es **nicht** verändern.

Self-Review ist kein Technical-Lead-PASS.

## 9. Gates

Vor Delivery:

- Typecheck;
- Lint;
- vollständige Tests;
- Admin-API-Schutz;
- Schema-Bezug;
- unreachable/dead code;
- unused exports;
- unused packages;
- Production build.

Branch pushen und Draft-PR aktualisieren.

Agent stoppt danach vollständig.

Kein Mark Ready. Kein Merge. Kein Folgeslice.

## 10. Technical-Lead Review

TL prüft danach unabhängig den **exakten finalen Head** gegen:

- E4-Invarianten;
- absolute-vs-zoneless Zeitsemantik;
- Occurrence-/eventRef-Provenance;
- Cross-Anchor-Fenster;
- keine versteckte Event-/Timezone-Auswahl;
- keine Scope-Ausweitung;
- Tests/CI/Vercel/Threads/Mergeability.

Jeder neue Push invalidiert einen vorherigen PASS.

Bei `CHANGES REQUIRED`: dieselbe Agenten-Session korrigiert und wird vollständig neu gegatet.
