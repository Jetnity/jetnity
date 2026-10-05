# Jetnity – Entry Requirements E4 Temporal Rules Task

Stand: 31. August 2026  
Status: **BINDING IMPLEMENTATION TASK / E4 / KEEP DRAFT / STOP FOR TL REVIEW**

## 1. Baseline

Verifizierter Startpunkt:

`main@1937e32abad11678386d723973bc770210d17ff1`

Main-CI #1458 / Run `33376346428`: SUCCESS.  
Vercel Production `dpl_6QVdYiCrCnegJGbgeWXeXnyeHLKL`: READY exakt auf dieser SHA.  
Ruleset `Jetnity main protection` / ID `21875372`: active, strict required checks, bypass leer.

Issue: **#315 – Entry Requirements E4 – official temporal-rule contract (no reminder runtime)**.

## 2. Ziel

E4 ergänzt die vorhandene E1–E3 Official Requirements Truth um **strukturierte relative Zeitregeln**, ohne schon einen konkreten Deadline-/Reminder-Mechanismus zu bauen.

Beispiel, das der Contract lossless tragen muss:

> Arrival Card ist erforderlich und darf ab 72 Stunden vor Destination-Ankunft erledigt werden; Pflichtfrist ist spätestens bei Ankunft.

E4 darf daraus relativ darstellen:

- `Ab 72 Std. vor Ankunft möglich`
- `Pflichtfrist: spätestens bei Ankunft`

E4 berechnet **keinen konkreten Timestamp** und verschickt **keine Notification**.

## 3. Binding Traveller / Truth Invariant

Unverändert:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Official Evaluation Scope bleibt:

> **Traveller × Credential-Option × Destination/Transit × Requirement Type**

Verboten:

- Default-/Primary-/Preferred-/Chosen-Pass oder -Citizenship;
- `documents[0]` / `evaluations[0]` als Product Truth;
- Issuer Country als Citizenship;
- credential-übergreifende Timing-Zusammenlegung;
- Timing aus URL, freiem Text, Requirement-Typ, LLM oder Browser ableiten;
- `OfficialEvidence.validFrom/validUntil` als Action-Fenster/Deadline missbrauchen.

## 4. Verbindlicher E4 Contract

### 4.1 Relative-Duration-Regel

E4 unterstützt bewusst nur einen ersten lossless Subset:

`kind: 'relative_duration'`

Calendar-day-, lokale Uhrzeit- oder absolute Timestamp-Regeln, die sich nicht verlustfrei als Dauer relativ zu einem Ereignis ausdrücken lassen, werden **nicht** in diesen Contract gepresst und bleiben für spätere Slices unsupported.

### 4.2 Geschlossene Anchor-Taxonomie

Mindestens exakt diese Anchor-Werte:

- `trip_departure`
- `destination_arrival`
- `transit_arrival`
- `border_crossing`

Keine freien Anchor-Strings als Product Truth.

`transit_arrival` bezieht sich auf den exakten Transit-Scope der Evaluation. Kein silent Transit drop.

### 4.3 Relative Position

Geschlossene Relation:

- `before`
- `at`
- `after`

Jeder relative Punkt trägt einen normalisierten `offsetMinutes`-Wert.

Kanonische Validierung:

- `before` / `after`: positiver Integer;
- `at`: exakt `0`;
- negative Werte, NaN, Infinity, Floats und unplausibel extreme Werte verwerfen;
- eine technische Obergrenze ist erlaubt/erforderlich, muss aber als Safety-Bound dokumentiert sein und darf keine fachliche Deadline erfinden.

### 4.4 Temporal Rule

Der normalisierte Contract muss mindestens tragen können:

- `availableFrom`: frühester explizit belegter Zeitpunkt relativ zum Anchor;
- `dueBy`: spätester explizit belegter Ziel-/Fristpunkt relativ zum Anchor;
- bei `dueBy` explizite Semantik `mandatory | recommended`.

Damit darf eine Empfehlung später niemals als Pflichtfrist behandelt werden.

Die genaue TypeScript-Namensgebung darf scope-nah gewählt werden; Semantik und geschlossene Werte sind bindend.

