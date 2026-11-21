# Erstbesucher-Funktionen – Plan und Reihenfolge

21. November 2026. Branch `cursor/erstbesucher-funktionen-2ba1` (von `main` `48fe0d21f`). Auftrag des PO nach dem Go für #1264: die Hürden A, B, C, D, E, H, I, J aus `docs/UI_UX_ERSTBESUCHER_PERSPEKTIVE_2026-11-21.md` in einem eigenen PR lösen, **zuerst dieser Plan, dann bauen**. F (deutsche Ortsnamen, Migration) und K (intelligente Planung, Kosten) sind nicht Teil davon, G bleibt.

## Grenzen

- Keine Datenbank-Migration, keine Production, keine neuen Kosten, kein Login/2FA.
- Keine neuen Einreise-, Visa- oder Pass-Regeln; `unknown` bleibt `unknown` (`docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`).
- Gast und Konto verhalten sich gleich. Gastreisen bleiben im Browser.
- Stop-Bedingung: Braucht ein Punkt doch eine Migration, ein Modell oder eine Regeländerung, halte ich an und frage den PO.

## Reihenfolge

Sortiert nach Nutzen für die erste Reise, dann nach Risiko. Kleine Punkte laufen zwischen den grossen.

| # | Punkt | Was gebaut wird | Betroffen | Risiko |
|---|---|---|---|---|
| 1 | **A – Tage auf Ziele verteilen** | In «Reise ändern» → Etappen die Option «Tage auf Ziele verteilen»: die vorhandenen Reisetage werden mit denselben Regeln wie im Planer auf die Ziele verteilt, statt neue Tage anzuhängen (15 bleiben 15). Vorschau Vorher/Nachher wie bei den übrigen Änderungen. | `components/trips/ReiseAenderungManuell.tsx`, `lib/reiseaenderung/direct/*`, Verteilregel aus dem Planer als gemeinsame Funktion | mittel: Reiseänderung ist Kernlogik. Tests für Gast und Konto, Grenzfälle (mehr Ziele als Tage, schon zugeordnete Tage, Planpunkte an Tagen). |
| 2 | **E – Flughafen je Ziel** | «Nach» und «Rückflug ab» werden für jedes Ziel mit Koordinaten vorbelegt: nächster Linienflughafen aus der Tabelle `airports` innerhalb eines festen Radius. Ohne Treffer bleibt das Feld leer wie heute, mit Hinweis. | `lib/trips/organisieren/katalog.ts` (`vorgeschlagenerFlughafen`), Flughafen-Suchroute nur lesend, `Flugvergleich.tsx` | gering bis mittel: nur Lesezugriff. Radius und «nur Linienflughäfen» brauchen Tests, damit kein Sportflugplatz erscheint. |
| 3 | **J – «Als Nächstes» nur Ausführbares** | Punkte mit «derzeit nicht verfügbar» rutschen unter «Gut zu wissen». Oben stehen nur Schritte, die sich jetzt ausführen lassen. | Reihung der Hinweise in `lib/trips/uebersicht.ts` bzw. der Als-Nächstes-Quelle | gering |
| 4 | **B – Text aus «In eigenen Worten» mitnehmen** | Beim Wechsel zu «Schritt für Schritt» landet der eingegebene Text im Feld «Wünsche», sofern es leer ist; ein Satz sagt das. Ziele und Daten werden nicht geraten. | `/planen`, `TripPlanner.tsx` | gering |
| 5 | **I – Einreise-Karten bündeln** | Vorbereitung: eine Karte pro Land statt pro Person und Land, ein Status statt zwei. Je Person und Pass bleibt die Angabe aufklappbar; ein Unterschied zwischen Personen wird nicht verdeckt. | Vorbereitung/Einreise-Anzeige (`einreise-kundenanzeige.ts` und Karten), Readiness-Daten nur lesend | mittel: darf keine abweichende Person verstecken (Traveller-Kontext). |
| 6 | **D – Pässe der Reisenden in der Einreise** | Der Einreise-Prüfer übernimmt neben den Ländern auch die gespeicherten Pass-Angaben der Reisenden, je Person und je Staatsangehörigkeit. Ohne Angabe bleibt «noch nicht angegeben». | `EinreiseLaenderpruefer.tsx`, Übergabe aus der Reise; `lib/readiness/einreise-laenderpruefer.ts` nur, falls die Übergabe dort beginnt, ohne Regeländerung | mittel: Official-Truth-Bereich, mehrere Pässe pro Person, keine Weitergabe nach aussen. |
| 7 | **H – Reiseprüfung lesbar** | Der Bericht spricht Alltagssprache: lesbare Daten statt ISO, keine «0 zeitliche Vergleiche», keine Wiederholungen. Aussagen und Prüflogik bleiben gleich. | Textschicht der Reiseprüfung und ihre Tests | mittel: testgebundenes Wahrheitsmodul; nur Formulierung, Inhalt identisch. |
| 8 | **C – Wunschtext im Formular** | Ohne KI nur, was ehrlich geht: Nennt der Wunsch Kinder oder Pässe, zeigt das Formular, wo diese Angaben hingehören. Eine echte Auswertung des Textes braucht die intelligente Planung (K) und damit den Kostenentscheid des PO. | `TripPlanner.tsx` | gering; die volle Lösung hängt an K |

## Prüfungen

- je Punkt Unit-Tests in den bestehenden Testdateien;
- Typprüfung, Lint, die fünf Hygiene-Checks, Production-Build, `test:core`;
- Browser-Durchlauf mit dem Szenario aus der Erstbesucher-Prüfung (drei Reisende, zwei Pässe, Zürich → Lissabon → Porto → Marrakesch) bei 390 und 1280 px, mit Video.

## Stand

- 21.11.: Plan erstellt.
- 21.11., 17:38 MEZ: PO gibt Plan und Reihenfolge frei und erlaubt den PR als vierten Draft.
- 21.11., abends: Alle acht Punkte umgesetzt, je mit Tests (ADR-0239). Abweichungen vom Plan: In E wird auch «Von» (Abflugort) vorbelegt, wenn der Startort im Katalog ist; nur Flughäfen der Klasse `large` werden vorgeschlagen. D übergibt neben den Pässen auch die Länder der Etappen. Offen: Review und Merge-Entscheid des PO.
