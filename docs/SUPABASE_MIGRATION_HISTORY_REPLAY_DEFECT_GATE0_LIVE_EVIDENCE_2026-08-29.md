# Supabase Migration-History Replay Defect – Gate 0 Live Evidence

Stand: 29. August 2026  
Status: **READ-ONLY EVIDENCE DUMP / NO SECRETS / NO MUTATION**  
Cursor-Agent: `Jetnity infrastructure migration audit 1`

Erfasst über Management-API `GET /v1/projects/{ref}/branches`, `GET /v1/projects/{ref}/database/migrations` und `POST /v1/projects/{ref}/database/query` **nur mit SELECT/WITH**. Kein Branch push/reset/merge/restore. Kein Service-Role. Keine Direct-DB-URL.

Production-Ref `qscbgcdmivbbnzrcyegn` ist bereits projektdokumentiert. Development-Ref wird hier nicht vollständig wiederholt.

## 1. Branch inventory

| Name | Default | Status | Preview | Created | Parent |
| --- | --- | --- | --- | --- | --- |
| `main` | ja | `FUNCTIONS_DEPLOYED` | `ACTIVE_HEALTHY` | 2026-08-15T06:01:04Z | Production |
| `develop` | nein | `FUNCTIONS_DEPLOYED` | `ACTIVE_HEALTHY` | 2026-08-16T21:20:54Z | Production |

`SUPABASE_PROJECT_REF` dieser Umgebung zeigt auf Branch `develop` (`ACTIVE_HEALTHY`). Kein zusätzlicher Preview-Branch vorhanden.

Management-API Migration-Listen:

- Production: 55 Versionen, letzte = `20260829210052_account_traveller_registry_persistence`; enthält `20260829140000_trip_item_commercial_provenance`
- Development: 56 Versionen, letzte = `20260829204547_account_traveller_registry_persistence_after_reset`; **enthält `20260829140000` nicht**

## 2. History-Zeile `20260829140000`

### Production

| Feld | Live-Wert |
| --- | --- |
| version | `20260829140000` |
| name | `trip_item_commercial_provenance` |
| statement_count | 1 |
| statement_0_chars | 234 |
| body SHA-256 | `bef6912d9cf1a9444c1da571b1aa6c246b6280019e38a9031984117994b6e996` |
| body MD5 | `414f7318235ac388e97fd74f97536ca1` |
| created_by | `null` |
| idempotency_key | `null` |
| rollback_count | 0 |

Statement 0, vollständig:

```text
S5-B Commercial Provenance persistence applied by Technical Lead from canonical repository migration at main merge 3b684f64f28bc4a2732e34cd642837aab5ea70ec; semantics verified on isolated Supabase Postgres 17 branch before Production.
```

### Development

Keine Zeile für `20260829140000` / `commercial_provenance` / `trip_item_commercial`.

## 3. Kanonische Repo-Datei

`supabase/migrations/20260829140000_trip_item_commercial_provenance.sql`

| Feld | Wert |
| --- | --- |
| Zeichen | 45201 |
| SHA-256 | `e85ded3f0fdbdc5a97bca8af796fa4ce9b0283cb27d06f83ab26f0cd16f11404` |
| MD5 | `bd4b613da5037b3c7535d17451dd8e67` |
| `create schema if not exists jetnity_internal` | ja |
| `create table if not exists public.trip_item_commercial_provenance` | nein |
| `create table public.trip_item_commercial_provenance` | ja |
| enthält `reise_anlegen` | ja |

History-Body ≠ Repo-Datei.

## 4. Production S5-B Katalog

