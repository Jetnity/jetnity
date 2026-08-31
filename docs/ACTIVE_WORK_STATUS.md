# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / ENTRY REQUIREMENTS E5-A ACTIVE / LIVE-EVIDENCE GEWINNT**

## 1. Verifizierter aktueller Runtime-Stand

Letzter vollständig abgeschlossener Runtime-/Continuity-Stand:

`main@1600767be5ec87961e1d5b5e10c4bcc2f6eb51aa`

Live vor E5-A verifiziert:

- Readiness Workspace Integration R1 ist vollständig abgeschlossen;
- Issue **#319 CLOSED / completed**;
- R1 Runtime-Merge `9cd5eaf472d6b55ba04d6661b12f086a0bf29d5f`;
- R1 Continuity-Merge `1600767be5ec87961e1d5b5e10c4bcc2f6eb51aa`;
- Main-CI **#1475 / Run `33390379263`: SUCCESS** exakt auf `1600767b...`;
- Vercel Production **`dpl_CLM1GtM9HR3h5nFudtVvetPgzWka`: READY / SUCCESS** exakt auf `1600767b...`;
- Ruleset **`Jetnity main protection` / ID `21875372`**: active, nur `main`, PR + strict CI/Auth/Vercel + Thread Resolution + merge-only, bypass leer;
- keine konkurrierende aktuelle Runtime-PR; die offenen PRs #52, #50, #40, #39 und #28 sind historische Drafts.

