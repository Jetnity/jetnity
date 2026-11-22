# Jetnity CH→AT – Chief-of-Staff-Neuprüfung nach P7905, 23.11.2026

**Status: `CHIEF_OF_STAFF_RECHECK_REQUIRED_P7905_CANONICAL_FIX_INSTALL_GO_HOLD`.** Die neue Paketversion ersetzt die frühere CoS-Freigabe und das am ersten Production-Probeschritt mit `P7905` gestoppte Go. **Keine Production-Installation, kein Retry der alten Probe und kein Production-Rollback.** In dieser Arbeitsrunde erfolgte genau **ein separat bewilligter Production-READ-ONLY-Zugriff** auf die historischen Quelle-/Cron-Prädikate, danach ausschließlich GitHub-/Dev-Arbeit. Es wurden keine Schlüssel, Datenkörper oder personenbezogene Informationen ausgegeben.

## Unabhängig bytegenau geprüfte Lieferidentitäten

**32/32 Quell- und Prüffiles** sind in `MANIFEST.json` mit exakter UTF-8-Dateilänge und SHA-256 verzeichnet und stimmen **vollständig** mit `SHA256SUMS` überein. Sämtliche 32 GitHub-Dateien wurden bei dieser Neufassung in vier Gruppen erneut gelesen; jeweils wurde die SHA-256 und Byteanzahl mittels **Dev PostgreSQL 17, `BEGIN READ ONLY`/`ROLLBACK`**, unabhängig gegen das Manifest geprüft (8/8 + 8/8 + 8/8 + 8/8 PASS).

- `MANIFEST.json` selbst: **SHA-256 `9038c3d2d03421adeee42550a3151f59e5c3fe81951e1c10f6c992c39fb6830d`**, 14029 Bytes.
- `SHA256SUMS` selbst: **SHA-256 `ca7d8b7b17894585d316b53eb1b06e751e578c81a3382e446876462e2ed8ccdf`**, 6575 Bytes.
- **Neue Installation `31-PRODUCTION-V1-V2.INSTALL-COMMIT.sql`**: `44f786089e8f881f34fa5d08e38bfc16367ea6c6d1c6c3743453730bca7cc274`.
- **Neue Production-Rollback-Probe `30-PRODUCTION-V1-V2.PROBE-ROLLBACK.sql`**: `13f3957942ee51cccba650e973a164e782275dccd0ee65a8acd2084397e89ce4`.
- **Unveränderte Rücknahme `33-PRODUCTION-V1-V2.ROLLBACK-COMMIT.sql`**: `cf50526bd7a59050922a364fc3631787a47c15e025c2aa52dcdf8261901c5fa4`; separate 32-Rücknahmeprobe `ee6aeab74f2649878856b8991834b121f09b3784f966c1c5a611d3bd3cbb8507`.
- Readback `40-PRODUCTION-POSTCOMMIT.READONLY.sql`: `0d5c7cd17dc91cc3b1e10931a7011ba94c119a4ccd23b6a1b9ec82b38272ab25`; öffentlicher `anon`-Readback `50-PRODUCTION-VISITOR-READBACK.ROLLBACK.sql`: `df35e0d946401a545dca6637a6f28c7840655ebd071a9929c606de6bc4d1caa8`.
- **Neuer spezialisierter Dev-PG17-P7905-Regressionstest `67`**: `64563071ec7964fb8bfc3f4b0f689fc384bfb0e65c9a502a07a6d60849487168`.
- **Neue Native-Shadow-Volltests `65` und `66`**: `0409ffd5b376dd0f31c46bffeaa26d099c3a8779f434a13b4266630766d0fa3d` / `bf7becda51ec6302fc1c954d4974778522a69454c0f43d3d972b63027ba5ac84`.
- **Wichtig:** Der Installations- und Probelaufbody **30/31 ist bis auf die Endzeile `ROLLBACK` versus `COMMIT` bytegleich**. Der neue Source-Prädikatstext ist die **einzige** Korrektur gegenüber dem früher von Chief of Staff geprüften Installationsbody. Alle anderen Guards, Quellfreigaben, HTTP-ID-v4-Allocator, MA1/Owner-Grenzen, übrigen Pässe und der gesamte BG1-v5-/V6-Adapter bleiben unverändert.

