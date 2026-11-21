# BG1: ausschließlich den Actions-Zeitplan pausieren

**Datum:** 21.11.2026. **Änderungsumfang:** ausschließlich die automatische Zeitsteuerung; manuelle Ausführung und strenge Alarmprüfung bleiben erhalten. Ausgangsstand: `ff668f21510cd904dbed9aff64f50cdddeef3e9c`. Der enthaltene Workflow hat nur noch `workflow_dispatch`. Der betriebliche Pausenbeginn ist an seine tatsächliche Integration auf `main` und deren unabhängigen Readback gebunden.

## Grund und konkrete Änderung

Der Owner hat die Pause des Fünf-Minuten-Zeitplans angeordnet. Die drei nachfolgend geprüften vorhandenen Actions-Läufe endeten im Monitor-Schritt mit `{"status":"monitor_failed","code":"credentials_invalid","generation":null}` und Exit **1**:

| Vorhandener Run | Start UTC am 21.11.2026 | Befund |
|---|---|---|
| [44932937908](https://github.com/Jetnity/jetnity/actions/runs/44932937908) | 17:58:33 | `credentials_invalid`, Exit 1 |
| [44932392117](https://github.com/Jetnity/jetnity/actions/runs/44932392117) | 17:52:18 | `credentials_invalid`, Exit 1 |
| [44931802806](https://github.com/Jetnity/jetnity/actions/runs/44931802806) | 17:45:43 | `credentials_invalid`, Exit 1 |

Im damaligen Main-Skript wird dieser Fehler vor dem ersten RPC-Aufruf zurückgegeben. Welche einzelne Eingangsvoraussetzung ungültig ist, ergibt sich aus dem knappen Log nicht. Die Runs beweisen weder eine Production-Integritätssperre noch einen aktuellen gesunden Productionstatus. Die Fehler bleiben als Fehler erhalten.

In `.github/workflows/official-truth-bg1-five-minute-integrity-alarm.yml` werden ausschließlich die beiden aktiven `schedule`-/Cron-Zeilen entfernt. `workflow_dispatch`, ARM-Wert, Zielbindung, Berechtigungen, Umgebungsvariablen und sämtliche Job-/Skriptprüfungen bleiben unverändert. Die beiden bereits vorhandenen Offline-Vertragstests verlangen nun die weiterhin verfügbare manuelle Auslösung und das Fehlen eines aktiven Zeitplans.

Die automatische Freigabeprüfung hat das vollständige **Disable workflow** abgelehnt, weil dadurch auch die manuelle Auslösung gesperrt würde. Diese Deaktivierung wurde nicht ausgeführt. Die engere YAML-Änderung erhält den manuellen Weg und verändert keine Production-Datenbank, keinen internen BG1-Cron, keine Credentials und keine Website.

## Integration und Nachweis der Pause

Die Pause wird erst wirksam, wenn diese Änderung über den normalen, separat geprüften Integrationsweg auf dem tatsächlichen Defaultbranch `main` angekommen ist. Der Technical Lead übernimmt die normale PR-/CI-/Integrationsprüfung und hält den tatsächlichen Main-Commit im Ergebnisbeleg fest. Die Pause selbst erfordert keinen manuellen Workflowlauf. Die offenen PRs #1266, #1268 und #1240 werden nicht verändert und keine Legacy-Key-Änderung wird mit übernommen.

Nach Integration sind die Main-Datei und der Actions-Verlauf unabhängig zu lesen. Bereits zuvor eingeplante oder laufende Ausführungen sind dabei getrennt zu berücksichtigen. Eine vorbereitete Datei, ein übersprungener Job oder das Ausbleiben eines einzelnen geplanten Laufs ersetzt diesen Nachweis nicht. Ein manueller Production-Aufruf bleibt auch während der Zeitplanpause an ein gesondertes Owner-Go gebunden.

## Kontrollierte Wiederaktivierung

1. Der Owner gibt die BG1-Wiederaufnahme ausdrücklich frei. Die Ursache von `credentials_invalid` muss bekannt und die passende Credential-Reparatur separat geprüft sein; keine Rohwerte in Logs oder Dokumentation ausgeben.
2. Die konkrete **echte manuelle Production-Leseprobe** wird in das spätere BG1-Go aufgenommen und danach über den erhaltenen `workflow_dispatch` auf dem dann aktuellen Main-Stand geprüft. Tatsächlichen Status, Transport-/Antwortprüfung und gegebenenfalls Zustellung festhalten; keinen Integritätsvorfall erfinden und unbekannte Fehler nicht in Erfolg umdeuten.
3. Die vom Owner bereits beauftragte automatische Wiederaufnahme erfolgt nach diesen Belegen als Teil des BG1-Freigabeabschlusses: Dann werden `schedule` und der ursprüngliche Cron `*/5 * * * *` in einem eigenen geprüften Änderungsschritt wieder aufgenommen. Der Workflow-Vertragstest ist gleichzeitig auf diesen erneut freigegebenen Zustand umzustellen.
4. Nach normaler Integration einen tatsächlich geplanten Lauf unabhängig prüfen und das Ergebnis dokumentieren. Es gibt kein automatisches Ablauf- oder Wiederaktivierungsdatum für die Pause.

## Lokale Validierung

Die erste isolierte Prüfung bestand mit **7/7 Tests**. Die vollständige CI von Head `b61bb8a9d65b417cd7f63e086249f10db7d1fe48` fand danach noch den zweiten alten Cron-Vertrag in `lib/readiness/official-truth-product-v3/guard/bg1-v3-five-minute-alarm-native-contract.test.ts`: Repository-Tests **10.636 bestanden, 1 Fehler, 2 übersprungen**; der Fehler verlangte genau den jetzt beauftragt entfernten Cron. Dieser Befund bleibt erhalten und wurde nicht übersprungen.

Auch dieser bestehende Vertrag verlangt nun ausschließlich die beauftragte Zeitplanpause und weiterhin manuelle Auslösung; seine übrigen Key-, Owner-, Ziel- und Berechtigungsprüfungen bleiben unverändert. Danach tatsächlich ausgeführt: `node --experimental-strip-types --test lib/readiness/official-truth-product-v3/guard/bg1-v3-five-minute-alarm-native-contract.test.ts scripts/official-truth-bg1-five-minute-integrity-alarm.test.mjs` – **10 Tests bestanden, 0 Fehler** auf lokalem Node 24.22.3. `git diff --check` war ebenfalls erfolgreich. Die HTTP-Antworten dieses Tests stammen aus lokalen Mocks; dies ist kein echter Productiontest und ersetzt nicht die erneut erforderliche vollständige Exact-Head-CI. Das ausführbare Produktionsskript bleibt unverändert; diese Vorbereitung enthält keinen neuen Production-/Dev-RPC, keine Secrets- oder Variablenänderung und keine Verkürzung weiterer CI-Gates.
