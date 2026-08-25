# Jetnity – Handoff und nächste Schritte

Stand: 25. August 2026  
Status: **kanonischer operativer Übergabepunkt nach TW-5. PR #66 ist nach unabhängigem Technical-Lead-PASS auf `main` integriert. Keine neue Runtime-Aufgabe ist aktuell automatisch freigegeben.**

Der erste Einstieg bleibt `JETNITY_START_HERE.md`. Für den exakten TW-5-Abschluss siehe `docs/CHATGPT_TW5_MERGE_CHECKPOINT_2026-08-25.md`.

> **Repository-Dokumentation + Live-GitHub-/CI-/Vercel-/Supabase-Evidence ergeben zusammen die Wahrheit. Nicht aus Erinnerung, Screenshots oder historischen PR-Bodies raten.**

## 1. Pflichtlektüre

Vor neuen Entscheidungen mindestens lesen:

- `JETNITY_START_HERE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CHATGPT_TW5_MERGE_CHECKPOINT_2026-08-25.md`
- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
- `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md`
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`
- `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
- `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
- `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`
- `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`
- `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`
- relevante Slice-Tasks/Status/ADRs/Handoffs/Audits.

Danach live prüfen: `main`, offene PRs/Drafts, Branches, Ahead/Behind, Actions, Vercel, relevante Supabase-Stände, Review-Threads und Blocker.

## 2. Governance

ChatGPT / Technical Lead ist die übergreifende Product-, Architecture-, Logic-, Security-, Privacy-, UX-, Performance-, QA-, Release-, Kosten-, Continuity- und Integrationsinstanz.

Normale scope-treue PRs dürfen nach vollständigem Self-Review, Exact-Head-Gates, CI/Vercel und unabhängigem TL-PASS autonom Ready gesetzt und gemergt werden. Besondere Product-Owner-Gates bleiben bestehen für Production-Migrationen/destructive Daten, große RLS/Identity-Risiken, echte Provider/Secrets/paid calls, Kosten über USD 100/Monat, reale Payments, fundamentale Build-Order-/Produktänderungen, sensitive Pass/MRZ/Biometrie-Speicherung, fundamentale Auth/Session-Änderungen, sensible externe Datenweitergabe und Public-/Production-Aktivierungen.

Shared Contracts werden nicht still von Fachagenten verändert.

## 3. Produkt- und Truth-Mandat

Leitsätze:

> **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

Keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health, erfundene Visa-/Safety-/Seasonal-/Live-Truth. `unknown`, `stale`, `error`, `unavailable`, `insufficient_context` und bestätigte Zustände bleiben getrennt. LLM/Assistant darf Hard Truth erklären, nicht erzeugen.

Traveller bleibt: ein stabiler Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen. Kein Default-Pass.

## 4. Aktueller Runtime-Stand

Live-verifizierter `main` nach TW-5:

`6f2beeccae2c1e6bdf9bcb9fdc35a5cd56e50bec`

Integriert sind unter anderem:

- Foundation C Readiness
- Foundation D Route & Transit
- Foundation E Traveller Context
- Safety/Disruption Foundation
- Timing/Seasonal Foundation
- Account AP-1 bis AP-3
- Provider Readiness S1 bis S3
- Admin A bis C
- TW-1 / PR #56
- TW-2 / PR #58
- Marketing & Growth Standards / PR #59
- TW-4 / PR #60
- TW-3 / PR #64
- post-TW-3 Continuity / PR #65
- QS-1 / PR #67
- **TW-5 / PR #66**

## 5. TW-5 Abschluss

Agent: `Trip workspace audit architecture`

- Runtime-/Evidence-Head: `8183782fc08c486949212b0e78b9f4ce938aa0dd`
- Persist-Head: `49aa04d99a5eb33a89fa624f1d096f7c5400698f`
- Merge: `6f2beeccae2c1e6bdf9bcb9fdc35a5cd56e50bec`
- Independent TL: **PASS / Technical Integration Closure**
- targeted 112/112
- `npm test` 1994/1994
- UI audit 1018/1018, 0 Fehler
- Build grün
- Actions Runtime + Persist SUCCESS
- Vercel Runtime + Persist + Production READY
- offene Review-Threads 0
- keine DB/Migration/RLS/Auth/Traveller/Route-Shared-Contract/Provider/Secret/paid-call-Änderung

P1-QS1-01 wurde vor dem Merge geschlossen: genau eine ungeplante Liste geht in Coverage/Route/Status; keine doppelte ungeplante Flight-Itinerary und keine Route-Engine-Heuristik.

## 6. Nächste Trip-Workspace-Entscheidung

TW-6 darf nicht automatisch starten.

Laut Implementierungsplan:

- TW-6 Create-Entry: Abhängigkeit **dokumentierter Product-Owner-Schnitt + Guest-One-Trip-Vertrag**;
- TW-7 Hub-Anschluss: Account-/Hub-Grenzen beachten, AP-3 nicht überschreiben;
- TW-8 Commercial Surfaces: erst nach Provider S5 / realer Commercial Provenance;
- TW-9 Polish/Evidence/Closure danach;
- finaler Function-by-Function-/Intelligence-Audit bleibt zwingend.

Vor neuer Runtime muss der Technical Lead den nächsten tatsächlich freigegebenen Slice bestimmen und versionieren.

## 7. Agentenstatus

- `Trip workspace audit architecture`: TW-5 abgeschlossen; wartet.
- `Account plattform audit vorbereitung`: wartet; AP-1–AP-3 integriert.
- `Jetnity provider readiness audit`: wartet; S1–S3 integriert.
- `Admin platform audit`: wartet; A–C integriert.
- `Jetnity growth discoverability`: reserviert; Aktivierungsbedingungen prüfen.
- `Jetnity quality security audit`: QS-1 abgeschlossen; reserviert für unabhängige Checkpoints.
- `Jetnity native app architecture`: reserviert für spätere Native-Phase.

Konfliktarme Parallelisierung darf geprüft werden, aber nicht nur zur Auslastung. Eigener Branch/PR/Task/Status/Gates/STOPP und klare Merge-Reihenfolge bleiben Pflicht.

## 8. Shared Contracts

Technical-Lead-kontrolliert bleiben insbesondere Auth/Identity/Sessions/MFA/AAL, RLS/Ownership/Guest→Account, Traveller/Multi-Citizenship/Multi-Document, Route/Transit, Privacy/Consent, Billing/Payment, Admin Audit/Capabilities, Provider Activation, Attribution/Revenue/Claims Truth sowie Guardian/Simulator/Value Impact.

## 9. Supabase / Production

Supabase Production: `qscbgcdmivbbnzrcyegn`.

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

Development enthält zusätzlich, weiterhin **nicht Production-approved**:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

## 10. Große Build-Reihenfolge

Weiter gemäß `docs/JETNITY_BINDING_BUILD_ORDER.md`:

1. Trip Workspace vollständig fertigbauen – abhängige TW-6/7/8, TW-9, finaler Audit.
2. Traveller/Pass/Multi-Citizenship produktweit vervollständigen.
3. Account AP-4 bis AP-12.
4. Provider Readiness S4 bis S8; echte Provider nur unter Gates.
5. Admin D–K plus Marketing/Growth Control Plane.
6. Homepage und abhängige Growth/Discovery-Schichten.
7. Commercial Truth / Guardian / What-if / Value und finaler Launch-Hardening-Audit gemäß Standards.

Konfliktarme Vorbereitungs-/Audit-Arbeit kann parallel laufen; die große Reihenfolge darf ohne Product-Owner-Entscheidung nicht still verändert werden.

## 11. Offene Risiken

- `main` Branch Protection ist weiterhin nicht aktiviert.
- QS-1 P2/P3-Findings bleiben dokumentierte Follow-ups.
- TW-6-PO-Schnitt/Guest-One-Trip-Vertrag ist vor TW-6 zu klären.
- Historische offene PRs sind keine automatisch aktiven Runtime-Slices.

## 12. Nächster Schritt

Post-TW-5-Continuity abschließen. Danach Abhängigkeiten live prüfen und den nächsten kontrollierten Slice bzw. konfliktarmen Parallel-Workstream vorbereiten.

Bis dahin muss der Product Owner in Cursor **keinen neuen Agenten starten**.