# Production Monitor Public Key Compatibility 1

## Auftrag und Ausgangspunkt

Owner-Auftrag vom 16.11.2026: CH→DE auf jetnity.com abschliessen, genehmigte Automatik betreiben, keine neuen privilegierten Schlüssel oder Login-/Rechteänderungen. Production/Merge eines neuen Pakets bleibt Owner-gated. Ausgangspunkt main `3645eff9bd53de49f5c61b56baa2464d84b5afc8`; #1214 ist bereits regulär gemergt. #1213 und #1198 sind fremde Bereiche und bleiben unverändert.

Der bestehende externe Monitor akzeptiert nur moderne öffentliche Publishable-Keys. Production besitzt einen vorhandenen öffentlichen Legacy-anon-Key. Eine zusätzliche privilegierte Default-Key-Erzeugung ist dafür nicht nötig und nicht Teil dieses Auftrags.

## Enger Umfang

Writer: **Jetnity Production Monitor Public Key Compatibility 1**, tatsächliche Agent-Sitzung `/root/runtime_handoff` nach explizitem Folgeauftrag. Neuer begrenzter Kompatibilitätsauftrag, keine Wiederholung der bereits akzeptierten CH→DE-CI oder Quellenabnahme.

Nur `scripts/official-truth-production-import-monitor.mjs`, zugehöriger `.test.mjs`, dieser Auftrag und ein eigener Abschlussbeleg dürfen geändert werden. Bestehende Workflow-Datei, package.json, SQL, Rollen, Login, Methode, Sources, Frische- und Antwortprüfungen bleiben unverändert. Keine Production-Aktion durch den Writer; do not mark Ready, do not merge, do not start a follow-up slice.

## Ziel und Sicherheitsvertrag

- Bestehende sb_publishable-Prüfung erhalten. Daneben genau einen fest an Production gebundenen öffentlichen Legacy-anon-JWT als explizit konfigurierte Eingabe erlauben, ohne weitere ENV-Variablen auszulesen.
- Begrenzte kanonische Base64url-Segmente, striktes UTF-8/JSON ohne doppelte Felder; Header exakt HS256/JWT; Payload exakt iss/ref/role/iat/exp, iss=supabase, ref=qscbgcdmivbbnzrcyegn, role=anon und gültige ganzzahlige Zeitwerte. Signatursegment 32 Bytes.
- Diese lokale Strukturprüfung ist keine Signaturprüfung und keine Authentifizierung. Der fest gebundene Supabase-HTTPS-Endpunkt muss den echten Schlüssel prüfen; 401/403 bleiben Alarm.
- Unverändert nur öffentliche apikey-Requests; keine Authorization-Header, Cookies, Service-Role-, Management- oder Import-HMAC-Werte. Keine Schlüsselwerte in Belegen.
- Falsche Rolle, Benutzer-JWT, anderes Projekt, falscher Issuer/Algorithmus, Zusatz-/Doppelfelder, fehlerhafte Kodierung und ungültige Zeiten vor Netzwerkzugriff ablehnen.

## Abnahme

Vorhandene Monitor-Tests um synthetischen positiven Legacy-anon-Fall und relevante Negativfälle ergänzen; einmal gezielt ausführen. Root prüft den kleinen Diff und startet danach genau einen gebündelten CI-Lauf. Ein tatsächlicher Monitorlauf folgt erst nach Owner-Freigabe des neuen Merges. Kein bestehendes Production-Ergebnis als Monitor-PASS ausgeben.

## STOPP

Nach lokalem Patch und fokussierter Verifikation Root die geänderten Dateien, Ergebnis und verbleibenden Aktivierungsschritt melden. Nicht selbst pushen oder externe Einstellungen ändern.
