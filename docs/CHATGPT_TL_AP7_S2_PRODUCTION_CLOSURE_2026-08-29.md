# AP-7-S2 – Technical-Lead Production Closure

Stand: 29. August 2026  
Status: **COMPLETED / PRODUCTION VERIFIED**

## 1. Scope

AP-7-S2 liefert die additive Account-Traveller-Registry-Persistenz unter der bindenden Dual-Authority:

> Account Registry = reusable current traveller identity/facts.  
> Trip Snapshot = only Current Truth for a concrete trip.

Integriert wurden ausschließlich:

- `public.account_travellers`;
- `public.account_traveller_citizenships`;
- `public.account_traveller_documents`;
- UUID Identity / `client_ref`;
- Composite Ownership FKs;
- owner-only RLS;
- authenticated CRUD, anon none;
- max. 8 Citizenships / 12 Documents je Registry Traveller;
- server-maintained `updated_at`;
- Document→Citizenship Relation innerhalb desselben Travellers und Owners.

## 2. Integration Evidence

- Recovery-PR: #211
- integrierter `main` Merge-SHA: `b8ea3354c14407793b6e9d19f80ab06a20c29244`
- Post-Merge GitHub CI: #1270 / Run `33274497121` = **SUCCESS** auf exakt diesem SHA
- Vercel Production: `dpl_5qJzPjxhfZh6ZtCXgvFEzSPAv3wY` = **READY** auf exakt diesem SHA
- AP-7-S2 Issue #209 = **CLOSED / completed** nach Production-Verifikation

## 3. Production Supabase Evidence

Production Project: `qscbgcdmivbbnzrcyegn`

Angewendete Migration:

`20260829210052_account_traveller_registry_persistence`

Direkt nach Apply read-only verifiziert:

- alle drei Tabellen vorhanden;
- RLS auf allen drei Tabellen aktiv;
- je Tabelle vier Owner-Policies für SELECT / INSERT / UPDATE / DELETE;
- `anon` besitzt keine Tabellenrechte;
- `authenticated` besitzt nur SELECT / INSERT / UPDATE / DELETE und bleibt durch Owner-RLS begrenzt;
- Composite Parent Ownership FKs vorhanden;
- Document→Citizenship FK erzwingt denselben Traveller + Owner;
- Citizenship-/Document-Limit-Trigger vorhanden;
- `updated_at` Trigger vorhanden;
- Row Counts: Travellers 0 / Citizenships 0 / Documents 0;
- keine Pass-/Dokumentnummern, Scans, MRZ, Biometrie, DOB oder Health-Spalten.

## 4. Security Advisor

Nach dem Production Apply wurde der Supabase Security Advisor erneut ausgeführt.

Er meldet für die drei neuen Tabellen generische `authenticated` GraphQL Exposure WARNs, weil `authenticated` im freigegebenen S2-Vertrag direkten CRUD-Zugriff besitzt. Das ist kein Nachweis für Cross-Account-Lesen: Owner-Isolation wird durch die geprüften RLS-Policies erzwungen.

Daneben bestehen ältere, AP-7-S2-fremde Advisor-Warnungen. Sie wurden in diesem Slice bewusst nicht verändert.

## 5. Hard Non-Scope blieb erhalten

Nicht Teil von AP-7-S2 und nicht still eingeführt:

- Registry UI / CRUD Screens;
- Registry→Trip Runtime Materialization;
- Guest→Registry Import / Dedup;
- Backfill;
- Änderungen an bestehenden Trip-Traveller-Tabellen;
- Live-FK von Trips zur Registry;
- Default-Pass oder Default-Citizenship;
- Pass-/Dokumentnummern, Scans, MRZ, Biometrie, DOB, Health;
- Auth / Sessions / MFA / AAL Änderung;
- Admin-/Support-Bypass;
- Provider Runtime / Secrets / Paid Calls;
- TW-8;
- Payments;
- Branch Protection.

## 6. Separate Infrastructure Debt

Während des Development-Regatings wurde eine historische Supabase-Migration-History-/Replay-Störung rund um S5-B Commercial Provenance festgestellt. Die kanonische Repo-Migration war sauber; Production wurde zur Reparatur dieser separaten Störung nicht manipuliert.

Diese Infrastructure Debt ist **nicht AP-7-S2** und darf einen späteren Provider-/Migration-Slice nur nach frischer Live-Prüfung beeinflussen.

## 7. Closure / Next-Step Gate

AP-7-S2 ist technisch abgeschlossen.

Vor dem nächsten Implementierungsslice gilt erneut das Binding Slice Precheck / Continuity Gate. Insbesondere müssen aktuelle Build Order, Account-/Traveller-Restarbeit, Provider-Restarbeit, offene PRs/Issues/Branches, Production Truth, parallele Workstreams und besondere Product-Owner-Gates live gegeneinander geprüft werden.

Kein Folgeslice wird allein aufgrund älterer Handoffs automatisch gestartet. Für eine neue logische Implementierungseinheit wird gemäß Operating Standard eine frische Cursor-Agent-Session verwendet; Technical Lead definiert Scope und führt unabhängiges Exact-Head Review/Gating durch.