Aktuellster abgeschlossener Closure-Checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_READINESS_WORKSPACE_INTEGRATION_R1_CLOSED_2026-08-31.md`

## 2. Aktiver Slice / Agent

Aktiver bounded Slice:

**#323 – Entry Requirements E5-A – exact event-instant temporal projection core**

Branch:

`feat/entry-requirements-temporal-projection-e5a-2026-08-31`

Binding Task:

`docs/ENTRY_REQUIREMENTS_TEMPORAL_PROJECTION_E5A_TASK_2026-08-31.md`

Exakter Agenten-Anzeigename:

**`Jetnity entry requirements temporal projection 1`**  
Generation: **1**  
Session: **PENDING DISPATCH**  
Status: **PREPARED / NOT YET DELIVERED**.

E5-A baut ausschließlich einen provider-neutralen, DB-freien Rechenkern:

> **OfficialTemporalRule + explizit gebundener absoluter Event-Instant → deterministisch projizierter absoluter Zeitpunkt / Action Window.**

Kein E5-B, kein Event-Resolver, keine Zeitzonenauflösung, keine Workspace-Deadline-UI, keine Tasks oder Reminder wurden automatisch gestartet.

## 3. Readiness / Entry Requirements aktueller provider-neutraler Gesamtstand

### S4-R1 – Truth Ops

- Pflicht-`AbortSignal` am Requirements Provider Port;
- harter 4.000-ms Domain-Timeout mit Cancellation;
- technische Fehler bleiben fail-closed;
- `JETNITY_READINESS_AKTIV` + Production hard off;
- Official `checkedAt` global maximal 60 Minuten;
- `requirementsProviderAus()` bleibt `null`.

### E1 – Detail Contract

- First-Class `blank_passport_pages` und `financial_means`;
- strukturierter `visaMode`: `visa_exempt`, `visa_on_arrival`, `electronic_visa`, `visa_before_travel`, `unknown`;
- eTA bleibt eigener Requirement-Typ;
- widersprüchliche `result ↔ visaMode`-Paare degradieren fail-closed.

### E2 – Official Actions

- `sourceUrl` = Evidence-/Informationsquelle;
- `application | form | appointment | information` als strukturierte Action-Zwecke;
- riskante Actions nur mit explizitem validem Purpose + HTTPS-URL;
- ungültige Action-Metadaten verändern keine Hard Truth.

### E3 – Visitor Checklist

Official Evaluations werden lossless im Scope

> **Traveller × Credential-Option × Destination/Transit × Requirement Type**

angezeigt, mit fail-closed Result-/Freshness-Copy, Credential-Auflösung, Authority, `checkedAt`, Source und purpose-spezifischen Actions.

### E4 – Official Temporal Rules

- provider-neutraler `relative_duration`-Contract;
- Anchors `trip_departure`, `destination_arrival`, `transit_arrival`, `border_crossing`;
- `before | at | after` + normalisierte Minuten;
- `availableFrom`;
- `dueBy` + `mandatory | recommended`;
- Timing nur aus expliziten strukturierten Official-Metadaten und nur auf trusted/current `required | conditional`;
- Duplicate-Timing-Konflikte und unmögliche Same-Anchor-Fenster fail-closed;
- unterschiedliche Anchors werden ohne konkrete Event-Timestamps nicht geraten.

### R1 – Workspace Integration / Deduplizierung

- Official Requirement Truth und User Readiness Truth bleiben getrennt;
- primäre Workspace-UI zeigt keine parallelen groben `entry_check`, `visa_check`, `travel_document_check`, `insurance_check`-Karten mehr neben Official Requirements;
- persistierte Legacy-Readiness-Items bleiben erhalten und unverändert;
- Ticket-/Booking-/Custom-Preparation bleiben sichtbar und bedienbar;
- sichtbare persönliche Counts zählen nur sichtbare persönliche Tasks;
- reine leere fail-closed Placeholder werden pro Traveller/Credential/Destination/Transit kompakt als **„Einreiseanforderungen noch nicht prüfbar“** dargestellt;
- current/stale/recheck/evidence-bearing/action/temporal/visa-spezifische Rows bleiben einzeln sichtbar;
- Multi-Traveller, Multi-Credential und Transit bleiben getrennt.

### E5-A – Exact Event-Instant Projection Core

E5-A ist jetzt **aktiv, aber noch nicht geliefert**.

Verbindliche Grenze:

- vorhandene E4-Temporal-Typen werden wiederverwendet;
- Event-Instant wird vom Aufrufer **explizit** mit Anchor + stabiler `eventRef`/Occurrence-Identität gebunden;
- nur echte absolute RFC3339-/ISO-Date-Time-Werte mit `Z` oder numerischem Offset sind projizierbar;
- gültige Offset-Instants werden deterministisch nach UTC normalisiert;
- `before | at | after` wird exakt gerechnet;
- `dueBy.semantics` und Event-Provenance bleiben erhalten;
- fehlende/ungültige Anchors bleiben fail-closed;
- nach absoluter Projektion invertierte Fenster (`availableFrom > dueBy`) bleiben ungültig;
- kein `Date.now()`-/Dringlichkeitsstatus in diesem Slice.

## 4. Fresh Duplicate-/Integration-Precheck für E5-A

Der Precheck vor #323 hat ausdrücklich vorhandene Zeitarchitektur gefunden und verhindert, dass eine zweite oder falsche Lösung gebaut wird.

### Wiederzuverwenden

- `lib/readiness/temporal.ts` ist die einzige E4-Relative-Rule-Domain;
- `lib/route/kontakte.ts` bewahrt Flug-/Routezeiten korrekt als zonenlose lokale Wanduhrzeiten;
- `lib/route/domain.ts` trägt strukturierte Route-/Transitzeitpunkte und `chronologieBewiesen`;
- `lib/safety/scope.ts` enthält bereits konservative fail-closed Semantik für zonenlose Date-/Clock-Werte gegen echte Instants;
- historische Timezone-Reviews #37/#38 dokumentieren verbindlich, dass lokale Flugzeiten nie still zu UTC-Instanten gemacht werden dürfen.

### Noch nicht vorhandene Wahrheit

Aktuell fehlt eine kanonische vollständige Schicht für:

- IANA-Zeitzone / belastbaren UTC-Offset pro konkretem Reiseereignis;
- eindeutige Trip-/Route-Occurrence-Bindung eines Temporal Anchors;
- konkrete Deadline-/Action-Window-Runtime;
- Travel-Companion Task-/Reminder-Runtime.

Besonders wichtig: Dieselbe Destination oder dasselbe Transitland kann mehrfach in einer Reise vorkommen. E5-A darf deshalb niemals per Country-Code, Arrayposition oder `first match` selbst ein Ereignis auswählen.

### Verbotene Abkürzung

Zonenlose Werte wie

`2026-09-12T18:00`

oder Date-only-Werte wie

`2026-09-12`

sind **keine** absoluten Instants und dürfen für eine konkrete Deadline nicht als UTC interpretiert werden. Kein künstliches `Z`, keine Maschinen-Zeitzone, keine Airport-/Place-Heuristik.

## 5. Traveller Truth

Kanonisches Invariant:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Account Registry = wiederverwendbare aktuelle Traveller-Fakten.  
Trip Snapshot = einzige Current Truth für die konkrete Reise.

Issuer Country ≠ Citizenship. Keine Residence→Nationality-Inferenz. Kein Default-/Primary-/Preferred-/Chosen-Pass und kein `documents[0]` / `evaluations[0]` als Product Truth.

E5-A ändert diese Truth nicht und rankt keine Credential-Option.

## 6. Verbindlicher Anti-Blind-Build-Precheck

Vor **jedem** neuen Jetnity-Slice gilt:

> **Audit first. Reuse before add. Integrate before duplicate. Live evidence before assumptions.**

Pflicht vor neuem Code oder neuem Agenten:

1. finalen `main`, CI/Vercel, offene PRs/Issues und aktive Agenten live prüfen;
2. prüfen, ob gleiche/ähnliche Funktion bereits vollständig oder teilweise existiert;
3. relevante Komponenten, Types, APIs, Tabellen, Utilities, Truth-Domänen und Provider-/Transport-Bausteine prüfen;
4. Architektur- und UX-Integration mit Trip Workspace, Account/Traveller, Admin, Provider, Security/Privacy und Mobile/PWA prüfen;
5. vorhandene Architektur wiederverwenden bzw. integrieren statt zweite Engine, zweite Statuslogik, zweite Tabelle oder zweite UI-Welt zu bauen;
6. Multi-Citizenship/Multi-Document, Auth/RLS/Ownership und Product Truth gegen Regressionen prüfen;
7. betroffene Tests und Invarianten bestimmen.

Bei Duplicate-/Integrations- oder Architekturkonflikt zuerst reconciliieren, dann bauen.

## 7. E5-A Hard Non-Scope / weiterhin nicht aktiv

E5-A implementiert **nicht**:

- Trip/Route → Event-Occurrence-Resolver;
- Country → Occurrence-Matching;
- Stage-/Segment-Auswahl für Temporal Anchors;
- IANA-Timezone-/UTC-Offset-Resolver;
- Airport-/Place-Zeitzonen-Inferenz;
- Anhängen von `Z` an lokale Flug-/Stage-Zeiten;
- Erweiterung von Requirements Provider Contract oder `OfficialEvaluation`-Scope;
- konkrete Workspace-Deadline-UI;
- `too early / upcoming / actionable now / overdue` State Machine;
- exact Official-Requirement Task-Persistenz;
- Travel-Companion Task-/Completion-State;
- Reminder-/Push-/E-Mail-/Notification-Runtime;
- Supabase-/Migration-/RLS-/Auth-/MFA-/AAL-Änderung;
- echten Requirements-/Visa-/Entry-Provider;
- Providerwahl / Vendorvertrag / DPA / Secrets / API Keys / paid calls;
- Credential-Ranking / automatische beste Pass-Auswahl;
- sensible Pass-/MRZ-/Scan-/Biometrie-/Gesundheitsdaten;
- E5-B oder einen anderen Folgeslice.

Provider-Aktivierung/Verträge/Secrets/paid calls, Production-Migrationen/RLS/Ownership, sensible Daten, Payments, > USD 100 monatliche neue Kosten, Public Launch und fundamentale Auth/MFA/AAL-Änderungen bleiben Product-Owner-Gates.

Supabase ist für E5-A nicht im Scope und wird nicht verändert.

## 8. Persistente Zielanker / andere Workstreams

Issue **#294 – Entry Requirements Detail Architecture** bleibt offen.

Kanonische Zielarchitektur:

`docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`

Issue **#323** ist der einzige aktuelle E5-A-Bauauftrag und startet keinen E5-B-Folgeslice.

TW-8 / TW-9 bleiben blockiert, solange keine reale belastbare Commercial Truth / Provider-Evidence vorhanden ist.

GitHub Hygiene Phase 1+2 ist abgeschlossen; Issue #266 ist geschlossen.

Historische offene Draft-PRs sind keine aktuelle Runtime-Wahrheit und dürfen nie blind als aktiver Stand interpretiert werden.

## 9. GitHub Governance

Ruleset `Jetnity main protection` / ID `21875372` bleibt bindend:

- PR erforderlich;
- Branch up to date;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass leer.

Bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId`: ausschließlich identischer non-draft Recovery-PR nach TL Exact-Head-PASS und mit eigenen Gates. Schutzregeln niemals lockern.

Agent-Self-Review ist kein TL-PASS. Jeder Push nach einem PASS invalidiert den PASS.

## 10. Nächste Aktion

1. Draft-PR für Issue #323 eröffnen;
2. Cursor-Agent **`Jetnity entry requirements temporal projection 1`**, Generation 1, gegen den Binding Task starten;
3. Agent implementiert nur E5-A und stoppt nach Delivery;
4. Technical Lead prüft den exakten finalen Head unabhängig;
5. bei `CHANGES REQUIRED` korrigiert dieselbe Agenten-Session und wird vollständig neu gegatet;
6. kein Folgeslice automatisch.

**Live-Evidence gewinnt immer.**
