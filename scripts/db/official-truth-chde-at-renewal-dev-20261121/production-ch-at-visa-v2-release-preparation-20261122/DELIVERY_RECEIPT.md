# Jetnity CH→AT — Chief of Staff SHA-256-Handoff nach vollständigem Dev-PG17-Schatten-Gesamtlauf

**Status: `CHIEF_OF_STAFF_REVIEW_READY_FULL_DEV_SHADOW_PASS_INSTALL_GO_HOLD`.** Die gebundenen Production-V1-Installations-/Rücknahme-SQL sind **nicht** auf Production ausgeführt worden, keine Production-Leseabfrage in diesem Auftrag, keine Owner/2FA/Passkey-Handlung, keine neuen Rechte/Schlüssel/Kosten. Quellbasis: einmalig genehmigter Production-V1-`pg_catalog`-Snapshot **22.11.2026 21:03:32.563156 UTC**.

## Exakte Dateiprüfsummen für unabhängiges Chief-of-Staff-Review

**Alle 30 SHA-256-Quelldateien vollständig in `MANIFEST.json` und `SHA256SUMS` verzeichnet.** Beide Dateien wurden bytegenau aus GitHub gelesen; die Summenliste stimmt **30/30** exakt mit dem Manifest überein. Vor der letzten Bindung wurden alle neuen/geänderten SQL-Test- und Dokumentdateien über Dev-PG17 im `BEGIN READ ONLY` mit `ROLLBACK` SHA-256- und bytegenau nachgerechnet; die übrigen unveränderten Referenzpfeile behalten ihre bereits unabhängig verifizierten Hashes.

- **`MANIFEST.json`: SHA-256 `fa0625e161ae407356c524553d1f0aff6c1e46524d8d28c4f61a0d4d01554e18`, 12238 Bytes.**
- **`SHA256SUMS`: SHA-256 `34f3721a752df20d0fc55de7639a0cd781369334c1d5c913d5ed842859080a1d`, 6123 Bytes.**
- **Installation `31-PRODUCTION-V1-V2.INSTALL-COMMIT.sql`: `5003a23e8024908737d5b3e34f52cf192c5ba5c9ce256d2ad2db29c107f74612`**.
- **Installations-Probe `30-PRODUCTION-V1-V2.PROBE-ROLLBACK.sql`: `cefcd3654d79d02bb0b7554d5724d36f43cbc5d0e8a32baa82e2cc0bf81c708d`**.
- **Rücknahme `33-PRODUCTION-V1-V2.ROLLBACK-COMMIT.sql`: `cf50526bd7a59050922a364fc3631787a47c15e025c2aa52dcdf8261901c5fa4`**.
- **Rücknahme-Probe `32-PRODUCTION-V1-V2.ROLLBACK-PROBE.sql`: `ee6aeab74f2649878856b8991834b121f09b3784f966c1c5a611d3bd3cbb8507`**.
- **Postinstallations-READONLY `40-PRODUCTION-POSTCOMMIT.READONLY.sql`: `0d5c7cd17dc91cc3b1e10931a7011ba94c119a4ccd23b6a1b9ec82b38272ab25`**.
- **Echter `anon`-Readback `50-PRODUCTION-VISITOR-READBACK.ROLLBACK.sql`: `df35e0d946401a545dca6637a6f28c7840655ebd071a9929c606de6bc4d1caa8`**.
- **Dev-V1-v4-Schatten-Parent `64`: `e86a8247806cab041324b5fcc9bb5bd3b5071e15104740fb1e668357d951b672`**.
- **Dev-v5-Vollinstallations-Schatten `65`: `17f79e5272e0d37435f7dae0637bb7a65b10c2ae5ba4977567b86d77bc2691d4`**.
- **Dev-v4/v5/v6-Gesamtprobe `66`: `5191a38ba11ec8f86abb335260e683eeffb2dfedb7e45628f36b02a4504c3dd1`**, 156178 Bytes.

