# Travelpayouts: begrenzte Website-Verifizierung

## Auftrag und Umfang

Sasa hat am 11.11.2026 ausdrücklich die Website-Verifizierung für jetnity.com
beauftragt. Projekt: Jetnity, Travelpayouts-Projekt-ID 599224, Marker 804084.
Die bestehende Flugsuche und andere Partnerintegrationen bleiben unverändert.

## Umsetzung

`public/travelpayouts-verifizierung.html` ist eine eigenständige, nicht zur
Indexierung vorgesehene Seite auf der tatsächlichen Website. Erst ihr Startknopf
lädt den unveränderten persönlichen Anbieter-Code aus dem Partnerportal:
`https://emrldtp.cc/NTk5MjI0.js?t=599224`.

Die vom Portal gelieferten `init_marker`, `init_trs` und `init_locale` werden
für die offizielle Installationsmeldung verwendet. Es gibt keine nachgebildete
Bestätigungsantwort und keinen Eingriff in Anbieteranfragen. Ein geladenes
Skript allein wird ausdrücklich nicht als erfolgreiche Kontoverifizierung
ausgegeben. Auf localhost und Vorschaudomains ist der Start deaktiviert.

Keine Einbindung in das globale Layout, keine private Reise-/Kontodarstellung
auf dieser Seite und kein SPA-Wechsel zurück: der Link zur Startseite lädt ein
neues Dokument. Drive darf nicht versehentlich über interne Navigation auf
den privaten Reisebereich übergehen. Die vorhandene CMP ist nicht freigegeben;
deshalb wird nicht auf eine nur vermeintlich aktive Einwilligung vertraut.

Dies ist keine flächendeckende Drive-Installation. Ob Travelpayouts die
begrenzte Installation als Website-Verifizierung anerkennt, muss nach dem
Deployment im tatsächlichen Konto geprüft werden. Die Anleitung empfiehlt
eine Installation auf allen Seiten; eine solche globale Automatik ist nicht
Gegenstand dieses Auftrags.

## Prüfung und externe Abnahme

- Lokale Prüfung, Vorschau, Production-Build und externer Kontostatus: noch offen.
- Nach Anerkennung: echte Drive-Einstellungen prüfen und zusätzliche
  Monetarisierungsfunktionen ausschalten, soweit sie aktiviert wurden.
- Keine Datenbank-/Auth-Änderung, keine neue Abhängigkeit, keine Secrets.
- Auszahlungsmethode bleibt ein separater Kontoschritt.

## Anbieterquellen

- [Website-Besitz bestätigen](https://support.travelpayouts.com/hc/en-us/articles/26411796684818-How-to-confirm-that-you-own-a-website)
- [Installation](https://support.travelpayouts.com/hc/en-us/articles/21844864838290-How-to-install-Drive-on-your-website)
- [Funktionen und Einstellungen](https://support.travelpayouts.com/hc/en-us/articles/32083238510482-Drive-functionalities-and-settings)
