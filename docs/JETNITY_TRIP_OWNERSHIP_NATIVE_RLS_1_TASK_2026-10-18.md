# JETNITY R76 — Trip Ownership Native RLS 1 — VERBINDLICHER UNVERÄNDERLICHER TASK

**Datum:** 18. Oktober 2026 (Europe/Zurich)  
**Parent / Issue:** [#964](https://github.com/Jetnity/jetnity/issues/964)  
**Isolierter Nachbar:** [Trip Audit Draft PR #955](https://github.com/Jetnity/jetnity/pull/955), NICHT anfassen.  
**Autorisierter einzelner Code-Autor:** `Jetnity Trip Ownership Native RLS 1 — Cursor Generation 1`, eigene **neue lokale Mac-Cursor-Sitzung**, Claude Opus 5.5 High, nicht Auto/Cloud/Work; weder Autor noch Reviewer von #955 in diesem Slice. Tatsächliche Session-ID erst nach dem Start angeben.  
**Branch:** `test/trip-ownership-native-rls-1`, vorhandener Draft-PR wird vor Agentstart durch Technical Lead angelegt.  
**Start-Base:** protected `main@7337c23a2af084567fad1e7c2ae7839dc972e874` (R72 docs-only #963), Betriebsmodus `NORMAL` beim Seed. **Vor Beginn live nachprüfen**, nicht aus diesem Task voraussetzen.  
**Status:** TASK-ONLY / NO IMPLEMENTATION / NO DISPATCH. Diese Datei nach Erstellung NIEMALS ändern; Blob vor Implementierung unabhängig prüfen.  

## 0. Wofür – und was es NICHT bedeutet

Nach unabhängiger [R75 QA-Evidence](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6249026458) sind beide Richtungen des **normalen App-Lesewegs** mit zwei bestehenden synthetischen Development-Konten negativ geprüft (B→A und A→B, jeweils sichtbare `FEHLER 404`-Seite ohne fremde Inhalte). Eigene A/B-Reisen wurden gespeichert und wieder gelesen. **Der gegenseitige UPDATE/DELETE-/INSERT-Schreibschutz ist NICHT LIVE VERIFIED.**

R76 liefert einen **echten, begrenzten, nativ durch PostgreSQL erzwungenen OWNERSHIP-/RLS-Protokolltest** ausschliesslich auf einer **frisch von diesem Test selbst erzeugten, sofort weggeworfenen lokalen Datenbank**, mit exakt zwei erfundenen Test-Identitäten. Die relevanten existierenden Jetnity-SQL-Migrationen werden echt angewandt; reine Policy-Regex-/Mock-Prüfungen reichen nicht. Kein Product-Feature, keine API, kein Browser, keine authentifizierten realen A/B-Logins, keine Development-/Production-Zugriffe.

Ergebnis **PASS_LOCAL_NATIVE** beweist nur die lokal instanziierte, durch Postgres ausgeführte Migration/Policies, NICHT die Hosted-Development-RLS-Identity-Session-Matrix, PR #955 T09 oder Production. Ein eventuell später notwendiger Live-Write-Denial-Nachweis braucht ein gesondertes, ausdrücklich überprüftes Product-Owner-Gate.

## 1. Vorbereitungs- und Live-Gates

Lies verbindlich:
1. `JETNITY_START_HERE.md`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, `docs/ACTIVE_WORK_STATUS.md`, .jetnity/operating-mode.json;
2. den jüngsten maßgeblichen [#751](https://github.com/Jetnity/jetnity/issues/751)-Checkpoint, neues MATERIAL [#748](https://github.com/Jetnity/jetnity/issues/748), Parent [#964](https://github.com/Jetnity/jetnity/issues/964), #954 und R75 [#955](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6249026458);
3. exakten bestehenden Draft, HEAD/Tree/Merge-Base/Ahead/Behind, echtes `main`, echte Diffs/Reviewthreads, Actions/Vercel;
4. die unveränderte kanonische Migration `supabase/migrations/20260817120000_reiseschema.sql`, beim Seed Blob `37bb78ddb919b16bd4cd8e00b0a1445a9718c4ba`, und später ggf. betroffene Trip-Policy-Migrationen. Keine handkopierte Ersatz-Policy als Beweismaterial;
5. die vorhandene Clusterhilfe `scripts/db/official-truth-integrated-pilot-1/local-cluster.ts` (beim Seed `dc5a2583cd540b83062e8662cdb4b6af4befb376`) **READ ONLY**; `scripts/dev-reference-local-pg-prep-1/nativ.test.ts` als erprobte Test-Gate-Referenz;
6. bestehende lokal synthetische RLS-Verifikation `scripts/db/besuche-rls-lokal-bootstrap.sql` **READ ONLY** (nur Vorlage für minimalen auth/JWT-Rollen-Bootstrap, keine fremde Migration überschreiben), `lib/trips/daten.ts`, die CREATE/UPDATE-/Child-FK-Verträge und `scripts/db/rls.mjs` (niemals gegen Hosted Dev ausführen).

Wenn `main`, Modus, bestehender PR, Task-Blob oder Sicherheitsgrenzen unerwartet abweichen, STOP und TL um erneute Einordnung bitten. Keine Änderungen am bestehenden #955-Worktree/-Branch/-Autor; kein stilles `git reset --hard`, Force Push oder Löschen lokaler Änderungen.

## 2. Exakter neuer Datei-Scope

**Nur neue Dateien:**
- `lib/trips/trip-ownership-native-rls-1.test.ts` — `node:test` echte PG-native Integrationsfälle; vom **bestehenden** `npm test`-Glob `lib/**/*.test.ts` automatisch erreicht.
- Optional neue Test-Bootstrap-/SQL-/Launcher-Helfer unter `scripts/db/trip-ownership-native-rls-1/**`; keine Bibliothek verändern, keine generischen Fake-SQL-Policies als Ersatz.
- Task-eigene Dokumentation `docs/JETNITY_TRIP_OWNERSHIP_NATIVE_RLS_1_{PLAN,REPORT,SELF_REVIEW,HANDOFF}_2026-10-18.md`.
- Optional nur synthetische, sanitiserte `docs/evidence/jetnity-trip-ownership-native-rls-1/**`.

**Verbotene Writes:** dieses immutable TASK; `scripts/db/official-truth-integrated-pilot-1/local-cluster.ts`; `scripts/db/rls.mjs`; alle bestehenden `lib/trips/**` Dateien ausser der oben genannten neuen Testdatei; `lib/trips/trip-audit-v1/**`; `app/**`, `components/**`, `supabase/**`, `types/**`, `auth/**`, `package.json`, lockfile, `.github/**`, `.jetnity/**`, `NEXT*.config`, Guardian, #955, bestehende DB/Migrationen/RLS/Policies, Product-Provider/Payments. **Keine Änderung der Test-/Build-Skripte**. Bei zwingender Scope-Erweiterung STOP → schriftliches enges TL-Amendment, bevor geschrieben wird.

## 3. Native lokale Isolierung und Vertrauensgrenzen

- Verwende `startLocalProofCluster()` bzw. dessen dokumentierte Eigentums-/Socketprüfung. **Frische lokale** `initdb`/Postmaster-Instanz in `mkdtemp`, privater Unix-Socket (`0700`), `listen_addresses=''`, kein TCP, `--auth-host=reject`. Nur das eigene Cluster darf im `finally` gestoppt und nur dessen angelegtes Verzeichnis entfernt werden. Kein geteilter lokaler Datenbankdienst; kein `DATABASE_URL`, `SUPABASE_*`-Connection, remote `--host`, Management-API, Service-Role oder .env/.env.local/Secret-Leseweg.
- `assertLocalProofEnvironment()` muss vor jeder Verbindung fail-closed prüfen, dass keine Remote-Verbindungsvariablen/Argumente infiltrieren. Fremde PG-Verbindungsvariablen werden nicht als alternative Route akzeptiert, und es gibt keinen automatischen Supabase-Fallback.
- Fehlende lokale Binaries auf dem **Mac**: ausdrücklich `NOT VERIFIED / SKIP` (mit Grund), kein Mock-PASS und keine automatische Installation. Fehlende Binaries in **GitHub Linux CI**: **FAIL**, nicht still SKIP. Vollständiger Code-/Test-/CI-Gate läuft im Original GitHub-Linux-Runner (neue native Tests im vorhandenen `npm test` sichtbar), niemals nur Autor-Self-Review.
- Nutze exakt die originalen, unveränderten Migration-Dateibytes von `20260817120000_reiseschema.sql`. Bootstrap ausschließlich die minimal benötigten lokalen `anon`, `authenticated`, `service_role`, `auth.users`, `auth.uid()`-JWT-Claims und Schemanutzungsrechte in einem **neuen test-only Helper**. Begründe präzise jede Test-Shim-Abweichung von Supabase. Führe `auth.uid()` unter echten Rollen/JWT-Claims aus; prüfe `current_user`, `row_security`, `rolbypassrls=false` für wirksame Testrolle und vorhandene GRANTs; ein stiller Superuser-/BYPASSRLS-Check ist KEIN Beweis.
- Prüfe im Originalmigrationstext und ggfs. weiteren für heutige `trips`/`trip_stages` wirksamen Source-Migrationen, ob spätere Policies den RLS-Vertrag ändern. Falls echte aktuelle Policy-Parität nicht mit dem aufgabeneigenen Scope nachvollziehbar aufbaubar ist: ehrliches `NOT VERIFIED`/STOP statt handgeschriebener Ersatzwahrheit.
- **Keinen bestehenden gehosteten Development-/Production-Account, keine existierenden Trips, keine echten Benutzerkennung oder Login-Sitzung** verwenden. Nur zwei feste lokale Beispiel-UUIDs oder neue deterministische synthetische Identitäten; keine private User-Identität in Testausgabe. Leeres lokales Cluster ist die einzige SQL-Zieladresse.

## 4. Mindestmatrix – echte SQLSTATE, Zero-Rows und Positive Controls

Zwei synthetische `auth.users` mit A und B auf einer lokalen DB anlegen. Mindestens zwei eindeutig zugeordnete `public.trips`, je eine `trip_stages`, nur synthetische Reiseinfos. Die Daten sind tatsächliche lokale Postgres-Zeilen, kein In-Memory-Mock. Test-Rolle `authenticated`, `auth.uid()` aus festem lokalem JWT-Claim, negative Fälle in **beiden Richtungen**.

**Akzeptanzfälle:**
- R76-T01: Bootstrap prüft tatsächliche Rollen/GRANTs, JWT-Claims, Auth-UID A und B, RLS ON und kein BYPASSRLS. Kann bewusst eine andere UID wählen. Failing Bootstrap darf keine negative “0” als PASS ausgeben.
- T02: A liest A und B liest B (positive Kontrollfälle), beide sehen fremde Trip/Stage-IDs **nicht** (beide Richtungen genau 0 Zeilen). Kein Test auf leeren Tabellen: beide fremden Zeilen müssen vor der Probe nachweislich vorhanden sein.
- T03: Authentifizierte A→B **UPDATE auf fremde Reise**: 0 tatsächlich veränderte Zeilen (via `GET DIAGNOSTICS ROW_COUNT` / `RETURNING`), B→A symmetrisch; sauber differenziert von SQLSTATE Fehler oder HTTP-404.
- T04: Authentifizierte A→B **DELETE**: 0 tatsächlich gelöschte Zeilen, B→A symmetrisch; kein Kaskadeneffekt oder unerwartet sichtbares Fremdeigentum.
- T05: Authentifizierte `INSERT` mit explizit fremdem `user_id` fail-closed, erwartete RLS-/GRANT-Diagnose eindeutig und keine eingefügte Zeile; jeweils in beiden Richtungen.
- T06: Authentifizierte **eigene** UPDATE mindestens einmal wirksam (1 Row, eigenbezogener `RETURNING`) — negativer Zero-Wert darf nicht von kaputten GRANTs/defektem Harness stammen. Eigene DELETE optional in separatem Rollback-Fall, niemals auf Live-DB.
- T07: Ein eigener Trip wird durch versuchte `user_id`-Umbelegung auf fremden Eigentümer **nicht übernommen** (`WITH CHECK` oder eng dokumentierte FK-Grenze), Original-Owner, Trip, Revision/Rows bleiben unverändert; für echten Policy-Beweis ggf. separater künstlicher Trip ohne FK-Child verwenden.
- T08: Child `trip_stages` schützt beide Richtungen gegen SELECT/UPDATE/DELETE und gegen eingetragene fremde Eigentümer-ID; Composite-FK ist zusätzlich, aber nicht Ersatz für RLS.
- T09: anonyme/fehlende Auth-Claims liefern keine lesbaren Trips und keine erlaubten Writes; keine “Superuser-Pass”-Verwechslung.
- T10: sämtlichen im Test erlaubten positiven Writes folgt **vollständiger lokaler ROLLBACK / weggeworfenes Cluster**; frischer unabhängiger Reader prüft die erwartete Originalbelegung bzw. den Rollback; kein Nebenprozess/Postmaster/Socket/Dateirest. Keine fremde Ressource löschen, auch nicht bei Fehler.
- T11: **Negative Proof Self-Test:** Eine vorsätzlich in einer *neuen, rein lokalen Wegwerf-Testkonstellation* permissiv geöffnete Policy bzw. deaktivierte RLS-Schranke muss von der Testmatrix als Fehler erkannt werden; nicht über einen grün bleibenden 0-Row-Vergleich fälschlich PASS melden. Diese Testmutation ist ausschließlich im eigenen lokalen Cluster erlaubt; muss anschliessend verworfen werden.
- T12: Vollständiger `npm test`-Pfad umfasst die native Suite, `git diff --check`, Operating Mode, Typecheck, Lint, Production Build, originale GitHub Actions inkl. Auth und Vercel Preview exakt auf dem neuen Commit. Keine Task-/Package-/Workflow-Korrektur als Abkürzung.

**Jede Probe** muss vor und nach dem SQL die wirksame Testrolle, synthetische `auth.uid()`, erwartete aktuelle Row-Existenz und die genaue Antwortklasse belegen. Kein direktes “privilegiertes Owner liest 0” gilt. Keine PII in Logs; keine Query mit DB-URL oder Credentials drucken.

## 5. Kein Schluss auf produktive A/B-Tests

**Erlaubte Schlussaussage:** `R76 LOCAL NATIVE RLS PASS` für die nachweislich angewandten Source-Migrationen auf frisch isoliertem PostgreSQL 16/17; eingeschränkter Nachweis des Engine/Policy-Ownership-Vertrags. **Nicht erlaubt:** `Development A/B WRITE DENIAL PASSED`, `Production RLS VERIFIED`, “Trip Audit ready to merge” oder “Owner-Browser safe”. R41 Guardian Datenschutz P1, PR #955 T09 Guest+Account Browser Runtime, aktueller 19-Commit-Drift, öffentlicher Noindex, #917/DEV-PREP-1 Blocker, #911/#913, #626 sowie alle besonderen Product-Owner- und Secrets-/Provider-Gates bleiben unverändert.

Die vorhandenen Development-Testkonten A und B sowie ihre 2 gespeicherten Reisen müssen bestehen bleiben. Der Test darf nicht einmal *lesend* deren privaten Trips inspizieren. Hosted SQL nur für ein getrenntes zukünftiges, **ausdrücklich neues** Product-Owner-Gate und einen unabhängigen Security-Review.

## 6. Writer- und TL-Gates

1. Agent prüft live echte lokale Git-Branch-/Worktree-Lage. Frische Branch-Referenzen abrufen, keine fremden Änderungen überschreiben, keine zweite Session/Generation starten. Wenn Checkout nicht sicher: STOP. Keine angeforderte `Full Access`-Freigabe automatisch erweitern.
2. Ein kurzer PLAN, dann nur neue eigene R76-Dateien.
3. Eigenständig alle T01–T12 bearbeiten, echte Linux-CI-Native-Ausführung auf veröffentlichtem **neuen Exact HEAD** mit SHA, Testzahlen und Exit-Code belegen. Keine grünen Codes vortäuschen bei lokalem Binary-Mangel.
4. Sanitisierten REPORT, SELF_REVIEW, HANDOFF veröffentlichen: Original-Migration-Hashes; Bootstrap-Abweichungen; Testmatrix je Fall; real ausgeführte lokale/CI-Suite vs SKIP; veränderte Dateien; HEAD/Tree/Merge-Base/Ahead/Behind; Vercel-Preview; Risiken; was NICHT nachgewiesen ist.
5. **Commit und Push ausschließlich auf bereits bestehendem R76-Draft-Branch**. Kein neuer Branch/PR/Issue, keine Changes am produktiven RLS oder #955. STOP für **unabhängigen Technical Lead R77**.
6. **DO NOT MARK READY. DO NOT MERGE. DO NOT START A FOLLOW-UP SLICE.** Agent Self-Review ≠ TL PASS. `CHANGES REQUIRED` → exakt derselbe Agent/dieselbe lokale Session, neuer Head, alle Exact-Head-Gates neu. Erst unabhängiger Technical Lead darf normalen sicheren Task mergen.

**END — R76 TASK ONLY / LOCAL SYNTHETIC PG PROOF / NO HOSTED SQL OR USER DATA.**
