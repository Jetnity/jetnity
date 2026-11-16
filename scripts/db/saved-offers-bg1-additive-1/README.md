# Merkliste nach dem Admin-Rollout

Dieses Paket bereitet die ursprüngliche Migration `20261113173644_saved_offers` für den Production-Stand nach #1220 vor. Es ist ein eigener Datenbankschritt. Der Generator liest den unveränderten Git-Blob der Merkliste und die geprüfte Admin-Migration. Das Ziel wird beim Provider unabhängig vom Zielwert im SQL ausgewählt.

## Vorbereitung und Prüfung

```sh
node scripts/db/saved-offers-bg1-additive-1/compose.mjs --check
node --import ./scripts/server-only-test-register.mjs --import tsx --test scripts/db/saved-offers-bg1-additive-1/native.test.ts
```

Der native Test verwendet PostgreSQL 17, synthetische Konten, den installierten Production-Vorgänger und echte BG1-Prüftermine. Für die gehostete Vorschau, auf der die Tabelle schon vorhanden ist, genügen lesende Bestandsprüfungen. Eine Wiederholung der Erstinstallation dort würde den vorgeschriebenen Ausgangsstand verletzen.

## Freigabe und Ausführung

1. Separates Zeitfenster vom PO bestätigen lassen. Am bestätigten Stand von #1221 alle Pflichtprüfungen und den nativen Nachweis prüfen. Den ausgegebenen SQL-Inhalt und seine SHA-256-Prüfsumme dem freigegebenen Stand zuordnen.
2. In Supabase den Production-Hauptbranch `qscbgcdmivbbnzrcyegn` verifizieren. Mit lesendem Zugriff die installierte Admin-Baseline, den aktuellen BG1-Status sowie die Abwesenheit von Merkliste, neuer Baseline und Merklisten-Migration prüfen. Im selben Zeitfenster darf keine zweite Schutzmigration laufen.
3. Im SQL-Editor des verifizierten Projekts genau **eine** Transaktion senden. Unmittelbar nach ihrem ersten `BEGIN;` steht `SET LOCAL jetnity.saved_offers_target = 'production:qscbgcdmivbbnzrcyegn:SAVED-OFFERS-BG1-1';`. Der Rest entspricht dem geprüften Bundle. Der Installer protokolliert die ursprüngliche Migrationsnummer selbst. Bei unklarem Ergebnis zuerst die Migrationshistorie und die installierten Objekte lesen.
4. Nach dem Commit die nächste reguläre vollständige BG1-Prüfung und die erreichte neue Generation bestätigen. Bis dahin können geschützte Adminaktionen vorübergehend gesperrt sein. Anschliessend die vier Eigentümerregeln, die eingeschränkten Änderungsrechte, den gesperrten anonymen Zugriff sowie die weiter geschützten Adminfunktionen lesen. Mit einem vorgesehenen Testkonto ein eigenes Angebot merken, neu laden und entfernen.
