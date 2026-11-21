# Vergleich live (jetnity.com) ↔ Preview #1264 – 21. November 2026

Auftrag des PO (21.11.): für jede Seite live gegen die Preview von Draft-PR #1264 vergleichen, mit Screenshots, jede Abweichung einordnen und alles, was der Feinschliff entfernt oder kaputt gemacht hat, im PR zurückbringen – ohne Login/2FA zu ändern. Kein Merge ohne PO-Go.

## Ergebnis in einem Satz

Der Feinschliff hatte genau eine Sache entfernt – die grossen Ortsbilder oben in Reiseplan und Organisieren; sie sind zurück (ADR-0238). Fast alles, was in der Preview «fehlt», kommt von fehlenden Anbieter-Einstellungen der Preview (Flugsuche, Wetter, Omio, Google-Karte, Rechtstexte) oder von Production-Daten; ein Teil kommt aus anderen PRs, die seit dem Live-Stand in `main` gelandet sind.

## Kategorien

| Kat. | Bedeutung | Wer handelt |
| --- | --- | --- |
| (a) | andere oder leere Daten der Dev-Umgebung | niemand; kein Fehler von #1264 |
| (b) | Anbieter- oder Production-Einstellung fehlt in der Preview | PO-Entscheid, ob die Preview Schlüssel bekommen soll (teils kostenpflichtig) |
| (c) | durch den Feinschliff entfernt oder kaputt | in #1264 zurückgebracht |
| (d) | andere PRs, seit dem Live-Stand in `main` gemergt (nicht #1264) | der jeweilige PR |
| (e) | Feinschliff hat umgestellt, nichts entfernt | bleibt; PO kann jeden Punkt einzeln zurückverlangen |

## Methode

- **live:** jetnity.com, Production-Deployment `dpl_8fitMFHnsYX2RPYBGtPXJGkJFwaA`, Commit `f0f376fa2`.
- **Preview #1264 vor Korrektur:** `dpl_CkQYotjo2JAytXtgsxLPpPn7b3oT`, Head `16db0f7f6`. Nach der Korrektur siehe Abschnitt «Nachher».
- **Ursachen getrennt** mit drei lokalen Production-Builds und derselben Dev-Umgebung: Live-Code `f0f376fa2`, `main` `4b4e1b7f5`, Head von #1264. live ↔ Live-Code lokal ergibt (a)/(b); Live-Code ↔ `main` ergibt (d); `main` ↔ #1264 ergibt (c)/(e). Kontrolle: Preview und lokaler #1264-Build sind strukturgleich.
- **Gleiche Gastreise überall:** Zürich → Lissabon → Porto → Marrakesch, 5.–15. Juni 2027, 2 Reisende, angelegt über `/planen` «Schritt für Schritt». Die Reise liegt nur im Browser; auf live wurden keine Konten benutzt, keine Partnerlinks geklickt, keine Daten in Production geschrieben.
- **Erfasst:** Desktop 1280×900 und Handy 390×844, ganze Seite. Automatischer Strukturvergleich (Überschriften, Knöpfe, Links, Felder, Bilder, Iframes, Karten, Textlänge) und Sichtprüfung jedes Bildpaars.
- **Screenshots:** im PR-Text als Anhang (`vergleich-live-preview/desktop/<seite>.webp`, `…/mobil/<seite>.webp`, `…/nachher/<seite>.webp`; links live, rechts Preview). Nicht im Repository.

## Ergebnis je Seite

| Seite | Was live anders aussieht als die Preview | Kat. |
| --- | --- | --- |
| Startseite `/` | Live keine Reiseideen-Karten, Preview zeigt vier (Bali, Lissabon, Zermatt, Amsterdam). Live liest die CMS-Veröffentlichung und meldet «nicht verfügbar»; die Preview zeigt den statischen Katalog. | (a), Befund P1 |
| Entdecken `/entdecken` | Live «Reiseideen derzeit nicht verfügbar» mit «Erneut laden»; Preview vier Ziele mit Suche und Themenfilter. | (a), Befund P1 |
| Einreise `/einreise`, Datenquellen | gleich | – |
| Planen `/planen` | Live zeigt das Formular sofort; Preview zeigt zuerst «In eigenen Worten» / «Schritt für Schritt», das Formular ist einen Klick entfernt und vollständig. PO-Entscheid vom 20.11. (ADR-0230). | (e) |
| Meine Reisen `/reisen` (leer und mit Reise) | gleich | – |
| Anmelden, Registrieren | gleich; keine Logik geändert | – |
| Passwort-Link `/auth/update-password` | Live «Session erforderlich»; Preview «Link aus der E-Mail öffnen» mit Wegen zur Anmeldung und Startseite. Nur Text und Rahmen, Logik unverändert (ADR-0234). | (e) |
| Konto gelöscht | gleich | – |
| Kein Zugriff `/unauthorized`, 404 | Preview mit Fusszeile (Produkt, Jetnity) | (e) |
| Impressum | Live eingebettet über PrivacyBee; Preview Rückfalltext mit info@jetnity.ch. Die Einbettung ist absichtlich nur auf dem Host jetnity.com erlaubt. | (b) |
| Datenschutz `/privacy` | Live vollständige Erklärung (PrivacyBee); Preview Link «Datenschutzerklärung bei PrivacyBee». Gleicher Grund. | (b) |
| AGB `/terms` | gleich | – |
| Konto `/account`, Admin `/admin` ohne Anmeldung | beide leiten zur Anmeldung; Admin-Anmeldung in der Preview mit «Passwort anzeigen» und beschrifteten Feldern, gleiche Formulare und Aktionen. Angemeldete Seiten wurden nicht verglichen (siehe unten). | (e) |
| Reise · Übersicht | «Jetzt wichtig» heisst «Als Nächstes», jede Zeile nennt «Weiter in «Organisieren»/«Vorbereitung»»; zusätzlich «Kosten» und «Was schon organisiert ist». Nichts entfernt (ADR-0230, ADR-0237). | (e) |
| Reise · Reiseplan | **Ortsbild oben fehlte** – zurückgebracht. Karte: live Google-Karte mit Zustimmung, Preview eigene Karte (Natural Earth), weil die Google-Maps-Einstellungen fehlen. | **(c) behoben**; Karte (b) |
| Organisieren · Flüge | **Ortsbild oben fehlte** – zurückgebracht. Live Flugsuche und «Flugziele entdecken» (Travelpayouts-Widget); Preview Rückfall «Auf Booking.com suchen», weil `NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN` fehlt. «Zurück zu meinem Reiseplan» und Anbieter-Hinweis kommen aus `main`. | **(c) behoben**; Flugsuche (b); Hinweis (d) |
| Organisieren · Unterkunft | **Ortsbild oben fehlte** – zurückgebracht. Gäste «2 Erwachsene» → «2 Personen · Belegung offen» (Belegung aus `main`, Text gekürzt in #1264). «Lage und Filter» eingeklappt. | **(c) behoben**; (d); (e) |
| Organisieren · Aktivitäten | **Ortsbild oben fehlte** – zurückgebracht. Live Wetterkarte mit Zustimmung; Preview ohne, weil `OPENWEATHER_API_KEY` fehlt. Viator/GetYourGuide gleich. | **(c) behoben**; Wetter (b) |
| Organisieren · Mietwagen | **Ortsbild oben fehlte** – zurückgebracht. Sonst gleich. | **(c) behoben** |
| Organisieren · Verbindungen | **Ortsbild oben fehlte** – zurückgebracht. Live Omio-Suche mit Streckenkarte; Preview Rückfall mit «Erneut laden», weil `OMIO_KATALOG_SCHLUESSEL` fehlt. | **(c) behoben**; Omio (b) |
| Reise · Vorbereitung | Zählkacheln → ein Satz; Suche und Filter erscheinen erst, wenn eigene Punkte existieren; doppelte Karten für Reisende ohne Angaben fallen weg (eine pro Land statt pro Person). Nichts entfernt (ADR-0231, ADR-0237). | (e) |
| Reise · Einreise | Reisekopf «Lisbon» über der Prüfung; Prüfung selbst gleich. | (e) |
| Handy allgemein | «Reise fortsetzen» und «Reise planen» stehen im Menü, «Reise ändern» als Symbol mit Namen; Kostenleiste nur mit Preis oder Budget (ADR-0229, ADR-0230). | (e) |

## (c) – zurückgebracht in #1264

Die grossen Ortsbilder oben in Reiseplan und allen fünf Organisieren-Reitern. Sie sind jetzt eine Bildvariante des gemeinsamen Reisekopfs: gleiche Bildquelle wie live (`useStadtbild`: lokaler Katalog vor Wikimedia Commons), dunkelgrüner Verlauf, Text auf der dunklen Seite, auf dem Handy durchgehender Verlauf; Bildnachweis unter der Ansicht wie bisher. Übersicht, Vorbereitung und Einreise waren live ohne Bild und bleiben so. Dateien: `components/trips/TripWorkspaceKopf.tsx`, `components/workspace/workspace-surfaces.css`; `DESIGN_SYSTEM.md` 6.2, ADR-0238. Keine Logik-, Daten-, API-, Auth- oder DB-Änderung.

Sonst nichts unter (c): Jeder andere Unterschied zwischen `main` und #1264 ist eine Umstellung ohne Verlust (e).

## (b) – Einstellungen, die der Preview fehlen

Production hat sie, der Branch dieses PR nicht (nur Namen geprüft, keine Werte gelesen oder kopiert):

| Funktion | Einstellung(en) | Hinweis |
| --- | --- | --- |
| Flugsuche, Flugziele | `NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN` | öffentlich, kostenlos; würde in der Preview aber an der CSP aus `main` scheitern, siehe (d) |
| Wetter in Aktivitäten | `OPENWEATHER_API_KEY` | Anbieter-Schlüssel |
| Bahn/Bus Omio | `OMIO_KATALOG_SCHLUESSEL` | Anbieter-Schlüssel |
| Google-Karte im Reiseplan | `JETNITY_MAPS_ENABLED`, `JETNITY_MAPS_ALLOWED_ORIGIN`, `GOOGLE_MAPS_BROWSER_KEY`, `GOOGLE_MAPS_MAP_ID`, `GOOGLE_MAPS_ROUTES_SERVER_KEY` | kostenpflichtig je Aufruf |
| DiscoverCars-Angebote | `JETNITY_DISCOVERCARS_SEARCH_ENABLED`, `DISCOVERCARS_API_KEY` | im Vergleich ohne sichtbaren Unterschied |
| Impressum/Datenschutz eingebettet | – | PrivacyBee nur auf Host jetnity.com erlaubt (`privacyBeeEinbettungErlaubt`) |
| Reiseideen aus dem CMS | `JETNITY_ADMIN_PRODUCTION_RUNTIME_ENABLED` | nur Production; siehe Befund P1 |

Nicht gesetzt, weil Schlüssel nicht ohne PO-Freigabe in andere Branches kopiert werden und Google Maps Kosten erzeugt.

## (d) – aus anderen PRs in `main` seit dem Live-Stand

- **CSP-Kopfzeile (#1260):** `frame-src` erlaubt weder `https://www.stay22.com` noch `https://jetnity-flight-widget.vercel.app`. Folge in jeder Umgebung mit `main`-Stand, auch in dieser Preview: die Stay22-Hotelergebnisse (Rahmen `https://www.stay22.com/embed/gm`) und das Flug-Widget werden vom Browser blockiert. Live hat noch keine CSP und ist nicht betroffen. Die Korrektur liegt im offenen PR #1265 (`fix/release1260-csp-ki-wetter-logout-cancel-dev-20261120`). **Muss vor dem nächsten Production-Deploy von `main` gemergt sein.**
- «Zurück zu meinem Reiseplan» und der Hinweis «Anbieter öffnen sich separat» in Organisieren.
- Unterkunft: Belegung muss gewählt werden («Belegung offen» statt «2 Erwachsene»).

## Befund P1 – Production, ausserhalb dieses PR

jetnity.com zeigt auf der Startseite und unter `/entdecken` «Reiseideen derzeit nicht verfügbar». Das ist der Fehlerzustand, nicht «keine Ideen veröffentlicht»: Production liest die Ideen über `publicInspiration()` aus der CMS-Veröffentlichung (RPC `cms_inspiration_published_v1`, aktiv mit `JETNITY_ADMIN_PRODUCTION_RUNTIME_ENABLED`), und diese Abfrage scheitert. Erstbesucher sehen dadurch auf live keine einzige Reiseidee. Nicht in #1264 behebbar (Production-Daten/-Rechte, PO-Gate). Empfehlung: Technical Lead prüft lesend, ob die RPC in Production existiert und für `anon` ausführbar ist und ob veröffentlichte Ideen vorhanden sind; danach Entscheid, ob bis dahin der statische Katalog als Rückfall gezeigt werden soll.

## Nicht verglichen

- Angemeldete Seiten (Konto-Unterseiten, Merkliste, Admin-Bereiche): kein Dev-Testkonto mit gleichen Daten auf beiden Seiten; verglichen wurde nur die Weiterleitung zur Anmeldung.
- Klicks zu Partnern (Buchung, Affiliate) auf live: bewusst nicht ausgelöst.
- Suchergebnisse von Anbietern (Hotels, Flüge, Mietwagen) nach einer Suche: hängen von (b) und (d) ab.

## Nachher

Neue Preview `dpl_3kp6QJi1BAVAcUuuvysH3W7Po1hN` (Head `754462879`) mit derselben Gastreise erneut erfasst: Reiseplan und alle Organisieren-Reiter tragen wieder das Ortsbild (Desktop und Handy), Übersicht bleibt flach wie live. Bildpaare im PR-Text als `vergleich-live-preview/nachher/<seite>.webp` und `…/nachher-mobil/<seite>.webp`.
