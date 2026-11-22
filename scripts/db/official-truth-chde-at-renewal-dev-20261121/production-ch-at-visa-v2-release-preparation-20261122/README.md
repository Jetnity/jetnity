# CH→AT Visum — separates Production-Freigabepaket (22.11.2026)

**V1-PREFLIGHT EINGELÖST, ABER FEHLGESCHLAGEN / NOT INSTALLABLE / NO INSTALL GO.** Die exakt bereits freigegebene Production-Lese-SQL `00-PRODUCTION-PREFLIGHT.READONLY.sql` scheiterte **einmal** mit SQLSTATE `42P01` (`official_v3_at_private.whole_originals_v2` existiert in Production nicht). Keine Daten geändert, kein zweiter Production-Read. `01-PRODUCTION-CATALOG-V2.READONLY.sql` wird nur nach separatem neuem Go auf Production lesend ausgeführt und ist zuvor in Dev schema-tolerant geprüft. Ziel: `qscbgcdmivbbnzrcyegn`, in diesem Auftrag **ein fehlgeschlagener Production-READONLY-Aufruf, null Production-Writes**. Dev: `yfvbxvijcorffwxbxahl`. Featurebranch statt main; keine produktive Freigabe durch Dateipräsenz.

## Warum noch nicht installationsreif?

Die Production-BG1-Kette hat einen anderen installierten Vorgänger als die in Dev erfolgreich geprüften v9–v12-Nachfolger. Ohne eine eigene, frische, genau begrenzte **Production-READ-ONLY-Preflight-Freigabe** kann niemand den richtigen Katalog, die Role-/ACL-Digests und die tatsächlichen installierbaren COMMIT-/Rollback-Bytes sicher binden. Deshalb sind installierbare Production-`COMMIT`- und `ROLLBACK`-Dateien hier bewusst nicht vorhanden. Dev-AAL2 ist nicht Production-AAL2. **Kein Produktiv-Testread ohne gesondertes Go.**

## Gesicherte Inhalte

`SOURCE_SCOPE.json` fixiert nur CH→AT/gewöhnlicher gültiger Schweizer Pass/direkte Einreise/Visumfreiheit mit drei amtlichen Originaleditionen; BMEIA bleibt technisch `changed`.
`DEV_EVIDENCE.md` trennt den wirklichen Dev-Test von dem noch erforderlichen unabhängigen Production-Verfahren.
`00-PRODUCTION-PREFLIGHT.READONLY.sql` wurde einmal versucht und ist **verbraucht/fehlgeschlagen**. Sein Schemafehler und die Nicht-Wiederholung sind in `PRODUCTION_PREFLIGHT_V1_FAILED.md` dokumentiert. `01-PRODUCTION-CATALOG-V2.READONLY.sql` ist die schematolerante, nur in Dev getestete Nachfolgedatei **für ein neues separates Read-Go**, noch niemals gegen Production ausgeführt.
`40-PRODUCTION-POSTCOMMIT.READONLY.sql` und `50-PRODUCTION-VISITOR-READBACK.ROLLBACK.sql` sind nicht ausgeführte spätere Katalog-/`anon`-Readbacks.
`ROLLBACK_PLAN.md` schützt die alte append-only Historie und verlangt für die tatsächlich installierte Production-Fassung ein eigenes, getestetes Rücknahmeskript.
`NATIVE_VALIDATION_PLAN.md` dokumentiert 16 echte positive/negative Abnahmekriterien; fehlende Belege werden nicht als PASS gezählt.
`INSTALL_SPEC.md` und `GO_SCOPE.md` begrenzen den späteren Release ausdrücklich.
`SHA256SUMS` und `MANIFEST.json` binden die **hier vorhandenen** Dateien und den getesteten Dev-Code. Sie sind keine Prüfsummen noch nicht erzeugter Production-Installationsdateien.

## Nächste unabhängige GO-Grenze

Erst nach finalem natürlichen Dev-Quellen-/BG1-/Visitor-Langzeitnachweis: neuer **eng gebundener Production-Read-Only-GO**. Danach neues tatsächliches Production-Katalog-basierendes Installations-/Probe-/Rollback-Paket mit neuen SHA256, voller native QA, externem Review und einem **weiteren getrennten Production-COMMIT-GO**. Bestehender Production-CH→DE-Cycle12 bleibt gesperrt und wird nicht restartet.
