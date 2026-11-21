# BG1-Alarm: bestehende Fehlerbelege und kontrollierte Pause

Stand der Nur-Lese-Prüfung: **21.11.2026, 18:03:22 UTC**.

## Konkreter Befund

Die drei letzten hier geprüften Schedule-Runs **44932937908 / 44932392117 / 44931802806** endeten im eigentlichen Monitor-Schritt jeweils mit `monitor_failed / credentials_invalid / generation:null` und Exit **1**. Checkout und Node-Setup waren erfolgreich. Die vollständigen, auf nicht sensible Metadaten begrenzten Einzelbelege stehen in `bg1-alarm-existing-failed-runs-20261121.json`.

Im geprüften Main-Skript wird `credentials_invalid` **vor dem ersten fetch/RPC** zurückgegeben. Diese drei Fehler belegen deshalb keine aktuelle Production-Integritätssperre und auch keinen gesunden Productionstatus. Sie belegen eine gescheiterte Monitor-Voraussetzung. Welcher einzelne Prüfwert ungültig ist, bleibt anhand des knappen Logs offen. Schlüsselwerte wurden weder aus Einstellungen gelesen noch hier gespeichert.

## Ziel der Pause und überprüfter Umfang

Workflow **425511967**: [BG1 Production integrity alarm](https://github.com/Jetnity/jetnity/actions/workflows/official-truth-bg1-five-minute-integrity-alarm.yml).

Die beabsichtigte Actions-Pause deaktiviert **den ganzen Workflow**, also den Zeitplan `*/5 * * * *` und `workflow_dispatch`. Sie ändert weder Production noch YAML, Skript, Secrets, Variablen oder Fehlersemantik. Eine deaktivierte Ausführung ist kein erfolgreicher Gesundheitscheck. Bereits gestartete oder wartende Läufe müssen getrennt anhand des Actions-Status beurteilt werden.

**Der Reviewer hat die Pause nicht ausgeführt oder beobachtet.** Root dokumentiert das tatsächliche Disable-Ergebnis gesondert. Aus diesen Dateien darf deshalb noch kein erfolgreicher Pausenstatus abgeleitet werden.

## Exakte Eingangsgates

Vor dem Credentials-Gate müssen der ARM-Wert `production:qscbgcdmivbbnzrcyegn:integrity-only-v2`, Repository `Jetnity/jetnity`, Ref `refs/heads/main` und Project-Ref `qscbgcdmivbbnzrcyegn` passen. Danach verlangt der Code gleichzeitig:

- Publishable-Key als String mit Regex `^sb_publishable_[A-Za-z0-9_-]{6,3000}$`; die Länge 6–3000 bezieht sich auf den Teil nach dem Präfix.
- GitHub-Token als String mit mindestens 20 und weniger als 1000 Zeichen, ausschließlich `[A-Za-z0-9_-]`.
- Eine Fetch-Implementierung vom Typ `function`.

Mindestens eine dieser drei Bedingungen wurde in den genannten Läufen nicht erfüllt. Weder eine ungültige Eingabe noch ein unbekannter HTTP-/Zustellungsfehler darf durch Exit 0, `continue-on-error` oder eine falsche `current`-Meldung verdeckt werden.

## Wiederaktivierung ohne unbeabsichtigten Productionlauf

1. **Erst ein gesondertes Owner-Go zur Wiederaufnahme** einholen bzw. bestehende ausdrückliche Wiederaufnahmegenehmigung prüfen. Das Go muss die tatsächlichen Production-Lesezugriffe und den wieder laufenden Fünf-Minuten-Zeitplan umfassen. Eine Pause erhält kein automatisches Ablaufdatum.
2. Den dann aktuellen Main-Stand und vorhandene Eingangsgates prüfen. Ungültige Eingaben gezielt klären, ohne Werte in Logs oder Dokumentation auszugeben. Kein neuer Token, Login oder erweitertes Recht ist durch diesen Review genehmigt.
3. Negative und positive Parser-/Zustellungsfälle mit den vorhandenen **Offline-Mocks** prüfen; weder RPC noch echten Kommentar zum Testen erfinden oder auslösen. Die echte Monitor-Fehlersemantik bleibt bestehen.
4. **Wichtig:** Bei unverändertem YAML aktiviert `Enable workflow` auch sofort wieder den vorhandenen Zeitplan. Eine Abfolge „erst nur manuell testen, später den Zeitplan starten“ ist damit allein nicht möglich. Für eine vorgezogene einzelne manuelle Probe wäre zuerst eine separat geprüfte Änderung des Zeitplans/Gates erforderlich.
5. Erst nach dem passenden Go aktivieren und anschließend echte GitHub-Zustands-/Run-Belege prüfen. Ein erfolgreicher Run muss den tatsächlichen Codeausgang erkennen lassen; `current`, `transient`, `deduplicated` und eine neu zugestellte Integritätssperre sind verschiedene Ergebnisse. Unbekannte Fehler bleiben Fehler.

## Warum ein Main-Commit hier mehr bewirken würde

GitHub-main stand bei `ff668f21510cd904dbed9aff64f50cdddeef3e9c`. Dessen `vercel.json` sperrt Git-Deployments von Main; die allgemeine CI wird durch Main-Push/PR trotzdem ausgelöst. Darin liest `Auth-Konfiguration gegen config.toml` über `npm run auth:pruefen` das Projekt aus `secrets.SUPABASE_PROJECT_REF`. Der Workflowtext allein beweist dessen Ziel nicht. Die reine Actions-Pause vermeidet solche zusätzlichen CI-Ausführungen.

Falls später stattdessen nur der Zeitplan aus YAML entfernt werden soll, ist neben der Dokumentation der bestehende Offline-Test anzupassen: Er verlangt derzeit ausdrücklich den Fünf-Minuten-Cron. Manuelle Auslösung und bestehende ARM-/Ziel-/Berechtigungsgates sollen erhalten bleiben; das Produktionsskript braucht für eine solche Pause keine Änderung.

Diese Prüfung löste keinen Workflow aus und führte keinen Production-/Dev-/Datenbankaufruf, keine Anmeldung und keine externe Änderung aus.