## 5. Provider → Engine → OfficialEvaluation

`RequirementsProviderZeile` erhält explizite Temporal-Metadaten. Wie bei E1/E2 muss der Provider-Rohwert validiert/normalisiert werden; ungültige Marketing-/Freitextwerte werden nicht als Product Truth übernommen.

`OfficialEvaluation` erhält ein normalisiertes `temporalRule`-Feld, default/fail-closed `null`.

Übernahme nur wenn **alle** folgenden Bedingungen erfüllt sind:

1. die zugrunde liegende Evaluation ist vertrauenswürdig;
2. `status === 'current'`;
3. `freshness === 'current'`;
4. `result` ist `required` oder `conditional`;
5. die jeweilige Temporal-Metadatenform ist gültig.

Damit gilt zwingend:

- `not_required` → `temporalRule: null`;
- `unknown` / insufficient context → `null`;
- stale / recheck / source/provider unavailable → `null`;
- `officialLeer(...)` → `null`;
- Visa-Widerspruchs-Degradation → `null`.

Eine ungültige Temporal Rule darf eine ansonsten belastbare `required`/`conditional` Requirement-Entscheidung **nicht** in `unknown` umwandeln. Timing und Requirement-Hard-Truth sind getrennte Trust-Dimensionen.

## 6. Duplicate / Conflict Semantics

E4 darf keinen neuen First-Row-Wins-Fehler erzeugen.

Für mehrere Providerzeilen mit demselben Evaluation-Key:

- widersprechen sich die Requirement-Entscheidungen, bleibt die bestehende fail-closed Conflict-Semantik bestehen;
- stimmen die Requirement-Entscheidungen überein, aber die Temporal Rules unterscheiden sich, bleibt die übereinstimmende Requirement-Entscheidung erhalten, **Temporal Rule wird jedoch fail-closed `null`**;
- `null` vs. nicht-`null` bei Duplicate-Zeilen gilt ebenfalls als nicht belastbar genug für eine gemeinsame aktuelle Timing-Truth;
- gleiche Temporal Rules dürfen erhalten bleiben;
- Ergebnis muss permutationsstabil sein.

Temporal Rule soll deshalb **nicht blind** in die bestehende Requirement-Entscheidungssignatur aufgenommen werden, wenn dies bei reinem Timing-Konflikt die zugrunde liegende Requirement-Hard-Truth unnötig zerstören würde. Implementiere stattdessen eine saubere, explizite Metadata-Reconciliation.

## 7. Visitor Presentation

Die bestehende E3-Checkliste darf Timing nur aus `OfficialEvaluation.temporalRule` darstellen.

Keine Heuristik aus:

- Requirement Type;
- `validFrom/validUntil`;
- Source URL;
- Action URL;
- Visa-Modus;
- freiem Providertext.

Relative Copy soll verständlich und deterministisch sein, z. B.:

- `Ab 3 Tage vor Ankunft möglich`
- `Ab 72 Std. vor Ankunft möglich`
- `Pflichtfrist: spätestens bei Ankunft`
- `Empfohlen bis: 24 Std. vor Abreise`

Formatierung darf Tage/Stunden/Minuten nur rechnerisch aus dem strukturierten Minutenwert bilden. Keine konkreten Kalenderdaten oder Uhrzeiten in E4.

Wenn `temporalRule === null`, keine Timing-Copy.

## 8. Tests – Mindestumfang

Mindestens:

1. 72h-before-destination-arrival `availableFrom` wird korrekt normalisiert;
2. `at + 0` akzeptiert, `at + nonzero` verworfen;
3. before/after mit 0/negativ/Fraction/NaN/Infinity verworfen;
4. mandatory und recommended bleiben unterscheidbar;
5. malformed/unsupported Timing verändert gültige Requirement-Hard-Truth nicht;
6. `not_required` trägt nie Timing;
7. stale/recheck/unavailable/insufficient-context trägt nie Timing;
8. Visa-Conflict-Degradation löscht Timing;
9. Duplicate gleiche Entscheidung + widersprüchliches Timing → Requirement bleibt, Timing null;
10. Duplicate gleiche Entscheidung + identisches Timing → Timing bleibt;
11. Duplicate-Reihenfolge/Permutation verändert Ergebnis nicht;
12. Multi-Citizenship/Multi-Document: Timing bleibt exakt credential-spezifisch;
13. Transit-Timing bleibt am exakten Transit-Country-Scope;
14. E1/E2/E3 Regressionen bleiben grün;
15. `requirementsProviderAus()` bleibt `null`.

