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

## Prüfstand vor Hosted-Preview

- 46 gezielte Prüfungen mit Node 22 erfolgreich, einschliesslich echter Seiten-/Komponentenadapter, Schwelle, Vorrang, ungültiger Daten, Fehler, Timeout und geschlossener Admin-Schreibwege.
- Next-Routentypen und TypeScript erfolgreich; Setup und die fünf Hygieneprüfungen erfolgreich. Der lokale Setup-Hinweis auf eine fehlende `.env` ist erwartbar: die Dev-Verbindung wird ausschliesslich der Hosted-Preview zugeordnet.
- Unabhängige Quellprüfung ohne konkrete Fehler oder sicherheitsrelevante Blocker. Die vollständige lokale Core-Suite, ESLint und der Hosted-Build laufen beziehungsweise stehen noch aus.
- Die exakte Preview-Adresse und der tatsächliche Browser-Nachweis werden nach dem Build ergänzt. Eine blosse statische Preview ohne den neuen aktiven CMS-Leser gilt nicht als Abnahme.

Production und die vier CMS-Veröffentlichungen sind nicht freigegeben. Es gibt keinen Merge und keinen vierten PR.
