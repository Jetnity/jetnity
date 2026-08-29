# Jetnity – Handoff und nächste Schritte

Stand: 29. August 2026  
Status: **CURRENT HANDOFF / POST-MERGE VERIFIED / LIVE-EVIDENCE GEWINNT**

Dieser Handoff ist Current-State-Evidence, kein Ersatz für Live-Rekonstruktion. Vor jedem neuen Slice gilt verbindlich `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`.

## 1. Aktuellster verifizierter Stand

Aktueller vollständig post-merge und Production-verifizierter Baseline-Stand:

- `main @ bb0fb2050e09e8fa5bf670e4290523c037790954`
- Post-Merge CI #1284 / Run `33277102071`: **SUCCESS**
- Vercel Production `dpl_BFHHnDoekhxq6CvsLQXiSHrTkmpT`: **READY** auf exact `main`
- `main protected=false` bleibt Governance-Risiko.

Aktuellster Checkpoint:

`docs/CHATGPT_TL_AP7_S3_AND_INFRA_AUDIT_POST_MERGE_CHECKPOINT_2026-08-29.md`

Es gibt aus diesem Handoff **keinen automatisch aktiven Produkt-/Runtime-Slice**.

## 2. AP-7-S3 – abgeschlossen

Issue #214 ist **CLOSED / completed**.

Agent:

- `Account plattform audit vorbereitung 17`

Integration:

- Source Draft PR #215 final exact reviewed Head `ca548fc84fd097457f26edc64653befc28e01437`
- Independent TL PASS
- bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId`
- Recovery PR #219 mit identischem Head
- Recovery CI #1281 / `33276779999`: **SUCCESS**
- Recovery Vercel `dpl_99uUonTGNg9kUa5rTZJJvh9uA7J6`: **READY**
- Merge/Main danach `d58f6a80ddfe9795445abc84610a2895bae19338`
- Post-Merge CI #1282 / `33276919765`: **SUCCESS**
- Vercel Production `dpl_Dsra2GnomnE3je1dueRALiKxLX32`: **READY**

Produktstand:

- reale authentifizierte `/account/travellers` Account-Fläche;
- Owner-only Registry Traveller CRUD über bestehende AP-7-S2 RLS;
- mehrere Citizenships bis max. 8;
- mehrere Document-Metadaten bis max. 12;
- Issuer Country ≠ Citizenship;
- optionale explizite Document→Citizenship-Relation;
- `expires_on`;
- Loading/Empty/Error/Success getrennt;
- mobile-/accessibility-orientierte UI.

Nicht enthalten:

- keine Registry→Trip Runtime-Materialisierung;
- kein Guest→Registry Import/Dedup;
- kein Default-/Primary-/Chosen-Pass oder Default-Citizenship;
- keine Pass-/Dokumentnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten;
- keine neue Migration/RLS/Auth/MFA/AAL-Änderung.

## 3. Supabase Migration-History Replay Gate 0 – abgeschlossen

Issue #216 ist **CLOSED / completed**.

Agent:

- `Jetnity infrastructure migration audit 1`

Integration:

- Source Draft PR #218 final exact reviewed Head `85135a8ad35860644e9ff344000188b5c24e40af`
- docs-only/read-only, Independent TL PASS
- Recovery PR #220 gegen den nach AP-7-S3 aktualisierten `main`
- Recovery CI #1283 / `33276955797`: **SUCCESS**
- Recovery Vercel `dpl_5GKQYJEb6ojSg8ubYQAknFRTCgNP`: **READY**
- Merge/current main `bb0fb2050e09e8fa5bf670e4290523c037790954`
- Post-Merge CI #1284 / `33277102071`: **SUCCESS**
- aktuelle Vercel Production `dpl_BFHHnDoekhxq6CvsLQXiSHrTkmpT`: **READY**

Kernbefund:

- Production `qscbgcdmivbbnzrcyegn` speichert für `20260829140000_trip_item_commercial_provenance` nur einen nicht replaybaren 234-Zeichen-Prosa-Marker als einzige Statement-Body;
- Production S5-B Catalog existiert dennoch, RLS ist aktiv, Provenance Rows = 0 und Production Write Path bleibt geschlossen;
- Current Development `yfvbxvijcorffwxbxahl` besitzt weder die Version noch die S5-B Provenance-/Runtime-Gate-Objekte/Rollen;
- keine Production-/Development-Mutation wurde im Audit durchgeführt.

Ein späterer Repair ist separater Product-Owner-gated Infrastruktur-Slice. Er darf nicht still in einen Account-/Provider-/Migration-Slice eingeschoben werden.

## 4. Traveller / Account – Current Truth

Kanonisches Modell:

> 1 Traveller → mehrere Citizenships → mehrere Documents/Credentials → kontextabhängig zulässige Optionen.

Integriert:

- trip-scoped Foundation E;
- 1:n Citizenships/Documents;
- Issuer ≠ Citizenship;
- Document↔Citizenship-Relation;
- kein Default-/Primary-/Chosen-Pass und keine Default-Citizenship;
- Guest→Account Trip-Copy mit Arrays/Relation;
- AP-7 Gate 0 + Dual-Authority;
- AP-7-S1 Domain Contract;
- AP-7-S2 Account Registry Persistence / Identity / owner-only RLS auf Production;
- AP-7-S3 Registry CRUD/UI auf Production.

Offen bleiben insbesondere Registry→Trip Runtime-Materialisierung und weitere AP-8–AP-12-/Traveller-Restarbeit gemäß kanonischem Account-Plan. Keine davon ist durch diesen Handoff automatisch gestartet.

## 5. Provider – Current Truth

Provider-Arbeit ist nicht abgeschlossen.

Integriert sind Shared Provider Adapter Core, Offline-/Contract-Foundations und Commercial Provenance Foundation. Nicht aktiviert/gebaut bleiben u. a. echte Secrets/API-Keys, echte Calls, Production Runtime Principal, realer `live_api`-/`persisted_snapshot`-Pfad, Orchestrator und TW-8.

Vor migrationsnaher Provider-Arbeit ist der dokumentierte Supabase Replay-Defekt P1-Abhängigkeit.

## 6. Agentenstatus

Gestoppt / abgeschlossen:

- `Account plattform audit vorbereitung 17`;
- `Jetnity infrastructure migration audit 1`.

Aktiver Cursor-Agent: **keiner durch diesen Handoff autorisiert**.

Neue logische Einheit → frische Agenten-Generation nach Binding Slice Precheck. Review-Fixes innerhalb eines bereits laufenden Slices würden weiterhin an dieselbe Session gehen.

## 7. Risiken und Gates

- P0: keine aus den aktuellen Closures bekannten.
- P1 Infrastructure Debt: malformed Production Migration-History-Body `20260829140000` vor Rebase/Reset/Replay-/migrationsnaher Arbeit.
- P2 Governance: `main protected=false`.

Product-Owner-Entscheidung bleibt erforderlich vor insbesondere Production-Migrationen/destruktiven Datenänderungen, materiellen RLS-/Identity-/Ownership-Änderungen, fundamentalen Auth/MFA/AAL-Änderungen, sensitiver Dokument-/MRZ-/Biometrie-Speicherung, sensibler externer Datenweitergabe, realen Providerverträgen/Production-Secrets/paid calls/Live-Aktivierung, Öffnung des Commercial Runtime Write-Pfads, Payments/Geldbewegungen, Kosten > USD 100/Monat und fundamentalen Product/Business/Build-Order/Launch-Entscheidungen.

Normale scope-treue Technik/Reviews/Merges bleiben TL-autonom nach independent Exact-Head Review.

## 8. Exakter nächster Schritt

**Kein automatischer Folgeslice.**

Neuer Chat/Technical Lead muss zuerst:

1. `main`, offene PRs/Issues/Branches, CI/Vercel/Supabase live rekonstruieren;
2. Binding Build Order und `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` lesen;
3. Account-/Traveller-Restarbeit gegen Provider-Restarbeit und Shared Contracts abgleichen;
4. den Supabase Replay-Defekt bei migrationsnahen Kandidaten als P1-Abhängigkeit behandeln;
5. P0/P1/P2/P3 und besondere PO-Gates neu bewerten;
6. erst danach einen bounded nächsten Slice bestimmen und eine frische Cursor-Agent-Generation anstoßen.

Registry→Trip Runtime-Materialisierung ist ein naheliegender AP-7-Kandidat, aber **nicht automatisch freigegeben**.

## 9. Pflicht für Übernahme

Neuer Chat liest zuerst:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
6. `docs/ACTIVE_WORK_STATUS.md`
7. diesen Handoff;
8. `docs/CHATGPT_TL_AP7_S3_AND_INFRA_AUDIT_POST_MERGE_CHECKPOINT_2026-08-29.md`;
9. relevante Task/Status/Handoff/ADR;
10. danach Live-GitHub/CI/Vercel/Supabase.