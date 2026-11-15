# Official Truth: vollständige Kundenangaben und Dev-Abnahme — 15.11.2026

## Verbindlicher Auftrag

Die aktuelle Owneranweisung und der Live-Stand von PR #1197 haben Vorrang. Ziel ist ein für Besucher nutzbares System bis 30.11.2026, zuerst CH→DE und anschließend ein wiederholbarer Weg für weitere amtliche Quellen. Die 206 recherchierten Ziele bleiben RESEARCH_ONLY. Production, Merge und neue Kosten sind nicht autorisiert; #1198 folgt separat. #1196 wird erst nach freigegebenem #1197-Merge als ersetzt geschlossen.

Diese neue Technical-Lead-Sitzung ist keine Fortsetzung derselben technischen Session. Ausgangspunkt ist Head `209b6a1c13e92cab3218a89ebefa96bdc47041fe`; seine vollständige CI4258/43669434828 besteht mit 10 Jobs (Hosted main und quota getrennt). Dieser Erfolg gilt nicht für nachfolgende Änderungen. Cycle3 bleibt historisch blocked/exhausted mit 0 Veröffentlichungen; seine Originalbelege und die installierte Cycle2-Review bleiben unverändert.

## Umsetzung und Verantwortlichkeit

Root besitzt allein den bestehenden PR-Branch, integriert geprüfte Lieferungen nacheinander und bedient ausschließlich Dev. Datenvertrag/Quellenanbindung und Besucheranzeige entstehen auf eigenen lokalen Branches. Ein weiteres isoliertes Paket ergänzt die notwendige Dev-Schemakompatibilität. Allgemeine Admin-/Produktdateien sowie globale Koordinationsdateien bleiben beim parallelen Produktchat; diese modulbezogene Datei dokumentiert die Architektur-/Roadmapentscheidung des vorliegenden Auftrags.

Kundenumfang: Visum und ETA; Passgültigkeit und freie Seiten; Pflicht-/empfohlene Impfungen und Gesundheitsmaßnahmen; Formularname, Kosten und Betrugswarnung; Gebühren, Rück-/Weiterreiseticket und Geldnachweis; Transit; Minderjährige/Einverständnis; Zoll; Doppelbürger und ID-Alternative; Quellenstand, amtliche Erledigungslinks, aktuelle Änderungen und der Hinweis „Bitte vor der Reise prüfen“. Jede unbestätigte Einzelangabe erscheint als „Derzeit nicht verfügbar“.

Die bestehende kanonische JSONB-/Evidence-/Methoden-/Versionskette wird erweitert. Für mehrere fachlich verschiedene Angaben unter demselben Requirement braucht die neue Kontextrevision stabile informationTopic-/informationItem-Kennungen. Diese gehören zur vollständigen kanonischen Identität; wechselnde Werte, Zeitstempel und Inhalts-Hashes bilden keine neuen Fachidentitäten. Bestehende Kontextrevisionen und Regeln bleiben unverändert. Ein zusätzliches Truth- oder Freigabesystem entsteht nicht. Neue Felder erteilen keine Freigabe zusätzlicher Methoden oder Quellen.

Die Dev-Datenbank erhält einen additiven, exakt an alte und neue Definitionen gebundenen Nachfolger für sechs Shape-/Context-/Subject-Funktionen und den separat gepinnten History-Memo-Fix. Alte Installationsartefakte und BG1-Baselines werden nicht umgeschrieben. Der Nachfolger erhält eine eigene unveränderliche Baseline und vollständige Daten-/Rollen-/Katalogprüfungen. Seine Anwendung folgt erst nach Prüfung; ein fehlendes Live-Ergebnis wird nicht aus lokalen Tests abgeleitet. Production-Artefakte bleiben vorbereitet/UNAPPLIED. Der isolierte Migration-/Runtime-Agent besitzt diese neue Hülle; ein weiterer Agent prüft sie unabhängig. Root integriert und bedient Dev.

## Bereits korrigierter Runtime-Fund

Der unabhängige Review reproduzierte auf `209b6a1c` eine Kollision bei historischem Claim-Replay: nach requires_authority begann die Originalbestätigung einen zweiten MA1-Read, während der spekulative parallele Read die einzige Method-Verbindungslane noch besaß. Der Nachfolger übergibt einen ausschließlich sequenzierenden beforeAuthority-Drain durch Queue → M04 Storage → Selected Claim → Method Authority. Nur dieser historische Zweig wartet auf das tatsächliche Ende des spekulativen Reads und erwirbt danach eine eigene frische Authority. Er übernimmt weder dessen Resultat noch Receipt. Neue Claims behalten parallele unabhängige Reads.

Originale fünf Sekunden, Invocation-Signal, Scope, 30-Sekunden-Tick, Claims, Quoten und SQL-Prüfungen bleiben erhalten. Abbruch und Fristablauf dürfen nach Drain keinen Ersatz-Read oder CAS auslösen. Die noch nicht angewendete Cycle3-Review bindet jetzt alle acht betroffenen Runtime-Dateien einzeln; Cycle2 und seine archivierten Dateien bleiben bytegleich.

Lokal bestätigt: 53/53 gezielte Replay-/Abort-/Deadline-/Weiterleitungstests, TypeScript und Scoped Lint; neue Cycle3-SQL vollständig gegen echte lokale PG17-Historie/Quota geprüft, 30/30 PASS. Die unabhängige reale Factory-Gegenprobe zeigt methodRejected=0 und weiterhin genau einen Claim. Das ist kein Quellen-/Veröffentlichungsnachweis. Vollständige CI des neuen Heads und die Live-Dev-Abnahme stehen bei Anlage dieses Dokuments aus.