## Native PG17-Endtest und unabhängiger Readback

- **`64` PASS:** bestehende PG17-V1-Vorgängerkette, alte Quellen im Schattenmodell, eingefrorener BG1-v4-Parent und vorbereiteter exakter SHA-Anker; vollständiges `ROLLBACK`.
- **`65` PASS:** Zusammengesetzte 58-KB-Production-V1-Installations-Sourcebody mit isolierter Namespace-/Cron-/Source-Mapping-Schicht, BG1-v5-`assert_catalog_v1` *wirklich ausgeführt*, sämtliche V2-Relationen/RLS/Quell-Versionierung geschützt, ein neuer vierter Cron im Katalog, **keine positive Antwort ohne neue frische BG1-Generation**; `ROLLBACK`.
- **`66` FULL DEV SHADOW PASS:** Erweitert `65` innerhalb **einer einzigen PG17-Transaktion** um synthetischen frischen BG1-v5-Vollproof im **Schatten**, anschließend echte amtliche, bereits in Dev vorhandene Quell-Bytes/SHA aus genau 3 Originals, CH-Visa-Fakt Version1, `accepted/not_required/visa_exempt` mit 3 Links, IN/DE `unavailable`, Replay fügt keine zweite Faktversion ein; ein absichtlich manipulierter V2-Cron wird vom v5-Guard abgewiesen. Danach derselbe auf Schatten-Namespace umgebundene komplette 20-KB-Rücknahme-Körper, nur neuer V2-Cron entfernt, alle Originale/Fakten/V1-Crons erhalten, CH/IN `unavailable`, v6 braucht erneut frische synthetische BG1-Generation, nach der Prüfung dauerhaft fail-closed. Ergebnis genau `DEV_PG17_V1_BG1_V4_V5_V6_INSTALL_PROOF_POSITIVE_ROLLBACK_FULL_PASS`, kompletter `ROLLBACK`.
- **Unabhängige echte Dev-Nachlese (22.11.2026 22:54:03 UTC):** alle V1/Guard-Fixture-Schemas fehlen, Dev-BG1 generation2455, incident=resumed14, Dev-v12-Katalog exakt, echte MA1-Rev2/Epoch2 weiterhin approved. Keine Production-Änderung.

## Nicht automatisch freigegebene Grenzen

Der **vollständige native, funktionale Shadow-V1/BG1-v4/v5/v6-Integrationstest ist bestanden**, aber die Testdatei `66` enthält eine isolierte Namespace-Umbenennung und einen eigenen Dev-Katalog-/Cron-Schatten; die feste historische Production-SHA-Präflight-Prüfung wurde dort auf die entsprechenden vor Testbeginn authentisch berechneten *Shadow*-Signaturen gebunden. Die **originale unmodifizierte 58-KB-Production-Installation selbst** wurde nie in der tatsächlichen Production-Topologie oder gegen deren realen historischen OID-Katalog durchgeführt; ein echter Production-natürlicher BG1-Proof wurde nicht simuliert oder behauptet. Der Chief of Staff muss Unterschiede zwischen Original und Schatten, BG1-v4-/V5-/V6-CAS, Guards, RLS, historische Quellen, echte Cron-Bindung, Source-SHA-Kadenz, Owner-MA1-Rev2-Production-UI und Rücknahme-Fail-Closed **unabhängig prüfen**. **`CHIEF_OF_STAFF_REVIEW_DONE=false`; `PRODUCTION_INSTALL_GO=false`.**

Ein späterer Production-Probeschritt `30` mit `ROLLBACK` und danach ein separater `31`-COMMIT-/Owner-/Readback-Go brauchen jeweils die ausdrücklich bestätigte Exact-Head-SHA-Grenze des Product Owners. Weder der Chief of Staff noch ein automatisierter Agent darf Production selbst freigeben. CH→DE Cycle12/HTTP-ID-v4-Historie bleibt gesperrt/unverändert.
