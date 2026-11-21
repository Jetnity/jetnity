# UI/UX-Feinschliff #1264 – Textänderungen und Planabweichungen der Etappen 3 bis 8

Aus dem PR-Text von Draft-PR #1264 hierher verschoben (21. November 2026), weil der PR-Text mit den Bildern des Live-Vergleichs (`docs/UI_UX_VERGLEICH_LIVE_PREVIEW_2026-11-21.md`) die GitHub-Grenze von 65 536 Zeichen überschreitet. Inhalt unverändert; die Bildlinks zeigen auf die Artefakte der Cursor-Session.

## Textänderungen mit Bedeutung (Etappe 8, einzeln)

1. Reisekopf: «Budget Noch offen» wird «Budget noch offen».
2. Reiseprüfung: «1 Nächte» wird «1 Nacht». Lücken heissen «16. Feb. bis 17. Feb.» statt «2027-02-16 bis 2027-02-17».
3. Reiseprüfung: Kalendertage im Bericht stehen als «12. Sept. 2026» statt im ISO-Format.
4. Reise ändern: Der Zeitraum lautet «10. Feb. – 17. Feb.» statt «2027-02-10 – 2027-02-17»; in der Einzahl heisst es «1 Tag · 1 Etappe».
5. Reisebegleiter: ISO-Daten in der Lagebeschreibung werden erst bei der Anzeige lesbar geschrieben. Gespeicherte Sätze bleiben unverändert.
6. Unterkunftssuche, Gäste: «Reisegruppe: 2 Personen. Belegung offen» wird «2 Personen · Belegung offen»; ohne Personenzahl steht nur «Belegung offen».
7. Admin-Pfad: Neue Bezeichnung «Österreich: 50 Pässe» für `/admin/official-truth/at-50-method`. Vorher wurde sie aus der Adresse gebildet.
8. Einreise im Workspace: Der Kicker «Einreise & Visum» über dem Prüfer entfällt, weil die Ansicht schon so heisst. Öffentlich bleibt er.

## Abweichungen vom Plan in Etappe 8

- Die Vollbildkarte ist nur im Code geprüft. Sie läuft nur mit dem Google-Maps-Schlüssel der Production.
- `WidgetConsentChoice` ist nicht poliert, weil die Komponente in keiner Seite eingebunden ist.
- Lange Zeilen in «Konto löschen» und «Anmeldung & Sicherheit» liegen in Dateien von #1240 und folgen nach dessen Merge.

Prüfung Etappe 8:

- Grün, auch nach der Übernahme von `main`:
  - Typprüfung;
  - Lint der geänderten Dateien (nur alte Warnungen in unveränderter Logik);
  - alle fünf Hygiene-Checks;
  - Production-Build.
- Tests:
  - 152 Testdateien (Reisen, UI, Admin, Reisebegleiter, Reiseänderung, Einreise-Hinweise) ohne Fehlschlag;
  - Browser-Tests der Reiseprüfung und des Workspace (mit Einreise) grün.
- Schlussmessung über alle Seiten der Seitenliste:
  - Breiten 280, 320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920 und 2560 px, quer 667×375, 844×390 und 1180×820;
  - Workspace hell und grün, Admin hell und dunkel;
  - kein seitliches Scrollen, genau eine `h1` pro Seite, Bedienflächen auf Touch 44 px;
  - übrig bleiben nur die bewusst einzeilige Gast-Hinweiszeile im Reisekopf und die Stellen in Dateien von #1240.
- Den Browser-Test der Reiseprüfung mit `TRIP_AUDIT_UI_URL=http://localhost:3000` starten. Der Dev-Server blockiert `127.0.0.1` als fremde Herkunft, und der Test bleibt sonst beim Laden hängen.

Demo 390 px: Umschalter in Reise ändern, Reiseprüfung, Stopp mit Vorschau, Gäste und Kalender, danach dasselbe im grünen Thema.

[e8-workspace-dialoge-390.webm](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fe8-workspace-dialoge-390.webm)

Vorher und nachher, jeweils mit dem Stand von Etappe 7 als «vorher»:

[Reise ändern 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Freise-aendern-390-vorher.png) [Reise ändern 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Freise-aendern-390-nachher.png)