## Verbindliche nächste Gates

1. Alle Fehler jedes vollständigen Laufs gemeinsam auswerten, korrigieren und finale CI vollständig grün nachweisen.
2. Passende READY-Dev-Vorschau; normalen Sender kontrolliert pausieren und drainen. Ausschließlich Dev erhält das vollständige additive Paket; seine Prüfung verlangt einen neuen normalen BG1-Folgeproof. Bestehende Zyklen und Fälligkeit bleiben erhalten.
3. Normaler vorhandener UI-Quellenlauf mit echter Veröffentlichung Version ≥6 und Besucherantwort. Keine abgeschlossene Ownerfreigabe wiederholen.
4. Aktuellen BG1, Quota, Originalhistorien und fehlende offene Arbeit lesen; erst dann exakte additive Cycle3-Review ausschließlich in Dev anwenden und Originalreadback bestätigen.
5. Bestehenden Sender wieder aktivieren und normalen Cron ohne manuelles Tick-/Audit-Ersatzsignal laufen lassen. Automatische Source-START-/Publikationskette, nächste Fälligkeit vor Ablauf, nachfolgender vollständiger BG1 und echte vollständige Besucheransicht gemeinsam belegen. Nicht bestätigte Felder bleiben offen sichtbar.

Erst nach tatsächlicher Dev-Abnahme folgt eine kurze gemeinsame Freigabeliste für Merge #1197, Production-Installation und IPv4 ausschließlich falls notwendig. Keine Release-Zusage aus einer bloß grünen Teilprüfung.

## Gebündelte Folgekorrektur nach CI4261

Der vollständige Lauf4261/43671592881 auf `238a2d9e` endete mit sechs erfolgreichen und vier fehlgeschlagenen Actions-Jobs. Der Repository-Job hatte einen veralteten Native-Pin in der AA-Probe; Hosted main hatte fünf veraltete aktive HM04-Pins und brach vor Allocation ab. Diese aktiven Pins und ihre tatsächlichen transitiven Nachfolger werden vollständig aktualisiert; historische Receipts bleiben unverändert. Der Quota-Job überschritt beim letzten Claim des 256-Operations-Grenzfalls die unveränderten fünf Sekunden. Seine anschließenden Zählerfehler und der Aggregatfehler gehören zu derselben vollständigen Fehlergruppe.

Die unabhängige Untersuchung fand eine Sättigung des auf 256 Zustände begrenzten invocation-lokalen Validierungsmemos. Nach Erreichen dieser Grenze wurden neue häufig wiederholte Zustände nicht mehr vorgemerkt und daher wiederholt vollständig validiert. Der vorbereitete Nachfolger erneuert nur diesen begrenzten Memo; jede historische Zeile und jede fachliche Invariante bleiben geprüft. Es entsteht kein persistierter Validierungs- oder Freigabecache. Der vollständige Scan bleibt von der Lebenszeithistorie abhängig; eine bestandene Grenzprüfung ist kein unbegrenzter Dauerbetriebsnachweis.

Die vollständige Anzeige deckte zusätzlich zwei Größenfehler auf: Ein regulärer Besucher-Response für zwei Staatsangehörigkeiten mit 54 Fakten benötigt 128.189 Bytes; ein entsprechender Quellenplan mit 54 Proposals 92.276 Bytes. Die bisherigen globalen 64-KiB-Grenzen verhinderten beide trotz erlaubter fachlicher Anzahl. Getrennte endliche Sammelrahmen erhalten unverändert die Einzelgrenzen von 64 KiB, 8.192 Knoten und 16 Ebenen. Quellen, Identitäten, Ablauf, Privacy, Getter-/Zyklusabwehr und die engere öffentliche CH→DE-Visa-Route bleiben vollständig geprüft. Der neue Legacy-Test bindet weiterhin exakt acht flache Faktenarten; strukturierte Details werden dort ausdrücklich vor I/O verweigert.

Der Quellen-Onboarding-Vertrag liefert ein vollständiges neutrales Länder-/Themeninventar, stabile fachliche Items, geschlossene Originalproposals und eine ausführbare Prüfung mit code-eigenen amtlichen Quellenprogrammen. Ein Plan erteilt keine Methodenfreigabe. Weitere tatsächliche Länder-/Themenveröffentlichungen benötigen weiter ihre reguläre Qualification, Binding und nachgewiesene Quellenkette; die 206 recherchierten Ziele bleiben RESEARCH_ONLY.

Lokaler gemeinsamer Stand vor neuer CI: 167/167 Kunden-/Besucher-/Legacy-/Generatorprüfungen und 71/71 echte PG17-Prüfungen bestanden. Die PG17-Gruppe umfasst die gemeinsame Migration, die gemessene History-Gegenprobe, den frischen Production-Installer und die Cycle3-Review auf dem tatsächlich installierten Customer-/History-Nachfolger nach echtem neuem BG1. TypeScript, Scoped Lint, API-/Schema-/Erreichbarkeits-/Export-/Paketprüfungen sowie alle drei SQL-Compiler und Shape-Fixtures bestanden. Der CLI-Weg Template → Check erzeugt und prüft 52 ausdrücklich nicht verfügbare Slots für DE mit CH/GB, ohne Intake oder Veröffentlichungsrecht. Das sind lokale Belege; Dev ist zu diesem Zeitpunkt unverändert und die neue vollständige CI steht noch aus.
