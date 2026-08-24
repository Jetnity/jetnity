# Jetnity – Handoff und nächste Schritte

Stand: **24. August 2026, ca. 20:52 Europe/Zurich**  
Status: **kanonischer operativer Einstieg für neue Chats/Agenten**

> Vor jeder neuen Aktion GitHub/CI/Vercel/Supabase live verifizieren. Historische Handoffs bleiben Evidence ihres damaligen Zeitpunkts und dürfen neuere zentrale Wahrheit nicht überschreiben.

## Aktuelle operative Wahrheit

Repository: `Jetnity/jetnity`

- `main`: `78192ab775165d08bb357140c2d04b865b8cc049`
- letzter Merge: **Admin Control Center Slice C / PR #49**
- PR #49: merged / closed nach separater ausdrücklicher Product-Owner-Merge-Freigabe
- Vercel Production: `dpl_EkQorDSGW1JyHa4DYqzZRhngYFFa` = **READY** auf exakt `78192ab...`
- Supabase Production endet bei `20260824140000_flug_route_itinerary_untrusted_surface`
- Supabase Development enthält zusätzlich `20260824160000` und `20260824180000`; beide bleiben Development-only und nicht Production-approved
- keine Production-DB-/RLS-/Capability-/Provider-/Secret-/Kosten-/Finance-Live-Aktivierung durch #49
- `main` Branch Protection technisch weiterhin nicht umgesetzt; PO-Freigabe zur Härtung besteht, verbundene GitHub-Schnittstelle kann sie derzeit nicht setzen

## Workstreams

### Admin – `Admin platform audit`

- Slice A / PR #44: merged
- Slice B / PR #46: merged
- Slice C / PR #49: **merged auf `main` `78192ab...`**
- ADR-0162
- Independent Technical-Lead Ergebnis für C: **PASS / Technical Integration Closure**
- Scope bleibt read-only Provider & Cost Board; keine echte Provideraktivierung, Secrets, Verträge, paid calls, Migration/RLS/Capability oder Finance-Live
- `model_usage` bleibt begrenzte read-only Sicht, kein vollständiger Monatsabschluss
- geerbter Billing-/Refund-P1 bleibt separater Pflichtblock
- **Agent `Admin platform audit` wartet. Slice D–K bleiben offen, aber Slice D startet erst mit neuem kontrollierten Auftrag.**

### Account – `Account plattform audit vorbereitung`

PR #53 / AP-3:

- Draft, ADR-0160, aktueller Head `3863df7c7fbc0853b0e0a3c618096251fa595e2d`
- 200er-Truth-Fund wurde fail-honest korrigiert
- vorheriger Sync/Re-Gates auf `e3bad749...` waren grün (`c1ccfb6e...`, CI `32761572610`, Vercel `dpl_ERFzEa9dMQHncNJ9shajiPQrcMzj` READY)
- durch Merge #49 ist `main` jetzt `78192ab...`; #53 ist erneut hinter/divergiert und aktuell nicht mergeable
- **Nächster Schritt:** nur Current-Main-Sync auf `78192ab...`, zentrale Statuswahrheit erhalten, vollständige Exact-Head-Re-Gates, dann unabhängiger Technical-Lead-Re-Review
- kein Ready, kein Merge, kein AP-4 vorher

### Provider Readiness – `Jetnity provider readiness audit`

PR #54 / S3:

- Draft, ADR-0161, aktueller Head `f6b85570049a20146544e4f85503d6ff2c9703b4`
- Independent Review: S3-Trust-Grenzen sauber, kein zusätzlicher Runtime-/Security-/Truth-Fix im Scope gefunden
- vorheriger Sync/Re-Gates auf `e3bad749...` waren grün (CI `32762113958`, Vercel `dpl_EreSw6u5vc1GKnojDNGbWnNtvzG5` READY)
- durch Merge #49 ist #54 erneut hinter/divergiert und aktuell nicht mergeable
- **Nächster Schritt:** nur Current-Main-Sync auf `78192ab...` + Re-Gates; keine neue S3-Funktion, kein S4; danach Technical-Lead-Re-Review

### Trip Workspace Audit – `Trip workspace audit architecture`

PR #55:

- Draft / docs-only, aktueller Head `76ef850fa43fa9a97bafeb6077940b37eec56d9e`
- Independent Review: Audit/Zielarchitektur inhaltlich plausibel und scope-treu
- vorherige Current-Main-Reconciliation/Gates auf `e3bad749...` waren grün (CI `32763440821`, Vercel `dpl_2vRPwAD8rktAkTCwirP4Lg5Aw38o` READY)
- Kernfunde für späteren Workspace-Umbau: Safety/Seasonal-Orchestrierung unsichtbar, Mobile/Desktop unterschiedliche mentale Produktlogik, fehlende `Jetzt wichtig`-Attention-Schicht, Domain-lastige IA, Create-Flow/Pace-Default u. a.
- durch Merge #49 ist #55 erneut hinter/divergiert und aktuell nicht mergeable
- **Nächster Schritt:** docs-only Current-Main-/Docs-Reconciliation auf `78192ab...` + Re-Gates; kein Runtime-Umbau, kein TW-1; danach Technical-Lead-Re-Review

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

Neue Nummern erst durch Technical-Lead-Reservierung pro Slice.

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

- `Admin platform audit`: wartet nach Merge #49 auf neuen kontrollierten Slice-D-Auftrag.
- `Account plattform audit vorbereitung` / #53: Current-Main-Sync auf `78192ab...` + Re-Gates, dann unabhängiger Re-Review.
- `Jetnity provider readiness audit` / #54: Current-Main-Sync auf `78192ab...` + Re-Gates, dann unabhängiger Re-Review.
- `Trip workspace audit architecture` / #55: docs-only Current-Main-Reconciliation auf `78192ab...` + Re-Gates, dann unabhängiger Re-Review.
- Nach jedem relevanten Merge oder größeren Statuswechsel PR #52 und die zentralen Handoff-/Checkpoint-/Active-Work-Dokumente zeitnah aktualisieren.

PR #52 bleibt Draft. Kein Ready/Merge von #52 ohne ausdrückliche PO-Freigabe.