[Reiseprüfung 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Freisepruefung-390-vorher.png) [Reiseprüfung 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Freisepruefung-390-nachher.png)

[Stopp-Vorschau grün 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fstopp-vorschau-gruen-390-vorher.png) [Stopp-Vorschau grün 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fstopp-vorschau-gruen-390-nachher.png)

Die Positionszeile der Stopp-Vorschau («Ohne Kartenposition» bzw. «Standort aus dem Ortskatalog») hängt an der Ortssuche des jeweiligen Testservers. Sie ist keine Änderung dieses PR.

[Unterkunftssuche 1280 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Funterkunftssuche-1280-vorher.png) [Unterkunftssuche 1280 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Funterkunftssuche-1280-nachher.png)

[Kartenpins vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fkarte-pins-vorher.png) [Kartenpins nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fkarte-pins-nachher.png)

Schlussmessung, Beispiele:

[Startseite 280 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fschluss-startseite-280.png) [Reiseplan grün, Tablet quer 1180 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fschluss-reiseplan-gruen-tablet-quer.png) [Übersicht 2560 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fschluss-uebersicht-2560.png)

## Textänderungen mit Bedeutung (Etappe 7, einzeln)

1. Admin-Startseite: Kicker «Jetnity · Betrieb im Überblick» wird «Administration», darunter neu «Betrieb im Überblick. Nur lesend, als Momentaufnahme.»; das Abzeichen «Read-only · Momentaufnahme» entfällt (die Aussage steht jetzt im Satz).
2. Reiseauswertung: Kicker «Analytics · Jetnity» wird «Administration» (Deutsch und Englisch).
3. Content-Inventar: Kicker «Content · Jetnity» wird «Administration».
4. Alle übrigen Admin-Seiten, Fehler, 404, Admin-Anmeldung und MFA: neuer Kicker «Administration»; amtliche Quellen und `/einreise/betrieb`: neuer Kicker «Amtliche Quellen».
5. Pfad in der Kopfleiste: Bezeichnungen wie in der Seitenleiste, also «Reiseauswertung» statt «Analytics», «Content-Inventar» statt «Content», «Marketing-Links» statt «Marketing», «Sprachkatalog» statt «Lokalisierung»; für Unterseiten ohne Eintrag vorher aus der Adresse gebildet, jetzt «Amtliche Quellen» statt «Official Truth», «Österreich-Methode» statt «At Method», «Schutzprüfung» statt «Guard», «Quellenlauf» statt «Import», «Methode» statt «Method».

Einleitungssätze der Seiten, Fehler- und 404-Texte sowie die Texte von Admin-Anmeldung und MFA sind unverändert; sie stehen nur im neuen Seitenkopf bzw. in der Karte.

Prüfung Etappe 7:

- Typprüfung, Lint der geänderten Dateien (nur alte Warnungen in unveränderter Logik) und alle fünf Hygiene-Checks grün.
- Admin-, UI-, Layout-, Einstellungs- und Sprachtests ohne Fehlschlag, darunter die Browser-Tests der Admin-Einstellungen mit echtem Kontrast und 320-px-Umbruch (sie haben den zu hellen Nebentext gefunden).
- Gemessen bei 390, 768, 1280 und 1920 px, hell und dunkel, auf allen 20 Admin-Seiten, Admin-Anmeldung, Fehler- und 404-Seite: kein seitliches Scrollen, genau eine `h1` pro Seite, keine Absätze über etwa 85 Zeichen, auf Touch keine Bedienfläche unter 44 px (Eingabeelement 42 px im 44-px-Rahmen).
- Hinweis: Eine unbekannte Admin-Adresse zeigt weiter die allgemeine 404; eine eigene wäre eine neue Route und ist nicht Teil des Feinschliffs.

[Admin-Startseite 1280 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-start-1280-hell-vorher.png) [Admin-Startseite 1280 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-start-1280-hell.png)
[Sprachkatalog 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-sprachkatalog-390-vorher.png) [Sprachkatalog 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-sprachkatalog-390.png)
[Admin-Anmeldung 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-login-390-vorher.png) [Admin-Anmeldung 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-login-390.png)
[Security 1280 px dunkel](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-security-1280-dunkel.png) [Admin-Fehlerseite 1280 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-fehler-1280.png)

