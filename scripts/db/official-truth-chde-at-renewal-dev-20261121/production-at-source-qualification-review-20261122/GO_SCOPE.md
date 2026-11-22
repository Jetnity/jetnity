# Genaues Go für Paket 1

**Paket:** PROD_AT_SOURCE_QUALIFICATION_REVIEW_20261122  
**Phase:** Fachliche Quellenentscheidung und genau ein begrenzter READ-ONLY-Bindungsread.  
**Noch nicht:** Production-Installation, Methoden-/Quellenmutation, positive Erneuerung oder Veröffentlichung.

## Text zum Freigeben

> Go für Paket PROD_AT_SOURCE_QUALIFICATION_REVIEW_20261122 mit den unveränderten Dateien und SHA-256 des MANIFEST.json. Ich bestätige die drei in SOURCE_SCOPE.json exakt benannten amtlichen Fassungen — BMI-Visummatrix vom 06.11.2026, BMI-Einreisegrundlagen und BMEIA/Botschaft Bern „Wie stelle ich einen Antrag?“ — ausschließlich für die Vorbereitung der Aussage: Schweizer Staatsangehörige benötigen für die direkte Einreise nach Österreich mit gültigem Schweizer Reisepass kein Visum. Die geprüfte BMEIA-Differenz ist für diesen Umfang regelneutral. Andere Pässe und Themen sind nicht freigegeben.
>
> Erlaubt ist anschließend ausschließlich 00-at-qualification-bindings.READONLY.sql genau einmal auf Production qscbgcdmivbbnzrcyegn: READ ONLY mit vollständigem ROLLBACK, höchstens eine Transaktion innerhalb von fünf Minuten und innerhalb aller engeren Zeit-, Tabellen- und Ausgabegrenzen des Manifests. Bei Fehler, falschem Ziel, unbekannter Ergebnisform, fehlendem Pflichtobjekt, geänderter Baseline, unklarer Antwort oder Überschreitung stoppen; kein Retry und kein Zusatzread. Falls nach einem Fehler noch eine Transaktion offen ist, ausschließlich vollständig zurückrollen.
>
> Nicht freigegeben sind Installation/COMMIT/Fence, jede Quellen-/Methoden-/Fakten- oder Rollen-/Rechteänderung, HTTP-/Collector-/Publisher-/Import-/Owneraktion, Sequenzallokation, Login/2FA-/Secret-Änderung, Kosten, Veröffentlichung und das getrennte CH→DE-Paket. AT bleibt nach diesem Go „derzeit nicht verfügbar“. Nach Auswertung ist ein vollständig getestetes und neu gebundenes Schreib-/Ownerpaket mit endgültigen SHA-256 separat vorzulegen.

## Was das Go unmittelbar bewirkt

Die fachliche Entscheidung wird im Projektprotokoll festgehalten und die eine unveränderte SQL-Datei liefert die fehlenden nativen Bindungsmetadaten. Sie markiert keine Datenbankquelle als freigegeben und erzeugt keine technische Owner-Quittung. Der Kunde sieht weiterhin „derzeit nicht verfügbar“. Das Go enthält keine verdeckte Folgefreigabe für die Entwicklungsausführung, eine Production-Installation oder für Zyklus 12.

## Gewünschtes Ergebnis einer späteren, gesondert freigegebenen Aktivierung

Nur CH→AT / Visum / gültiger Schweizer Reisepass / direkte Einreise kann eine bestätigte „kein Visum erforderlich“-Auskunft mit amtlichen Quellen, Prüfzeit und Ablauf erhalten. Voraussetzung sind die neue Quellen-/Methodenlinie, die echten Dev-Nachweise, das eigene Installations-/Owner-Go und ein neuer natürlicher vollständiger BG1-Beleg. Alle anderen Pässe und Themen erhalten aus diesem Paket keine neue positive Auskunft; Ablauf oder unvollständige Belege führen zurück zu „derzeit nicht verfügbar“.

## Unveränderliche Bytes

Die endgültigen SHA-256 sämtlicher zu prüfender Paketdateien stehen im MANIFEST.json. Der Hash dieses Manifests wird außerhalb der dort gebundenen Dateien im Paketbericht angegeben. Weder Manifest noch SQL dürfen nach diesem Go stillschweigend geändert werden.

