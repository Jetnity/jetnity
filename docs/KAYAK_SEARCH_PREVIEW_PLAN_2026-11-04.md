# KAYAK hotel and flight preview

Objective: make the approved KAYAK test access usable inside Jetnity's existing hotel and flight workspaces, on desktop and mobile. The public website must label every result as test data, without booking or trip-save actions.

Scope: server-only KAYAK adapter and bounded same-origin API, typed allowlisted response models, hotel cards and flight itineraries, existing workspace integration. No schema, authentication, homepage or indexing changes. Trip dates, destination coordinates and passenger count seed editable search controls. Only selected search parameters leave Jetnity; test results never enter the trip graph.

Security/cost: fixed sandbox origin, server-only key and kill switch, actual client IP, pseudonymous tracking identifier, response size and time bounds, maximum three provider calls per search, per-user and per-instance hourly limits. Provider quota remains the account-wide boundary. Provider cookies and booking/API URLs never reach the client. No automatic provider calls on page load.

Validation: normalization and malformed upstream responses, secret/URL exclusion, polling and request limits, invalid dates and inputs; repository checks; desktop/mobile interaction and empty/error states; protected preview before production, independent read-only review of the final commit, then live verification. Production provider access remains unapproved and is outside this slice.

## Übernahme und Veröffentlichung am 4. November

Der Product Owner beauftragt ausdrücklich: „ok mach weiter und veröffentliche es“.
Dieser Auftrag erlaubt die klar bezeichnete Sandbox-Testvorschau auf jetnity.com;
ein echter KAYAK-Produktionszugang oder Buchungen folgen daraus nicht.
Root übernimmt als einziger Writer den unterbrochenen lokalen Stand und prüft
die vorherige Implementierung in dieser separaten Session unabhängig.
SINGLE_AGENT; kein zweiter Writer. Die parallele Maps-PR #1112 ist ausserhalb
dieses Auftrags. Gemeinsame Basis ist d2f38f785f037f814ee311b3a6bf8075177a8b28.

### Prüfung vor dem ersten KAYAK-Commit

- 16 fokussierte Sandbox-/Adapter-/HTTP-Tests sowie 226 bestehende Flug-/Hotel-/Workspace-Regressionstests bestanden.
- TypeScript, vollständiger Lint (0 Fehler, 192 bestehende Warnungen), alle fünf
  Hygieneprüfungen und lokaler Produktionsbuild bestanden.
- Gemountete Oberfläche mit kontrollierten Testantworten bei 1440, 1024, 640,
  390 und 320 px: Hotels und Flüge, keine automatische Suche, erfolgreiche /
  leere / fehlgeschlagene Suche, Direktflugfilter und Verwerfen alter Ergebnisse
  nach Eingabeänderung bestanden; keine Browserfehler oder horizontales Überlaufen.
- Unabhängige Sichtprüfung entdeckte umbrochene Flugzeiten bei 320 px. Korrigiert
  und alle fünf Breiten erneut geprüft; Zeitangaben bleiben einzeilig.
- Keine Datenbank-, Auth-, Zahlungs-, Buchungs-, Karten- oder Indexierungsänderung.

### Betrieb und Grenzen

Der Server spricht ausschliesslich sandbox-en-us.kayakaffiliates.com an.
KAYAK_SANDBOX_API_KEY ist ein Vercel Secret, niemals NEXT_PUBLIC.
KAYAK_SANDBOX_ENABLED muss exakt true sein. Zum Abschalten auf false setzen
und neu deployen; eine Umgebungsänderung allein ändert bestehende Deployments nicht.
Der Preview-Schlüssel und die Freigabe sind auf diesen Branch begrenzt.
JETNITY_UI_AUDIT ist nur dort aktiv; Production verweigert Audit-Seiten immer.

Die am 4. November erneut gelesene offizielle Getting-Started-Dokumentation
nennt je 250 Anfragen/Stunde für Hotel- und Flugsuche; diese Anbieterlimits
können sich ändern. Die zusätzlichen Prozessgrenzen (12 Suchen pro IP/Stunde,
220 Anbieteranfragen je Suchtyp/Stunde/Prozess) sind ausdrücklich kein
verteilter oder finanzieller harter Grenzwert. Maximal drei Anbieteraufrufe
pro Suche, feste Zeit-/Antwortgrössenlimits, keine Wiederholung nach Fehlern.
Der vorhandene Sandboxzugang bestellt kein kostenpflichtiges Produkt.

Hosted Preview, native CI, normaler Merge und tatsächliches Production-Readback
sind zum Zeitpunkt dieses ersten Commits noch ausstehend und werden separat
nachgewiesen. Kein lokaler Test wird als Live-Abnahme ausgegeben.
