# Jetnity – Technical-Lead Checkpoint: AP-7-S3 + Supabase Replay Audit

Stand: 29. August 2026  
Status: **POST-MERGE / PRODUCTION VERIFIED / CURRENT CONTINUITY**

> Live-Evidence gewinnt immer. Dieser Checkpoint dokumentiert den verifizierten Abschluss zweier parallel geführter, voneinander isolierter Workstreams. Er autorisiert keinen automatischen Folgeslice.

## 1. Verifizierter Baseline-Stand

Nach Abschluss beider Workstreams:

- `main @ bb0fb2050e09e8fa5bf670e4290523c037790954`
- AP-7-S3 Runtime/UI wurde über Recovery-PR #219 integriert.
- Supabase Migration-History Replay Gate-0 Audit wurde über Recovery-PR #220 als reine Dokumentation integriert.
- Post-Merge CI nach AP-7-S3: #1282 / Run `33276919765` = **SUCCESS** auf `d58f6a80ddfe9795445abc84610a2895bae19338`.
- AP-7-S3 Vercel Production: `dpl_Dsra2GnomnE3je1dueRALiKxLX32` = **READY** auf exakt `d58f6a80ddfe9795445abc84610a2895bae19338`.
- Post-Merge CI nach Infra-Audit: #1284 / Run `33277102071` = **SUCCESS** auf aktuellem `main` `bb0fb2050e09e8fa5bf670e4290523c037790954`.
- Aktuelle Vercel Production: `dpl_BFHHnDoekhxq6CvsLQXiSHrTkmpT` = **READY** auf exakt aktuellem `main`.
- `main protected=false` bleibt separates Governance-Risiko.

## 2. AP-7-S3 – Account Traveller Registry CRUD/UI abgeschlossen

Source Draft PR #215:

- Agent: `Account plattform audit vorbereitung 17`
- finaler exact reviewed Head: `ca548fc84fd097457f26edc64653befc28e01437`
- Runtime-/Implementierungs-Head darin: `376023b5502be495115119adb06cb16340317f16`
- GitHub Actions CI #1279 = **SUCCESS**
- Vercel Preview `dpl_5LB556p8WvMDnBFN9NYKekPGwzGD` = **READY**
- Independent Technical-Lead PASS: Kommentar `5465048276`
- Draft→Ready scheiterte erneut am bekannten Connectorfehler `Repository.fullDatabaseId`.

Recovery PR #219:

- identischer reviewed Head `ca548fc84fd097457f26edc64653befc28e01437`
- Recovery CI #1281 / Run `33276779999` = **SUCCESS**
- Recovery Vercel `dpl_99uUonTGNg9kUa5rTZJJvh9uA7J6` = **READY**
- 0 GitHub Review Threads
- 0 unresolved Vercel Toolbar Threads
- mit expected-head lock gemergt
- Merge/Main danach: `d58f6a80ddfe9795445abc84610a2895bae19338`
- Issue #214 = **CLOSED / completed**

### Gelieferte Produktfunktion

`/account/travellers` ist als echte authentifizierte Account-Fläche auf Production vorhanden. Unauthenticated Production-Aufruf wird korrekt über die bestehende Auth-Grenze auf Login geführt.

Geliefert:

- Owner-only Registry Traveller CRUD über bestehende AP-7-S2 Tabellen/RLS;
- Account-Navigation `Reisende`;
- Label + Residence Country;
- mehrere Citizenships, max. 8;
- mehrere Document-Metadaten, max. 12;
- Dokumenttyp nur `passport | national_id | unknown`;
- Issuing Country bleibt unabhängig von Citizenship;
- optionale explizite Document→Citizenship-Relation;
- `expires_on` als Dokument-Metadatum;
- Loading/Empty/Error/Success getrennt;
- mobile-/accessibility-orientierte UI und focused regression coverage.

Weiterhin ausdrücklich **nicht** gebaut:

- keine Registry→Trip Runtime-Materialisierung;
- kein Guest→Registry Import/Dedup;
- kein Default-/Primary-/Chosen-Pass oder Default-Citizenship;
- keine Pass-/Dokumentnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten;
- keine neue Migration/RLS/Auth/MFA/AAL-Änderung.

Production AP-7-S2 RLS/Grants wurden beim TL Review read-only erneut bestätigt: owner-only Policies auf allen drei Registry-Tabellen, `authenticated` CRUD unter RLS, `anon` ohne Tabellenrechte.

## 3. Supabase Migration-History Replay Gate 0 abgeschlossen

Source Draft PR #218:

- Agent: `Jetnity infrastructure migration audit 1`
- finaler exact reviewed Head: `85135a8ad35860644e9ff344000188b5c24e40af`
- docs-only / keine Mutation
- GitHub Actions CI #1280 = **SUCCESS**
- Vercel Preview `dpl_BKMF2HztNY9KXdgX7FE6DdRX4FtW` = **READY**
- Independent Technical-Lead PASS: Kommentar `5465052649`

