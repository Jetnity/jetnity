# Jetnity – Handoff und nächste Schritte

Stand: 25. August 2026  
Status: **kanonischer operativer Übergabepunkt. `main` enthält TW-5 und D0/G0-Audit-Evidence. D0-1 / PR #70 ist technisch PASS, aber nicht freigegeben. Governance-Reparatur / PR #71 ist aktiv.**

Der erste Einstieg bleibt `JETNITY_START_HERE.md`.

> **Repository-Dokumentation + Live-GitHub-/CI-/Vercel-/Supabase-Evidence ergeben zusammen die technische Wahrheit. Der Product Owner entscheidet Ready/Merge. Nicht aus Erinnerung, Screenshots oder historischen PR-Bodies raten.**

## 1. Pflichtlektüre

Vor neuen Entscheidungen mindestens lesen:

- `JETNITY_START_HERE.md`
- `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `docs/CHATGPT_CURSOR_WORKFLOW.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
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

Die Technical-Lead-Autonomie reicht bei normalen scope-treuen Arbeiten bis zur **technischen Review-Reife**: Branch/Draft-PR, Agentensteuerung, Implementierung, Tests, Exact-Head-Evidence, unabhängiger Review und technische PASS-/CHANGES-REQUIRED-Entscheidung.

Danach gilt verbindlich:

> **Kein formales Ready und kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe für den konkret besprochenen PR, sofern der Product Owner im konkreten Fall nichts anderes bestimmt.**

Grüne Tests, Technical-Lead-PASS, Vercel READY, `mergeable=true`, fehlende Review-Threads oder eine frühere allgemeine Autonomie sind keine Merge-Freigabe.

Der Product Owner erhält vor dem Merge ausdrücklich Gelegenheit, Änderungen oder Ergänzungen zu verlangen. Nach einer gültigen Freigabe prüft der Technical Lead Exact Head und Integrationsstand erneut und darf dann Ready/Merge technisch ausführen, sofern alle übrigen Gates weiterhin erfüllt sind.

Besondere Product-Owner-Gates bleiben zusätzlich bestehen für Production-Migrationen/destructive Daten, große RLS/Identity-Risiken, echte Provider/Secrets/paid calls, Kosten über USD 100/Monat, reale Payments, fundamentale Build-Order-/Produktänderungen, sensitive Pass/MRZ/Biometrie-Speicherung, fundamentale Auth/Session-Änderungen, sensible externe Datenweitergabe und Public-/Production-Aktivierungen.

Merge, Production, Kosten und besondere Gates sind getrennt.

Für Ready/Merge superseded `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md` alle widersprechenden historischen Auto-Merge-Formulierungen.

## 3. Produkt- und Truth-Mandat

Leitsätze:

> **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

Keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health, erfundene Visa-/Safety-/Seasonal-/Live-Truth. `unknown`, `stale`, `error`, `unavailable`, `insufficient_context` und bestätigte Zustände bleiben getrennt. LLM/Assistant darf Hard Truth erklären, nicht erzeugen.

Traveller bleibt: ein stabiler Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen. Kein Default-Pass.

## 4. Aktueller integrierter Stand

Live-verifizierter `main`:

`2bb6b8072fa04e8f6db2d989b84ada7b64745fd9`

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
- QS-1 / PR #67
- **TW-5 / PR #66**
- Post-TW5 Continuity / PR #68
- D0/G0 Foundation Audit Evidence / PR #69

Historischer TW-5-Merge-Commit:

`6f2beeccae2c1e6bdf9bcb9fdc35a5cd56e50bec`

PR #69 war docs-only Audit-Evidence. Sein Merge ohne die nach aktueller Governance erforderliche ausdrückliche aktuelle Product-Owner-Freigabe wird transparent als Governance-Fehler dokumentiert; kein destruktiver Rollback wird allein deshalb erzeugt.

## 5. D0-1 / PR #70

Agent: `Jetnity growth discoverability`

Branch:

`fix/d0-1-index-boundary-contract`

Exact Review Head:

`31022a5d0c4090081339e55bd2b7c7b3927e1185`

Independent Technical-Lead Re-Review: **TECHNICAL PASS / review-bereit**.

Bestätigte Evidence:

- GitHub Actions `32899556724`: SUCCESS
- Vercel Preview `dpl_DqDFzNpPuWqMNj7hS1sM4j3SSDZp`: READY
- gezielte D0-1-Tests 19/19 laut persistierter Agent-Evidence
- `npm test` 2013/2013 laut persistierter Agent-Evidence
- Supabase Production `ACTIVE_HEALTHY`, keine D0-1-Migration
- Inline-Review-Threads 0

Fachlich:

- `/reisen` und `/reisen/[tripId]` `noindex, nofollow`
- `/reisen` aus Sitemap entfernt
- robots-Allow-Modus gehärtet
- `/planen` ohne akzeptierte Intent-Keys bleibt öffentliche Basis
- vorhandene `idee`/`ziel`/`zielId`-Keys machen die konkrete `/planen`-Response `noindex`, auch leer/Whitespace/Array
- `/admin/login`, `/unauthorized` und Admin-Layout `noindex`
- keine DB/RLS/Auth/Traveller/Route/Provider/Payment/Tracking-/Kostenänderung

