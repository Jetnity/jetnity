# Jetnity – Current Multi-Agent Team Status

Stand: **24. August 2026, ca. 22:20 Europe/Zurich**  
Status: **kanonische operative Team-Wahrheit für Chat-/Agent-Wechsel**

> Diese Datei ist die bevorzugte kompakte Einstiegsquelle. Sie liegt auf `docs/chatgpt-technical-lead-handoff-2026-08-24` / Draft-PR #52 und ist bis zu einem Merge von #52 nicht automatisch `main`-Inhalt. Vor Eingriffen GitHub/CI/Vercel/Supabase live verifizieren.

## 1. Aktueller `main` / Production

- Repository: `Jetnity/jetnity`
- `main`: `8326e72f9557a8b9b200e680b0be24aefa0bdfa8`
- letzter Merge: **Account AP-3 / PR #53**
- PR #53: **merged / closed** nach separater ausdrücklicher Product-Owner-Ready- und danach Merge-Freigabe
- Vercel auf Merge-Commit `8326e72f...`: **success** (`QsCzDYvqigyCV2DaVMStrVvXUmBh`)
- Supabase Production `qscbgcdmivbbnzrcyegn`: Migrationen enden bei `20260824140000_flug_route_itinerary_untrusted_surface`
- Supabase Development enthält zusätzlich `20260824160000` und `20260824180000`; beide bleiben **Development-only / nicht Production-approved**.
- `main` ist weiterhin technisch **nicht** durch Branch Protection/Required Checks geschützt. PO-Freigabe zur Härtung besteht; aktuelle Connector-Oberfläche bietet keine passende Mutation.

## 2. Verbindliche ADR-Allokation

- ADR-0158 = Admin Slice A / PR #44 / `main`
- ADR-0159 = Admin Slice B / PR #46 / `main`
- ADR-0160 = Account AP-3 / PR #53 / `main`
- ADR-0161 = Provider Readiness S3 / PR #54
- ADR-0162 = Admin Slice C / PR #49 / `main`

Neue ADR-Nummern werden erst durch den Technical Lead für den jeweiligen nächsten Slice reserviert; keine parallele Eigenvergabe.

## 3. Workstreams

### Admin – Agent `Admin platform audit`

- Slice A / #44: merged
- Slice B / #46: merged
- Slice C / #49: merged
- Independent Technical-Lead Review für C: **PASS / Technical Integration Closure**
- geerbter Billing-/Refund-P1 bleibt separater Pflichtblock vor Finance-/Payment-Live
- **Agent `Admin platform audit` wartet. Kein Slice D ohne neuen kontrollierten Auftrag.**
- Admin-Programm endet nicht bei C; D–K bleiben laut Plan offen.

### Account – Agent `Account plattform audit vorbereitung`

PR #53 / AP-3 / ADR-0160:

- **merged / closed**
- finaler PR-Head: `3222d8bc2624f940f5e904774de62d242fdac5fb`
- Merge-Commit / aktueller `main`: `8326e72f9557a8b9b200e680b0be24aefa0bdfa8`
- Exact-Head CI `32770952175`: **SUCCESS** vor Merge
- Vercel auf finalem PR-Head: **success / READY** (`7bh88WLuDRnxQYqHLsbgZFy7Y6wN`)
- Independent Technical-Lead Re-Review: **PASS / Technical Integration Closure**
- keine AP-4-, Migration-, RLS-, Auth-, Traveller-, Privacy-, Billing- oder Shared-Contract-Erweiterung
- **Agent `Account plattform audit vorbereitung` wartet. Kein AP-4 ohne neuen kontrollierten Auftrag und Shared-Gate.**

### Provider – Agent `Jetnity provider readiness audit`

PR #54 / S3 / ADR-0161:

- Draft, nicht gemergt
- letzter gegateter Stand basierte auf einem älteren `main`
- S3-Code hielt im Independent Review die Trust-Grenzen; kein zusätzlicher Runtime-/Security-/Truth-Fix im S3-Scope gefunden
- **Jetzt nächster aktiver Workstream:** einmaliger finaler Sync auf aktuellen `main` `8326e72f...`, Re-Gates und unabhängiger Technical-Lead-Re-Review
- keine neue S3-Funktionalität, kein S4, keine Provideraktivierung, keine Secrets, keine Production-Migration

### Trip Workspace – Agent `Trip workspace audit architecture`

PR #55 / Audit & Architecture:

- Draft, docs-only, nicht gemergt
- Audit/Zielarchitektur im Independent Review inhaltlich plausibel und scope-treu
- **Agent wartet bewusst auf Provider-#54-Integration.** Danach finale docs-only Reconciliation auf den dann aktuellen `main`, Re-Gates und Technical-Lead-Re-Review
- kein Runtime-Umbau, kein TW-1

## 4. Kontrollierte Integrationsreihenfolge

1. **Account #53: integriert / erledigt**
2. **Provider #54:** finaler Current-Main-Sync → Re-Gates → Re-Review → danach PO-Ready- und separates PO-Merge-Gate
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

- `Jetnity provider readiness audit` / PR #54: **jetzt final auf `main` `8326e72f...` synchronisieren, re-gaten und unabhängig re-reviewen.**
- `Account plattform audit vorbereitung`: wartet; kein AP-4.
- `Trip workspace audit architecture`: wartet auf #54-Integration.
- `Admin platform audit`: wartet.
- PR #52 bleibt Draft; kein Ready/Merge ohne PO-Freigabe.

Keine Production-Migration, kein Provider-/Secret-/Kosten-Gate ist durch diesen Status autorisiert.
