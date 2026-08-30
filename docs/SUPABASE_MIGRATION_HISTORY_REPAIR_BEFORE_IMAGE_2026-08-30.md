# Supabase Migration-History Repair – Production Before Image

Stand: 30. August 2026  
Status: **READ-ONLY BEFORE IMAGE / NO MUTATION**  
Issue: #249  
Production project: `qscbgcdmivbbnzrcyegn`

Diese Datei hält die fail-closed Before-Evidence für den späteren, separat gegateten History-Body-Repair. Sie autorisiert keinen Write.

## 1. Migration-History Before Image

| Feld | Live-Wert |
| --- | --- |
| Version | `20260829140000` |
| Name | `trip_item_commercial_provenance` |
| Statement count | `1` |
| Stored statements MD5 | `414f7318235ac388e97fd74f97536ca1` |
| Statement 0 | `S5-B Commercial Provenance persistence applied by Technical Lead from canonical repository migration at main merge 3b684f64f28bc4a2732e34cd642837aab5ea70ec; semantics verified on isolated Supabase Postgres 17 branch before Production.` |

Der gespeicherte Body ist Prosa und damit nicht replay-fähiges SQL.

## 2. Canonical Repository Source

| Feld | Wert |
| --- | --- |
| Repository baseline | `main@c29ac5de3e0ab998ff830490a9a3e85299c399e0` |
| Migration path | `supabase/migrations/20260829140000_trip_item_commercial_provenance.sql` |
| Git blob SHA | `e25ab1b7efb48157828968993749a25fa30cc660` |
| First line | `-- S5-B Persistence Foundation (ADR-0197 / ADR-0198 / Option C)` |

Der spätere Ersatz-Body muss aus genau dieser kanonischen Quelle deterministisch erzeugt werden. Eine geänderte Datei / anderer Blob invalidiert dieses Before Image.

## 3. Production Catalog Fingerprints

### Provenance table

- Relation: `public.trip_item_commercial_provenance`
- OID at capture: `282263`
- RLS enabled: `true`
- FORCE RLS: `false`
- Exact row count: `0`
- ACL:
  - `postgres=arwdDxtm/postgres`
  - `authenticated=r/postgres`

### Owner read policy

Policy: `trip_item_commercial_provenance_lesen`

- command: `SELECT`
- role: `authenticated`
- permissive: `PERMISSIVE`
- predicate requires `user_id = auth.uid()` and matching owner-scoped `trip_items` relation.

### Runtime gate

- `singleton=true`
- `production_write_path_allocated=false`
- `allocated_invoker_role=null`
- Gate bleibt geschlossen.

### Roles

`jetnity_commercial_runtime`:

- NOLOGIN (`rolcanlogin=false`)
- NOINHERIT (`rolinherit=false`)
- no BYPASSRLS

`jetnity_commercial_writer`:

- NOLOGIN (`rolcanlogin=false`)
- INHERIT (`rolinherit=true`)
- no BYPASSRLS

Membership Evidence:

- `jetnity_commercial_writer` granted to `jetnity_commercial_runtime`
- postgres has both administrative memberships
- kein app login principal ist hier als Runtime-Invoker belegt

### Writer function

- schema: `jetnity_internal`
- name: `trip_item_commercial_provenance_schreiben`
- identity args: `_eingabe jsonb`
- SECURITY DEFINER: `true`
- function config: `search_path=""`
- function definition MD5: `7e7bfe10d20c2f13274d1eb04a75150e`
- EXECUTE ACL:
  - postgres
  - `jetnity_commercial_writer`

## 4. Development Drift

Development project `yfvbxvijcorffwxbxahl` wurde read-only geprüft:

- Migration `20260829140000`: fehlt
- `public.trip_item_commercial_provenance`: fehlt
- `jetnity_internal.commercial_write_runtime_gate`: fehlt
- Rollen `jetnity_commercial_writer` / `jetnity_commercial_runtime`: fehlen
- Writer-Funktion: fehlt

Der bestehende Development-Branch ist **kein** Repair-Testziel und wird nicht reset/rebased/merged.

## 5. Fail-Closed Preconditions

Vor jedem späteren Production-Write müssen mindestens exakt weiter gelten:

1. Version `20260829140000` existiert genau einmal.
2. Name bleibt `trip_item_commercial_provenance`.
3. Statement count bleibt `1`.
4. Marker-MD5 bleibt `414f7318235ac388e97fd74f97536ca1`.
5. Repo-Migration bleibt Blob `e25ab1b7efb48157828968993749a25fa30cc660`.
6. Provenance row count bleibt `0`.
7. RLS bleibt enabled und Owner-SELECT-Policy unverändert.
8. Gate bleibt `production_write_path_allocated=false`.
9. Writer-function MD5 bleibt `7e7bfe10d20c2f13274d1eb04a75150e`.
10. Rollen/ACLs bleiben wie oben.

Jede Abweichung => **STOP / no mutation**.

## 6. Capture Method

Before Image wurde durch read-only SQL gegen Production rekonstruiert. Keine DDL, kein UPDATE/INSERT/DELETE, kein Branch reset/rebase/merge und keine Gate-Mutation wurden ausgeführt.
