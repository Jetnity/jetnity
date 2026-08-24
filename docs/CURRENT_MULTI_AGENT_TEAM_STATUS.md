# Jetnity – Current Multi-Agent Team Status

Stand: **24. August 2026, Live-Abgleich ab 18:50 Europe/Zurich**  
Status: **kanonische operative Team-Wahrheit für Chat-/Agent-Wechsel**

> Diese Datei ist die bevorzugte kompakte Einstiegsquelle für den aktuellen operativen Stand. Sie liegt auf `docs/chatgpt-technical-lead-handoff-2026-08-24` / Draft-PR #52 und ist bis zu einem Merge von #52 nicht automatisch `main`-Inhalt. Vor Eingriffen trotzdem GitHub/CI/Vercel/Supabase live verifizieren.

## 1. Aktueller `main` / Production

- Repository: `Jetnity/jetnity`
- `main`: `1ec93cc9f6d70bd57ea054463e4ba8e3822a2267`
- letzter Merge: **Admin Control Center Slice A / PR #44**
- PR #44: **merged / closed**
- Vercel Production: `dpl_83gKPm2vWETL7Jq1osdzcuTp4QP7` = **READY**, Git SHA `1ec93cc9...`
- Supabase Production `qscbgcdmivbbnzrcyegn`: Migrationen enden bei `20260824140000_flug_route_itinerary_untrusted_surface`
- Supabase Development enthält zusätzlich `20260824160000` und `20260824180000`; beide bleiben **Development-only / nicht Production-approved**.
- `main` ist weiterhin technisch **nicht** durch GitHub Branch Protection/Required Checks geschützt. Product Owner hat die Härtung freigegeben; die verbundene GitHub-Schnittstelle bietet dafür weiterhin keine Mutation. Nicht als umgesetzt behaupten.

## 2. Verbindliche ADR-Allokation

- ADR-0158 = Admin Slice A / PR #44 / bereits `main`
- ADR-0159 = Admin Slice B / PR #46
- ADR-0160 = Account AP-3 / PR #53
- ADR-0161 = Provider Readiness S3 / PR #54

Die parallelen ADR-Kollisionen wurden auf Account und Provider docs-only korrigiert und neu gegatet.

## 3. Aktive / review-bereite Workstreams

### Admin – PR #46 / Slice B

Agent: `Admin platform audit`

- Branch: `feat/admin-system-health`
- Base: `main` @ `1ec93cc9...`
- Status: **open / Ready for Review / mergeable / unmerged**
- Product Owner hat **Ready** am 24.08.2026 ausdrücklich freigegeben.
- **Merge ist nicht freigegeben.** Separate aktuelle Product-Owner-Freigabe erforderlich.
- Exact Runtime Head: `1715640bffc36d7ebe1a25de7aeb569632b7811f`
- aktueller docs-only PR Head: `2ca916e91dbf53f9c5cad9a980cc141938fbebe6`
- Independent Technical-Lead Review: **PASS / Technical Integration Closure**
- Runtime CI `32750112312`: SUCCESS
- Runtime Vercel `dpl_6HzJRdg4NWnGRQb8jpLC1k2jUHms`: READY
- aktueller docs-only CI `32752819622`: SUCCESS
- aktueller docs-only Vercel `dpl_8brgbYwJ7datm1uURAmuaooki72G`: READY
- keine Migration / kein RLS / keine Capability-/Secret-/Provider-/Kostenänderung
- kein weiterer bekannter Runtime-Fix vor einer Merge-Entscheidung; Merge bleibt PO-Gate.

Admin Slice C / PR #49 ist nur vorbereitet und basiert historisch auf dem Slice-B-Stack. **Nicht starten oder mergen**, bevor B integriert und C auf den dann aktuellen `main` synchronisiert/neu gegatet wurde.

### Account – PR #53 / AP-3

Agent: `Account plattform audit vorbereitung`

- Branch: `feat/account-ap3`
- Base: `main` @ `1ec93cc9...`
- Status: **open Draft / implementiert und gegatet / wartet auf unabhängigen Technical-Lead-Review**
- Functional Runtime Head: `612d819ed9691f93cbab97128e301b0b7744721b`
- aktueller docs-only PR Head: `5fb879f5556012ab5a34584b4ba8a319ce6754a1`
- ADR: **ADR-0160**
- Runtime: Aktiv/Kommend/Vergangen/Ohne Datum rein aus vorhandenen Daten abgeleitet; kein Archiv-Write, keine Migration/RLS/Auth-/Traveller-Neudefinition
- aktueller CI `32753032302`: SUCCESS
- aktueller Vercel `dpl_83ReRsDgZoyGga19arfyC8L3WWtb`: READY
- nächster Schritt: unabhängiger Technical-Lead-Review; **kein Ready / kein Merge / kein AP-4** ohne neue Gates/Freigaben.

