# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / ENTRY REQUIREMENTS E4 CLOSED / NO ACTIVE CURSOR RUNTIME SLICE / LIVE-EVIDENCE GEWINNT**

## 1. Verifizierter aktueller Runtime-Stand

Entry Requirements E4 ist vollständig abgeschlossen.

Verifizierter Runtime-Main:

`main@08fe34c9a170262912ac0252d2272d49585f4cdf`

Post-Merge-Evidence:

- Issue **#315 CLOSED / completed**;
- final unabhängig geprüfter E4-Head `86b568d2863b6abc9abacc1bd482bfb45e8884f3`;
- Draft-PR **#316 CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED** nur wegen `Repository.fullDatabaseId`;
- Recovery-PR **#317 MERGED**;
- Recovery-CI **#1465 / Run `33382654747`: SUCCESS**;
- Main-CI **#1466 / Run `33382895693`: SUCCESS** exakt auf `08fe34c9...`;
- Vercel Production **`dpl_AyDTo4xTWQEn5F3TBY4bzr5XS5FY`: READY** exakt auf `08fe34c9...`.

Aktuellster Closure-Checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E4_CLOSED_2026-08-31.md`

## 2. Aktiver Slice / Agent

Es läuft derzeit **kein neuer Cursor-Runtime-Slice**.

Letzter Agent:

**`Jetnity entry requirements temporal rules 1`**  
Generation: **1**  
Session: `bc-69084bbc-a7ab-4ed5-8418-754bea9ee241`  
Status: **STOPPED / DELIVERY COMPLETE / TL PASS / E4 MERGED**.

Kein E5, Provider-, Timestamp-Projektions- oder Reminder-Slice wurde automatisch gestartet.

## 3. Entry Requirements aktueller provider-neutraler Stand

### S4-R1 Truth-Ops

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
- `application | form | appointment | information` strukturierte Action-Zwecke;
- riskante Actions nur mit explizitem validem Purpose + HTTPS-URL;
- ungültige Action-Metadaten verändern keine Hard Truth.

### E3 – Visitor Checklist

Official Evaluations werden lossless pro

> **Traveller × Credential-Option × Destination/Transit × Requirement Type**

angezeigt, mit fail-closed Result-/Freshness-Copy, Credential-Auflösung, Authority, `checkedAt`, Source und purpose-spezifischen Actions.

### E4 – Official Temporal Rules

- provider-neutraler `relative_duration`-Contract;
- Anchors `trip_departure`, `destination_arrival`, `transit_arrival`, `border_crossing`;
- `before | at | after` + normalisierte Minuten;
- `availableFrom`;
- `dueBy` + `mandatory | recommended`;
- Timing nur aus expliziten strukturierten Official-Metadaten;
- Timing nur auf trusted/current `required | conditional`;
- malformed/unsupported Timing fällt weg, ohne gültige Requirement-Hard-Truth zu zerstören;
- Duplicate-Timing-Konflikte fail-closed/permutationsstabil;
- unmögliche Same-Anchor-Fenster werden verworfen;
- verschiedene Anchors werden ohne konkrete Event-Timestamps nicht künstlich geordnet;
- relative Besucher-Copy ohne erfundene konkrete Kalenderzeit.

## 4. Traveller Truth

Kanonisches Invariant:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Account Registry = wiederverwendbare aktuelle Traveller-Fakten.  
Trip Snapshot = einzige Current Truth für die konkrete Reise.

Issuer Country ≠ Citizenship. Keine Residence→Nationality-Inferenz. Kein Default-Pass und kein `documents[0]` / `evaluations[0]` als Product Truth.

## 5. Weiterhin nicht aktiv / Product-Owner-Gates

Weiterhin **nicht** aktiviert:

- echter Requirements-/Visa-/Entry-Provider;
- Providerwahl / Vendorvertrag / DPA;
- Secrets / API Keys / paid calls;
- konkrete Deadline-/Timestamp-Projektion aus Trip-/Route-Events;
- Zeitzonen-/DST-Auflösung;
- Travel-Companion Task-/Completion-State;
- Reminder-/Push-/E-Mail-/Notification-Runtime;
- Credential-Ranking / automatische beste Pass-Auswahl;
- sensible Pass-/MRZ-/Scan-/Biometrie-/Gesundheitsdaten.

Provider-Aktivierung/Verträge/Secrets/paid calls, Production-Migrationen/RLS/Ownership, sensitive Daten, Payments, > USD 100 monatliche neue Kosten, Public Launch und fundamentale Auth/MFA/AAL-Änderungen bleiben Product-Owner-Gates.

## 6. Persistenter Zielanker

Issue **#294 – Entry Requirements Detail Architecture** bleibt offen.

Kanonische Zielarchitektur:

`docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`

E1–E4 sind Teilumsetzungen. Konkrete Event-Instant-Projektion, Recalculation, Task-State und Notifications benötigen neue bounded Slices nach frischem Precheck.

## 7. Andere relevante Grenzen

- TW-8 / TW-9 bleiben blockiert, solange keine belastbare reale Commercial Truth / Provider-Evidence vorhanden ist.
- GitHub Hygiene Phase 1+2 ist abgeschlossen; Issue #266 ist geschlossen.
- Historische offene Draft-PRs sind keine aktuelle Runtime-Wahrheit; live verifizieren.
- Supabase wurde durch E1–E4 nicht verändert. Vor DB-/RLS-/Storage-/Security-/Migration-Scope live neu prüfen und Drift reconciliieren.

## 8. GitHub Governance

Ruleset `Jetnity main protection` / ID `21875372` bleibt bindend:

- PR erforderlich;
- Branch up to date;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass leer.

Bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId` wird ausschließlich durch identischen non-draft Recovery-PR mit eigenen Gates behandelt. Schutzregeln werden nicht gelockert.

## 9. FIRST NEXT ACTION

**Kein Folgeslice ist automatisch freigegeben.**

Vor dem nächsten Slice:

1. finalen `main`, offene PRs/Issues, CI/Vercel und Agentenstatus live prüfen;
2. Issue #294 + Entry-/Travel-Companion-Zielarchitektur gegen den Ist-Code lesen;
3. Build-Order-/Produktabhängigkeiten und Truth-Grenzen live abgleichen;
4. nur den kleinsten verantwortbaren bounded Slice definieren;
5. besondere Product-Owner-Gates respektieren;
6. Supabase nur bei relevantem Scope live prüfen.

**Live-Evidence gewinnt immer.**
