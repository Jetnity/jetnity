# Jetnity – Active Work Status

Stand: 29. August 2026  
Status: **CURRENT / DOCS-ONLY RECONCILIATION / LIVE-EVIDENCE GEWINNT**

> Diese Datei ist ein Current-State-Pointer, kein historisches Archiv. Historische Detailstände bleiben in Git-Historie, Slice-Status/Handoffs und ADRs erhalten.

## 1. Aktueller Arbeitsblock

**Provider / Traveller Current-State Reconciliation**

- Baseline: `main @ 3bb81004b4daf981a83bfcd2fef27864dd002155`
- Branch: `docs/provider-traveller-current-state-reconciliation-2026-08-29`
- Draft-PR: **#203**
- Technical-Lead-owned; kein Cursor-Coding-Agent.
- Scope: ausschließlich globale Current-State-/Continuity-Pointer + aktueller Provider-/Traveller-Checkpoint.
- Non-Scope: Runtime, UI, Provider-Calls, Credentials, Signup, Supabase-Mutation, Migration, RLS/Grant, AP-7-S2, TW-8, Build-Order-Änderung.

**Self-expiring:** Wenn #203 auf `main` integriert ist, ist dieser Authoring-Block abgeschlossen. Danach zuerst Post-Merge CI/Vercel verifizieren und dann vor jedem neuen Slice wieder live rekonstruieren.

Aktueller Checkpoint:

`docs/CHATGPT_TL_PROVIDER_TRAVELLER_RECONCILIATION_CHECKPOINT_2026-08-29.md`

## 2. Was unmittelbar zuvor abgeschlossen wurde

### Provider Shared Core

- ADR-0199 / `lib/server/providers/core/*` integriert.
- Finaler gegateter Implementierungs-Head `191235a536b0c14c71ff175336f588c6b737a673`.
- Recovery-PR #197 → Merge `c5aae6b533bee3c0ee747803e196bd3a2235dc8a`.
- Post-Merge-Continuity `085c95b22130232c5b5819ef8a4bcc302cc0f52b`.
- CI/Vercel post-merge grün.

### HBX Hotels

- Contract/Audit integriert über Recovery-PR #199.
- Merge `897f8e0b1975eddf96f88e6f2746a11e93eb8fe4`.
- Post-Merge CI #1240 SUCCESS; Vercel SUCCESS.
- HBX bleibt erster konkreter Hotels-Zielprovider.
- Keine Runtime/Activation.

### Viator Activities

- Contract/Audit integriert über Recovery-PR #200.
- Merge `a9f9c3a6d0c31f7676aa686148939948a7858012`.
- Post-Merge CI #1243 SUCCESS; Vercel SUCCESS.
- Viator bleibt erster spezialisierter Activities-Zielprovider.
- Keine Runtime/Activation.

### 12Go Mobility

- Contract/Audit / ADR-0200 integriert über Recovery-PR #201.
- Merge `d31e6966fdcb66d0e327a5960194a035676251c1`.
- Post-Merge CI #1245 SUCCESS; Vercel SUCCESS.
- 12Go bleibt erster spezialisierter Mobility-Zielprovider.
- Confidential API details bleiben UNKNOWN bis Approval/First-Party-Dokumenten.
- Keine Runtime/Activation.

### Traveller / Multi-Citizenship Current-Gap Audit

- Agent: `Jetnity traveller multicitizenship audit 1`.
- Finaler gegateter Head `7bdd7da81e56808d9ff1b004999314935b3a5812`.
- Recovery-PR #202 → Merge `3bb81004b4daf981a83bfcd2fef27864dd002155`.
- Post-Merge CI #1248 SUCCESS; Vercel SUCCESS.
- Audit bestätigt: 1:n Citizenships/Documents und No-Default-Pass sind current; AP-7-S2 Registry Persistence/Identity/RLS fehlt weiterhin.

## 3. Provider – aktueller Reifegrad

### Integriert

- Commercial Provenance S5-A/S5-B Contract + Production Persistence Foundation.
- Shared Provider Adapter Core / ADR-0199.
- Skyscanner Flights Offline Adapter Foundation.
- HBX Hotels Contract/Audit.
- Viator Activities Contract/Audit.
- 12Go Mobility Contract/Audit / ADR-0200.

### Nicht aktiviert / nicht gebaut

- keine echten Provider-Secrets oder API-Keys;
- keine echten Provider-Calls;
- kein Production Provider Runtime Principal;
- kein echter `live_api`-Snapshot;
- kein echter Provider-`persisted_snapshot`;
- kein Provider Orchestrator;
- TW-8 geschlossen.

## 4. Supabase Production – frisch verifiziert

Project: `qscbgcdmivbbnzrcyegn`.

Read-only am 29. August 2026 bestätigt:

