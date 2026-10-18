# JETNITY R76 — Trip Ownership Native RLS 1 — PLAN

**Datum:** 18. Oktober 2026 · **Autor:** Jetnity Trip Ownership Native RLS 1 — Cursor Generation 1 (lokale Mac-Cursor-Sitzung, Claude Opus 5.5 High)
**Task:** `docs/JETNITY_TRIP_OWNERSHIP_NATIVE_RLS_1_TASK_2026-10-18.md`, Blob `75eef47355e1c09fcb574d9635413fab3e41beaa` (vor Beginn unabhängig geprüft, unverändert)
**Draft PR:** [#965](https://github.com/Jetnity/jetnity/pull/965) · **Branch:** `test/trip-ownership-native-rls-1` · **Start-HEAD:** `f86d8ede4ba42813d45bf58f854dadb8b9d1d984` (Tree `1bc433504ec519c2318811304d5e542e3619adb3`)
**Live-Gates beim Start:** `origin/main` = `7337c23a2af084567fad1e7c2ae7839dc972e874` = Merge-Base, 1 ahead / 0 behind; `.jetnity/operating-mode.json` `mode=NORMAL`; PR #965 OPEN/Draft auf genau diesem HEAD; PR #955 OPEN/Draft auf `e88464ab…`, wird nicht angefasst.

## Ziel

Nativ durch PostgreSQL erzwungener Nachweis des Reise-Eigentumsvertrags von `public.trips` und `public.trip_stages`: zwei erfundene Identitäten A und B, effektive Rolle `authenticated` mit JWT-Claim, unveränderte Original-Migration, beide Richtungen, frischer Wegwerf-Cluster. Kein Mock, keine handkopierte Policy.

## Dateien (nur neu)

| Datei | Zweck |
| --- | --- |
| `lib/trips/trip-ownership-native-rls-1.test.ts` | `node:test`-Suite, vom bestehenden `npm test`-Glob `lib/**/*.test.ts` erfasst |
| `scripts/db/trip-ownership-native-rls-1/bootstrap.sql` | minimaler test-only Supabase-Unterbau (Rollen, `auth.users`, `auth.uid()`, Schemarechte, Default-Privilegien-Vorzustand) |
| `docs/JETNITY_TRIP_OWNERSHIP_NATIVE_RLS_1_{PLAN,REPORT,SELF_REVIEW,HANDOFF}_2026-10-18.md` | Dokumentation |

Keine Änderung an bestehenden Dateien, Migrationen, RLS, `package.json`, Lockfile, Workflows, `.jetnity/**`, `local-cluster.ts` (nur importiert), `rls.mjs`, #955.

## Ablauf

1. `startLocalProofCluster()` (eigenes `mkdtemp`, Socket 0700, `listen_addresses=''`, `--auth-host=reject`, PG*-freie Umgebung); `assertLocalProofEnvironment()` vor jeder Verbindung.
2. Eigene Datenbank `r76_reise`: `bootstrap.sql` als Cluster-Superuser, danach die Original-Migration **dateibytegenau** per `psql --file` unter `set role postgres` in einer Transaktion. Vorher Git-Blob-Hash `37bb78dd…` der Datei geprüft.
3. Synthetischer Seed als Superuser: `auth.users` A, B; je eine Reise mit Etappe und je eine Reise ohne Kind.
4. Jede Probe ist ein eigener `psql`-Prozess als Login-Rolle `authenticator` (kein Superuser, kein BYPASSRLS), `begin` → `set local role authenticated|anon` → `set local "request.jwt.claims"` → Kontextzeile → Probe in `DO`-Block mit `GET DIAGNOSTICS ROW_COUNT` bzw. SQLSTATE → Kontextzeile → `rollback`. Davor und danach liest ein unabhängiger Superuser-Prozess den vollständigen Fingerabdruck von `trips`/`trip_stages`.
5. Dieselbe Matrix läuft in neun Wegwerf-Mutanten-Datenbanken (RLS aus, offene Policy, `WITH CHECK (true)`, Eigentümerwechsel, kaputtes `auth.uid()`, fehlender Grant, Etappen-RLS aus, offene anon-Policy, FK-Ersatz) und **muss** dort Verstöße melden.
6. Abschluss: frischer Leser vergleicht den Fingerabdruck mit dem Seed, keine Mutanten-DB übrig, eigener Postmaster gestoppt, nur eigenes Verzeichnis entfernt.

## Risiken / Grenzen (vorab)

- Auf diesem Mac fehlen PostgreSQL-Server-Binaries → lokal ehrlich `NOT VERIFIED / SKIP`; der echte Nachweis entsteht ausschließlich im GitHub-Linux-Runner (dort fehlende Binaries = FAIL).
- Bewiesen wird nur die Original-Migration `20260817120000_reiseschema.sql`. Ein Source-Paritätstest prüft maschinell, dass keine spätere Migration Policies, Grants, RLS-Schalter oder Eigentümer von `trips`/`trip_stages` ändert. Spätere Spalten/Trigger und die `SECURITY DEFINER`-RPCs (`reise_anlegen`, `reise_aendern`, …) sind **nicht** Teil dieses Nachweises.
- Kein Hosted-Development-, kein Production-, kein Browser-, kein A/B-Konto-Zugriff.

## Kosten / Security

Keine neuen Abhängigkeiten, Dienste oder Kosten. Keine Secrets, keine Verbindungs-URL, kein TCP.