## Eine Production-READONLY-Ursachenprüfung – kein weiterer Production-Zugriff

Echter Befund 22.11.2026 23:17 UTC: Source-Pins und alte Originalzeilen **3/3**, historische Roh-SHA-gültige alte Body-SHA **3/3**, aber alte `raw_sha=pin_original_sha` **2/3**. Die BMEIA-Altquelle wurde bereits von der **bestehenden V1-Monitormethode** ausdrücklich als `unchanged_asset_version_only` archiviert. Die **drei Production Source-Crons sind alle exakt** (Username, DB, Schedule, Command), daher **keine Cron-Änderung**. Der frühere V2-Preflight ignorierte die V1-BMEIA-Sondernormalisierung und verweigerte zu Recht wegen seiner falschen Vorbedingung.

**Neuer CAS-Schutz:** BMI-Originale weiterhin roh exakt; BMEIA nur bei entweder roher Gleichheit oder dem bereits alten V1-Vertrag mit exakt **19** Website-Themen-Timestamps, fest gepinnter `bmeia-theme-assets-v1`-Normalisierung, exakt nachgerechnetem Canonical-SHA, alter unveränderter Bytezahl und SHA-Selbstkonsistenz des echten gespeicherten Körpers. `RESEARCH_ONLY` und nicht juristisch/kundenseitig freigegeben bleibt zwingend. Tatsächlich geänderte neue BMEIA-Quelle bleibt `changed`, keine alte Historie wird manipuliert.

## Vollständige native Dev-PG17-Regression

1. **67 PASS – vollständiges ROLLBACK**: alte authentische Dev-Originalbytes, legitime reine 19-Asset-Änderung erzeugt eine andere Raw-SHA mit identischem Canonical-SHA; genau das in 30/31 verwendete aktuelle V1-Prädikat lässt die zulässige Historie zu. Gleicher Körper mit anderem inhaltlichen Byte, `source_state=changed` oder manipuliertem Freigabestatus werden alle streng gesperrt.
2. **65 PASS – vollständiges ROLLBACK**: gesamter V1/BG1-v5-Installations-Shadow mit **tatsächlich nachgestelltem** BMEIA-Asset-only-Roh-SHA-Unterschied erfüllt weiterhin BG1, Cron-, Quellen- und Default-Closed-Guard.
3. **66 PASS – vollständiges ROLLBACK**: zusammenhängender Dev-PG17-V1-v4/v5/v6-Gesamtlauf mit demselben historischen BMEIA-Fall; nach frischem **synthetischen** Schatten-BG1-Vollproof CH-Visa-Positiv-Fakt und fremde Passfälle negativ; manipulierte V2-Cron wird vom BG1 verweigert; V6-Rücknahme lässt V1-Originale/Cron und V2-Faktenhistorie erhalten und sperrt den Besucher wieder.
4. Unabhängiger Dev-Posttest: Testschemas nicht vorhanden, Dev-v12-BG1-Katalog gleich, natürliche Dev-Generation2461 mit Incident=Resume, echte Dev-MA1-Rev2/Epoch2 unverändert.

**Genauigkeit der Aussage:** Dev verwendet in 65/66 ein isoliertes namespace-gemapptes V1/BG1-Modell mit simulierten V5/V6-Proofs, nicht reale Production-OIDs. Der echte unveränderte Production-Preflight hat die 19-Asset-Canonical-SHA **noch nicht erneut als PASS bestätigt**; dies ist die Aufgabe der **neuen separaten vom PO freizugebenden Probe 30**. Die frühere Probe und der frühere Installations-Go dürfen nicht wiederverwendet werden.

**Nächster Entscheid:** Chief of Staff prüft neue 32 SHA-Dateien/Source-/Cron-Preconditions und Dev-Nachweise unabhängig. Danach legt der Product Owner das **neue** Production-Probe-`ROLLBACK`-Go ausdrücklich fest; nur bei PASS ein **weiteres** neues `31`-COMMIT-Go. Bis dahin **`INSTALL_GO_HOLD`**, keine Owner/AAL2- oder Production-Frontend-Aktivierung durch dieses Paket.
