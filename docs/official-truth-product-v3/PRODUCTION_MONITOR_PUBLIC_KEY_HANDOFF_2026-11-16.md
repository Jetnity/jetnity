# Production Monitor Public Key Compatibility 1 — Handoff

Stand: 16.11.2026. Writer: **Jetnity Production Monitor Public Key Compatibility 1**,
Sitzung `/root/runtime_handoff`. Auftrag: [versionierter Task](PRODUCTION_MONITOR_PUBLIC_KEY_TASK_2026-11-16.md).
Baseline `3645eff9bd53de49f5c61b56baa2464d84b5afc8`, Branch
`fix/production-monitor-public-key-20261116`. **Lokal implementiert; Root-CI und Owner-Mergefreigabe offen.**

## Änderung

Der externe Monitor kann den ausdrücklich konfigurierten vorhandenen öffentlichen
Production-Legacy-anon-Key verwenden. Der bestehende Publishable-Key-Pfad bleibt
erhalten. Es werden keine zusätzlichen ENV-Namen gelesen und keine Schlüssel
erzeugt, übertragen, gedreht oder protokolliert.

`scripts/official-truth-production-import-monitor.mjs` begrenzt den Legacy-Pfad
auf drei kanonische Base64url-Segmente, strikt gültiges UTF-8 und kompaktes JSON
ohne doppelte/zusätzliche Felder oder alternative Kodierungen. Header exakt
HS256/JWT; Payload exakt `iss/ref/role/iat/exp`, mit `supabase`, dem festen
Production-Projekt, `anon`, gültigen ganzzahligen Zeiten und einem 32-Byte-
Signatursegment. Abweichungen werden vor Netzwerkzugriff abgelehnt.

Dies ist ausdrücklich **nur eine Strukturklassifikation, keine Signaturprüfung
und keine Authentifizierung**. Der unverändert fest gebundene Supabase-HTTPS-
Endpunkt prüft den tatsächlichen Schlüssel; HTTP 401/403 bleiben Alarm.
Es bleiben zwei öffentliche Leseanfragen, ausschließlich `apikey` am Supabase-
Endpunkt, keine Authorization-Header oder Cookies. Aktivierungsgate, Zielbindung,
Fristen, Größenlimits, vollständiger Abbruch/Drain, Quellen- und Besuchervalidierung
bleiben unverändert. Datenbank, Rechte, Login, Methode und Quellen sind unberührt.

## Einmalige fokussierte Prüfung

Ausgeführt mit dem vorhandenen Node **22.23.5**:

```sh
node --test --test-reporter=spec scripts/official-truth-production-import-monitor.test.mjs
```

Ergebnis: **17 Tests erfolgreich, 0 fehlgeschlagen, 0 abgebrochen, 0 übersprungen**.
Die synthetische Legacy-Probe enthält keine echte Signatur und keinen echten Key.
Der Test belegt identische feste öffentliche Requests für beide Formate,
Ablehnung privater/Benutzer-/Fremdprojekt- und fehlerhafter Schlüssel vor I/O,
keine Auslesung anderer Credentials und fortbestehenden Alarm bei serverseitiger
Schlüsselablehnung. Bestehende Antwort-/Frische-/Abbruchprüfungen liefen mit.
Keine echte Netzwerk-, Production- oder Benachrichtigungsprüfung durch den Writer.

## STOPP und nächster Schritt

Root prüft den kleinen Diff und übernimmt genau einen gebündelten CI-Lauf.
Erst nach neuer Owner-Mergefreigabe darf der vorhandene öffentliche Key über den
bestehenden Variablennamen für den tatsächlichen Monitorlauf verwendet werden;
Monitoraktivierung und Alarmzustellung werden separat als reale Ergebnisse
festgehalten. Kein neues privilegiertes Default-Schlüsselpaar ist erforderlich.
Keine neuen Kosten, Migrationen oder Abhängigkeiten.

Geändert wurden ausschließlich Monitor, zugehöriger Test und dieser Abschlussbeleg.
Der Task wurde von Root vorab angelegt. Kein Commit, Push, Ready, Merge, Deployment
oder automatischer Folgeauftrag durch den Writer. #1213 und #1198 unberührt.

Dokumentationsabgleich: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
und [Migration](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys),
am 16.11.2026 gelesen. Legacy-anon bleibt hier ein eng begrenzter Kompatibilitätsweg;
die spätere Schlüsselumstellung ist ein eigener Auftrag.
