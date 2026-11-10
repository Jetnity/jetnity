# Reiseplan mit Ortswahl und Tagesplanung

Der Auftrag vom 10. November 2026 verbessert den bestehenden Reiseplan. Ausgangspunkt sind die auf Jetnity und Lambus beobachteten Abläufe: einen Stopp wählen, den Aufenthalt organisieren, seine Tage planen und den nächsten Weg finden.

Der gemeinsame Branch feat/reiseplan-etappenassistenz integriert drei unabhängige Arbeitsbereiche in der Reihenfolge Ortswahl, Tagesplanung und Karte. Jeder Bereich erhält einen separaten Branch mit genau einem Writer. Die Integration verantwortet die Einbindung in Etappenplan, Workspace und Organisieren sowie die gemeinsamen Browsertests.

- Ortswahl: vorhandene Ortsauflösung für neue Stopps wiederverwenden, freie Stopps erhalten und die Auswirkungen vor dem Speichern zeigen. Der bestehende Schreibpfad muss Gäste und Konten mit Versionsprüfung behandeln.
- Tagesplanung: den sichtbaren Aufenthalt aus seinen tatsächlichen Tagen und Einträgen erschliessen, auf den passenden Tag springen und zeitgebundene Einträge von flexiblen unterscheiden. Nur gesicherte Zeiten vergleichen.
- Karte: bei einer Etappe oder Verbindung die tatsächlich zugehörigen Orte hervorheben und die Auswahl auf kleinen Bildschirmen benutzbar machen.
- Integration: Unterkunft, Aktivitäten und Verbindungen vom Reiseplan im Kontext der ausgewählten Etappe öffnen. Preise und Fahrpläne kommen aus den bestehenden Partnerfunktionen.

Keine neuen externen Dienste, Schemaänderungen oder Änderungen persönlicher Bestandsreisen zur Prüfung. Prüfung mit separaten Testreisen, Desktop-Chrome, iPhone-Browseransicht und regulären Repository-Prüfungen.

Die Etappenübersicht öffnet Unterkunft und Aktivitäten für den ausgewählten Stopp. Die Verbindungssuche übernimmt beide Stopp-IDs. Liegen keine Ankunfts- oder Abreisedaten vor, kann ein eindeutiger Wechsel zwischen aufeinanderfolgenden Kalendertagen einen Datumsvorschlag liefern. Bei mehrfachen Wechseln für dasselbe Paar bleibt das Datum offen.

Für die Prüfung wurde eine separate Reise mit drei Etappen verwendet. Ko Chang → Phuket wurde aus dem Reiseplan in beiden Suchansichten geprüft, einschliesslich Neuladen, Zurücknavigation und Ausfall des Streckenkatalogs. Die Prüfung der Ortswahl umfasste Gäste und ein lokales Testkonto sowie das erneute Öffnen des gespeicherten Stopps. Die Karte wurde zusätzlich mit einem Abschnitt über den 180. Längengrad geprüft.
