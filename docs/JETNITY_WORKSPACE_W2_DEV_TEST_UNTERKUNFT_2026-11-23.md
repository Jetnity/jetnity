# Workspace W2 – Dev-Testunterkunft, keine echte Buchung

**Gültigkeit:** Nur für Work-QA zu [PR #1295](https://github.com/Jetnity/jetnity/pull/1295) auf der exakten Git-gebundenen **Dev-Preview** mit Supabase-**Development** `yfvbxvijcorffwxbxahl`. Kein Production-Deployment, keine Production-Daten, keine Drittanbieterbuchung, keine Modell-/Provideraufrufe oder neuen Schlüssel. Keine neuen API-, SQL- oder Laufzeit-Test-Endpunkte.

## Warum dieser Weg sicher ist

- **Synthetischer Reisebestand, klarer Name:** Eine eigens für Work erzeugte Dev-Kontoreise und ein ausdrücklich mit `W2-TEST: Unterkunft (nur markiert, keine echte Buchung)` bezeichneter **manueller** Stay. Es ist kein echter Hotelname oder Reservierungsnachweis.
- Die bestehende Aktion **«Als gebucht markieren»** setzt ausschliesslich die **Nutzer-Markierung** `bookingStatus=booked`, `bookingSource=user`, nie `provider`. Die UI «Gebucht» bedeutet **nur in Jetnity als gebucht markiert**, nicht vom Anbieter bestätigt. Für Tests darf dieses ausdrücklich als simuliert bezeichnete Element so markiert werden.
- Es wird **kein** Preis, Buchungslink, Buchungscode, Anbieter, echte Buchungszeit oder Zahlungsinformation erfunden: `provider=null`, `externalRef=null`, `bookingUrl=null`, `priceAmount=null` und `priceCurrency=null` im synthetischen Testfixture. In der Dev-UI keine Anbieter- oder Preisfelder ergänzen.
- Die bestehenden `UnterkunftBestand`-Schaltflächen und die vorhandenen RLS-/Revision-/Readback-Schreibwege bleiben unverändert. **Kein Test-Seeding per SQL, Konsole, API oder LocalStorage; keine Auth-Umgehung, kein besonderer Schalter und kein produktiver Fixture-Import.**
- Der reine CI-Test in `lib/reiseaenderung/direct-trip-editing-1.test.ts` verwendet dieselbe deutliche Kennzeichnung und prüft den Schutz eines *nur durch die Nutzermarkierung* kommerziell geschützten Stays (kein fingierter Preis/Provider). Er schreibt nichts nach Dev oder Production.

## Einmaliger Dev-Vorbereitungsschritt durch Work

1. Aktuellen **exakten PR-Head** und eine READY-Preview zu diesem Head prüfen; die Host-Domain für Anmeldung und Reisebearbeitung nicht wechseln. Für Dev-Konto-Login oder 2FA nur den persönlichen Owner-Schritt stoppen lassen. Wenn die Preview nicht mit Supabase Dev verbunden ist, **STOP**, nicht Production benutzen.
2. Bereits im vorigen W2-Test geprüfte sechs eigenständige Punkte inklusive IDs, Reisetermine und die ungebuchte Rückreise **unangetastet lassen**. Keine bestehende echte/aus anderem Test stammende Buchungsmarkierung anpassen.
3. Ausschliesslich in der separaten W2-**Dev-Testreise** unter «Reiseplan» einen passenden Aufenthaltstag öffnen → «Punkt hinzufügen» → Art «Unterkunft» → als Bezeichnung **exakt** `W2-TEST: Unterkunft (nur markiert, keine echte Buchung)` eintragen → «Speichern». Das ist bei bereits sechs vorhandenen Punkten **ein siebter isolierter Testpunkt**; die sechs Original-IDs bleiben die zu prüfende Baseline. Ist exakt dieser W2-Testpunkt bereits vorhanden, keinen Duplikatpunkt anlegen.
4. Unter «Organisieren» → «Unterkunft» → «Deine Unterkunft» den **exakt markierten** Test-Stay auswählen. Mit «Zeitraum ergänzen» oder «Zeitraum ändern» bei Bedarf gültige Check-in-/Check-out-Kalendertage **innerhalb der ursprünglichen Reise** setzen (Check-out strikt nach Check-in), speichern und neu laden. Die Daten der übrigen Unterkünfte nicht ändern.
5. Nur für **diesen** Test-Stay «Als gebucht markieren» drücken. Warten, bis die bestehende Statusanzeige «Gebucht» und die Schaltfläche «Buchung korrigieren» erscheinen; nach Neuladen kontrollieren. **Sichtbare Formulierung:** `W2-TEST ... keine echte Buchung` muss gleichzeitig erkennbar sein. Wenn der Button fehlt oder der Status nicht gespeichert wird: **BLOCKED, kein Ersatz durch SQL/Debug-Konsole/API/Provider.**

## Work-Nachtest: nur die bisher blockierten Punkte 1 / 2 / 4

**1 – Testunterkunft bereit:** Die sechs bisherigen Punkt-IDs vor/nach Reload exakt abgleichen, dazu die gesonderte ID des markierten W2-Test-Stays. Der Stay muss `kind=stay` und über die UI **nur als vom Nutzer gebucht markiert** erscheinen, mit unveränderten Check-in-/Check-out-Tagen. Kein Hotel, keine Zahlung, keine Fremdbestätigung.

**2 – Vorschau/Folgen:** «Reise ändern» → «Direkt bearbeiten», Reisebeginn um einen Kalendertag verschieben bei unveränderter Dauer → «Auswirkungen ansehen». Die **geschützte Test-Unterkunft** muss mit ursprünglichen Check-in-/Check-out-Tagen und Buchungsmarkierung erhalten bleiben, auch wenn sich ihr Tages-/Etappenkontext verschiebt. Folgen und allfällige Datumskonflikte müssen sichtbar sein; niemals automatische Umbuchung, Preis oder Anbieterbestätigung behaupten. Die sechs Original-IDs dürfen nicht verschwinden.

**4 – Übernehmen/Readback:** Dieselbe gültige Vorschau ausdrücklich übernehmen, speichern, Seite neu laden. Sechs Original-IDs und die separate Test-Stay-ID sowie **alter Stay-Zeitraum und Nutzer-Buchungsmarkierung** müssen noch genau vorhanden sein. Reisebeginn/Rückreise bewegen sich entsprechend der genehmigten Vorschau. Kein Duplikat und kein stiller Gast-Fallback.

**Nicht wiederholen:** Die bereits vom Owner gemeldeten 3, 5, 6 sind **PASS** (Abbruch, Revision/Parallel-Tab, Trip Audit/Mobile/Navigation/Fokus). Sie werden nicht neu als PASS erfunden, sondern nur als vorhandene Work-Evidence übernommen.

## Abbruch, Schutz und Rückbau

- Keine Teständerung an `jetnity.com`, Production, einer realen Buchung oder bestehenden Owner-Reise. Keine externe Hotelseite öffnen, nicht bezahlen, keine echten Daten/Fotos/Passnummern verwenden.
- Nach dokumentiertem Nachtest die **synthetische** Markierung am W2-Stay via «Buchung korrigieren» wieder auf «Ausgewählt» setzen und **nur diesen** zusätzlich angelegten Testpunkt entfernen, wenn die vorhandene UI dies ohne fremde Inhalte erlaubt. Alternativ die ganze eigene, ausschliesslich synthetische Dev-Testreise entfernen. Eine nicht sichere Löschung **nicht erzwingen**, sondern als Resttestdaten melden.
- Work protokolliert **PASS / FAIL / BLOCKED** getrennt für 1, 2, 4, genaue Preview-URL, Git-SHA, sechs Basis-IDs (nur Zählung/abgekürzte Prüfschlüssel, keine persönlichen Daten), zusätzliche Test-ID, Termine vor/nach und Statusbeobachtung. W2-Merge erst nach **Work-PASS** sowie vollständiger grüner CI/Review am exakten Head. Production ausschliesslich durch «Jetnity Release & Production» nach eigenem Auftrag.