- S5-B Migration `20260829140000` registriert;
- `public.trip_item_commercial_provenance` vorhanden;
- Provenance row count = **0**;
- Writer = NOLOGIN;
- Runtime = NOLOGIN + NOINHERIT;
- interner Writer `SECURITY DEFINER`, EXECUTE nur `postgres` + `jetnity_commercial_writer`;
- `authenticated` / `anon` können Writer nicht ausführen;
- `authenticated`: SELECT ja, INSERT/UPDATE/DELETE nein;
- `authenticated` / `anon` sind keine Writer-/Runtime-Mitglieder.

**Production-Write-Pfad bleibt geschlossen. Kein realer Provider-Snapshot.**

## 5. Traveller / Account – aktueller Reifegrad

Kanonischer Vertrag:

> 1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen.

### Integriert

- Trip-scoped 1:n Citizenships/Documents;
- Issuer ≠ Citizenship;
- explizite Document↔Citizenship-Relation;
- kein Default-Pass / keine Default-Citizenship;
- historische `documents[0]`-Normalisierung geschlossen;
- historische First-Evaluation-Truth geschlossen/fail-closed;
- Guest→Account Trip-Copy erhält Arrays/Relation;
- AP-7 Gate 0;
- Product-Owner Dual-Authority-Freigabe;
- AP-7-S1 Domain Contract.

### Offen

- **AP-7-S2 Account-Registry Persistence / Identity / RLS**;
- Registry CRUD / Lifecycle / UX;
- explizite Registry→Trip Runtime-Materialisierung;
- Requirements Provider;
- spätere option-scharfe Official-/Safety-/Booking-Dokumentdarstellung bei echter Evidence;
- P3 Hygiene/Compatibility laut aktuellem Audit.

Keine Passnummern, MRZ, Scans, Biometrie oder Health-Daten im Kernmodell.

## 6. Trip Workspace / Legal / weitere Blocker

- TW-1 bis TW-7-A weitgehend integriert.
- **TW-8 geschlossen**, bis reale Commercial Provenance existiert.
- TW-9 folgt erst danach.
- AP-5 Security S1–S5 integriert.
- AP-6a Legal Foundation Gate 0 integriert; Legal Runtime/Inhalte noch offen.
- `main protected=false` bleibt Governance-Risiko.
- kein bekannter P0.

## 7. Besondere Product-Owner-Gates

Ausdrückliche Product-Owner-Entscheidung bleibt vor insbesondere:

- Production-Migrationen oder großen produktiven RLS-/Identity-/Ownership-Änderungen;
- fundamentalen Auth/MFA/AAL-Änderungen;
- neuer Speicherung sensitiver Pass-/MRZ-/Biometrie-/Dokumentdaten;
- realen Providerverträgen, Production-Secrets, paid calls, Live-Aktivierung;
- Öffnung des Provider Runtime/S5-B Write-Pfads;
- realen Payments/Geldbewegungen;
- Kosten über USD 100/Monat;
- fundamentalen Produkt-/Business-/Build-Order-/Launch-Entscheidungen.

Routine-Technik und normale scope-treue Merges bleiben Technical-Lead-autonom nach independent Exact-Head Review.

## 8. Exakter nächster Schritt

### Solange PR #203 offen ist

1. Exact Head live prüfen.
2. Diff nur gegen Docs-Scope prüfen.
3. CI + Vercel terminal grün.
4. Independent TL PASS.
5. Technical-Lead-only Ready/Merge; bei bekanntem Draft→Ready-Connectorfehler Recovery-Transport nur mit identischem gegatetem SHA.
6. Post-Merge `main`, CI und Vercel verifizieren.

### Nach erfolgreicher Integration von #203

**Keinen Slice aus dieser Datei blind starten.**

Zuerst verbindlichen Slice-Precheck ausführen. Wenn die Live-Evidence unverändert bleibt, nächster produktiver Kandidat:

**Skyscanner Flights Server Create/Poll Transport Foundation**

Erster Slice:

- neuer versionierter Task;
- eigener Branch/Draft-PR;
- neuer isolierter Cursor-Agent;
- server-only;
- konsumiert `lib/server/providers/core/*`;
- feste offizielle Skyscanner Create/Poll-Endpunkte;
- dependency-injected/mock HTTP in Tests;
- bounded Poll-Budget, Abort/Timeout, 429/Retry-After, fail-closed Parsing;
- keine echten Credentials/Calls;
- kein `live_api`;
- keine Commercial-Provenance-Persistenz;
- keine S5-B Runtime-Write-Öffnung;
- kein TW-8.

Echte Provider-Authentication, Live Calls, Commercial-Provenance-Promotion und Refresh-Price/Freshness bleiben separate spätere Gates.

## 9. Pflicht vor neuem Chat / neuem Slice

Zuerst lesen:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/CHATGPT_TL_PROVIDER_TRAVELLER_RECONCILIATION_CHECKPOINT_2026-08-29.md`
6. den konkret relevanten Task/Status/Handoff/ADR;
7. danach Live-GitHub/CI/Vercel/Supabase-Evidence.

Duplicate-/History-Gate vor jedem neuen Agenten. Kein relevanter Fortschritt nur im Chat. Globale Current-State-Dateien bleiben Technical-Lead-owned.
