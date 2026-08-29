# Jetnity – Handoff und nächste Schritte

Stand: 30. August 2026  
Status: **CURRENT HANDOFF / AP-7-S4 POST-MERGE VERIFIED / LIVE-EVIDENCE GEWINNT**

Dieser Handoff ist Current-State-Evidence, kein Ersatz für Live-Rekonstruktion. Vor jedem neuen Slice gilt verbindlich `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`.

## 1. Aktuellster verifizierter Stand

Aktueller vollständig post-merge und Production-verifizierter Runtime-Baseline-Stand:

- `main @ e33341b30019fb1a57c2cc6f2cd8c0b0a3a85f40`
- Post-Merge CI #1293 / Run `33279680487`: **SUCCESS**
- Vercel Production `dpl_6GZsxWbYwuY4LxFG8D8GoqK5Cxm8`: **READY** auf exact `e33341b3…`
- `main protected=false` bleibt Governance-Risiko.

Aktuellster Checkpoint:

`docs/CHATGPT_TL_AP7_S4_POST_MERGE_CHECKPOINT_2026-08-30.md`

Es gibt aus diesem Handoff **keinen automatisch aktiven Produkt-/Runtime-Slice**.

## 2. AP-7-S4 – abgeschlossen

Issue #222 ist **CLOSED / completed**.

Agent:

- `Account plattform audit vorbereitung 18`

Integration:

