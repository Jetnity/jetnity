# Trip Maps JS V1 — Implementation, Evidence und verbleibende Gates

Stand: 4. November 2026, Europe/Zurich. Codex ist alleiniger Writer, ohne Cursor oder kostenpflichtigen Ersatz. [Draft PR #1112](https://github.com/Jetnity/jetnity/pull/1112), Branch `feat/trip-maps-js-v1-20261104`. Kein Ready, Merge oder Go-live. Der finale Head und native CI-/Preview-Receipts stehen im PR; dieser Text behauptet keinen unabhängigen Review-PASS.

## LIVE verifiziert, vor der Änderung

- Main `d2f38f785f037f814ee311b3a6bf8075177a8b28` (Merge #1111), Modus NORMAL. Vercel `jetnity-app`: Production `dpl_4eaJJVS3QwK81Ny5QH5FDgGZvCtn` READY auf diesem SHA, Alias `jetnity.com`, kein Aliasfehler. Regeln `21875372` und `24998411` aktiv. Preview-Schutz: SSO `all_except_custom_domains`.
- Start Here, Operating Standard, R109-Handoff, Active Work Status, #751 und offene PRs gelesen. Ältere Repo-Snapshots sind keine aktuellen Writer-Aufträge. Offene PRs vor Start: #1086, #1084, #985, #937, #913, #52, #50, #40, #39, #28; kein konkurrierender Maps-Writer gefunden. Neueste #751-Kommentare beim Start noch vom 1. November, daher jüngere Main-/Deployment-Evidence berücksichtigt.
- Google Cloud Console direkt gelesen: Projekt **Jetnity Maps**, tatsächliche ID `project-288ec5db-1600-4fca-a1d`. Genau ein aktiver Browser-Key. Website-Beschränkung ausschließlich `https://jetnity.com/*`; API-Beschränkung ausschließlich **Maps JavaScript API**. Console bestätigt gelöschten alten Schlüssel/abgeschlossene Rotation. Kein Schlüsselwert geöffnet, kopiert, geloggt oder abgebildet; keine erneute Rotation.
- Maps JavaScript API zeigt **Enable**, bleibt also OFF. Keine zusätzliche Maps-API aktiviert. Die Quotenansicht liefert bei deaktivierter API keinen belastbaren aktuellen Maps-Limitwert. Der frühere Hinweis „unbegrenzt/nicht anpassbar“ wurde **nicht** frisch bestätigt und ist kein aktueller Quotenbeweis.
- Google-Testkonto: Console-Banner 249.08 CHF Restguthaben und 90 Tage, Upgrade weiterhin angeboten. Pay-as-you-go-Ansicht, kein Maps-Abonnement ausgewählt. Kein Upgrade oder Abo durchgeführt.
- Google-Abrechnung: Bericht für den aktuellen Monat zeigte tatsächlich **1.–3. November, 0 CHF**; keine verlässliche Prognose, Hinweis auf verzögerte Abrechnungsdaten. Das ist weder eine Echtzeitmessung noch ein Nachweis für alle Jetnity-Provider.
- Budgetliste: **„Jetnity Maps - Kostenwarnung (kein Ausgabenlimit)“**, monatlich 1 CHF, Schwellen 1/50/100 Prozent = 0.01/0.50/1 CHF. Keine harte Kostensperre. Keine Budgetänderung durchgeführt.
- Vercel-Metadatenabfrage für den Featurebranch liefert keine branchspezifischen Variablen. Die allgemeine Liste war begrenzt; daraus wird **keine vollständige Aussage über alle Projektvariablen** abgeleitet. Keine Variablen/Secrets verändert.

Supabase Development `yfvbxvijcorffwxbxahl` und Production `qscbgcdmivbbnzrcyegn` wurden nicht aufgerufen oder verändert. 12Go-, PrivacyBee-, Viator-, DiscoverCars-, Auth-/DB-/RLS-/OfficialTruth- und übrige Holds bleiben bestehen. My World bleibt unverändert.

## Tatsächlich implementiert

- `TripWorkspaceMap` sitzt in der bestehenden Plan-/Routenansicht. Es liest ausschließlich vorhandene Etappen und deren endliche, gültige gespeicherte Koordinaten. Alle Etappen bleiben in der Liste; fehlende Koordinaten werden offen angezeigt. Keine Namens-Geocodierung, erfundene Orte, Angebote oder Preise.
- Google Maps JavaScript mit Advanced Markers: nummerierte Orte, kleine Pixelradius-Gruppierung, auswählbare identische Positionen, „Alle Orte zeigen“. Marker und Liste verwenden dieselbe Auswahl; Tageszuordnung kommt aus der bestehenden Chronologie. Bei wiederholten Besuchen bleibt ein bereits passender Tag erhalten.
- Mobile Ansicht, Tastaturknöpfe, Fokus-Rückkehr nach Gruppenauswahl, Live-Status, Laden/Fehler/Offline/leere Reise/fehlende Koordinaten. Keine Straßenroute oder Luftlinie gezeichnet; die Oberfläche sagt das ausdrücklich.
- Zustimmung nur im Arbeitsspeicher; kein Google-Laden vor explizitem Häkchen und Klick. Offline, Ausschalten, Ansichtswechsel und Unmount entfernen den Kartenframe. Präsenz oder Consent-Signal der gemeinsamen PrivacyBee-CMP blockiert/revoziert diese separate Karte, bis eine gemeinsame Maps-Policy geprüft ist. Das ist **keine rechtliche Datenschutzfreigabe** und ändert die gehaltene CMP nicht.
- Google läuft in einem entfernbaren Frame ohne `allow-same-origin`, mit eigener Nonce-CSP gemäß [Google-CSP-Leitfaden](https://developers.google.com/maps/documentation/javascript/content-security-policy). Die in Googles CSP-Beispiel vorgesehenen eval-/Blob-Worker-Rechte gelten ausschließlich innerhalb dieses isolierten Kontexts; Parent-CSP und Frame-Isolation bleiben unverändert. Nonces werden je Antwort neu erzeugt, Inline-Scripts bleiben gesperrt. Nachrichten prüfen Fenster und Origin; nur Markerindex, Name und Koordinaten gehen in den Frame, keine internen Reise-/Tages-IDs, Reisenden oder Datumsdaten. Ein browserseitiger Google-Key wäre technisch sichtbar und benötigt deshalb echte Host-/API-Beschränkungen; Vercel-Variablen machen ihn nicht geheim.
- Source-Gate `TRIP_MAP_PILOT_RELEASED=false` bleibt geschlossen. Variablen allein können es nicht öffnen. Nach separatem Review würde die Konfiguration zusätzlich Preview-Umgebung, exakten HTTPS-Host unter `.vercel.app`, Map ID, Schlüssel und ein höchstens einstündiges Ablaufdatum verlangen. Production bleibt ausdrücklich ausgeschlossen.
- Keine neue Abhängigkeit, kein automatischer Retry, kein Maps-Neuladen durch bloßen Wechsel der Auswahl. Nur Maps JavaScript; keine Places-, Routes-, Geocoding- oder Street-View-Funktion.

## Prüfung und Grenzen

**Fokussierte Tests: 29/29 PASS, 0 übersprungen.** Projektion/echte Tageszuordnung, ungültige Koordinaten, doppelte Orte, Host-/Umgebungs-/Zeit-Gates, schlüssellose gesperrte HTTP-Antwort, Nachrichtenprüfung, einmalige SDK-Initialisierung, Auswahl ohne neue Map, Gruppenauswahl/Fokus, Text statt HTML, Authfehler und Ablauf; dazu vorhandene Routenregressionen.

Die SDK-Tests verwenden ausdrücklich einen lokalen Google-Stub: Sie beweisen Ablauf und Grenzen, **keine echten Google-Kacheln, Referrer-Akzeptanz oder Provider-Kompatibilität**. Typecheck und Production-Build PASS. Lint: 0 Fehler, 192 bestehende Warnungen, keine Warnungen in den neuen Maps-Dateien. Dead-Code-, Export-, Dependency-, Admin-API-, Schema-Bezugs- und Operating-Mode-Prüfungen PASS. Schema-Prüfung nennt sieben bereits vorhandene LOCAL/UNAPPLIED-RPC-Ausnahmen; keine neue Ausnahme. `git diff --check` PASS. Abschließende native Resultate im PR-Receipt. Native Gesamttests laufen im vorhandenen CI, keine DB-Apply- oder Auth-Änderungsbefehle.

Native Browserprüfung mit bestehender, deutlich als Testreise gekennzeichneter Repo-Fixture, lokalem UI-Audit und unbrauchbarer localhost-DB-Konfiguration: Desktop 1440×1000, mobil 390×844 und 320×844 ohne horizontalen Überlauf. Kartenliste Phuket → passender bestehender Tag 16; Ko Chang ohne Koordinaten per Enter → Tag 9. Zustimmung startet nur den gesperrten Frame; nach Blockierung 0 iframes. Keine Google-Verbindung und keine Produktionsdaten. Temporäre Testseite wurde aus dem Produktbaum entfernt, eigener Testserver beendet. Screenshots im lokalen Nutzer-Output; keine echten Google-Kartenbilder vorgetäuscht.

**BLOCKED:** echter gehosteter Google-Test, tatsächliche Attribution/Keyboard-/Touch-Bedienung auf Google, Wirksamkeit des Referrers im isolierten Frame und Google-CSP-Kompatibilität. Der Key erlaubt nur Production, keine Preview. Map ID und vollständige sichere Preview-Konfiguration sind nicht bestätigt. Keine Schutzumgehung, kein unbeschränkter Debug-Key. Ein grüner Build ersetzt diese Gates nicht.

## Kosten und kontrollierter Pilot — vorgeschlagen, nicht aktiviert

Die [Google-Preisliste](https://developers.google.com/maps/billing-and-pricing/pricing) nennt 10’000 kostenlose Dynamic-Maps-Ladungen monatlich und danach USD7 je 1’000 im ersten kostenpflichtigen Volumenband. Vereinfachte reine Maps-Beispiele, vor Steuern/Wechselkursen, bei keinem anderen Verbrauch desselben Freikontingents:

| Ladungen pro Monat | Dynamic Maps |
| --- | ---: |
| 10’000 | USD0 |
| 12’000 | USD14 |
| 15’000 | USD35 |
| 20’000 | USD70 |

Ladungen sind **keine zahlenden Kunden**. Verrechnung/Freikontingent aggregiert nach Billing-Regeln, nicht automatisch nur nach dieser Karte. Die USD100 gelten weiterhin **insgesamt** für Jetnity-Provider; anderer aktueller Providerverbrauch ist hier nicht abgeglichen und das gesamte Budget steht Maps daher nicht frei zur Verfügung. Keine starre 10’000-Abschaltung eingebaut.

[Budgetwarnungen](https://docs.cloud.google.com/billing/docs/how-to/budgets) sind keine Kostenbremse. Die dokumentierte [Spending-cap-Funktion](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps) umfasst Maps nicht; selbst unterstützte Dienste haben Verzögerungs-/Überziehungsgrenzen. [API-Quoten](https://developers.google.com/maps/documentation/javascript/usage-and-billing) sind nicht mit einem globalen monatlichen Providerbudget gleichzusetzen. Ein zuverlässiger harter Monatsstopp für diese Browserkarte ist **nicht nachgewiesen**. Ein Client-Zähler oder eine Stunde Laufzeit wäre ebenfalls keine belastbare Ausgabengarantie.

Nächster kleiner Pilot, erst nach konkreter Freigabe der offenen Punkte:

1. Geschützte branchgebundene Preview ohne Produktions-DB und ohne Umgehung verifizieren. Exakten Preview-Host, notwendigen Maps-JS-Map-ID und sichere Vercel-Variablen festlegen. Preview-Key/-Referrer getrennt und restriktiv prüfen; Production-Beschränkung nicht durch Wildcards öffnen, keine unnötige Rotation.
2. Maps-Consent-Vertrag/Datenschutzhinweis freigeben, ohne den PrivacyBee-STOP implizit aufzuheben. Google-Billingzustand und Testguthaben unmittelbar erneut lesen, kein Upgrade. Globalen Provider-Monatsverbrauch und verbleibenden Spielraum feststellen. Ohne hinreichend kontrolliertes Kostenrisiko bleibt der Pilot OFF.
3. Separat reviewed Source-Gate für genau eine geschützte Preview mit maximal einer Stunde öffnen; nur Maps JavaScript aktivieren. Ein Operator, kleines manuell protokolliertes Testkontingent (Ziel höchstens 50 Initialisierungen, **kein technisch garantierter Zähler**), Google-Verbrauch vorher/nachher prüfen, verspätete Abrechnung nachlesen. Keine öffentliche Freischaltung.
4. Echte Kacheln, Attribution, Marker/Cluster, Tastatur/Mobil, Auswahl, Referrer-Ablehnung außerhalb des erlaubten Hosts, Consent vor Laden und Entfernen nach Widerruf prüfen. Bei Inkompatibilität Gate schließen; Isolation nicht ungeprüft abschwächen.
5. Nach dem Test Google-API wieder OFF, Pilotvariablen deaktivieren und Source-Gate schließen. Bei Auffälligkeit sofort abbrechen; bereits entstandene Kosten werden durch Rollback nicht rückgängig gemacht. Ein erfolgreicher Pilot ist keine Produktionsfreigabe.

**Erste noch nicht abgeschlossene Aktion:** unabhängiger Review des finalen Draft-Heads und der nativen CI-Receipts. Danach die obigen konkreten Pilot-/Datenschutz-/Kostenpunkte entscheiden. Kein automatischer Merge, Go-live, nächster Produktslice oder Cursor-Start.
