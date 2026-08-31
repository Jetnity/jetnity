# Jetnity – Readiness Workspace Integration R1 Task

Stand: 31. August 2026  
Status: **BINDING RUNTIME TASK / DUPLICATE- & INTEGRATION-PRECHECK COMPLETED**

## 1. Baseline

Start exakt von:

`main@32332d850784b586cc4173463a1e77e1ba27baf0`

Verifiziert vor Start:

- Main-CI #1468 / Run `33386617964`: SUCCESS;
- Vercel Production `dpl_AqVShznQxXGARj18cJJwyj4nCXb3`: READY exakt auf `32332d85...`;
- keine konkurrierende aktuelle Runtime-PR;
- E1–E4 geschlossen;
- Issue #319 ist der bounded Tracker dieses Slices.

## 2. Warum dieser Slice existiert

Die aktuelle Workspace-UI zeigt zwei fachlich verschiedene Wahrheiten als zwei fast gleiche Kartenwelten:

1. `OfficialEvaluation[]` / E1–E4 als kanonische Official Requirement Truth;
2. grobe User-Readiness Derived Checks (`entry_check`, `visa_check`, `travel_document_check`, `insurance_check`) mit `open/done/skipped`.

Beides ist intern sinnvoll getrennt. Die aktuelle Präsentation ist aber redundant und kann Nutzer irreführen, weil z. B. `Visum` als Official Requirement und nochmals als grobe User-Task erscheint.

Zusätzlich rendert die E3/E4-Checklist bei komplett fehlender Provider-/Context-Truth die gesamte fail-closed Placeholder-Matrix einzeln. Das ist technisch sicher, aber als Übersicht unnötig lang.

## 3. Verbindliche Truth-Grenzen

- Official Requirement Truth und User Readiness Truth bleiben getrennt.
- Kein User-Häkchen ändert Official Truth.
- Kein grober User-Status darf auf mehrere Credential-Optionen oder mehrere Requirement Types projiziert werden.
- Official Scope bleibt:

> **Traveller × Credential-Option × Destination/Transit × Requirement Type**

- Kein Default-/Primary-/Preferred-/Chosen-Pass.
- Issuer Country ≠ Citizenship.
- Keine `documents[0]` / `evaluations[0]` Product Truth.

## 4. R1 Runtime Scope

### A. Doppelte grobe Entry-/Visa-/Document-/Insurance-Karten aus der primären Besucheransicht entfernen

In `Reisevorbereitung` sind Official Requirements die einzige sichtbare Quelle für regulatorischen Einreise-/Visa-/Dokument-/Pflichtversicherungs-Inhalt.

Nicht mehr zusätzlich als parallele Karten rendern:

- `entry_check`
- `visa_check`
- `travel_document_check`
- `insurance_check`

Wichtig:

- Domain-/Persistenzobjekte nicht löschen;
- vorhandene persistierte User-Statusdaten nicht migrieren, umdeuten oder verwerfen;
- `readinessAnsicht()` und TW-4 Attention nicht global auf diesen UI-Filter umstellen;
- der Filter ist Presentation-/Workspace-spezifisch.

### B. Persönliche nicht-duplizierende Vorbereitung sichtbar halten

Weiterhin nutzbar und mit User-Status steuerbar:

- `ticket_confirmation_check`
- `booking_confirmation_check`
- benutzerdefinierte `preparation`-Items.

Die im Workspace sichtbaren persönlichen Counts müssen exakt zu den sichtbar gerenderten persönlichen Items passen. Versteckte Legacy-Duplicate-Items dürfen die sichtbaren Counts nicht aufblasen.

### C. Pure fail-closed Placeholder-Matrix kompakt darstellen

Nur echte leere Placeholder-Evaluations dürfen kollabiert werden.

Ein Placeholder darf nur als solcher gelten, wenn mindestens alle folgenden Grenzen erfüllt sind:

- `result === 'unknown'`;
- nicht trusted/current;
- keine belastbare Authority/Source/checkedAt/Rule Reference, die eine konkrete frühere/aktuelle Requirement-Zeile repräsentiert;
- keine Official Action;
- keine Temporal Rule;
- keine konkrete Visa-Ausprägung außer `unknown`;
- kein Requirement-spezifischer Zustand, der separat sichtbar bleiben muss.

Pure Placeholder derselben fachlichen Scope-Basis werden kompakt zusammengefasst mindestens nach:

- travellerClientRef;
- credentialOptionRef;
- destinationCountryCode;
- transitCountryCode.

