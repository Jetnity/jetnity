# UI/UX-Feinschliff der ganzen App — Phase 1: Analyse

Stand: 20. November 2026. Branch `cursor/ui-ux-feinschliff-2ba1`. Phase 1 war nur Analyse; der Fortschritt der Umsetzung steht in Abschnitt 10.
Auftrag des Product Owners: Feinschliff ab «Reise planen» auf dem Niveau von Airbnb, Linear und Stripe, erweitert auf alle Seiten, beginnend mit einem gemeinsamen Design-System. Alle Etappen kommen in einen einzigen PR. Nach Phase 1 wird auf das «Go» gewartet.

## 1. Wie geprüft wurde

- Code: Einstiege («Reise planen» in Kopfzeile, Startseite, Footer) bis zu allen Ansichten des Reisebereichs (`/planen`, `/reisen`, `/reisen/[id]` mit Übersicht, Reiseplan, Organisieren, Vorbereitung, Einreise), dazu Konto, Merkliste, Entdecken, Einreise-Prüfer, Login.
- Laufzeit: lokaler Dev-Server mit Dev-Datenbank, Gastreise «Thailand: Bangkok & Krabi» (2 Etappen, 8 Tage, 3 Flüge, 2 Unterkünfte, 3 Erlebnisse, 1 Flug als gebucht markiert, 6 Punkte mit Preis, Budget CHF 4’200).
- Breiten: 375×667 (iPhone SE), 390×844, 768×1024, 1440×900, 2560×1440. Gemessen: seitliches Scrollen, Bedienflächen unter 44 px, Anzahl Schriftgrössen und Eckenradien pro Ansicht, Textmenge, Seitenlänge.
- Kontoseiten: die internen Prüfseiten `/ui-audit/*` sind im laufenden Dev-Server abgeschaltet (`JETNITY_UI_AUDIT` nicht gesetzt). Kontoseiten wurden deshalb aus dem Code bewertet, nicht per Screenshot.
- Der rote Knopf «1 Issue» auf den Screenshots ist ein reiner Entwicklungs-Hinweis von Next.js (Browser-Sicherheitsregel für `eval` im Dev-Modus). In Production gibt es ihn nicht.

## 2. Was schon gut ist

- Kein seitliches Scrollen auf allen 38 gemessenen Seiten-/Breiten-Kombinationen.
- Bedienflächen sind fast überall mindestens 44 px hoch; die untere Navigation auf dem Handy ist sauber.
- Die Startseite und der Reiseplan mit Karte haben bereits die gewünschte ruhige Premium-Wirkung. Der Reiseplan ist das Vorbild für die anderen Ansichten.
- Die Wahrheitsregeln (nichts erfinden, «unbekannt» ehrlich zeigen) sind im Code fest verankert. Der Feinschliff ändert nur, wie diese Wahrheit gezeigt wird, nicht was gezeigt wird.

## 3. Befunde

### 3.1 Es gibt keinen gemeinsamen Baukasten

Jeder Bereich baut seine Knöpfe, Karten und Hinweise selbst. Deshalb wirkt die App wie mehrere Produkte.

