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
2. Preflight ohne Entpacken: der Plan nennt den Repack-Pin `6545eb28cdffab00a2c7864626abe602d4df240a477bb28b73fe73f78520744b`, die Größe 2'924'288 Bytes, die CSV- und Tracker-Pins, den Git-Commit und die Digests der ausführenden Skripte. Keine Pfade in den Bericht schreiben. Der Archivlauf bleibt gesperrt und endet mit `LOCAL_ARCHIVE_RUN_NOT_AUTHORIZED`, auch wenn eine Freigabe-Markierung gesetzt ist, bis ein späterer Technical-Lead-PASS diesen Schritt ausdrücklich öffnet.
3. Nach der Freigabe einmalig den gepinnten Repack lesen. Der Lauf prüft SHA-256, Größe, sichere Pfade, CSV-Pin `4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358` und Tracker-Pin `33aba1b3640541c2cabe4ec3e7dd569a6db8ed24ce83ef866ebad9255612c153`. Ein anderer Baum oder `--research-root` ist kein Ersatz.
4. Vorbereitung und, falls sie abbricht, Wiederaufnahme nur derselben Charge: derselbe Archiv-SHA, dieselben CSV-/Tracker-SHAs, derselbe Code-Head, dieselbe Ausgabe. Abweichung ist ein Konflikt und überschreibt nichts.
5. Verify der privaten Ausgabe. HR und NL bleiben Hold, auch wenn der Index inzwischen gesplittet ist. SO auf K2 nur für AT, ES, GR und NL. Fehlende oder widersprüchliche Struktur wird gehalten, nicht ergänzt.
6. Redigierter Bericht nach #1319: nur Prüfsummen, Summen, Hold-Gründe und `legalEvidence=0`. Keine Archivbytes, keine lokalen Pfade, keine Regeltexte.

## Was dieser Stand nicht behauptet

In dieser Korrektur wurde das Original nicht gelesen. `archiveVerifiedThisRun` bleibt falsch, bis Schritt 3 auf dem Mac tatsächlich gelaufen ist. Frei gelieferte Quellenangaben, Digest, Version, Scope, Status oder Textlänge sind kein Rechtsbeleg. Vollständige Profile bleiben 0, solange kein gebundener amtlicher Witness vorliegt.
