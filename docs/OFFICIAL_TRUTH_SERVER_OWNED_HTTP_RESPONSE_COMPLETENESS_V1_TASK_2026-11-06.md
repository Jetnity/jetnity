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

## Grenzen

**KEINE** Freigabe einer realen Behördenquelle, keine Aufnahme amtlicher Originalbytes, kein Provenance-Receipt, kein akzeptierter Visa-/Gesundheitsfakt, keine neue Source/Extractor/ApplicationContract-Registry, kein Provider, kein Source GET oder Supabase SQL, keine neue Migration/RLS/Grant/Secret und keine Production-Aktivierung. #917 ursprünglicher Stage1-Plattform-STOP und Stage2 NOT_ATTEMPTED bleiben erhalten; Supportfall laut Owner versendet. #985 Protocol3 samt CHANGES REQUIRED/HOLD und #937 unverändert. Keine Durchführung oder Wiederholung der damals blockierten Sicherheitsprüfung. Keine uneingeschränkte Aussage über alle späteren Datenquellen.

**Abnahme:** vollständige native CI auf exaktem PR Head, unabhängig geprüfter Drei-Dateien-Diff, Code-Review auf Fail-Closed + keine vorhandenen Test-/Produkt-Regressionen. TL allein entscheidet Ready/Merge. Der Test-Pilot PR #1129 ist unabhängig; bei späterer Main-Kollision dessen echten Head und CI frisch nachführen.