- Source Draft PR #223
- erster reviewed Head `40204e2218db097e50a4016c1a66569ca4275eed`: **CHANGES REQUIRED** wegen fehlender tiefer Write-/Auth-Orchestrierungsnachweise
- derselbe Agent ergänzte gezielte Orchestrierungs-/Failure-Tests
- final exact reviewed Head `f366ea839dfd3560b4ca2f0b4ec054f0ed8c463a`
- Independent TL PASS auf finalem Head
- Source CI #1291 / `33279176614`: **SUCCESS**
- Source Vercel `dpl_AsQGw7AmakovtqzhsTZ93AACrvjt`: **READY**
- bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId`
- Recovery PR #224 mit identischem Head
- Recovery CI #1292 / `33279576332`: **SUCCESS**
- Recovery Vercel `dpl_BK8hR1Ufw6vqhwNyc5ddfzYcdbbR`: **READY**
- GitHub Review-Threads: 0
- Merge/Main `e33341b30019fb1a57c2cc6f2cd8c0b0a3a85f40`
- Post-Merge CI #1293 / `33279680487`: **SUCCESS**
- Vercel Production `dpl_6GZsxWbYwuY4LxFG8D8GoqK5Cxm8`: **READY** exact `e33341b3…`

Produktstand:

- ein angemeldeter Owner kann bei einer konkreten Konto-Reise explizit einen gespeicherten Registry Traveller auswählen;
- Jetnity materialisiert einen **neuen unabhängigen trip-owned Snapshot**;
- S1-Projektion bleibt kanonischer Domain-Vertrag;
- Write erfolgt über bestehenden atomaren `party_schreiben`-Pfad;
- frische IDs/clientRefs für Traveller, Citizenships und Documents;
- alle unterstützten Citizenships/Documents werden erhalten;
- Issuer Country bleibt unabhängig von Citizenship;
- nullable Document→Citizenship wird auf neue Trip-Citizenship-Refs remapped;
- spätere Registry-Änderungen/-Löschungen mutieren bestehende Trips nicht;
- Slot-/Auth-/RLS-hidden-/Read-/Write-Fehler fail closed.

Nicht enthalten:

- keine Live Registry→Trip FK/Referenz;
- kein Guest→Registry Import/Dedup;
- kein Default-/Primary-/Chosen-Pass oder Default-Citizenship;
- keine automatische Best-Pass-/Visa-/Entry-Entscheidung;
- keine Pass-/Dokumentnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten;
- keine Migration/RLS/Grant/Auth/MFA/AAL-/Supabase-Mutation.

## 3. AP-7 cumulative Current Truth

Verbindliche Authority-Grenze:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Integriert sind jetzt:

- AP-7 Gate 0 + Dual-Authority PO approval;
- AP-7-S1 pure Domain Contract;
- AP-7-S2 Account Registry Persistence / Identity / owner-only RLS auf Production;
- AP-7-S3 reale `/account/travellers` Registry CRUD/UI;
- **AP-7-S4 explizite Registry → Trip Runtime-Materialisierung**.

**S1–S4 dürfen nicht erneut als Zukunftsarbeit geplant werden.**

Das übergeordnete Traveller-Modell bleibt:

> **1 Traveller → mehrere Citizenships → mehrere Documents/Credentials → kontextabhängig zulässige Optionen.**

Weitere Traveller-/Document-Lifecycle-/Credential-Options-Arbeit muss nach frischem Precheck geschnitten werden. Keine stille First-Item-/Default-Semantik.

## 4. Supabase Migration-History Replay Gate 0 – abgeschlossen / Repair offen

Issue #216 bleibt **CLOSED / completed**; Agent `Jetnity infrastructure migration audit 1` gestoppt.

Kernbefund unverändert:

- Production `qscbgcdmivbbnzrcyegn` speichert für `20260829140000_trip_item_commercial_provenance` nur einen nicht replaybaren 234-Zeichen-Prosa-Marker als einzige Statement-Body;
- Production S5-B Catalog existiert dennoch und Production Write Path bleibt geschlossen;
- Current Development `yfvbxvijcorffwxbxahl` besitzt weder die Version noch die S5-B Provenance-/Runtime-Gate-Objekte/Rollen;
- **keine Reparatur wurde ausgeführt**.

Ein späterer Repair ist separater Product-Owner-gated Infrastruktur-Slice. Er darf nicht still in einen Account-/Provider-/Migration-Slice eingeschoben werden.

## 5. Provider – Current Truth

Provider-Arbeit ist nicht abgeschlossen.

Integriert sind Shared Provider Adapter Core, Offline-/Contract-Foundations und Commercial Provenance Foundation. Nicht aktiviert/gebaut bleiben u. a. echte Secrets/API-Keys, echte Calls, Production Runtime Principal, realer `live_api`-/`persisted_snapshot`-Pfad, Orchestrator und TW-8.

Vor migrationsnaher Provider-Arbeit ist der dokumentierte Supabase Replay-Defekt P1-Abhängigkeit.

## 6. Agentenstatus

Gestoppt / abgeschlossen:

- `Account plattform audit vorbereitung 18` – AP-7-S4;
- `Account plattform audit vorbereitung 17` – AP-7-S3;
- `Jetnity infrastructure migration audit 1` – Supabase Replay Gate 0.

Aktiver Cursor-Agent: **keiner durch diesen Handoff autorisiert**.

Neue logische Einheit → frische Agenten-Generation nach Binding Slice Precheck. Review-Fixes innerhalb eines bereits laufenden Slices gehen weiterhin an dieselbe Session.

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
2. Binding Build Order und `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` lesen und gegen den integrierten AP-7-S1–S4-Stand reconciliieren;
3. verbleibende Traveller-/Document-Lifecycle-/Multi-Citizenship-Lücken bestimmen;
4. Account-/Traveller-Restarbeit gegen Provider-Restarbeit und Shared Contracts abgleichen;
5. den Supabase Replay-Defekt bei migrationsnahen Kandidaten als P1-Abhängigkeit behandeln;
6. P0/P1/P2/P3 und besondere PO-Gates neu bewerten;
7. erst danach einen bounded nächsten Slice bestimmen und eine frische Cursor-Agent-Generation anstoßen.

Mögliche Kandidaten sind Document-Lifecycle-/UX oder kontextabhängige zulässige Credential-Optionen. **Nicht automatisch freigegeben; keine automatische „bester Pass“-Entscheidung.**

## 9. Pflicht für Übernahme

Neuer Chat liest zuerst:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
6. `docs/ACTIVE_WORK_STATUS.md`
7. diesen Handoff;
8. `docs/CHATGPT_TL_AP7_S4_POST_MERGE_CHECKPOINT_2026-08-30.md`;
9. relevante Task/Status/Handoff/ADR;
10. danach Live-GitHub/CI/Vercel/Supabase.
