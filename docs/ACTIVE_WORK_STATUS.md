# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / ENTRY REQUIREMENTS E4 TEMPORAL RULES ACTIVE / LIVE-EVIDENCE GEWINNT**

## 1. Verifizierter Main-Stand vor E4

Baseline:

`main@1937e32abad11678386d723973bc770210d17ff1`

Verifiziert beim E4-Precheck:

- Main-CI **#1458 / Run `33376346428`: SUCCESS** exakt auf `1937e32a...`;
- Vercel Production **`dpl_6QVdYiCrCnegJGbgeWXeXnyeHLKL`: READY** exakt auf `1937e32a...`;
- Ruleset **`Jetnity main protection` / ID `21875372`: active**, PR + strict required checks + merge-only, bypass leer;
- keine konkurrierende aktuelle Runtime-PR; offene PRs sind historische Drafts #52, #50, #40, #39, #28;
- Issue #294 bleibt persistenter Entry-Requirements-/Travel-Companion-Zieltracker.

Entry Requirements E3 ist geschlossen. Aktuellster Closure-Checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E3_CLOSED_2026-08-31.md`

## 2. Aktiver Slice

Issue:

**#315 – Entry Requirements E4 – official temporal-rule contract (no reminder runtime)**

Branch:

`feat/entry-requirements-temporal-rules-e4-2026-08-31`

Binding Task:

`docs/ENTRY_REQUIREMENTS_TEMPORAL_RULES_E4_TASK_2026-08-31.md`

E4-Ziel:

Provider-neutrale, fail-closed relative Official Temporal Rules für Zeitfenster wie **„ab 72 Stunden vor Ankunft“**, ohne schon konkrete Trip-Timestamps, Tasks oder Notifications zu erzeugen.

## 3. Binding E4 Truth

Unverändert kanonisch:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Official Evaluation Scope:

> **Traveller × Credential-Option × Destination/Transit × Requirement Type**

E4 darf Timing ausschließlich aus expliziter strukturierter Official Provider Evidence übernehmen.

Verboten:

- Default-/Primary-/Preferred-/Chosen-Pass oder -Citizenship;
- `documents[0]` / `evaluations[0]` als Product Truth;
- Issuer Country als Citizenship;
- Timing aus URL, freiem Text, Requirement-Typ, LLM oder Browser;
- `OfficialEvidence.validFrom/validUntil` als Action-Fenster/Deadline missbrauchen;
- stale/unavailable/unknown Timing als aktuelle Handlungswahrheit darstellen.

## 4. E4 Scope

- `relative_duration` Temporal-Rule-Contract;
- geschlossene Anchor-Semantik mindestens `trip_departure`, `destination_arrival`, `transit_arrival`, `border_crossing`;
- `before | at | after` + normalisierte Minuten;
- `availableFrom`;
- `dueBy` mit explizit `mandatory | recommended`;
- fail-closed Parser/Normalization;
- nur current/trusted `required | conditional` darf Timing tragen;
- Duplicate-Timing-Konflikte dürfen keine First-Row-Wins-Semantik erzeugen;
- relative, rein contract-basierte Besucher-Copy in der E3-Checkliste;
- Tests + Typecheck + Lint + Production Build.

## 5. Hard Non-Scope / Product-Owner-Gates

E4 aktiviert **nicht**:

- echten Requirements-/Visa-/Entry-Provider;
- Vendorwahl / Vertrag / DPA / Secrets / API Keys / paid calls;
- `requirementsProviderAus()` – bleibt `null`;
- konkrete Deadline-/Timestamp-Projektion aus Trip/Route;
- Zeitzonen-/DST-Auflösung konkreter Reiseereignisse;
- Calendar-day-/lokale-Uhrzeit-Regeln;
- Task-/Completion-State-Machine;
- Reminder-/Push-/E-Mail-/Notification-Runtime;
- Supabase / Migration / RLS / Ownership / Auth / Session / MFA / AAL;
- Passnummer/MRZ/Scans/Biometrie/Gesundheitsakte;
- Gebühren / Aufenthaltsdauer / konkrete freie Seitenzahl / Proof-of-Funds-Betrag;
- Credential-Ranking / automatische Passauswahl;
- E5.

Bestehende besondere Product-Owner-Gates bleiben vollständig bindend.

## 6. Agent

Exakter logischer Anzeigename:

**`Jetnity entry requirements temporal rules 1`**  
Generation: **1**  
Session: **PENDING DISPATCH**

Agent darf `docs/ACTIVE_WORK_STATUS.md` nicht ändern. Self-Review ist kein TL-PASS. Bei `CHANGES REQUIRED` bleibt dieselbe Session zuständig.

## 7. GitHub Governance

Ruleset `Jetnity main protection` / ID `21875372`:

- PR erforderlich;
- Branch up to date;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass leer.

Bekannter Draft→Ready-Connectorfehler: `Repository.fullDatabaseId`.

Falls er erneut auftritt:

1. Draft-PR bleibt Evidence-Träger für Agent/TL-Review;
2. nach TL-PASS mechanischer non-draft Recovery-PR auf exakt demselben Commit;
3. Recovery-PR bekommt eigene CI/Vercel/Mergeability/Thread-Gates;
4. Branch Protection wird nicht gelockert.

## 8. Supabase Boundary

E4 ist nicht DB-/RLS-/Storage-/Security-/Migration-nah und verändert Supabase nicht. Deshalb wurde Supabase für diesen Slice nicht mutiert. Vor einem späteren entsprechenden Scope live neu prüfen/reconciliieren.

## 9. Persistenter Zielanker

Issue **#294 – Entry Requirements Detail Architecture** bleibt offen.

Kanonische Zielarchitektur:

`docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`

E4 erfüllt nur die provider-neutrale Relative-Duration-Temporal-Foundation. Konkrete Deadline-Projektion, Task-State, Recalculation und Notifications bleiben separate spätere Slices nach neuem Precheck.

## 10. Nächste Aktion

1. Draft-PR für E4 eröffnen;
2. Cursor-Agent **`Jetnity entry requirements temporal rules 1`** Generation 1 im PR mit `@cursor` anstoßen;
3. Agent liefert und stoppt;
4. Technical Lead reviewt den exakten finalen Head unabhängig;
5. kein E5 automatisch starten.

**Live-Evidence gewinnt immer.**
