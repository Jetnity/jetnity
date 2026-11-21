# Abschluss-Schliff – Farbwelt, Tiefe, Einstieg und Erstbesucher-Hürden (21.11.2026)

Auftrag des PO: ein einziger, ganzheitlicher Schliff der Website auf `main` nach #1264, #1267 und #1268. **Nur Aussehen und Texte.** Keine neue Funktion oder Seite, keine Änderung an Logik, Datenbank, Login/2FA, Passkeys (#1240), Preisen oder Einreisedaten (#1254), keine neuen Kosten. Entscheidung: ADR-0240 in `DECISIONS.md`; Regeln: `DESIGN_SYSTEM.md` 2.1, 2.2, 5.2, 5.3, 7.5a.

Methode: dieselbe komplexe Gastreise (Zürich → Lissabon → Porto → Marrakesch → Sevilla, drei Reisende, drei Länder) von der Startseite bis zum fertigen Plan, vorher und nachher, bei 1280 und 390 px, mit Video. Die Vorher-Nachher-Bilder liegen im PR (`vorher-nachher/<breite>-<nr>-<name>.png`).

## A. Design-Änderungen

| Nr. | Was | Vorher | Nachher | Bild |
| --- | --- | --- | --- | --- |
| D1 | Seitengrund | `#F7FCF9` (fast weiss, kalt) | `#F2F7F4` (weiches Mint, augenschonend) | alle |
| D2 | Karte | `#FFFFFF` | `#FDFEFD` | alle |
| D3 | Navigation, Auswahl, Rand | `#EFF7F2`, `#E1F1E8`, `#DCE9E1` | `#E9F1EC`, `#DCEBE2`, `#D3E0D8` (gestufte Abstände statt harter Flächen) | 11, 17 |
| D4 | Text | Dunkelgrün `#143E33`, Nebentext `#3A564C` | Anthrazit mit Grünstich `#1B2A26`, Nebentext `#4A5F57`; Kontrast 12,1–14,8:1 bzw. 5,5–6,8:1 | alle |
| D5 | Rahmen von Feldern und Schaltflächen | `#2F5A4E` | `#46665B` (weiterhin mindestens 3:1) | 03, 19 |
| D6 | Header und Seitenleiste im Workspace | weiss | bleibt rein weiss (`--white-mint-chrome`), weil der PO «deckend weiss» festgelegt hat | 10 |
| D7 | Tiefe | ein flacher Schatten | drei Stufen (Steuerelement, ruhende Karte, angehobene Fläche); verschachtelte Karten flach | 11, 12 |
| D8 | Hover- und Druckzustand | sofort | 160 ms Übergang, 1 px Druck; nur ohne reduzierte Bewegung | Video |
| D9 | Zeilenumbruch | freier Umbruch | Überschriften ausgewogen, Fliesstext ohne Einzelwort in der letzten Zeile | 03, 11 |
| D10 | Status «nicht bestätigt» (Einreise-Ampel, Prüfstatus) und Hinweis «Automatische Einreiseprüfung derzeit nicht verfügbar» | grün, wirkt wie bestätigt | neutral grau, gestrichelter Rand | 16, 17, 19, 20, status-siegel-hinweis |
| D11 | Status «ausgewählt, nicht gebucht» und «geschätzt» | grau | warmes Gelb, gestrichelter Rand | status-siegel-hinweis (die echten Bausteine, einzeln gerendert) |
| D12 | «Handlung nötig» (Aufgabenhinweis, Änderungsvorschau, Einreise mit Pflicht) | grau oder dunkel | warmes Orange mit Rand und Wort | status-siegel-hinweis |
| D13 | Hervorgehobener Bereich nach Sprung («Einreise & Visum») | schwerer dunkler Rahmen | `border-brand-600/60` mit Kartenschatten | 17 |
| D14 | Übersicht Raster | Karten gleich hoch (hohle Karte), enger Abstand | Karten nur so hoch wie ihr Inhalt, ruhigerer Abstand | 11 |
| D15 | Hero | flache Fläche, harte Kante zum Bild | ruhiger Lichtverlauf links oben, weicher Bildübergang, angehobene Fläche, Citrus-Ring um das Suchfeld bei Fokus | 01 |
| D16 | Vergleich «Organisieren» (Omio) | eigene Dunkelgrün-Töne | an Anthrazit angeglichen | – (nur mit Anbieterdaten sichtbar) |
| D17 | Browser-Themefarbe (Adressleiste auf dem Handy) | `#F7FCF9` | `#F2F7F4` | – |

## B. Text-Änderungen

