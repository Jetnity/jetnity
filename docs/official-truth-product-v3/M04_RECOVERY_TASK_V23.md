# M04 Recovery Task V23 — R32 command-validation reuse

Current binding scope is **V23 v2** below. V23 v1 remains preserved as historical investigation scope and failure-24 evidence. This file records the authorized task before publication; it does not declare a new-head runtime PASS.

## Current binding implementation amendment — original text retained

## R32 — Recovery Task V23 v2: begrenzte Implementierung freigegeben

**2026-11-10 20:43:43 UTC.** Ergänzt und konkretisiert [V23 v1](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6778458903). Vollständige finale Fehler-24-Evidence: [Root-Receipt](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6778720831). **CHANGES REQUIRED bleibt bestehen; dies ist kein TL-PASS.**

### Bindender Umfang

Derselbe tatsächliche Autor **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, Session **/root/m04_durable_jobs_writer_g3**, liefert die unmittelbare Korrektur gegen den unveränderten veröffentlichten Head **46b4fa8fbc4fe8405d12e0dcc079c4600cdb7eb8** auf dem bestehenden Draft #1183. Root publiziert allein. Der unabhängige Reviewer bleibt **/root/m04_recovery_source_review_g3**.

Genau **ein Implementierungspfad** ist freigegeben: `scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql`. Darin darf ausschließlich der Funktionskörper von `assert_history_v1` geändert werden:

1. Der vollständige erste `command_v1(x.command_text::jsonb)`-Aufruf, die anschließende Envelope-Interpretation und die bestehende Journal-IF-Bedingung bleiben bytegleich.
2. Der einzelne nachfolgende `PERFORM transition_v1(c->'value',e->'expected',e)` wird durch einen pro History-Zeile neu initialisierten verschachtelten DECLARE/BEGIN/END-Block ersetzt.
3. Dieser Block verwendet das unmittelbar zuvor erfolgreich validierte `c`. Seine JSONB-Aliasse entsprechen exakt den bisherigen drei Argumenten. Die übrigen Initialisierungen bleiben in ursprünglicher Reihenfolge. Die 56 bestehenden Transition-Anweisungszeilen werden unverändert übernommen, abgesehen von Einrückung.
4. Die vier kopierten Textvariablen `kind`, `action`, `observed`, `result_key` erhalten ausdrücklich `COLLATE "default"`, damit sie weiterhin die Typ-Default-Collation der bisherigen JSONB-only-Funktion verwenden. Alle lokalen Variablen werden bei jedem Blockeintritt neu initialisiert.
5. Beide bisherigen Envelope-Canonicalization-Aufrufe bleiben bestehen. Kein Ersatz durch Länge oder Text des gespeicherten Journals. Alle Prior-Job-, Transition-, Audit-, Zeit-, Revision-/Overflow-, Rollen-/ACL-, Authority- und weiteren History-Prüfungen bleiben bestehen.
6. Die eigenständige `transition_v1`-Funktion und alle übrigen 28 Funktionskörper sowie sämtliche 29 Deklarationen/Attribute bleiben bytegleich. Kein zusätzlicher Helper, Parameter, Trust-Marker oder Cache über Aufrufe hinweg.

### Entscheidung und Aufwand

Root hat Command, Subject, Transition, vollständige History, Queue-CAS und die vollständige Position der History-Prüfungen vor/nach den Effekten selbst gelesen. Der 254-Kommandos-Ledger verwendet **combination_discovery**. Seine unveränderten Zeilenbesuche ergeben `sum(n + n + 1), n=0..253 = 64516` (507 Besuche der ersten Enqueue-Zeile, 64009 Besuche späterer Dedup-Zeilen).

Die ausgewählte Änderung entfernt daraus statisch 64516 doppelte Command-Validierungen und Transition-Funktionseintritte, 64516 doppelte Subject-Validierungen, 387096 Canonicalizer-Eintritte, 258064 Exact-Keys-Prüfungen und 129032 Digests. **Das ist eine Quellenzählung, keine gemessene Zeitersparnis.** Beide Envelope-Traversierungen und die quadratische vollständige History bleiben erhalten.

