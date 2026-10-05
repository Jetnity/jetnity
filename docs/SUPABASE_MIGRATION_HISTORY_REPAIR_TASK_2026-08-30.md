# Supabase Migration-History Repair – 20260829140000

Stand: 30. August 2026  
Status: **PRODUCT-OWNER APPROVED / TECHNICAL-LEAD TASK / VERSIONED BEFORE CURSOR START**  
Issue: #249  
Branch: `repair/supabase-migration-history-20260829140000-2026-08-30`  
Logical Cursor-Agent: **`Jetnity infrastructure migration repair 2`**

> Live-Evidence gewinnt. Dieser Task autorisiert den Agenten **nicht** zu Production-Mutationen, Ready oder Merge.

## 1. Verifizierte Baseline

- Repository: `Jetnity/jetnity`
- exact `main`: `c29ac5de3e0ab998ff830490a9a3e85299c399e0`
- Production Supabase: `qscbgcdmivbbnzrcyegn`, `ACTIVE_HEALTHY`, Postgres 17
- Development Supabase: `yfvbxvijcorffwxbxahl`, `ACTIVE_HEALTHY`
- Production Migration-History Version `20260829140000`, Name `trip_item_commercial_provenance`
- gespeicherte `statements`: exakt **1** Statement, ein Prosa-Marker statt SQL
- Marker-MD5 über den gespeicherten Statements-Body: `414f7318235ac388e97fd74f97536ca1`
- kanonische Repo-Migration: `supabase/migrations/20260829140000_trip_item_commercial_provenance.sql`
- kanonischer Git-Blob: `e25ab1b7efb48157828968993749a25fa30cc660`
- Production `public.trip_item_commercial_provenance`: vorhanden, RLS aktiviert, 0 Rows
- Production Gate: `production_write_path_allocated=false`, kein zugewiesener Invoker
- Rollen `jetnity_commercial_writer` und `jetnity_commercial_runtime`: NOLOGIN, kein BYPASSRLS
- Writer-Funktion vorhanden in `jetnity_internal`, SECURITY DEFINER, `search_path=''`; Function-MD5 `7e7bfe10d20c2f13274d1eb04a75150e`
- `authenticated` besitzt nur SELECT auf Provenance-Tabelle; eine Owner-SELECT-RLS-Policy ist vorhanden
- Development enthält weder Migration `20260829140000` noch S5-B-Provenance-Tabelle/Gate/Rollen/Funktion
- bestehender `develop`-Branch wird in diesem Slice **nicht** reset/rebased/merged
- Gate-0 Audit / PR #218 ist integriert. Empfohlene Reparatur: History-Body ersetzen, Production-Katalog nicht erneut anwenden, danach frischen Preview-Replay beweisen.

## 2. Product-Owner-Freigabe

Der Product Owner hat am 30. August 2026 ausdrücklich freigegeben, diesen P1 zu reparieren, **wenn der Technical Lead die Reparatur für notwendig hält**.

Diese Freigabe umfasst ausschließlich:

1. Vorbereitung und unabhängige Prüfung eines fail-closed Repair-Pfads;
2. nach Technical-Lead PASS: einmalige Production-Metadatenmutation an `supabase_migrations.schema_migrations.statements` für exakt Version `20260829140000`;
3. kein erneutes S5-B-DDL;
4. anschließende Verifikation und frischen temporären Replay-Branch;
5. Löschung des temporären Replay-Branches nach Evidence.

Nicht umfasst sind PITR-Aktivierung, Provider-Live, Commercial-Write-Aktivierung, Development-Reset/Rebase, AP-7 oder andere Production-Migrationen.

## 3. Ziel

Erstelle einen engen Repair-Pfad, der die vorhandene Production-History für `20260829140000` replay-fähig macht, ohne den bereits korrekten Production-Katalog erneut anzuwenden.

Die einzige zulässige Production-Mutation nach TL-PASS ist sinngemäß:

- `UPDATE supabase_migrations.schema_migrations`
- nur Zeile `version='20260829140000'`
- nur Spalte `statements`
- optional `name` **nur wenn** Live-Preflight vom erwarteten Namen abweicht und TL dies separat freigibt; aktuell darf `name` nicht geändert werden
- Ersatzwert = vollständiger kanonischer, replay-fähiger SQL-Body der Repo-Migration in der von Supabase erwarteten Statement-Array-Repräsentation
- atomar / transaktional
- fail-closed auf exact Before-Image
- Rowcount exakt 1, sonst Rollback

## 4. Agentenauftrag

Der Agent implementiert **keinen Production-Write**. Er soll:

1. Gate-0 Evidence und aktuellen Repository-Code vollständig lesen.
2. Die Repo-Migration mit Blob `e25ab1b7efb48157828968993749a25fa30cc660` als kanonische Quelle behandeln.
3. Ermitteln, wie die Migration für `schema_migrations.statements` korrekt in replay-fähige Statements zerlegt werden muss. Kein blindes Speichern als Prosa und keine semantische Neuinterpretation.
4. Einen dedizierten, fail-closed Repair-Runner/Script + Tests erstellen, der standardmäßig **Probe/no-write** ist.
5. Der Write-Modus muss hart verlangen:
   - explizites Production-Flag;
   - exact Project Ref `qscbgcdmivbbnzrcyegn`;
   - exact Version `20260829140000`;
   - exact Name `trip_item_commercial_provenance`;
   - `statement_count=1` und Marker-MD5 `414f7318235ac388e97fd74f97536ca1` vor Write;
   - Provenance-Tabelle vorhanden, RLS an, Rowcount 0;
   - Gate `production_write_path_allocated=false`;
   - erwartete Rollen/Funktion/Policy/Fingerprints;
   - Development wird nicht angefasst.
6. Write muss in einer Transaktion ausschließlich den History-Body ersetzen und danach exakt 1 betroffene Zeile verlangen.
7. Script darf die Repo-Migration **niemals** gegen den existierenden Production-Katalog ausführen.
8. Script darf keine DDL-, Role-, Grant-, RLS-, Function-, Trigger- oder Gate-Mutation enthalten.
9. After-Probe muss beweisen:
   - Marker-MD5 ist ersetzt;
   - Name/Version unverändert;
   - erster ausführbarer Inhalt ist SQL;
   - Production-Katalogfingerprints, RLS, Grants, Rollen, Function-MD5, Gate und Rowcount unverändert.
10. Dokumentiere einen Replay-Verification-Schritt für einen **neuen temporären Supabase-Branch** nach TL-Production-Write. Agent erstellt/löscht diesen Branch nicht selbst.
11. Bestehenden `develop`-Branch ausdrücklich unangetastet lassen.
12. Keine Secrets, Access Tokens oder Connection Strings loggen.

## 5. Backup-/Rollback-Vertrag

Jetnity läuft auf Supabase Pro. Supabase dokumentiert automatische tägliche Backups für Pro-Projekte mit 7 Tagen Verfügbarkeit. PITR ist ein kostenpflichtiges Add-on und wird **nicht** in diesem Slice aktiviert.

Vor dem TL-Production-Write:

- aktuelle Backup-/Restore-Möglichkeit erneut bestätigen;
- Before-Image aus `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_BEFORE_IMAGE_2026-08-30.md` gegen live Production erneut prüfen;
- wenn Before-Image abweicht: **STOP**, kein Repair;
- transaktionaler Update muss bei jeder Abweichung rollbacken.

Rollback bei unmittelbarem History-Fehler: den gesicherten ursprünglichen `statements`-Body in einer separat geprüften transaktionalen Operation wiederherstellen. Kein DDL-Rollback, weil dieser Slice kein DDL ändert.

## 6. Hard Non-Scope

- kein Production-DDL
- kein Re-Apply von `20260829140000_trip_item_commercial_provenance.sql`
- kein `migration repair --status reverted`
- kein Delete der History-Zeile
- keine Änderung an anderen Migration-History-Versionen
- kein `develop` reset/rebase/merge/delete
- keine RLS-/Ownership-/Grant-/Role-/Function-/Trigger-Änderung
- kein Commercial Runtime Gate öffnen
- keine Provider Secrets / paid calls / Live-Provider
- kein TW-8
- kein AP-7 / Traveller / Account Runtime
- kein Auth/MFA/AAL
- kein Branch Protection Change
- keine PITR-Aktivierung
- keine neuen laufenden Kosten > USD 100/Monat
- kein Folgeslice
- keine globalen TL-Continuity-Dateien durch Cursor

## 7. Pflicht-Tests / Evidence

Mindestens:

- Parser/Statement-Repräsentation für kanonischen Repo-SQL-Body deterministisch getestet
- Probe erkennt exact Marker-Before-Image
- Probe stoppt bei falscher Version/name/hash/count
- Probe stoppt bei Katalog-/Gate-/Role-/Function-Fingerprint-Abweichung
- Write-Mode ohne explizite Production-Bestätigung unmöglich
- Write-SQL berührt nur `supabase_migrations.schema_migrations.statements`
- Rowcount != 1 => rollback/fail
- keine DDL-Statements im Production-Repair-Pfad
- After-Probe prüft unveränderten Katalog
- Tests für keine Secret-Ausgabe
- `npm test` bzw. passend fokussierte Tests
- Typecheck
- Lint
- relevante Hygiene-/DB-Script-Gates
- Production Build, soweit Repository-Standard den Script-Change berührt
- exact-head GitHub Actions SUCCESS
- exact-head Vercel Preview READY, soweit Vercel den Branch baut

## 8. STOP / Review

Agent erstellt Task-spezifische Status-, Self-Review- und Handoff-Evidence.

**Do not mark Ready. Do not merge. Do not execute Production mutation. Do not create/reset/rebase/merge Supabase branches. Do not start a follow-up slice.**

STOP nach vollständigem Self-Review + exact-head CI/Vercel für unabhängigen ChatGPT Technical-Lead Review.
