# Production-Installationsplan HTTP-ID und Cron-Schutz – 22.11.2026

**Plan zur Prüfung, keine Ausführung und keine neue Freigabe.** Ziel ist ausschließlich `qscbgcdmivbbnzrcyegn`. In dieser Planungsrunde erfolgen weder Production- noch Dev-Datenbankaufrufe. Die normale Installationsreihenfolge lautet **20 → 50**. **40 ist eine getrennte Notfall-Sperre und aktuell nicht ausführbar**, weil ihre Bindung an die tatsächlich committete Installation noch fehlt.

Die [echte Production-Probe 10→11](OFFICIAL_TRUTH_PRODUCTION_HTTP_ALLOCATOR_CRON_REHEARSAL_RESULT_2026-11-22.md) ist bestanden: zwei unveränderte Dateien, 76 Sekunden, vollständiger ROLLBACK und unabhängige Rücklesung. Ihre einmalige Freigabe ist verbraucht. Das Ergebnismanifest hat SHA-256 `4be4d27720d1b95d0692cd53960e5bafbe7afae560a9ff0cc1300cd3ee29bb37`; der gesicherte Ausgangscommit dieses Plans ist `6136b662b0c4227f651d3c41775767edec7de607`. Der letzte unabhängige Production-Status war am 22.11.2026 um 02:47:19.608995 Zürich `current`; dies ist kein neuer Livecheck für diesen Plan.

## 1. Exakte Dateien, Reihenfolge und Freigabegrenzen

| Position | Unveränderte Datei | Ende und Zweck | SHA-256 |
| --- | --- | --- | --- |
| Normal 1 | [20-production-http-id.INSTALL-COMMIT.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/20-production-http-id.INSTALL-COMMIT.sql), 106.669 Bytes | Eine atomare Installation; **COMMIT**. Erst nach separatem ausdrücklich an diese Bytes gebundenem Go. | `1c6919aa7672de029f1c3efa22f26b7d83b7d0d1fb664c5da155a8ea0f783f3f` |
| Normal 2 | [50-production-http-id.POSTCOMMIT-READONLY.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/50-production-http-id.POSTCOMMIT-READONLY.sql), 9.347 Bytes | Nach eindeutig abgeschlossener 20 genau eine unabhängige READ ONLY-Transaktion mit **ROLLBACK**; bestätigt den committeten Zustand und liefert dessen kanonischen Hash. | `cc6fc3738eaf5ddfc7fdee801d96f99abcc6ddb90a10ce58052f45b48039d591` |
| Nur gesonderter Fehlerpfad | [40-production-http-id.FENCE-COMMIT.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/40-production-http-id.FENCE-COMMIT.sql), 35.020 Bytes | **Nicht Teil der normalen Installation.** Sperrt neue erfasste Queue-Einträge mit COMMIT; aktuell fehlende Pflichtbindung, sofortiger STOP vor DDL. | `0f1b65076f4fb8191fc5bff821001fe67b54e3e8b3c1dab1976f6f3fb7a85a98` |
| Vor einer später freizugebenden 40 | [30-production-http-id.FENCE-ROLLBACK.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/30-production-http-id.FENCE-ROLLBACK.sql), 35.286 Bytes | Eigene Probe des später exakt gebundenen Sperrpfads mit ROLLBACK; ebenfalls derzeit ungebunden. | `4535acf918d96f6851cebe4463ed994154fe9d220a1d073384fcb434de0efc44` |

Das [Quellmanifest](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/MANIFEST.json) bleibt unverändert: **`90c439a9f818074f68c6f12c7a2716b947ebc65d9af925f97cc502613e3be024`**. Sein eingefrorener Vorbereitungsstatus wird durch die getrennten Dev- und Production-Ergebnisbelege ergänzt. Er wird weder umgeschrieben noch als selbst erteilte Genehmigung verwendet. Alle 26 darin gebundenen Dateien wurden für diesen Plan lokal verifiziert.

