# Jetnity – Handoff und nächste Schritte

Stand: 29. August 2026  
Status: **CURRENT HANDOFF / LIVE-EVIDENCE GEWINNT**

Dieser Handoff ist bewusst kompakt. Historische Detailstände bleiben in Git-Historie, ADRs und Slice-spezifischen Status-/Handoff-Dateien. Ein neuer Chat darf alte self-expiring Statuszeilen nicht über diesen Current-State-Handoff oder Live-Evidence stellen.

## 1. Zuerst lesen

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/ACTIVE_WORK_STATUS.md`
6. `docs/CHATGPT_TL_PROVIDER_TRAVELLER_RECONCILIATION_CHECKPOINT_2026-08-29.md`
7. den konkret relevanten Slice-Task/Status/Handoff/ADR
8. danach Live-GitHub/CI/Vercel und – wenn relevant – Supabase/Production.

Vor **jedem** neuen Slice, auch im selben Chat: Live-Rekonstruktion + Duplicate-/History-Gate. Kein relevanter Fortschritt nur in Chat/Cursor. Continuity ist Definition of Done.

## 2. Live-Baseline dieses Handoffs

Vor dem aktuellen Docs-Reconciliation-Slice:

`main @ 3bb81004b4daf981a83bfcd2fef27864dd002155`

Aktueller Workstream:

- Branch: `docs/provider-traveller-current-state-reconciliation-2026-08-29`
- Draft-PR: **#203**
- Technical-Lead-owned, docs-only.
- Kein Cursor-Coding-Agent.
- Kein Runtime-/Provider-/Supabase-/RLS-/Auth-/UI-/Production-Change.

Wenn #203 auf `main` integriert ist, ist diese Pre-Merge-Klausel historisch. Dann Post-Merge CI/Vercel verifizieren und den nächsten Slice neu rekonstruieren.

`main protected=false` war bei letzter Live-Prüfung weiterhin offen.

## 3. Provider – fertig integriert

- Shared Provider Adapter Core / ADR-0199 ✅
- Skyscanner Flights Offline Adapter Foundation ✅
- HBX Hotels Contract/Audit ✅
- Viator Activities Contract/Audit ✅
- 12Go Mobility Contract/Audit / ADR-0200 ✅
- Commercial-Provenance S5-B Production Persistence Foundation ✅

Alle HBX-/Viator-/12Go-Audits sind post-merge CI/Vercel-verifiziert.

Nicht vorhanden:

- keine echten Provider-Keys/Secrets;
- keine echten Provider-Calls;
- kein Provider Runtime Principal;
- kein echter `live_api`-Snapshot;
- kein echter Provider-`persisted_snapshot`;
- kein Orchestrator;
- TW-8 geschlossen.

## 4. Production Commercial Provenance – frisch verifiziert

Supabase Project `qscbgcdmivbbnzrcyegn`, read-only geprüft am 29. August 2026:

- Migration `20260829140000` registriert;
- Provenance-Tabelle vorhanden;
- **0 Rows**;
- Writer NOLOGIN;
- Runtime NOLOGIN + NOINHERIT;
- interner Writer SECURITY DEFINER;
- `authenticated`/`anon` kein EXECUTE auf Writer;
- `authenticated` nur SELECT auf Tabelle, kein INSERT/UPDATE/DELETE;
- `authenticated`/`anon` keine Writer-/Runtime-Mitglieder.

Production Write Path bleibt geschlossen. Kein realer Provider-Snapshot.

## 5. Traveller / Multi-Citizenship – fertig vs. offen

Current-Gap-Audit integriert über Recovery-PR #202, Merge `3bb81004b4daf981a83bfcd2fef27864dd002155`; Post-Merge CI #1248 SUCCESS, Vercel SUCCESS.

Kanonisch und gebaut:

> 1 Traveller → mehrere Citizenships → mehrere Documents/Credentials → kontextabhängige zulässige Optionen.

- kein Default-Pass;
- keine Default-Citizenship;
- Issuer ≠ Citizenship;
- explizite Document↔Citizenship-Relation;
- historische `documents[0]`-/First-Evaluation-Kollapse geschlossen;
- Guest→Account Trip-Copy erhält 1:n-Fakten;
- AP-7 Gate 0 + Dual-Authority Approval + AP-7-S1 Domain Contract integriert.

Offen:

- **AP-7-S2 Account-Registry Persistence / Identity / RLS**;
- Registry CRUD/Lifecycle/UX;
- Registry→Trip Runtime-Materialisierung;
- Requirements Provider;
- spätere option-scharfe Official-/Safety-/Booking-Dokumentdarstellung mit echter Evidence.

Keine Passnummern, Scans, MRZ, Biometrie oder Health-Daten im Kernmodell.

## 6. Andere wichtige offene Produktblöcke

- TW-8: blockiert bis reale Commercial Provenance.
- TW-9: danach Polish/Accessibility/Performance/Closure.
- AP-6 Legal Runtime / freigegebene Inhalte noch offen.
- Admin D–K nicht vollständig.
- Homepage final, Discoverability und Growth später gemäß Binding Build Order.
- `main protected=false` Governance-Risiko.

## 7. Besondere Product-Owner-Gates

Routine-Technik, Reviews und normale scope-treue Merges führt der Technical Lead autonom.

Explizite Product-Owner-Entscheidung bleibt vor insbesondere:

- Production-Migrationen oder großen produktiven Identity/RLS/Ownership-Änderungen;
- fundamentalen Auth/MFA/AAL-Änderungen;
- Speicherung besonders sensitiver Pass-/MRZ-/Biometrie-/Dokumentdaten;
- sensibler externer Datenweitergabe;
- realen Providerverträgen, Production-Secrets, paid calls oder Live-Aktivierung;
- Öffnung des Provider Runtime/S5-B Write-Pfads;
- Payments/Geldbewegungen;
- Kosten > USD 100/Monat;
- fundamentalen Product/Business/Build-Order/Launch-Entscheidungen.

## 8. Exakter nächster Schritt

### Solange #203 offen

- Exact Head live prüfen.
- Scope/Diff unabhängig reviewen.
- CI + Vercel terminal grün.
- TL PASS.
- TL-only Ready/Merge; bei bekanntem Draft→Ready-Connectorfehler nur Recovery-Transport desselben gegateten SHA.
- Post-Merge `main`, CI, Vercel verifizieren.

### Danach

**Neuen Slice nicht automatisch starten.** Erst verbindlicher Slice-Precheck.

Wenn Live-Evidence unverändert bleibt, nächster produktiver Kandidat:

**Skyscanner Flights Server Create/Poll Transport Foundation**

Vorgesehene harte Grenze für diesen ersten Transport-Slice:

- server-only;
- nutzt Shared Provider Core;
- feste offizielle Create/Poll-Endpunkte;
- dependency-injected/mock HTTP in Tests;
- bounded Poll-Budget + Abort/Timeout + 429/Retry-After;
- fail-closed Request-/Response-Parsing;
- kein echter API-Key;
- kein realer Provider-Call;
- kein `live_api`;
- keine Commercial-Provenance-Persistenz;
- keine S5-B Runtime-Write-Öffnung;
- kein TW-8.

Echte Authentication/Live Calls, Commercial-Provenance-Promotion und Refresh-Price/Freshness sind spätere separate Gates.

## 9. Arbeitsweise für jeden nächsten Chat

- nicht aus Erinnerung bauen;
- nicht aus einem historischen Statusblock einen Slice ableiten;
- keine Duplicate-/Shadow-Slices;
- Shared Contracts nur mit klarer Ownership;
- Cursor-Self-Review ist kein TL-PASS;
- jeder neue Head invalidiert alte Gates;
- globaler Current-State bleibt Technical-Lead-owned;
- nach jedem Material Change Continuity versionieren;
- nur grobe Product/Security/Commercial/Budget-Gates an den Product Owner zurückgeben.
