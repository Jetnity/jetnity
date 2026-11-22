# Paket 1 — AT-Quellenentscheidung und begrenzter Bindungsread, 22.11.2026

**Zur getrennten Prüfung vorbereitet; nichts ausgeführt.** Go-fähig ist die fachliche Entscheidung über drei exakt benannte amtliche Quellenfassungen und anschließend genau ein begrenzter READ-ONLY-Bindungsread. Eine Production-Installation oder Kundenaktivierung ist **noch nicht go-fähig**. AT bleibt nach diesem Paket-Go **„derzeit nicht verfügbar“**.

Dieses Paket ist vom CH→DE-Zyklus-12-Paket unabhängig. Es enthält weder dessen Import-/Owneraktion noch eine allgemeine Production-Freigabe. Grundlage ist Commit `86238b2c34011554c05353ddf6f9f764e92fd6ca` und der zuletzt bereits abgeschlossene [Production-Nachread](OFFICIAL_TRUTH_PRODUCTION_HTTP_ALLOCATOR_OPERATIONAL_READ_2026-11-22.md) vom **22.11.2026, 11:54:53.145099 UTC**. Es wurde kein neuer Live-Zustand behauptet oder abgefragt.

## Welche Quellen und welche Entscheidung?

| Quelle und Aufgabe | Exakt zu prüfende Fassung | Aussage der vorhandenen Belege |
| --- | --- | --- |
| [BMI-Visummatrix](https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html), österreichische Primärquelle für die CH-Visumfrage | Ausgabe 06.11.2026; 498415 Bytes; SHA-256 `fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778` | In den bestehenden Production-Batches 601/602 bytegenau unverändert. |
| [BMI-Einreisegrundlagen](https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html), amtlicher Einreisekontext | 91655 Bytes; SHA-256 `ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e` | In Batches 601/602 bytegenau unverändert; keine zusätzliche Themenfreigabe daraus. |
| [BMEIA / Österreichische Botschaft Bern — Wie stelle ich einen Antrag?](https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/), amtliche Gegenprüfung und Antragskontext | **Neue geprüfte Fassung**, 172428 Bytes; SHA-256 `2521a95cc70490decb12051b28f1e5d208b9429ffb589e2491b34ca110f62cbe` | Der Status bleibt `changed`. Der vollständige Artikel und seine 28 Links sind gegenüber der geprüften alten Fassung unverändert; 19 Asset-Parameter und ein sachfremder ID-Austria-Menülink erklären die gesamte Änderung. |

Die [bereits abgeschlossene BMEIA-Fachentscheidung](OFFICIAL_TRUTH_BMEIA_FACHENTSCHEIDUNG_2026-11-21.md) begründet **keine Änderung einer Einreise-/Pass-/Visumantragsregel in diesen verglichenen Fassungen**. Das macht die neue Fassung zu einem konkreten Qualifikationskandidaten; es macht sie nicht rückwirkend zu einem unveränderten Original.

Die fachliche Entscheidung lautet ausschließlich:

> Schweizer Staatsangehörige benötigen für die direkte Einreise nach Österreich mit gültigem Schweizer Reisepass kein Visum.

Eine Zustimmung bezieht sich auf diese Aussage und diese drei Fassungen. Sie genehmigt keine anderen Pässe, Dokumente, Transitfälle, Aufenthaltsdauern, Arbeits-/Studienrechte, Passgültigkeitsfristen, Gebühren, ETA/Formulare, Impfungen, Versicherungen oder allgemeine Einreisegarantie. Die allgemeinen Bern-Visumantragsunterlagen werden nicht als zusätzliche Pflicht für visumbefreite Schweizer Reisende ausgegeben.

## Was Sasa mit diesem Go tatsächlich freigibt

Der [vollständige Go-Text](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-at-source-qualification-review-20261122/GO_SCOPE.md) ist konkret auf zwei Schritte begrenzt:

