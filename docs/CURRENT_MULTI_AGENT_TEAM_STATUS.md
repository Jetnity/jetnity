# Jetnity – Current Multi-Agent Team Status

Stand: **24. August 2026, nach Merge von Admin Slice B / PR #46**  
Status: **kanonische operative Team-Wahrheit für Chat-/Agent-Wechsel**

> Diese Datei ist die bevorzugte kompakte Einstiegsquelle für den aktuellen operativen Stand. Sie liegt auf `docs/chatgpt-technical-lead-handoff-2026-08-24` / Draft-PR #52 und ist bis zu einem Merge von #52 nicht automatisch `main`-Inhalt. Vor Eingriffen GitHub/CI/Vercel/Supabase live verifizieren.

## 1. Aktueller `main` / Production

- Repository: `Jetnity/jetnity`
- `main`: `e3bad749c8e03512001e7bccd5e08467f10a7134`
- letzter Merge: **Admin Control Center Slice B / PR #46**
- PR #46: **merged / closed** mit separater ausdrücklicher Product-Owner-Merge-Freigabe
- Vercel Production: `dpl_GpE7FWRcDGvVqhRyrZUvMDQDvG1n` = **READY**, Git SHA `e3bad749...`
- Supabase Production `qscbgcdmivbbnzrcyegn`: Migrationen enden bei `20260824140000_flug_route_itinerary_untrusted_surface`
- Supabase Development `yfvbxvijcorffwxbxahl` enthält zusätzlich `20260824160000` und `20260824180000`; beide bleiben **Development-only / nicht Production-approved**.
- PR #46 führte **keine** Migration, RLS-, Capability-, Provider-, Secret- oder Kostenänderung ein.
- `main` ist weiterhin technisch **nicht** durch Branch Protection/Required Checks geschützt. Product Owner hat die Härtung freigegeben; die verbundene GitHub-Schnittstelle bietet weiterhin keine passende Mutation. Nicht als umgesetzt behaupten.

## 2. Verbindliche ADR-Allokation

- ADR-0158 = Admin Slice A / PR #44 / `main`
- ADR-0159 = Admin Slice B / PR #46 / `main`
- ADR-0160 = Account AP-3 / PR #53
- ADR-0161 = Provider Readiness S3 / PR #54

## 3. Aktive / review-bereite Workstreams

### Admin – nächster Block Slice C / PR #49

Agent: `Admin platform audit`

Admin Slice B ist integriert. Der Agent darf jetzt weiterarbeiten, aber **nicht auf dem alten #49-Stack blind Runtime entwickeln**.

Nächster kontrollierter Schritt:

1. PR #49 / `feat/admin-provider-cost-board` gegen den neuen `main` `e3bad749...` neu beurteilen.
2. Branch/Base sauber auf den neuen Main-Integrationspunkt synchronisieren/retargeten.
3. Historische Slice-C-Dokumentation als Evidence behandeln, keine alte globale Wahrheit zurückbringen.
4. Erst danach Slice C – Provider & Cost Board im dokumentierten read-only Scope implementieren bzw. fortführen.
5. Vollständige lokale Gates + GitHub Actions + Vercel auf Exact Head + unabhängiger Technical-Lead-Review.
6. Kein Ready / kein Merge ohne neue separate PO-Freigaben.

Slice C darf keine echten Provider aktivieren, keine Secrets/Keys/Verträge/paid calls auslösen und keine Fake-Health-/Cost-Wahrheit anzeigen. Der geerbte Billing-/Refund-P1 bleibt separater Pflichtblock vor Finance-/Payment-Live.

### Account – PR #53 / AP-3

Agent: `Account plattform audit vorbereitung`

- Branch: `feat/account-ap3`
- ursprüngliche Base beim Slice-Start: `main` @ `1ec93cc9...`
- Status: **open Draft / implementiert und gegatet / wartet auf unabhängigen Technical-Lead-Review**
- Functional Runtime Head: `612d819ed9691f93cbab97128e301b0b7744721b`
- aktueller docs-only PR Head: `5fb879f5556012ab5a34584b4ba8a319ce6754a1`
- ADR: **ADR-0160**
- CI `32753032302`: SUCCESS
- Vercel `dpl_83ReRsDgZoyGga19arfyC8L3WWtb`: READY
- **Achtung:** `main` ist seit Slice-Start durch #46 weitergelaufen. Vor einer späteren Merge-Entscheidung muss AP-3 gegen den dann aktuellen `main` auf Integrationskonflikte geprüft und falls erforderlich synchronisiert/re-gegatet werden.
- kein Ready / kein Merge / kein AP-4 vor den vorgesehenen Gates.

### Provider – PR #54 / S3

Agent: `Jetnity provider readiness audit`

