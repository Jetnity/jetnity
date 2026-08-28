# Jetnity – P2-TA-04 Traveller Child Write-Path Hardening Gate 0

Stand: 28. August 2026  
Issue: #119  
Typ: **AUDIT / SECURITY ARCHITECTURE / EVIDENCE ONLY**  
Cursor-Agent: **Account plattform audit vorbereitung 6**  
Start-Baseline: `main @ 918bf3606eaa9ac23e96551c0311edf20514817d`

## 1. Ziel

P2-TA-04 belastbar klären, bevor irgendein RLS-/Grant-/Ownership-Vertrag geändert wird.

Live Production zeigt aktuell:

- `authenticated` hat `SELECT`, `INSERT`, `UPDATE`, `DELETE` auf `trip_travellers`, `trip_traveller_citizenships`, `trip_traveller_documents`;
- Owner-RLS schützt `user_id = auth.uid()`;
- Composite-FKs binden Children an dieselbe `(traveller_id, trip_id, user_id)`-Ownership;
- Citizenship-/Document-Limits sind per Trigger abgesichert;
- `party_schreiben(jsonb)` ist der kanonische Write-Pfad, läuft aber als `SECURITY INVOKER`.

Damit ist kein Cross-User-P0 bewiesen. Gleichzeitig können direkte authenticated-DML-Writes den vorgesehenen Write-Contract umgehen. Ein blindes `REVOKE` würde den SECURITY-INVOKER-RPC potentiell brechen.

## 2. Pflicht-Rekonstruktion

Vor Analyse live neu prüfen:

1. aktuelles `main` + Merge-Base/Drift;
2. Issue #119 und offene parallele PRs;
3. `docs/JETNITY_BINDING_BUILD_ORDER.md`;
4. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`;
5. `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT.md`;
6. Foundation-E-ADRs/Migrationen;
7. `party_schreiben`-Definition, Grants, RLS, FKs, Constraints, Trigger;
8. Guest→Account- und Readiness-Verträge.

Live-Evidence gewinnt immer.

## 3. Runtime-Caller-Inventur

Exhaustiv feststellen, ob aktuelle Runtime direkt auf die drei Tabellen schreibt.

Suche mindestens:

- `.from('trip_travellers')` / entsprechende typed wrappers;
- `.from('trip_traveller_citizenships')`;
- `.from('trip_traveller_documents')`;
- `.insert`, `.upsert`, `.update`, `.delete` auf diesen Tabellen;
- `rpc('party_schreiben'...)` und Wrapper;
- Admin-/Server-/Guest→Account-/Takeover-/Tests/Migrationspfade;
- mögliche Service-Role-Pfade.

Jeden Fund klassifizieren als current runtime / test only / migration only / historical / dead / indirect.

Wenn kein direkter Runtime-Caller existiert, ausdrücklich mit Such-Evidence belegen. Nicht nur behaupten.

## 4. Invarianten-Matrix

Für jede relevante Invariante dokumentieren, wo sie erzwungen wird:

- Auth vorhanden;
- Trip gehört User;
- max. 20 Traveller;
- `client_ref` Format/Länge/Uniqueness;
- Label-Länge / keine Nummern / kein HTML;
- Residence ISO-2;
- max. 8 Citizenships;
- Citizenship ISO-2 / Uniqueness;
- max. 12 Documents;
- Document-Typ;
- Issuer ISO-2;
- Document↔Citizenship nur gleicher Traveller/Trip/User;
- Foreign-Citizenship fail-closed;
- atomarer Replace-/Delete-/Insert-Vertrag;
- stale/Readiness-Auswirkung;
- Legacy-Singularfelder / Expand-Contract;
- Delete/Cascade/SET NULL;
- Cross-Trip / Cross-User Isolation.

Spalten: DB Constraint/FK/Trigger | RLS | `party_schreiben` | App | direktes DML möglich? | Risiko.

## 5. Adversarial Gate-0 Tests

Keine Production-Daten verändern. Tests nur lokal / bestehende Testumgebung / statische Evidence.

Mindestens prüfen:

1. >20 `trip_travellers` durch direkten DML-Pfad;
2. Child-Limit >8/>12;
3. Child mit fremdem Traveller/Trip/User;
4. Document-Citizenship-Relation zu fremdem Traveller;
5. direkte Partial-Updates, die `party_schreiben`-Replace-Semantik umgehen;
6. direkte Deletes und Readiness-Stale-/Cache-Folgen;
7. Legacy-Singularfelder vs Children;
8. ob direkte Writes einen bereits vorhandenen Trigger/constraint vollständig abdecken;
9. ob `party_schreiben` nach einem hypothetischen `REVOKE` noch funktionieren würde.

Keine Browser-/DB-Behauptung ohne tatsächliche Evidence.

## 6. Closure-Optionen – nur bewerten, nicht umsetzen

Mindestens diese Optionen adversarial vergleichen:

### Option A – Direkte DML bleibt supported

Dann müssen alle produktrelevanten Invarianten vollständig DB-seitig erzwungen sein. Kein stiller RPC-only-Contract.

### Option B – Direkte DML wird geschlossen

Dann darf nicht blind `REVOKE` gesetzt werden. Der kanonische Write-Pfad muss mit einem sicher entworfenen Berechtigungsmodell weiter funktionieren. SECURITY DEFINER wäre ein eigener sensibler Security-Vertrag und darf nicht beiläufig eingeführt werden.

### Option C – kleinerer fail-closed Schnitt

Nur wenn Evidence eine kleinere, sicherere Variante zeigt.

Für jede Option:

- Security;
- Ownership;
- Integrity;
- Privacy;
- Runtime-Kompatibilität;
- Migration/RLS/Grant-Impact;
- Rollback;
- Tests;
- Production-Risiko;
- Product-Owner-Gate.

## 7. Harte Grenzen

In diesem Gate 0 **nicht** ändern:

- Migrationen;
- `GRANT` / `REVOKE`;
- RLS Policies;
- SECURITY INVOKER/DEFINER;
- Schema;
- Production-Daten;
- Supabase Branches;
- Auth/MFA/AAL;
- AP-5/AP-6a/AP-7 Runtime;
- Passport-Nummern/Scans/MRZ/Biometrie;
- Provider S5-B / TW-8 / Search / Homepage / Indexing / Native.

## 8. Output

Erwartete Deliverables auf demselben Branch:

- `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_STATUS_2026-08-28.md`
- `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_HANDOFF_2026-08-28.md`
- falls fachlich nötig ein ADR **nur für die Gate-0-Entscheidung**, nicht für eine bereits beschlossene RLS-Änderung;
- minimale Continuity-Zeiger nur wenn Current Truth betroffen ist.

## 9. Stop-Regel

Author Agent beendet nach Evidence + Empfehlung + Self-Review.

**Nicht Ready. Nicht mergen. Kein Implementation-Folgeslice.**

Der unabhängige Technical Lead prüft danach Exact Head, Diff, Scope, CI, Vercel, Review-Threads, Supabase-Evidence und die empfohlene Product-Owner-Grenze.
