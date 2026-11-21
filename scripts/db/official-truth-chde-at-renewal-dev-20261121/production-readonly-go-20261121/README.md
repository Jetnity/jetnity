# PROD_READONLY_BASELINE_20261121

**Vorbereitet, nicht ausgeführt; ausdrückliches Production-Lese-Go erforderlich.**

Die verbindliche [Owner-Vorlage](../../../../docs/OFFICIAL_TRUTH_PRODUCTION_READONLY_GO_2026-11-21.md) beschreibt Ziel, Reihenfolge, Zeit-/Datenlimits, Abbruchregeln und Grenzen. [MANIFEST.json](MANIFEST.json) bindet alle16 festen SQL-Dateien sowie die Owner-Vorlage.

Ziel ausschließlich `qscbgcdmivbbnzrcyegn`; maximal16 READ-ONLY-Transaktionen innerhalb5Minuten. Kein Retry und keine Änderung der Dateien nach Go. Erst01, nur bei vollständigem READY weiter02/03, danach ausschließlich durch01 bestätigte optionale Pfade. Bei Fehler, unbekannter Form, Mengen-/Zeitüberschreitung oder fehlender Zielbindung STOP.

Die Dateien sind statisch unabhängig geprüft, nicht in Production oder einer Datenbank ausgeführt. Keine Mutation, Produktfunktion, HTTP-Aktion, Owner-Aktion, Anmeldung/2FA, Sequenzvergabe oder Veröffentlichung ist freigegeben.
