# Official Truth: vollständige Kundenangaben und Dev-Abnahme — 15.11.2026

## Verbindlicher Auftrag

Die aktuelle Owneranweisung und der Live-Stand von PR #1197 haben Vorrang. Ziel ist ein für Besucher nutzbares System bis 30.11.2026, zuerst CH→DE und anschließend ein wiederholbarer Weg für weitere amtliche Quellen. Die 206 recherchierten Ziele bleiben RESEARCH_ONLY. Production, Merge und neue Kosten sind nicht autorisiert; #1198 folgt separat. #1196 wird erst nach freigegebenem #1197-Merge als ersetzt geschlossen.

Diese neue Technical-Lead-Sitzung ist keine Fortsetzung derselben technischen Session. Ausgangspunkt ist Head `209b6a1c13e92cab3218a89ebefa96bdc47041fe`; seine vollständige CI4258/43669434828 besteht mit 10 Jobs (Hosted main und quota getrennt). Dieser Erfolg gilt nicht für nachfolgende Änderungen. Cycle3 bleibt historisch blocked/exhausted mit 0 Veröffentlichungen; seine Originalbelege und die installierte Cycle2-Review bleiben unverändert.

## Umsetzung und Verantwortlichkeit

Root besitzt allein den bestehenden PR-Branch, integriert geprüfte Lieferungen nacheinander und bedient ausschließlich Dev. Datenvertrag/Quellenanbindung und Besucheranzeige entstehen auf eigenen lokalen Branches. Ein weiteres isoliertes Paket ergänzt die notwendige Dev-Schemakompatibilität. Allgemeine Admin-/Produktdateien sowie globale Koordinationsdateien bleiben beim parallelen Produktchat; diese modulbezogene Datei dokumentiert die Architektur-/Roadmapentscheidung des vorliegenden Auftrags.

Kundenumfang: Visum und ETA; Passgültigkeit und freie Seiten; Pflicht-/empfohlene Impfungen und Gesundheitsmaßnahmen; Formularname, Kosten und Betrugswarnung; Gebühren, Rück-/Weiterreiseticket und Geldnachweis; Transit; Minderjährige/Einverständnis; Zoll; Doppelbürger und ID-Alternative; Quellenstand, amtliche Erledigungslinks, aktuelle Änderungen und der Hinweis „Bitte vor der Reise prüfen“. Jede unbestätigte Einzelangabe erscheint als „Derzeit nicht verfügbar“.

Die bestehende kanonische JSONB-/Evidence-/Methoden-/Versionskette wird erweitert. Für mehrere fachlich verschiedene Angaben unter demselben Requirement braucht die neue Kontextrevision stabile informationTopic-/informationItem-Kennungen. Diese gehören zur vollständigen kanonischen Identität; wechselnde Werte, Zeitstempel und Inhalts-Hashes bilden keine neuen Fachidentitäten. Bestehende Kontextrevisionen und Regeln bleiben unverändert. Ein zusätzliches Truth- oder Freigabesystem entsteht nicht. Neue Felder erteilen keine Freigabe zusätzlicher Methoden oder Quellen.

Die Dev-Datenbank erhält einen additiven, exakt an alte und neue Definitionen gebundenen Nachfolger für sechs Shape-/Context-/Subject-Funktionen. Alte Installationsartefakte und BG1-Baselines werden nicht umgeschrieben. Der Nachfolger erhält eine eigene unveränderliche Baseline und vollständige Daten-/Rollen-/Katalogprüfungen. Seine Anwendung folgt erst nach Prüfung; ein fehlendes Live-Ergebnis wird nicht aus lokalen Tests abgeleitet. Production-Artefakte bleiben vorbereitet/UNAPPLIED.

## Bereits korrigierter Runtime-Fund

Der unabhängige Review reproduzierte auf `209b6a1c` eine Kollision bei historischem Claim-Replay: nach requires_authority begann die Originalbestätigung einen zweiten MA1-Read, während der spekulative parallele Read die einzige Method-Verbindungslane noch besaß. Der Nachfolger übergibt einen ausschließlich sequenzierenden beforeAuthority-Drain durch Queue → M04 Storage → Selected Claim → Method Authority. Nur dieser historische Zweig wartet auf das tatsächliche Ende des spekulativen Reads und erwirbt danach eine eigene frische Authority. Er übernimmt weder dessen Resultat noch Receipt. Neue Claims behalten parallele unabhängige Reads.

Originale fünf Sekunden, Invocation-Signal, Scope, 30-Sekunden-Tick, Claims, Quoten und SQL-Prüfungen bleiben erhalten. Abbruch und Fristablauf dürfen nach Drain keinen Ersatz-Read oder CAS auslösen. Die noch nicht angewendete Cycle3-Review bindet jetzt alle acht betroffenen Runtime-Dateien einzeln; Cycle2 und seine archivierten Dateien bleiben bytegleich.

Lokal bestätigt: 53/53 gezielte Replay-/Abort-/Deadline-/Weiterleitungstests, TypeScript und Scoped Lint; neue Cycle3-SQL vollständig gegen echte lokale PG17-Historie/Quota geprüft, 30/30 PASS. Die unabhängige reale Factory-Gegenprobe zeigt methodRejected=0 und weiterhin genau einen Claim. Das ist kein Quellen-/Veröffentlichungsnachweis. Vollständige CI des neuen Heads und die Live-Dev-Abnahme stehen bei Anlage dieses Dokuments aus.

## Verbindliche nächste Gates

1. Alle Fehler jedes vollständigen Laufs gemeinsam auswerten, korrigieren und finale CI vollständig grün nachweisen.
2. Passende READY-Dev-Vorschau; normaler vorhandener UI-Quellenlauf mit echter Veröffentlichung Version ≥6 und Besucherantwort. Keine abgeschlossene Ownerfreigabe wiederholen.
3. Aktuellen BG1, Quota, Originalhistorien und fehlende offene Arbeit lesen; erst dann exakte additive Cycle3-Review ausschließlich in Dev anwenden und Originalreadback bestätigen.
4. Normalen Cron ohne manuelles Tick-/Audit-Ersatzsignal laufen lassen. Automatische Source-START-/Publikationskette, nächste Fälligkeit vor Ablauf, nachfolgender vollständiger BG1 und echte Besucheransicht gemeinsam belegen.
5. Kundenvertrag, additive Dev-Migration, sichere Quellen-Vorbereitung und vollständige Anzeige integrieren und auf dem tatsächlichen Schlussstand erneut prüfen. Nicht bestätigte Felder bleiben offen sichtbar.

Erst nach tatsächlicher Dev-Abnahme folgt eine kurze gemeinsame Freigabeliste für Merge #1197, Production-Installation und IPv4 ausschließlich falls notwendig. Keine Release-Zusage aus einer bloß grünen Teilprüfung.
