# Paket I – Auftrag an den Work-Chat «Jetnity-Aufgabe übernehmen»

Stand nach der Korrekturrunde. Dieser Text ist der Ablauf. Er wird erst ausgeführt, nachdem der Technical Lead den neuen Head von Draft #1323 unabhängig abgenommen hat. Vorher kein Archivlauf.

## Grenzen

- Nur der lokale Rechner. Kein Cloud-Agent, kein CI-Upload, kein Chat mit Rohdaten.
- Original bleibt liegen unter `Jetnity/Official-Truth/Archiv` und wird nur gelesen. Nichts dort schreiben, umbenennen oder neu packen.
- Ausgabe in ein neues privates Verzeichnis ausserhalb jedes Git-Worktrees. Rechte 0700 für Ordner, 0600 für Dateien.
- Bestehendes verschlüsseltes Backup der getrennten Ablage nutzen. Kein neuer Speicher, kein neuer Anbieter, keine neuen Kosten.
- Keine Datenbank, kein Netzwerk, keine Schlüssel, keine Personendaten in den Bericht.
- `import` bleibt `PRIVATE_PAYLOAD_PATH_STOP`. Kein Datenbankimport.
- Paket II und die Oberfläche nicht anfassen. M04/N11 nicht abschwächen.

## Was Work ausführt

1. Den abgenommenen Head von #1323 lokal auschecken. Der Code-Head im Bericht muss diesem Commit entsprechen.
2. Preflight ohne Entpacken. Der Plan nennt den Repack-Pin `6545eb28cdffab00a2c7864626abe602d4df240a477bb28b73fe73f78520744b`, die Größe 2'924'288 Bytes, die CSV- und Tracker-Pins, den Git-Commit und die Digests der vier ausführenden Skripte. Keine Pfade in den Bericht schreiben. Solange kein externer Abnahme-Datensatz genau diesen Commit und genau diese Skript-Digests nennt, endet der Lauf mit `LOCAL_ARCHIVE_RUN_NOT_AUTHORIZED` und öffnet das Archiv nicht. Eine boolesche Markierung oder `--after-tl-acceptance` allein öffnet es ebenfalls nicht. Der Importer-Befehl `prepare` oder `resume` ist kein Ersatz und endet mit `local_gate_required`.
3. Nach der Abnahme des exakten Heads legt der Work-Chat ausserhalb von Git und ausserhalb des Archivordners einen Abnahme-Datensatz an: `gitCommit`, `scriptHashes`, `archiveSha256` des Repacks. `fixture` bleibt falsch. Erst dann liest der eine lokale Ablauf den Repack schreibgeschützt. Er prüft SHA-256, Größe 2'924'288, sichere Pfade, einen sauberen Checkout, CSV-Pin `4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358` und Tracker-Pin `33aba1b3640541c2cabe4ec3e7dd569a6db8ed24ce83ef866ebad9255612c153`. Ein anderer Baum oder `--research-root` ist kein Ersatz. Die temporäre Entpackung liegt neben der privaten Ausgabe und wird danach entfernt.
4. Vorbereitung und Wiederaufnahme laufen unter derselben exklusiven Chargensperre. Die Charge bindet Archiv-SHA, CSV-Pin, Tracker-Pin, den abgenommenen Git-Commit, die vier Skript-Digests, die kanonische Ausgabeidentität und die Zielreihenfolge. Ein Paket oder HOLD ohne Bindung an diese Charge und an das Original wird nicht übernommen. Abweichung ist Stop und überschreibt nichts.
5. Verify unter derselben Sperre. Geprüft werden die Charge gegen den Datensatz und gegen den lebenden Checkout, die Journal-Kette, Paket- und HOLD-Digests einschliesslich HOLD-Grund, und die Zielmenge in ihrer Reihenfolge. Ein Schema-2-Manifest ohne Charge wird abgelehnt. HR und NL bleiben Hold, auch wenn der Index inzwischen gesplittet ist. SO auf K2 nur für AT, ES, GR und NL. Fehlende oder widersprüchliche Struktur wird gehalten, nicht ergänzt.
6. Redigierter Bericht: nur Prüfsummen, Summen, Hold-Gründe und `legalEvidence=0`. Keine Archivbytes, keine lokalen Pfade, keine Regeltexte. Der Product Owner tippt dafür keine Befehle. Der Work-Chat führt diesen einen Ablauf aus.

## Was dieser Stand nicht behauptet

In dieser Korrektur wurde das Original nicht gelesen. `archiveVerifiedThisRun` bleibt falsch, bis Schritt 3 auf dem Mac tatsächlich gelaufen ist. Frei gelieferte Quellenangaben, Digest, Version, Scope, Status oder Textlänge sind kein Rechtsbeleg. Vollständige Profile bleiben 0, solange kein gebundener amtlicher Witness vorliegt.
