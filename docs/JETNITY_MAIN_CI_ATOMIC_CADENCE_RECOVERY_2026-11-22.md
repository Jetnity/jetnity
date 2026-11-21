# Main-CI: echter BG1-Takt im isolierten Atomic-Claim-Test

Stand: 22. November 2026, Europe/Zurich. Eng begrenzter Test-Harness-Fix;
PR-/Merge-/Main-Ergebnisse werden im zugehörigen PR fortgeschrieben.

## Auftrag und Reihenfolge

Der Owner priorisiert den roten Main-Lauf nach #1274: Ursache beheben, eigene
PR-CI vollständig bestehen, normal mergen und danach den neuen Push-Lauf auf
`main` vollständig prüfen. **Nach diesem notwendigen CI-Fix erfolgt in diesem
Arbeitsstrang kein weiterer Merge, bevor #1272 gemergt ist.** #1272 und #1240
werden hier weder geändert noch gemergt. Maximal drei offene PRs bleiben bindend.

Die Profile-Cron-Korrektur ist vor PR/Commit/Hosted-SQL eingefroren. Der aktive
AT-Enqueue-Job und sein HTTP-ID-Konflikt bleiben bei Hauptplan 97. Die bereits
geplante, rein lesende Small-Speicherbeobachtung läuft separat weiter; daraus
folgen keine automatische Konfigurationsänderung, Kosten oder Upgrade-Freigabe.

## Tatsächlicher Fehler

Ausgangs-Main ist der Merge von #1274. Dessen
[Push-Lauf 44957188431](https://github.com/Jetnity/jetnity/actions/runs/44957188431)
scheiterte im
[Hosted-PG17-main-Job](https://github.com/Jetnity/jetnity/actions/runs/44957188431/job/137007791682):
279 von 280 Tests bestanden. Ausschliesslich `customer atomic claim real PG17
complete transitions, replay, quotas and three full history scans` scheiterte.
Der Sammelcheck wurde dadurch ebenfalls rot; alle anderen Ausführungsjobs waren
erfolgreich.

Der native Fehler entstand am **21.11.2026 um 22:35:30.083 UTC** im Fall
`actual START settles once with exact original backoff envelope and replay`:
`require_open_v1 → begin_component_v1 → begin_jobs_v1` meldete
`bg1 integrity unavailable`. Die Testdauer war 56,708 Sekunden, also kein Ablauf
des unveränderten 180-Sekunden-Testlimits.

`checkAtomicClaimNative()` eröffnete die komplette Folge bisher mit genau einem
echten `audit_v1()`. Der wiederverwendete socketfreie PG17-Backendprozess besitzt
keinen Cronworker. Der Guard behält seine echte Grenze von fünf Minuten plus
30 Sekunden; ein Audit spät im Slot gibt der gesamten Folge deshalb nur noch
wenige Sekunden Reserve. Der Fehler liegt genau 83 ms hinter der betreffenden
Grenze. Dies ist eine fehlende Taktpflege in der isolierten Testumgebung, kein
Production-Aufruf und kein Beleg für einen Production-Speicherfehler.

Der historische Fehler nach #1270 war ein anderer: Im
[damaligen Hosted-main-Job](https://github.com/Jetnity/jetnity/actions/runs/44940111927/job/136955227157)
bestanden 280/280 Tests einschliesslich Atomic Claim. Die separate Auth-Prüfung
meldete damals eine abweichende Dev-Passkey-Konfiguration; sie wird hier nicht
geändert.

## Korrektur und erhaltene Grenzen

Nur `scripts/db/official-truth-v3-customer-information-1/atomic-claim-native.ts`
ändert ausführbaren Code. Es verwendet nun den bereits vorhandenen
`historyGuardCadence` vor jedem vollständigen Einzelfall, ausserhalb von
Transaktion, API-Zeitmessung und Fehler-Injektion. Ein neuer fälliger Slot führt
den vollständigen echten Audit aus. Derselbe Slot wird nicht künstlich erneuert;
ein bereits abgelaufener oder nicht freigegebener Guard wird weiterhin abgelehnt.

Ein Audit darf legitimerweise Zertifikate und deren Historie ändern. Deshalb
wird der vollständige Vorher-Digest pro Einzelfall **nach** der Taktzulassung
aufgenommen und nach dessen Rollback exakt verglichen. Keine Tabelle entfällt
aus diesem Vergleich. Alle 40 positiven und negativen Fälle, originale
Übergangstexte, Replay-/Rollback-Prüfungen, Quoten, Rollen und die drei
vollständigen History-Scans bleiben erhalten. API-Budget fünf Sekunden,
Audit-Budget 30 Sekunden und Testlimit 180 Sekunden bleiben unverändert.

Kein Runtime-SQL, Migration, BG1-Katalog, Schutz-Gate, Workflow, Rollenrecht,
Production-/Dev-Projekt, Login, 2FA oder Passkey wird geändert. Es gibt keinen
Retry als Ersatz für eine fehlgeschlagene Prüfung und kein Abschwächen von Gates.

## Lokale Evidence und unabhängiges Review

Der originale einzelne Atomic-Claim-Test bestand mit echtem lokalem PostgreSQL
17.12, ohne Socket/Hosted-Verbindung, ohne Uhr- oder Guard-State-Manipulation:
40 Fälle, drei History-Scans, null zusätzliche Caller-Grants, keine Replay-Writes,
alle vollständigen Rollback-Digests gleich. Laufzeit 113,626 Sekunden unter
lokalem Node 24.22.3; das vorgeschriebene Node 22 wird zusätzlich durch die
unveränderte Hosted-CI geprüft.

Dieser Lauf überschritt tatsächlich die Grenze **23:30 UTC am 21.11.2026**:

| Beobachtung | Tatsächlicher Wert |
| --- | --- |
| Alter Slot / Generation | 23:25 UTC / 1 |
| Zulassung nach echtem Warten | 23:30:00.240 UTC, noch 29,760 Sekunden gültig |
| Vollständiger fälliger Audit | 644,4 ms |
| Neuer Slot / Generation | 23:30 UTC / 2 |
| Incident / Resume | unverändert 0 / 0 |
| Neue echte Gültigkeitsgrenze | 23:35:30 UTC |
| Fortsetzung | sämtliche verbleibenden Fälle und Voll-Digests bestanden |

Unabhängiges adversariales Quellreview bestätigt die Platzierung vor BEGIN,
Rollenwechsel und Fault-Prefix sowie den unveränderten Voll-Digest. Eine grüne
PR-CI allein ist kein Abschluss: Der eigene nachfolgende Main-Push-Lauf muss
ebenfalls vollständig grün sein. Nach diesem Gate bleibt die oben festgelegte
Merge-Reihenfolge zugunsten #1272 bestehen. Spätere CI-/Merge-Belege stehen im
PR; kein zusätzlicher Dokumentations-Merge umgeht diese Reihenfolge.