**Die 40-SHA in der Tabelle bezeichnet nur den heutigen ungebundenen Entwurf.** Nach tatsächlichem COMMIT und erfolgreicher unabhängiger 50-Rücklesung muss `expected_successor_sha` aus deren realem `successor_canonical_sha256` eingesetzt werden. Dadurch entstehen neue 30-/40-Dateien und neue SHA-256-Werte; sie werden vor jeder Ausführung erneut vorgelegt. Eine hypothetische oder vor COMMIT ausgegebene Baseline darf diesen Nachweis nicht ersetzen.

## 2. Geplanter Normalablauf nach einem späteren Go

1. **Vor dem Aufruf:** die freigegebenen 20-/50-Bytes nochmals gegen die SHA-256 prüfen und die beiden Aufrufe mit fester Ziel-ID, Zählung, Zeitgrenzen und Stoppregeln protokollieren. Das spätere Go muss 20 mit COMMIT und 50 als unabhängigen READ ONLY-Nachread ausdrücklich erlauben. Die frühere Rehearsal-Freigabe wird nicht wiederverwendet. Es gibt keinen zusätzlichen Production-Vorabread außerhalb dieses Umfangs.
2. **20 einmal ausführen:** Der eingebettete Preflight prüft frische Rechte, unveränderte Funktions-/Katalog-/Transport-/Cron-Bindungen, offenen bisherigen BG1-Schutz und die vorausgesetzte unqualifizierte AT-Lage. Die Queue-, Ledger- und Producer-Barrieren werden vor der frischen ID-Inventur erworben. Jede Abweichung, Sperre, Zeitüberschreitung, unbekannte Form oder unklare Antwort bedeutet STOP, ohne Retry oder Ausweichen auf andere Rollen. Die Datei enthält weiterhin die bekannte negative Publisher-Probe, die exakt 0 liefern muss.
3. **COMMIT-Abschluss belegen:** Das SELECT-Ergebnis `PROD_HTTP_INSTALL_CHECKS_COMPLETE_COMMIT_STILL_MUST_SUCCEED` liegt ausdrücklich **vor** dem COMMIT. Es genügt allein nicht. Die vollständige erfolgreiche Originalantwort und der folgende unabhängige Nachread sind nötig. Bei unklarer COMMIT-Antwort gilt der eigene Fehlerfall unten;20 wird nie blind erneut aufgerufen.
4. **50 einmal unmittelbar danach:** READ ONLY/ROLLBACK, ohne Audit-, Publisher-, HTTP-, Owner- oder Zähleraktion. Die bekannten neuen Funktionsdefinitionen samt Aufruf-/Berechtigungsvertrag werden vor Guard-Aufrufen geprüft. Auszuwerten sind der wirkliche kanonische Nachfolgerhash, die Katalog-/Transport-/Cron-Bindungen, die LOGGED-Sequenz, Helperdefinition und BG1-Metadaten. Der bestätigte kanonische Nachfolgerhash wird als spätere Sperrpfadbindung gesichert.
5. **Betriebsabnahme gesondert:** Unmittelbar nach COMMIT kann BG1 absichtlich noch `unavailable` sein; erst ein neuer natürlicher vollständiger Guardlauf nach `proof_not_before` erfüllt den neuen Schutz.50 kann erfolgreich antworten und trotzdem `fresh_complete_state_run_count=0` melden. Damit darf kein Betriebs-PASS vergeben werden. Für den späteren natürlichen BG1-/AT-/CH→DE-Nachweis werden gesonderte begrenzte READ ONLY-Dateien mit festen Ergebnisgrenzen und neuen Hashes vor ihrem eigenen Go vorgelegt; sie werden durch 20/50 nicht stillschweigend mitgenehmigt.

Ein geplanter einmaliger 20→50-Ausführungsblock soll innerhalb von fünf Minuten liegen. Ein Bestätigungs-/Transportproblem verlängert diese Grenze nicht automatisch. Das anschließende natürliche Beobachtungsfenster ist ein gesonderter Abschnitt; es gibt keinen Polling-Loop und keinen automatischen Wiederholungsauftrag.

## 3. Was Datei 20 dauerhaft ändert

