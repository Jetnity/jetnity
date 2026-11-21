# PROD_READONLY_BASELINE_20261121_V2

**Vorbereitet; nicht ausgeführt; separates Production-Lese-Go erforderlich.**

Die [Owner-Vorlage](../../../../docs/OFFICIAL_TRUTH_PRODUCTION_READONLY_GO_V2_2026-11-21.md) und [MANIFEST.json](MANIFEST.json) binden Ziel, alle Dateien, exklusive Kernvariantenauswahl und Stop-Regeln. V1 und dessen tatsächlicher STOP bleiben unverändert.

Ziel ausschließlich `qscbgcdmivbbnzrcyegn`; maximal16 READ-ONLY-Transaktionen innerhalb5Minuten. Es sind17 Dateien gebunden:01,02, genau eine von zwei03-Varianten und höchstens13 Extras. Fehlende optionale Tabellen werden als „nicht vorhanden“ dokumentiert, niemals als0 oder scheinbar gelesener NULL-Wert.

Nur ein frischer erfolgreicher Phase01-Read darf die Variante wählen: Hooks=`ABSENT_RELATION` → `03-core-id-maxima-without-hooks.READONLY.sql`; Hooks=`PRESENT_FIXED` → `03-core-id-maxima-with-hooks.READONLY.sql`. Niemals beide, niemals automatisch wechseln oder wiederholen. Bei Fehler, unbekannter Form, fehlender Pflichtrelation/-spalte oder Grenze STOP. Vorhandene optionale Tabellen benötigen dieselben Form-/Rechteprüfungen.

Keine Produktfunktion, HTTP-/Quellen-/Owneraktion, Rollenänderung, Anmeldung/2FA, Mutation, Sequenzvergabe oder Veröffentlichung. Bisherige Zeiten und Ausgabecaps bleiben bestehen; statische Prüfung ersetzt keine native Datenbankausführung.
