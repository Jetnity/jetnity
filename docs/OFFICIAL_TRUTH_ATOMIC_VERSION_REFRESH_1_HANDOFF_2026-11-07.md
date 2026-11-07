# Official Truth Atomic Version Refresh 1 — Autorenübergabe

Datum: 7. November 2026. Issue #1152 / Draft PR #1153.

**Status: zur unabhängigen Technical-Lead-Prüfung geliefert; kein PASS, Ready oder Merge.** Native Abnahme, vollständige Repository-Gates und tatsächlicher Release sind noch offen. Der Autor veröffentlicht keine Remote-Referenz und startet keinen Folgeslice.

Autor: **Jetnity Official Truth Atomic Version Refresh 1 — Codex Generation 1**. Tatsächliche Session: `/root/atomic_version_refresh_writer`.

Branch: `feat/official-truth-atomic-version-refresh-1-20261107`.
Verbindlicher Publication-Parent nach Root-Amendment R3: `888b7fa462e49805f71b07a34f910153877f0f32`, Tree `c3360a515470a6e11bb307ddf3a017fae9f3b334`.
Vorherige veröffentlichte Autorenlieferung: `3dbf1da2b97154372c945e20264f2a18f1b3b0b5`.
Angenommene Produktbaseline: main `a2a3f175670dd7744dbb56ed81fee70c38bbdf38`, Tree `2e8c1e12ffe3bfa794ec9f8a41089f901bff6098`.

## Auftrag und Review-Korrekturen

