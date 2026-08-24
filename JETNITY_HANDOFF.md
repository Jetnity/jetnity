# Jetnity – Handoff und nächste Schritte

Stand: **24. August 2026, 20:36 Europe/Zurich**  
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

### Admin – `Admin platform audit`

- Slice A / PR #44: merged
- Slice B / PR #46: merged
- Slice C / PR #49: open Draft, auf aktuellem `main` synchronisiert, implementiert und unabhängig geprüft
- ADR-0162
- Runtime `965034d6c5ac412472ceca38be97863bf072e9c0`
- Remote-Gate-Head `bc60120f953508ede0410c26c9384f20d380738d`
- PR-Head nach TL-Review-Dokument `82f31bdced347ec5e6488fd81c16562f8653f491`
- Independent Technical-Lead Ergebnis: **PASS / Technical Integration Closure**
- Scope bleibt read-only Provider & Cost Board; keine echte Provideraktivierung, Secrets, Verträge, paid calls, Migration/RLS/Capability-Änderung oder Finance-Live
- `model_usage` ist eine begrenzte read-only Sicht, kein vollständiger Monatsabschluss
- geerbter Billing-/Refund-P1 bleibt separater Pflichtblock
- **Nächster Admin-Schritt: Product-Owner-Entscheidung zu Mark Ready. Merge danach separat. Slice D erst nach Integration von C und neuem Auftrag.**

### Account – `Account plattform audit vorbereitung`

PR #53 / AP-3:

- Draft; ursprüngliche Runtime `612d819ed9691f93cbab97128e301b0b7744721b`; zuletzt zentral beobachteter PR/docs Head `5fb879f5556012ab5a34584b4ba8a319ce6754a1`
- ADR-0160
- Independent Technical-Lead Review durchgeführt
- Grundlogik grundsätzlich sauber, aber **keine Current-Main-Closure** im zuletzt verifizierten Stand
- Review-Fund: 200er-Hinweis behauptet unbelegt, dass bei exakt 200 geladenen Reisen weitere Reisen gespeichert seien
- Agent-Auftrag: Current-Main-Sync + nur diese Truth-Korrektur + komplette Exact-Head-Re-Gates
- bis Re-Review: kein Ready, kein Merge, kein AP-4

### Provider Readiness – `Jetnity provider readiness audit`

PR #54 / S3:

- Draft; Functional Runtime `e284af5524e7a95bf47dca2f7b77bc4f5ed171e9`; zuletzt zentral beobachteter Head `2e9a1a7ff0d8ccef6945cbc70aa3833743d076f1`
- ADR-0161
- Independent Technical-Lead Review durchgeführt: **kein zusätzlicher Runtime-/Security-/Truth-Fix im S3-Scope gefunden**
- Browser nur IDs; serverseitiger Nachweis/Context; Testkatalog test-only; Production ohne Adapter fail-closed; keine erfundene booking_url; keine Migration/Secrets/Provideraktivierung/neuen Kosten
- offen bleibt Current-Main-Sync + Re-Gates; keine neue S3-Funktion, kein S4 vor Re-Review

### Trip Workspace Audit – `Trip workspace audit architecture`

PR #55:

- Draft / docs-only; zuletzt zentral beobachteter Head `536ed50ffda0279973058f7a2b78ee98217e7aad`
- Independent Technical-Lead Review durchgeführt: Audit/Zielarchitektur inhaltlich plausibel und scope-treu
- wichtige Funde für späteren Workspace-Umbau: Safety/Seasonal-Orchestrierung im Produktpfad unsichtbar, Mobile/Desktop unterschiedliche mentale Produktlogik, `Jetzt wichtig` fehlt als Attention-Layer, Domain-lastige IA, Create-Flow/Pace-Default sowie weitere dokumentierte P1/P2-Funde
- Multi-Citizenship korrekt nur als bestehende Traveller-Abhängigkeit behandelt; keine neue Truth/Registry
- offen: Current-Main-/Docs-Reconciliation + Re-Gates; kein Runtime-Umbau, kein TW-1

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
- ADR-0162 = Admin C

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

- `Admin platform audit` / #49: wartet nach Technical-Lead PASS auf ausdrückliche PO-Entscheidung zu Mark Ready.
- `Account plattform audit vorbereitung` / #53: Sync + 200er-Truth-Korrektur + Re-Gates abwarten, dann unabhängiger Re-Review.
- `Jetnity provider readiness audit` / #54: Current-Main-Sync + Re-Gates abwarten, dann unabhängiger Re-Review.
- `Trip workspace audit architecture` / #55: Current-Main-/Docs-Reconciliation + Re-Gates abwarten, dann unabhängiger Re-Review.
- Nach jedem relevanten Merge oder größeren Statuswechsel PR #52 und die zentralen Handoff-/Checkpoint-/Active-Work-Dokumente zeitnah aktualisieren.

PR #52 bleibt Draft. Kein Ready/Merge von #52 ohne ausdrückliche PO-Freigabe.