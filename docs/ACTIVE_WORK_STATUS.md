# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / ENTRY REQUIREMENTS E3 VISITOR CHECKLIST ACTIVE / LIVE-EVIDENCE GEWINNT**

## 1. Verifizierter Main-Stand vor E3

Aktueller Baseline-Head:

`main@25f0af9ab92f0757ea7e4bc6c42c2fbbb01c45f5`

Post-Merge-Evidence für Entry Requirements E2:

- Merge über non-draft Recovery-PR **#310** nach bekanntem Draft→Ready-Connectorfehler;
- finaler geprüfter E2-Head: `74ae756e2cd3401e7aa2499d1d3869c94fa6a433`;
- Merge-SHA: `25f0af9ab92f0757ea7e4bc6c42c2fbbb01c45f5`;
- Main-CI **#1451 / Run `33372358737`: SUCCESS** exakt auf diesem SHA;
- Vercel Production: **SUCCESS** exakt auf diesem SHA;
- Issue **#306 CLOSED / completed**;
- Draft-PR #307 CLOSED / NOT MERGED / mechanisch superseded wegen `Repository.fullDatabaseId` beim Draft→Ready-Connectorweg.

GitHub Hygiene Phase 1+2 ist ebenfalls abgeschlossen; Issue **#266 CLOSED / completed**. Exakt 15 manifestierte DELETE-SAFE-MERGED Remote-Refs wurden in Phase 2 nach Einzel-Revalidation entfernt; Restore-SHAs bleiben im Repository dokumentiert.

## 2. Aktiver Slice

Issue: **#311 – Entry Requirements E3 – traveller/credential official checklist presentation**

Branch:

`feat/entry-requirements-checklist-e3-2026-08-31`

Binding Task:

`docs/ENTRY_REQUIREMENTS_VISITOR_CHECKLIST_E3_TASK_2026-08-31.md`

TL-Setup-Commit nach Task-Anlage:

`83a21a13c46155f293f74831ddb34f73c0e91bd2`

E3-Ziel:

Die bereits sichere E1/E2 Official Requirements Truth wird in `Reisevorbereitung` als konkrete, verständliche Checkliste pro **Traveller × Credential-Option × Destination/Transit × Requirement Type** dargestellt. Keine neue Requirements-Wahrheit, kein Provider, keine Deadline-Runtime.

## 3. Binding E3 Truth

Weiterhin unverändert:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Verboten:

- Default-/Primary-/Preferred-/Chosen-Pass oder -Citizenship;
- `documents[0]` / `evaluations[0]` als Product Truth;
- Issuer Country als Citizenship behandeln;
- credential-übergreifende Zusammenlegung;
- stale/unavailable/unknown als `not_required` darstellen;
- Gebühren, Aufenthaltsdauer, freie Seitenzahl, Proof-of-Funds-Betrag oder Deadline aus unstrukturierten Daten erfinden.

E2 bleibt bindend:

- `sourceUrl` ist Evidence-/Informationsquelle;
- application/form/appointment nur aus explizitem gültigem Purpose + validierter Action-URL;
- `officialActionZweckText(...)` bestimmt Besucherlabel;
- `requirementsProviderAus()` bleibt `null`.

## 4. E3 Scope

- konkrete OfficialEvaluation-Zeilen/-Karten statt nur Traveller-Summary;
- priorisierte Besuchergruppen wie `Vor Abreise erledigen`, `Dokument prüfen`, `Bei Einreise / vor Ort`, `Bei Einreise / Reise nachweisen`, `Route / Transit`;
- Visa-Modi/eTA/Requirement-Typen verständlich beschriften;
- Credential-Option aus exakten Trip-/Traveller-Daten menschenlesbar darstellen;
- fail-closed Result/Freshness/Missing-Facts/Authority/checkedAt/Source/Action-Presentation;
- purpose-spezifische Official Actions;
- kleine scope-nahe Accessibility-/Responsive-Verbesserungen;
- Tests + Typecheck + Lint + Production Build.

## 5. Hard Non-Scope / Product-Owner-Gates

E3 aktiviert **nicht**:

- echten Requirements-/Visa-/Entry-Provider;
- Providerwahl / Vertrag / DPA / Secrets / API Keys / paid calls;
- Supabase-/Migration-/RLS-/Ownership-/Auth-/AAL-Änderung;
- Passnummer/MRZ/Scans/Biometrie/Gesundheitsakte;
- Credential-Ranking oder automatische „beste Pass“-Auswahl;
- Deadline-/Reminder-/Notification-Runtime;
- Gebühren-/Stay-/Threshold-/Deadline-Hard-Truth-Felder;
- E4.

Die bestehenden Product-Owner-Gates bleiben unverändert bindend.

## 6. Agent

Geplanter Anzeigename:

**`Jetnity entry requirements checklist 1`**  
Generation: **1**  
Session: **PENDING DISPATCH**

Agent darf `docs/ACTIVE_WORK_STATUS.md` nicht ändern. Self-Review ist kein TL-PASS. Bei `CHANGES REQUIRED` bleibt dieselbe Session zuständig.

## 7. GitHub Governance

Ruleset `Jetnity main protection` / ID `21875372` bleibt maßgeblich:

- PR vor Merge;
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

E3 ist nicht migrationsnah und verändert Supabase nicht. Der letzte bekannte Requirements-Gate-0-Supabase-Stand bleibt nur historische Evidence und wird vor jedem DB-/RLS-/Storage-/Security-Slice live neu geprüft.

## 9. Persistenter Architektur-Tracker

Issue **#294 – Entry Requirements Detail Architecture** bleibt offen als Product-Target-Tracker. E3 erfüllt nur den Besucher-Checklist-Presentation-Teil der Zielarchitektur. Detailfelder für Gebühren/Aufenthaltsdauer/Schwellenwerte und Travel-Companion-/Deadline-Runtime bleiben spätere, separat zu precheckende Slices.

## 10. Nächste Aktion

1. Draft-PR für E3 auf aktuellem Branch eröffnen;
2. neuen Cursor-Agenten Generation 1 dispatchen;
3. Agent liefert und stoppt;
4. Technical Lead reviewt den exakten finalen Head unabhängig;
5. kein E4 automatisch starten.

**Live-Evidence gewinnt immer.**