- Branch: `feat/provider-mobility-rental-evidence-s3`
- ursprüngliche Base beim Slice-Start: `main` @ `1ec93cc9...`
- Status: **open Draft / implementiert und gegatet / wartet auf unabhängigen Technical-Lead-Review**
- Functional Runtime Head: `e284af5524e7a95bf47dca2f7b77bc4f5ed171e9`
- aktueller docs-only PR Head: `2e9a1a7ff0d8ccef6945cbc70aa3833743d076f1`
- ADR: **ADR-0161**
- CI `32752931378`: SUCCESS
- Vercel `dpl_HErGVCe9HAKP1o9ymraV5xDd8i9P`: READY
- kein echter Provider, kein Secret, kein Vertrag, kein kostenpflichtiger Call, keine Production-Migration
- **Achtung:** `main` ist seit Slice-Start durch #46 weitergelaufen. Vor einer späteren Merge-Entscheidung S3 gegen aktuellen `main` prüfen/synchronisieren/re-gaten, falls nötig.
- kein Ready / kein Merge / kein S4 vor den vorgesehenen Gates.

### Trip Workspace – PR #55 / Audit & Architecture

Agent: `Trip workspace audit architecture`

- Branch: `audit/trip-workspace`
- ursprüngliche Base: `main` @ `1ec93cc9...`
- Status: **open Draft / docs-only Audit technisch vorbereitet / wartet auf unabhängigen Technical-Lead-Review**
- Exact Head: `536ed50ffda0279973058f7a2b78ee98217e7aad`
- CI `32752434172`: SUCCESS
- Vercel `dpl_4adqadJzbDwHJMWg4jVs2ZrjDJy9`: READY
- keine Runtime-, DB-, RLS-, Auth-, Traveller-, Provider-, Homepage- oder Finance-Änderung
- vor einer späteren Integration gegen den dann aktuellen `main` synchronisieren/re-gaten, falls erforderlich.

## 4. Große Produkt-Reihenfolge

1. Account + Admin sauber aufbauen; Provider Readiness parallel vollständig weiterführen.
2. Danach Trip Workspace / Reiseübersicht als nächsten großen Produktblock implementieren – gestützt auf PR #55.
3. Danach Homepage weiterentwickeln.

Weltkarte, Reisepartner-Matching, Reisebuch, Trends/Hotspots und ähnliche Ideen bleiben Wünsche/Optionen und sind nicht automatisch der nächste Pflichtblock.

## 5. Vollständige Bereichsprogramme

- Account endet nicht bei AP-3; vollständiger Plan bis AP-12, Shared-Gates separat.
- Admin endet nicht bei B/C; vollständiger Plan bis A–K.
- Provider Readiness endet nicht bei S3; vollständiger Plan S1–S8, danach echte Providerphase separat gegatet.

Siehe `docs/DOMAIN_PROGRAM_COMPLETION_POLICY.md`.

## 6. Harte Governance

- Kein PR Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Kein Merge ohne danach separate ausdrückliche aktuelle Product-Owner-Freigabe.
- Green CI/Vercel/Self-Review/Technical Closure ersetzen keine Freigabe.
- Production-Migrationen sind separate Gates.
- Provideraktivierung, Secrets/API-Keys, Verträge und kostenpflichtige Calls sind separate Gates.
- laufende Infrastruktur-/Providerkosten > USD 100/Monat nur nach PO-Freigabe.
- Shared Auth/Identity/Sessions/MFA/AAL/RLS/Ownership/Guest→Account/Traveller/Route/Privacy/Billing/Admin-Audit/Provider-Activation seriell unter Technical-Lead-Steuerung.
- Multi-Citizenship / mehrere Reisedokumente bei allen relevanten Funktionen berücksichtigen; keine implizite Ein-Pass-Annahme.
- `unknown` bleibt `unknown`; LLM/Assistant ist keine Quelle für regulatorische, Safety-, Preis-, Verfügbarkeits- oder Provider-Hard-Truth.
- keine stillen Scope-Erweiterungen.

## 7. Historische Evidence und Kontinuität

Historische Slice-Handoffs, alte Checkpoints und frühere Exact Heads dürfen bestehen bleiben. Sie sind ausdrücklich **historische Momentaufnahmen** und dürfen einen neueren zentralen Status nicht überschreiben.

Nach jedem relevanten Merge oder größeren Statuswechsel müssen PR #52 sowie `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, dieser Status und der New-Chat-Checkpoint zeitnah auf die tatsächlich aktuelle operative Wahrheit aktualisiert werden.

## 8. Nächster Technical-Lead-Arbeitsstand

- Admin: #49 auf den neuen `main` vorbereiten/synchronisieren und Slice C kontrolliert fortsetzen.
- #53: unabhängigen AP-3-Review durchführen; danach Current-Main-Integration berücksichtigen.
- #54: unabhängigen S3-Review durchführen; danach Current-Main-Integration berücksichtigen.
- #55: unabhängigen Trip-Workspace-Audit-Review durchführen.
- PR #52 bleibt Draft; kein Ready/Merge ohne PO-Freigabe.

Keine Production-Migration, kein Provider-/Secret-/Kosten-Gate ist durch diesen Status autorisiert.