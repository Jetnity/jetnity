# World Map Polish 2 – Adversarial Self-Review

Stand: 17. September 2026  
Issue: #436  
Draft PR: #437  
Branch: `feat/phase-1-world-map-polish-2`  
Canonical base: `main@15aa125addf39b15dcb50a1cdf8dece661796fc5`  
Reviewter und abgelehnter Head: `b622019ef139073635d5d85f1962e0bf23f462b9`  
Gegateter Code-Head nach dem Review-Fix: `f5052963774c8cf6dfb6b0893690fadbef6f44db`

Dies ist derselbe logische Agent / dieselbe Session, Generation 1, nach dem Technical-Lead-Review mit CHANGES REQUIRED. Ein Agent-Self-Review ist **kein** Technical-Lead-PASS.

---

## Angriffe auf den Review-Fix selbst

| Angriff | Ergebnis |
| --- | --- |
| Den CI-Blocker durch Eintrag in die `ABSICHTLICH`-Liste von `scripts/exporte.mjs` wegdefinieren | Abgewiesen. Kein Hygiene-Skript und keine Ausnahmeliste angefasst. Beide Exporte haben jetzt echte Aufrufer. |
| `WORLD_MAP_MARKER_ABSTAND` mit einer Alibi-Referenz „benutzt“ machen | Abgewiesen. Der Wert steht in einer Zusicherung, die bricht, wenn jemand den Schwellwert still ändert. |
| `WORLD_MAP_VIEWBOX` mit einer Alibi-Referenz „benutzt“ machen | Abgewiesen. Die Ansichtsschicht leitet ihren Projektions-Nullpunkt daraus ab, statt 180 und 90 erneut hinzuschreiben. Ändert sich der Projektionsraum, folgt der Rahmen. |
| Den Export einfach entfernen und `viewBox` doppelt definieren | Abgewiesen. `WORLD_MAP_VIEWBOX` ist die Beschreibung des Projektionsraums, zu dem `weltKarteProjektion()` gehört; zwei Quellen für denselben Raum wären der schlechtere Zustand. |
| Beim Beheben des CI-Fehlers Scope erweitern | Abgewiesen. Der Fix berührt zwei Dateien, die dem Slice schon gehörten. |
| Visuelle Evidenz aus `next dev` statt aus dem Production-Build ausgeben | Abgewiesen. Aufgenommen gegen `npm run build` + `next start`, deshalb auch ohne Dev-Overlay im Bild. |
| Die klebende Kopfzeile für das Bild per CSS ausblenden | Abgewiesen. Kein DOM-/CSS-Eingriff. Stattdessen wird das Fenster für die Aufnahme hoch genug gemacht, dass nichts gescrollt werden muss. |
| Abgebrochene RSC-Vorabrufe als „keine Konsolenfehler“ verschweigen | Abgewiesen. Sie sind gezählt, benannt und mit Ursache belegt – inklusive des Nachweises, dass sie auch ohne einen einzigen Reiselink auftreten. |
| Die falsche SHA im Handoff still korrigieren | Abgewiesen. Der Fehler und seine Ursache stehen im Handoff. In einem head-gebundenen Prozess ist eine erfundene SHA ein Substanzfehler. |
| Evidenz auf einem Head behaupten, der Code geändert hat | Abgewiesen. Der Handoff nennt den gegateten Code-Head und den `git diff`-Befehl, mit dem der Technical Lead prüfen kann, dass danach kein Code mehr geändert wurde. |

---

## Wahrheitsangriffe