- [TASK V1](OFFICIAL_TRUTH_ATOMIC_VERSION_REFRESH_1_TASK_2026-11-07.md), unverändert: `b2a3fdb6c1f79cb187b22a7cc9d1a890b8d067d7`.
- [TL-Amendment R1](OFFICIAL_TRUTH_ATOMIC_VERSION_REFRESH_1_TL_AMENDMENT_R1_2026-11-07.md), unverändert: `ebd7c51b746891e44c8c8bfd8c09e47a84efe596`.
- [TL-Amendment R2](OFFICIAL_TRUTH_ATOMIC_VERSION_REFRESH_1_TL_AMENDMENT_R2_2026-11-07.md), unverändert: `815bfedf2a3a2cc418a1a9b537868417340731c8`.
- [TL-Amendment R3](OFFICIAL_TRUTH_ATOMIC_VERSION_REFRESH_1_TL_AMENDMENT_R3_2026-11-07.md), unverändert: `a3c746e487c9c85f346f61ee494ea04539903da3`.
- [Root CHANGES REQUIRED zum ersten eingefrorenen Zwischenstand](https://github.com/Jetnity/jetnity/pull/1153#issuecomment-6710955853).
- [Root-Dispatch R2](https://github.com/Jetnity/jetnity/pull/1153#issuecomment-6710997209).
- [Weiteres Root-Review der Commit-Zeitgrenze](https://github.com/Jetnity/jetnity/pull/1153#issuecomment-6711105770).
- [Root CHANGES REQUIRED nach tatsächlichem ersten CI](https://github.com/Jetnity/jetnity/pull/1153#issuecomment-6711409969).

Der gleiche Autor bearbeitete sämtliche unmittelbaren Korrekturen. Drei separate unveränderliche Zwischen-Snapshots ermöglichten unabhängige SQL-, Transport- und Integrationsprüfung während der weiteren Native-Testarbeit. Nach dem tatsächlichen ersten CI wurde auch der begrenzte R3-Code in einem eigenen unveränderlichen Snapshot zur Prüfung übergeben. Diese Reviews sind keine Abnahme der vollständigen finalen Lieferung. TASK/R1/R2/R3 gehören bereits zum angegebenen Parent und sind kein neuer Autoren-Diff.

## R3: unveränderliche Identitäten für echte spätere Beobachtungen

Der erste CI-Lauf belegte einen tatsächlichen Producer-Fehler vor jeder erfolgreichen atomaren Fortschreibung; die genaue Lauf-Evidence steht weiter unten. R3 erlaubt dafür zusätzlich genau `scripts/official-truth-integrated-pilot-1/engine.ts`, Baseline-Blob `4e0d948c915cd60295d2a8d876db983c5df5301f`. Nur die ursprünglich erzeugten IDs der folgenden Typen ändern sich im tatsächlichen Fresh-Modus:

| Factory | Beobachtungsabhängige Typen |
| --- | --- |
| Manifest | `original_observation`, `validity_origin`, `accepted_origin`, `eligible_version_snapshot` |
| Custody | `AcceptedEvidenceCustodyV1`, `SelectedSupportManifestV1`, `AutonomousReviewConstructionV1` |

Der private Helper bildet vor der wirklichen Artifact-/Pin-Erzeugung einen vollständigen kanonischen Preimage aus festem Domain-Tag `official-truth-fresh-artifact-id-v1`, logischer Basis-ID, Byte-Familie, exaktem Typ und tatsächlichem producer-eigenem Inhalt. Bei Custody ist dies der zuvor vollständig streng geparste historische Wert. `historicalPinFor` liefert mit unverändertem Codec den vollständigen 64-stelligen Digest; `pilot-fresh-` plus Digest ist eine gültige 76-stellige ID. Fehlende Hashbildung verweigert. Version bleibt 1. Kein Feld, Namespace, Clock, Counter oder Zufall wird dem Aufrufer zusätzlich angeboten, und kein bereits entstandener Graph oder Receipt wird anschließend umgeschrieben.

Für identischen Inhalt bleibt die abgeleitete Identität gleich; tatsächlich geänderte Beobachtung oder Abhängigkeit ergibt eine neue Identität. Historischer/default Modus und historische Fault-Fälle behalten ihre bisherigen IDs. Alle übrigen Typen, insbesondere Global-Cell-, Profile-, Extractor-, Policy-, Katalog-, Code-, Qualification-, Admission-, Selection-, Content- und Representation-Definitionen, behalten ihren bestehenden Identitätsvertrag. Diese Korrektur migriert keine ältere Codeversion und erlaubt weder geänderte Rechtsaussagen noch stille Überschreibung. Publisher, SQL-Verifier, kanonische Codecs, kontrollierter Runtime-Einstieg, vollständige Kapseln, Corpus und #1151-Leser bleiben unverändert.

Die neuen Fixture-Assertions vergleichen alle bereits tatsächlich ausgeführten Fresh-Bundles paarweise: Jeder geteilte `(artifact_id, artifact_version)`-Schlüssel muss denselben Typ, dieselbe Byte-Familie, denselben Contract, vollständige kanonische Bytes und Digest besitzen. Alle sieben dynamischen Familien müssen vorhanden sein und neue IDs erhalten; sämtliche statischen Artefakte müssen vollständig gemeinsam bleiben. Je ein zusätzlicher Primary-/Composed-Probe benutzt den bestehenden Fixture-Writer in einer ausdrücklich zurückgerollten Transaktion: tatsächliche Publikation neben dem gespeicherten Old, `verify_existing` mit `idempotent`, anschließend vollständige Gleichheit aller Store-Zeilen zum vorherigen Zustand. Die frühen Review-/Mode-/Body-Negativfälle prüfen jetzt ausdrücklich ihren beabsichtigten SQLSTATE; die bisherigen `23514`-Erwartungen und tatsächlichen Fault-Phasen bleiben unverändert.

## Gelieferte zusammenhängende Funktion

`refreshPersistedCanonicalVersion` führt eine einzelne lokale Fortschreibung der vorhandenen fiktiven CH-Pass-/GB-Visum-Zelle aus. Der Aufruf verlangt `primary` oder `composed`, den exakten erwarteten Vorgänger, einen vollständig überprüfbaren neuen Provenienz-/Implementierungs-Bundle, dessen Originalbytes, die getrennte Review-ID und den ursprünglichen externen Lifecycle-Zeugen. Ein unforgebarer `LocalProofCluster` bleibt Voraussetzung. Sämtliche Eingabebytes einschließlich TypedArray-/Buffer-Inhalt werden vor dem ersten Await in eigene Kopien übernommen. Es gibt keine injizierbare Verbindung, Clock, Registry, Current-Liste oder positive Callback-Antwort.

Vor der Schreibtransaktion liest der unveränderte #1151-Reader den tatsächlich gespeicherten Vorgänger vollständig durch Originale, kanonische Evidence, historischen Review, Extraktor, Rule und Requirements. Fingerprint und Zeuge müssen exakt stimmen. Anschließend wird der neue Bundle mit den unveränderten Verifiern und derselben kanonischen historischen Projektion über die eigenen Originalbytes geprüft.

Die SQL-Operation delegiert `publish_local_integrated_v2` einschließlich seiner vollständigen Closure- und Artefaktprüfung. Erst danach nimmt sie den Lifecycle-Head-UPDATE-Lock. Unter dieser Sperre werden der originale externe Zeuge und der gesamte akzeptierte Bestand erneut geprüft; nur der eindeutige erwartete Vorgänger kann weiterlaufen. Die neue Minimalrolle erhält lediglich das gepaarte Wrapper-EXECUTE plus erforderliches Schema-/Typ-USAGE. Sie erhält keine eigenständige Producer-, Reviewer-, Lifecycle- oder Provenance-Writer-Mitgliedschaft. Dasselbe gilt für den konkreten Test-Login.

Die direkt aufrufbare SQL-Funktion ist an den festen existierenden Corpus gebunden: Definition, Scope, Fakt `required/electronic_visa`, Quellenkatalog, Profile, Extraktor-Deskriptoren und das vollständige Composed-Policy-Register. Beide tatsächlichen SelectedSupportManifest-/Custody-/Validity-Origin-Ketten werden mit den bestehenden `closure_v2`-/`content_v2`-Helfern gelesen. Die vollständigen Datum-/Basis-/Locator-Werte müssen den codeeigenen Ergebnissen von `derivePilotValidity(item, pilotBody(item))` entsprechen. Die exakt gleichen qualifizierten Rohbytes werden für jeden semantischen Slot erneut verlangt. Dies ist eine endliche Corpus-Bindung, kein neuer Parser und kein neuer Rules-Store.

Jedes Receipt behält seine eigene vorgeschriebene Version-ID-Reihenfolge. Eine eindeutige vollständige Zuordnung der ganzen Quellen-/Content-/Representation-/Profile-Bindung verbindet Old und New. Dadurch sind natürliche Hash-Reihenfolgewechsel zwischen echten Beobachtungen erlaubt; verdrehte Original-/Review-/Manifest-Listen, doppelte oder gemischte Stützen bleiben abgewiesen. Jede korrespondierende Beobachtungs- und Referenzzeit muss tatsächlich später sein; jede Evidence-Version muss neu sein. Unveränderter Inhalt wird als `sourceContent=unchanged` und `ruleChange=not_asserted` bezeichnet.

Bind(New), vollständige erneute Old-Prüfung unmittelbar vor Supersession, Supersede(Old), vollständige finale unique-New-Auswahl und Originalprüfung bilden eine einzige READ-COMMITTED-Transaktion. Der interne Zeuge darf ausschließlich über die eigenen vollständig geprüften `accepted(New)`- und `superseded(Old)`-Events fortgeschrieben werden. Es gibt keinen Cursor-Read zur Konfliktreparatur, kein Checkpoint-Renewal im Runtime-Pfad und keinen automatischen Wiederholungsversuch. Ein veralteter, abgelaufener, zurückgezogener, widersprüchlicher, schon supersedierter oder entsorgter Vorgänger wird nicht requalifiziert.

Die kleine RLS-erzwungene, unveränderliche Transitionstabelle verbindet Vorgänger, Nachfolger, getrennten Review und die tatsächlichen Eventzeugen. FK-Bezüge erhalten die vorhandene Geschichte; die Tabelle enthält keine neue Regel und verleiht keine eigenständige Autorität. Wiederholungen werden unter altem wie frischem Zeugen ausdrücklich ohne zusätzliche Mutation abgelehnt.

## Tatsächliche Commit- und Return-Grenzen

R2 autorisiert den eng begrenzten neuen `LocalPgConnection.commitBefore`-Einstieg in `scripts/db/official-truth-integrated-pilot-1/pg-wire.ts`; dessen Baseline-Blob ist `0d546eaf0acedff4e75157cdd1f05c6090ec30e2`. Zusätzlich zu diesem Transport-Seam erlaubt erst R3 den oben beschriebenen Producer-Seam. Der gewöhnliche `query`-Pfad, sein festes 20-Sekunden-COMMIT-Limit sowie die bisherigen Startup-/Statement-/Lock-/Idle-/Recovery-Grenzen bleiben bestehen. Driver, Coordinator, SQL-Kandidat und Rollback sind im R3-Fix gegenüber der veröffentlichten ersten Lieferung bytegleich.

Der neue Einstieg nimmt ausschließlich den bereits bewiesenen absoluten monotonen Bound und den tatsächlichen DB-Cutoff entgegen und sendet ausschließlich den festen COMMIT-Frame. Er kann die bisherige Frist nur verkürzen. Der vorhandene unabhängige PostgreSQL-Guard und seine vorab etablierte Control-/Recovery-Verbindung behalten Ziel-PID, Backend-Beginn und Transaktionsbeginn. Eine echte DB-Zeitbeobachtung vor weiteren Arming-Awaits kalibriert die monotone Mindestfrist konservativ in eine absolute DB-Frist; spätere Serverwartezeit kann keinen relativen Sleep neu beginnen lassen. Nach dem Arming folgen Schließen-/Fristprüfung und Dispatch synchron ohne dazwischenliegendes Await.

Die Wrapper-Antwort enthält tatsächlichen Funktionsstart, Prüfzeit und frühesten Cutoff. Der vor der Abfrage erfasste monotone Start plus `Cutoff − Server-Funktionsstart − 2 ms` bildet eine konservative Frist, die die lange SQL-Arbeit einmal belastet und niemals nach hinten verschiebt. Diese Frist bleibt über ACK, Producer-Ende, unabhängigen neuen #1151-Reader, Ergebnis-Freeze und den letzten äußeren Return wirksam. Die letzten Prüfungen lauten Quellen-Currentness, dann monotone Frist, dann Return.

Ein definitiv unsent COMMIT wird nicht als versucht ausgewiesen. Ein dispatchter COMMIT ohne erhaltenen vertrauenswürdigen Beleg bleibt `commit_outcome_unknown`. Ein tatsächlich erhaltener `CommandComplete(COMMIT)`-Beleg bleibt auch bei späterem Transport-/Cleanup-Problem bekannt. Danach fehlgeschlagene Fristen, Cleanup-, Producer-Ende- oder Readback-Prüfungen liefern `committed_readback_unavailable`, keine positive Evaluation, keinen Undo und keine behauptete Rücknahme. Eine geschlossene JavaScript-Verbindung genügt nicht: Der Producer-PID einschließlich Backend-Beginn muss tatsächlich verschwunden sein, bevor der abschließende Reader neue Backends öffnet.

Dies ist keine allgemeine physische Commit-Frist für beliebige direkte SQL-Aufrufer. Es gibt keinen als universelle Commit-Autorität ausgegebenen deferred Constraint-Trigger. Die SQL-Operation prüft ihre wirklichen Mutations-/Reproof-Grenzen; der kontrollierte Coordinator besitzt die zusätzliche Dispatch-/ACK-/Readback-/Return-Verantwortung.

## Native Abnahmematrix — implementiert, lokal nicht bestanden

Der neue vollständige native Parent hat unverändert maximal **900 Sekunden**, verlangt echtes PostgreSQL 16 und enthält keine vorgesehenen Skips. Seine positiven Fixtures stammen ausschließlich aus drei echten Primary- und zwei echten Composed-Ausführungen des unveränderten kontrollierten Fresh-Einstiegs mit dem unter R3 korrigierten ursprünglichen Artefakt-Erzeuger. Zwischen tatsächlichen Ausführungen liegt eine reale kurze Wartezeit wegen der sekündlichen Quellenuhr. Alle zurückgegebenen Implementierungskapseln bleiben vollständig; es gibt keinen positiven Time-Rehash und keinen Retry für günstigere Hash-Reihenfolgen.

| Bereich | Implementierter wirklicher Nachweis |
| --- | --- |
| Producer-Kompatibilität | Paarweise Prüfung sämtlicher tatsächlicher Fresh-Graphen auf identische vollständige Bytes jedes gemeinsamen unveränderlichen Schlüssels, neue IDs der sieben dynamischen Typen und unveränderte statische Pins. Vor der downstream Matrix je Primary/Composed tatsächliche rollback-only Coexistenz-Publikation und `verify_existing`. |
| Primary/Composed | Getrennter Review, tatsächliche Publikation/Bind/Supersede, ACK, Producer-Ende, neue Reader-Backends, genau Nachfolger und eine synthetische Visa-Evaluation. |
| Scope und Rohbytes | Falscher/missing Review, falscher Modus, geänderte/unqualifizierte Bytes, vollständig rehashter falscher Fakt, andere Scope-/Quellenidentität, alte Beobachtung, verdrehte und gemischte Composed-Stützen. |
| Kanonischer Old | Closure-konsistente falsche qualified-locator-Basis und zusätzlicher inaktiver Composed-Policy-Eintrag; unveränderter Reader und direkte Minimalrollen-SQL-Operation müssen ablehnen. Vorhandener Graph-Rehash-Helfer wird ausschließlich für diese Negativdaten benutzt. |
| Rollback | Tatsächliche Test-Trigger prüfen erreichten Bind-/Event-Zustand vor dem Fehler. Separater Fehler nach tatsächlicher Supersession. Alle ursprünglichen/provisorischen Tabellen werden über Counts und Zeilenhashes verglichen. |
| Geschichte | Alte Original-/Ciphertext-/Support-/Binding-/Review-Werte bleiben unverändert; das alte positive Lesen wird nach Supersession abgewiesen. Keine doppelte Acceptance/Supersession bei wiederholtem Versuch. |
| Currentness | Stale/expired/disposed, Source-/Profile-/Rule-Withdrawal, Conflict, supersedierter Vorgänger, beschädigter Bestand und echte zusätzliche akzeptierte Version mit Ambiguität. |
| Konkurrenz | Wirkliche Reader-SHARE-Barriere, wartender Writer am Head, zweiter Writer an der Provenienz-Advisory-Sperre, maximal ein Commit, Verlierer mit nach Warten erneut geprüftem externem Zeugen; keine partielle dauerhafte Version. Die abschließenden Backend-/Lock-Assertions in diesem instrumentierten Teil folgen auch auf explizites Schließen durch das Test-`finally`; sie sind kein eigenständiger Beleg für ausschließlich vom Runtime-Pfad geleistetes Cleanup. |
| Warten/Abbruch | Vorab kanonisch gelesener Old läuft während einer wirklichen Head-Wartezeit ab; eigener Abort- und echter Lock-Timeout-Fall. Die abschließenden Backend-/Lock-Assertions berücksichtigen das ausdrückliche Cleanup der testseitig gehaltenen Verbindungen. |
| COMMIT-Arming | Tatsächlicher Ablauf während asynchronem Arming mit definitiv ausbleibendem COMMIT-Dispatch. |
| Deferred COMMIT | Tatsächlich im COMMIT laufende deferred Arbeit wird durch den kürzeren unabhängigen Server-Guard begrenzt. |
| Verzögerter Guard | Wirkliche Verzögerung vor Guard-Transport bei noch verbleibender monotoner Frist und deutlich späterem rohem DB-Cutoff. Echte dreisekündige Deferred-Arbeit würde nach dem früheren Bound, aber vor einem fälschlich neu gestarteten relativen Guard enden; die absolute Kalibrierung muss sie stoppen und den Testmarker zurückrollen. |
| Unklare/verspätete Bestätigung | Tatsächlich ausgeführter Commit mit anschließend verlorenem Helfer-Rückgabebeleg ist ausdrücklich als solcher instrumentiert, kein behaupteter Wire-Packet-Loss. Separat wird eine echte Reader-Verbindung nach ACK und nachgewiesenem Producer-Ende geöffnet, geschlossen und als fehlgeschlagen zurückgegeben. Weitere Fälle verzögern eine erfolgreiche Guard-Cleanup-Antwort beziehungsweise eine erfolgreiche Reader-Antwort über den frühesten SQL-Bound. Das sind keine injizierten Producer-Ende-Fehler und keine fehlgeschlagenen Cleanup-Abfragen. Unabhängiger State-Audit ohne Replay. |
| Rechte und Rücknahme | Exakte Rolle/Owner/search_path/UTC/ACL, keine breiten Login-Mitgliedschaften oder direkte Lifecycle-/Publish-/Tabellenrechte, keine stille Reinstallation, unveränderliches Audit und gezielte Package-Rücknahme unter Erhalt aller ursprünglichen Store-Zeilen und Funktionen. |

Jede abgeschlossene SQL-Operation meldet tatsächliche Phasenzeiten. Native Diagnose enthält Operation, Resultat, SQLSTATE, Backend-Abschluss und Phase; keine Originalbytes, Schlüssel, Kapseln, rohe Fehlertexte oder Personeninformationen. Positive Ergebnisse bleiben tief eingefroren, `positiveRealVisaCells=0`, `productionAcceptedRead=NOT_AUTHORIZED`, `reusablePositiveCache=false`; alle ungeklärten Anforderungen bleiben unknown.

## Tatsächlich ausgeführte lokale Prüfungen

Die lokale Arbeitskopie ist ein anhand des exakten Git-Trees gehydrierter Teilbaum; ursprünglich 223 benötigte Baseline-Dateien stimmten ohne Blob-Abweichung. Lokale Laufzeit: Node 24.22.1, CI laut bestehendem Projekt Node 22.x. Vorhandene, unverändert wiederverwendete Abhängigkeiten enthalten keine vollständige React-/Next-/Supabase-SSR-Installation. PostgreSQL-Binaries wurden in den vorhandenen üblichen Installationspfaden nicht gefunden. Es erfolgten keine Installation, keine Dependency-Stubs, keine Lockfile-Änderung und keine Plattformumgehung.

1. Import-/Syntax-Smoketest des neuen Coordinators und Foreign-Cluster-Refusal: tatsächlich erfolgreich.
2. Vier fokussierte Contract-/Ownership-/SQL-Festbindungs-/CI-Tests nach dem R3-Fix erneut ausgeführt: **4 bestanden, 0 fehlgeschlagen, 0 übersprungen**, Gesamtdauer 431,047 ms. Der zusätzliche vollständige App-Importgraph-Test wurde in diesem Teilbaum nicht als bestanden behauptet; `app/` und `components/` sind hier nicht vollständig vorhanden. Der Core-CI-Job führt die gesamte Datei aus.
3. Gezielter Typecheck nach dem R3-Fix einschließlich Producer, Native-Datei und Driver: keine gemeldeten Fehler in geänderten Dateien. Der Gesamtaufruf ist **fehlgeschlagen**, mit denselben neun Meldungen außerhalb dieser Dateien, darunter fehlende `react`, `next/navigation`, `next/server`, `next/headers` und `@supabase/ssr` sowie deren Folge-Typdiagnosen. Dies ist kein vollständiger Typecheck-PASS.
4. `npm run test:refresh-native` wurde vor der ersten Lieferung tatsächlich lokal gestartet: **0 bestanden, 1 fehlgeschlagen, 0 übersprungen**. Abbruch bereits im unveränderten Fresh-Runner-Build nach fünf nicht auflösbaren Framework-Imports. Keine positive Fresh-Ausführung und kein PostgreSQL-Statement dieser Native-Suite wurde dadurch lokal nachgewiesen. Der identische fehlende lokale Unterbau wurde nicht durch Stubs oder Installationen ersetzt. Die neuen R3-Kompatibilitäts-/Publikationsproben und die vollständige positive Native-Matrix sind bei dieser Rückgabe noch nicht tatsächlich ausgeführt.

Vollständige Core-/Native-/Refresh-/Auth-/Hygiene-/Build-/Preview-Gates müssen auf dem finalen Exact Head laufen. Insbesondere sind funktionierendes SQL, vollständige Closure-Negativ-Fixtures, tatsächliche Concurrent-/Deferred-Commit-Zeitmessungen und die unveränderten Legacy-PG-Tests noch durch echte CI zu belegen. Kein Timeout, keine alte Test-Erwartung und kein Guard wurde zur Erzielung eines grünen Ergebnisses erweitert oder abgeschwächt.

## Tatsächlich beobachteter erster vollständiger CI-Lauf

Root veröffentlichte die erste vollständige Autorenlieferung auf Head `3dbf1da2b97154372c945e20264f2a18f1b3b0b5`. Im [CI-Lauf 42401079734](https://github.com/Jetnity/jetnity/actions/runs/42401079734), [Refresh-Native-Job 128488741283](https://github.com/Jetnity/jetnity/actions/runs/42401079734/job/128488741283), scheiterte der neue Native-Parent nach **66,235 Sekunden**: Die Prüfung des vollständig rehashten falschen kanonischen Fakts erwartete `23514`, erhielt jedoch `P0001`. **Alle fünf echten Fresh-Ausführungen waren vorher erfolgreich; eine positive atomare Versionsfortschreibung wurde in diesem Lauf nicht erreicht.**

Root und unabhängiger Reviewer identifizierten die Ursache im tatsächlichen Producer: Veränderliche Beobachtungs-, Gültigkeits-, Acceptance-, Custody-, Eligibility-, Manifest- und Review-Artefakte wurden bei jeder Fresh-Ausführung unter festen IDs mit Version 1 erzeugt. Der unveränderte immutable Publisher verweigert folgerichtig andere Bytes unter einer bereits gespeicherten Identität. Die bisher breiteren Negativ-Refusals vor der ersten expliziten SQLSTATE-Prüfung ersetzen keinen Beleg der jeweils beabsichtigten fachlichen Ablehnung. Diese CHANGES REQUIRED werden durch denselben Autor in derselben Session bearbeitet; Fehlercodes, Timeouts und Publisher-Invarianten werden nicht gelockert.

Root meldete für diesen abgeschlossenen ersten Lauf: **Persisted-Native SUCCESS, Auth SUCCESS, Core-Typecheck/Lint SUCCESS, Core-Tests CANCELLED nach neuem Dokumentationshead, Refresh-Native FAILURE, Aggregate FAILURE.** Dies ist kein Gesamtpass. Der oben dokumentierte R3-Codefix ist eine neue Lieferung; für ihn fehlen noch die vollständigen neuen Exact-Head-Gates und der tatsächliche positive Native-Beleg.

## CI-Integration

`test:core` und `test:persisted-native` bleiben bytegleich. `test:refresh-native` führt die vollständige neue Native-Datei aus; `npm test` verlangt alle drei Kommandos nacheinander. Ein isolierter Standard-Runner-Job `refresh_native` besitzt dieselben Setup-/Operating-Mode-Guards und höchstens 20 Minuten. Der eindeutige erforderliche Job **Typecheck, Lint & Build** läuft mit `always()`, hängt von allen drei Testjobs ab und verlangt ausdrücklich drei `success`-Ergebnisse. Bestehende Trigger, Concurrency, Auth-Job, alte Timeouts, Schritte, Dependencies und Rulesets bleiben erhalten.

## Rücknahme und Grenzen

Install und Rücknahme sind ausschließlich Kandidaten für einen neu besessenen wegwerfbaren lokalen Proof-Cluster. Install überprüft den bestehenden Definer-Owner und verweigert vorhandene Package-Objekte. Rollback entfernt nur neue Wrapper-/Audit-/Rollenobjekte mit RESTRICT und widerruft deren eigene Usage-Grants; übrige Funktionen, Zeilen, Reviews, Originale und Lifecycle-Historie bleiben erhalten. Eine bereits bestätigte Versionsfortschreibung wird durch Code-/Package-Rücknahme nicht umgeschrieben oder rückwirkend zurückgenommen. Der neue Rollen-Grant an den Test-Login wird im Test ausdrücklich vor dem Role-Drop entfernt.

Die erste Version behandelt unveränderte qualifizierte Inhalte und weiterhin benutzbare Vorgänger. Es gibt keine Quelle mit rechtlich geänderter Aussage, keine Unterstützung weiterer Länder/Anforderungen und keine Requalifikation schon veralteter Baselines. Ein synthetisch positives Ergebnis ist kein amtlicher Visa-Bescheid, kein Accepted-Reader für die App und kein fertiggestelltes Einreiseprodukt. Keine Produktoberfläche oder Provider-Registrierung importiert diesen Script-Pfad.

## Gehostete Wahrheit und vollständiger Produktauftrag bleiben erhalten

Development `yfvbxvijcorffwxbxahl`: Stage 1 **APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING**, tatsächliche neue Ledger-ID **unbekannt**. Stage 2 **NOT_ATTEMPTED**. Keine wiederholte, umformulierte oder anderweitig umgeleitete verweigerte Nachprüfung; kein gehostetes SQL/Auth, kein echter amtlicher Abruf, keine Produktionsmigration, kein Secret-/Environment-/Settings-Write und kein bezahlter Dienst. Cursor bleibt pausiert. #1131 wurde nicht bereitgesetzt, gemergt, kopiert oder über dieses Paket integriert; #985/#937/#913 bleiben gehalten.

Der noch offene A–F-Weg bleibt Bestandteil des Auftrags: zulässiger Plattformfreigabeweg und tatsächliche #1139-Owner-/Account-/Session-Zielbaseline; zielgebundenes #1142-Sicherheits-/Migrationspaket mit echten ACL-/Auth-/FK-/Trigger-/Expositionsbelegen und reserviertem PO-Gate; Pilot-Persistenz und Trip-/Grant-/RPC-Kette; vertrauenswürdiger vollständiger AA-Abruf mit konkretem Quellen-/Identity-/Extractor-/ApplicationContract-/Katalog-/Use-/Retention-Scope; echte Development-Zielbindung; begrenzter aktiver Owner mit aktueller AAL2, eigener Session, eigenem aktuellem unterstütztem Trip und explizit ausgewähltem verknüpftem CH-Pass; danach besonders freigegebenes Production-Paket und unabhängiger tatsächlicher Ablauf auf jetnity.com.

Die eigene dauerhafte, versionierte und aktualisierbare Einreiseregel-Datenbank, amtliche Recherche fehlender/veralteter Zellen, deterministische Acceptance, Audit, Owner-Override und Kill-Switch sowie die komplette Checkliste über Visa hinaus bleiben Produktziel. Owner-only bleibt Bootstrap. Die Sieben-Länder-Queue, globale Aktivierung und allgemeine Accepted-/Retained-Lookups werden durch diesen lokalen Auftrag nicht zu neuen Voraussetzungen des ersten Current-Request-only-Piloten.

## Dateimanifest und Abschluss

Die neue separate TL-Übergabe enthält den vollständigen eingefrorenen Stand aller **15 Autoren-Dateien** und ein ausdrücklich auf den Parent `888b7fa462e49805f71b07a34f910153877f0f32` bezogenes **7-Datei-Deltamanifest**. Nur diese sieben Dateien haben sich gegenüber der ersten veröffentlichten Lieferung geändert: die folgenden sechs Dateien sowie diese Handoff-Datei. Die anderen acht Autoren-Dateien bleiben bytegleich. TASK/R1/R2/R3 werden separat auf ihre veröffentlichten Blobs geprüft und sind ausgeschlossen; sämtliche übrigen Baseline-Dateien bleiben eingefroren. Keine pauschale Veröffentlichung des partiellen Arbeitsverzeichnisses.

| Geänderte Datei | Alter Git-Blob im R3-Parent | Neuer Git-Blob |
| --- | --- | --- |
| `ARCHITECTURE.md` | `d7c542601597fa39dece45acf7dad8449d3296d5` | `3aca9ac099d35712e686a44d4d96e1f6e7321490` |
| `DECISIONS.md` | `5eb1f7fd9de92d75ea560e10e6d2e1350452a720` | `fc9c0ed23e8c3c1fdd618697139ce2d962ed4290` |
| `ROADMAP.md` | `1e31dfd3031977e920f58acfae4a0e041ee7043a` | `31c280a1ac1d9d04fd12b98cd876ce72e7efc170` |
| `scripts/official-truth-integrated-pilot-1/engine.ts` | `4e0d948c915cd60295d2a8d876db983c5df5301f` | `be74d6fb332881ab2558541482185c811b9ff8b9` |
| `scripts/db/official-truth-atomic-version-refresh-1/fixtures.ts` | `d96c6e17b74fd05b872c0a07503a17d5bc5c7fb1` | `033b9ed01fdb230beac8e6d346324b4dbf504678` |
| `scripts/db/official-truth-atomic-version-refresh-1/native.test.ts` | `8afa89433f25e4c86beeb918a037195fc6a3d079` | `7fb68b57f94f6a137203062f45dfdc3d618b12bd` |

Die eigenen finalen Hashes dieser Handoff-Datei und sämtliche alten/neuen SHA-256-Werte stehen im separaten vollständigen Manifest und im Deltamanifest; ein selbstreferenzieller Datei-Hash wird nicht erfunden. Die eingefrorene Übergabe enthält außerdem die vollständigen neuen lokalen Test-/Typecheck-Ausgaben. Die unter R3 hinzugekommenen tatsächlichen Native-Proben bleiben bis zur neuen CI ausdrücklich offen.

Autorstatus nach dieser Lieferung: **returned / STOP**. Nur Root entscheidet PASS, Ready, Merge und Release. Bei CHANGES REQUIRED wird genau diese Session für den unmittelbaren Fix fortgesetzt; jeder neue Head braucht die vollständigen eigenen Gates. Kein automatischer Folgeslice.
