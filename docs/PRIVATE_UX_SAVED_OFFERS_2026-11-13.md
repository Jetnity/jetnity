# Merkliste – freigegebener Umsetzungsschnitt

PO-Freigabe vom 13.11.2026: neue Tabelle `public.saved_offers` mit eigenen RLS-Regeln,
zuerst im bestehenden Preview `yfvbxvijcorffwxbxahl`. Production erfolgt gemeinsam
mit dem PO. Vor Merge: aktueller main, vollständiger Core grün, keine Überschneidung
mit #1196/#1197, danach ausdrückliche zeitliche Bestätigung. Reisevorbereitung bleibt
vollständig beim Hauptchat. SINGLE_AGENT; kein unabhängiger Review behauptet.

## Umsetzung

- Neue Migration, generierter Typ nur für diese Tabelle, `lib/saved-offers/*`,
  `components/saved-offers/*`, `app/account/merkliste/page.tsx`.
- Bestehende Kontoübersicht und Kontomenü verlinken die Merkliste. Organisieren bietet
  die manuelle Erfassung eines konkreten Angebots. DiscoverCars erhält ein Herz je
  Angebot; der Server liest den bestehenden signierten Angebotsnachweis erneut.
- Nur Referenz, eigener Titel/Anbietertitel, Link, Ziel und Zeitangaben. Keine Preise,
  Bilder, API-Schlüssel, Such-/Zugangstokens oder Buchungsbestätigungen speichern.
- Bestehende Sessionprüfung und RLS-Client. Eigentümer wird serverseitig ermittelt.
  Keine Änderung bestehender Auth-Regeln, Tabellen, Policies oder Providerverträge.
- Hotel-/Flug-/Aktivitäts-Widgets liefern keinen Einzelangebotsdatensatz. Dort bleibt
  manuelle konkrete Erfassung ausdrücklich von automatischem Merken getrennt.
- Neue UI und Persistenz werden auf Eingabegrenzen, fremde Eigentümer, anonymen Zugriff,
  Dubletten, Entfernen und Wiederladen geprüft. Browser-, Login- und Gerätetests werden
  separat ausgewiesen. Ungeprüfte Ergebnisse gelten nicht als bestanden.
- Keine neue kostenpflichtige Infrastruktur; nur kleine zusätzliche Zeilen in der
  bestehenden Datenbank. Preis/Verfügbarkeit müssen beim Anbieter erneut geprüft werden.

## Vorschau-Einstellungen

Nur Branch `feat/private-travel-ux-20261113`: `DISCOVERCARS_API_KEY` und
`OMIO_KATALOG_SCHLUESSEL` als serverseitige Sensitive-Werte,
`JETNITY_DISCOVERCARS_SEARCH_ENABLED` und die öffentliche URL
`NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN`. Separate statische Widget-Vorschau erlaubt
nur den eigenen stabilen Vorschau-Origin. Bestehende Supabase-Public-Werte bleiben.
Production erhält keine neue Variable durch diese Umsetzung; vor dem gemeinsamen
Schritt wird die genaue Soll-/Ist-Liste nochmals vorgelegt.

## Tatsächlich geprüft am 13.11.2026

Chrome mit vorhandenem Preview-Konto: konkretes Hotel manuell merken, nach
Neuladen und unabhängigem zweitem Login wiederfinden. Echte DiscoverCars-Karte
am Herz merken, in der Merkliste finden, entfernen; Löschung auch in der zweiten
Sitzung bestätigt. Hotel mit fünf Nächten und ausdrücklich synthetischer Nachtflug
mit Ankunft am Folgetag als `unconfirmed` übernommen, im Reiseplan angezeigt und
per Datenbank-Readback kontrolliert. Wiederholung erzeugt keinen zweiten Eintrag.
Kein physischer Gerätewechsel behauptet. Ein reines Suchergebnis ersetzt weiterhin
kein konkretes Angebot; bei eingebetteten Anbietern bleibt manuelle Erfassung.

Manuelle Flugzeitzonen stehen in der Notiz, ohne strukturierte Flughafenroute
nicht in der Chronologie. Vollständige Flugroute/Zeitzonen und Datumsgrenzfälle
brauchen den vorhandenen Flugeditor. Eine Route wird nicht aus dem Titel erfunden.

## Ergänzung nach dem Safari-Nachweis

- Mietwagenherzen lesen den eigenen gespeicherten Zustand gesammelt für die
  angezeigten Karten. Wiederholte Suche und Rückkehr aus einem anderen Tab lesen
  neu; ein Ladefehler erscheint nicht als leere Merkliste. Kein Provideraufruf
  pro Herz. Identität bleibt die bestehende Angebotsreferenz samt Mietzeiten.
- Bei einem ausdrücklich gewählten Flug ohne Umstieg kann die Planübernahme
  Abflug- und Ankunftsflughafen mitnehmen. IATA-Referenzen werden ausschliesslich
  serverseitig gelesen; Länder und Orte kommen nicht aus dem Browser. Das
  bestehende Route-Itinerary erhält lokale Ankunftsdaten über die Datumsgrenze.
  Die Legacy-Zusammenfassung erfindet dabei keine negative Flugdauer.
- Keine neue Tabelle, Migration, Policy, Variable oder Anbieterfreigabe. Eigene
  Serveraktionen und deren eigenes Hash-Inventar ergänzt; `audit.mjs`,
  `audit.test.mjs` und `Reisevorbereitung.tsx` bleiben bis #1197 unverändert.
- 13 gezielte Tests und 41 Security-Tests grün; TypeScript grün. Neue Browser-
  Nachweise und vollständige CI sind nach Deployment separat festzuhalten.
- iPhone-Synchronisierung wurde gefunden, ist gesperrt. PO meldet das iPhone
  derzeit als nicht verfügbar. Eine echte Geräteabnahme bleibt ausdrücklich
  offen; schmale Chrome-Ansicht und Desktop-Safari ersetzen sie nicht.

Grenze bleibt: eingebettete Hotel-, Flug- und Aktivitätenanbieter geben keine
konkreten Angebote an Jetnity zurück. Die funktionierende Alternative ist ein
selbst erfasster konkreter Angebotslink, keine allgemeine Suche. Umsteigeverbindungen
werden im vorhandenen Flugeditor erfasst. Zeitzonen stehen als eigene Angaben in
der Notiz; daraus wird keine bestätigte UTC-Chronologie abgeleitet.

Aktueller Freigabe-/Konfliktstand und genaue Grenzen:
[Freigabepunkte](PRIVATE_UX_FREIGABEPUNKTE_2026-11-13.md).
