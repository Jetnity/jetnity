# Jetnity – Active Work Status

Stand: 30. August 2026  
Status: **CURRENT / NO AUTOMATIC FOLLOW-UP / LIVE-EVIDENCE GEWINNT**

> Diese Datei ist ein Current-State-Pointer, kein historisches Archiv. Vor jedem neuen Slice gilt `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`.

## 1. Aktueller Arbeitsblock

**Kein Produkt-/Runtime-Slice automatisch aktiv.**

Letzter vollständig post-merge verifizierter Runtime-`main`:

- `e33341b30019fb1a57c2cc6f2cd8c0b0a3a85f40`
- Post-Merge CI: #1293 / Run `33279680487` = **SUCCESS**
- Vercel Production: `dpl_6GZsxWbYwuY4LxFG8D8GoqK5Cxm8` = **READY** auf exact `e33341b3…`
- Branch Protection: `protected=false`

Aktuellster Checkpoint:

`docs/CHATGPT_TL_AP7_S4_POST_MERGE_CHECKPOINT_2026-08-30.md`

## 2. Unmittelbar abgeschlossen – AP-7-S4

Issue #222: **CLOSED / completed**.

- Cursor-Agent: `Account plattform audit vorbereitung 18`
- Source Draft PR #223 finaler reviewed Head: `f366ea839dfd3560b4ca2f0b4ec054f0ed8c463a`
- erster TL-Review: CHANGES REQUIRED wegen unvollständiger Write-/Authorization-Testtiefe;
- derselbe Agent ergänzte testbare S4-Orchestrierung und 2715/2715 Gesamttests;
- finaler unabhängiger TL PASS auf `f366ea83…`;
- Source CI #1291 / Run `33279176614`: **SUCCESS**;
- Source Vercel `dpl_AsQGw7AmakovtqzhsTZ93AACrvjt`: **READY**;
- Draft→Ready scheiterte am bekannten GitHub-Connectorfehler `Repository.fullDatabaseId`;
- Integration daher über Recovery PR #224, gleicher Exact Head;
- Recovery CI #1292 / Run `33279576332`: **SUCCESS**;
- Recovery Vercel `dpl_BK8hR1Ufw6vqhwNyc5ddfzYcdbbR`: **READY**;
- Merge/Main: `e33341b30019fb1a57c2cc6f2cd8c0b0a3a85f40`;
- Post-Merge CI #1293 / Run `33279680487`: **SUCCESS**;
- Vercel Production `dpl_6GZsxWbYwuY4LxFG8D8GoqK5Cxm8`: **READY** exact `e33341b3…`.

Geliefert: explizite owner-getriebene Account Registry → unabhängige trip-owned Traveller Snapshot Materialisierung über AP-7-S1 + bestehenden `party_schreiben`-Pfad.

S4 hat **keine** Migration, Schema-, RLS-, Grant-, Auth-, MFA-/AAL- oder Supabase-Mutation eingeführt.

## 3. Traveller / Account – aktueller Reifegrad

Kanonischer Vertrag:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen.**

Verbindliche Dual-Authority:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Integriert:

- Trip-scoped 1:n Citizenships/Documents;
- Issuer ≠ Citizenship;
- explizite Document↔Citizenship-Relation;
- kein Default-/Primary-/Chosen-Pass und keine Default-Citizenship;
- Guest→Account Trip-Copy erhält Arrays/Relation;
- AP-7 Gate 0 + Dual-Authority;
- AP-7-S1 Domain Contract;
- AP-7-S2 Account Registry Persistence / Identity / owner-only RLS auf Production;
- AP-7-S3 Registry CRUD/UI auf Production;
- **AP-7-S4 Registry → Trip Snapshot Runtime-Materialisierung**.

S4 erzeugt frische trip-eigene Traveller-/Citizenship-/Document-IDs und `clientRef`s. Registry edit/delete mutiert bestehende Trip Snapshots nicht. Keine Live-FK und keine automatische Credential-Auswahl.