| Objekt | Live |
| --- | --- |
| `public.trip_item_commercial_provenance` | vorhanden, `relkind=r`, RLS an |
| Row count | 0 |
| Policy | `trip_item_commercial_provenance_lesen`, SELECT, `{authenticated}` |
| Grants authenticated | SELECT only |
| Grants anon | keine |
| Trigger `trip_item_commercial_provenance_aktualisiert_am` | BEFORE UPDATE |
| `jetnity_internal` | vorhanden |
| `jetnity_internal.commercial_write_runtime_gate` | vorhanden, RLS aus, nur `postgres`-Grants |
| Gate row | `singleton=true`, `production_write_path_allocated=false`, `allocated_invoker_role=null` |
| `jetnity_commercial_writer` | vorhanden, `rolcanlogin=false` |
| `jetnity_commercial_runtime` | vorhanden, `rolcanlogin=false`, `rolinherit=false` |
| Membership | runtime ∈ writer; `postgres` ∈ runtime und writer; nicht `anon`/`authenticated`/`service_role` |
| `jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)` | SECURITY DEFINER |
| EXECUTE writer | `jetnity_commercial_writer`, `postgres` |
| EXECUTE authenticated/anon | nein |
| `public.trip_items_flug_handelsfelder_schuetzen` | SECURITY INVOKER, BEFORE INSERT/UPDATE auf `trip_items` |
| Constraints | PK, beide FKs, Domain/Source/Amount/Affiliate-Checks vorhanden |

## 5. Development S5-B Katalog

| Objekt | Live |
| --- | --- |
| `public.trip_item_commercial_provenance` | **fehlt** (`42P01`) |
| `jetnity_internal` | **fehlt** |
| `commercial_write_runtime_gate` | **fehlt** (`42P01`) |
| `jetnity_commercial_*` Rollen | **fehlen** |
| Writer-Funktion | **fehlt** |
| Guard-Trigger `trip_items_flug_handelsfelder_schuetzen` | vorhanden (ältere Migration) |
| `reise_anlegen` | vorhanden, SECURITY INVOKER, MD5 identisch zu Production |

## 6. `reise_anlegen` in dieser Session

| Ziel | security_definer | def_chars | MD5(`pg_get_functiondef`) |
| --- | --- | ---: | --- |
| Production | false | 19253 | `314c178120b9440a63328ff289529726` |
| Development | false | 19253 | `314c178120b9440a63328ff289529726` |

Production und Development sind zueinander identisch. Byte-Identität mit dem Funktionskörper in der Repo-Migrationsdatei wird nicht behauptet.

## 7. Zusätzliche History-Drift (nicht S5-B-Objekt, aber rebase-relevant)

Development extra gegenüber Production:

- `20260826052735_admin_aal2_data_plane`
- `20260828120000_traveller_write_contract_integrity`

S2-Versionsnamen:

| Ort | Version / Name |
| --- | --- |
| Repo-Datei | `20260829201500_account_traveller_registry_persistence` |
| Production History | `20260829210052_account_traveller_registry_persistence` |
| Development History | `20260829204547_account_traveller_registry_persistence_after_reset` |

S2-Tabellen existieren auf beiden Seiten mit RLS.

## 8. Analytics / Branch-Action-Logs

| Versuch | Ergebnis |
| --- | --- |
| `logs` + `source_name` | Fehler: Feld existiert nicht |
| `logs.all` / `branch_action_logs` | Backend error |
| `logs` sources | `postgres_logs`, `edge_logs`, `pgbouncer_logs`, `realtime_logs`, `storage_logs`, `auth_logs`, `postgrest_logs`, `auth_audit_logs` |
| `postgres_logs` Filter `Statement 0` / `MIGRATIONS_FAILED` / `trip_item_commercial_provenance` | leere Menge |

Originaler Branch-Action-Fehlertext bleibt **unbestätigt**. Der gespeicherte Statement-0-Body ist unabhängig davon belegt.

## 9. Was diese Session nicht getan hat

- kein Production- oder Development-Apply
- kein Reset / Rebase / Push / Merge / Restore
- kein `schema_migrations` UPDATE/INSERT/DELETE
- kein Schema/RLS/Grant/Auth-Change
- kein neuer Preview-Branch
- keine Provider-Calls
- keine Account-/Traveller-Runtime-Datei geändert