| Baustein | Heute (ohne Admin) |
| --- | --- |
| Knöpfe | 403 selbst gebaute Knöpfe in 121 Dateien. Der gemeinsame `Button` wird nur in 10 Dateien genutzt (Login und Sicherheit). |
| Karten | `Card` nur in 6 Dateien. 215 selbst gebaute Karten in 95 Dateien. |
| Eckenradien | 23 verschiedene Werte, davon 96 frei gewählte (`rounded-[18px]` bis `rounded-[36px]`). Pro Ansicht bis zu 11 verschiedene. |
| Schatten | 32 verschiedene, davon 24 frei gewählt. Im System gibt es nur einen (`shadow-e1`). |
| Schriftgrössen | Kein Grössensystem. Der Reiseplan nutzt auf dem Desktop 18 verschiedene Schriftgrössen. `text-[11px]` kommt 25-mal vor. |
| Farben | 240 Stellen mit Tailwind-Standardfarben statt Jetnity-Farben; rund 200 feste Farbcodes in Feature-CSS (`flugsuche.css`, `organisieren.css`, `suchauswahl.css`, `vergleich.css`, `etappen.css`, `atlas.css`, `reisekarte.css`). |
| Status-Siegel | `ui/badge.tsx` nutzt Standard-Blau/Gelb/Rot und ist nur im Admin im Einsatz. Im Produkt gibt es mehrere eigene Siegel-Varianten. |
| Laden | Kein Ladeplatzhalter (Skeleton). 42 Dreh-Symbole und 22 weitere Drehanimationen. |
| Hinweise | Kein gemeinsamer Hinweis-Baustein. 76 Fehler- und 127 Statusmeldungen, alle einzeln gestaltet. |
| Seitenbreiten | Von `max-w-md` bis `max-w-[1450px]`; der Reisebereich mischt `7xl`, `6xl` und `2xl`. |
| Hintergrund und Kopfzeile | Zwei Kopfzeilen-Familien (Startseite, Entdecken und Login: Logo mit runder Menütaste; App-Seiten: Kasten «Menü», Theme-Taste, Aktion, Konto-Taste). Zwei Grundtöne (warmes Creme und helles Mint). |
| Seitenkopf | Jede der fünf Reise-Ansichten hat einen anderen Kopf: schlichte Überschrift (Übersicht), Foto-Kopf in Karte (Reiseplan), randloser Foto-Kopf (Organisieren), kleine Überschrift ohne Hauptüberschrift (Vorbereitung), zentriertes Formular (Einreise). |

### 3.2 Es gibt kein Kostenbild

- Preise erscheinen in acht verschiedenen Formen: Budgetziel, «Preis zum Auswahlzeitpunkt», «ab …», «Gespeicherte Preise», «Beispielpreis», «Orientierungspreise», Preisnotiz bei Verbindungen, «keine aktuelle Preiszusage» in der Merkliste.
- Nirgends gibt es eine Summe. In der Testreise haben sechs Punkte zusammen CHF 2’640 gespeichert. Die Übersicht zeigt nur «Budget CHF 4’200».
- Der gebuchte Flug (CHF 1’380) erscheint in der Übersicht als «Flug · 13:05» ohne Preis. In der Etappenansicht stehen Flug und Hotel ohne Preis und ohne Buchungsstand. Den Preis sieht man erst in der Detailansicht des einzelnen Punkts.

### 3.3 Der Zusammenhang der Reise ist nicht sichtbar

- Flug, Unterkunft, Transfer, Erlebnisse und Einreise liegen in fünf Ansichten mit fünf verschiedenen Gestaltungen.
- «Organisieren → Flüge» zeigt nur die Suche, nicht die drei Flüge, die schon im Plan stehen (einer davon gebucht).
- Die Einreise-Ansicht fragt das Zielland erneut ab, obwohl die Reise Thailand schon kennt. Dazu gibt es pro Land zwei Felder: «Land suchen» und «Land wählen».
- Die Vorbereitung zeigt die Karten für Reisende 1 und 2 zweimal (einmal pro Etappe, beide Thailand), ohne zu sagen, zu welcher Etappe sie gehören.
- Die Übersicht meldet «Unterkunftsstand noch unklar», obwohl zwei Unterkünfte mit Preis eingetragen sind. Gemeint ist «noch nicht gebucht». Das ist sachlich richtig, liest sich aber wie ein Fehler.

### 3.4 Zu viel auf einmal, zu technische Sprache

- Übersicht, Text unter «Jetzt wichtig»: «1 von 4 Bereichen ohne bekannten offenen Punkt · 1 noch offen · 2 noch unklar · 9 Punkte geplant».
- Flug-Bestand: «Noch keinem Reiseabschnitt sicher zuordenbar», «Noch nicht vollständig bestimmbar», «Es liegen gespeicherte Herkunftsfelder vor. Das ist kein geprüfter Live-Nachweis.»
- Vorbereitung: «Für die automatische Prüfung fehlen noch Angaben · Automatische Einreiseprüfung derzeit nicht verfügbar» steht zweimal untereinander. Dazu vier Zählerkacheln (Offen 2, Erledigt 0, Erneut prüfen 0, Nicht relevant 0). Auf dem Handy sind das fünf Bildschirmhöhen.
- Unterkunftssuche: Ort, Daten, Gäste, Zimmer, Erwachsene, Kinder, Umgebung, Kartenhaken, Sterne, Bewertung, Preisanzeige und Währung sind alle sofort offen. Das Gästefeld wird abgeschnitten («Reisegruppe: 2 Personen. Belegung offen»).
- `/planen` zeigt beide Wege untereinander: zuerst «In eigenen Worten» mit KI, darunter das komplette Formular «Schritt für Schritt». Der Umschalter oben suggeriert eine Wahl, die Seite zeigt aber beides.
- Die Detailansicht eines Planpunkts hat einen eigenen, dichten Stil mit kleinen Schriften. Sie wirkt wie ein internes Werkzeug.