| Objekt/Verhalten | Dauerhafte Änderung nach erfolgreichem COMMIT |
| --- | --- |
| Private Namespace | `jetnity_pgnet_allocator_private`, Eigentümer postgres, Zugriff nur für den Owner auf die neuen eigenen Objekte. |
| Eigener ID-Zähler | LOGGED-Bigint-Sequenz `http_request_id_v1`, `CACHE 1`, `NO CYCLE`; erster Wert **`max(211, aktueller verwalteter Zähler, frisch gesperrtes Maximum aller vier ID-Pfade)+1025`**. Genau 1024 Werte werden als Sicherheitsabstand frei gelassen. 1236 aus der Probe ist keine feste Installationszusage. |
| Helper und Queue-Trigger | Eng gebundener `SECURITY DEFINER`-Helper `assign_request_id_v1()` mit festem Suchpfad und `BEFORE INSERT`-Trigger `jetnity_pgnet_request_id_v1` auf `net.http_request_queue`. Er überschreibt IDs gewöhnlicher Queue-Produzenten aus der gemeinsamen privaten Sequenz. Er betrifft die globale Queue, nicht nur AT. |
| Neuer Schutz-Nachfolger | Neue unveränderliche Tabelle `official_v3_guard_private.bg1_production_http_allocator_v4` mit RLS, Owner-only-Policy und Unveränderlichkeitstriggern. Sie bindet Vorgänger, Allocator, fünf vollständige Cron-Konfigurationen und genau den geprüften einmalig erfassten Nachfolgerkatalog. |
| Vier Guard-/Statusfunktionen | Neue geprüfte Funktionskörper von `catalog_status_v1()`, `assert_catalog_v1()`, `require_open_v1()` und `public.official_v3_guard_alarm_status_v1()`. Die neue Baseline verlangt eine neue natürliche vollständige Generation nach dem Installationszeitpunkt. |
| AT-Publisher | Geprüfter neuer Körper von `official_v3_at_production_private.renew_ch_v1()`: drei qualifizierte Quellen, drei rechtlich/kundenseitig freigegebene Originale und passende tatsächliche Körperhashes sind zwingend, bevor der positive Pfad zugelassen wird. Die Installation erteilt diese Freigaben nicht. |

Alte Baselinezeilen, Historien und Originale bleiben erhalten. Verwalteter Sequenz-Owner/-Default, Cron-Zeitpläne und bestehende Rollen/Berechtigungen werden nicht umgestellt. Die Zugriffsbegrenzungen betreffen nur neu angelegte eigene private Objekte. Alte Default-Auswertung kann bei späteren normalen Requests weiterhin den verwalteten Zähler erhöhen, bevor der Trigger dessen ID ersetzt; Lücken sind kein Fehler und werden nicht durch Zurücksetzen versteckt.

20 verbraucht keine eigenen Probe-IDs und ruft kein HTTP/Wake auf. Nach COMMIT laufen bereits bestehende automatische Prozesse mit dem neuen Trigger weiter. Fehlende AT-Qualifikation und `operator_review_required` bei bestehenden CH→DE-Zyklen werden durch diese Installation nicht aufgehoben. Kein Owner-Resume, Quellenlauf, Retry-Reset oder manuelles Neuöffnen eines Zyklus gehört dazu.

## 4. Dauer und erwartete Unterbrechung

| Abschnitt | Feste technische Grenze / Planungsannahme |
| --- | --- |
| 20-Installation | 25 s pro Statement, 90 s pro Transaktion, 2 s Locktimeout. Die Queue-/Producer-Barrieren können gewöhnliche Produzenten zeitweilig warten oder kontrolliert abbrechen lassen; Unterbrechungsfreiheit wird nicht zugesagt. |
| 50-Nachread | 15 s pro Statement, 20 s pro Transaktion, 500 ms Locktimeout. |
| Spätere 40-Sperre, nur separat gebunden/freigegeben | Ebenfalls 25 s Statement, 90 s Transaktion und 2 s Locktimeout. |
| Erster neuer natürlicher BG1-Beleg | Bestehender Fünfminutenplan; anschließend muss ein vollständiger Lauf innerhalb seiner 30 s-Frist vorliegen. Bei erfolgreichem nächsten Lauf grob bis 5½ Minuten nach COMMIT; ein Fehllauf wird nicht als Erfolg oder zeitliche Garantie ausgegeben. |
| Natürliche AT-/CH→DE-Beobachtung | Als Planung etwa zwei bis drei Fünfminutenzyklen, also 10–15 Minuten zusätzlich zur kurzen Installation; insgesamt etwa 15–20 Minuten bei funktionierenden Gegenstellen und zulässigen Zyklen. Dies ist eine Schätzung, kein zugesicherter Erfolgszeitpunkt. |

