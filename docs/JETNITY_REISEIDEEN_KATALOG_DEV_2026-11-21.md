# Reiseideen: Katalogergänzung in Dev – 21.11.2026

## Auftrag und Grenzen

Der Owner hat am 21.11.2026 die Entwicklung und Prüfung in Dev freigegeben: Bei weniger als acht veröffentlichten Reiseideen soll der vorhandene statische Katalog zusätzlich angezeigt werden. Erstbesucher sollen auch ohne CMS-Veröffentlichung eine nutzbare Auswahl erhalten. Production, Login/2FA und die Veröffentlichung der vier CMS-Einträge bleiben unverändert; jede Veröffentlichung benötigt ein eigenes Owner-Go.

Die drei offenen PRs #1240, #1264 und #1266 bleiben unangetastet. Dieser Slice erhält einen eigenen Dev-Branch mit Preview, vorerst keinen vierten PR und keinen Merge. Der vorangegangene Website-Release #1265 ist abgeschlossen und wird hier nicht erneut ausgeführt.

## Nur lesend geprüfte CMS-Einträge

| Titel | Ziel | Vollständig | Bild vorhanden |
| --- | --- | --- | --- |
| Bali | Bali, Indonesien | Ja | Ja |
| Lissabon | Lissabon, Portugal | Nein | Ja |
| Zermatt | Zermatt, Schweiz | Nein | Ja |
| Amsterdam | Amsterdam, Niederlande | Nein | Ja |

Vollständig bedeutet ein gespeicherter Entwurf mit gültigen Pflichtfeldern und passenden festen Referenzdaten. Nur Bali hat einen solchen Entwurf; bei den anderen drei Einträgen fehlt eine gespeicherte Entwurfsrevision. Alle vier referenzierten Bilddateien sind im Repository vorhanden und als Bilddaten erkennbar. Diese technische Inhaltsprüfung ist keine redaktionelle Freigabe oder neue Bildrechteprüfung. Es gibt keine veröffentlichte Revision. Produktionsabfragen liefen ausschliesslich in Transaktionen mit `READ ONLY` und `ROLLBACK`; keine Entwurfstexte oder Akteursdaten werden hier veröffentlicht.

## Umsetzungsplan vor Implementierung

- Die vorhandene strikte Prüfung veröffentlichter CMS-Revisionen bleibt erhalten. Erst danach ergänzt eine zentrale pure Funktion den vorhandenen statischen Katalog: eindeutige veröffentlichte Orts-IDs zählen, unter acht fehlende Katalog-IDs anhängen, veröffentlichte Fassung und Reihenfolge bevorzugen. Eingaben bleiben unverändert.
- Beide öffentlichen Seiten verwenden denselben Server-Leser. Die Zustände gemischte Auswahl und statischer Ersatz bei fehlgeschlagenem CMS-Abruf bleiben von bestätigter Veröffentlichung beziehungsweise einem bestätigten leeren CMS-Bestand unterscheidbar. Ein Abruffehler zeigt einen verständlichen Hinweis und ausschliesslich bekannte statische Inhalte.
- Betroffene Module: `lib/inspiration/`, die beiden vorhandenen Inspiration-Komponenten, die Einleitung von `/entdecken` und ausschliesslich der öffentliche CMS-Leseweg. Suche, Themen, native Details und die bestehenden Planungslinks bleiben erhalten; keine neue Route oder Anbieterintegration.
- Für einen echten Hosted-Nachweis wird nur der öffentliche CMS-Leseweg für den exakt benannten Dev-Preview-Branch mit bestehendem Dev-Flag, richtigem Vercel-Projekt und Dev-Supabase-Ziel zugelassen. Der gemeinsame Admin-Schreibzugang, Identitätsprüfung, AAL2 und Production-Zulassung bleiben unverändert. Eine bereits statische Preview allein gilt nicht als Nachweis des neuen aktiven CMS-Pfads.
- Keine Datenbankmigration, keine Rechte-, Rollen-, Schlüssel-, Login- oder 2FA-Änderung. Keine Veröffentlichung, Buchung, Zahlung oder neuen laufenden Kosten. Ein nur auf Preview und diesen Branch begrenztes vorhandenes Funktionsflag darf für den Dev-Nachweis gesetzt werden; keine Production-Einstellung wird verändert.
- Prüfung: 0/1/7/8/9 eindeutige Veröffentlichungen, Dubletten vor der Zählung, Vorrang der veröffentlichten Texte und Planungslinks, strikte Abweisung ungültiger CMS-Daten, Fehler-/Timeout-Verhalten, tatsächliche öffentliche Seiten mit aktivem Leser, Typen/Lint/Hygiene und Build. Danach Hosted-Preview auf Desktop und mobiler Breite prüfen; kein echter Gerätetest behaupten.