**S1–S4 nicht erneut bauen.**

Offen bleiben nach frischem Precheck zu priorisieren:

- weiterer Document-Lifecycle / UX;
- kontextabhängige zulässige Credential-Optionen in relevanten Reise-/Entry-/Transit-Flächen;
- weitere Account-/Traveller-Slices gemäß kanonischem Plan;
- option-scharfe Official-/Safety-/Booking-Dokumentdarstellung nur mit echter Evidence;
- keine automatische „bester Pass“-Entscheidung ohne eigenen Vertrag/Gate.

Keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im Kernmodell.

## 4. Supabase Replay Gate 0 / P1 Infrastructure Debt

Der Audit bleibt abgeschlossen; **keine Reparatur wurde ausgeführt**.

Production History-Version `20260829140000_trip_item_commercial_provenance` enthält eine nicht replaybare Prosa-Statement-Body, obwohl der Production S5-B Catalog existiert. Current Development besitzt weder diese Version noch die S5-B Objekte/Rollen.

Vor migrationsnahem Replay/Rebase/Reset muss diese Abhängigkeit separat behandelt werden. History-Repair bleibt Product-Owner-gated mit Backup/PITR/Before-Image und Replay-Proof.

## 5. Agentenstatus

Gestoppt / abgeschlossen:

- `Account plattform audit vorbereitung 18` – AP-7-S4;
- `Account plattform audit vorbereitung 17` – AP-7-S3;
- `Jetnity infrastructure migration audit 1` – Supabase Replay Gate-0 Audit.

Aktiver Cursor-Agent: **keiner durch diesen Status autorisiert**.

Neue logische Einheit → frische Agenten-Generation erst nach Binding Slice Precheck.

## 6. Provider – aktueller Reifegrad

Provider-Arbeit ist nicht abgeschlossen.

Integriert sind Provider Adapter Core, Offline-/Contract-Foundations und Commercial Provenance Foundation. Echte Provider-Secrets/API-Keys, echte Calls, Production Runtime Principal, realer `live_api`-/`persisted_snapshot`-Pfad, Orchestrator und TW-8 bleiben nicht aktiviert bzw. offen.

Vor jedem migrationsnahen Provider-Slice muss der dokumentierte Supabase Replay-Defekt als P1-Abhängigkeit behandelt werden.

## 7. Risiken / Gates

- P0: keine aus den aktuellen Closures bekannten.
- P1 Infrastructure Debt: malformed Production Migration-History-Body `20260829140000` vor Rebase/Reset/Replay-/migrationsnaher Arbeit.
- P2 Governance: `main protected=false`.

Besondere PO-Gates bleiben vor Production-Migrationen/destruktiven Production-Datenänderungen, materiellen RLS-/Identity-/Ownership-Änderungen, fundamentalen Auth/MFA/AAL-Änderungen, sensitiver Dokument-/MRZ-/Biometrie-Speicherung, sensibler externer Datenweitergabe, realen Providerverträgen/Production-Secrets/paid calls/Live-Aktivierung, Commercial Runtime Write-Öffnung, Payments/Geldbewegungen, Kosten > USD 100/Monat und fundamentalen Product/Business/Build-Order/Launch-Entscheidungen.

## 8. Exakter nächster Schritt

1. Frischen Binding Slice Precheck ausführen.
2. `main`, offene PRs/Issues/Branches, CI/Vercel/Supabase live rekonstruieren.
3. Binding Build Order + Account Platform Plan gegen **integriertes AP-7-S1–S4** reconciliieren.
4. verbleibende Traveller-/Document-Lifecycle-/Multi-Citizenship-Produktlücken priorisieren.
5. bei migrationsnaher Arbeit zuerst Replay-P1-Abhängigkeit behandeln.
6. erst danach einen bounded nächsten Slice und eine frische Cursor-Agent-Generation bestimmen.

**Kein Folgeslice ist automatisch freigegeben.**