### 3.5 Auf dem Handy bleibt zu wenig Platz für die Reise

- Liegt ein Gastentwurf vor, bricht die Kopfzeile bei 375 und 390 px in zwei Zeilen um: Menü, Logo, Theme, «Reise fortsetzen» und die Konto-Taste passen nicht in eine Zeile.
- Darunter folgen der Reisetitel mit «Reise ändern» und ein dreizeiliger Gast-Hinweis. Zusammen sind das rund 330 px, bevor die Reise beginnt.
- Auf dem iPhone SE (375×667) ist im ersten Bildschirm noch keine einzige Aufgabe sichtbar. «Jetzt wichtig» beginnt erst nach dem Scrollen.
- In «Organisieren» beginnt das Suchformular auf dem Handy erst bei etwa 700 px. Davor kommen Kopfzeile, Gast-Hinweis und ein grosser Foto-Kopf.
- Einzelne kleine Bedienflächen: das Feld «Rückflug ab» (etwa 27 px hoch), die Checkbox «Nur Direktflüge» (13 px) und die Zeile «Verbindung · Bangkok → Krabi» (34 px).
- Auf 2560 px steht die Übersicht als schmale Spalte mit sehr kleiner Schrift in der Mitte. Eine geteilte Ansicht gibt es nur im Reiseplan.

### 3.6 Kleinere Unstimmigkeiten

- «Meine Reisen» ohne Reise sagt «Deine Gastreise ist in diesem Browser gespeichert» und gleichzeitig «Deine erste Reise beginnt hier».
- Die App-Seiten haben als Fussbereich nur «© 2026 Jetnity», die öffentlichen Seiten einen grossen dunklen Footer.
- Die Übersicht zeigt den Reisetitel zweimal: in der Kopfzeile und als Hauptüberschrift. Dazu steht eine einzelne Zeile «Reiseoptionen» ohne erkennbare Funktion.
- Die Kernkomponenten sind sehr gross: `TripWorkspace.tsx` hat 1607 Zeilen, `TripPlanner.tsx` 1057, `Reisevorbereitung.tsx` 915, `TripWorkspacePlan.tsx` 796. Der Feinschliff zerlegt sie nur dort, wo es für die Gestaltung nötig ist.

## 4. Die fünf wichtigsten Hebel

1. **Ein gemeinsamer Baukasten.** Wenige feste Bausteine (Knopf, Karte, Status-Siegel, Preis, Hinweis, Ladeplatzhalter, Leerzustand, Seitenkopf, Abschnitt) und feste Stufen für Schrift, Abstände, Ecken und Schatten. Danach sieht jede Seite aus wie Jetnity, ohne dass jemand neu gestalten muss.
2. **Ein Kostenbild für die ganze Reise.** Ein einziger Preis-Baustein mit drei klar unterscheidbaren Zuständen: «Gebucht» (von dir als gebucht markiert), «Preis beim Auswählen» (kann sich ändern) und «Preis offen». Dazu eine Kostenkarte in der Übersicht und auf dem Handy eine schmale feste Leiste unten, zum Beispiel «Geplant ca. CHF 2’640 · Budget CHF 4’200».
3. **Die Reise als eine Linie.** Pro Etappe dieselbe Abfolge: Anreise → Unterkunft → Erlebnisse → Weiterreise, jeweils mit Stand und Preis. Die Einreise erscheint als Station am Grenzübertritt. «Organisieren» zeigt zuerst, was schon da ist, und erst dann die Suche. Die Einreise-Prüfung übernimmt die Länder der Reise.
4. **Concierge-Sprache und weniger auf einmal.** Pro Karte ein klarer Satz, was der Stand bedeutet, und ein nächster Schritt. Details werden aufgeklappt. Die Wahrheit bleibt dieselbe, die Wörter werden menschlich: «Noch nicht gebucht» statt «Unterkunftsstand noch unklar».
5. **Mehr Platz für die Reise auf dem Handy.** Eine einzeilige Kopfzeile, ein kompakter Gast-Hinweis und ein einheitlicher, flacher Seitenkopf in allen fünf Ansichten. Die feste Leiste unten zeigt den nächsten Schritt und die Kosten. Auf grossen Bildschirmen gilt eine feste Lesebreite, und dort, wo es hilft, wird die Ansicht geteilt.