## Wichtige Bestandsgrenze

Der bestehende CMS-Vertrag erlaubt aktuell genau vier bekannte Identitäten und höchstens vier veröffentlichte Einträge. Er wird für diese Auswahlregel nicht erweitert. Die Schwelle acht wird mit synthetischen, typisierten öffentlichen Zielen an der reinen Zusammenführungsfunktion geprüft. Bei null veröffentlichten Ideen ergeben sich die vier vorhandenen statischen Ziele, nicht acht erfundene Ideen. Bei gleicher Orts-ID erscheint nur eine Karte; eine bestätigte veröffentlichte Fassung hat Vorrang vor dem statischen Katalog.

## Implementierung und Dev-Konfiguration

Die Auswahlregel ist in `lib/inspiration/catalog-supplement.ts` umgesetzt und wird von beiden Seiten über `publicInspiration` verwendet. `cms-preview-read.ts` lässt ausschliesslich den öffentlichen Leser für `fix/inspiration-catalog-under-eight-dev-20261121`, das bestehende Vercel-Projekt und das bestehende Dev-Supabase-Projekt zu. Der ursprüngliche Admin-Zugang bleibt auch mit diesem Preview-Flag für den neuen Branch geschlossen. Der öffentliche Leser verwendet die bereits installierte Dev-Funktion `cms_inspiration_published_v2`; deren Definition und Ausführung wurden mit `anon` in einer expliziten Read-only-Transaktion geprüft: null veröffentlichte Einträge, kein Schreib- oder Sperrpfad.

Nur `Preview` und dieser exakte Branch erhalten `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` und `JETNITY_ADMIN_DEV_RUNTIME_ENABLED` aus der vorhandenen Dev-Konfiguration. Kein neuer Schlüssel wird erstellt, keine Production-Variable angepasst. Die Git-Automatik ist in diesem Kandidaten ausschliesslich für den eigenen Branch ausgeschaltet, damit zuerst die Branch-Zuordnung gesetzt und danach genau der geprüfte Stand ausdrücklich als Preview gebaut werden kann; der bestehende Eintrag für `main` bleibt unverändert.

## Prüfstand nach Hosted-Preview

- 46 gezielte Prüfungen mit Node 22 erfolgreich, einschliesslich echter Seiten-/Komponentenadapter, Schwelle, Vorrang, ungültiger Daten, Fehler, Timeout und geschlossener Admin-Schreibwege.
- Next-Routentypen und TypeScript erfolgreich; Setup und die fünf Hygieneprüfungen erfolgreich. Der lokale Setup-Hinweis auf eine fehlende `.env` ist erwartbar: die Dev-Verbindung wird ausschliesslich der Hosted-Preview zugeordnet.
- Unabhängige Quellprüfung ohne konkrete Fehler oder sicherheitsrelevante Blocker. ESLint beendet sich erfolgreich mit null Fehlern und 206 Warnungen. Der Vercel-/Next-Build ist erfolgreich und die Preview ist `READY`.
- Vollständiger lokaler Core-Lauf: 10'374 Tests, 10'031 bestanden, 274 fehlgeschlagen, 59 abgebrochen und zehn übersprungen, Exit 1. Damit ist die Gesamtprüfung ausdrücklich **nicht grün**. Die Umgebung hat kein `/opt/google/chrome/chrome` und kein lokales PostgreSQL (`initdb ENOENT`); bestehende Bern-G3-Fixtures lehnen die gesetzten `NODE_EXTRA_CA_CERTS`/`SSL_CERT_FILE` ab und ein stderr-Vertrag trifft auf die Runtime-Warnung `UNDICI-EHPA`. Kein Fehler in den neuen Katalog-/Preview-Guard-Prüfungen oder in `cms-public`, kein Modulauflösungsfehler. Keine Tests abgeschwächt, keine zweite breite Ausführung und keine Auth-/Production-Probe. Vor einer späteren Merge-/Production-Freigabe bleibt ein vollständiger grüner Lauf in der vorgesehenen CI-Umgebung erforderlich.