Beispiel:

`Einreiseanforderungen noch nicht prüfbar`

Darunter nur die relevante fail-closed Begründung, z. B. fehlende Staatsangehörigkeit / automatische Prüfung derzeit nicht verfügbar.

### D. Losslessness-Regel

Folgende Official Rows dürfen **nicht** durch Placeholder-Kollaps verschwinden:

- `status/current + freshness/current`;
- stale / recheck_needed;
- source_temporarily_unavailable, sofern die Zeile konkrete Evidence trägt;
- konkrete Authority/Source/checkedAt/Rule Reference;
- konkrete Action;
- konkrete Temporal Rule;
- konkrete Visa-/Requirement-Semantik.

Bei gemischtem Scope: konkrete Rows einzeln zeigen, nur die verbleibenden reinen Placeholder kompakt zusammenfassen.

### E. Keine irreführenden User-Aktionen

Wenn Official Truth unknown/unavailable ist, darf daneben keine grobe Visa-/Einreise-Karte mit `Erledigt` oder `Nicht relevant` suggerieren, der Nutzer könne die regulatorische Lage wegklicken.

R1 baut **noch kein** credential-/requirement-genaues Completion-Persistenzmodell.

## 5. Integration mit bestehenden Funktionen

Wiederverwenden, nicht duplizieren:

- `officialChecklist()` / `lib/readiness/official-presentation.ts`;
- `readinessAnsicht()` als Domainquelle;
- bestehende `OfficialEvaluation`-Truth;
- E1–E4 Labels/Actions/Temporal Copy;
- vorhandene Traveller-/Credential-Auflösung;
- bestehende User-Readiness-Callbacks für nicht-duplizierende persönliche Tasks.

Nicht verändern ohne zwingenden Nachweis:

- Requirements Engine Truth;
- `trip_readiness_items` Datenmodell;
- Guest/Account Trip-Form;
- TW-4 Attention-Orchestrierung;
- Auth/RLS/Supabase.

## 6. Tests – Mindestumfang

Mindestens Regressionen für:

1. ein Traveller / ein Ziel / kein Provider → keine 15+ einzelnen Placeholder-Karten;
2. fehlende Staatsangehörigkeit → ein kompakter blocked Scope statt eTA/Entry Form/Health/etc. Wiederholung;
3. aktuelle konkrete Visa-Requirement bleibt einzeln sichtbar;
4. aktuelle Visa + restliche pure Placeholder → Visa einzeln + höchstens ein kompakter Placeholder-Block;
5. stale/recheck/evidence-bearing Row bleibt einzeln sichtbar;
6. zwei Traveller bleiben getrennt;
7. zwei Credential-Optionen bleiben getrennt;
8. Transit-Scope bleibt getrennt;
9. keine groben `entry_check`/`visa_check`/`travel_document_check`/`insurance_check` Cards im primären Workspace;
10. Ticket-/Booking-/Custom-Preparation bleiben sichtbar und bedienbar;
11. sichtbare persönliche Counts entsprechen sichtbaren persönlichen Items;
12. persistierte Legacy-Duplicate-Items bleiben im Domain-Result erhalten und werden nicht gelöscht;
13. E1–E4 Truth-/Freshness-/Action-/Temporal-Invarianten bleiben grün.

## 7. Hard Non-Scope

- keine Migration / Supabase / RLS / Ownership;
- kein neuer Task-Persistenzvertrag für konkrete Official Requirements;
- kein Provider / Vertrag / Secrets / paid calls;
- keine Deadline-Timestamp-Projektion;
- keine Reminder-/Push-/E-Mail-Runtime;
- kein Credential-Ranking;
- keine neue Engine;
- kein E5/Folgeslice automatisch.

## 8. Agentenregeln

- Agent ändert `docs/ACTIVE_WORK_STATUS.md` nicht.
- Self-Review ist kein TL-PASS.
- Bei `CHANGES REQUIRED` muss dieselbe Session korrigieren.
- Kein Ready, kein Merge, kein Folgeslice.
- Handoff + adversarial Self-Review verpflichtend.
- Typecheck + Lint + vollständige Tests + Production Build verpflichtend.

## 9. Definition of Done

R1 ist erst abgeschlossen, wenn der Workspace für einen normalen Nutzer **eine** verständliche Einreise-/Requirements-Oberfläche zeigt, ohne die beiden bestehenden Wahrheiten fachlich zu vermischen und ohne bestehende Daten zu zerstören.

**Live-Evidence gewinnt immer.**
