# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 25. August 2026  
Status: **kanonischer erster Einstieg. Operative Wahrheit immer aus Repository + Live-Systemen rekonstruieren. Product Owner entscheidet jeden Merge.**

## 1. Pflichtlektüre vor jeder Aktion

Jeder neue Chat, Technical Lead oder Coding Agent liest mindestens in dieser Reihenfolge:

1. `JETNITY_START_HERE.md`
2. `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md`
3. `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
4. `docs/CHATGPT_CURSOR_WORKFLOW.md`
5. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
6. `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
7. `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`
8. `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
9. `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
10. `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
11. `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
12. `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md`
13. `docs/JETNITY_BINDING_BUILD_ORDER.md`
14. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
15. `JETNITY_HANDOFF.md`
16. `docs/ACTIVE_WORK_STATUS.md`
17. den aktuell aktiven Slice-Task/Status/Handoff sowie relevante ADRs/Checkpoints.

Danach zwingend live verifizieren:

- aktuellen `main`-SHA und Merge-Stand;
- offene PRs/Draft-PRs und Branches;
- Ahead/Behind/Merge-Base;
- GitHub Actions und Vercel;
- Supabase/Migrationen, wenn für den Slice relevant;
- offene Review-Threads/Blocker;
- ob historische PRs/Dokumente nur Evidence ihres Zeitpunkts sind.

Bei Widerspruch gilt: **Live-Evidence bestimmen, aktuelle Product-Owner-Entscheidung anwenden, Abweichung dokumentieren und kanonische Continuity korrigieren.**

Für Ready/Merge gilt zusätzlich die feste Priorität aus `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md`.

## 2. Verbindliche Produkt- und Engineering-Wahrheit

Jetnity muss produktionsreif, wartbar, testbar, sicher, performant und auf Mobile/Tablet/Desktop kohärent gebaut werden.

Verbindlich:

- keine Demo-/Placeholder-Wahrheit als Endzustand;
- `unknown`, `stale`, `error`, `unavailable`, `insufficient_context`, `empty` und bestätigte Zustände getrennt halten;
- keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health, erfundene Visa-/Einreise-/Safety-/Live-Truth;
- LLM/Assistant erklärt, strukturiert und priorisiert Hard Truth, erzeugt sie aber nicht;
- starke Security, Privacy, Ownership/RLS und Least Privilege;
- Accessibility und Performance sind Teil der Definition of Done;
- adversarial Self-Review plus unabhängiger Technical-Lead-Review;
- vollständige Exact-Head-Gates, CI und Vercel-Evidence;
- keine stillen Shared-Contract- oder Scope-Erweiterungen.

Produktleitsatz:

> **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

## 3. Traveller-Wahrheit

Kanonisch:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Keine relevante Funktion darf still genau eine Staatsbürgerschaft oder einen Default-Pass annehmen. Ausstellerland ist nicht automatisch Staatsbürgerschaft. Wenn notwendige Evidence fehlt, bleibt Official/Regulatory `insufficient_context`/`unknown` statt erfunden.

Foundation E ist vorhanden und wird nicht neu gebaut. Neue Speicherung von Passscans, MRZ, Biometrie oder ähnlich sensitiven Daten ist ein besonderes Product-Owner-Gate.

## 4. Shared Contracts

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

Ein Fachagent dokumentiert einen nötigen Shared-Contract-Change und stoppt. Der Technical Lead entscheidet Architektur, Owner und separaten kontrollierten Slice. Besondere Product-Owner-Gates bleiben unabhängig vom Merge-Gate bestehen.

## 5. Agentenmodell

Exakte Cursor-Anzeigenamen:

1. `Trip workspace audit architecture`
2. `Account plattform audit vorbereitung`
3. `Jetnity provider readiness audit`
4. `Admin platform audit`
5. `Jetnity growth discoverability`
6. `Jetnity quality security audit`
7. `Jetnity native app architecture` – für die spätere Native-Phase reserviert.