1. Die Quellenentscheidung und ihren engen CH→AT-Visumumfang mit den vollständigen drei SHA-256 im Projektprotokoll festhalten.
2. Die unveränderte Datei [00-at-qualification-bindings.READONLY.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-at-source-qualification-review-20261122/00-at-qualification-bindings.READONLY.sql) **genau einmal** auf `qscbgcdmivbbnzrcyegn` ausführen: READ ONLY, ROLLBACK, höchstens eine Transaktion innerhalb von fünf Minuten; die engeren SQL-Grenzen gelten zusätzlich.

Der Read ermittelt die derzeit fehlenden nativen Methoden-/Quittungs-/Visitor-/Quellenbindungen. Er prüft vor dem ersten Projektdatenzugriff die geschlossene Katalogform aller 13 gelesenen Tabellen und ihrer 126 eingebauten Spaltentypen. Die Ergebnisform ist auf eine Zeile und 131072 UTF-8-Bytes begrenzt; die Quellenverknüpfung wird tatsächlich auf höchstens neun Zeilen geprüft. Beide Quellen-Dreierlisten sind geschlossen und eindeutig; Methodenkopf und korrelierter BG1-Join dürfen durch explizite LIMIT-2-Stopps jeweils höchstens eine Zeile liefern. Definierte Funktions-/Ausdruckstexte und GUC-Konfiguration werden nur gehasht ausgegeben. Keine Projektfunktion, HTTP-/Collector-/Publisher-/Import-/Owneraktion wird aufgerufen.

Bei falschem Ziel, SHA-Abweichung, Fehler, unbekannter Form, fehlendem Pflichtobjekt, anderem Parent, doppelten Quellen-/Response-Bindungen, unklarer Antwort oder Überschreitung gilt STOP ohne Retry/Zusatzread. Eine nach einem Fehler noch offene Transaktion darf ausschließlich vollständig zurückgerollt werden. Login/2FA, Rechte-/Rollen-/Secret-Änderung, Kosten, COMMIT/Installation/Fence und Veröffentlichung sind ausgeschlossen.

## Was danach für Kunden sichtbar wird

**Unmittelbar nach diesem Go bleibt AT „derzeit nicht verfügbar“.** Es wird kein Freigabefeld in Production geändert, keine technische MA1-Ownerquittung erstellt und kein neuer Fakt publiziert.

Nach einer **späteren gesondert freigegebenen und vollständig geprüften Aktivierung** kann ausschließlich der bestehende CH→AT-Visumpfad die oben genannte „kein Visum erforderlich“-Auskunft zeigen. Die bestehende CH-Ansicht führt die Österreichische Botschaft Bern als sichtbaren Quellenlink, den Quellenprüfzeitpunkt und den Zeitpunkt der bestätigten Regelprüfung. Der RPC bindet alle drei Quellen, Regelversion und Ablauf. Gültigkeit ist höchstens eine Stunde nach Verifikation und nie länger als 70 Minuten nach der ältesten erforderlichen Quellenprüfung; Methode und neuer vollständiger BG1-Beleg müssen ebenfalls gültig bleiben. Bei Ablauf oder fehlendem Beleg kehrt die Auskunft zu „derzeit nicht verfügbar“ zurück.

Die allgemeine Darstellung für bis zu 50 Passprioritäten belegt keine Freigabe für 50 Pässe. Dieses Paket bringt anderen Pässen und Themen keine neue positive Aussage.

## Warum eine direkte Installation noch fehlt

Die erhaltenen Production-Pins und Originale erzwingen per CHECK und unveränderlicher Historie `research_only=true` und sämtliche Qualifikations-/Legal-/Customerflags `false`. Der aktuelle Publisher sperrt außerdem die geänderte Quellenhistorie seit dem letzten Fakt. Die bisherige Methode bindet die alte BMEIA-Fassung mit 172460 Bytes. Ihre alten Bytes, der tatsächlich erhaltene abweichende Raw-SHA und alle `changed`-Beobachtungen bleiben erhalten.

