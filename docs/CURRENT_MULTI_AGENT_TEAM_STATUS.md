# Jetnity – Current Multi-Agent Team Status

Stand: **24. August 2026, ca. 22:00 Europe/Zurich**  
Status: **kanonische operative Team-Wahrheit für Chat-/Agent-Wechsel**

> Diese Datei ist die bevorzugte kompakte Einstiegsquelle. Sie liegt auf `docs/chatgpt-technical-lead-handoff-2026-08-24` / Draft-PR #52 und ist bis zu einem Merge von #52 nicht automatisch `main`-Inhalt. Vor Eingriffen GitHub/CI/Vercel/Supabase live verifizieren.

## 1. Aktueller `main` / Production

- Repository: `Jetnity/jetnity`
- `main`: `78192ab775165d08bb357140c2d04b865b8cc049`
- letzter Merge: **Admin Control Center Slice C / PR #49**
- PR #49: **merged / closed** nach separater ausdrücklicher Product-Owner-Merge-Freigabe
- Vercel Production: `dpl_EkQorDSGW1JyHa4DYqzZRhngYFFa` = **READY** auf exakt `78192ab...`
- Supabase Production `qscbgcdmivbbnzrcyegn`: Migrationen enden bei `20260824140000_flug_route_itinerary_untrusted_surface`
- Supabase Development enthält zusätzlich `20260824160000` und `20260824180000`; beide bleiben **Development-only / nicht Production-approved**.
- `main` ist weiterhin technisch **nicht** durch Branch Protection/Required Checks geschützt. PO-Freigabe zur Härtung besteht; aktuelle Connector-Oberfläche bietet keine passende Mutation.

## 2. Verbindliche ADR-Allokation

- ADR-0158 = Admin Slice A / PR #44 / `main`
- ADR-0159 = Admin Slice B / PR #46 / `main`
- ADR-0160 = Account AP-3 / PR #53
- ADR-0161 = Provider Readiness S3 / PR #54
- ADR-0162 = Admin Slice C / PR #49 / `main`

Neue ADR-Nummern werden erst durch den Technical Lead für den jeweiligen nächsten Slice reserviert; keine parallele Eigenvergabe.

## 3. Workstreams

### Admin – Agent `Admin platform audit`

- Slice A / #44: merged
- Slice B / #46: merged
- Slice C / #49: merged auf `main` `78192ab...`
- Independent Technical-Lead Review für C: **PASS / Technical Integration Closure**
- keine echte Provideraktivierung, Secrets, Verträge, paid calls, Migration/RLS/Capability oder Finance-Live
- geerbter Billing-/Refund-P1 bleibt separater Pflichtblock vor Finance-/Payment-Live
- **Agent `Admin platform audit` wartet. Kein Slice D ohne neuen kontrollierten Auftrag.**
- Admin-Programm endet nicht bei C; D–K bleiben laut Plan offen.

### Account – Agent `Account plattform audit vorbereitung`

PR #53 / AP-3 / ADR-0160:

- Draft, offen, nicht gemergt, mergeable
- Base / Merge-Base: aktueller `main` `78192ab...`
- Runtime-/Sync-Head: `c5e4a51feff80b94b9bb9b153ee5211d49fa4375`
- Runtime/AP-3 Independent Technical-Lead Re-Review: **PASS**
- 200er-Truth-Hinweis fail-honest korrigiert
- keine AP-4-, Migration-, RLS-, Auth-, Traveller-, Privacy-, Billing- oder Shared-Contract-Erweiterung
- Docs-Follow-up korrigierte doppelte AP-3-Roadmap-Sektion und stellte #54/#55 sowie wartenden Admin-Workstream wieder vollständig her
- finale Technical-Lead-Klarstellung: Runtime `c5e4a51f` ist nicht docs-only; nur der nachgelagerte Follow-up ist docs-only
- aktueller PR-Head nach dieser Klarstellung: `3222d8bc2624f940f5e904774de62d242fdac5fb`
- GitHub Actions CI `32770952175`: **SUCCESS** auf exakt `3222d8bc...`
- Vercel auf exakt `3222d8bc...`: **success / READY** (`7bh88WLuDRnxQYqHLsbgZFy7Y6wN`)
- **Technical Integration Closure / PASS erreicht. Nächster Gate: ausdrückliche Product-Owner-Freigabe für Mark Ready.**
- kein Ready ohne PO-Freigabe; kein Merge ohne danach separate PO-Freigabe; kein AP-4 vorher