Die frühere 10-Rehearsal dauerte 45.638 ms im Connector einschließlich möglicher Bestätigung/Übertragung. Daraus wird keine tatsächliche SQL-Laufzeit oder Installationsdauer abgeleitet. Ein positives rechtliches AT-Ergebnis erhält keinen pauschalen Zeittermin: dafür fehlt derzeit die separate fachliche Quellenfreigabe.

## 5. Fehler- und Rückweg

| Fehlerlage | Konkretes Vorgehen und Grenze |
| --- | --- |
| Fehler vor sicher erreichtem COMMIT | Die atomare 20-Transaktion wird vollständig zurückgerollt; bei Abbruch/Verbindungsverlust erst den tatsächlichen Abschluss belegen. Kein Retry, keine Teilinstallation übernehmen und keine Rechte erweitern. |
| COMMIT-Antwort fehlt oder ist mehrdeutig | **STOP.** Weder „committet“ noch „zurückgerollt“ erfinden.20 nicht wiederholen. Ein gesondert genau begrenzter, freizugebender READ ONLY-Zustandsread klärt die tatsächlich vorhandenen Objekte/Bindungen;50 ist kein universeller Existenzdiagnose-Read für beliebige Zustände. |
| 20 bestätigt, aber 50 fehlerhaft/abweichend | STOP und Belege sichern. Die Installation kann bereits dauerhaft vorhanden sein; die gescheiterte Rücklesung macht keinen Rollback. Keine automatische 40, keine Routine-DROPs und kein Rücksetzen eines Zählers. |
| Nach COMMIT ein konkret eingegrenztes Problem bei ansonsten exakt bestätigtem Normalzustand | Nach realer 50-Bindung neues30-/40-Sperrpaket plus passende unabhängige Sperr-Nachprüfung erstellen, hashen und separat freigeben.30 erprobt die Sperre mit ROLLBACK.40 darf erst mit ihren neuen endgültigen Bytes und eigenem Go folgen. |
| Beliebige Katalog-/Helper-Drift |40 kann selbst verweigern, weil ihre Vorprüfung den exakten installierten Normalzustand voraussetzt. Kein Überspringen oder Aufweichen dieses Checks; gezielt gebundene Diagnose/Vorwärtskorrektur neu vorlegen. |

**Nach COMMIT ist 40 keine Rückkehr zum alten Allocator.** Sie ersetzt nur den neuen Helper durch eine definierte Verweigerung weiterer erfasster gewöhnlicher Queue-INSERTs. IDs und Historien werden nicht zurückgedreht; vorhandene Queue-Einträge bleiben und können weiter ausgeliefert werden. Die Sperre ist keine Storno-API. Sie erzeugt bewusst eine Katalogabweichung; der öffentliche Alarm folgt dem bestehenden natürlichen Audit-/Frischeablauf und ist nicht nachweislich sofort rot. Eine spätere Reparatur und gegebenenfalls Owner-Wiederaufnahme benötigen eigene Freigaben.

**Offene harte Grenze:**40 und 30 enthalten heute `expected_successor_sha=NULL`; sie stoppen vor DDL. Nach einer späteren 40-Sperre ist die aktuelle 50-Datei ungeeignet, weil sie den normalen Helperhash erwartet und absichtlich an der Fence-Definition scheitern würde. Ein eigenständiger exakt gebundener Fence-Nachread fehlt noch. Deshalb liegt hier **kein bereits vollständig ausführbares universelles Notfallpaket** vor. Der erfolgreiche 10-Rollback ersetzt weder diese Commit-Bindung noch einen Post-COMMIT-Fence-/Restore-Nachweis.

Ein Datenbank-Restore wird nicht als einfacher Rückbau zugesagt: Diese Probe hat keine neue aktuelle Sicherung oder erfolgreiche physische Wiederherstellung nachgewiesen; ein Restore könnte zwischenzeitliche Daten verlieren und bedürfte eigener Prüfung/Freigabe. Trigger/Schema entfernen oder alte Sequenzwerte zurücksetzen ist ausdrücklich kein zulässiger Standardrückweg.