`Jetnity quality security audit` ist unabhängige QA/Security/Release-Prüfinstanz, kein allgemeiner Feature-Entwickler. `Jetnity native app architecture` folgt dem Native-Standard und wird erst am dafür vorgesehenen Checkpoint aktiviert.

## 6. Live-verifizierter integrierter Stand

Aktueller `main`:

`2bb6b8072fa04e8f6db2d989b84ada7b64745fd9`

Dieser Stand enthält insbesondere:

- Foundation C – Readiness;
- Foundation D – Route & Transit Intelligence;
- Foundation E – Traveller Context;
- Travel Safety & Disruption Intelligence Foundation;
- Travel Timing & Seasonal Intelligence;
- Account AP-1 bis AP-3;
- Provider Readiness S1 bis S3;
- Admin Slice A bis C;
- TW-1 / PR #56 – Shell & Geräteparität;
- TW-2 / PR #58 – Reiseübersicht;
- TW-4 / PR #60 – Jetzt wichtig;
- TW-3 / PR #64 – Timeline / Etappe / Tag;
- QS-1 / PR #67 – Audit-Evidence;
- TW-5 / PR #66 – Item- und Gap-Details;
- Post-TW5 Continuity / PR #68;
- D0/G0 Foundation Audit Evidence / PR #69.

TW-5 bleibt technisch integriert. Der historische TW-5-Merge-Commit ist `6f2beeccae2c1e6bdf9bcb9fdc35a5cd56e50bec`; die spätere docs-only Continuity und der D0/G0-Audit-Merge haben `main` danach weiterbewegt.

PR #69 war docs-only Audit-Evidence. Sein Merge ohne die nach der aktuellen Governance erforderliche ausdrückliche Product-Owner-Merge-Freigabe ist als Governance-Fehler dokumentiert; kein destruktiver Rollback wird allein deshalb erzeugt.

## 7. Aktiver D0-1-Stand

Draft-PR #70: `D0-1 – Index Boundary Contract`

Branch:

`fix/d0-1-index-boundary-contract`

Exact Head:

`31022a5d0c4090081339e55bd2b7c7b3927e1185`

Independent Technical-Lead Re-Review: **TECHNICAL PASS / review-bereit**.

Bestätigt sind insbesondere:

- `/reisen` und `/reisen/[tripId]` explizit `noindex, nofollow`;
- `/reisen` aus Sitemap entfernt;
- robots-Allow-Modus für private/sensitive Pfade gehärtet;
- `/planen` bleibt ohne akzeptierte Intent-Keys öffentliche Basis;
- bei Präsenz von `idee`, `ziel` oder `zielId` wird `/planen` unabhängig von leer/Whitespace/Wert/Array `noindex, nofollow`;
- `/admin/login`, `/unauthorized` und Admin-Layout explizit `noindex`;
- keine D0-1-DB-/RLS-/Auth-/Traveller-/Route-/Provider-/Payment-/Tracking-/Kostenänderung;
- Exact-Head GitHub Actions SUCCESS;
- Exact-Head Vercel Preview READY;
- Supabase Production unverändert `ACTIVE_HEALTHY` ohne D0-1-Migration.

**PR #70 bleibt Draft / Integration Hold. Kein Ready. Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**

## 8. Aktive Governance-Reparatur

Docs-only Draft-PR #71:

`docs: restore Product Owner merge governance`

Branch:

`docs/merge-governance-repair-2026-08-25`

Ziel:

- Ready-/Merge-Widerspruch zwischen PO-Merge-Policy und späteren Autonomie-Texten beseitigen;
- klare Supersession versionieren;
- Technical-Lead-Autonomie bis zur technischen Review-Reife erhalten;
- Ready/Merge wieder eindeutig an die aktuelle ausdrückliche Product-Owner-Freigabe binden;
- historische Dokumente nicht destruktiv umschreiben, sondern ihre alte Merge-Autonomie global superseden.

PR #71 ist docs-only. Kein Runtime-Code, keine DB-/Security-/Provider-/Kostenänderung.

## 9. Nächste Trip-Workspace-Kante

