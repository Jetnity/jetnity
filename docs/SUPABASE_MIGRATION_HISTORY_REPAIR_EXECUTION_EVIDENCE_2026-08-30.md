# Jetnity – Supabase Migration-History Repair Execution Evidence

Stand: 30. August 2026  
Status: **PRODUCTION REPAIR EXECUTED / AFTER-IMAGE PASS / FRESH REPLAY PASS / TEMP BRANCH DELETED**  
Issue: #249  
PR: #250  
Production project: `qscbgcdmivbbnzrcyegn`

> Diese Datei ist die zentrale Recovery-/Audit-Evidence für die einmalige Reparatur der Supabase-Migration-History `20260829140000`. Live-Evidence gewinnt weiterhin vor Dokumentation.

## 1. Scope der tatsächlich ausgeführten Production-Mutation

Die einzige Production-Mutation war:

- Relation: `supabase_migrations.schema_migrations`
- Version: exakt `20260829140000`
- Name blieb: `trip_item_commercial_provenance`
- geänderte Spalte: ausschließlich `statements`
- vorher: genau ein Prosa-Marker
- nachher: vollständiger kanonischer SQL-Body der Repository-Migration als genau ein Production-History-Element
- kein S5-B-DDL wurde gegen den existierenden Production-Katalog ausgeführt
- keine Tabelle, Policy, RLS-Regel, Rolle, Membership, Funktion, Trigger oder Runtime-Gate wurde durch den Repair geändert

Kanonische Quelle:

- Datei: `supabase/migrations/20260829140000_trip_item_commercial_provenance.sql`
- Git blob: `e25ab1b7efb48157828968993749a25fa30cc660`
- SQL MD5: `bd4b613da5037b3c7535d17451dd8e67`
- SQL SHA-256: `e85ded3f0fdbdc5a97bca8af796fa4ce9b0283cb27d06f83ab26f0cd16f11404`

## 2. Backup / Restore / Rollback Contract

Vor dem Write wurde erneut bestätigt:

- Supabase Organization `Jetnity` / `nvyzgizlpxfhtslmiwyx` läuft auf Plan **Pro**.
- Supabase dokumentiert für Pro tägliche Datenbank-Backups mit 7 Tagen Retention und Restore im Dashboard.
- PITR wurde **nicht** aktiviert.
- Zusätzlich existiert für diesen engen Metadaten-Repair ein vollständiges logisches Before-Image in `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_BEFORE_IMAGE_2026-08-30.md`.

Ursprünglicher History-Body, für einen gezielten Rollback erhalten:

```text
S5-B Commercial Provenance persistence applied by Technical Lead from canonical repository migration at main merge 3b684f64f28bc4a2732e34cd642837aab5ea70ec; semantics verified on isolated Supabase Postgres 17 branch before Production.
```

Marker-MD5: `414f7318235ac388e97fd74f97536ca1`.

Ein unmittelbarer History-Rollback wäre deshalb technisch möglich, indem nach einem neuen exact Preflight ausschließlich `statements` derselben Version transaktional wieder auf den obigen Ein-Element-Body gesetzt wird. **Dieser Rollback wurde nicht ausgeführt, weil After-Image und Replay bestanden haben.**

## 3. Unmittelbarer Production Before-Preflight

Direkt vor dem Write wurde read-only erneut verifiziert:

- Migration Version `20260829140000`, Name `trip_item_commercial_provenance`
- `statement_count=1`
- Marker-MD5 `414f7318235ac388e97fd74f97536ca1`
- Marker-Text exakt wie dokumentiert
- `public.trip_item_commercial_provenance` OID `282263`
- RLS `true`, FORCE RLS `false`
- Table ACL exakt `authenticated=r/postgres`, `postgres=arwdDxtm/postgres`
- Rowcount `0`
- genau eine Owner-SELECT-Policy `trip_item_commercial_provenance_lesen`
- Commercial Runtime Gate: `production_write_path_allocated=false`, `allocated_invoker_role=null`
- Writer/Runtime-Rollen ohne LOGIN, SUPERUSER, CREATEDB, CREATEROLE, REPLICATION oder BYPASSRLS; `rolconnlimit=-1`
- exakt drei Membership-Records inklusive Grantor / admin / inherit / set options
- Writer-Funktion SECURITY DEFINER, `search_path=""`, Function-MD5 `7e7bfe10d20c2f13274d1eb04a75150e`
- Function ACL exakt `jetnity_commercial_writer=X/postgres`, `postgres=X/postgres`

Jede Abweichung hätte den Write gestoppt.

## 4. Production Write – Fail-Closed Eigenschaften

Der Write lief in einer einzelnen Transaktion und verlangte vor dem UPDATE:

- kanonischer Ziel-Body muss MD5 `bd4b613da5037b3c7535d17451dd8e67` haben
- History-Version muss exakt einmal existieren
- Name, Count, Marker-MD5 und Marker-Text müssen dem Before-Image entsprechen
- kompletter Katalog-Fingerprint muss dem erwarteten Before-Image entsprechen

Das UPDATE traf nur:

```text
supabase_migrations.schema_migrations.statements
```

für exakt Version `20260829140000` / Name `trip_item_commercial_provenance` / alten Marker-MD5.

`ROW_COUNT` musste exakt `1` sein. Danach wurden History-Body und Katalog innerhalb derselben Transaktion erneut geprüft. Jede Abweichung hätte eine Exception und damit Rollback ausgelöst.

## 5. Production After-Image

Nach Commit wurde unabhängig read-only erneut bestätigt:

- Version unverändert `20260829140000`
- Name unverändert `trip_item_commercial_provenance`
- `statement_count=1`
- neuer Body-MD5 `bd4b613da5037b3c7535d17451dd8e67`
- erster ausführbarer Inhalt: `create schema if not exists jetnity_internal;`
- Provenance-Tabelle weiterhin OID `282263`
- RLS weiterhin an, FORCE RLS aus
- Table ACL unverändert
- Rowcount weiterhin `0`
- Policy-Count weiterhin `1`
- Runtime Gate weiterhin geschlossen
- Rollen und Memberships unverändert
- Writer-Funktion weiterhin Function-MD5 `7e7bfe10d20c2f13274d1eb04a75150e`, SECURITY DEFINER, `search_path=""`
- Function ACL unverändert

Damit wurde auf Production nur die beabsichtigte History-Metadatenzelle geändert.

## 6. Freigegebener temporärer Replay-Branch

Vor Branch-Erstellung wurde der aktuelle Branch-Preis erneut abgefragt:

- Supabase Branch: **USD 0.01344 / Stunde**
- Product Owner hat diesen konkreten Preis ausdrücklich freigegeben.

Erstellter temporärer Branch:

| Feld | Wert |
| --- | --- |
| Name | `p1-replay-20260829140000-2026-08-30` |
| Branch ID | `d8aec9d4-fdd9-4d28-a68f-c5400e59ea8e` |
| Project Ref | `efobhwzkjarnkthgpmur` |
| Parent | `qscbgcdmivbbnzrcyegn` |
| Data copy | `false` |
| Final observed status | `FUNCTIONS_DEPLOYED` / `ACTIVE_HEALTHY` |

Kein `MIGRATIONS_FAILED` wurde beobachtet.

## 7. Fresh Replay Evidence

Auf dem frischen Branch wurde read-only verifiziert:

- History-Version `20260829140000` genau einmal vorhanden
- Prosa-Marker **nicht** vorhanden
- Supabase hat den kanonischen Migration-Body beim Replay in **42 ausführbare History-Statements** normalisiert
- erstes History-Element enthält den kanonischen Kommentarblock und `create schema if not exists jetnity_internal;`
- `create schema ...` liegt in Statement 1
- `create table public.trip_item_commercial_provenance` liegt in Statement 18
- Writer-Funktion liegt in Statement 30
- `public.reise_anlegen` liegt in Statement 39
- `public.trip_item_commercial_provenance` existiert
- RLS ist aktiv
- Owner-Policy vorhanden (`policy_count=1`)
- Provenance-Rowcount `0`
- Commercial Runtime Gate geschlossen (`allocated=false`, Invoker `null`)
- Rollen `jetnity_commercial_runtime` und `jetnity_commercial_writer` vorhanden und nicht login-fähig
- spätere Migration `20260829210052` ebenfalls vorhanden
- letzte History-Version auf dem Branch: `20260829210052`

### Warum Branch-History 42 Statements statt Production 1 Element zeigt

Production speichert nach dem engen Repair den vollständigen kanonischen Repo-Body als ein `statements`-Element, passend zum Jetnity-Repository-Vertrag. Beim Erzeugen eines frischen Supabase-Branches normalisiert Supabase den replayten Body anschließend in mehrere ausführbare History-Statements. Das ist kein Rückfall zum Prosa-Marker: der Marker ist abwesend und die erwarteten SQL-Objekte wurden erfolgreich aufgebaut.

## 8. Function-MD5 Differenz auf frischem Replay – geklärt

Raw `pg_get_functiondef()` MD5:

- Production: `7e7bfe10d20c2f13274d1eb04a75150e`
- frischer Replay-Branch: `c59b9935cba45e9dcfcc9f4d920aec83`

Die Definitionen wurden unabhängig gelesen. Production enthält den historisch manuell angewendeten, stark minifizierten PL/pgSQL-Quelltext; der frische Replay-Branch enthält denselben kanonischen Repo-Code mit Formatierung und Kommentarzeilen.

Nach Entfernen von `--`-Kommentaren und Whitespace ergab `prosrc` auf **beiden** Datenbanken exakt:

```text
767161b569ebcb5001ec4b753b5b4928
```

Die Raw-MD5-Differenz ist damit Formatierungs-/Kommentar-Evidence, keine erkannte Logikabweichung.

## 9. Kostenende / Branch Cleanup

Der temporäre Branch `d8aec9d4-fdd9-4d28-a68f-c5400e59ea8e` wurde nach erfolgreicher Evidence gelöscht.

Supabase bestätigte:

```text
success=true
```

Damit bleibt dieser Replay-Branch nicht als laufender Kostenposten bestehen.

Der bestehende Development-Branch `yfvbxvijcorffwxbxahl` wurde **nicht** reset, rebase, merge oder gelöscht.

## 10. Ergebnis / verbleibende Grenzen

**P1 Migration-History Repair `20260829140000`: technisch erfolgreich ausgeführt und durch frischen Replay bewiesen.**

Nicht Teil dieses Repairs und weiterhin getrennt zu behandeln:

- Development-Drift / Reconciliation
- AP-7-S2 oder andere neue Migrationen
- Provider Live / Commercial Write Activation / TW-8
- Branch Protection
- PITR
- Jetnity Legacy-/Project-Cleanup

Die geplante große Jetnity-Bereinigung darf erst nach Abschluss/Integration dieses P1-Slices beginnen und muss ihrerseits mit Inventar, Before-Image, Recovery-Pfad, dokumentierter Löschliste und After-Checks arbeiten.