## 6. Woran wir danach einen sauberen Betrieb erkennen

| Abnahmeebene | Erforderlicher positiver Nachweis |
| --- | --- |
| Installation technisch exakt |50 bestätigt den real committeten kanonischen Nachfolger; erwartete vollständige Funktionsdefinitionen/ACLs, Katalogbindung, fünf Cron-Konfigurationen und persistente eigene Sequenz stimmen. Keine zusätzliche Rechteänderung oder fremde Objektänderung. |
| Neuer BG1-Schutz | Nach COMMIT natürlich erzeugter `complete`-Lauf, Generation mindestens `required_generation`, tatsächlicher `proof_started_at` nach `proof_not_before`, exakt korrelierte `state_v1`-/`runs_v1`-Daten, Incident/Resume gleich, noch gültiges Frischefenster; **Status current und genau ein passender frischer Vollbeleg**. Kein manuelles Audit oder künstlicher Grünstatus. |
| Natürlicher AT-Transport | Neue zulässige Enqueue-Anfragen aller drei gepinnten Quellen mit eindeutigen IDs mindestens ab dem tatsächlichen Installationsstartwert und über dem historischen Maximum; echte Request→HTTP-Response→Collector-/Watch-Bindung mit passenden Zeiten und tatsächlichem Körperhash; für alle drei Abrufe erwartetes HTTP200, `timed_out=false`, kein Requestfehler und ein zum Ergebnis passender Collectorstatus. Keine Duplicate-Key-/ID-Kollision. Eine geänderte Quelle bleibt `changed` und wird nicht automatisch umqualifiziert. |
| Zulässiger CH→DE-Ablauf | Natürlicher Dispatch→verifizierte HTTP-Antwort→richtiger Zyklusabschluss; korrekte IDs/Attempts/Quoten und Erhalt der vorherigen Historie. Ein vorhandener gesperrter `operator_review_required`-Zyklus muss gesperrt bleiben, bis sein eigener erlaubter Abschluss-/Ownerpfad greift. |
| Fachliche AT-Wahrheit | Unqualifizierte/geänderte/unfreigegebene Quellen erzeugen keine positiven Fakten; abgelaufene Angaben bleiben **„derzeit nicht verfügbar“**. Eine positive AT-Auskunft verlangt separat geprüfte Quellen-/Original-/Freigabebelege und ist kein Ergebnis allein dieser ID-Reparatur. |

**Ein Cronlauf mit `succeeded` reicht nicht.** Ebenso erklärt 50 ausdrücklich `natural_http_operational_proof_performed_by_this_query=false` und `positive_source_renewal_proven=false`. Für die Transport- und fachlichen Zeilen dieser Tabelle braucht es daher die oben genannten gesonderten echten Belege; andernfalls lautet das Ergebnis nur „Installer korrekt, Betriebs-/Quellenabnahme noch offen“.

## 7. Entscheidung, die dieser Plan ermöglicht

Zur Prüfung stehen die unveränderten 20-/50-Dateien für die technische Installation und unmittelbare Rücklesung.40 wird dabei nicht mit ausgeführt. Der spätere natürliche Betriebsnachweis sowie ein real gebundener und geprüft rückgelesener Sperrpfad sind gesondert vorzubereiten; fehlende Bindungen werden nicht durch eine pauschale Freigabe ersetzt. Bis zu einem neuen konkreten Go wird keine der Dateien aufgerufen.

[Geprüfte Eingaben und offene Bindungen](evidence/official-truth-production-http-allocator-install-plan-20261122/plan-inputs.json), [unabhängige Planprüfung](evidence/official-truth-production-http-allocator-install-plan-20261122/independent-plan-review.json) und [Planmanifest](evidence/official-truth-production-http-allocator-install-plan-20261122/plan-manifest.json) dokumentieren die lokale Prüfung. Der [Gesamtplan vor diesem Installationsplan](evidence/official-truth-production-http-allocator-install-plan-20261122/overall-plan-before-install-plan-6136b662.md) bleibt bytegleich erhalten. Die SQL-Dateien und sämtliche bisherigen Rohbelege werden nicht verändert.
