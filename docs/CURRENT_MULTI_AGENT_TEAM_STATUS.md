# Jetnity – Current Multi-Agent Team Status

Stand: **25. August 2026, ca. 00:20 Europe/Zurich**  
Status: **kanonische operative Team-Wahrheit für Chat-/Agent-Wechsel**

> Diese Datei ist die bevorzugte kompakte Einstiegsquelle. Sie liegt auf `docs/chatgpt-technical-lead-handoff-2026-08-24` / Draft-PR #52 und ist bis zu einem Merge von #52 nicht automatisch `main`-Inhalt. Vor Eingriffen GitHub/CI/Vercel/Supabase live verifizieren.

## 1. Aktueller `main` / Production

- Repository: `Jetnity/jetnity`
- `main`-Tip an diesem Checkpoint: `1bc1e1f492ea30710840b4a38d96437d56b73d77`
- letzter PR-Merge: **Trip Workspace Audit / PR #55**, Merge-Commit `08fd7748ace072544e189c94880562e050971811`
- danach nur docs-only Kontinuitätsupdates auf `main`: `c42017f5...`, `f8e25288...`, `1bc1e1f4...`
- PR #55: **merged / closed** nach separater ausdrücklicher Product-Owner-Ready- und danach Merge-Freigabe
- #55 war docs-only; **Merge ≠ Annahme der vorgeschlagenen Ziel-IA und ≠ TW-1-Freigabe**
- Supabase Production `qscbgcdmivbbnzrcyegn`: Migrationen enden bei `20260824140000_flug_route_itinerary_untrusted_surface`
- Supabase Development enthält zusätzlich `20260824160000` und `20260824180000`; beide bleiben **Development-only / nicht Production-approved**.
- `main` ist weiterhin technisch **nicht** durch Branch Protection/Required Checks geschützt. PO-Freigabe zur Härtung besteht; aktuelle Connector-Oberfläche bietet keine passende Mutation.

## 2. Verbindliche ADR-Allokation

- ADR-0158 = Admin Slice A / PR #44 / `main`
- ADR-0159 = Admin Slice B / PR #46 / `main`
- ADR-0160 = Account AP-3 / PR #53 / `main`
- ADR-0161 = Provider Readiness S3 / PR #54 / `main`
- ADR-0162 = Admin Slice C / PR #49 / `main`
- Trip-Workspace-Ziel-IA bleibt **Vorschlag ohne angenommene ADR-Nummer**

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
- Merge-Commit: `b7f027ec448639fe3399512d401a7789b24e52a6`
- Residual bleibt dokumentiert: `reise_anlegen` / direkte `trip_items`-Writes können transfer/rental_car User-Intake-Handelsfelder setzen; keine Production-Migration autorisiert
- **Agent wartet. Kein S4 ohne neuen kontrollierten Auftrag.**

### Trip Workspace – Agent `Trip workspace audit architecture`

- PR #55 / Audit & Architecture: **merged / closed**, docs-only
- Exact Head vor Merge: `842797b8f7ab20742b51c54669e9f73acb44241e`
- Merge-Commit: `08fd7748ace072544e189c94880562e050971811`
- kein Runtime-Umbau, keine Shared-Contract-/DB-/RLS-/Auth-/Secret-Änderung
- Audit/Zielarchitektur nach Review-Korrektur technisch vorbereitet
- Ziel-IA bleibt **nicht angenommener Product-Owner-Vorschlag**
- **Agent wartet. Kein TW-1 ohne neuen kontrollierten Auftrag.**

## 4. Kontrollierte Integrationsreihenfolge

1. **Account #53: integriert / erledigt**
2. **Provider #54: integriert / erledigt**
3. **Trip-Workspace-Audit #55: integriert / erledigt, docs-only**
4. **Jetzt:** Technical Lead bewertet die vorgeschlagene Ziel-IA als Ganzes; Product Owner entscheidet ausdrücklich über Annahme/Änderungen und Start von TW-1
5. Nur bei Freigabe: neuer kontrollierter Auftrag an Agent `Trip workspace audit architecture` für TW-1
6. Admin/Account/Provider bleiben bis zu eigenen neuen Aufträgen stehen

## 5. Große Produkt-Reihenfolge

1. Account + Admin sauber weiterführen; Provider Readiness vollständig weiterführen.
2. Trip Workspace / Reiseübersicht als nächsten großen Runtime-Block nur nach ausdrücklicher IA-/TW-1-Entscheidung.
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

Insbesondere sind Aussagen wie „PR #55 ist Draft“, „#54 wartet“ oder ältere `main`-SHAs nur historische Evidence, wenn sie in älteren Slice-Dokumenten stehen.

Nach jedem relevanten Merge oder größeren Statuswechsel müssen PR #52 sowie `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, dieser Status und der New-Chat-Checkpoint zeitnah auf die tatsächliche operative Wahrheit aktualisiert werden.

## 9. Exakter nächster Technical-Lead-Schritt

- `Trip workspace audit architecture`: wartet; **kein TW-1**, bis die vorgeschlagene Ziel-IA als Ganzes bewertet und vom Product Owner ausdrücklich angenommen/geändert wurde.
- `Jetnity provider readiness audit`: wartet; kein S4.
- `Account plattform audit vorbereitung`: wartet; kein AP-4.
- `Admin platform audit`: wartet; kein Slice D.
- PR #52 bleibt Draft; kein Ready/Merge ohne PO-Freigabe.

Keine Production-Migration, kein Provider-/Secret-/Kosten-Gate ist durch diesen Status autorisiert.