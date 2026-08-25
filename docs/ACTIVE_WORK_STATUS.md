# Jetnity – Active Work Status

Stand: 26. August 2026  
Status: **PR #72 ist integriert. Aktiver docs-only Governance-Slice erweitert Technical-Lead-Merge-Autonomie unter strenger unabhängiger Pflichtprüfung. Nach dessen Closure kontrollierte konfliktarme Parallelisierung.**

## 0. Live-verifizierte Baseline

Aktueller `main` vor diesem Governance-Slice:

`5f9dc4b0e87d8b2adbcaca6962a76463cad32304`

Letzte relevante Integrationen:

- PR #70 – D0-1 Index Boundary Contract → `083eda22189e1dad8bd70413889d2486755d7fe6`;
- PR #72 – Post-D0-1 Continuity → `5f9dc4b0e87d8b2adbcaca6962a76463cad32304`.

`main` Branch Protection ist weiterhin **nicht aktiviert**.

## 1. Aktiver Governance-Slice

Branch:

`docs/tl-merge-autonomy-2026-08-26`

Ziel:

- aktuelle Product-Owner-Entscheidung dauerhaft speichern;
- Technical Lead darf normale scope-treue PRs selbst Ready setzen / mergen;
- vor jedem Ready/Merge ist eine vollständige unabhängige Prüfung zwingend;
- Agentenberichte und grüne Tests dürfen nie blind übernommen werden;
- bei Defekten zuerst selbst korrigieren oder Cursor gezielt korrigieren lassen;
- danach Exact-Head-Gates und unabhängigen Review wiederholen;
- besondere Production-/Provider-/Kosten-/Payment-/Sensitive-Data-/Auth-/Launch-Gates bleiben Product-Owner-pflichtig.

Kanonische neue Vorrangregel:

`docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`

Dieser Slice ist docs-only. Keine Runtime-, DB-, RLS-, Auth-, Traveller-, Route-, Provider-, Payment-, Tracking-, Secret-, paid-call- oder Kostenänderung.

## 2. Merge-Governance – verbindlich ab 26. August 2026

> **Autonom mergen ist erlaubt – blind mergen ist verboten.**

Vor einem normalen eigenständigen Merge prüft ChatGPT / Technical Lead mindestens:

- kanonischen Kontext und aktuellste Nutzerentscheidung;
- tatsächlichen Diff / geänderte Dateien;
- Acceptance Criteria / Scope / Non-Scope;
- fachliche Richtigkeit der Tests und ihrer Erwartungen;
- Security / Privacy / Truth / Shared Contracts;
- Exact-Head GitHub Actions;
- Exact-Head Vercel;
- relevante Supabase-/Migrationsevidence;
- Ahead/Behind/Merge-Base und parallele PRs;
- offene Threads / P0/P1 / sonstige Blocker.

Bei einem Problem: kein Merge → Korrektur → neu gaten → neu reviewen.

## 3. Besondere Product-Owner-Gates

Ausdrückliche Product-Owner-Entscheidung bleibt vor der betreffenden Aktion erforderlich für insbesondere:

- Production-Migration/destruktive Production-Daten;
- große produktive RLS-/Ownership-/Identity-Änderungen;
- fundamentale Auth/MFA/AAL/Session-Änderungen;
- neue besonders sensitive Pass-/MRZ-/Biometrie-/Dokument-Speicherung;
- neue sensible externe Datenweitergabe;
- reale Providerverträge, Production-Secrets oder paid calls;
- reale Payments / Geldbewegung;
- neue laufende Kosten > USD 100/Monat;
- fundamentale Produkt-/Business-/Build-Order-Änderungen;
- Public Launch / Provider-Live / Store-/Production-Großaktivierung.

## 4. D0-1 / PR #70 – integriert

Finaler freigegebener Head:

`549f3de1a44020641d1cad2c13a6a1a08086847d`

Merge:

`083eda22189e1dad8bd70413889d2486755d7fe6`

Geschlossen:

- D0-P1-01;
- D0-P1-02;
- D0-P2-03;
- P2-D0-1-TL-01.

Weiter offen:

- D0-P1-03 Legal-404;
- D0-P2-01 robots/Sitemap/Host;
- D0-P2-02 Canonical/Origin;
- D0-P2-04 Locale/hreflang;
- D0-P2-05 JSON-LD/Entity;
- G0-P2-01 / G0-P2-02 / G0-P3-01 / G0-P3-02.

## 5. Trip Workspace

Integriert:

- TW-1 ✅
- TW-2 ✅
- TW-4 ✅
- TW-3 ✅
- TW-5 ✅

Noch gegatet:

- TW-6 Create-Entry: dokumentierter Product-Owner-Schnitt + Guest-One-Trip-Vertrag erforderlich;
- TW-7 Hub: Account-/Hub-Grenzen;
- TW-8 Commercial: Provider S5 / reale Commercial Provenance;
- TW-9 danach;
- finaler Function-by-Function-/Intelligence-Audit zwingend.

Kein TW-6-Runtime-Start ohne Gate-Closure.

## 6. Kontrollierte Parallelisierung nach Governance-Closure