| Angriff | Ergebnis |
| --- | --- |
| Besuch aus vergangenem Datum ableiten | Abgewiesen. `besuchtLage` bleibt `nicht_erfasst`. Regression vorhanden. |
| Besuch aus `archived`/`booked`/`planned`/`draft` ableiten | Abgewiesen. Der neue Status-Text im Reise-Label ist Reisestatus, keine Besuchsaussage. |
| `0 besucht` als bekannte leere Historie zeigen | Abgewiesen. `WORLD_MAP_BESUCHT_KURZ` enthält keine Ziffer; eine Regression prüft das. |
| Land aus Name, Koordinaten oder `placeId` erschliessen | Abgewiesen, unverändert. |
| Koordinaten aus Name, Land oder `placeId` erschliessen | Abgewiesen, unverändert. |
| Fehlende Reisedaten als Zeitraum erfinden | Abgewiesen. `weltReiseZeitraum(null, null)` ergibt `Zeitraum offen`; ein ungültiger Datumsstring ebenso. |
| Marker ausserhalb des Ausschnitts an den Rand clampen | Abgewiesen. Der Marker entfällt, der Ort bleibt in der Liste mit ehrlichem Hinweis. |
| Trefferfläche einer dichten Gruppe auf einen gemittelten Kunstpunkt setzen | Abgewiesen. Die Fläche sitzt auf den gespeicherten Koordinaten ihres ersten Ortes; eine Regression vergleicht sie mit `weltMarkerLage()` desselben Ortes. |
| Dichte Orte zu einem Ort zusammenlegen | Abgewiesen. Zwei Orte bleiben zwei Orte in `orte`, zwei Listenkarten und zwei Auswahlziele. |
| Zwei gleich betitelte Reisen zu einer Aktion machen | Abgewiesen. Zwei Aktionen mit unterschiedlicher `tripId`, unterschiedlichem `aria-label` und bei gleichem Meta zusätzlich `Reise 1 von 2`. |
| `herkuenfte[0]` als stiller Navigationsdefault | Abgewiesen. Quellprüfung erzwingt `weltOrtReiseAnzeigen(ort.reisen)` und verbietet `herkuenfte[0]`. |
| Lesefehler als leere Welt zeigen | Abgewiesen. `lage: 'fehler'` bleibt unterscheidbar; zusätzlich bleibt jetzt die Besucht-Unterscheidung sichtbar. |
| Zweite Reiseabfrage für Status/Zeitraum | Abgewiesen. Beide Felder kommen aus dem bereits geladenen `TripSummary`. Die bestehende Regression auf `reisenLaden()` (genau ein `.from('trips')`, kein `trip_stages`-Select, kein Service-Role) läuft weiter grün. |
| Mapbox/OSM/Google/Geocoder holen | Abgewiesen. Die Quellprüfung deckt jetzt auch `world-map-ansicht.ts` ab. |
| Neues npm-Paket oder Remote-Asset | Abgewiesen. Kein `package.json`-Diff. |
| Neue Persistenz oder Migration | Abgewiesen. Kein `supabase/**`-Diff. |
| Flug-/Hotel-/Aktivitäten-Suche einhängen | Abgewiesen. `data-world-map-search="nein"` und die bestehende Verbotsliste laufen weiter. |

## Design-Angriffe

| Angriff | Ergebnis |
| --- | --- |
| Dunkles Kartenthema auf einer öffentlichen Seite einführen | Abgewiesen. `DESIGN_SYSTEM.md` Abschnitt 3a erlaubt Dunkel nur im Admin. Der Ozean bleibt `surface-50`, Land `brand-700` mit Deckkraft. |
| Neue Farbe einführen, die es fast schon gibt | Abgewiesen. Nur bestehende Tokens, keine neuen Hex-Werte. |
| Citrus als Fläche verwenden | Abgewiesen. Citrus markiert genau eine Sache pro Ansicht: den ausgewählten Marker. |
| Status nur über Farbe zeigen | Abgewiesen. Legende und Marker tragen Form (gefüllt gegen gestrichelt, Punkt gegen Zähler), Grösse und immer Text. |
| Horizontales Scrollen mit `overflow-hidden` kaschieren | Abgewiesen. Beschnitten wird nur die Kartenfläche als Sektion mit Radius; die Ursache der Blasen-Überbreite wurde behoben, nicht versteckt. |
| Trefferflächen unter 44px | Abgewiesen. 108 Kombinationen ohne Fund. |
| Bewegung ohne Rücksicht auf Nutzerpräferenz | Abgewiesen. `prefers-reduced-motion` schaltet auf `auto`; unter `reduce` laufen alle Prüfungen grün. |

## Scope-Notizen, die ein Reviewer sehen soll

1. **`components/account/AccountAuditClient.tsx`** steht nicht wörtlich in der Allowed-Files-Liste des Tasks. Ergänzt wurde ausschliesslich ein **neuer** Fixture-Zustand `zustand=welt` (drei Reisen: zwei gleich betitelte auf derselben `placeId`, dichte Japan-Etappen, eine Etappe ohne Koordinaten, eine ohne Ländercode, ein Marker am rechten Kartenrand). Die bestehenden Zustände `reise`/`leer`/`fehler` sind unverändert, `npm run audit:account` iteriert weiter genau diese drei. Ohne diesen Fixture wären die im Task ausdrücklich geforderten Nachweise – dichte Marker, gleich betitelte Reisen, Orte ohne Koordinaten – nicht belegbar. Die Datei liegt in der Account-Oberfläche und kann nicht mit PR #435 kollidieren. Wenn der Technical Lead das anders sieht, ist die Änderung isoliert rücknehmbar; es geht nur die Evidenz verloren, nicht das Verhalten.

