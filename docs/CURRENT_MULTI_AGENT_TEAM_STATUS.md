# Jetnity – Current Multi-Agent Team Status

Stand: **24. August 2026, ca. 23:00 Europe/Zurich**  
Status: **kanonische operative Team-Wahrheit für Chat-/Agent-Wechsel**

> Diese Datei ist die bevorzugte kompakte Einstiegsquelle. Sie liegt auf `docs/chatgpt-technical-lead-handoff-2026-08-24` / Draft-PR #52 und ist bis zu einem Merge von #52 nicht automatisch `main`-Inhalt. Vor Eingriffen GitHub/CI/Vercel/Supabase live verifizieren.

## 1. Aktueller `main` / Production

- Repository: `Jetnity/jetnity`
- `main`: `b7f027ec448639fe3399512d401a7789b24e52a6`
- letzter Merge: **Provider Readiness S3 / PR #54 / ADR-0161**
- PR #54: **merged / closed** nach separater ausdrücklicher Product-Owner-Ready- und danach Merge-Freigabe
- finaler PR-Head #54: `2bb94ac5e7888b182d32e143e9d75c24b6917303`
- Merge-Commit #54 / aktueller `main`: `b7f027ec448639fe3399512d401a7789b24e52a6`
- Supabase Production `qscbgcdmivbbnzrcyegn`: Migrationen enden bei `20260824140000_flug_route_itinerary_untrusted_surface`
- Supabase Development enthält zusätzlich `20260824160000` und `20260824180000`; beide bleiben **Development-only / nicht Production-approved**.
- `main` ist weiterhin technisch **nicht** durch Branch Protection/Required Checks geschützt. PO-Freigabe zur Härtung besteht; aktuelle Connector-Oberfläche bietet keine passende Mutation.

## 2. Verbindliche ADR-Allokation

- ADR-0158 = Admin Slice A / PR #44 / `main`
- ADR-0159 = Admin Slice B / PR #46 / `main`
- ADR-0160 = Account AP-3 / PR #53 / `main`
- ADR-0161 = Provider Readiness S3 / PR #54 / `main`
- ADR-0162 = Admin Slice C / PR #49 / `main`

Neue ADR-Nummern werden erst durch den Technical Lead für den jeweiligen nächsten Slice reserviert; keine parallele Eigenvergabe.

## 3. Workstreams

### Admin – Agent `Admin platform audit`

- Slice A / #44: merged
- Slice B / #46: merged
- Slice C / #49: merged
- Independent Technical-Lead Review für C: **PASS / Technical Integration Closure**
- geerbter Billing-/Refund-P1 bleibt separater Pflichtblock vor Finance-/Payment-Live
- **Agent wartet. Kein Slice D ohne neuen kontrollierten Auftrag.**
- Admin-Programm endet nicht bei C; D–K bleiben laut Plan offen.

### Account – Agent `Account plattform audit vorbereitung`

- PR #53 / AP-3 / ADR-0160: **merged / closed**
- Merge-Commit: `8326e72f9557a8b9b200e680b0be24aefa0bdfa8`
- Independent Technical-Lead Re-Review: **PASS / Technical Integration Closure**
- **Agent wartet. Kein AP-4 ohne neuen kontrollierten Auftrag und Shared-Gate.**

### Provider – Agent `Jetnity provider readiness audit`

- PR #54 / S3 / ADR-0161: **merged / closed**
- Independent Runtime/Security/Truth Review: **PASS / Technical Integration Closure**
- Runtime-Head vor docs-only Follow-up: `2cb9a830f4fdaced5551022de6ddb1a7a9aa25a6`
- finaler PR-Head: `2bb94ac5e7888b182d32e143e9d75c24b6917303`
- finaler GitHub Actions Run `32775510115`: **SUCCESS**
- finaler Vercel Preview `9bwWMA4YiVAh6rvK6ZojpR5j2ZHS`: **success / READY**
- Merge-Commit / `main`: `b7f027ec448639fe3399512d401a7789b24e52a6`
- Residual bleibt dokumentiert: `reise_anlegen` / direkte `trip_items`-Writes können transfer/rental_car User-Intake-Handelsfelder setzen; keine Production-Migration autorisiert
- **Agent wartet. Kein S4 ohne neuen kontrollierten Auftrag.**

### Trip Workspace – Agent `Trip workspace audit architecture`

PR #55 / Audit & Architecture:

- Draft, docs-only, nicht gemergt
- Audit/Zielarchitektur im Independent Review inhaltlich plausibel und scope-treu
- Provider #54 ist jetzt integriert
- **Jetzt nächster aktiver Workstream:** #55 ausschließlich docs-only gegen `main` `b7f027ec...` reconciliieren, zentrale operative Wahrheit aktualisieren, Exact-Head-Gates erneut belegen und danach STOP für unabhängigen Technical-Lead-Re-Review
- kein Runtime-Umbau, kein TW-1

## 4. Kontrollierte Integrationsreihenfolge

1. **Account #53: integriert / erledigt**
2. **Provider #54: integriert / erledigt**
3. **jetzt Trip-Workspace-Audit #55:** finale Docs-Reconciliation → Re-Gates → Re-Review → danach PO-Ready- und separates PO-Merge-Gate
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

- `Trip workspace audit architecture` / PR #55: **jetzt ausschließlich docs-only auf `main` `b7f027ec...` reconciliieren, re-gaten und unabhängig re-reviewen.**
- `Jetnity provider readiness audit`: wartet; kein S4.
- `Account plattform audit vorbereitung`: wartet; kein AP-4.
- `Admin platform audit`: wartet; kein Slice D.
- PR #52 bleibt Draft; kein Ready/Merge ohne PO-Freigabe.

Keine Production-Migration, kein Provider-/Secret-/Kosten-Gate ist durch diesen Status autorisiert.
