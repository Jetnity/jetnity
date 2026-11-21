# UI/UX-Feinschliff #1264 – Änderungen im Detail (Etappen 1 bis 8 und Erstbesucher-Abschluss)

Aus dem PR-Text von Draft-PR #1264 hierher verschoben (21. November 2026), weil der PR-Text mit den Bildern des Live-Vergleichs (`docs/UI_UX_VERGLEICH_LIVE_PREVIEW_2026-11-21.md`) die GitHub-Grenze von 65 536 Zeichen überschreitet. Inhalt unverändert, einschliesslich der Textänderungen mit Bedeutung (je Vorher | Nachher) und der Abweichungen vom Plan; die Bildlinks zeigen auf die Artefakte der Cursor-Session.

## Perspektivwechsel Erstbesucher (Abschluss)

Eine komplexe Reise wurde als Gast ohne Konto von der Startseite bis zur fertigen Reise durchgespielt:

- drei Reisende (zwei Erwachsene und ein Kind) mit Schweizer und deutschen Pässen;
- Zürich → Lissabon → Porto → Marrakesch, 5.–19. Juni 2027, Budget CHF 6000.

Gemessen wurde bei 390 px, mit Stichproben bei 768 und 1280 px.

Gesucht waren Denk-Hürden, unklare Begriffe und verwirrende Übergänge. Geändert wurden **nur Texte und Darstellung**. Es gibt keine neue Funktion und keine neue Seite. Logik, Preise, Login/2FA sowie Einreiseregeln und -daten bleiben unverändert.

Die Hinweise in Route, Etappe und «Reise ändern» lesen nur Reisedaten, die schon vorhanden sind.

Grundregel (`DESIGN_SYSTEM.md` 6.22, ADR-0237): Ein Hinweis sagt, was Jetnity mit der Angabe tut und in welchem Bereich es weitergeht. Er sagt nicht nur, was nicht geht.

[erstbesucher-durchlauf-390.webm](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Ferstbesucher-durchlauf-390.webm)

Das Video zeigt den Durchlauf bei 390 px:

1. Idee eingeben; die Sperrmeldung verweist auf «Schritt für Schritt».
2. Formular mit den neuen Hinweisen ausfüllen.
3. Reise erstellen.
4. «Als Nächstes» mit Zielbereich, Route mit dem Hinweis auf Ziele ohne Tage.
5. Organisieren mit der Erklärung zum Gabelflug.

### Textänderungen mit Bedeutung (einzeln, je Vorher | Nachher)

**1. Gast-Kennzeichnung und Ideenfeld (`/planen`, «In eigenen Worten»)**

| Vorher | Nachher |
|---|---|
| «Privater Reiseentwurf» | «Ohne Konto möglich» |
| Platzhalter ist ein Beispielsatz ohne Kennzeichnung | gleicher Satz mit «z. B.» davor |

[Ideenfeld vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Fidee-kopf.png)

**2. Meldung bei gesperrter oder gestörter intelligenter Planung**

| Vorher | Nachher |
|---|---|
| «… in dieser Umgebung noch nicht freigegeben. Deine Reise lässt sich unverändert über das Formular planen.» | «Die intelligente Planung ist noch nicht freigegeben. Deine Reise planst du stattdessen unter «Schritt für Schritt».» |

Dieselbe Verweisung steht auch in den Meldungen «nicht richtig konfiguriert», «gerade nicht verfügbar», «nicht verwertbar» und «passte nicht».

[Sperrmeldung vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Fidee-gesperrt.png)

**3. Einleitung «Schritt für Schritt»**

| Vorher | Nachher |
|---|---|
| «Ein paar Angaben genügen. Du kannst jeden Teil später gemeinsam mit deinen Mitreisenden verfeinern.» | «Ein paar Angaben genügen. Jetnity legt daraus deine Reise mit Etappen und Tagen an. Flüge, Unterkünfte und die Vorbereitung ergänzt du danach im selben Plan.» |

Die Gast-Kennzeichnung lautet auch hier «Ohne Konto möglich».

[Einleitung vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Fmanuell-kopf.png)

**4. Hinweis zu weiteren Zielen**

| Vorher | Nachher |
|---|---|
| «Optional. Die Reihenfolge bleibt die Eingabereihenfolge. Aufenthalte werden hier nicht festgelegt.» | «Optional. Jetnity übernimmt die Ziele in dieser Reihenfolge; mit «Nach oben» und «Nach unten» änderst du sie. Wie lange du wo bleibst, kannst du festlegen, sobald Abreise und Rückreise feststehen.» |

[Ziel-Hinweis vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Fziele-hinweis.png)

**5. Tageverteilung**

| Teil | Vorher | Nachher |
|---|---|---|
| Überschrift | «Tage den Zielen zuordnen» | «Wie lange bleibst du wo?» |
| Einleitung | «Optional. Ohne diese Wahl bleiben die Tage ohne Ziel. Kalendertage sind keine Hotel-Nächte und keine Flug- oder Transferzeiten.» | «Optional, am einfachsten aber gleich hier: Wenn jedes Ziel seine Tage hat, zeigt Jetnity pro Ziel, was noch fehlt, etwa die Unterkunft für diese Nächte. Ohne Verteilung bleiben die Tage vorerst ohne Ziel. Gebucht oder festgelegt wird dabei nichts, auch keine Flugzeiten.» |
| Kästchen | «Vorhandene Tage ausdrücklich auf die Ziele verteilen» | «Tage jetzt auf die Ziele verteilen» |
| Status | «Noch keine Tageszuordnung.» | «Noch nicht verteilt.» |
| Ohne Daten | «… festliegen, kannst du die vorhandenen Tage auf die bestätigten Ziele verteilen.» | «Sobald Abreise und Rückreise feststehen, kannst du hier die Tage auf deine Ziele verteilen.» |

[Tageverteilung vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Ftage.png)
[Tageverteilung eingeschaltet vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Ftage-aktiv.png)

**6. Reisende und Budget**

| Teil | Vorher | Nachher |
|---|---|---|
| Hinweis unter Reisende | – | «Pass-Angaben trägst du nach dem Erstellen unter «Vorbereitung» für jede Person einzeln ein.» |
| Budget, Beschriftung | «Ungefähres Gesamtbudget» | «Ungefähres Gesamtbudget in CHF» |
| Budget, Platzhalter | «CHF, optional» | «z. B. 3000» |

Der Pass wird im Planer weiterhin nicht abgefragt (Datenminimierung).

[Reisende und Budget vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Freisende-budget.png)

**7. Wünsche**

| Vorher | Nachher |
|---|---|
| – | «Jetnity speichert deinen Wunsch als Notiz in der Reiseübersicht.» (so ist es heute) |

[Wünsche vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Fwuensche.png)

**8. Seitenleiste «So geht es weiter» (ab Desktop)**

| Schritt | Vorher | Nachher |
|---|---|---|
| 02 | «Gemeinsam verfeinern – Füge Tagespunkte, Buchungen und Mitreisende hinzu.» | «Ausbauen – Ergänze Flüge, Unterkünfte, Tagespunkte und die Angaben der Reisenden.» |
| 03 | «Entspannt reisen – Später begleiten dich Live-Hinweise und wichtige Erinnerungen.» | «Nichts vergessen – Jetnity zeigt dir, was noch fehlt und was vor der Abreise zu erledigen ist.» |

Live-Hinweise und Einladungen für Mitreisende gibt es heute nicht.

[Seitenleiste vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Fseitenleiste.png)

**9. Übersicht «Als Nächstes»**