## Textänderungen mit Bedeutung (Etappe 6, einzeln)

1. Anmeldung abschliessen, lädt: «Authentifiziere…» wird Titel «Anmeldung wird abgeschlossen» mit «Einen Moment, bitte.».
2. Anmeldung abschliessen, erfolgreich: «Erfolgreich angemeldet – weiterleiten …» wird Titel «Erfolgreich angemeldet» mit «Du wirst weitergeleitet …».
3. Anmeldung abschliessen, Fehler: neuer Titel «Anmeldung nicht abgeschlossen» über der bisherigen Meldung, neue Knöpfe «Zur Anmeldung» und «Zur Startseite».
4. Neues Passwort ohne gültigen Link: «Session erforderlich» / «Bitte fordere zuerst einen Passwort-Reset per E-Mail an und öffne dann den Link auf dieser Seite.» wird «Link aus der E-Mail öffnen» / «Ein neues Passwort setzt du über den Link in unserer E-Mail. Fordere ihn bei der Anmeldung unter «Passwort vergessen?» an und öffne ihn dann.», mit den Knöpfen «Zur Anmeldung» und «Zur Startseite».
5. Neues Passwort, Link wird geprüft: statt eines Drehsymbols ohne Text jetzt «Link wird geprüft» / «Einen Moment, bitte.».
6. Kein Zugriff: neuer Kicker «Administration», Kopf- und Fusszeile; Titel und Text unverändert.
7. Konto gelöscht: neuer Kicker «Konto»; Titel und Text unverändert.

Prüfung Etappe 6:

- Typprüfung, Lint der geänderten Dateien (nur drei alte Warnungen `catch (err: any)` in der unveränderten Anmeldelogik) und alle fünf Hygiene-Checks grün.
- Betroffene Tests (Anmeldung, Callback, Passwort, Abmelden, Kontolöschung, Registrierung, Rechtliches, SEO, UI- und Layout-Wächter, Seitenliste, Doku) ohne Fehlschlag. Im breiteren Lauf über alle Dateien, die die geänderten Stile lesen, scheitern nur die drei bekannten Tests, die eine lokale PostgreSQL brauchen (auch auf main).
- Gemessen bei 320, 390, 768, 1280 und 1920 px auf Login, Registrierung, Passwort (Link und Formular), Anmeldung abschliessen, Konto gelöscht, kein Zugriff, 404 und Sicherheit: kein seitliches Scrollen; auf Touch keine Bedienfläche unter 44 px (das Eingabeelement selbst 42 px im 44-px-Rahmen). Ein Klick an den oberen Feldrand setzt den Fokus ins Feld.

[Anmeldung abschliessen 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fanmeldung-abschliessen-390-vorher.png) [Anmeldung abschliessen 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fanmeldung-abschliessen-390.png)
[Kein Zugriff 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fkein-zugriff-390-vorher.png) [Kein Zugriff 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fkein-zugriff-390.png)
[Passwort-Link 1280 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fpasswort-link-1280-vorher.png)
[Passwort-Link 1280 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fpasswort-link-1280.png)
[Passwortformular 390 px, ein Anzeigen-Knopf pro Feld](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fpasswort-formular-390.png) [Login 390 px, Feldfehler mit einem Fokusrahmen](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Flogin-feldfehler-390.png) [Konto gelöscht 390 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fkonto-geloescht-390.png)
[404 1280 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2F404-1280.png)
[Registrierung 1280 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fregistrierung-1280.png)

## Textänderungen mit Bedeutung (Etappe 5, einzeln)

1. Öffentliche Fehlerseite: der Satz «Deine gespeicherten Reisen sind davon nicht betroffen.» entfällt. Die Seite kann das nicht prüfen.
2. Impressum- und Datenschutz-Ersatztext: «Schreiben Sie an …» wird «Schreib uns an …» (Du-Form wie im Rest der App).
3. Impressum, Datenschutz und Datenquellen: neuer Kicker «Rechtliches» über dem Titel.
4. Meine Welt: neuer Kicker «Konto» über dem Titel.
5. Unbekannte Adressen: die 404 zeigt jetzt Kopf- und Fusszeile mit der normalen Navigation.

