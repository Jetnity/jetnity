# Official Truth – HTTP-Antwortvollständigkeit V1

Datum: 2026-11-06 (Europe/Zurich)  
Issue: [#1130](https://github.com/Jetnity/jetnity/issues/1130)  
Produktbezug: [#917](https://github.com/Jetnity/jetnity/issues/917)  
Baseline: `main@f96df4ed91aada41b2b635813396749c4ff44096`, Modus NORMAL.

## Tatsächlich gefundenes Problem

Der vorhandene servereigene offizielle HTTPS-Reader verwirft bei deklariertem `Content-Length` Werte oberhalb der Byte-Obergrenze. Er vergleicht jedoch **nach** dem vollständigen Async-Iterator-Durchlauf die tatsächliche Bytezahl nicht mehr gegen den deklarierten Wert; auch die vom nativen `IncomingMessage.complete` gelieferte Abschlussinformation war bislang nicht konsumiert. Im CH→DE-Test konnte parse5 fehlende letzte HTML-Schliesstags reparieren; aus syntaktisch erfolgreich geparstem HTML allein folgt keine Vollständigkeit der ursprünglichen HTTP-Antwort. Dies ist ein Code-Integritätsproblem und **kein belegter Angriff oder Betriebsvorfall**.

## Implementierter Schutz

`lib/readiness/official-truth-server-owned-retrieval.ts`, genau im bestehenden `hopLesen` nach dem bounded Body-Read und vor der Source-Identity-Auswertung:

- Wenn `Content-Length` gesetzt wurde, muss `body.byteLength === declaredLength` gelten; kürzer und länger wird mit `http_failed` verworfen.
- Wenn der native HTTP-Adapter `framingComplete()` liefert, muss er `true` zurückgeben; `false` oder Ausnahme wird verweigert.
- Bestehende Abbruch-/Cancel-, DNS/SSRF, HTTPS/TLS, Ziel-/Redirect-, Content-Encoding, Medientyp, Bytegrenzen (64KiB Standard, streng gesperrte source-specific 128KiB) und Content-Identity-Prüfungen bleiben unverändert. Keine neue Netzwerk-Library.
- Legacy-Testnaht ohne Länge **und** ohne Callback bleibt für bestehende synthetische Tests verhaltensgleich; der produktive native HTTPS-Adapter liefert den echten `IncomingMessage.complete`-Callback. Dieser Slice behauptet darum keine universelle Garantie für willkürliche injizierte Mock-Transports.

`lib/readiness/official-truth-server-owned-retrieval.test.ts`: vier zusätzliche Varianten (deklariert zu kurz/zu lang, native Abschlussinformation false mit und ohne Content-Length) plus akzeptiertes genaues Byte-/Framing-Paar. Invalides Material darf nicht als Source-Snapshot veröffentlicht werden, der Body-Stream wird sauber abgebrochen.

### R2 – vorhandener Bundesportal-Guard verifiziert angepasst

Die erste vollständige CI für den engeren Drei-Dateien-Slice [42132649298](https://github.com/Jetnity/jetnity/actions/runs/42132649298) war ROT: 7.905 Tests, 7.892 PASS, 11 FAIL, 2 SKIP. Alle 11 Fehlschläge stammen vom bereits bestehenden `lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts`, dessen Test-Fakes **selbst bei korrekt übertragenen HTTP-Antworten immer `IncomingMessage.complete=false` / `framingComplete()=false` meldeten**. Die alte Erwartung für eine zu kurze deklarierte Antwort war lediglich `content_identity_mismatch`, statt ein echter HTTP-Incompleteness-STOP. Ein exakter Git-Blob-Pin des Quellentransport-Moduls ist nach dem absichtlichen neuen Code-Diff ebenfalls erwartungsgemäss invalidiert worden.

R2 erweitert nur das isolierte Test-Harness:
- Bei vollständig gelieferter synthetischer Antwort meldet es `complete=true`; bei gestörtem Stream oder explizit simuliertem falschem Frame weiterhin `false`. Keine Änderung am realen HTTP-Client.
- Eine kürzere empfangene Antwort bei deklarierten 60.000 Bytes wird nun **vor** Source-Identity mit `http_failed` und ohne positive Body-Observation zurückgewiesen.
- Ein neuer BP1-Negativtest liefert explizit `framingComplete=false`; der echte Parser und Server-Owned-Reader müssen fail-closed verweigern.
- Der einzige absichtlich aktualisierte Prüf-Pin ist die überprüfbare Git-Blob-SHA des geänderten `official-truth-server-owned-retrieval.ts`, `463d0c24c4345df01b2ee462b13f3a39cf1196f4`. Alle anderen geschützten Source-/Contract-/Application-Pins, der Quarantäne-/Provider-Hard-off und die Nicht-Erreichbarkeit von öffentlichen App-Routen bleiben unverändert. Dies ist eine **bewusste versionsgebundene Testvertrag-Änderung**, kein Verschweigen des Wächters.

Veränderter Umfang nun vier Dateien (HTTP-Reader, dessen fokussierte synthetische Tests, die aktualisierten BP1-Quarantäne-Regressionstests und dieses Versionsdokument). Vor Merge vollständige native CI auf neuem exaktem Head und erneute Technical-Lead-Sicherheitsprüfung.

## Grenzen

**KEINE** Freigabe einer realen Behördenquelle, keine Aufnahme amtlicher Originalbytes, kein Provenance-Receipt, kein akzeptierter Visa-/Gesundheitsfakt, keine neue Source/Extractor/ApplicationContract-Registry, kein Provider, kein Source GET oder Supabase SQL, keine neue Migration/RLS/Grant/Secret und keine Production-Aktivierung. #917 ursprünglicher Stage1-Plattform-STOP und Stage2 NOT_ATTEMPTED bleiben erhalten; Supportfall laut Owner versendet. #985 Protocol3 samt CHANGES REQUIRED/HOLD und #937 unverändert. Keine Durchführung oder Wiederholung der damals blockierten Sicherheitsprüfung. Keine uneingeschränkte Aussage über alle späteren Datenquellen.

**Abnahme:** vollständige native CI auf exaktem PR Head, unabhängig geprüfter Vier-Dateien-Diff, Code-Review auf Fail-Closed + keine vorhandenen Test-/Produkt-Regressionen. TL allein entscheidet Ready/Merge. Der Test-Pilot PR #1129 ist unabhängig; bei späterer Main-Kollision dessen echten Head und CI frisch nachführen.
