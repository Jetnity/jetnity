# 12Go Timetable 1 — Anbieterbelege und Abnahme

Stand: 1. November 2026, Europe/Zurich. PR #1101; Ausgangs-Main `ab37bd4601f322b0ef72367bec9f0ce2bd4eb09a`. Die ursprünglichen Prüfungen unten bleiben historische Entwicklungsbelege. Inzwischen ist #1101 regulär gemergt, Main `68071953355e1164891611e7eea9a26c00c7cd6a` live; [separate Release-Abnahme](https://github.com/Jetnity/jetnity/pull/1101#issuecomment-6561940221). Die danach entdeckte Bangkok-ADM1-Lücke und ihre Korrektur sind im [Korrekturauftrag](TWELVE_GO_BANGKOK_REGION_FIX_TASK_2026-11-01.md) getrennt dokumentiert. Frühere PASS-Aussagen verwendeten Bangkok-Stadt und belegen keine vollständige Ortsabdeckung.

## Offizielle Quelle

Im angemeldeten Partnerportal gelesen: [Timetable](https://agent.12go.asia/timetable), [CSS-Feldbeschreibung](https://agent.12go.asia/timetable/css), [Beispiel](https://agent.12go.asia/timetable/example), [PHP-Referenz herunterladen](https://agent.12go.asia/timetable-get/). Die Sicherheitsprüfung im Browser wurde vom Kontoinhaber selbst gelöst.

Der unveränderte Download ist die PHP-Referenz v2.0, SHA256 `fa53ce2b40e2011414d645cf1b393812996a385d14a12166099e8cc7daad0431`. Die Referenz dokumentiert `get12GoTimetable(country, from, dest, class, noreturn, lesslinks, lang, curr)`. Die verwendete GET-Adresse und sämtliche Parameter stammen daraus:

`https://12go.asia/de/timetable/{country}/{from}/{to}?embedded&css=yes&z=17323861&noreturn&lang=de&currency=CHF`

Die Referenz nennt TH, MY, KH, VN und SG. Diese Liste ist **keine implementierte Vollabdeckung**: Jetnity verwendet vorerst nur die unten belegten Ortsidentitäten. Abfahrtsklassen und -zeiten, Preisbereiche und typische Dauer sind allgemeine Informationen. Die offizielle CSS-Beschreibung bezeichnet die Dauer als durchschnittliche Reisezeit. Dieser Dienst dokumentiert keine date-/pax-Parameter; solche Parameter werden nicht erfunden. Die native Darstellung und der sichere Parser sind Jetnitys Implementierung, kein unverändert eingebundenes offizielles Widget und keine zertifizierte Booking-API.

## Verifizierte Ortsidentität und geografische Grenze

| Jetnity / GeoNames | Provider-Zielregion | Beleg |
| --- | --- | --- |
| `geonames:1609350`, Bangkok, TH | Bangkok | [GeoNames Bangkok](https://www.geonames.org/1609350/bangkok.html), Hauptstadt 13.75398 / 100.50144; echte Timetable-Antwort Bangkok–Koh Chang |
| `geonames:1609348`, Bangkok, TH | Bangkok | [GeoNames Bangkok ADM1](https://www.geonames.org/1609348/bangkok.html), Verwaltungsregion 13.87719 / 100.71991; Verwaltungshierarchie des Stadteintrags 1609350 verweist hierauf. Ergänzung nach Live-Befund, 1. November 2026; dieselbe allgemeine Provider-Region, keine Haltestellenaussage. |
| `geonames:1611309`, Ko Chang, TH | Koh Chang, Trat | [GeoNames Ko Chang](https://www.geonames.org/1611309/ko-chang.html), Insel 12.0488846 / 102.2994733; echte Antworten Bangkok–Koh Chang und Koh Chang–Phuket |
| `geonames:1151254`, Phuket, TH | Phuket | [GeoNames Phuket](https://www.geonames.org/1151254/phuket.html), Ort 7.89059 / 98.39810; echte Antwort Koh Chang–Phuket |

Die gleichnamige [Ko-Chang-Insel in Ranong, `1153735`](https://www.geonames.org/1153735/ko-chang.html), ist ein anderer Ort und wird ausdrücklich abgewiesen. Ebenso unbekannte IDs, nur passende Namen, widersprüchliche Länder sowie Ortsnamen/ID-Mischungen. Phuket-Stadt wird nur als Zugang zur allgemeinen Provider-Zielregion behandelt, niemals als konkrete Haltestelle. Alle Haltestellen und Abholorte sind bei 12Go zu prüfen. Keine Namenssuche ohne belegte ID. Eine breitere Registry braucht weitere geografisch geprüfte Belege.

Bangkok-Stadt und die belegte Bangkok-Verwaltungsregion werden ausschließlich in diesem Timetable-Adapter derselben Region zugeordnet. Die Reise bleibt unverändert. Eine Kante zwischen beiden IDs erzeugt keine Bangkok–Bangkok-Abfrage. Andere Verwaltungsregionen werden daraus nicht automatisch zugelassen. Siehe [Korrekturauftrag V1](TWELVE_GO_BANGKOK_REGION_FIX_TASK_2026-11-01.md).

## Echte Browserprobe

Neue isolierte Chromium-Umgebung 140.0.7339.16, ohne persönliche Cookies oder Anmeldungen. Lokaler Next-Dev-Server, kein Vercel-Preview und keine Production-Abnahme. Öffentliche Supabase-Verbindungswerte sind ausschließlich lokale Dummywerte; keine echte Datenbank wurde verbunden. Gastreise wurde künstlich im vorgesehenen Gast-Speicher angelegt; dies ist kein Test des Reise-erstellen-Formulars.

URL: `http://localhost:3488/reisen/trip-qa-12go?ansicht=organisieren&bereich=mobilitaet`. Zeitraum 15.–25. November 2026, zwei fiktive Reisende, Bangkok–Ko Chang–Phuket. UI-Abrufe am 1. November 2026 ungefähr 17:03–17:10 CET. Keine Buchung, kein Checkout, keine Zahlung.

- Bangkok–Koh Chang: echte Antwort mit Bus, privatem Transfer, Fähre und Minivan. Beispielwerte während des Abrufs: CHF 18.32–20.77 / 6–10h für Bus; CHF 99.43–236.48 / 5–7h für privaten Transfer. Dies sind historische Testbelege, keine aktuell garantierten Angebote.
- Koh Chang–Phuket: nach einem echten Timeout und anschliessender Wiederholung eine echte Bus-Antwort (damals CHF 53.65 / 1d 3h 30m). Ein Timeout bleibt Fehler, niemals „keine Verbindung“.
- Tatsächlicher Klick auf die Bus-Karte: erster Navigationsrequest `https://12go.asia/de/bus/bangkok/koh-chang?z=17323861&curr=CHF`; erreichte Adresse `https://12go.asia/de/bus/bangkok/koh-chang`. Sichtbarer Inhalt: „Busse von Bangkok nach Koh Chang“, Deutsch, CHF, Auswahl von Datum und Reisenden. 12Go wählte selbst 4. November und zwei Personen; **Jetnity hat diese Werte nicht übertragen**. Die Query wird nach Ankunft entfernt. Die Weiterleitung funktioniert; eine Provisionszuordnung ist nicht nachgewiesen.
- Die vom Timetable gelieferten Links enthalten `z=17323861` und `curr=CHF`, aber keinen `sub_id`. Jetnity fügt am Anbieterlink keinen undokumentierten Parameter hinzu. Der bisherige generische Rückfall-Link behält seine vorhandene Kennung.
- Vor dem Klick: keine 12Go-Drittanbieterressource im Browser. Jetnitys Server liest den offiziellen Fahrplandienst; keine Personen-, Reise-ID-, Datum- oder Teilnehmerfelder gehen an 12Go. Reiseinhalt im Gastspeicher vor/nach Prüfung bytegleich.
- Breiten 320, 390, 768 und 1440 CSS-px: kein seitlicher Seitenüberlauf. Sichtprüfung von Karten und Textumbruch durchgeführt. Vergrösserung: Root-Schrift explizit von 16 auf 32px (200 %), kein Browserzoom-Test. Schrift und Karten umbrechen; keine echte Hardware-/VoiceOver-Abnahme.
- Tastatur: Klassen-/Zeitdetails mit Fokus+Enter geöffnet. Streckenwechsel mit Fokus+Enter. Grün-Schalter funktionsfähig; aktuelle Tokens verwendet.
- Separater, ausdrücklich synthetischer Fehlertest: verspätete Antwort der vorigen Route überschreibt nicht die neue; Mietwagen-Tab entfernt Fahrplan und löst keinen neuen Abruf aus; falsche Ranong-ID löst null Fahrplananfragen aus; Route mit erneutem Bangkok zeigt exakt Bangkok–Ko Chang, Ko Chang–Phuket und Phuket–Bangkok; unbekannte/ungeklärte Ergebnisse bleiben vom Transportfehler getrennt.

Bereinigte Screenshots und Prüfskripte liegen lokal unter `outputs/12go-ausbau-2026-11-01/qa/` im Work-Arbeitsverzeichnis. `browser-result.json` enthält nur künstliche Reisedaten/öffentliche URLs und die Prüfergebnisse. `adversarial-ui-result.json` gehört ausschliesslich zur simulierten Fehlerprüfung. Kein vollständiger Sitzungs-/Netzwerkdump wird veröffentlicht.

## Technische Prüfungen

Prüfstand 1. November 2026, 17:22 CET (Europe/Zurich), vor dem Implementierungs-Commit:

- `npm ci`, Typecheck und vollständiger Production-Build: PASS. Nur lokale Dummywerte für Supabase, kein Datenbankzugriff. Dieser Build belegt Kompilierbarkeit, keine Production-Aktivierung.
- 11 neue Parser-/Schema-/Service-/HTTP-Tests: PASS. Im unabhängigen Review zusätzlich 37 bestehende Affiliate-/Workspace-Tests: PASS.
- Vollständiger Lint: 0 Fehler, 192 Warnungen; keine automatische Bereinigung fremder Bereiche.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: PASS. Der API-Schutz-Check deckt Admin-Routen ab; die neue öffentliche, nicht personenbezogene Route wurde zusätzlich gezielt getestet und unabhängig gelesen.
- Gesamttest: 7708 Tests, 7690 PASS, 13 FAIL, 5 SKIP. **Kein Gesamttest-PASS.** Elf Fehler betreffen die fehlende lokale PostgreSQL-16-Voraussetzung (`initdb` / `local_postgresql_not_available`). Zwei Browserfehler betreffen bestehende U1-A2-/U1-B-Prüfungen: DejaVu/safe-area-Zustandswechsel und Wiederherstellung der Routen-Scrollposition.
- Die beiden Browserdateien separat wiederholt: 23/25 PASS, dieselben zwei Fehler. Danach unveränderten Ausgangscommit `ab37bd4601f322b0ef72367bec9f0ce2bd4eb09a` separat exportiert und mit derselben Node-/Browser-/Abhängigkeitsumgebung geprüft: ebenfalls 23/25 PASS, identischer Timeout sowie `item 480 vs 421`. Damit ist die lokale Vorbestehung dieser zwei Fehler belegt; sie wurden nicht als behoben ausgegeben oder Tests abgeschwächt.
- `npm audit`: 24 Meldungen (17 moderate, 7 high) im Gesamtprojekt. Für die hinzugefügten Pakete `parse5` und `entities` keine Meldung. Kein Audit-Fix oder anderer Dependency-Umbau vorgenommen; dies ist kein Sicherheits-PASS des Gesamtprojekts.
- Unabhängiger Code-Review: PASS für Mapping, Abruf-/Parsergrenzen, Linkprüfung, Fehlerzustände und verborgene Bereiche nach Behebung der ursprünglich zu weiten Namenszuordnung. Browser-, Anbieter- und Produktionsfreigabe sind davon getrennt.
- Im lokalen Next-Dev-Server traten beim Abbrechen von Clientanfragen `ECONNRESET`/`aborted`-Diagnosen auf, ohne Browserfehler oder verlorene Zustände. Kein Nachweis zur gleichen Situation in Vercel Production; bei der Preview-Nachprüfung beobachten.

Die Screenshotdatei `green-region.png` gehört zum ausdrücklich simulierten Farb-/Fehlertest (Beispielpreis); sie belegt keine Livepreise. `desktop-live.png`, `width-320.png`, `width-390.png`, `width-768.png`, `width-1440.png`, `second-route.png` und `provider-click.png` zeigen die echten lokalen Anbieterabrufe bzw. den echten Absprung. `mobile-font-200.png` belegt die genannte Root-Schrift-Vergrösserung.

## Grenzen vor Veröffentlichung

Die erste Fassung bleibt bei `VERCEL_ENV=production` geschlossen. Lokaler/Preview-Test verlangt `TWELVE_GO_TIMETABLE_ENABLED=true` und `NEXT_PUBLIC_TWELVE_GO_TIMETABLE_PREVIEW=true`. Kein ENV-/Vercel-/Supabase-Eintrag wurde geändert. PR #1086 bleibt separat mit seinem bestehenden HOLD. Quoten sind pro Prozess begrenzt, nicht global garantiert. Es gibt keine vollständige Länderabdeckung, Echtzeitverfügbarkeit, Reisenden-/Datumsübernahme, Garantie der Preisbasis, Provisionsbestätigung oder Production-Abnahme.

Nächste Abnahme: exakter Commit mit nativer CI und geschützter Preview; danach eigenständige Aktivierungsentscheidung mit belastbarem Rückweg. Neue datengetriebene Ortszuordnungen und eine offizielle tagesgenaue API sind spätere, getrennte Arbeit.

## Nachtrag — gehostetes Preview und Releasekandidat V2

Am 1. November 2026, 17:40–17:49 CET, wurde Head `967b4e5346b159d40e8c561676b9b14d10adff08` im isolierten Chromium 140.0.7339.16 auf https://jetnity-72owzaikh-jetnity-e1b93c82.vercel.app geprüft. Nur synthetische Gastreise im Browser, keine Kontoschreibzugriffe. Bangkok–Koh Chang lieferte vier Verkehrsmittel mit CHF, Koh Chang–Phuket eine Busangabe. 320/390/768/1440 px, 200 % Root-Schrift (16→32 px; kein Browserzoom), Tastatur, Hell/Grün, wiederholte Ziele, Ranong-Verwechslung, Wechsel/Abbruch und Mietwagen/Verbindungen bestanden. Gastdaten unverändert, keine Browserfehler, keine 12Go-Browserressourcen vor Klick. Echter Bus-Klick erreichte die deutsche Bangkok–Koh-Chang-Seite; ursprünglicher Link enthielt z=17323861/curr=CHF, finale Adresse nicht mehr. Das ist keine Provisionsbestätigung.

Native CI für diesen Head: https://github.com/Jetnity/jetnity/actions/runs/41326105370 — 7814 Tests, 7812 bestanden, 0 fehlgeschlagen, 2 ausgelassen; Typecheck/Lint/Build und Auth erfolgreich. Der frühere lokale Gesamtlauf hatte dokumentierte Umgebungsausnahmen; diese werden nicht nachträglich als lokaler PASS umetikettiert. Unabhängiger Code-Review desselben Heads PASS. Browserbelege im Work-Output `12go-ausbau-2026-11-01/preview-qa`.

Nach „ok dann weiter“ bereitet V2 eine ausdrücklich konfigurierbare Production-Aktivierung vor. Sie ersetzt den harten Production-Block durch standardmäßig geschlossene Serverfreigabe und benennt die UI-Variable in `NEXT_PUBLIC_TWELVE_GO_TIMETABLE_ENABLED` um. Zwei eigene Schalter false + Neubau stellen die bisherigen Links wieder her. Der bei #1086 belegte fehlende Zugriff auf die Rollback-Kandidatenliste bleibt dokumentiert; kein Instant-Rollback behauptet. V2-Head benötigt neue CI, unabhängige Prüfung, gehostete OFF/ON-Prüfung und anschließende Production-Prüfung. Die tatsächlichen Ergebnisse werden in PR #1101 fortgeschrieben. Noch nicht live.