## Konkrete Preview und Browser-Nachweis

- **Preview:** <https://jetnity-djl3aovs9-jetnity-e1b93c82.vercel.app/entdecken>
- **Geprüfter Quellstand:** `d53a94cf324180b96e885dc8a4b04db1a09945d2`; Vercel-Deployment `dpl_HWfgaaEvAZL1ZjfxjvPrFZrnyUBB`, Umgebung Preview (`target: null`), exakt der eigene Dev-Branch. Ein anschliessender reiner Dokumentationscommit ändert diesen geprüften Laufzeitstand nicht und löst keinen weiteren Build aus.
- **Aktiver CMS-Pfad:** `/entdecken` liefert HTTP 200, vier Artikel und den serverseitig serialisierten Zustand `supplemented`; kein `static`-Status, keine Leerbestandsmeldung. Zusammen mit den Dev-API-Logs für `cms_inspiration_published_v2` als `anon` ist damit die echte Ergänzung nach einem erfolgreichen öffentlichen CMS-Lesezugriff belegt.
- **Erstbesucher:** Cloud-Chrome ohne Jetnity-Anmeldung zeigt auf der Startseite und `/entdecken` alle vier Ziele mit geladenen Bildern. Zielsuche „Zermatt“ liefert ein Ziel, „Stadt & Kultur“ zwei, Zurücksetzen wieder vier; native Details für Bali öffnen sich. Die bestehenden Planungslinks enthalten jeweils die erwartete feste Ziel-ID und statische Planungsidee. Keine Reise wurde angelegt und kein Login-/2FA-Ablauf bedient.
- **Schmale Ansicht:** Bei 539 CSS-Pixeln über den regulären Browserzoom bleiben beide Seiten ohne horizontalen Überlauf und mit einspaltigen Karten nutzbar. Suche „Museen“, Öffnen der Amsterdam-Idee und Zurücksetzen funktionieren. Anschliessend auf 100 % beziehungsweise 1'348 CSS-Pixel zurückgestellt. Die Geräteemulation ist durch die Browserrichtlinie gesperrt; es wird weder ein emuliertes Telefon noch ein physischer Gerätetest behauptet. Der lokale Browseranschluss des Owners war nicht verfügbar; dies ist eine Cloud-Chrome-Abnahme.
- **Echter Ausfallfall:** Ein Homepage-Reload traf auf HTTP 503 / `PostgREST; error=PGRST002` der Dev-Daten-API. Alle vier statischen Karten und der ehrliche Verfügbarkeitshinweis blieben sichtbar. Die gelesenen API-Logs enthalten daneben drei erfolgreiche anon-Aufrufe; die anschliessende Explorer-Navigation zeigte die normale Auswahl ohne Fehlerhinweis. Keine Datenbankänderung zur Behandlung dieses Einzelereignisses. Die Anwendung bildet den Ausfall korrekt ab; eine dauerhafte Störungsfreiheit der Daten-API wird daraus nicht abgeleitet.
- **Laufzeitgrenzen:** Im abgefragten Preview-Zeitfenster fanden sich keine Vercel-Logs der Stufen Warning/Error/Fatal. Die gelesenen Browserfehler betrafen ausschliesslich die Browser-Erweiterung („Error sending browser metadata to extension“), nicht die App. Der abgefangene Daten-API-Fehler wird oben trotzdem ausdrücklich erfasst.

## Änderungen, Freigaben und nächster Schritt

Die drei genannten Vercel-Variablen wurden ausschliesslich für Preview und den eigenen Branch erstellt und danach im selben Scope zurückgelesen. Keine bestehenden Einträge anderer Branches wurden überschrieben. Die Live-Aliase `jetnity.com` und `www.jetnity.com` zeigten nach dem Preview-Build weiterhin auf den bisherigen Release `dpl_6ADk112pL7VsxiCWSxdzA5pxa4ba`.

Der Owner kann diese Preview prüfen. Die vier CMS-Einträge bleiben unveröffentlicht; jeder Eintrag benötigt weiterhin ein eigenes Go. Production, Login und 2FA sind unverändert. Es gab keine neue Datenbankmigration, Rolle, Berechtigung, Schlüsselrotation, Anbieterregistrierung oder neue laufende Kosten. Es gibt keinen Merge, keinen Production-Deploy und keinen vierten PR. Die vollständige CI-Abnahme sowie ein ausdrückliches späteres Production-Go bleiben getrennte Gates.
