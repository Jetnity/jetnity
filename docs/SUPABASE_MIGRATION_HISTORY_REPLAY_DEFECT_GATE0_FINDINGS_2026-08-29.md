# Supabase Migration-History Replay Defect – Gate 0 Findings

Stand: 29. August 2026  
Status: **AUDIT-ONLY / LIVE-EVIDENCE / NO MUTATION**  
Cursor-Agent: `Jetnity infrastructure migration audit 1`  
Issue: #216  
Draft-PR: #218  
Collected: `2026-08-29T21:25:47Z` und `2026-08-29T21:28:00Z` (read-only SELECT + Management-API GET)

> Jede Production-/Development-Behauptung stammt aus dieser Session oder ist ausdrücklich als unbestätigt markiert. Kein Apply, Rebase, Reset, Repair oder History-Edit wurde ausgeführt.

## 1. Kurzurteil

Die Störung ist **primär ein Migration-History-/Replay-Defekt**, kein Production-Schema-Defekt der S5-B-Objekte.

Production hat die Commercial-Provenance-Objekte. In `supabase_migrations.schema_migrations` steht Version `20260829140000`, aber **Statement 0 ist kein SQL**, sondern ein 234-Zeichen-Prosa-Marker. Die kanonische Repo-Datei ist 45 201 Zeichen SQL.

Ein Supabase-Branch-Reset/Rebase spielt gespeicherte Statements sequentiell erneut ab. Statement 0 dieser Version kann deshalb nicht erfolgreich replayt werden.

Development fehlt die Version **und** die S5-B-Objekte. Das ist echte **Umgebungsschema-Drift als Folge** des History-Defekts, nicht ein zweiter unerkannter Production-Katalogfehler.

## 2. Antworten auf die Task-Fragen

### 2.1 Was war die exakte Ursache des Replay-Fehlers auf Statement 0?

**Live belegt:** Production speichert für `20260829140000` genau ein Statement. Der vollständige Text ist:

```text
S5-B Commercial Provenance persistence applied by Technical Lead from canonical repository migration at main merge 3b684f64f28bc4a2732e34cd642837aab5ea70ec; semantics verified on isolated Supabase Postgres 17 branch before Production.
```

Das ist gültiges Englisch und ungültiges SQL. `created_by` und `idempotency_key` sind `null`. `rollback` ist leer.

Nachbar-Migrationen auf Production speichern echte SQL-Bodies:

| Version | Name | Statement-0-Zeichen | Kopf |
| --- | --- | ---: | --- |
| `20260827170000` | `admin_aal2_data_plane_alignment` | 5077 | SQL-Kommentar + Function-DDL |
| `20260828015304` | `traveller_write_contract_integrity` | 4421 | `create or replace function …` |
| `20260829140000` | `trip_item_commercial_provenance` | **234** | **Prosa-Marker** |
| `20260829210052` | `account_traveller_registry_persistence` | 9383 | SQL-Kommentar + S2-DDL |

Repo-Datei `supabase/migrations/20260829140000_trip_item_commercial_provenance.sql`:

- 45 201 Zeichen
- SHA-256 `e85ded3f0fdbdc5a97bca8af796fa4ce9b0283cb27d06f83ab26f0cd16f11404`
- erstes ausführbares Token: `create schema if not exists jetnity_internal;`
- `create table public.trip_item_commercial_provenance` **ohne** `IF NOT EXISTS`

Der Marker verweist auf Merge `3b684f64` und eine vorher isolierte Postgres-17-Validation. Das passt zu `docs/PROVIDER_S5B_PRODUCTION_APPLY_VERIFICATION_2026-08-29.md`: Objekte wurden ausserhalb eines normalen Statement-Body-Apply erzeugt und die History nur als Registrierung nachgezogen.

**Nicht in dieser Session als Dashboard-Logzeile abgerufen:** der originale Branch-Action-Text `At statement 0: …`. Analytics `logs` mit Filter auf `Statement 0` / `MIGRATIONS_FAILED` / `trip_item_commercial_provenance` lieferte `[]`. `branch_action` ist in den sichtbaren Log-Sources dieser Session nicht enthalten. Die Rekonstruktion stützt sich auf den gespeicherten Body plus das offizielle Reset-Verhalten (siehe §7).

### 2.2 Ist die Störung nur History/Metadata oder echter Schema-Drift?

**Beides, aber geschichtet:**

