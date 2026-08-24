# Jetnity – Handoff und nächste Schritte

Stand: **24. August 2026, ca. 23:00 Europe/Zurich**  
Status: **kanonischer operativer Einstieg für neue Chats/Agenten**

> Vor jeder neuen Aktion GitHub/CI/Vercel/Supabase live verifizieren. Historische Handoffs bleiben Evidence ihres damaligen Zeitpunkts und dürfen neuere zentrale Wahrheit nicht überschreiben.

## Aktuelle operative Wahrheit

Repository: `Jetnity/jetnity`

- `main`: `b7f027ec448639fe3399512d401a7789b24e52a6`
- letzter Merge: **Provider Readiness S3 / PR #54 / ADR-0161**
- PR #54: **merged / closed** nach separater ausdrücklicher Product-Owner-Ready- und danach Merge-Freigabe
- finaler PR-Head #54: `2bb94ac5e7888b182d32e143e9d75c24b6917303`
- Merge-Commit #54 / aktueller `main`: `b7f027ec448639fe3399512d401a7789b24e52a6`
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
- Runtime-Head vor docs-only Follow-up: `2cb9a830f4fdaced5551022de6ddb1a7a9aa25a6`
- finaler PR-Head: `2bb94ac5e7888b182d32e143e9d75c24b6917303`
- finaler GitHub Actions Run: `32775510115` SUCCESS
- finaler Vercel Preview: `9bwWMA4YiVAh6rvK6ZojpR5j2ZHS` success/READY
- Merge-Commit / aktueller `main`: `b7f027ec448639fe3399512d401a7789b24e52a6`
- Residual bleibt dokumentiert: `reise_anlegen` / direkte `trip_items`-Writes können transfer/rental_car User-Intake-Handelsfelder setzen; keine Production-Migration autorisiert
- **Agent wartet. Kein S4 ohne neuen kontrollierten Auftrag.**

### Trip Workspace Audit – Agent `Trip workspace audit architecture`

PR #55:

- Draft / docs-only, nicht gemergt
- Audit/Zielarchitektur im Independent Review inhaltlich plausibel und scope-treu
- Provider #54 ist jetzt integriert
- **Jetzt nächster aktiver Workstream:** #55 ausschließlich docs-only gegen `main` `b7f027ec...` reconciliieren, zentrale operative Wahrheit aktualisieren, Exact-Head-Gates erneut belegen und danach für unabhängigen Technical-Lead-Re-Review stoppen
- kein Runtime-Umbau und kein TW-1 in diesem Schritt

## Kontrollierte Integrationsreihenfolge

1. **Account #53: integriert / erledigt**
2. **Provider #54: integriert / erledigt**
3. **jetzt Trip-Workspace-Audit #55:** finale Docs-Reconciliation → Re-Gates → Re-Review → PO-Ready-Gate → separates PO-Merge-Gate
4. danach neue kontrollierte Admin-/TW-Aufträge

## Große Produkt-Reihenfolge

1. Account + Admin sauber aufbauen; Provider Readiness vollständig weiterführen.
2. Danach Trip Workspace / Reiseübersicht grundlegend implementieren.
3. Danach Homepage weiterentwickeln.

Weltkarte, Matching, Reisebuch, Trends/Hotspots usw. sind Wünsche/Optionen und kein automatischer Pflichtblock.

## Verbindliche ADR-Allokation

- ADR-0158 = Admin A
- ADR-0159 = Admin B
- ADR-0160 = Account AP-3 / `main`
- ADR-0161 = Provider S3 / `main`
- ADR-0162 = Admin C / `main`

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

- `Trip workspace audit architecture` / #55: docs-only Reconciliation auf `main` `b7f027ec...`, Re-Gates, STOP für Technical-Lead-Re-Review.
- `Jetnity provider readiness audit`: wartet; kein S4.
- `Account plattform audit vorbereitung`: wartet; kein AP-4.
- `Admin platform audit`: wartet; kein Slice D.
- Nach jedem relevanten Merge oder größeren Statuswechsel PR #52 und die zentralen Handoff-/Checkpoint-/Active-Work-Dokumente zeitnah aktualisieren.

PR #52 bleibt Draft. Kein Ready/Merge von #52 ohne ausdrückliche PO-Freigabe.