Deshalb ist ein **neuer append-only Quellen-/Methoden-/Runtime-Nachfolger** nötig: aktuelle vollständige Originale und echte Herkunft, ausdrückliche Qualifikationsgrenze, neue exakt gebundene Methode mit realem Owner-/AAL2-Nachweis, gemeinsame Collector-/Publisher-/Visitor-Bindung und BG1-Nachfolger. Der [technische Änderungs- und Rücknahmeplan](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-at-source-qualification-review-20261122/CHANGE_AND_ROLLBACK.md) legt den Vertrag, die Stopps und die fehlenden Nachweise konkret fest.

Noch offen sind der tatsächlich positive AT-Erneuerungspfad und der isolierte Negativtest mit unveränderter, aber unqualifizierter Quelle. Der frühere Dev-Test verweigerte schon wegen `changed`; er beweist diese beiden Fälle nicht. Erst nach der echten Dev-Abnahme können endgültige Schreib-, Rehearsal-, Nachread- und Sperrdateien mit eigenen SHA-256 vorgelegt werden. In diesem Paket gibt es keine leere oder nur scheinbar gebundene Installationsdatei.

## Dateien und SHA-256

Alle vier paketgebundenen Dateien sind im [MANIFEST.json](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-at-source-qualification-review-20261122/MANIFEST.json) mit UTF-8-Bytezahl und SHA-256 verzeichnet. Das Manifest enthält keinen Selbsthash; dieser Bericht gehört nicht zu seinen gebundenen Dateien.

| Datei | Bytes | SHA-256 |
| --- | ---: | --- |
| [00-at-qualification-bindings.READONLY.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-at-source-qualification-review-20261122/00-at-qualification-bindings.READONLY.sql) | 34083 | `30ff328d1901297b1a76ba3ddabb9ebc6004de95b764ce989e45acc238c9a064` |
| [CHANGE_AND_ROLLBACK.md](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-at-source-qualification-review-20261122/CHANGE_AND_ROLLBACK.md) | 11627 | `a7f6e68925491385a4a39350d5acc10f17502d1e7350e517cf5249cf6474133e` |
| [GO_SCOPE.md](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-at-source-qualification-review-20261122/GO_SCOPE.md) | 3360 | `a87d197eed30a7abbadcc496d48f7aef5600bdc0e4e221c81b8432a329f15b01` |
| [SOURCE_SCOPE.json](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-at-source-qualification-review-20261122/SOURCE_SCOPE.json) | 8753 | `ac6dd050a3bb78bc12ff3308471f36ca5932684a1483673b8abf719fa750003b` |
| [MANIFEST.json](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-at-source-qualification-review-20261122/MANIFEST.json) | 10205 | `a73a433fb7090e59ba53b7f67100417504c2525c87cc79a34d48077c2e0871be` |

Die Ausgangsbindung ist `official_v3_guard_private.bg1_production_http_allocator_v4`, kanonischer SHA-256 `c847d8573ac8f62c2d163fcec7d8f0bde409574bd9ae7319e0bf97d99eb9c0a4`. Dieses Paket ändert sie nicht. Nach einer späteren AT- oder CH→DE-Installation muss das andere Schreibpaket an den tatsächlich entstandenen Nachfolger gebunden werden. Die jetzigen getrennten Gos erlauben kein blindes Übernehmen oder Neuversiegeln eines unbekannten Katalogs.

## Tatsächlich geprüft

Die Paketdateien wurden nur lokal vorbereitet: vorhandene Repository-/Belegeprüfung, JSON-Validierung, feste Byte-/SHA-256-Abgleiche und statische READ-ONLY-/ROLLBACK-/Scopeprüfung. Die unabhängige Scopeprüfung führte zu den Vorab-Formgates, der reinen Hashausgabe und den tatsächlichen Join-/Responsegrenzen. **Keine SQL-Ausführung, keine neue Dev-/Production-Abfrage, kein Quellenabruf, Login, Owner-Schritt, Build, Merge oder Deployment.** Hosted-Syntax-/Runtime-PASS und positive AT-Erneuerung werden nicht behauptet.