## 5. Wahrheitsregeln für das Kostenbild (verbindlich für Etappe 2)

- Es werden keine Preise erfunden oder geschätzt. Punkte ohne Preis zählen als «ohne Preis» und werden genannt, nicht mit null gerechnet.
- Jede Währung wird getrennt summiert. Es gibt keine Umrechnung ohne amtlichen Kurs.
- «Gebucht» heisst immer «von dir als gebucht markiert». Jetnity prüft keine Buchung beim Anbieter, und der Text darf das nicht anders darstellen.
- «Preis beim Auswählen» ist ein gespeicherter Wert, kein Live-Preis.
- Der Vergleich mit dem Budget erfolgt nur in derselben Währung.
- Ob ein Preis pro Person oder für alle gilt, ist heute nicht gespeichert. Der Betrag wird deshalb so gezeigt, wie er gespeichert ist, ohne Hochrechnung.
- Reisenden-Kontext: Die Einreise-Prüfung übernimmt aus der Reise nur die Zielländer. Pässe und Staatsangehörigkeiten bleiben pro Reisendem und pro Pass getrennt, wie heute. Es wird nichts zusätzlich erhoben.

## 6. Vier Etappen in einem einzigen PR

Jede Etappe ist eine eigene Commit-Gruppe im selben Draft-PR. Nach jeder Etappe gibt es Screenshots bei 375, 390, 768, 1440 und 2560 px, die Messung (seitliches Scrollen, 44-px-Flächen), Typprüfung, Lint, Build und die betroffenen Tests.

### Etappe 1 — Gemeinsames Design-System

- Feste Stufen in `tailwind.config.js` und `styles/globals.css`: 6 Schriftgrössen, 3 Eckenradien, 2 Schatten, 2 Flächentöne. Bestehende Farb-Tokens bleiben; neue Farben kommen nicht hinzu.
- Bausteine in `components/ui`: `Button` (ausgebaut), `Karte`, `StatusSiegel` (Gebucht, Ausgewählt, Offen, Hinweis; ersetzt `BuchungsSiegel`-Varianten), `Preis` (nutzt den bestehenden Formatierer in `lib/trips/bezeichnungen.ts`), `Hinweis` (Info, Bitte erledigen, Dringend), `Ladeplatzhalter`, `Leerzustand`, `Seitenkopf`, `Abschnitt`.
- Eine Kopfzeile für alle Seiten, auf dem Handy einzeilig. Ein Grundton, eine Seitenbreiten-Regel.
- Danach erhalten alle Seiten den neuen Rahmen: Startseite, Planen, Meine Reisen, alle fünf Reise-Ansichten, Entdecken, Einreise, Konto und Merkliste.
- `DESIGN_SYSTEM.md` wird nachgeführt; eine Entscheidung kommt in `DECISIONS.md`.

### Etappe 2 — Planen, Übersicht und Kostenbild

- `/planen` zeigt jeweils nur einen Weg. «In eigenen Worten» steht vorne, «Schritt für Schritt» ist ein Umschalter. Beide Wege bleiben vollständig erhalten.
- Neue Reihenfolge der Übersicht: Kopf → «Als Nächstes» (höchstens drei Punkte) → Reiselinie pro Etappe → Kostenbild → Einreise und Vorbereitung.
- Die Kostenberechnung ist eine reine Funktion mit eigenen Tests (Summe pro Währung und Zustand, Punkte ohne Preis).
- Auf dem Handy zeigt eine feste Leiste unten den nächsten Schritt und die Kostenzeile, eingebaut in die bestehende Ansichtsnavigation.

### Etappe 3 — Detailansichten: Organisieren, Einreise, Vorbereitung, Änderungen

