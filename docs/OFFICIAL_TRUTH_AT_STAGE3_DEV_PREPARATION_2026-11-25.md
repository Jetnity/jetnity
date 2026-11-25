# CH→AT Stage 3 – BG1-Nachfolger und unangewandtes Installationspaket (25.11.2026)

**DRAFT / UNAPPLIED / RESEARCH_ONLY.** PO-Go nur für die technische Vorbereitung in Issue [#1317](https://github.com/Jetnity/jetnity/issues/1317). Keine Production-Ausführung, keine Faktenerneuerung, keine Publikation, kein Besucherflag, keine neuen Kosten.

Baseline `main` `69ab3fa203f45cd97ee3ed5187ca51a0497c625b` (#1315). Der Quellenentscheid [#1297](https://github.com/Jetnity/jetnity/issues/1297) bleibt ohne Erneuerungs- oder Publikationsrecht. Rechtsfreigabetext bleibt `null`. Italien, Frankreich und Spanien bleiben zurückgestellt.

## Paket

Ein Transactionspaket unter `scripts/db/official-truth-at-stage3/`. Die Module dürfen nicht einzeln laufen: ohne Assembler-Marker `jetnity.at_stage3_assembler=package` endet der Lauf mit `AT_STAGE3_MODULE_INSTALL_FORBIDDEN`.

Reihenfolge, erst nach separatem PO-Go und nur durch den Release-Chat:

1. `production-read-only-preflight.sql` liest den V6-Katalogdigest. Dieses Repository trägt ihn nicht ein.
2. Dieselbe Session setzt `jetnity.at_stage3_expected_v6_catalog_digest` auf genau diesen frischen Wert.
3. `production-stage3.ROLLBACK-PROBE.sql` ist die atomare Probe und endet mit `ROLLBACK`.
4. `production-stage3.COMMIT-CANDIDATE.sql` ist derselbe Body und endet mit `COMMIT`.
5. `production-post-commit-readback.sql` ist nur lesend. Ein frischer Production-Readback bleibt ein offenes PO-Gate.
6. `production-stage3.WITHDRAWAL-REHEARSAL.sql`, danach bei separatem Go `production-stage3.WITHDRAWAL.sql`: nur ein Hold im Publikationsjournal und ein Hold in `ch_stage3_renewal_hold_v1`. Keine Loeschung historischer Originale, kein DROP der V6-Zeile, kein Anlegen des V7-Markers.

`catalog_status_v1()` bleibt der V6-Körper. `assert_catalog_v1`, `require_open_v1` und `official_v3_guard_alarm_status_v1` werden append-only um `bg1_prod_ch_at_stage3_v8` erweitert. Die historischen Digest-Pins, `renew_ch_v1`, der HTTP-Allocator, CH→DE und die übrigen Cron-Kommandos bleiben. Der V7-Notfallmarker `bg1_prod_ch_at_source_rollback_v7` bleibt reserviert und abwesend. Die bestehende Cron wird nicht umgestellt. `renew_ch_v3` ist nur ein privater, einmalig autorisierter Aufruf.

Parent-Funktionskörper SHA-256, aus dem installierten V6-Text und gegen PostgreSQL 17.12 geprüft:

| Signatur | SHA-256 |
| --- | --- |
| `official_v3_guard_private.catalog_status_v1()` | `aaf93dcd12350720cac4ce76e557043908760034d353851e9de6c6094bea3086` |
| `official_v3_guard_private.assert_catalog_v1()` | `2a5d30c88d6e7bba45f00a3fa59d739b97ab171b70ec24fdfbc52fca54ad2908` |
| `official_v3_guard_private.require_open_v1()` | `74e12b3cd6d766eb5b09af76e56e9b259e220add67f2dcffc149f31f23f4afe2` |
| `public.official_v3_guard_alarm_status_v1()` | `d49e15f93b0720e79530bc8f793a5ebf6b965acfede7bd5d9100dff5674d7f9c` |
| `jetnity_ot_auth.require_current_owner_session_v1()` | `ba3667edd483f0a0abcf53f70f4dc71906f0ffdbc192ee569232c78dd359635b` |

Der V6-Katalogdigest ist kein Git-Pin. Ein erfundener Wert wäre eine gefälschte Quittung. Der Installer bricht ohne den frischen Readback ab.

## Review-Nachzug auf `752f32baa`

Der Technical Lead hat `752f32baa` mit NO-GO belegt. Der Installer ruft `assert_catalog_v1()` zweimal verpflichtend auf: einmal vor jedem Stage-3-DDL, solange der Körper noch V6 ist, und einmal am Ende, wenn der V8-Körper steht. Eine fehlschlagende Kette bricht die Transaktion ab. Auf der synthetischen Datenbank liefern deshalb sowohl `production-stage3.ROLLBACK-PROBE.sql` als auch `production-stage3.COMMIT-CANDIDATE.sql` `P7905` / `production rolling protected catalog changed` und rollen zurück. V8, Fakten, Publikation, Hold und die Erneuerungstabelle bleiben abwesend. Die vier V6-Funktionskörper bleiben auf den Pins oben.

`native-isolated-guard.sql` ist keine Installationsdatei und steht nicht im Manifest. Die Datei ist dieselbe Paketkomposition ohne genau diese zwei markierten Aufrufe, damit die synthetische Abnahme den Guard-Übergang, die Delta-Prüfung und die Rennen ausführen kann. Sie darf nie auf Production laufen. Nach diesem isolierten Commit ist `assert_catalog_v1()` der echte V8-Körper und liefert `P7905`. `require_open_v1()` liefert `P7902` / `bg1 recovery fresh full proof required`. Der Alarm steht auf `unavailable`.

Die Delta-Prüfung nennt Tabellen, Sequenzen, Funktionen, Toast, Indizes, Typen, Constraints, Trigger, Policies und Defaults. Geänderte Altfunktionen dürfen nur im Feld `definition` abweichen. Einzige ausdrückliche Ausnahme: `public.jetnity_source_bound_at_visa_v1(text)` wechselt durch den unveränderten Stage-2-Wrapper von SQL nach PL/pgSQL, samt genau der zugehörigen Sprachabhängigkeit. `relhastriggers` darf nur auf einer Relation kippen, die Ziel eines neuen Fremdschlüssels aus einer genannten Stage-3-Tabelle ist. Interne Fremdschlüssel-Trigger dieser Constraints sind mit ihrem konkreten OID gebunden. Ein regulärer Ausdruck über beliebige Ziffern in einem Katalogschlüssel ist nicht erlaubt.

Das UNIQUE auf `ch_renewal_go_v3.batch_id` wird nach dem wortgleichen Stage-2-Modul und vor dem Delta-Vergleich entfernt, damit zwei Freigaben dieselbe jüngste Charge tragen können. Die Faktzeile bleibt je Charge eindeutig. Der Abgleich sieht die Einschränkung weder vorher noch nachher.

## Native PostgreSQL 17

Befehl, isoliertes Cluster, Benutzer `postgres`, nur Unix-Socket, Version `postgres (PostgreSQL) 17.12`:

`node --import tsx --test lib/readiness/official-truth-at-method-v1/at-stage3-native.test.ts lib/readiness/official-truth-at-method-v1/at-stage3-package.test.ts`

Ergebnis lokal nach diesem Nachzug: 3 Tests, 0 Fehler. Tatsächlich gelaufen:

- Parser: die primäre `ERROR`-Zeile kommt nur aus stderr. Ein späterer `ERROR` zählt nicht. `absent` ist kein boolesches `t`.
- Erneuerungsregeln ohne Hold: Faktversion 83, Replay, falscher Digest, falscher Vorgänger, Ablauf, geänderte Quelle, zurückgesetzte Quelle, unvollständige Charge, DE/FR/ES/IT/IN. Token `AT_STAGE3_RENEWAL_RULES_PASS`.
- Preflight: `publication_count` null, danach 2.
- Echte Probe und echter Commit-Kandidat auf dem synthetischen Parent: beide `P7905`, Rollback, V6-Pins unverändert.
- Fremde Tabelle vor dem Gate: `P7996` / `AT_STAGE3_V6_LIVE_CATALOG_DRIFT`. Leerer Digest und vorhandener V7-Marker: `P7996` mit dem jeweiligen Marker.
- Isolierte Komposition: veränderter `catalog_status_v1`-Körper `P7996` / `AT_STAGE3_V6_PARENT_FUNCTION_DRIFT`. Danach, nach dem Pre-Snapshot, eine fremde Funktion, eine fremde Relation und `GRANT EXECUTE` auf `renew_ch_v1`: jeweils `P7996` / `AT_STAGE3_FOREIGN_CATALOG_DRIFT`, Rollback.
- Dieselbe isolierte Komposition ohne diese Eingriffe committet. Danach echter V8-Assert `P7905`, `require_open_v1` `P7902`, Alarm `unavailable`. Withdrawal-Rehearsal `AT_STAGE3_WITHDRAWAL_ROLLBACK_CLEAN`, Hold 0.
- Zwei gleichzeitige Aufrufe unter dem echten V8-Guard: beide `0`, keine Faktzeile.
- Nach dem markierten Stub: Fakt 83 aus Charge 690. Zwei verschiedene Freigaben auf der jüngsten Charge 692, beide Vorgänger 83, beide Digest von 692. Jede für sich in einer zurückgerollten Transaktion `1`. Gleichzeitig genau `0` und `1` und genau Faktversion 84.
- Withdrawal zuerst, überlappend auf den Advisory-Locks `771112`: Renew `0`, Fakt bleibt 83, Hold 1, Publikation `hold`.
- Renew zuerst gegen Withdrawal auf Charge 693 mit Digest von 693, Vorgänger 84, positive Kontrolle vorher `1`: Renew `1`, Faktversion 85, Hold 1, Publikation `hold`, danach Renew `0`. Kein Deadlock und kein Lock-Timeout als PASS.

Nicht gelaufen und nicht als PASS gewertet:

- Kein Zugriff auf Production oder eine verbundene Datenbank.
- Kein frischer Production-Readback und kein positiver Abgleich des produktiven Katalog-JSON.
- CI dieses Heads steht aus. Der native Test liegt in der bestehenden PostgreSQL-17-Jobfamilie `hosted_v3_native_pg17` / Runner `main`.

## Offene PO-Gates

Installation, jede Production-Faktenerneuerung, juristische Textfreigabe, Datenpublikation und Besucherflag bleiben getrennt. Nur der Release-Chat darf später deployen oder SQL ausführen. Dieses Paket ändert die Oberfläche nicht.
