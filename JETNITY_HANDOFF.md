# Jetnity – Handoff und nächste Schritte

Stand: **24. August 2026, ca. 22:20 Europe/Zurich**  
Status: **kanonischer operativer Einstieg für neue Chats/Agenten**

> Vor jeder neuen Aktion GitHub/CI/Vercel/Supabase live verifizieren. Historische Handoffs bleiben Evidence ihres damaligen Zeitpunkts und dürfen neuere zentrale Wahrheit nicht überschreiben.

## Aktuelle operative Wahrheit

Repository: `Jetnity/jetnity`

- `main`: `8326e72f9557a8b9b200e680b0be24aefa0bdfa8`
- letzter Merge: **Account AP-3 / PR #53**
- PR #53: merged / closed nach separater ausdrücklicher Product-Owner-Ready- und danach Merge-Freigabe
- Vercel auf Merge-Commit `8326e72f...`: **success** (`QsCzDYvqigyCV2DaVMStrVvXUmBh`)
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
- **Agent `Admin platform audit` wartet. Slice D–K bleiben offen, aber Slice D startet erst mit neuem kontrollierten Auftrag.**

### Account – Agent `Account plattform audit vorbereitung`

PR #53 / AP-3 / ADR-0160:

- **merged / closed**
- finaler PR-Head `3222d8bc2624f940f5e904774de62d242fdac5fb`
- Merge-Commit / neuer `main`: `8326e72f9557a8b9b200e680b0be24aefa0bdfa8`
- GitHub Actions `32770952175`: **SUCCESS** auf finalem PR-Head
- Vercel auf finalem PR-Head: **success / READY** (`7bh88WLuDRnxQYqHLsbgZFy7Y6wN`)
- Independent Runtime/Re-Review: **PASS / Technical Integration Closure**
- 200er-Truth-Fund fail-honest korrigiert
- keine AP-4-, Migration-, RLS-, Auth-, Traveller-, Privacy-, Billing- oder Shared-Contract-Erweiterung
- **Agent `Account plattform audit vorbereitung` wartet. Kein AP-4 ohne neuen kontrollierten Auftrag und Shared-Gate.**

### Provider Readiness – Agent `Jetnity provider readiness audit`

PR #54 / S3 / ADR-0161:

- Draft, nicht gemergt
- S3-Code hielt im Independent Review die Trust-Grenzen; kein zusätzlicher Runtime-/Security-/Truth-Fix im Scope gefunden
- letzter gegateter Stand basierte auf älterem `main`
- **Jetzt nächster aktiver Workstream:** final auf `main` `8326e72f...` synchronisieren, danach Re-Gates und Technical-Lead-Re-Review
- keine neue S3-Funktionalität, kein S4, keine Provideraktivierung, keine Secrets, keine Production-Migration

### Trip Workspace Audit – Agent `Trip workspace audit architecture`

PR #55:

- Draft / docs-only, nicht gemergt
- Audit/Zielarchitektur im Independent Review inhaltlich plausibel und scope-treu
- **Agent wartet bewusst auf Provider-#54-Integration.** Danach finale docs-only Reconciliation auf den dann aktuellen `main`, Re-Gates und Technical-Lead-Re-Review
- kein Runtime-Umbau, kein TW-1

## Kontrollierte Integrationsreihenfolge

1. **Account #53: integriert / erledigt**
2. **Provider #54:** Current-Main-Sync → Re-Gates → Re-Review → PO-Ready-Gate → separates PO-Merge-Gate
3. danach Trip-Workspace-Audit #55 finale Docs-Reconciliation / Integration
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

- `Jetnity provider readiness audit` / #54: finaler Sync auf aktuellen `main`, Re-Gates und Re-Review.
- `Account plattform audit vorbereitung`: wartet; kein AP-4.
- `Trip workspace audit architecture`: wartet auf #54-Integration.
- `Admin platform audit`: wartet.
- Nach jedem relevanten Merge oder größeren Statuswechsel PR #52 und die zentralen Handoff-/Checkpoint-/Active-Work-Dokumente zeitnah aktualisieren.

PR #52 bleibt Draft. Kein Ready/Merge von #52 ohne ausdrückliche PO-Freigabe.
