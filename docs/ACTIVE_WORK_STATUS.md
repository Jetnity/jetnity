# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / READINESS WORKSPACE INTEGRATION R1 ACTIVE / LIVE-EVIDENCE GEWINNT**

## 1. Verifizierter Baseline-Main

`main@32332d850784b586cc4173463a1e77e1ba27baf0`

Verifiziert vor R1:

- E4 Runtime + Continuity vollständig geschlossen;
- Main-CI **#1468 / Run `33386617964`: SUCCESS** exakt auf `32332d85...`;
- Vercel Production **`dpl_AqVShznQxXGARj18cJJwyj4nCXb3`: READY** exakt auf `32332d85...`;
- keine konkurrierende aktuelle Runtime-PR; nur historische Drafts #52, #50, #40, #39, #28;
- Issue #294 bleibt der Entry-Requirements-/Travel-Companion-Zieltracker.

Aktuellster Closure-Checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E4_CLOSED_2026-08-31.md`

## 2. Aktiver Slice

Issue:

**#319 – Readiness Workspace Integration R1 – deduplicate official and personal readiness presentation**

Branch:

`feat/readiness-workspace-integration-r1-2026-08-31`

Binding Task:

`docs/READINESS_WORKSPACE_INTEGRATION_R1_TASK_2026-08-31.md`

Ziel:

Die bereits vorhandene Official Requirement Truth und User Readiness Truth bleiben fachlich getrennt, werden im Workspace aber nicht länger als zwei redundante Kartenwelten dargestellt.

## 3. Duplicate-/Integration-Precheck – verbindlicher Befund

Bereits vorhanden und wiederzuverwenden:

- `OfficialEvaluation[]` + E1–E4 = kanonische Official Requirement Truth;
- `trip_readiness_items` / `ReadinessViewItem` = getrennte User Readiness Truth;
- `officialChecklist()` = credential-spezifische Requirements-Darstellung;
- `readinessAnsicht()` = bestehende Readiness-Domainquelle;
- TW-4 Attention nutzt beide Wahrheiten bereits getrennt.

Gefundene Doppelung:

`Reisevorbereitung.tsx` rendert nach der Official Checklist zusätzlich grobe Derived Cards für `entry_check`, `visa_check`, `travel_document_check` und `insurance_check`. Dadurch erscheinen Einreise/Visum/Dokument/Pflichtversicherung doppelt.

Zusätzlich erzeugt die Engine ohne Provider/für fehlende Fakten bewusst fail-closed Placeholder für alle Requirement Types. R1 darf nur **reine leere Placeholder** in der UI kompakt zusammenfassen; konkrete/current/stale/recheck/evidence-bearing Rows bleiben lossless sichtbar.

## 4. Binding Truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Official Scope:

> **Traveller × Credential-Option × Destination/Transit × Requirement Type**

Kein grober User-Status darf auf mehrere Credential-Optionen oder mehrere Requirement Types projiziert werden. User Completion bleibt User Evidence und verändert Official Truth nie.

## 5. R1 Scope

- grobe `entry_check` / `visa_check` / `travel_document_check` / `insurance_check` Karten nicht zusätzlich in der primären Workspace-UI rendern;
- bestehende Persistenzobjekte nicht löschen oder mutieren;
- Ticket-/Booking-/Custom-Preparation-Tasks sichtbar und bedienbar lassen;
- sichtbare persönliche Counts nur aus sichtbar gerenderten persönlichen Tasks ableiten;
- pure fail-closed Placeholder pro Traveller/Credential/Destination/Transit kompakt darstellen;
- konkrete/current/stale/recheck/evidence-bearing Official Rows nicht verstecken;
- keine irreführenden `Erledigt`/`Nicht relevant` Controls neben ungeprüfter grober Visa-/Einreise-Truth;
- keine globale Änderung von `readinessAnsicht()` oder TW-4 Attention ohne zwingenden Nachweis.

## 6. Hard Non-Scope

- keine Supabase-/Migration-/RLS-/Auth-/AAL-Änderung;
- kein exact Official-Requirement Task-Persistenzmodell;
- kein Provider / Secrets / paid calls;
- keine konkrete Deadline-/Timestamp-Projektion;
- keine Reminder-/Notification-Runtime;
- kein Credential-Ranking;
- kein E5.

## 7. Agent

Exakter Anzeigename:

**`Jetnity readiness workspace integration 1`**  
Generation: **1**  
Session: **PENDING DISPATCH**

Agent darf `docs/ACTIVE_WORK_STATUS.md` nicht ändern. Self-Review ist kein TL-PASS. Bei `CHANGES REQUIRED` bleibt dieselbe Session zuständig.

## 8. Governance

Ruleset `Jetnity main protection` / ID `21875372` bleibt bindend: PR, up-to-date, Conversation Resolution, CI/Auth/Vercel, merge-only, bypass leer.

Bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId`: nur identischer non-draft Recovery-PR nach TL-PASS; Schutzregeln niemals lockern.

## 9. Nächste Aktion

1. Draft-PR eröffnen;
2. Cursor-Agent `Jetnity readiness workspace integration 1` Generation 1 anstoßen;
3. Agent liefert und stoppt;
4. TL reviewt den exakten finalen Head unabhängig;
5. kein Folgeslice automatisch.

**Live-Evidence gewinnt immer.**
