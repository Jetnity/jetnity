# Perspektivwechsel Erstbesucher – komplexe Reise von der Startseite bis zum fertigen Plan

21. November 2026. Draft-PR [#1264](https://github.com/Jetnity/jetnity/pull/1264), Abschluss des UI/UX-Feinschliffs. Auftrag des PO: den ganzen Ablauf als kritischer Erstbesucher prüfen, Denk-Hürden, unklare Begriffe und verwirrende Übergänge finden und nur dort für Klarheit sorgen. Grenzen: keine neuen Funktionen oder Seiten, keine Logik, kein Login/2FA, keine Preise, keine Einreisedaten (#1254). Entscheidung: ADR-0237, Regel: `DESIGN_SYSTEM.md` 6.22.

## Szenario

Gast ohne Konto, Dev-Umgebung (intelligente Planung dort nicht freigegeben). Zwei Erwachsene und ein Kind (8), Schweizer und deutsche Pässe, ab Zürich nach Lissabon, Porto und Marrakesch, 5.–19. Juni 2027, Budget CHF 6000, Wunsch «wenig Hotelwechsel». Ablauf: Startseite → `/planen` «In eigenen Worten» → «Schritt für Schritt» → Reise erstellen → Übersicht → Als Nächstes → Organisieren (Flug, Unterkunft) → Reiseplan → Reise ändern → Vorbereitung → Einreise → Reise prüfen. Gemessen bei 390 px, Stichproben bei 768 und 1280 px.

## Gefundene Hürden und Änderungen

Alle Änderungen sind Text oder Darstellung; die Hinweise in Route, Etappe und «Reise ändern» lesen nur vorhandene Reisedaten. Vorher/Nachher-Bilder je Stelle im PR (Abschnitt «Perspektivwechsel Erstbesucher»).

| # | Hürde (Ort) | Geändert | Bild |
|---|---|---|---|
| 1 | «Privater Reiseentwurf» lässt offen, ob ein Konto nötig ist (`/planen`, beide Wege) | «Ohne Konto möglich» | `idee-kopf`, `manuell-kopf` |
| 2 | Der Platzhalter im Ideenfeld liest sich wie schon eingegebener Text | «z. B. …» davor | `idee-kopf` |
| 3 | Meldung bei gesperrter oder gestörter intelligenter Planung verweist auf «das Formular», das auf der Seite so nicht heisst | verweist auf «Schritt für Schritt» (Name des Schalters) | `idee-gesperrt` |
| 4 | Die Einleitung sagt nicht, was Jetnity aus den Angaben macht | «Jetnity legt daraus deine Reise mit Etappen und Tagen an. Flüge, Unterkünfte und die Vorbereitung ergänzt du danach im selben Plan.» | `manuell-kopf` |
| 5 | Der Hinweis zu weiteren Zielen nennt nur eine Grenze («Aufenthalte werden hier nicht festgelegt») | sagt, wie die Reihenfolge geändert wird und wann die Aufenthaltsdauer festgelegt werden kann | `ziele-hinweis` |
| 6 | Tageverteilung wirkt wie ein Fachschritt («Tage den Zielen zuordnen», «Kalendertage sind keine Hotel-Nächte …»); der Nutzen fehlt, wer ihn überspringt, merkt die Folge erst im Workspace | Überschrift «Wie lange bleibst du wo?», Nutzen und Folge in einem Absatz, Kästchen «Tage jetzt auf die Ziele verteilen», Status «Noch nicht verteilt» | `tage`, `tage-aktiv` |
| 7 | Drei Reisende mit verschiedenen Pässen: kein Feld und kein Hinweis, wohin diese Angaben gehören | «Pass-Angaben trägst du nach dem Erstellen unter «Vorbereitung» für jede Person einzeln ein.» | `reisende-budget` |
| 8 | Die Budgetwährung steht nur im Platzhalter und verschwindet beim Tippen | Beschriftung «Ungefähres Gesamtbudget in CHF», Platzhalter «z. B. 3000» | `reisende-budget` |
| 9 | Unklar, ob Jetnity den Wunschtext auswertet | «Jetnity speichert deinen Wunsch als Notiz in der Reiseübersicht.» (so ist es) | `wuensche` |
| 10 | Die Seitenleiste verspricht «Live-Hinweise», die es heute nicht gibt, und «Gemeinsam verfeinern», obwohl sich Mitreisende nicht einladen lassen | 02 «Ausbauen», 03 «Nichts vergessen» mit dem, was heute geschieht | `seitenleiste` |
| 11 | «Als Nächstes» springt in einen anderen Bereich, ohne ihn zu nennen | jede Zeile mit Aktion zeigt «Weiter in «Organisieren»» bzw. «Weiter in «Vorbereitung»» (aus derselben Funktion wie der Klick) | `als-naechstes` |
| 12 | «Deine Route» zeigt ohne Verteilung nur «Noch keinem Ziel zugeordnet»; die drei Ziele scheinen verschwunden; Untertitel technisch | Untertitel «Wo du an welchen Tagen bist»; darunter «Noch ohne eigene Tage: Lisbon, Porto, Marrakesh. Deine Reisetage stehen vorerst unter «Noch keinem Ziel zugeordnet».» | `route` |
| 13 | «Gut organisiert» steht über Bereichen mit «Noch keine Flüge» | «Was schon organisiert ist» | `bereiche` |
| 14 | Einleitung der Reiseprüfung passiv und fachlich | sagt, was Jetnity nebeneinanderlegt und dass der Plan unverändert bleibt; «Ausgewählt»/«gebucht» in einem Satz | `pruefen` |
| 15 | Eine leere Etappe im Reiseplan gibt keinen Hinweis, wo die Tage sind | Verweis auf «Noch keinem Ziel zugeordnet» | `etappe-leer` |
| 16 | Einreise-Karte: «Pass: Reisedokument-Option» bei fehlendem Pass; «Weitere Themen werden noch geprüft» klingt nach laufender Prüfung | «Pass: noch nicht angegeben»; «Weitere Themen ohne geprüfte Angabe» (nur Beschriftungen in `einreise-kundenanzeige.ts`; Regeln und Daten unverändert) | `einreise-karte` |
| 17 | Organisieren: unklar, ob extern Gebuchtes in Jetnity landet | «Was du dort buchst, trägst du danach im Reiseplan ein, damit alles an einem Ort bleibt.» | `organisieren-kopf` |
| 18 | Flugsuche startet bei mehreren Zielen mit dem Fachwort «Gabelflug» | ein Satz Erklärung, nur bei Gabelflug | `flug-art` |
| 19 | Reise ändern → Etappen: «Bisher 2027-06-20 – 2027-06-24» | «Bisher 20. Juni – 24. Juni» | `etappen-bisher` |
| 20 | Reise ändern → Etappen: Tage ohne Ziel werden nicht erwähnt; «Dauer über Etappen» fügt Tage hinzu, ohne es zu sagen | «15 Reisetage sind noch keinem Ziel zugeordnet. Sie bleiben dabei bestehen und zählen zur Gesamtdauer.» | `etappen-gruppe` |

Bewusst nicht geändert: die gemeinsame Kontingent-Meldung (`lib/modell/kontingent.ts`, erscheint auch dort, wo es «Schritt für Schritt» nicht gibt), `official-presentation.ts` (ADR-gebundene Begriffe), der testgebundene Satz «Beide Wege führen zur gleichen Reise», die Zählzeile «2 noch offen · 2 noch unklar» (`lib/trips/uebersicht.ts`).

## Ohne neuen Umfang nicht lösbar (PO-Entscheid)

| # | Hürde | Warum nicht in diesem PR | Vorschlag |
|---|---|---|---|
| A | **Tage lassen sich nach dem Erstellen nicht mehr auf Ziele verteilen.** «Dauer über Etappen» fügt neue Tage hinzu (15 → 30), statt die vorhandenen zu verteilen. Wer die Verteilung im Planer überspringt, kommt im Workspace nicht mehr sauber dorthin. | neue Funktion bzw. Logikänderung in der Reiseänderung | Priorität hoch: «Tage auf Ziele verteilen» als Option in «Reise ändern», gleiche Regeln wie im Planer |
| B | Was in «In eigenen Worten» steht, wird beim Wechsel zu «Schritt für Schritt» nicht übernommen; Ziele, Daten und Reisende müssen neu eingegeben werden | Übernahme in Felder wäre Logik | den Text mindestens ins Feld «Wünsche» übernehmen |
| C | Der Wunschtext wird im Formularweg nicht ausgewertet: Kindesalter und Pässe müssen neu eingegeben werden | Auswertung wäre neue Funktion (bzw. die gesperrte intelligente Planung) | nach Freigabe der intelligenten Planung prüfen |
| D | Einreise übernimmt die Länder der Reise, aber nicht die Pässe der Reisenden | Einreise-Logik (#1254) | nach #1254-Folgeslice |
| E | Flugsuche: «Nach» und «Rückflug ab» bleiben für Lissabon/Marrakesch leer | Abdeckung des Ortskatalogs | Katalog-Slice |
| F | Ortsnamen erscheinen englisch («Lisbon», «Marrakesh»), Auto-Titel «Lisbon» | Ortsdaten | deutsche Anzeigenamen aus den Ortsdaten |
| G | Startseite verspricht Zielbild («erkennt Flugänderungen … passt automatisch an», «prüft persönliche Einreiseanforderungen»), im Workspace steht «Automatische Einreiseprüfung derzeit nicht verfügbar» | Marketing-/Wahrheitsentscheid | PO entscheidet: Text an heutigen Stand anpassen oder als «bald» kennzeichnen |
| H | Bericht der Reiseprüfung in Prüfsprache («14 Übernachtungsintervalle …», «0 zeitliche Vergleiche», ISO-Daten, wiederholter Hinweis) | testgebundenes Wahrheitsmodul | eigener Slice «Reiseprüfung lesbar» |
| I | Vorbereitung zeigt sechs gleichartige Einreise-Karten (3 Reisende × 2 Länder) und den Doppelstatus «Für die automatische Prüfung fehlen noch Angaben · Automatische Einreiseprüfung derzeit nicht verfügbar» | Readiness-Struktur (#1254) | Karten pro Land bündeln, ein Status |
| J | «Als Nächstes» führt nicht ausführbare Punkte («… derzeit nicht verfügbar») unter «Was deine Reise jetzt weiterbringt» | Reihung der Hinweise ist Logik | nicht ausführbare Punkte unter «Gut zu wissen» |
| K | Die intelligente Planung ist in Dev gesperrt; ihre Vorschau konnte nicht live geprüft werden | Schlüssel/Kosten (PO) | Prüfung in Preview mit Freigabe |

### PO-Entscheide vom 21. November 2026

- **G – bleibt.** Startseite unverändert, inklusive Feinschliff aus #1264. Die Hinweise auf Einreiseprüfung und Flugänderungen bleiben bewusst, weil diese Funktionen noch kommen.
- **F – neuer Umfang, nicht in #1264.** `public.places` speichert einen Namen pro Ort (GeoNames-Hauptname, z. B. «Lisbon»). «Lissabon» steht zwar unter den Alternativnamen, aber die GeoNames-Hauptdatei sagt nicht, in welcher Sprache. Deutsche Namen ohne Änderung gespeicherter Reisen brauchen deshalb sprachmarkierte Namen im Ortskatalog (GeoNames-Sprachnamen, Import und neue Spalte, also eine Migration) und eine Anzeigefunktion an allen Stellen, die Ziel- und Etappennamen zeigen. Eine handgepflegte Liste wäre eine zweite Namenstabelle; der beim Erstellen gespeicherte Titel («Lisbon») bliebe ohnehin englisch.
- **A, B, C, D, E, H, I, J – eigener PR «Erstbesucher-Funktionen»** nach dem Go für #1264, mit kurzem Plan zur Reihenfolge vor dem Bauen. Keine Änderung an Login/2FA, Production oder Kosten.
- **K – offen.**

## Prüfungen

Typprüfung, Lint (0 Fehler), die fünf Hygiene-Checks, Production-Build, 29 betroffene Testdateien (540 Tests) und die Browser-Tests Workspace (Weiss-Mint, Routen-Ausrichtung), Aktivitäten, Viator und Reiseprüfung grün. Kein seitliches Scrollen bei 320, 390, 768 und 1280 px in Planen (beide Wege), Übersicht, Reiseplan, Organisieren und Vorbereitung. Durchlauf als Video bei 390 px. Keine Datenbank, keine Production, keine neuen Kosten.
