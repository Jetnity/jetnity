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

## Review-Nachzug 4b0cdbe7

Der Technical Lead hat den ersten Head mit NO-GO belegt. Der korrigierte Stand:

- Der Preflight zählt das Publikationsjournal per dynamischem SQL. Auf einem isolierten V6 ohne Stage-3-Tabelle ist `publication_count` null; mit zwei Zeilen ist es 2. Beides auf PostgreSQL 17.12 gelaufen.
- Vor jedem DDL vergleicht der Installer den lebendigen `catalog_status_v1()` mit dem gespeicherten V6-Katalog. Danach sind nur die Stage-3-Objekte, die vier ersetzten Funktionskörper und interne Fremdschlüssel-Trigger erlaubt. Fremder Drift bricht mit `P7996` / `AT_STAGE3_V6_LIVE_CATALOG_DRIFT` oder `AT_STAGE3_FOREIGN_CATALOG_DRIFT` ab. Der exakte Production-Katalog bleibt ein Release-Gate: `assert_catalog_v1()` auf der synthetischen Datenbank liefert `P7905`.
- `renew_ch_v3` und der Withdrawal nehmen `771112,1`, dann `771112,2` (Legacy-Publisher), dann `771112,34`. Der Hold wird nach dem Schloss und noch einmal unmittelbar vor dem Insert geprüft.
- Zwei gleichzeitige `renew_ch_v3` derselben Autorisierung erzeugen genau eine Faktversion 83. Zwei verschiedene Autorisierungen mit demselben Vorgänger erzeugen höchstens eine weitere monotone Version. Ein Rennen von Renew und Withdrawal endet ohne Deadlock; danach liefert Renew 0 und der Hold bleibt.

## Native PostgreSQL 17

Befehl, isoliertes Cluster, Benutzer `postgres`, nur Unix-Socket, Version `postgres (PostgreSQL) 17.12`:

`node --import tsx --test lib/readiness/official-truth-at-method-v1/at-stage3-native.test.ts`

Ergebnis lokal nach dem Review-Nachzug: 1 nativer Test und der Paketvergleich, 0 Fehler. Tatsächlich gelaufen:

- Erneuerungsregeln ohne Hold: Faktversion 83, Replay, falscher Digest, falscher Vorgänger, Ablauf, geänderte Quelle, zurückgesetzte Quelle bei weiterhin qualifizierter letzter Charge, unvollständige Charge, DE/FR/ES/IT/IN. Ein sauberer Folgebatch erneuert; derselbe Batch mit Hold ergibt 0. Token `AT_STAGE3_RENEWAL_RULES_PASS`.
- Preflight auf isoliertem V6: `publication_count` null. Danach mit zwei Zeilen: 2.
- Die Datei `production-stage3.ROLLBACK-PROBE.sql` läuft auf dem isolierten V6, dessen gespeicherter Katalog dem lebendigen `catalog_status_v1()` entspricht, und endet mit `AT_STAGE3_ROLLBACK_PROBE_CLEAN`. V8 ist danach abwesend.
- Fremde Tabelle, leerer Digest, vorhandener V7-Marker und veränderter `catalog_status_v1`-Körper: jeweils `P7996` mit dem genannten Marker. Kein pauschales `42P01`.
- `assert_catalog_v1()` nach dem isolierten Commit: `P7905`.
- `production-stage3.WITHDRAWAL-REHEARSAL.sql` nach dem isolierten Commit-Kandidaten: `AT_STAGE3_WITHDRAWAL_ROLLBACK_CLEAN`, Hold-Zähler 0, V8 bleibt.
- Zwei Sessions, dieselbe Autorisierung: genau eine Faktversion 83. Zwei Autorisierungen, derselbe Vorgänger: höchstens eine weitere monotone Version. Renew gegen die Withdrawal-Datei: kein Deadlock, danach Renew 0, Hold vorhanden.

Nicht gelaufen und nicht als PASS gewertet:

- Kein Zugriff auf Production oder eine verbundene Datenbank.
- Kein frischer Production-Readback und kein positiver Abgleich des produktiven Katalog-JSON.
- CI dieses Heads steht aus. Der native Test liegt in der bestehenden PostgreSQL-17-Jobfamilie `hosted_v3_native_pg17` / Runner `main`.

## Offene PO-Gates

Installation, jede Production-Faktenerneuerung, juristische Textfreigabe, Datenpublikation und Besucherflag bleiben getrennt. Nur der Release-Chat darf später deployen oder SQL ausführen. Dieses Paket ändert die Oberfläche nicht.