| Nr. | Ort | Vorher | Nachher |
| --- | --- | --- | --- |
| T1 | Startseite, Hero | «Ohne Konto beginnen. Deine Wünsche geben die Richtung vor.» | «Ohne Konto starten. Du siehst deinen Entwurf, bevor etwas gespeichert wird.» |
| T2 | Startseite, Hero, drei Zusagen | «Versteht deine Reise» · «Erkennt, was wichtig wird» · «Passt deinen Plan an» | «Flug, Unterkunft und Tage in einem Plan» · «Einreise für jede reisende Person im Blick» · «Buchungen bestätigst du selbst» |
| T3 | Reisekopf | «2 von 3 Profilen vorhanden» | «Angaben für 2 von 3 hinterlegt» |
| T4 | Route (Übersicht) bei Zielen ohne Tage | «Noch ohne eigene Tage: … Deine Reisetage stehen vorerst unter «Noch keinem Ziel zugeordnet».» | «Noch ohne Tage: … Unter «Reise ändern» legst du fest, wie lange du wo bleibst. Bis dahin stehen deine Reisetage unter «Noch keinem Ziel zugeordnet».» |
| T5 | Reiseplan, leere Etappe | «… Deine Reisetage stehen vorerst unter …» | «Bis du unter «Reise ändern» festlegst, wie lange du wo bleibst, stehen deine Reisetage unter …» |
| T6 | Reise ändern, «Wie lange bleibst du wo?» | drei Sätze, 45 Wörter | «Optional. Mit Tagen je Ziel zeigt Jetnity, was pro Ziel noch fehlt, etwa die Unterkunft. Ohne sie bleiben die Tage vorerst ohne Ziel. Es wird nichts gebucht und keine Flugzeit festgelegt.» |
| T7 | Einreise-Prüfer bei mehreren Reisenden | nur «Pass 1», «Pass 2», «Pass 3» | zusätzlich: «Ein Eintrag je Pass: Wer zwei Pässe hat, steht zweimal da. Wem welcher Pass gehört, zeigt die Liste darunter.» |

Alle Texte sind Deutsch in Schweizer Schreibweise. Es wurde keine Aussage zu Einreise, Preis oder Buchung neu erfunden; die drei Zusagen im Hero sind durch vorhandene Funktionen gedeckt (Plan mit Flug, Unterkunft und Tagen; Einreise je Person in der Vorbereitung; «Gebucht» setzt der Nutzer selbst).

## C. Gefundene Hürden, Änderung, nicht lösbar ohne neuen Umfang

| Hürde (Erstbesucher mit komplexer Reise) | Geändert | Ohne neuen Umfang nicht lösbar (PO entscheidet) |
| --- | --- | --- |
| Hero verspricht vage («Versteht deine Reise») | T1, T2, D15 | Hero-Aussage «Intelligent» und Bildwelt sind PO-Entscheid |
| «Noch nicht bestätigt» sah grün aus und wirkte wie ein Ergebnis | D10 (neutral, gestrichelt) | Die Einreisedaten selbst bleiben «noch nicht bestätigt», solange #1254 keine bestätigten Aussagen liefert |
| Geschätzt, nur ausgewählt und gebucht sahen gleich aus | D11, D12 | – |
| «2 von 3 Profilen vorhanden» unklar | T3 | – |
| Ziele ohne Tage, aber kein Weg dorthin genannt | T4, T5, T6 | – |
| «Pass 1/2/3» ohne Zuordnung zu Personen | T7 | Eine Zuordnung im öffentlichen Prüfer braucht einen Umbau je Person (neue Funktion) |
| Ortssuche liefert für Madrid und Barcelona in Dev philippinische Treffer; Production nicht geprüft | – | Ortskatalog/Ranking (GeoNames-Import) – Priorität P1 für Spanien-Reisen |
| Reisetitel folgt dem ersten Ziel auf Englisch («Lisbon» bei vier Zielen in drei Ländern) | – | Titel-Logik und deutsche Ortsnamen (F, Migration) |
| Rote CI-Prüfung «Auth-Konfiguration gegen config.toml» | – | Dev-Supabase hat Passkeys eingeschaltet, `supabase/config.toml` nicht; Passkeys liegen bei #1240 |

## D. Prüfstand

Siehe `docs/ACTIVE_WORK_STATUS.md`, Abschnitt «Abschluss-Schliff». Die Bilder `status-siegel-hinweis` rendern die echten Bausteine `StatusSiegel` und `Hinweis` einzeln vorher und nachher, weil «Ausgewählt» und «Aufgabe» in der Durchlauf-Reise nicht vorkommen. Nicht erfasst durch Bilder, nur durch Token, Typen und Tests: Änderungsvorschau («Diese Punkte würden gelöscht», «Offene Punkte»), Teilergebnis der Flugsuche, Marke «Nur auf diesem Gerät».