- «Organisieren» zeigt zuerst «Das hast du schon», danach die Suche. In der Unterkunftssuche stehen die Grundfelder vorne, die Filter sind einklappbar.
- Die Einreise übernimmt die Länder der Reise. Pro Land gibt es nur noch ein Auswahlfeld.
- Die Vorbereitung wird pro Land zusammengefasst statt pro Etappe doppelt gezeigt, mit einem Satz Zusammenfassung oben.
- Planpunkt-Detail und Flug-Bestand bekommen den gemeinsamen Stil.
- Buchen, Umbuchen und Reiseänderungen werden als bewusste Entscheidung gestaltet: Bestätigungsschritt mit klarer Zusammenfassung und ohne versteckte Folgen.
- Fristen und Flugänderungen erscheinen als ruhige Concierge-Hinweise.

### Etappe 4 — Mobile-Feinschliff, Zustände, Kontoseiten

- Ladeplatzhalter statt Dreh-Symbolen, einheitliche Leerzustände und dezente Übergänge (abgeschaltet bei «Bewegung reduzieren»).
- Die Kontoseiten (Übersicht, Reisende, Merkliste, Buchungen, Einstellungen) erhalten die gemeinsamen Bausteine.
- Feste Lesebreite bis 4K, geteilte Ansichten, wo sie helfen.
- Schlussmessung bei 280 bis 2560 px und im Querformat, mit Screenshots und Video.

## 7. Abgrenzungen und Risiken

- **Offene PRs:**
  - #1254 ändert `components/readiness/EinreiseLaenderpruefer.tsx`. Den Einreise-Teil von Etappe 3 baue ich erst nach dessen Merge oder halte ihn minimal.
  - #1240 ändert Login, `app/account/security` und die Passkey-Komponenten. Diese Seiten fasse ich erst nach dessen Merge an. Login und 2FA bleiben beim Product Owner.
- `components/readiness/OfficialTruthVisitorV3.tsx` bleibt unverändert (geschützte Datei).
- Viele bestehende Tests prüfen exakte Texte. Wo Wörter menschlicher werden, werden diese Tests bewusst angepasst, ohne eine Wahrheitsregel abzuschwächen. Jede Textänderung mit Bedeutungswirkung wird im PR einzeln aufgeführt.
- Ein einziger grosser PR ist schwer zu prüfen. Deshalb gibt es klare Commit-Gruppen pro Etappe und Screenshots pro Etappe.
- Keine Datenbank, keine Production, keine neuen Kosten, keine Login- oder 2FA-Änderung.

## 8. Entscheidungen für den Product Owner

1. **Kostenzeile:** Soll in der Übersicht und auf dem Handy unten «Geplant ca. CHF … · Budget CHF …» stehen? Empfehlung: ja.
2. **`/planen`:** Soll jeweils nur ein Weg sichtbar sein, mit «In eigenen Worten» zuerst? Empfehlung: ja.
3. **Gast-Hinweis:** Darf er von einem dreizeiligen Kasten zu einer kompakten Zeile mit Link werden? Die Aussage bleibt gleich. Empfehlung: ja.
4. **Schrift:** System-Schrift beibehalten (schnell, ohne Kosten) oder eine eigene Schrift über `next/font` (überall gleiches Aussehen, ebenfalls ohne laufende Kosten, aber eine Änderung an der Markenwirkung)? Empfehlung: beibehalten.

## 9. Nächster Schritt

Erledigt: Das «Go» kam am 20.11.2026 (siehe Abschnitt 10).

## 10. Gesamtplan und Fortschritt nach dem Go

PO-Go am 20.11.2026 für alle vier Etappen in Draft-PR #1264. Antworten auf Abschnitt 8: 1 ja, 2 ja, 3 ja, 4 heutige Schrift beibehalten. Qualität vor Tempo; nach jeder Etappe kurze Meldung mit Screenshots. Kein Merge ohne ausdrückliches Go am Schluss.

**Erweiterung durch den PO am 20.11.2026 (abends):** Der Feinschliff gilt für jede bestehende Seite, inklusive des ganzen Workspace mit allen Bereichen, Unterseiten, Dialogen, Panels und Zuständen (leer, lädt, Fehler), Admin, Anmeldung (nur Aussehen) sowie Fehler- und Leerseiten. Die vollständige Liste steht in `docs/UI_UX_FEINSCHLIFF_SEITENLISTE_2026-11-20.md` und wird pro Seite abgehakt; `lib/ui/seitenliste.test.ts` hält sie mit dem Code in Einklang. Weitere Etappen kommen in denselben PR. Login-Logik, 2FA, Datenbank und Production bleiben unberührt. Blog, Suche und Hilfe/Kontakt existieren nicht als Seiten; eigene Seiten wären neuer Produktumfang (PO-Entscheid nötig).

