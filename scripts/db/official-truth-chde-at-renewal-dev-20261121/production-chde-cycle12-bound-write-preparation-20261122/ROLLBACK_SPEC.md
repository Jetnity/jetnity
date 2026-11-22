# Rücknahmevertrag — CH→DE Zyklus 12

**Plan ohne SQL-Ausführung. Keine Rücknahme-/Installationsfreigabe.**

## Bereits abgeschlossene Lesephase

Die unveränderte freigegebene Datei endet mit `ROLLBACK`; der neue Schreibvorbereitungsstand verändert keine Datenbank. Es gibt aus dieser Phase keinen produktiven Zustand zurückzunehmen. Eine zusätzliche Leseprüfung wird durch diese Dokumentation nicht erlaubt.

## Spätere native Probe und Installation vor COMMIT

Alle später freigegebenen Objekt-/Katalogänderungen müssen in einer einzigen Transaktion liegen. Jede Abweichung der konkreten Zielbindungen, Rolle/ACL, Vorgängerdefinition oder erlaubten Katalogdeltas bricht vollständig ab. Eine Probe endet mit vollständigem ROLLBACK. Ein HTTP-/Quellen-/Owner-Aufruf ist kein rückrollbarer Bestandteil einer Installationsprobe und bleibt ausgeschlossen. Der existierende HTTP-ID-Zähler wird nicht aufgerufen: Sequenzverbräuche wären nicht transaktional rückrollbar.

Vor einer Installation müssen die tatsächlich rücknehmbaren vorhandenen Definitionen, ihre Owner-/ACL-/Konfigurationshashes und die erlaubten neuen Objekte vollständig gebunden und in der nativen Abnahme geprüft sein. Der aktuelle Read bindet nur seine ausgewählten Metadaten; er ist keine vollständige Datenbanksicherung und beweist keine allgemeine Restore-Fähigkeit.

## Unklare COMMIT-Antwort

Sofort STOP, keine Wiederholung derselben Installation. Zuerst muss ein zuvor separat gebundener und freigegebener Nachread den tatsächlichen Commitstatus feststellen. Kein optimistisches Erneutinstallieren, kein automatisches Ausweichen auf andere Werkzeuge und kein Reset.

## Nach bestätigtem COMMIT, vor Owner-Handlung

Die spätere Schutzdatei bindet den **tatsächlich installierten** Nachfolger und stellt einen überprüften, zunächst geschlossenen Dispatch-/Kundenausgabezustand her. Eine vorherige Funktionsfassung darf nur bei exakt passenden aktuellen und vorherigen Definitionen wiederhergestellt werden. Das ist ein separat geprüfter, additiver Schutz-/Folgezustand; keine pauschale Datenbankrücksicherung.

Der v4-HTTP-ID-Allocator, seine Sequenz, alte und neu vergebene IDs, Cycle12/Dispatch38–46, Quoten-/Versuchshistorien, Archivoriginale und frühere Ownerquittungen bleiben erhalten. Die geschlossene Wiederanlaufschranke darf eine Rücknahme nicht unbeabsichtigt öffnen. BG1 muss den dann tatsächlich entstandenen Folgezustand kennen und natürlich neu vollständig bestätigen.

## Nach echter Owner-Quittung oder neuem Lauf

Die echte Quittung und ein tatsächlich begonnener Quellenversuch sind unveränderliche Ereignisse. Sie werden nicht gelöscht oder nachträglich als nie geschehen dargestellt. Bei Fehlern folgen eine zusätzliche Schutz-/Korrekturentscheidung und geschlossenes Dispatch-Gate. Ein bereits autorisierter einmaliger Neustart wird nicht für einen weiteren Start wiederverwendet.

Die konkreten Schutz-/Rücknahmedateien erhalten erst nach dem offenen Autoritätsgate und der nativen Abnahme ihre endgültigen Bytes und SHA-256. Keine Platzhalterdatei gilt als ausführungsbereiter Rollback.