**TW-6 ist noch nicht automatisch freigegeben.**

Gemäß `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`:

- TW-6 – Create-Entry angleichen, erst nach dokumentiertem Product-Owner-Schnitt + Guest-One-Trip-Vertrag;
- TW-7 – Hub-Anschluss, abhängig vom Account-/Hub-Vertrag;
- TW-8 – Commercial Surfaces, abhängig von Provider S5;
- TW-9 – Polish, Evidence, Closure;
- danach finaler Function-by-Function-/Intelligence-Audit.

Keine Abhängigkeit still umgehen und keine große Build-Reihenfolge eigenmächtig ändern.

## 10. Workstream-Lage

- `Trip workspace audit architecture`: TW-5 abgeschlossen; wartet.
- `Account plattform audit vorbereitung`: wartet; AP-1–AP-3 integriert.
- `Jetnity provider readiness audit`: wartet; S1–S3 integriert.
- `Admin platform audit`: wartet; A–C integriert.
- `Jetnity growth discoverability`: D0/G0 Audit integriert; D0-1 auf PR #70 technisch PASS, jetzt STOPP / Integration Hold.
- `Jetnity quality security audit`: QS-1 abgeschlossen; für unabhängige Checkpoints reserviert.
- `Jetnity native app architecture`: für spätere Native-Phase reserviert.

Aktuell wird **kein neuer Cursor-Agent gestartet**. Die Governance-Reparatur #71 wird direkt durch ChatGPT / Technical Lead docs-only geführt.

## 11. Supabase / Production

Supabase Production:

`qscbgcdmivbbnzrcyegn`

Live verifiziert: `ACTIVE_HEALTHY`.

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

Development enthält zusätzlich die nicht Production-approved Migrationen:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

D0-1 und Governance-Reparatur #71 ändern Production nicht.

## 12. Technical-Lead-Autonomie und Merge-Gate

ChatGPT / Technical Lead steuert normale Engineering-Arbeit innerhalb der dokumentierten Grenzen weitgehend selbstständig bis zur **technischen Review-Reife**.

Danach gilt hart:

> **Kein Ready und kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe für den konkret besprochenen PR, sofern der Product Owner im konkreten Fall nichts anderes bestimmt.**

Technischer PASS, grüne Tests, CI SUCCESS, Vercel READY, `mergeable=true`, 0 Threads oder eine frühere allgemeine Autonomie sind keine Merge-Freigabe.

Nach gültiger Freigabe prüft der Technical Lead Exact Head und Integrationsstand erneut und darf dann den konkret freigegebenen PR Ready setzen / mergen.

Besondere Production-/Provider-/Kosten-/Payment-/Sensitive-Data-/Auth-/Launch-Gates bleiben zusätzlich und getrennt bestehen.

## 13. Offene Governance-/Engineering-Risiken

- `main` Branch Protection ist live weiterhin nicht aktiviert.
- historische Dokumente enthalten stellenweise alte Auto-Merge-Formulierungen; sie bleiben Evidence ihres Zeitpunkts, sind aber für Ready/Merge durch `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md` global superseded.
- QS-1 P2/P3-Findings bleiben dokumentierte Follow-ups.
- TW-6-Abhängigkeit ist vor Runtime-Start weiterhin zu klären.
- D0-1 schließt nicht die übrigen D0/G0-Findings wie Legal-404, Canonical/Origin, hreflang, JSON-LD oder Attribution/Consent.

## 14. Continuity-Regel

Kein relevanter Fortschritt darf nur im Chat existieren. Nach Reviews, Merges, Integrationsentscheidungen, Governance-Entscheidungen und Statusänderungen werden Active Work, Handoffs, Slice-Status und Checkpoints im Repository nachgezogen.

Ein neuer Chat behauptet niemals aus Erinnerung oder Screenshot, ein PR sei aktuell, grün oder gemergt. **Immer live verifizieren.**

Für Ready/Merge niemals aus einem historischen Task oder alten Autonomie-Text ableiten. **Product Owner entscheidet den Merge.**
