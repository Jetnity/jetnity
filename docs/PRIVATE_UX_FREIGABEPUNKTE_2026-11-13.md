# Aktuelle Freigabe und verbleibende Grenzen – PR #1198

Die jüngste PO-Antwort ersetzt die frühere allgemeine Zeitfreigabe:

- Merkliste: nur neue Tabelle `saved_offers` und ihre RLS, zuerst bisherige
  Vorschau-Datenbank, Production gemeinsam mit dem PO. Bestehende Tabellen,
  Regeln und Auth bleiben unverändert.
- `components/trips/Reisevorbereitung.tsx` bleibt vollständig beim Hauptchat.
- Vorschau-Einstellungen sind freigegeben; API-Schlüssel ausschliesslich serverseitig.
- Vor Production genaue Variablenliste vorlegen. Vor Merge aktuellen main holen,
  #1196/#1197 auf Überschneidungen prüfen und vollständigen Core-PASS abwarten.
  Erst dann den PO fragen, ob der Zeitpunkt passt.

## Ausgeführt in der Vorschau

Branch basiert auf veröffentlichtem main `63544e8`. Die beiden Hauptchat-PRs
bleiben unverändert. Kein Merge und keine Production-Veröffentlichung.

Neue Migration `20261113173524_saved_offers.sql` auf Preview-Projekt
`yfvbxvijcorffwxbxahl` installiert. RLS-Transaktion unter zwei vorhandenen
Kontoeigentümern bestanden: eigenes CRUD erlaubt; fremdes Lesen, Ändern,
Löschen und fremde Eigentümer beim Anlegen gesperrt; anonymes Lesen gesperrt.
Alle Testzeilen zurückgerollt. Bestehender Policy-Fingerprint vorher/nachher:
`4971993b6a3d775e01cc66eac9dc8d02`. Keine Auth-Konten erstellt/geändert.

Die Oberfläche enthält jetzt kontoweite Merkliste, Entfernen, manuelle konkrete
Angebotserfassung, ein DiscoverCars-Herz mit serverseitiger Nachprüfung und
vorausgefüllte Planübernahme. Dieser Code ist bis zum neuen Deployment und
angemeldeten Browsertest ausdrücklich noch kein Funktionsnachweis.

## Genaue Konfiguration

| Variable | Eigene Vorschau | Production vor gemeinsamem Schritt |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Unverändert bisherige Vorschau-DB | Bestehenden Live-Wert behalten |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Unverändert bisheriger öffentlicher Key | Bestehenden Live-Wert behalten |
| `NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN` | Öffentliche URL der getrennten statischen Widget-Vorschau | Bestehendes `https://jetnity-flight-widget.vercel.app` behalten |
| `NEXT_PUBLIC_ACTIVITIES_FRAME_ORIGIN` | Öffentliche URL der getrennten statischen Aktivitätsrahmen | Nicht setzen; bestehende Live-Routen bleiben |
| `JETNITY_DISCOVERCARS_SEARCH_ENABLED` | Bestehenden aktivierten Suchwert übernommen | Bestehenden Wert behalten |
| `DISCOVERCARS_API_KEY` | Serverseitiger Sensitive-Wert, vorhandene Integration | Bestehenden serverseitigen Wert behalten |
| `OMIO_KATALOG_SCHLUESSEL` | Serverseitiger Sensitive-Wert, vorhandene Integration | Bestehenden serverseitigen Wert behalten |

Nach aktuellem Abgleich sind **keine zusätzlichen Production-Variablen** nötig.
Vor dem gemeinsamen Schritt nochmals live prüfen. Keine Schlüsselwerte in Git,
Browsercode oder Bericht. Kein service_role-Schlüssel übernommen.

Widget-Preview: `jetnity-flight-widget-agzgac1z3-jetnity-e1b93c82.vercel.app`,
Deployment `dpl_HgvAf8LyQkaiaN1Y2mhT4QSSzcHN`, target Preview, READY. Dessen CSP
lässt nur den stabilen eigenen App-Vorschau-Origin als Parent zu. Das bestehende
produktive Widget wurde nicht geändert.

## Offene Nachweise und Grenzen

- Der volle Core muss auf dem neuen Code-Head grün sein; alte Ergebnisse ersetzen ihn nicht.
- Echte angemeldete Browserprüfung, erneuter Login und zweites Gerät fehlen noch.
- Safari-Zugriff fehlt (Remote Automation deaktiviert); echtes iPhone nicht vorhanden.
- Hotel-/Flug-/Aktivitäts-Widgets liefern keine verifizierbaren Einzelangebotsdaten.
  Kein Herz über einer Suchseite als angebliches konkretes Angebot. Manuelle
  Erfassung ist getrennt gekennzeichnet. Preise/Bilder/Tokens werden nicht gespeichert.
- Datumsgrenzen der vorhandenen Reise-Datenbank bleiben: Ein Flug über die Datumsgrenze
  mit rückwärts laufendem lokalem Datum benötigt den vollständigen Flugeditor.
  Die Merkliste darf ihn behalten, die einfache Übernahme weist die Grenze aus.
- Öffentliche CDG/BKK-Referenzsuche in Preview ist leer, Live nicht. Keine alten
  Tabellen/RLS oder Referenzdaten ohne zusätzliche konkrete Freigabe ändern.
- Credentialless Aktivitätsrahmen verwenden in der Vorschau eine getrennte öffentliche
  statische Hülle mit exakter Parent-CSP. Consent, Sandbox und Nachrichtenprüfung bleiben.
  Production nutzt ohne Vorschauvariable unverändert die bestehenden eigenen Embed-Routen.
  Browsernachweis des neuen Deployments steht noch aus.
- Stadtbilder decken bisher zehn Ziele ab; weltweite automatische Abdeckung bleibt offen.

Details zum begrenzten Merkliste-Schnitt: [Umsetzungsnachweis](PRIVATE_UX_SAVED_OFFERS_2026-11-13.md).
