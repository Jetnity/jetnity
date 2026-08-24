# Jetnity – Trip Workspace Audit Handoff

Stand: 24. August 2026  
Status: **Audit und Zielarchitektur vorbereitet; nach Current-Main-Sync auf `e3bad749`; STOPP für unabhängigen Technical-Lead-Re-Review**  
Cursor-Workstream: Trip Workspace / Reiseübersicht – Product, UX & Technical Architecture Audit  
Branch: `audit/trip-workspace`  
Draft-PR: **#55**, docs-only, kein TW-1

---

## 1. Exact Head

Historischer erster Exact Head vor Current-Main-Sync (nicht mehr Branch-Head):

`0ccd38df1614b615cbdccc48d3a9b05a67d41df6`

Dieser SHA ist **Evidence des ersten Gates-Laufs**, nicht aktueller Head und nicht aktueller `main`.

Aktueller Integrations-`main`:

`e3bad749c8e03512001e7bccd5e08467f10a7134`

`Admin Control Center Slice B – read-only System Health (#46)`

Der Branch `audit/trip-workspace` ist darauf rebased. Der neue Exact Head wird nach Commit/Push dieses Reconciliation-Schnitts erneut gegatet.

Historische Code-Evidence-Basis des Workspace-Audits:

`1ec93cc9f6d70bd57ea054463e4ba8e3822a2267`

`Admin Control Center Slice A (#44)`

`1ec93cc9` ist **nicht** aktueller `main`. Slice B auf `e3bad749` ändert keine Workspace-Runtime. Die Audit-Befunde bleiben gültig, bis ein späterer Code-Re-Scan sie widerlegt.

Grün ≠ Produktkorrektheit. Docs-only.

---

## 2. Auditstand

**Technisch vollständig vorbereitet als docs-only Workstream.**  
**Nicht:** Trip Workspace fertig.

PflichtDokumente:

- `docs/TRIP_WORKSPACE_AUDIT.md`
- `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`
- `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- diese Datei

Keine Runtime-Implementation. Keine Migration. Keine Shared-Contract-Änderung.

---

## 3. Wichtigste Funde

1. **P0 – Safety/Seasonal-Stille.** Produktpfad übergibt keine Evaluations. Fehlende Karte ≠ „keine Hinweise“.
2. **P0 – zwei Produktlogiken.** Desktop blendet die Übersicht aus; Mobile denkt in Domain-Tabs.
3. **P1 – keine Aufmerksamkeitsschicht.** `Jetzt wichtig` ist nur Zieltext, nicht Code. Übersicht = gleichgewichtige Modulkarten.
4. **P1 – Create-Flow widerspricht geltender PO-Regel.** Tempo-/Interessen-Chips und Default `balanced` leben noch.
5. **P1 – Kopf kennt Personen nur als Zahl.** Multi-Citizenship-UI existiert in der Vorbereitung, nicht in der Reise-Orientierung.
6. **Guest/Account-Form ist sauber.** Dieselbe `Trip`-Form; Konto refresh nach Write; Guest-Flug fail-closed; Listenfehler ≠ leer.
7. **Foundations nicht neu bauen.** Route, Traveller, Readiness, Safety, Seasonal, Booking-Status, FlugNachweis liegen auf `main`. Der Workspace **orchestriert** sie unvollständig.
8. **PR #52 ist nicht `main`.** Governance-Evidence, offener Draft.
9. **Nachzug aus Code-Re-Scan:** Flugsuche defaultet auf `ZRH`; Evaluate-APIs existieren ohne Workspace-Aufruf; Gast ohne Tab-Sync; Client ohne `ladezustand`.

Vollständige Inventare und P-Listen: `docs/TRIP_WORKSPACE_AUDIT.md`.

---

## 4. Dependencies

Nicht überschreiben:

- Account `Account plattform audit vorbereitung` – AP-3 Draft-PR #53 und weiterer Plan AP-4–AP-12
- Admin `Admin platform audit` – Slice A+B auf `main`; Slice C Draft #49 und weiterer Plan
- Provider `Jetnity provider readiness audit` – S3 #54 und S4–S8

Workspace darf Commercial-Freshness erst nach **S5**, Mobility-Nachweis-Parität erst nach **S3**, accountweite Traveller erst nach **AP-7**, Hub-Lebenszyklus nicht vor/gegen **AP-3**.

Details: `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`.

---

## 5. Was nicht verändert wurde

- kein Workspace-Redesign-Code
- keine DB / RLS / Auth / Traveller-Registry
- keine Route-/Provider-Nachweisänderung
- keine Secrets, keine kostenpflichtigen Calls
- keine Homepage
- keine Admin- oder Account-Fachimplementierung
- keine Finance-/Payment-Integration
- kein neuer universeller Mega-Datentyp

---

## 6. Self-Review

Durchgeführt gegen den Auftrag §23. Ergebnis im Audit §12.

Kein Slice dieses Plans ist ohne neuen Auftrag gestartet.  
`Jetzt wichtig` ist als Priorisierung spezifiziert, nicht als Tabelle.  
Unknown/Error/Empty bleiben getrennt spezifiziert.  
Multi-Citizenship ist als UI-Naht vorbereitet, nicht neu modelliert.

---

## 7. Exakter nächster Schritt

1. Dieser Draft-PR bleibt Draft.
2. Unabhängiger ChatGPT / Technical-Lead-Review der fünf Dokumente gegen Code und `main`.
3. Product Owner entscheidet gemeinsam mit dem Technical Lead, **ob und wann** TW-1 Runtime beginnt.
4. **Kein** Mark Ready, **kein** Merge, **kein** Workspace-Umbau ohne neuen ausdrücklichen Auftrag.

Empfohlene erste Runtime nach Freigabe: **TW-1 Shell/Geräteparität** und **TW-2 Reiseübersicht**, danach **TW-4 Aufmerksamkeit**. Siehe `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`.