1. **Production History vs Repo-Datei:** History-only. Der Katalog trägt die S5-B-Objekte; der gespeicherte Body ist kein SQL.
2. **Production Katalog vs S5-B-Vertrag:** kein festgestellter fehlender Kerngegenstand. Tabelle, RLS, Owner-SELECT, Writer-Funktion, NOLOGIN-Rollen, Gate `false`, 0 Rows sind vorhanden.
3. **Production vs Development Katalog:** echter Environment-Drift. Development hat weder Version `20260829140000` noch die S5-B-Objekte.
4. **Bekannte ältere History-Drift auf Development bleibt zusätzlich bestehen:** `20260826052735` und `20260828120000`.

Production-Runtime ist dadurch nicht „leer/falsch“. Zukünftige Rebases/Resets, die Production-Statements replayen, sind blockiert.

### 2.3 Welche Objekte existieren in Production und Development tatsächlich?

Siehe `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_LIVE_EVIDENCE_2026-08-29.md`.

Production `qscbgcdmivbbnzrcyegn` (live):

- `public.trip_item_commercial_provenance` existiert, RLS an, 0 Rows
- Policy `trip_item_commercial_provenance_lesen` = SELECT / `authenticated`
- `authenticated` hat nur SELECT; kein INSERT/UPDATE/DELETE
- `anon` hat keine Tabellenrechte
- `jetnity_internal` existiert; `commercial_write_runtime_gate.production_write_path_allocated = false`
- `jetnity_commercial_writer` NOLOGIN; `jetnity_commercial_runtime` NOLOGIN + NOINHERIT
- Writer-EXECUTE: `jetnity_commercial_writer` + `postgres`; nicht `authenticated`/`anon`
- Trigger `trip_item_commercial_provenance_aktualisiert_am` und Guard `trip_items_flug_handelsfelder_schuetzen` aktiv
- `public.reise_anlegen(_reise jsonb)` SECURITY INVOKER, 19 253 Zeichen

Development Branch `develop` / Status `FUNCTIONS_DEPLOYED` / Preview `ACTIVE_HEALTHY` (live):

- Version `20260829140000` **fehlt**
- Tabelle `trip_item_commercial_provenance` **fehlt** (`42P01`)
- Schema `jetnity_internal` **fehlt**
- Commercial-Rollen **fehlen**
- Writer-Funktion **fehlt**
- Guard-Trigger `trip_items_flug_handelsfelder_schuetzen` existiert (ältere Migration)
- `reise_anlegen` identisch zu Production: MD5 `314c178120b9440a63328ff289529726`, SECURITY INVOKER
- AP-7-S2-Tabellen existieren, aber unter History-Version `20260829204547_account_traveller_registry_persistence_after_reset`

### 2.4 Welche Reparaturoptionen sind technisch möglich und welche sind verantwortbar?

Siehe `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_RECOMMENDATION_2026-08-29.md`.

Kleinste verantwortbare spätere Reparatur: **nur den Production-History-Body von `20260829140000` durch gültiges SQL ersetzen**, Production-Katalog nicht erneut anwenden, danach Replay auf einem **neuen temporären Preview-Branch** beweisen. Aktueller `develop` nicht blind rebasen/resetten.

### 2.5 Braucht eine spätere Reparatur Product-Owner-Freigabe? Welche Backups sind Pflicht?

**Ja.** Jede Änderung an Production `schema_migrations` ist eine Production-Metadatenmutation. Das fällt unter die besonderen Product-Owner-Gates für Production-Migrationen / schwer rücknehmbare produktive Datenänderungen.

Pflicht vorher:

1. bestätigtes Production-Backup / PITR-Fenster
2. Before-Image der Zeile `20260829140000` (version, name, statements, created_by, rollback)
3. unabhängiger Technical-Lead Exact-Head-Review des Repair-Slices
4. keine gleichzeitige Schema-/RLS-/Grant-/Auth-Änderung

Ein temporärer Preview-Branch zur Replay-Probe kann kostenpflichtig sein. In diesem Audit wurde keiner erzeugt.

### 2.6 Ist Supabase Support/CLI/History-Repair gegenüber direkter Metadata-Manipulation vorzuziehen?

