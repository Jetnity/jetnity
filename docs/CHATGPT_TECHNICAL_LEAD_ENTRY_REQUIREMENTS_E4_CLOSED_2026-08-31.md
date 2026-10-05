# Jetnity – Technical Lead Entry Requirements E4 Closed

Stand: 31. August 2026  
Status: **CURRENT CLOSURE CHECKPOINT / ENTRY REQUIREMENTS E4 CLOSED / NO ACTIVE CURSOR RUNTIME SLICE / LIVE-EVIDENCE GEWINNT**

## 1. Verifizierter Abschluss

Entry Requirements E4 – Official Temporal Rule Contract ist vollständig abgeschlossen.

- Issue **#315 CLOSED / completed**.
- ursprünglicher Draft-PR **#316 CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED** ausschließlich wegen des bekannten GitHub-Connectorfehlers beim Draft→Ready-Schritt (`Repository.fullDatabaseId`).
- erster Agenten-Delivery-Head `3b6b493f8040631ea436cef1c7fd59cd871d38fb` wurde vom Technical Lead **nicht** freigegeben: Der TL fand ein materielles Same-Anchor-Truth-Problem bei unmöglichen Zeitfenstern.
- derselbe Agent / dieselbe Session korrigierte den Befund; final unabhängig geprüfter Implementierungs-Head: **`86b568d2863b6abc9abacc1bd482bfb45e8884f3`**.
- Technical-Lead Exact-Head PASS wurde auf #316 dokumentiert.
- non-draft Recovery-PR **#317 MERGED** nach eigener vollständiger Re-Gate-Evidence.
- Recovery-CI **#1465 / Run `33382654747`: SUCCESS** auf exakt `86b568d2...`.
- Runtime-Merge-SHA auf `main`: **`08fe34c9a170262912ac0252d2272d49585f4cdf`**.
- Post-Merge Main-CI **#1466 / Run `33382895693`: SUCCESS** exakt auf `08fe34c9...`, inklusive Auth-Konfiguration, Typecheck, Lint, Tests, Admin-API-Schutz, Schema-/Dead-Code-/Export-/Dependency-Hygiene und Production Build.
- Vercel Production **`dpl_AyDTo4xTWQEn5F3TBY4bzr5XS5FY`: READY** exakt auf `08fe34c9...`.
- GitHub Review Threads vor Merge: **0**.
- Vercel unresolved Threads vor Merge: **0**.

## 2. Was E4 liefert

E4 ergänzt den provider-neutralen Official-Requirements-Vertrag um explizite relative Zeitregeln, ohne bereits konkrete Reise-Timestamps oder Benachrichtigungen zu erzeugen.

Geschlossener erster Contract:

- `kind = relative_duration`;
- Anchors: `trip_departure`, `destination_arrival`, `transit_arrival`, `border_crossing`;
- Relation: `before | at | after`;
- normalisierter Minuten-Offset mit technischer Obergrenze;
- `availableFrom` als frühester belastbar modellierter Zeitpunkt relativ zu einem Anchor;
- `dueBy` mit expliziter Semantik `mandatory | recommended`;
- relative Besucher-Copy wie `Ab 72 Std. vor Ankunft möglich`, ohne konkretes Kalenderdatum zu behaupten.

Temporal Rule wird nur aus expliziter strukturierter Provider-Metadaten übernommen. Sie wird niemals aus URL, Freitext, Requirement-Typ, LLM/Browser oder `validFrom/validUntil` abgeleitet.

## 3. Fail-closed Truth

Timing darf nur an einer vertrauenswürdigen, `current` Evaluation mit `required` oder `conditional` hängen.

Folgende Zustände tragen keine aktuelle Temporal Rule:

- `not_required`;
- `unknown` / insufficient context;
- stale / recheck needed;
- provider/source unavailable;
- Visa-Result-/Mode-Conflict-Degradation.

Malformed oder unsupported Timing verwirft nur Timing; eine ansonsten gültige Requirement-Hard-Truth wird dadurch nicht künstlich degradiert.

Mehrere Providerzeilen mit gleicher Requirement-Entscheidung, aber widersprüchlichem Timing führen fail-closed zu `temporalRule: null` statt First-Row-Wins.