Prüfung Etappe 5:

- Typprüfung, Lint der geänderten Dateien und alle fünf Hygiene-Checks grün.
- Betroffene Tests (Fehlerseiten, Rechtliches, Entdecken, Meine Welt, Länderfeld, Startseite, Layout- und Design-Wächter, Seitenliste, Doku) in vier Läufen ohne Fehlschlag: 285, 21, 85 und 24 Tests (teils überlappend).
- Gemessen bei 320, 390, 768, 1280 und 1920 px auf Startseite, Entdecken (auch ohne Treffer), Einreise, Datenquellen, Impressum, Datenschutz, AGB, 404, Fehlerseiten und Meine Welt (mit Besuchen, leer, Fehler): kein seitliches Scrollen, keine Bedienfläche unter 44 px, kein Fliesstext über 85 Zeichen.

[AGB 390 px vorher: Titel ragt seitlich heraus](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fagb-390-vorher.png)
[AGB 390 px nachher: Titel trennt, Lesespalte](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fagb-390-nachher.png)
[AGB 1280 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fagb-1280-nachher.png)
[Datenschutz 1280 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fdatenschutz-1280-nachher.png)
[404 390 px vorher: ohne Kopf- und Fusszeile](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2F404-390-vorher.png)
[404 390 px nachher: mit Kopf- und Fusszeile](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2F404-390-nachher.png)
[Öffentliche Fehlerseite 1280 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Ffehlerseite-1280-nachher.png)
[Entdecken ohne Treffer 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fentdecken-leer-390-nachher.png)
[Meine Welt 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fmeine-welt-390-nachher.png)
[Meine Welt Lesefehler 390 px nachher: sichtbarer Kasten](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fmeine-welt-fehler-390-nachher.png)

## Textänderungen mit Bedeutung (Etappe 4, einzeln)

1. Buchungen, Reihenfolge: neu «Die zuletzt bestätigte Buchung steht oben.» (en «Your most recently confirmed booking is at the top.»)
2. Buchungen leer: neuer Link «Zu meinen Reisen» (en «Go to my trips»)
3. Buchungen laden: nur noch «Buchungen werden geladen.» (der zweite Satz entfällt)
4. Reisende, Einleitung: neu «Angaben zu dir und deinen Mitreisenden, die du für neue Reisen wiederverwenden kannst.»
5. Reisende, Geltung: neu «Änderungen hier verändern keine bestehende Reise. Für eine Reise gelten die Angaben, die du in diese Reise übernommen hast.»
6. Reisende leer: neu «Lege eine Person an, damit ihre Staatsbürgerschaften und Angaben zu Reisedokumenten (ohne Nummer) für neue Reisen bereitstehen. Vorhandene Reisen ändern sich dadurch nicht.»
7. Reisende löschen, Titel: neu «Diesen Eintrag löschen?»
8. Reisende löschen, Folge: neu «Nur dieser Eintrag in deinem Konto wird gelöscht. Bereits vorhandene Reisen und die Angaben darin werden dadurch nicht umgeschrieben oder gelöscht.»
9. Merkliste leer: Titel «Deine Merkliste ist noch leer.», Text «Merke einen Mietwagen direkt am Ergebnis oder erfasse oben ein Angebot selbst.»
10. Merkliste Lesefehler: Aktion «Erneut laden» statt «Zur Anmeldung»

Prüfung Etappe 4:

- Typprüfung, Lint der geänderten Dateien und alle fünf Hygiene-Checks grün.
- Betroffene Unit-Tests 244/244, Browser-Tests Einstellungen und Kontoanzeige 80/80, Tests zu Übergängen und Breiten 461 ohne Fehlschlag.
- Bekannte Umgebungsfehler, auch auf `main`: native PostgreSQL-Tests und ein esbuild-Bundle mit `node:crypto` (`mounted-matrix`).
- Gemessen: Kontoseiten bei 390 und 1440 px, untere Leiste bei 280–390 px und quer, breite Bildschirme bei 1920, 2560 und 3840 px; kein seitliches Scrollen.