| Vorher | Nachher |
|---|---|
| – | Jede Zeile mit Aktion nennt darunter den Bereich, den der Klick öffnet: «Weiter in «Organisieren»» oder «Weiter in «Vorbereitung»». |

Der Text kommt aus derselben Funktion wie der Klick. Text und Ziel können deshalb nicht auseinanderlaufen.

[Als Nächstes vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Fals-naechstes.png)

**10. Übersicht «Deine Route»**

| Teil | Vorher | Nachher |
|---|---|---|
| Untertitel | «Etappen in gespeicherter Reihenfolge» | «Wo du an welchen Tagen bist» |
| Hinweis darunter | – | «Noch ohne eigene Tage: Lisbon, Porto, Marrakesh. Deine Reisetage stehen vorerst unter «Noch keinem Ziel zugeordnet».» |

[Route vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Froute.png)

**11. Übersicht, Bereichskarte**

| Vorher | Nachher |
|---|---|
| «Gut organisiert» (auch wenn darunter «Noch keine Flüge» steht) | «Was schon organisiert ist» |

[Bereichskarte vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Fbereiche.png)

**12. Reiseprüfung, Einleitung**

| Vorher | Nachher |
|---|---|
| «Unterkunftsnächte, Zeiten und Verbindungen gemeinsam ansehen. Die Prüfung liest deinen Plan und ändert nichts. Ausgewählt bedeutet nicht gebucht; auch deine Buchungsmarkierungen sind keine Bestätigung durch einen Anbieter.» | «Jetnity legt Unterkunftsnächte, Zeiten und Verbindungen nebeneinander und zeigt, wo etwas fehlt oder nicht zusammenpasst. Dein Plan bleibt dabei unverändert. «Ausgewählt» heisst nicht gebucht, und deine Markierung «gebucht» ist keine Bestätigung des Anbieters.» |

[Reiseprüfung vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Fpruefen.png)

**13. Reiseplan, leere Etappe**

| Vorher | Nachher |
|---|---|
| «Dieser Etappe ist noch kein Reisetag zugeordnet.» | Gleicher Satz, ergänzt um «Deine Reisetage stehen vorerst unter «Noch keinem Ziel zugeordnet».» Die Ergänzung erscheint nur, wenn es solche Tage gibt. |

[Leere Etappe vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Fetappe-leer.png)

**14. Einreise-Karte (nur Beschriftungen in `einreise-kundenanzeige.ts`)**

| Vorher | Nachher |
|---|---|
| «Pass: Reisedokument-Option» | «Pass: noch nicht angegeben» |
| «Weitere Themen werden noch geprüft» | «Weitere Themen ohne geprüfte Angabe» |

Die alte Formulierung klang nach einer laufenden Prüfung. Regeln, Daten und `official-presentation.ts` bleiben unverändert.

[Einreise-Karte vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Feinreise-karte.png)

**15. Organisieren, Einleitung**

| Vorher | Nachher |
|---|---|
| «… eine externe Buchung wird nicht automatisch übernommen.» | Gleicher Satz, ergänzt um «Was du dort buchst, trägst du danach im Reiseplan ein, damit alles an einem Ort bleibt.» |

[Organisieren vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Forganisieren-kopf.png)

**16. Flugsuche**

| Vorher | Nachher |
|---|---|
| – | Nur bei Gabelflug: «Gabelflug: Hinflug an einen Ort, Rückflug von einem anderen – passend für Reisen mit mehreren Zielen.» |

[Flugsuche vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Fflug-art.png)

**17. Reise ändern → Etappen**

| Teil | Vorher | Nachher |
|---|---|---|
| Zeitraum | «Bisher 2027-06-20 – 2027-06-24» | «Bisher 20. Juni – 24. Juni» |
| Tage ohne Ziel | – | «15 Reisetage sind noch keinem Ziel zugeordnet. Sie bleiben dabei bestehen und zählen zur Gesamtdauer.» |

[Etappen Zeitraum vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Fetappen-bisher.png)
[Etappen Tage ohne Ziel vorher und nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-pv%2Fetappen-gruppe.png)

**Bewusst nicht geändert:**

- die gemeinsame Kontingent-Meldung. Sie erscheint auch dort, wo es «Schritt für Schritt» nicht gibt.
- `official-presentation.ts`, weil seine Begriffe an ein ADR gebunden sind.
- der testgebundene Satz «Beide Wege führen zur gleichen Reise».

Zwei Texttests folgen der neuen Formulierung des Ziel-Hinweises. Ein Test (`erzeugen.test.ts`) prüft jetzt, dass die Sperrmeldung auf «Schritt für Schritt» verweist.

### Schlussliste: Hürde, Änderung, ohne neuen Umfang nicht lösbar

| Gefundene Hürde | Was geändert wurde |
|---|---|
| Unklar, ob ein Konto nötig ist | «Ohne Konto möglich» |
| Sperrmeldung ohne Ausweg | Verweis auf «Schritt für Schritt» |
| Nicht klar, was Jetnity aus den Angaben macht | Einleitung, Seitenleiste |
| Hinweise nennen nur Grenzen | Ziele, Tageverteilung, Reisende, Wünsche |
| Budgetwährung nur im Platzhalter | Beschriftung «in CHF» |
| Klick in «Als Nächstes» springt ohne Ankündigung | «Weiter in «…»» |
| Ziele scheinen nach dem Erstellen verschwunden | Route, leere Etappe, «Reise ändern» |
| «Gut organisiert» bei leeren Bereichen | «Was schon organisiert ist» |
| Fachsprache | Reiseprüfung, «Gabelflug», ISO-Datum, «Reisedokument-Option» |
| Unklar, ob extern Gebuchtes in Jetnity landet | ein Satz in Organisieren |

**Ohne neuen Umfang nicht lösbar (Entscheid des Product Owners):**

- A. **Tage lassen sich nach dem Erstellen nicht mehr auf Ziele verteilen.**
  - «Dauer über Etappen» fügt Tage hinzu, statt sie zu verteilen: Aus 15 Tagen werden 30.
  - Das ist die grösste Hürde für Reisen mit mehreren Zielen.
  - Vorschlag: «Tage auf Ziele verteilen» in «Reise ändern».