Lokal vor Handoff:

- relevante fokussierte Tests;
- vollständige Testsuite;
- Typecheck;
- Lint;
- Production Build;
- vorhandene Repo-Hygiene-Checks soweit CI sie ausführt.

## 9. Erlaubte Dateien / Scope

Erwartet scope-nah insbesondere:

- `lib/readiness/official.ts`
- `lib/readiness/provider.ts`
- `lib/readiness/engine.ts`
- gegebenenfalls kleiner eigener Temporal-Helper unter `lib/readiness/`
- `lib/readiness/official-presentation.ts`
- `lib/readiness/bezeichnungen.ts`
- relevante Tests
- `ARCHITECTURE.md` / `DECISIONS.md` / `docs/TRAVEL_READINESS.md` nur soweit nötig
- E4 Status/Handoff/Self-Review-Dokumente

Agent darf **`docs/ACTIVE_WORK_STATUS.md` nicht ändern**.

## 10. Hard Non-Scope

E4 baut/aktiviert **nicht**:

- echten Requirements-/Visa-/Entry-Provider;
- Vendorwahl / Vertrag / DPA;
- Secrets / API Keys / paid calls;
- `requirementsProviderAus()`-Aktivierung;
- konkrete Timestamp-/Deadline-Projektion aus Trip/Route;
- Zeitzonen-/DST-Auflösung konkreter Trip-Events;
- Calendar-day-/lokale-Uhrzeit-Temporal-Regeln;
- Task-/Completion-State-Machine;
- Reminder-/Push-/E-Mail-/Notification-Runtime;
- Supabase / Migration / RLS / Ownership / Auth / Session / MFA / AAL;
- neue sensitive Traveller-/Dokumentdaten;
- Gebühren / erlaubte Aufenthaltsdauer / konkrete freie Seitenzahl / Proof-of-Funds-Betrag;
- Credential-Ranking / automatische „beste Pass“-Auswahl;
- E5 oder irgendeinen Folgeslice.

## 11. Agent / Governance

Exakter logischer Cursor-Anzeigename:

**`Jetnity entry requirements temporal rules 1`**  
Generation: **1**

Agent:

- arbeitet nur auf dem E4-Branch / Draft-PR;
- liest zuerst diesen Task und den E3-Closure-Checkpoint;
- prüft `origin/main` vor Handoff erneut;
- erstellt/aktualisiert E4 Status, Handoff und adversarial Self-Review;
- **do not mark Ready**;
- **do not merge**;
- **do not start a follow-up slice**;
- stoppt nach Delivery für unabhängigen Technical-Lead Exact-Head-Review.

Agent-Self-Review, grüne Tests oder Vercel sind **kein TL-PASS**.

Bei `CHANGES REQUIRED` bleibt dieselbe Session zuständig.

## 12. Definition of Done

E4 ist erst abgeschlossen nach:

1. Agent Delivery + STOP;
2. unabhängiger TL-Diff-/Code-/Truth-/Regression-Review auf exaktem finalen Head;
3. Exact-Head GitHub CI SUCCESS;
4. Exact-Head Vercel READY/SUCCESS;
5. 0 offene GitHub Review Threads;
6. 0 relevante unresolved Vercel Toolbar Threads;
7. TL-PASS auf exakter SHA;
8. geschützter Merge mit Expected-Head-SHA;
9. Post-Merge Main-CI SUCCESS auf exakter Merge-SHA;
10. Vercel Production READY auf exakter Merge-SHA;
11. Issue #315 completed;
12. Continuity/Checkpoint aktualisiert;
13. **kein automatischer E5-Start**.
