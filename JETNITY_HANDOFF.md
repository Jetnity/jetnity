# Jetnity – Handoff und nächste Schritte

Stand: **24. August 2026, Live-Abgleich ab 18:50 Europe/Zurich**  
Status: **kanonischer operativer Einstieg; Admin Slice A auf `main`; vier parallele Workstreams bis zu ihren Review-Gates fortgeschritten**

> **Vor jeder neuen Arbeit GitHub, CI, Vercel und Supabase live verifizieren. Historische Handoffs sind Evidence ihres damaligen Zeitpunkts, keine automatisch aktuelle operative Wahrheit.**

## 1. Zuerst lesen

Für einen neuen Chat/Agent gilt diese Reihenfolge:

1. `docs/CURRENT_MULTI_AGENT_TEAM_STATUS.md` – **aktuellste kompakte operative Wahrheit**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-08-24.md`
4. `docs/CHATGPT_TECHNICAL_LEAD_CONTINUITY.md`
5. `docs/DOMAIN_PROGRAM_COMPLETION_POLICY.md`
6. `docs/NEW_CHAT_START_PROMPT_2026-08-24.md`
7. die dort genannten aktuellen Slice-Handoffs / PRs

Wenn diese Dokumente später hinter den Live-Systemen liegen: **nicht raten; live verifizieren und den neueren belegten Stand wieder zentral persistieren.**

## 2. Aktueller `main` / Production

Repository: `Jetnity/jetnity`

- `main`: `1ec93cc9f6d70bd57ea054463e4ba8e3822a2267`
- letzter Merge: **PR #44 – Admin Control Center Slice A**
- PR #44: merged / closed
- Vercel Production: `dpl_83gKPm2vWETL7Jq1osdzcuTp4QP7` = READY auf exakt `1ec93cc9...`
- Supabase Production endet weiterhin bei `20260824140000_flug_route_itinerary_untrusted_surface`
- `20260824160000` und `20260824180000` bleiben **nur Development** und sind nicht Production-approved.

GitHub meldet `main` weiterhin `protected: false`. Der Product Owner hat Branch-Protection-/Ruleset-Härtung freigegeben; die verbundene GitHub-Schnittstelle kann sie aktuell nicht mutieren. **Nicht als umgesetzt behaupten.**

## 3. Aktuelle Workstreams

### Admin – PR #46 / Slice B

Agent: `Admin platform audit`

- open / **Ready for Review** / mergeable / unmerged
- Ready wurde vom Product Owner ausdrücklich freigegeben
- **Merge nicht freigegeben**
- Runtime Head `1715640bffc36d7ebe1a25de7aeb569632b7811f`
- aktueller docs-only Head `2ca916e91dbf53f9c5cad9a980cc141938fbebe6`
- Independent Technical-Lead Review: **PASS / Technical Integration Closure**
- aktueller docs-only CI `32752819622` SUCCESS
- aktueller Vercel `dpl_8brgbYwJ7datm1uURAmuaooki72G` READY
- ADR-0159
- kein weiterer bekannter Runtime-Fix vor Merge-Entscheidung
- PR #49 / Slice C bleibt vorbereitet; nicht starten, bis B integriert und C neu auf aktuellen `main` synchronisiert/gegatet wurde.

### Account – PR #53 / AP-3

Agent: `Account plattform audit vorbereitung`

- open Draft
- implementiert und gegatet
- wartet auf unabhängigen Technical-Lead-Review
- Runtime Head `612d819ed9691f93cbab97128e301b0b7744721b`
- aktueller docs-only Head `5fb879f5556012ab5a34584b4ba8a319ce6754a1`
- ADR-0160
- aktueller CI `32753032302` SUCCESS
- Vercel `dpl_83ReRsDgZoyGga19arfyC8L3WWtb` READY
- kein Archiv-Write / keine Migration / kein RLS-/Auth-/Traveller-Contract
- kein Ready / Merge / AP-4 vor Review und PO-Gates.

### Provider – PR #54 / S3

Agent: `Jetnity provider readiness audit`

- open Draft
- implementiert und gegatet
- wartet auf unabhängigen Technical-Lead-Review
- Runtime Head `e284af5524e7a95bf47dca2f7b77bc4f5ed171e9`
- aktueller docs-only Head `2e9a1a7ff0d8ccef6945cbc70aa3833743d076f1`
- ADR-0161
- aktueller CI `32752931378` SUCCESS
- Vercel `dpl_HErGVCe9HAKP1o9ymraV5xDd8i9P` READY
- kein echter Provider / kein Secret / keine kostenpflichtigen Calls / keine Production-Migration
- kein Ready / Merge / S4 vor Review und PO-Gates.

### Trip Workspace – PR #55 / Audit & Architecture

Agent: `Trip workspace audit architecture`

- open Draft
- docs-only Audit/Zielarchitektur vorbereitet
- wartet auf unabhängigen Technical-Lead-Review
- Exact Head `536ed50ffda0279973058f7a2b78ee98217e7aad`
- CI `32752434172` SUCCESS
- Vercel `dpl_4adqadJzbDwHJMWg4jVs2ZrjDJy9` READY
- **kein Runtime-Umbau**
- Audit ist Vorbereitung des nächsten großen Produktblocks, nicht dessen Fertigstellung.

## 4. ADR-Allokation

- ADR-0158 = Admin Slice A / #44 / `main`
- ADR-0159 = Admin Slice B / #46
- ADR-0160 = Account AP-3 / #53
- ADR-0161 = Provider S3 / #54

Parallel entstandene Kollisionen wurden auf #53/#54 docs-only korrigiert und neu gegatet.

## 5. Große Reihenfolge

1. Account + Admin sauber aufbauen; Provider Readiness parallel weiterführen.
2. Danach Trip Workspace / Reiseübersicht grundlegend überarbeiten – auf Basis des Audits #55.
3. Danach Homepage weiterentwickeln.

Weltkarte, Matching, Reisebuch, Trends/Hotspots usw. bleiben Wünsche/Optionen und sind nicht automatisch der nächste Pflichtblock.

## 6. Bereichsprogramme enden nicht am aktuellen Slice

- Account: vollständiger Plan bis AP-12.
- Admin: vollständiger Plan A–K.
- Provider Readiness: vollständiger Plan S1–S8; echte Providerphase danach separat gegatet.

Authoritativ: `docs/DOMAIN_PROGRAM_COMPLETION_POLICY.md`.

## 7. Harte Governance

- Kein Mark Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Kein Merge ohne danach separate ausdrückliche aktuelle Product-Owner-Freigabe.
- CI/Vercel/Technical Closure ersetzen keine Freigabe.
- Production-Migrationen sind separate Gates.
- Provideraktivierung, Secrets/API-Keys, Verträge und kostenpflichtige Calls sind separate Gates.
- laufende Infrastruktur-/Providerkosten > USD 100/Monat nur nach PO-Freigabe.
- Shared Auth/Identity/Sessions/MFA/AAL/RLS/Ownership/Guest→Account/Traveller/Route/Privacy/Billing/Admin-Audit/Provider-Activation seriell unter Technical-Lead-Steuerung.
- Multi-Citizenship / mehrere Reisedokumente bei relevanten Funktionen berücksichtigen.
- `unknown` bleibt `unknown`; LLM ist nie Hard-Truth-Quelle für regulatorische, Safety-, Preis-, Verfügbarkeits- oder Providerwahrheit.
- keine stillen Scope-Erweiterungen.

## 8. Exakter nächster operativer Stand

- #46 wartet nach Ready auf **separate Merge-Entscheidung des Product Owners**.
- #53 unabhängig reviewen.
- #54 unabhängig reviewen.
- #55 unabhängig reviewen.
- #49 nicht starten, bevor #46 integriert und #49 neu synchronisiert/gegatet ist.
- nach jedem relevanten Merge oder größeren Statuswechsel PR #52 + zentrale Handoff-/Checkpoint-/Active-Work-Dokumente zeitnah aktualisieren.

Keine Runtime-, Production-, Provider-, Secret- oder Kostenänderung ist durch diesen Handoff autorisiert.
