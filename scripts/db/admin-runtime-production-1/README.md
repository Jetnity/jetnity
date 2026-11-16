# Admin-Datenbank für Jetnity #1212

Der Kandidat erweitert den bestehenden Production-Schutz um Kontozähler, CMS und Kampagnen. Die Quellpakete für den bisherigen Dev-Betrieb und die bestehenden Production-Installationspakete behalten ihre Prüfsummen. Das SQL liegt ausserhalb der automatischen Migrationssuche.

## Lokale Prüfung

Mit Node 22 und lokalem PostgreSQL 17 aus dem Repository-Stamm ausführen.

```sh
node scripts/db/admin-runtime-production-1/build.mjs --check
node --import ./scripts/server-only-test-register.mjs --import tsx --test scripts/db/admin-runtime-production-1/native.test.ts
```

Der Test installiert den echten Production-Vorgänger in einem eigenen lokalen Cluster mit synthetischen Konten. Er prüft die atomare Installation und den vollständigen Rücklauf bei Fehlern, bestehende Berechtigungen und Belege, die nächste reguläre BG1-Prüfung, Kontozahlen sowie das Speichern und erneute Lesen von CMS- und Kampagnenentwürfen. Ein Zugriff mit AAL1 muss scheitern.

## Datenbankschritt nach Freigabe

1. Beim Provider den Default-Branch `main` des Projekts `qscbgcdmivbbnzrcyegn` unabhängig bestätigen. Die aktuell installierte Schutzkette, die sieben freien öffentlichen Funktionsnamen und den Status `current` erneut prüfen. Im selben Fenster darf keine andere Guard-Migration laufen.
2. Einmalig die benannte Migration `admin_runtime_bg1_production_1212` auf genau diesem Projekt in **einer** Provider-Transaktion ausführen. Der erste Befehl dieser Transaktion lautet `SET LOCAL jetnity.admin_runtime_target = 'production:qscbgcdmivbbnzrcyegn:ADMIN-1212';`. Es folgt das bytegenau geprüfte `provider-migration-body.sql`. Die Zielauswahl beim Provider und die Bestätigung im SQL sind voneinander unabhängig.
3. Die Migration legt sechs private CMS-/Kampagnentabellen an. Der Kontozähler liest die bestehenden Konten. Hinzu kommen sieben öffentliche RPCs mit eng begrenzten Rechten und eine unveränderliche BG1-Nachfolgetabelle. Vier bestehende Schutzfunktionen binden die zusätzlichen Objekte und die nächste Prüfgeneration ein. Bestehende Belege, Rollen und Berechtigungen werden geprüft und erhalten.
4. Nach dem Commit die reguläre vollständige BG1-Prüfung im Fünf-Minuten-Takt abwarten. Bis dahin sind BG1-geschützte Vorgänge gesperrt. Erst bei `current` und bestätigter neuer Generation die Anwendungsaktivierung fortsetzen. Bei Abbruch bleibt die Transaktion vollständig zurückgerollt. Bei unklarem Ergebnis zuerst Migrationshistorie, Schutzstatus und installierte Objekte lesen.

## Web und Abnahme

Der ursprüngliche Web-Build von #1212 kann separat freigegeben werden. Die neuen Tabellen werden über den Web-Rollout allein noch nicht in der Admin-Oberfläche verwendet. Dafür braucht es diesen ergänzenden Anwendungsstand. Sein einziger neuer Schalter ist `JETNITY_ADMIN_PRODUCTION_RUNTIME_ENABLED=true`, ausschliesslich serverseitig für Vercel Production. Die Zulassung prüft zusätzlich Projekt, Branch, Hosting-Umgebung und die von der Sitzung tatsächlich verwendete Supabase-URL. Ein aktiver Schalter ersetzt keine Anmeldung, AAL2, Rollen- oder Datenbankprüfung.

Nach der separaten Freigabe des Anwendungsstands den passenden geprüften Production-Build bereitstellen und gezielt auf die Domains übernehmen. Im regulären Owner-Konto beide Kontozahlen und Datenstand lesen, einen CMS-Entwurf mit wiederhergestellten Originaltexten und einen Testkampagnenentwurf mit Archivierung jeweils nach Neuladen prüfen. Die Anwendung schickt dabei keine Kampagne. Für eine Rückkehr zuerst den zuvor bestätigten Web-Build auf die Domains zurücknehmen. Gespeicherte Entwürfe bleiben erhalten. Bei einer Störung der Schutzprüfung den regulären Owner-Ablauf verwenden.
