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

## Native PostgreSQL 17

Befehl, isoliertes Cluster, Benutzer `postgres`, nur Unix-Socket, Version `postgres (PostgreSQL) 17.12`:

`node --import tsx --test lib/readiness/official-truth-at-method-v1/at-stage3-native.test.ts`

Ergebnis lokal: 1 Test, 0 Fehler. Darin tatsächlich gelaufen:

- Erneuerungsregeln auf einem Stub-Guard: eine synthetische Freigabe erzeugt Faktversion 83 über der abgelaufenen V2-Version 82; Replay, falscher Digest, falscher Vorgänger, abgelaufenes Go, geänderte und wieder zurückgesetzte Quelle, unvollständige Charge, DE/FR/ES/IT/IN, leeres Publikationsjournal, Hold und ACL verweigern. Token `AT_STAGE3_RENEWAL_RULES_PASS`.
- Echtes Paket bis vor die historische Katalogkette: Parent-Hashes, Reservierung von V7, leeres Journal, unveränderte Cron-Kommandos inklusive CH→DE, `require_open_v1` mit `P7902`, Alarm danach `unavailable`. Token `AT_STAGE3_PACKAGE_PREFIX_APPLIED`.
- Dieselbe synthetische Autorisierung gegen den echten V8-Guard liefert 0 und keine Faktzeile. Token `AT_STAGE3_REAL_GUARD_BLOCKS_SYNTHETIC_RENEWAL`.
- `ROLLBACK` entfernt die Schemas. Token `AT_STAGE3_ROLLBACK_PASS`.
- Der volle Body ruft `assert_catalog_v1()` auf. Die historische Kette läuft und endet mit `production rolling protected catalog changed`. Das ist die Verweigerung des synthetischen Katalogs, kein positiver Production-Abgleich.
- Fehlender Digest: `AT_STAGE3_V6_CATALOG_DIGEST_REQUIRES_FRESH_READBACK`.
- Vorhandener V7-Marker: `AT_STAGE3_V6_PARENT_REQUIRED`.
- Veränderter `catalog_status_v1`-Körper: `AT_STAGE3_V6_PARENT_FUNCTION_DRIFT`.
- Zweites Session: `pg_try_advisory_xact_lock(771112,34)` ist falsch, während die andere Session dasselbe Schloss hält, und danach wahr. `renew_ch_v3` benutzt genau diesen Schlüssel.

Nicht gelaufen und nicht als PASS gewertet:

- Kein Zugriff auf Production oder eine verbundene Datenbank.
- Kein frischer Production-Readback und deshalb kein Commit-Kandidat ausgeführt.
- Kein positiver Abgleich des produktiven Katalog-JSON. Die synthetische Datenbank kann die Production-Digests nicht nachbilden.
- Kein zweiter gleichzeitiger `renew_ch_v3`-Aufruf mit anschliessendem Erfolg. Geprüft ist das Schloss, das diese Funktion nimmt.
- CI dieses Heads steht aus. Der native Test liegt in der bestehenden PostgreSQL-17-Jobfamilie `hosted_v3_native_pg17` / Runner `main`, ohne neuen Job und ohne neue Kosten.

## Offene PO-Gates

Installation, jede Production-Faktenerneuerung, juristische Textfreigabe, Datenpublikation und Besucherflag bleiben getrennt. Nur der Release-Chat darf später deployen oder SQL ausführen. Dieses Paket ändert die Oberfläche nicht.
