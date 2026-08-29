# Traveller / Multi-Citizenship — Future Slice Proposal

Stand: 29. August 2026  
Status: **PROPOSAL ONLY / NOT AUTHORIZED / NOT A START ORDER**  
Quelle: `docs/TRAVELLER_MULTICITIZENSHIP_CURRENT_GAP_AUDIT_2026-08-29.md`

Dieser Text startet keinen Slice, ändert keine Binding Build Order und ist keine Product-Owner- oder Technical-Lead-Freigabe.

Ein Folgeslice braucht einen eigenen versionierten Task, einen frischen oder korrekt rotierten Agenten und unabhängigen Review.

---

## 1. Was jetzt nicht gebaut werden soll

Nicht aus PR #198 ableiten:

- AP-7-S2 Persistenz
- Account-Registry-UI
- Guest→Registry-Import
- Requirements-Provider / Timatic
- Official-UX „Alternativen anzeigen“
- Safety-Option-Scope
- Provider-APIS-/Dokumentprojektionen
- Legacy-Spalten-Drop
- Production-Migration irgendwelcher Art

---

## 2. Empfohlene Reihenfolge, falls später bewusst geschnitten wird

### Slice A — AP-7-S2 Persistence / Identity / RLS

**Warum zuerst:** einziger Befund, der die Traveller-Completion-Stage und Account AP-7+ wirklich blockt (Audit F1–F3).  
**Scope-Skizze:** Schema + Ownership + RLS + Grants für account-owned Registry-Fakten; keine UI; keine automatische Trip-Rewrite; keine Nummern/Scans/MRZ.  
**Gate:** Product-Owner Production-/Identity-/RLS-Gate. Dual-Authority-Approval allein reicht nicht für Production-Apply.  
**Nicht enthalten:** CRUD-UX, Guest-Import, Provider.

### Slice B — explizite Registry→Trip-Materialisierung

**Abhängig von A.** Opt-in, trip-eigene IDs, kein Live-FK, kein stilles Snapshot-Overwrite. Conflict-Semantik erst hier, nicht in S1 nachrüsten.

### Slice C — Account Registry CRUD / Document-Lifecycle-UX

**Abhängig von A+B.** Datensparsame Felder wie Foundation E. Progressive Disclosure. Keine Primary-Citizenship-UI.

### Slice D — Official Item Option-Scope Presentation

**Nur wenn** ein Requirements-Provider echte option-spezifische Evidence liefert. Dann `officialFuerItem` um `credentialOptionRef` erweitern. Bis dahin bleibt fail-closed `unknown` korrekt.

### Slice E — Safety Option-Scope

**Nur wenn** Safety-Facts nachweislich option-abhängig werden. Heute reicht Citizenship-Set.

### Slice F — Provider Booking / APIS / Dokumentwahl

**Nur wenn** ein echter Provider dokumentpflichtige Requests verlangt. Search-Kopfzahl bleibt bis dahin correct. Kein `documents[0]`.

### Slice G — Legacy-Quarantäne / `party_schreiben` Hygiene

Nur nach Nachweis, dass Production den Legacy-Select nicht mehr braucht. `ON CONFLICT DO NOTHING` fail-closed machen ist ein eigener kleiner DB-Slice mit Production-Gate.

---

## 3. Was bewusst nicht in die Traveller-Completion gehört

- Flight/Hotel/Activity-Suchköpfe
- TW-8 Commercial Surfaces
- AP-5/AP-6-Reste
- globale Continuity-Reparatur von `ACTIVE_WORK_STATUS.md` (separater docs-only Continuity-Schritt nach Merge, durch Technical Lead)

---

## 4. Merksatz

> **Die Lücke ist nicht „das 1:n-Modell fehlt“. Die Lücke ist „accountweite Wiederverwendung fehlt, und spätere Official-/Provider-Darstellung darf das Modell nicht wieder auf eine Option reduzieren“.**