Folgende Workstreams sind konfliktarm parallel möglich, wenn jeder seinen eigenen Branch, Draft-PR, Task und Status erhält und die unten genannten Grenzen einhält:

### `Jetnity growth discoverability`

**D0-2 – Canonical / Origin / robots-sitemap Consistency**  
Typ: enger Runtime-Slice.  
Keine Legal-Texte, kein hreflang, kein JSON-LD-Ausbau, kein Tracking, keine Custom-Domain-/Public-Indexing-Aktivierung.

### `Trip workspace audit architecture`

**TW-6 Dependency / Guest-One-Trip Contract Audit**  
Typ: audit-only.  
Keine TW-6-Runtime, keine `/planen`-Änderung, keine Guest→Account-/Trip-Shared-Contract-Änderung. Ziel: exakten fehlenden Product-Owner-Schnitt und Contract-Entscheidungsvorlage liefern.

### `Account plattform audit vorbereitung`

**Traveller / Account Next-Phase Dependency Audit**  
Typ: audit-only.  
Keine AP-4-Runtime, keine DB/RLS/Auth-/Traveller-Shared-Contract-Änderung. Ziel: produktweite Multi-Citizenship/Multi-Document-Lücken und saubersten nächsten Account-/Traveller-Schnitt belegen.

### `Jetnity provider readiness audit`

**Provider S4–S8 Dependency / Provenance Gap Audit**  
Typ: audit-only.  
Keine Provideraktivierung, keine Secrets, Verträge, paid calls oder Commercial-Truth-Erfindung. Ziel: S4–S8 Abhängigkeiten und S5-Provenance-Gate präzisieren.

### `Admin platform audit`

**Admin D–K / Marketing-Growth Control Gap Audit**  
Typ: audit-only.  
Keine produktiven Ads/CRM/Finance/Payment/Provider-Writes. Ziel: Admin-Plan gegen verbindlichen Growth-Control-Standard abgleichen und conflict-free Slice-Grenzen vorschlagen.

### `Jetnity quality security audit`

**QS-2 – Independent Quality / Security / Resilience Audit**  
Typ: audit-only.  
Keine Feature-Runtime. Ziel: aktuellen `main` adversarial prüfen, neue P0/P1/P2/P3 finden, insbesondere nach TW-5 + D0-1 + Governance/Parallelitätsöffnung.

### `Jetnity native app architecture`

Weiter **reserviert / nicht starten**.

## 7. Harte Parallelitätsregeln

- Jeder Agent eigener Branch / Draft-PR / Task / Status.
- Agenten ändern **nicht** `docs/ACTIVE_WORK_STATUS.md`; zentrale Continuity nur ChatGPT / Technical Lead.
- Audit-only-Agenten ändern keine Runtime.
- Keine Shared-Contract-Änderung ohne STOPP.
- Kein Agent startet selbst den nächsten Slice.
- Jeder Agent liefert Exact Head, Diff, Tests/Gates und STOPP.
- ChatGPT / Technical Lead prüft jeden Change unabhängig vom kanonischen Startpunkt aus.

## 8. Shared Contracts

Technical-Lead-kontrolliert bleiben insbesondere:

- Auth / Identity / Sessions / MFA / AAL;
- RLS / Ownership / Guest→Account;
- Traveller / Multi-Citizenship / Multi-Document;
- Route / Transit;
- Privacy / Consent;
- Billing / Payment;
- Admin Audit / Capabilities;
- Provider Activation;
- Attribution / Revenue / Claims Truth;
- Guardian / Simulator / Value Impact.

## 9. Supabase / Production

Supabase Production:

`qscbgcdmivbbnzrcyegn`

Zuletzt live verifiziert: `ACTIVE_HEALTHY`.

Production bis:

- `20260824120000_flug_route_itinerary_surface_evidence`;
- `20260824140000_flug_route_itinerary_untrusted_surface`.

Development-only / nicht Production-approved:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`;
- `20260824180000_trip_items_flug_handelsfelder_guard`.

## 10. Offene globale Risiken

- `main` Branch Protection deaktiviert;
- D0-P1-03 Legal-404 bleibt P1;
- QS-1 P2/P3 bleiben Follow-ups;
- TW-6-Gate offen;
- echte Provider/Payments/Production-Migrationen gesondert gegatet;
- historische Dokumente und Draft-PRs können stale sein; Live-Evidence gewinnt.

## 11. Exakter nächster Ablauf

1. Governance-Slice auf Exact Head vollständig gaten/reviewen.
2. Bei Fehlern zuerst korrigieren und erneut gaten.
3. Bei unabhängigem PASS darf ChatGPT / Technical Lead diesen normalen docs-only PR selbst Ready setzen / mergen.
4. Danach neuen `main` / Vercel / Continuity live verifizieren.
5. Anschließend konfliktarme Parallel-Branches/Tasks/Draft-PRs für die sechs oben freigegebenen Workstreams vorbereiten.
6. Cursor-Prompts müssen den **exakten Agent-Anzeigenamen** nennen.
7. Native-Agent bleibt aus.

## 12. Continuity-Regel

Kein relevanter Fortschritt darf nur im Chat existieren. Agentenstatus, Merges, Findings, Gate-Entscheidungen und nächste Schritte werden im Repository nachgezogen.
