# KAYAK-Testzugang — 3. November 2026

## Auftrag und Plan

Owner: „warum loge ich mich dann ein? kannst du es einrichten?“ Der per E-Mail
erteilte Sandbox-Schlüssel darf für begrenzte Hotel- und Flugtests verwendet
werden. Kein Portalpasswort erforderlich. Keine externe Nachricht senden.

- SINGLE_AGENT: kleiner lokaler Diagnoseauftrag, Root alleiniger Writer.
- Basis: `d2f38f785f037f814ee311b3a6bf8075177a8b28`, Branch
  `feat/kayak-sandbox-20261103`.
- Umfang: eigenständiges lokales Prüfskript unter `scripts/`, fokussierte
  Sicherheitstests und dieser Fortsetzungsstand.
- Keine Datenbankmigration, öffentliche API, Oberfläche, Providerfreischaltung
  oder Änderung des Reisegraphen. Kein Produktionsdeployment.
- Schlüssel ausschliesslich lokal in ignorierter `.env.kayak-sandbox.local`
  mit Dateirechten 0600. Keine Schlüssel, Antwort-URLs oder Rohantworten in
  Logs, Report oder Git; KAYAK-Antworten können den Schlüssel in Links enthalten.
- Festes offizielles Sandbox-Ziel, keine Weiterleitungen; Zeit-, Antwortgrössen-
  und Anfragegrenzen. Keine automatischen Wiederholungen nach Fehlern.
- Kosten/Last: nur wenige Sandbox-Aufrufe innerhalb der dokumentierten Limits;
  keine Bestellung, Buchung oder kostenpflichtige Freischaltung.
- Abnahme: Hotel- und Flugzugang tatsächlich prüfen; vollständige, teilweise,
  leere und fehlgeschlagene Antworten unterscheiden. Ergebnis nur als sichere
  Strukturzusammenfassung ausgeben. Unit-Tests ohne Netzwerk für Fehler- und
  Secret-Grenzen; Skript-Syntax und Diff prüfen.

## Offizielle Grundlage

- https://developers.kayak.com/getting-started
- https://developers.kayak.com/hotels-search-api
- https://developers.kayak.com/flights-search-api

Die Sandbox liefert synthetische Daten für den US-Markt. Links sind keine
buchbaren Live-Angebote; Sandbox-Schlüssel gelten laut Dokumentation drei
Monate. Der Produktionszugang und die Rechte für öffentliche Anzeige bleiben
separat zu bestätigen. Historische „kein KAYAK-Zugang“-Dokumente gelten weiter
für Produktion, nicht für diesen inzwischen ausdrücklich erteilten Testzugang.

## Ergebnis

**Erfolgreich geprüft am 03.11.2026, 22:46:18 UTC (23:46 Uhr Schweiz).**
Vier tatsächliche KAYAK-Anfragen einschliesslich Folgeabrufen:

| Suche | Status | Ergebnisse | Nachgewiesene Felder |
| --- | --- | --- | --- |
| Hotels, Boston | vollständig | 3 (bewusst begrenzte Seitengrösse) | Bei allen drei Hotels Bilder, Tarife und Weiterleitungslinks |
| Flüge, LAX–BOS | vollständig | 50 | Bei allen 50 Ergebnissen Buchungsoptionen, Preise und Weiterleitungslinks |

Dies belegt die Authentifizierung und Antwortstruktur der Testumgebung, keine
realen Preise, Verfügbarkeiten oder buchbaren Angebote. Die Links wurden nicht
zur Buchung geöffnet. Keine Verbindung zum öffentlichen Jetnity aktiviert.

Die ersten Versuche wurden mit HTTP 400 abgewiesen: KAYAK verlangt zusätzlich
den Header `x-original-client-ip`. Das Skript ermittelt hierfür ausschliesslich
die tatsächliche ausgehende IP dieses lokalen Rechners über
`https://api.ipify.org?format=json`. Dorthin geht kein KAYAK-Schlüssel; die IP
wird weder protokolliert noch gespeichert. Keine erfundene Kunden-IP verwenden.

Hotels liefern standardmässig nur minimale Daten. `responseOptions=toprates,images`
liefert die oben nachgewiesenen Bilder und Tarife. Ein erster unvollständiger
Hotelabruf kann `results` ganz weglassen; das ist ein wartender Suchlauf und kein
leeres Angebot. Beide Suchen werden höchstens dreimal mit fünf Sekunden Abstand
abgerufen, niemals nach einem Fehler automatisch wiederholt.

## Lokale Verwendung und Prüfung

Im Worktree `work/jetnity-kayak-sandbox` mit Node 22 oder neuer:

```sh
node --env-file=.env.kayak-sandbox.local scripts/kayak-sandbox-check.mjs
node --test tests/kayak-sandbox-check.test.mjs
```

Der Schlüssel liegt ausschliesslich in der bereits eingerichteten, ignorierten
Datei. Nicht in eine URL, einen Chat, Clientcode oder ein Protokoll kopieren.
Das Prüfskript gibt nur Zähler und Status aus. Ein fehlgeschlagener oder noch
unvollständiger Suchlauf beendet es mit Fehlerstatus. Pro Ausführung höchstens
sechs KAYAK-Anfragen, maximal 15 Sekunden und 8 MiB je Anfrage.

Alle acht fokussierten Tests bestanden: keine echten Netzwerkaufrufe in den
Tests; Authentifizierung, Polling, Antwortgrenzen und Geheimnisschutz geprüft.
Syntax und Git-Diff sind ebenfalls geprüft. Kein App-Build erforderlich, da
die Anwendung dieses eigenständige Diagnoseskript nicht importiert.

## Späterer Auftrag vom 4. November

Der Owner hat inzwischen die öffentliche, klar gekennzeichnete Testvorschau
beauftragt. Der Schlüssel wurde zusätzlich als serverseitiges Vercel Secret
für den branchgebundenen Preview hinterlegt. Der ursprüngliche lokale
Diagnosestand oben ist historisch. Aktueller Scope und Freigabestatus:
[KAYAK-Testvorschau](KAYAK_SEARCH_PREVIEW_PLAN_2026-11-04.md).

## Fortsetzung

Der E-Mail-Code ist der technische Testschlüssel, kein Portalpasswort. Das
Partnerportal und dessen Anmeldung sind von diesem funktionierenden Zugang
getrennt. Ein Produktionszugang wurde nicht erteilt oder abgeleitet.

Nächster Integrationsschritt nach entsprechendem Auftrag: serverseitige
Anbindung und klar gekennzeichnete private Vorschau. Vor öffentlichen echten
Angeboten Produktionsfreigabe, Anzeige-/Weiterleitungsbedingungen und
Produktionsschlüssel von KAYAK prüfen. Flugänderungen oder automatische
Umbuchungen sind durch diese Suchtests nicht nachgewiesen. Keine E-Mail oder
neue Partneranfrage ohne Owner-Freigabe senden.
