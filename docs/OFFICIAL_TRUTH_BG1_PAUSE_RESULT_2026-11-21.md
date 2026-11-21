# BG1-Zeitplanpause und Dev-Authcheck – bestätigter Abschluss am 21.11.2026

**Ergebnis: [PR #1269](https://github.com/Jetnity/jetnity/pull/1269) ist um 21:27:06 Uhr Zürich normal gemergt. Der automatische Fünf-Minuten-Zeitplan ist auf Main entfernt; die manuelle Alarmprüfung und ihre strengen Fehlerprüfungen bleiben erhalten.** Der lesende Authcheck verlangt für das exakte Dev-Projekt aktivierte Passkeys; die Production-Erwartung bleibt `false`. Tatsächliche Auth-Einstellungen und Production wurden in diesem Auftrag nicht verändert.

Dieser additive Abschluss ersetzt ausschließlich die früheren Aussagen „Merge durch Dev-Passkey-Check blockiert / Pause noch nicht wirksam“. Das vorherige Production-HTTP-ID-Prüfpaket samt 32 gehashten Lieferdateien, ursprünglichen Belegen und SQL-Manifest bleibt bytegleich erhalten und **vollständig unausgeführt**.

## 1. Owner-Entscheid und tatsächliche Änderung

Der Owner bestätigte den erfolgreichen Gerätetest auf `dev.jetnity.com` im Zusammenhang mit [#1240](https://github.com/Jetnity/jetnity/pull/1240): Dev-Passkeys bleiben aktiviert, Production bleibt deaktiviert. Beauftragt waren nur die Korrektur des Authchecks und anschließend der Merge von #1269. Der Gerätetest ist eine Owner-Angabe; in diesem Auftrag wurde kein neuer physischer Gerätetest ausgeführt. #1240 blieb unangetastet.

Der neue `devAuthPruefkonfiguration`-Wrapper ist ausschließlich für den lesenden Check und den exakten Dev-Ref `yfvbxvijcorffwxbxahl` verwendbar. Er ändert die geklonte Erwartung auf `passkey_enabled=true`; die rohe TOML-Basis, der bestehende Push-Pfad und der Production-Leser bleiben unverändert. Falsche Ziele, unerwartete Rohformen sowie fehlende, falsch typisierte oder deaktivierte Dev-Passkeys werden weiter abgelehnt.

Der erste echte CI-Abgleich mit dem korrigierten Passkey-Wert zeigte zusätzlich eine bestehende Redirect-Abweichung. Eine rein lesende Prüfung der bereits angemeldeten Dev-Dashboardansicht bestätigte exakt drei vorhandene URLs: die beiden bisherigen Adressen und `https://dev.jetnity.com/**`. Ausschließlich der Dev-Lese-Sollwert wurde darauf fest gebunden, mit eigener Herkunft und strikten Tests gegen fehlende, doppelte, zusätzliche oder weiter gefasste Einträge. Kein Auth-Speichern, PATCH, Login oder 2FA. [Exakter Dev-Lesebeleg](https://github.com/Jetnity/jetnity/blob/5ee3684e5b5603adf44db460b6564c727ad9c94a/docs/evidence/bg1-dev-auth-read-expectations-20261121.json).

## 2. CI und normaler Merge

| Nachweis | Tatsächliches Ergebnis |
| --- | --- |
| Geprüfter PR-Head | `5ee3684e5b5603adf44db460b6564c727ad9c94a` |
| Vollständige CI | [44943807444](https://github.com/Jetnity/jetnity/actions/runs/44943807444): **12/12 Actions-Jobs erfolgreich** |
| Merge-Gates | 13/13 Check-Runs erfolgreich, zusätzlicher Vercel-Status erfolgreich, keine offenen Review-Threads; normaler Merge ohne Bypass oder Force |
| Auth / Dev-BG1 | [Auth-Job 136966692078](https://github.com/Jetnity/jetnity/actions/runs/44943807444/job/136966692078): **56 Werte / 244 Schlüssel**, Passkeys true und drei Redirects; Dev-BG1 `current` um 21:00:29 Uhr Zürich |
| Repositorytests | **10.694 bestanden, 0 fehlgeschlagen, 2 bestehende UI-Audits ausgelassen** |
| Tatsächliche CLI-Tests | **14/14 bestanden**, mit isoliertem Auth-Transport in CI |
| Lokale ergänzende Prüfungen | 103 reine Auth-/Konfigurationstests und 10 Workflow-Verträge bestanden |
| Merge-Commit | [`276fe3c4e066ea433cc6bea1c16b7ee90da103a0`](https://github.com/Jetnity/jetnity/commit/276fe3c4e066ea433cc6bea1c16b7ee90da103a0) |
| Eltern des Merges | Main `5bb0d5909e675de09eb6c7659c3132187e66abf9` und geprüfter PR-Head |
| Main-Tree nach Merge | `3105d88873b6dd45dc1b38272c129c5b2a82049f` – exakt derselbe Tree wie der erfolgreich geprüfte Head |

Die lokale CLI-Ausführung war wegen des fehlenden esbuild-Binaries im Offlinecache nicht möglich. Dieser lokale Befund wurde nicht als Erfolg ausgegeben; die echten CLI-Entrypointtests liefen anschließend in der unveränderten vollständigen CI erfolgreich. Die beiden ausgelassenen UI-Audits sind kein UI-PASS. Der Dev-BG1-Befund gilt für den genannten tatsächlichen Prüfzeitpunkt und ist keine Aussage zum aktuellen Production-BG1-Zustand.

## 3. Unabhängiger Main-Readback

Nach dem erfolgreichen Merge wurde Main neu abgerufen. Die YAML-Strukturdifferenz gegenüber dem vorherigen Main besteht ausschließlich im Entfernen von `on.schedule`. `workflow_dispatch`, sämtliche Jobs, Berechtigungen, ARM-/Zielgates und das ausführbare Monitorskript sind unverändert. Workflow-SHA-256: `941bf527fab004d35a6b52441f6557d78d90ac5b17d49a6d85edcbcc699272c5`.

Die neun geschützten Konfigurations-/Laufzeitdateien wurden bytegenau gegen den Main-Ausgangsstand geprüft; die konkrete Liste steht im [JSON-Abschlussbeleg](evidence/official-truth-production-http-allocator-20261121/bg1-dev-auth-schedule-pause-completion-20261121.json). Dazu gehören `supabase/config.toml`, Auth-Schreiber, Production-Leser, allgemeine Auth-Abbildung, unveränderte CI, `vercel.json` und der Alarm-Runner. Automatische Main-Website-Deployments bleiben deaktiviert.

Zusätzlich wurden die jüngsten 30 Schedule-Runs des Repositories über GitHub gelesen. Darunter liegen 14 Runs dieses Alarms; alle sind abgeschlossen und vor dem Merge angelegt. Der jüngste stammt von 21:22:52 Uhr Zürich. Auf dieser gelesenen Seite gibt es keinen laufenden/angeforderten Alarmrun und keinen nach dem Merge angelegten Alarmrun. Das bestätigt keine E-Mail-Zustellung und hebt keine historischen Benachrichtigungen auf; kein Workflow wurde hierfür gestartet, wiederholt oder abgebrochen.

Die Änderung ist im [Gesamtplan auf Main](https://github.com/Jetnity/jetnity/blob/276fe3c4e066ea433cc6bea1c16b7ee90da103a0/docs/JETNITY_GESAMTSTAND_RECONCILIATION_2026-11-18.md) und im [Runbook auf Main](https://github.com/Jetnity/jetnity/blob/276fe3c4e066ea433cc6bea1c16b7ee90da103a0/docs/OFFICIAL_TRUTH_BG1_SCHEDULE_PAUSE_2026-11-21.md) festgehalten; der PR-Abschluss bindet den nun tatsächlichen Merge und Readback.

## 4. Production-Grenze und spätere Wiederaufnahme

In diesem Auftrag gab es **keine Production-Abfrage oder -Mutation, keinen Auth-Push, keine Rollen-/Secretänderung, keine Quellen-/HTTP-/Owneraktion, keine Anmeldung/2FA und keinen Production-Website-Deploy**. Der Production-Passkey-Sollwert bleibt unverändert `false`; der tatsächliche Production-Authzustand wurde nicht erneut gelesen.

Das HTTP-ID-Paket aus `e4bab62e6d0e4e902056d78581128c675da7391c` bleibt unverändert und unausgeführt: **acht SQL-Dateien**, Manifest-SHA-256 **`ef166a30a16cbb9cb6ca33702b51c659f0ce0400668b54d1e6dddbf820086d65`**. Sämtliche 32 bisherigen Lieferdateien wurden bytegenau geprüft. Ein separates Owner-Go steht weiterhin aus, auch für die vorbereitete eng begrenzte Diagnose. Die früheren einmaligen V1-/V2-Gos werden nicht wiederverwendet. Abgelaufene Daten bleiben **„derzeit nicht verfügbar“**.

Die Rückkehr zu `*/5 * * * *` ist im bestehenden Runbook an den späteren BG1-Freigabeabschluss gebunden: Owner-BG1-Freigabe, geklärte/geprüfte Monitorkonfiguration einschließlich des bekannten Credentialfehlers und eine separat autorisierte erfolgreiche manuelle Prüfung. Der strenge Alarm-Runner bleibt erhalten. Die Zeitplanpause verändert keinen internen Production-Cron und erklärt BG1 nicht als freigegeben.

Vollständige technische Bindungen, Quellen-URLs, konkrete Check-Ergebnisse und Grenzen stehen im [JSON-Abschlussbeleg](evidence/official-truth-production-http-allocator-20261121/bg1-dev-auth-schedule-pause-completion-20261121.json).
