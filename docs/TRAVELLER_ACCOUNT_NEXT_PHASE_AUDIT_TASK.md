# Jetnity – Traveller / Account Next-Phase Dependency Audit – Task

Stand: 26. August 2026  
Agent: **`Account plattform audit vorbereitung`**  
Branch: `audit/traveller-account-next-phase`  
Baseline: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Typ: **AUDIT / EVIDENCE / ARCHITECTURE PREPARATION ONLY**

## 1. Ziel

Foundation E sowie Account AP-1 bis AP-3 sind integriert. Die verbindliche Build-Reihenfolge verlangt vor AP-4 bis AP-12 die produktweite Vervollständigung des Traveller-/Pass-/Multi-Citizenship-Modells.

Dieser Audit bestimmt präzise:

- wo das kanonische Modell bereits korrekt genutzt wird;
- wo noch Single-Citizenship-, Single-Document- oder Default-Pass-Annahmen existieren;
- welche Account-/Traveller-Registry-/Lifecycle-Lücken real sind;
- welcher **kleinste nächste Runtime-Slice** produktlogisch korrekt wäre;
- welche Shared-Contract-Entscheidungen vorher TL-/PO-gesteuert geklärt werden müssen.

Keine Runtime in diesem Audit.

## 2. Pflichtlektüre / Live-Verifikation

Lies mindestens vollständig:

- `JETNITY_START_HERE.md`
- `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- Account Audit / Target Architecture / Implementation Plan / AP-1/AP-2/AP-3 Tasks, Status, Handoffs und ADRs;
- Foundation-E-/Traveller-Context-ADRs, Migrationen und Tests;
- relevante Readiness-/Entry-/Transit-/Trip-/Account-Flächen.

Danach live prüfen:

- `main`, Branch, Draft-PR, Merge-Base, Ahead/Behind;
- offene parallele PRs;
- tatsächliche DB-/Type-/UI-/Service-Strukturen für Traveller, Citizenship, Documents/Credentials;
- relevante RLS-/Ownership-Grenzen nur lesend;
- Tests und ihre Annahmen;
- Actions/Vercel/Review-Threads.

**Nicht `docs/ACTIVE_WORK_STATUS.md` ändern.**

## 3. Kanonisches Produktmodell

Unverändert verbindlich:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Kein Default-Pass. Ausstellerland ist nicht automatisch Staatsbürgerschaft. `insufficient_context`/`unknown` bleiben ehrlich, wenn notwendige Evidence fehlt.

Neue Speicherung von Passscans, MRZ, Biometrie oder ähnlich sensitiven Dokumentdaten ist **nicht** Teil dieses Audits und bleibt ein besonderes Product-Owner-Gate.

## 4. Audit-Matrix

Prüfe mindestens diese Ebenen:

### A. Datenmodell / Ownership

- Welche Tabellen/Typen repräsentieren Traveller, Citizenship, Document/Credential heute wirklich?
- Trip-scoped vs account-scoped: was ist aktuelle Wahrheit, was Legacy, was geplant?
- Wie werden mehrere Staatsbürgerschaften und mehrere Dokumentoptionen abgebildet?
- Gibt es Stellen, die Issuer/Citizenship verwechseln?
- Welche RLS-/Ownership-/Delete-Lifecycle-Annahmen sind kritisch?

### B. Account UX / Registry

- Welche Traveller-Flächen existieren bereits?
- Gibt es eine Account-Traveller-Registry oder nur trip-scoped Daten?
- Wie würde ein Nutzer mehrere Personen, Staatsbürgerschaften und Dokumentoptionen verwalten, ohne sensible Daten unnötig zu speichern?
- Welche AP-Slices hängen daran?

### C. Produktweite Konsumenten

Mindestens prüfen:

- Trip Create / Planner;
- Readiness / Einreise;
- Route / Transit;
- Safety soweit traveller-kontextuell;
- Account / Reiseprofil;
- Guest→Account;
- Commercial-/Provider-Handoffs, sofern heute überhaupt vorhanden.

Finde jede relevante Stelle, die still genau eine Citizenship / einen Pass / ein Dokument voraussetzt.

### D. Lifecycle / Privacy

- Create, edit, archive/remove, detach, delete account/trip;
- Data minimization;
- welche Felder sind fachlich notwendig vs unnötig sensitiv;
- welche Daten dürfen niemals Growth/Marketing-Targeting speisen.

### E. Bekannte Account-Folgearbeit

AP-3-Handoff nennt u. a. `archived`-UX als AP-4-Thema. Dieser Audit darf AP-4 **nicht implementieren**. Er soll aber festhalten, ob Traveller-/Account-Abhängigkeiten die Reihenfolge beeinflussen und welcher Slice nach Traveller-Closure sauber folgt.

## 5. Deliverables

Aktualisiere `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT_STATUS.md` und optional ein separates Evidence-/Gap-Dokument.

Pflichtinhalt:

- Feature-by-feature Matrix: `correct / partial / missing / conflicting / insufficient evidence`;
- Single-Citizenship-/Single-Document-Fundstellen mit Datei/Test/ADR-Evidence;
- Account-scoped vs trip-scoped Current Truth;
- Privacy-/RLS-/Ownership-Risiken;
- P0/P1/P2/P3 Findings;
- Shared-Contract-Entscheidungen, die TL-gesteuert separat nötig wären;
- empfohlener minimaler nächster Traveller-/Account-Runtime-Slice;
- explizite Non-Scope-/Abhängigkeitsmatrix zu parallel laufenden D0-2/TW6/Provider/Admin/QS2-Arbeiten;
- spätere AP-4–AP-12-Auswirkungen, ohne sie vorzuziehen.

## 6. Harte Non-Scope-Grenzen

Keine Runtime. Keine:

- DB-/Migration-/RLS-Änderung;
- Auth/MFA/Session-Änderung;
- Guest→Account-Änderung;
- Traveller-Shared-Contract-Änderung;
- Pass-/MRZ-/Biometrie-Speicherung;
- AP-4–AP-12 Implementierung;
- `/planen`-Runtime;
- Route-/Provider-/Payment-/Growth-Änderung;
- Production-Aktivierung.

Wenn ein Shared Contract geändert werden müsste: **dokumentieren und STOPP**.

## 7. Abschluss

Adversarial Self-Review: Jede Aussage muss auf Code/Test/Schema/ADR/Live-Evidence beruhen oder klar als offene Entscheidung markiert sein.

Danach Status aktualisieren und **STOPP**. Kein Ready/Merge, kein Folgeslice. ChatGPT / Technical Lead führt den vollständigen unabhängigen Review durch.