**PR #70 bleibt Draft / Integration Hold. Kein Ready. Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**

## 6. Governance-Reparatur / PR #71

Docs-only Branch:

`docs/merge-governance-repair-2026-08-25`

Draft-PR:

**#71 – `docs: restore Product Owner merge governance`**

Ziel:

- Ready-/Merge-Widerspruch korrigieren;
- Technical-Lead-Autonomie bis Review-Reife klar erhalten;
- Product-Owner-Merge-Gate kanonisch verankern;
- alte Auto-Merge-Aussagen als historische Evidence erhalten, aber hinsichtlich Ready/Merge superseden;
- aktuellen Handoff / Start Here / Active Work synchronisieren.

Kein Runtime-Code, keine DB/RLS/Auth/Provider-/Kostenänderung.

## 7. TW-5 Abschluss

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

P1-QS1-01 bleibt geschlossen: genau eine ungeplante Liste geht in Coverage/Route/Status; keine doppelte ungeplante Flight-Itinerary und keine Route-Engine-Heuristik.

## 8. Nächste Trip-Workspace-Entscheidung

TW-6 darf nicht automatisch starten.

- TW-6 Create-Entry: Abhängigkeit **dokumentierter Product-Owner-Schnitt + Guest-One-Trip-Vertrag**
- TW-7 Hub-Anschluss: Account-/Hub-Grenzen beachten
- TW-8 Commercial Surfaces: erst nach Provider S5 / realer Commercial Provenance
- TW-9 Polish/Evidence/Closure danach
- finaler Function-by-Function-/Intelligence-Audit bleibt zwingend

Vor neuer Runtime muss der Technical Lead den nächsten tatsächlich freigegebenen Slice bestimmen und versionieren.

## 9. Agentenstatus

- `Trip workspace audit architecture`: TW-5 abgeschlossen; wartet.
- `Account plattform audit vorbereitung`: wartet; AP-1–AP-3 integriert.
- `Jetnity provider readiness audit`: wartet; S1–S3 integriert.
- `Admin platform audit`: wartet; A–C integriert.
- `Jetnity growth discoverability`: D0-1 technisch PASS; STOPP / Draft / Integration Hold.
- `Jetnity quality security audit`: QS-1 abgeschlossen; reserviert für unabhängige Checkpoints.
- `Jetnity native app architecture`: reserviert für spätere Native-Phase.

Aktuell muss der Product Owner in Cursor **keinen neuen Agenten starten**. PR #71 wird direkt durch ChatGPT / Technical Lead docs-only geführt.

## 10. Shared Contracts

Technical-Lead-kontrolliert bleiben insbesondere Auth/Identity/Sessions/MFA/AAL, RLS/Ownership/Guest→Account, Traveller/Multi-Citizenship/Multi-Document, Route/Transit, Privacy/Consent, Billing/Payment, Admin Audit/Capabilities, Provider Activation, Attribution/Revenue/Claims Truth sowie Guardian/Simulator/Value Impact.

## 11. Supabase / Production

Supabase Production: `qscbgcdmivbbnzrcyegn`.

Live verifiziert: `ACTIVE_HEALTHY`.

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

Development enthält zusätzlich, weiterhin **nicht Production-approved**:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

## 12. Große Build-Reihenfolge

Weiter gemäß `docs/JETNITY_BINDING_BUILD_ORDER.md`:

1. Trip Workspace vollständig fertigbauen – abhängige TW-6/7/8, TW-9, finaler Audit.
2. Traveller/Pass/Multi-Citizenship produktweit vervollständigen.
3. Account AP-4 bis AP-12.
4. Provider Readiness S4 bis S8; echte Provider nur unter Gates.
5. Admin D–K plus Marketing/Growth Control Plane.
6. Homepage und abhängige Growth/Discovery-Schichten.
7. Commercial Truth / Guardian / What-if / Value und finaler Launch-Hardening-Audit gemäß Standards.

Konfliktarme Vorbereitungs-/Audit-Arbeit kann parallel laufen; die große Reihenfolge darf ohne Product-Owner-Entscheidung nicht still verändert werden.

## 13. Offene Risiken

- `main` Branch Protection ist weiterhin nicht aktiviert.
- historische Auto-Merge-Formulierungen existieren in alten Tasks/ADRs/Statusdateien; sie sind hinsichtlich Ready/Merge durch die neue Supersession nicht mehr maßgeblich.
- QS-1 P2/P3-Findings bleiben dokumentierte Follow-ups.
- TW-6-PO-Schnitt/Guest-One-Trip-Vertrag ist vor TW-6 zu klären.
- D0-1 schließt Legal-404, Canonical/Origin, hreflang, JSON-LD und G0-Findings nicht.

## 14. Nächster Schritt

1. PR #71 docs-only gegen seinen Exact Head vollständig prüfen.
2. Technical-Lead-Abschluss dokumentieren.
3. **STOPP und Product Owner Ergebnis / mögliche Änderungen zeigen.**
4. PR #71 nicht Ready setzen und nicht mergen ohne ausdrückliche Freigabe.
5. Nach einem eventuellen PR-#71-Merge PR #70 gegen den neuen `main` synchronisieren/re-gaten/re-reviewen und separat dem Product Owner vorlegen.
