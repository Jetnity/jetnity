# Jetnity – Handoff und nächste Schritte

Stand: **25. August 2026, ca. 00:15 Europe/Zurich**  
Status: **kanonischer operativer Einstieg für neue Chats/Agenten**

> Vor jeder neuen Aktion GitHub/CI/Vercel/Supabase live verifizieren. Historische Handoffs bleiben Evidence ihres damaligen Zeitpunkts und dürfen neuere zentrale Wahrheit nicht überschreiben.

## Aktuelle operative Wahrheit

Repository: `Jetnity/jetnity`

- aktueller `main`: `f8e252880d31fe462537f33be4496044951ae4a9`
- letzter PR-Merge: **Trip Workspace Audit / PR #55**, Merge-Commit `08fd7748ace072544e189c94880562e050971811`
- die danach folgenden `main`-Commits `c42017f5...` und `f8e25288...` sind **docs-only Kontinuitätsupdates**, keine Runtime-Änderungen
- PR #55: **merged / closed** nach ausdrücklicher PO-Ready- und separater PO-Merge-Freigabe
- PR #55 war docs-only; **Merge ≠ Annahme der vorgeschlagenen Ziel-IA und ≠ TW-1-Freigabe**
- Supabase Production endet bei `20260824140000_flug_route_itinerary_untrusted_surface`
- Supabase Development enthält zusätzlich `20260824160000` und `20260824180000`; beide bleiben Development-only und nicht Production-approved
- `main` Branch Protection technisch weiterhin nicht umgesetzt; PO-Freigabe zur Härtung besteht, verbundene GitHub-Schnittstelle kann sie derzeit nicht setzen

## Workstreams

### Admin – Agent `Admin platform audit`

- Slice A / PR #44: merged
- Slice B / PR #46: merged
- Slice C / PR #49: merged
- ADR-0162
- Independent Technical-Lead Ergebnis für C: **PASS / Technical Integration Closure**
- geerbter Billing-/Refund-P1 bleibt separater Pflichtblock
- **Agent wartet. Slice D–K bleiben offen, aber Slice D startet erst mit neuem kontrollierten Auftrag.**

### Account – Agent `Account plattform audit vorbereitung`

- AP-3 / PR #53 / ADR-0160: **merged / closed**
- Merge-Commit: `8326e72f9557a8b9b200e680b0be24aefa0bdfa8`
- Independent Technical-Lead Ergebnis: **PASS / Technical Integration Closure**
- **Agent wartet. Kein AP-4 ohne neuen kontrollierten Auftrag und Shared-Gate.**

### Provider Readiness – Agent `Jetnity provider readiness audit`

- S3 / PR #54 / ADR-0161: **merged / closed**
- Independent Runtime/Security/Truth Review: **PASS / Technical Integration Closure**
- Merge-Commit: `b7f027ec448639fe3399512d401a7789b24e52a6`
- Residual bleibt dokumentiert: `reise_anlegen` / direkte `trip_items`-Writes können transfer/rental_car User-Intake-Handelsfelder setzen; keine Production-Migration autorisiert
- **Agent wartet. Kein S4 ohne neuen kontrollierten Auftrag.**

### Trip Workspace – Agent `Trip workspace audit architecture`

- PR #55 / Audit & Zielarchitektur: **merged / closed**, docs-only
- Exact Head vor Merge: `842797b8f7ab20742b51c54669e9f73acb44241e`
- Merge-Commit: `08fd7748ace072544e189c94880562e050971811`
- kein Runtime-Umbau, keine DB/RLS/Auth-/Secret-Änderung
- Ziel-IA bleibt **nicht angenommener Product-Owner-Vorschlag**
- **Agent wartet. Kein TW-1 ohne neuen kontrollierten Auftrag.**

## Kontrollierte Reihenfolge

1. Account #53: integriert / erledigt
2. Provider #54: integriert / erledigt
3. Trip-Workspace-Audit #55: integriert / erledigt, docs-only
4. **Jetzt:** Technical Lead bewertet die vorgeschlagene Ziel-IA als Ganzes; Product Owner entscheidet ausdrücklich über Annahme/Änderungen und Start von TW-1
5. Nur bei Freigabe: neuer kontrollierter Auftrag an Agent `Trip workspace audit architecture` für TW-1
6. Admin/Account/Provider bleiben bis zu eigenen neuen Aufträgen stehen

## Große Produkt-Reihenfolge

1. Account + Admin sauber weiterführen; Provider Readiness vollständig weiterführen.
2. Trip Workspace / Reiseübersicht als nächsten großen Runtime-Block nur nach ausdrücklicher IA-/TW-1-Entscheidung.
3. Danach Homepage weiterentwickeln.

Weltkarte, Matching, Reisebuch, Trends/Hotspots usw. sind Wünsche/Optionen und kein automatischer Pflichtblock.

## Verbindliche ADR-Allokation

- ADR-0158 = Admin A
- ADR-0159 = Admin B
- ADR-0160 = Account AP-3 / `main`
- ADR-0161 = Provider S3 / `main`
- ADR-0162 = Admin C / `main`
- Trip-Workspace-Ziel-IA hat **keine angenommene ADR-Nummer**

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

- `Trip workspace audit architecture`: wartet; kein TW-1, bis IA/TW-1 ausdrücklich entschieden wurde.
- `Jetnity provider readiness audit`: wartet; kein S4.
- `Account plattform audit vorbereitung`: wartet; kein AP-4.
- `Admin platform audit`: wartet; kein Slice D.
- Nach jedem relevanten Merge oder größeren Statuswechsel PR #52 und die zentralen Handoff-/Checkpoint-/Active-Work-Dokumente zeitnah aktualisieren.

PR #52 bleibt Draft und ist historisch hinter `main`; vor einer späteren Integration erst auf dann aktuellen `main` synchronisieren und neu gaten. Kein Ready/Merge von #52 ohne ausdrückliche PO-Freigabe.