| Etappe | Stand | Inhalt |
|---|---|---|
| 1 Design-System | umgesetzt | Stufen für Schrift, Ecken, Schatten; Statussiegel, Seitenkopf, Leerzustand, Ladeplatzhalter; flacher Reisekopf in allen fünf Ansichten; einzeilige Kopfzeile bis 1023 px; ein Grundton für alle öffentlichen Seiten; `DESIGN_SYSTEM.md` und ADR-0229 |
| 2 Planen, Übersicht, Kostenbild | umgesetzt | ein Weg in `/planen`; Übersicht: Als Nächstes → Route mit Unterkunft pro Etappe → Kosten → Einreise und Ziele → Gut organisiert, ab `xl` zweispaltig; `kostenbild()` und `laufUnterkunftLeser()` als reine Funktionen mit Tests; Kostenzeile über der unteren Leiste; Bausteine Karte, Preis, Abschnitt; `DESIGN_SYSTEM.md` 6.3–6.12 und ADR-0230 |
| 3 Detailansichten | umgesetzt | Organisieren zeigt zuerst «Das hast du schon» (Zeilen öffnen den Punkt im Plan), lesbare Reiter, einklappbare Unterkunftsfilter, Such-Button auf dem Handy nach allen Feldern; Vorbereitung mit einem Satz zum eigenen Stand, einem Hinweis statt Kacheln und Auswahlen als Segmente, Thailand einmal pro reisender Person statt pro Etappe; Einreise nimmt die Länder der Reise (minimal, wegen #1254); Planpunkt-Detail mit Siegel, Zeitpunkt und «Preis beim Auswählen»; Bestandsbereiche mit gemeinsamer Typografie und einem Satz zur Bedeutung von «Gebucht»; Entfernen eines Planpunkts mit Bestätigung in der Zeile; Baustein Hinweis; `DESIGN_SYSTEM.md` 6.8, 6.13–6.15 und ADR-0231 |
| 4 Zustände, Konto, Breiten | umgesetzt | Ladeplatzhalter mit sichtbarem Status in Such- und Anbieterflächen; Kontoseiten (Übersicht, Merkliste, Reisende, Buchungen, Einstellungen) mit Seitenkopf, Karte, Leerzustand, Hinweis; Merkliste unterscheidet Lesefehler und Abmeldung; untere Leiste unter 360 px und quer als Raster, Kopfzeile bei 280 px ohne Überlappung; Einblenden 160 ms (aus bei reduzierter Bewegung); Fliesstext höchstens 65 Zeichen; Grundschrift ab 2400 px grösser; Seitenliste mit Test; `DESIGN_SYSTEM.md` 6.1, 6.6, 6.7, 6.16, 6.17, 7.13, 7.14 und ADR-0232 |
| 5 Öffentliche Seiten | als Nächstes | Startseite, Entdecken, Einreise (öffentlich), Datenquellen, Impressum, Datenschutz, AGB, Meine Welt, 404- und Fehlerseiten |
| 6 Anmeldung (nur Aussehen) | offen | Login, Registrierung, Passwort setzen, Anmeldung abschliessen, Konto gelöscht, kein Zugriff, Anmeldung & Sicherheit |
| 7 Admin | offen | alle 20 Admin-Seiten inklusive Admin-Login und MFA (nur Aussehen), Fehler-, Lade- und 404-Seite |
| 8 Workspace vollständig und Schlussmessung | offen | jedes Panel, jeder Dialog und jeder Zustand (leer, lädt, Fehler) im Workspace einzeln; Schlussmessung 280–2560 px und Querformat, beide Themen, Screenshots und Video |

Abweichungen vom Plan in Etappe 1, mit Grund:

- **Mond/Sonne bleibt in der Handy-Kopfzeile.** Ein erster Entwurf legte den Schalter ins Menü. Das widerspricht der Owner-Vorgabe „Grün per Header-Schalter“ und brach drei bestehende Browser-Tests. Stattdessen entfällt unter 640 px „Reise fortsetzen“ aus der Kopfzeile; es steht im Menü, und die Seiten selbst bieten den Weg zurück zur Reise an.
- **Karte, Preis, Abschnitt und Hinweis** entstehen mit ihrer ersten Verwendung in Etappe 2 und 3, damit kein ungenutzter Code entsteht (`check:dead`, `check:exports`).
- **Foto-Köpfe entfallen** in Reiseplan und Organisieren. Die Stadtbilder in den Etappenkarten und ihre Bildnachweise bleiben.

Abweichungen vom Plan in Etappe 2, mit Grund:

- **Die Handyleiste zeigt nur die Kostenzeile, nicht zusätzlich den nächsten Schritt.** Zwei feste Zeilen über der unteren Leiste hätten auf kleinen Geräten zu viel Höhe gekostet. Der nächste Schritt ist die erste Karte der Übersicht; die Kostenzeile führt mit einem Tippen dorthin.
- **Die Liste „Buchungen dieser Reise“ entfällt in der Übersicht.** Gebuchte Punkte stehen im Kostenbild, mit Siegel „Gebucht“, mit oder ohne Preis.
- **Die Reiseprüfung steht unter „Gut organisiert“** statt unter der ersten Karte, damit „Als Nächstes“ kurz bleibt.
- **Unterkunft pro Etappe nur bei eindeutigem Stand.** Fehlen Check-in oder Check-out einer Unterkunft, sagt die Route nichts dazu; die Karte „Als Nächstes“ meldet den unklaren Stand wie bisher.
- **Ab 1280 px zweispaltig** (in Etappe 4 geplant, hier vorgezogen, weil die neue Reihenfolge sonst auf dem Desktop sehr lang wird).

Abweichungen vom Plan in Etappe 4, mit Grund:

- **Schlussmessung und Video wandern in Etappe 8**, weil der Umfang auf die ganze App erweitert wurde; gemessen wird einmal am Ende über alle Seiten.
- **`/reisen` ohne Reise bekommt keine zweite Leer-Karte.** Der grüne Einstieg direkt darüber sagt schon «Beginne deine erste Reise.» mit genau einem Knopf.
- **Übergänge nur mit Deckkraft.** Ein Versatz hätte während der Animation fixierte Leisten in der Fläche verschoben.
- **Titel «Bestätigte Buchungen» bleibt.** Er ist in Menü, Tests und Übersetzung verankert; «Als gebucht markiert» wäre genauer und steht als Empfehlung im Bericht.

Abweichungen vom Plan in Etappe 3, mit Grund:

- **«Als gebucht markieren» bekommt keinen Bestätigungsschritt.** Jetnity bucht nichts selbst; die Markierung ist ein lokaler Status, den ein Tippen auf «Buchung korrigieren» zurücknimmt. Ein Zwischenschritt würde jede Markierung verdoppeln, ohne eine Folge zu verhindern. Stattdessen sagt jeder Bestandsbereich in einem Satz, was «Gebucht» heisst. Bestätigt wird, was sich nicht zurücknehmen lässt: das Entfernen eines Planpunkts. Reiseänderungen (Vorher/Nachher mit «Änderung übernehmen») und neue Stopps (Vorschau) hatten ihren Bestätigungsschritt schon.
- **Keine Anzeige für Flugänderungen.** Jetnity erhält keine Flugstatus-Daten von Anbietern; eine solche Anzeige würde etwas behaupten, das nicht geprüft ist. Fristen erscheinen weiter ruhig in «Als Nächstes» (Etappe 2). Kommt später ein Flugstatus, nutzt er den Baustein Hinweis.
- **Einreise nur minimal.** Die Ansicht übernimmt die Länder der Reise; die Auswahl pro Land bleibt bis zum Merge von #1254 unverändert (`EinreiseLaenderpruefer.tsx` nicht angefasst).
- **Fehlermeldungen in den Bestandsbereichen bleiben die bestehenden roten Zeilen.** Das grüne Thema färbt sie bereits passend um; ein Umbau auf den Hinweis hätte nur Churn erzeugt.

## Belege

Screenshots dieses Laufs: `/opt/cursor/artifacts/ui-phase1/` (nicht im Repository).
