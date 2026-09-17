# World Map Polish 2 – Adversarial Self-Review

Stand: 17. September 2026  
Issue: #436  
Draft PR: #437  
Branch: `feat/phase-1-world-map-polish-2`  
Canonical base: `main@15aa125addf39b15dcb50a1cdf8dece661796fc5`

Ein Agent-Self-Review ist **kein** Technical-Lead-PASS.

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

2. **`docs/evidence/WORLD_MAP_POLISH_2_UI_2026-09-17.json`** ist eine slice-spezifische Evidenzdatei nach dem Muster von `docs/evidence/MOBILE_ACCESSIBILITY_1_AUDIT_2026-09-02.json`. Der Task nennt für Dokumente TASK/STATUS/HANDOFF/SELF_REVIEW; die Acceptance verlangt zugleich persistierte Playwright-/Screenshot-Evidenz. Diese Datei erfüllt die Acceptance und ist ausschliesslich slice-spezifisch.

3. **`WORLD_MAP_OHNE_KOORDINATEN_TEXT` gekürzt** von „in der Liste sichtbar, nicht auf der Karte“ auf „nicht auf der Karte“. Der Satz steht in einer kompakten Karte, und die Liste, in der er steht, war der redundante Teil der Aussage.

4. **Antarktis entfernt statt beschnitten.** Der Rahmen allein hätte das Rechteck aus dem Bild genommen. Ein Rechteck als Silhouette auszuliefern wäre trotzdem falsch geblieben, deshalb ist der Platzhalter weg und die Provenienz erklärt es.

5. **`audit:account` war auf dem Basis-Head rot.** Details im Handoff. Der Slice hat den Harness nicht angefasst; die Ursache lag in der Schreibweise der V1-Statuskarte und ist mit der neuen Legende behoben.

## Restbeobachtungen, keine Blocker

1. Auf 280px ist die Kartenfläche 188×74. Eine Weltkarte ist bei ~2,5:1 auf sehr schmalen Geräten unvermeidlich ein Streifen. Die Liste bleibt die vollständige, zugängliche Informationsquelle.
2. Der Gruppenabstand von 5 Projektionsgrad ist ein fester Wert, keine breitenabhängige Rechnung. Auf 1536px sind zwei Punkte in 5 Grad Abstand etwa 15px auseinander und würden sich noch berühren; auf 280px wäre schon 1 Grad eine Überdeckung. Ein fester Wert ist deterministisch und testbar, eine breitenabhängige Gruppierung würde die Auswahl beim Drehen des Geräts umbauen. Falls ein späterer Slice echtes Zoomen einführt, muss dieser Wert dorthin wandern.
3. Länderflaggen sind Emoji. In Headless-Chromium fehlt die Emoji-Schrift, deshalb erscheinen sie in den Screenshots als farbiger Block. Auf echten Geräten rendern sie normal. Das ist Vorbestand aus `lib/country/darstellung.ts`, kein Regress dieses Slice.
4. Bestätigte Besuchshistorie bleibt unerfasst. Ein späterer Slice dafür braucht seinen eigenen Persistenz- und Wahrheitsvertrag und darf nicht im Review hier angehängt werden.
5. Preview auf dem exakten Head ist von diesem Agenten nicht gelesen. Der Technical Lead muss CI und Preview auf der reviewten SHA selbst prüfen.

## Empfehlung

Technical-Lead-Exact-Head-Review von Draft PR #437 auf dem finalen Head.  
**Nicht Ready setzen. Nicht mergen. Keinen Folge-Slice starten.**