**Offizielle CLI `supabase migration repair --status applied|reverted` reicht nicht.** Sie fügt nur eine Versionszeile ein oder löscht sie. Sie ersetzt keinen gespeicherten Statement-Body. Belegt: [Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations), [CLI `migration repair`](https://supabase.com/docs/reference/cli/supabase-migration-repair).

`repair --status reverted` plus Re-Apply der Repo-Datei auf Production ist **unsicher**: `CREATE TABLE` ohne `IF NOT EXISTS` träfe existierende Objekte.

Vorzuziehen:

1. Supabase-Dashboard-/Support-Weg, der den gespeicherten Body setzen kann, **oder**
2. ein späterer, separat gegateter, transaktionaler `UPDATE` nur der `statements`-Spalte, analog zum Jetnity-History-Write in `scripts/db/anwenden.ts`, aber **ohne** das SQL erneut auszuführen.

Support ist sinnvoll, wenn nach Body-Ersatz ein neuer Preview-Replay trotzdem scheitert oder wenn kein dokumentierter Body-Replace-Pfad verfügbar ist. Direkte Raw-Manipulation ohne Before-Image/Backup ist nicht verantwortbar.

### 2.7 Welche Acceptance Criteria müssen vor einer späteren Repair-Aktion gelten?

Vollständige Liste in der Recommendation. Mindestens:

- Production-Katalog unverändert gegenüber dem hier belegten S5-B-Stand
- History-Body von `20260829140000` ist gültiges SQL und replay-fähig auf leerer DB
- neuer Preview-Branch nach dem History-Fix wird `ACTIVE_HEALTHY` und enthält die Provenance-Objekte
- kein zweites Production-Apply der Repo-Datei
- `develop` nur nach bewiesenem Replay und eigenem Plan anfassen
- dieser Gate-0-Audit startet den Repair nicht

## 3. Rekonstruktion der beobachteten Branch-Störung

Dokumentierte Vorgeschichte (nicht diese Session):

- AP-7-S2 Status: ein Development-Rebase endete `MIGRATIONS_FAILED`; Technical Lead resetete `develop`; historische Versionen blieben erhalten.
- AP-7-S2 Production Closure: während des Development-Regatings wurde eine separate History-/Replay-Störung rund um S5-B festgestellt; Production wurde dafür nicht repariert.

Live-Stand erklärt beides konsistent:

1. `develop` behält historische Extra-Versionen `20260826052735` und `20260828120000`.
2. Production `20260829140000` ist in der History, aber Statement 0 ist kein SQL.
3. Offizielles Reset spielt alle Parent-Migrationen der Reihe nach erneut ab ([Branching troubleshooting](https://supabase.com/docs/guides/deployment/branching/troubleshooting)).
4. Beim Replay von `20260829140000` scheitert Statement 0; die S5-B-Objekte entstehen auf `develop` nicht.
5. S2 wurde danach auf `develop` als `20260829204547_…_after_reset` angewendet. Der Name bestätigt den Reset-Kontext.
6. Production erhielt S2 später als `20260829210052`. Repo-Datei heisst `20260829201500`.

## 4. Was bewusst nicht Schema-Drift der Production-S5-B-Objekte ist

Nicht belegt als fehlend oder falsch auf Production:

- Provenance-Tabelle
- Owner-Read-RLS
- geschlossener Runtime-Write (`production_write_path_allocated=false`)
- fehlende Direct-Writes für `authenticated`/`anon`
- 0 Provenance-Rows

`reise_anlegen` ist auf Production und Development **zueinander** byte-identisch (MD5 `314c1781…`). Eine Byte-Identität mit dem Funktionskörper **in der Repo-Migrationsdatei** wird nicht behauptet; `pg_get_functiondef` (19 253 Zeichen) und der Dateiausschnitt (18 425 Zeichen) sind verschiedene Serialisierungen. Die ältere S5-B-Notiz bleibt gültig: keine stillschweigende Function-Source-Equivalence zur Repo-Datei.

## 5. Proaktive Zusatzfunde (nicht Repair-Scope)

1. **Zweite Versionsdrift nach dem Reset:** `develop` `20260829204547` ≠ Production `20260829210052` ≠ Repo `20260829201500`. Auch nach einem S5-B-History-Fix kann ein späteres Rebase an dieser Drift scheitern.
2. **Repo-SQL ist nicht replay-sicher gegen existierenden Katalog:** `CREATE TABLE public.trip_item_commercial_provenance` ohne `IF NOT EXISTS`. Deshalb darf die Datei auf Production nicht erneut angewendet werden.
3. **Branch-Action-Logs** waren über die erlaubten Analytics-Endpoints in dieser Session nicht als Originalfehlertext lesbar. Ein späterer Repair-Slice sollte Dashboard-Branch-Logs vor und nach dem Fix sichern.

## 6. Traveller-Context / Parallelgrenze

Nicht relevant für diesen Infra-Audit. Keine Traveller-Credentials, keine Account-Navigation, keine Shared Traveller Contracts, keine AP-7-S3-Runtime. AP-7-S2-Tabellen wurden nur als Katalog-Existenz/Versionsname gelesen.
