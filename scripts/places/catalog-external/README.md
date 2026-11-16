# Ortskatalog extern fortsetzen

Der Runner wird in dieser Arbeitsrunde nicht gestartet. Keine Datenpakete,
Zugangsdaten oder Einzelreceipts gehören in Git oder in den Chat.

## Ein Befehl für den späteren Operator

Node 22 oder neuer; vollständiges, unverändertes Datenverzeichnis einschließlich
Quellen, Manifesten, Backups, Batches, aktuellen Receipts und offenem Versuch.
`SUPABASE_ACCESS_TOKEN` wird ausschliesslich in der geschützten externen
Prozessumgebung bereitgestellt. `SUPABASE_PROJECT_REF` muss auf das feste
Development-Projekt zeigen. Kein Passwort oder Token im Befehl oder Protokoll.

```sh
node scripts/places/catalog-external/run.mjs --daten-verzeichnis /absoluter/pfad/zum/vollstaendigen-datenverzeichnis --schreiben --entwicklung
```

Der Befehl prüft Ziel, Eingaben, vorhandenen Bestand, Rechte und die aktuelle BG1-Katalogbindung,
löst den gespeicherten unklaren Versuch zuerst durch tatsächliche Rücklesung
auf und setzt bestätigte Blöcke sequentiell fort. Es gibt keinen blinden Retry,
keine Überschreibung bestehender Orte und keinen Production-Modus. CI und
Vercel dürfen keinen Import auslösen. Fehlende oder widersprüchliche Belege
stoppen den Lauf; sie werden nicht als abgeschlossen gewertet.

Zum Schluss entsteht im externen Datenverzeichnis
`external-runner-acceptance.json`. Auf stdout erscheint ausschliesslich eine
kompakte Ergebniszeile. Erst danach folgt die echte Ortsauswahl-/Speicherabnahme
nach der Anmeldung des Owners. Der gemeinsame Quell-/CI-Stand steht in #1212.
