# Jetnity – TW-6 Dependency / Guest-One-Trip Contract Audit – Task

Stand: 26. August 2026  
Agent: **`Trip workspace audit architecture`**  
Branch: `audit/tw6-guest-one-trip-dependency`  
Baseline: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Typ: **AUDIT / EVIDENCE / DECISION-PACKAGE ONLY**

## 1. Ziel

TW-1, TW-2, TW-4, TW-3 und TW-5 sind integriert. TW-6 darf laut verbindlichem Plan erst starten, wenn zwei Dinge präzise geklärt sind:

1. der dokumentierte Product-Owner-Schnitt für den Create-Entry;
2. der Guest-One-Trip-Vertrag.

Dieser Slice **implementiert TW-6 nicht**. Er rekonstruiert die tatsächliche aktuelle Create-/Guest-/Account-/Trip-Architektur, findet alle widersprüchlichen Annahmen und liefert eine kleine, eindeutige Entscheidungsvorlage, mit der ChatGPT / Technical Lead und Product Owner den TW-6-Start später sicher freigeben können.

## 2. Pflichtlektüre / Live-Rekonstruktion

Lies zuerst vollständig mindestens:

- `JETNITY_START_HERE.md`
- `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`
- `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`
- TW-1/TW-2/TW-3/TW-4/TW-5 Tasks/Status/ADRs/Checkpoints;
- Guest→Account-/Trip-Übernahme-/Create-Entry-bezogene ADRs und Tests.

Danach live verifizieren:

- `main`, Branch, Draft-PR, Ahead/Behind/Merge-Base;
- offene parallele PRs;
- `/planen`, Homepage-Handoff, `/reisen`, Guest Trip Storage, Account Trip Create/Takeover und Navigation im aktuellen Code;
- relevante Tests und ihre Annahmen;
- Actions/Vercel/Review-Threads.

**Nicht `docs/ACTIVE_WORK_STATUS.md` ändern.**

## 3. Auditfragen – vollständig beantworten

### A. Create Entry

- Welche konkreten Einstiegspunkte erzeugen heute eine neue Reise?
- Welche davon sind Guest, welche Account, welche nur UI-Handoff?
- Welche Daten werden beim Einstieg verlangt, welche optional gehalten?
- Gibt es widersprüchliche Defaults, insbesondere Herkunft, Staatsbürgerschaft, Dokument, Ziel, Datum oder Reisende?
- Welche Homepage-/`/planen`-/Workspace-Übergaben existieren real?
- Welche sichtbaren oder unsichtbaren Doppelwege würden TW-6 sonst erzeugen?

### B. Guest-One-Trip Contract

Rekonstruiere den tatsächlichen Vertrag, ohne ihn zu verändern:

- Wie viele aktive Gastreisen kann ein Browser heute real halten?
- Wo und wie wird die Gastreise gespeichert?
- Welche IDs / Revisionen / Ownership-Signale existieren?
- Wie erfolgt Guest→Account-Übernahme?
- Was passiert bei Login, Logout, Tab-Wechsel, Gerätwechsel, LocalStorage-Verlust, Account mit vorhandenen Reisen?
- Welche Konflikt-/Overwrite-/Duplicate-Risiken gibt es?
- Welche Daten dürfen niemals still von Guest zu Account oder zwischen Accounts wandern?
- Welche Teile sind Produktentscheidung und welche technische Tatsache?

### C. Traveller / Multi-Citizenship

Prüfe, dass TW-6 keinen Default-Pass oder genau eine Staatsbürgerschaft voraussetzen würde. Der Create-Entry darf den produktweiten Traveller-Vertrag nicht still neu definieren.

### D. D0-2 Parallelität

`Jetnity growth discoverability` arbeitet parallel an D0-2 und kann Metadata/Origin/robots/sitemap sowie eventuell Metadata der `/planen`-Seite berühren. Dieser Audit darf **keine `/planen`-Runtime- oder Metadata-Datei ändern** und keinen D0-2-Code anfassen.

## 4. Deliverables

Erstelle / aktualisiere nur slice-eigene Audit-Dokumentation:

- `docs/TRIP_WORKSPACE_TW6_DEPENDENCY_AUDIT_STATUS.md`;
- optional ein separates Evidence-/Decision-Dokument, wenn dadurch die Entscheidung klarer wird.

Der Abschluss muss enthalten:

- Current-State-Diagramm in Text/Table-Form;
- genaue Liste aller Create-Entry-Pfade;
- Guest-One-Trip Current Contract: **proven / inferred / missing decision** sauber getrennt;
- P0/P1/P2/P3 Findings;
- konkrete TW-6 Start-Gates;
- maximal 2–3 Product-Owner-Entscheidungsoptionen mit Auswirkungen;
- klare Technical-Lead-Empfehlung des Agents, aber keine eigenmächtige Produktentscheidung;
- vorgeschlagenen minimalen TW-6 Runtime-Scope erst **nach** Gate-Entscheidung;
- Datei-/Shared-Contract-Kollisionsmatrix;
- Tests/Evidence, die ein späterer TW-6 Runtime-Slice zwingend braucht.

## 5. Harte Non-Scope-Grenzen

Keine Runtime-Änderung. Insbesondere nicht:

- `/planen` ändern;
- Homepage ändern;
- Guest→Account-Logik ändern;
- Trip Create/Ownership/RLS ändern;
- DB/Migrationen;
- Auth/MFA/Session;
- Traveller/Multi-Citizenship/Multi-Document-Vertrag ändern;
- Route/Transit;
- Provider/Payment;
- D0-2;
- TW-6/TW-7/TW-8 implementieren.

Wenn du einen Shared-Contract-Change für nötig hältst: exakt dokumentieren und **STOPP**.

## 6. Abschluss / STOPP

Führe einen adversarial Self-Review des Audits durch. Prüfe, ob jede Aussage mit Code/Test/ADR/Live-Evidence belegt oder klar als offene Entscheidung markiert ist.

Dann Status aktualisieren und **STOPP**.

Kein Ready/Merge. Kein Folgeslice. ChatGPT / Technical Lead prüft den Audit unabhängig von Anfang an.