- B. Was in «In eigenen Worten» steht, wird beim Wechsel zu «Schritt für Schritt» nicht übernommen. Ziele, Daten und Reisende müssen neu eingegeben werden.
- C. Der Wunschtext wird im Formularweg nicht ausgewertet. Kindesalter und Pässe müssen neu eingegeben werden.
- D. Die Einreise übernimmt die Länder der Reise, aber nicht die Pässe der Reisenden (#1254).
- E. In der Flugsuche bleiben «Nach» und «Rückflug ab» für Lissabon und Marrakesch leer (Abdeckung des Ortskatalogs).
- F. Ortsnamen erscheinen englisch («Lisbon», «Marrakesh»), auch im automatischen Titel (Ortsdaten). **PO 21.11.: neuer Umfang, siehe oben.**
- G. Die Startseite verspricht das Zielbild: Sie sagt, Jetnity erkenne Flugänderungen und prüfe persönliche Einreiseanforderungen. Im Workspace steht «Automatische Einreiseprüfung derzeit nicht verfügbar». Das ist ein Wahrheits- und Marketingentscheid. **PO 21.11.: bleibt.**
- H. Der Bericht der Reiseprüfung ist in Prüfsprache geschrieben (zum Beispiel «0 zeitliche Vergleiche» und ISO-Daten). Das Modul ist testgebunden; es braucht einen eigenen Slice.
- I. Die Vorbereitung zeigt sechs gleichartige Einreise-Karten (3 Reisende × 2 Länder) mit einem Doppelstatus (Readiness-Struktur, #1254).
- J. «Als Nächstes» führt Punkte, die sich nicht ausführen lassen («derzeit nicht verfügbar»). Ihre Reihung ist Logik.
- K. Die intelligente Planung ist in Dev gesperrt. Ihre Vorschau konnte nicht live geprüft werden.

Details stehen in `docs/UI_UX_ERSTBESUCHER_PERSPEKTIVE_2026-11-21.md`.

### Prüfung (Abschluss)

Diese Prüfungen sind grün:

- Typprüfung und Lint (0 Fehler);
- die fünf Hygiene-Checks und der Production-Build;
- 29 betroffene Testdateien mit 540 Tests;
- die Browser-Tests für Workspace (Weiss-Mint, Routen-Ausrichtung), Aktivitäten, Viator und Reiseprüfung.

Bei 320, 390, 768 und 1280 px gibt es kein seitliches Scrollen. Gemessen wurde in Planen (beide Wege), Übersicht, Reiseplan, Organisieren und Vorbereitung. Ganz unten auf der Übersicht überdecken Kostenzeile und Leiste keinen Inhalt.

## Etappe 8 – was sich ändert

**Jedes Panel einzeln geprüft.** 35 Panels, Dialoge und Zustände des Workspace wurden einzeln geöffnet und bei 320, 390, 768, 1280 und 1920 px im hellen und im grünen Thema gemessen. Dazu gehören:

- Reise ändern mit Direkt, Freitext und Vorher/Nachher;
- Reisebegleiter, Stopp hinzufügen mit Vorschau, Reiseprüfung;
- Kalender, Gäste, Lage und Filter, Angebot merken, Archivieren, Menüs;
- Gast- und Kontozustände: leer, lädt, Fehler.

**Gewählte Option sichtbar.** «Direkt bearbeiten» und «In eigenen Worten» sind jetzt ein Segmentumschalter. Vorher war die gewählte Option im hellen Thema dunkel auf dunkel. Der gewählte Schritt im Vorher/Nachher war weiss auf weiss.

**Stopp hinzufügen.** Die Felder hatten keinen Rahmen, weil die Farbvariable nicht existierte. Der Ortsname der Vorschau war im grünen Thema unsichtbar.

**Lesbare Daten.** Reiseprüfung, Reise ändern und Reisebegleiter zeigen «16. Feb.» bzw. «12. Sept. 2026» statt «2026-09-12». Einzahl und Mehrzahl stimmen jetzt.

**Suchmasken und Tablets.**
- Das Reiseziel der Unterkunftssuche steht bis 1439 px in einer eigenen Zeile; vorher war es bei 1280 px abgeschnitten.
- Das Wohnsitzland der Mietwagensuche steht in derselben Zeile wie die übrigen Zusatzfelder.
- Auf Touch-Tablets sind Reiter, Kalendertage, Zusatzfelder, Verbindungszeilen und Kartenwerkzeuge 44 px hoch.
- Kartenpins und der Pfad im Admin haben eine unsichtbare Trefferfläche von mindestens 44 px; ihr Aussehen bleibt gleich.

**Karte.** Die Nummern der Kartenpins standen oben links statt in der Mitte, weil je nach Ladereihenfolge der Leaflet-Stil gewann.

**Lesebreite.** Absätze in Panels, Hinweisen und den Bereichen der Vorbereitung enden bei der Lesebreite. Vorher liefen sie bis 130 Zeichen bzw. 860 px.

**Nach dem Merge von #1254.** `main` ist ohne Konflikte übernommen.
- Der Einreise-Prüfer beginnt im Workspace mit einer `h2`; vorher hatte die Seite zwei `h1`.
- Öffentlich zeigt er Kicker und `h1` in den Schriftstufen.
- Die mit #1254 neue Admin-Seite `/admin/official-truth/at-50-method` hat den Seitenkopf der übrigen amtlichen Quellen.

**Regel als Test.** `lib/ui/knopf-symbol.test.ts` schlägt fehl, wenn in `Button` ein Symbol als Kind neben der Aufschrift steht, denn es stünde dann über dem Text.

**Seitenliste.** 73 Seiten sind abgehakt. Offen sind nur `/login` und `/account/security`, deren Dateien #1240 ändert.

### Textänderungen mit Bedeutung (Etappe 8, einzeln)

1. Reisekopf: «Budget Noch offen» wird «Budget noch offen».
2. Reiseprüfung: «1 Nächte» wird «1 Nacht». Lücken heissen «16. Feb. bis 17. Feb.» statt «2027-02-16 bis 2027-02-17».
3. Reiseprüfung: Kalendertage im Bericht stehen als «12. Sept. 2026» statt im ISO-Format.
4. Reise ändern: Der Zeitraum lautet «10. Feb. – 17. Feb.» statt «2027-02-10 – 2027-02-17»; in der Einzahl heisst es «1 Tag · 1 Etappe».
5. Reisebegleiter: ISO-Daten in der Lagebeschreibung werden erst bei der Anzeige lesbar geschrieben. Gespeicherte Sätze bleiben unverändert.
6. Unterkunftssuche, Gäste: «Reisegruppe: 2 Personen. Belegung offen» wird «2 Personen · Belegung offen»; ohne Personenzahl steht nur «Belegung offen».
7. Admin-Pfad: Neue Bezeichnung «Österreich: 50 Pässe» für `/admin/official-truth/at-50-method`. Vorher wurde sie aus der Adresse gebildet.
8. Einreise im Workspace: Der Kicker «Einreise & Visum» über dem Prüfer entfällt, weil die Ansicht schon so heisst. Öffentlich bleibt er.

### Abweichungen vom Plan in Etappe 8

- Die Vollbildkarte ist nur im Code geprüft. Sie läuft nur mit dem Google-Maps-Schlüssel der Production.
- `WidgetConsentChoice` ist nicht poliert, weil die Komponente in keiner Seite eingebunden ist.
- Lange Zeilen in «Konto löschen» und «Anmeldung & Sicherheit» liegen in Dateien von #1240 und folgen nach dessen Merge.

Prüfung Etappe 8:

- Grün, auch nach der Übernahme von `main`:
  - Typprüfung;
  - Lint der geänderten Dateien (nur alte Warnungen in unveränderter Logik);
  - alle fünf Hygiene-Checks;
  - Production-Build.
- Tests:
  - 152 Testdateien (Reisen, UI, Admin, Reisebegleiter, Reiseänderung, Einreise-Hinweise) ohne Fehlschlag;
  - Browser-Tests der Reiseprüfung und des Workspace (mit Einreise) grün.
- Schlussmessung über alle Seiten der Seitenliste:
  - Breiten 280, 320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920 und 2560 px, quer 667×375, 844×390 und 1180×820;
  - Workspace hell und grün, Admin hell und dunkel;
  - kein seitliches Scrollen, genau eine `h1` pro Seite, Bedienflächen auf Touch 44 px;
  - übrig bleiben nur die bewusst einzeilige Gast-Hinweiszeile im Reisekopf und die Stellen in Dateien von #1240.
- Den Browser-Test der Reiseprüfung mit `TRIP_AUDIT_UI_URL=http://localhost:3000` starten. Der Dev-Server blockiert `127.0.0.1` als fremde Herkunft, und der Test bleibt sonst beim Laden hängen.

Demo 390 px: Umschalter in Reise ändern, Reiseprüfung, Stopp mit Vorschau, Gäste und Kalender, danach dasselbe im grünen Thema.

[e8-workspace-dialoge-390.webm](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fe8-workspace-dialoge-390.webm)

Vorher und nachher, jeweils mit dem Stand von Etappe 7 als «vorher»:

[Reise ändern 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Freise-aendern-390-vorher.png) [Reise ändern 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Freise-aendern-390-nachher.png)

[Reiseprüfung 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Freisepruefung-390-vorher.png) [Reiseprüfung 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Freisepruefung-390-nachher.png)

[Stopp-Vorschau grün 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fstopp-vorschau-gruen-390-vorher.png) [Stopp-Vorschau grün 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fstopp-vorschau-gruen-390-nachher.png)

Die Positionszeile der Stopp-Vorschau («Ohne Kartenposition» bzw. «Standort aus dem Ortskatalog») hängt an der Ortssuche des jeweiligen Testservers. Sie ist keine Änderung dieses PR.

[Unterkunftssuche 1280 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Funterkunftssuche-1280-vorher.png) [Unterkunftssuche 1280 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Funterkunftssuche-1280-nachher.png)

[Kartenpins vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fkarte-pins-vorher.png) [Kartenpins nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fkarte-pins-nachher.png)

Schlussmessung, Beispiele:

[Startseite 280 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fschluss-startseite-280.png) [Reiseplan grün, Tablet quer 1180 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fschluss-reiseplan-gruen-tablet-quer.png) [Übersicht 2560 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e8%2Fschluss-uebersicht-2560.png)

## Etappe 7 – was sich ändert

**Eine Überschrift pro Seite.** Vorher stand in der Kopfleiste jeder Admin-Seite eine Überschrift erster Ordnung, die Seite darunter hatte eine zweite in eigener Grösse und eigenem Stil. Jetzt beginnt jede Admin-Seite mit dem `Seitenkopf` (wie Konto und öffentliche Seiten): Kicker, eine `h1` in der Display-Grösse, kurzer Einleitungssatz. Die Kopfleiste zeigt nur noch den Ort. Abschnitte darunter beginnen mit `h2`.

**Pfad in der Kopfleiste.** Zwischenstufen ohne eigene Seite (zum Beispiel «Amtliche Quellen») sind kein Link mehr ins Leere. Die Bezeichnungen kommen aus der Admin-Navigation, also dieselben Wörter wie in der Seitenleiste.

**Lesebreite.** Erklärende Absätze und «Datenqualität & Nachweis» liefen bei 1280–1920 px bis 130 Zeichen breit; jetzt höchstens etwa 75. Die amtlichen Quellen und `/einreise/betrieb` sind eine Lesespalte.

**Sprachkatalog auf dem Handy.** Vorher drei Spalten mit je rund 100 px; jetzt pro Eintrag ein Block mit Schlüssel, Deutsch und Englisch untereinander. Ab Tablet bleibt die Tabelle.

**Fehler, 404, Laden.** Admin-Fehler und Admin-404 nutzen die `Statuskarte` aus Etappe 6 (technische Meldung nur ausserhalb von Production), die Ladeansicht den `Ladeplatzhalter`.

**Admin-Anmeldung und MFA, nur Aussehen.** Formular als Karte wie das Login, Felder mit Label, «Anmelden» als Hauptknopf, «Magic Link senden» als Nebenknopf, Fehler werden vorgelesen. Anmelde- und MFA-Logik sind unverändert.

**Nebentext lesbar (AA).** Der graue Nebentext der Creme-Palette (Admin hell, eingebettete Ansichten) hatte auf der Grundfläche 4,48:1 und verfehlte damit knapp AA; `DESIGN_SYSTEM.md` nannte fälschlich 4,53:1. Er zeigt jetzt auf die vorhandene Stufe `ink-900` (6,2:1). Keine neue Farbe; Weiss-Mint und das grüne Workspace-Thema sind nicht betroffen.

**Kleinigkeiten.** Bedienflächen auf Touch 44 px (Auswahlfelder der Nutzerliste, Links der amtlichen Quellen, «Security öffnen»), mit Maus mindestens 24 px. Die leere Navigationsgruppe «In Planung» wird nicht mehr angezeigt. `role="application"` am Admin-Raster und `aria-live` am Hauptbereich entfernt: Screenreader lesen die Seite wieder normal und sagen nicht jede Änderung an.

### Textänderungen mit Bedeutung (Etappe 7, einzeln)

1. Admin-Startseite: Kicker «Jetnity · Betrieb im Überblick» wird «Administration», darunter neu «Betrieb im Überblick. Nur lesend, als Momentaufnahme.»; das Abzeichen «Read-only · Momentaufnahme» entfällt (die Aussage steht jetzt im Satz).
2. Reiseauswertung: Kicker «Analytics · Jetnity» wird «Administration» (Deutsch und Englisch).
3. Content-Inventar: Kicker «Content · Jetnity» wird «Administration».
4. Alle übrigen Admin-Seiten, Fehler, 404, Admin-Anmeldung und MFA: neuer Kicker «Administration»; amtliche Quellen und `/einreise/betrieb`: neuer Kicker «Amtliche Quellen».
5. Pfad in der Kopfleiste: Bezeichnungen wie in der Seitenleiste, also «Reiseauswertung» statt «Analytics», «Content-Inventar» statt «Content», «Marketing-Links» statt «Marketing», «Sprachkatalog» statt «Lokalisierung»; für Unterseiten ohne Eintrag vorher aus der Adresse gebildet, jetzt «Amtliche Quellen» statt «Official Truth», «Österreich-Methode» statt «At Method», «Schutzprüfung» statt «Guard», «Quellenlauf» statt «Import», «Methode» statt «Method».

Einleitungssätze der Seiten, Fehler- und 404-Texte sowie die Texte von Admin-Anmeldung und MFA sind unverändert; sie stehen nur im neuen Seitenkopf bzw. in der Karte.

Prüfung Etappe 7:

- Typprüfung, Lint der geänderten Dateien (nur alte Warnungen in unveränderter Logik) und alle fünf Hygiene-Checks grün.
- Admin-, UI-, Layout-, Einstellungs- und Sprachtests ohne Fehlschlag, darunter die Browser-Tests der Admin-Einstellungen mit echtem Kontrast und 320-px-Umbruch (sie haben den zu hellen Nebentext gefunden).
- Gemessen bei 390, 768, 1280 und 1920 px, hell und dunkel, auf allen 20 Admin-Seiten, Admin-Anmeldung, Fehler- und 404-Seite: kein seitliches Scrollen, genau eine `h1` pro Seite, keine Absätze über etwa 85 Zeichen, auf Touch keine Bedienfläche unter 44 px (Eingabeelement 42 px im 44-px-Rahmen).
- Hinweis: Eine unbekannte Admin-Adresse zeigt weiter die allgemeine 404; eine eigene wäre eine neue Route und ist nicht Teil des Feinschliffs.

[Admin-Startseite 1280 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-start-1280-hell-vorher.png) [Admin-Startseite 1280 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-start-1280-hell.png)
[Sprachkatalog 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-sprachkatalog-390-vorher.png) [Sprachkatalog 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-sprachkatalog-390.png)
[Admin-Anmeldung 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-login-390-vorher.png) [Admin-Anmeldung 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-login-390.png)
[Security 1280 px dunkel](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-security-1280-dunkel.png) [Admin-Fehlerseite 1280 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e7%2Fadmin-fehler-1280.png)

## Etappe 6 – was sich ändert

**Statusseiten als eine Karte.** Neuer Baustein `Statuskarte` für Seiten, die nur einen Zustand melden: 404, Anmeldung abschliessen, Link zum neuen Passwort, kein Zugriff und Konto gelöscht. Jede hat Symbol, Titel, einen kurzen Satz und höchstens zwei Knöpfe; Laden und Erfolg werden vorgelesen (`role="status"`), Fehler als `role="alert"`.

**Anmeldung abschliessen und neues Passwort.** Vorher eine leere Fläche mit einer roten Zeile und ohne Weg zurück. Jetzt mit Kopfzeile und Marke (`Markenrahmen`, ohne die Sitzungsabfrage der normalen Navigation, damit der Abschluss der Anmeldung nicht gestört wird), Titel und den Knöpfen «Zur Anmeldung» und «Zur Startseite». Die Logik (Codeaustausch, Weiterleitung, Passwortprüfung, Speichern) ist unverändert.

**Passwortformular.** Jedes Feld hatte zwei übereinanderliegende Knöpfe «Passwort anzeigen»; jetzt einer. Fehler als `Hinweis`, Erfolg als ruhige Karte.

**Kein Zugriff und Konto gelöscht.** Beide mit Kopf- und Fusszeile und als Karte; «Abmelden» ist ein echter Knopf statt eines unterstrichenen Textes.

**Eingabefelder überall.** Das gemeinsame Eingabefeld ist auf Touch 44 px hoch (vorher 40 px, das eigentliche Eingabeelement nur 24 px; ein Tipp an den Rand traf nicht). Mit Maus bleibt es 40 px. Im hellen Thema zeichnet nur noch der Feldrahmen Fläche und Fokus; vorher bekam das innere Eingabeelement einen zweiten Fokusrahmen innerhalb des Feldes. Das wirkt auch auf Login, Registrierung und Admin-Formulare.

**Login und Anmeldung & Sicherheit nur teilweise.** Ihre Dateien ändert der offene PR #1240; hier wirkt nur das Eingabefeld. Kartenrahmen und Lesebreite folgen nach dessen Merge.

### Textänderungen mit Bedeutung (Etappe 6, einzeln)

1. Anmeldung abschliessen, lädt: «Authentifiziere…» wird Titel «Anmeldung wird abgeschlossen» mit «Einen Moment, bitte.».
2. Anmeldung abschliessen, erfolgreich: «Erfolgreich angemeldet – weiterleiten …» wird Titel «Erfolgreich angemeldet» mit «Du wirst weitergeleitet …».
3. Anmeldung abschliessen, Fehler: neuer Titel «Anmeldung nicht abgeschlossen» über der bisherigen Meldung, neue Knöpfe «Zur Anmeldung» und «Zur Startseite».
4. Neues Passwort ohne gültigen Link: «Session erforderlich» / «Bitte fordere zuerst einen Passwort-Reset per E-Mail an und öffne dann den Link auf dieser Seite.» wird «Link aus der E-Mail öffnen» / «Ein neues Passwort setzt du über den Link in unserer E-Mail. Fordere ihn bei der Anmeldung unter «Passwort vergessen?» an und öffne ihn dann.», mit den Knöpfen «Zur Anmeldung» und «Zur Startseite».
5. Neues Passwort, Link wird geprüft: statt eines Drehsymbols ohne Text jetzt «Link wird geprüft» / «Einen Moment, bitte.».
6. Kein Zugriff: neuer Kicker «Administration», Kopf- und Fusszeile; Titel und Text unverändert.
7. Konto gelöscht: neuer Kicker «Konto»; Titel und Text unverändert.

Prüfung Etappe 6:

- Typprüfung, Lint der geänderten Dateien (nur drei alte Warnungen `catch (err: any)` in der unveränderten Anmeldelogik) und alle fünf Hygiene-Checks grün.
- Betroffene Tests (Anmeldung, Callback, Passwort, Abmelden, Kontolöschung, Registrierung, Rechtliches, SEO, UI- und Layout-Wächter, Seitenliste, Doku) ohne Fehlschlag. Im breiteren Lauf über alle Dateien, die die geänderten Stile lesen, scheitern nur die drei bekannten Tests, die eine lokale PostgreSQL brauchen (auch auf main).
- Gemessen bei 320, 390, 768, 1280 und 1920 px auf Login, Registrierung, Passwort (Link und Formular), Anmeldung abschliessen, Konto gelöscht, kein Zugriff, 404 und Sicherheit: kein seitliches Scrollen; auf Touch keine Bedienfläche unter 44 px (das Eingabeelement selbst 42 px im 44-px-Rahmen). Ein Klick an den oberen Feldrand setzt den Fokus ins Feld.

[Anmeldung abschliessen 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fanmeldung-abschliessen-390-vorher.png) [Anmeldung abschliessen 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fanmeldung-abschliessen-390.png)
[Kein Zugriff 390 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fkein-zugriff-390-vorher.png) [Kein Zugriff 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fkein-zugriff-390.png)
[Passwort-Link 1280 px vorher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fpasswort-link-1280-vorher.png)
[Passwort-Link 1280 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fpasswort-link-1280.png)
[Passwortformular 390 px, ein Anzeigen-Knopf pro Feld](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fpasswort-formular-390.png) [Login 390 px, Feldfehler mit einem Fokusrahmen](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Flogin-feldfehler-390.png) [Konto gelöscht 390 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fkonto-geloescht-390.png)
[404 1280 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2F404-1280.png)
[Registrierung 1280 px](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e6%2Fregistrierung-1280.png)

## Etappe 5 – was sich ändert

**Rechtliche Seiten als eine Lesespalte.** Impressum, Datenschutz, AGB und Datenquellen stehen in derselben Spalte mit Lesebreite, mit Kicker «Rechtliches», denselben Titelgrössen und gut sichtbaren Links. Der AGB-Titel ragte bei 390 px seitlich heraus; er trennt jetzt. Die Rechtstexte selbst sind unverändert.

**Keine Mintbänder mehr.** Öffentliche Seiten setzen keinen eigenen Hintergrund; vorher erschien auf Impressum, Entdecken und Einreise ein zweiter Mintton unter der Kopfzeile.

**404 und Fehlerseiten.** Jede 404 hat jetzt Kopf- und Fusszeile, auch für unbekannte Adressen ausserhalb der öffentlichen Seiten. 404 und Fehlerseiten sind dieselbe Karte mit einem Hauptknopf und einem Nebenknopf.

**Entdecken.** Karten, Suchformular und Themen-Chips mit den gemeinsamen Bausteinen. Findet die Suche nichts, zeigt ein Leerzustand «Alle Ziele anzeigen».

**Meine Welt.** Seitenkopf wie auf den anderen Kontoseiten. Der Fehlerkasten für nicht lesbare Besuche war bisher so hell wie die Seite und damit unsichtbar; er hat jetzt einen Rand. Leerer Zustand und Lesefehler als Karten.

**Lesebreite.** Die letzten langen Absätze (Startseite, Besuchsformular, Länderfeld) sind auf 65 Zeichen begrenzt.

### Textänderungen mit Bedeutung (Etappe 5, einzeln)

1. Öffentliche Fehlerseite: der Satz «Deine gespeicherten Reisen sind davon nicht betroffen.» entfällt. Die Seite kann das nicht prüfen.
2. Impressum- und Datenschutz-Ersatztext: «Schreiben Sie an …» wird «Schreib uns an …» (Du-Form wie im Rest der App).
3. Impressum, Datenschutz und Datenquellen: neuer Kicker «Rechtliches» über dem Titel.
4. Meine Welt: neuer Kicker «Konto» über dem Titel.
5. Unbekannte Adressen: die 404 zeigt jetzt Kopf- und Fusszeile mit der normalen Navigation.

Prüfung Etappe 5:

- Typprüfung, Lint der geänderten Dateien und alle fünf Hygiene-Checks grün.
- Betroffene Tests (Fehlerseiten, Rechtliches, Entdecken, Meine Welt, Länderfeld, Startseite, Layout- und Design-Wächter, Seitenliste, Doku) in vier Läufen ohne Fehlschlag: 285, 21, 85 und 24 Tests (teils überlappend).
- Gemessen bei 320, 390, 768, 1280 und 1920 px auf Startseite, Entdecken (auch ohne Treffer), Einreise, Datenquellen, Impressum, Datenschutz, AGB, 404, Fehlerseiten und Meine Welt (mit Besuchen, leer, Fehler): kein seitliches Scrollen, keine Bedienfläche unter 44 px, kein Fliesstext über 85 Zeichen.

[AGB 390 px vorher: Titel ragt seitlich heraus](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fagb-390-vorher.png)
[AGB 390 px nachher: Titel trennt, Lesespalte](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fagb-390-nachher.png)
[AGB 1280 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fagb-1280-nachher.png)
[Datenschutz 1280 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fdatenschutz-1280-nachher.png)
[404 390 px vorher: ohne Kopf- und Fusszeile](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2F404-390-vorher.png)
[404 390 px nachher: mit Kopf- und Fusszeile](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2F404-390-nachher.png)
[Öffentliche Fehlerseite 1280 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Ffehlerseite-1280-nachher.png)
[Entdecken ohne Treffer 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fentdecken-leer-390-nachher.png)
[Meine Welt 390 px nachher](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fmeine-welt-390-nachher.png)
[Meine Welt Lesefehler 390 px nachher: sichtbarer Kasten](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e5%2Fmeine-welt-fehler-390-nachher.png)

## Etappe 4 – was sich ändert

**Laden zeigt die Form des Ergebnisses.** Such- und Anbieterflächen (Unterkunft, Aktivitäten, Mobilität, 12Go, Omio, Mietwagen-Details, Stay22, Flugsuche, Viator, GetYourGuide, DiscoverCars) zeigen Platzhalterflächen mit einer Statuszeile statt Drehsymbolen. Drehsymbole bleiben nur in Knöpfen, die gerade etwas absenden.

**Kontoseiten mit den gemeinsamen Bausteinen.**

- Übersicht, Merkliste, Reisende, Buchungen und Einstellungen beginnen mit demselben Seitenkopf.
- Die Kontoübersicht hat nur noch eine dunkelgrüne Fläche (nächster Reiseschritt); Profil und Verwaltung stehen in einer hellen Karte.
- Leere Listen zeigen einen Leerzustand mit einem nächsten Schritt.
- **Merkliste, Korrektur:** Ein Lesefehler zeigte bisher «Zur Anmeldung», auch wenn man angemeldet war. Jetzt gibt es dann «Erneut laden»; «Zur Anmeldung» nur ohne Anmeldung.
- `/account/security` und die Kontolöschung bleiben unverändert (#1240).

**Sehr schmal und quer.** Unter 360 px und im Querformat steht die untere Leiste als Raster (zwei bzw. fünf Spalten) statt als fünf volle Zeilen über dem Inhalt. Bei 280 px überlappen Logo und Reiseaktionen nicht mehr.

**Ruhige Übergänge.** Ansichtswechsel, Planpunkt-Detail und aufklappende Bereiche blenden kurz ein; bei «Bewegung reduzieren» gar nicht.

**Breite Bildschirme.** Fliesstext ist höchstens 65 Zeichen breit. Ab 2400 px wird die Grundschrift etwas grösser, damit der Inhalt bei 2560 und 3840 px nicht als schmale Spalte mit kleiner Schrift steht.

### Textänderungen mit Bedeutung (Etappe 4, einzeln)

1. Buchungen, Reihenfolge: neu «Die zuletzt bestätigte Buchung steht oben.» (en «Your most recently confirmed booking is at the top.»)
2. Buchungen leer: neuer Link «Zu meinen Reisen» (en «Go to my trips»)
3. Buchungen laden: nur noch «Buchungen werden geladen.» (der zweite Satz entfällt)
4. Reisende, Einleitung: neu «Angaben zu dir und deinen Mitreisenden, die du für neue Reisen wiederverwenden kannst.»
5. Reisende, Geltung: neu «Änderungen hier verändern keine bestehende Reise. Für eine Reise gelten die Angaben, die du in diese Reise übernommen hast.»
6. Reisende leer: neu «Lege eine Person an, damit ihre Staatsbürgerschaften und Angaben zu Reisedokumenten (ohne Nummer) für neue Reisen bereitstehen. Vorhandene Reisen ändern sich dadurch nicht.»
7. Reisende löschen, Titel: neu «Diesen Eintrag löschen?»
8. Reisende löschen, Folge: neu «Nur dieser Eintrag in deinem Konto wird gelöscht. Bereits vorhandene Reisen und die Angaben darin werden dadurch nicht umgeschrieben oder gelöscht.»
9. Merkliste leer: Titel «Deine Merkliste ist noch leer.», Text «Merke einen Mietwagen direkt am Ergebnis oder erfasse oben ein Angebot selbst.»
10. Merkliste Lesefehler: Aktion «Erneut laden» statt «Zur Anmeldung»

Prüfung Etappe 4:

- Typprüfung, Lint der geänderten Dateien und alle fünf Hygiene-Checks grün.
- Betroffene Unit-Tests 244/244, Browser-Tests Einstellungen und Kontoanzeige 80/80, Tests zu Übergängen und Breiten 461 ohne Fehlschlag.
- Bekannte Umgebungsfehler, auch auf `main`: native PostgreSQL-Tests und ein esbuild-Bundle mit `node:crypto` (`mounted-matrix`).
- Gemessen: Kontoseiten bei 390 und 1440 px, untere Leiste bei 280–390 px und quer, breite Bildschirme bei 1920, 2560 und 3840 px; kein seitliches Scrollen.

[Handy 320 px: untere Leiste als Raster](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fleiste-320.png)
[Querformat 844×390: fünf Spalten](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fleiste-quer-844x390.png)
[280 px: Kopfzeile ohne Überlappung](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fkopf-280.png)
[Handy 390 px: Aktivitäten laden](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fladen-aktivitaeten-390.png)
[Handy 390 px: Kontoübersicht](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fkonto-390.png)
[Desktop 1440 px: Kontoübersicht](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fkonto-1440.png)
[Handy 390 px: leere Merkliste](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fmerkliste-leer-390.png)
[Desktop 1440 px: Merkliste mit Lesefehler](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fmerkliste-fehler-1440.png)
[3840 px: Übersicht](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e4%2Fuebersicht-3840.png)

## Etappe 3 – was sich ändert

**Organisieren beginnt mit dem, was schon da ist.**

- «Das hast du schon» steht pro Kategorie zuerst; eine Zeile öffnet den Punkt im Reiseplan.
- Die Reiter sind lesbar, die Unterkunftsfilter einklappbar.
- Auf dem Handy steht der Such-Knopf von Flug- und Mietwagensuche nach allen Feldern (`org-aktion-ende`, nur CSS). Die Flugsuche läuft bei 320 px nicht mehr seitlich über; das war die offene Ausnahme aus Etappe 1.

**Planpunkt-Detail zeigt zuerst das Vorhandene:** Statussiegel, Zeitpunkt, Preis beim Auswählen, dann die Herkunft. Alles kommt aus `itemDetailAbleiten` (`lib/trips/detail.ts`), also aus derselben Preislesung wie das Kostenbild.

**Bewusste Entscheidungen:**

- Einen Planpunkt entfernen fragt jetzt in der Zeile nach. Der Fokus springt auf «Abbrechen», und Escape führt zurück zum Papierkorb.
- «Als gebucht markieren» bekommt keine Rückfrage: Es ist umkehrbar, und Jetnity bucht nichts. Stattdessen sagt jeder Bestandsbereich in einem Satz, was «Gebucht» heisst.

**Vorbereitung:**

- Ein Satz zum eigenen Stand ersetzt die Zahlkacheln; dazu ein Hinweis-Baustein.
- Der Stand wird als Segment ausgewählt.
- Jedes Land erscheint pro reisender Person genau einmal.
- Die Seite ist bei 390 px um rund ein Fünftel kürzer.

**Einreise** übernimmt die Länder der Reise. Das bleibt minimal, weil `EinreiseLaenderpruefer` zu #1254 gehört.

**Gemeinsamer Stil:** Die Bestandsbereiche Flüge, Unterkunft, Mietwagen und Verbindungen nutzen die gemeinsamen Schriftstufen. Neuer Baustein: `Hinweis` (`components/ui/hinweis.tsx`).

### Textänderungen mit Bedeutung (einzeln)

1. Herkunft «manuell»: alt «Manuell erfasst. Das ist kein nachgewiesenes Anbieterangebot.» → neu «Von dir eingetragen. Jetnity hat dazu kein Angebot beim Anbieter geprüft.»
2. Herkunft «manuell gebucht»: alt «Von dir als gebucht bestätigt. Keine Provider-Bestätigung.» → neu «Von dir als gebucht markiert. Jetnity prüft Buchungen nicht beim Anbieter.»
3. Herkunft «mit Anbieterangaben»: alt «Es liegen gespeicherte Herkunftsfelder vor. Das ist kein geprüfter Live-Nachweis.» → neu «Mit Anbieterangaben gespeichert. Jetnity hat sie nicht live beim Anbieter geprüft.»
4. Neu im Detail: Hat ein Punkt Anbieterangaben und ist als gebucht markiert, steht zusätzlich der Satz aus Punkt 2. Der Status bleibt deine eigene Markierung.
5. Preis im Detail:
   - vorher nur bei Flügen « · zum Auswahlzeitpunkt»;
   - jetzt bei allen Punkten «Preis beim Auswählen»;
   - ohne Preis steht «Ohne gespeicherten Preis», bei einem unlesbaren Preis «Gespeicherter Preis nicht lesbar».
6. Neu in jedem Bestandsbereich (Flüge, Unterkunft, Mietwagen, Verbindungen): «Gebucht heisst: du hast selbst beim Anbieter gebucht und es hier markiert. Jetnity prüft das nicht beim Anbieter.»
7. Neu beim Entfernen eines Planpunkts. Vorher wurde der Punkt sofort entfernt. Die Rückfrage lautet:
   - «Diesen Punkt entfernen: {Titel}?»
   - «Er verschwindet aus deiner Reise. Das lässt sich nicht rückgängig machen.»
   - bei als gebucht markierten Punkten zusätzlich: «Eine Buchung beim Anbieter bleibt davon unberührt.»
   - Knöpfe «Endgültig entfernen» und «Abbrechen».
8. Einreise: alt «Für diese Themen gilt derzeit nicht verfügbar.» → neu «Für diese Themen liegt derzeit keine geprüfte Angabe vor.»
9. Vorbereitung: Die Zahlkacheln werden durch einen Satz ersetzt. Der Satz nennt nie Visum, Einreise oder «bereit». Beispiele:
   - «0 von 2 Punkten erledigt.»
   - «1 von 3 Punkten erledigt · 1 erneut prüfen · 1 nicht relevant.»
   - «Alle Punkte als nicht relevant markiert.»
   - «Noch keine Vorbereitungspunkte.»
10. Reisende ohne jede Angabe: Die drei Zeilen zu Wohnsitz, Staatsbürgerschaften und Dokumenten werden zu «Noch keine Angaben hinterlegt.»

### Abweichungen vom Plan in Etappe 3

- **Keine Rückfrage bei «Als gebucht markieren».** Das ist umkehrbar, und Beschriftung und Tests sind ein Vertrag. Stattdessen gibt es den Bedeutungssatz aus Punkt 6.
- **Keine Anzeige von Flugänderungen.** Es gibt keinen Flugstatus vom Anbieter, die Anzeige würde einen Stand erfinden. Fristen stehen schon ruhig unter «Als Nächstes».
- **Einreise minimal** wegen #1254.
- **Rote Fehlerzeilen bleiben.** Das grüne Design bildet sie bereits um.

## Prüfung (Etappe 3)

- Typprüfung grün. Lint: 0 Fehler; die Warnungen sind dieselben wie auf main.
- Hygiene-Checks grün: `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`.
- `npm run build` grün.
- `test:core`: dieselben Fehlschläge wie in Etappe 2, alle ohne lokale native PostgreSQL. Betroffene Tests der geänderten Bereiche grün (56 Dateien).
- Bekannt und nicht aus diesem PR: `scripts/trip-personal-preparation-workflow-completion-1/arbeitsbereich.test.ts` scheitert auch auf dem Ausgangsstand an einem esbuild-Fehler (`node:crypto`).
- Messung im Browser mit der Gast-Testreise, hell und grün:
  - Planpunkt-Detail bei 320, 390, 768 und 1440 px ohne seitliches Scrollen;
  - Entfernen-Ablauf mit Fokus, Escape und Bestätigung; die Kostenzeile sinkt um den Preis des entfernten Punkts;
  - Organisieren, Vorbereitung und Einreise bei 280 und 320 px ohne seitliches Scrollen;
  - Flug- und Mietwagensuche enden bei 390, 320 und 280 px mit dem Such-Knopf.

[Handy 390 px: Planpunkt-Detail mit Siegel, Zeitpunkt und Preis beim Auswählen](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e3%2Fplanpunkt-detail-handy-hell.png)
[Desktop 1440 px: Planpunkt-Detail und Flug-Bestand im grünen Design](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e3%2Fplanpunkt-detail-desktop-gruen.png)
[Handy 390 px: Rückfrage beim Entfernen eines Planpunkts](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e3%2Fentfernen-frage-handy-hell.png)
[Desktop 1440 px: Flug-Bestand mit Bedeutung von Gebucht](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e3%2Fflug-bestand-desktop-hell.png)
[Handy 390 px: Organisieren beginnt mit Das hast du schon](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e3%2Forganisieren-das-hast-du-schon-handy.png)
[Handy 390 px: Vorbereitung mit einem Satz zum Stand](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e3%2Fvorbereitung-handy-hell.png)
[Handy 320 px: Flugsuche endet mit dem Such-Knopf](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e3%2Fflugsuche-320-knopf-am-ende.png)
[Handy 390 px: Unterkunft-Bestand im grünen Design](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e3%2Funterkunft-bestand-handy-gruen.png)

[e3-entfernen-organisieren-vorbereitung.webm](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e3%2Fe3-entfernen-organisieren-vorbereitung.webm)

## Etappe 2 – was sich ändert

**`/planen` zeigt einen Weg auf einmal.** Oben steht ein Umschalter mit «In eigenen Worten» (Standard) und «Schritt für Schritt». Der andere Weg ist ausgeblendet, nicht entfernt; Eingaben bleiben beim Wechsel erhalten. Beide Wege führen zur gleichen Reise.

**Kostenbild als reine Funktion** (`lib/trips/kostenbild.ts`):

- Es rechnet nur mit gespeicherten Preisen, also dem Preis beim Auswählen, keine Live-Preise.
- Jede Währung wird für sich summiert, ohne Umrechnung. Gebucht und ausgewählt stehen getrennt.
- «Gebucht» heisst: von dir als gebucht markiert. Jetnity prüft keine Buchung beim Anbieter.
- Punkte ohne Preis werden gezählt und genannt, nie als 0 gerechnet.
- Ungültige Preise und mehrdeutige Doppel werden ausgewiesen und nicht mitgerechnet.
- Der Budgetvergleich erscheint nur, wenn alle Preise in der Reisewährung gespeichert sind. Es gibt keine Hochrechnung pro Person.

**Übersicht neu geordnet:**

- Reihenfolge: «Als Nächstes», Route, Kosten, Einreise, Vorbereitung, dann «Gut organisiert» mit «Reise prüfen».
- Ab 1280 px ist die Übersicht zweispaltig.
- Die Buchungsliste entfällt in der Übersicht. Gebuchte Posten stehen im Kostenbild, Details bleiben in Organisieren.

**Unterkunft pro Etappe:** Die Route zeigt «Unterkunft für alle N Nächte» oder «X von N Nächten ohne Unterkunft». Das erscheint nur, wenn der Stand eindeutig ist; sonst steht nichts da.

**Kostenleiste auf Handy und Tablet:** Bis 1023 px steht eine Zeile «Geplant ca. CHF … · Budget CHF …» direkt über der unteren Navigation. Ein Tipp öffnet aus jeder Ansicht das Kostenbild der Übersicht und setzt den Fokus auf die Überschrift.

**Neue Bausteine:** `Karte`, `Abschnitt` und `Preis` in `components/ui`.

Prüfung Etappe 2:

- Typprüfung grün. Lint: 0 Fehler.
- Hygiene-Checks grün: `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`.
- `npm run build` grün.
- `test:core`: Es bleiben nur die bekannten Fehlschläge ohne lokale PostgreSQL-Binaries.
- Neue und betroffene Unit-Tests grün (121/121), darunter Kostenbild, Unterkunft pro Etappe und Planen-Einstieg. Workspace-Browsertests grün (41/41).
- Messung im Browser mit der Gast-Testreise bei 320, 390, 768, 1280, 1440 und 2560 px, hell und grün:
  - kein seitliches Scrollen;
  - die Kostenleiste liegt bündig auf der Navigation;
  - der Seitenabstand unten schliesst die Leiste ein;
  - der Tipp springt aus Reiseplan, Organisieren und Übersicht zum Kostenbild.

[Handy 390 px: Übersicht mit «Als Nächstes» und Kostenleiste](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e2%2F01-handy-390-uebersicht-als-naechstes-und-kostenleiste.png)
[Handy 390 px: Route mit Unterkunft pro Etappe](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e2%2F02-handy-390-route-unterkunft-pro-etappe.png)
[Handy 390 px: Kostenbild](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e2%2F03-handy-390-kostenbild.png)
[Handy 390 px: Übersicht im grünen Design](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e2%2F04-handy-390-uebersicht-gruen.png)
[Tablet 768 px: Reiseplan mit Kostenleiste](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e2%2F06-tablet-768-reiseplan-mit-kostenleiste.png)
[Handy 390 px: /planen mit einem Weg](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e2%2F07-handy-390-planen-ein-weg.png)
[Desktop 1440 px: Übersicht zweispaltig](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e2%2F05-desktop-1440-uebersicht-zweispaltig.png)

[e2-kostenleiste-zum-kostenbild.webm](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e2%2Fe2-kostenleiste-zum-kostenbild.webm)
[e2-planen-ein-weg.webm](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e2%2Fe2-planen-ein-weg.webm)

## Etappe 1 – was sich ändert

- **Feste Stufen:**
  - sechs Schriftgrössen (`text-display` bis `text-kicker`);
  - drei Ecken (`rounded-control/card/panel`);
  - zwei Schatten (`shadow-card/raised`);
  - keine neue Farbe. `cn()` kennt die neuen Namen, damit `tailwind-merge` sie nicht verwirft.
- **Bausteine in `components/ui`:**
  - `StatusSiegel` (Gebucht, Ausgewählt, Offen, Hinweis), unterscheidbar durch Wort, Form und Symbol, nicht nur Farbe;
  - `Seitenkopf`, `Leerzustand`, `Ladeplatzhalter`;
  - `BuchungsSiegel` bildet auf das Statussiegel ab; die Texte bleiben gleich.
- **Ein Reisekopf:** Alle fünf Reise-Ansichten haben denselben flachen Kopf (Ansicht, Reisetitel, Zeitraum, Route, Reisende, Budget). Die Foto-Köpfe von Reiseplan und Organisieren entfallen. Die Stadtbilder in den Etappenkarten und ihre Bildnachweise bleiben.
- **Einzeilige Kopfzeile bis 1023 px:**
  - Auf dem Handy werden «Reise ändern» und «Reisebegleiter» zu runden Symbolknöpfen mit zugänglichem Namen.
  - Mond/Sonne bleibt in der Kopfzeile (Owner-Vorgabe).
  - «Reise fortsetzen» steht unter 640 px im Menü. `/planen` und `/reisen` bieten den Weg zur Reise ebenfalls an.
  - Die Kopfzeile ist bei 320–768 px 72 px hoch (vorher auf dem Handy zweizeilig).
- **Kompakte Gast-Zeile** statt Kasten, mit derselben Aussage: nur in diesem Browser gespeichert; mit Konto wird die Reise übernommen und ist auf allen Geräten da.
- **Ein Grundton:** Alle öffentlichen Seiten stehen auf der Weiss-Mint-Fläche.

Prüfung Etappe 1:

- Typprüfung, Lint (0 Fehler), Hygiene-Checks und Build grün.
- `test:core` nur mit den bekannten PostgreSQL-Umgebungsfehlschlägen.
- Zehn betroffene UI-Testdateien grün (118/118).
- Kein seitliches Scrollen bei 320–768 px. Die damalige Ausnahme, die Flugsuche bei 320 px, ist mit Etappe 3 behoben.

[Handy 390 px: Übersicht mit einzeiliger Kopfzeile, flachem Reisekopf und kompakter Gast-Zeile](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e1%2F01-handy-390-uebersicht-einzeilige-kopfzeile.png)
[Handy 390 px: Organisieren ohne Foto-Kopf, Suche im ersten Bildschirm](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e1%2F02-handy-390-organisieren-suche-oben.png)
[Handy 390 px: Reiseplan im grünen Design mit demselben Reisekopf](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e1%2F03-handy-390-reiseplan-gruen.png)
[Desktop 1440 px: Übersicht mit flachem Reisekopf](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e1%2F05-desktop-1440-uebersicht.png)
[Desktop 1440 px: Meine Reisen mit gemeinsamem Seitenkopf](https://cursor.com/agents/bc-726acf4e-a89b-4668-b1a6-d0934d792ba1/artifacts?path=%2Fopt%2Fcursor%2Fartifacts%2Fui-e1%2F06-desktop-1440-meine-reisen.png)
