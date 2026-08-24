# Jetnity – Current Multi-Agent Team Status

Stand: **24. August 2026, ca. 20:52 Europe/Zurich**  
Status: **kanonische operative Team-Wahrheit für Chat-/Agent-Wechsel**

> Diese Datei ist die bevorzugte kompakte Einstiegsquelle. Sie liegt auf `docs/chatgpt-technical-lead-handoff-2026-08-24` / Draft-PR #52 und ist bis zu einem Merge von #52 nicht automatisch `main`-Inhalt. Vor Eingriffen GitHub/CI/Vercel/Supabase live verifizieren.

## 1. Aktueller `main` / Production

- Repository: `Jetnity/jetnity`
- `main`: `78192ab775165d08bb357140c2d04b865b8cc049`
- letzter Merge: **Admin Control Center Slice C / PR #49**
- PR #49: **merged / closed** nach separater ausdrücklicher Product-Owner-Merge-Freigabe
- Merge-Eltern: `e3bad749c8e03512001e7bccd5e08467f10a7134` + `d2ce7b47d19e0097dda9035d6de7fb90eec9ee2c`
- Vercel Production: `dpl_EkQorDSGW1JyHa4DYqzZRhngYFFa` = **READY** auf exakt `78192ab...`
- Supabase Production `qscbgcdmivbbnzrcyegn`: Migrationen enden bei `20260824140000_flug_route_itinerary_untrusted_surface`
- Supabase Development enthält zusätzlich `20260824160000` und `20260824180000`; beide bleiben **Development-only / nicht Production-approved**.
- PR #49 führte keine Production-Migration, RLS-/Capability-/Provider-/Secret-/Kosten- oder Finance-Live-Aktivierung ein.
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
- Slice C / #49: **merged auf `main` `78192ab...`**
- Independent Technical-Lead Review für C: **PASS / Technical Integration Closure**
- C-Scope: read-only Provider & Cost Board; keine echte Provideraktivierung, Secrets, Verträge, paid calls, Migration/RLS/Capability oder Finance-Live
- `model_usage` bleibt begrenzte read-only Sicht, kein vollständiger Monatsabschluss
- geerbter Billing-/Refund-P1 bleibt separater Pflichtblock vor Finance-/Payment-Live
- **Agent `Admin platform audit` wartet jetzt. Kein Slice D ohne neuen kontrollierten Auftrag.**
- Admin-Programm endet nicht bei C; D–K bleiben laut Plan offen.

### Account – Agent `Account plattform audit vorbereitung`

PR #53 / AP-3:

- Draft, nicht gemergt
- ADR-0160
- aktueller PR-Head: `3863df7c7fbc0853b0e0a3c618096251fa595e2d`
- zuvor gegateter Current-Main-/Runtime-Sync-Head: `c1ccfb6e02ffbf3125dced304980d1c801c4c47c`
- der vom Technical Lead gefundene 200er-Truth-Fehler wurde fail-honest korrigiert
- Gates gegen damaligen `main` `e3bad749...`: CI `32761572610` SUCCESS, Vercel `dpl_ERFzEa9dMQHncNJ9shajiPQrcMzj` READY; docs-only Head ebenfalls grün
- **Durch Merge #49 ist `main` jetzt `78192ab...`; #53 ist erneut hinter/divergiert und aktuell nicht mergeable.**
- Nächster Schritt: nur Current-Main-Sync auf `78192ab...`, zentrale Dokumentationswahrheit erhalten, vollständige Exact-Head-Re-Gates, dann unabhängiger Technical-Lead-Re-Review
- kein Ready, kein Merge, kein AP-4 vorher

### Provider – Agent `Jetnity provider readiness audit`

PR #54 / S3:

- Draft, nicht gemergt
- ADR-0161
- aktueller Head: `f6b85570049a20146544e4f85503d6ff2c9703b4`
- S3-Code hielt im Independent Review die Trust-Grenzen; kein zusätzlicher Runtime-/Security-/Truth-Fix im S3-Scope gefunden
- Gates gegen damaligen `main` `e3bad749...`: CI `32762113958` SUCCESS, Vercel `dpl_EreSw6u5vc1GKnojDNGbWnNtvzG5` READY
- Browser nur IDs; serverseitiger Kontext/Nachweis; Testkatalog test-only; Production ohne Adapter fail-closed; keine erfundene `booking_url`; keine Migration/Secrets/Provideraktivierung/neuen Kosten
- **Durch Merge #49 ist #54 erneut hinter/divergiert und aktuell nicht mergeable.**
- Nächster Schritt: nur Current-Main-Sync auf `78192ab...` + Re-Gates; keine neue S3-Funktionalität, kein S4; danach Technical-Lead-Re-Review

### Trip Workspace – Agent `Trip workspace audit architecture`

PR #55 / Audit & Architecture:

- Draft, docs-only, nicht gemergt
- aktueller Head: `76ef850fa43fa9a97bafeb6077940b37eec56d9e`
- Audit/Zielarchitektur im Independent Review inhaltlich plausibel und scope-treu
- Gates gegen damaligen `main` `e3bad749...`: CI `32763440821` SUCCESS, Vercel `dpl_2vRPwAD8rktAkTCwirP4Lg5Aw38o` READY
- Kernfunde: Safety/Seasonal-Orchestrierung im Produktpfad unsichtbar, Mobile/Desktop unterschiedliche mentale Produktlogik, fehlende `Jetzt wichtig`-Attention-Schicht, Domain-lastige IA, Create-Flow/Pace-Default u. a.
- Multi-Citizenship korrekt nur als bestehende Traveller-Abhängigkeit behandelt; keine neue Truth/Registry
- **Durch Merge #49 ist #55 erneut hinter/divergiert und aktuell nicht mergeable.**
- Nächster Schritt: docs-only Current-Main-/Docs-Reconciliation auf `78192ab...` + Re-Gates; kein Runtime-Umbau, kein TW-1; danach Technical-Lead-Re-Review

## 4. Große Produkt-Reihenfolge

1. Account + Admin sauber aufbauen; Provider Readiness parallel vollständig weiterführen.
2. Danach Trip Workspace / Reiseübersicht als nächsten großen Produktblock implementieren – gestützt auf den reviewten Audit-Plan.
3. Danach Homepage weiterentwickeln.

Weltkarte, Reisepartner-Matching, Reisebuch, Trends/Hotspots und ähnliche Ideen bleiben Wünsche/Optionen und sind nicht automatisch der nächste Pflichtblock.

## 5. Vollständige Bereichsprogramme

- Account endet nicht bei AP-3; vollständiger Plan bis AP-12, Shared-Gates separat.
- Admin endet nicht bei C; vollständiger Plan bis A–K.
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

Historische Slice-Handoffs, alte Checkpoints und frühere Exact Heads dürfen bestehen bleiben. Sie sind historische Momentaufnahmen und dürfen einen neueren zentralen Status nicht überschreiben.

Nach jedem relevanten Merge oder größeren Statuswechsel müssen PR #52 sowie `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, dieser Status und der New-Chat-Checkpoint zeitnah auf die tatsächliche operative Wahrheit aktualisiert werden.

## 8. Nächster Technical-Lead-Arbeitsstand

- `Admin platform audit`: wartet nach Merge von #49 auf neuen kontrollierten Slice-D-Auftrag.
- `Account plattform audit vorbereitung` / #53: Current-Main-Sync auf `78192ab...` + Re-Gates, dann Re-Review.
- `Jetnity provider readiness audit` / #54: Current-Main-Sync auf `78192ab...` + Re-Gates, dann Re-Review.
- `Trip workspace audit architecture` / #55: docs-only Current-Main-Reconciliation auf `78192ab...` + Re-Gates, dann Re-Review.
- PR #52 bleibt Draft; kein Ready/Merge ohne PO-Freigabe.

Keine Production-Migration, kein Provider-/Secret-/Kosten-Gate ist durch diesen Status autorisiert.