### Provider – Agent `Jetnity provider readiness audit`

PR #54 / S3 / ADR-0161:

- Draft, nicht gemergt
- letzter gegateter Head `f6b85570049a20146544e4f85503d6ff2c9703b4` basierte auf früherem `main` `e3bad749...`
- S3-Code hielt im Independent Review die Trust-Grenzen; kein zusätzlicher Runtime-/Security-/Truth-Fix im S3-Scope gefunden
- **Agent wartet bewusst auf Account-#53-Integration.** Erst danach einmaliger finaler Sync auf den dann aktuellen `main`, Re-Gates und Technical-Lead-Re-Review
- keine neue S3-Funktionalität, kein S4, keine Provideraktivierung, keine Secrets, keine Production-Migration

### Trip Workspace – Agent `Trip workspace audit architecture`

PR #55 / Audit & Architecture:

- Draft, docs-only, nicht gemergt
- letzter gegateter Head `76ef850fa43fa9a97bafeb6077940b37eec56d9e` basierte auf früherem `main` `e3bad749...`
- Audit/Zielarchitektur im Independent Review inhaltlich plausibel und scope-treu
- Kernfunde: Safety/Seasonal-Orchestrierung im Produktpfad unsichtbar, Mobile/Desktop unterschiedliche mentale Produktlogik, fehlende `Jetzt wichtig`-Attention-Schicht, Domain-lastige IA, Create-Flow/Pace-Default u. a.
- Multi-Citizenship korrekt nur als bestehende Traveller-Abhängigkeit behandelt; keine neue Truth/Registry
- **Agent wartet bewusst auf Provider-#54-Integration.** Danach finale docs-only Reconciliation auf den dann aktuellen `main`, Re-Gates und Technical-Lead-Re-Review
- kein Runtime-Umbau, kein TW-1

## 4. Kontrollierte Integrationsreihenfolge

1. Account #53: Technical Closure erreicht → PO-Ready-Gate → danach separates PO-Merge-Gate
2. nach Account-Integration: Provider #54 finaler Sync / Re-Review / Integration
3. danach Trip-Workspace-Audit #55 finale Docs-Reconciliation / Integration
4. danach neue kontrollierte Admin-/TW-Aufträge

Diese Reihenfolge vermeidet unnötige wiederholte Sync-/Re-Gate-Schleifen.

## 5. Große Produkt-Reihenfolge

1. Account + Admin sauber aufbauen; Provider Readiness vollständig weiterführen.
2. Danach Trip Workspace / Reiseübersicht als nächsten großen Produktblock implementieren – gestützt auf den reviewten Audit-Plan.
3. Danach Homepage weiterentwickeln.

Weltkarte, Reisepartner-Matching, Reisebuch, Trends/Hotspots und ähnliche Ideen bleiben Wünsche/Optionen und sind nicht automatisch der nächste Pflichtblock.

## 6. Vollständige Bereichsprogramme

- Account endet nicht bei AP-3; vollständiger Plan bis AP-12, Shared-Gates separat.
- Admin endet nicht bei C; vollständiger Plan A–K.
- Provider Readiness endet nicht bei S3; vollständiger Plan S1–S8, danach echte Providerphase separat gegatet.

Siehe `docs/DOMAIN_PROGRAM_COMPLETION_POLICY.md`.

## 7. Harte Governance

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

## 8. Historische Evidence und Kontinuität

Historische Slice-Handoffs, alte Checkpoints und frühere Exact Heads dürfen bestehen bleiben. Sie sind historische Momentaufnahmen und dürfen einen neueren zentralen Status nicht überschreiben.

Nach jedem relevanten Merge oder größeren Statuswechsel müssen PR #52 sowie `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, dieser Status und der New-Chat-Checkpoint zeitnah auf die tatsächliche operative Wahrheit aktualisiert werden.

## 9. Exakter nächster Technical-Lead-Schritt

- `Account plattform audit vorbereitung` / PR #53: **wartet auf Product-Owner-Entscheidung zu Mark Ready.**
- `Jetnity provider readiness audit`: wartet.
- `Trip workspace audit architecture`: wartet.
- `Admin platform audit`: wartet.
- PR #52 bleibt Draft; kein Ready/Merge ohne PO-Freigabe.

Keine Production-Migration, kein Provider-/Secret-/Kosten-Gate ist durch diesen Status autorisiert.
