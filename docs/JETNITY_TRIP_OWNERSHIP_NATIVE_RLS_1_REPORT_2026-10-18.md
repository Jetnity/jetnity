# JETNITY R76 — Trip Ownership Native RLS 1 — REPORT

**Datum:** 18. Oktober 2026 (Europe/Zurich)
**Autor:** Jetnity Trip Ownership Native RLS 1 — Cursor Generation 1 · lokale Mac-Cursor-Sitzung · Claude Opus 5.5 High · Agent-Kennung `9b0b43fc-b741-49a8-863a-76d66d212a46` · weder Autor noch Reviewer von #955
**Task:** `docs/JETNITY_TRIP_OWNERSHIP_NATIVE_RLS_1_TASK_2026-10-18.md`, Blob `75eef47355e1c09fcb574d9635413fab3e41beaa`, unverändert
**Draft PR:** [#965](https://github.com/Jetnity/jetnity/pull/965) · Issue [#964](https://github.com/Jetnity/jetnity/issues/964) · Branch `test/trip-ownership-native-rls-1`
**Status:** Implementierung abgeschlossen, Draft, STOP für unabhängigen Technical Lead R77. Kein Ready, kein Merge, kein Folge-Slice.

## 1. Ergebnis in einem Satz

**R76 LOCAL NATIVE RLS PASS** für die nachweislich angewandte, unveränderte Source-Migration `20260817120000_reiseschema.sql` auf frisch isoliertem PostgreSQL **16.15** im GitHub-Linux-Runner: Mit effektiver Rolle `authenticated` und zwei erfundenen Eigentümern kann keiner die Reisen oder Etappen des anderen lesen, ändern, löschen, unterschieben oder übernehmen – in beiden Richtungen –, eigene Writes wirken, alles rollt zurück, und neun absichtlich geöffnete Mutanten werden von derselben Matrix erkannt.

Das ist ausdrücklich **kein** `Development A/B WRITE DENIAL PASSED`, **kein** `Production RLS VERIFIED`, **keine** Aussage über #955 T09 oder den Owner-Browser (Abschnitt 8).

## 2. Git-Stand

| Punkt | Wert |
| --- | --- |
| Start-HEAD (Task-only) | `f86d8ede4ba42813d45bf58f854dadb8b9d1d984`, Tree `1bc433504ec519c2318811304d5e542e3619adb3` |
| Code-HEAD (alle Nachweise unten) | `0c9e9b1775a50e79f0d52fba15b72fbfc56f5849`, Tree `b206a807842e14cd351dd3370130656f331d7365` |
| `main` / Merge-Base | `7337c23a2af084567fad1e7c2ae7839dc972e874` (Merge #963), live bei Start und Push |
| Ahead / Behind gegenüber `main` | Code-HEAD 2 / 0; nach dem Doku-Commit 3 / 0 |
| Betriebsmodus | `NORMAL` (`.jetnity/operating-mode.json`), `check:operating-mode` PASS lokal und in CI |
| #955 | OPEN/Draft `e88464ab223dfcee039b8444e1e8f20dd71a637d`, nicht berührt |

Der finale Doku-Commit (REPORT, SELF_REVIEW, HANDOFF) erzeugt einen neuen HEAD. Dessen Exact-Head-Gates werden nach Abschluss im PR-Kommentar mit SHA, Run und Preview veröffentlicht. Die Gates in diesem Bericht gehören zum Code-HEAD `0c9e9b17`.

## 3. Geänderte Dateien (ausschliesslich neu)

| Datei | Art |
| --- | --- |
| `lib/trips/trip-ownership-native-rls-1.test.ts` | neue `node:test`-Suite, vom bestehenden Glob `lib/**/*.test.ts` erfasst |
| `scripts/db/trip-ownership-native-rls-1/bootstrap.sql` | neuer test-only Unterbau |
| `docs/JETNITY_TRIP_OWNERSHIP_NATIVE_RLS_1_{PLAN,REPORT,SELF_REVIEW,HANDOFF}_2026-10-18.md` | Dokumentation |

Keine bestehende Datei geändert: keine Migration, keine Policy, kein `supabase/**`, kein `package.json`/Lockfile, kein Workflow, kein `.jetnity/**`, kein `local-cluster.ts` (nur importiert, Blob `dc5a2583cd540b83062e8662cdb4b6af4befb376` unverändert), kein `rls.mjs`, keine Produktdatei. `docs/ACTIVE_WORK_STATUS.md` liegt ausserhalb des erlaubten Datei-Scopes und wurde deshalb nicht angefasst; der Fortschritt ist in diesem REPORT und im HANDOFF persistiert.

## 4. Original-Migration

| Prüfung | Wert |
| --- | --- |
| Datei | `supabase/migrations/20260817120000_reiseschema.sql` |
| Git-Blob (im Test vor jeder Anwendung neu berechnet) | `37bb78ddb919b16bd4cd8e00b0a1445a9718c4ba` |
| SHA-256 | `67be0609ee7967801e0b7e19abac28802eeca1ebb5f602b122aff35f9648c50f` |
| Anwendung | exakt die gehashten Bytes über stdin: `psql --single-transaction --command='set role postgres' --file=-` |
| Policy-Satz im Katalog nach Anwendung | 8 Policies (`trips_*`, `trip_stages_*` × lesen/anlegen/aendern/loeschen), alle `PERMISSIVE`, nur `{authenticated}`, Ausdruck `(user_id = ( SELECT auth.uid() AS uid))` |

**Source-Parität:** Ein statischer Scanner prüft alle 73 Migrationen. Er meldet jede spätere Anweisung, die Policies auf `trips`/`trip_stages` anlegt, ändert oder löscht, Tabellenrechte darauf vergibt oder entzieht (einschliesslich `all tables in schema public`), RLS umschaltet, den Eigentümer wechselt, die Tabelle umbenennt oder löscht, oder die `authenticated`/`anon`/`authenticator` eine Rolle, `BYPASSRLS` oder `SUPERUSER` geben würde. Ergebnis: **0 Treffer**. Gegenprobe im Test: Auf die Original-Migration selbst angewandt, erkennt der Scanner genau 12 Vertragsanweisungen (8 Policies, 2 Grants, 2 RLS-Schalter). Damit ist die Original-Migration für den Policy-/Grant-Vertrag dieser beiden Tabellen auch heute massgeblich.

## 5. Bootstrap und begründete Abweichungen von Supabase

`scripts/db/trip-ownership-native-rls-1/bootstrap.sql` läuft als Cluster-Superuser vor der Migration:

| Element | Hier | Supabase | Begründung |
| --- | --- | --- | --- |
| `authenticator` | LOGIN, NOINHERIT, kein Superuser, kein BYPASSRLS, Mitglied nur von `anon`, `authenticated` | Login-Rolle von PostgREST, zusätzlich Mitglied von `service_role` | Der Nachweis darf keinen Weg zu einer BYPASSRLS-Rolle haben |
| `anon`, `authenticated` | NOLOGIN, NOINHERIT, NOBYPASSRLS | gleich | – |
| `service_role` | NOLOGIN, **NOBYPASSRLS**, niemandem gewährt | BYPASSRLS | Existiert nur, weil die Migration ihr EXECUTE gibt; wird nie benutzt |
| `postgres` | NOLOGIN, kein Superuser, kein BYPASSRLS, Eigentümerin der Migration | führt Migrationen aus | Eigentümer umgehen RLS ohne FORCE; die Testrolle ist nie Eigentümerin (T01 prüft das) |
| `auth.users` | nur `id uuid primary key` | viele Spalten | Nur Ziel des Fremdschlüssels `trips.user_id` |
| `auth.uid()` | `coalesce(request.jwt.claim.sub, request.jwt.claims->>'sub')::uuid` | gleiche bekannte Definition | Nicht gegen die gehostete Funktion verglichen |
| Default-Privilegien | Baseline-Grant an anon/authenticated/service_role, danach Entzug für anon/authenticated wie `20260817100300_rechte.sql` | gleiche Reihenfolge | `trips`/`trip_stages` bekommen so genau die Rechte, die die Migration selbst vergibt |
| Schemarechte | `usage` auf `public`/`auth` für die Rollen, `create` auf `public` für `postgres`, `references` auf `auth.users` für `postgres` | vorhanden | Minimal nötig, damit die Migration als `postgres` läuft |

Wirksamkeit belegt T01 im Katalog: `authenticated` hat genau SELECT/INSERT/UPDATE/DELETE, aber kein TRUNCATE/REFERENCES/TRIGGER auf beiden Tabellen; `anon` hat nichts; RLS an, FORCE aus, Eigentümerin `postgres`.

## 6. Isolierung und Vertrauensgrenzen

- `startLocalProofCluster()`: eigenes `mkdtemp` unter `tmpdir()` mit Präfix `ot-pilot-1-`, Wurzel nur für den Eigentümer, Socket-Verzeichnis `0700`, `listen_addresses = ''`, `pg_hba` `host … reject`, `inet_server_addr() is null`, keine SSL-Sitzung. Alles im Test „Einschluss“ nachgeprüft.
- `assertLocalProofEnvironment()` und `assertOwnedLocalProofCluster()` laufen vor **jeder** `psql`-Verbindung. Ein eigener Test zeigt, dass `DATABASE_URL`, `PGHOST`, `PGPASSWORD`, `POSTGRES_URL`, `SUPABASE_DB_URL`, `SUPABASE_DB_PASSWORD`, `JETNITY_DEV_DB` sowie die Argumente `postgres://`, `postgresql://`, `--host`, `--port` und `*.supabase.co` abgelehnt werden.
- `psql` bekommt eine leere Umgebung (`PATH=/usr/bin:/bin`, `HOME`=Cluster-Wurzel, `PGPASSFILE`/`PGSERVICEFILE`/`PSQLRC=/dev/null`). Es gibt keine Verbindungs-URL, kein TCP, kein `.env`, kein Secret und keinen Hosted-Fallback.
- Identitäten: zwei erfundene Konten (`a0000000-…-00000000000a`, `b0000000-…-00000000000b`), dazu eine dritte UID ohne Konto (`c0000000-…`). Testausgaben ersetzen UUIDs durch Labels. Es gibt keine realen Konten, keine realen Reisen und kein PII.
- Am Ende stoppt der Test nur den eigenen Postmaster und entfernt nur das eigene Verzeichnis; Mutanten-Datenbanken werden je Fall verworfen.

## 7. Testmatrix — beobachtet im GitHub-Linux-Runner auf `0c9e9b17`

Jede Probe ist ein eigener `psql`-Prozess als `authenticator`: `begin` → `set local role authenticated|anon` → `set local request.jwt.claims` → Kontextzeile → Probe im `DO`-Block (`GET DIAGNOSTICS ROW_COUNT` ohne RETURNING bzw. RETURNING-Rückgabe; Fehler mit SQLSTATE und Meldung) → Kontextzeile → `rollback`. Vor und nach **jeder** Probe liest ein getrennter Superuser-Prozess den vollständigen Fingerabdruck beider Tabellen. **70 Proben**, jede mit Kontext vorher und nachher (`current_user`, `session_user=authenticator`, `auth.uid()`, `row_security=on`, Rolle und Sitzung weder Superuser noch BYPASSRLS).

| Fall | Proben | Beobachtet (beide Richtungen A→B und B→A, sofern gerichtet) |
| --- | --- | --- |
| T01 Bootstrap | 5 Katalogprüfungen, 140 Kontextprüfungen, dritte UID | Rollen, Mitgliedschaften, RLS/Eigentümer, Rechte und Policies exakt wie erwartet; `auth.uid()` = A, B, C oder `null` je Claim; C sieht 0 Reisen |
| T02 Lesen | 3 je Richtung + Vorbedingung | eigene Reisen ohne Filter = genau die 2 eigenen IDs, eigene Etappen = genau die eigene; fremde Reisen direkt per ID = 0 Zeilen; alle 4 Reisen und 2 Etappen vor jeder Probe vorhanden |
| T03 Fremd ändern | 3 je Richtung | fremde Reise mit/ohne Etappe: `ok`, 0 Zeilen, kein Fehler; `update` ohne Filter trifft genau 2 (nur eigene) |
| T04 Fremd löschen | 3 je Richtung | fremde Reise mit/ohne Etappe: `ok`, 0 Zeilen; `delete` ohne Filter trifft genau 2 (nur eigene); Fingerabdruck danach unverändert |
| T05 Untergeschoben | 3 je Richtung | `insert` mit fremder `user_id` → **42501** „new row violates row-level security policy for table "trips"“; Upsert auf fremde Reise → **42501** „… (USING expression) …“; dokumentiert: `insert` mit bekannter fremder Reise-ID → **23505** `trips_pkey` |
| T06 Positive Kontrolle | 6 je Richtung | eigene Reise ändern 1; mit `RETURNING` 1 Zeile `{id: eigene, user_id: eigenes Konto}`; eigene Reise anlegen (Default `user_id = auth.uid()`) 1 mit eigenem Eigentümer; eigene Reise mit Etappe löschen 1; eigene Etappe ändern 1; eigene Etappe anlegen 1 |
| T07 Übernahme | 3 je Richtung | eigene Reise ohne Etappe auf fremd → **42501**; mit Etappe → **42501** (Policy greift vor dem Fremdschlüssel); reine UPDATE-Policy (eigene Etappe entfernt, `update` ohne Filter) → **42501** |
| T08 Etappen | 7 je Richtung | fremde Etappe lesen 0, ändern 0, löschen 0; Etappe mit fremdem Eigentümer anlegen → **42501**; Etappe mit eigenem Eigentümer an fremde Reise → **23503** `trip_stages_reise_fk`; eigene Etappe an fremde Reise umhängen → **23503**; eigene Etappe fremdem Eigentümer geben → **42501** |
| T09 anon / ohne Claims | 13 | `anon` lesen/anlegen/ändern/löschen, auch mit A-Claim → **42501** „permission denied“; `authenticated` ohne Claims oder ohne `sub`: lesen 0, ändern 0, löschen 0, anlegen → **42501** (RLS greift vor NOT NULL), für fremd anlegen → **42501** |
| T10 Rollback | 140 Zustandsprüfungen + Gesamt + frischer Leser | Fingerabdruck vor und nach jeder Probe gleich dem Seed; frischer Prozess sieht exakt die Seed-Belegung; keine Mutanten-DB übrig; keine offene Sitzung; Postmaster `ESRCH`, Verzeichnis entfernt |
| T11 Gegenproben | 9 Mutanten | siehe unten; jede erkannt |
| T12 Gates | – | Abschnitt 9 |

**T11 — was jede Mutante in derselben Matrix auslöste** (Zahl = Verstösse insgesamt):

| Mutante | Verstösse | Wesentliche erkannte Fälle |
| --- | --- | --- |
| `trips_rls_aus` | 58 | T01 Tabellen, T02 (sieht 4 Reisen), T03/T04 (1 bzw. 4 Zeilen), T05 (fremder Eigentümer eingefügt), T07, T09 |
| `trips_lesen_offen` (zusätzliche `using (true)`) | 32 | T01 Policies, T02 beide Richtungen, T09 ohne Claims |
| `trips_aendern_ohne_with_check` | 3 | T01 Policies und **nur** `T07.uebertragen-nur-update-policy` (beide Richtungen: 2 Reisen übernommen) |
| `trips_eigentuemer_ist_testrolle` | 59 | T01 Tabellen und Rechte, T02–T05, T07, T09 (Eigentümer umgeht RLS) |
| `auth_uid_ignoriert_claim` | 150 | 116 Kontextprüfungen (`uid` null statt A/B), T02/T06 positive Kontrollen fallen aus |
| `trips_update_grant_fehlt` | 20 | T01 Rechte, T03 (42501 statt 0 Zeilen), T06 positive Kontrollen |
| `etappen_rls_aus` | 22 | T01 Tabellen, T02 Etappen, T08 alle fremden Fälle, T09 |
| `etappen_anlegen_ohne_with_check` | 3 | T01 Policies und `T08.etappe-mit-fremdem-eigentuemer-anlegen` (Fremdschlüssel lässt es zu) |
| `anon_lesen_offen` | 12 | T01 Rechte und Policies, T09 anon lesen |

## 8. Befunde

1. **Doppelte Schranke gegen Übernahme bei gefiltertem UPDATE.** Mit entferntem `WITH CHECK` bleibt `update … set user_id = fremd where id = …` trotzdem bei 42501. PostgreSQL wendet die SELECT-Policy auch auf die neue Zeile an, sobald die Anweisung Spalten liest (WHERE/RETURNING). Allein die UPDATE-Policy isoliert erst ein UPDATE ohne Filter. Die Matrix enthält deshalb beide Formen. Ohne die ungefilterte Probe wäre eine fehlende `WITH CHECK`-Klausel unentdeckt geblieben.
2. **Der Fremdschlüssel ersetzt RLS nicht.** Ohne `WITH CHECK` auf `trip_stages_anlegen` lässt der zusammengesetzte Fremdschlüssel eine Etappe mit fremdem Eigentümer an der fremden Reise zu, weil `(trip_id, user_id)` dort existiert. Er verhindert nur das Anhängen unter eigenem Eigentümer an eine fremde Reise (23503).
3. **Existenz-Seitenkanal über eindeutige Schlüssel (dokumentiert, niedriges Risiko).** Wer eine fremde Reise-UUID kennt, erhält beim Anlegen mit dieser ID 23505 und beim Upsert die USING-Meldung statt eines Inserts. RLS verbirgt also die Existenz einer bekannten ID nicht, gibt aber keinen Inhalt preis. Reise-IDs sind zufällige UUIDv4. **Empfehlung:** keine Änderung nötig; Server-Fehlertexte bei Anlege-/Upsert-Pfaden nicht wörtlich an den Client geben. Das sollte bei einem späteren API-Review mitgeprüft werden.
4. RLS `WITH CHECK` greift vor `NOT NULL`: Ohne Claims liefert das Anlegen 42501, mit ausgeschalteter RLS dagegen 23502. Das passt zum erwarteten Verhalten.

## 9. Gates (T12) — auf Code-HEAD `0c9e9b17`

| Gate | Ergebnis |
| --- | --- |
| GitHub Actions CI Run [39123614445](https://github.com/Jetnity/jetnity/actions/runs/39123614445) | **SUCCESS** |
| Job „Typecheck, Lint & Build“ `117664084430` | **SUCCESS**: Setup, Operating mode, Typecheck, Lint, Tests, API-Schutz, Schema-Bezug, Dead, Exports, Deps, Production build |
| `npm test` in CI | 7076 Tests, **7075 pass, 0 fail**, 1 skip (vorbestehender UI-Audit `shared responsive layout … SKIP NOT VERIFIED: SHARED_LAYOUT_AUDIT_BASE`, nicht R76) |
| R76 nativ in CI | Suite **20/20 ok**, ca. 16,3 s, PostgreSQL/psql **16.15 (Ubuntu 16.15-1.pgdg24.04+2)**; dazu 3 statische Tests ok und der CI-Pflichttest „ohne Binaries FAIL“ ok |
| Job „Auth-Konfiguration gegen config.toml“ `117664084646` | **SUCCESS** |
| Vercel Preview | **success**, Deployment `7153958047` (Preview), `https://vercel.com/jetnity-e1b93c82/jetnity-app/Dty3bf3Hkpxdyg2UjeAkfLMQJhqS` |
| Lokal (Mac, ohne PG-Server-Binaries) | statische R76-Tests 3/3 ok; **native Suite `SKIP – NOT VERIFIED` auf diesem Rechner** (kein Mock, keine Installation) |
| Lokal `npm test` gesamt | 6970 Tests, 6956 pass, 10 fail, 4 skip. Alle 10 Fehler sind vorbestehende native Tests ausserhalb R76, die `/usr/lib/postgresql/16/bin/initdb` fest erwarten (`ENOENT` auf macOS). |
| Lokal `typecheck`, `lint`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`, `git diff --check` | alle grün |
| Lokal `npm run build` | **nicht gelaufen**: Die Sandbox verbietet das IPC-Pipe von `tsx` (`listen EPERM`). Bewusst nicht ausserhalb der Sandbox wiederholt, weil ein lokaler Next-Build lokale `.env`-Dateien lädt. Massgeblich ist der CI-Production-Build (SUCCESS). |

## 10. Was NICHT nachgewiesen ist

- Hosted Development: gehostete Rollen, die echte `auth.uid()`, JWT-Signaturprüfung, PostgREST/HTTP und die echten Konten A/B. **Kein** Development-A/B-Write-Denial-Nachweis; dafür bräuchte es ein gesondertes, neues Product-Owner-Gate mit unabhängigem Security-Review.
- Production in jeder Form.
- `SECURITY DEFINER`-RPCs, die `trips`/`trip_stages` schreiben (`reise_anlegen`, `reise_aendern`, Erzeugungsregeln, Wiederholung, Traveller-Write-Contract, Provenienz-Schreiber, Kaskadentiefe, `trip_regulatory_context_save_v1` u. a.). Sie umgehen RLS planmässig und sichern Eigentum im Funktionskörper. Spätere Spalten und Trigger auf `trips` sind ebenfalls nicht Teil dieses Nachweises.
- `trip_days`, `trip_items` und spätere Kindtabellen (`trip_travellers`, `trip_readiness_items`, Traveller-Kontext, Provenienz).
- #955 T09 (Guest + Account Browser Runtime), Guardian Browser P1 (#748), der aktuelle Drift von #955 gegenüber `main`, Noindex/Public Launch, #917/DEV-PREP-1, #911/#913, #626 und alle besonderen Product-Owner-, Secret- und Provider-Gates. Sie bleiben unverändert offen.

## 11. Sicherheit, Kosten, Datenbank

- **Security:** Es gibt keinen neuen Laufzeitpfad. Der Test öffnet nur ein eigenes, privates Unix-Socket-Cluster und liest keine Secrets. Die Mutanten existieren nur in Wegwerf-Datenbanken desselben eigenen Clusters und werden verworfen.
- **Kosten:** keine; keine neue Abhängigkeit, kein Dienst.
- **Datenbank:** keine Migration, keine RLS-Änderung, keine Typen; Hosted Development und Production unberührt.

## 12. Empfehlung

Unabhängiger Technical-Lead-Review R77 auf dem finalen Exact HEAD. Ein fachlich naheliegender späterer Slice, der hier **nicht** gestartet wird: derselbe native Nachweis für die `SECURITY DEFINER`-Schreib-RPCs (`reise_anlegen`, `reise_aendern`) und für `trip_days`/`trip_items`. Das schliesst die grösste verbleibende Lücke zwischen diesem Nachweis und dem realen Schreibweg der App. Die Entscheidung liegt beim Technical Lead.