Recovery PR #220 gegen den nach AP-7-S3 aktualisierten `main`:

- identischer Audit-Head `85135a8ad35860644e9ff344000188b5c24e40af`
- Recovery CI #1283 / Run `33276955797` = **SUCCESS**
- Recovery Vercel `dpl_5GKQYJEb6ojSg8ubYQAknFRTCgNP` = **READY**
- 0 GitHub Review Threads
- 0 unresolved Vercel Toolbar Threads
- mit expected-head lock gemergt
- aktueller `main`: `bb0fb2050e09e8fa5bf670e4290523c037790954`
- Issue #216 = **CLOSED / completed**

### Verifizierter Infrastrukturdefekt

Supabase Production `qscbgcdmivbbnzrcyegn` besitzt die Migration-History-Version `20260829140000_trip_item_commercial_provenance`, aber deren gespeicherte `statements[1]` ist **kein replaybares SQL**, sondern ein 234-Zeichen-Prosa-Marker.

Independent TL read-only Evidence:

- `statement_count = 1`
- `statement_0_chars = 234`
- MD5 `414f7318235ac388e97fd74f97536ca1`
- Production S5-B Catalog ist dennoch vorhanden;
- `public.trip_item_commercial_provenance` existiert, RLS aktiv, 0 Rows;
- `jetnity_internal.commercial_write_runtime_gate` existiert;
- `production_write_path_allocated = false`.

Current Development `yfvbxvijcorffwxbxahl` enthält Version `20260829140000` nicht und besitzt die S5-B Provenance-/Runtime-Gate-Objekte/Rollen nicht. Das erklärt den beobachteten Rebase-/Replay-Fehler.

### Reparaturstatus

**Keine Reparatur wurde durchgeführt.** Weder Production noch Development wurden durch diesen Audit mutiert.

Ein späterer Repair-Slice muss separat gegatet werden. Empfohlene Zielrichtung des Audits: nur die falsche gespeicherte Production-History-Statement-Body durch replaybares kanonisches SQL korrigieren, ohne Production-DDL erneut auszuführen; danach Replay auf einer frischen temporären Branch beweisen. Vor jeder solchen `schema_migrations`-Mutation sind ausdrückliche Product-Owner-Freigabe, Backup/PITR-/Before-Image-Plan und ein exakter Rollback-/Replay-Nachweis erforderlich.

## 4. Aktive Agenten / Workstreams

Die beiden Cursor-Agenten sind nach ihren Handoffs gestoppt:

- `Account plattform audit vorbereitung 17` – AP-7-S3 abgeschlossen;
- `Jetnity infrastructure migration audit 1` – Gate-0 Audit abgeschlossen.

Es gibt aus diesem Checkpoint **keinen automatisch aktiven Cursor-Folgeslice**.

## 5. Risiken / Gates

- P0: keine aus diesen beiden Closures bekannten.
- P1 Infrastructure Debt vor einem künftigen Supabase Rebase/Reset/Replay-/migrationsnahen Slice: malformed Production-History-Body für `20260829140000`.
- P2 Governance: `main protected=false`.
- Registry→Trip Runtime bleibt fachlich offen, aber nicht automatisch autorisiert.
- Provider S4/S6-S8 und echte Provideraktivierung bleiben gemäß Binding Build Order/Gates offen.
- TW-8 bleibt geschlossen.

Besondere Product-Owner-Gates bleiben unverändert, insbesondere vor Production-Migrationen/destruktiven Datenänderungen, materiellen RLS-/Identity-/Ownership-Änderungen, fundamentalen Auth/MFA/AAL-Änderungen, sensitiver Dokument-/MRZ-/Biometrie-Speicherung, sensibler externer Datenweitergabe, echten Providerverträgen/Secrets/paid calls/Live-Aktivierung, Öffnung geschlossener Commercial-Write-Pfade, Payments/Geldbewegungen, Kosten > USD 100/Monat und fundamentalen Product/Business/Build-Order/Launch-Entscheidungen.

## 6. Exakter nächster Schritt

**Kein automatischer Folgeslice.**

Vor neuer Implementierung:

1. aktuellen `main`, offene PRs/Issues/Branches, CI/Vercel/Supabase live rekonstruieren;
2. `docs/JETNITY_BINDING_BUILD_ORDER.md` und `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` erneut abgleichen;
3. den Supabase Replay-Defekt bei jedem migrationsnahen Kandidaten als P1-Abhängigkeit behandeln;
4. AP-7-Restarbeit gegen Provider-/Account-Restarbeit und Shared Contracts prüfen;
5. erst danach einen bounded Slice und eine frische Cursor-Agent-Generation bestimmen.

Registry→Trip Runtime-Materialisierung ist ein naheliegender AP-7-Kandidat, aber **durch diesen Checkpoint nicht freigegeben**.