## 4. TL-gefundener Same-Anchor-Defekt und Fix

Im ersten Agenten-Head wurden `availableFrom` und `dueBy` einzeln validiert, aber nicht auf deterministisch unmögliche Reihenfolge geprüft.

Beispiel des verhinderten Fehlers:

- `availableFrom = 24h nach destination_arrival`;
- `dueBy = 24h vor destination_arrival`.

Das hätte gleichzeitig „ab 24 Std. nach Ankunft möglich“ und „Pflichtfrist spätestens 24 Std. vor Ankunft“ als aktuelle Timing-Truth darstellen können.

Der Fix normalisiert bei **gleichem Anchor**:

- `before = -offset`;
- `at = 0`;
- `after = +offset`;

und akzeptiert das Fenster nur, wenn `availableFrom <= dueBy`.

Unmögliche Same-Anchor-Fenster werden vollständig als Timing verworfen, während die gültige Requirement-Entscheidung erhalten bleibt.

Bei **verschiedenen Anchors** wird in E4 ausdrücklich keine Reihenfolge geraten; dafür fehlen noch konkrete Event-Timestamps. Diese Projektion ist ein späterer, separat zu gatender Slice.

## 5. Traveller- und Credential-Invariant

Unverändert kanonisch:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Official Scope bleibt:

> **Traveller × Credential-Option × Destination/Transit × Requirement Type**

Keine Default-/Primary-/Preferred-/Chosen-Citizenship oder -Pass. Issuer Country ≠ Citizenship. Kein `documents[0]` / `evaluations[0]` als Product Truth.

## 6. Weiterhin ausdrücklich nicht aktiv

E4 aktiviert **nicht**:

- einen realen Requirements-/Visa-/Entry-Provider;
- Vendorwahl, Vertrag/DPA, Secrets/API Keys oder paid calls;
- `requirementsProviderAus()` – bleibt `null`;
- konkrete Deadline-/Timestamp-Projektion aus Trip/Route;
- Zeitzonen-/DST-Auflösung;
- Task-/Completion-State-Machine;
- Reminder, Push, E-Mail oder andere Notification-Runtime;
- Supabase/Migration/RLS/Ownership/Auth/MFA/AAL;
- sensible Passnummer/MRZ/Scans/Biometrie/Gesundheitsdaten;
- Credential-Ranking oder automatische „beste Pass“-Auswahl;
- E5.

## 7. Persistenter Zielanker

Issue **#294 – Entry Requirements Detail Architecture** bleibt offen als persistenter Product-Target-Tracker.

Kanonische Zielarchitektur:

`docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`

E4 liefert die relative Temporal-Rule-Foundation. Konkrete Event-Instant-Projektion, Recalculation, Task-State und Notification-Orchestrierung bleiben separate spätere Slices nach frischem Binding-Slice-Precheck.

## 8. Agent / Governance

Letzter E4-Agent:

**`Jetnity entry requirements temporal rules 1`**  
Generation: **1**  
Session: `bc-69084bbc-a7ab-4ed5-8418-754bea9ee241`  
Status: **STOPPED / DELIVERY COMPLETE / TL PASS / E4 MERGED**.

Der bekannte Draft→Ready-Connectorfehler rechtfertigt weiterhin keine Lockerung des Rulesets `Jetnity main protection` / ID `21875372`.

## 9. FIRST NEXT ACTION

**Kein E5, Provider- oder Reminder-Slice ist automatisch gestartet oder freigegeben.**

Vor dem nächsten Slice muss der Technical Lead erneut:

1. finalen `main`, offene PRs/Issues, CI/Vercel und Agentenstatus live prüfen;
2. Issue #294 + Zielarchitektur gegen den aktuellen Ist-Code lesen;
3. Build-Order, Truth-Grenzen und besondere Product-Owner-Gates prüfen;
4. nur den kleinsten verantwortbaren bounded Slice definieren;
5. Supabase nur bei DB-/RLS-/Storage-/Security-/Migration-Scope live prüfen.

**Live-Evidence gewinnt immer.**
