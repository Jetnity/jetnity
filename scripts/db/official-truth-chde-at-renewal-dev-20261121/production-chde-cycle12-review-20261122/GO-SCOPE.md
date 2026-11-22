# Separater Go-Umfang: nur Cycle12-Bindungsread

**Vorbereitet, nicht freigegeben und nicht ausgeführt.** Eine Freigabe dieses Textes gilt nur für den Read. Abschluss, Owner-Schritt und Wiederanlauf bleiben eigenständige spätere Entscheidungen.

## Vollständiger Go-Text

Go für den einmaligen Production-Leseauftrag **PROD_CHDE_CYCLE12_BINDINGS_20261122** auf **qscbgcdmivbbnzrcyegn**, ausschließlich mit der unveränderten Datei **00-cycle12-bindings.READONLY.sql**, SHA-256 **e642250349a993d8f70c805e52e02646d957301ec0e6f8951dbc85d32559535f**, und Manifest-SHA-256 **7110bc2fb5b77638acaf20f35044faddf8e2c91df469c197e35c1a273ae07f1f** aus **PROD_CHDE_CYCLE12_REVIEW_PACKAGE_20261122**.

Genau einmal, höchstens eine Transaktion mit **REPEATABLE READ / READ ONLY** und abschließendem **ROLLBACK**, innerhalb von fünf Minuten; feste SQL-Grenzen von 30 Sekunden Transaktionszeit, 15 Sekunden je Statement, 500 ms Lock-Wartezeit, 20 Sekunden Idle-Zeit sowie genau ein Ergebnisobjekt mit höchstens 262.144 UTF-8-Bytes. Erlaubt sind ausschließlich die im Manifest festgelegten Cycle12-/Dispatch-/CH→DE-Subject-/Queue-/Intake-/Archiv-Hash- und Katalog-/BG1-/Cron-Metadaten sowie Count/Digest der früheren Owner-Quittungen.

Bei Fehler, unbekannter Form, fehlendem Pflichtobjekt, unklarem/trunkiertem Ergebnis, fehlender frischer natürlicher BG1-Vollbestätigung, geänderter Bindung, fehlgeschlagener Zielkorrelation oder irgendeiner Grenze sofort STOP; kein Retry und kein Zusatzread. Insbesondere führen `read_bounds_ok != true` oder `required_function_metadata_present != true` zum STOP. Bei offen gebliebener fehlgeschlagener Transaktion ist nur deren vollständiges ROLLBACK zulässig, keine neue Transaktion.

Keine Production- oder Dev-Änderung, Rehearsal, Installation, HTTP-/Quellen-/Publisher-/Queue-/Owner-/Audit-Aktion, Rollen-/Rechte-/Secret-/Login-/2FA-Änderung, Sequenzaktion, neue Kosten oder Veröffentlichung. Originaltexte, Tokens, Signierschlüssel und persönliche Owner-/Auth-Sitzungsdaten sind ausgeschlossen. Danach ausschließlich auswerten und das weitere gebundene Schreibpaket zur separaten Prüfung vorbereiten; dieser Read gibt weder den geschützten Abschluss noch einen neuen Zyklus frei.

## Hash-Bindung

Die Manifest-Datei bindet alle Ausführungs- und Prüfdateien. Dieser Go-Text nennt deren bereits fertigen SHA und wird deshalb nicht rückwärts vom Manifest gehasht. `SHA256SUMS` prüft zusätzlich Manifest, Go-Text und Bericht ohne Selbstreferenz. Bei jeder Dateiänderung ist dieses Go ungültig.
