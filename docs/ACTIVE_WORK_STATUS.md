# Jetnity – Active Work Status

Stand: 25. August 2026  
Status: **Governance-Reparatur #71 aktiv. D0-1 / PR #70 ist technisch PASS, bleibt aber Draft / Integration Hold. Kein Ready. Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**

## 0. Live-verifizierte Baseline

Aktueller `main`:

`2bb6b8072fa04e8f6db2d989b84ada7b64745fd9`

Dieser Stand enthält TW-5 / PR #66, Post-TW5 Continuity / PR #68 und den docs-only D0/G0 Foundation Audit / PR #69.

`main` Branch Protection ist weiterhin nicht aktiviert.

## 1. Aktiver Governance-Slice

Draft-PR: **#71 – `docs: restore Product Owner merge governance`**

Branch:

`docs/merge-governance-repair-2026-08-25`

Ziel:

- widersprüchliche Ready-/Merge-Regeln bereinigen;
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md` wieder eindeutig als Merge-Grenze durchsetzen;
- Technical-Lead-Autonomie bis zur technischen Review-Reife erhalten;
- formales Ready/Merge an ausdrückliche aktuelle Product-Owner-Freigabe binden;
- historische Auto-Merge-Texte als historische Evidence erhalten, aber merge-spezifisch global superseden.

Kanonischer Nachtrag:

`docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md`

Kein Runtime-Code. Keine DB-/RLS-/Auth-/Traveller-/Route-/Provider-/Payment-/Tracking-/Secret-/Kostenänderung.

## 2. D0-1 / PR #70

Agent: `Jetnity growth discoverability`

Branch:

`fix/d0-1-index-boundary-contract`

Draft-PR: **#70 – `D0-1 – Index Boundary Contract`**

Exact Review Head:

`31022a5d0c4090081339e55bd2b7c7b3927e1185`

Independent Technical-Lead Re-Review: **TECHNICAL PASS / review-bereit**.

### Geschlossener TL-Blocker

`P2-D0-1-TL-01` ist geschlossen.

`/planen` entscheidet die Indexgrenze nun nach Präsenz der akzeptierten Keys `idee`, `ziel`, `zielId`, nicht nach einem nicht-leeren Wert. Damit werden auch leere, key-only, whitespace-only und Array-Varianten `noindex`.

### Exact-Head Evidence

- GitHub Actions `32899556724`: SUCCESS
- Typecheck, Lint, Tests, Admin-API-Schutz, Schema-Bezug, Dead Code, Exports, Dependencies, Production Build: SUCCESS
- Vercel Preview `dpl_DqDFzNpPuWqMNj7hS1sM4j3SSDZp`: READY
- Agent-Evidence: D0-1 gezielt 19/19, `npm test` 2013/2013
- Inline-Review-Threads: 0
- Supabase Production: `ACTIVE_HEALTHY`, keine D0-1-Migration

### D0-1 fachlicher Scope

- `/reisen` und `/reisen/[tripId]` explizit `noindex, nofollow`
- `/reisen` aus Sitemap entfernt
- robots-Allow-Modus für private/sensitive Pfade gehärtet
- `/planen` ohne akzeptierte Intent-Keys bleibt öffentliche Basis
- `/planen` mit `idee`, `ziel` oder `zielId` als vorhandenem Key wird `noindex, nofollow`
- `/admin/login`, `/unauthorized` und Admin-Layout `noindex`
- kein DB/RLS/Auth/Traveller/Route/Provider/Payment/Tracking-/Kosten-Scope

**Integrationsstatus:** Draft / HOLD. Kein Ready. Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe für PR #70.

## 3. Merge-Governance – jetzt verbindlich

Für alle PRs gilt:

> **Technisch fertig = review-bereit. Product Owner entscheidet Ready/Merge.**

Technischer PASS, grüne CI, Vercel READY, `mergeable=true`, fehlende Review-Threads oder frühere allgemeine Autonomie sind keine Merge-Freigabe.

Der Product Owner erhält vor jedem Merge ausdrücklich Gelegenheit für Änderungen oder Ergänzungen.

Nach eindeutiger aktueller Freigabe des konkret besprochenen PRs prüft der Technical Lead Exact Head / Integrationsstand erneut und darf dann Ready/Merge ausführen, sofern alle anderen Gates weiterhin erfüllt sind.

Historische Auto-Merge-Formulierungen sind durch `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md` hinsichtlich Ready/Merge superseded.

## 4. Historischer Governance-Fehler PR #69

PR #69 wurde docs-only nach Technical-Lead-PASS integriert, jedoch ohne die nach der wiederhergestellten Merge-Governance erforderliche ausdrückliche aktuelle Product-Owner-Merge-Freigabe.

Kein destruktiver Rollback nur aus Governance-Gründen: PR #69 enthält Audit-Evidence und keine Runtime-/DB-/Auth-/Provideränderung. Der Fehler wird transparent versioniert und darf sich ab PR #70/#71 nicht wiederholen.

## 5. Integrierter Trip-Workspace-Stand

- TW-1 / PR #56 – Shell & Geräteparität ✅
- TW-2 / PR #58 – Reiseübersicht ✅
- TW-4 / PR #60 – Aufmerksamkeit / Jetzt wichtig ✅
- TW-3 / PR #64 – Timeline / Etappe / Tag ✅
- TW-5 / PR #66 – Item- und Gap-Details ✅

P1-QS1-01 bleibt geschlossen: genau eine ungeplante Liste geht in Coverage/Route/Status; Shared Route/Transit Contract unverändert.

## 6. Nächste Trip-Workspace-Kante

- TW-6 – erst nach dokumentiertem Product-Owner-Schnitt + Guest-One-Trip-Vertrag
- TW-7 – abhängig von Account-/Hub-Vertrag
- TW-8 – abhängig von Provider S5 / realer Commercial Provenance
- TW-9 – später Polish / Evidence / Closure
- danach finaler Function-by-Function-/Intelligence-Audit

Aktuell **kein TW-6-Runtime-Start**.

## 7. Workstream-Status

### `Trip workspace audit architecture`

TW-5 integriert. Wartet.

### `Account plattform audit vorbereitung`

AP-1 bis AP-3 integriert. AP-4 bis AP-12 warten gemäß Build Order / Traveller-/Account-Abhängigkeiten.

### `Jetnity provider readiness audit`

S1 bis S3 integriert. S4 bis S8 warten gemäß Build Order. Echte Provider/Secrets/paid calls bleiben besondere Product-Owner-Gates.

### `Admin platform audit`

A bis C integriert. D bis K / Growth-Control-Slices warten gemäß Build Order.

### `Jetnity growth discoverability`

D0/G0 Audit / PR #69 auf `main`. D0-1 / PR #70 technisch PASS, aber **STOPP / Draft / Integration Hold**.

### `Jetnity quality security audit`

QS-1 abgeschlossen. Für weitere unabhängige Quality/Security/Resilience-Checkpoints reserviert.

### `Jetnity native app architecture`

Für spätere Native-Phase reserviert.

**Aktuell kein neuer Cursor-Agentenprompt.** PR #71 ist eine direkte docs-only Governance-Reparatur durch ChatGPT / Technical Lead.

## 8. Shared Contracts

Technical-Lead-kontrolliert bleiben insbesondere:

- Auth / Identity / Sessions / MFA / AAL
- RLS / Ownership / Guest→Account
- Traveller / Multi-Citizenship / Multi-Document
- Route / Transit
- Privacy / Consent
- Billing / Payment
- Admin Audit / Capabilities
- Provider Activation
- Attribution / Revenue / Claims Truth
- Guardian / Simulator / Value Impact

## 9. Supabase / Production

Supabase Production:

`qscbgcdmivbbnzrcyegn`

Live verifiziert: `ACTIVE_HEALTHY`.

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

Development enthält zusätzlich, weiterhin **nicht Production-approved**:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

D0-1 und Governance #71 haben keine Production-Migration.

## 10. Besondere Product-Owner-Gates

Zusätzlich zum allgemeinen Merge-Gate bleibt ausdrückliche Freigabe zwingend für:

- Production-Migration/destructive Production-Daten;
- große Production-RLS-/Ownership-/Identity-Änderungen;
- echte Providerverträge, Production-Secrets, paid calls;
- neue laufende Kosten über USD 100/Monat;
- reale Payments/Geldbewegung;
- fundamentale Produkt-/Business-/Build-Order-Abweichung;
- neue besonders sensitive Pass-/MRZ-/Biometrie-Speicherung;
- fundamentale Auth/MFA/AAL/Session-Änderungen;
- neue sensible externe Datenweitergabe;
- Public Launch / große Production-Aktivierung / reale Provider live.

Merge, Production, Kosten und besondere Shared-Contract-Gates sind getrennt.

## 11. Offene Follow-ups außerhalb des aktuellen Governance-Slices

- D0-P1-03: `/privacy` und `/terms` 404 – eigener Legal-/PO-Slice; keine Texte erfinden.
- D0-P2-01/02/04/05 bleiben offen.
- G0-Findings bleiben offen.
- QS-1 P2/P3-Findings bleiben dokumentiert.
- `main` Branch Protection bleibt offen.

## 12. Exakter nächster Schritt

1. PR #71 docs-only fertig synchronisieren und live prüfen.
2. Exact-Head GitHub Actions / Vercel / Diff / Scope / offene Threads prüfen.
3. Unabhängigen Technical-Lead-Abschluss für PR #71 dokumentieren.
4. **STOPP und dem Product Owner Ergebnis + Änderungen/Risiken zeigen.**
5. Kein Ready/Merge, bis der Product Owner PR #71 ausdrücklich freigibt.
6. Erst danach PR #70 gegen den dann aktuellen `main` synchronisieren/re-gaten und separat wieder dem Product Owner zur Merge-Entscheidung vorlegen.