[Handy 320 px: untere Leiste als Raster](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fleiste-320.png)
[Querformat 844×390: fünf Spalten](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fleiste-quer-844x390.png)
[280 px: Kopfzeile ohne Überlappung](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fkopf-280.png)
[Handy 390 px: Aktivitäten laden](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fladen-aktivitaeten-390.png)
[Handy 390 px: Kontoübersicht](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fkonto-390.png)
[Desktop 1440 px: Kontoübersicht](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fkonto-1440.png)
[Handy 390 px: leere Merkliste](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fmerkliste-leer-390.png)
[Desktop 1440 px: Merkliste mit Lesefehler](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fmerkliste-fehler-1440.png)
[3840 px: Übersicht](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fuebersicht-3840.png)

## Textänderungen mit Bedeutung (Etappe 3, einzeln)

1. Herkunft «manuell»: alt «Manuell erfasst. Das ist kein nachgewiesenes Anbieterangebot.» → neu «Von dir eingetragen. Jetnity hat dazu kein Angebot beim Anbieter geprüft.»
2. Herkunft «manuell gebucht»: alt «Von dir als gebucht bestätigt. Keine Provider-Bestätigung.» → neu «Von dir als gebucht markiert. Jetnity prüft Buchungen nicht beim Anbieter.»
3. Herkunft «mit Anbieterangaben»: alt «Es liegen gespeicherte Herkunftsfelder vor. Das ist kein geprüfter Live-Nachweis.» → neu «Mit Anbieterangaben gespeichert. Jetnity hat sie nicht live beim Anbieter geprüft.»
4. Neu im Detail: Hat ein Punkt Anbieterangaben und ist als gebucht markiert, steht zusätzlich der Satz aus Punkt 2. Der Status bleibt deine eigene Markierung.
5. Preis im Detail:
   - vorher nur bei Flügen « · zum Auswahlzeitpunkt»;
   - jetzt bei allen Punkten «Preis beim Auswählen»;
   - ohne Preis steht «Ohne gespeicherten Preis», bei einem unlesbaren Preis «Gespeicherter Preis nicht lesbar».
6. Neu in jedem Bestandsbereich (Flüge, Unterkunft, Mietwagen, Verbindungen): «Gebucht heisst: du hast selbst beim Anbieter gebucht und es hier markiert. Jetnity prüft das nicht beim Anbieter.»
7. Neu beim Entfernen eines Planpunkts. Vorher wurde der Punkt sofort entfernt. Die Rückfrage lautet:
   - «Diesen Punkt entfernen: {Titel}?»
   - «Er verschwindet aus deiner Reise. Das lässt sich nicht rückgängig machen.»
   - bei als gebucht markierten Punkten zusätzlich: «Eine Buchung beim Anbieter bleibt davon unberührt.»
   - Knöpfe «Endgültig entfernen» und «Abbrechen».
8. Einreise: alt «Für diese Themen gilt derzeit nicht verfügbar.» → neu «Für diese Themen liegt derzeit keine geprüfte Angabe vor.»
9. Vorbereitung: Die Zahlkacheln werden durch einen Satz ersetzt. Der Satz nennt nie Visum, Einreise oder «bereit». Beispiele:
   - «0 von 2 Punkten erledigt.»
   - «1 von 3 Punkten erledigt · 1 erneut prüfen · 1 nicht relevant.»
   - «Alle Punkte als nicht relevant markiert.»
   - «Noch keine Vorbereitungspunkte.»
10. Reisende ohne jede Angabe: Die drei Zeilen zu Wohnsitz, Staatsbürgerschaften und Dokumenten werden zu «Noch keine Angaben hinterlegt.»

## Abweichungen vom Plan in Etappe 3

- **Keine Rückfrage bei «Als gebucht markieren».** Das ist umkehrbar, und Beschriftung und Tests sind ein Vertrag. Stattdessen gibt es den Bedeutungssatz aus Punkt 6.
- **Keine Anzeige von Flugänderungen.** Es gibt keinen Flugstatus vom Anbieter, die Anzeige würde einen Stand erfinden. Fristen stehen schon ruhig unter «Als Nächstes».
- **Einreise minimal** wegen #1254.
- **Rote Fehlerzeilen bleiben.** Das grüne Design bildet sie bereits um.