### Provider – PR #54 / S3

Agent: `Jetnity provider readiness audit`

- Branch: `feat/provider-mobility-rental-evidence-s3`
- Base: `main` @ `1ec93cc9...`
- Status: **open Draft / implementiert und gegatet / wartet auf unabhängigen Technical-Lead-Review**
- Functional Runtime Head: `e284af5524e7a95bf47dca2f7b77bc4f5ed171e9`
- aktueller docs-only PR Head: `2e9a1a7ff0d8ccef6945cbc70aa3833743d076f1`
- ADR: **ADR-0161**
- Mobility/Rental Nachweis fail-closed ohne echten Adapter; Mobility Auto-Search auf explizite Nutzeraktion reduziert
- kein echter Provider, kein Secret, kein Vertrag, kein kostenpflichtiger Call, keine Production-Migration
- aktueller CI `32752931378`: SUCCESS
- aktueller Vercel `dpl_HErGVCe9HAKP1o9ymraV5xDd8i9P`: READY
- S2-Migrationen `160000/180000` bleiben Development-only
- nächster Schritt: unabhängiger Technical-Lead-Review; **kein Ready / kein Merge / kein S4** vor den vorgesehenen Gates.

### Trip Workspace – PR #55 / Audit & Architecture

Agent: `Trip workspace audit architecture`

- Branch: `audit/trip-workspace`
- Base: `main` @ `1ec93cc9...`
- Status: **open Draft / docs-only Audit technisch vorbereitet / wartet auf unabhängigen Technical-Lead-Review**
- Exact Head: `536ed50ffda0279973058f7a2b78ee98217e7aad`
- CI `32752434172`: SUCCESS
- Vercel `dpl_4adqadJzbDwHJMWg4jVs2ZrjDJy9`: READY
- keine Runtime-, DB-, RLS-, Auth-, Traveller-, Provider-, Homepage- oder Finance-Änderung
- Pflichtdokumente: `TRIP_WORKSPACE_AUDIT`, `TARGET_ARCHITECTURE`, `DEPENDENCY_MATRIX`, `IMPLEMENTATION_PLAN`, `HANDOFF`
- zentrale Funde u. a.: Safety/Seasonal im Produktpfad nicht sichtbar, Desktop/Mobile-IA inkonsistent, kein echtes `Jetzt wichtig`, Multi-Citizenship-Abhängigkeiten, ungenutzte Evaluate-Pfade, ZRH-Default; diese Funde sind Audit-Evidence, noch keine genehmigte Runtime-Implementation.
- nächster Schritt: unabhängiger Technical-Lead-Review; danach entscheiden Product Owner + Technical Lead über den ersten TW-Implementierungsslice.

## 4. Große Produkt-Reihenfolge

Verbindlicher Arbeitsrahmen:

1. Account + Admin sauber aufbauen; Provider Readiness parallel vollständig weiterführen.
2. Danach Trip Workspace / Reiseübersicht als nächster großer Produktblock implementieren – gestützt auf PR #55.
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

## 7. Historische Evidence

Historische Slice-Handoffs, alte Checkpoints und frühere Exact Heads dürfen bestehen bleiben. Sie müssen als **historische Momentaufnahme** gelesen werden und dürfen nie einen neueren zentralen Status überschreiben.

Wenn ein historisches Dokument einen alten Main-SHA, Draft-Status oder bereits erledigten nächsten Schritt enthält, gilt dieser nur für seinen ausdrücklich datierten Zeitpunkt.

## 8. Nächster Technical-Lead-Arbeitsstand

- #46: Ready, **wartet auf separate Merge-Entscheidung**.
- #53: unabhängigen AP-3-Review durchführen.
- #54: unabhängigen S3-Review durchführen.
- #55: unabhängigen Trip-Workspace-Audit-Review durchführen.
- #49: nicht starten, bis Admin B integriert und C neu synchronisiert/gegatet ist.
- PR #52 und diese zentralen Dokumente nach jedem relevanten Merge oder größeren Statuswechsel zeitnah auf die neue operative Wahrheit nachziehen.

Keine Production-Migration, kein Provider-/Secret-/Kosten-Gate ist durch diesen Status autorisiert.