2. **`docs/evidence/WORLD_MAP_POLISH_2_UI_2026-09-17.json`, `docs/WORLD_MAP_POLISH_2_VISUAL_EVIDENCE_2026-09-17.md` und 14 Bilder unter `docs/evidence/world-map-polish-2/`** sind slice-spezifische Evidenz nach dem Muster von `docs/evidence/MOBILE_ACCESSIBILITY_1_AUDIT_2026-09-02.json`. Der Task nennt für Dokumente TASK/STATUS/HANDOFF/SELF_REVIEW; Acceptance und Technical-Lead-Review verlangen zugleich persistierte visuelle Exact-Head-Evidenz. Zu den Bildern im Repository: `.gitignore` schliesst `playwright-report/`, `test-results/` und `cypress/screenshots/` aus, also Werkzeug-Ausgabeordner, keine bewusst kuratierte Evidenz. Die 14 Bilder sind palettenreduzierte PNGs, zusammen etwa 474 KB. Wenn der Technical Lead Bilder nicht im Repository haben will, sind sie isoliert entfernbar; der maschinenlesbare Bericht und die gemessenen Zahlen bleiben dann trotzdem vollständig.

3. **`WORLD_MAP_OHNE_KOORDINATEN_TEXT` gekürzt** von „in der Liste sichtbar, nicht auf der Karte“ auf „nicht auf der Karte“. Der Satz steht in einer kompakten Karte, und die Liste, in der er steht, war der redundante Teil der Aussage.

4. **Antarktis entfernt statt beschnitten.** Der Rahmen allein hätte das Rechteck aus dem Bild genommen. Ein Rechteck als Silhouette auszuliefern wäre trotzdem falsch geblieben, deshalb ist der Platzhalter weg und die Provenienz erklärt es.

5. **`audit:account` war auf dem Basis-Head rot.** Details im Handoff. Der Slice hat den Harness nicht angefasst; die Ursache lag in der Schreibweise der V1-Statuskarte und ist mit der neuen Legende behoben.

6. **Der CI-Blocker war echt und selbst verschuldet.** `check:exports` hat korrekt gemeldet, dass zwei Exporte ohne Aufrufer zurückgeblieben sind. Dass der lokale Lauf vor dem ersten Push nicht die vollständige CI-Reihenfolge durchlief, ist der Grund, warum der Technical Lead einen roten Head reviewen musste. Der Review-Fix läuft die CI-Schrittfolge deshalb jetzt vollständig und in derselben Reihenfolge lokal durch.

## Restbeobachtungen, keine Blocker

1. Auf 280px ist die Kartenfläche 188×74. Eine Weltkarte ist bei ~2,5:1 auf sehr schmalen Geräten unvermeidlich ein Streifen. Die Liste bleibt die vollständige, zugängliche Informationsquelle.
2. Der Gruppenabstand von 5 Projektionsgrad ist ein fester Wert, keine breitenabhängige Rechnung. Auf 1536px sind zwei Punkte in 5 Grad Abstand etwa 15px auseinander und würden sich noch berühren; auf 280px wäre schon 1 Grad eine Überdeckung. Ein fester Wert ist deterministisch und testbar, eine breitenabhängige Gruppierung würde die Auswahl beim Drehen des Geräts umbauen. Falls ein späterer Slice echtes Zoomen einführt, muss dieser Wert dorthin wandern.
3. Länderflaggen sind Emoji. In Headless-Chromium fehlt die Emoji-Schrift, deshalb erscheinen sie in den Bildern als farbiger Block. Auf echten Geräten rendern sie normal. Das ist Vorbestand aus `lib/country/darstellung.ts`, kein Regress dieses Slice.

3a. Abgebrochene `next/link`-RSC-Vorabrufe im Harness: 730 Einträge, alle `net::ERR_ABORTED`. Kein Laufzeitfehler dieser Oberfläche, nachgewiesen dadurch, dass sie auch in den Zuständen `leer` und `fehler` auftreten, in denen die Weltkarte keinen Reiselink rendert. Vorbestand der Account-Navigation, nicht dieses Slice.
4. Bestätigte Besuchshistorie bleibt unerfasst. Ein späterer Slice dafür braucht seinen eigenen Persistenz- und Wahrheitsvertrag und darf nicht im Review hier angehängt werden.
5. Preview-**Inhalt** auf dem exakten Head ist von diesem Agenten nicht gelesen, weil die Deployment-URL SSO-geschützt ist. Der Preview-**Status** ist über die GitHub-API gelesen und im Handoff belegt. Der Technical Lead muss CI und Preview auf der reviewten SHA selbst prüfen.

## Empfehlung

Technical-Lead-Exact-Head-**Re-Review** von Draft PR #437 auf dem finalen Head.  
**Nicht Ready setzen. Nicht mergen. Keinen Folge-Slice starten.**
