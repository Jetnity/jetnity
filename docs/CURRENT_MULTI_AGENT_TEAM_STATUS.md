# Jetnity – Current Multi-Agent Team Status

Stand: **24. August 2026, 20:36 Europe/Zurich**  
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
- ADR-0162 = Admin Slice C / PR #49

## 3. Aktive Workstreams

### Admin – PR #49 / Slice C

Agent: `Admin platform audit`

- Slice A / #44: merged
- Slice B / #46: merged
- Slice C / #49: **open Draft, Current-Main synchronisiert, implementiert, Independent Technical-Lead PASS / Technical Integration Closure**
- Base: `main` `e3bad749c8e03512001e7bccd5e08467f10a7134`
- funktionaler Runtime-Head: `965034d6c5ac412472ceca38be97863bf072e9c0`
- Exact Head mit belegten Remote-Gates: `bc60120f953508ede0410c26c9384f20d380738d`
- docs-only Evidence-Head vor TL-Review: `61b6b376c960b8ac43ccdf3584519e8e01cb03dc`
- aktueller PR-Head nach TL-Review-Dokument: `82f31bdced347ec5e6488fd81c16562f8653f491`
- GitHub Actions `32760714279`: SUCCESS auf `61b6b376...`; Vercel Preview `DpzA6Kd2f1DzHc7WsSDNBbrSL6Jh`: READY/success
- Scope: read-only Provider & Cost Board; GET-only `api/admin/provider-ops` mit `betrieb-lesen`; bestehende S1-/RLS-Grenzen bleiben erhalten
- keine Provideraktivierung, keine Secrets, Verträge, paid calls, Migration/RLS/Capability-Änderung oder Finance-Live
- `model_usage` ist auf maximal 200 gelesene Zeilen aus 30 Tagen begrenzt und wird ausdrücklich **nicht** als vollständiger Monatsabschluss ausgegeben
- geerbter Billing-/Refund-P1 bleibt separater Pflichtblock vor Finance-/Payment-Live
- **Nächster Schritt: Product-Owner-Entscheidung zu Mark Ready. Kein Ready ohne ausdrückliche aktuelle Freigabe; Merge danach separat.**
- Slice D–K startet erst nach erfolgreicher Integration von C und neuem kontrollierten Auftrag.

### Account – PR #53 / AP-3

Agent: `Account plattform audit vorbereitung`

- Branch: `feat/account-ap3`
- ursprüngliche Base: `1ec93cc9...`
- Functional Runtime Head: `612d819ed9691f93cbab97128e301b0b7744721b`
- zuletzt zentral beobachteter PR/docs Head: `5fb879f5556012ab5a34584b4ba8a319ce6754a1`
- ADR: **ADR-0160**
- ursprüngliche Runtime-/Docs-Gates waren grün.
- **Independent Technical-Lead Review durchgeführt:** AP-3-Grundlogik ist grundsätzlich sauber, aber Current-Main-Closure ist **noch nicht** erreicht.
- Review-Fund: der 200er-Hinweis behauptet bei exakt 200 geladenen Reisen unbelegt, dass noch weitere Reisen gespeichert seien. Copy muss fail-honest formuliert werden.
- Zusätzlich war #53 gegen aktuellen `main` nach Merge #46 veraltet/divergiert. Agent wurde angewiesen: Current-Main-Sync + ausschließlich diese Truth-Korrektur + vollständige Exact-Head-Re-Gates.
- Bis zum Re-Review: **Draft, kein Ready, kein Merge, kein AP-4**.

### Provider – PR #54 / S3

Agent: `Jetnity provider readiness audit`

- Branch: `feat/provider-mobility-rental-evidence-s3`
- ursprüngliche Base: `1ec93cc9...`
- Functional Runtime Head: `e284af5524e7a95bf47dca2f7b77bc4f5ed171e9`
- zuletzt zentral beobachteter Head: `2e9a1a7ff0d8ccef6945cbc70aa3833743d076f1`
- ADR: **ADR-0161**
- CI auf `2e9a1a7f`: `32752931378` SUCCESS; Vercel Preview auf demselben SHA success/READY.
- **Independent Technical-Lead Review durchgeführt:** S3-Code hält die vorgesehene Trust-Grenze; kein zusätzlicher Runtime-/Security-/Truth-Fix im S3-Scope gefunden.
- Verifiziert: Browser nur IDs, Nachweis + serverseitiger Kontext, Testkatalog injiziert/test-only, Production ohne Adapter fail-closed, keine erfundene `booking_url`, Auto-Search nur auf ausdrückliche Nutzeraktion, keine Migration/Secrets/Provideraktivierung/neuen Kosten.
- Trotzdem noch keine Current-Main-Closure im zentral zuletzt verifizierten Stand; Agent wurde angewiesen: nur Current-Main-Sync + Dokumentations-Reconciliation + vollständige Exact-Head-Re-Gates; **keine neue S3-Funktionalität, kein S4**.
- Bis zum Re-Review: **Draft, kein Ready, kein Merge**.

### Trip Workspace – PR #55 / Audit & Architecture

Agent: `Trip workspace audit architecture`

- Branch: `audit/trip-workspace`
- ursprüngliche Base: `1ec93cc9...`
- zuletzt zentral beobachteter Head: `536ed50ffda0279973058f7a2b78ee98217e7aad`
- CI `32752434172`: SUCCESS; Vercel Preview READY.
- Scope ist weiterhin **docs-only**; kein Runtime-Umbau.
- **Independent Technical-Lead Review durchgeführt:** Audit/Zielarchitektur inhaltlich plausibel und scope-treu. Besonders relevant: Trennung Truth-Layer / Attention-Layer / UI; keine neue Multi-Citizenship-Truth; keine Feature-Creep-Wunschliste.
- Kernfunde für später: Safety/Seasonal-Orchestrierung im Produktpfad unsichtbar, Mobile/Desktop unterschiedliche Produktlogik, fehlende `Jetzt wichtig`-Aufmerksamkeitsschicht, Domain-lastige IA, Create-Flow/Pace-Default und weitere P1/P2-Funde.
- Im zentral zuletzt verifizierten Stand noch keine Current-Main-Closure; Agent wurde angewiesen: nur Current-Main-/Docs-Reconciliation + Re-Gates; keine Runtime-Änderung, kein TW-1.
- Bis zum Re-Review: **Draft, kein Ready, kein Merge**.

## 4. Große Produkt-Reihenfolge

1. Account + Admin sauber aufbauen; Provider Readiness parallel vollständig weiterführen.
2. Danach Trip Workspace / Reiseübersicht als nächsten großen Produktblock implementieren – gestützt auf den reviewten Audit-Plan.
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

- Admin #49 / `Admin platform audit`: Technical-Lead PASS; wartet auf ausdrückliche PO-Entscheidung zu Mark Ready.
- Account #53 / `Account plattform audit vorbereitung`: Agent-Sync + 200er-Truth-Korrektur + Re-Gates abwarten, dann Technical-Lead-Re-Review.
- Provider #54 / `Jetnity provider readiness audit`: Current-Main-Sync + Re-Gates abwarten, dann Technical-Lead-Re-Review.
- Trip #55 / `Trip workspace audit architecture`: Current-Main-/Docs-Reconciliation + Re-Gates abwarten, dann Technical-Lead-Re-Review.
- PR #52 bleibt Draft; kein Ready/Merge ohne PO-Freigabe.

Keine Production-Migration, kein Provider-/Secret-/Kosten-Gate ist durch diesen Status autorisiert.