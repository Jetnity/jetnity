# Jetnity – P2-TA-04 Traveller Child Write-Path Hardening Gate 0 – Status

Stand: 28. August 2026  
Status: **AUTHOR COMPLETE / DRAFT-PR / KEIN READY / KEIN MERGE / KEINE RLS- ODER PRODUCTION-ÄNDERUNG**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 6`**  
Issue: [#119](https://github.com/Jetnity/jetnity/issues/119)  
Branch: `docs/p2-ta-04-traveller-write-path-gate0`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/120

> Live-Evidence gewinnt. Vorbereitungs-SHAs sind Start-Evidence.

## 1. Live-Rekonstruktion dieses Agenten

| Feld | Wert |
| --- | --- |
| `origin/main` | `918bf3606eaa9ac23e96551c0311edf20514817d` – Merge PR #118 |
| Author-Start-Head | `3a56da73f9063d3102d83ab4789b8f2a9622aeab` |
| Merge-Base gegen `origin/main` | `918bf3606eaa9ac23e96551c0311edf20514817d` |
| Ahead / Behind bei Start | **3 ahead / 0 behind** |
| Issue #119 | OPEN |
| Draft-PR #120 | OPEN / Draft / MERGEABLE |
| `main` Branch Protection | `protected=false` |
| Parallel offene PRs | #88, #52, #50, #40, #39, #28 – historical/fremd; nicht angefasst |
| P2-TA-03 / PR #117 | **integrated** auf `main`; Issue #116 CLOSED |
| P2-TA-06 / PR #113 | **integrated**; nicht erneut öffnen |

Supabase, 28. August 2026, **read-only Management-API**, keine Mutation:

| Ziel | Stand |
| --- | --- |
| Production `qscbgcdmivbbnzrcyegn` / default `main` | `ACTIVE_HEALTHY` / `FUNCTIONS_DEPLOYED` |
| non-default `develop` | `FUNCTIONS_DEPLOYED`; Grants/INVOKER identisch zur Production-Frage dieses Slice |
| `jetnity-bets` | vorhanden, nicht angefasst |

Rohkatalog: `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_LIVE_EVIDENCE_2026-08-28.json`

## 2. Was dieser Slice geliefert hat

Nur Audit / Security Architecture / Evidence:

1. Unabhängige Live-Verifikation von Grants, RLS, FKs, Triggern, Funktions-Security
2. Exhaustive Caller-Inventur inkl. Such-Evidence und Regressionstest
3. Invarianten-Matrix und adversarial Gate-0-Analyse
4. Closure-Empfehlung **ohne** Umsetzung
5. ADR-0180 (Gate-0-Entscheidung, keine RLS-Änderung)
6. Status, Handoff, Self-Review, Continuity-Zeiger

Keine Runtime-, Migrations-, Config-, Schema-, Grant- oder RLS-Datei.

## 3. Caller-Inventur

Suche in `app/`, `lib/`, `components/`, `scripts/` (ohne Tests, ohne `docs/`, ohne `supabase/migrations/` als Runtime):

| Muster | Runtime-Treffer | Klasse |
| --- | --- | --- |
| `.from('trip_travellers')` | nur `lib/readiness/reisende-aktionen.ts` → `travellerEntfernen().delete()` | **current runtime** |
| `.from('trip_traveller_citizenships')` | keiner | **absent in current app** |
| `.from('trip_traveller_documents')` | keiner | **absent in current app** |
| `.rpc('party_schreiben')` | nur `reisende-aktionen.ts` → `travellerSetzen`, `partyUebernehmen` | **current runtime** |
| Service-Role-Write auf die drei Tabellen | keiner im Produktpfad | **absent** |
| Admin-Write auf die drei Tabellen | keiner | **absent** |
| Guest Local Storage | `jetnity:reise:v3` / `GastreiseBruecke` → `partyUebernehmen` | **indirect / takeover** |
| `scripts/db/sicherheit.mjs`, `parallelitaet.mjs` | direkte INSERTs | **test only** |
| Foundation-E-Migrationen | CREATE/GRANT/Backfill | **migration only** |
| `lib/trips/daten.ts`, `foundation-e-select.ts`, `reisende.ts` | Select-Embed | **read only** |

UI-Caller:

- `components/trips/KontoArbeitsbereich.tsx` → `travellerSetzen` / `travellerEntfernen`
- `components/trips/GastreiseBruecke.tsx` → `partyUebernehmen`

Damit ist direkte authenticated-DML **kein unbenutztes Grant**. Parent-`DELETE` ist ein aktueller Produktpfad. Child-DML hat keinen App-Caller, bleibt aber über PostgREST für `authenticated` offen, weil die Grants existieren und `party_schreiben` sie als SECURITY INVOKER selbst braucht.

## 4. Live Production-Katalog – unabhängig gelesen

`authenticated` hat `SELECT`, `INSERT`, `UPDATE`, `DELETE` auf:

- `trip_travellers`
- `trip_traveller_citizenships`
- `trip_traveller_documents`

`anon` / `public` haben **keine** Tabellenrechte auf diesen drei Relationen.

RLS ist auf allen drei Tabellen aktiv. Je vier Owner-Policies, Rolle `authenticated`, Prädikat `user_id = (select auth.uid())`.

`party_schreiben(jsonb)`:

- `prosecdef = false` → **SECURITY INVOKER**
- `search_path=public, pg_temp`
- EXECUTE: `authenticated` ja, `anon` nein, `service_role` ja
- schreibt Parent per UPSERT, löscht Children des Travellers, schreibt Children neu
- löscht **keine** Traveller-Zeile

`trip_traveller_kinder_limit_pruefen()`: SECURITY INVOKER, `FOR NO KEY UPDATE`, Trigger nur **AFTER INSERT** auf den Child-Tabellen.

Kein DB-Constraint/Trigger begrenzt die Anzahl `trip_travellers` je Reise auf 20.

Composite-FKs live bestätigt, inkl. Readiness `ON DELETE CASCADE` und Document↔Citizenship `ON DELETE SET NULL (citizenship_id)`.

Foundation-E-Migrationen auf Production vorhanden: `20260822020000`, `20260822160000`, `20260822170000`, `20260822180000`.

## 5. Invarianten-Matrix

Legende DML: kann ein Owner die Invariante per direktem PostgREST/SQL umgehen?

| Invariante | DB / FK / Trigger | RLS | `party_schreiben` | App | direktes DML möglich? | Risiko |
| --- | --- | --- | --- | --- | --- | --- |
| Auth vorhanden | nein | Policies nur `authenticated` | `auth.uid()` null → 42501 | `konto()` | anon ohne Grant | Ownership gehalten |
| Trip gehört User | Parent-FK `(trip_id, user_id) → trips` | `user_id = auth.uid()` | existiert-Check auf `trips` | `reiseLaden` | fremde Reise: FK+RLS lehnen ab | kein Cross-User-P0 |
| max. 20 Traveller | **fehlt** | nein | nur Payload-Länge ≤ 20, nicht Bestand+neu | `travellerSetzen` prüft Bestand; `partyUebernehmen` nicht | **ja**, und auch inkrementelles RPC | P2 Integrität |
| `client_ref` Länge/Uniqueness | CHECK 1–64; UNIQUE `(user_id, trip_id, client_ref)` | nein | prüft Länge | Zod | Format/Unique DB-gehalten | niedrig |
| Label Länge / keine Nummern / kein HTML | CHECK auf Parent | nein | zusätzlich Keyword-Check | Zod `enthaltSensitiveDaten` | DB hält CHECK; RPC/App etwas strenger | niedrig |
| Residence ISO-2 | CHECK | nein | CHECK + RPC | Zod | DB-gehalten | niedrig |
| max. 8 Citizenships | Trigger nach **INSERT** | nein | Payload ≤ 8 | Zod max 8 | INSERT >8 nein; **UPDATE-Reparent** umgeht Trigger | P2 Integrität |
| Citizenship ISO-2 / Unique Land | CHECK `^[A-Z]{2}$`; UNIQUE `(traveller_id, country_code)` | nein | prüft | Zod | DB-gehalten | niedrig |
| max. 12 Documents | Trigger nach **INSERT** | nein | Payload ≤ 12 | Zod | wie Citizenships: UPDATE-Reparent | P2 Integrität |
| Document-Typ | CHECK `passport\|national_id\|unknown` | nein | prüft | Zod | DB-gehalten | niedrig |
| Issuer ISO-2 | CHECK nullable | nein | prüft | Zod | DB-gehalten | niedrig |
| Document↔Citizenship gleicher Traveller/Trip/User | Composite-FK | Owner-RLS | löst nur eigene Refs auf; sonst `FOREIGN_CITIZENSHIP` | Zod gleiche Person | FK hält Cross-Traveller | kein P0 |
| Foreign-Citizenship fail-closed | FK | RLS | RPC-Fehler | Zod | DML kann Relation weglassen/`null` setzen | P2 Vertrag |
| Atomarer Replace der Children | nein | nein | ja, Delete+Insert je Traveller im Payload | Set/Takeover ja; Delete nein | **ja** Partial-Update/Delete | P2 Vertrag |
| Ganze Party ersetzen / Traveller löschen | CASCADE wenn Parent weg | Owner | **löscht Traveller nicht** | `travellerEntfernen` direktes DELETE | Delete ist der aktuelle Produktpfad | Kompatibilität |
| stale / Readiness | Readiness-FK CASCADE bei Traveller-Delete | Owner | ändert Fingerprints nicht | `revalidatePath` | direkte Child-Mutation ohne Recheck | P2 stale |
| Legacy-Singular | Spalten bleiben; keine Sync-Trigger | nein | schreibt Legacy-Credential-Spalten **nicht** | Expand nur wenn Children nicht geladen | DML kann Legacy setzen; geladene `[]` bleibt leer | P3 |
| Cross-Trip / Cross-User | Composite-FKs | `user_id = auth.uid()` | Trip-Owner-Check | Trip-Load | abgelehnt | kein P0 |

## 6. Adversarial Gate-0 – statisch + Live-Katalog + bestehende Tests

Keine Production-Zeile verändert. Kein `db:sicherheit` / `db:parallelitaet` gegen Live, weil diese Skripte schreiben.

| Fall | Ergebnis | Evidence |
| --- | --- | --- |
| >20 `trip_travellers` per DML | **möglich** | kein Count-Constraint/Trigger live |
| >20 über `party_schreiben` | **möglich**, wenn bestehende Zeilen + neues Payload ≤20 neue Refs | RPC prüft nur Array-Länge; `partyUebernehmen` addiert |
| Child-Limit >8/>12 per INSERT | **abgelehnt** | Trigger + `scripts/db/sicherheit.mjs` / `parallelitaet.mjs` |
| Child-Limit per UPDATE-Reparent | **möglich** | Trigger nur AFTER INSERT |
| Child mit fremdem Traveller/Trip/User | **abgelehnt** | Composite-FK + RLS; Sicherheitstest „fremde Traveller-ID“ |
| Document-Citizenship fremder Traveller | **abgelehnt** | Composite-FK `(citizenship_id, traveller_id, trip_id, user_id)` |
| Partial-Update umgeht Replace | **möglich** | Grants + kein App-Caller, aber PostgREST offen |
| Direkter Delete + Readiness | Traveller-spezifische Items CASCADE weg; Trip-level bleibt; kein automatischer Recheck | FK live; `travellerEntfernen` nur `revalidatePath` |
| Legacy vs Children | `party_schreiben` leert Children, lässt Legacy stehen; geladene `[]` ist autoritativ | ADR-0123; Sicherheitstests |
| Trigger deckt direkten Write vollständig? | **nein** – Party-Cap und UPDATE-Limits fehlen | Katalog |
| `REVOKE` + aktuelles INVOKER-RPC | **bricht** `party_schreiben` und `travellerEntfernen` | `prosecdef=false`; Funktion macht INSERT/UPDATE/DELETE; App-Delete braucht DELETE |

Kein Cross-User-P0. Ownership und Write-Contract bleiben getrennt.

## 7. Closure-Optionen – nur bewertet

### Option A – Direkte DML bleibt supported

Dann müsste die DB alle produktrelevanten Invarianten tragen: Party-Cap-20, Child-Limit auch auf UPDATE, evtl. Write-only-über-RPC-Enforcement. Dualer Vertrag widerspricht ADR-0119. Rollback leicht, Runtime unverändert, Integrität bleibt lückenhaft bis zu den Triggern.

### Option B – Direkte DML sofort schliessen

Blindes `REVOKE INSERT/UPDATE/DELETE` von `authenticated` bricht SECURITY INVOKER `party_schreiben` und den aktuellen Delete-Pfad. Ein Wechsel auf SECURITY DEFINER wäre ein neuer sensibler Security-Vertrag und ein besonderes Product-Owner-Gate. Nicht als erster Schritt.

### Option C – gestufter fail-closed Schnitt **(Empfehlung)**

1. **C1 – Vertrag vervollständigen, Privilegien unverändert:** kanonische Delete-Semantik in einem INVOKER-RPC (`party_schreiben` erweitern oder `party_loeschen`); `travellerEntfernen` darauf umbiegen; DB-Trigger max. 20 Traveller je `(user_id, trip_id)`; Child-Limit auch `AFTER UPDATE`. Kein REVOKE, kein DEFINER.
2. **C2 – Privilegien schliessen, eigener Slice:** erst wenn kein Runtime-Tabellen-DML mehr existiert. Dann SECURITY DEFINER für die Write-RPCs, `REVOKE` der Tabellen-DML für `authenticated`, `SELECT` behalten. Explizites Product-Owner-Gate.

C1 braucht eine Funktions-/Trigger-Migration und damit vor Production-Apply ein Product-Owner-Gate. C2 ist das grosse RLS-/Ownership-/DEFINER-Gate.

## 8. Empfehlung und Klassifikation

| ID | Klasse | Aussage |
| --- | --- | --- |
| Cross-User Ownership | **kein P0** | RLS + Composite-FKs halten; bestehende Sicherheitstests lehnen fremde Writes ab |
| P2-TA-04 | **P2** bestätigt | Direct DML umgeht RPC-only-Vertrag; Child-Grants sind App-unbenutzt, aber INVOKER-nötig |
| Party-Cap | **P2 Integrität** im kanonischen Pfad und per DML | kein DB-Limit; inkrementelles RPC kann >20 |
| Child-Limit UPDATE | **P2 Integrität** | Trigger nur INSERT |
| Legacy-Singular | **P3** | Expand/Contract unverändert |
| AP-5 / AP-6a / AP-7 | **nicht starten** | Non-Scope |

Direkte DML ist heute:

1. **erforderlich** für `travellerEntfernen` (Parent-DELETE);
2. **erforderlich** für das INVOKER-RPC (alle drei Tabellen);
3. **kein** bewusst unterstützter Produktvertrag für Child-Writes (ADR-0119);
4. **eine Integritätsumgehung**, kein Ownership-Bypass.

## 9. Product-Owner-Gate für einen späteren Implementation-Slice

Gate 0 selbst: **kein** Aktivierungs-Gate.

Jeder Folgeslice, der eines der folgenden tut, braucht **ausdrückliche Product-Owner-Freigabe vor Ausführung/Apply**:

- Production-Migration / Funktions- oder Trigger-Änderung auf Production
- `GRANT` / `REVOKE`
- RLS-Policy-Änderung
- SECURITY DEFINER/INVOKER-Wechsel
- Ownership-/Identity-Vertragsänderung

Ein reiner Docs- oder Test-Lock ohne Schema bleibt normales Technical-Lead-Gate.

## 10. Lokale Tests dieses Author-Laufs

Ausgeführt auf diesem Branch, nicht als Exact-Head-CI behauptet:

- `node --import tsx --test lib/readiness/p2-ta04-write-path-inventory.test.ts lib/readiness/reisende.test.ts lib/trips/foundation-e-select.test.ts` → **9/9 pass**
- `npm test` → **2381/2381 pass**

Kein Production-Build in diesem Author-Lauf. Exact-Head GitHub Actions und Vercel werden nach dem finalen Push live gestempelt.

Die GitHub-PR-Beschreibung ist Technical-Lead-managed und konnte von diesem Agenten nicht überschrieben werden. Kanonischer Zieltext: `docs/P2_TA04_PR120_DESCRIPTION_2026-08-28.md`.

## 11. Nächster Schritt

Unabhängiger Technical-Lead-Review von Draft-PR #120.

Nicht Ready. Nicht mergen. Kein C1/C2. Kein AP-5/AP-6a/AP-7.
