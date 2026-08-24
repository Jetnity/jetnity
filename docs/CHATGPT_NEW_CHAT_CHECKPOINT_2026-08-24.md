# Jetnity – New Chat Technical Lead Checkpoint

Stand: **24. August 2026, Live-Abgleich ab 18:50 Europe/Zurich**  
Status: **aktueller kanonischer Chat-Wechsel-Checkpoint**

> Dieser Checkpoint ersetzt den früheren 16:45-Zustand als aktuelle operative Einstiegsaussage. Frühere Heads/PR-Statusangaben aus demselben Tag sind historische Evidence. Vor Eingriffen trotzdem GitHub/CI/Vercel/Supabase live verifizieren.

## 1. Aktueller `main`

Repository: `Jetnity/jetnity`

- `main`: `1ec93cc9f6d70bd57ea054463e4ba8e3822a2267`
- letzter Merge: **Admin Control Center Slice A / PR #44**
- PR #44: merged / closed
- Vercel Production: `dpl_83gKPm2vWETL7Jq1osdzcuTp4QP7` = READY auf exakt `1ec93cc9...`

Supabase Production:

- Project ref: `qscbgcdmivbbnzrcyegn`
- Production-Migrationen enden bei `20260824140000_flug_route_itinerary_untrusted_surface`
- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis` und `20260824180000_trip_items_flug_handelsfelder_guard` liegen weiterhin nur auf Development.
- **Keine Production-Migration dieser beiden Guards ist freigegeben.**

GitHub `main` bleibt technisch unprotected. Product Owner hat Branch-Protection-/Ruleset-Härtung freigegeben; die verbundene GitHub-Schnittstelle kann sie aktuell nicht mutieren. Nicht als umgesetzt behaupten.

## 2. Aktuelle parallele Workstreams

### Admin – PR #46

Agent: `Admin platform audit`

- Slice B read-only System Health
- open / **Ready for Review** / mergeable / unmerged
- Ready wurde ausdrücklich vom Product Owner freigegeben
- **Merge nicht freigegeben**
- Runtime Head `1715640bffc36d7ebe1a25de7aeb569632b7811f`
- aktueller docs-only Head `2ca916e91dbf53f9c5cad9a980cc141938fbebe6`
- ADR-0159
- Independent Technical-Lead Review: PASS / Technical Integration Closure
- aktueller docs-only CI `32752819622` SUCCESS
- Vercel `dpl_8brgbYwJ7datm1uURAmuaooki72G` READY
- kein weiterer bekannter Runtime-Fix vor einer Merge-Entscheidung.

PR #49 / Admin Slice C bleibt vorbereitet. Erst nach Integration von #46 auf den dann aktuellen `main` retargeten/synchronisieren und neu gaten.

### Account – PR #53

Agent: `Account plattform audit vorbereitung`

- AP-3 `Meine Reisen` Lebenszyklus
- open Draft / implementiert und gegatet / wartet auf unabhängigen Technical-Lead-Review
- Runtime Head `612d819ed9691f93cbab97128e301b0b7744721b`
- aktueller docs-only Head `5fb879f5556012ab5a34584b4ba8a319ce6754a1`
- ADR-0160
- aktueller CI `32753032302` SUCCESS
- Vercel `dpl_83ReRsDgZoyGga19arfyC8L3WWtb` READY
- keine Migration / kein Archiv-Write / kein RLS-/Auth-/Traveller-/Guest→Account-/Billing-Contract.

### Provider – PR #54

Agent: `Jetnity provider readiness audit`

- S3 Mobility/Rental Nachweis
- open Draft / implementiert und gegatet / wartet auf unabhängigen Technical-Lead-Review
- Runtime Head `e284af5524e7a95bf47dca2f7b77bc4f5ed171e9`
- aktueller docs-only Head `2e9a1a7ff0d8ccef6945cbc70aa3833743d076f1`
- ADR-0161
- aktueller CI `32752931378` SUCCESS
- Vercel `dpl_HErGVCe9HAKP1o9ymraV5xDd8i9P` READY
- kein echter Provider / Secret / Vertrag / paid call / Production-Migration.

### Trip Workspace – PR #55

Agent: `Trip workspace audit architecture`

- docs-only Audit/Zielarchitektur
- open Draft / technisch vorbereitet / wartet auf unabhängigen Technical-Lead-Review
- Exact Head `536ed50ffda0279973058f7a2b78ee98217e7aad`
- CI `32752434172` SUCCESS
- Vercel `dpl_4adqadJzbDwHJMWg4jVs2ZrjDJy9` READY
- keine Runtime-/DB-/RLS-/Auth-/Traveller-/Provider-/Homepage-/Finance-Änderung.

## 3. Verbindliche ADR-Allokation

- ADR-0158 = Admin Slice A / #44 / `main`
- ADR-0159 = Admin Slice B / #46
- ADR-0160 = Account AP-3 / #53
- ADR-0161 = Provider S3 / #54

Parallel entstandene Kollisionen wurden docs-only korrigiert und auf neuen Heads neu gegatet.

## 4. Große Entwicklungsreihenfolge

1. Account + Admin sauber aufbauen; Provider Readiness parallel weiterführen.
2. Danach Trip Workspace / Reiseübersicht als nächsten großen Produktblock implementieren, gestützt auf Audit #55.
3. Danach Homepage weiterentwickeln.

Weltkarte, Reisepartner-Matching, Reisebuch, Trends/Hotspots u. Ä. sind Wünsche/Optionen, keine automatische Pflicht oder nächster Schritt.

## 5. Bereichsprogramme

- Account läuft nach AP-3 weiter bis AP-12.
- Admin läuft nach B/C weiter bis A–K.
- Provider Readiness läuft nach S3 weiter bis S8; echte Providerphase danach separat gegatet.

Siehe `docs/DOMAIN_PROGRAM_COMPLETION_POLICY.md`.

## 6. Harte Governance

- kein Mark Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe
- kein Merge ohne danach separate ausdrückliche aktuelle Product-Owner-Freigabe
- Green CI/Vercel/Review/PASS ersetzt keine Freigabe
- Production-Migrationen separat
- Provideraktivierung / Secrets / API-Keys / Verträge / paid calls separat
- > USD 100/Monat laufende Infrastruktur-/Providerkosten nur nach PO-Freigabe
- Shared Auth/RLS/Identity/Guest→Account/Traveller/Route/Privacy/Billing/Admin-Audit/Provider-Activation seriell unter Technical-Lead-Steuerung
- Multi-Citizenship / mehrere Dokumente relevant durchgängig berücksichtigen
- `unknown` bleibt `unknown`; LLM ist keine Hard-Truth-Quelle
- keine stillen Scope-Erweiterungen.

## 7. Exakte nächste Technical-Lead-Reihenfolge

1. #46 nur nach separater aktueller Product-Owner-Merge-Freigabe mergen.
2. #53 unabhängig reviewen.
3. #54 unabhängig reviewen.
4. #55 unabhängig reviewen.
5. #49 erst nach Integration von #46 neu synchronisieren/planen.
6. Nach jedem relevanten Merge oder größeren Statuswechsel PR #52 + `JETNITY_HANDOFF.md` + `docs/ACTIVE_WORK_STATUS.md` + diesen Checkpoint + `docs/CURRENT_MULTI_AGENT_TEAM_STATUS.md` zeitnah auf die tatsächliche operative Wahrheit nachziehen.

## 8. Für einen neuen Chat

Zuerst lesen:

1. `docs/CURRENT_MULTI_AGENT_TEAM_STATUS.md`
2. `JETNITY_HANDOFF.md`
3. `docs/ACTIVE_WORK_STATUS.md`
4. dieses Dokument
5. `docs/CHATGPT_TECHNICAL_LEAD_CONTINUITY.md`
6. `docs/DOMAIN_PROGRAM_COMPLETION_POLICY.md`
7. aktuelle Handoffs von #46/#53/#54/#55.

Danach live verifizieren und erst dann handeln.
