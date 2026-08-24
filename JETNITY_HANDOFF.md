# Jetnity – Handoff und nächste Schritte

Stand: **24. August 2026, nach Merge von Admin Slice B / PR #46**  
Status: **kanonischer operativer Einstieg für neue Chats/Agenten**

> Vor jeder neuen Aktion GitHub/CI/Vercel/Supabase live verifizieren. Historische Handoffs bleiben Evidence ihres damaligen Zeitpunkts und dürfen neuere zentrale Wahrheit nicht überschreiben.

## Aktuelle operative Wahrheit

Repository: `Jetnity/jetnity`

- `main`: `e3bad749c8e03512001e7bccd5e08467f10a7134`
- letzter Merge: **Admin Control Center Slice B / PR #46**
- PR #46: merged / closed nach separater ausdrücklicher Product-Owner-Merge-Freigabe
- Vercel Production: `dpl_GpE7FWRcDGvVqhRyrZUvMDQDvG1n` = **READY** auf exakt `e3bad749...`
- Supabase Production endet bei `20260824140000_flug_route_itinerary_untrusted_surface`
- Supabase Development enthält zusätzlich `20260824160000` und `20260824180000`; beide bleiben Development-only und nicht Production-approved
- keine DB-/RLS-/Capability-/Provider-/Secret-/Kostenänderung durch Admin B
- `main` Branch Protection technisch weiterhin nicht umgesetzt; PO-Freigabe zur Härtung besteht, verbundene GitHub-Schnittstelle kann sie derzeit nicht setzen

## Aktive Workstreams

### Admin

- Slice A / PR #44: merged
- Slice B / PR #46: merged
- nächster Block: **Slice C / PR #49 – Provider & Cost Board**
- #49 basiert historisch auf dem alten B-Stack; nicht blind weiterentwickeln
- zuerst gegen neuen `main` `e3bad749...` neu beurteilen, sauber synchronisieren/retargeten und dann im dokumentierten read-only Scope fortsetzen
- kein echter Provider, kein Secret, kein Vertrag, kein paid call, keine Fake-Health-/Cost-Wahrheit

### Account

- AP-1/AP-2: merged
- AP-3 / PR #53: open Draft, implementiert/gegatet, wartet auf unabhängigen Technical-Lead-Review
- Runtime Head `612d819ed9691f93cbab97128e301b0b7744721b`
- aktueller PR Head `5fb879f5556012ab5a34584b4ba8a319ce6754a1`
- ADR-0160
- da `main` inzwischen durch #46 weitergelaufen ist, vor späterer Merge-Entscheidung Current-Main-Integration prüfen und falls nötig synchronisieren/re-gaten

### Provider Readiness

- S1/S2: merged
- S3 / PR #54: open Draft, implementiert/gegatet, wartet auf unabhängigen Technical-Lead-Review
- Runtime Head `e284af5524e7a95bf47dca2f7b77bc4f5ed171e9`
- aktueller PR Head `2e9a1a7ff0d8ccef6945cbc70aa3833743d076f1`
- ADR-0161
- kein echter Provider/Secret/Vertrag/paid call/Production-Migration
- vor späterer Merge-Entscheidung Current-Main-Integration prüfen und falls nötig synchronisieren/re-gaten

### Trip Workspace Audit

- PR #55: open Draft, docs-only Audit/Zielarchitektur technisch vorbereitet
- Head `536ed50ffda0279973058f7a2b78ee98217e7aad`
- wartet auf unabhängigen Technical-Lead-Review
- kein Runtime-Umbau

## Große Reihenfolge

1. Account + Admin sauber aufbauen; Provider Readiness parallel weiterführen.
2. Danach Trip Workspace / Reiseübersicht grundlegend implementieren.
3. Danach Homepage weiterentwickeln.

Weltkarte, Matching, Reisebuch, Trends/Hotspots usw. sind Wünsche/Optionen und kein automatischer Pflichtblock.

## Verbindliche ADR-Allokation

- ADR-0158 = Admin A
- ADR-0159 = Admin B
- ADR-0160 = Account AP-3
- ADR-0161 = Provider S3

## Harte Governance

- Kein Mark Ready ohne ausdrückliche aktuelle PO-Freigabe.
- Kein Merge ohne separate ausdrückliche aktuelle PO-Freigabe.
- Production-Migrationen separat freigeben.
- Provideraktivierung, Secrets/API-Keys, Verträge und kostenpflichtige Calls separat freigeben.
- laufende Infrastruktur-/Providerkosten > USD 100/Monat nur nach PO-Freigabe.
- Shared Auth/RLS/Identity/Guest→Account/Traveller/Route/Privacy/Billing/Admin-Audit/Provider-Activation seriell unter Technical-Lead-Steuerung.
- mehrere Staatsbürgerschaften und Reisedokumente in relevanten Funktionen berücksichtigen.
- `unknown` bleibt `unknown`; keine Fake-Truth.

## Kanonische Einstiegsquellen

1. `docs/CURRENT_MULTI_AGENT_TEAM_STATUS.md`
2. `JETNITY_HANDOFF.md`
3. `docs/ACTIVE_WORK_STATUS.md`
4. `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-08-24.md`
5. `docs/CHATGPT_TECHNICAL_LEAD_CONTINUITY.md`
6. jeweilige aktuelle Slice-Handoffs/Reviews

## Nächste Schritte

- Admin: #49 auf neuen `main` synchronisieren/retargeten und Slice C kontrolliert fortsetzen.
- Technical Lead: #53, #54 und #55 unabhängig reviewen.
- Nach jedem relevanten Merge oder größeren Statuswechsel PR #52 und die zentralen Handoff-/Checkpoint-/Active-Work-Dokumente zeitnah aktualisieren.

PR #52 bleibt Draft. Kein Ready/Merge von #52 ohne ausdrückliche PO-Freigabe.