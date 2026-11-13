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