Gegenkosten: Der größere lokale Funktionskörper und die Blockinitialisierung; außerdem kann der VOLATILE-Aufrufer für kopierte STABLE-Zeitausdrücke zusätzliche Expression-Snapshots benötigen. Die Ausdrücke lesen keine Tabellen und erhalten dieselben Werte/GUCs. Kein garantierter 240-s-PASS wird behauptet.

Die alternative grundlegende Canonicalizer-Umschreibung wird nicht beauftragt: neue sortierte Aggregate, Fensterberechnung und zusätzliche Arrays/Kopien würden Fehlerreihenfolge und Serializer deutlich stärker verändern, ohne gesicherten Netto-Aufwandsvorteil.

### Unabhängig verifizierte Semantikgrundlagen

PostgreSQL-16-Dokumentation [PL/pgSQL-Deklarationen](https://www.postgresql.org/docs/16/plpgsql-declarations.html) und gepinnte Primärquelle `postgres/postgres@c372fbbd8e911f2412b80a8c39d7079366565d67`:

- `pl_comp.c`, Blob `a341cde2c142052fbbae9bf2db48ddbc899a75c0`: Input-Collation und lokale Typcollation.
- `pl_exec.c`, Blob `4b76f7699a609dbf071ca711891ebcb34761a4f4`: geordnete erneute Blockinitialisierung und Snapshot-Gegenkosten.

Beide Funktionen sind SECURITY INVOKER mit identischem festen search_path. Private Funktionen bleiben postgres-owned und PUBLIC-revoked; nur der bestehende API-Einstieg ist dem Caller gewährt. Der bestehende Catalog-Check prüft Definitionen und ACLs vor der History. `FOUND` wird nach dem ersetzten PERFORM nicht gelesen; spätere FOR-Schleifen setzen es erneut.

### Lieferung, Review und feste Grenzen

Autor liefert exakte Alt-/Neu-Spannen beziehungsweise eine verlustfreie Konstruktionsanweisung, vollständige UTF-8-/SHA256-/Git-Blob-Pins, exakte Rückumkehr, Identität der kopierten Anweisungen, alle 29 Deklarationen sowie den vollständigen Nachweis unveränderter übriger Quelldateien. Keine eigenen Repository-Mutationen, Ready-, Merge- oder CI-Rerun-Aktion.

Root und unabhängiger Reviewer prüfen diese konkrete Lieferung nochmals vollständig. Die bestehenden 31 nativen Gruppen bleiben unverändert; keine Test-/Fixture-/Workflow-/Paket-/Guard-/Manifest- oder Budgetänderung ist freigegeben. Ein konkret nötiger zusätzlicher Oracle müsste vorab als weiterer enger Task-Zusatz begründet werden. Vollständiger neuer CI-/Native-/Preview-/Live-Gate-PASS auf dem neuen Head bleibt zwingend; danach tatsächliches gemergtes main und beide Production-Aliasse separat abnehmen.

Root darf zusammen mit der geprüften Quelle genau neun Continuity-Pfade nachführen: neue V23-Aufgabe, R32-Evidence und Root-Review sowie Handoff und die fünf bestehenden Einstiegspunkte. Alte V22/V21/V20-Evidence und alle 24 Fehlerbeobachtungen bleiben unverändert beziehungsweise vollständig referenziert. Die **separate spätere Abschlussdokumentation mit acht Pfaden bleibt HELD**.

Alle besonderen Owner-Gates und Ausführungsstopps aus V23 v1 gelten unverändert: SQL UNAPPLIED, Method NOT_APPROVED, #1139 NOT_RELEASE_READY, #1131/#1135/#968/#911/#913, #917 UNKNOWN / Stage2 NOT_ATTEMPTED ohne Ersatzweg, keine lokale/hosted/Auth/provider/credential-Ausführung und kein automatischer Folgeslice.

## Earlier V23 v1 investigation contract — original text retained

## Technical-Lead Review — CHANGES REQUIRED R32 / Recovery Task V23 v1

**2026-11-10 20:28:28 UTC.** Exact reviewed head **46b4fa8fbc4fe8405d12e0dcc079c4600cdb7eb8**, Draft#1183, branch **fix/official-truth-v3-m04-postmerge-r30-20261110**. Current main/merge-base **e7aae86c18238033c2186722e24c84dc7a5f69b9**, ahead2/behind0. No Ready, no merge, no TL-PASS.

### Independently verified failure24

Root reread all terminal metadata after the interruption and independently read the completed Repository log. [CI42885977970 / #4092 / attempt1](https://github.com/Jetnity/jetnity/actions/runs/42885977970) is terminal FAILURE, updated19:47:17UTC. Repository130074290863 and aggregate130083867087 failed; all six companions succeeded. Auth remains metadata only.

The R31 syntax correction loads successfully. **23/31 M04 groups pass**, including N02 and its complete8key/144calendar/32timestamp oracle block and both actual R9 wait/abort/drain/backend-absence witnesses. First23 groups total102319ms. Group24 N05/A03 then fails with explicit **M04 240s effect budget exceeded** during ledger_fill. Ledger lastStarted243/lastCompleted242,243 acknowledged command commits; the following command outcome remains **UNKNOWN**. Full254/255/256 boundary,64/65cycles,inherited761/minOwned4182 and final rollback/late-writer are not completed.

Total240280ms; cleanup21ms. All26794/26794 owned operations settled,4242/4242 connections closed,1cluster stopped,0pending/children/cleanup failures. Core8696/8692PASS/2FAIL/2inherited skips/0cancelled,971suites,825058.342427ms. Typecheck/Lint pass; five hygiene steps and Build skipped. Completed cleanup is not full native acceptance.

Complete Repository log: **4258140UTF8bytes / SHA256 421016998720aa1acd83768d062d6f04b65bf2f07988d854c7bc95b980599d9e**. Complete compact native receipt: **3769bytes / SHA256 12403ad5ed2b62642995a72c8b19ff6e6dce7e3af2ddd5fc895331913eaa9bdd**. Exact SQL **fa111694fb535b867bbb16e3d7b334d48d4e4092bf1f312dd2838a7eed2c37aa** and rollback9b9089d… independently match source/receipt. No server-side or runner-cause inference is established by client elapsed times.

```json
{"schema":"jetnity.m04.native.v1","candidateSha256":"fa111694fb535b867bbb16e3d7b334d48d4e4092bf1f312dd2838a7eed2c37aa","rollbackSha256":"9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66","executed":true,"effectAndCleanupMilliseconds":240280,"cleanupMilliseconds":21,"clusters":1,"childProcesses":0,"lifetime":{"started":26794,"settled":26794,"pending":0,"connections":4242,"closed":4242,"stoppedClusters":1},"groups":[{"id":"N01","milliseconds":33},{"id":"N02","milliseconds":1859},{"id":"N03","milliseconds":2217},{"id":"N07","milliseconds":11369},{"id":"N07/R4","milliseconds":1015},{"id":"N08","milliseconds":13444},{"id":"N08/U04","milliseconds":3877},{"id":"N02/U04","milliseconds":1452},{"id":"N04/N06","milliseconds":2869},{"id":"N04/N06/N10","milliseconds":3077},{"id":"N05/N09","milliseconds":2867},{"id":"N09","milliseconds":20162},{"id":"N10/U06","milliseconds":7622},{"id":"N11","milliseconds":2219},{"id":"N11","milliseconds":204},{"id":"N12","milliseconds":167},{"id":"N04/N10/N12","milliseconds":5478},{"id":"N12/U06/R9","milliseconds":14404},{"id":"N12/R7-03","milliseconds":541},{"id":"N11","milliseconds":3016},{"id":"N11","milliseconds":389},{"id":"N11","milliseconds":393},{"id":"N13","milliseconds":3645}],"nestedRaceWitnesses":[{"boundary":"i1_timeout","operation":"reserve_v1","target":{"pid":"25769","birth":"2026-11-10 19:42:29.818116+00"},"control":{"pid":"25768","birth":"2026-11-10 19:42:29.811129+00"},"holder":{"pid":"25254","birth":"2026-11-10 19:42:25.669554+00"},"realSqlWaitObserved":true,"abortDelivered":true,"retainedExecutorDrained":true,"backendAbsentWhileExecutorHeld":true,"failConfirmObserved":true,"terminalEffects":0,"beforeDrainSlot":"unavailable","afterDrainSlot":"invalid","heldMethods":3,"completedMethods":0,"outwardStatus":"worker_only","nativeAdmissionsAfterDrain":45},{"boundary":"worker_caller_abort","operation":"reserve_v1","target":{"pid":"26392","birth":"2026-11-10 19:42:39.385111+00"},"control":{"pid":"26391","birth":"2026-11-10 19:42:39.379687+00"},"holder":{"pid":"26038","birth":"2026-11-10 19:42:34.892111+00"},"realSqlWaitObserved":true,"abortDelivered":true,"retainedExecutorDrained":true,"backendAbsentWhileExecutorHeld":true,"failConfirmObserved":false,"terminalEffects":0,"beforeDrainSlot":"unavailable","afterDrainSlot":"invalid","heldMethods":3,"completedMethods":0,"outwardStatus":"unconfirmed","nativeAdmissionsAfterDrain":44}],"quotaProgress":{"currentGroup":"N05/A03","boundary":"ledger_fill","indexBase":0,"millisecondsCap":300000,"timingMeaning":"client await durations including construction/transport; not server statement profiling","ledger":{"lastStartedIndex":243,"lastCompletedIndex":242,"commandRequestsStarted":244,"commandRequestsCompleted":244,"commandRequestMilliseconds":524,"fixedCallsStarted":245,"fixedCallsCompleted":244,"fixedCallMilliseconds":136719,"commandCallsStarted":244,"commandCallsCompleted":243,"commandCommits":243,"startCallsStarted":0,"startCallsCompleted":0,"startReservations":0},"cycles":{"lastStartedIndex":null,"lastCompletedIndex":null,"commandRequestsStarted":0,"commandRequestsCompleted":0,"commandRequestMilliseconds":0,"fixedCallsStarted":0,"fixedCallsCompleted":0,"fixedCallMilliseconds":0,"commandCallsStarted":0,"commandCallsCompleted":0,"commandCommits":0,"startCallsStarted":0,"startCallsCompleted":0,"startReservations":0}},"connections":{"aggregateWorkConnectionBound":40,"maximumJobs":4,"maximumIntake":1,"maximumMethod":2,"m04ObserverLimit":2,"maximumM04Observers":2,"methodObserverLimit":1,"fixturePerClusterLimit":16,"inheritedCommitGuardPairs":0,"minimumOwned":0},"failure":{"phase":"proof_24:N05/A03","error":{"kind":"fixture","code":"unclassified_failure"}},"cleanupFailures":[],"cleanupFailureCount":0,"nativePass":false}
```

### Binding source-only investigation, before another implementation

Author remains **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, actual session **/root/m04_durable_jobs_writer_g3**. Independent reviewer remains **/root/m04_recovery_source_review_g3**. Same-session immediate correction; no fabricated Cursor or historical session resumption.

Goal: identify a materially justified reduction in repeated validation work that preserves the complete M04 contract and fits the unchanged proof budget. Begin from the exact published SQL140541bytes/fa111694… and native191098bytes/f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0.

**Investigation scope only:** existing low-level validation bodies, their source-derived repeated call graph, and current full-history validation in scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql; read existing native proof and directly relevant contracts as needed. Independently inspect remaining repeated canonicalization, structure/key/date validation and SQL-expression/function overhead. The R30/R31 change has not produced full-budget acceptance; do not presume that more similar micro-changes will solve it.

Deliver:
1. A bounded source-derived work model identifying actual repeated operations and why the proposed change removes them.
2. The smallest candidate correction as exact old/new text, plus countercosts and semantic/refusal-order risks.
3. An explicit proof that every historical row, integrity/identity/authority/context/quota check and required failure behavior remains covered.
4. Existing runtime witnesses that would detect a wrong change; propose only strictly necessary additive oracles if a specific semantic gap exists.
5. Exact final content pins if proposing a complete candidate, and STOP for Root selection plus independent source review.

This task authorizes source reading and pure in-session text/data proposals, **not repository mutation or project execution**. Root will issue a concrete bounded implementation/publication amendment after selecting the correction. Do not edit workflow/package/guards/manifests, create new fixtures, change declarations/roles/ACL/authority/rollback, reorder transaction or wait/authority boundaries, remove history rows, use cross-call validation caches/trust markers, skip proof, increase budgets or rerun the unchanged head. If a proposal needs a wider change, state that need and STOP before implementing it. No performance claim may be inferred from static operation counts.

### Unchanged acceptance and access boundaries

All31 native groups and8CI jobs remain mandatory on every new head: complete newN02 oracles, realR9,full254/255/256 and64/65boundaries,inherited761/minOwned4182,rollback/late-writer and fully drained cleanup; actual-mountedLifecycle,Core,fivehygiene,Build,exactPreview and fresh live/Review/Owner gates. Only Root may later Ready/expected-headmerge after full independent PASS; then actual-main fullCI/native/Production through bothaliases. All earlier successes and24 failed execution observations remain distinct; e7 attempts1/2 share a run ID.

Frozen limits:240s effects+60s cleanup/300s total;4outer lanes/4native per family;8activeNative/256total/16terminal reserve;8callbacks/128total;30s outer/5s child;3clusters/2children/40aggregate work connections/2M04observers/1method observer/16fixture connections per cluster.

No local project/parser/SQL/native/socket/build execution, installation/download/clone/reconstruction/replacement environment or git fetch/push. No hostedDB/Auth/RLS/ACL/migration/credential action or Auth logs, no real source/provider/research call, scheduler/notification/publicV3/paid activation or recurring cost. Immutable primary software-source/docs reads and pure text/data analysis remain allowed; actual project execution only in existing CI after reviewed publication.

SQLUNAPPLIED; MethodNOT_APPROVED; #1139NOT_RELEASE_READY/17pre-Owner gaps; #1131ReadySTOP,both#1135holds,target-specific#968isolation,#911/#913privacy;D1#1169separately unfinished. #917UNKNOWN/Stage2NOT_ATTEMPTED, without retry/rephrasing/delegation/rerouting/transport switch/humanSQL substitute. No premature Owner-approval question.

The mandatory separate8-path documentation closure remains HELD until genuine corrected actual-main PASS, followed by its own complete PR/main gates and final existing-thread receipts. **Do not mark Ready. Do not merge. Do not start a follow-up slice. STOP after the bounded source proposal.**

## Root coverage disposition after delivery

The SQL delivery matches the selected exact one-body replacement. No V23 v3 was authorized. A proposed extra persisted-envelope corruption oracle would require a new fixture tamper mechanism because the existing immutable-history trigger rejects queue-operation UPDATE with P7602. Root did not authorize replication-role changes, trigger bypass, fixture changes or native changes.

The existing complete suite, both-kind and mixed-history paths, standalone malformed-transition negatives, and exact identity of all 56 copied statement lines are the selected verification. The lack of a dedicated new malformed-persisted-envelope negative oracle on the copied path remains an explicit limitation. This is a bounded refactor, not an assertion that all imaginable corruption paths have new runtime coverage.
