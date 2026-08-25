# Jetnity – Handoff und nächste Schritte

Stand: 26. August 2026  
Status: **kanonischer operativer Übergabepunkt nach PR #72. Neue Technical-Lead-Merge-Autonomie wird in einem separaten docs-only Governance-Slice versioniert. Danach kontrollierte konfliktarme Parallelisierung.**

Der erste Einstieg bleibt `JETNITY_START_HERE.md`.

## 1. Pflicht vor jeder neuen Arbeit

Lies zuerst mindestens:

- `JETNITY_START_HERE.md`
- `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- relevanten Slice-Task/Status/ADR/Checkpoint.

Danach live prüfen: `main`, offene PRs/Drafts, Branches, Ahead/Behind/Merge-Base, tatsächliche Diffs, Actions, Vercel, relevante Supabase-/Migrationen, Review-Threads und Blocker.

## 2. Aktuelle Merge-Governance

Der Product Owner hat am 26. August 2026 ausdrücklich entschieden:

> **ChatGPT / Technical Lead darf normale scope-treue PRs selbst Ready setzen und mergen, wenn er sie zuvor unabhängig und vollständig geprüft hat.**

Pflicht vor Ready/Merge:

- nicht auf Agenten-Abschlussberichte oder grüne Tests blind vertrauen;
- tatsächlichen Diff und alle betroffenen Dateien prüfen;
- Tests und Testannahmen fachlich hinterfragen;
- Security/Privacy/Truth/Shared Contracts prüfen;
- Exact-Head CI und Vercel prüfen;
- relevante Supabase-/Production-Grenzen prüfen;
- bei Problemen zuerst selbst korrigieren oder den zuständigen Cursor-Agenten korrigieren lassen;
- danach neu gaten und neu reviewen;
- erst bei echtem unabhängigen PASS mergen.

Besondere Product-Owner-Gates bleiben bestehen für Production-Migrationen/destruktive Daten, große RLS/Identity/Auth-Änderungen, sensitive Pass/MRZ/Biometrie-Speicherung, sensible externe Datenweitergabe, reale Provider/Secrets/paid calls, reale Payments, Kosten > USD 100/Monat, fundamentale Build-Order-/Business-Änderungen und Public-/Provider-/Store-Live-Aktivierungen.

## 3. Live integrierter Stand

Aktueller `main` vor diesem Governance-Slice:

`5f9dc4b0e87d8b2adbcaca6962a76463cad32304`

Letzte relevante Integrationen:

- PR #70 – D0-1 Index Boundary Contract → `083eda22189e1dad8bd70413889d2486755d7fe6`;
- PR #72 – Post-D0-1 Continuity → `5f9dc4b0e87d8b2adbcaca6962a76463cad32304`.

Trip Workspace integriert:

- TW-1 ✅
- TW-2 ✅
- TW-4 ✅
- TW-3 ✅
- TW-5 ✅

Weitere integrierte Foundations:

- Foundation C Readiness;
- Foundation D Route & Transit;
- Foundation E Traveller Context;
- Safety/Disruption;
- Timing/Seasonal;
- Account AP-1 bis AP-3;
- Provider Readiness S1 bis S3;
- Admin A bis C;
- D0/G0 Foundation Audit;
- D0-1 Index Boundary Contract.

## 4. D0/G0-Stand

D0-1 geschlossen:

- D0-P1-01 – private Reise-Surfaces nicht indexierbar;
- D0-P1-02 – parametrisierte `/planen`-Responses `noindex`;
- D0-P2-03 – Admin-/Unauthorized-Indexgrenzen;
- P2-D0-1-TL-01 – Presence-Contract für `idee`/`ziel`/`zielId`.

Weiter offen:

- D0-P1-03 – `/privacy` und `/terms` 404; separater Legal-/PO-Slice, keine Rechtstexte erfinden;
- D0-P2-01 – robots/Sitemap/Host-Semantik;
- D0-P2-02 – Canonical-/Origin-Contract;
- D0-P2-04 – Locale/hreflang;
- D0-P2-05 – JSON-LD/Entity Foundation;
- G0-P2-01 / G0-P2-02 / G0-P3-01 / G0-P3-02.

Nächster konfliktarmer Runtime-Candidate: **D0-2 – Canonical / Origin / robots-sitemap Consistency**.

## 5. Trip-Workspace-Gates

TW-6 darf nicht blind als Runtime starten.

- TW-6 Create-Entry braucht dokumentierten Product-Owner-Schnitt + Guest-One-Trip-Vertrag;
- TW-7 hängt an Account-/Hub-Grenzen;
- TW-8 hängt an Provider S5 / realer Commercial Provenance;
- TW-9 danach;
- finaler Function-by-Function-/Intelligence-Audit bleibt zwingend.

Deshalb ist derzeit für `Trip workspace audit architecture` nur konfliktarme **Dependency-/Contract-Audit-Arbeit** sinnvoll, kein ungesteuerter TW-6-Runtime-Start.

## 6. Kontrollierte Parallelisierung nach Governance-Closure

Nach Integration dieses Merge-Autonomie-Slices dürfen gleichzeitig gestartet werden, jeweils auf eigenem Branch/Draft-PR und mit `STOPP`:

1. `Jetnity growth discoverability` – **D0-2 Runtime**, eng auf Canonical/Origin/robots-sitemap begrenzt.
2. `Trip workspace audit architecture` – **TW-6 Dependency / Guest-One-Trip Contract Audit**, audit-only, keine Runtime.
3. `Account plattform audit vorbereitung` – **Traveller-/Account Next-Phase Dependency Audit**, audit-only; keine AP-4-Runtime und keine Traveller-Shared-Contract-Änderung.
4. `Jetnity provider readiness audit` – **S4–S8 Dependency / Provenance Gap Audit**, audit-only; keine Provideraktivierung, Secrets oder paid calls.
5. `Admin platform audit` – **Admin D–K / Growth-Control Gap Audit**, audit-only; keine produktiven Marketing-/Finance-/Ads-/CRM-Writes.
6. `Jetnity quality security audit` – **QS-2 independent quality/security/resilience audit**, audit-only; keine Feature-Runtime.

`Jetnity native app architecture` bleibt reserviert und wird **nicht** gestartet.

Parallelitätsregel:

- kein Agent ändert `docs/ACTIVE_WORK_STATUS.md`; zentrale Continuity nur durch ChatGPT / Technical Lead;
- keine Shared-Contract-Änderung ohne STOPP und TL-Entscheidung;
- Agenten starten keinen Folgeslice selbst;
- Audit-only-Agenten ändern keine Runtime;
- jeder Agent-Change wird vom Technical Lead unabhängig von Anfang an geprüft.

## 7. Supabase / Production

Supabase Production:

`qscbgcdmivbbnzrcyegn`

Zuletzt live verifiziert: `ACTIVE_HEALTHY`.

Production-Migrationen bis:

- `20260824120000_flug_route_itinerary_surface_evidence`;
- `20260824140000_flug_route_itinerary_untrusted_surface`.

Development-only, nicht Production-approved:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`;
- `20260824180000_trip_items_flug_handelsfelder_guard`.

## 8. Offene globale Risiken

- `main` Branch Protection ist weiterhin deaktiviert;
- D0-P1-03 Legal-404 bleibt P1;
- QS-1 P2/P3-Findings bleiben Follow-ups;
- TW-6-Gate ist nicht erfüllt;
- echte Provider/Payments/Production-Migrationen bleiben gesondert gegatet;
- historische PR-Bodies/Handoffs sind nur Evidence ihres Zeitpunkts.

## 9. Continuity

Kein Fortschritt darf nur im Chat existieren. Merges, Reviews, Agentenstatus, Blocker, Gate-Entscheidungen und nächste Schritte werden versioniert.

Neue Chats/Agenten raten niemals aus Screenshots oder Erinnerung. **Live-Evidence zuerst.**
